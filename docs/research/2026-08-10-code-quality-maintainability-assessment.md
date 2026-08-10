# LUMEN 前后端代码质量、可读性与可维护性评估（2026-08-10）

> 定位：**代码实现质量只读评估报告 · 模板规则回流依据 · 待人工确认治理范围**。
> 本文记录 LUMEN 长周期 AI 编码形成的前端、后端、测试与工程化现状，区分合规实践、已确认风险、候选改进与可回流模板约束。
> 本文不是新的产品需求、正式重构任务或验收通过记录，不替代 `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`。文中建议在人工确认并进入 Sprint / Task 前，不视为已批准实施。
> 上位框架与配套：`2026-08-10-ai-code-governance-framework.md`（R1-R7 执行路由上位框架，本文为其「实证来源」）+ `2026-08-10-code-constraint-framework.md`（L0-L3 内容分层方法论）。本文提供量化诊断证据，两者提供治理框架与分层方法论。

## 0. 元数据与评估边界

| 项 | 值 |
|---|---|
| 评估日期 | 2026-08-10 |
| 代码基线 | `main` @ `973e0c6` |
| 项目版本 | `v3.7.0` |
| 工作区状态 | 评估开始时 `main...origin/main`，工作区干净，无 stash |
| 评估对象 | `frontend/src/`、`backend/`、`tests/backend/`、`scripts/smoke-*`、前后端依赖与 CI 配置 |
| 主要目标 | 评估规范性、可读性、可维护性；识别 AI 增量编码的不确定性来源；提炼模板级实现约束 |
| 不在范围 | 产品需求正确性复审、UI 视觉验收、真实性能压测、第三方依赖安全扫描、生产部署安全认证 |
| 验证性质 | 静态源码与配置审查；未执行可能写入或清理默认数据库的全量测试 |

### 0.1 为什么需要本次评估

LUMEN 从探索期逐步增加文档、搜索、RAG、导入、目录树、本地 Vault、账户与多人权限、管理后台等能力。早期 AI 编码以功能跑通为主，后续才逐步补入文档驱动、System Skeleton、Web Fullstack Profile、文件膨胀阈值、分层验证等方法论。

这类演进容易形成一种表面矛盾：

- 单个功能和验收用例大多能工作；
- 代码也并非完全无分层；
- 但跨功能演进依赖 AI “记得”既有模式；
- 缺少编译、静态检查、契约、事务与 CI 自动门禁时，随机性会在新功能中重新出现；
- 每轮靠专项重构清理一次，后续仍可能重新回堆。

因此本次评估不只问“代码能不能运行”，而是重点回答：

1. 当前结构是否能让下一轮 AI 快速找到正确修改位置；
2. 错误、权限、事务、API 契约是否由代码结构强制，而不是靠调用者记忆；
3. 测试和 CI 是否能阻断不确定性进入主分支；
4. 既有文件阈值为什么没有持续阻止膨胀；
5. 哪些问题属于 LUMEN 项目债务，哪些应去项目化回流模板。

## 1. 评估方法与证据口径

### 1.1 方法

本次采用六类只读检查：

1. **目录与规模基线**：统计源文件、代码行数、最大文件和现有 WSG 阈值超限项。
2. **前端纵切审查**：读取 `App.tsx → 域 hook → API client → feature`，检查职责、状态、错误与类型边界。
3. **后端纵切审查**：读取 `API router → service → repository → DB session / migration`，检查分层、权限和事务。
4. **双实现一致性审查**：比较 `DemoRepository` 与 `PgRepository` 的方法面，确认 fake / production repository 是否有显式契约。
5. **测试与 CI 审查**：检查测试类型、危险数据操作、前端测试缺口、浏览器 smoke 基础设施重复和 CI 实际执行项。
6. **模板规则对照**：对照 `template-docs/web-fullstack-profile.md` 的 WSG-001～006、文件膨胀阈值和主应用职责边界。

### 1.2 证据等级

| 等级 | 含义 | 本文使用方式 |
|---|---|---|
| E1 | 源码或配置直接证明 | 可写成已确认事实 |
| E2 | 多处模式和规模统计共同支持 | 可写成结构性风险 |
| E3 | 基于架构机制推断，尚未做故障注入或运行复现 | 明确标为风险推断 |
| E4 | 候选治理建议 | 不写成已批准方案 |

### 1.3 限制

- 本轮没有重新执行前端 build、后端单测或浏览器 smoke；最近一次通过记录可在 `docs/09-verification.md` 和 handoff 查到，但不作为本轮独立复验。
- 没有执行 README 推荐的全量 `unittest discover`，原因见 `CQ-P0-001`：该命令在默认 PostgreSQL 可连接时可能清理开发数据。
- 没有做运行时 profiling、覆盖率采集和 mutation testing，因此性能与覆盖率结论仅限代码结构和测试入口。
- 行数阈值是治理信号，不单独证明代码差；本文会结合职责数量、重复模式和变化历史判断。

## 2. 量化基线

### 2.1 代码与测试规模

