# 项目专属规则

> 本文件每个新项目都需要重新填写，不参与跨项目同步。
> 判断标准：一条规则换到另一个完全不同的项目上是否还成立——
> 不成立（涉及具体技术栈/具体功能/具体Phase定义）就属于本文件。
>
> 填写时机：§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪在生成 docs/03-08 **之前**填
> （作为约束）；§4 目录特例、§5 编码约定与禁区在审核 03-08 **之后**补。

## 初始化必填检查

- 项目标识、Phase 边界、技术栈、运行环境约束、图表偏好、UI 原型策略、项目版本规则和运行时版本锁定均已在本文件明确。
- `docs/env/local-env.md` 已记录本机事实与人工确认项；新增项目文档必须先按 `docs/README.md` 分区，不得直接放入 `docs/` 根目录。
- `docs/06-db-design.md`、`docs/07-api-spec.md`、`frontend/`、`backend/`、`tests/`、`scripts/` 与 `docker/` 的保留决策见 §3；目录特例见 §4。

## 0. 项目标识

项目名称：LUMEN（KnowledgeBase Demo）
代号/缩写：lumen（数据库表前缀 `lumen_`，后端包名 `lumen`）

## 1. Phase边界

> **项目收尾（2026-08-07）**：LUMEN-DEMO demo 目标已达成——Phase1-2D 全系列交付、`docs/09-verification.md` §6 风险全清、产品红线（不编造 / 不越权 / 不泄露）未破坏。进入维护态；下一阶段未定义。

当前阶段：**Phase2D（账户与多人权限·团队验证）已完成（2026-08-07 收口：Sprint-26/27/28 全部验收通过）**；Phase1 / 1.5A / 2A / 2B / 2C 均已完成；进入维护态，下一阶段范围待用户定义。
- **维护态批1-30 已完成（v3.8.0-27，2026-08-08~08-13）**：P0/P1/P2 工程治理与增强（test DB guard / 错误契约 / UoW / scoped query / response_model / fail-fast / 日志 / 配置 / mypy / eslint / ruff / 前端拆分 / codegen 等）全部闭环。各批次主题、验证与实施口径详见 CHANGELOG 对应版本 + `docs/08-dev-plan.md` + `tasks/task-0NN`。
- 各 Phase 功能与验收详情（内链 REQ-026 / 标签 REQ-012 / 快速录入 REQ-025 / AI 润色 REQ-014 / 时间轴 REQ-013·024 / 目录树 REQ-039 / Vault 挂载 REQ-018 / 账户权限 REQ-040..047）见 `docs/03-prd.md` §3 路线图 + `docs/09-verification.md`。

> 双维度（global-rules §8.1）：**功能范围** `[P1]/[P2]` 正交 **交付物形态** Demo/MVP（Phase2D 已达成）；阶段归属唯一来源 = `docs/03-prd.md` §3 路线图，升阶段只改本节指针，不重写需求。

允许（当前阶段已解锁能力）：
- 后端 Python + FastAPI；存储 PostgreSQL + pgvector；LLM 走 OpenAI 兼容 API；Embedding 本机 `bge-small-zh`（512 维）；前端 React
- 双空间隔离 + 文档权限三级（私有 / 团队共享 / 外部只读）
- Markdown 文档 CRUD + 全文搜索 + RAG 问答（带来源引用）+ 行内编辑 / 版本历史
- 内容导入（`.md` / `.txt` 已提取文本、批量 / 文件夹）；单文档 `.md` 下载 / 空间 ZIP 导出 / 单文档 PDF 导出（Sprint-18）
- 空间级术语表 + 文档术语识别 + 问答口径对齐；术语领域树（REQ-048）
- AI 助手悬浮窗 + LLM 多通道切换（REQ-008 扩展）
- 本地知识源 Vault 模式 B 仅本地挂载（REQ-018）；桌面端浏览器访问
- 真实 Word / PDF 解析、zhparser 中文分词、FileSystemObserver 自动监听等仍为后续候选

