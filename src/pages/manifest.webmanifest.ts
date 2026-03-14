import { site } from "../config/site";

export const prerender = true;

export async function GET() {
  const manifest = {
    id: "/",
    name: site.title,
    short_name: "WaiJade",
    description: "WaiJade's BLOG, Welcome!",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "zh-CN",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}
