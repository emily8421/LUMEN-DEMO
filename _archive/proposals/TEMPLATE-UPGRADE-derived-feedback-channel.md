# TEMPLATE-UPGRADE — 派生项目反馈与提案回流渠道（标准化 + 半自动）

> 来源：LUMEN_demo_T2.1（`emily8421/LUMEN-DEMO`）派生项目回流
> 去项目化提案；不含客户 / 账号 / 路径 / 业务细节。

## 动机

模板进入团队使用阶段（多成员、多机器、多派生）。现有回流机制（手动 cp 提案到模板仓库 `_proposals/` + 开 PR）在「单派生、同机器」够用，但在团队场景暴露三个问题：

1. **跨机器不友好**：成员机器上没有模板仓库本地副本，无法 cp；靠文件传输（通讯 / 邮件）提交给维护者，摩擦大、易丢失、难追溯。
2. **来源不可识别**：提案文件不标来源派生，维护者处理 `_proposals/` 时分不清「派生回流」与「模板自产 / 别的会话」。
3. **自动生成的问题散落**：派生里 sync 运行记录、docs-audit 报告、check 告警含可优化点，但散在各派生，无机制汇集。

瓶颈不在「搬运」（判断性工作：去项目化 / 去重 / 通用性，无法脚本化），而在「上报摩擦」与「来源识别」。方向是 **降低上报摩擦 + 保留人工判断 + 标准化来源**，而非全自动收集（全自动会跳过判断、淹没真问题）。

## 拟改

### 1. 来源标识规则（`ai/global-rules.md §9` 增补）
回流提案 / 反馈须在头部标明来源派生项目（名称 + 仓库），如：
`> 来源：<派生项目名>（<owner>/<repo>）派生项目回流`
- 来源是「出处元数据」，不属于 §9 禁止的客户 / 账号 / 路径 / 业务细节，不违反去项目化。
- 模板自产提案标「模板维护者」。
- 效果：维护者扫提案 / issue 一眼知出处，不再与「别的会话写的」混淆。

### 2. 统一入口：模板仓库 GitHub Issues
以模板仓库 Issues 作为「派生反馈与提案」的集中入口（替代手动 cp）：
- 标签体系：`feedback`（临时问题）、`proposal`（成熟提案）、`from:<派生标识>`（来源）。
- 模板仓库 public，任何 GitHub 用户（团队成员）可开 issue，**无需 fork / 写权限**。
- 配套 Issue 模板（`.github/ISSUE_TEMPLATE/derived-feedback.md`）：预填来源字段、去项目化提醒、问题 / 提案分类。

### 3. `submit-proposal` 命令（成熟提案远程提交）
`ai/commands/submit-proposal.md` + `ai/prompts/maintainers/17-submit-proposal.md`（SOP）：
- 触发：派生项目里 `/run submit-proposal`（自然语言「提交提案给维护者」）。
- 流程：
  1. 读派生 `_proposals/TEMPLATE-UPGRADE-*.md`（成熟提案）。
  2. **校验**：去项目化（无客户 / 账号 / 路径 / 业务）、来源标识、字段完整（动机 / 拟改 / 版本 / 影响）。
  3. `gh issue create --repo <模板仓库> --title "<提案标题>" --body "<提案全文 + 来源>" --label proposal,from:<派生>`。
  4. 返回 issue 链接，记入派生续接文件。
- 关键：**gh CLI 跨仓库开 issue，成员无需本地模板仓库 / fork / 文件传输**，只需 gh 登录其 GitHub 账号。
- 校验失败（去项目化不过 / 缺字段）→ 停下报告，不提交。

### 4. `submit-feedback` 命令（候选问题半自动汇集）
`ai/commands/submit-feedback.md` + SOP：
- 触发：`/run submit-feedback`（「收集使用问题」）。
- 流程：
  1. 扫描派生候选来源：最近 sync 运行记录（`docs/archive/template-sync/`）可优化点、docs-audit 报告、check 告警、`_proposals/` 未成熟草稿。
  2. 列出候选，让成员**勾选**值得上报的（人工过滤）。
  3. 选中的 → `gh issue create`（标签 feedback + from:<派生>）。
- 半自动：扫描自动化，**人工决定**上报哪些（避免噪声淹没维护者）。

### 5. 维护者处理（模板仓库侧）
- Issues 统一入口 → 维护者定期处理：转 `TEMPLATE-UPGRADE-*.md` 实施 / 合并 / 关闭。
- 实施后：issue 关闭 + 提案归档 `_archive/proposals/`。
- `template-proposal-summary` 命令扩展：可读取带 `proposal` 标签的 issues（不限于本地 `_proposals/`）。

## 版本

建议 next minor（新增 2 命令 + issue 模板 + §9 增补；具体号由维护者定）。

## 影响

- 所有派生项目：随模板同步获得 `submit-proposal` / `submit-feedback` 命令（`ai/commands/` 在同步清单）。
- 模板仓库：加 `.github/ISSUE_TEMPLATE/`、§9 增补、新 prompt。
- 兼容性：非破坏。现有手动 cp + PR 流程仍可用（命令是增强，不强制）；`_proposals/` 收件箱仍保留（本地起草），命令负责「提交到维护者」一环。
- 不替代下行同步（`sync-template` / `sync-all-derived` 不变）。

## 设计要点 / 取舍

- **Issue 优先于 PR**：成员无需 fork（public 仓库开 issue 即可）；维护者从 issue 转实施时再走 PR。降低团队摩擦。
- **半自动而非全自动收集**：扫描候选 + 人工选 + 开 issue；不自动批量上报（避免噪声 + 保留判断）。
- **来源标识强制**：所有反馈 / 提案标来源，解决「模板仓库突然多文件，不知哪来」的混淆。
- **校验前置**：`submit-proposal` 提交前校验去项目化 / 字段，挡住低质量或含敏感信息的提案。

## 待模板维护者确认

- **Issue vs PR 默认入口**：本提案建议 Issue（成员无需 fork）；若倾向 PR（fork 模型），`submit-proposal` 改用 `gh pr create` from fork。
- **标签体系**：`feedback` / `proposal` / `from:<派生>` 是否够，或需更多（如 `bug` / `enhancement` / `question`）。
- **submit-feedback 扫描范围**：是否纳入更多自动来源（如 check-derived-sync 告警、collect-env 输出）。
- **权限**：模板仓库是否允许团队成员（非维护者）直接开 issue（public 默认允许；若 private 需配置）。

## 与既有机制的关系

- **下行同步**（`sync-template` / `sync-all-derived`）：不变，本提案只增强上行。
- **`template-proposal-summary`**（模板维护者处理 SOP）：扩展为可读 issues（带 proposal 标签），不限于本地 `_proposals/`。
- **来源标识规则**：是本提案与「phase-overview-table / readme-version-check 回流混淆」痛点的共同解，二者配套。
