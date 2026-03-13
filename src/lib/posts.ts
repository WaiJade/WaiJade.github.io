import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;
export const POSTS_PER_PAGE = 10;

export function getPostPathId(post: Pick<PostEntry, "id"> | string) {
  const id = typeof post === "string" ? post : post.id;
  return id.replace(/\.(md|mdx)$/i, "");
}

export async function getPublishedPosts() {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
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

export function getPostExcerpt(
  post: Pick<PostEntry, "body" | "data">,
  maxLength = 160,
  preferDescription = true,
) {
  if (preferDescription && post.data.description) {
    return post.data.description;
  }

  const plainText = normalizeWhitespace(
    post.body
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?(center|div|p|span|sup|sub|blockquote|pre|code)[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#~-]/g, " "),
  );

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

export function getTagDirectory(posts: PostEntry[]) {
  const directory = new Map<string, { count: number; latestPost: PostEntry }>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      const current = directory.get(tag);

      if (!current) {
        directory.set(tag, { count: 1, latestPost: post });
        continue;
      }

      directory.set(tag, {
        count: current.count + 1,
        latestPost:
          post.data.pubDate.getTime() > current.latestPost.data.pubDate.getTime()
            ? post
            : current.latestPost,
      });
    }
  }

  return [...directory.entries()]
    .map(([tag, value]) => ({
      tag,
      count: value.count,
      latestPost: value.latestPost,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return (
        right.latestPost.data.pubDate.getTime() - left.latestPost.data.pubDate.getTime()
      );
    });
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