| 区域 | 文件数 | 行数 | 说明 |
|---|---:|---:|---|
| `backend/**/*.py` | 52 | 10,423 | API、service、model、repository、DB 启动逻辑 |
| `frontend/src/**/*.{ts,tsx}` | 90 | 12,642 | React、hooks、API client、本地 Vault 逻辑 |
| `frontend/src/**/*.css` | 23 | 4,662 | tokens、layout、feature / page 样式 |
| `tests/backend/**/*.py` | 28 | 6,193 | 323 个 `test_*` 方法 |
| `scripts/smoke-*` | 17 | 5,819 | API、PG、浏览器、本地能力与性能 smoke |

补充统计：

- FastAPI endpoint：64 个；
- FastAPI `response_model=`：0 个；
- API 层 `HTTPException` 文本出现：154 次；
- backend + frontend 的宽泛 `except Exception`：15 处；
- 前后端代码中的 Sprint / REQ / task / 批次符号等历史追溯文本：286 处；
- 未发现 `pyproject.toml`、Ruff、Mypy、Pytest、EditorConfig、ESLint 或 Prettier 配置。

### 2.2 现有 WSG 阈值超限文件

现有 `template-docs/web-fullstack-profile.md` §5 建议：主应用 300 行、页面 / 视图 250 行、CSS 300 行、后端 service / controller 250 行、测试 300 行。按此口径，本轮识别出 27 个超限文件：

| 区域 | 文件 | 行数 | 阈值 |
|---|---|---:|---:|
| 前端 CSS | `frontend/src/styles/workspace.css` | 722 | 300 |
| 后端测试 | `tests/backend/test_export.py` | 680 | 300 |
| 前端 CSS | `frontend/src/styles/local-mount.css` | 589 | 300 |
| 前端视图 | `frontend/src/app/FolderTree.tsx` | 569 | 250 |
| 前端视图 | `frontend/src/features/LocalMountPane.tsx` | 563 | 250 |
| 后端 service | `backend/service/export.py` | 563 | 250 |
| 前端入口 | `frontend/src/App.tsx` | 545 | 300 |
| 前端视图 | `frontend/src/features/DocumentsFeature.tsx` | 485 | 250 |
| 后端测试 | `tests/backend/test_api_routes.py` | 471 | 300 |
| 前端 CSS | `frontend/src/styles/layout.css` | 458 | 300 |
| 前端视图 | `frontend/src/app/TermCategoryTree.tsx` | 405 | 250 |
| 后端测试 | `tests/backend/test_imports.py` | 383 | 300 |
| 后端测试 | `tests/backend/test_term_category.py` | 367 | 300 |
| 前端视图 | `frontend/src/app/ContextPane.tsx` | 366 | 250 |
| 后端测试 | `tests/backend/test_folder.py` | 350 | 300 |
| 后端测试 | `tests/backend/test_permission.py` | 348 | 300 |
| 前端视图 | `frontend/src/features/ImportFeature.tsx` | 335 | 250 |
| 后端测试 | `tests/backend/test_ai_polish.py` | 335 | 300 |
| 后端 service | `backend/service/auth.py` | 332 | 250 |
| 后端 service | `backend/service/imports.py` | 322 | 250 |
| 后端 service | `backend/service/rag.py` | 320 | 250 |
| 前端 CSS | `frontend/src/styles/onboarding.css` | 317 | 300 |
| 后端 service | `backend/service/timeline.py` | 313 | 250 |
| 前端视图 | `frontend/src/app/WorkspaceMain.tsx` | 279 | 250 |
| 前端视图 | `frontend/src/app/TopBar.tsx` | 274 | 250 |
| 前端视图 | `frontend/src/features/DocumentInspectorFeature.tsx` | 266 | 250 |
| 后端 API | `backend/api/documents.py` | 262 | 250 |

此外，当前 WSG 阈值没有覆盖 repository；`backend/repository/pg_repository.py` 为 1,621 行，`backend/repository/demo_repository.py` 为 1,251 行，实际是后端最大的两个实现文件。这说明现有 Profile 不仅缺少自动执行，也存在检查对象缺口。

### 2.3 阈值历史对照

`docs/research/2026-07-19-app-tsx-refactor-plan.md` 记录：

- 当时 `App.tsx` 为 741 行、25 个 `useState`、19 个 handler；
- 已确认目标是通过域 hook 抽取，将入口减压到约 300～400 行；
- 当前代码确实已经形成 `useSession`、`useDocuments`、`useSearch`、`useQuery`、`useTerms`、`useImport` 等域 hook；
- 但当前 `App.tsx` 仍为 545 行，并继续承载认证页、跨域刷新、多个 modal / drawer 与布局装配。

结论不是“之前重构失败”，而是：**一次性专项重构有效，但没有 changed-file ratchet 和 CI gate，后续功能仍可继续向超限文件增量堆叠。**

## 3. 已形成的良好实践

### 3.1 前端合规项

