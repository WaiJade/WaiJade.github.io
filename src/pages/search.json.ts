import type { APIRoute } from "astro";
import { getPublishedPosts } from "../lib/posts";
import { createSearchIndexItem } from "../lib/search";

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const items = posts.map(createSearchIndexItem);

  return new Response(JSON.stringify(items), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
