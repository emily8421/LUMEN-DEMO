# 前端 React 选型评估报告（Phase1 Demo）

| 项 | 内容 |
|---|---|
| 文档类型 | 技术调研 / 选型评估 |
| 评估日期 | 2026-07-04 |
| 关联阶段 | Phase1 Demo |
| 关联范围 | `frontend/`、`docs/05-tech-spec.md` 前端技术栈、`docs/08-dev-plan.md` Sprint-2 / 4 / 5 / 6 前端任务 |
| 关联需求 | REQ-004 / 005 / 006 / 007 / 008 / 011 / 036 |
| 当前结论 | 继续采用 React；前端初始化前建议做一次版本实测 |

## 1. 评估背景

项目规则与技术方案已将前端栈定义为 React：

- `ai/project-rules.md`：Phase1 允许范围包含“前端 React”，并将 React 作为视图层技术栈。
- `docs/04-architecture.md`：桌面浏览器中的 React 前端通过 REST / JSON 调用 FastAPI API。
- `docs/05-tech-spec.md`：前端基线为 React 18.2.x、Vite 5.4.x、TypeScript 5.5.x、Node.js 22.17.1、npm 11.11.0。
- `docs/08-dev-plan.md`：Sprint-2 / 4 / 5 / 6 均包含前端页面或集成任务。

本次评估用于回答：React 是否仍是主流选择，是否适合 LUMEN 当前 `FastAPI + REST API + 桌面端知识库 Demo` 的组合。

## 2. 评估结论

### 2.1 总体结论

React 仍是主流前端框架 / UI 库之一，且适合本项目 Phase1 Demo。建议保持现有 React 技术方向，不建议在 Sprint-2 前切换到 Vue、Angular、Svelte 或 Next.js。

### 2.2 推荐组合

```text
React + Vite + TypeScript + FastAPI REST API
```

该组合适合当前项目：

- 前后端分离清晰：FastAPI 负责鉴权、权限、文档、搜索、RAG 与导入；React 只负责桌面端交互呈现。
- 对 LUMEN 页面结构友好：空间切换、文档列表、Markdown 编辑、版本历史、搜索结果、问答来源引用、术语提示均天然组件化。
- Demo 开发效率高：Vite 启动快、配置轻，适合 Phase1 小步验证。
- 维护风险低：React 生态成熟、资料多、人才池大，后续接 UI 组件、Markdown 编辑器、状态管理与测试工具选择空间大。

## 3. 主流性判断

| 依据 | 判断 |
|---|---|
| Stack Overflow Developer Survey 2025 | React 仍位于 Web frameworks / technologies 第一梯队，具备广泛使用基础。 |
| State of JS 2024 | React 在前端框架工作使用数据中居前，Vue、Angular、Svelte 也保持活跃。 |
| 官方定位 | React 官方定位为用于构建用户界面的 JavaScript library，强调组件化 UI。 |
| 生态与工具 | React 与 Vite、TypeScript、React Router、TanStack Query、Markdown 编辑器和测试工具链适配成熟。 |

## 4. 备选方案对比

| 方案 | 优势 | 风险 / 不适配点 | 本项目判断 |
|---|---|---|---|
| React + Vite + TypeScript | 主流、生态成熟、组件化强、与 FastAPI 解耦清晰 | 需要处理状态与请求组织；生态选择多可能带来选择成本 | 推荐保持 |
| Vue + Vite + TypeScript | 上手快、模板语法友好，适合小团队后台 | 已有 docs 明确 React；切换需同步多份设计文档，收益不足 | 不建议切换 |
| Angular | 工程规范强、企业后台完整 | 重量较大，对 Phase1 Demo 偏过度 | 不推荐 Phase1 |
| Svelte | 轻量、样板少、交互开发快 | 团队与生态风险高于 React；后续复杂组件选择面较窄 | 不推荐作为默认 |
| Next.js + FastAPI | 适合 SSR、SEO、公开内容站点 | LUMEN 是桌面端知识库 Demo，SSR 价值低且复杂度增加 | 暂不采用 |

## 5. 与 LUMEN 需求的匹配

| LUMEN 能力 | React 匹配点 |
|---|---|
| 文档列表 / 编辑 / 版本历史（REQ-004 / 005 / 006） | 可拆为列表、编辑器、版本面板、恢复确认弹窗等组件。 |
| 搜索与 RAG 来源引用（REQ-007 / 008） | 结果列表、来源引用卡片、答案状态组件适合 React 组合。 |
| 空间切换 / 权限呈现（REQ-001 / 002 / 003） | Token、当前空间、可见文档列表可通过前端状态和 API 请求缓存管理。 |
| 术语提示（REQ-036） | 文档阅读 / 编辑器中的提示、悬浮解释、状态标签适合组件化。 |
| 桌面浏览器 Demo（REQ-011） | Vite + React 可快速实现单页桌面端 Demo。 |

## 6. 版本与环境注意事项

当前 `docs/05-tech-spec.md` 固定为：

```text
React 18.2.x；Vite 5.4.x；TypeScript 5.5.x；Node.js 22.17.1；npm 11.11.0
```

但 React 19 已在 2024-12-05 稳定发布。由于本项目已有“技术路线与环境支撑评估”经验，前端初始化前不应仅按旧基线安装，应先做小型环境实测：

1. 确认 Node.js / npm 当前版本。
2. 验证 `npm create vite` 或等价方式能创建 React + TypeScript 项目。
3. 对比 React 18 与 React 19 对计划采用的 Markdown 编辑、路由、请求库和测试工具是否兼容。
4. 若决定升级 React / Vite / TypeScript 版本，需同步 `docs/05-tech-spec.md` 与依赖文件。
5. 若维持 React 18.2.x，应说明原因：稳定、生态兼容、Demo 风险低。

## 7. 风险与约束

- 前端不可作为权限边界；权限仍以后端 API 返回为准，见 `docs/04-architecture.md` 的权限边界约束。
- 不应为了 UI 便利绕过 `Authorization: Bearer <token>` 与当前空间上下文。
- 初始 Sprint-2 前端不建议引入重型 UI 框架、复杂全局状态库或 SSR 框架。
- 若需要安装 npm 依赖，应先确认并记录依赖用途；新增依赖必须进入前端依赖文件。

## 8. Go / Conditional Go / No-Go 结论

结论：`Conditional Go`。

- Go 条件 1：继续采用 React 技术方向，不切换技术栈。
- Go 条件 2：前端初始化前做 Node / npm / Vite / React 版本实测。
- Go 条件 3：先实现最小页面，不引入重型依赖。
- Go 条件 4：如升级到 React 19 或新版 Vite，必须同步 `docs/05-tech-spec.md` 与依赖文件。

## 9. 对后续 Sprint 的建议

Sprint-2 前端建议拆为最小任务：

1. 初始化 `frontend/` React + Vite + TypeScript 项目。
2. 实现 Demo 登录或 token 获取。
3. 实现文档列表、文档详情 / 编辑、保存。
4. 实现版本列表与恢复确认。
5. 接入错误态：401、404、422 / 通用服务端错误。

暂不做：搜索 UI、RAG UI、术语提示、复杂编辑器增强、权限管理后台、移动端适配。

## 10. 参考来源

- React 官方文档：<https://react.dev/learn/describing-the-ui>
- React 19 发布说明：<https://react.dev/blog/2024/12/05/react-19>
- MDN React 入门：<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started>
- Stack Overflow Developer Survey 2025：<https://survey.stackoverflow.co/2025/technology>
- State of JS 2024 Front-end Frameworks：<https://2024.stateofjs.com/en-US/libraries/front-end-frameworks/>
