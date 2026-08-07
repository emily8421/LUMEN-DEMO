# 项目专属规则

> 本文件每个新项目都需要重新填写，不参与跨项目同步。
> 判断标准：一条规则换到另一个完全不同的项目上是否还成立——
> 不成立（涉及具体技术栈/具体功能/具体Phase定义）就属于本文件。
>
> 填写时机：§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪在生成 docs/03-08 **之前**填
> （作为约束）；§4 目录特例、§5 编码约定与禁区在审核 03-08 **之后**补。

## 0. 项目标识

项目名称：LUMEN（KnowledgeBase Demo）
代号/缩写：lumen（数据库表前缀 `lumen_`，后端包名 `lumen`）

## 1. Phase边界

> **项目收尾（2026-08-07）**：LUMEN-DEMO demo 目标已达成——Phase1-2D 全系列交付、`docs/09-verification.md` §6 风险全清、产品红线（不编造 / 不越权 / 不泄露）未破坏。进入维护态；下一阶段未定义。成果总结见 `docs/research/2026-08-07-project-closure-summary.md`；后续若重启方向见该文 §6。

当前阶段：**Phase2D（账户与多人权限·团队验证）已完成（2026-08-07 收口：Sprint-26/27/28 三 slice 全部验收通过，退出标准达成；Sprint-27 P2 两项 + Sprint-28 偏差经用户确认全接受、留后续；不升 Phase，下一阶段范围待用户定义）**；Phase1 Demo + Phase1.5A 可用性 + Phase1.5B PDF 导出 + Phase2A（个人知识组织）+ Phase2B（团队 MVP）+ Phase2C（本地知识源接入）均已完成；**Phase2C 已完成（2026-08-06，Sprint-23C TC-P2-VAULT-001 通过 / PR#108 v2.0.0）**——前次"待实现"系 Wave 1 收口未回写，本次修正；数据外发风险已接受（RG-008 Go）；**Phase2D Sprint-26 账号体系基础已完成（2026-08-07）：注册 / 凭证登录 bcrypt / 登出 / `lumen_users` 扩列 / 统一 `get_current_user` / 不透明 token + `lumen_sessions` / 登录·注册页；demo 模式由仓储类型决定（PG 强制凭证 / 内存允许 demo）+ 物理隔离护栏（`LUMEN_ENABLE_DEMO_AUTH` 未实现，见 accounts-auth §15）；**Sprint-27 权限多人化已完成（2026-08-07，TC-P2-ACC-001 通过 / PR#114）**；**Sprint-28 角色分层 + 用户管理 + 团队空间加入已完成（2026-08-07，REQ-045..047 / TC-P2-ACC-002 / PR#117 v3.1.0，见 accounts-auth §18）**；RG-010 FileSystemObserver Go（2026-08-06）解锁 Wave 3 自动监听候选；Word-PDF 解析 / zhparser 仍留后续候选

> 双维度（global-rules §8.1）：每个阶段同时声明**功能范围**与**交付物形态**，两者正交、不得混用。
- **功能范围**：`[P2]`（Phase2A 已完成：REQ-026 内链/反链、REQ-012 标签、REQ-025 快速录入；**Phase2B 已完成：REQ-014 AI 润色/写作引用（首批核心）、REQ-013/024 时间轴（第二 slice）、REQ-039 文档目录树（第三 slice）**；**Phase2C 已完成：REQ-018 Vault 兼容模式 B（仅本地挂载，浏览器 File System Access，Sprint-23C TC-P2-VAULT-001 通过）**；**Phase2D 已完成（2026-08-07 收口）：Sprint-26 账号体系基础已完成（REQ-040..，注册 / 凭证登录 / 登出会话）；Sprint-27 权限多人化已完成（REQ-043/044，owner_id 跨用户过滤 + 私有按 owner 过滤 + 跨用户隔离回归，TC-P2-ACC-001 通过）；Sprint-28 角色分层 + 用户管理 + 团队空间加入已完成（REQ-045..047，TC-P2-ACC-002 通过）**）；`[P1]`（REQ-001..011、REQ-036、REQ-037/038 已完成；**REQ-048 术语领域树为维护态增强·已实现（2026-08-07，migration 017 + API-051..053 + terms 扩字段，TC-P2-TERM-001 通过）**；REQ-027 PDF 导出已随 Sprint-18 完成 API-019 / TC-P1-017），见 `docs/03-prd.md` §3 路线图
- **交付物形态**：**个人知识组织**（Phase2A 已完成）→ **团队 MVP**（Phase2B 已完成）→ **本地知识源接入 MVP**（Phase2C 已完成，REQ-018 模式 B）→ **团队验证**（Phase2D 已完成 2026-08-07 收口：Sprint-26 真实多用户账号体系已完成；Sprint-27 权限多人化已完成；Sprint-28 角色分层 / 用户管理 / 团队空间加入已完成）— Phase2C 让涉隐私本地库可仅本地挂载浏览/搜索、不上传；Phase2D 把 Demo 占位账号侧（无密码 / seed 用户 / 手撸 token）升级为真实多用户账号体系，为团队验证打基础；**保留产品红线**（库外问答回复"未找到"、不编造、权限不泄露；AI 润色数据外发护栏见 §2.5 / `docs/05-tech-spec.md` RG-008；凭证安全与跨用户隔离护栏见 `docs/design/accounts-auth.md`）

