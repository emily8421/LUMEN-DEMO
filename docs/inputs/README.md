# docs/inputs/ 原始输入包

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> **原始输入统一入口**：本目录放你提供的、尚未归类的原始输入（愿景草稿、小工具 brief、客户 PRD/SRS、外部需求包、任务说明、现有系统说明）。它是工程文档的**原料**，不直接驱动开发；AI 处理前必须先做输入材料评审与入口判定、愿景就绪评估（`ai/prompts/docs/01-review-inputs.md`）。输入 / 输出总体区分见 `docs/README.md` §1。

本目录用于暂存尚未归类、尚未转成 `docs/vision/product-vision.md` 或 `docs/00-09` 的原始输入材料，例如愿景草稿、小工具 brief、客户 PRD / SRS、外部需求包、任务说明、现有系统说明或混合型资料。

使用规则：

1. 原始输入可先放在本目录，不要求用户提前判断它属于 vision、00、01、02 还是 03。
2. AI 处理前必须使用 `ai/prompts/docs/01-review-inputs.md` 先做输入材料评审、愿景就绪评估与入口判定。
3. 文件夹输入必须先盘点文件清单，说明将读取 / 忽略 / 无法读取的文件。
4. 本目录内容只能作为“待人工确认”的输入来源，不得直接伪装成已确认需求。
5. 评审后应先判断材料是否足以生成 `docs/vision/product-vision.md`；不足时输出评估报告和最小补充清单，补齐后再次评审。
6. 评审通过后，应说明哪些内容提炼到 `docs/vision/product-vision.md`，哪些映射到 `00-09`，哪些应转入 `docs/decisions/`、`docs/research/` 或 `docs/meetings/`。

## 输入评审闭环

```text
docs/inputs/ 原始材料
  → 输入材料评审 + 愿景就绪评估
  → 不足：docs/inputs/input-review-report.md + 最小补充清单
  → 用户补齐材料后复评
  → 通过：生成 / 更新 docs/vision/product-vision.md
  → 再进入 docs/00-09 文档体系生成
```

评估报告推荐路径：

- 单一输入包：`docs/inputs/input-review-report.md`
- 专题输入包：`docs/inputs/<topic>/input-review-report.md`

评估报告应至少覆盖：目标用户、问题 / 价值、典型场景、核心能力、输入输出、边界 / 非目标、成功标准、阶段倾向、运行 / 技术 / 合规约束、缺失项、AI 建议与依据、需要用户逐项确认的问题。

若 `docs/inputs/` 为空，AI 不得直接编造愿景或 00-09；应先给出最小输入内容清单，请用户逐项回答。用户补齐后，仍回到 `ai/prompts/docs/01-review-inputs.md` 重新评审。

推荐命名：

```text
docs/inputs/initial-brief.md
docs/inputs/client-prd.md
docs/inputs/existing-system.md
docs/inputs/input-review-report.md
docs/inputs/<topic>/README.md
docs/inputs/<topic>/input-review-report.md
```
