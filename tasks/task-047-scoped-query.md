# task-047：权限查询边界 scoped query（CQ-P1-004）

> 维护态批15 / Sprint-40 / CQ-P1-004 / governance rollout §4 轨道3 P1。
> 状态：**已完成（2026-08-13，PR #151 squash merge main `945bf8f`，bump v3.8.12）**。
> 依据：评估 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.7；rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。

## 背景 / 目标

用户态查询先全量读取再内存过滤（`repository.list_documents()` + `filter_visible_documents`），安全正确性依赖每个调用点记得组合，漏一次即越权；全量读取把数据量放大到应用内存。目标：repository 层提供安全默认查询 `list_visible_documents(user_id, space_id)`，用户态路径全部收口，全量方法标 internal 限制调用位置。

## 方案（已确认 A：两段式 SQL 下推）

- `RepositoryProtocol` + pg/demo 新增 `list_visible_documents(user_id, space_id)`
- pg：两段式——先查 memberships（非成员返回空），再 SQL where 下推（`space_id` + 非 private 或 owner）；与 `can_view_document` 语义完全同构，行为零漂移
- demo：复用 `filter_visible_documents`（过滤谓词保持单一事实源）
- `list_documents()` / `list_memberships()` 标 internal（docstring + 调用点收敛）
- 用户态 8 处调用点收口：timeline / search / rag / folder / export / api documents / tag / imports
- 系统内部路径保留 internal 用法：`ensure_documents_indexed`（document.py:217）
- 补 repository 级 cross-space / cross-user 负向测试 + 契约测试（双实现方法面 + 行为）

## 验证包

- pytest 全量（307 + 新增负向用例）零回归
- ruff passed / mypy 0 error
- CI 全绿（backend-test / frontend-build / backend-lint / frontend-lint / backend-typecheck / backend-integration）

## 后续候选（不在本次范围）

- SQL 全量下推（含 membership JOIN 单查询，方案 B）
- 模板回流 R4 Auth Concern（去项目化后提交提案）

## 完成记录（2026-08-13）

- 编码：Slice A（repository 契约 + pg/demo 双实现）+ Slice B（用户态 8 处调用点收口）+ 负向 / 契约测试；PR #151 `870898a` squash merge main `945bf8f`。
- 验证：mypy 0 error（55 files）+ ruff passed + 默认 pytest 304 passed / 4 skipped 零回归；CI PR #151 7 job 全绿（含 backend-integration 48 用例）。
- 收尾：bump v3.8.12（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05 + ai/project-rules §1 + rollout §4 状态回写。
- 残留候选：SQL 全量下推（方案 B）、模板回流 R4 Auth Concern——均不在本次范围。