> 阶段划分的唯一来源是 `docs/03-prd.md` §3 路线图；本节是"当前阶段指针"。
> 升阶段时只改本节指针 + 在设计文档原位补充新阶段细节（见 global-rules §8），不重写需求。

允许（Phase1 / Phase1.5A / Phase2A / Phase2B / Phase2C 已完成能力 + Phase2D 已立项范围 + 后续候选）：
- 后端 Python + FastAPI；存储 PostgreSQL + pgvector；LLM 走 OpenAI 兼容 API；Embedding 本机运行 `bge-small-zh`（512 维）；前端 React
- 双空间隔离 + 文档权限三级（私有 / 团队共享 / 外部只读）
- Markdown 文档 CRUD + 全文搜索 + RAG 问答（带来源引用）+ 行内编辑 / 版本历史
- 内容导入：Phase1 Demo 支持 `.md` / `.txt` 已提取文本导入；真实 Word / PDF 解析与图片 / 白板照片 OCR 按 `docs/05-tech-spec.md` / `docs/09-verification.md` 降级边界留后续真实化
- Phase1.5A 个人可用候选：批量 / 文件夹 `.md` / `.txt` 导入、单文档 `.md` 下载、空间 ZIP 导出；优先于 Phase2 编码
- Phase1.5B 个人增强：单文档 PDF 导出已随 Sprint-18 完成（API-019 / TC-P1-017）；真实 Word/PDF 文本提取、zhparser 中文分词增强仍为后续候选，需 RG / 选型 / 中文样例验证
- 空间级术语表 + 文档术语识别 + 问答口径对齐
- **术语领域树（REQ-048，2026-08-07 维护态增强）**：空间术语按内容领域树组织（`lumen_term_categories`）+ 内容分类 + 来源追溯 + 全局术语固定区 + 阅读/编辑态分离；标签 CRUD 前端接线（API-027）
- 桌面端浏览器访问
- Phase2A 个人知识组织：内部链接 / 反向链接（REQ-026）、标签视图（REQ-012）、快速录入索引条目（REQ-025）均已完成；验收见 `docs/09-verification.md` TC-P2-LINK-001 / TC-P2-TAG-001 / TC-P2-QUICK-001
- **Phase2B 团队 MVP（已完成）**：AI 润色 / 写作引用（REQ-014，首批核心，API-028 / `lumen_ai_drafts`，数据外发护栏见 RG-008）；时间轴视图 + 密度热条（REQ-013/024，第二 slice，API-033）；文档目录树（REQ-039，第三 slice，API-034..038 / API-029 `preserve_structure`）；Sprint-19/20/21/22 见 `docs/08-dev-plan.md`
- **Phase2C 本地知识源接入（已完成）**：REQ-018 Vault 兼容模式 B「仅本地挂载」——浏览器 File System Access 句柄 + IndexedDB 持久化 + 本地索引/搜索 + 左侧文件管理器上下分区（上层 LUMEN DB / 下层本地挂载·未入库）+ 按需导入复用 API-029；仅本地挂载内容不上传服务端、不进团队 RAG（硬天花板）；RG-009 PoC Go；Sprint-23C 已完成（2026-08-06，TC-P2-VAULT-001 通过 / PR#108 v2.0.0）
- **Phase2D 账户与多人权限（已完成 2026-08-07 收口；Sprint-26/27/28 全部完成）**：① **Sprint-26 账号体系基础（已完成，TC-P2-AUTH-001 通过 / PR#112 v3.0.0）**——真实账号注册 / 凭证登录（bcrypt 哈希）/ 登出 / `lumen_users` 扩列（password_hash·email·status·last_login_at·failed_login_count·locked_until）/ 统一 `get_current_user`（收敛 13 router 复制）/ **不透明 token + `lumen_sessions` 会话表**（`secrets` 标准库，零新 token 依赖；撤销=删行；TTL+滑动续期+轮换）/ 基础登录·注册页 / 登录失败锁定 + 审计日志 + 密钥 env 注入；**demo 模式（`create_demo_token` + alice/kira/brightlite-member 无密码快速登录）由仓储类型决定：PG 仓储强制真实认证，内存仓储 `demo_repository` 允许 demo（`LUMEN_ENABLE_DEMO_AUTH` 未实现，见 accounts-auth §15）**；migration 014（`lumen_users` 扩列 + `lumen_sessions`），vault_mounts 顺延 015；② **Sprint-27 权限多人化（已完成，2026-08-07，PR#114，TC-P2-ACC-001 通过）**：owner_id 跨用户过滤全路径回归 + 私有文档按 owner 过滤（PRIVATE 仅 owner 可见）+ external 仅 owner 可写 + 跨用户隔离回归（REQ-043/044）；**Sprint-28 角色分层 + 用户管理 + 团队空间加入（已完成，2026-08-07，REQ-045..047，TC-P2-ACC-002 通过 / PR#117 v3.1.0）**：`lumen_users.role`（admin/member）+ admin 域用户管理后台（列表 / 改角色 / 禁用启用）+ space 域成员 CRUD（按 email 添加 / 改空间角色 / 移除）+ 前端用户管理页与空间设置成员管理（C-ROLE-001..004 已确认）；实现偏差见 §18.9；详见 `docs/design/accounts-auth.md` §17 / §18

