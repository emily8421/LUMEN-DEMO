# 当前生效的规则文件

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

请按顺序阅读以下文件，再开始任何分析、设计、编码或会改变项目状态的任务：

- ai/global-rules.md
- ai/document-lifecycle-rules.md
- ai/implementation-lifecycle-rules.md
- ai/session-rules.md
- ai/commands/README.md
- ai/project-rules.md

快速续接例外：当用户只要求“读取续接点 / 继续上次 / 恢复上下文 / resume”，且没有要求继续执行远端 issue / PR、同步、合并、关闭、清理、分析、设计、编码或写入任务时，先按 `ai/session-rules.md` §3.1 快速续接模式做最小本地只读恢复即可，不需要展开读取本清单全部规则文件。快速摘要输出后，只要用户要求继续执行具体任务，必须回到本清单完成全量规则读取。

> 规则增多需要拆分时，仅在本文件中增加列表项即可，
> AGENTS.md / CLAUDE.md / .cursor/rules/project-rules.mdc 不需要修改。
