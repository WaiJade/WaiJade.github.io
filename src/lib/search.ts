import type { PostEntry } from "./posts";
import {
  formatPostDate,
  getPostExcerpt,
  getPostPlainText,
  getPostUrl,
} from "./posts";
import type { NoteEntry } from "./notes";
import {
  formatNoteDate,
  getNoteExcerpt,
  getNotePlainText,
  getNoteUrl,
} from "./notes";

export type SearchIndexItem = {
  title: string;
  url: string;
  description: string;
  excerpt: string;
  pubDate: string;
  tags: string[];
  kind: "post" | "note";
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
    kind: "post",
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

export function createNoteSearchIndexItem(note: NoteEntry): SearchIndexItem {
  const description = note.data.description.trim();
  const plainText = getNotePlainText(note, 400);

  return {
    title: note.data.title,
    url: getNoteUrl(note),
    description,
    excerpt: getNoteExcerpt(note, 120, false),
    pubDate: formatNoteDate(note.data.pubDate),
    tags: note.data.tags,
    kind: "note",
    searchText: [
      note.data.title,
      description,
      plainText,
      note.data.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
