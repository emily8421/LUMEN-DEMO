# task-071：service 注解收窄到域子 Protocol

> Sprint-67（维护态批42）/ REQ-011 既有质量保障 / TC-P2-GOV-031。
> 状态：已完成（2026-08-21）。不新增产品需求、API、后端、数据库、依赖或运行时行为。

## 目标

将 `backend/service/` 中实际只依赖单一领域 repository 方法的 service 参数注解，从聚合
`RepositoryProtocol` 收窄到对应域子 Protocol（`UserRepository` / `OpsRepository`），兑现
ISP「最小依赖面」，让静态检查 / IDE 识别最小依赖。跨 2-5 域与跨 service 委托的消费方
经逐模块评估后维持聚合。

## 依据

- `docs/research/2026-08-18-code-directory-review.md` §1.4（ISP / god object）
- `backend/repository/protocol.py` docstring「Slice C」注释
- `docs/08-dev-plan.md` Backlog BE-PROTO-1

## 修改范围

- `backend/service/auth.py`、`backend/service/auth_reset.py`：`repository: RepositoryProtocol` → `UserRepository`（import 同步）
- `backend/service/vault_mounts.py`：`repository: RepositoryProtocol` → `OpsRepository`（import 同步）
- `backend/repository/protocol.py`：docstring 更新为「Slice C 部分完成」

## 越界检查

- 不定义组合 Protocol；不迁移 document / folder / imports / ai_polish 等跨域 service
  （其向跨域 service 聚合参数传 repository，收窄会破坏 mypy）。
- 不改 API、运行时 repository 实现、数据库、依赖或前端。

## 验证（2026-08-21 全绿）

- `mypy backend`：Success（60 source files, no issues）
- `pytest tests/backend/test_repository_contract.py`：7 passed
- `pytest -m "not integration"`：333 passed（50 deselected）
- `ruff check backend`：all checks passed

## 完成记录（2026-08-21）

改动 4 文件（3 个 service 注解 + protocol.py docstring），纯类型收窄零运行时变化。
跨域消费方（document / folder / imports / ai_polish 等）经逐模块评估维持聚合
`RepositoryProtocol`——mypy 对 Union 属性取交集，跨域无法用子 Protocol 并集收窄。