1. **TypeScript 严格模式已开启**：`frontend/tsconfig.json` 使用 `strict: true`、`isolatedModules: true`、`noEmit: true`，基本类型安全优于早期 JavaScript 式增量。
2. **API client 已按领域拆分**：`frontend/src/api/` 按 auth、documents、folders、tags、terms、timeline 等领域分文件，通过 `api/client.ts` 统一请求入口。
3. **域状态大部分已从 App 下沉**：`useDocuments`、`useFolders`、`useSession`、`useAdminUsers`、`useLocalVaultMount` 等 hook 已形成明确命名，证明项目具备可延续的拆分范式。
4. **组件与 feature 分区可辨识**：`app/`、`features/`、`components/`、`api/`、`styles/` 边界大体符合 Web Fullstack Profile。
5. **权限显隐不是唯一防线**：前端 admin / member 显隐之外，后端仍执行鉴权与空间权限检查，符合“前端隐藏不等于权限边界”。
6. **本地 Vault 隐私红线在代码中被反复强调**：仅本地读取 / 编辑、不上传、不进入服务端 RAG 的不变量有明确注释和 smoke 证据。

### 3.2 后端合规项

1. **目录分层已建立**：API、service、model、repository、migration 已物理分离，不是所有逻辑塞进 FastAPI router。
2. **业务服务具有领域异常**：document、folder、term、tag、auth、timeline 等 service 已定义各自的 validation / access / not-found 异常。
3. **实体与 ORM 分离**：`backend/model/entities.py` 使用领域实体，`backend/model/orm.py` 表达持久化模型，`PgRepository` 负责转换。
4. **权限负向路径受到重视**：测试覆盖跨空间、private owner、non-member、角色和多人隔离，符合 LUMEN 产品红线。
5. **DemoRepository 提升了纯 service 测试速度**：大多数业务逻辑无需真实 PG 即可验证，323 个后端测试方法说明回归意识较强。
6. **关键安全能力已有专门实现**：bcrypt、不可预测 session token、token hash、锁定、重置 token TTL / 一次性等并非临时拼接。

### 3.3 验证合规项

1. 后端有 28 个测试文件和 323 个测试方法，覆盖面明显高于“只实现功能、不写测试”的早期状态。
2. 存在真实 PG integration、API、权限、多用户、浏览器、本地文件系统和性能 smoke，多层验证方向正确。
3. 关键缺陷修复后通常补回归测试，例如导入文档删除外键问题已有 repository regression test。
4. 浏览器 smoke 使用临时 profile 和 run id，许多脚本具备清理逻辑，说明测试可重复性被考虑过。

## 4. 问题与风险清单

### 4.1 总览

| ID | 优先级 | 主题 | 结论 |
|---|---|---|---|
| CQ-P0-001 | P0 | 测试数据库隔离 | 全量测试可能清空默认开发数据库，必须先治理 |
| CQ-P0-002 | P0 | CI 代码门禁 | CI 不执行代码构建、测试或静态检查，主分支缺少最小质量门禁 |
| CQ-P1-001 | P1 | 启动与健康状态 | PG 强依赖初始化失败后应用继续启动，形成假健康 |
| CQ-P1-002 | P1 | Repository 边界 | 两个 god repository，无显式接口或按域拆分 |
| CQ-P1-003 | P1 | 事务边界 | 多步业务用例跨多个独立 commit，存在部分完成风险 |
| CQ-P1-004 | P1 | 权限查询边界 | 用户态查询先全量读取再过滤，安全依赖调用者记忆 |
| CQ-P1-005 | P1 | API / 错误契约 | 服务端错误被前端压成字符串，认证状态靠文案正则判断 |
| CQ-P1-006 | P1 | API schema | 64 个 endpoint、0 个 response model，前后端类型手工同步 |
| CQ-P1-007 | P1 | Migration 治理 | 自制迁移每次重放、无 ledger；Alembic 已依赖但未使用 |
| CQ-P1-008 | P1 | 前端结构回堆 | 一次重构后仍有多处超限，缺少增量 ratchet |
| CQ-P1-009 | P1 | 前端测试结构 | 无组件 / hook 单测，浏览器 smoke 基础设施大量复制 |
| CQ-P2-001 | P2 | 重复树状态机 | 文件夹树与术语领域树存在明显同构复制 |
| CQ-P2-002 | P2 | 异常与可观测性 | 存在静默 catch、宽泛异常和 print / logger 混用 |
| CQ-P2-003 | P2 | 注释卫生 | 过程批次、Sprint 编号和临时修复序号过多进入长期代码 |

### 4.2 CQ-P0-001：全量测试可能清空默认开发数据库

**事实证据（E1）**

- `README.md:71` 推荐：`.venv\Scripts\python.exe -m unittest discover -s tests/backend -v`。
- `tests/backend/test_pg_repository.py:17` 直接导入生产使用的 `SessionLocal`、`engine`、`init_db`。
- `tests/backend/test_pg_repository.py:21-30` 定义 `_truncate_all()`，对 users、spaces、members、documents、versions、chunks、imports、terms、folders 执行 `TRUNCATE ... RESTART IDENTITY CASCADE`。
- `tests/backend/test_pg_repository.py:53-60` 只要默认数据库可连接就运行；不可连接才 Skip。
- `tests/backend/test_pg_repository.py:71-73` 每个测试前再次 `_truncate_all()`。
- `backend/service/db.py:34-36` 的默认连接指向 `postgresql://lumen:lumen@localhost:15432/lumen`，没有测试专用数据库名。

**风险机制**

开发者或 AI 按 README 执行全量测试时，如果本地 `lumen-pg` 正在运行，就会连接默认开发数据库并清空数据。测试代码没有要求 `LUMEN_ENV=test`、`ALLOW_DESTRUCTIVE_TEST_DB=1`，也没有校验数据库名必须包含 `_test`。

