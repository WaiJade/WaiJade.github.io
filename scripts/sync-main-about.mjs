import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sourcePath = path.resolve(
  repoRoot,
  "..",
  "CheongSzesuen.github.io",
  "src",
  "content",
  "about.mdx",
);

const targetPath = path.resolve(repoRoot, "src", "content", "pages", "about.mdx");

async function main() {
  try {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
    console.log(`[sync-about] 已同步主站 About 内容到 ${path.relative(repoRoot, targetPath)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.log("[sync-about] 未找到主站 about.mdx，保留当前仓库已有 About 内容");
      return;
    }

    throw error;
  }
}

await main();
