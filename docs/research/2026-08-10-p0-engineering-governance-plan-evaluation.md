# P0 工程治理实施方案评估

> 定位：本文件是对「P0 测试数据库隔离 guard + CI 最小代码门」候选实施方案的只读专题评估记录，属于 `docs/research/` 辅助留痕。
> 本文件不替代 `docs/02-srs.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 或 `ai/project-rules.md`，也不代表已授权实施、已完成立项或已通过验收。

## 0. 评估元信息

| 项 | 内容 |
|---|---|
| 评估日期 | 2026-08-10 |
| 评估对象 | P0-1 测试数据库隔离 guard；P0-2 CI 最小代码门 |
| 上游依据 | `docs/research/2026-08-10-code-governance-rollout-plan.md` §3/§8/§9、`docs/research/2026-08-10-code-quality-maintainability-assessment.md`、`docs/05-tech-spec.md` §4.2.4 |
| 规则依据 | `ai/document-lifecycle-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` §1/§2/§5/§6 |
| 评估方式 | 本地只读检查；未修改代码、测试、CI、Docker、需求或 Sprint 状态 |
| 结论 | **Conditional Go：方向正确，但不建议按候选方案原样实施** |

## 1. 结论摘要

候选方案识别出的两个 P0 杠杆点成立：当前 PostgreSQL 集成测试存在误清开发库风险，当前 CI 也没有后端测试和前端构建门禁。三重 fail-closed guard、独立 `lumen_test` 数据库、pytest integration 分层和 CI 最小门均值得实施。

但候选方案仍有以下关键缺口：

1. 实际 PG 测试面不止两个文件：共有三个 `TRUNCATE` 入口，另有一个会连接并写入真实 PG 的混合测试类。
2. guard 若放在宽泛 `try/except Exception` 内，可能被错误转换成 `SkipTest`，使 fail-closed 失效。
3. pytest marker 不影响项目当前推荐的 `unittest discover`，默认测试入口必须同步调整。
4. `continue-on-error: true` 的后端测试和前端构建只是可见性检查，不是代码门。
5. 前端 `npm run build` 已含 `tsc -b`，无需重复增加 `typecheck`。
6. 测试安全和 CI 门属于工程非功能要求，直接新增 `REQ-052/053` 会产生无 U-ID 来源的功能需求。
7. 该范围超过单 Task 阈值，应拆为两个相邻 Task；若以 Sprint-31 完成，还需按项目版本规则形成版本闭环。

因此建议先按本文 §4 修订方案，再进入正式立项和实施。

## 2. 已核对的代码事实

### 2.1 真实 PG 与破坏性操作入口

| 位置 | 当前行为 | 风险 |
|---|---|---|
| `tests/backend/test_pg_repository.py`：`_truncate_all()` | 每个测试前及类结束时执行 `TRUNCATE ... RESTART IDENTITY CASCADE` | 默认 `DATABASE_URL` 指向开发库时会反复清库 |
| `tests/backend/test_api_routes.py`：`ApiRouteTest.setUpClass()` | schema 已存在时执行 `TRUNCATE`，再重跑 seed migration | PG 可达即可能清开发库 |
| `tests/backend/test_api_sprint28.py`：`Sprint28ApiTest.setUpClass()` | 执行包含 `lumen_sessions` 的 `TRUNCATE`，再重跑 seed migration | 候选方案漏报此入口 |
| `tests/backend/test_ai_polish.py`：`AiPolishApiTest` | 调用 `init_db()`，随后通过 API 创建文档、session 和 AI 草稿数据 | 虽无 `TRUNCATE`，仍不应写入开发库 |

前三个文件可使用 module-level integration marker；`test_ai_polish.py` 同时包含纯 service 单测，只能给 `AiPolishApiTest` 类加 integration marker，否则会误排除纯单元测试。

### 2.2 数据库配置事实

`backend/service/db.py` 在模块加载时读取 `DATABASE_URL` 并固化为 `_DATABASE_URL`，随后立即创建 SQLAlchemy engine。默认值为：

```text
postgresql://lumen:lumen@localhost:15432/lumen
```

这意味着 guard 必须校验测试实际使用的 URL / engine，而不能依赖后续修改环境变量；错误信息也不能输出含密码的完整连接串。

### 2.3 当前测试与 CI 入口

- 根 `README.md`、`backend/README.md` 与 `docs/env/demo-guide.md` 当前仍推荐 `python -m unittest discover -s tests/backend -v`。
- pytest marker 不会被 `unittest` 识别，因此 marker 只能用于 pytest/CI 分层，不能替代运行时 guard。
- `.github/workflows/project-check.yml` 当前只有 whitespace、版本一致性和 derived-sync 边界检查，没有后端测试、前端构建或 lint。
- `frontend/package.json` 的 `build` 已是 `tsc -b && vite build`。
- 本地 `.venv` 已有 pytest；项目尚无正式 `requirements-dev.txt`、pytest 配置或 Ruff 配置。

### 2.4 技术环境与阶段边界

- `docs/05-tech-spec.md` 已将 PostgreSQL/pgvector 与基础 Web/ORM 栈标为 Go，并把 CI 代码门列为最高优先级待对齐项。
- `ai/project-rules.md` 允许经确认后增加项目所需依赖，但新增依赖必须进入依赖文件。
- 当前项目处于 Phase2D 完成后的维护态；P0 工程治理不新增用户功能、不改变下一 Phase 功能范围。

## 3. 对候选方案的逐项评估

| 候选项 | 评价 | 修订要求 |
|---|---|---|
| 三重 guard：`LUMEN_ENV=test` + `_test` 后缀 + 显式允许开关 | **采纳** | 任一不满足必须抛专用异常；不得降级为 skip |
| guard 只接入两个 PG 测试文件 | **不采纳** | 覆盖三个 `TRUNCATE` 模块和 `AiPolishApiTest` |
| guard 放入 `backend/service/db.py` | **不推荐作为首选** | 优先放 `tests/backend/pg_test_support.py`，避免生产 service 承载测试专属破坏性逻辑 |
| PG 不可达时 `SkipTest` | **有条件采纳** | 必须先通过 guard，再尝试连接；只有连接 / 环境不可用才能 skip |
| 独立 `lumen_test` 数据库 | **采纳** | P0 可与开发库共用 PG service，但必须是独立 database；无需先增加第二套 PG service |
| compose init script | **采纳** | 明确仅对新 volume 生效；现有 volume 需一次性建库步骤 |
| pytest integration marker | **采纳** | 根目录注册 marker；CI 使用严格 marker；混合模块按 class 标记 |
| `backend/pytest.ini` | **不推荐** | CI 从仓库根运行时可能不读取子目录配置；改用根 `pytest.ini` |
| 后端 unit 与前端 build 全部 advisory | **不采纳为最终状态** | 合并前应为 required；仅 Ruff advisory |
| 新增前端 `typecheck` | **不采纳** | `npm run build` 已包含 TypeScript 编译 |
| 新增 `REQ-052/053` | **不采纳** | 改为 `NFR-005/006`，避免无 U-ID 功能需求 |
| P0-1/P0-2 同一 Sprint | **采纳** | 拆两个相邻 Task、独立提交或小 PR；P0-1 先于 P0-2 |

## 4. 推荐修订方案

### 4.1 文档与追溯

建议建立以下链路：

```text
NFR-005 测试数据库安全
  → Sprint-31 / task-041-test-db-safety-guard
  → TC-P2-GOV-001

