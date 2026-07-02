# Command: scenario

> Sync notice: 本文件由 `ai-project-template` 维护，派生项目同步模板方法论时可能被覆盖。不要在派生项目直接改；通用改进请经 `_proposals/` 回流模板。

## 用户说法

- `/run scenario`
- 我想 <做某事>（任意具体场景意图）
- 带我 <做某事> / 我是第一次使用这个模板 / 新手引导
- 帮我 <场景>（如：帮我新建项目 / 帮我准备输入 / 帮我打磨文档 / 帮我规划阶段 / 帮我同步模板 / 帮我评审输入）

## 适用场景

- 用户说出一个具体场景意图，但不确定该用哪个单点 command。
- 新手首次打开 AI CLI，需要被引导完成一连串步骤。
- 想要 AI 先给出「做什么 + 为什么」的分步计划，确认后再执行。

本命令是**元命令**：它不直接执行某个操作，而是路由到 `template-docs/scenario-guides.md`，让 AI 按场景剧本产出引导计划，再路由到具体 command 执行。

## 不适用场景

- 用户已明确指定某个 `/run <command>`，直接走那个 command，不必经 scenario。
- 纯只读问答（不形成多步任务）。

## 必读文件

- `ai/index.md` 及其列出的规则文件
- `ai/commands/README.md`（命令路由总索引）
- `template-docs/scenario-guides.md`（场景剧本权威：角色、路由入口、契约、23 场景目录）

## 执行流程

1. 读 `template-docs/scenario-guides.md`。
2. 按 §2 判断 cwd 状态（零资产 / 在模板仓库 / 在派生项目）；零资产先转 A0。
3. 识别角色（A 使用者 / C 维护者）与具体场景。
4. 按 §4 契约**先用「做什么 + 为什么」产出引导计划给用户看，不直接动手**；每步标注只读 / 写入·确认。
5. 用户确认后，按该场景步骤表的「机器执行」列逐步执行；写入步骤逐次确认。
6. 完成后给出「下一步场景」。
7. 多步任务按 `ai/session-rules.md` 维护续接文件。

## 写入风险

取决于具体场景。`scenario-guides.md` 每个场景步骤都标注了只读 / 写入·确认；AI 必须按 `ai/project-rules.md §6` 在写入前逐次确认。

## 续接要求

记录识别到的角色、场景、引导计划与执行进度；按 `ai/session-rules.md` 更新 `.ai/session-handoff.md`。