这不是一般意义上的“测试会改数据”，而是验证入口自身缺乏目标保护，属于工程安全 P0。

**当前缓解**

- 测试结束时尝试清空数据库并让应用下次启动重播 seed；
- 但这只能恢复演示 seed，不能恢复用户自行录入的开发数据，因此不能作为安全措施。

**建议**

1. 专用数据库，如 `lumen_test`；
2. 测试启动三重 guard：`LUMEN_ENV=test`、数据库名匹配 `_test`、显式允许 destructive fixture；
3. 任一条件不满足立即拒绝执行；
4. README 分离 unit 与 PG integration 命令，默认 unit 不触碰 PG；
5. CI 使用临时 PostgreSQL service，不复用开发实例。

**模板回流价值**

所有有数据库的 AI 项目都可能复制“默认连接 + 测试 truncate”模式。模板必须把“破坏性测试目标保护”提升为硬规则和脚本 guard，而不是仅提醒备份。

### 4.3 CQ-P0-002：CI 没有代码质量门禁

**事实证据（E1）**

- `.github/workflows/project-check.yml` 只执行：空白检查、VERSION / CHANGELOG 一致性、派生同步边界。
- 没有 Python compile / lint / typecheck / unit test。
- 没有前端 typecheck / build / lint / test。
- 没有 migration smoke、OpenAPI schema 生成或 contract diff。
- `frontend/package.json` 仅有 `dev`、`build`、`preview`，没有 `test`、`lint`、`format`、`typecheck` 独立命令。
- 根目录未发现统一 Python 工具配置和 EditorConfig。

**风险机制**

文档规则要求“生成后验证”，但没有 CI 时，验证是否运行、运行了哪些命令、是否使用正确运行时都依赖当前 AI 会话。换模型、换工具、长上下文或人工直推都可能绕过。

现有 323 个测试方法不能自动转化为主分支保护，因为 CI 从不执行它们。

**建议最小门禁**

1. 后端：compile + lint + unit；PG integration 独立 job；
2. 前端：typecheck + build + lint；关键 hooks / components unit；
3. API：OpenAPI 生成 / response schema 检查；
4. 运行时：Node / Python 版本与项目锁定一致；
5. 现阶段先引入 advisory job，再在基线清理后升级 required，避免一次性阻断全部维护。

### 4.4 CQ-P1-001：强依赖失败后继续启动

**事实证据（E1）**

- `backend/main.py:24-26` 注释说明运行时已强依赖 PostgreSQL，初始化失败后 API 查询会报错。
- `backend/main.py:34-46` 捕获所有 `Exception`，只 `print` “init skipped”，随后继续 `yield`。
- production 只检查不能使用 demo repository，没有要求 DB 初始化成功。

**风险机制**

进程和端口可用不等于业务 ready。容器编排、人工 smoke 或监控若只看端口，会把不可服务实例当成健康实例；后续错误在用户请求阶段才暴露，定位成本更高。

**建议**

- 强依赖在 production / PG 模式初始化失败时 fail-fast；
- 区分 liveness 与 readiness；
- 降级只允许在文档明确授权的 demo / mock 模式，并输出结构化日志；
- 禁止“required dependency failed but app continues”作为默认容错。

### 4.5 CQ-P1-002：Repository god object 与隐式契约

**事实证据（E1 / E2）**

- `PgRepository` 1,621 行、101 个方法；`DemoRepository` 1,251 行、108 个方法。
- 两者当前公共方法面基本一致，差异主要是私有 helper，说明人工同步暂未明显漂移。
- `backend/repository/pg_repository.py:1-6` 明确写着 “same interface” 和 “duck-typed”。
- service 的 `repository` 参数普遍没有 Protocol / ABC 类型，例如 `backend/service/document.py:59-64`。
- API 通过 `backend/repository/__init__.py:9` 的全局 singleton 直接绑定实现。

**风险机制**

新增一个领域方法时必须同时修改两个大文件；静态检查无法提示 fake 漏实现、参数变更或返回行为不同。所有领域共用一个 repository 还会提高冲突概率和 AI 读取成本。

**建议**

- 按领域声明小型 Protocol，例如 `DocumentRepository`、`AuthRepository`、`FolderRepository`；
- service 只依赖当前用例需要的 port；
- PG / in-memory fake 共同执行 contract tests；
- 逐步拆文件，不要求一次拆完 2000+ 行；
- WSG-004 阈值覆盖 repository / gateway，而不只 service / controller。

### 4.6 CQ-P1-003：多步业务用例缺少统一事务边界

**事实证据（E1）**

- `PgRepository` 的大量写方法各自 `with SessionLocal()` 并 `session.commit()`。
- `backend/service/document.py:75-84` 创建文档后，再同步 chunks、wikilinks。
- `backend/service/document.py:108-116` 更新文档后，再分别同步派生数据。
- `backend/service/imports.py:87-105` 创建 import job、创建文档、替换 chunks、完成 job；失败后再单独写 failed 状态。
- `backend/service/imports.py:91-101` 调用 `create_document()` 已同步 chunks 后，又调用一次 `replace_document_chunks()`，存在重复派生工作。
- batch import 的目录创建、文档创建、移动文件夹也分散在多个 commit。

