# LUMEN 代码治理体系落地实施计划（rollout plan）

> 定位：**活文档 / 实施路线图**。承接 PR #123 的体系文档（governance R1-R7 + framework L0-L3 + assessment 诊断 + rule-consolidation-map + 2 提案 + §4.2/§5），回答「下一步怎么做、什么顺序、跟到哪了」。每完成一个子项更新 §10 进度表并 commit。
>
> 状态：**AI 建议 · P0 方案已联合裁决定稿（A1/B1，2026-08-11 落盘 §3）· 待立项编码**。本文不授权直接改业务代码；每个代码改动子项仍按 `project-rules §6` 单独确认后另起 PR。
>
> 上位依据：`2026-08-10-ai-code-governance-framework.md`（§7.3 ratchet / §10 回流晋升 / §11 实施路线 / §12 常见错误）；诊断：`2026-08-10-code-quality-maintainability-assessment.md`（CQ-P0/P1/P2）。

## 0. 核心策略（一句话）

**三轨道并行 + P0 先行 + ratchet**：通用规则直接回流模板（轨道 1）；LUMEN 立刻做 2 个 P0 杠杆点止血（轨道 2）；复杂模式 LUMEN 渐进验证后再回流（轨道 3）。**不一次性大重构**——体系靠 ratchet 滚动生效。

> 为什么不「全 LUMEN 做完再回流」（思路 A）：通用规则（L0/CI 元规则）不需 LUMEN 验证，等大改完才回流会阻塞其他项目；且 LUMEN 全改是「一次性大重构」，正是 governance §12.4 列为错误的做法。

## 1. 前置

- **PR #123 merge**：体系文档（governance/framework/assessment/rule-map/提案/§4.2/§5）先入库，给后续所有工作锚点与规则依据。merge 前不做轨道 2/3 的代码改动。

## 2. 轨道 1：直接回流模板（通用规则，不需 LUMEN 验证）

跨项目公认、governance §10.2 晋升条件达标（无数项目成立 / 灾难级风险），直接走 `ai/commands/submit-proposal.md` 跨仓回流。

| # | 回流内容 | 来源 | 模板落点 | 现成提案 |
|---|---|---|---|---|
| 1.1 | L0 通用代码原则 12 条 | PR #123 B 提案 | `global-rules §2.1`（R1） | ✅ `_proposals/TEMPLATE-UPGRADE-global-rules-l0-code-principles.md` |
| 1.2 | CI 必跑 test/type/lint 元规则 | governance §11.1 / assessment TQG-003 | `implementation-lifecycle-rules` R2 Gate | ⚠️ 并入 1.1 或新提案 |
| 1.3 | test DB guard 规则文本（`DB-SAFE-001`） | assessment CQ-P0-001 / governance §5.2 | 新 `concerns/`（R4 DB/删除） | ❌ **待起草** `TEMPLATE-UPGRADE-db-safety-concern` |
| 1.4 | 错误不泄露内部细节 | L0 #7 / web-fullstack §9.1 | 已含于 1.1（R1） | ✅ |

回流流程（governance §9 + §10.5）：`submit-proposal` → 模板仓 issue → 模板维护者 `global-rules §9` 流程（读全部提案 → 去重 → 辅助修改 → PR）→ 下行同步 → 本项目 `_proposals/` 移入 `_archive/proposals/`。

## 3. 轨道 2：LUMEN P0 止血（最先做，代码改动，小步）

两个杠杆点，**不做则后续所有改动无回归保护**（governance §11.1 第一阶段）。

### P0-1：测试数据库隔离 guard（assessment CQ-P0-001 / 拟定 NFR-005）

