# project-rules 文档规范（审计基线）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `ai/project-rules.md` 种子实例的**字段规范与审计基线（单一事实源）**，随模板下行同步。它只定义"每节填什么、字段规范、审计项、禁止项"，**不替代**派生项目的实例事实——项目专属内容仍写在各自 `ai/project-rules.md`（不同步）。

## 1. 定位与两层分工

`ai/project-rules.md` 此前身兼三职（规范基线 + 种子模板 + 项目事实），现将"规范基线"上移到本文件，实例层只保留填写骨架与项目事实：

| 层 | 载体 | 是否同步 | 职责 |
|---|---|---|---|
| 规范/审计基线 | `ai/doc-standards/project-rules.md`（本文件） | 是 | 字段定义、填写规范、审计项、禁止项 |
| 种子实例 | `ai/project-rules.md` | 否 | 派生项目填写的项目专属事实骨架 |

判断标准（与 `ai/global-rules.md` 通用层一致）：一条规则换到另一个完全不同的项目上是否还成立——成立（通用填写规范、审计口径、版本/确认规则）属本文件；不成立（具体技术栈、具体功能、具体 Phase 定义）属实例 `ai/project-rules.md`。

填写时机：实例的 §1 Phase 边界、§2 技术栈、§3 项目形态与文档裁剪在生成 `docs/03-09` **之前**填（作为约束）；§4 目录特例、§5 编码约定与禁区在审核 `docs/03-09` **之后**补。

## 2. 章节契约（种子实例必须保留的骨架）

种子 `ai/project-rules.md` 必须保留以下章节标题（章节号是跨文档引用的稳定锚点，不得随意改号）：

- 初始化必填检查（生成 docs/03-09 前）
- §0 项目标识
- §1 Phase 边界
- §2 技术栈与项目约束
- §2.1 运行环境与资源约束
- §2.2 图表格式偏好
- §2.3 UI 原型策略（如适用）
- §2.4 项目版本管理
- §2.5 运行时版本锁定
- §3 项目形态与文档裁剪
- §4 目录规范的项目特例
- §5 编码约定与禁区（§5.1 既有约定 / §5.2 禁区）
- §6 AI 修改确认规则

实例可按项目形态裁剪填写内容，但不得删除上述章节标题；不适用项写"无"或"不适用"，不留空占位。

## 3. 初始化必填检查（生成 docs/03-09 前）

在使用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料并用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成或补全 `docs/03-09` 前，必须确认实例以下项目已填写，不得保留占位说明直接进入设计阶段：

- `项目名称` 与 `代号/缩写` 已明确；若暂不需要缩写，写"无"。
- `§1 Phase 边界` 已明确当前阶段允许、禁止与下一阶段预告；禁止项不得留空。
- `§2 技术栈与项目约束` 已列出本项目确定使用的主要技术；不确定版本写“待确认”，不得虚构。
- `§2.1 运行环境与资源约束` 已通过 `scripts/collect-env.ps1` 生成 `docs/env/local-env.md`，并完成人工确认项；若暂不能采集，必须说明原因。
- `§2.2 图表格式偏好` 已确认（默认 mermaid，可改 plantuml）；未确认则按默认 mermaid，不阻断。
- `§3 项目形态与文档裁剪` 已明确持久化、对外接口、演示形态、`docs/06`、`docs/07` 与需要保留的代码目录。
- `§2.4 项目版本管理` 已确认：默认从 `v0.1.0` 起步，并保持 `VERSION` 与 `CHANGELOG.md` 顶部项目版本一致；如需改规则，先在本节写明。
- 不适用的模板目录或文档已有"保留 / 省略 / 删除"决策；省略 `docs/06` 或 `docs/07` 时必须在 §3 留下说明。
- 新增项目文档的类型与路径已按 `docs/README.md` 分区规则判断；不得把新增文档直接放到 `docs/` 根目录。
- 若以上任一项无法判断，AI 必须先向用户提问或提出待确认项，不得继续生成后续设计文档。

## 4. 各节字段规范

### §0 项目标识

- `项目名称`：项目对外名称（如 `DigitalCustomerService_Demo`）。
- `代号/缩写`：用于数据库表前缀、包名等（如 `cs_sessions`）；不需要则写"无"。

### §1 Phase 边界

实例项目专属字段，承载当前阶段的状态：

