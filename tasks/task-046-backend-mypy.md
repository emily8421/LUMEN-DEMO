# task-046：后端引入 mypy 类型检查（mypy B1）

> 维护态批14 / Sprint-39 / NFR-006 P1 落地 / CQ-P1-002 Slice C 类型注解收益兑现前提。
> 状态：**已全闭环 v3.8.11**（Slice A #148 + Slice B-1 #149 + Slice B-2 #150 + 回写 + bump）。
> 实证：`docs/research/2026-08-12-backend-mypy-b1-assessment.md`；rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3；复刻 eslint B1（task-045）三段式。

## 背景 / 目标

CQ-P1-002 Slice C（v3.8.5）给 service repository 参数加 `: RepositoryProtocol` 注解，但项目无类型检查器（ruff 只查 E4/E7/E9/F，CI 不守护类型）——注解收益只在 IDE。引入 mypy 到 CI 兑现类型收益 + 防退化（ratchet）。复刻 eslint B1 的 advisory→清零→required 三段式。

## 实施（三 Slice）

### Slice A（PR #148 `de88d3a`）—— 装依赖 + 配置 + advisory CI
- `backend/requirements-dev.txt` 加 `mypy==2.3.0`（支持 `python_version=3.14`）
- 根 `mypy.ini`（默认非 strict，查 `backend/` 不含 tests；**ASCII 注释避 Windows gbk 编码坑**——configparser 在 CN Windows 用 gbk 读 mypy.ini，中文注释 UnicodeDecodeError）
- `.github/workflows/project-check.yml` 加 `backend-typecheck` job（advisory `continue-on-error`）
- 首跑基线 **190 error / 28 files**

### Slice B-1（PR #149 `18a6a63`）—— current_space_id C + reportlab + 真实 bug（190→119）
- **current_space_id C 方案**（清 45，核心价值）：`TokenContext.current_space_id` `int|None`→`int` + `get_current_user` 入口 fail-closed guard（session.current_space_id=None → 401/4001「session 空间已失效」→ 前端清 session 重登录）。DB 列 `nullable=True ON DELETE SET NULL` 不动（DB 防御），None 在鉴权入口统一拦截。依据 Explore 探查：未选空间非合法业务态（accounts-auth C-AUTH-001 注册即建个人空间 + 前端 `session-store.ts` 强制 `currentSpaceId: number`）。不改 service 57+ 函数 + api 40+ 调用点（C 让 TokenContext 与上下游契约对齐）。新增 None 路径单测（`test_auth.py:GetCurrentUserSpaceGuardTest`）。
- `mypy.ini` reportlab override（`[mypy-reportlab.*] ignore_missing_imports`，清 8 import-untyped）
- 真实 bug ~18：export re.match if/elif 重构（mypy or 短路 narrowing 限制）/ uow `_token` 注解 + assert / pg_repository `cast(CursorResult)` rowcount（SQLAlchemy 2.0 stub 摩擦）+ add/update_space_member user None guard / demo replace `dict[str,Any]` / quick_entry append target guard + discard assert / db fetchone assert / tag update_tag NotFound guard

### Slice B-2（PR #150）—— §3 删 try/except + 补 assert + 升 required（119→0）
- 删 19 文件（17 api + main.py + auth_context.py）的 `try: from fastapi import except ImportError: APIRouter=None...` 防御块 + `if APIRouter is not None:` 包裹（改直接 import + 顶层代码；main.py 删 `if FastAPI is None: raise` guard，auth_context.py 删 `if Header is None: raise`）。根因：fastapi 是 requirements.txt 必装，except 分支 `# pragma: no cover` 不可达；pytest TestClient 依赖 fastapi，删后零回归验证。
- 补 6 处 service `repository.move/rename/update_X` 返回 `X|None` 临时变量 narrow（term_category/folder/quick_entry，与 B-1 tag.py:188 同类，B-1 遗漏——之前混在 §3 的 119 assignment 里被掩盖）
- 移除 `backend-typecheck` 的 `continue-on-error` 升 required；`mypy backend` **0 error**

## 关键价值兑现

mypy 抓到 ruff/tsc 都抓不到的：
1. **current_space_id `int|None`→service(int) None 传播缺口 45 条**（api 层契约不一致；业务上"未选空间调文档操作"None 路径未被 service 处理）
2. **真实类型 bug ~20**（re.match None 守卫缺失 / Result.rowcount API 误用 / tuple|None 未守卫 / repository.update 返回 None 未守卫 等）

## 验证包

- mypy **190→0**（Slice A 基线 190 → B-1 清 71 → B-2 清 119 余 + 补 6 = 0）
- ruff `All checks passed!`
- pytest **307 passed** / 48 deselected（+1 None guard 单测）零回归
- CI `backend-typecheck` required 绿（B-2 升 required）

## 完成记录

- 2026-08-12 全闭环 v3.8.11（Slice A #148 `de88d3a` + B-1 #149 `18a6a63` + B-2 #150 + 回写 docs/05 §4.2.4 / project-rules §1 维护态批14 + bump 三件套）

## 后续候选（不在本次范围）

- **Slice C（远期）**：mypy 默认 required 稳定后，ratchet 升 strict（`disallow_untyped_defs` / `disallow_any_generics` / `warn_return_any` / `disallow_untyped_calls`）。独立议题。
- 扩 `mypy` 检查范围到 `tests`（起步只 backend）。
- `--warn-unreachable`（开后会报 §3 残留的 `if APIRouter is not None` always-True，B-2 已删故无）。
