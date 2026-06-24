# LUMEN · 团队知识库 Demo

> 面向中小企业的团队知识库 demo：把分散在聊天 / 邮件 / 旧文件 / 笔记里的团队知识，沉淀到一个**支持空间隔离与三级文档权限**、可被 **AI 检索与问答（带来源引用）**、支持**多格式导入（Word / PDF / OCR）**的知识库。
>
> 本项目派生自 [`ai-project-template`](https://github.com/emily8421/ai-project-template)（v1.6.9），采用其「文档驱动开发」方法论——**先文档、后代码**。

## 当前状态

- **阶段**：Phase1（MVP）——**设计完成、尚未编码**。`backend/ frontend/ docker/ tests/` 目前为空，待按 `docs/08-dev-plan.md` 的 Sprint 推进。
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
| AI | OpenAI 兼容 API（LLM + Embedding） |
| 前端 | React |
| 解析 / OCR | Word / PDF 文字提取 + OCR（建议 PaddleOCR） |

> 技术约束与禁区见 `ai/project-rules.md` §1（Phase 边界）、§2（技术栈）、§2.5（运行环境与资源约束）、§5（编码约定）。

## 运行环境

> 本机环境与资源约束见 `docs/env/local-env.md`（由 `scripts/collect-env.ps1` 采集）；约束决策见 `ai/project-rules.md` §2.5。

- 本机：Windows 11 / i7-12650H（10C16T）/ 31.7GB 内存 / RTX 3050 6GB；Docker 可用。
- Demo 默认本机运行（Docker Compose 起 PostgreSQL+pgvector + FastAPI + React）；LLM / Embedding 走外部 OpenAI 兼容 API。
- 具体边界（联网 / 装依赖 / 公司服务器 / 降级 Mock）：见 `docs/env/local-env.md` 人工确认项（部分待确认）。

## 验证方式

> 验证计划与 REQ→用例追溯见 `docs/09-verification.md`；本机资源验证见其 §4。

- 单元 / 集成 / 验收测试覆盖 REQ-001..011（Phase1）；数据夹具：`nova-internal` / `brightlite-team` 双空间 + 三级权限。
- 本机资源验证：Docker Compose 起库后确认 Demo 在本机资源范围内可运行（口径待确认）。

## 项目结构

```text
LUMEN_demo_T2.1/
├─ docs/        # 项目事实：需求、设计、计划、验证（00-09 + design-* + vision/）
├─ ai/          # AI 行为规范（global-rules / project-rules / index）
├─ tasks/       # 任务单（按需启用）
├─ scripts/     # 模板脚本（new-project.sh / sync-template.sh / check-template.sh / collect-env.ps1）
├─ backend/ frontend/ docker/ tests/   # 待编码（按 08-dev-plan Sprint 推进）
├─ _proposals/                        # 模板优化提案起草区（回流模板仓库前临时存放）
└─ AGENTS.md / CLAUDE.md / .cursor/    # 各 AI 工具入口，指向 ai/index.md
```

## 模板关系与同步

本项目派生自 `ai-project-template` v1.6.9，方法论文件随模板演进：

- **上行（改方法论）**：在[模板仓库](https://github.com/emily8421/ai-project-template)走「分支 → PR → 评审 → 合并」（见其 `CONTRIBUTING.md`），**不在本项目直接改 `ai/global-rules.md`**。
- **下行（同步到本项目）**：`bash scripts/sync-template.sh --commit`（先 `--dry-run`）。当前已同步至模板 v1.6.9。
- git 工作流与账号说明见 `git-guide.md`。

---

*人物（Alice / Lily / Mark / Kira）、公司（Nova / Helios / BrightLite）、产品（LUMEN）均为虚构，仅用于场景演示。*
