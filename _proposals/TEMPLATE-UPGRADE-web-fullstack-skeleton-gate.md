# TEMPLATE-UPGRADE-web-fullstack-skeleton-gate

> 来源：LUMEN Demo T2.1（emily8421/LUMEN-DEMO）派生项目回流。适用于可点击 Web 前后端系统的模板方法论优化提案。  
> 去项目化说明：本文不要求母模板内置某个业务系统或具体技术栈实现，只提议增加 Web 全栈项目的骨架门禁、目录约束和审查规则。

## 1. 背景与问题

在包含 Web 后端、前端交互界面的系统中，模板当前强调文档驱动、小步快跑、先设计后实现，并已补充前端交互设计与 UI 原型策略。但多个派生项目在逐步实现时仍容易出现以下问题：

- 早期为了快速跑通 Demo，把大量前端页面、状态、表单、列表、样式集中到少数文件中，例如单个 `App.jsx` / `App.tsx` 和一个全局 CSS。
- 后端功能按 Sprint 逐步跑通后，前端仍停留在简陋原型或堆叠卡片式 UI，演示效果不足，导致后期需要额外体验收口 Sprint。
- 真正开始做前端交互时，任务往往变成局部修补：字体、间距、布局、某个面板，而不是在统一 App Shell、导航、页面边界、组件职责和设计 token 下演进。
- 多个项目若各自长出不同目录风格，AI 编程、人工 review、验收和后续维护很难形成统一判断标准。

这不是单纯“先做大框架”或“先做小功能”的二选一问题。更准确的根因是：

> Web 全栈项目在进入业务功能 Sprint 前，缺少一个轻量但明确的 **Web App Skeleton Gate**：先建立可运行骨架、目录结构和评审边界，再按业务功能纵切小步实现。

## 2. 派生项目观察

在某知识库 Demo 派生项目中：

- 后端最终形成了相对清晰的 `api / service / model / migrations` 分层，便于 API、服务、数据模型和测试追溯。
- 前端早期为了快速交付，把主要页面、业务状态、视图切换和组件逻辑集中在一个主应用文件和一个全局样式文件中。
- 后续虽然补充了前端交互设计、UI 原型策略和工作台重设计，并通过浏览器 smoke 验证，但这些属于后期体验收口，而不是首个前端实现前的骨架门禁。
- 体验收口有效说明：只靠局部样式微调不够，必须先定义 App Shell、主导航、上下文面板、工作区、信息密度和状态反馈分层。

该观察具有通用性：知识库、智研平台、OA / PLM 管理子系统、功能库、用例库、研发数据链管理、项目管理等 Web 系统，都可能出现“功能逐步可跑，但交互框架和代码结构逐步变重”的问题。

## 3. 拟改目标

建议在母模板中增加一个可选但强触发的 **Web Fullstack Profile / Web App Skeleton Gate**，用于具有 Web 后端 + 可点击前端的项目。

目标：

1. 在实现首个业务功能 Sprint 前，先建立可运行的最小 Web 应用骨架。
2. 明确前端、后端、测试和文档之间的统一目录结构与扩展点。
3. 避免大型系统长期堆在少数文件中，降低 AI 修改上下文、误伤和 review 成本。
4. 保持小步快跑：骨架 Gate 不等于一次实现完整系统，而是为后续功能纵切提供稳定边界。
5. 让验收从一开始就覆盖 UI Shell、API contract、权限边界和浏览器 smoke，而不是后期才补演示体验。

## 4. 触发条件

满足以下任一条件时，应触发 Web App Skeleton Gate，或在 `ai/project-rules.md` / `docs/05-tech-spec.md` 中写明豁免理由：

- 项目保留 `frontend/` 与 `backend/`，并存在对外 API / 前端调用。
- 交付物是 Demo / MVP，且需要人工演示或浏览器点击走查。
- 前端包含多页面、多视图、多角色、多状态、表单、列表、搜索、问答、审批、看板、管理后台或数据密集界面。
- `docs/08-dev-plan.md` 的 Sprint 修改范围包含页面、组件、路由 / 视图切换、搜索 / 问答 UI、管理页、桌面端集成。
- 当前计划中首个前端实现会把多个业务能力写进同一个主应用文件。

## 5. 建议新增规则

### 5.1 Web App Skeleton Gate

在完成 `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/07-api-spec.md` 的基础接口边界后，首个 Web 实现 Sprint 前增加骨架 Gate。

Gate 产出至少包括：