**风险机制（E3）**

当 embedding、wikilink、folder move 或 complete job 中任一步失败时，前序 commit 已无法自动回滚，可能出现：

- 文档存在但 import job 标失败；
- 文档版本已更新但 chunks / wikilinks 仍旧；
- 目录已创建但文档失败；
- retry 时遇到标题冲突或重复派生计算。

**建议**

- 以 use case 为事务边界，引入最小 Unit of Work / session scope；
- repository 方法默认不私自 commit，由 UoW 决定 commit / rollback；
- 若派生索引明确采用 eventual consistency，应有 outbox / dirty flag / retry 状态，而不是隐式部分完成；
- 为关键用例增加故障注入 rollback 测试。

### 4.7 CQ-P1-004：权限过滤依赖调用者记忆

**事实证据（E1）**

- `backend/api/documents.py:55-63` 调用 `repository.list_documents()`、`list_memberships()` 后在 service 内过滤。
- `backend/service/document.py:88-96` 先按 id 取文档，再调用 `can_view_document()`。
- timeline、search、rag、doc links、quick entry 等多个 service 都自行组合 `list_documents()` / `list_memberships()` 与过滤函数。

**正面事实**

- 已有 private、跨空间、non-member 和多人隔离负向测试；
- `get_visible_document()` 对不可见文档返回 not found，避免确认资源存在。

**风险机制**

安全正确性取决于每个新入口都记得使用正确 helper。随着 endpoint 增长到 64 个，漏调用一次过滤即可形成越权路径；全量读取还会把数据量和权限范围扩大到应用内存。

**建议**

- 用户态 repository 查询必须显式携带 actor / space scope；
- 使用 `list_visible_documents(actor, space)`、`get_visible_document(actor, space, id)` 等安全默认 API；
- 无 scope 的全量方法标为 internal/admin，并限制调用位置；
- 关键权限过滤尽量下推 SQL；
- 模板要求每个权限域至少一组 cross-tenant / cross-space 负向用例。

### 4.8 CQ-P1-005：前后端错误契约被压成字符串

**事实证据（E1）**

- `frontend/src/api/client.ts:39-43` 把 envelope 强转为 `ApiEnvelope<T>`，失败只抛 `new Error(envelope.msg)`。
- HTTP status、业务 `code`、响应 header 和 request id 没有进入错误对象。
- `frontend/src/app/session-store.ts:51-52` 用 `/invalid token|unauthorized|\b401\b/i` 判断认证失效。
- 若服务端错误体不是 JSON，通用 `request()` 会在 `response.json()` 阶段直接抛解析异常；只有 download helper 有非 JSON fallback。

**风险机制**

- 服务端文案翻译或调整即可破坏认证分支；
- 前端无法按 4001 / 4003 / 4090 / 4220 做稳定处理；
- telemetry 无法区分网络错误、解析错误、HTTP 错误与业务错误；
- TypeScript 泛型只约束调用者相信的类型，不验证实际 JSON。

**建议**

定义结构化 `ApiError`：

```text
ApiError {
  status: number
  code: number | string
  message: string
  data?: unknown
  requestId?: string
  cause?: unknown
}
```

认证失效只按 `status === 401` 或稳定业务码判断，禁止匹配可变文案。网络 / 非 JSON / schema mismatch 使用独立错误类别。

### 4.9 CQ-P1-006：API schema 与前端类型手工同步

**事实证据（E1 / E2）**

- 64 个 FastAPI endpoint，`response_model=` 为 0。
- router 普遍返回 `dict[str, object]` 和手工 `_document_detail()` / `_version_detail()` 等映射。
- 前端在 `frontend/src/api/*.ts` 手写 snake_case 响应类型。
- `frontend/src/api/client.ts` 用 TypeScript `as ApiEnvelope<T>`，没有运行时 schema 校验。

**风险机制**

字段新增、可空性、枚举和错误 envelope 变化需要同时修改后端 dict、文档、前端类型和调用方。任一遗漏都可能在运行时才发现。

**建议**

- FastAPI 请求 / 响应使用明确 Pydantic model；
- 生成并固定 OpenAPI snapshot；
- 前端类型由 OpenAPI 生成，或至少 CI 做 schema diff / contract test；
- API-ID 继续用于文档追溯，但不能替代机器可执行 schema。

### 4.10 CQ-P1-007：Migration 治理与依赖漂移

**事实证据（E1）**

- `backend/service/db.py:46-55` 每次启动按文件名读取并执行全部 SQL。
- `backend/service/db.py:49-50` 注释明确“未做版本号追踪”。
- `backend/requirements.txt:20` 已依赖 Alembic，但仓库没有 Alembic 配置或调用。
- migration 编号存在历史跳号 / 保留语义，是否执行只由文件名排序和 SQL 自身幂等性决定。

**风险机制**

- 无法可靠回答某实例执行过哪些迁移；
- 依赖所有迁移永久可重入，未来数据迁移或非幂等变更难表达；
- Alembic 作为未使用直接依赖增加环境和认知成本；
- 启动时迁移与应用启动耦合，失败策略又是继续运行。

