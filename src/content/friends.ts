export type FriendLink = {
  name: string;
  url: string;
  avatar: string;
  description?: string;
};

export const friendsLinks: FriendLink[] = [
  {
    name: "Zaona",
    url: "https://zaona.top/",
    avatar: "https://zaona.top/avatar.png",
    description: "Explore The Edge Of Imagination"
  },
  {
    name: "hrsthrt74",
    url: "https://hrsthrt74.github.io/",
    avatar: "https://avatars.githubusercontent.com/u/49299205",
    description: "hrsthrt74的博客"
  },
  {
    name: "OrPudding",
    url: "https://orpu.moe/",
    avatar: "https://orpu.moe/upload/F337D8E876660646C6C3675320A2ABFD.webp",
    description: "OrPudding的博客"
  }
];
