# 05 技术方案

## 1. 技术栈与版本
- Python 3.11
- FastAPI 0.110+（含 uvicorn）
- SQLite（Python 标准库 `sqlite3`，不引入额外 ORM）

## 2. 关键技术决策
- 同步实现即可：单人、低并发，不需要 async 复杂度
- 不引入 ORM：表只有一张、字段简单，直接 `sqlite3` 更轻；Phase2 若扩展再评估
- 无鉴权：Phase1 单人本地，鉴权是 Phase3 的事

## 3. Phase 技术约束
与 `ai/project-rules.md` §1、§2 一致：当前 Phase 允许 FastAPI/SQLite/单人；禁止 PostgreSQL、禁止引入用户/鉴权系统。

## 4. 编码约定
详见 `ai/project-rules.md` §5，本文不重复。
