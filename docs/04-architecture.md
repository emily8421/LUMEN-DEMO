# 04 系统架构

> 按「完整骨架 + 阶段增量」演进（global-rules §8）。本文件铺出**完整愿景**的总体框架；
> 各子系统内部详细逻辑见 `docs/design/`；数据见 06；接口见 07。
> 子系统 / 模块均带阶段标签与状态。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 输入来源 | `docs/00-scenario.md`、`docs/01-user-requirements.md`、`docs/02-srs.md`、`docs/03-prd.md`、`docs/env/local-env.md`、`ai/project-rules.md`、`docs/research/2026-07-15-overall-design-04-05-audit.md`、`docs/decisions/ADR-010-db-authority-derived-data-rebuildability.md` |
| 覆盖功能 / REQ | Phase1：REQ-001..REQ-011、REQ-036；Phase1.5A：REQ-037/038；Phase1.5B：REQ-027；Phase2A：REQ-012/025/026；Phase2B / 后续 / 愿景保留架构骨架 |
| 当前状态 | 目标架构基线已定；Sprint-7/8 后运行时已接入 PostgreSQL+pgvector、`PgRepository`、本机 Embedding 与 GLM LLM。Phase1.5A 批量 / 文件夹导入与 `.md` / ZIP 导出备份已完成；Phase2A 个人知识组织（标签、内链 / 反链、快速录入）已完成。PDF 导出 RG-006 已 Go、API-019 待 Sprint-18 实现；仍降级 / 候选：真实 Word/PDF 解析、OCR、Phase2B 后续团队能力。Web App Structure Profile / WSG 自 P1.5A 起生效；2026-07-21 新增 ADR-010 固化 DB 权威运行态 + 衍生数据可重建原则 |
| 最后更新 | 2026-08-04（RG-006 PDF 导出技术门禁通过；ReportLab 路线可进入 Sprint-18） |

### 0.1 架构目标与约束

| 维度 | 内容 |
|---|---|
| 当前 Phase | **Phase2B（团队 MVP）进行中**（2026-07-30 切指针）；Phase1 Demo + Phase1.5A + Phase2A（个人知识组织）已完成，见 `ai/project-rules.md` §1 |
| 交付物形态 | Demo / 个人可用 Alpha / 个人知识组织：Phase1 保证核心价值可演示；Phase1.5A 已解决批量入库与导出备份；Phase2A 已补标签、内链 / 反链、快速录入；Phase1.5B / Phase2B 后续确认；全程保留产品红线（库外问答回复"未找到"、不编造） |
| 运行环境 | 本机单机 Demo（React + FastAPI + Docker PostgreSQL+pgvector + 本机 Embedding + 内网 LLM 中转），详见 §4 |
| 项目形态裁剪 | Full 剖面；`06/07` 保留（持久化 + 对外 REST），见 `ai/project-rules.md` §3 |
| 禁止项 | 独立向量库、闭源 LLM SDK 绑定、移动端、实时协作、跨文档因果推理等；权威源 `ai/project-rules.md` §1 / §2、`docs/05-tech-spec.md` §3 |
| 权威源 | 阶段边界 = `ai/project-rules.md` §1；技术禁令 = §2 / `05 §3`；运行环境 = `docs/env/local-env.md` |
| 下游影响 | `05` 技术栈 / readiness gate；`06/07` 数据 / 接口边界；`docs/design/*` 模块详细设计；`08/09` Sprint / 验收路径 |

## 1. 整体架构图

```mermaid
flowchart TB
  browser[React 前端<br/>桌面浏览器 P1] -->|REST / JSON| api[FastAPI API<br/>鉴权 + 权限校验]
  api --> docs[文档管理 service P1]
  api --> retrieval[检索问答 service P1]
  api --> ingestion[内容导入 service P1]
  api --> permissions[空间与权限 service P1]
  api --> terms[术语管理 service P1]
  docs <--> retrieval
  ingestion -->|解析 / OCR / 切块| retrieval
  docs --> db[(model 层<br/>PostgreSQL + pgvector)]
  retrieval --> db
  ingestion --> db
  permissions --> db
  terms --> db
  retrieval --> ai[LLM + Embedding<br/>LLM 外部 / 中转；Embedding 本机]
  p2[标签与视图 / 协作 / 跨空间推送 P2] -.升阶段追加.-> api
  vision[Vault / 录音转写 / 情报交付 愿景] -.技术验证后追加.-> api
```

