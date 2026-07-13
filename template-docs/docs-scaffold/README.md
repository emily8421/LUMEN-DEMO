# Docs Scaffold（项目文档结构模板库）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录保存项目文档的长期结构模板副本，用于派生项目在 `docs/vision/*`、`docs/inputs/*`、`docs/00-09`、`docs/design/*`、`docs/decisions/*` 或 `docs/research/*` 已被项目事实内容覆盖后，仍能查到模板原始大纲、占位表格和 `【撰写提要：...】`。

## 定位

| 位置 | 定位 | 是否作为项目事实 | 是否作为规则权威源 |
|---|---|---|---|
| `docs/00-09` | 项目事实文档：需求、设计、计划、验证 | 是 | 否 |
| `template-docs/docs-scaffold/vision/*` | 人读愿景结构模板：产品愿景叙事与来源锚点 | 否 | 否 |
| `template-docs/docs-scaffold/inputs/*` | 人读输入评审结构模板：输入盘点、愿景就绪度和缺口矩阵 | 否 | 否 |
| `template-docs/docs-scaffold/00-09` | 人读结构模板：可复制的大纲与填写提示 | 否 | 否 |
| `template-docs/docs-scaffold/design/*` | 人读详细设计结构模板：子系统、前端交互、实现前原型策略 | 否 | 否 |
| `template-docs/docs-scaffold/decisions/*` | 人读决策记录结构模板：ADR 与横切事实权威源 | 否 | 否 |
| `template-docs/docs-scaffold/research/*` | 人读研究 / 探索 / 技术评估记录模板 | 否 | 否 |
| `ai/doc-standards/00-09` | AI 规则 / 审计基线：每类文档必须满足的标准 | 否 | 是 |

> 边界：`tasks/` 是执行任务单目录，不属于 `docs/` 项目事实链；若后续新增 Task 文件模板，应落位 `template-docs/task-template.md`，复制目标为 `tasks/task-00X-*.md`，不新增 `template-docs/docs-scaffold/tasks/`。

## 使用方式

- 新建或补齐项目文档时，优先让 AI 按 `ai/index.md`、`ai/document-lifecycle-rules.md` 与 `ai/doc-standards/` 执行；本目录只做结构参考。
- 如果派生项目的 `docs/00-09` 已被业务事实覆盖，可参考本目录确认模板原始章节形态。
- 不要把本目录内容自动覆盖回派生项目 `docs/00-09`；项目事实应由输入评审、需求确认和文档生命周期流程生成。
- 若本目录与 `ai/doc-standards/` 规则不一致，以 `ai/doc-standards/` 和 `ai/document-lifecycle-rules.md` 为准，并回流修复模板。

## 文件清单：上游输入与愿景

| 文件 | 推荐落盘位置 | 对应标准 / 规则 |
|---|---|---|
| `inputs/input-review-report.md` | `docs/inputs/input-review-report.md` 或 `docs/inputs/<topic>/input-review-report.md` | `ai/prompts/docs/01-review-inputs.md` |
| `vision/product-vision.md` | `docs/vision/product-vision.md` | `ai/document-lifecycle-rules.md` §3 |

## 文件清单：00-09 核心链路

| 文件 | 对应项目事实文档 |
|---|---|
| `00-scenario.md` | `docs/00-scenario.md` |
| `01-user-requirements.md` | `docs/01-user-requirements.md` |
| `02-srs.md` | `docs/02-srs.md` |
| `03-prd.md` | `docs/03-prd.md` |
| `04-architecture.md` | `docs/04-architecture.md` |
| `05-tech-spec.md` | `docs/05-tech-spec.md` |
| `06-db-design.md` | `docs/06-db-design.md`，无持久化时可省略 |
| `07-api-spec.md` | `docs/07-api-spec.md`，无对外接口时可省略 |
| `08-dev-plan.md` | `docs/08-dev-plan.md` |
| `09-verification.md` | `docs/09-verification.md` |

## 文件清单：详细设计、决策与研究记录

| 文件 | 推荐落盘位置 | 对应标准 / 规则 |
|---|---|---|
| `design/subsystem-design.md` | `docs/design/<subsystem>.md` | `ai/doc-standards/design-doc.md` |
| `design/frontend-interaction.md` | `docs/design/frontend-interaction.md` 或 `docs/design/*interaction*.md` | `ai/doc-standards/frontend-interaction.md` |
| `design/ui-prototype-strategy.md` | `ai/project-rules.md` §2.7、`docs/05-tech-spec.md`、`docs/design/frontend-interaction.md` 或独立策略记录 | `ai/doc-standards/ui-prototype-strategy.md` |
| `decisions/ADR-template.md` | `docs/decisions/ADR-0001-title.md` | `ai/document-lifecycle-rules.md` §7 |
| `research/docs-open-items.md` | `docs/research/YYYY-MM-DD-docs-open-items.md` | `ai/prompts/docs/21-docs-open-items.md` |
| `research/ui-prototype-exploration.md` | `docs/research/YYYY-MM-DD-ui-prototype-exploration.md` | `ai/document-lifecycle-rules.md` §10.2 |
| `research/tech-env-evaluation.md` | `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md` | `ai/prompts/review/20-tech-env-evaluation.md` |

> 兼容入口：`template-docs/ui-prototype-strategy-template.md` 与 `template-docs/ui-prototype-exploration-template.md` 暂时保留，内容定位与本目录对应模板一致，避免破坏既有链接。
> `template-docs/docs-open-items.example.md` 暂时保留为填充示例；正式结构模板见 `template-docs/docs-scaffold/research/docs-open-items.md`。

## 维护要求

- 本目录随 `template-sync.json` 下行同步。
- 修改 `docs/vision/*`、`docs/inputs/*`、`docs/00-09`、`docs/design/*`、`docs/decisions/*` 或 `docs/research/*` 模板大纲、占位字段或撰写提要时，应同步评估是否需要更新本目录和对应 `ai/doc-standards/` / Prompt。
- 自检脚本应至少断言本目录存在、核心 scaffold 文件存在，并提示三层区别，防止后续漂移。
