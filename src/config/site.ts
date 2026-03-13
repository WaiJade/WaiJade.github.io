export type NavItem = {
  label: string;
  href: string;
};

export type SocialItem = {
  label: string;
  href: string;
};

export const site = {
  title: "WaiJade",
  description: "A fully rebuilt static blog powered by Astro, React, Tailwind, Radix UI, and MDX.",
  url: "https://blog.waijade.cn",
  author: "WaiJade",
  brand: {
    name: "WaiJade",
    avatar: "/avatar.jpg",
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
  theme: {
    defaultMode: "dark" as const,
  },
} as const;