- 前端 App Shell：全局布局、导航、页面 / 视图边界、错误 / 空态 / 加载态入口。
- 前端目录结构：页面、feature、组件、hooks / state、API client、样式 token 的推荐位置。
- 后端目录结构：API、service、model/schema、repository / persistence、migration、tests 的推荐位置。
- API contract 映射：前端 API client 与 `docs/07-api-spec.md` 的接口 ID 对齐。
- 验证入口：构建、后端单测、API smoke、浏览器 smoke、关键 viewport / 权限路径。
- 代码膨胀阈值：超过阈值时必须先提出拆分计划，不得继续堆功能。

### 5.2 推荐目录结构（可按技术栈裁剪）

母模板不应绑定 React / FastAPI，但可以给出 Web 全栈通用结构：

```text
frontend/
  src/
    app/              # AppShell、全局 providers、路由 / 视图注册
    features/         # 按业务能力纵切：documents/search/query/terms/...
      <feature>/
        components/
        hooks/
        api.ts
        types.ts
        view.tsx
    shared/
      components/
      styles/
      utils/
    api/              # 通用 HTTP client、auth、错误处理
    main.tsx
backend/
  api/                # 路由 / controller，只处理 HTTP 入出参
  service/            # 业务服务
  model/              # domain/entity/schema
  repository/         # 持久化 / 外部系统适配，可按项目命名
  migrations/
  tests/ 或 tests/backend/
```

说明：

- 该结构是默认推荐，不要求所有项目逐字照搬。
- 小型 Demo 可合并部分目录，但必须说明裁剪理由和后续拆分触发条件。
- 原型探索可以使用单文件，但必须位于 research / prototype 路径，不能直接作为长期生产结构。

### 5.3 单文件膨胀阈值

建议新增 AI 行为约束：

- 主应用 / 页面容器文件超过 400–600 行，或包含 3 个以上页面 / feature 职责时，新增功能前必须先提出拆分计划。
- 全局样式文件超过 600–800 行，或包含多个 feature 私有样式时，新增 UI 前必须提出样式 token / feature 样式拆分方案。
- API client 超过多个业务域时，应按 domain / feature 拆分，同时保留通用 request 层。
- 单次 Sprint 不一定必须完成全量拆分，但不得继续无说明地把新功能堆进已超阈值文件。

### 5.4 实现路径建议

建议模板将 Web 全栈项目实现路径明确为：

1. 文档链路：`00-03` 定需求与阶段，`04-07` 定架构 / 技术 / DB / API。
2. UI / 交互：前端交互设计 + UI 原型策略，必要时先做低保真或代码原型。
3. 骨架 Sprint：建立 App Shell、目录结构、API client、后端分层、最小 smoke。
4. 功能纵切 Sprint：每个业务能力沿前端 feature + API + service + tests 纵切实现。
5. 体验收口 Sprint：仅用于设计偏差 / 信息密度 / 演示体验调整，不承担补救架构缺口。

## 6. 验证与审查建议

### 6.1 AI 编程检查

AI 在 Web 全栈任务开始前应回答：

- 本任务是否触发 Web App Skeleton Gate？若不触发，豁免理由是什么？
- 新代码将落在哪些目录和 feature 边界？
- 是否会修改多个不相关 feature？若会，是否应拆 Sprint？
- 是否会继续扩大已超阈值文件？若会，拆分计划是什么？

### 6.2 验证检查

Web 项目至少应有：

- 后端单测 / API smoke。
- 前端 build。
- 浏览器 smoke：登录 / 导航 / 空态 / 错误态 / 主流程。
- 关键 viewport 验证：例如桌面系统至少覆盖一个窄桌面宽度。
- 权限路径验证：后端权限必须生效，前端隐藏 / 禁用不得替代权限。

### 6.3 审核检查

review checklist 建议增加：

- 是否符合 Web Profile 推荐目录结构或已说明裁剪理由。
- 页面 / feature 是否有明确职责边界。
- API 调用是否集中封装，并能追溯 `docs/07-api-spec.md`。
- UI 状态是否覆盖 loading / empty / error / disabled / permission denied。
- 新增功能是否只改相关 feature，避免横切误伤。
- 是否出现单文件膨胀且无拆分计划。

## 7. 母模板 vs 领域模板评估

### 7.1 建议先放母模板

本提案建议先在母模板中落地“轻量 Web Fullstack Profile”，原因：

- Web 前后端目录结构、骨架 Gate、单文件膨胀阈值、AI review checklist 属于通用工程治理，不是某个业务领域专属。
- 当前领域模板机制仍在演进，过早拆出领域模板可能增加同步路径和维护复杂度。
- 先放母模板能让现有派生项目立即受益，且可通过“触发条件 + 可选 Profile + 豁免理由”控制重量。

