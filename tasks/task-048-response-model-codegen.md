# task-048：API 响应契约 response_model·codegen（CQ-P1-006）

> 维护态批16 / Sprint-41 / CQ-P1-006 / governance rollout §4 轨道3 P1。
> 状态：**已完成（2026-08-13，Slice A + B-1..B-3 全闭环，bump v3.8.13）**。
> 依据：评估 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.9；rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3；docs/05-tech-spec.md §4.2.3。

## 背景 / 目标

64 个 FastAPI endpoint、`response_model=` 0 个：路由普遍返回 `dict[str, object]` + 手工 `_document_detail()` 等映射，前端在 `frontend/src/api/*.ts` 手写 snake_case 响应类型，字段新增 / 可空性 / 枚举变化需要同时改后端 dict、文档、前端类型和调用方。目标：后端响应用明确 Pydantic model（`response_model=`），固定 OpenAPI snapshot，CI 做 schema diff 防漂移；前端类型可由此生成或至少以机器契约为准（成功判定：后端加字段前端自动同步）。

## 方案（切片：advisory → required 三段式，复用 eslint/mypy B1 先例）

- **Slice A（地基）**：`backend/model/schemas.py` 新增 `ApiEnvelope[T]` 泛型（`{code,msg,data}`）；`scripts/export-openapi.py` 生成快照 `openapi/openapi.json`；CI 新增 `schema-diff` job（advisory 起步）。
- **Slice B-1（内容域 27 端点）**：`documents(9)/tags(9)/folders(5)/doc_links(2)/timeline(1)/search(1)` 接 `response_model=ApiEnvelope[X]` + 回归快照。
- **Slice B-2（术语/导入域 15 端点）**：`terms(5)/term_categories(5)/quick_entry(2)/imports(2)/rag(2)` 接 `response_model` + 回归快照。
- **Slice B-3（账户/空间域 19 端点）**：`auth(8)/spaces(2)/space_members(4)/users(1)/admin(3)/export(JSON 1)` 接 `response_model` + 回归快照 + `schema-diff` 升 required。
- 二进制端点 3 个（`export.py` md/zip/pdf 下载）不走 envelope，明确排除。

## 验证包

- pytest 全量（默认 304 + 4 skipped 基线）零回归：response_model 校验失败即 500，全量跑测即契约一致性证据
- mypy 0 error / ruff passed
- OpenAPI 快照 `git diff --exit-code` 绿（本地复跑 `scripts/export-openapi.py`）
- CI 全绿（含新 `schema-diff`，Slice B-3 后 required）

## 后续候选（不在本次范围）

- 前端 codegen：`openapi-typescript` 生成 `frontend/src/api/generated.ts`，前端类型切换到生成类型（需新增 devDependency，另立项确认）
- 运行时 schema 校验（`client.ts` `as ApiEnvelope<T>` → zod/同类），增强前端错误分类

## 完成记录

- **编码**：Slice A（`backend/model/schemas.py` `ApiEnvelope[T]` + `scripts/export-openapi.py` + `openapi/openapi.json` + CI `schema-diff` job）+ Slice B-1..B-3（62/62 JSON 端点 `response_model=ApiEnvelope[X]`，内容域 27 / 术语导入域 16 / 账户空间域 19；二进制 md/zip/pdf 3 个明确排除）+ `schema-diff` 升 required。
- **修正评估口径**：实际 65 端点（评估 §4.9 数 64 漏 `config_router` llm-configs）。
- **验证**：路由全量 smoke **60/60 通过**（62 JSON + 3 二进制端点 TestClient + DemoRepository 实测，response_model 校验零失配；含 polish fake-LLM 成功路径）；mypy **0 error**（56 files）+ ruff passed + 默认 pytest **304 passed / 4 skipped** 零回归；快照再生成 `git diff --exit-code` 绿；integration 48 用例由 CI 兜底（本地 docker 不可用未跑）。
- **收尾**：bump v3.8.13（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05 + ai/project-rules §1 + rollout §4/§8 状态回写。
- **残留候选**：前端 codegen（`openapi-typescript` 需新增 devDependency）、运行时 schema 校验（`client.ts` zod/同类）——均不在本次范围。
