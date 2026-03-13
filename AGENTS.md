# Repository Guidelines

## 当前阶段
- 本仓库正在从旧 Jekyll 博客模板重构为新的 Astro 静态博客站。
- 后续所有分析、设计、实现任务开始前，必须先阅读根目录的 `BLOG_REBUILD_PLAN.md`。
- 当现有仓库中的旧目录、旧命令或旧模板结构与 `BLOG_REBUILD_PLAN.md` 冲突时，以计划文档中的目标架构、迁移阶段和界面方向为准。
- 在重构完成前，不应继续把旧模板体系当作长期标准来扩展。

## 沟通与协作规则
- 与用户交流必须使用中文；计划、变更说明、问题反馈也统一使用中文。
- 回复时先给可执行结论，再补充必要细节，避免空泛表述。
- 修改仓库前先确认影响范围；若涉及页面结构、文章展示或资源路径，说明受影响页面。

## 项目结构与模块组织
- 当前仓库仍保留旧 Jekyll 结构，但这只是重构过渡期现状，不是最终目标架构。
- 新站的目标结构、内容模型和页面分层以 `BLOG_REBUILD_PLAN.md` 为准。
- `_posts/`：文章正文，文件名使用 `YYYY-MM-DD-title.md`。
- `_layouts/` 与 `_includes/`：Jekyll/Liquid 模板，控制页面骨架、导航、页头页脚等公共片段。
- `less/`：样式源码；`css/`：编译后的样式文件。优先修改 `less/`，不要直接手改压缩产物。
- `js/`：站点脚本，优先修改未压缩源文件，再生成对应 `.min.js`。
- `img/`、`fonts/`、`pwa/`、`download/`：静态资源；`_doc/`：项目说明文档。

## 构建、开发与验证命令
- 以下命令主要服务于旧 Jekyll 模板；在 Astro 重构阶段，它们属于过渡期参考，而不是新站的长期命令体系。
```bash
bundle install   # 安装 Jekyll 相关 Ruby 依赖
npm install      # 安装 Grunt 相关前端依赖
npm start        # 本地启动 Jekyll 预览，默认 http://127.0.0.1:4000
npm run dev      # 同时运行 grunt watch 与 Jekyll 预览
grunt            # 编译 less、压缩 JS、补充 banner
```
- 修改 `less/` 或 `js/` 后，提交前至少执行一次 `grunt` 或 `npm run dev` 验证生成结果。
- 当前无自动化测试，默认以本地预览手动检查首页、文章页、导航、搜索或 PWA 相关改动。

## 编码风格与命名
- 保持现有仓库风格：JS、Grunt、YAML 以 4 空格缩进为主，Markdown Front Matter 简洁明确。
- 资源文件名建议使用小写加连字符；文章与图片目录名称应可读、稳定，不频繁改名。
- 模板改动遵循现有 Jekyll/Liquid 结构，不引入仓库内未使用的新构建工具。

## 提交与 Pull Request 规范
- 每完成一个独立功能或一组紧密相关修改，立即执行一次 `git commit`。
- 提交格式强制使用 `type(scope): subject`，`subject` 必须为简体中文；如有 `body`，也必须为简体中文。
- 示例：`feat(posts): 添加朝圣路的排版修正`、`fix(pwa): 修正离线缓存路径`
- Pull Request 需写清变更范围、验证方式、影响页面；涉及视觉或布局调整时附截图。