> **联合裁决定稿（2026-08-10）**：原始步骤经 `2026-08-10-p0-engineering-governance-plan-evaluation.md` 复核修订并已核实——实际 **4 个 PG 测试面**（原方案只覆盖 1 个）；guard 落测试侧 `tests/backend/pg_test_support.py`（不进生产 `backend/service/`）；fail-closed 抛专用异常、**不降级 skip**。下方为最终实施口径。追溯 ID（NFR-005、task-041、TC-P2-GOV-001）为拟定，正式立项回写 `02/08/09` 时确认。

**现状（已核实）**：默认 `DATABASE_URL` 指向开发库 `postgresql://lumen:lumen@localhost:15432/lumen`，`backend/service/db.py` 模块加载即固化 `_DATABASE_URL` 与 engine（`db.py:34-36/78`）。**4 个测试面**会对该库执行破坏性操作或写入：

| 测试面 | 破坏性入口 |
|---|---|
| `tests/backend/test_pg_repository.py` | `_truncate_all()`：`TRUNCATE ... RESTART IDENTITY CASCADE` |
| `tests/backend/test_api_routes.py` | `setUpClass()`：schema 已存时 `TRUNCATE` + 重跑 seed |
| `tests/backend/test_api_sprint28.py` | `setUpClass()`：含 `lumen_sessions` 的 `TRUNCATE` + 重跑 seed |
| `tests/backend/test_ai_polish.py`（`AiPolishApiTest` 类） | 无 `TRUNCATE`，但 `init_db()` + 经 API 写 PG |

README / backend README / demo-guide 推荐的 `unittest discover` 在开发库可连时即触发上述行为 → 误清开发库。

**实施步骤**：
1. 独立 `lumen_test` 库（与开发库共用同一 PG service，独立 database）：
   - 新增 `docker/init-test-db.sql`（`CREATE DATABASE lumen_test;`），挂入 `docker/compose.yml` 的 `/docker-entrypoint-initdb.d/`——**仅对新 volume 生效**（已核实 compose 当前无 initdb 挂载）。
   - 现有 `lumen_pgdata` volume 需一次性建库 `docker exec lumen-pg createdb -U lumen lumen_test`（**状态变更，执行前单步确认**，不由测试隐式建/删库）。
2. 新增 `tests/backend/pg_test_support.py`（测试侧安全支持，**不进 `backend/service/`**）：
   - `assert_test_database_safe()` 校验三重条件，任一不满足抛专用 `UnsafeTestDatabaseError`（**不降级为 skip**）：① `LUMEN_ENV` 精确等于 `test`；② `engine.url.database` 以 `_test` 结尾且 scheme 为 PostgreSQL；③ `ALLOW_DESTRUCTIVE_TEST_DB` 精确等于 `1`。
   - 错误信息只列失败条件，**不含连接串/凭证**。
3. 接入 4 个测试面：guard 在连接 `try/except` **外**调用；每次 `TRUNCATE` 前二次调用；`AiPolishApiTest` 虽无 TRUNCATE 但写 PG，也须过 guard。
4. pytest integration marker：根 `pytest.ini` 注册（**非 `backend/pytest.ini`**——CI 从仓库根运行）；4 个 PG 测试面标 `@pytest.mark.integration`；`test_ai_polish.py` 混合（含纯 service 单测）→ 仅 `AiPolishApiTest` **类级**标记，不误排除同文件单测。
5. README 分离默认命令：默认 unit（`pytest -m "not integration"`，不触 PG）vs PG integration（需 guard + `lumen_test`）。`unittest discover` 不识别 marker，须以运行时 guard 兜底。