NFR-006 CI 最小回归门
  → Sprint-31 / task-042-ci-minimum-gates
  → TC-P2-GOV-002
```

建议回写：

- `docs/02-srs.md`：新增 `NFR-005/006`，不新增功能 REQ。
- `docs/03-prd.md`：只做影响评估，结论为“不改变功能 Phase / 交付物范围”；无必要新增功能条目。
- `docs/05-tech-spec.md` §4.2.4：记录 test DB guard、required unit/build 和 advisory lint 的落地状态。
- `docs/08-dev-plan.md`：新增 Sprint-31，并拆 task-041/042。
- `docs/09-verification.md`：新增 `TC-P2-GOV-001/002`；未执行前保持“待执行”。
- `ai/project-rules.md` §1：仅在正式立项后登记维护态批6，不提前写成已完成。
- rollout plan §8：在实施后更新进度；本评估本身不改变其 P0 状态。

若 Sprint-31 完成，根据 `ai/project-rules.md` 项目版本规则应至少形成 MINOR 版本闭环，建议目标版本 `v3.8.0`；未完成验收前不得提前 bump。

### 4.2 P0-1：测试数据库安全

建议新增 `tests/backend/pg_test_support.py`，职责限定为测试侧安全支持：

1. 从实际 URL 或 `engine.url.database` 获取 database 名称。
2. 要求 `LUMEN_ENV` 精确等于 `test`。
3. 要求 database 名称以 `_test` 结尾，且 URL scheme 为 PostgreSQL。
4. 要求 `ALLOW_DESTRUCTIVE_TEST_DB` 精确等于 `1`。
5. 失败抛专用 `UnsafeTestDatabaseError`，错误信息只列失败条件，不输出连接串或凭证。

接入规则：

- guard 在连接尝试的 `try/except` 外调用，避免被转换为 `SkipTest`。
- 每个 `TRUNCATE` 执行前再次调用 guard。
- `AiPolishApiTest` 虽不执行 `TRUNCATE`，但会写 PG，也必须要求独立测试库。
- guard 单测使用显式 URL / 环境映射，不连接真实数据库。

Docker 采用同 service 独立 database 的最小方案：

- 新增 `docker/init-test-db.sql` 创建 `lumen_test`。
- 在 `docker/compose.yml` 挂入 `/docker-entrypoint-initdb.d/`。
- README 明确 init script 只对新 volume 生效；现有 `lumen_pgdata` 需人工执行一次性建库命令。
- 一次性建库是状态变更，执行时必须单步确认；不得由测试隐式创建或删除数据库。

### 4.3 P0-2：CI 最小门

建议最终 workflow 分为：

| Job | 最小动作 | 合并门禁 |
|---|---|---|
| `backend-test` | Python 3.14；安装 runtime + dev 依赖；`pytest -m "not integration" --strict-markers` | **required** |
| `frontend-build` | Node 22.17.1；`npm ci`；`npm run build` | **required** |
| `backend-lint` | Ruff 最小规则集检查 `backend/` 与 `tests/backend/` | **advisory** |

实施细节：

- 新增 `backend/requirements-dev.txt`，锁定 pytest 与 Ruff。
- 新增根 `pytest.ini`，注册 `integration` marker。
- 新增根 `ruff.toml`，按 Python 3.14 配置最小 `E4/E7/E9/F` 规则集；不在 P0 引入自动格式化。
- 不新增前端 `typecheck` 脚本；复用已有 `npm run build`。
- P0 不强制在 CI 启动 PostgreSQL service；真实 PG integration 先在独立 `lumen_test` 本地验证，后续再评估独立 CI integration job。

如果首次 PR 暴露现有 unit/build 失败，可以在该 PR 内先观察和修复，但最终合并到 `main` 的 workflow 不应保留 unit/build 的 `continue-on-error`。

### 4.4 验证包

最低验证顺序：

1. guard 纯单测：三条件全部满足才通过；分别缺失任一条件均拒绝；非法 / 非 PG URL 拒绝。
2. 负向安全 smoke：指向开发库 `lumen` 时，即使 PG 可达也必须在连接 / SQL 前拒绝。
3. 默认 unit：pytest 明确排除 integration，且 `AiPolishApiTest` 被排除、同文件 service 单测仍执行。
4. 真实 PG integration：显式配置 `lumen_test` 后运行四个 PG 测试面。
5. 开发库保护复核：只读核对开发库未被 reset。
6. 前端 build：继续使用 `npm run build`。
7. Ruff：记录 advisory 基线，不因旧债阻断 P0。
8. 配置检查：workflow YAML、pytest marker、Docker Compose 配置均可解析。

## 5. 风险与取舍

| 风险 | 影响 | 缓解 |
|---|---|---|
| guard 被宽泛异常捕获 | 危险配置被误报为 skip | guard 放在连接 `try` 外；SQL 前二次调用 |
| marker 只对 pytest 生效 | 旧 `unittest discover` 仍进入 PG 测试 | 更新默认命令 + runtime guard 双保险 |
| init script 不作用于已有 volume | 用户以为 `lumen_test` 已创建 | README 明确新旧 volume 差异和一次性步骤 |
| required CI 暴露旧测试失败 | PR 暂时无法合并 | 在同一 PR 修复基线；不以永久 advisory 掩盖 |
| 全量 runtime 依赖使 CI 较慢 | 首次安装耗时增加 | 启用 pip/npm cache；后续再评估轻量测试依赖分层 |
| Ruff 旧债较多 | advisory 输出噪声 | P0 只建基线，不自动格式化、不顺手全仓整改 |

## 6. 最终建议

评估结论为 **Conditional Go**：

- **可以立项**：独立 `lumen_test`、三重 fail-closed guard、pytest integration 分层、required unit/build、advisory Ruff。
- **不得原样实施**：只覆盖两个 PG 测试、guard 可能被 skip、unit/build 永久 advisory、重复前端 typecheck、直接新增无来源 `REQ-052/053`。
- **进入实施的条件**：按 §4 修订为 `NFR-005/006 + Sprint-31 + task-041/042 + TC-P2-GOV-001/002`，并确认新增开发依赖与一次性测试库建库操作。

本报告仅提供方案判断与推荐口径；后续是否立项、修改文件、安装依赖、创建数据库、提交或推送，均需另行明确授权。
