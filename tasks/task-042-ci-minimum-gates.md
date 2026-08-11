# task-042：CI 最小代码门（P0-2 / NFR-006）

> Sprint-31（维护态批6）· P0 止血 · 杠杆点。上游：`docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-2（A1/B1 联合裁决定稿）、`docs/research/2026-08-10-p0-engineering-governance-plan-evaluation.md` §2.3 / §4.3。以 §3 为唯一实施口径。

## 元信息

- Sprint：Sprint-31（维护态批6）
- 关联：NFR-006（CI 最小回归门）、TC-P2-GOV-002
- 上游依据：assessment CQ-P0-002、rollout §3 P0-2、`docs/05-tech-spec.md` §4.2.4
- 分支：`chore/p0-test-db-guard-and-ci`
- 依赖：task-041（pytest integration marker + 根 `pytest.ini`）

## 目标

CI 从零代码门升级到三 job：`backend-test`（pytest）+ `frontend-build`（tsc / vite）+ `backend-lint`（ruff）。

## 输入文档

- rollout §3 P0-2（A1/B1 定稿）
- 评估 §2.3 / §4.3
- `.github/workflows/project-check.yml`（现状：零代码门）
- `frontend/package.json`（`build` 已含 `tsc -b`）

## 修改范围

- 新增根 `ruff.toml`（Python 3.14、`E4/E7/E9/F`、不自动格式化）
- 新增 `backend/requirements-dev.txt`（锁 pytest / ruff / httpx）
- 改 `.github/workflows/project-check.yml`：加 `backend-test` / `frontend-build` / `backend-lint` 三 job
- 根 `pytest.ini` 与 task-041 共用

## 验收标准

1. `backend-test`：Python 3.14 + runtime + dev 依赖 + `pytest -m "not integration" --strict-markers`，**A1** advisory 起步 → 同 PR 基线清完、合并前升 required。
2. `frontend-build`：Node 22.17.1（Volta）+ `npm ci` + `npm run build`（含 `tsc -b`，不加 `typecheck`），A1 同上。
3. `backend-lint`：根 `ruff.toml` 查 `backend/` + `tests/backend/`，**恒 advisory**（记旧债基线，不阻断 P0）。
4. marker 生效：integration 不在 default 跑。

## 降级 / 边界（A1 / B1）

- **A1**：三 job 首次 `continue-on-error: true`；首次跑通、基线清完后，合并 main 前移除 `backend-test` / `frontend-build` 的 `continue-on-error` 升 required；`backend-lint` 保持 advisory。
- **B1**：`frontend-lint`(eslint) **P0 不做**，记 P1（须在 `docs/05 §4.2.4` / NFR-006 显式留痕）。
- 不新增前端 `typecheck` 脚本（`build` 已含 `tsc -b`）。

## 禁止事项

- 不把 unit / build 永久 advisory（A1 要求合并前升 required）。
- 不在 P0 引入 eslint（B1 暂缓，留 P1）。
- 不自动格式化（ruff 只检查 `E4/E7/E9/F`）。
- 不顺手全仓整改旧债（P0 只建 lint 基线）。

## 完成记录

- **commit**：`b7bf866`（P0-2 三 job + `ruff.toml` + `requirements-dev.txt`）+ `a96855a`（`python-multipart` 补声明）+ `5ca2c95`（`llm_adapter` env key 大小写修复）+ `0d62bbd`（升 required）；PR #124 squash 合并 main `c26bb63`（2026-08-11）。
- **CI 基线（5 轮）**：backend-test 286 passed（required）+ frontend-build 301 modules（required）+ backend-lint 41 advisory 基线（恒 advisory）；CI 首跑暴露并修复 2 潜伏 bug（`python-multipart` 漏声明 + `llm_adapter` env key 大小写——后者影响 Linux 部署 LLM 多通道切换）。
- **升 required 时机**：基线清完后（第 4 轮 backend-test pass）→ 第 5 轮升 required 验证绿（`0d62bbd`）→ merge。
- **残留风险**：backend-lint 41 旧债恒 advisory（F841×16 / F401×13 / E402×11 / F811×1），按 ratchet 逐步整治。

## 待确认

- 首次 CI 跑出基线失败范围（决定升 required 前的修复量）。
