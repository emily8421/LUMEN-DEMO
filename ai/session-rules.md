# Session Rules（AI 会话续接与断点恢复规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 AI CLI / 多 AI 工具协作时的本地会话续接规则。它只管理“任务状态交接”，不替代 `docs/`、`tasks/`、`_proposals/` 或 Git 提交记录。

## 1. 续接文件定位

默认本地续接文件：

```text
.ai/session-handoff.md
```

兼容旧文件：

```text
NEXT-STEPS.md
```

- `.ai/session-handoff.md` / `NEXT-STEPS.md` 只用于本地会话断点恢复，不是项目事实文档，不进入正式提交。
- 若两者同时存在，AI 优先读取 `.ai/session-handoff.md`，再读取 `NEXT-STEPS.md` 补充上下文；若两者冲突，以 Git 工作区实际状态和用户确认结果为准。
- 续接文件不得记录 token、密钥、账号密码、客户敏感数据或无法提交到仓库的隐私事实；只记录任务状态、文件路径、命令和待确认项。

## 2. 新会话恢复流程

AI 每次在项目中开始分析、设计或编码前，应按以下顺序恢复上下文：

1. 读取 `ai/index.md` 及其列出的全部规则文件。
2. 检查 `.ai/session-handoff.md`；若不存在，再检查 `NEXT-STEPS.md`。
3. 运行只读状态检查：`git status --short --branch`。
4. 如续接文件指向具体文件或任务，再读取相关 `docs/`、`tasks/`、`ai/prompts/` 或 `ai/commands/` 文件。
5. 向用户简述恢复状态：当前任务、已完成、下一步、待确认项。
6. 若续接记录与 Git 状态冲突，先说明冲突并请求确认，不得直接覆盖项目文件。

## 3. 自动更新触发点

当本轮工作形成可续接任务时，AI 应主动维护续接文件，不等用户额外提醒。典型触发点：

- 输出多步骤执行计划后：记录当前任务、执行计划和下一步。
- 开始多步骤任务前：记录任务目标、影响范围、预计修改文件和验证方式。
- 完成计划中的一个步骤后：更新已完成 / 进行中 / 未完成状态。
- 准备修改文件前：记录预期变更文件、修改原因和风险点。
- 完成文件修改后：记录实际新增 / 修改 / 删除文件、验证结果和下一步。
- 遇到阻塞或待确认项时：记录阻塞原因、待确认问题和建议选项。
- 结束回复前：若仍有未完成任务，刷新“下次优先做”。

纯只读问答、一次性解释或没有形成后续任务的对话，可以不更新续接文件。

## 4. 写入确认边界

- 若用户已明确要求执行多步骤任务、实现计划或继续维护任务，AI 可把续接文件更新视为该任务的本地状态记录，但仍应在首次写入前说明会维护本地续接文件。
- 若 `ai/project-rules.md` 要求任何文件写入前都必须确认，且用户没有授权执行任务，则首次创建 / 修改续接文件前也应先确认。
- 续接文件更新不得夹带正式模板规则、项目需求或设计结论；长期有效内容必须转写到 `docs/`、`tasks/`、`_proposals/`、README、SOP 或维护文档。

## 5. 推荐结构

续接文件建议采用以下结构，便于不同 AI 工具稳定读写：

```markdown
# AI Session Handoff

> 本文件为本地会话续接记录，不进入正式提交。

## 当前任务

## 当前进度

- 已完成：
- 进行中：
- 未完成：

## 执行计划

## 最近改动

## 下次优先做

## 阻塞 / 待确认

## 恢复命令
```

样例见 `template-docs/session-handoff.example.md`。

## 6. 与快捷命令联动

若用户通过 `ai/commands/` 快捷命令启动任务，续接文件应记录命令名、任务目标、执行计划和下一步。新会话恢复时，若续接文件记录了正在执行的命令，AI 应先读取对应 `ai/commands/*.md` 再继续。
