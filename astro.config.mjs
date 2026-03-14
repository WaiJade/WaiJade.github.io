import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import tailwindcss from "@tailwindcss/vite";
import rehypeWritingTimeMeta from "./src/lib/rehype-writing-time-meta.js";
import { createDevConsolePlugin } from "./scripts/dev-console.mjs";

export default defineConfig({
  site: "https://blog.waijade.cn",
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeWritingTimeMeta,
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
    plugins: [tailwindcss(), createDevConsolePlugin()],
  },
});
