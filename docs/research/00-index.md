# docs/research 调研与审计索引

> 定位：本文是 `docs/research/` 的目录索引，登记内部审计、技术评估、输入评审、原型探索和实现前研究记录。它不是权威规格，不替代 `docs/00-09`、`docs/design/*` 或 `docs/decisions/*`。
> 首版建立于 2026-07-21（P1 文档治理）。本首版重点精确登记 2026-07-20 新输入归位；历史 research 文件只做目录级索引，采纳状态未逐条复核。

## 1. 当前重点

| 文件 | 类型 | 状态 | 采纳 / 后续 |
|---|---|---|---|
| `2026-07-30-docs-system-audit-post-v1.59.0.md` | 模板同步后文档体系审计 | 已执行；Phase1.5A / Phase2A 状态回写已落盘 | Phase1.5B / Phase2B 与项目验证仍待后续确认 |
| `2026-07-20-inputs-architecture-review.md` | 输入评审 + 架构评估 | P0 已采纳并提交 v0.2.4；P1 归位已完成；OB-01 已形成 ADR-010 | OB-02/05 需编辑器 Spike |
| `2026-07-20-doc-system-architecture-evaluation.md` | 文档体系内部评估 | 已从 `docs/inputs/` 归位 | P1 采纳索引 / references 分区建议；`kb-*` 迁移建议因仓库无对应文件不执行 |
| `2026-07-20-obsidian-design-reference-suggestions.md` | 基于外部参考的内部建议 | 已从 `docs/inputs/` 归位 | OB-01 原文不直接采纳，以 ADR-010 为准；OB-06 可后续回填 PRD |
| `2026-07-21-format-conversion-input-review.md` | 文档格式转换输入评审 | 当前 AI 评审已落盘；Conditional Go | 原始输入保留在 `docs/inputs/2026-07-21-doc-format-conversion-requirements.md`；FC-01/02/03/04 需逐项确认后再回填正式文档 |

## 2. 历史 research 清单

| 文件 | 主题 | P1 索引状态 |
|---|---|---|
| `2026-07-19-app-tsx-refactor-plan.md` | App.tsx 重构计划 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-system-completion-audit.md` | 系统完成度审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-requirements-00-03-route-audit.md` | 需求链路审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-overall-design-04-05-audit.md` | 总体设计审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-detailed-design-06-07-design-audit.md` | 详细设计审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-tech-env-evaluation-phase2.md` | Phase2 技术环境评估 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-docs-system-audit-post-v1.51.0.md` | 模板同步后文档体系审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-docs-open-items.md` | 文档待确认项汇总 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-ui-prototype-exploration.md` | UI 原型探索 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-lumen-frontend-design-exploration.md` | 前端设计探索 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-frontend-ui-reference-analysis.md` | 前端 UI 参考分析 | 历史留痕，未在本轮逐条复核 |
| `2026-07-11-*` | Phase2 / 前端 / 04-05 / 需求链系列评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-10-docs-evaluation-requirements-stage.md` | 需求阶段评估 | 历史留痕，未在本轮逐条复核 |
| `2026-07-09-*` | Phase1 技术环境复评、pgvector 影响评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-08-docs-system-audit-post-v1.43.0.md` | 模板同步后文档体系审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-06-*` | 模板提案审计批次、Sprint-6 smoke、文档模板审计 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-04-*` | Phase1 技术环境 / React 选型评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-03-docs-evaluation-vision-to-design.md` | 愿景到设计阶段评估 | 历史留痕，未在本轮逐条复核 |
| `prototypes/*.html` | 探索期 HTML 原型证据 | 原型证据，引用关系见 `docs/design/00-index.md` |

## 3. 维护规则

- 新增 research 文档时，登记类型、状态和被采纳 / 待确认去向。
- 内部审计、输入评审、Spike、技术评估留在 `docs/research/`。
- 外部产品 / 方法论 / 第三方资料放入 `docs/references/`，避免与本项目结论混淆。
