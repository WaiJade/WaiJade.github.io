import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;
export const POSTS_PER_PAGE = 10;

function getLegacyPostPathId(id: string) {
  return id.replace(/\.(md|mdx)$/i, "");
}

function padSlugDatePart(value: number | string) {
  return String(value).padStart(2, "0");
}

function slugifyPostTitle(title: string) {
  const slug = title
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[“”"'"`‘’《》〈〉「」『』【】\[\]{}()（）]/g, " ")
    .replace(/[·•・:：;；,，.。!！?？~～/\\|]/g, " ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "post";
}

function normalizeLegacyPostPathId(id: string) {
  const base = getLegacyPostPathId(id);
  const matched = base.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/);

  if (!matched) {
    return slugifyPostTitle(base);
  }

  const [, year, month, day, rawTitle] = matched;
  return `${year}-${padSlugDatePart(month)}-${padSlugDatePart(day)}-${slugifyPostTitle(
    rawTitle,
  )}`;
}

export function getPostPathId(post: Pick<PostEntry, "id"> | string) {
  const id = typeof post === "string" ? post : post.id;
  return normalizeLegacyPostPathId(id);
}

export async function getPublishedPosts() {
  const posts = (await getCollection("posts")).filter(
    (post): post is PostEntry => Boolean(post?.data) && !post.data.draft,
  );

  return posts.sort(
    (left, right) => right.data.pubDate.getTime() - left.data.pubDate.getTime(),
  );
}

export function getPostUrl(post: Pick<PostEntry, "id"> | string) {
  return `/posts/${getPostPathId(post)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}/`;
}

export function getIndexPageUrl(page: number) {
  return page <= 1 ? "/" : `/page/${page}/`;
}

export function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\//g, ".");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(value: string) {
  return value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ");
}

function isFormattedWritingTimeText(value: string) {
  return /(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月(?:\d{1,2}日)?|\d{1,2}月\d{1,2}日|\d{1,2}:\d{2}(?::\d{2})?|子时|子夜|初稿|所见|作于|作之|改稿|修改|加\b)/.test(
    value,
  );
}

function stripFormattedWritingTimeBlocks(value: string) {
  const rightAlignedPattern =
    /<(p|div)\b([^>]*)\balign=(["'])right\3([^>]*)>([\s\S]*?)<\/\1>/gi;

  return value
    .replace(
      /<p\b([^>]*)\bclass=(["'])[^"'<>]*content-writing-time[^"'<>]*\2([^>]*)>[\s\S]*?<\/p>/gi,
      " ",
    )
    .replace(rightAlignedPattern, (matched, _tagName, beforeAlign, _quote, afterAlign, innerHtml) => {
      const attrs = `${beforeAlign}${afterAlign}`;
      if (/\bclass=(["'])[^"'<>]*content-writing-time[^"'<>]*\1/i.test(attrs)) {
        return " ";
      }

      const plainText = normalizeWhitespace(stripTags(innerHtml));
      if (!plainText || !isFormattedWritingTimeText(plainText)) {
        return matched;
      }

      return " ";
    });
}

export function getPostPlainText(
  post: Pick<PostEntry, "body" | "data">,
  maxLength?: number,
) {
  const sanitizedBody = stripFormattedWritingTimeBlocks(post.body);
  const plainText = normalizeWhitespace(
    sanitizedBody
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?(center|div|p|span|sup|sub|blockquote|pre|code)[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#~-]/g, " "),
  );

  if (!maxLength || plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trim();
}

export function getPostExcerpt(
  post: Pick<PostEntry, "body" | "data">,
  maxLength = 160,
  preferDescription = true,
) {
  if (preferDescription && post.data.description) {
    return post.data.description;
  }

  const plainText = getPostPlainText(post);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}

export function groupPostsByYear(posts: PostEntry[]) {
  const grouped = new Map<string, PostEntry[]>();

  for (const post of posts) {
    const year = String(post.data.pubDate.getFullYear());
    const bucket = grouped.get(year);

    if (bucket) {
      bucket.push(post);
    } else {
      grouped.set(year, [post]);
    }
  }

  return [...grouped.entries()];
}

export function getTagStats(posts: PostEntry[]) {
  const stats = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      stats.set(tag, (stats.get(tag) ?? 0) + 1);
    }
  }

  return [...stats.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}

export function paginatePosts(
  posts: PostEntry[],
  currentPage: number,
  pageSize = POSTS_PER_PAGE,
) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));

  if (currentPage < 1 || currentPage > totalPages) {
    return null;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    posts: posts.slice(startIndex, endIndex),
    currentPage,
    totalPages,
  };
}