- `当前阶段`：如 Phase1。
- `允许`：本项目当前阶段允许使用的技术 / 功能。
- `禁止`：本项目当前阶段禁止使用的技术 / 功能（不得留空）。
- `下一阶段预告`：Phase2 大致会开放什么。

> §1 是项目实例权威位置：`docs/03-prd.md` 的 Phase 变更必须传播回实例 §1；`docs/09-verification.md` 在 Phase 升级前检查实例 §1 状态一致性。本节字段由项目填写，规范只约束"不得留空禁止项"。

### §2 技术栈与项目约束

实例填写本项目确定使用的前端 / 后端 / 数据库 / AI 模型等，及禁止引入的替代品。属项目专属（换项目不成立），规范只约束"不确定版本写待确认、不得虚构"。

### §2.1 运行环境与资源约束

本节用于约束架构与技术方案选择。Demo / MVP 阶段优先保证本机可运行；若本机资源不足，必须在 `docs/05-tech-spec.md` 中明确降级策略或服务器资源预案。

字段：本机环境文档（`docs/env/local-env.md`，由 `scripts/collect-env.ps1` 生成）、技术环境评估报告（需要 / 不需要 / 豁免）、Demo 阶段必须能在本机运行的部分、允许降级 / Mock / 远程运行的部分、禁止在本机运行的重资源部分、是否允许使用公司服务器、若需服务器的资源申请口径。

> `docs/env/local-env.md` 只记录本机事实，不等于技术路线已被环境支撑。若项目保留 `backend/`、`frontend/`、`docker/`、数据库、本机模型、外部 API 或其他真实运行依赖，生成 / 修订 `docs/05-tech-spec.md` 或进入首个相关编码 Sprint 前，应完成技术路线与环境支撑评估，或在本节记录跳过理由、风险、影响范围和补做时点。

### §2.2 图表格式偏好

本项目设计文档（`04/05/06/07`/`docs/design`）的图表格式偏好。规范见 `ai/document-lifecycle-rules.md §13`，场景引导见 `template-docs/scenario-guides.md §7`。

字段：图表格式（`mermaid` 默认 / `plantuml`）；若选 mermaid 以外格式，说明原因（如团队工具链、渲染环境）。

> `ai/doc-standards/04-architecture.md` §2.6 图表格式字段引用本节规范。

### §2.3 UI 原型策略（如适用）

本节用于 UI 型项目在前端实现前选择可视化原型策略。触发与边界见 `ai/document-lifecycle-rules.md §5.3`。原型只作为已授权需求的可视化证据，不是需求权威源，不得新增未授权需求、接口、权限行为或验收目标。

字段：是否涉及可点击 UI、是否需要开发前可视化原型（需要 / 不需要 / 豁免）、原型形式（Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 其他）、原型权威位置、原型覆盖范围（主流程 / 页面状态 / 响应式范围 / 权限与降级状态）、原型与文档关系（承接 `docs/design/frontend-interaction.md`，映射到 `docs/08-dev-plan.md` Sprint 与 `docs/09-verification.md` 验收用例；不得新增未授权需求、接口或验收目标）、豁免理由。

### §2.4 项目版本管理

默认规则（可按项目交付节奏覆盖，但必须在实例本节写明）：

- 初始项目版本：`v0.1.0`。
- `VERSION` 记录项目自有版本；继承 / 当前同步到的模板版本记录在 `TEMPLATE-BASE.md`。
- `CHANGELOG.md` 顶部第一个 `## vX.Y.Z（...）` 项目版本必须等于 `VERSION`。
- `PATCH`：bug 修复、文档 / 配置 / 重构，不新增可演示能力、不破坏对外契约。
- `MINOR`：可感知的能力增强或里程碑交付，向后兼容。
- `MAJOR`：不兼容变更、对外契约破坏、首上线。
- 是否使用 git tag / GitHub Release：默认不强制。

> 版本号纪律的模板侧规则见 `CONTRIBUTING.md §4`（模板版本三段式）；本节是**项目自有版本**的填写规范。`scripts/check-derived-sync.sh` / `.ps1` 校验 `VERSION` 与 `CHANGELOG.md` 顶部一致。

### §2.5 运行时版本锁定

本节约束语言 / 运行时版本与切换工具，与 §2.1「运行环境与资源约束」（硬件资源：CPU / 内存 / GPU / 磁盘）**正交**：§2.1 管“机器跑得动吗”，§2.5 管“用哪个 Node / Python 版本、怎么切换、CI 怎么校验"。工具推荐与声明文件标准见 `template-docs/env-setup.md`「运行时版本管理」；声明落点在 `docs/05-tech-spec.md` §1 / §1.1。运行时健康深度诊断（解析路径 / manager / 声明 vs 实际漂移）见 `scripts/check-runtime.ps1`，输出语义见 `template-docs/env-setup.md` §6「运行时健康检测」。

