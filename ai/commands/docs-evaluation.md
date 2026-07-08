# Command: docs-evaluation

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run docs-evaluation`
- 文档评估
- 评估文档能不能进入下一阶段
- 评估愿景到需求阶段文档
- 评估需求到总体设计
- 评估单个 03-prd
- 文档可以定稿吗
- 生成后评估
- 记录文档评估报告

## 适用场景

需要对整体文档体系、某个 PLM 阶段转换或单个核心文档做阶段判断，并输出 `Go / Conditional Go / No Go` 结论。评估默认只读；用户确认需要留痕时，才写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`。

## 与相近命令的区别

- `docs-system-audit`：偏已成型项目的全链路回溯审计，重点找断点、漂移和规范基线缺口。
- `docs-checklist`：偏编码前就绪检查，重点拦截进入 Sprint 前的明显问题。
- `docs-evaluation`：偏阶段转换判断和正式评估留痕，支持整体 / 阶段 / 单文档三种粒度。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/implementation-lifecycle-rules.md`
- `ai/prompts/review/19-docs-evaluation.md`
- `docs/00-scenario.md` 至 `docs/09-verification.md`（按项目形态存在则读取）
- `docs/design/`、`docs/env/`、`ai/project-rules.md`（如存在）
- `ai/doc-standards/README.md` 与本次评估范围对应的 `ai/doc-standards/<doc>.md`（如存在，作为细粒度标准）
- `ai/doc-standards/00-scenario.md` 至 `03-prd.md`（E1 / E2 或需求阶段评估必读）
- `ai/doc-standards/04-architecture.md`、`ai/doc-standards/05-tech-spec.md`（E2 / E3 或真实依赖项目必读）
- `ai/doc-standards/06-db-design.md`、`ai/doc-standards/07-api-spec.md`（E3 / E4 或 DB / API 详细设计评估必读）
- `ai/doc-standards/08-dev-plan.md`、`ai/doc-standards/09-verification.md`（E4 / E5 / E6 或实现计划 / 验证证据 / 回写评估必读）
- `ai/doc-standards/design-doc.md`（E3 / E4、`docs/design/*` 或详细设计评估必读）

## 执行流程

1. 判断评估粒度：整体评估、阶段评估或单文档评估。
2. 识别阶段转换码：E1 输入 / 愿景 → 需求、E2 需求 → 总体设计、E3 总体设计 → 详细设计、E4 详细设计 → 实现计划、E5 实现计划 → 验证、E6 实现结果 → 文档回写。
3. 只读扫描相关文档，按完整性、合理性、可行性、一致性、追溯性、阶段边界、可验证性和维护性输出评估。
4. E2 / E3 或真实依赖项目必须检查 `04` 架构视图、`05` 技术状态、依赖配置、Risk-ID、readiness gate 和 `05 ↔ 09` 映射。
5. E3 / E4 或详细设计评估必须检查 `06/07` 字段级契约、endpoint contract matrix、API-ID、错误码、权限边界、迁移 / seed / 回滚、DB / API / TC 追溯、契约状态，以及 `docs/design/*` 的元信息、追溯矩阵、readiness gate、验收追溯、实现偏差区和豁免理由。
6. E4 / E5 / E6 或实现 / 验证 / 回写评估必须检查 `08/09` Sprint 验证包、完成包、TC 详情、验收证据、缺陷 / 回归记录、正式回写和 handoff 边界。
7. 检查待确认事项总览和 open items 门禁；阻塞项未关闭或未被明确风险接受时，不得输出无条件 `Go`。
8. 给出 `Go / Conditional Go / No Go` 结论、阻塞项、修复建议和结构化待人工确认项。
9. 若用户要求“记录下来”，先说明路径和影响范围，确认后写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`。

## 写入风险

默认只读；评估报告落盘、起草 `_proposals/` 或修正文档前必须确认。评估报告不得写入 `docs/` 根目录，不覆盖 `00-09`，不替代正式文档修订。

## 续接要求

若评估结论为 `Conditional Go` 或 `No Go`，应把阻塞项、修复建议、报告路径建议和待确认项写入续接文件，并建议运行 `docs-open-items` 生成或更新总览。
