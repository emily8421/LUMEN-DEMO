# Implementation Lifecycle Rules（实现生命周期规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 `docs/` 文档体系确认之后，AI 如何进行阶段规划、Sprint / Task 拆分、编码实现、验证与验收留痕。它与 `ai/document-lifecycle-rules.md` 分工如下：

- `document-lifecycle-rules`：约束输入材料、文档生成、文档追溯、文档变更传播。
- `implementation-lifecycle-rules`：约束从已确认文档到代码实现、测试验证、提交 / PR、验收记录的执行闭环。

## 1. 基本原则

1. **先计划后编码**：未确认当前 Phase、Sprint / Task、输入文档、修改范围和验收标准前，不得开始实现代码。
2. **小步可验收**：一个 Task 只做一个可验收目标；一个提交或小 PR 应对应一个 Task 或一个清晰的修复闭环。
3. **验证闭环**：不能只说“已实现”；必须说明验证方式、执行结果、失败项和未验证风险。
4. **边界优先**：当前 Phase 以 `docs/03-prd.md` §3 与 `ai/project-rules.md` §1 为准，愿景或后续阶段内容不得提前实现。
5. **事实可追溯**：实现必须能追溯到 `REQ → Phase → Sprint / Task → Test Case → Commit / PR → 验收记录`。

## 2. 层级模型

| 层级 | 权威来源 | 作用 | 最小输出 |
|---|---|---|---|
| Phase | `docs/03-prd.md` §3、`ai/project-rules.md` §1 | 定义当前阶段允许 / 禁止 / 下一阶段预告 | 阶段目标、退出标准、禁止越界 |
| Sprint | `docs/08-dev-plan.md` | 把 Phase 拆成可执行增量 | 目标、输入文档、修改范围、验收标准 |
| Task | `docs/08-dev-plan.md` 或 `tasks/task-*.md` | 执行一个小范围目标 | 1–3 个文件 / 模块、明确禁止项 |
| Test Case | `docs/09-verification.md` | 定义怎么算通过 | TC-ID、步骤、通过标准、自动化位置 |
| Commit / PR | Git 历史、PR 说明 | 固化实现事实与审查记录 | 关联 Task / Sprint、验证摘要 |
| Acceptance Record | `docs/09-verification.md` §验收记录 | 记录 Sprint / Phase 是否完成 | 执行人、日期、结果、失败项 / 后续任务 |

## 3. 阶段规划规则

阶段规划发生在文档体系成型并通过评估 / 审计之后，通常对应 Scenario A9。若刚经历关键阶段转换，建议先用 `ai/prompts/review/19-docs-evaluation.md` 做整体或阶段评估；结论为 `No Go` 时不得进入 Sprint 规划，`Conditional Go` 必须列明条件、风险接受口径和待人工确认项。

若项目包含真实运行依赖（如 `backend/`、`frontend/`、`docker/`、数据库、本机模型、外部 API、重型 SDK、LLM、真实数据或权限安全能力），进入首个会触发这些依赖的编码 Sprint 前，必须已有技术路线与环境支撑评估，并在 `docs/05-tech-spec.md` 记录 Risk-ID、依赖配置、readiness gate 和解锁条件；或记录用户明确跳过的原因、风险、影响范围和补做时点。评估结论为 `No-Go` 时不得进入相关 Sprint；`Conditional Go` 只能进入满足限制条件或不触发该风险的 Sprint。

若项目触发 Web App Structure Profile + Walking Skeleton Gate（见 `template-docs/web-fullstack-profile.md`），进入首个 Web 业务功能 Sprint 前必须先完成或显式豁免 Sprint 0 / Walking Skeleton：App Shell、前后端目录边界、API client ↔ API-ID 追溯、至少一个 vertical slice、文件膨胀阈值和最小浏览器 / API smoke。未完成且无豁免时，不得把多页面 / 多状态功能继续堆入单个主应用文件、全局样式或后端 controller / service。

1. 输入必须至少包括 `docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`。
2. 若项目涉及持久化或对外接口，还必须读取 `docs/06-db-design.md`、`docs/07-api-spec.md` 的相关章节。
3. Phase 划分必须同时说明功能范围与交付物形态（Demo / MVP / 产品），不得默认 Phase1 等于 MVP。
4. 当前 Phase 的“允许 / 禁止 / 下一阶段预告”必须同步到 `ai/project-rules.md` §1。
5. 不得把后续 Phase 的测试用例列为当前必过项；可保留骨架，但状态必须标明“后续阶段”。`04/05` 中为候选、默认关闭、Mock、降级或禁止的能力，不得在当前 Sprint 默认解锁。

## 4. Sprint 与 Task 拆分规则

1. 每个 Sprint 应对应一个小功能、一个验证闭环或一组紧密相关的改动，不能承载整个系统。
2. Sprint 必须写明：目标、输入文档、预计修改范围、验证包、验收标准、禁止事项和完成包位置。
3. 出现以下任一情况时，必须拆成 `tasks/task-00X-xxx.md`：
   - 修改范围超过 3 个文件 / 模块；
   - 验收标准无法一次完成；
   - 涉及多个不相干功能；
   - 多人 / 多 AI 会话并行；
   - 需要跨测试等级逐步验证。
4. Task 命名与内容必须能追溯回 Sprint、REQ 和 Test Case；Task 文件必须包含任务元信息、验证包、降级 / Mock 边界、完成记录和待确认项。