字段：是否启用运行时版本锁定（是 / 否 / 豁免）、锁定的运行时与版本（如 Node 16.13.0 / Python 3.11 / 多运行时）、版本声明文件（如 `package.json` 的 `volta` 字段 / `.node-version` / `.python-version` / `.tool-versions` / `package.json#engines` / `pyproject.toml#requires-python`）、切换工具（如 Volta / fnm / pyenv-win / asdf / Dev Container / 无）、CI 校验方式（如 `volta run` / `pyenv local` / Dev Container 自动切 / CI 显式断言 / 无）、锁定原因、豁免理由。

> `ai/doc-standards/05-tech-spec.md` §2.9 运行时版本锁定字段引用本节规范。

### §3 项目形态与文档裁剪

本节用于初始化阶段，决定 `docs/06`、`docs/07` 是否保留，以及 `frontend/backend/tests/scripts/docker` 哪些目录真正需要。此节应在生成 `docs/03-09` 之前先填好。

字段：是否有持久化存储、是否有对外接口、演示形态（消息通道内交互 / 独立 Web 页面 / 移动端 / CLI / 不需演示）、前端交互设计（需要 / 不需要 / 豁免）、UI 原型策略（需要 / 不需要 / 豁免）、通用详细设计（需要 / 不需要 / 豁免）、System Skeleton Gate（需要 / 不需要 / 豁免）、`docs/06-db-design.md`（保留 / 省略）、`docs/07-api-spec.md`（保留 / 省略）、需要保留的代码目录。

按项目形态裁剪说明（不适用的行可删除）：

- 无持久化存储 → `docs/06-db-design.md` 省略。
- 浏览器端 localStorage / IndexedDB / sessionStorage 等非数据库存储 → 不触发 `docs/06-db-design.md`，其数据结构写在 `docs/05-tech-spec.md`。
- 无对外接口（纯内部库、纯计算模块） → `docs/07-api-spec.md` 省略。
- CLI / 本地脚本 → `docs/07-api-spec.md` 保留，但用于描述命令 / 参数 / 输出契约，不强求 RESTful。
- 演示形态为消息通道内交互 / CLI / 不需演示 → 通常不启用 `frontend/`；独立 Web 页面 / 移动端 / 小程序 / 桌面端 → 通常启用对应前端目录，并在 `docs/04-05` 体现前端设计。
- 非平凡子系统、复杂权限 / 安全边界、AI / RAG / 外部模型、第三方服务、导入 / 异步任务、跨模块状态机、Mock / 降级差异、候选 / 默认关闭 / 高风险愿景能力 → 开发前应补充 `docs/design/<subsystem>.md`，并按 `ai/doc-standards/design-doc.md` 保留元信息、追溯、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项；简单项目可豁免，但必须写明理由。
- 若存在多页面、多角色、复杂表单、状态流、管理页、搜索 / 问答 UI、验收依赖点击路径，或愿景 / PRD 出现"页面 / 界面 / 点击 / 手机 / Web / App / 小程序"等交互信号 → 开发前应补充 `docs/design/frontend-interaction.md` 或按入口拆分的 `docs/design/*interaction*.md`；不补时必须在本节或 `docs/05-tech-spec.md` 写明豁免理由。
- 前端交互设计是 `docs/design/*` 的页面 / 交互型子类型，只细化既有需求的界面呈现、状态、文案、接口依赖和验收路径；不得新增需求、接口或验收目标；前端隐藏 / 禁用 / 路由守卫不是权限边界，权限必须由后端接口和服务层执行。
- 满足前端交互设计触发条件，且用户需实现前预览界面、页面信息密度高、主流程依赖点击验收、存在加载 / 空态 / 错误 / 禁用 / 成功 / 无权限 / 降级 / 风险提示等多状态、多角色 / 多租户 / 权限可见性，或 Demo / Mock / 降级能力需要界面可见口径 → 开发前应在 §2.3、`docs/05-tech-spec.md` 或 `docs/design/frontend-interaction.md` 选择 UI 原型策略；不需要时必须写明豁免理由。
- UI 原型策略可选择 Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 其他；工程驱动项目可优先代码原型 + Mock 数据 + 截图 / smoke 证据；不强制所有项目使用 Figma 或高保真设计。
- 原型不得替代 `00-09`、不得替代前端交互设计或 `09` 验收；原型发现的新需求、接口、权限规则或验收目标必须回到正式文档链路修订。
- `frontend/ backend/ tests/ scripts/ docker/` 只保留本项目用得到的目录。

