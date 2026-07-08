# Command: generate-docs

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run generate-docs`
- 生成文档体系
- 生成整个文档体系
- 补齐 00-09
- 根据愿景 / inputs 生成 docs
- 根据 inputs 生成 product-vision 和 docs

## 适用场景

项目已有通过输入评审的 `docs/inputs/` 材料、愿景、需求、PRD、任务描述或旧系统材料，需要生成 / 补齐工程文档体系。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/project-rules.md`
- `docs/README.md`
- `ai/prompts/docs/01-review-inputs.md`
- `ai/prompts/docs/00-generate-or-complete-docs.md`
- `ai/doc-standards/design-doc.md`（触发 `docs/design/*` 时）

## 执行流程

1. 若用户说“生成整个文档体系”，先展示阶段路线与两种模式：分阶段确认模式（推荐）/ 输入充分后批量生成模式，不直接写 00-09。
2. 先用 `review-inputs` 判断输入材料、Product Vision 就绪度、入口模式和文档剖面。
3. 若输入不足，先列缺口和最小补充清单，不猜测生成 product-vision 或 00-09；缺口项应可转入 `docs-open-items`。
4. 输入通过后，先生成 / 更新 `docs/vision/product-vision.md`，再按 `00-generate-or-complete-docs` 生成或补齐 `00-09`。
5. 每个阶段结束前更新待确认事项总览；完整文档体系生成后必须建议运行 `docs-evaluation` / `docs-system-audit` 和 `docs-open-items`。
6. 生成后输出新增 / 修改文件清单、来源锚点和人工确认点。

## 写入风险

会新增或修改项目文档；执行前必须确认范围。未通过输入评审时不得写入 product-vision 或 `00-09`。

## 续接要求

文档生成通常跨多个文件；计划和完成状态应写入续接文件。