> 注：上图承载 Phase1 Demo 基线，并已叠加 Phase1.5A 导入 / 导出与 Phase2A 个人知识组织能力。Sprint-8 后 `db` 节点已由 PostgreSQL+pgvector / `PgRepository` 承载，`ai` 节点已接入 GLM LLM 与本机 `bge-small-zh` Embedding；`ingestion` 的真实 Word/PDF 解析与 OCR 仍降级（仅 `.md`/`.txt` 已提取文本）。逐模块实现状态见 §2，技术门禁见 `docs/05-tech-spec.md §5.1`。

### 1.1 系统上下文图（信任边界）

> 标外部参与者 / 系统与信任边界（对照 `ai/doc-standards/04-architecture.md` §3 系统上下文检查表）。明确哪些外部系统是真实 / Mock / 候选 / 默认关闭。

```mermaid
flowchart LR
  subgraph 客户端
    user((知识工作者<br/>桌面浏览器))
  end
  subgraph LUMEN受信域
    system[LUMEN KnowledgeBase<br/>FastAPI + PgRepository]
  end
  subgraph 外部
    llm[公司内网 LLM 中转<br/>OpenAI 兼容]
  end
  user -->|REST / JSON / Bearer token| system
  system -->|RAG prompt<br/>可配置 Mock 降级| llm
```

- **外部系统状态**：公司内网 LLM 中转 = **已接入**（GLM `glm-5.2`，RG-004 Go；可配置 Mock 降级）；飞书同步 / Vault 挂载 = 愿景候选（未实现）。
- **数据外发边界**：跨 LUMEN 受信域 → 外部 LLM 为唯一数据外发点。RAG 问答 / 术语注入（Phase1 起）与 Phase2B AI 润色（REQ-014）均可能发往内网 LLM；**Phase2B AI 润色数据外发风险已人工接受（2026-07-30）：允许真实文档片段外发，护栏见 `ai/project-rules.md §2.5` 与 `docs/05-tech-spec.md` RG-008**（sources 权限过滤、草稿只存 hash + 摘要、不做敏感字段自动过滤、5030 降级）；非润色场景仍优先避免批量外发。Embedding 本机运行，不外发。
- **输入 / 输出**：输入 = 用户 REST 请求（Bearer token，文档 / 搜索 / 问答 / 术语操作）；输出 = JSON 结果（可见范围内的文档、检索结果、带来源 RAG 答案）。跨受信域输出仅 LLM Prompt 片段（见上）。

### 1.2 容器 / 组件视图

| COMP-ID | 组件 / 进程 | 职责 | 部署位置 | 通信方式 | 阶段 | 状态 | 关联 REQ |
|---|---|---|---|---|---|---|---|
| COMP-001 | React 前端 SPA | 桌面浏览器 UI（文档 / 搜索 / 问答 / 术语） | 浏览器 | REST / JSON | [P1] | P1-已实现（代码原型 + smoke） | REQ-011、004~008、036 |
| COMP-002 | FastAPI 后端（api / service / model 三层） | REST API、权限校验、业务逻辑 | 本机单进程 | HTTP | [P1] | 已实现（PG 仓储 `PgRepository`，Sprint-8） | 全 P1 |
| COMP-003 | 数据存储 | PostgreSQL + pgvector | Docker Compose（lumen-pg:pg16） | SQL + pgvector | [P1] | 已接入（Sprint-8；RG-001 Go） | REQ-003~010、036 |
| COMP-004 | AI 服务 | LLM 中转（GLM）+ 本机 Embedding（bge-small-zh） | 本机 + 内网 | OpenAI 兼容 API | [P1] | 已接入（Sprint-7/8；RG-002/004 Go） | REQ-008、036 |

### 1.3 Web App Structure Profile / Walking Skeleton Gate（Batch A 回填）

