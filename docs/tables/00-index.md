# 核心表索引（docs/tables/）

> **生成式镜像索引**（`scripts/extract-diagrams.mjs` 产物，不手改）。表分两档：
> **镜像抽取**（核心矩阵，脚本复制成单文件，共 20 张）＋ **原位登记**（增量日志，只挂锚点链接不抽镜像——每次验收都更新，抽了必过期）。
> 表格内容以源文档为唯一权威源；表索引不新增 TBL-ID 命名空间，用「文档 + 章节锚点」定位。

## 镜像抽取（核心矩阵）

| 源文档 | 镜像表 |
|---|---|
| `docs/00-scenario.md` | [00-roles](00-roles.md)（目标用户（R-001..003））<br>[00-scenarios](00-scenarios.md)（典型场景（SC-001..009））<br>[00-sc-downstream](00-sc-downstream.md)（场景 → U/REQ/TC 下游映射） |
| `docs/01-user-requirements.md` | [01-user-reqs](01-user-reqs.md)（用户需求总览（U-ID））<br>[01-trace](01-trace.md)（追溯矩阵（U → REQ）） |
| `docs/02-srs.md` | [02-req-main](02-req-main.md)（REQ 主表（可验证口径））<br>[02-nfr](02-nfr.md)（非功能需求（NFR）） |
| `docs/03-prd.md` | [03-roadmap](03-roadmap.md)（阶段路线图（双维度总览））<br>[03-req-coverage](03-req-coverage.md)（REQ 覆盖矩阵（REQ-001..051）） |
| `docs/04-architecture.md` | [04-comp](04-comp.md)（容器 / 组件视图（COMP））<br>[04-mod](04-mod.md)（模块清单（MOD · 含详细设计列））<br>[04-flows](04-flows.md)（关键流程（Flow）与追溯）<br>[04-error-design](04-error-design.md)（出错处理与权限拒绝设计） |
| `docs/05-tech-spec.md` | [05-deps](05-deps.md)（依赖与配置矩阵）<br>[05-rg](05-rg.md)（Readiness Gate（RG）） |
| `docs/06-db-design.md` | [06-tables](06-tables.md)（表清单（完整 · 含状态列））<br>[06-req-table-trace](06-req-table-trace.md)（REQ → 表 / TC / Sprint 追溯） |
| `docs/07-api-spec.md` | [07-api-list](07-api-list.md)（接口清单（API-ID））<br>[07-cross-trace](07-cross-trace.md)（API ↔ DB / Service / Test 交叉追溯） |
| `docs/09-verification.md` | [09-req-tc](09-req-tc.md)（REQ → 用例追溯矩阵（TC）） |

## 原位登记（日志型 · 不抽镜像）

| 源文档 | 锚点 | 说明 |
|---|---|---|
| `docs/08-dev-plan.md` | Sprint 完成包与进度记录 | 增量日志（随验收更新） |
| `docs/09-verification.md` | §5 验收记录 | 增量日志（随验收更新） |