**改动文件**：`tests/backend/pg_test_support.py`（新）、`tests/backend/test_pg_repository.py`、`tests/backend/test_api_routes.py`、`tests/backend/test_api_sprint28.py`、`tests/backend/test_ai_polish.py`、`pytest.ini`（根，新）、`docker/init-test-db.sql`（新）、`docker/compose.yml`、`README.md`、`backend/README.md`、`docs/env/demo-guide.md`（默认命令）。
**验收**（评估 §4.4 验证包）：① guard 纯单测（三条件全满足才过，缺一即拒，非 PG URL 拒）；② 负向 smoke（指向开发库 `lumen` 时，PG 可达也在连接/SQL 前拒）；③ 默认 unit 排除 integration，`AiPolishApiTest` 被排、同文件 service 单测仍跑；④ 真实 PG integration（显式配 `lumen_test`）跑通 4 面；⑤ 开发库保护复核（只读核对未被 reset）。
**风险**：guard 被宽泛 `try/except Exception` 吞成 skip → 连接 try 外调用 + TRUNCATE 前二次调用；现有 PG 测试隐式依赖开发库 seed → 确认 seed 在 `lumen_test` 可重建。

### P0-2：CI 最小代码门（assessment CQ-P0-002 / 拟定 NFR-006）

> **联合裁决定稿（2026-08-10，A1/B1 已确认）**：CI 三 job；backend-test + frontend-build **advisory 起步 → 同 PR 内基线清完、合并前升 required**（A1）；`backend-lint`(ruff) 恒 advisory；**不新增前端 `typecheck`**（`build` 已含 `tsc -b`，已核实 `package.json:8`）；frontend-lint(eslint) **暂缓，记 P1**（B1，须在 NFR-006 / 05 §4.2.4 显式留痕，不静默漏）。追溯 ID（NFR-006、task-042、TC-P2-GOV-002）为拟定，立项回写时确认。

**现状（已核实）**：`.github/workflows/project-check.yml` 仅 whitespace + VERSION/CHANGELOG + derived-sync 边界，**零代码门**（无 pytest / 无 tsc / 无 lint / 无 build）。

**实施步骤**：
1. 新增 `backend-test` job：Python 3.14 + `pip install -r requirements.txt -r requirements-dev.txt` + `pytest -m "not integration" --strict-markers`（依赖 P0-1 的 marker 与根 `pytest.ini`）。
2. 新增 `frontend-build` job：Node 22.17.1（Volta）+ `npm ci` + `npm run build`（已含 `tsc -b`，**不再加 `typecheck` 脚本**）。
3. 新增 `backend-lint` job：根 `ruff.toml`（Python 3.14、最小 `E4/E7/E9/F`、**不自动格式化**）查 `backend/` 与 `tests/backend/`。
4. **严格度（A1）**：三 job 首次以 `continue-on-error: true` 起步（先看基线）；首次跑通、基线清完后，**在合并到 main 前移除 backend-test / frontend-build 的 `continue-on-error` 升 required**；`backend-lint` 保持 advisory（记录旧债基线，不阻断 P0）。
5. **frontend-lint(eslint)**：P0 **不做**；在拟定 `NFR-006` 与 `docs/05 §4.2.4` 记「frontend-lint 留 P1」（上位 §4.2.4 原列 4 job 含 eslint，暂缓须显式留痕）。
6. 新增 `backend/requirements-dev.txt`（锁 pytest / ruff / httpx）。

**改动文件**：`.github/workflows/project-check.yml`、`pytest.ini`（根，与 P0-1 共用）、`ruff.toml`（根，新）、`backend/requirements-dev.txt`（新）。
**验收**：CI 跑后端 unit + 前端 build + ruff；advisory 期失败可见不阻断；终态（合并前）backend-test / frontend-build required、ruff advisory；marker 生效（integration 不在 default 跑）。
**风险**：required 暴露旧测试失败 → 同 PR 内修基线，不以永久 advisory 掩盖（A1 口径）；全量 runtime 依赖致 CI 慢 → 启用 pip / npm cache。

> P0-1 与 P0-2 有耦合（test marker / CI job / test DB），建议**同一 Sprint 或两个紧邻小 PR** 完成。各 1-3 文件 + CI yaml。

## 4. 轨道 3：LUMEN 渐进实践 → 验证后回流（ratchet）

