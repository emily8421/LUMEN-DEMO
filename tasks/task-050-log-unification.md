# task-050：日志统一（CQ-P2-002）

> 维护态批18 / Sprint-43 / CQ-P2-002 / governance rollout §4 轨道3 P2。
> 状态：**已完成（2026-08-13，print 债清零 + 静默吞收口 + ruff T20 禁 print，bump v3.8.15）**。
> 依据：rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.2.4（print 债剩余 + 降级静默吞）；`ai/global-rules.md` §2.1 L0-4（失败必须可见）。

## 背景 / 目标

后端生产代码仍残留 1 处 `print`（`pg_repository.py` embedding 降级提示）与多处降级 / 静默吞 `except` 无日志（索引回填跳过、LLM 降级、登录回退）——`print` 无时间戳 / 级别 / 来源，静默吞异常则故障无诊断证据。目标：`print` 全量换 `logging`；降级 `except` 必须 `logger.warning` 记原因；用 ruff `T20`（flake8-print）落地「禁 print」ratchet 防回归。成功判定：backend/ 生产代码零 `print`；降级路径有 `logger.warning`；ruff T20 能抓 print（负向探针验证）。

## 方案

- **print→logging**：`backend/repository/pg_repository.py` embedding 降级 `print` → `logger.warning`（4 个改动文件新增 `logging.getLogger(__name__)`，对齐 imports.py 风格）。
- **静默吞收口**：`service/document.py` 索引回填单文档失败、`service/rag.py` RAG / 通用对话 LLM 降级 ×2、`api/auth.py` 登录 `SpaceAccessError` 回退——补 `logger.warning` 记原因（对齐 L0-4「失败必须可见」）。
- **ratchet**：`ruff.toml` select 加 `T20`（flake8-print）禁 print；`scripts/` smoke / CLI 脚本 stdout 输出豁免（不在 ruff 扫描范围，属合理用途）。

## 验证包

- pytest 全量零回归（基线 313 passed / 49 deselected）
- mypy 0 error（57 files）/ ruff passed（含 T20）
- `grep -rnE --include='*.py' '^\s*print\s*\(' backend/` 零命中
- T20 负向探针（stdin 探针）确认 ruff 可抓 print
- CI 8 job 全绿（含 backend-integration 48 / schema-diff required）

## 后续候选（不在本次范围）

- 配置集中 + secret 校验（P2 第二项）——见 rollout §4 轨道3

## 完成记录

- **编码**：`pg_repository.py` / `document.py` / `rag.py` / `api/auth.py` 各新增 `logger` + 改降级日志（print→warning / except 补 warning）；`ruff.toml` select 加 `T20`。
- **验证**：ruff passed（含 T20）+ mypy **0 error**（57 files）+ 默认 pytest **313 passed / 49 deselected** 零回归 + grep 复核 backend/ 无 print 残留 + T20 负向探针确认可抓 print；CI PR #155 **8 job 全绿**。
- **收尾**：PR #155 squash merge main `edb5df1`；bump v3.8.15（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05 + ai/project-rules §1 + rollout §8.1 状态回写。
- **残留候选**：配置集中 + secret 校验（下一 P2 项）、mypy strict ratchet、前端 codegen——均不在本次范围。