> 对照 `template-docs/web-fullstack-profile.md`。本项目同时启用 `frontend/` 与 `backend/`，存在前端调用后端 API，且交付物需要浏览器点击演示；因此采用轻量 WSG 矩阵。**显性豁免声明（2026-07-15 校准）**：Phase1 业务 Sprint（1~10）在 WSG 落地前已完成，既有 `App.tsx`（1026 行）/ `styles.css`（886 行）/ 仓储单例 hack 作为 Demo 框架豁免 Sprint 0；经框架评估（见 `docs/research/2026-07-15-system-completion-audit.md` §四 / §五），决定插入 `docs/08-dev-plan.md` **Sprint-0′ 框架补课**（P1.5 前置）主动对齐 WSG-002 / WSG-004，P1.5 / Phase2 起强制遵守目录边界与文件阈值。WSG 矩阵不再仅作 Phase2 门禁。

| WSG-ID | Gate | 当前架构事实 | 证据 / 锚点 | P1.5A / Phase2A/B 实现前要求 |
|---|---|---|---|---|
| WSG-001 | App Shell | P1B 已形成 TopBar + Nav Rail + Context Pane + Workspace 三层工作台；P1.5A 默认沿用该 Shell，不新增一级导航泛滥 | `docs/design/frontend-workspace-redesign.md`、`docs/design/frontend-interaction.md` §9.3 | Sprint-16/17 仅在现有导入区、详情页和工具栏增加入口；若调整 Shell，先回填 `frontend-interaction` |
| WSG-002 | 目录边界 | 当前前端已向轻量分层收敛；后端已分 `api / service / model`，P1.5A 起新增 API client / state hooks 需遵守拆分边界 | `docs/05-tech-spec.md` §4.1、`docs/08-dev-plan.md` Sprint-0′ | Sprint-16/17 不得把批量导入 / 导出逻辑堆回 `App.tsx`；新增 API 只进 `api` 层，业务逻辑进 service |
| WSG-003 | Vertical Slice | P1 已有登录、文档、搜索、问答、术语多条前端 → API → service → PG / LLM → smoke 纵切；P1.5A 首个纵切为批量导入，其次导出备份 | Sprint-9/10 smoke、`docs/09-verification.md` §5、TC-P1-015/016 | 先完成 REQ-037/038 两条最小纵切；Phase2A 再选 REQ-026 / 012 / 025，不一次实现全部 P2 UI |
| WSG-004 | 文件膨胀阈值 | P1B 已做轻量组件与 CSS token 分层；P1.5A 起继续堆主入口 / 全局 CSS 前需先拆分 | `docs/05-tech-spec.md` §4.1 | 主应用、页面、CSS、service、测试文件超阈值即拆分；批量结果列表 / 导出按钮优先做 feature / component |
| WSG-005 | 验证入口 | P1A/P1B 已有 `npm.cmd run build` + Chrome / Edge 900px smoke；P1.5A 需补 TC-P1-015/016 的后端 tests + Chrome smoke | `docs/08-dev-plan.md`、`docs/09-verification.md` | Sprint-16/17 完成后写入 TC-P1-015/016 证据；P2 UI smoke 仍须另跑 TC-P2-WSG-001 与 TC-P2-UI-001..005 |
| WSG-006 | UI 链路对齐 | UI inputs → reference analysis → prototype → experience brief → frontend-interaction → 08/09 草案已闭合为候选链 | `docs/design/frontend-experience-brief.md`、`docs/design/frontend-interaction.md` | P1.5A 仅复用现有导入 / 文档详情 / 工具栏模式；Phase2A/B 候选体验未确认前不编码 |

## 2. 子系统 / 模块划分（完整框架）