每项按 governance §10 五阶段：LUMEN 实践出可行模式 → 去项目化 → 回流。**触达时改、不触达不改、禁止恶化**。

| 子项 | 现状（assessment CQ） | LUMEN 实施方向 | 成功判定 → 回流形态 |
|---|---|---|---|
| 错误契约收口 | CQ-P1-005（code 二义/str(exc)/无兜底 5xx/前端丢 code） | `ApiError(code,msg,status)` + 集中 `code→HTTP` 映射 + 兜底 `Exception` handler + 禁 `str(exc)` | 前端不再靠文案判 auth → R3 Web Profile + R5 Adapter |
| repository Protocol + 按域拆 | CQ-P1-002（pg 1621/demo 1251，无 Protocol） | 定义 `RepositoryProtocol`，按域 `DocumentRepository` 等，双实现 contract test | 接口变更不再靠人工同步 → R1 模块化 + R5 |
| 事务边界 UoW | CQ-P1-003（多步写各自 commit） | service/UoW 拥有事务，repository 不独立 commit；故障注入 rollback 测试 | import/document 关键用例可回滚 → R4 DB Concern |
| response_model/codegen | CQ-P1-006（64 endpoint/0 response_model，类型双写） | FastAPI `response_model` + OpenAPI → 前端 codegen / schema diff | 后端加字段前端自动同步 → R3 + R5 |
| scoped repository query | CQ-P1-004（全量读取再过滤） | `list_visible_documents(actor,space)` 等安全默认 API，全量法标 internal | 越权不依赖调用者记忆 → R4 Auth Concern |
| fail-fast / readiness | CQ-P1-001（DB 失败仍启动） | production 强依赖失败 raise；liveness vs readiness 分离 | 端口可用≠可服务 → R4 可靠性 |
| 前端 ratchet + App 减压 | CQ-P1-008（App.tsx 545，超限回堆） | changed-file ratchet 脚本；拆 auth/workspace/overlay shell | 新 PR 不增加超限文件职责 → R3 + R6 |
| 配置集中 + secret 校验 | §4.2.4（env 散落 6 处，弱默认 key） | `backend/config.py`（pydantic-settings），启动校验 signing key 非默认 | 新配置单点 → R5 + R6 |
| 日志统一 | CQ-P2-002（print/logging 混用，静默吞） | 禁 `print`（CI grep），降级 `except` 必 `logger.warning` | 故障有诊断证据 → R1 可观测 + R5 |

> 轨道 3 不排统一死线；按 P1 优先级 +「该域被新功能触达时」推进。每项独立 PR，带 ratchet 检查。

## 5. 优先级矩阵

| 优先级 | 子项 | 轨道 | 改动规模 | 前置 |
|---|---|---|---|---|
| **P0** | test DB guard | 2 | 小（1-3 文件 + docker） | PR #123 merge |
| **P0** | CI 最小门 | 2 | 小（CI yaml + dev 依赖） | test marker（与上项耦合） |
| P1 | 错误契约收口 | 3 | 中（api/client + main） | CI 门（回归保护） |
| P1 | scoped query | 3 | 中（repository/service） | repository Protocol 候选 |
| P1 | repository Protocol | 3 | 中 | — |
| P1 | 事务 UoW | 3 | 中-大 | Protocol |
| P1 | fail-fast/readiness | 3 | 小 | — |
| P1 | response_model/codegen | 3 | 中 | CI 门 |
| P2 | 前端 ratchet + App 减压 | 3 | 中 | ratchet 脚本 |
| P2 | 配置集中 + secret 校验 | 3 | 小-中 | — |
| P2 | 日志统一 | 3 | 小 | CI grep |
| 并行 | L0/CI 元规则/test DB 文本 回流 | 1 | 跨仓提案 | PR #123 merge |

## 6. Ratchet 规则（governance §7.3）