禁止（Phase2D Sprint-26 账号基础范围外，不做）：
- 高级视图：关联图、问题热力矩阵、事件卡片因果展开、气泡图谱（**时间轴已随 Phase2B 首批解锁**；标签视图随 Phase2A 解锁）
- 跨空间文档推送（**外部知识源挂载 / Obsidian Vault 路径挂载已随 Phase2C 解锁**）
- 录音转文字入库、对外只读简报（临时链接）、文档包生成
- **REQ-016 多人实时协作（并发编辑）、移除用户 / 重置密码 / 邀请码与邀请链接（Sprint-28 明确不做，留候选 / 后续）；Sprint-26/27 范围外能力不进本阶段**
- AI 撰写管理层摘要（**AI 润色 / 写作侧边栏引用已随 Phase2B 首批解锁**）
- 情报分析（i2 精神）：关联图↔时间轴联动、路径推理、人物关系网络、矛盾检测、假设检验 / 证据地图、信号追踪——均为远期愿景（v18 新增支柱，见 docs/design/intelligence-analysis.md）
- 手机端 / 移动适配（demo 先桌面端）

当前阶段内进度：见 `docs/08-dev-plan.md`（Sprint 记录）+ `docs/09-verification.md`（Phase2B/C/D 验收 TC）。

## 2. 技术栈与项目约束

| 层 | 选型 | 说明 |
|---|---|---|
| 后端 | Python + FastAPI | 异步、RAG/LLM 生态成熟 |
| 数据库 | PostgreSQL + pgvector | 关系存储与向量检索一体化；Phase1 不引入独立向量库 |
| AI | LLM 走 OpenAI 兼容 API；Embedding 本机 `bge-small-zh` | LLM 可接国内中转 / 自部署；Embedding 维度 512，详见 05-tech-spec |
| 前端 | React | 视图层；状态管理 / 路由等细节留 05-tech-spec |
| 文件解析 / OCR | Word / PDF 文字提取 + OCR（建议 PaddleOCR，中文友好） | 具体 OCR 引擎待 05-tech-spec 确认 |

禁止引入的替代品：
- 禁止用独立向量库（Milvus / Qdrant 等）替代 pgvector（Phase1 内）
- 禁止绑定单一闭源 LLM 厂商 SDK；AI 调用统一走 OpenAI 兼容接口
- 任何新依赖须先确认，不得擅自引入

## 2.1 运行环境与资源约束

> 本节约束技术方案与本机 Demo 可行性；事实来源 `docs/env/local-env.md`（由 `scripts/collect-env.ps1` 采集）。未确认项保持「待确认」，不得虚构。

