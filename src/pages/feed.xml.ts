import { site } from "../config/site";
import { getPostExcerpt, getPostUrl, getPublishedPosts } from "../lib/posts";

export const prerender = true;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getPublishedPosts();
  const latestTimestamp = posts.reduce((timestamp, post) => {
    const updated = post.data.updatedDate?.getTime() ?? post.data.pubDate.getTime();
    return Math.max(timestamp, updated);
  }, Date.now());

  const items = posts
    .map((post) => {
      const postUrl = new URL(getPostUrl(post), site.url).toString();
      const description = post.data.description || getPostExcerpt(post, 220, false);
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");

      return [
        "<item>",
        `<title>${escapeXml(post.data.title)}</title>`,
        `<description>${escapeXml(description)}</description>`,
        `<pubDate>${post.data.pubDate.toUTCString()}</pubDate>`,
        `<link>${escapeXml(postUrl)}</link>`,
        `<guid isPermaLink="true">${escapeXml(postUrl)}</guid>`,
        categories,
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(site.title)}</title>`,
    `<description>${escapeXml(site.description)}</description>`,
    `<link>${escapeXml(site.url)}</link>`,
    `<atom:link href="${escapeXml(new URL("/feed.xml", site.url).toString())}" rel="self" type="application/rss+xml" />`,
    `<pubDate>${new Date(latestTimestamp).toUTCString()}</pubDate>`,
    `<lastBuildDate>${new Date(latestTimestamp).toUTCString()}</lastBuildDate>`,
    "<generator>Astro</generator>",
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
