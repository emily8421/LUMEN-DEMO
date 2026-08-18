# docs/references 外部参考资料索引

> 定位：本文登记外部产品、方法论和技术参考资料。`docs/references/` 不是 LUMEN 权威规格区，不直接约束代码；任何结论必须先经 `docs/research/` 评审或 `docs/decisions/` 裁决，再回填 `docs/00-09` / `docs/design/*`。
> 首版建立于 2026-07-21（P1 文档治理），用于承接 2026-07-20 从 `docs/inputs/` 评审后归位的外部资料。

## 1. 索引表

| 文件 | 类型 | 用途 | 状态 / 风险 |
|---|---|---|---|
| `ref-obsidian-overview.md` | 外部产品与技术调研 | 为 `docs/research/2026-07-20-obsidian-design-reference-suggestions.md` 提供 Obsidian 背景依据 | Reference；非 LUMEN 规格 |
| `软件系统面向对象开发方法的过程要点及关系.md` | 外部软件工程方法论参考 | 作为 OOA/OOD 阶段产物与 LUMEN PLM 链路的对照参考；2026-08-17 起作为五阶段产物矩阵（阶段 × 核心图 × 核心文档）覆盖度评估与补全的指导依据（方案见 `docs/research/2026-08-17-oo-coverage-evaluation-and-diagram-mirror-plan.md`） | 外部参考；正式引用前需人工校对原图 / 原始资料 |
| `软件系统面向过程开发方法的过程要点及关系.md` | 外部软件工程方法论参考 | 作为结构化分析设计阶段产物与 LUMEN PLM 链路的对照参考 | 外部参考；正式引用前需人工校对原图 / 原始资料 |
| `Doc_ref-md/`（15 份） | 外部历史规范模板（`Doc_ref/` Word 原件的脱敏 md 转换件） | LUMEN 文档大纲对齐的参考依据（02/04 概述章骨架、设计说明 / 系统测试说明书 / 编码规范对照）；目录清单与使用注意见 `Doc_ref-md/README.md` | 外部参考；引用结构内容以 `Doc_ref/` 原件为准（原件 gitignored 不入库） |
| `software-engineering-basics.md` | 外部软件工程方法论参考 | `docs/05-tech-spec.md` §4.1.0 目录划分依据（五条）的出处注脚：四条知识线（模块化分解 / 架构模式 / 设计规约 / 配置管理）× 原始文献 × 大白话解释 + 术语小词典（契约 / 分层 / 纵切 / CCP / SSOT 等）；§3 分层与接口设计依据（SOLID ISP/LSP / Repository·UoW / God Object / 棘轮 / 按功能 vs 按技术组织）配合 `docs/research/2026-08-18-code-directory-review.md` 目录评审使用 | 外部参考；文献年份凭公开常识整理，论文级引用前需人工校对 |

## 2. 使用边界

- 参考资料可以解释设计灵感或对照方法论，但不能替代 `ai/document-lifecycle-rules.md` 和 `docs/00-09` 的权威链路。
- 若外部参考中的建议被采纳，应先形成 research 评审或 ADR，再由权威文档引用。
- 若参考资料存在转录风险，应在引用前校对原图、原文或官方资料。
