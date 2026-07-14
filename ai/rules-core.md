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
- 不得把 AI 建议、候选方案、研究记录、原型探索或未确认事项写成已确认项目事实。
- 不得记录或输出 token、密钥、账号密码、客户敏感数据或无法提交到仓库的隐私事实。

## 3. 路由与回退

- 命令意图明确时，先读 `ai/commands/README.md` 和对应命令文件，再读命令文件列出的权威文档、Prompt 或脚本说明。
- 文档生成、文档审计、需求 / 设计 / 计划变更才读取 `ai/document-lifecycle-rules.md` 与相关 `ai/doc-standards/`。
- 编码、修 bug、Sprint / Task 执行和 PR / CI 收尾优先读取 `ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` 与相关命令文件。
- 模板维护、规则变更、同步清单和自检脚本变更必须读取完整规则回退包，并检查 `template-sync.json`、同步脚本和自检断言。
- 不确定是否需要某个大规则文件时，先读该文件目录 / 相关章节；仍不确定则读取全文。
- 不确定时必须读取完整规则回退包，不得为了省上下文跳过可能相关的硬规则。

## 4. 输出与上下文卫生

- 读取大文件时默认做静默加载或摘要确认，不把全文刷到对话里，除非用户要求原文。
- 对用户只需决策的场景，用大白话说明“改什么、为什么、影响什么、如何验证”。
- 任务持续多步时按 `ai/session-rules.md` 维护续接信息；长期事实必须回写正式文档或明确说明暂不落盘原因。
