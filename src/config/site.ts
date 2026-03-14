export type NavItem = {
  label: string;
  href: string;
};

export type SocialItem = {
  label: string;
  href: string;
};

export type GiscusConfig = {
  siteUrl: string;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname";
  strict: boolean;
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: "top" | "bottom";
  lang: string;
  loading: "lazy" | "eager";
  theme: {
    light: string;
    dark: string;
  };
};

const siteUrl =
  import.meta.env.PUBLIC_SITE_URL?.trim() || "https://waijade-blog.vercel.app";
const giscusRepo = import.meta.env.PUBLIC_GISCUS_REPO?.trim() || "CheongSzesuen/WaiJade.github.io";
const giscusRepoId = import.meta.env.PUBLIC_GISCUS_REPO_ID?.trim() || "R_kgDOI6Xr3g";
const giscusCategory = import.meta.env.PUBLIC_GISCUS_CATEGORY?.trim() || "Comments";
const giscusCategoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID?.trim() || "DIC_kwDOI6Xr3s4C4XFZ";

export const site = {
  title: "WaiJade's BLOG",
  description: "一个基于 Astro、React、Tailwind、Radix UI 与 MDX 重构中的静态个人博客。",
  url: siteUrl,
  author: "WaiJade",
  brand: {
    name: "WaiJade",
    avatar: "/avatar.png",
  },
  nav: [
    { label: "HOME", href: "/" },
    { label: "ARCHIVES", href: "/archives" },
    { label: "ABOUT", href: "/about" },
  ] satisfies NavItem[],
  social: [
    { label: "GitHub", href: "https://github.com/CheongSzesuen" },
    { label: "BandBBS", href: "https://www.bandbbs.cn/members/344224/" },
  ] satisfies SocialItem[],
  comments: {
    provider: "giscus" as const,
    enabled: Boolean(giscusRepoId && giscusCategoryId),
    giscus: {
      siteUrl,
      repo: giscusRepo,
      repoId: giscusRepoId,
      category: giscusCategory,
      categoryId: giscusCategoryId,
      mapping: "pathname" as const,
      strict: true,
      reactionsEnabled: false,
      emitMetadata: false,
      inputPosition: "top" as const,
      lang: "zh-CN",
      loading: "lazy" as const,
      theme: {
        light: "/giscus-light.css",
        dark: "/giscus-dark.css",
      },
    } satisfies GiscusConfig,
  },
  features: {
    showToc: false,
  },
  theme: {
    defaultMode: "dark" as const,
  },
} as const;
