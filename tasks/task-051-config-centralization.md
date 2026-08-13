# task-051：配置集中 + secret 校验（CQ-P2-003）

> 维护态批19 / Sprint-44 / CQ-P2-003 / governance rollout §4 轨道3 P2。
> 状态：**已完成（2026-08-13，pydantic-settings 集中 + 生产弱默认 key fail-closed，bump v3.8.16）**。
> 依据：rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.2.4（env 散落 6+ 处 + 弱默认 key）；`ai/implementation-lifecycle-rules.md` §6.2（关键 secret 启动校验 fail-closed）。

## 背景 / 目标

env 读取散落多处（`main.py` / `auth.py` / `db.py` / `llm_adapter.py` / `embedding.py`），无集中 Settings；`LUMEN_DEMO_TOKEN_KEY` 弱默认 `"local-demo-signing-key"` 且生产无校验（`main.py` 生产护栏只挡 demo 仓储不挡弱 key）——token 签名 key 可预测即 token 可伪造（安全风险）。目标：建 `backend/config.py`（pydantic-settings）集中静态 env 读取；生产 fail-closed 校验弱默认 signing key。成功判定：`LUMEN_ENV=production` + 弱默认 key → 启动拒绝；test / 本地开发 / demo 豁免；静态 env 收敛单点。

## 方案

- **`backend/config.py`（新）**：`Settings(BaseSettings)` 三字段（`lumen_env`←`LUMEN_ENV`、`database_url`←`DATABASE_URL`、`demo_token_key`←`LUMEN_DEMO_TOKEN_KEY`，显式 alias）+ `get_settings()` lru_cache 单例 + `validate_runtime_secrets()`（生产弱默认 key fail-closed）。
- **收敛**：`db.py` `_DATABASE_URL` / `main.py` `LUMEN_ENV` / `auth.py` `TOKEN_SIGNING_KEY` → `get_settings()`。
- **secret 校验**：`main.py` lifespan 开头调 `validate_runtime_secrets(get_settings())`，仅 `LUMEN_ENV=production` 强制（弱默认 / 空拒绝启动）。
- **豁免**：`llm_adapter.py` `LLM_<NAME>_*` 动态命名配置（key 运行时拼接）、`embedding.py` `HF_HUB_DISABLE_XET` 环境约束 setdefault（huggingface 导入前注入）——显式不收敛，理由写 docs/05 §4.2.4。
- **新依赖**：`pydantic-settings==2.15.0`（用户已确认；pydantic 2.13.4 兼容）。

## 验证包

- pytest 全量零回归（基线 313 + 8 新 = 321 passed / 49 deselected）
- mypy 0 error（58 files）/ ruff passed（含 T20）
- 新 `tests/backend/test_config.py`：env 读取（读 env / 缺省默认）+ secret 校验（production 弱默认 / 空拒、强 key 放行、test·development·空豁免）
- CI 8 job 全绿（含 backend-integration 48 / schema-diff required）

## 后续候选（不在本次范围）

- 前端 ratchet + App 减压（CQ-P1-008，P2 第三项）
- mypy strict ratchet / 前端 codegen（后续候选）

## 完成记录

- **编码**：`backend/config.py` 新建（Settings + get_settings + validate_runtime_secrets）；`db.py` / `main.py` / `auth.py` 静态 env 收敛 + 删 `os` import；`main.py` lifespan 生产校验；`requirements.txt` + pydantic-settings==2.15.0；`tests/backend/test_config.py` 新建。
- **验证**：test_config 8/8 + mypy **0 error**（58 files）+ ruff passed + 默认 pytest **321 passed / 49 deselected** 零回归；CI PR #156 **8 job 全绿**。
- **收尾**：PR #156 squash merge main `7388ff6`；bump v3.8.16（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05 + ai/project-rules §1 + rollout §8.1 状态回写。
- **残留候选**：前端 ratchet + App 减压（下一 P2 项）、mypy strict ratchet、前端 codegen——均不在本次范围。
