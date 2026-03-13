import type { PostEntry } from "./posts";
import {
  formatPostDate,
  getPostExcerpt,
  getPostPlainText,
  getPostUrl,
} from "./posts";

export type SearchIndexItem = {
  title: string;
  url: string;
  description: string;
  excerpt: string;
  pubDate: string;
  tags: string[];
  searchText: string;
};

export function createSearchIndexItem(post: PostEntry): SearchIndexItem {
  const description = post.data.description.trim();
  const plainText = getPostPlainText(post, 1200);

  return {
    title: post.data.title,
    url: getPostUrl(post),
    description,
    excerpt: getPostExcerpt(post, 180, false),
    pubDate: formatPostDate(post.data.pubDate),
    tags: post.data.tags,
    searchText: [
      post.data.title,
      description,
      plainText,
      post.data.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
