# AI Commands（快捷命令路由）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录提供 AI CLI 的快捷命令路由。命令文件只负责把“用户意图”映射到权威 SOP、Prompt 和脚本说明；完整执行细节仍以 `ai/prompts/`、`SOP.md`、`git-guide.md`、`docs/` 与项目规则为准。

> ⏸️ Checkpoint 节拍（所有命令执行先遵守）：先查 `ai/index.md` 任务路由表定位再定向读，禁止未定位全局 grep；搜索批次后回锚点汇报；失败即停；高风险（push / PR / merge / close / delete / 发布 / 装依赖 / 破坏性命令）单步等确认；低风险合并批次末 1–3 行汇报。详见 `AGENTS.md` Checkpoint 节拍段。

## 使用方式

用户可显式输入：

```text
/run sync-methodology
/run docs-system-audit
/run post-sync-cleanup
/run resume
```

也可使用自然语言：

```text
更新方法论
做文档体系审核
做文档评估
做技术环境评估 / 技术路线评估
汇总待确认事项 / 生成 open items
讨论人机交互 / 讨论技术选型 / 讨论交互设计方案
补前端交互设计 / 补 UI 设计
界面应该长什么样 / 补 UI 输入材料 / 用户没给 UI 参考
先确认交互原型 / 分析参考产品 / 做视觉效果探索
实现前先看 UI / 选择原型策略 / 前端和后端先做哪个
同步后整理项目
执行当前 Sprint
读取续接点 / 继续上次
查看演示效果 / 启动 Demo / 给我二维码
```

> **场景优先**：当用户说出的是**具体场景意图**（如「帮我新建项目」「帮我准备输入」「帮我规划阶段」「帮我打磨文档」）而非某个具体 command 时，AI 应先走 `/run scenario`（见 `ai/commands/scenario.md`），由 `template-docs/scenario-guides.md` 先产出「做什么 + 为什么」引导计划，确认后再路由到具体 command 执行。新手首次打开 AI CLI 也走此路径。

AI 识别到命令意图后，应先判断是否为 `resume` 快速续接；若用户只要求“读取续接点 / 继续上次 / 恢复上下文”，按 `ai/session-rules.md` §3.1 的最小只读流程执行，不展开完整规则审计。其他命令，或 `resume` 后继续执行具体任务时，应：

1. 读取 `ai/index.md` 与 `ai/rules-core.md`，按任务路由选择规则包；无法判断时读取完整规则回退包。
2. 读取本命令索引和对应命令文件。
3. 读取命令文件列出的权威文档、Prompt 和脚本说明。
4. 说明将执行的命令、影响范围、是否只读、是否会写文件。
5. 涉及模板维护、规则改造、同步机制、PR / CI / 远端 GitHub 操作、批量搜索、全量自检或长输出命令时，默认按 `ai/session-rules.md` §3.3 进入 Checkpoint Mode；按风险分级确认，低风险本地只读和已授权范围内编辑可小批次执行，高风险远端 / 破坏性动作单步确认，失败即停。
6. 涉及写入、安装、提交、同步或状态改变时，先取得用户确认。
7. 若任务持续多步，按 `ai/session-rules.md` 更新本地续接文件。

若命令输出会写入正式文档、任务单或续接文件中的“待人工确认项”，不得只列问题；应包含 AI 建议、建议依据、备选方案、取舍影响和阻塞关系，并明确 AI 建议不等于用户已确认事实。

## 命令文件格式

每个命令文件应包含：

- 用户说法：自然语言别名与 `/run` 名称。
- 适用场景：什么时候使用，什么时候不使用。
- 必读文件：执行前必须读取的规则、Prompt、SOP 或脚本。
- 执行流程：高层步骤，不复制完整 Prompt。
- 写入风险：是否只读、何时必须确认。
- 续接要求：是否需要写入 `.ai/session-handoff.md` / `NEXT-STEPS.md`。

## 首批命令

