export type NavItem = {
  label: string;
  href: string;
};

export type SocialItem = {
  label: string;
  href: string;
};

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
    { label: "ARCHIVES", href: "/archives" },
    { label: "TAGS", href: "/tags" },
    { label: "ABOUT", href: "/about" },
  ] satisfies NavItem[],
  social: [
    { label: "GitHub", href: "https://github.com/CheongSzesuen" },
    { label: "BandBBS", href: "https://www.bandbbs.cn/members/344224/" },
  ] satisfies SocialItem[],
  features: {
    showToc: false,
  },
  theme: {
    defaultMode: "dark" as const,
  },
} as const;
