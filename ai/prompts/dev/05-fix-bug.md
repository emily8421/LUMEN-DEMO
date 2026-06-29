# 05 Bug修复

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：处理已出现的报错、异常行为或测试失败。

**快捷命令**：`/run fix-bug`（自然语言：修 Bug / 修复缺陷 / 排查问题）。

**目的**：先定位根因并提出最小修改方案，避免盲目大范围改代码。

**适用场景**：已有可描述现象、复现步骤、错误日志或失败测试。

**不适用场景**：需求变更或新增功能；这种情况应回到文档和 Sprint 流程。

**使用前准备**：提供现象、环境、复现步骤、期望行为和相关日志。

**续接要求**：记录复现结果、根因假设、最小修复方案、实际改动文件和验证命令；若中断，新会话按 `ai/session-rules.md` 恢复。

**预期产出**：根因分析、最小修复方案、改动文件、验证结果。

**使用后下一步**：若实现与 docs 不一致，用 `ai/prompts/docs/07-sync-docs-from-code.md` 做文档反向同步；否则用 `ai/prompts/git/06-commit-message.md` 准备提交信息。

```text
现象：（描述报错信息或异常表现）

请按以下流程处理，不要直接大范围修改代码：
1. 阅读 ai/index.md 列出的规则文件
2. 定位问题模块，分析可能原因
3. 提出最小修改方案（限制1~3个文件）
4. 说明方案后再修改代码
5. 给出验证步骤
```
