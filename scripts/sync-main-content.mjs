import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const mainWebRoot = path.resolve(repoRoot, "..", "CheongSzesuen.github.io");
const mainWebRepo = "CheongSzesuen/CheongSzesuen.github.io";
const mainWebRef = process.env.MAIN_WEB_CONTENT_REF ?? "NextGen";
const mainWebRawBaseUrl =
  process.env.MAIN_WEB_CONTENT_BASE_URL ??
  `https://raw.githubusercontent.com/${mainWebRepo}/${mainWebRef}`;

const syncEntries = [
  {
    label: "About 内容",
    repoPath: "src/content/about.mdx",
    source: path.resolve(mainWebRoot, "src", "content", "about.mdx"),
    target: path.resolve(repoRoot, "src", "content", "pages", "about.mdx"),
  },
  {
    label: "友链数据",
    repoPath: "src/content/friends.ts",
    source: path.resolve(mainWebRoot, "src", "content", "friends.ts"),
    target: path.resolve(repoRoot, "src", "content", "friends.ts"),
  },
];

async function downloadEntry(entry) {
  const response = await fetch(`${mainWebRawBaseUrl}/${entry.repoPath}`);

  if (!response.ok) {
    throw new Error(
      `[sync-content] 远程拉取${entry.label}失败: ${response.status} ${response.statusText}`,
    );
  }

  const content = await response.text();
  await writeFile(entry.target, content, "utf8");
  console.log(
    `[sync-content] 已从远程同步${entry.label}到 ${path.relative(repoRoot, entry.target)}`,
  );
}

async function syncEntry(entry) {
  try {
    await mkdir(path.dirname(entry.target), { recursive: true });
    await copyFile(entry.source, entry.target);
    console.log(`[sync-content] 已同步${entry.label}到 ${path.relative(repoRoot, entry.target)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await downloadEntry(entry);
      return;
    }

    throw error;
  }
}

await Promise.all(syncEntries.map(syncEntry));