| MOD-ID | 子系统 | 职责 | 输入 → 输出 | 边界（不负责） | 关联组件 | 阶段 | 设计状态 | 实现状态（Phase1 Demo） | 详细设计 |
|---|---|---|---|---|---|---|---|---|---|
| MOD-001 | 空间与权限 | 多空间隔离、权限分级、查询时过滤 | 用户 / 空间成员关系 → 过滤后可见数据 | 不负责文档内容解析 | COMP-002 / 003 | [P1] | P1-已实现 | PostgreSQL 成员 / 文档权限过滤已接入；内存 `DemoRepository` 仅作单测 fake | docs/design/permissions.md |
| MOD-002 | 文档管理 | CRUD、行内编辑、版本历史 | 文档字段 → 持久化文档 / 版本 | 不负责检索 / 导入 | COMP-002 / 003 | [P1] | P1-已实现 | PostgreSQL 文档 / 版本持久化已接入 | （逻辑简单，见 06/07） |
| MOD-003 | 内容导入 | `.md` / `.txt` 单文件与批量 / 文件夹导入、切块入库；真实 Word/PDF 解析、OCR 留后续 | 文件 / 文件夹 → 文档 + 切块 + 逐条导入结果 | 不负责检索 / 问答；不在 P1.5A 建真实目录表 | COMP-001 / 002 / 003 / 004 | [P1] | P1.5A-已实现 | `.md`/`.txt` 已提取文本导入 + 切块入 PG；批量 / 文件夹导入已随 Sprint-16 完成；真实 Word/PDF/OCR 仍降级（RG-003） | docs/design/ingestion.md |
| MOD-004 | 检索问答 | 全文搜索、RAG（向量+全文+引用） | 查询 → 结果 + 来源 | 不负责导入解析 | COMP-002 / 003 / 004 | [P1] | P1-条件通过（hybrid search + RAG） | search=substring + `ts_vector` SQL 候选 + pgvector 语义召回；RAG=关键词 + pgvector 向量召回 + GLM LLM | docs/design/rag-retrieval.md |
| MOD-005 | 术语管理 | 空间级术语表、文档术语识别、问答口径对齐 | 术语 → 口径注入 | 不负责问答生成 | COMP-002 / 003 / 004 | [P1] | P1-已实现 | PostgreSQL 术语存储已接入；术语定义已注入真实 LLM Prompt | docs/design/term-management.md |
| MOD-006 | 个人知识组织 | 标签体系、内部链接 + 反向链接、快速录入索引条目；时间轴 / 关联图留 Phase2B / 后续 | 文档 + 标签 / `[[文件名]]` / 轻量条目 → 标签聚合视图、反向链接索引、可检索条目 | 不负责文档内容生成 / 问答；不负责团队协作 | COMP-001 / 002 / 003 | [P2] | P2-已实现（TC-P2-LINK/TAG/QUICK-001 通过） | — | 导航交互见 docs/design/frontend-interaction.md §3 |
| MOD-007 | 导出交付与写作增强（协作 / 推送延后） | 单文档 `.md` 下载、空间 ZIP 导出备份、单文档 PDF；Phase2B AI 润色 + 写作引用 | 文档 / 空间 → `.md` / ZIP / PDF；选中文本 / 写作上下文 → 润色建议 + 引用块 | 不负责实时协作（延后）、不负责检索 / 问答；P1.5A 不做 PDF | COMP-001 / 002 / 003 / 004（润色走 LLM） | [P1] / [P2] | P1.5A-已实现；P1.5B PDF RG-006 Go、待实现；Phase2B AI 已实现 | `.md` / ZIP 已随 Sprint-17 完成；PDF 可进 Sprint-18；AI 润色已闭环 | docs/design/export-delivery.md；docs/design/ai-polish.md |
| MOD-008 | 存量接入 | Vault 挂载、录音转写、飞书同步 | — | — | — | [愿景] | 骨架 | — | 待技术验证 |
| MOD-009 | 情报分析（i2 精神） | 关联图↔时间轴联动、路径推理、人物网络、矛盾检测、证据地图、信号追踪 | — | — | — | [愿景] | 骨架 | — | docs/design/intelligence-analysis.md |
| MOD-010 | 情报交付 | 对外只读简报、管理层摘要、分析包 A Kit | — | — | — | [愿景] | 骨架 | — | 待技术验证 |

## 3. 架构决策与取舍（ADR）

> 与 05 互补：这里讲"为什么"，05 讲"具体版本"。决策状态用 §7.1 横切状态词典；决策已采纳但实现未接入的，状态标「已确认（目标）」。

- **PostgreSQL + pgvector**：关系数据与向量检索一体，Phase1 少引一个独立向量库（Milvus/Qdrant），降低部署与一致性成本。
- **DB 权威运行态 + 衍生数据可重建**：LUMEN 不采用 `.md` / frontmatter 唯一权威模型；DB 承载运行态业务事实，chunks / embedding / 反链索引 / 计数等派生数据必须可从权威文档内容与元数据重建（见 `docs/decisions/ADR-010-db-authority-derived-data-rebuildability.md`）。
- **AI 调用边界**：LLM 不绑单一闭源 SDK，走 OpenAI 兼容接口；Embedding Phase1 本机运行 `bge-small-zh`（512 维），通过 adapter 保留迁移到内网 Embedding 服务的空间。
- **导入流水线收敛异构格式**：Word / PDF / 图片统一走"提取纯文本 → 切块 → Embedding"，检索侧只面对一种数据形态。
- **权限下沉到 SQL / 检索层**：空间隔离 + 文档权限在数据查询时过滤，不依赖应用层记忆，防漏过滤。
- **子系统拆分**：RAG / 导入 / 权限各自非平凡且可独立演进，单独成 docs/design/；文档 CRUD 简单，不单列。

