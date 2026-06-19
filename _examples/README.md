# 参考样例

本目录存放**填好的参考样例项目**，演示模板各文档“填好后长什么样”，给非工程受众一个“什么是好”的基准。
新项目从**模板根目录**复制（不是从这里），本目录仅供参考、不参与复制、AI 不读取。

## 现有样例

| 样例 | 形态 | 说明 |
|---|---|---|
| `todo-api/` | 全栈（有 DB + 有 API） | 极简单人待办 API，填全 docs/00-08 + project-rules，演示完整流水线 |
| `text-cleaner-cli/` | CLI（无 DB + CLI 契约） | 本地文本清洗工具，省略 docs/06，保留 docs/07 作为命令契约示例 |
| `text-normalizer-lib/` | 内部库（无 DB + 无公开接口） | 纯字符串标准化库，同时省略 docs/06、07，演示最小文档闭环 |
| `md-notes-frontend/` | 纯前端（无 DB + 无 API） | 浏览器 Markdown 笔记 SPA，省略 docs/06、07，演示 localStorage 等前端持久化如何不触发 06 |

> 想看“无 DB / 无公开接口”项目如何裁剪 docs/06、07，见 `text-normalizer-lib/`；想看“无 DB 但有 CLI 契约”的情形，见 `text-cleaner-cli/`；想看“前端 localStorage 等持久化如何不触发 06”，见 `md-notes-frontend/`。
