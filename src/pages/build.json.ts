import type { APIRoute } from "astro";
import { buildMeta } from "../lib/build";

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(buildMeta), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
};