- **新代码**必须遵守已落地的 §4.2【已落地】项 + L0 12 条；不得引入【待对齐】同类问题。
- **旧代码**触达时改（改到该模块至少补最小回归保护）；不触达不改。
- **指标不恶化**：超阈值文件数、`any` 数、裸 `fetch` 数、未类型化公共接口数、静默 `except` 数——只减不增。
- **技术债有 ID**（沿用 assessment CQ-* / §4.2 待对齐项），记风险、影响、触发修复条件。
- **安全/数据破坏/越权不适用长期豁免**（test DB、scoped query、事务）——优先修。

## 7. 风险与回滚

- **P0 改测试暴露 latent bug**：可能。缓解——advisory 起步、先确认 seed 可重建、guard 自测。
- **CI 升 required 阻断维护**：governance §11.1.5 要求 advisory 先行，基线清理后升 required。
- **ratchet 缺脚本**：changed-file 检查需脚本（轨道 3 前置）。无脚本则人工 review 兜底。
- **回滚**：每个子项独立 PR/commit，单点回滚；P0 的 guard 是 fail-closed，最坏是测试跑不了（而非清库）。

## 8. 跨会话续接锚点（防遗忘 · 活文档）

> **下次新对话第一步**：读本文件 §8 + `git log --oneline -5` + 最新 PR 状态；按 §8 进度表的「下一步」继续。体系规则依据读 governance/§4.2/§5。

### 8.1 进度跟踪表（执行后更新）

| 子项 | 轨道 | 状态 | PR / commit | 备注 |
|---|---|---|---|---|
| PR #123 体系文档 | — | ✅ 已 merge | #123 → `273bf14` | 前置（2026-08-10） |
| L0 基线回流 | 1 | 🚧 方案已确认·待回流 | — | 立即 submit-proposal |
| CI 元规则回流 | 1 | ⏳ | — | 并入 L0 或新提案 |
| test DB guard 规则文本 | 1 | ⏳ 待 P0-1 落地后起草 | — | `TEMPLATE-UPGRADE-db-safety-concern` |
| P0-1 test DB guard | 2 | 🚧 方案已确认·待立项+编码 | — | Sprint-31，最先 |
| P0-2 CI 最小门 | 2 | 🚧 方案已确认·待立项+编码 | — | 与 P0-1 同 Sprint |
| 错误契约收口 | 3 | ⏳ | — | P1 |
| repository Protocol | 3 | ⏳ | — | P1 |
| 事务 UoW | 3 | ⏳ | — | P1 |
| response_model/codegen | 3 | ⏳ | — | P1 |
| scoped query | 3 | ⏳ | — | P1 |
| fail-fast | 3 | ⏳ | — | P1 |
| 前端 ratchet | 3 | ⏳ | — | P2 |
| 配置集中 | 3 | ⏳ | — | P2 |
| 日志统一 | 3 | ⏳ | — | P2 |
| integration 全量入 CI gate | 2/3 | ✅ 已落地（维护态批11 / v3.8.8） | PR | 独立 `backend-integration` job（pgvector 服务容器 + fail-closed 预检 + 48 用例），闭环 docs/05 §4.2.4「另议」；merge 后待管理员升 required |

（状态记号：⏳ 未开始 / 🚧 进行中 / ✅ 完成 / ⛔ 阻塞）

### 8.2 当前状态快照（2026-08-11 · P0 联合裁决定稿落盘）