**建议**

- 选择一种权威迁移机制：正式使用 Alembic，或自制 ledger，但不能长期两套并存；
- migration 有版本表、校验和、执行状态和失败阻断；
- production migration 与 application start 的责任边界明确；
- 定期检查直接依赖是否实际使用。

### 4.11 CQ-P1-008：前端结构仍会增量回堆

**事实证据（E1 / E2）**

- `App.tsx` 已从历史 741 行降压并抽出多个域 hook，说明重构方向有效。
- 当前 `App.tsx` 545 行，仍装配十多个 hook、登录 / 注册页面、workspace、modal、drawer、跨域 refresh、layout。
- `App.tsx:172` 存在 `eslint-disable-next-line react-hooks/exhaustive-deps`，但项目并未安装 ESLint，注释实际上没有自动检查对象。
- `WorkspaceMain.tsx`、`ContextPane.tsx` 继续承担跨多个域的大 props surface。
- `LocalMountPane.tsx` 同时承担本地树 UI、导入、inline create / rename、右键菜单、删除确认等职责。

**判断**

`App` 现在主要是 orchestration，并非早期“全部业务逻辑堆在入口”，这是进步；但登录 shell、authenticated workspace shell 和 overlay composition 仍可进一步分离。问题核心不是必须压到某个绝对行数，而是超限文件仍可在后续 Sprint 继续增加。

**建议**

- 采用 changed-file ratchet：超限遗留文件可以暂存，但新 PR 不得无说明增加其行数 / 职责；
- 登录 / 注册 shell、workspace shell、overlay host 分组件；
- 对复杂 feature 用 reducer / state machine 或子 hook，避免大量相互约束的 `useState`；
- 阈值豁免必须记录“为何无法拆、何时复核、下一次新增应放哪里”。

### 4.12 CQ-P1-009：前端测试缺层且浏览器基础设施重复

**事实证据（E1 / E2）**

- `frontend/` 下没有 `*.test.ts(x)` / `*.spec.ts(x)`。
- `package.json` 没有 test runner。
- 17 个 smoke 脚本共 5,819 行。
- 至少 9 个浏览器 smoke 分别定义了同名 `findBrowser`、`CdpSession`、`waitForPage`：auth、folder tree、batch2、AI assistant、Sprint-27、Sprint-28、help、vault、REQ-051。
- 多个浏览器 smoke 为 400～556 行。

**风险机制**

- hook 与纯 UI 状态机的小回归只能通过较重的完整浏览器脚本发现；
- CDP / WebSocket / 浏览器发现逻辑修改需同步多个文件；
- 自制 runner 的重试、等待、截图、trace、fixture 和并发能力需要长期自行维护；
- smoke 脚本本身超过测试阈值，但当前 WSG 统计主要关注 `tests/`，容易漏掉 `scripts/`。

**建议**

- hooks / reducer /纯组件使用轻量单测；
- API client 做错误 envelope contract test；
- 浏览器路径采用 Playwright 等成熟 runner，或至少抽一个共享 `scripts/lib/cdp-*`；
- smoke 只验证关键纵切，不重复覆盖所有局部状态；
- 测试阈值覆盖 `scripts/smoke-*`，而不只 `tests/`。

### 4.13 CQ-P2-001：树形领域状态机复制

**事实证据（E2）**

- `useFolders.ts` 与 `useTermCategories.ts` 都维护 `ByParent` map、expanded id set、lazy load、inline create / rename、delete、reorder。
- `FolderTree.tsx` 与 `TermCategoryTree.tsx` 都实现递归 branch、node、context menu、上下移动和 inline editor。
- 注释直接说明术语领域树“仿 useFolders / FolderTree”。

**判断**

两个领域有真实差异，不能只为消除行数强行做高度泛型组件；但 lazy tree state、expanded state、inline editor 和 menu shell 已形成稳定重复，可抽低层 primitive，保留领域 command。

### 4.14 CQ-P2-002：异常与可观测性不一致

**事实证据（E1 / E2）**

- API 层存在 154 次 `HTTPException` 文本，多个 router 重复把领域异常映射到 4003 / 4004 / 4090 / 4220。
- 前端多处 `.catch(() => ...)` 静默回退，无法区分“允许降级”与“错误被吞”。
- 后端启动和 embedding 使用 `print`，认证 / reset 使用 `logging`。
- batch import 捕获宽泛 `Exception`，把 `str(exc)` 写入 item error；内部异常可能直接进入用户响应或持久化记录。

**建议**

- 统一 DomainError taxonomy 与全局映射；
- 静默 catch 必须注释“为何可忽略、降级值是什么、是否需要 telemetry”；
- 统一结构化 logging；
- 对外错误与内部诊断信息分离，避免直接暴露原始 exception 文本。

### 4.15 CQ-P2-003：代码注释混入过多过程历史

**事实证据（E2）**

- 前后端发现 286 处 Sprint、REQ、task、批次或序号式历史痕迹。
- 示例包括 “批3”“Sprint-28”“⑥”“旧 Task A / C”“某次 smoke 修复”等。

**判断**

REQ / API-ID 在安全边界、复杂契约或关键验收点保留有价值；但临时批次编号、实现过程和旧任务顺序会快速失去上下文。代码应解释稳定不变量和非显然原因，历史过程由 task、09、ADR、Git / PR 承担。

