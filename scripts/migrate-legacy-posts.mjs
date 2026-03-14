import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "_posts");
const targetDir = path.join(rootDir, "src", "content", "posts");

function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Missing frontmatter block");
  }

  return {
    frontmatter: match[1],
    body: match[2].replace(/^\s+/, ""),
  };
}

function parseFrontmatter(block) {
  const data = {};
  let currentListKey = null;

  for (const line of block.split(/\r?\n/)) {
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentListKey) {
      if (!Array.isArray(data[currentListKey])) {
        data[currentListKey] = [];
      }
      data[currentListKey].push(listMatch[1].trim());
      continue;
    }

    currentListKey = null;
    const entryMatch = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (!entryMatch) {
      continue;
    }

    const [, key, rawValue] = entryMatch;
    const value = rawValue.trim();

    if (key === "tags") {
      data.tags = [];
      currentListKey = "tags";
      continue;
    }

    data[key] = value;
  }

  return data;
}

function normalizeDate(value) {
  const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function toYamlString(value) {
  return JSON.stringify(value ?? "");
}

function buildOutput(rawData, body) {
  const description = rawData.subtitle ?? "";
  const cover = rawData["header-img"]
    ? `/${String(rawData["header-img"]).replace(/^\/+/, "")}`
    : null;
  const tags = Array.isArray(rawData.tags) ? rawData.tags : [];
  const lines = [
    "---",
    `title: ${toYamlString(rawData.title ?? "")}`,
    `description: ${toYamlString(description)}`,
    `pubDate: ${toYamlString(normalizeDate(rawData.date ?? ""))}`,
    `author: ${toYamlString(rawData.author ?? "")}`,
  ];

  if (cover) {
    lines.push(`cover: ${toYamlString(cover)}`);
  }

  if (tags.length) {
    lines.push("tags:");
    for (const tag of tags) {
      lines.push(`  - ${toYamlString(tag)}`);
    }
  } else {
    lines.push("tags: []");
  }
  lines.push("draft: false");
  lines.push("---", "", body.trimEnd(), "");

  return lines.join("\n");
}

mkdirSync(targetDir, { recursive: true });

const files = readdirSync(sourceDir)
  .filter((file) => file.endsWith(".md"))
  .sort((left, right) => left.localeCompare(right, "zh-CN"));

for (const fileName of files) {
  const sourceFile = path.join(sourceDir, fileName);
  const targetFile = path.join(targetDir, fileName.replace(/\.md$/i, ".mdx"));
  const raw = readFileSync(sourceFile, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  const parsed = parseFrontmatter(frontmatter);
  const output = buildOutput(parsed, body);

  writeFileSync(targetFile, output, "utf8");
}

console.log(`Migrated ${files.length} legacy posts to ${targetDir}`);