### 3.1 ADR 矩阵

| ADR | 决策 | 状态 | 适用 Phase | 理由 | 替代方案 | 取舍影响 | 验证方式 |
|---|---|---|---|---|---|---|---|
| ADR-001 | PostgreSQL + pgvector 一体化存储 | 已接入（Sprint-8；RG-001 Go） | Phase1+ | 关系数据与向量检索一体，少引独立向量库，降部署与一致性成本 | Milvus / Qdrant 独立向量库 | 少一个组件、一致性成本低；强依赖 pgvector 扩展与 Docker | 已落地（lumen-pg + PgRepository + 向量召回） |
| ADR-002 | AI 走 OpenAI 兼容接口 + 本机 Embedding | 已接入（Sprint-7/8；RG-002/004 Go） | Phase1+ | LLM 不绑单一闭源 SDK；Embedding 本机运行并保留迁内网服务空间 | 绑定单一闭源 LLM SDK | 厂商解耦、可迁内网；需 adapter 适配 | LLM=GLM 中转、Embedding=bge-small-zh |
| ADR-003 | 导入流水线收敛异构格式为文本→切块→Embedding | 已确认（目标；当前仅 `.md`/`.txt`） | Phase1+ | 检索侧只面对一种数据形态，解析复杂度集中于导入 | 各格式独立检索路径 | 检索侧统一数据形态；解析复杂度集中于导入 | TC-P1-009 / 010（09 §2） |
| ADR-004 | 权限下沉到 SQL / 检索层（查询时过滤） | 已确认（当前内存等价实现） | Phase1+ | 空间隔离 + 文档权限在查询时过滤，不依赖应用层记忆，防漏过滤 | 应用层记忆当前空间 | 防漏过滤、安全边界强；强依赖查询层正确性 | TC-P1-001 / 003（09 §2） |
| ADR-005 | RAG / 导入 / 权限独立成 docs/design/ | 已确认 | Phase1+ | 三者非平凡且可独立演进，单列详细设计便于维护 | 全部并入 04 | 子系统可独立演进；多份详细设计需维护 | `docs/design/*` 已存在 |
| ADR-006 | Phase1.5B PDF 导出方案 | 已采用（ReportLab 首版） | Phase1.5B | 单文档需可排版导出 PDF（REQ-027），但不得阻塞个人可用 Alpha | WeasyPrint / 浏览器打印 | ReportLab 在 Windows + Python 3.14 下依赖链轻，中文样例已通过；仍需 Sprint-18 实现权限 / 失败态 / 清理策略 | RG-006 Go（2026-08-04） |
| ADR-007 | 标签 + 反向链接索引用 PG 关系表 + `[[wikilink]]` 解析 | 已采用 / 已实现 | Phase2A | 复用现有 PG，少引图数据库（REQ-012 / 026） | 图数据库 / 全文索引 | 关系表 JOIN 成本；解析规则已按 Phase2A 最小版收敛 | TC-P2-TAG-001 / TC-P2-LINK-001 通过 |
| ADR-008 | Phase1.5A `.md` / ZIP 导出备份走标准文件流 | 已实现 | Phase1.5A | 个人可用 Alpha 需要可迁出、可备份；标准库 ZIP 风险低、不引重依赖（REQ-038 / U-43） | 直接做 PDF / 数据库整库导出 | 快速落地且权限边界简单；不保留富格式排版 | TC-P1-016 通过 |
| ADR-009 | Phase1.5A 批量 / 文件夹导入以标题相对路径保留目录感 | 已实现 | Phase1.5A | 用户要快速放入一批资料；不建真实目录表可避免 DB 迁移与范围扩张（REQ-037 / SC-007） | 新增 folder 表与真实目录树 | 低风险、快落地；后续若做真实目录需迁移 | TC-P1-015 通过 |
| ADR-010 | DB 权威运行态 + 衍生数据可重建 | 已接受 | Phase1+ | 保留 PostgreSQL 作为权限 / 版本 / 文档权威，同时要求 chunks / embedding / 反链索引 / 计数等派生数据可从权威内容与元数据重建 | `.md` / frontmatter 唯一权威；DB 全权威不设重建约束 | 避免多头权威并降低索引漂移 / 灾备风险；不声明已实现重建脚本 | `docs/decisions/ADR-010-db-authority-derived-data-rebuildability.md`；06 §1.1 |

