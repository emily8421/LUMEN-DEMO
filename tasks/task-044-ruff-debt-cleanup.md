# task-044：ruff 37 旧债整治（维护态批12 / Sprint-37）

> Sprint-37（维护态批12）· P1 lint 债清理。上游：P0-2 CI 最小门落地建立的 ruff 基线（`project-rules.md §1` 维护态批7：41→37）+ `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 ratchet + §6 Ratchet 规则（指标只减不增）。技术债 ID 沿用「ruff 37 基线」（assessment 无独立 CQ 号）。

## 元信息

- Sprint：Sprint-37（维护态批12）
- 关联：ruff 37 基线（F841×15 / E402×11 / F401×10 / F811×1）
- 上游依据：rollout §4 轨道3 + §6 Ratchet、project-rules §1 维护态批7（ruff 41→37 基线）
- 分支：`feat/ruff-37-debt-cleanup`
- 依赖：P0-2 CI 最小门（根 `ruff.toml`，`backend-lint` job advisory）

## 目标

将 `ruff check backend tests` 的 37 条存量债清零（37→0）：删 10 条未用 import（F401）、1 条重复 import（F811）、15 条未用局部变量（F841），并把 11 条模块级 import 归位到文件顶部（E402）。**纯结构清理，零行为变更，不新增/修改任何业务逻辑。**

## 修改范围（14 文件，两批）

- **批次 A（自动修复，26 条，`ruff check --fix --unsafe-fixes`）**：
  - F401 ×10：`backend/api/auth.py`、`backend/service/ai_polish.py`×2、`backend/service/export.py`、`backend/service/timeline.py`、`tests/backend/test_folder.py`×2、`tests/backend/test_term_category.py`×2、`tests/backend/test_pg_repository.py`
  - F811 ×1：`backend/service/auth.py:166` 重复 `import json`
  - F841 ×15：`tests/backend/test_doc_links.py` / `test_document.py` / `test_export.py`×7 / `test_folder.py`×2 / `test_import_api.py` / `test_tags.py` / `test_term_category.py` / `test_timeline.py` 中 `token = create_demo_token(...)` / `a = create_xxx(...)` 去掉赋值、**保留调用**（纯函数/创建调用保留 → 行为不变）
- **批次 B（手工结构修复，11 条 E402）**：
  - `backend/service/auth.py`（6 处）：os / secrets / datetime / bcrypt / entities / logging 上移到文件顶部（bcrypt 本就模块级 import，移动零行为变更；已核对 entities.py 无循环 import）
  - `tests/backend/test_document.py`（4 处）：import 块上移到 `_demo_ctx` 定义之前

## 验收标准

1. `ruff check backend tests` → **0 错误**（37→0）。
2. 默认套件 `pytest tests/backend -m "not integration"` → **306 passed 零回归**。
3. 不改 `ruff.toml`（不降规则集、不加 ignore）、不改业务逻辑、不引入新债。

## 完成记录

- **2026-08-12 v3.8.9**：37 条债清零——自动修 26 条（F401×10 + F811×1 + F841×15）+ 手工 E402 11 条（`auth.py` 6 处 / `test_document.py` 4 处 import 上移）；`api/auth.py` `TOKEN_SIGNING_KEY` 为 re-export 恢复 + `# noqa: F401` 标注。验证：ruff **37→0** + 默认 **306 passed / 48 deselected** 零回归。回写 `docs/08` Sprint-37 + `docs/05 §4.2.4` + `project-rules §1` 批12 + rollout §8.2 + bump v3.8.9 三件套。

## 待确认

（无；方案已确认）