## 5. 综合评价

| 维度 | 评价 | 依据 |
|---|---|---|
| 规范性 | 中等 | 目录、命名、分层、TS strict 已形成；lint / format / schema / CI 不完整 |
| 可读性 | 中等偏上 | 领域命名清楚，hook / service 可定位；大文件、重复状态机和历史注释增加认知负担 |
| 可维护性 | 中等偏下 | repository、事务、权限默认、错误契约和 migration 是主要结构瓶颈 |
| 功能回归能力 | 后端较强、前端偏弱 | 323 个后端测试；前端缺 unit / component test，依赖重型 smoke |
| 工程安全性 | 存在 P0 缺口 | PG 测试目标未隔离，验证命令可能破坏开发数据 |
| AI 生成确定性 | 偏弱 | 规则已有但主要是提示型，缺少机器可执行 gate 和 ratchet |

总体判断：**当前代码不是不可维护的原型，但已经到达“继续只靠 AI 自觉会显著放大风险”的规模。** 下一阶段不应先做全面美化或一次性大重构，应先补能阻断新债务的自动护栏，再分域偿还高风险结构债务。

## 6. LUMEN 项目治理建议

### 6.1 推荐顺序

| 阶段 | 目标 | 建议内容 | 进入下一阶段条件 |
|---|---|---|---|
| A：安全止血 | 验证不能破坏数据，主分支至少验证代码 | test DB guard；拆 unit / PG 命令；CI typecheck/build/unit；PG fail-fast/readiness | P0 清零，CI 能稳定运行 |
| B：契约固化 | 错误、API、权限不再靠文案和调用者记忆 | `ApiError`；response model / OpenAPI；scoped repository query；DomainError 映射 | 新 endpoint 有机器契约和负向权限测试 |
| C：持久化治理 | 多步写操作可回滚、迁移可审计 | repository Protocol；contract tests；UoW；migration ledger / Alembic 定稿 | import/document/auth 关键用例有 rollback 证据 |
| D：前端减压 | 控制超限文件继续增长 | changed-file ratchet；拆 auth/workspace/overlay shell；tree primitives；LocalMount 子状态机 | 新功能不再增加超限入口职责 |
| E：测试基础设施 | 降低浏览器验证维护成本 | hooks / components unit；共享 Playwright 或 CDP harness；smoke 精简 | smoke helper 单一来源，关键纵切可重复执行 |

### 6.2 不建议的处理方式

- 不建议一次性拆完两个 repository 和全部大文件；变更面过大，回归成本高。
- 不建议单纯把行数阈值设成 CI hard fail；遗留基线会迫使 AI 机械拆文件或大范围重构。
- 不建议只增加更多文字规则；没有自动命令和 CI 的规则仍依赖 AI 记忆。
- 不建议为消除重复而创建过度泛型的万能树组件；应抽稳定 primitive，不吞掉领域差异。
- 不建议在同一 Sprint 同时改错误契约、API schema、repository 和 UI；应保持纵切、小步、可回滚。

## 7. 可回流模板的实现约束草案

### 7.1 回流原则

本轮建议优先合并、强化现有规则，不先新增庞大规则文件：

- `template-docs/web-fullstack-profile.md`：结构、阈值、ratchet、repository / smoke 覆盖；
- `ai/implementation-lifecycle-rules.md`：实现质量 gate、事务、权限、错误与测试数据库安全；
- `ai/doc-standards/project-rules.md`：项目必须填写的质量命令、测试隔离、豁免与 CI 状态；
- CI / scaffold：提供可执行 profile，而不是只给文案；
- 仅当上述文件职责明显过载时，再评估独立 `code-quality-profile`。

### 7.2 建议规则文本

| ID | 级别 | 候选规则 | 自动化证据 |
|---|---|---|---|
| TQG-001 | MUST | 数据库集成测试必须使用专用 test DB；执行 truncate/drop/delete-all 前必须校验 test 环境、test 数据库名和显式 destructive flag，任一不满足立即拒绝 | test DB guard 自测 |
| TQG-002 | MUST | 项目必须声明统一质量命令：format-check、lint、typecheck/compile、unit、integration、build、smoke；不适用项写明豁免 | `project-rules` 质量命令矩阵 |
| TQG-003 | MUST | 主分支 CI 至少执行不依赖人工环境的质量命令；“本地运行过”不能替代 CI | required checks |
| TQG-004 | MUST | 前端不得通过错误文案判断 HTTP / auth / permission 状态；错误对象必须保留 status、业务 code 和 cause | API client unit / contract test |
| TQG-005 | MUST | 用户态数据访问 API 必须显式携带 actor / tenant / space scope；无范围全量查询只允许 internal/admin，并标明调用边界 | cross-tenant negative tests |
| TQG-006 | MUST | 多步写业务用例必须声明事务边界；repository 不得让 service 无法控制整体 commit / rollback；eventual consistency 必须显式设计重试状态 | fault-injection rollback test |
| TQG-007 | MUST | fake / memory / PG 等多实现必须共享 Protocol / port 和 contract suite；禁止仅靠注释声明“same interface” | parity / contract test |
| TQG-008 | MUST | 强依赖初始化失败时 production 必须 fail-fast；liveness 与 readiness 分离；降级模式必须被显式授权 | startup / readiness smoke |
| TQG-009 | SHOULD | API 应提供机器可执行请求 / 响应 schema；前端类型应生成或由 contract diff 校验 | OpenAPI snapshot / generated types |
| TQG-010 | SHOULD | 文件阈值采用 changed-file ratchet：遗留超限可登记，后续修改不得无说明增加职责；豁免需写原因、复核点和新增代码去向 | changed-file size / complexity check |
| TQG-011 | SHOULD | WSG 文件阈值覆盖 repository、gateway、test utility、`scripts/smoke-*`，不只 App/service/controller/tests | threshold inventory |
| TQG-012 | SHOULD | 浏览器 E2E 优先使用成熟 runner 或共享 harness；同一底层驱动不得复制到多个 smoke 文件 | duplicate helper scan |
| TQG-013 | SHOULD | 静默 catch 必须说明允许降级原因与观测方式；对外错误不得直接暴露原始 exception | lint / review checklist |
| TQG-014 | SHOULD | 代码注释解释稳定不变量、边界和设计原因；Sprint / 批次 / commit 过程史写入 task、09、ADR 或 Git | code review checklist |
| TQG-015 | SHOULD | 直接依赖必须有实际 import / runtime 用途；候选工具不得先进入 requirements 后长期闲置 | dependency audit |

