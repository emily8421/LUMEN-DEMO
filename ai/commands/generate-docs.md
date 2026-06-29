# Command: generate-docs

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run generate-docs`
- 生成文档体系
- 补齐 00-09
- 根据愿景生成 docs

## 适用场景

项目已有愿景、需求、PRD、任务描述或旧系统材料，需要生成 / 补齐工程文档体系。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/project-rules.md`
- `docs/README.md`
- `ai/prompts/docs/01-review-inputs.md`
- `ai/prompts/docs/00-generate-or-complete-docs.md`

## 执行流程

1. 先用 `review-inputs` 判断输入材料、入口模式和文档剖面。
2. 若输入不足，先列缺口，不猜测生成。
3. 输入通过后，按 `00-generate-or-complete-docs` 生成或补齐文档。
4. 生成后输出新增 / 修改文件清单和人工确认点。

## 写入风险

会新增或修改项目文档；执行前必须确认范围。

## 续接要求

文档生成通常跨多个文件；计划和完成状态应写入续接文件。
