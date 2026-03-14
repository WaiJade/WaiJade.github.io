import type { APIRoute } from "astro";
import { getPublishedNotes } from "../lib/notes";
import { getPublishedPosts } from "../lib/posts";
import { createNoteSearchIndexItem, createSearchIndexItem } from "../lib/search";

export const prerender = true;

export const GET: APIRoute = async () => {
  const [posts, notes] = await Promise.all([getPublishedPosts(), getPublishedNotes()]);
  const items = [
    ...posts.map(createSearchIndexItem),
    ...notes.map(createNoteSearchIndexItem),
  ];

  return new Response(JSON.stringify(items), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
