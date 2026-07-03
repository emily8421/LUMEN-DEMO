# 18 派生项目汇集使用问题反馈到模板仓库（半自动）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在派生项目里，半自动汇集使用模板过程中的候选问题 / 优化点，人工勾选后以 issue 反馈给模板维护者。

**快捷命令**：`/run submit-feedback`（自然语言：收集使用问题 / 把这些问题反馈给模板）。

**目的**：把散落在 sync 运行记录、docs-audit、check 告警、草稿里的可优化点汇集起来；**扫描自动化 + 人工决定上报哪些**，避免全自动批量上报淹没维护者。

**适用场景**：派生项目跑过若干轮 sync / audit / check，积累了候选问题。

**不适用场景**：已是成熟提案（用 `17-submit-proposal`）；纯派生业务问题（不回流）。

**使用前准备**：本机 `gh auth login`；模板仓 `owner/repo`（默认 `emily8421/ai-project-template`）。

**预期产出**：模板仓若干 `feedback` + `from:<派生>` 标签 issue + 派生续接记录。

**使用后下一步**：等维护者处理；候选问题在派生侧持续积累，下次再汇集。

### 标准 SOP Prompt（直接复制到派生项目使用）

```text
请帮我汇集本派生项目的使用问题，反馈给 ai-project-template 模板仓库（开 issue）。

模板仓库：emily8421/ai-project-template（如不同请说明）
本派生项目名：<填写>
本派生仓库（owner/repo）：<填写>

执行要求：
1. 扫描候选来源：
   - docs/archive/template-sync/ 下最近 sync 运行记录的可优化点
   - docs-audit 报告（16-docs-system-audit 产出）的问题
   - check 告警（check-derived-sync / check-template 输出的 warning）
   - _proposals/ 未成熟草稿
2. 列出候选，让我勾选值得上报的（不要自动全报，避免噪声）。
3. 选中的逐条去项目化（无客户/账号/路径/业务细节）+ 标来源 "> 来源：<派生>(owner/repo)"。
4. 用 gh 跨仓库开 issue：
   gh issue create --repo emily8421/ai-project-template --title "<问题标题>" --body "<去项目化内容 + 来源>" --label feedback,from:<派生标识>
5. 返回 issue 链接，记入 .ai/session-handoff.md。

禁止：
- 自动批量上报所有候选（必须人工勾选）。
- 上报未去项目化的内容。
- 直接 push/PR 到模板仓库（本命令只开 issue）。
```