禁止（Phase2D Sprint-26 账号基础范围外，不做）：
- 高级视图：关联图、问题热力矩阵、事件卡片因果展开、气泡图谱（**时间轴已随 Phase2B 首批解锁**；标签视图随 Phase2A 解锁）
- 跨空间文档推送（**外部知识源挂载 / Obsidian Vault 路径挂载已随 Phase2C 解锁**）
- 录音转文字入库、对外只读简报（临时链接）、文档包生成
- **REQ-016 多人实时协作（并发编辑）、移除用户 / 重置密码 / 邀请码与邀请链接（Sprint-28 明确不做，留候选 / 后续）；Sprint-26/27 范围外能力不进本阶段**
- AI 撰写管理层摘要（**AI 润色 / 写作侧边栏引用已随 Phase2B 首批解锁**）
- 情报分析（i2 精神）：关联图↔时间轴联动、路径推理、人物关系网络、矛盾检测、假设检验 / 证据地图、信号追踪——均为远期愿景（v18 新增支柱，见 docs/design/intelligence-analysis.md）
- 手机端 / 移动适配（demo 先桌面端）

当前阶段内进度：
- **Phase2B（团队 MVP）已完成（2026-08-05 收口）**：REQ-014 AI 润色 / 写作引用（首批核心，Sprint-19）、REQ-013/024 时间轴（第二 slice，Sprint-20）、REQ-039 文档目录树（第三 slice，Sprint-22）均通过验收；数据外发风险已接受（RG-008 Go）；导入规模修复（Sprint-23A，v1.7.1）与 wikilink 兼容修复（v1.7.4）已随补丁发布
- **Phase2C（本地知识源接入）已完成（2026-08-06）**：REQ-018 模式 B 仅本地挂载，Sprint-23C TC-P2-VAULT-001 通过 / PR#108 v2.0.0；Sprint-24 子树导入 UI（PR#109 v2.1.0）+ Sprint-25 帮助手册 L0+L1（PR#110 v2.2.0）+ RG-010 FileSystemObserver Go 已随 Wave 1 收口
- **Phase2D（账户与多人权限）已完成（2026-08-07 收口）**：Sprint-26 账号体系基础已完成（2026-08-07，TC-P2-AUTH-001 自动化 + 浏览器 smoke 通过，`docs/design/accounts-auth.md` / task-038 已落盘；PR#112 v3.0.0）；**Sprint-27 权限多人化已完成（2026-08-07，REQ-043/044 / TC-P2-ACC-001 / task-039，PR#114）**；**Sprint-28 角色分层 + 用户管理 + 团队空间加入已完成（2026-08-07，REQ-045..047 / TC-P2-ACC-002 / task-040，PR#117 v3.1.0；实现偏差见 accounts-auth §18.9）**
- 跨空间推送 / 多人实时协作 / 移动端仍愿景，不进 Phase2D 首批
- 远期愿景：问题热力矩阵、事件因果推理、对外简报、移动端——详见 docs/vision/product-vision.md（产品愿景叙事，不直接驱动 Phase 开发）