| 命令 | 常见说法 | 路由到 |
|---|---|---|
| `scenario` | 我想<场景> / 帮我<做某事> / 新手引导 | `template-docs/scenario-guides.md`（元命令：先产出引导计划，再路由到具体 command） |
| `sync-methodology` | 更新方法论 / 同步模板方法论 / 已同步但没做后续 / 补完同步后流程 / A13 完整闭环 | `git-guide.md` §5、`ai/prompts/maintainers/12-sync-template.md` |
| `post-sync-cleanup` | 同步后整理项目 | `ai/prompts/maintainers/15-post-sync-cleanup.md` |
| `docs-system-audit` | 文档体系审核 / PLM 链路审计 | `ai/prompts/review/16-docs-system-audit.md` |
| `docs-evaluation` | 文档评估 / 阶段转换评估 / 单文档评估 | `ai/prompts/review/19-docs-evaluation.md` |
| `docs-open-items` | 汇总待确认事项 / 生成 open items / 编码前自检未决项 / 阶段任务前检查待确认项 | `ai/prompts/docs/21-docs-open-items.md` |
| `ui-prototype-exploration` | 先看原型 / 先做页面原型确认需求 / Demo 前先确认交互 / 做视觉效果探索 / 分层信息架构原型 | `ai/prompts/docs/22-ui-prototype-exploration.md` |
| `resume` | 读取续接点 / 继续上次 / 恢复上下文 | `ai/session-rules.md` §3.1（快速续接模式） |
| `tech-env-evaluation` | 技术环境评估 / 技术路线评估 / 依赖安装验证 / 本机能不能跑 | `ai/prompts/review/20-tech-env-evaluation.md` |
| `template-proposal-summary` | 汇总模板优化提案 | `ai/prompts/maintainers/11-template-proposal-summary.md` |
| `domain-template-lab`（领域实验·普通项目不用） | 初始化领域模板实验线 / 创建派生领域模板 / 创建 agent-system-template | `ai/prompts/maintainers/23-domain-template-lab.md` |
| `generate-docs` | 生成文档体系 / 生成整个文档体系 / 补齐 00-09 | `ai/prompts/docs/00-generate-or-complete-docs.md` |
| `review-inputs` | 评审输入材料 / 补 UI 输入材料 / 用户没给 UI 参考 / 前端交互怎么定 / 分析参考产品 | `ai/prompts/docs/01-review-inputs.md` |
| `project-review` | 项目审查 / 实现合规审查 | `ai/prompts/review/03-project-review.md` |
| `edit-single-doc` | 修订单个文档 / 补前端交互设计 / 补 UI 设计 / 选择原型策略 / 补实现前原型 / 回填 experience brief | `ai/prompts/docs/04-edit-single-doc.md` |
| `sync-docs-from-code` | 代码反向同步文档 | `ai/prompts/docs/07-sync-docs-from-code.md` |
| `phase-upgrade` | Phase 升级评估 | `ai/prompts/planning/08-phase-upgrade.md` |
| `docs-checklist` | 开发前文档检查 | `ai/prompts/review/10-docs-checklist.md` |
| `run-dev-task` | 执行 Sprint / 执行任务 | `ai/prompts/dev/02-run-task.md` |
| `fix-bug` | 修 Bug / 修复缺陷 | `ai/prompts/dev/05-fix-bug.md` |
| `sprint-summary` | Sprint 总结 / 验收总结 | `ai/prompts/dev/09-sprint-summary.md` |
| `collect-env` | 采集本机环境 | `ai/prompts/setup/13-collect-env.md`、`scripts/collect-env.ps1` |
| `new-project` | 新建派生项目 | `ai/prompts/setup/14-new-project.md`、`scripts/new-project.sh` |
| `commit-message` | 生成提交信息 | `ai/prompts/git/06-commit-message.md` |
| `submit-proposal` | 提交提案给维护者 / 回流模板 | `ai/prompts/maintainers/17-submit-proposal.md`（跨仓库开 issue） |
| `submit-feedback` | 收集使用问题反馈给模板 | `ai/prompts/maintainers/18-submit-feedback.md`（半自动汇集 + 开 issue） |
| `show-demo` | 查看演示效果 / 启动 Demo / 二维码 / 检查 Demo | `ai/commands/show-demo.md`、`template-docs/demo-runbook-template.md` |

## 维护规则

- 命令文件不得复制大段 Prompt 正文，避免与 `ai/prompts/` 双写漂移。
- 新增高频 Prompt 或 SOP 时，应评估是否需要新增 / 更新命令入口。
- 删除或重命名 Prompt 时，必须同步更新命令路由和 `template-sync.json`。
