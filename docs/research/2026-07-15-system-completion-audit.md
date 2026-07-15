# 2026-07-15 系统架构与功能完成度审计

> **定位**：本文件是**只读审计留痕**（`docs/research/`），记录一次"系统现在启用能做什么 / 不能做什么"的核查结论。
> 它**不替代** `docs/00-09` 正式文档，也不新增 REQ / API / DB / 验收目标。
> 结论以**代码实际实现 + Git 事实 + `docs/09-verification.md` 验收**为准，严格区分"已验证/已启用"与"草案/Mock/降级/预留"（横切状态词典见 `ai/document-lifecycle-rules.md` §7.1）。

## 元信息

| 项 | 内容 |
|---|---|
| 审计日期 | 2026-07-15 |
| 审计范围 | `backend/`、`frontend/`、`tests/`、`docker/`、`scripts/` + `docs/03/05/08/09` |
| 方法 | 三路只读 agent 深挖代码（后端 / 前端 / 文档）+ Git 交叉验证 |
| 事实锚点 | Git HEAD `8740e2c`；`VERSION v1.47.1`；工作区干净；代码实际实现 |
| 当前阶段 | Phase1（交付物形态 **Demo**，非 MVP）—— 见 `ai/project-rules.md` §1、`docs/08-dev-plan.md` §0 |
| Phase1 closure | Conditional Go（Demo closure），commit `d8d0f8f` |

## 摘要结论

1. **Phase1 核心闭环是真实跑通的**：导入 → 检索 → 带来源的 RAG 问答 → 编辑留版本 → 术语对齐，走的是真 PostgreSQL+pgvector、真 `bge-small-zh` 向量、真 LLM（OpenAI 兼容，当前配 GLM），不是假数据。
2. **Phase2 核心 5 项完成度 = 0%**：标签 / 内链 / AI 润色 / 快速录入 / PDF 导出，仅有 DB+API 契约草案与 HTML 原型静态走查，无任何实现代码。
3. **发现一处文档-代码偏差**：`docs/09-verification.md` 中 Phase1 多数 TC 仍标注"降级口径·内存"，但运行时仓储早在 Sprint-8 已切为真实 PostgreSQL（`repository = PgRepository()`）。**实现已超前、验收标注滞后**，建议回写 09。
4. **原型与 React 严重脱节**：两份实现前 HTML 原型（4200+ 行、少容器清爽稿）在 React 代码里 0 落地，当前界面是另一套朴素样式。

## 一、真实实现度（以代码为准）

### 后端（`backend/`，共 24 个 `.py`，19 个有实质业务代码）

- **入口与分层**：`main.py`（FastAPI `create_app()`，lifespan 跑 `init_db()`，挂 7 个 router）；`api/`（auth/spaces/documents/imports/search/rag/terms）；`service/`（含 `pg_repository.py`、`demo_repository.py`、`embedding.py`、`llm_adapter.py`、`chunking.py`、`rag.py`、`search.py` 等）；`model/`（`orm.py` 8 表、`entities.py` 9 实体）。
- **API endpoint**：共 18 条真实 FastAPI 路由（登录 / 空间切换 / 文档 CRUD+版本 / 导入 / 搜索 / RAG 问答 / 术语 CRUD），统一 `{code,msg,data}` 信封 + `Authorization: Bearer` 鉴权。
- **数据库**：8 张 `lumen_*` 表 ORM + 6 个迁移 SQL（按文件名顺序幂等执行，含 seed）；`lumen_chunks` 含 `embedding vector(512)` + HNSW cosine 索引 + `tsvector` GIN 索引。未用 alembic 版本追踪（注释注明 Phase1 Demo 够用）。
- **关键架构事实**：所有 API 文件 `from backend.service.demo_repository import repository`，但 `demo_repository.py` 末尾将单例覆盖为 `repository = PgRepository()`。**运行时仓储是真实 PostgreSQL，不是内存假数据**；`DemoRepository` 仅作单元测试 fake 保留。

### 前端（`frontend/src/`，共 5 个源文件）

- `App.tsx`（1026 行，单文件承载全部视图与 handler）、`api.ts`（268 行，fetch 封装 + TS 类型）、`styles.css`（886 行，手写 CSS）、`main.tsx`、`vite-env.d.ts`。
- **非路由 SPA**：基于 `useState` 的 4 视图切换（`documents | search | query | terms`）。
- **数据全部真实后端 API，零 mock、零写死**；唯一业务运行时依赖 `react-markdown`；无路由库 / 状态库 / UI 组件库。

### 真实外部依赖（均非 mock）

| 依赖 | 状态 | 实证 |
|---|---|---|
| PostgreSQL 16 + pgvector 0.8 | **已启用** | docker compose 起 `pgvector/pgvector:pg16`；8 表落地；HNSW 索引；PG 集成测试 |
| Embedding `bge-small-zh`（512 维） | **已启用** | `sentence-transformers` 加载，真写 `lumen_chunks.embedding`；`HF_HUB_DISABLE_XET=1` |
| LLM（OpenAI 兼容） | **已启用**（已配真实 provider/model/key，此处脱敏不录） | `llm_adapter.py` 多 provider；RAG 真调，失败降级模板回答；GPT/ollama 配置位就绪未验证 |
| FastAPI / SQLAlchemy / psycopg / pgvector | **已启用** | `requirements.txt` 锁版本，76 后端 tests |
| React 18 / Vite 5 / TS 5 | **已启用** | `npm run build` + 浏览器 smoke |
| Word/PDF 解析 | **候选·未接入** | 无 python-docx/pdfplumber import |
| OCR | **降级/No-Go**（RG-003） | 无 OCR 代码，REQ-010 移后续 |
| PDF 导出库 | **待评估**（RG-006） | 未选型、未安装 |