## 2. 技术栈约束

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

## 2.5 运行环境与资源约束

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

## 2.6 设计文档图表格式

> 设计类文档（`docs/04-07`、`docs/design/*`）的图表格式偏好；权威见 `ai/document-lifecycle-rules.md §13`（v1.22.0 新增）。

- **默认 `mermaid`**：GitHub 原生渲染、无需额外工具，优先用于架构图 / ER 图 / 流程图 / 状态机 / 交互·时序图等多数场景。
- **`plantuml` 备选**：复杂部署拓扑或时序图等 mermaid 表达力不足时可用；预览需本机或 CI 安装 plantuml，故仅作备选、不设为默认。
- 性质为「建议 + 默认」，图表服务于表达，不要求每类文档凑齐所有图（见 §13）。

## 2.7 UI 原型策略

> UI 型项目开发前原型策略；权威见 `ai/document-lifecycle-rules.md` UI 原型策略节与 `ai/doc-standards/ui-prototype-strategy.md`（模板 v1.39.0 引入）。

- 是否涉及可点击 UI：是（React 桌面端）
- 是否需要开发前可视化原型：已完成（Sprint-2 ~ Sprint-6）；后续新 UI Sprint 沿用「代码原型 + mock」策略，不引入 Figma 等外部设计工具
- 原型形式：代码原型 + mock 数据 + 浏览器 smoke / 截图证据
- 原型权威位置：`frontend/` 实现代码 + `docs/09-verification.md §5` 浏览器 smoke 记录；详细设计见 `docs/design/frontend-interaction.md §8`
- 覆盖范围：登录 / 空间切换 / 文档 CRUD / 行内编辑 / 版本恢复 / 导入 / 搜索 / RAG 问答 / 术语管理 / 桌面端集成（对齐 `docs/design/frontend-interaction.md §2.2` 全部 P1 页面）
- 未覆盖项：真实 PDF / Word 解析、图片 OCR（REQ-009 真实化移至 Phase2；REQ-010 OCR 移至后续阶段）；移动端（Phase1 禁止）
- 确认状态：已评审（降级口径）；Sprint-6 Edge Headless + Chrome 人工 smoke 通过（见 09 §5）
- 与文档关系：承接 `docs/design/frontend-interaction.md`（页面流 / 状态 / 接口依赖）、`docs/08-dev-plan.md`（Sprint）、`docs/09-verification.md`（验收 TC）；不新增需求 / 接口 / 验收目标

## 2.8 项目版本管理

> 模板仓的版本规则（「影响下游同步判断就 bump VERSION」，见同步来的 `MAINTAINERS.md` / `CONTRIBUTING.md`）面向模板维护者，对本项目不适用——本项目没有下游派生。本节定义 LUMEN-DEMO 自有的版本语义与递增规则。
> 版本入口：`VERSION`（项目自有版本）+ `CHANGELOG.md` 顶部「项目版本」段 + `CHANGELOG-PLAIN.md` 同版本大白话说明；模板继承版本独立记录在 `TEMPLATE-BASE.md`，不与项目版本混淆。

### 2.8.1 版本语义（三段式 vMAJOR.MINOR.PATCH）

- **PATCH**（v0.1.0 → v0.1.1）：bug 修复、文档修正、Demo 数据 / 配置调整、重构，不新增可演示能力、不改对外 API 契约。
- **MINOR**（v0.1.0 → v0.2.0）：Sprint 验收 / 里程碑交付、新增可演示能力、新增 API endpoint、Phase 内功能增强（如 Phase2A 内链 / 标签 / 快速录入）。默认向后兼容。
- **MAJOR**（v0.x → v1.0）：Phase 跨越（如 Phase2A 个人知识组织 → Phase2B 团队 MVP）、破坏性对外契约变更、首个真实场景 / 试点上线。

