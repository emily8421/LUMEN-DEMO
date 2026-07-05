# LUMEN · 团队知识库 Demo

> 面向中小企业的团队知识库 demo：把分散在聊天 / 邮件 / 旧文件 / 笔记里的团队知识，沉淀到一个**支持空间隔离与三级文档权限**、可被 **AI 检索与问答（带来源引用）**、支持**多格式导入（Word / PDF / OCR）**的知识库。
>
> 本项目派生自 [`ai-project-template`](https://github.com/emily8421/ai-project-template)，采用其「文档驱动开发」方法论——**先文档、后代码**；当前已下行同步至模板 **v1.30.1**。

## 它能做什么

- **文档驱动开发**：需求 / 架构 / 数据 / 接口 / 验证先落 `docs/`，再写代码；AI 只能实现 `docs/` 已定义的功能。
- **双维度分阶段交付**：每个阶段同时声明「功能范围 `[P1]/[P2]/[愿景]`」与「交付物形态 Demo/MVP/产品」，不把 Demo 声称为 MVP（见 `docs/03-prd.md §3`）。
- **空间隔离 + 三级文档权限**：私有 / 团队共享 / 外部只读，多空间既协作又隔离。
- **RAG 问答带来源引用**：文档切块 + 向量检索 + LLM 生成，答案附带出处；库外问答回复「未找到」、不编造（产品红线）。
- **多格式导入**：Word / PDF 文字提取 + 图片 / 白板照片 OCR 入库。
- **文档 CRUD + 版本历史 + 全文搜索**：行内编辑留版本，全文 + 语义检索定位历史约束。

## 快速开始

> 当前已进入 Phase1 编码：Sprint-2 ~ Sprint-5 主功能已完成；下一步是 Sprint-6 桌面端集成与验收。后端运行说明见 `backend/README.md`。

1. **读懂项目**：`docs/00-scenario.md`（背景 / 用户 / 场景）→ `docs/03-prd.md §3`（阶段路线图）→ 本 README「文档导航」。
2. **确认运行环境**：见 `docs/env/local-env.md`（本机 Win11 / i7 / 31.7GB / RTX 3050）与 `ai/project-rules.md §2.5` 资源约束。
3. **AI 协作入口**：任选 AI CLI（Claude Code / Cursor / Codex），入口文件均指向 `ai/index.md`；说一个场景意图即可（如「更新方法论」「修单个文档」），路由见 `ai/commands/README.md`。
4. **运行后端**：按 `backend/README.md` 安装依赖并启动 FastAPI；编码前先读 `ai/index.md` 列出的全部规则。

## 当前状态

- **阶段**：Phase1（功能范围 `[P1]` · 交付物形态 **Demo**）——Sprint-2 ~ Sprint-5 主功能已完成并推送，包含前端文档编辑器、降级文本导入、全文搜索、降级 RAG 问答、前端搜索 / 问答 UI、术语管理与问答口径对齐；下一步是 Sprint-6 桌面端集成与验收。
- **演进路线**：Phase1 **Demo**（当前）→ Phase2 **MVP** → 远期愿景 **产品**；双维度（功能范围 + 交付物形态）总览见 `docs/03-prd.md` §3。
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
| 解析 / OCR | Word / PDF 文字提取 + OCR（建议 PaddleOCR） |

> 技术约束与禁区见 `ai/project-rules.md` §1（Phase 边界）、§2（技术栈）、§2.5（运行环境与资源约束）、§5（编码约定）。

## 运行环境

> 本机环境与资源约束见 `docs/env/local-env.md`（由 `scripts/collect-env.ps1` 采集）；约束决策见 `ai/project-rules.md` §2.5。

- 本机：Windows 11 / i7-12650H（10C16T）/ 31.7GB 内存 / RTX 3050 6GB；Docker 可用。
- Demo 默认本机运行（Docker Compose 起 PostgreSQL+pgvector + FastAPI + React）；Embedding 本机运行 `bge-small-zh`（512 维），LLM 走公司内网中转 / 外部 OpenAI 兼容 API 或明确 Mock。
- 数据默认使用已标注的虚构 Demo 数据；可按需导入部分真实团队文档，但需标注来源 / 敏感级别并优先避免发送到外部模型。
- 允许本机安装项目所需依赖与镜像；Demo 资源软上限为峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB。
- 具体边界（联网 / 装依赖 / 公司服务器 / 降级 Mock）：见 `docs/env/local-env.md` 人工确认项。

## 验证方式

> 验证计划与 REQ→用例追溯见 `docs/09-verification.md`；本机资源验证见其 §4。

- 单元 / 集成 / 验收测试覆盖 REQ-001..011（Phase1）；数据夹具：`nova-internal` / `brightlite-team` 双空间 + 三级权限。
- 当前自动验证：`.venv\Scripts\python.exe -m unittest discover -s tests/backend -v`、`.venv\Scripts\python.exe -m compileall backend tests/backend`、`npm.cmd --prefix frontend run build`。
- 本机资源验证：Docker Compose 起库后确认 Demo 在内存 / 显存 / 磁盘软上限内运行。

## 项目结构

```text
LUMEN_demo_T2.1/
├─ docs/        # 项目事实：需求、设计、计划、验证（00-09 + design-* + vision/）
├─ ai/          # AI 行为规范（global-rules / project-rules / index）
├─ tasks/       # 任务单（按需启用）
├─ scripts/     # 模板脚本（sync-template.* / check-derived-sync.* / check-template.* / collect-env.ps1 / new-project.sh 等，含 PowerShell 入口）
├─ backend/     # FastAPI 后端；已有 auth / spaces / documents / import / search / query / terms Demo API
├─ frontend/    # React 前端；已有文档编辑、搜索 / 问答、术语管理 Demo UI
├─ docker/ tests/                       # 本地依赖编排与后端测试
├─ _proposals/                        # 模板优化提案起草区（回流模板仓库前临时存放）
└─ AGENTS.md / CLAUDE.md / .cursor/    # 各 AI 工具入口，指向 ai/index.md
```

## 模板关系与同步

本项目派生自 `ai-project-template`，方法论文件随模板演进（当前已同步至 **v1.30.1**）：

- **上行（改方法论）**：在[模板仓库](https://github.com/emily8421/ai-project-template)走「分支 → PR → 评审 → 合并」（见其 `CONTRIBUTING.md`），**不在本项目直接改 `ai/global-rules.md`**。
- **下行（同步到本项目）**：v1.6.8+ 走 PowerShell 入口 `powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit`（先 `--dry-run`），同步清单见 `template-sync.json`；同步后用 `powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1` 做派生边界验收。当前已同步至模板 **v1.30.1**，同步记录见 `sync-records/template-sync/2026-07-05-sync-template-v1.30.1.md`。
- git 工作流与账号说明见 `git-guide.md`。

---

*人物（Alice / Lily / Mark / Kira）、公司（Nova / Helios / BrightLite）、产品（LUMEN）均为虚构，仅用于场景演示。*

