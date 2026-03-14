import { mkdir, readFile, rename, readdir, writeFile } from "node:fs/promises";
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

async function togglePostVisibility(payload) {
  const action = payload?.action;
  const fileName = sanitizeFileName(payload?.fileName);

  if (action !== "hide" && action !== "show") {
    throw new Error("文章操作无效");
  }

  await ensureHiddenPostsDir();

  const sourceDir = action === "hide" ? activePostsDir : hiddenPostsDir;
  const targetDir = action === "hide" ? hiddenPostsDir : activePostsDir;
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);

  await rename(sourcePath, targetPath);
}

function getConsoleHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WaiJade's BLOG / CONSOLE</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "MiSans", "PingFang SC", "Noto Sans SC", system-ui, sans-serif;
        background:
          radial-gradient(circle at top, rgba(93, 136, 255, 0.22), transparent 40%),
          linear-gradient(180deg, #07111f 0%, #030712 56%, #02050a 100%);
        color: rgba(243, 247, 255, 0.96);
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
      }

      .dev-console-shell {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 40px 0 72px;
      }

      .dev-console-shell__eyebrow {
        margin: 0 0 12px;
        font-size: 0.78rem;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: rgba(147, 197, 253, 0.72);
      }

      .dev-console-shell__title {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.8rem);
        line-height: 0.95;
        letter-spacing: -0.06em;
      }

      .dev-console-shell__text {
        margin: 16px 0 0;
        max-width: 52rem;
        line-height: 1.7;
        color: rgba(209, 219, 236, 0.78);
      }

      .dev-console-shell__card {
        margin-top: 24px;
        padding: 20px 22px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(16px);
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
        <p class="dev-console-shell__eyebrow">Local Dev Console</p>
        <h1 class="dev-console-shell__title">本地控制台</h1>
        <p class="dev-console-shell__text">
          正在加载控制台内容。如果这里长期为空，先看浏览器控制台里的模块或缓存报错。
        </p>
        <div class="dev-console-shell__card">
          当前入口只在 <code>npm run dev</code> 时存在，生产环境不会生成这个页面。
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

          if (pathname === "/__console/features" && req.method === "POST") {
            const payload = await readJsonBody(req);
            const nextControls = await writeSiteControls({ features: payload?.features });

            server.ws.send({ type: "full-reload" });
            sendJson(res, 200, { ok: true, features: nextControls.features });
            return;
          }

          if (pathname === "/__console/posts/toggle" && req.method === "POST") {
            const payload = await readJsonBody(req);
            await togglePostVisibility(payload);

            server.ws.send({ type: "full-reload" });
            sendJson(res, 200, { ok: true });
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
