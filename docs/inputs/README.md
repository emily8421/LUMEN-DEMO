# docs/inputs/ 原始输入包

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录用于暂存尚未归类、尚未转成 `docs/00-09` 的原始输入材料，例如小工具 brief、客户 PRD / SRS、外部需求包、任务说明、现有系统说明或混合型资料。

使用规则：

1. 原始输入可先放在本目录，不要求用户提前判断它属于 vision、00、01、02 还是 03。
2. AI 处理前必须使用 `ai/prompts/docs/01-review-inputs.md` 先做输入材料评审与入口判定。
3. 文件夹输入必须先盘点文件清单，说明将读取 / 忽略 / 无法读取的文件。
4. 本目录内容只能作为“待人工确认”的输入来源，不得直接伪装成已确认需求。
5. 评审后应说明哪些内容映射到 `00-09`，哪些应转入 `docs/decisions/`、`docs/research/` 或 `docs/meetings/`。

推荐命名：

```text
docs/inputs/initial-brief.md
docs/inputs/client-prd.md
docs/inputs/existing-system.md
docs/inputs/<topic>/README.md
```
