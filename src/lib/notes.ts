import { getCollection, type CollectionEntry } from "astro:content";
import { formatPostDate } from "./posts";

export type NoteEntry = CollectionEntry<"notes">;

function getLegacyNotePathId(id: string) {
  return id.replace(/\.(md|mdx)$/i, "");
}

function padSlugDatePart(value: number | string) {
  return String(value).padStart(2, "0");
}

function slugifyNoteTitle(title: string) {
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

  return slug || "note";
}

function normalizeLegacyNotePathId(id: string) {
  const base = getLegacyNotePathId(id);
  const matched = base.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/);

  if (!matched) {
    return slugifyNoteTitle(base);
  }

  const [, year, month, day, rawTitle] = matched;
  return `${year}-${padSlugDatePart(month)}-${padSlugDatePart(day)}-${slugifyNoteTitle(
    rawTitle,
  )}`;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getNotePathId(note: Pick<NoteEntry, "id"> | string) {
  const id = typeof note === "string" ? note : note.id;
  return normalizeLegacyNotePathId(id);
}

export function getNoteUrl(note: Pick<NoteEntry, "id"> | string) {
  return `/notes/${getNotePathId(note)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}/`;
}

export async function getPublishedNotes() {
  const notes = (await getCollection("notes")).filter(
    (note): note is NoteEntry => Boolean(note?.data) && !note.data.draft,
  );

  return notes.sort(
    (left, right) => right.data.pubDate.getTime() - left.data.pubDate.getTime(),
  );
}

export function formatNoteDate(date: Date) {
  return formatPostDate(date);
}

export function getNotePlainText(
  note: Pick<NoteEntry, "body" | "data">,
  maxLength?: number,
) {
  const plainText = normalizeWhitespace(
    note.body
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

export function getNoteExcerpt(
  note: Pick<NoteEntry, "body" | "data">,
  maxLength = 120,
  preferDescription = true,
) {
  if (preferDescription && note.data.description) {
    return note.data.description;
  }

  const plainText = getNotePlainText(note);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}
