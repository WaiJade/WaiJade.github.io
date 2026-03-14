import type { APIRoute } from "astro";
import { site } from "../config/site";
import { getPublishedNotes } from "../lib/notes";
import { getPublishedPosts } from "../lib/posts";
import { createNoteSearchIndexItem, createSearchIndexItem } from "../lib/search";

export const prerender = true;

export const GET: APIRoute = async () => {
  if (!site.features.showSearch) {
    return new Response(JSON.stringify([]), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const [posts, notes] = await Promise.all([
    getPublishedPosts(),
    site.features.showNotes ? getPublishedNotes() : Promise.resolve([]),
  ]);
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
