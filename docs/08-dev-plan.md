# 08 开发计划

> 按阶段拆 Sprint。本文件当前承载 **Phase1（功能范围 `[P1]` · 交付物形态 Demo）**；
> 升阶段时在**原位追加**新 Sprint（global-rules §8，不删旧 Sprint）。
> Sprint 格式见 `ai/global-rules.md` §3。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | Phase1 |
| 交付物形态 | Demo |
| 输入基线 | `docs/03-prd.md` §3、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/09-verification.md` |
| 当前状态 | Phase1 Demo 已完成并已记录全量验收（Conditional Go）；Sprint-1~6 降级口径完成；Sprint-7（LLM）/ Sprint-8（pgvector 接入）真实化完成（RG-001/002/004/005 Go），task-009 search hybrid 完成；P1A 前端结构聚焦重构已实现并构建通过，Chrome / Edge 人工 smoke 待补；待人工确认是否正式进入 Phase2 |
| 最后更新 | 2026-07-11（P1A 设计回填） |

## Sprint 总览

> 对照 `ai/doc-standards/08-dev-plan.md` §2。状态用 §7.1 横切状态词典。Sprint-1~6 为**降级实现**（原内存 `demo_repository`）；Sprint-7/8 真实化（LLM / pgvector / Embedding 接入）；OCR / 真实 PDF 解析仍降级（后续阶段）。

| Sprint | 目标 | 覆盖 REQ | 输入设计 / 契约 | 修改范围 | 验证包 | 状态 | 任务单 |
|---|---|---|---|---|---|---|---|
| Sprint-1 | 空间与权限底座 | 001/002/003 | 06、design/permissions | backend auth/space/permission | 见「Sprint 验证包」/ TC-P1-001~003 | 已完成（降级） | — |
| Sprint-2 | 文档管理 + 版本 | 004/005/006 | 06、07（documents） | backend document + frontend 编辑器 | / TC-P1-004~006 | 已完成（降级） | — |
| Sprint-3 | 内容导入 | 009/010 | design/ingestion、06、07 | backend import + scripts | / TC-P1-009/010 | 已完成（降级·仅 `.md`/`.txt`） | — |
| Sprint-4 | 检索与 RAG | 007/008 | design/rag-retrieval、06、07 | backend search/rag + frontend | / TC-P1-007/008 | 已完成（降级） | — |
| Sprint-5 | 术语管理 | 036 | design/term-management、06、07 | backend term/rag + frontend | / TC-P1-012 | 已完成（降级） | — |
| Sprint-6 | 桌面端集成与验收 | 011 | 09 + 前置 Sprint | frontend 桌面端集成 | / TC-P1-011 | 已完成（降级） | — |
| Sprint-7 | LLM 真实化 adapter | 008 | design/rag-retrieval、05（RG-004） | backend llm_adapter.py + rag.py + .env | / TC-P1-008 | 已完成（GLM-5.2 真实验证） | — |
| Sprint-8 | pgvector 接入（内存→PG+向量召回） | 007/008 | design/rag-retrieval、06、05（RG-001/002）、task-008 | docker + db.py + orm + pg_repository + embedding + rag + migrations 003-005 | / TC-P1-007/008 | 已完成（RG-001/002 Go；T1–T7，task-008） | `tasks/task-008-pgvector-integration.md` |
| Sprint-9（P1A） | 前端结构聚焦重构 | 011（既有 P1 页面体验修正） | design/frontend-interaction、research/frontend-p1-structure-exploration | frontend 组件拆分 + 视图切换 + CSS 响应式 | / TC-P1-013 | 已实现（构建通过；人工 smoke 待补） | — |

## 依赖关系与里程碑

| 项 | 前置依赖 | 阻塞风险 | 可并行 | 处理方式 | 里程碑 |
|---|---|---|---|---|---|
| Sprint-1 权限底座 | 无 | — | 否（后续依赖） | 最先执行 | M1 权限底座就绪 |
| Sprint-2 文档 | Sprint-1 | — | 可与 Sprint-3 部分并行 | 顺序 | M2 文档可用 |
| Sprint-3 导入 | Sprint-2（产物为文档） | OCR / PDF 未实现 → 降级 | — | 降级先行（`.md`/`.txt`） | M3 导入可用（降级） |
| Sprint-4 检索 RAG | Sprint-2 / 3（供数） | pgvector / Embedding 未接入 → 降级 | — | 降级先行（内存关键词） | M4 检索 RAG 可用（降级） |
| Sprint-5 术语 | Sprint-4（RAG 口径注入） | — | — | 顺序 | M5 术语对齐 |
| Sprint-6 桌面端 | Sprint-1~5 全部 | — | 否（横切验收） | 最后执行 | M6 Phase1 Demo 验收 |
| Sprint-9（P1A）前端结构聚焦 | Sprint-6 + #72 P0 UX + #74 探索 | 范围蔓延到 router / 组件库 / 移动端 | 可与 Phase2 tech-env-eval 并行 | 先纯 React state + CSS，不引新依赖 | M7 P1A 体验收口 |

## 任务拆分规则

- Phase1 不强制 `tasks/` 独立文件（`ai/global-rules.md` §3）；Sprint 五段式（目标 / 输入文档 / 修改范围 / 验收标准 / 禁止事项）承载任务边界。
- 拆分触发（`ai/implementation-lifecycle-rules.md` §4）：修改 > 3 文件 / 模块、验收无法一次完成、多不相干功能、多人 / 多 AI 并行、跨测试等级逐步验证。
- Sprint-2 / Sprint-6 未拆 task 文件（Phase1 合规，审计「可接受兼容差异」已认定）。
- 分支 / worktree：每个 Sprint / PR 独立分支；多会话并行操作同一仓库时用 `git worktree`（见 `ai/session-rules.md` §8）。

## Sprint 验证包

> 每个 Sprint 的验证包（对照 `ai/doc-standards/08-dev-plan.md` §3）：关联 TC / 测试等级 / 自动化命令 / Mock·降级口径。完成包（改动文件 / 验证结果 / 提交 / 残留风险）见文末「Sprint 完成包与进度记录」。

| Sprint | 关联 TC | 测试等级 | 自动化命令 | 人工步骤 | Mock / 降级口径 |
|---|---|---|---|---|---|
| Sprint-1 | TC-P1-001/002/003 | 单元 + 集成 | `.venv\Scripts\python.exe -m unittest discover -s tests/backend`（test_permission / test_space） | — | 内存权限过滤（无真实账号系统） |
| Sprint-2 | TC-P1-004/005/006 | 单元 + 集成 | 同上（test_document） | 前端编辑器 smoke | 内存文档 / 版本（无 DB） |
| Sprint-3 | TC-P1-009/010 | 集成 | 同上（test_imports） | — | 仅 `.md`/`.txt` 文本切块；无 PDF/OCR/向量 |
| Sprint-4 | TC-P1-007/008 | 单元 + 集成 | 同上（test_search / test_rag） | 前端搜索 / 问答 smoke | 内存关键词检索；RAG 不调 LLM |
| Sprint-5 | TC-P1-012 | 单元 + 集成 | 同上（test_term / test_rag） | 前端术语管理 smoke | 内存术语；问答口径注入（不调 LLM） |
| Sprint-6 | TC-P1-011 | 系统 / E2E | — | Edge Headless + Chrome 人工 smoke（09 §5） | 桌面端全 P1 功能（降级口径） |
| Sprint-7 | TC-P1-008 | 单元 + 集成 | 同上（test_rag） | 本机 GLM-5.2 真实问答 | LLM 默认 Mock 可切；GLM 真实验证 |
| Sprint-8 | TC-P1-007/008 | 单元 + 集成（PG） | 同上（test_pg_repository / test_api_routes / test_embedding） | uvicorn 起后端冒烟（登录/CRUD/术语/导入/搜索/RAG） | PG 必需运行时（lumen-pg 容器）；Embedding 模型 ~7s 首加载 |
| Sprint-9（P1A） | TC-P1-013 | 前端构建 + 浏览器 smoke | `npm.cmd run build`（frontend） | Chrome / Edge：登录、视图切换、文档、搜索、问答、术语、900px 宽度 | 不新增 API / 后端能力；不引 router / 组件库；移动端不验收 |

> 资源 / 环境验证：Sprint-8 起 Docker / pgvector / Embedding **已 Go**（RG-001/002 Go，见 05 §5.1；TE-C-003 闭合）；OCR / 真实 PDF 解析仍 No-Go（RG-003，后续阶段，不在 P1 必过范围）。

## Sprint-1：空间与权限底座

### 目标
多空间隔离 + 权限分级 + 查询时过滤（REQ-001 / 002 / 003）

### 输入文档
00/01/02、06（lumen_spaces / members / documents）、docs/design/permissions.md

### 修改范围
- backend：api/auth、api/spaces、service/space、service/permission
- 06 相关数据库迁移

### 验收标准
- brightlite 账号查询 nova-internal 文档零命中
- 作者的私有文档，同空间其他成员搜索不到

### 禁止事项
- 不引入新依赖
- 不做跨空间推送（P2）

## Sprint-2：文档管理 + 版本

### 目标
文档 CRUD + 行内编辑 + 版本历史 / 恢复（REQ-004 / 005 / 006）

### 输入文档
06（documents / versions）、07（documents 接口）

### 修改范围
- backend：api/documents、service/document
- frontend：文档编辑器

### 验收标准
- CRUD 全通过
- 改 3 次能看到 3 个版本，能恢复到指定版本

### 禁止事项
- 不做 AI 润色（P2）

## Sprint-3：内容导入流水线

### 目标
目标设计为 Word / PDF 解析 + OCR + 切块入库（REQ-009 / 010）；Phase1 Demo 实际按 `.md` / `.txt` 已提取文本降级导入，为检索问答供数

### 输入文档
docs/design/ingestion.md、06（chunks / imports）、07（import）

### 修改范围
- backend：service/import（Phase1 已实现 `.md` / `.txt` 文本导入 + 切块；真实解析 / OCR 留后续）
- scripts：导入 / 索引脚本

### 验收标准
- Phase1 Demo：导入 `.md` / `.txt` 已提取文本后，能被搜索与问答命中；真实 .pdf / Word / 图片 OCR 不作为当前必过项

### 禁止事项
- 不把真实 Word / PDF 解析或 OCR 作为 Phase1 Demo 必过项；RG-003 未解除前不得声称 OCR 已实现
- 不做录音转写（愿景）

## Sprint-4：检索与 RAG 问答

### 目标
全文搜索 + RAG 问答带来源（REQ-007 / 008）

### 输入文档
docs/design/rag-retrieval.md、06（chunks 索引）、07（search / query）

### 修改范围
- backend：service/search、service/rag
- frontend：搜索 / 问答 UI

### 验收标准
- 搜索命中正确
- 问答答案正确且标注来源
- 问库外内容明确回复"未找到"，不编造

### 禁止事项
- 不做重排 / 混合检索的高级调优（P2+）
- 不做因果推理（愿景）

## Sprint-5：术语管理与问答口径对齐

### 目标
空间级术语表维护 + 文档术语识别 + RAG 问答优先使用术语定义（REQ-036）

### 输入文档
01/02/03、docs/design/term-management.md、06（terms）、07（terms 接口）

### 修改范围
- backend：api/terms、service/term、service/rag 术语上下文注入
- frontend：术语管理页 / 文档术语悬浮提示（最小演示）

### 验收标准
- brightlite-team 新建「触发延迟」术语后，文档中该词可识别
- 问答优先使用 brightlite-team 空间术语定义，不被同名全局术语覆盖

### 禁止事项
- 不做跨空间术语同步
- 不做术语冲突自动改写文档

## Sprint-6：桌面端集成与验收

### 目标
Chrome / Edge 桌面端跑通全部 P1 功能（REQ-011）—— 本 Sprint 不新增功能，是 Phase1 桌面端横切验收与集成。

### 输入文档
09-verification.md（REQ-011 验证矩阵 + 各 REQ 桌面端口径）、各前置 Sprint 交付

### 修改范围
- frontend：桌面端布局 / 交互适配、各功能页面集成
- 集成验证：Chrome / Edge 全 P1 功能走查

### 验收标准
- Chrome / Edge 桌面端完成 REQ-001..REQ-011 全部功能（见 09 §2 矩阵）
- 桌面端主流分辨率下交互可用、无阻塞缺陷

### 禁止事项
- 不做移动端 / 响应式移动适配（Phase1 禁止，见 project-rules §1）
- 不新增 P1 范围外功能

## Sprint-9（P1A）：前端结构聚焦重构

### 目标
基于 #74 探索结论，修正 Phase1 桌面端前端结构体验：提供文档 / 搜索 / 问答 / 术语一级视图切换，拆解全局右栏常驻面板，保证桌面 768px+ 不横向破版，并拆分 `App.tsx` 以降低后续维护风险。该 Sprint 不新增业务 REQ，归属 REQ-011 桌面端体验收口。

### 输入文档
- `docs/research/2026-07-11-frontend-p1-structure-exploration.md`
- `docs/design/frontend-interaction.md` §2.3 / §6 / §7 / 实现偏差 DEV-002
- `docs/09-verification.md` TC-P1-013

### 修改范围
- `frontend/src/App.tsx`：引入 `activeView` 视图状态并拆出轻量组件。
- `frontend/src/styles.css`：左导航 / 主区视图布局、桌面响应式断点、去除全局固定最小宽。
- 可新增 `frontend/src/components/*` 或同级轻量组件文件；不修改 `frontend/src/api.ts` 契约。

### 验收标准
- `npm.cmd run build` 通过。
- 登录后可在文档 / 搜索 / 问答 / 术语四个一级视图之间切换，当前空间上下文不丢失。
- 搜索 / 问答 / 术语在主区呈现，不被版本历史或其他无关面板挤压。
- 版本历史归入文档视图侧栏或折叠区，恢复版本仍需二次确认。
- Chrome / Edge 桌面 900px 宽度下无全局横向滚动，可完成文档、搜索、问答、术语主流程。
- #72 P0 能力不回退：Markdown 渲染、来源点击、删除 / 恢复二次确认仍可用。

### 禁止事项
- 不引入 `react-router`、组件库或全局状态管理；若后续需要 URL 深链，另开 P1.5 评估。
- 不新增后端接口，不修改 API 契约，不改变权限边界。
- 不做移动端适配，不新增 P2 / Phase2 功能入口。

## Sprint 完成包与进度记录

> 对照 `ai/doc-standards/08-dev-plan.md` §4（完成包）+ §5（进度记录）。Sprint-1~6 为早期降级实现；Sprint-7/8 已完成真实 LLM、PostgreSQL+pgvector、Embedding 与 RAG 向量召回接入；task-009 已完成 search 向量化 + 可选 zhparser 回退。仍降级：真实 Word / PDF 解析、OCR。验收证据见 `docs/09-verification.md §5`。

| Sprint | 日期 | 目标（REQ） | 实际交付 | 关联提交 / PR | 验证结果 | 残留风险 / 下一步 | 已回填 09 |
|---|---|---|---|---|---|---|---|
| Sprint-1 | 2026-07-03~ | 001/002/003 | 降级内存实现（权限过滤可用；Sprint-8 后 PG 仓储已接入） | 含于 Sprint-2~4 提交基线；PG 真实化见 Sprint-8 | 53 后端 tests 通过；Sprint-8 后 74 tests 通过 | RG-001 已在 Sprint-8 解除 | §2 / §5 |
| Sprint-2 | 2026-07-03 | 004/005/006 | 降级内存实现 + 前端编辑器 | `83fb782` | 通过（降级口径） | — | §5 |
| Sprint-3 | 2026-07-03 | 009/010 | 降级文本导入（仅 `.md`/`.txt`，无 PDF/OCR） | `0fe169b` | 通过（降级口径） | PDF / OCR 未实现（RG-003）→ 后续阶段 | §5 |
| Sprint-4 | 2026-07-04 | 007/008 | 内存搜索 + 降级 RAG（不调 LLM）+ 前端 UI；Sprint-7/8 后 RAG 已真实化 | `da9f6e5`/`5144f2a`/`bc03839`/`c5c177e`(fix)；真实化见 Sprint-7/8 | 通过（降级口径）；Sprint-7/8 后真实 LLM + 向量召回通过 | RG-001/002/004 已解除；search 向量化 + 可选 zhparser 已由 task-009 补齐 | §5 / §5.1 |
| Sprint-5 | 2026-07-05 | 036 | 空间术语 CRUD + 问答口径注入 | `5b78f0a` | 通过（降级口径） | — | §5 |
| Sprint-6 | 2026-07-06 | 011 | 桌面端集成 + Edge Headless / Chrome smoke | `cb6fb8a`（PR #28） | 部分通过 → 通过（降级口径） | 真实 PDF / OCR 未验证 → Phase2 | §5 |
| Sprint-7 | 2026-07-09 | 008 | LLM adapter（`llm_adapter.py`）+ rag 接入 + `.env` 模板 | `754d5eb`/`78a8550`（PR #45） | 55 tests + GLM-5.2 真实问答验证 | GPT/ollama 待验证；向量检索仍缺（RG-002 已验证·待 pgvector） | §5 / §6 |
| Sprint-8 | 2026-07-09~10 | 007/008 | pgvector 接入 task-008 T1–T7：基建（docker/compose + db.py）/ migrations 003-005 / ORM + PgRepository / 切单例 + demo seed / embedding 写入 / RAG 向量召回 / 测试 + 文档回写 | T1 `68453b0`(#47) · T2 `5e780fa`(#49) · T3 `12c9ba3`(#50) · T4 `4ccefb7`(#51) · T5 `a90d2a0`(#52) · T6 `f14b9d9`(#53) · T7 本批 | 74 tests（含 PG 集成 + embedding）+ uvicorn 冒烟全通 | RG-001/002→Go；search 向量化 + 可选 zhparser 已由 task-009 补齐；真实 PDF/OCR 仍 No-Go（RG-003） | §5 / §6 |
| Phase1 全量验收 | 2026-07-10 | 001..011/036 | Phase1 Demo closure 评估与全量验收记录；覆盖 Sprint-1~8、TC-P1-001~012、RG-001~005 | `24fc3c7` · `4f036cc`(#56) · `24ccfc8`(#57) · `d8d0f8f` | Conditional Go（Demo closure）；详见 `docs/09-verification.md §5` | 需人工确认是否升 Phase2；真实 Word / PDF 解析、OCR 真实化留后续 | §5 / §6 |
| task-009 search 向量化 + 可选 zhparser | 2026-07-10 | 007 | `/api/search` hybrid：substring + `ts_vector` SQL 候选 + pgvector 语义召回；migration 006 可选 zhparser / simple 回退 | 本 PR | `init_db()` 两次通过；76 后端 tests 通过（含 `tests.backend.test_search` 与真实 PG 语义搜索集成测试） | 当前 pgvector 镜像无 zhparser，中文分词回退 `simple`；不影响向量语义召回 | §5 / §6 |
| Sprint-9（P1A）实现 | 2026-07-11 | 011 | 前端结构聚焦重构：本地 `activeView` 四视图切换、右栏拆回文档 / 搜索 / 问答 / 术语主视图、桌面响应式 CSS | 本 PR | `git diff --check`；`npm.cmd run build` 通过 | Chrome / Edge 人工 smoke 待补；不阻塞 Phase1 Demo closure | §2 / §5（TC-P1-013 部分通过） |

> Sprint-8 后：pgvector / Embedding / LLM 已接入（RG-001/002/004 Go），基础 Web / ORM 栈为 Go（RG-005）。Phase1 全量验收结论为 Conditional Go（Demo closure）；仍移出 P1：真实 PDF 解析、图片 OCR（REQ-010，RG-003 No-Go，后续阶段）。Sprint-9（P1A）是已完成 Demo 之上的前端结构体验收口，不改变 Phase1 closure 结论。Phase2 启动前需人工确认范围、进入 / 退出标准，并另行更新阶段指针。

---

<!-- 升阶段时在此原位追加 Phase2 Sprint，不删除上方内容 -->

## 待人工确认项

- 是否正式进入 Phase2：需人工确认范围、进入 / 退出标准后，再更新 `ai/project-rules.md` 当前阶段指针与相关设计 / 计划文档。
- Sprint-9（P1A）代码实现已完成构建验证；仍需人工 Chrome / Edge smoke 后回填 TC-P1-013 最终证据。
