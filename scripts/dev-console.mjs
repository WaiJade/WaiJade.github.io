import { access, mkdir, readFile, rename, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const activePostsDir = path.resolve(repoRoot, "src", "content", "posts");
const hiddenPostsDir = path.resolve(repoRoot, "src", "content", "posts-hidden");
const siteControlsPath = path.resolve(repoRoot, "src", "config", "site-controls.json");

const defaultSiteControls = {
  features: {
    showNotes: false,
    showToc: false,
    showSearch: true,
    showComments: false,
    showFooter: true,
  },
};

function normalizeSiteControls(rawValue) {
  const rawControls =
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) ? rawValue : {};
  const rawFeatures =
    rawControls.features &&
    typeof rawControls.features === "object" &&
    !Array.isArray(rawControls.features)
      ? rawControls.features
      : {};

  return {
    features: {
      showNotes:
        typeof rawFeatures.showNotes === "boolean"
          ? rawFeatures.showNotes
          : defaultSiteControls.features.showNotes,
      showToc:
        typeof rawFeatures.showToc === "boolean"
          ? rawFeatures.showToc
          : defaultSiteControls.features.showToc,
      showSearch:
        typeof rawFeatures.showSearch === "boolean"
          ? rawFeatures.showSearch
          : defaultSiteControls.features.showSearch,
      showComments:
        typeof rawFeatures.showComments === "boolean"
          ? rawFeatures.showComments
          : defaultSiteControls.features.showComments,
      showFooter:
        typeof rawFeatures.showFooter === "boolean"
          ? rawFeatures.showFooter
          : defaultSiteControls.features.showFooter,
    },
  };
}

async function ensureHiddenPostsDir() {
  await mkdir(hiddenPostsDir, { recursive: true });
}

async function readSiteControls() {
  const rawContent = await readFile(siteControlsPath, "utf8");
  return normalizeSiteControls(JSON.parse(rawContent));
}

async function writeSiteControls(nextControls) {
  const normalizedControls = normalizeSiteControls(nextControls);
  await writeFile(siteControlsPath, `${JSON.stringify(normalizedControls, null, 2)}\n`, "utf8");
  return normalizedControls;
}