- 本机环境：Windows 11 / i7-12650H（10C16T）/ 31.7GB 内存 / RTX 3050 6GB（详见 `docs/env/local-env.md`）
- Demo 必须本机运行的部分：FastAPI 后端、PostgreSQL+pgvector、React 前端、`.md` / `.txt` 已提取文本导入、Embedding（`bge-small-zh`，512 维）
- 允许降级 / Mock / 远程运行的部分：LLM 可走公司内网中转或明确 Mock；Word / PDF 文字解析与 OCR 可降级为已提取文本（具体边界见 `docs/05-tech-spec.md` / `docs/09-verification.md`）
- 禁止在本机运行的重资源部分：大参数本地 LLM、大型 Embedding / reranker；`bge-small-zh` 本机 Embedding 属 Phase1 例外
- 是否允许联网（调用外部 OpenAI 兼容 LLM / Embedding API）：允许 LLM 经公司内网中转调用 OpenAI 兼容接口；Embedding 本机运行，不依赖外部 Embedding API。**Phase2B AI 润色（REQ-014）数据外发走同一内网中转通道，受 `docs/05-tech-spec.md` RG-008 约束（风险已接受，见下条「Demo 数据范围」）**
- 是否允许安装新依赖 / Docker 镜像：允许本机 `pip install` / `npm install` / `docker pull` 项目所需依赖与镜像；新增依赖须写入依赖文件并说明用途，不得借机替换既定技术栈
- 是否允许使用公司服务器：Phase1 Demo 暂不使用；当前公司暂无可用 Embedding 资源，后续本机不够用时再申请内网 Embedding / reranker 服务
- 若需服务器，资源申请口径：优先申请内网 Embedding / reranker 服务，提供 OpenAI-compatible `/v1/embeddings`；具体 CPU / 内存 / GPU / 磁盘按目标模型与数据规模另行评估
- Demo 数据范围：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档。真实文档必须显式标注来源 / 敏感级别。**Phase2B AI 润色 / 写作引用（REQ-014）：允许将用户显式触发的真实文档片段经公司内网中转 LLM 外发处理，数据外发风险已人工接受（2026-07-30）；护栏见 `docs/05-tech-spec.md` RG-008——① sources 仅限当前用户有权限的 chunk（守住「不泄露越权」产品红线）② 草稿只存 `input_excerpt_hash` + `prompt_summary`，不存完整敏感原文 ③ 不做敏感字段自动过滤（由用户自判是否触发润色）④ LLM 不可用返回 5030 或 Mock 降级；非润色场景仍优先避免批量外发**
- Demo 资源软上限：峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；超限先优化批处理、增量索引与 chunk 策略，再触发服务器预案

> 技术方案（`docs/05`）与架构（`docs/04`）必须受本节与 `docs/env/local-env.md` 约束；本机资源不足时须明确所需公司服务器资源与触发条件。

## 2.2 图表格式偏好

> 设计类文档（`docs/04-07`、`docs/design/*`）的图表格式偏好；权威见 `ai/document-lifecycle-rules.md §13`（v1.22.0 新增）。

- **默认 `mermaid`**：GitHub 原生渲染、无需额外工具，优先用于架构图 / ER 图 / 流程图 / 状态机 / 交互·时序图等多数场景。
- **`plantuml` 备选**：复杂部署拓扑或时序图等 mermaid 表达力不足时可用；预览需本机或 CI 安装 plantuml，故仅作备选、不设为默认。
- 性质为「建议 + 默认」，图表服务于表达，不要求每类文档凑齐所有图（见 §13）。

## 2.3 UI 原型策略

> UI 型项目开发前原型策略；权威见 `ai/document-lifecycle-rules.md` UI 原型策略节与 `ai/doc-standards/ui-prototype-strategy.md`（模板 v1.39.0 引入）。

- 是否涉及可点击 UI：是（React 桌面端）
- 是否需要开发前可视化原型：已完成（Sprint-2 ~ Sprint-6）；后续新 UI Sprint 沿用「代码原型 + mock」策略，不引入 Figma 等外部设计工具
- 原型形式：代码原型 + mock 数据 + 浏览器 smoke / 截图证据
- 原型权威位置：`frontend/` 实现代码 + `docs/09-verification.md §5` 浏览器 smoke 记录；详细设计见 `docs/design/frontend-interaction.md §8`
- 覆盖范围：登录 / 空间切换 / 文档 CRUD / 行内编辑 / 版本恢复 / 导入 / 搜索 / RAG 问答 / 术语管理 / 桌面端集成（对齐 `docs/design/frontend-interaction.md §2.2` 全部 P1 页面）
- 未覆盖项：真实 PDF / Word 解析、图片 OCR（REQ-009 真实化移至 Phase2；REQ-010 OCR 移至后续阶段）；移动端（Phase1 禁止）
- 确认状态：已评审（降级口径）；Sprint-6 Edge Headless + Chrome 人工 smoke 通过（见 09 §5）
- 与文档关系：承接 `docs/design/frontend-interaction.md`（页面流 / 状态 / 接口依赖）、`docs/08-dev-plan.md`（Sprint）、`docs/09-verification.md`（验收 TC）；不新增需求 / 接口 / 验收目标

