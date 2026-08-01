# Task 023：少容器清爽视觉（Sprint-21 / REQ-011 / Phase2B Doc-First slice 3c-2）

> 本 task 是 Step 3 Slice 3c 的第二半（视觉类）：主区减重边框/底色 + 正文限宽居中，落地 §9.5.1 少容器清爽。
> 解 smoke 反馈 #3（矩形块/框太多）。与 task-022（欢迎页，#1）同属 Slice 3c，门禁一次（DF-C-001 slice 级）。
> DF-C-001 门禁已重跑（build 绿 + WSG 静态，2026-08-01）。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3c 视觉/首屏） |
| REQ | REQ-011（工作台视觉密度收口，**不新增 REQ**） |
| 设计 | `docs/design/frontend-interaction.md` §9.5.1（核心原则：少容器清爽 / 正文限宽 ~800–880px） |
| 解反馈 | smoke #3（矩形块/框太多） |
| 前置 | DF-C-001 门禁 baseline 过；task-022 首页先行（同 slice） |
| 分支 | feat/step3-doc-first-ux |

## 目标

主区视觉减重：减少 workspace-main 内 panel/card 的重边框与底色堆叠（保留结构分隔线、去冗余双层框）；阅读预览正文限宽 ~840px 居中（§9.5.1）。让主体更沉浸、少框，贴合 Doc-First「文档优先」。范围限定主区（用户决策 2026-08-01：主区为主），不动 ContextPane / ViewNav 视觉。

## 关键决策

1. **主区底色减重**：`.workspace-main`/`.workspace` 底色 `--panel-soft` 减向页面底（更沉浸，不强区分）。
2. **卡片减框**：`editor-panel`/`editor-pane`/`inspector-pane`/`markdown-preview` 的 `border + background` 减视觉重量——保留结构分隔、去冗余双层框（如外层 editor-panel 已有框时，内层 markdown-preview 不再重复硬框）。
3. **正文限宽**：`.markdown-preview` 内渲染容器 `max-width: clamp(...,840px,...)` + 居中（§9.5.1，16px 中文每行 ~50–55 字）。
4. **不动 ContextPane / ViewNav / TopBar 视觉**：Q2 决策「主区为主」，全局收口留后续 smoke 定夺。
5. **盯 workspace.css <300**：现 256 行，收口以「改既有规则」为主不增行；若限宽/卡片样式使行数逼近阈值，把新增样式段拆到 markdown.css 或 welcome.css，不破 WSG-004。

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `frontend/src/styles/workspace.css` | 改 | 主区底色减重 + 卡片 border/background 减视觉重量 + markdown-preview 正文限宽居中 |

## 验证包

- **自动门禁**：`volta run --node 22.17.1 npm run build` 绿。
- **WSG-004 静态**：workspace.css <300。
- **浏览器 UI smoke（待 PG+LLM 栈）**：主区框明显减少、正文限宽居中不撑满、阅读态沉浸；其他视图（搜索/问答/术语/标签）视觉不破；窄屏不破版。
- **回归 TC-P1-014**：三层布局 + 900px 不破版 + P0/P1A 不回退（仅视觉变量调整，不改结构）。

## 禁止事项

- 不改 DOM 结构 / 组件逻辑（纯 CSS 视觉变量调整）。
- 不动 ContextPane / ViewNav / TopBar 视觉。
- 不动后端 / API / DB / REQ。
- 不做 Slice 3b（单列阅读/编辑切换）；正文限宽作用于现有双列预览的内层容器，不等单列。
- 不引 CSS 框架 / 动效库。
- VERSION MINOR + CHANGELOG 留 release。

## 待确认

- 边框/底色具体减到什么程度：方案给方向，编码时按 §9.5.1 定具体值，smoke 确认。
- 正文限宽在「双列编辑+预览并排」下的效果：预览列内层限宽居中；单列切换（3b）后再优化。

## 完成记录

- [x] workspace.css 主区底色 panel-soft → transparent（沉浸）
- [x] editor-panel/editor-pane/inspector-pane border line → line-soft（减淡）
- [x] markdown-preview 去冗余框/底色 + 正文限宽 840px 居中（.markdown-preview .markdown-body）
- [x] build 绿（exit 0，246 modules）；WSG workspace.css 263 < 300
- [ ] Chrome/Edge smoke 视觉确认 + TC-P1-014 回归（待 PG+LLM 栈）
