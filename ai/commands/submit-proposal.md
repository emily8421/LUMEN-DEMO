# Command: submit-proposal

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run submit-proposal`
- 提交提案给维护者
- 把这个提案回流到模板

## 适用场景

派生项目里有成熟的 `TEMPLATE-UPGRADE-*.md` 提案，要提交给 `ai-project-template` 模板仓库维护者。用 `gh` 跨仓库开 issue——**成员免 fork、免本地模板副本**，只需本机 `gh` 登录其 GitHub 账号 + 模板仓 public（或成员有访问权限）。

不适用：提案还不成熟（先在派生 `_proposals/` 起草完善）；或要直接改模板代码（走 fork + PR，非本命令）。

## 必读文件

- `ai/index.md`
- 派生项目 `_proposals/TEMPLATE-UPGRADE-*.md`（待提交提案）
- `ai/global-rules.md` §9（回流来源标识 + 去项目化要求）

## 执行流程

1. 列出派生 `_proposals/` 的成熟提案，让用户确认提交哪个。
2. **校验**（不過则停下报告，不提交）：
   - 去项目化：无客户 / 账号 / 路径 / 业务细节。
   - 来源标识：头部有 `> 来源：<派生>(owner/repo) 派生项目回流`（缺则补上）。
   - 字段完整：动机 / 拟改 / 版本影响 / 影响面 / 验证方式。
3. 创建 issue 前先做只读预检：
   - `gh auth status -h github.com`。
   - `gh repo view <模板仓库 owner/repo> --json nameWithOwner,viewerPermission`。
   - `gh issue list --repo <模板仓库 owner/repo> --state open --search "<提案标题> in:title" --json number,title,url,labels`，避免重复提交。
   - `gh label list --repo <模板仓库 owner/repo> --limit 200`，确认 `proposal` 与 `from:<派生标识>` 是否存在。
4. 来源标签处理：
   - `from:<派生标识>` 已存在 → 正常使用。
   - 缺失且当前账号有标签管理权限 → 先创建标签。
   - 缺失且无权限创建 → 降级为仅使用 `proposal` 标签，并在 issue 正文来源标识与续接记录中注明“来源标签待维护者补充”。
5. 使用 `--body-file` 创建 issue，避免 Markdown 正文中的换行、代码块、反引号、管道符或 `$` 被 shell 拆分：
   `gh issue create --repo <模板仓库 owner/repo> --title "<提案标题>" --body-file <提案文件> --label proposal --label "from:<派生标识>"`。
6. 若 `gh issue create` 失败，立即用标题搜索确认是否已创建半成品 issue；若未创建，再按认证 / 标签 / 权限错误处理后重试。
7. 返回 issue 链接，记入派生续接文件（`.ai/session-handoff.md`）。

## 写入风险

在**模板仓库**开 issue（派生项目之外）；`gh` 跨仓库操作。不动派生项目文件（除续接记录）。**执行前必须确认 issue 内容已去项目化**（无敏感信息）。需 `gh auth login` + 模板仓可访问。若认证失败、目标仓不可访问或无法判断是否重复创建，应停止并记录，不要反复提交。

## 续接要求

记录提交的提案文件、issue 链接、模板仓 owner/repo、标签、下一步。
