export type NavItem = {
  label: string;
  href: string;
};

export type SocialItem = {
  label: string;
  href: string;
};

export type GiscusCommentsConfig = {
  provider: "giscus";
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname";
  strict: "0" | "1";
  reactionsEnabled: "0" | "1";
  emitMetadata: "0" | "1";
  inputPosition: "top" | "bottom";
  lang: string;
  loading: "lazy" | "eager";
};

import { siteControls } from "./site-controls";

const features = siteControls.features;

export const site = {
  title: "WaiJade's BLOG",
  description: "一个基于 Astro、React、Tailwind、Radix UI 与 MDX 重构中的静态个人博客。",
  url: "https://blog.waijade.cn",
  author: "WaiJade",
  brand: {
    name: "WaiJade",
    avatar: "/avatar.png",
  },
  nav: [
    { label: "HOME", href: "/" },
    ...(features.showNotes ? ([{ label: "NOTES", href: "/notes" }] satisfies NavItem[]) : []),
    { label: "ARCHIVES", href: "/archives" },
    { label: "ABOUT", href: "/about" },
  ] satisfies NavItem[],
  social: [
    { label: "GitHub", href: "https://github.com/CheongSzesuen" },
    { label: "BandBBS", href: "https://www.bandbbs.cn/members/344224/" },
  ] satisfies SocialItem[],
  comments: {
    provider: "giscus",
    repo: "CheongSzesuen/WaiJade.github.io",
    repoId: "R_kgDOI6Xr3g",
    category: "Comments",
    categoryId: "DIC_kwDOI6Xr3s4C4XFZ",
    mapping: "pathname",
    strict: "1",
    reactionsEnabled: "0",
    emitMetadata: "1",
    inputPosition: "top",
    lang: "zh-CN",
    loading: "lazy",
  } satisfies GiscusCommentsConfig,
  features,
  theme: {
    defaultMode: "dark" as const,
  },
} as const;
