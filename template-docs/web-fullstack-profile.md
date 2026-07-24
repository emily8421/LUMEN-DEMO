# Web Fullstack Profile + Walking Skeleton Gate

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义复杂 Web / 全栈交互项目的轻量结构基线。它不是具体技术栈脚手架，不要求母模板内置业务代码；它用于在派生项目进入首个业务功能 Sprint 前，确认可运行骨架、目录边界、纵切验证和文件膨胀阈值。

## 1. 适用范围

满足以下任一条件时，应触发 Web App Structure Profile + Walking Skeleton Gate，或在 `ai/project-rules.md` §3 / `docs/05-tech-spec.md` 中写明豁免理由：

- 项目同时启用 `frontend/` 与 `backend/`，并存在前端调用后端 API。
- 交付物为 Demo / MVP / 产品，需要浏览器点击演示或人工走查。
- 前端包含多页面、多视图、多角色、多状态、表单、列表、搜索 / 问答、看板、管理后台或数据密集界面。
- Sprint 修改范围包含页面、组件、路由 / 视图切换、API client、状态管理或桌面端 / WebView 集成。
- 首个前端实现可能把多个业务能力堆进单个主应用文件或全局样式文件。

## 2. 非目标

- 不规定 React / Vue / Svelte / Next.js / FastAPI / Spring 等具体技术栈。
- 不要求一次生成完整产品目录或全部页面。
- 不替代 `docs/design/frontend-interaction.md`、UI 原型策略、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。
- 不把示例目录写成所有项目的强制结构；项目可裁剪，但必须保留职责边界与验证入口。

## 3. Gate 通过条件

首个 Web 业务功能 Sprint 前，至少应完成以下检查：

| Gate | 最低要求 | 证据位置 |
|---|---|---|
| WSG-001 App Shell | 全局布局、导航 / 视图入口、加载 / 空态 / 错误态入口明确 | `docs/04-architecture.md` / `docs/design/frontend-interaction.md` |
| WSG-002 目录边界 | 页面、feature、组件、API client、state / hooks、样式 token、后端 API / service / model / tests 位置明确 | `docs/05-tech-spec.md` |
| WSG-003 Vertical Slice | 至少一个前端视图 → API client → 后端接口 → service / mock / persistence → smoke 验证路径 | `docs/08-dev-plan.md` / `docs/09-verification.md` |
| WSG-004 文件膨胀阈值 | 主应用文件、全局样式、单个页面 / service 超阈值时先拆分，不继续堆功能 | `docs/05-tech-spec.md` / `docs/08-dev-plan.md` |
| WSG-005 验证入口 | 前端构建 / lint、后端测试、API smoke、浏览器 smoke、关键 viewport / 权限路径有最小命令或人工步骤 | `docs/09-verification.md` |
| WSG-006 UI 链路对齐 | UI brief、experience brief、frontend-interaction、UI 原型策略与实现 Sprint 的关系明确 | `docs/design/*` / `docs/08-dev-plan.md` |

## 4. 推荐目录边界（可裁剪）

```text
frontend/
├─ src/
│  ├─ app/          # App Shell、路由、全局 providers
│  ├─ pages/        # 页面 / 视图入口
│  ├─ features/     # 业务功能纵切
│  ├─ components/   # 可复用 UI 组件
│  ├─ api/          # API client，与 docs/07 API-ID 对齐
│  ├─ state/        # store / hooks / query keys
│  └─ styles/       # design tokens、布局变量、主题
backend/
├─ api/             # 路由 / controller，与 docs/07 API-ID 对齐
├─ service/         # 业务服务
├─ model/           # schema / DTO / domain model
├─ repository/      # persistence / external gateway，可按项目裁剪
└─ tests/           # service / API / smoke tests
tests/
├─ smoke/           # API / browser smoke
└─ e2e/             # 可选端到端路径
```

项目可用其他命名，但应能回答：入口在哪里、业务纵切在哪里、API client 如何追溯到 `docs/07-api-spec.md`、状态与样式是否可复用、测试和 smoke 如何运行。