## 4. 部署 / 运行拓扑约束

> 受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束。Demo 本机优先；资源不足再上公司服务器。

- 进程 / 端口（Demo）：FastAPI 后端 `uvicorn` :18000；React 前端 Vite :5173；PostgreSQL+pgvector `lumen-pg` :5432（Docker Compose）。

- 本机单机（Demo 默认）：React 前端 + FastAPI（api/service/model 三层）+ Docker Compose PostgreSQL+pgvector（lumen-pg）+ 本机 `bge-small-zh` Embedding + 公司内网 GLM LLM 中转。内存 `demo_repository` 保留为单测 fake；真实 Word/PDF 解析、OCR 与 search 向量化仍降级 / 后续。
- 数据边界：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档，真实文档必须显式标注来源 / 敏感级别；RAG / 术语场景优先避免发送到外部模型，**Phase2B AI 润色（REQ-014）允许真实片段外发（风险已接受，见 §1.1 / `docs/05-tech-spec.md` RG-008）**。
- 资源边界：Demo 峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；允许本机安装项目所需依赖与镜像。
- 远程 / 公司服务器边界：Phase1 Demo 暂不使用公司服务器；若本机 Embedding 在导入规模、响应时间或检索质量上不够用，再申请内网 Embedding / reranker 服务。
- 重资源项归属：禁止本机运行大参数 LLM / 大型 Embedding / reranker；`bge-small-zh` 本机 Embedding 属 Phase1 可接受范围。

## 5. 关键流程与权限过滤

> 本节固定 Sprint-1 权限底座的架构边界：空间、文档权限、搜索和 RAG 必须共用同一套权限过滤原则，禁止仅在前端隐藏或仅靠业务层记忆当前空间。

### 5.1 登录与空间切换（Flow-001）

> **Flow-001 登录与空间切换**：成功（签发 token + 切换签新 token）｜异常（账号无效 → 4001）｜权限拒绝（非空间成员切换 → 4003）｜降级（内存 Demo 账号，无真实账号系统）｜关联 API-001/002/003、TC-P1-001/002。

```mermaid
sequenceDiagram
  participant Browser as React 前端
  participant API as FastAPI API
  participant Auth as 权限 service
  participant DB as PostgreSQL

  Browser->>API: POST /api/auth/login
  API->>Auth: 校验 Demo 用户
  Auth->>DB: 读取用户可访问 spaces
  DB-->>Auth: user_id + 默认 current_space_id
  Auth-->>API: 签发 Bearer token(user_id,current_space_id,exp)
  API-->>Browser: token + 当前空间
  Browser->>API: POST /api/spaces/switch(space_id)
  API->>Auth: 校验用户是否为空间成员
  Auth->>DB: 查询 space_members
  DB-->>Auth: 成员关系有效
  Auth-->>API: 签发新 token(current_space_id=目标空间)
  API-->>Browser: 新 token
```

### 5.2 文档访问、搜索与 RAG 统一过滤（Flow-002）

> **Flow-002 文档访问 / 搜索 / RAG 统一过滤**：成功（成员校验 → 过滤 → 可见结果；RAG 走关键词 + pgvector 向量召回 + GLM LLM）｜异常（token 无效 → 4001）｜权限拒绝（非成员 → 403 / 空；私有文档对他人 → 空）｜降级（LLM 可切 Mock；search 向量化未启用）｜外部不可用（明确 Mock，不编造）｜关联 API-004~010、TC-P1-003~008。

