# Token Hotspot Record: 用户操作手册撰写（docs/env/user-guide.md）

> 本文件是 AI 协作观察材料，不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。

## 元数据

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-19 |
| 任务主题 | 从「读取续接点」快速续接升级到文档任务：撰写面向最终用户的《用户操作手册》`docs/env/user-guide.md`（覆盖 Phase1 + Phase1.5 + Phase2A）+ demo-guide 交叉引用 + v0.2.2 PATCH |
| 记录性质 | token / 上下文热点观察 |
| 隐私过滤 | 未记录 token、密钥、账号密码、客户敏感数据或完整对话正文；示例账号为 demo 虚构数据（alice / kira / brightlite-member） |

## 热点判断

本轮属于 token hotspot，原因：

- 从「读取续接点」快速续接升级到写入任务，完整读取规则路由 `ai/index.md` + `rules-core` + 文档任务必读规则包：`global-rules` / `document-lifecycle-rules`（~550 行）/ `project-rules` / `doc-standards/README`，外加 `docs/README.md`（分区规则，决定新文档落点）。
- 大量读取事实来源以定位手册内容：`docs/env/demo-guide.md`（全文）、`docs/00-scenario.md`（全文）、`docs/08-dev-plan.md`（全文，含 Sprint 总览 + 完成包，是 Phase1.5/2A 功能清单与 UI 描述主来源）。
- 多轮读前端代码核对真实 UI 入口（避免凭设计稿 / 印象写错操作步骤，设计稿可能有实现偏差 §10）：`App.tsx` + `app/{TopBar, ContextPane, WorkspaceViewNav, constants}` + `features/{DocumentsFeature, TagsFeature, QuickEntryFeature, SearchFeature, QueryFeature, TermsFeature}` + `components/MarkdownBlock`（共 12 个文件）。
- 多次 Grep / Glob 定位（docs 结构、Phase1.5B / Phase2A 关键词、frontend-interaction 章节标题、`操作手册` 等同义检索）。

## 主要上下文热点

| 类别 | 路径 / 对象 | 热点原因 |
|---|---|---|
| 规则门禁 | `ai/index.md` + `rules-core` + `global-rules` / `document-lifecycle-rules` / `project-rules` / `doc-standards/README` | 从快速续接升级到文档任务是强制门禁，且新增文档须先读 `docs/README` 分区 + 等人工确认路径 |
| 文档规则 | `ai/document-lifecycle-rules.md`（~550 行） | 实际只用 §5（生成矩阵）/ §7（状态词典）/ §10（生成前声明）/ §11（自检）；§2-4（多入口 / 剖面 / UI 原型门禁）与本任务无关 |
| 事实来源 | `docs/env/demo-guide.md`、`docs/00-scenario.md`、`docs/08-dev-plan.md` | demo-guide 给 Phase1 操作口径；08-dev-plan 给 Phase1.5/2A 功能清单与 UI 描述（最近 3 个月新功能未进 demo-guide） |
| 前端代码 | `App.tsx` + `app/*` + `features/*` + `components/MarkdownBlock` + `constants.ts` | 以代码事实为权威核对每个按钮文案 / 字段 / 入口（权限标签、wikilink 四态、快速录入三 mode 等） |
| 续接记录 | `.ai/session-handoff.md` | 多次交叉核对新鲜度（Branch / HEAD / VERSION 与 Git 一致 → fresh） |

## 执行命令类别

- 只读核对：`git status --short --branch`、`git log --oneline`、`git stash list`、`git check-ignore -v`、`git ls-files`（确认 handoff / ai-records 是否入库）。
- 文档定位：Grep 工具按关键词 + 章节定位（避免全文件刷入）；Glob 定位 docs 结构 / 前端结构。
- 文件写入：Write（user-guide.md 新增、本 hotspot）、Edit（demo-guide 交叉引用、VERSION、CHANGELOG）。

## 质量影响

| 影响 | 说明 |
|---|---|
| 正向 | 规则全读确保合规（任务路由门禁 / 生成前声明 / 新增文档先读 `docs/README` 分区 + 等人工确认路径 / 生成后自检）；前端代码核对使操作入口与按钮文案准确，不凭设计稿（设计稿可能有实现偏差） |
| 成本 | `document-lifecycle-rules` 全读（~550 行）但仅用约 1/3 章节；`08-dev-plan.md` 全文读但主要用 Sprint 总览 + Phase2A 完成记录；12 个前端文件读取用于核对文案（其中 hook 逻辑层其实不必读） |
| 风险 | 手册未经浏览器实走校验（基于代码事实），按钮文案应准确但实际观感 / 交互细节需用户对照界面确认 |

## 后续优化建议

1. **document-lifecycle 按 §5.0 scope 严格裁剪**（与 2026-07-16 记录建议一致）：文档撰写 / 回写类任务只读 §5（生成矩阵）/ §7（状态词典）/ §10（声明）/ §11（自检）+ `docs/README`，跳过 §2-4（多入口 / 剖面 / UI 原型门禁）。
2. **操作手册类文档的最小三件套**：读 `demo-guide`（Phase1 口径）+ `08-dev-plan` 完成记录（新功能清单 + UI 描述）+ 前端 `features/*` 与 `app/*` 组件（按钮文案核对）；不必读 hook 逻辑层（`use*` / `api/*`）即可写出准确操作步骤。
3. **补一次浏览器 smoke 走查**：手册当前仅基于代码核对，建议起一次前端走一遍主流程截图，作为操作手册的验收证据（类比 demo-guide 的 Chrome smoke）。

## 当前建议续接点

- `docs/env/user-guide.md` 已交付 + `demo-guide.md` 交叉引用 + v0.2.2 PATCH（commit 见 git log）；handoff 已更新。
- 手册未经浏览器实走校验，建议用户对照界面校准文案与观感后再视情况升 MINOR 或对外发布。
