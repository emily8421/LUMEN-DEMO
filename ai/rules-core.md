# Rules Core（AI 任务启动核心规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是所有非快速续接任务的最小必读规则。它不替代其他规则文件，只负责让 AI 先安全、快速地选择正确规则包。

## 1. 启动顺序

1. 先读取 `ai/index.md` 与本文件。
2. 根据用户意图、当前续接状态和即将执行的动作，在 `ai/index.md` 的任务路由表中选择规则包。
3. 若用户只要求“读取续接点 / 继续上次 / 恢复上下文 / resume”，且不要求继续执行任务，按 `ai/session-rules.md` §3.1 快速续接模式执行。
4. 若任务类型不清、规则路由冲突、要修改规则 / 入口 / 同步机制，或即将执行的动作不在已读规则覆盖范围内，回退读取 `ai/index.md` 的完整规则回退包。

## 2. 不可跳过的硬规则

- 不得用 CLI 私有会话、memory、cache、trace 或历史对话替代项目续接文件、Git 事实和正式文档。
- Git 客观事实优先于 `.ai/session-handoff.md`、`NEXT-STEPS.md` 和人工摘要；发现冲突先说明并请求确认。
- 涉及新增、修改、删除、重命名、格式化、提交、推送、同步、安装依赖或运行会写文件的命令前，必须先说明影响范围、风险与验证方式，并取得用户确认。
- 涉及模板维护、规则改造、同步机制、PR / CI / 远端 GitHub 操作、批量搜索、全量自检、长输出命令，或最近发生过中断 / sandbox / network / 权限失败时，默认进入 Checkpoint Mode（短输出 / 检查点模式）。
- 不得把 AI 建议、候选方案、研究记录、原型探索或未确认事项写成已确认项目事实。
- 长任务或已读上下文明显增大（如连续读取多个大规则 / 文档 / 长日志）时，默认进入 Checkpoint Mode：上下文越重，跑飞与失忆风险越高。
- 不得记录或输出 token、密钥、账号密码、客户敏感数据或无法提交到仓库的隐私事实。

## 3. 路由与回退

- 命令意图明确时，先读 `ai/commands/README.md` 和对应命令文件，再读命令文件列出的权威文档、Prompt 或脚本说明。
- 文档生成、文档审计、需求 / 设计 / 计划变更才读取 `ai/document-lifecycle-rules.md` 与相关 `ai/doc-standards/`。
- 编码、修 bug、Sprint / Task 执行和 PR / CI 收尾优先读取 `ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` 与相关命令文件。
- 模板维护、规则变更、同步清单和自检脚本变更必须读取完整规则回退包，并检查 `template-sync.json`、同步脚本和自检断言。
- 不确定是否需要某个大规则文件时，先读该文件目录 / 相关章节；仍不确定则读取全文。
- 不确定时必须读取完整规则回退包，不得为了省上下文跳过可能相关的硬规则。

## 4. 输出与上下文卫生

- Checkpoint Mode 采用风险分级确认，不等于所有小动作都逐次等待用户确认；低风险本地只读操作和用户已授权范围内的本地编辑可合并为小批次执行，并在批次后用 1–3 行汇报结果、证据位置、下一步与是否需要确认。
- Checkpoint Mode 下不得串联长命令；大范围搜索必须先限定目录 / 关键词；命令失败、超时、权限不足、sandbox / network 错误或 CI pending 时先停止汇报，不得连续重试或继续执行后续步骤。
- 读取大文件时默认做静默加载或摘要确认，不把全文刷到对话里，除非用户要求原文。
- Windows / PowerShell 环境读取中文规则文件出现乱码、但命令退出码为 0 时，先按编码输出问题处理：使用显式 UTF-8 重读最小必要文件 / 章节；重读前不得基于乱码内容推断规则、续接状态或项目事实。
- 对用户只需决策的场景，用大白话说明“改什么、为什么、影响什么、如何验证”。
- 任务持续多步时按 `ai/session-rules.md` 维护续接信息；长期事实必须回写正式文档或明确说明暂不落盘原因。
- 大范围搜索（≥3 文件 / 全仓 grep）完成后，必须先回到任务原点汇报：发现了什么、还差什么、是否仍与当前任务相关，再决定下一步；不得搜索完直接继续而不回锚点。
- 先查 `ai/index.md` 任务路由表定位任务类型与所属层，再定向读对应规则包；禁止未定位的全局 grep 或全量预读 `ai/`——先定位后读取，降 token、防跑飞。
- 按任务所属层只读 Core + 本层契约的「必读文件」，不预读全模板；跨层信息通过层间契约获取，不靠全量加载——上下文越重跑飞风险越高。