## 2.4 项目版本管理

> 模板仓的版本规则（「影响下游同步判断就 bump VERSION」，见同步来的 `MAINTAINERS.md` / `CONTRIBUTING.md`）面向模板维护者，对本项目不适用——本项目没有下游派生。本节定义 LUMEN-DEMO 自有的版本语义与递增规则。
> 版本入口：`VERSION`（项目自有版本）+ `CHANGELOG.md` 顶部「项目版本」段 + `CHANGELOG-PLAIN.md` 同版本大白话说明；模板继承版本独立记录在 `TEMPLATE-BASE.md`，不与项目版本混淆。

### 2.4.1 版本语义（三段式 vMAJOR.MINOR.PATCH）

- **PATCH**（v0.1.0 → v0.1.1）：bug 修复、文档修正、Demo 数据 / 配置调整、重构，不新增可演示能力、不改对外 API 契约。
- **MINOR**（v0.1.0 → v0.2.0）：Sprint 验收 / 里程碑交付、新增可演示能力、新增 API endpoint、Phase 内功能增强（如 Phase2A 内链 / 标签 / 快速录入）。默认向后兼容。
- **MAJOR**（v0.x → v1.0）：Phase 跨越（如 Phase2A 个人知识组织 → Phase2B 团队 MVP）、破坏性对外契约变更、首个真实场景 / 试点上线。

### 2.4.2 何时 bump

- 完成一个 Sprint 验收 / 里程碑 → 至少 **MINOR**。
- 合并了用户 / 试点可感知的能力变化 → **MINOR**。
- 纯修复 / 文档 / 配置 / 重构 → **PATCH**。
- Phase 跨越、破坏性变更、首上线 → **MAJOR**。
- 不强制每个 commit bump；同一里程碑内的多个改动聚合为一个版本发布。
- 纯探索原型、研究记录、未确认提案不触发版本递增。

### 2.4.3 发布动作

1. 更新根目录 `VERSION` 为新版本号（三段式 `vX.Y.Z`）。
2. 在 `CHANGELOG.md` 顶部「项目版本」段（即 `## 历史模板同步记录（保留）` 之上）新增 `## vX.Y.Z（YYYY-MM-DD）` 条目，概述本版交付并附 REQ / Sprint / TC 追溯。
3. 同步更新 `CHANGELOG-PLAIN.md` 顶部同版本 `## vX.Y.Z（YYYY-MM-DD）` 条目，用大白话解释本版实际改变；版本号、日期、交付范围必须与 `CHANGELOG.md` 对齐。
4. 版本递增属于状态变更，按 `ai/global-rules.md` / `ai/rules-core.md` 的写入确认规则先说明范围、风险与验证，AI 给建议、用户确认后再执行。
5. （可选）打 git tag `vX.Y.Z`；当前阶段不强制，不引入独立 release workflow。

### 2.4.4 CI 校验

`.github/workflows/project-check.yml` 在每次 PR / push 到 main 时校验：
- `VERSION` 符合三段式 `^v[0-9]+\.[0-9]+\.[0-9]+$`；
- `CHANGELOG.md` 顶部第一个 `## vX.Y.Z（` 标题等于 `VERSION`（确保项目版本在顶部且与 VERSION 一致）。
- `CHANGELOG-PLAIN.md` 顶部第一个 `## vX.Y.Z（` 标题也应等于 `VERSION`；若 CI 尚未自动校验，发布自检必须人工核对。
- 不做全文档降序检查——派生 CHANGELOG 顶部为项目版本（如 `v0.1.0`），下方接模板历史版本（`v1.47.1` 等，数值更大），降序不适用。

## 2.5 运行时版本锁定

