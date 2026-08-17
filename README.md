# LUMEN · 团队知识库 Demo

> 面向中小企业的团队知识库 demo：把分散在聊天 / 邮件 / 旧文件 / 笔记里的团队知识，沉淀到一个**支持空间隔离与三级文档权限**、可被 **AI 检索与问答（带来源引用）**、支持**降级文本导入（`.md` / `.txt`，Word / PDF / OCR 真实化留后续）**的知识库。
>
> 本项目派生自 [`ai-project-template`](https://github.com/emily8421/ai-project-template)，采用其「文档驱动开发」方法论——**先文档、后代码**；当前已下行同步至模板 **v1.60.2**。

## 它能做什么

- **文档驱动开发**：需求 / 架构 / 数据 / 接口 / 验证先落 `docs/`，再写代码；AI 只能实现 `docs/` 已定义的功能。
- **双维度分阶段交付**：每个阶段同时声明「功能范围 `[P1]/[P2]/[愿景]`」与「交付物形态 Demo/MVP/产品」，不把 Demo 声称为 MVP（见 `docs/03-prd.md §3`）。
- **空间隔离 + 三级文档权限**：私有 / 团队共享 / 外部只读，多空间既协作又隔离。
- **RAG 问答带来源引用**：文档切块 + 向量检索 + LLM 生成，答案附带出处；库外问答回复「未找到」、不编造（产品红线）。
- **内容导入**：Phase1 Demo 支持 `.md` / `.txt` 已提取文本入库；Word / PDF 文字解析与图片 / 白板 OCR 真实化留后续阶段。
- **文档 CRUD + 版本历史 + 全文搜索**：行内编辑留版本，全文 + 语义检索定位历史约束。

## 快速开始

> 当前已交付至 Phase2D（账户与多人权限）并收口（2026-08-07）：核心 UI 闭环、LLM adapter、PostgreSQL+pgvector、Embedding 与 RAG 向量召回、账号体系 / 权限多人化 / 角色与团队治理均已落地；真实 Word / PDF 解析与 OCR 仍为后续阶段。后端运行说明见 `backend/README.md`，阶段状态见 `ai/project-rules.md` §1。

1. **读懂项目**：`docs/00-scenario.md`（背景 / 用户 / 场景）→ `docs/03-prd.md §3`（阶段路线图）→ 本 README「文档导航」。
2. **确认运行环境**：见 `docs/env/local-env.md`（本机 Win11 / i7 / 31.7GB / RTX 3050）与 `ai/project-rules.md §2.1` 资源约束。
3. **AI 协作入口**：任选 AI CLI（Claude Code / Cursor / Codex），入口文件均指向 `ai/index.md`；说一个场景意图即可（如「更新方法论」「修单个文档」），路由见 `ai/commands/README.md`。
4. **运行后端**：按 `backend/README.md` 安装依赖并启动 FastAPI；编码前先读 `ai/index.md` 列出的全部规则。

## 当前状态

- **阶段**：**Phase2D（账户与多人权限 · 团队验证）已完成并收口（2026-08-07）**。Phase1（Demo）→ Phase1.5A/B（可用性 / PDF 导出）→ Phase2A（个人知识组织）→ Phase2B（团队 MVP）→ Phase2C（本地知识源接入）→ Phase2D（账户与多人权限）均已交付。**项目 demo 目标已达成（2026-08-07 评估收尾），进入维护态**——Phase1-2D 全系列交付、`docs/09-verification.md` §6 风险全清、产品红线未破坏；成果总结见 `docs/research/2026-08-07-project-closure-summary.md`。
- **最新维护交付**：维护态批5的 REQ-050 成员空间可见性与 REQ-051 忘记密码 / 登录交互已完成（v3.7.0，2026-08-09，PR #120；TC-P2-ACC-003 / TC-P2-AUTH-002 通过）。
- **演进路线**：Phase1 Demo → Phase2A 个人知识组织 → Phase2B 团队 MVP → Phase2C 本地知识源接入 → Phase2D 账户与多人权限（已完成）→ 远期愿景产品；双维度（功能范围 + 交付物形态）总览见 `docs/03-prd.md` §3，阶段状态见 `ai/project-rules.md` §1。
- **基准**：需求 / 架构 / 数据 / 接口 / 验证均已落在 `docs/`，是开发的唯一事实来源；阶段归属以 `docs/03-prd.md` §3 路线图为准。

## 文档导航（先读这些）

| 文档 | 内容 |
|---|---|
| `docs/00-scenario.md` | 项目背景、目标用户、典型场景 |
| `docs/01` → `02` → `03-prd` | 完整需求链；**03 §3 是阶段路线图（阶段标签唯一来源）** |
| `docs/04` ~ `07` | 架构 / 技术方案 / 数据库 / 接口设计 |
| `docs/08-dev-plan.md` | Sprint 开发计划（当前阶段） |
| `docs/09-verification.md` | 验证计划 + REQ→用例追溯 |
| `docs/design/` | 子系统详细设计（ingestion / permissions / rag-retrieval / intelligence-analysis） |
| `docs/vision/product-vision.md` | 产品愿景叙事（**不直接驱动开发**，是工程文档的输入） |

## 技术栈（Phase1）

| 层 | 选型 |
|---|---|
| 后端 | Python + FastAPI |
| 存储 | PostgreSQL + pgvector（关系 + 向量一体） |
| AI | LLM：OpenAI 兼容 API；Embedding：本机 `bge-small-zh`（512 维） |
| 前端 | React |
| 解析 / OCR | Phase1 当前为 `.md` / `.txt` 已提取文本导入；Word / PDF 文字提取 + OCR 为后续真实化项 |

> 技术约束与禁区见 `ai/project-rules.md` §1（Phase 边界）、§2（技术栈）、§2.1（运行环境与资源约束）、§5（编码约定）。

## 运行环境

> 本机环境与资源约束见 `docs/env/local-env.md`（由 `scripts/collect-env.ps1` 采集）；约束决策见 `ai/project-rules.md` §2.1。

- 本机：Windows 11 / i7-12650H（10C16T）/ 31.7GB 内存 / RTX 3050 6GB；Docker 可用。
- Demo 默认本机运行（Docker Compose 起 PostgreSQL+pgvector + FastAPI + React）；Embedding 本机运行 `bge-small-zh`（512 维），LLM 走公司内网中转 / 外部 OpenAI 兼容 API 或明确 Mock。
- 数据默认使用已标注的虚构 Demo 数据；可按需导入部分真实团队文档，但需标注来源 / 敏感级别；RAG / 术语场景优先避免发送到外部模型，Phase2B AI 润色（REQ-014）允许真实片段外发（风险已接受，见 `ai/project-rules.md §2.1` / `docs/05-tech-spec.md` RG-008）。
- 允许本机安装项目所需依赖与镜像；Demo 资源软上限为峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB。
- 具体边界（联网 / 装依赖 / 公司服务器 / 降级 Mock）：见 `docs/env/local-env.md` 人工确认项。

## 验证方式

> 验证计划与 REQ→用例追溯见 `docs/09-verification.md`；本机资源验证见其 §4。

- 单元 / 集成 / 验收测试覆盖 REQ-001..011、REQ-036（Phase1）；数据夹具：`nova-internal` / `brightlite-team` 双空间 + 三级权限。
- 当前自动验证（默认 unit，不连 PG）：`.venv\Scripts\python.exe -m pytest tests/backend -m "not integration" -v`、`.venv\Scripts\python.exe -m compileall backend tests/backend`、`npm.cmd --prefix frontend run build`。
- PG 集成测试（需独立 `lumen_test` 库 + 三 guard env，见 `tests/backend/pg_test_support.py`）：`LUMEN_ENV=test ALLOW_DESTRUCTIVE_TEST_DB=1 DATABASE_URL=postgresql://lumen:lumen@localhost:15432/lumen_test .venv\Scripts\python.exe -m pytest tests/backend -m integration -v`。
- 本机资源验证：Docker Compose 起库后确认 Demo 在内存 / 显存 / 磁盘软上限内运行。

## 项目结构

> 根目录按「**模板继承 / LUMEN 自身 / 本地临时**」三大区组织。模板继承部分路径由 `ai-project-template` 同步机制约定（**勿移动**，移动会破坏 `sync-template` 下行同步）；LUMEN 自身部分按类别归类。模板 vs 自身权威分界见 `template-sync.json`。

### 分区一：模板继承（随模板同步，勿改路径）

| 条目 | 定位 |
|---|---|
| `README.md` `AGENTS.md` `CLAUDE.md` `.cursor/` `.github/` | 项目入口 + AI 入口镜像（指向 `ai/index.md`） |
| `VERSION` `CHANGELOG.md` `CHANGELOG-PLAIN.md` `TEMPLATE-BASE.md` | 版本与变更记录（CI 校验 `VERSION`/`CHANGELOG`） |
| `CONTRIBUTING.md` `MAINTAINERS.md` `SOP.md` `INIT-PROMPT.md` `git-guide.md` | 模板方法论文档 |
| `template-sync.json` `sync-records/` | 同步清单与同步留痕 |
| `ai/` | AI 行为规范（规则路由 / 规则包 / commands / prompts / doc-standards；`ai/project-rules.md` 为项目专属实例） |
| `template-docs/` `upstream/` | 模板方法论 / 剖面 / scaffold 参考（非项目事实） |
| `_proposals/` `_archive/` | 模板优化提案起草区与归档（回流模板通道） |

### 分区二：LUMEN 自身（按类别归类）

| 类别 | 目录 | 说明 |
|---|---|---|
| **文档体系** | `docs/` | 00-09 主链（开发阶段过程文档：需求 → 设计 → 计划 → 验证）+ `docs/README.md` 三核心节点定位 |
| **图纸体系** | `docs/design/` | 子系统详细设计 + `DIAG-*` 图（用例图 / 领域模型 / 架构 / 交互 / 类图）+ 前端交互；清单见 `docs/design/00-index.md` |
| 辅助留痕 | `docs/research/` `docs/decisions/` `docs/vision/` `docs/inputs/` `docs/env/` `docs/meetings/` `docs/references/` | 调研 / 决策 / 愿景 / 输入 / 环境 / 会议 / 外部参考 |
| **代码与工程** | `backend/` `frontend/` `docker/` `tests/` `scripts/` `openapi/` | 被 03-09 驱动；后端运行入口见 `backend/README.md` |
| 任务 | `tasks/` | 任务单 |
| 治理记录 | `ai-records/` | AI 协作观察记录（token-hotspot / pitfalls 阶段汇总，入库级） |
| **知识沉淀（预留）** | `docs/knowledge/` | 可复用模块 / 模式 / 组件收集（待建，不占 00-09） |

### 分区三：本地临时（gitignored，不提交）

| 条目 | 说明 |
|---|---|
| `tmp/` `.tmp/` `.tmp-sprint28/` | 本地临时验证产物（待合并统一） |
| `.ai/` | 会话续接点 / token-hotspot / pitfall 本地记录 |
| `.venv/` `.*cache/` `.history/` `.env` | 环境 / 缓存 / 密钥 |

## 模板关系与同步

本项目派生自 `ai-project-template`，方法论文件随模板演进（当前已同步至 **v1.60.2**）：

- **上行（改方法论）**：在[模板仓库](https://github.com/emily8421/ai-project-template)走「分支 → PR → 评审 → 合并」（见其 `CONTRIBUTING.md`），**不在本项目直接改 `ai/global-rules.md`**。
- **下行（同步到本项目）**：自模板 v1.6.8 起走 PowerShell 入口 `powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit`（先 `--dry-run`），同步清单见 `template-sync.json`；同步后用 `powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1` 做派生边界验收。
- **当前同步状态**：已同步至模板 **v1.60.2**，同步记录见 `sync-records/template-sync/2026-08-09-sync-template-v1.60.2.md`。
- git 工作流与账号说明见 `git-guide.md`。

---

*人物（Alice / Lily / Mark / Kira）、公司（Nova / Helios / BrightLite）、产品（LUMEN）均为虚构，仅用于场景演示。*