```mermaid
flowchart TB
  req[API 请求<br/>Bearer token] --> ctx[解析 user_id + current_space_id]
  ctx --> membership{是否为空间成员?}
  membership -- 否 --> deny[403 / 空结果]
  membership -- 是 --> op{操作类型}

  op --> doc[文档 CRUD / 行内编辑 / 版本]
  op --> search[全文搜索]
  op --> rag[RAG 问答]

  doc --> docFilter[SQL 过滤<br/>space_id = current_space_id<br/>且权限允许]
  search --> searchFilter[全文 / chunk 查询过滤<br/>space_id + visibility + owner]
  rag --> retrieve[检索候选 chunk]
  retrieve --> ragFilter[构造 Prompt 前再次过滤<br/>仅当前空间可见 chunk]
  ragFilter --> term[注入当前空间术语<br/>空间术语优先于全局术语]
  term --> answer[答案带来源]

  docFilter --> result[返回可见结果]
  searchFilter --> result
  answer --> result
```

### 5.3 权限实现原则

- **空间优先**：所有查询先限定 `current_space_id`，再判断文档级权限。
- **私有文档**：仅作者可见；不得进入同空间其他成员搜索结果、RAG 候选 chunk 或问答来源。
- **团队共享**：同空间成员可见；跨空间默认不可见。
- **外部只读**：Phase1 仅表达只读权限类型，不实现跨空间推送；跨空间推送属于 P2。
- **双层过滤**：SQL / 检索层必须过滤；RAG 构造 Prompt 前必须再次过滤候选 chunk。
- **前端不可作为权限边界**：前端隐藏入口只改善体验，不作为安全判断依据。

### 5.4 Phase1.5A/B 与 Phase2A/B 关键流程（骨架）

> Phase1.5A 批量 / 文件夹导入与 `.md` / ZIP 导出备份已闭合；Phase2A 标签、内链 / 反链与快速录入已闭合。Phase1.5B PDF 已通过 RG-006，可进入 Sprint-18；Phase2B 团队 MVP 候选待对应阶段再补详细设计。所有导出 / 检索 / 写作候选均沿用 Flow-002 权限过滤，不得以前端隐藏替代后端过滤。

- **Flow-003 标签浏览与内部链接跳转**（REQ-012 / 026，Phase2A）：按标签聚合 → 点击 `[[文件名]]` 跳转 / 反向链接面板；权限沿用 Flow-002 过滤。
- **Flow-004 快速录入索引条目**（REQ-025，Phase2A）：轻量条目（标题 / 来源 / 摘要）→ draft / 新文档 / 追加文档 → 索引入库参与检索；走 Flow-002 过滤。
- **Flow-005 AI 润色与写作引用**（REQ-014，Phase2B）：选中文本 → LLM 润色建议 / 检索引用块插入；复用 ADR-002 LLM adapter，候选 chunk 按权限过滤。
- **Flow-006 批量 / 文件夹导入**（REQ-037，Phase1.5A）：多文件 / 文件夹选择 → 逐文件读取 `.md` / `.txt` → 标题保留相对路径前缀 → 成功项入库并切块 → 逐条返回成功 / 失败 / 同名跳过结果；不建真实目录表。
- **Flow-007 `.md` / ZIP 导出备份**（REQ-038，Phase1.5A）：单文档详情 → 下载当前版本 `.md`；空间工具栏 → 查询当前用户可见文档 → 标准 ZIP 打包 `.md` → 下载；不可见文档不进入 ZIP。
- **Flow-008 单文档导出 PDF**（REQ-027，Phase1.5B）：文档版本 → 渲染 → PDF（ADR-006 已采用 ReportLab 首版路线）；RG-006 已 Go，后续实现仍必须受文档权限约束，导出库不可用时返回失败态，不生成坏文件。
- **Flow-009 时间轴 / 关联视图候选**（REQ-013 / REQ-024，Phase2B / 后续）：文档时间字段 / 候选事件 → 时间轴与密度提示；关联图仅保留骨架，不进入 Phase2A 首批。

## 6. REQ / 功能 → 模块 / Flow 追溯矩阵

> 补 MOD-ID / Flow-ID / 覆盖状态列（对照 `ai/doc-standards/04-architecture.md` §4 追溯链 `REQ/NFR → Phase → COMP-ID → MOD-ID → Flow-ID → design/API/DB/TC`）。COMP 见 §1.2，MOD 见 §2，Flow 见 §5。

