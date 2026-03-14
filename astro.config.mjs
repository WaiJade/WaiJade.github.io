import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://waijade-blog.vercel.app",
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["article-heading-anchor"],
            ariaLabel: "定位到此标题",
          },
          content: [
            {
              type: "element",
              tagName: "span",
              properties: {
                className: ["article-heading-anchor__symbol"],
                ariaHidden: "true",
              },
              children: [{ type: "text", value: "#" }],
            },
          ],
        },
      ],
    ],
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/noop",
    },
  },
  vite: {
    server: {
      headers: {
        "Access-Control-Allow-Origin": "https://giscus.app",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    },
    preview: {
      headers: {
        "Access-Control-Allow-Origin": "https://giscus.app",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    },
    plugins: [tailwindcss()],
  },
});
