# WaiJade Blog

这是个人博客的新一代重构仓库，当前已进入 `Astro + React + TypeScript + Tailwind + Radix UI + MDX` 的阶段一。

## 当前状态
- 旧 Jekyll 模板运行体系已移除，不再作为并存方案保留。
- 新站已由 Astro 根目录工程接管。
- 当前完成内容：
  - 基础路由骨架
  - 首页与占位页面
  - 滚动浮现式导航
  - 移动端菜单
  - 内容集合与站点配置入口

## 常用命令
```bash
npm install
npm run dev
npm run build
npm run preview
npm run check
```

## 内容与配置
- 站点配置：`src/config/site.ts`
- 内容模型：`src/content/config.ts`
- 文章目录：`src/content/posts/`
- 页面内容目录：`src/content/pages/`
- 短文目录：`src/content/notes/`

## 迁移说明
- 完整迁移路线见根目录 `BLOG_REBUILD_PLAN.md`
- 协作约束见根目录 `AGENTS.md`