| REQ | Phase | COMP-ID | MOD-ID | Flow-ID | 下游设计 | 覆盖状态 |
|---|---|---|---|---|---|---|
| REQ-001 / 002 / 003 | [P1] | COMP-002 / 003 | MOD-001（+ MOD-002 / 004） | Flow-001 / 002 | `docs/design/permissions.md`、`docs/06-db-design.md`、`docs/07-api-spec.md` | P1-已实现（PG 权限过滤） |
| REQ-004 / 005 / 006 | [P1] | COMP-001 / 002 / 003 | MOD-002 | Flow-002 | `docs/06-db-design.md`、`docs/07-api-spec.md` | P1-已实现（PG 文档 / 版本） |
| REQ-007 / 008 | [P1] | COMP-002 / 003 / 004 | MOD-004 | Flow-002 | `docs/design/rag-retrieval.md`、`docs/06-db-design.md`、`docs/07-api-spec.md` | P1-部分实现（search 关键词·PG；RAG 向量 + LLM） |
| REQ-009 / 010 | [P1] | COMP-002 / 003 / 004 | MOD-003（+ MOD-004） | Flow-002 | `docs/design/ingestion.md`、`docs/06-db-design.md`、`docs/07-api-spec.md` | P1-部分实现（`.md`/`.txt`；真实 PDF/OCR 后续） |
| REQ-011 | [P1] | COMP-001 / 002 | 全 P1 模块（横切） | Flow-001 / 002 | `docs/08-dev-plan.md` Sprint-6、`docs/09-verification.md` | P1-已实现（桌面 smoke） |
| REQ-036 | [P1] | COMP-002 / 003 / 004 | MOD-005（+ MOD-004 / 002） | Flow-002 | `docs/design/term-management.md`、`docs/06-db-design.md`、`docs/07-api-spec.md` | P1-已实现（PG 术语 + LLM 注入） |
| REQ-037 | [P1] | COMP-001 / 002 / 003 / 004 | MOD-003 | Flow-006 | `docs/08-dev-plan.md` Sprint-16、`docs/07-api-spec.md` API-029、`docs/09-verification.md` TC-P1-015 | Phase1.5A-已实现（TC-P1-015 通过） |
| REQ-038 | [P1] | COMP-001 / 002 / 003 | MOD-002 / 007 | Flow-007 | `docs/08-dev-plan.md` Sprint-17、`docs/07-api-spec.md` API-030、`docs/09-verification.md` TC-P1-016 | Phase1.5A-已实现（TC-P1-016 通过） |
| REQ-027 | [P1] | COMP-001 / 002 / 003 | MOD-007 | Flow-008 | ADR-006、`docs/08-dev-plan.md` Sprint-18、`docs/09-verification.md` TC-P1-017 | Phase1.5B-候选·RG-006 Go，待实现 |
| REQ-012 / 025 / 026 | [P2] | COMP-001 / 002 / 003 | MOD-006 | Flow-003 / 004 | 导航交互见 `docs/design/frontend-interaction.md` §3 | P2-已实现（TC-P2-LINK/TAG/QUICK-001 通过） |
| REQ-013 / REQ-024 | [P2] | COMP-001 / 002 / 003 | MOD-006 | Flow-009 | `docs/design/timeline.md`（Phase2B 建） | Phase2B 首批·第二 slice（紧随 REQ-014）；骨架，待设计细化 |
| REQ-014 | [P2] | COMP-001 / 002 / 003 / 004 | MOD-007 | Flow-005 | `docs/design/ai-polish.md`（Phase2B 建） | Phase2B 首批核心·后端已实现（MVP 级）；数据外发风险已接受（RG-008 Go）；UI 门禁待重跑 |
| REQ-015 / 016 / 017 | [P2] | — | MOD-007 | — | 后续 Phase 时细化 | 不进 Phase2B 首批 |
| REQ-018..023 / 028..035 | [愿景] | — | MOD-008 / 009 / 010 | — | 技术验证通过后细化 | 骨架 |

## 7. 待人工确认项

- Phase1.5A Sprint-16/17 已完成；若后续扩展真实目录表、长期导出产物或新依赖，必须先同步修订 `05/06/07/08/09` 与对应 design。
- Phase1.5B PDF 已通过 RG-006；可进入 Sprint-18 编码，但不得把技术样例误标为 REQ-027 / API-019 已实现。
- Phase2B 团队 MVP 候选（AI 润色 / 写作引用、时间轴候选）需重新确认范围、进入 / 退出标准、详细设计与 UI / WSG 门禁；Phase2A 已完成能力如需扩展，先同步修订 `06/07/08/09`。
