import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const SHELL_ENTRIES = [
  "astro.config.mjs",
  "package.json",
  "src/components",
  "src/config",
  "src/layouts",
  "src/lib",
  "src/pages",
  "src/styles",
  "public/avatar.png",
  "public/favicon.png",
  "public/footer",
  "public/fonts/NSourceSong_Headline.woff2",
  "public/offline.html",
  "public/pwa-192.png",
  "public/pwa-512.png",
];

function walkFiles(absolutePath: string, bucket: string[]) {
  if (!existsSync(absolutePath)) {
    return;
  }

  const stat = statSync(absolutePath);

  if (stat.isDirectory()) {
    for (const entry of readdirSync(absolutePath).sort()) {
      walkFiles(join(absolutePath, entry), bucket);
    }
    return;
  }

  if (stat.isFile()) {
    bucket.push(absolutePath);
  }
}

function collectShellFiles() {
  const files: string[] = [];

  for (const entry of SHELL_ENTRIES) {
    walkFiles(resolve(PROJECT_ROOT, entry), files);
  }

  return files.sort();
}

function createShellVersion() {
  const hash = createHash("sha256");

  for (const filePath of collectShellFiles()) {
    hash.update(relative(PROJECT_ROOT, filePath));
    hash.update("\n");
    hash.update(readFileSync(filePath));
    hash.update("\n");
  }

  return hash.digest("hex").slice(0, 12);
}

const commitHash =
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  "";

const buildDate =
  process.env.CF_PAGES_COMMIT_TIMESTAMP ||
  process.env.VERCEL_GIT_COMMIT_DATE ||
  new Date().toISOString();

export const buildMeta = {
  shellVersion: createShellVersion(),
  commitHash: commitHash.trim(),
  buildDate: String(buildDate).trim(),
};
