# task-049：强依赖 fail-fast / readiness（CQ-P1-001）

> 维护态批17 / Sprint-42 / CQ-P1-001 / governance rollout §4 轨道3 P1。
> 状态：**已完成（2026-08-13，Slice A + B + C 全闭环，bump v3.8.14）**。
> 依据：rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.2.4（print 债 main.py 部分）；`docs/07-api-spec.md` §1 / §3.4（5031）。

## 背景 / 目标

PG 强依赖模式下 `init_db` / `ensure_documents_indexed` 失败时，后端仅 `print` 一句话就继续启动（容忍降级），API 查询到时才报错——带病运行；运维 / 容器编排无法区分"进程活着"与"真的能服务"，也无 liveness / readiness 探针。目标：PG 模式强依赖失败 fail-fast 拒绝启动（demo 仓储模式保留容忍）；补 `/api/health/live`（存活）+ `/api/health/ready`（就绪，PG `db.ping()` 失败 503 + 新业务码 5031）探针；顺带收口 `main.py` 2 处 `print` → `logger`（§4.2.4 main.py 部分）。成功判定：PG 模式 init 失败启动 RuntimeError；demo 模式仍可启动；ready 探针 PG 失败返回 503/5031，前端 / 编排可据码判定。

## 方案（切片）

- **Slice A（启动 fail-fast）**：`backend/main.py` lifespan 改 except 分支化——`is_demo_repository(repository)` 真 → demo 容忍（`logger.warning`）；假（PG 强依赖）→ `logger.error(exc_info=True)` + `raise` 拒绝启动；2 处 `print` → `logger.info`（seed）/ `logger.warning`（demo 容忍）；docstring 更新。
- **Slice B（liveness / readiness）**：`error_codes.py` 新增 `DB_NOT_READY=5031`（→503，与 5030「外部 AI / OCR 不可用」语义分离）；`schemas.py` 新增 `HealthView`（status / db）；新 `api/health.py`（`/api/health/live` 200；`/ready` demo 200 / PG `db.ping()` 失败 raise HTTPException 503+5031，`response_model=ApiEnvelope[HealthView]`）；`create_app` 注册 `health_router`；`openapi/openapi.json` 重生成。
- **Slice C（测试）**：`tests/backend/test_health.py` 5 用例（live / ready demo / ready PG 503 / PG 启动 RuntimeError / demo 容忍仍启动）；`test_error_contract.py` 码集 +5031。

## 验证包

- pytest 全量零回归（基线 304 + 5 新 = 313 passed / 49 deselected）
- mypy 0 error（57 files）/ ruff passed
- OpenAPI 快照 `git diff --exit-code` 绿
- CI 8 job 全绿（含 backend-integration 48 / schema-diff required）

## 后续候选（不在本次范围）

- 前端 codegen（openapi-typescript 新 devDependency）——沿用 CQ-P1-006 后续候选
- §4.2.4 print 债剩余（`pg_repository.py:324` + 降级 except 静默吞）→ CQ-P2-002 日志统一

## 完成记录

- **编码**：Slice A（`main.py` lifespan except 分支化 + print→logger + docstring）+ Slice B（`error_codes.py` DB_NOT_READY=5031 + `schemas.py` HealthView + 新 `api/health.py` live/ready + `create_app` 注册 + openapi 重生成 +91）+ Slice C（`test_health.py` 5 用例 + `test_error_contract` 码集+5031）。
- **修正**：原方案 readiness 复用 5030，编码前核实发现 5030 已被「AI/OCR 不可用」占用（一个 code 两种语义违反 CQ-P1-005），改为新增 5031 DB_NOT_READY；Slice A 模式判定精确到 `is_demo_repository(repository)` 分支化 except（非抽象「非 demo 模式」）。
- **验证**：health 5/5 + 码集断言；mypy **0 error**（57 files）+ ruff passed + 默认 pytest **313 passed / 49 deselected** 零回归；快照 `git diff --exit-code` 绿；CI PR #154 **8 job 全绿**（含 backend-integration 48 / schema-diff required）。
- **收尾**：bump v3.8.14（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05/07 + ai/project-rules §1 + rollout §8.1 状态回写 + prod compose 后端 healthcheck 接 `/api/health/ready`、frontend depends_on 升 `service_healthy`。
- **残留候选**：前端 codegen、§4.2.4 print 债剩余（CQ-P2-002）——均不在本次范围。
