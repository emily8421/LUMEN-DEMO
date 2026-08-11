# task-041：测试数据库安全 guard（P0-1 / NFR-005）

> Sprint-31（维护态批6）· P0 止血 · 杠杆点。上游：`docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1（联合裁决定稿）、`docs/research/2026-08-10-p0-engineering-governance-plan-evaluation.md` §2/§4.2/§4.4。本任务单不重复 rollout §3 全文，以 §3 为唯一实施口径。

## 元信息

- Sprint：Sprint-31（维护态批6）
- 关联：NFR-005（测试数据库安全）、TC-P2-GOV-001
- 上游依据：assessment CQ-P0-001、rollout §3 P0-1、`docs/05-tech-spec.md` §4.2.4
- 分支：`chore/p0-test-db-guard-and-ci`

## 目标

防止 PG 集成测试误清开发库：独立 `lumen_test` 库 + 三重 fail-closed guard，覆盖全部 4 个 PG 测试面。

## 输入文档

- `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1（定稿口径）
- `docs/research/2026-08-10-p0-engineering-governance-plan-evaluation.md` §2 / §4.2 / §4.4
- `backend/service/db.py`（`_DATABASE_URL` / `engine` 模块级固化）
- `tests/backend/test_pg_repository.py` / `test_api_routes.py` / `test_api_sprint28.py` / `test_ai_polish.py`（4 PG 测试面）
- `docker/compose.yml`（PG service）

## 修改范围

- 新增 `tests/backend/pg_test_support.py`（`assert_test_database_safe()` + `UnsafeTestDatabaseError`）
- 新增 `docker/init-test-db.sql`（`CREATE DATABASE lumen_test;`）+ `docker/compose.yml` 挂载到 `/docker-entrypoint-initdb.d/`
- 新增根 `pytest.ini`（注册 `integration` marker，与 task-042 共用）
- 改 `tests/backend/test_pg_repository.py` / `test_api_routes.py` / `test_api_sprint28.py`（连接前 + TRUNCATE 前过 guard；module/class integration marker）
- 改 `tests/backend/test_ai_polish.py`（`AiPolishApiTest` 类级 integration marker + 写 PG 前过 guard）
- 新增 `tests/backend/test_pg_test_support.py`（guard 纯单测）
- 改 `README.md` / `backend/README.md` / `docs/env/demo-guide.md`（默认命令分离 unit vs PG integration）

## 验收标准（评估 §4.4 验证包）

1. guard 纯单测：三条件全满足才过；缺任一即拒；非 PG URL 拒。
2. 负向安全 smoke：指向开发库 `lumen` 时，PG 可达也在连接 / SQL 前拒。
3. 默认 unit：`pytest -m "not integration"` 排除 4 个 PG 面；`AiPolishApiTest` 被排、同文件 service 单测仍跑。
4. 真实 PG integration：显式配 `lumen_test` + 三 guard env 后，4 个 PG 测试面跑通。
5. 开发库保护复核：只读核对开发库 `lumen` 未被 reset。

## 降级 / Mock 边界

- guard 是 fail-closed：不满足条件直接 `UnsafeTestDatabaseError`，**不降级 skip**（仅在 guard 已过、PG 连接 / 环境不可用时才 skip 连接）。
- `lumen_test` 现有 volume 需一次性 `docker exec lumen-pg createdb -U lumen lumen_test`（状态变更，执行前单步确认）。

## 禁止事项

- guard 不得放 `backend/service/`（生产 service 不承载测试专属破坏性逻辑）；落 `tests/backend/pg_test_support.py`。
- guard 不得被宽泛 `try/except Exception` 吞成 skip；连接 `try` 外调用 + TRUNCATE 前二次调用。
- 错误信息不含连接串 / 凭证。
- 不改 `backend/service/db.py` 的生产逻辑（只读其 `_DATABASE_URL` / `engine`）。
- 不引入新生产依赖（pytest / httpx 进 `requirements-dev.txt`，属 task-042 范围）。

## 完成记录

- **commit**：`c2838ea`（feature 分支 `chore/p0-test-db-guard-and-ci`，PR #124 squash 合并 main `c26bb63`，2026-08-11）。
- **验证（评估 §4.4 五面全过）**：① guard 单测 10/10；② 负向 smoke 指向开发库 `lumen` 被 guard 拒（17 ERROR 非 skip）；③ 默认 unit `pytest -m "not integration" --strict-markers` 排除 4 PG 面（286 passed / 47 deselected）；④ 真实 PG integration 47 passed（`lumen_test`，`createdb` 已建）；⑤ 开发库 `lumen` 保护复核未 reset。
- **残留风险**：无；`lumen_test` volume 需一次性 `createdb`（已做）。

## 待确认

- 现有 `lumen_pgdata` volume 的一次性 `createdb lumen_test` 时机（执行前单步确认）。