> 对照 `ai/global-rules.md §5` 运行时版本锁定要求。本项目锁定前后端运行时版本，避免版本漂移导致构建 / 测试失败。本节与 §2.1「运行环境与资源约束」（CPU / 内存 / 显存 / 磁盘）**正交**：§2.1 管「机器跑得动吗」，本节管「用哪个 Node / Python 版本、怎么切换、CI 怎么校验」。

| 运行时 | 锁定版本 | 版本声明文件 | 切换工具 | 锁定原因 |
|---|---|---|---|---|
| Node.js（前端） | **22.17.1** | `frontend/package.json` → `volta.node` | Volta（`volta pin` / `volta run --node`） | Vite 5.4.19 需 Node 18+；Node ≤16 触发 `crypto.getRandomValues is not a function` build 崩溃（2026-07-30 发现并 pin） |
| Python（后端） | 3.14 | `backend/requirements.txt` | venv | 后端实测锁定（见 05） |

- 校验：`cd frontend && node --version` 应为 22.17.1（Volta 项目 pin 生效）；CI 须在 Node 18+ 环境构建。
- 已知坑：若 shell PATH 把某个 Node image 直接前置（绕过 Volta shim），`volta pin` 不生效，需 `volta run --node 22.17.1 npm run build` 显式指定，或修正 PATH 让 Volta shim（`…/Volta`）优先。Claude Code 的 Bash shell 即此情况（PATH 含 `…/Volta/tools/image/node/16.13.0` 前置），故 AI 跑前端 build 须用 `volta run --node 22.17.1`。
- CI 校验：`.github/workflows/project-check.yml` 当前只校验 VERSION / CHANGELOG；Node 版本 / build 校验待补。

## 3. 项目形态与文档裁剪

> 本节用于初始化阶段，决定 docs/06、07 是否保留，以及 frontend/backend/tests/scripts/docker
> 哪些目录真正需要。此节应在生成 docs/03-08 之前先填好。

- 是否有持久化存储：是（PostgreSQL：文档、版本、空间 / 权限、索引、Embedding 向量、术语）
- 是否有对外接口：是（REST API：文档 CRUD、搜索、RAG 问答、导入 / OCR、空间与权限、术语）
- docs/06-db-design.md：保留
- docs/07-api-spec.md：保留（RESTful）
- 需要保留的代码目录：backend/ frontend/ tests/ scripts/ docker/
  （scripts/ 放导入 / 索引脚本；docker/ 放本地起库与依赖编排）
- 演示形态：独立 Web 页面（React 桌面端）→ 启用 `frontend/`
- 前端交互设计：需要 → `docs/design/frontend-interaction.md`（多页面 / 多角色 / 点击路径验收）
- 通用详细设计：需要（非平凡子系统：账户权限 / AI 助手 / 导入 / 本地挂载 / RAG 等）→ `docs/design/*`
- System Skeleton Gate：需要（已落地：`docs/08-dev-plan.md` Sprint 0 + `docs/09-verification.md` 框架测试大纲）
- UI 原型策略：代码原型 + Mock 数据 + 浏览器 smoke 证据（见 §2.3）

## 4. 目录规范的项目特例

`docs/references/` 是本项目保留的目录特例：集中存放外部方法论与产品参考，每份文件须明确标注“外部参考、非项目事实或权威源”，不得替代 `docs/00-09`、`docs/design/` 或 `ai/project-rules.md` 的项目结论。其余目录遵循 `ai/global-rules.md` §5 通用目录标准。代码骨架与分层：

- `backend/`：分 api / service / model 三层；对外接口只进 api 层（待 04-architecture 确认）
- `frontend/`：React
- `tests/`：单元 + 集成 + 验收（对应 docs/09-verification.md）
- `scripts/`：导入 / 索引脚本
- `docker/`：本地起库与依赖编排

具体目录树待 04-architecture 落定后回填。

## 5. 编码约定与禁区