function normalizeYamlScalar(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function getFrontmatterValue(frontmatter, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matched = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(.+)$`, "m"));
  return matched ? normalizeYamlScalar(matched[1]) : null;
}

function extractFrontmatter(content) {
  const matched = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!matched) {
    return {};
  }

  const frontmatter = matched[1];
  return {
    title: getFrontmatterValue(frontmatter, "title"),
    pubDate: getFrontmatterValue(frontmatter, "pubDate"),
  };
}

function createPostRecord(fileName, metadata, visibility) {
  const id = fileName.replace(/\.(md|mdx)$/i, "");
  const timestamp = metadata.pubDate ? Date.parse(metadata.pubDate) : Number.NaN;

  return {
    id,
    fileName,
    title: metadata.title || id,
    pubDate: metadata.pubDate || null,
    visibility,
    sortValue: Number.isFinite(timestamp) ? timestamp : 0,
  };
}

async function readPostDirectory(directoryPath, visibility) {
  let directoryEntries = [];

  try {
    directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const fileEntries = directoryEntries.filter(
    (entry) => entry.isFile() && /\.(md|mdx)$/i.test(entry.name),
  );

  const posts = await Promise.all(
    fileEntries.map(async (entry) => {
      const content = await readFile(path.join(directoryPath, entry.name), "utf8");
      return createPostRecord(entry.name, extractFrontmatter(content), visibility);
    }),
  );

  return posts.sort(
    (left, right) =>
      right.sortValue - left.sortValue ||
      left.title.localeCompare(right.title, "zh-CN") ||
      left.fileName.localeCompare(right.fileName, "zh-CN"),
  );
}

async function buildConsoleState() {
  const [features, activePosts, hiddenPosts] = await Promise.all([
    readSiteControls(),
    readPostDirectory(activePostsDir, "active"),
    readPostDirectory(hiddenPostsDir, "hidden"),
  ]);

  return {
    features: features.features,
    activePosts: activePosts.map(({ sortValue, ...post }) => post),
    hiddenPosts: hiddenPosts.map(({ sortValue, ...post }) => post),
  };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

function sendHtml(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

async function readJsonBody(req) {
  let rawBody = "";

  for await (const chunk of req) {
    rawBody += chunk;
  }

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

function sanitizeFileName(value) {
  if (typeof value !== "string") {
    throw new Error("文章文件名无效");
  }

  const trimmed = value.trim();

  if (trimmed !== path.basename(trimmed) || !/\.(md|mdx)$/i.test(trimmed)) {
    throw new Error("文章文件名无效");
  }

  return trimmed;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function applyConsoleState(payload) {
  const nextControls = await writeSiteControls({ features: payload?.features });
  const postVisibility =
    payload?.postVisibility &&
    typeof payload.postVisibility === "object" &&
    !Array.isArray(payload.postVisibility)
      ? payload.postVisibility
      : {};

  await ensureHiddenPostsDir();

  for (const [rawFileName, rawVisible] of Object.entries(postVisibility)) {
    const fileName = sanitizeFileName(rawFileName);

    if (typeof rawVisible !== "boolean") {
      throw new Error("文章显示状态无效");
    }

    const activePath = path.join(activePostsDir, fileName);
    const hiddenPath = path.join(hiddenPostsDir, fileName);
    const activeExists = await pathExists(activePath);
    const hiddenExists = await pathExists(hiddenPath);

    if (rawVisible) {
      if (!activeExists && hiddenExists) {
        await rename(hiddenPath, activePath);
      }
      continue;
    }

    if (activeExists && !hiddenExists) {
      await rename(activePath, hiddenPath);
    }
  }

  return nextControls;
}

function getConsoleHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WaiJade's BLOG / CONSOLE</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="shortcut icon" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <link rel="preconnect" href="https://astrobox-statics.waterflames.cn" crossorigin />
    <link
      rel="preload"
      href="/fonts/NSourceSong_Headline.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <link
      rel="preload"
      href="https://astrobox-statics.waterflames.cn/NSourceSong_Headline.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800;900&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://cdn-font.hyperos.mi.com/font/css?family=MiSans:100,200,300,400,500,600:Chinese_Simplify,Latin&display=swap"
    />
    <style>
      @font-face {
        font-family: "NSourceSong";
        src:
          url("/fonts/NSourceSong_Headline.woff2") format("woff2"),
          url("https://astrobox-statics.waterflames.cn/NSourceSong_Headline.woff2") format("woff2");
        font-display: swap;
      }

      :root {
        color-scheme: dark;
        --console-background: #191919;
        --console-foreground: #ffffff;
        --console-muted: rgba(255, 255, 255, 0.72);
        --console-border: rgba(255, 255, 255, 0.06);
        --console-card: rgba(71, 71, 75, 0.3);
        --console-accent: #0088ff;
        --font-family-sans: "MiSans", "MiSans Chinese", MiSans, "Inter", "SF Pro Display", "Segoe UI", sans-serif;
        --font-family-display: "NSourceSong", serif;
        background: var(--console-background);
        color: var(--console-foreground);
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        color: var(--console-foreground);
        font-family: var(--font-family-sans);
      }

      .dev-console-shell {
        width: min(880px, calc(100vw - 2rem));
        margin: 0 auto;
        padding: 8.5rem 0 4rem;
      }

      .dev-console-shell__eyebrow {
        margin: 0 0 1rem;
        color: var(--console-accent);
        font-family: ui-monospace, "JetBrains Mono", monospace;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.18em;
      }

      .dev-console-shell__title {
        margin: 0;
        max-width: 12ch;
        font-size: clamp(3rem, 7vw, 6rem);
        line-height: 0.92;
        letter-spacing: -0.05em;
        font-family: var(--font-family-display);
        font-weight: 400;
      }

      .dev-console-shell__card {
        margin-top: 2.25rem;
        padding: 20px 22px;
        border-radius: 24px;
        background: var(--console-card);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        corner-shape: superellipse(1.5);
      }

      .dev-console-shell__loading {
        display: grid;
        gap: 14px;
      }

      .dev-console-shell__loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }

      .dev-console-shell__loading-row + .dev-console-shell__loading-row::before {
        content: "";
        position: absolute;
        top: -7px;
        left: 36px;
        right: 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }

      .dev-console-shell__loading-icon,
      .dev-console-shell__loading-bar,
      .dev-console-shell__loading-switch {
        position: relative;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
      }

      .dev-console-shell__loading-icon::after,
      .dev-console-shell__loading-bar::after,
      .dev-console-shell__loading-switch::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.12) 45%,
          rgba(255, 255, 255, 0.24) 50%,
          rgba(255, 255, 255, 0.12) 55%,
          rgba(255, 255, 255, 0) 100%
        );
        background-size: 220% 100%;
        animation: dev-console-shell-wave 1.55s linear infinite;
      }

      .dev-console-shell__loading-icon {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        flex-shrink: 0;
      }

      .dev-console-shell__loading-copy {
        flex: 1;
        min-width: 0;
      }

      .dev-console-shell__loading-bar {
        display: block;
        height: 13px;
        border-radius: 999px;
      }

      .dev-console-shell__loading-bar--title {
        width: min(180px, 68%);
      }

      .dev-console-shell__loading-bar--desc {
        width: min(260px, 92%);
        margin-top: 6px;
        opacity: 0.8;
      }

      .dev-console-shell__loading-switch {
        width: 54px;
        height: 32px;
        border-radius: 999px;
      }

      @keyframes dev-console-shell-wave {
        from {
          background-position: 200% 0;
        }

        to {
          background-position: -200% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dev-console-shell__loading-icon::after,
        .dev-console-shell__loading-bar::after,
        .dev-console-shell__loading-switch::after {
          animation: none;
        }
      }

      @media (max-width: 720px) {
        .dev-console-shell {
          width: min(100vw - 1.2rem, 880px);
          padding-top: 7rem;
        }

        .dev-console-shell__loading-row + .dev-console-shell__loading-row::before {
          left: 32px;
        }
      }
    </style>
    <script>
      (() => {
        if (!("serviceWorker" in navigator)) {
          return;
        }

        const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        const cleanupFlag = "waijade-console-sw-localhost-cleanup";

        async function clearLocalServiceWorkers() {
          const registrations = await navigator.serviceWorker.getRegistrations();

          if (registrations.length === 0) {
            return false;
          }

          await Promise.all(registrations.map((registration) => registration.unregister()));

          if ("caches" in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          }

          return true;
        }

        if (!isLocalhost) {
          sessionStorage.removeItem(cleanupFlag);
          return;
        }

        clearLocalServiceWorkers()
          .then((didCleanup) => {
            if (!didCleanup || sessionStorage.getItem(cleanupFlag) === "done") {
              return;
            }

            sessionStorage.setItem(cleanupFlag, "done");
            window.location.reload();
          })
          .catch((error) => {
            console.warn("[console-sw] localhost cleanup failed", error);
          });
      })();
    </script>
    <script type="module" src="/@vite/client"></script>
  </head>
  <body>
    <div id="app">
      <main class="dev-console-shell">
        <p class="dev-console-shell__eyebrow">CONSOLE</p>
        <h1 class="dev-console-shell__title">控制台</h1>
        <div class="dev-console-shell__card">
          <div class="dev-console-shell__loading" role="status" aria-live="polite">
            <div class="dev-console-shell__loading-row">
              <span class="dev-console-shell__loading-icon" aria-hidden="true"></span>
              <div class="dev-console-shell__loading-copy">
                <span class="dev-console-shell__loading-bar dev-console-shell__loading-bar--title" aria-hidden="true"></span>
                <span class="dev-console-shell__loading-bar dev-console-shell__loading-bar--desc" aria-hidden="true"></span>
              </div>
              <span class="dev-console-shell__loading-switch" aria-hidden="true"></span>
            </div>
            <div class="dev-console-shell__loading-row">
              <span class="dev-console-shell__loading-icon" aria-hidden="true"></span>
              <div class="dev-console-shell__loading-copy">
                <span class="dev-console-shell__loading-bar dev-console-shell__loading-bar--title" aria-hidden="true"></span>
                <span class="dev-console-shell__loading-bar dev-console-shell__loading-bar--desc" aria-hidden="true"></span>
              </div>
              <span class="dev-console-shell__loading-switch" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </main>
    </div>
    <script type="module" src="/src/dev-console/main.ts"></script>
  </body>
</html>`;
}

export function createDevConsolePlugin() {
  return {
    name: "waijade-dev-console",
    configureServer(server) {
      ensureHiddenPostsDir().catch((error) => {
        server.config.logger.error(`[dev-console] 初始化隐藏文章目录失败: ${error.message}`);
      });

      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url ? new URL(req.url, "http://localhost") : null;
        const pathname = requestUrl?.pathname;

        if (!pathname) {
          next();
          return;
        }

        try {
          if ((pathname === "/console" || pathname === "/console/") && req.method === "GET") {
            sendHtml(res, 200, getConsoleHtml());
            return;
          }

          if (pathname === "/__console/state" && req.method === "GET") {
            sendJson(res, 200, await buildConsoleState());
            return;
          }

          if (pathname === "/__console/apply" && req.method === "POST") {
            const payload = await readJsonBody(req);
            const nextControls = await applyConsoleState(payload);

            server.ws.send({ type: "full-reload" });
            sendJson(res, 200, { ok: true, features: nextControls.features });
            return;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "控制台请求失败";
          sendJson(res, 400, { ok: false, message });
          return;
        }

        next();
      });
    },
  };
}
