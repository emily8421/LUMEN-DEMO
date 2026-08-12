# task-043：UoW 事务边界（CQ-P1-003 / NFR-008）

> Sprint-34（维护态批9）· P1 事务治理。上游：`docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.6 CQ-P1-003、`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 + §5 轨道C。依赖 CQ-P1-002 的 RepositoryProtocol（Slice C PR #140）提供契约基础。

## 元信息

- Sprint：Sprint-34（维护态批9）
- 关联：CQ-P1-003（事务边界 UoW）、NFR-008
- 上游依据：assessment §4.6 CQ-P1-003、rollout §4 轨道3 + §5 轨道C
- 分支：`feat/p1-003-slice-a-uow-foundation` / `feat/p1-003-slice-b-service-uow` / `feat/p1-003-slice-c-uow-rollback`
- 依赖：CQ-P1-002（RepositoryProtocol，PR #140）

## 目标

多步写各自 commit → service/UoW 拥有事务 + 故障注入 rollback 测试（CQ-P1-003）。

## 修改范围

- **Slice A**：`backend/repository/uow.py`（新）+ `pg_repository.py` 机械替换（96 处 `with SessionLocal()`→`_session_scope()`、删 50 处 commit）
- **Slice B**：`backend/service/document.py`（3 函数写步包 UoW）+ `imports.py`（主流程原子事务、删 :108 重复、事务边界）
- **Slice C**：`tests/backend/test_uow_rollback.py`（新，integration）+ `pg_repository.create_import_job` pending-id 修复

## 验收标准

1. service 层多步写（create/update/restore + import 主流程）包入 UoW 原子事务。
2. `create_import_job` / `fail_import_job` 在事务外独立提交（失败标记不随 rollback 抹掉、不掩盖原异常）。
3. rollback 真语义由 PG integration 测试（`test_uow_rollback`）验证：文档/版本/chunks 全撤销 + import_job 不残留 done。
4. 默认 306 零回归 + ruff 37 不增。

## 完成记录

- **Slice A PR #141 `5f017b6`**：`uow.py`（contextvar 感知 `_session_scope` 收口 commit + `UnitOfWork`/`DemoUnitOfWork` 双实现 + `unit_of_work` 工厂按 is_demo 分流 + `UnitOfWorkProtocol`）+ pg_repository 机械替换；`test_uow_contract.py` 5 测试。验证：默认 306（+5）零回归 + ruff 37 不增。
- **Slice B PR #142 `09137a4`**：document.py 三函数写步包 `with unit_of_work(repository):`（权限校验读在外，nested join）；imports.py `import_extracted_text` 主流程原子事务、`create_import_job`/`fail_import_job` 事务外、删 :108 重复 `replace_document_chunks`、chunk_count 改 `list_document_chunks` 取。验证：默认 306 零回归 + ruff 37 不增。
- **Slice C PR #143 `7c64545`**：`test_uow_rollback.py`（integration，patch `replace_document_wikilinks` 注入 RuntimeError）验证回滚 + import_job 不残留 done；**修复 `create_import_job` pending-id 缺陷**（`_to_import` 读 `job.id` 前显式 `flush`，autoflush 不因访问 pending 主键触发）。验证：`test_uow_rollback` + `test_import_lifecycle`（PG）PASSED + 默认 306 零回归 + ruff 干净。
- **已知债**：PG integration 首次全量跑暴露 **7 个存量失败**（`create_term` 等 pending-id 类 / datetime `isoformat` 序列化 / LLM mock 环境）——与本次无关、此前被默认 `not integration` 跳过，已登记 `docs/05 §4.2.4`，待单独立项整治（pending-id 优先，系统性）。

## 待确认

- 7 个存量 integration 失败单独立项处理（pending-id 类建议统一排查全部 `create_*` 的 `_to_xxx`）。