## 5. 单任务执行规则

AI 执行 Sprint / Task 前必须先输出实现方案，并等待用户确认后再修改文件。方案至少包含：

- 上游依据：关联 REQ、Phase、设计章节、Sprint / Task。
- 修改范围：预计新增 / 修改 / 删除文件，原则上限制 1–3 个文件 / 模块；若一次 patch 涉及多个文件，逐项列出变更摘要。
- 验证方式：关联 Test Case、自动化命令、人工验收步骤。
- 越界检查：说明不会实现哪些后续阶段内容。
- 风险与待确认：依赖、环境、资源、账号、外部服务等不确定项。
- 技术环境门禁：若任务会触发真实运行依赖，确认已有 `docs/research/*tech-env-evaluation*.md` 或同等技术环境评估结论，并核对 `docs/05-tech-spec.md` 中对应 Risk-ID / readiness gate 为 Go 或满足 Conditional Go 条件；缺失时先停止并建议运行 `tech-env-evaluation`，除非用户明确要求跳过并接受风险。
- 审计兜底：修改前后查看 `git status --short --branch`；必要时让用户审阅 `git diff`。

执行过程中如发现文档与代码事实冲突，必须先停下说明冲突；不得直接把代码实现扩展为新需求。

## 6. 测试与验证分层

验证方案应按项目形态裁剪，但必须说明适用 / 不适用原因。

| 测试等级 | 用途 | 常见证据 |
|---|---|---|
| 单元测试 | 验证函数、类、组件的局部行为 | 测试命令、通过日志、覆盖关键边界 |
| 集成测试 | 验证模块、数据库、外部接口协作 | 测试命令、测试数据、服务依赖说明 |
| 系统 / 端到端测试 | 验证主流程从入口到输出可跑通 | E2E 命令、截图、日志、演示步骤 |
| 验收测试 | 验证 REQ / Sprint 是否满足用户目标 | TC-ID、人工验收步骤、结论 |
| 回归测试 | 验证修复或改动未破坏既有能力 | 回归范围、历史用例、结果 |
| 资源 / 环境验证 | 验证本机或目标环境能运行 | `docs/env/local-env.md`、耗时、内存、端口、降级记录 |
| Readiness gate | 验证真实依赖进入 Sprint / Phase 的条件 | `docs/05-tech-spec.md` Risk-ID / RG-ID、技术环境评估报告、命令输出、TC 证据 |

Lean / 小工具项目可以采用最小验证包，但至少需要：一个可复现的运行命令或人工步骤、预期输出、实际结果、未验证项。

## 7. 验收与留痕

1. Sprint 完成前必须对照 `docs/08-dev-plan.md` 或 `tasks/*` 的验收标准逐项核对。
2. 验证结果必须写入 `docs/09-verification.md` 的验收记录或项目约定的验收位置。
3. 未通过项不得在总结中写成“已完成”；必须回到 `docs/08-dev-plan.md`、`tasks/*` 或缺陷修复流程。
4. Sprint 总结至少包含：改动文件、关联 REQ / Task / Test Case、验证命令与结果、残留风险、建议提交信息。
5. Phase 升级前必须确认当前 Phase 的必过用例、资源验证、readiness gate 和验收记录均已完成。

### 7.1 Sprint 完成包与正式回写

Sprint / Task 完成后必须形成最小完成包：改动文件、验证命令 / 人工步骤、验证结果、关联提交 / PR、`09` 验收记录、残留风险和下一步。

回写职责：

| 触发 | 必须检查 / 回写 |
|---|---|
| Sprint 完成 | `08` 状态 / 下一步、`09` 验收记录 / Sprint 验收包、残留风险 |
| Bug 修复 | `09` 缺陷与回归记录、相关 TC 状态、`08` 当前进度 |
| Mock / 降级验收 | `09` 条件通过 / 风险接受、`08` 后续补齐任务 |
| Phase 验收 | `03` Phase 状态、`08` Phase 完成情况、`09` Phase 验收、`project-rules` 当前阶段 |
| Phase 升级 | `project-rules`、`03/08/09`、README、handoff 状态一致性 |

`.ai/session-handoff.md` 只记录临时续接状态，不替代正式 `08/09` 进度和验收记录。若暂不回写正式文档，必须在总结和 handoff 中说明原因、风险和补做时点。未经人工确认，AI 不得自动把 Phase 状态改为已完成或自动进入下一 Phase。

## 8. 代码事实反向同步

当实现过程中发现文档与代码事实不一致时，按以下顺序处理：

1. **实现偏离文档**：优先修代码回到文档约束。
2. **文档确实过时**：停止编码，说明差异与影响，使用 `ai/prompts/docs/07-sync-docs-from-code.md` 或对应文档修订流程更新文档。
3. **需求变化**：回到需求 / PRD / Phase 流程，不得在当前 Task 内直接扩展范围。

## 9. 禁止项

- 禁止无设计、无 Sprint、无验收标准直接编码。
- 禁止把 Demo 阶段写成 MVP / 产品阶段。
- 禁止为了测试方便提前实现后续 Phase 功能。
- 禁止未运行验证就宣布完成。
- 禁止把未验证、Mock、降级或人工假设写成已通过。
- 禁止在真实运行依赖未完成技术环境评估且无明确跳过记录时进入相关编码 Sprint。
- 禁止一次提交混入多个无关 Task。
