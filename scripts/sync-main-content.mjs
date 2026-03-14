import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const mainWebRoot = path.resolve(repoRoot, "..", "CheongSzesuen.github.io");
const mainWebRepo = "CheongSzesuen/CheongSzesuen.github.io";
const mainWebRef = process.env.MAIN_WEB_CONTENT_REF ?? "NextGen";
const mainWebRawBaseUrl =
  process.env.MAIN_WEB_CONTENT_BASE_URL ??
  `https://raw.githubusercontent.com/${mainWebRepo}/${mainWebRef}`;
const frontmatterPattern = /^---\s*\n[\s\S]*?\n---\s*\n?/;
const paragraphPattern = /<p>([\s\S]*?)<\/p>/g;

const syncEntries = [
  {
    label: "About 中文内容",
    repoPath: "src/content/about.zh.mdx",
    source: path.resolve(mainWebRoot, "src", "content", "about.zh.mdx"),
    target: path.resolve(repoRoot, "src", "content", "pages", "about.zh.mdx"),
    transform: transformAboutContent,
  },
  {
    label: "About 英文内容",
    repoPath: "src/content/about.en.mdx",
    source: path.resolve(mainWebRoot, "src", "content", "about.en.mdx"),
    target: path.resolve(repoRoot, "src", "content", "pages", "about.en.mdx"),
    transform: transformAboutContent,
  },
  {
    label: "友链数据",
    repoPath: "src/content/friends.ts",
    source: path.resolve(mainWebRoot, "src", "content", "friends.ts"),
    target: path.resolve(repoRoot, "src", "content", "friends.ts"),
    transform: transformFriendsContent,
  },
];

async function downloadEntry(entry) {
  const response = await fetch(`${mainWebRawBaseUrl}/${entry.repoPath}`);

  if (!response.ok) {
    throw new Error(
      `[sync-content] 远程拉取${entry.label}失败: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

async function loadSourceContent(entry) {
  try {
    return await readFile(entry.source, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return downloadEntry(entry);
    }

    throw error;
  }
}

function validateFriendLink(friend, index) {
  if (!friend || typeof friend !== "object") {
    throw new Error(`[sync-content] 友链数据第 ${index + 1} 项不是对象`);
  }

  if (typeof friend.name !== "string" || !friend.name) {
    throw new Error(`[sync-content] 友链数据第 ${index + 1} 项缺少 name`);
  }

  if (typeof friend.url !== "string" || !friend.url) {
    throw new Error(`[sync-content] 友链数据第 ${index + 1} 项缺少 url`);
  }

  if (typeof friend.avatar !== "string" || !friend.avatar) {
    throw new Error(`[sync-content] 友链数据第 ${index + 1} 项缺少 avatar`);
  }

  if ("description" in friend && typeof friend.description !== "string" && friend.description !== undefined) {
    throw new Error(`[sync-content] 友链数据第 ${index + 1} 项的 description 不是字符串`);
  }

  return {
    name: friend.name,
    url: friend.url,
    avatar: friend.avatar,
    ...(friend.description ? { description: friend.description } : {}),
  };
}

function transformAboutContent(source) {
  const frontmatterMatch = source.match(frontmatterPattern);

  if (!frontmatterMatch) {
    throw new Error("[sync-content] About 内容缺少 frontmatter");
  }

  const paragraphs = Array.from(source.matchAll(paragraphPattern), (match) => match[1].trim()).filter(Boolean);

  if (!paragraphs.length) {
    throw new Error("[sync-content] About 内容缺少正文段落");
  }

  const normalizedParagraphs = paragraphs
    .map((paragraph) =>
      `<p>\n${paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `  ${line}`)
        .join("\n")}\n</p>`,
    )
    .join("\n\n");

  return `${frontmatterMatch[0].trimEnd()}\n\n${normalizedParagraphs}\n`;
}

function serializeFriendsLinks(friendsLinks) {
  const items = friendsLinks.map((friend) => {
    const lines = [
      "  {",
      `    name: ${JSON.stringify(friend.name)},`,
      `    url: ${JSON.stringify(friend.url)},`,
      `    avatar: ${JSON.stringify(friend.avatar)},`,
      ...(friend.description ? [`    description: ${JSON.stringify(friend.description)}`] : []),
      "  }",
    ];

    return lines.join("\n");
  });

  return `[\n${items.join(",\n")}\n]`;
}

async function transformFriendsContent(source) {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled, "utf8").toString("base64")}`;
  const module = await import(moduleUrl);

  if (typeof module.getFriendsLinks !== "function") {
    throw new Error("[sync-content] 友链数据缺少 getFriendsLinks 导出");
  }

  const friendsLinks = module.getFriendsLinks("zh").map(validateFriendLink);

  return `export type FriendLink = {
  name: string;
  url: string;
  avatar: string;
  description?: string;
};

export const friendsLinks: FriendLink[] = ${serializeFriendsLinks(friendsLinks)};
`;
}

async function syncEntry(entry) {
  await mkdir(path.dirname(entry.target), { recursive: true });
  const sourceContent = await loadSourceContent(entry);
  const outputContent = entry.transform ? await entry.transform(sourceContent) : sourceContent;

  await writeFile(entry.target, outputContent, "utf8");
  console.log(`[sync-content] 已同步${entry.label}到 ${path.relative(repoRoot, entry.target)}`);
}

await Promise.all(syncEntries.map(syncEntry));