System Skeleton Gate 三态写法：non-trivial 项目（多模块 / 有对外接口 / 有运行依赖）默认需要，首个业务 Sprint 前在 `docs/08-dev-plan.md` Sprint 0 + `docs/09-verification.md` 系统框架测试大纲落地框架验收；quick-script / 纯计算库 / 单文件工具可豁免，须说明原因、风险和补做时点；规则见 `ai/implementation-lifecycle-rules.md` §3。

### §4 目录规范的项目特例

实例填写本项目目录结构与 `ai/global-rules.md` 通用骨架的差异；没有差异则写"无，遵循 global-rules 通用目录标准"。属项目专属。

### §5 编码约定与禁区

Phase 级功能禁止见 §1，技术栈替代品禁止见 §2，本节只管代码层。每条尽量具体可执行；没有则写"无"，不要留空占位。

- §5.1 既有约定（新代码必须向其看齐）：命名、分层与目录、既有模式、错误处理 / 日志。
- §5.2 禁区（未经人工确认不得触碰）：不得擅改的文件 / 模块、不得擅自引入的依赖、不得自行实现的功能、愿景 / 01 中的功能点不等于已批准实现（阶段归属以 `docs/03-prd.md` §3 路线图为准，编码以 §1 当前阶段为准）。

## 5. AI 修改确认规则（§6）

实例 §6 承载 AI 修改确认规则（项目侧默认规则，可按项目覆盖）：

- AI 在进行任何文件新增、修改、删除、重命名、格式化、批量替换前，必须先说明目的、影响范围、预计文件、预计变更摘要、风险与验证方式，并等待用户明确确认后再执行。
- AI 在运行任何可能写入文件、安装依赖、生成构建产物、修改配置、提交代码或改变项目状态的命令前，必须先询问用户确认。
- 若一次 patch / 批量操作涉及多个文件，必须先列出全部文件和每个文件的变更摘要；不得用"批量优化"等模糊表述替代。
- 只读分析操作（如读取文件、搜索代码、查看 Git 状态）无需逐次确认，但不得借只读分析之名修改项目内容。
- 用户在单次消息中明确要求"直接修改""执行修复""不必确认"等同类授权时，仅对该次明确任务和已说明范围生效；后续新任务仍默认先确认再修改。
- 模板只能约束 AI 行为和项目期望，不能替代 Claude / Codex / Cursor 等工具自身的权限模型；建议在 AI CLI / IDE 中启用写入前确认、patch 预览或审批模式，并用 `git status` / `git diff` 做兜底审计。

## 6. 审计项（对照实例 `ai/project-rules.md`）

审计 / 生成 `docs/03-09` 时对照本文件检查实例：

- 章节骨架完整（§0-§6 + 初始化必填检查标题齐全，章节号未改）。
- 初始化必填检查每项已落实或已说明原因。
- §1 禁止项不留空；§2.4 版本规则与 `VERSION` / `CHANGELOG.md` 一致。
- §2.5 字段（版本声明文件、切换工具、CI 校验方式、锁定 / 豁免理由）齐备或已豁免说明。
- §3 裁剪决策（`docs/06` / `docs/07` / 代码目录 / 详细设计 / 前端交互 / UI 原型）与 `docs/00-09` 实际结构一致；省略项有说明。
- §5.2 禁区具体可执行，不留空占位。
- Phase 变更已传播到实例 §1（与 `docs/03-prd.md` / `docs/09-verification.md` 状态一致）。

## 7. 与其它规范的关系

- 通用目录标准、AI 编程原则见 `ai/global-rules.md`（通用层，非项目专属）。
- 文档生命周期、图表格式规范见 `ai/document-lifecycle-rules.md`（§13 图表）。
- 详细设计、前端交互、UI 原型策略规范见 `ai/doc-standards/design-doc.md` / `frontend-interaction.md` / `ui-prototype-strategy.md`。
- 模板版本治理（模板自身三段式版本）见 `CONTRIBUTING.md §4`；本文件 §2.4 是**项目自有版本**规范，两者正交。