> Phase 级功能禁止见 §1，技术栈替代品禁止见 §2，本节只管代码层。
> 每条尽量具体可执行；没有则写“无”，不要留空占位。
> 详细执行口径与「已落地 / 待对齐」清单见 `docs/05-tech-spec.md §4.2 代码层一致性基线`（对照待回流模板提案 `_proposals/TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md`）。本节为每次任务必读的精炼版。

### 5.1 既有约定（新代码必须向其看齐）
- **命名**：后端 snake_case（Python）、前端 camelCase（JS/TS）、React 组件 PascalCase；命名反映真实语义（纯 localStorage 序列化层用 `*-persist.ts`，不得命名 `*-store` 暗示响应式——本项目 7 个 `*-store.ts` 实为序列化纯函数，属历史命名债）；端点 / 函数后缀风格同项目内统一。
- **分层与目录**：backend 分 **api / service / repository / model 四层**（repository 为独立持久化层）；对外接口只进 api 层；`service/` 层**不得 import fastapi**（`HTTPException` / `Request` / `Response` 等为 web 类型），service 抛领域异常、api 层统一转 HTTP；web 适配依赖（`Depends`）放 api 层或显式标注 `# web adapter`。读路径可直连 repository，写路径必走 service。
- **既有模式**：AI 调用统一走 OpenAI 兼容 adapter 封装层（`service/llm_adapter.py`），不得在业务层直接绑定单一闭源 SDK；前端 HTTP 单出口——后端调用必须经 `frontend/src/api/client.ts` 的 `request()` / `downloadBlob()`；新增 API 资源 = 新建 `api/<resource>.ts` + 在 `api.ts` barrel 追加 `export *`。
- **错误处理**：统一成功 envelope `{code:0,msg:"ok",data}`；service 抛带 code 的领域异常（`AuthenticationError` / `AdminError` / `SpaceMemberError` / `SpaceAccessError`）、api 层转 `HTTPException(detail={"code":...,})`；`code` 永远是业务码、HTTP 码只放 `status_code`；错误 `msg` 用固定用户文案，**禁 `str(exc)` 直传**泄露内部细节。
- **类型纪律**：前端禁 `any`，泛型贯穿 API → hook → 组件；跨层 props 用 `ReturnType<typeof useXxx>` 导出，不手写重复接口。
- **日志 / 配置**：统一 `logging`（**禁 `print`**）；降级 `except` 必须 `logger.warning` 记原因，禁静默吞。env 读取向 `backend/config.py` 收敛，禁止各模块裸 `os.environ.get`（集中化属【待对齐】，新代码先行遵循）。
- **未对齐项**：`docs/05 §4.2` 标注【待对齐】的技术债（错误码集中映射、兜底 5xx envelope、CI 代码门、类型 codegen、`*-store` 重命名等），新代码不得再引入同类问题；旧代码登记为债、不强制当前维护态回改。
- **验证纪律（执行纪律，非新增门禁）**：① 涉及登记基线文件（`useAppState` / `useDocuments` 等）改动时，本地验证须加 `npm run check:file-size`，避免 CI `frontend-file-size` ratchet 拦截往返；② 写 UI smoke 前先读目标组件渲染条件（模式切换 / handler 挂载点），减少试错轮次。来源：token-hotspot SUMMARY §7.1 阶段 C（2026-08-13 codegen 批次教训）。
- **CSS 纪律（2026-08-16 主题试点成文；2026-08-17 设计系统步骤 6 扩展——**完整规范与规则依据见 `docs/design/frontend-design-system.md`**，本条为执行入口）**：
  - 色值 / 间距 / 圆角 / **字号 / 字重**只准引用 `var(--xxx)`（定义单点 = `frontend/src/styles/tokens.css`）；新值先登记 token 再使用，**组件 CSS 内不得出现字面色值**；字号 5 档 / 字重 3 档 / 圆角 4 档 + pill，豁免值以 design-system §1.4/1.7 边界表为准。
  - 分隔与容器（一视图一容器 + 分隔四手段）：列表行用分隔线不用框；次要按钮幽灵化；输入框保留全边框但边线 `--line-soft`；详细规则见 design-system §1.2。
  - hover 两路（文字变 `--accent-strong` / 块洗 `--hover`）+ 单一激活信号 + focus 全站 `--focus-ring`；**禁裸 `outline: none`**（必须 `:focus-visible` 补偿）。
  - 多主题约束：主题差异只允许通过 `[data-theme]` 变量切换表达，组件文件内不得写主题分支选择器（如 `[data-theme='dark'] .foo { … }`）；层级 / 密度 / 布局信号与主题正交。
  - 一文件一功能域；单 CSS 文件超 300 行先拆分再续写（与既有文件膨胀阈值一致）。
  - 禁 `!important`（现状全仓 0 处，保持）。
  - CI 守门：`scripts/check-frontend-css.mjs` 校验零字面色值 + 字阶/字重/圆角 token 化（豁免表内值放行）；新增组件前过 design-system §2 checklist。

