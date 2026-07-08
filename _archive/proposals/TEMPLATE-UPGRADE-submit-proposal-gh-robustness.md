# TEMPLATE-UPGRADE: submit-proposal 的 gh issue 创建流程稳健性

> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

## 1. 背景与问题

派生项目按 `submit-proposal` 流程将本地 `_proposals/TEMPLATE-UPGRADE-*.md` 回流为模板仓 GitHub issue 时，当前命令说明建议使用：

```text
gh issue create --repo <模板仓库 owner/repo> --title "<提案标题>" --body "<提案全文>" --label proposal,from:<派生标识>
```

该流程在实际执行中暴露出几个通用稳健性问题：

1. PowerShell 下将 Markdown 全文放入 `--body "<提案全文>"` 容易被换行、代码块、反引号、变量符号或引号拆分，导致 `gh issue create` 报 unknown arguments。
2. `gh issue create --label from:<派生标识>` 要求目标仓库已存在该标签；若标签不存在，命令失败，且不会创建 issue。
3. AI CLI / sandbox 环境中 `gh auth status` 可能与提权 / 用户终端可见的 keyring token 不一致，导致“用户已登录但 AI 仍看到 token invalid”的误判。
4. 当前流程没有要求创建 issue 前做“是否已存在同标题 issue”的幂等检查，失败重试时可能产生重复提交风险。
5. 当来源标签不存在时，流程没有定义是自动创建标签、降级为仅 `proposal` 标签，还是停下请维护者确认。

这些问题不依赖具体业务项目；凡是派生项目在 Windows PowerShell、AI CLI sandbox 或缺少来源标签的模板仓中执行跨仓库 issue 回流，都可能遇到。

## 2. 目标

增强 `submit-proposal` 流程，使派生项目回流提案时：

1. 默认使用 `--body-file <提案文件>`，避免 shell 对 Markdown 正文拆参。
2. 创建 issue 前先检查 `gh` 认证状态、目标仓库可访问性、必需标签是否存在。
3. 来源标签不存在时有明确策略：创建标签、降级提交、或请求人工确认。
4. 创建 issue 前做同标题 / 同来源提案的重复检查。
5. 失败后能恢复：记录失败原因、已执行命令、是否已创建 issue、下一步处理方式。

## 3. 拟修改范围

| 文件 | 建议 |
|---|---|
| `ai/commands/submit-proposal.md` | 将推荐命令从 `--body "<提案全文>"` 改为 `--body-file <提案文件>`；补充标签预检、幂等检查和认证可见性说明 |
| `ai/prompts/maintainers/17-submit-proposal.md` | 增加执行前检查清单、失败恢复路径、来源标签处理策略 |
| `template-docs/derived-sync-report-template.md` | 可选：在“遇到的问题”中补充 `gh issue create` 失败、标签缺失、认证可见性字段 |
| `git-guide.md` | 可选：在 GitHub CLI 相关小节补充 sandbox / keyring token 可见性说明 |

## 4. 推荐流程

### 4.1 提交前校验

在创建 issue 前执行：

```powershell
gh auth status -h github.com
gh repo view <模板仓库 owner/repo> --json nameWithOwner,visibility
gh label list --repo <模板仓库 owner/repo> --limit 200
gh issue list --repo <模板仓库 owner/repo> --state open --search "<提案标题> in:title" --json number,title,url,labels
```

若 `gh auth status` 在 AI sandbox 中失败，但用户终端 / 提权环境成功，应记录“认证可见性不一致”，并在可访问凭据的环境中执行 `gh issue create`。

### 4.2 正文提交方式

推荐命令改为：

```powershell
gh issue create `
  --repo <模板仓库 owner/repo> `
  --title "<提案标题>" `
  --body-file _proposals/TEMPLATE-UPGRADE-xxx.md `
  --label proposal `
  --label "from:<派生标识>"
```

说明：

- `--body-file` 能避免 Markdown 正文中的换行、代码块、反引号、管道符、美元符号被 shell 拆分。
- 来源标签中包含冒号时应加引号。
- 若提案正文来自临时生成内容，也应先写入临时 markdown 文件，再用 `--body-file` 提交。

### 4.3 来源标签策略

建议在 Prompt 中明确三种策略，按项目权限选择：

| 情况 | 建议动作 |
|---|---|
| 来源标签已存在 | 正常使用 `--label "from:<派生标识>"` |
| 来源标签不存在且当前账号有标签管理权限 | 先执行 `gh label create "from:<派生标识>" --description "Derived project source: <派生标识>" --color <颜色>` |
| 来源标签不存在且无权限创建 | 仅使用 `proposal` 标签创建 issue，并在 issue 正文来源标识中保留派生项目信息；续接记录“来源标签待维护者补充” |

### 4.4 幂等与失败恢复

建议流程要求：

1. 创建前用标题搜索 open issue，避免重复提交。
2. 若 `gh issue create` 失败，立刻用标题搜索确认是否已经创建半成品 issue。
3. 若因标签不存在失败且未创建 issue，先处理标签再重试。
4. 若因认证失败，停止并记录 `gh auth status` 结果，不要继续重试。
5. 成功后将 issue URL、标签、模板仓 repo、提案文件路径写入 `.ai/session-handoff.md`。

## 5. 命令文案建议

建议将 `ai/commands/submit-proposal.md` 当前第 3 步改成类似：

```text
3. 创建 issue 前先检查：
   - `gh auth status -h github.com`
   - `gh issue list --repo <模板仓库 owner/repo> --state open --search "<标题> in:title"`
   - `gh label list --repo <模板仓库 owner/repo>` 是否包含 `proposal` 与 `from:<派生标识>`。
   若来源标签缺失：有权限则创建；无权限则只用 `proposal` 并在续接中标注。
4. 使用 `--body-file` 创建 issue：
   `gh issue create --repo <模板仓库 owner/repo> --title "<提案标题>" --body-file <提案文件> --label proposal --label "from:<派生标识>"`。
5. 返回 issue 链接，记入派生续接文件。
```

## 6. 版本影响与兼容性

- 版本影响：建议作为模板 patch / minor 增强，不改变提案格式。
- 兼容性：对已有提案无影响；只增强跨仓库 issue 创建流程。
- 权限影响：若自动创建来源标签，需要当前 GitHub 账号具备目标仓库标签管理权限；无权限时应降级，不阻断 issue 创建。
- 风险：自动创建过多来源标签可能造成标签膨胀；可通过统一命名 `from:<派生标识>` 和维护者定期整理控制。

## 7. 验证方式

模板落地后应验证：

1. 提案正文包含多行 Markdown、代码块、反引号、管道符、美元符号时，`--body-file` 能正常创建 issue。
2. 来源标签已存在时，issue 创建成功并带 `proposal` + `from:<派生标识>` 标签。
3. 来源标签不存在但有权限创建时，流程能先创建标签再创建 issue。
4. 来源标签不存在且无权限创建时，流程能降级为仅 `proposal` 标签并在续接中记录。
5. `gh auth status` 失败时，流程停止并提示重新认证，不会生成重复 issue。
6. 创建失败后标题搜索能确认是否已产生半成品 issue。

## 8. 验收标准

1. `submit-proposal` 文档不再推荐把完整 Markdown 正文塞入 `--body`。
2. Windows PowerShell 下带代码块的提案能通过 `--body-file` 成功创建 issue。
3. 缺失来源标签时有明确处理分支，不再让用户困惑于 `could not add label`。
4. AI 能在 issue 创建失败后检查是否已创建重复 issue。
5. 成功回流后，续接文件记录 issue URL、模板仓、标签、提案文件和下一步。

