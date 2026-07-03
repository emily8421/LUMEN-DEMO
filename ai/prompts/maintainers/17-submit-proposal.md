# 17 派生项目提交提案到模板仓库（跨仓库 issue）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在派生项目里，把成熟的 `TEMPLATE-UPGRADE-*.md` 提案以 issue 形式提交给 `ai-project-template` 模板仓库维护者（跨仓库 `gh`，免 fork）。

**快捷命令**：`/run submit-proposal`（自然语言：提交提案给维护者 / 把这个提案回流到模板）。

**目的**：降低团队场景下回流摩擦——成员机器上无需模板仓库本地副本，无需 fork / 文件传输；用 `gh` 直接在模板仓开 issue。

**适用场景**：派生项目有成熟提案，要上报给模板维护者。

**不适用场景**：提案不成熟（先在 `_proposals/` 完善）；要直接改模板代码（走 fork + PR）。

**使用前准备**：本机 `gh auth login`（成员 GitHub 账号）；确认模板仓库 `owner/repo`（默认 `emily8421/ai-project-template`，public）；提案已在派生 `_proposals/TEMPLATE-UPGRADE-*.md`。

**续接要求**：把待提交提案、模板仓 owner/repo、标签写入续接文件；提交后记 issue 链接。

**预期产出**：模板仓库的一个 `proposal` + `from:<派生>` 标签 issue + 派生续接记录。

**使用后下一步**：等模板维护者处理（转实施 / 合并 / 关闭）；派生侧继续开发，待模板新版下行同步拿到结果。

### 标准 SOP Prompt（直接复制到派生项目使用）

```text
请帮我把本派生项目的成熟提案提交给 ai-project-template 模板仓库（开 issue，不要 fork/PR）。

模板仓库：emily8421/ai-project-template（如不同请说明）
本派生项目名：<填写>
本派生仓库（owner/repo）：<填写>

执行要求：
1. 读取本派生 _proposals/TEMPLATE-UPGRADE-*.md，列出成熟提案，让我确认提交哪个。
2. 校验（不过停下报告，不提交）：
   - 去项目化：无客户/账号/路径/业务细节。
   - 来源标识：头部 "> 来源：<派生>(owner/repo) 派生项目回流"（缺则补）。
   - 字段完整：动机/拟改/版本影响/影响面/验证方式。
3. 用 gh 跨仓库开 issue：
   gh issue create --repo emily8421/ai-project-template --title "<提案标题>" --body "<提案全文>" --label proposal,from:<派生标识>
   （label 若模板仓不存在，先去掉 from:<派生标识> 仅留 proposal，并提醒维护者后续补标签体系）
4. 返回 issue 链接，记入 .ai/session-handoff.md。

禁止：
- 提交未通过去项目化校验的内容。
- 直接 push/PR 到模板仓库（本命令只开 issue）。
- 提交含客户/账号/路径/业务敏感信息的提案。

遇到以下情况停下：
- gh 未登录 / 无权限开 issue。
- 提案校验不过（去项目化/缺字段/无来源标识）。
- 用户未确认提交哪个提案。
```