### 5.2 禁区（未经人工确认不得触碰）
- 不得擅改的文件 / 模块：ai/ 规则文件、docs/00–08 编号文档的编号与既有结构
- 不得擅自引入的依赖：任何新依赖须先确认（见 §2）
- **不得绕过 `frontend/src/api/client.ts` 直接 `fetch` 后端**（HTTP 单出口）；所有后端调用经域 API 模块 → `client.ts`
- **不得在 `backend/service/` 层 import fastapi**（`HTTPException` / `Request` / `Response` 等 web 类型）；service 用领域异常，api 层转 HTTP。现有 `service/auth_context.py` 为历史破例，新代码不得复制该模式
- 不得自行实现的功能：见 §1 禁止清单；docs/vision/product-vision.md / docs/01 中的功能点不等于已批准实现；阶段归属以 docs/03-prd.md §3 路线图为准，编码以 §1 当前阶段为准

## 6. AI 修改确认规则

- 修改任何项目文件前，AI 必须说明目的、影响范围、预计文件、风险与验证方式，并等待用户明确确认。
- 涉及多文件回写时，必须列出每个文件的变更摘要；未确认的候选、研究结论或设计方案不得写成项目事实。
- 模板方法论文件由同步清单维护；本文件、根 `README.md`、`docs/` 与业务代码属于项目专属内容，分别按其事实来源修改。
- 运行任何可能写入文件 / 安装依赖 / 生成构建产物 / 修改配置 / 提交代码或改变项目状态的命令前，必须先询问用户确认。
- 只读分析操作（读取文件 / 搜索代码 / 查看 Git 状态）无需逐次确认，但不得借只读分析之名修改项目内容。
- 用户在单次消息中明确要求「直接修改」「执行修复」「不必确认」等同类授权时，仅对该次明确任务和已说明范围生效；后续新任务仍默认先确认再修改。
- 模板只能约束 AI 行为和项目期望，不能替代 Claude / Codex / Cursor 等工具自身的权限模型；建议在 AI CLI / IDE 中启用写入前确认、patch 预览或审批模式，并用 `git status` / `git diff` 做兜底审计。

## 附：历史锚点迁移（旧编号解释）

现行文档已迁移至新编号；历史研究、归档和旧同步记录可按下表解释，不要求为保留原时点事实而机械改写。

| 旧锚点 | 当前锚点 | 含义 |
|---|---|---|
| §2.5 | §2.1 | 运行环境与资源约束 |
| §2.6 | §2.2 | 图表格式偏好 |
| §2.7 | §2.3 | UI 原型策略 |
| §2.8 / §2.8.1..4 | §2.4 / §2.4.1..4 | 项目版本管理 |
| §2.9 | §2.5 | 运行时版本锁定 |
