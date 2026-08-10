# LUMEN 代码治理体系落地实施计划（rollout plan）

> 定位：**活文档 / 实施路线图**。承接 PR #123 的体系文档（governance R1-R7 + framework L0-L3 + assessment 诊断 + rule-consolidation-map + 2 提案 + §4.2/§5），回答「下一步怎么做、什么顺序、跟到哪了」。每完成一个子项更新 §10 进度表并 commit。
>
> 状态：**AI 建议 · 待人工确认优先级与排期**。本文不授权直接改业务代码；每个代码改动子项仍按 `project-rules §6` 单独确认后另起 PR。
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

### P0-1：测试数据库隔离 guard（assessment CQ-P0-001）

**现状**：`tests/backend/test_pg_repository.py:17-30` 用生产 `SessionLocal`/默认 `DATABASE_URL`（`postgresql://lumen:lumen@localhost:15432/lumen`），`_truncate_all()` 执行 `TRUNCATE ... RESTART IDENTITY CASCADE`；默认 PG 可连即运行。README 推荐的 `unittest discover` 可能清空开发库。

**实施步骤**：
1. 建 `lumen_test` 数据库（`docker-compose` 加 init script 或 test service；CI 用临时 PG service）。
2. 三重 guard（任一不满足即拒绝执行，fail-closed）：
   - `LUMEN_ENV=test`
   - 数据库名匹配 `_test$`
   - 显式 `ALLOW_DESTRUCTIVE_TEST_DB=1`
3. `tests/backend/test_pg_repository.py` 启动期校验三 guard；不满足 `sys.exit` 或抛错。
4. README 分离命令：默认 unit（不触 PG）vs PG integration（需 guard）。
5. CI 用独立临时 PG，不复用开发实例。

**改动文件**：`tests/backend/test_pg_repository.py`、`backend/service/db.py`（或新 `backend/config.py`）、`docker/`（test db init）、`README.md`、`.github/workflows/`（P0-2 一并）。
**验收**：默认 `discover` 在开发库可连时仍拒绝执行；guard 有自测；CI 用 `_test` 库跑通。
**风险**：现有 PG 测试可能隐式依赖开发库 seed → 先确认 seed 在 `lumen_test` 可重建。

### P0-2：CI 最小代码门（assessment CQ-P0-002）

**现状**：`.github/workflows/project-check.yml` 只校验 whitespace + VERSION/CHANGELOG + derived-sync 边界；323 个后端测试从不跑、前端无 type/build。

**实施步骤**：
1. 新增 `backend-test` job：`setup-python 3.14` + `pip install -r requirements.txt -r requirements-dev.txt` + `pytest -m "not integration"`（unit 默认跑、integration 标记跳过，避免 CI 强依赖 PG）。
2. 新增 `frontend-build` job：`setup-node 22`（Volta）+ `npm ci` + `npm run build`（`tsc -b && vite build`）。
3. **advisory 起步**（governance §11.1.5）：先 `continue-on-error` 不阻断，基线清理后升 required。
4. 新建 `backend/requirements-dev.txt`（`pytest`/`httpx`/`ruff`）+ `backend/ruff.toml`（最小规则集）。
5. `frontend/package.json` 加 `typecheck`（`tsc -b --noEmit`）/ `lint`（可后置）脚本。

**改动文件**：`.github/workflows/project-check.yml`、`backend/requirements-dev.txt`、`backend/ruff.toml`、`frontend/package.json`。
**验收**：CI 跑后端 unit + 前端 build；advisory 失败可见但不阻断；测试 marker 生效（integration 不在 default 跑）。
**风险**：现有测试无 marker 区分 unit/PG → 需先给 PG 测试加 `@pytest.mark.integration`（P0-1 的 guard 帮助识别）。

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

（状态记号：⏳ 未开始 / 🚧 进行中 / ✅ 完成 / ⛔ 阻塞）

### 8.2 当前状态快照（2026-08-10）

- **PR #123（体系文档 10 文件）已 merge**（squash `273bf14`，2026-08-10；CI 曾因 assessment 结尾多余空行 fail，已修 `e36152b` 后 pass）。
- **P0-1/P0-2 方案已确认**（2026-08-10 会话，见 §9）：同 Sprint（Sprint-31 维护态批6）立项 → 编码。test DB 用 compose init script + 现有卷一次性 bootstrap；CI 以 advisory 起步（governance §11.1.5）；07 零 API 改动。
- **轨道 1 回流节奏已确认**：L0 基线提案（已入库）立即 submit-proposal；test DB guard 规则文本（`TEMPLATE-UPGRADE-db-safety-concern`）待 P0-1 落地后起草（用实现经验写准 `DB-SAFE-001`）。
- 轨道 2/3 代码改动均未开始。下一步：立项回写（02/08/09/project-rules）→ 编码 P0-1/P0-2。

## 9. 待人工确认项

1. ~~PR #123 是否合并（体系文档落地）？~~ ✅ **已确认**（2026-08-10 合并，squash `273bf14`）。
2. P0-1/P0-2 是否立即立项？test DB 用独立 service 还是 init script？ → ✅ **已确认**：同 Sprint（Sprint-31 维护态批6）立项 → 编码；test DB 用 compose init script（新卷生效）+ 现有卷一次性 `docker exec lumen-pg createdb -U lumen lumen_test` bootstrap。
3. CI 起步 advisory 还是直接 required？ → ✅ **已确认**：advisory 起步（`continue-on-error: true`，governance §11.1.5）。
4. 轨道 3 排期：P1 子项是否排入下个维护 Sprint？顺序（建议错误契约 → repository Protocol → 事务 → 其余）？ → ⏳ **仍待确认**（P0 落地后定）。
5. 轨道 1 回流时机？ → ✅ **已确认**：L0 基线提案立即 submit-proposal；test DB guard 规则文本待 P0-1 落地后起草回流。