## 二、能力盘点（真实现 / 降级 / 未实现）

| 能力 | 状态 | 备注 |
|---|---|---|
| 登录 / 空间切换 | 真实现 | demo 登录无密码 |
| 文档 CRUD + 行内编辑 + 预览 | 真实现 | 每次保存自动分块+向量化 |
| 版本历史 / 回滚 | 真实现 | restore 回滚指针 |
| `.md`/`.txt` 导入 | 真实现 | 上传→清洗→分块→embedding |
| 全文搜索 | 真实现（中文降级） | 三路融合；关键词路无 zhparser，CJK 基本不分词 |
| RAG 问答（带来源） | 真实现 | 真 LLM + 向量召回 + 术语注入；库外回"未找到"不编造（红线达成） |
| 术语管理 + 口径对齐 | 真实现 | CRUD + 空间隔离 + 全局只读 |
| 空间隔离 + 私有/团队可见 | 真实现 | 跨空间不可见 |
| 外部只读权限（EXTERNAL） | **部分实现·有缺陷** | EXTERNAL 被当作 TEAM 等价，**无只读约束** |
| Word/PDF 解析 | **未实现** | 仅占位列注释 |
| OCR | **未实现** | RG-003 No-Go |
| 标签 / 内链 / 反向链接 | **未实现** | 0 行代码 |
| AI 润色 / 写作引用 | **未实现** | 0 行代码 |
| PDF 导出 | **未实现** | 库未选型 |
| 知识图谱 / 空间总览 / 评审页 / 面包屑 / 树形目录 / 双模式 / 主题切换 | **未实现** | 仅 HTML 原型，React 0 落地 |

## 三、启用前必须知道的坑

1. **seed 示例文档默认搜不到**：seed 脚本直接 INSERT 文档、不经服务层，2 篇 demo 文档无 chunks/embedding，必须登录后通过 API/界面重新保存才会建索引。
2. **中文关键词搜索打折**：无 zhparser → 退回 `simple`，长中文词精确匹配变弱（向量语义召回不受影响）。
3. **登录态不持久化**：token 只存 React state，无 localStorage，刷新即掉线。
4. **外部只读名存实亡**：标 EXTERNAL 的文档无只读约束（权限缺口，演示无碍、对外有风险）。
5. **原型 ≠ 实际界面**：清爽稿原型功能在 React 里不存在。

## 四、文档-代码偏差（审计发现，建议回写）

`docs/09-verification.md` 中 TC-P1-001~006 / 012 仍标注"降级口径·内存实现"，但代码运行时默认仓储自 Sprint-8 起已是真实 PostgreSQL。即：**实际完成度高于文档标注**。建议在用户确认后回写 09，将这些 TC 状态从"条件通过·降级内存"更新为反映 PG 仓储的现状（仍保留真实 Word/PDF、OCR 的降级口径）。

## 五、完成度分层

| 层级 | 完成度 | 说明 |
|---|---|---|
| Phase1 Demo 核心闭环 | **已交付·可演示** | 检索/RAG/术语/版本/导入(文本)真实可用 |
| Phase1 可用性瑕疵（登录持久化 / seed 自索引 / 外部只读 / 中文分词 / 文件导入） | **未做** | 不属 Phase2 新功能，属可用性收口 |
| Phase2 核心 5 项（标签 / 内链 / AI 润色 / 快速录入 / PDF 导出） | **0%**（仅契约草案） | DB+API 契约已回填，无迁移/接口/前端/测试 |
| 远期愿景（情报分析 / 图谱 / OCR / 对外简报 / 移动端） | **0%** | 未进任何 Phase |

## 六、待确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 阻塞关系 |
|---|---|---|---|---|
| AUDIT-C-001 | 是否回写 09，修正"实现超前、标注滞后"偏差 | 建议回写，把 TC-P1-001~006/012 状态对齐 PG 仓储现状 | 代码 `repository=PgRepository()`；09 仍标内存 | 不阻塞，但影响完成度判断准确性 |
| AUDIT-C-002 | 是否在 Phase1 closure 与 Phase2 之间插入"P1.5 可用性收口"批次 | 建议插入：登录持久化 / seed 自索引 / 外部只读 / 文件导入 / 中文分词 | 这几项是"日常可用"的真正门槛，而非 Phase2 高级功能 | 阻塞"真正用上"的判断 |
| AUDIT-C-003 | "真正用上"的目标档位（个人 / 日常 / 团队对外） | 见配套规划讨论 | 决定 P1.5 与 Phase2 的优先级与范围 | 阻塞实现计划重排 |

## 相关文件

- 代码：`backend/`、`frontend/src/`、`tests/backend/`、`docker/compose.yml`
- 文档：`docs/03-prd.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`
- 关联审计：`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md`
