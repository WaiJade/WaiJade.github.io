# Repository Guidelines

## 当前阶段
- 本仓库正在从旧 Jekyll 博客模板完全重构为新的 Astro 静态博客站。
- 后续所有分析、设计、实现任务开始前，必须先阅读根目录的 `BLOG_REBUILD_PLAN.md`。
- 旧 Jekyll 站点不再作为并存方案保留；若仓库中仍有遗留文件，只能视为迁移素材，不得继续按旧模板思路扩展。
- 当仓库现状与 `BLOG_REBUILD_PLAN.md` 冲突时，以计划文档中的目标架构、迁移阶段和界面方向为准。

## 沟通与协作规则
- 与用户交流必须使用中文。
- 解释、计划、变更说明、问题反馈均使用中文。
- 每次回复优先给出可执行结论，再补充必要细节。

## 项目结构
- 新站以 `src/` 为核心目录：
  - `src/pages/`：页面路由。
  - `src/layouts/`：页面布局。
  - `src/components/`：Astro 与 React 组件。
  - `src/content/`：文章、单页和内容 schema。
  - `src/config/`：站点级配置。
  - `src/styles/`：全局样式与设计令牌。
- `public/`：静态资源输出目录。
- `_posts/`、`img/` 等旧目录如果仍存在，只作为迁移素材来源，不应继续视为新站源码目录。

## 参考目录
- 后续重构允许并建议优先参考以下目录：
  - `pref/old-blog`：旧版博客代码与旧首页/归档/文章结构参考。
  - `pref/main-web`：主站代码，用于参考导航、视觉语言、模块编排和交互风格。
  - `pref/ab/sfweb`：可参考的 AB 软件界面 UI。
  - `pref/ab/web`：AB 网站代码，可参考页面结构、视觉细节和组件组织方式。
- 做博客迁移时，优先从 `pref/old-blog` 提取内容组织、首页列表结构和旧资源路径。
- 做主站风格迁移时，优先从 `pref/main-web` 提取导航、排版、动效和整体气质。
- 做偏产品化或软件界面风格的模块时，可参考 `pref/ab/sfweb` 与 `pref/ab/web`。

## 常用命令
```bash
npm install      # 安装依赖
npm run dev      # 启动 Astro 开发环境
npm run build    # 生成静态构建产物
npm run preview  # 预览构建结果
npm run check    # 运行 Astro/TypeScript 检查
```
- 提交前至少执行一次 `npm run build`；涉及类型、内容 schema 或路由时同时执行 `npm run check`。

## 代码风格
- Astro、TypeScript、React 代码统一使用 2 空格缩进。
- 变量/函数使用 `camelCase`，组件与文件使用 `PascalCase`。
- 资源文件名使用小写加连字符；frontmatter 保持简洁、稳定。
- 站点级信息集中在 `src/config/site.ts`，内容模型集中在 `src/content/config.ts`，避免配置散落。

## 提交规范（强制）
- 每完成一个独立功能或一组紧密相关修改，必须立即执行一次 `git commit`。
- 提交格式：`type(scope): subject`，可选 body。
- 提交信息必须使用简体中文书写：
  - `subject` 必须是简体中文。
  - 若有 `body`，`body` 也必须是简体中文。
- 示例：
  - `feat(astro): 初始化阶段一重构骨架`
  - `fix(nav): 修正移动端抽屉菜单滚动问题`

## 文件规模限制（强制）
- 单个源码文件不应超过 1000 行。
- 当文件接近或超过 1000 行时，必须及时拆分文件，避免继续堆叠逻辑。
- 拆分优先级建议：
  - 页面按模块拆分为子组件。
  - 样式按功能拆分并在入口统一引入。
  - 工具函数与配置常量拆到独立文件。