### 2.8.2 何时 bump

- 完成一个 Sprint 验收 / 里程碑 → 至少 **MINOR**。
- 合并了用户 / 试点可感知的能力变化 → **MINOR**。
- 纯修复 / 文档 / 配置 / 重构 → **PATCH**。
- Phase 跨越、破坏性变更、首上线 → **MAJOR**。
- 不强制每个 commit bump；同一里程碑内的多个改动聚合为一个版本发布。
- 纯探索原型、研究记录、未确认提案不触发版本递增。

### 2.8.3 发布动作

1. 更新根目录 `VERSION` 为新版本号（三段式 `vX.Y.Z`）。
2. 在 `CHANGELOG.md` 顶部「项目版本」段（即 `## 历史模板同步记录（保留）` 之上）新增 `## vX.Y.Z（YYYY-MM-DD）` 条目，概述本版交付并附 REQ / Sprint / TC 追溯。
3. 同步更新 `CHANGELOG-PLAIN.md` 顶部同版本 `## vX.Y.Z（YYYY-MM-DD）` 条目，用大白话解释本版实际改变；版本号、日期、交付范围必须与 `CHANGELOG.md` 对齐。
4. 版本递增属于状态变更，按 `ai/global-rules.md` / `ai/rules-core.md` 的写入确认规则先说明范围、风险与验证，AI 给建议、用户确认后再执行。
5. （可选）打 git tag `vX.Y.Z`；当前阶段不强制，不引入独立 release workflow。

### 2.8.4 CI 校验

`.github/workflows/project-check.yml` 在每次 PR / push 到 main 时校验：
- `VERSION` 符合三段式 `^v[0-9]+\.[0-9]+\.[0-9]+$`；
- `CHANGELOG.md` 顶部第一个 `## vX.Y.Z（` 标题等于 `VERSION`（确保项目版本在顶部且与 VERSION 一致）。
- `CHANGELOG-PLAIN.md` 顶部第一个 `## vX.Y.Z（` 标题也应等于 `VERSION`；若 CI 尚未自动校验，发布自检必须人工核对。
- 不做全文档降序检查——派生 CHANGELOG 顶部为项目版本（如 `v0.1.0`），下方接模板历史版本（`v1.47.1` 等，数值更大），降序不适用。

### 2.9 运行时版本锁定

> 对照 `ai/global-rules.md §5` 运行时版本锁定要求。本项目锁定前后端运行时版本，避免版本漂移导致构建 / 测试失败。

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

## 4. 目录规范的项目特例

无（遵循 global-rules.md §5 通用目录标准）。代码骨架与分层：

- `backend/`：分 api / service / model 三层；对外接口只进 api 层（待 04-architecture 确认）
- `frontend/`：React
- `tests/`：单元 + 集成 + 验收（对应 docs/09-verification.md）
- `scripts/`：导入 / 索引脚本
- `docker/`：本地起库与依赖编排

具体目录树待 04-architecture 落定后回填。

## 5. 编码约定与禁区

> Phase 级功能禁止见 §1，技术栈替代品禁止见 §2，本节只管代码层。
> 每条尽量具体可执行；没有则写“无”，不要留空占位。
> 本节标注「待回填」的条目待 docs/04–05 落定后确认，暂不虚构。

### 5.1 既有约定（新代码必须向其看齐）
- 命名：后端 snake_case（Python）、前端 camelCase（JS/TS）、组件 PascalCase
- 分层与目录：backend 分 api / service / model 三层，对外接口只进 api 层（待 04-architecture 确认）
- 既有模式：AI 调用统一走 OpenAI 兼容接口封装层（待 04/05 落基类后回填）
- 错误处理 / 日志：统一异常类型与日志格式（待 04/05 回填）

### 5.2 禁区（未经人工确认不得触碰）
- 不得擅改的文件 / 模块：ai/ 规则文件、docs/00–08 编号文档的编号与既有结构
- 不得擅自引入的依赖：任何新依赖须先确认（见 §2）
- 不得自行实现的功能：见 §1 禁止清单；docs/vision/product-vision.md / docs/01 中的功能点不等于已批准实现；阶段归属以 docs/03-prd.md §3 路线图为准，编码以 §1 当前阶段为准

## 6. 文档演进规则

> 已提升至 `ai/global-rules.md` §8（积累式：完整骨架 + 阶段标签 + 状态，只增不删），本节不再重复。