### 7.3 模板自动化最小闭环

规则回流不应止于 Markdown。建议模板提供以下最小机制：

1. 一个项目自填的 `quality-commands` 矩阵；
2. 一个轻量 CI profile，按项目启用前端 / 后端 / DB jobs；
3. changed-file 阈值脚本，只检查本次修改是否继续扩大已登记超限文件；
4. destructive test DB guard 示例；
5. repository contract test 示例结构；
6. API error contract 与 OpenAPI snapshot 示例；
7. 模板自检仅验证“入口和字段存在”，不强绑 ESLint / Ruff / Playwright 等具体技术栈。

这能保持模板技术栈中立，同时让派生项目必须给出可执行答案。

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 影响 / 阻塞关系 |
|---|---|---|---|---|---|
| CQ-C-001 | 是否优先修复 test DB 隔离 | 建议立即单独立项，P0 | 当前推荐验证命令可能清空开发数据 | 暂停 PG integration，只跑 unit | 不修则不应执行全量 discover |
| CQ-C-002 | 是否给 main 增加最小代码 CI | 建议在 P0 同批或紧随其后 | 现有测试无法自动保护主分支 | 保持人工验证 | 人工路径继续受 AI 会话随机性影响 |
| CQ-C-003 | 是否直接全面拆 repository | 不建议；先 Protocol + contract + 高风险域拆分 | 一次性变更面过大 | 全量重构 | 回归和合并风险高 |
| CQ-C-004 | Python / frontend 质量工具选型 | 建议项目确认 Ruff + Mypy 渐进策略、ESLint + Prettier 或等价方案 | 当前无统一静态规则 | 只保留 build / unittest | 无法自动发现 hooks、格式、未用代码和类型债务 |
| CQ-C-005 | 浏览器测试是否迁移 Playwright | 建议先做一个共享 harness PoC，再决定迁移 | 9 份 CDP helper 复制已形成维护成本 | 只抽本地 CDP lib | 零新依赖，但仍需自维护 runner 能力 |
| CQ-C-006 | 是否起草模板提案 | 建议基于 §7 起草一个总提案，内部按 gate 分阶段，不立即拆十多个提案 | 当前问题共享同一根因：规则不可执行 | 分多个主题提案 | 更细，但易重复并增加维护成本 |

## 9. 建议的后续产物

本报告落盘后，建议按以下顺序推进，均需用户单独确认：

1. LUMEN P0 修复任务：测试数据库隔离与最小 CI；
2. `_proposals/TEMPLATE-UPGRADE-code-quality-implementation-guardrails.md`：去项目化提炼 §7；
3. LUMEN 分阶段技术债 backlog：错误契约、API schema、repository / UoW、前端 ratchet、测试 harness；
4. 每阶段实施后把实际验证证据回写 `docs/09-verification.md`，本报告只保留评估快照与采纳状态。

## 10. 证据命令摘要

本轮使用的主要只读命令类型：

```powershell
git status --short --branch
git log --oneline -3
rg --files backend frontend tests scripts
Get-ChildItem ... | Get-Content | Measure-Object
rg -n '@router\.(get|post|put|patch|delete)' backend/api -g '*.py'
rg -n 'response_model\s*=' backend/api -g '*.py'
rg -n '^\s+def test_' tests/backend -g '*.py'
rg -n -g 'smoke-*.mjs' '^(class CdpSession|.*findBrowser|.*waitForPage)' scripts
rg -n 'HTTPException|except Exception|Sprint-|REQ-|task-' backend frontend/src
```

未执行：

```text
.venv\Scripts\python.exe -m unittest discover -s tests/backend -v
```

原因：`CQ-P0-001` 已确认该入口在默认 PG 可连接时可能执行 destructive truncate；在 test DB guard 修复前，运行它不符合工程安全要求。