### 7.2 母模板控重原则

为避免母模板变重，应坚持：

- 不内置完整业务系统代码。
- 不绑定具体框架实现，例如 React / Vue / FastAPI / Spring 只能作为示例，不作为强制。
- 不要求非 Web 项目读取或采用该 Profile。
- 把详细示例放入 `template-docs/`，在规则文件中只放触发条件和引用。

### 7.3 后续可迁移为领域模板的条件

当满足以下条件时，再考虑派生领域模板：

- 至少 2–3 个 Web 全栈派生项目反复采用同一目录结构、验证入口和 UI Shell。
- 技术栈趋同，例如 React + FastAPI 或企业后台固定框架。
- 出现可复用脚手架、组件库、权限模型、审计日志、表格 / 表单 / 工作流模式。
- 母模板中的 Web Profile 已经难以保持“规则 + 示例”的轻量定位。

届时可考虑独立：

- `web-fullstack-app-template`
- `enterprise-admin-system-template`
- `knowledge-workbench-template`
- `plm-management-system-template`

## 8. 影响面与建议修改位置

影响面：

- 影响模板方法论文档、文档标准、开发 Prompt 与 review checklist。
- 影响包含 Web 前后端和可点击 UI 的新项目 / 后续 Sprint；不影响 CLI、纯后端、纯文档或一次性脚本项目。
- 对既有派生项目不要求立刻重构，只建议在新增 Web 功能、Phase 升级或单文件膨胀超过阈值时触发 Gate。
- 对母模板重量的影响应控制在“规则 + Profile + 示例”，不内置完整业务代码脚手架。

建议修改位置：

建议在模板仓中分层落地：

1. `template-docs/web-fullstack-profile.md`：新增 Web 全栈 Profile 说明、目录结构、Gate checklist、示例。
2. `ai/document-lifecycle-rules.md`：在前端交互设计 / UI 原型策略附近增加 Web App Skeleton Gate 触发条件。
3. `ai/implementation-lifecycle-rules.md`：增加单文件膨胀阈值、拆分触发、按 feature 纵切实现规则。
4. `ai/doc-standards/frontend-interaction.md`：补充 App Shell、页面 / feature 边界和代码目录追溯项。
5. `template-docs/docs-scaffold/08-dev-plan.md` 或 Sprint 模板说明：建议 Web 项目的首个实现 Sprint 为 Skeleton / App Shell / Contract Smoke。
6. `ai/prompts/dev/02-run-task.md`：执行 Web 任务前检查是否触发 Skeleton Gate。
7. `ai/prompts/review/03-project-review.md` 或 docs checklist：增加 Web 代码结构审查清单。

## 9. 版本影响建议

建议版本影响：`MINOR`。

理由：

- 新增一个可选但强触发的 Web 全栈 Profile 和 Skeleton Gate，属于新的下游采用面。
- 不改变非 Web 项目默认行为。
- 不要求现有派生项目立刻迁移，只要求后续 Web 功能或新项目按 Gate 判断。

## 10. 待维护者确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| WFS-001 | 是否新增 `template-docs/web-fullstack-profile.md` | 建议新增 | 详情较多，不宜全部塞入规则文件 | 只在现有规则中增加短段落 | 只写短段落可能无法指导实际目录结构 |
| WFS-002 | 是否设定单文件行数阈值 | 建议设为软阈值并允许项目裁剪 | AI 编程需要可触发的客观信号 | 不设阈值，只靠人工判断 | 容易继续堆大文件 |
| WFS-003 | 是否把 Skeleton Sprint 设为 Web 项目默认首个实现 Sprint | 建议设为默认建议，不设硬性强制 | 避免功能跑通但架构后补 | 每个项目自行决定 | 风格不统一，review 成本高 |
| WFS-004 | 是否立即派生领域模板 | 建议暂不；先母模板轻量 Profile | 领域模板机制仍在演进，且本问题是通用 Web 工程治理 | 立即建 `web-fullstack-app-template` | 维护面增加，短期同步复杂度上升 |

## 11. 非目标

- 不要求母模板提供完整 React / Vue / FastAPI / Spring 代码脚手架。
- 不要求既有项目一次性重构全部前端。
- 不替代 UI 原型策略、前端交互设计、API 设计或 DB 设计。
- 不把前端路由守卫、按钮隐藏或页面禁用作为权限边界。

