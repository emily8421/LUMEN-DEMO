# Command: review-inputs

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run review-inputs`
- 评审输入材料
- 判断能不能生成文档
- 检查愿景是否足够

## 适用场景

生成文档体系前，需要判断现有输入是否足够、应该采用哪个入口模式和文档剖面。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `docs/README.md`
- `ai/prompts/docs/01-review-inputs.md`
- 用户提供或项目已有的输入材料

## 执行流程

1. 读取输入评审 Prompt。
2. 盘点输入材料类型、可信度、缺口和冲突。
3. 判断是否可进入 `generate-docs`。
4. 输出缺口清单、推荐入口和待人工确认项。

## 写入风险

默认只读；不足时只输出建议，不直接补写项目事实。

## 续接要求

若形成后续补材料计划，应写入续接文件。