## 5. 文件膨胀阈值建议

以下阈值是治理提醒，不是硬性编译规则；超过时 AI 应先提出拆分计划，并把风险写入 `08/09` 或任务单：

| 文件类型 | 提醒阈值 | 建议动作 |
|---|---:|---|
| `App.*` / 主应用入口 | 300 行 | 拆出 App Shell、routes、providers、layout |
| 页面 / 视图文件 | 250 行 | 拆 feature、panel、form、table、state hook |
| 全局 CSS / 样式文件 | 300 行 | 拆 tokens、layout、components、page styles |
| 后端 service / controller | 250 行 | 拆 service、repository / gateway、schema、error handling |
| 单个测试文件 | 300 行 | 拆 smoke、contract、edge cases |

### 5.1 主应用文件职责边界与业务下沉

§5 阈值回答「何时该拆」；本节回答「主应用文件只该放什么、新功能往哪里去」，从源头避免膨胀。主应用文件（前端 `App.*` / `src/app/*`、后端 `main` 入口、同等聚合文件）只承担：

- **组合各域 hook / service**——装配业务模块，不实现业务逻辑；
- **跨域 orchestration**——一次性协调多域（如统一 refresh、初始化顺序）；
- **cross-cutting wrapper**——全局忙碌 / 错误 / 通知 / 登录失效等横切装配；
- **render / 启动装配**——路由、providers、布局、入口挂载。

不承担具体业务的状态机、数据加载副作用、事件处理实现、领域计算——这些下沉到域 hook（如 `useSearch` / `useDocuments`）或独立模块 / service。新功能以「最少改动胶水式」在主文件直接加 `useState` / handler / `useEffect` 仅限临时探索或极小改动；进入正式 Sprint 前必须抽到域 hook / 模块。

软上限提醒（配合 §5 行数）：主应用文件内 `useState` / 等价状态 **~10–15 个**、事件 handler **~10–15 个**；超限按业务域抽 hook 或回调聚合。

跨域边界：业务 hook **不持有跨域 setter**；需联动其他域时经回调（如 `onDocumentsChanged`、`onAuthError`）交回主文件做 orchestration，避免循环依赖与跨域闭包过期。一次性 set 多域 state 的跨域 refresh 可留在主文件，但应显式标注 orchestration 职责。

> 与 §5 一致为治理提醒，非硬性；派生项目可在 `ai/project-rules.md` §3 / `docs/05-tech-spec.md` 覆盖或写明豁免。

## 6. Sprint 0 / Walking Skeleton 建议

复杂 Web 项目可在首个业务 Sprint 前加入一个很小的 Sprint 0：

- 目标：跑通一个无业务或最小业务的 vertical slice。
- 修改范围：只建立 App Shell、目录边界、一个示例 API / mock、一个 smoke 路径。
- 验收：前端页面可打开，API / mock 可调用，状态 / 错误 / 空态入口存在，`09` 有 smoke 记录。
- 禁止：不得在 Sprint 0 顺手实现完整业务、权限系统、复杂组件库或真实生产部署。

## 7. 与 UI 探索链路的关系

UI Brief / UI Exploration / frontend experience brief / frontend-interaction / UI 原型策略回答“用户要什么体验、页面如何呈现、状态如何被确认”。Web App Structure Profile 回答“代码结构如何支撑这些体验、首个纵切如何可验证、后续功能如何不堆到少数文件”。两者互补，不能互相替代。

## 8. 与 scaffold 实验的关系

本 Profile 只定义结构基线和 Gate，不在母模板内生成真实 Web App scaffold。若需要验证 `template-docs/web-app/`、`new-project --profile web-app` 或领域模板是否值得推进，先按 `template-docs/web-app-scaffold-experiment.md` 在真实项目或独立实验仓记录候选结构、Walking Skeleton 验证、文件膨胀观察和推广结论。
