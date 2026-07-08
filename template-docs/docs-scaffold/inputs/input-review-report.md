# 输入评审报告（Input Review Report）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 本文件是 `docs/inputs/input-review-report.md` 或 `docs/inputs/<topic>/input-review-report.md` 的结构模板副本，不是项目事实。输入评审报告只记录输入盘点、愿景就绪度、缺口和下一步建议，不替代 `docs/vision/product-vision.md` 或 `docs/00-09`。

## 0. 报告元信息

**撰写提要**：记录评审时间、输入范围、评审触发和输出定位，避免后续无法判断报告来源。

- 评审日期：YYYY-MM-DD
- 评审触发：首次生成文档体系 / 补齐输入 / 复评 / 外部材料接入
- 输入路径：`docs/inputs/...`
- 评审结论：Ready / Conditionally Ready / Not Ready
- 建议下一步：生成 / 更新 product-vision / 补充输入 / 先做专题澄清

## 1. 输入盘点与入口模式

**撰写提要**：列出读取、忽略和无法读取的文件；判断入口模式，并说明依据。不要直接把输入材料写成已确认需求。

| 文件 / 来源 | 材料类型 | 是否读取 | 可信度 / 新旧 | 备注 |
|---|---|---|---|---|
| `docs/inputs/initial-brief.md` | Small-tool brief / PRD / SRS / Existing-system / External-input | 是 / 否 | 高 / 中 / 低 |  |

- 入口模式：Inputs-first / Vision-first / Scenario-first / URS-first / SRS-first / PRD-first / Existing-system / Task-first / Small-tool brief / External-input
- 主入口依据：
- 辅助输入：
- 冲突或重复材料：

## 2. Product Vision 就绪度

**撰写提要**：判断是否足以生成或更新 `docs/vision/product-vision.md`，并列出必须保留的待确认项。

- 结论：Ready / Conditionally Ready / Not Ready
- 是否能形成完整产品图景：是 / 否 / 条件成立
- 是否能形成典型场景和核心能力边界：是 / 否 / 条件成立
- 来源锚点建议：
- 必须保留的待确认项：

## 3. 愿景缺口矩阵

**撰写提要**：按最小必要维度评估输入是否足够。每项都应标注依据、AI 建议和是否必须人工确认。

| 维度 | 状态 | 依据 | AI 建议 | 是否必须人工确认 |
|---|---|---|---|---|
| 目标用户 / 使用者 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 问题、价值或业务目标 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 典型场景与用户故事 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 核心能力与优先级 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 输入、输出、数据或外部依赖 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 边界、非目标、禁区 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 成功标准、验收方式或演示口径 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 阶段倾向（Demo / MVP / 产品） | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |
| 运行环境、技术、资源、合规和风险约束 | 已具备 / 部分具备 / 缺失 |  |  | 是 / 否 |

## 4. 最小补充清单

**撰写提要**：只列生成 product-vision 或进入下一阶段必需的最少问题。每个问题都应可转入 open items。

| ID | 问题 | AI 推荐选项 / 建议答案 | 建议依据 | 备选方案 | 需确认节点 | 阻塞关系 | 回填位置 |
|---|---|---|---|---|---|---|---|
| IR-001 |  |  |  |  | 生成 product-vision 前 | 阻塞 / 条件阻塞 / 不阻塞 | `docs/vision/product-vision.md` / `docs/03-prd.md` |

## 5. 愿景输入摘要

**撰写提要**：用 5-10 条把当前输入整理成“待人工确认”的 product-vision brief。标明来源是输入材料摘要，不要伪装成原始需求来源。

- 目标用户：
- 要解决的问题：
- 核心场景：
- 输入：
- 输出：
- 核心操作流：
- 非目标：
- 验收方式：

## 6. 推荐文档剖面

**撰写提要**：给出 Full / Standard / Lean / Existing-system 建议；若 product-vision 尚未 Ready，只能给暂定剖面，不得进入正式生成。

- 推荐剖面：Full / Standard / Lean / Existing-system
- 必须生成或保留的 docs：
- 可省略或极简化的 docs：
- 裁剪依据：

## 7. 评估报告与下一步建议

**撰写提要**：说明本报告应保存到哪里、哪些内容可复制给生成文档 Prompt、哪些材料继续保留在 `docs/inputs/`。

- 报告建议路径：`docs/inputs/input-review-report.md` / `docs/inputs/<topic>/input-review-report.md`
- 可复制给 `ai/prompts/docs/00-generate-or-complete-docs.md` 的摘要：
- 不可生成时最少需要用户回答的问题：
- 外部文档或横切事实权威源建议：
- 原始材料保留 / 转写建议：
