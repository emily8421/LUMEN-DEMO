# MdNotes（参考样例）

> 这是一个**填好的参考样例**，演示“纯前端、无后端、无对外接口”项目如何使用本模板。仅供对照学习，不是可运行项目（代码省略，只展示文档）。

- **项目**：MdNotes —— 浏览器端 Markdown 笔记单页应用
- **形态**：纯前端 SPA，无数据库、无 HTTP API
- **对照**：本目录结构对应模板根目录——`docs/00-05`、`docs/08` 为填好的实例，`ai/project-rules.md` 为填好的项目专属规则
- **裁剪**：本项目无数据库也无对外接口，`docs/06-db-design.md`、`docs/07-api-spec.md` 均省略；笔记用浏览器 localStorage 持久化，其结构在 `docs/05-tech-spec.md` 说明，不建模到 06

阅读建议：先 `docs/00-scenario` → `02-srs`，再看 `03-05`、`08` 如何在无 DB / 无 API 的前提下保持闭环，最后看 `ai/project-rules.md` 的 §3 如何声明文档裁剪（含 localStorage 这类前端持久化的处理）。
