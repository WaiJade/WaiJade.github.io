import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const mainWebRoot = path.resolve(repoRoot, "..", "CheongSzesuen.github.io");

const syncEntries = [
  {
    label: "About 内容",
    source: path.resolve(mainWebRoot, "src", "content", "about.mdx"),
    target: path.resolve(repoRoot, "src", "content", "pages", "about.mdx"),
  },
  {
    label: "友链数据",
    source: path.resolve(mainWebRoot, "src", "content", "friends.ts"),
    target: path.resolve(repoRoot, "src", "content", "friends.ts"),
  },
];

async function syncEntry(entry) {
  try {
    await mkdir(path.dirname(entry.target), { recursive: true });
    await copyFile(entry.source, entry.target);
    console.log(`[sync-content] 已同步${entry.label}到 ${path.relative(repoRoot, entry.target)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.log(`[sync-content] 未找到主站${entry.label}源文件，保留当前仓库已有内容`);
      return;
    }

    throw error;
  }
}

await Promise.all(syncEntries.map(syncEntry));
