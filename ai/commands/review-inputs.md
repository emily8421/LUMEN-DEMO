# Command: review-inputs

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run review-inputs`
- 评审输入材料
- 评估能不能生成 product-vision
- 判断能不能生成文档
- 检查愿景是否足够
- inputs 为空怎么办

## 适用场景

生成文档体系前，需要判断 `docs/inputs/` 中的现有输入是否足以生成 / 更新 `docs/vision/product-vision.md`，以及应该采用哪个入口模式和文档剖面。若输入为空或不足，本命令负责输出评估报告和最小补充清单。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `docs/README.md`
- `ai/prompts/docs/01-review-inputs.md`
- 用户提供或项目已有的输入材料

## 执行流程

1. 读取输入评审 Prompt。
2. 优先盘点 `docs/inputs/`；兼容读取已有 `docs/vision/product-vision.md`，但不把 `docs/vision/` 当作新项目默认输入入口。
3. 评估 Product Vision 就绪度：Ready / Conditionally Ready / Not Ready。
4. 若不足，输出 `docs/inputs/input-review-report.md` 建议路径、缺口矩阵、AI 建议与依据、最小补充清单。
5. 若通过，输出可交给 `generate-docs` 的愿景输入摘要、来源锚点、推荐入口和待人工确认项。

## 写入风险

默认只读；不足时只输出建议，不直接补写项目事实。若用户要求保存评估报告，写入前必须确认范围。

## 续接要求

若形成后续补材料计划，应写入续接文件。