- **PR #123（体系文档 10 文件）已 merge**（squash `273bf14`，2026-08-10；CI 曾因 assessment 结尾多余空行 fail，已修 `e36152b` 后 pass）。
- **P0-1/P0-2 联合裁决定稿**（2026-08-10 裁决 / 2026-08-11 落盘 §3）：rollout 原方案 × 评估报告 → §3 已按评估修订口径重写并经代码核实。关键裁决：① PG 测试面 **4 个**（非 1 个）；② guard 落 `tests/backend/pg_test_support.py`（不进生产 service），三重 fail-closed 抛 `UnsafeTestDatabaseError` 不降级 skip；③ 根 `pytest.ini` + 根 `ruff.toml`；④ CI **A1**：backend-test / frontend-build advisory 起步 → 同 PR 内基线清完、合并前升 required，ruff 恒 advisory；⑤ **B1**：eslint 暂缓记 P1（05 §4.2.4 留痕）；⑥ 不新增前端 typecheck（build 已含 `tsc -b`）；⑦ 拟定 `NFR-005/006 + task-041/042 + TC-P2-GOV-001/002`，Sprint-31（维护态批6），目标版本 **v3.8.0**（MINOR，project-rules §2.4.2「Sprint 验收触发」）。
- **轨道 1 回流节奏**：L0 基线提案（已入库）立即 submit-proposal；test DB guard 规则文本（`TEMPLATE-UPGRADE-db-safety-concern`）待 P0-1 落地后起草（用实现经验写准 `DB-SAFE-001`）。
- 轨道 2/3 代码改动均未开始。下一步：立项回写（02/03/05/08/09/project-rules）→ 编码 P0-1/P0-2（走 PR）。
- **2026-08-12 追加（维护态批11 / v3.8.8）**：轨道 3 P1 已按序闭环 005（v3.8.4）/ 002（v3.8.5）/ 003（v3.8.6）+ 7 个存量 integration 失败整治（v3.8.7）+ **integration 全量入 CI gate**（新增独立 `backend-integration` job，闭环 docs/05 §4.2.4「另议」；merge 后待管理员升 main required check，先 merge 再设、观察 2-3 PR 稳定）。详见 `docs/research/2026-08-12-code-governance-closure-summary.md`。

## 9. 待人工确认项

1. ~~PR #123 是否合并（体系文档落地）？~~ ✅ **已确认**（2026-08-10 合并，squash `273bf14`）。
2. P0-1/P0-2 是否立即立项？test DB 用独立 service 还是 init script？ → ✅ **已确认**：同 Sprint（Sprint-31 维护态批6）立项 → 编码；test DB 用 compose init script（新卷生效）+ 现有卷一次性 `docker exec lumen-pg createdb -U lumen lumen_test` bootstrap。
3. CI 起步 advisory 还是直接 required？ → ✅ **已确认（A1，2026-08-10 裁决）**：backend-test / frontend-build **advisory 起步**（`continue-on-error: true`，governance §11.1.5），**同 PR 内基线清完后、合并 main 前升 required**；backend-lint(ruff) 恒 advisory。
4. 轨道 3 排期：P1 子项是否排入下个维护 Sprint？顺序（建议错误契约 → repository Protocol → 事务 → 其余）？ → ⏳ **仍待确认**（P0 落地后定）。
5. 轨道 1 回流时机？ → ✅ **已确认**：L0 基线提案立即 submit-proposal；test DB guard 规则文本待 P0-1 落地后起草回流。
6. 联合裁决其余口径（2026-08-10 裁决 / 2026-08-11 落盘 §3）？ → ✅ **已确认**：① PG 测试面 4 个（`test_pg_repository` / `test_api_routes` / `test_api_sprint28` / `test_ai_polish.AiPolishApiTest`）；② guard 落 `tests/backend/pg_test_support.py`（不进生产 service）；③ fail-closed 抛 `UnsafeTestDatabaseError` 不降级 skip；④ 根 `pytest.ini` / `ruff.toml`；⑤ **不新增前端 typecheck**（build 已含 `tsc -b`）；⑥ **eslint(frontend-lint) 暂缓记 P1**（B1，05 §4.2.4 留痕）；⑦ 用 `NFR-005/006`（非 `REQ-052/053`，工程治理无 U-ID 来源）；⑧ 拟定 `task-041/042 + TC-P2-GOV-001/002`，目标版本 v3.8.0。
