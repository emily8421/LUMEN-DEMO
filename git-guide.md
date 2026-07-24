# Git 使用说明

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


本文件是 `ai-project-template` 及其派生项目的 git 工作流，**按场景组织**——你要做哪件事，就查哪个场景（见 §2 速查表）。模板变更治理见 `CONTRIBUTING.md`。

## 1. 先准备（gh 账号 + 身份）

本模板只保留通用 GitHub / Git 身份操作，不记录具体维护者账号、邮箱或 Token 类型。若某个维护者需要保存本机账号备忘，请写入本地临时文件（如被 `.gitignore` 排除的 `NEXT-STEPS.md`），不要提交到模板同步文档。

- **主账号**：拥有模板仓库与派生项目的日常推送权限。
- **备用账号**：仅在组织权限、历史仓库或临时授权需要时切换使用。
- 多账号切换用 `gh`：

  ```
  gh auth login             # 添加账号（网页或 token）
  gh auth status            # 查看已登录账号与活跃账号
  gh auth switch -u <账号>  # 切换活跃账号
  ```

- **提交身份**：commit 作者按 `git config user.name/user.email`。只要该邮箱在目标 GitHub 账号上验证过，提交会自动归属该账号；切换 `gh` 活跃账号不一定需要改 git 提交身份。

> ⚠️ Token / OAuth 权限取决于登录方式与授权范围。若 `gh` 报 scope 不足，优先运行 `gh auth status` 确认活跃账号，再按 GitHub 官方流程刷新授权、重新登录或更换具备对应权限的账号。

### 1.1 GitHub 操作前预检（push / PR / merge）

当你同时打开模板仓库和多个派生项目，或多个 AI CLI / 终端并行工作时，在任何 `git push`、`gh pr create`、`gh pr merge`、`git pull` 合并、tag / release 前，先确认当前上下文：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1
```

如已知目标仓库，可加期望 owner / repo 做只读校验：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1 -ExpectedOwner <owner> -ExpectedRepo <repo>
```

预检只读输出：当前 repo root、分支、origin、Git 提交身份、工作区状态、`gh auth status` 和 `gh repo view` 权限。它不会切账号、不会改 remote、不会 push / merge。若预检发现账号无权限、remote 不符合预期、工作区有未确认改动或 `gh repo view` 失败，应先停止并说明，不要继续执行远端操作。

> 该预检不能替代 GitHub 授权：`gh auth login`、OAuth scope、SSO 授权、Git Credential Manager 和仓库权限仍需在本机按 GitHub 官方流程处理；模板只提供操作前门禁，避免多仓 / 多会话误操作。

### 1.2 远端 / CI / sandbox 防卡死策略

涉及 `git push`、`gh pr create`、`gh pr merge`、`gh issue close`、删除远端分支、查询 GitHub Actions / CI 或其他远端状态时，默认使用 Checkpoint Mode（见 `ai/session-rules.md` §3.3）：

- **远端状态变更单步确认**：push、创建 / 合并 PR、关闭 issue、删除分支、发 release 或打 tag 前，先说明目标仓库、分支、命令、风险和回滚方式，等待用户确认。
- **CI 短轮询**：只查询一次或短轮询；若 checks / Actions 仍为 pending，汇报 pending 和复查命令，不长时间挂起等待。
- **失败日志最小化**：CI failed 只摘失败 job / step、关键错误和链接；不要把完整长日志刷入上下文。
- **sandbox / network / auth 错误即停**：遇到权限不足、network restricted、DNS / registry 失败、`gh auth` / askpass / credential 错误或命令超时，先停止并说明错误类别；不得连续重试或改用绕过权限边界的方式继续。
- **不扩大修复范围**：CI 失败或远端报错若无法确认与本次改动相关，先标记不确定并请用户确认，不得直接进入大范围修复。

## 2. 场景速查（你要做哪件事？）

| 你想做 | 你是 | 去哪节 | 对应 scenario 码 |
|---|---|---|---|
| 在派生项目里日常提交代码 | 使用者 | §3 场景 A | A10 |
| 维护模板仓库（改方法论 / 脚本 / 治理） | 维护者 | §4 场景 B | C4/C7 |
| 把模板更新同步到派生项目 | 使用者 | §5 场景 C | A13 |
| 从模板新建一个派生项目 | 使用者 / 维护者 | §6 场景 D | A2 |

找不到场景 → 看 §7 踩坑 / §8 命令速查。

## 3. 场景 A：派生项目日常提交（使用者）

你在派生项目里写代码、提交、提 PR。

- **一功能 = 一任务 = 一提交**（见 `ai/global-rules.md` §1 第 2 条），禁止一次提交整个系统。
- Commit message 用「完成 XX」式，避免「修改 / update / test」等模糊词；跨模块改动拆成多条（见 `ai/prompts/git/06-commit-message.md`）。
- 任何模块开发前先有设计说明再写代码（`global-rules.md` §1 第 3 条）。

### 3.1 代码修改完成后的标准流程

完成一次任务后，按以下顺序收尾：

```powershell
git status
git diff
git diff --check
powershell -ExecutionPolicy Bypass -File scripts/check-markdown-clean.ps1 _proposals ai-records  # 模板仓 Markdown 提案 / 记录预检
# 运行项目对应验证命令，例如：bash scripts/check-template.sh / npm test / pytest
powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1  # push / PR 前只读预检
git add <文件路径>
git commit -m "类型: 简短说明"
git push -u origin <当前分支名>   # 首次推送该分支
gh pr create --fill              # 如项目要求走 PR；模板仓强制
```

后续同一分支已有 upstream 时，推送可简化为：

```powershell
git push
```

PR 合并后，同步本地 `main` 并清理已合并分支：

```powershell
git switch main
git pull
git branch -d <已合并分支名>
```

常用提交类型：

- `feat:` 新增功能
- `fix:` 修复问题
- `docs:` 更新文档
- `chore:` 调整脚本、流程或治理文件
- `refactor:` 重构但不改变行为
- `test:` 增加或修正测试

## 4. 场景 B：模板维护提交（维护者）

你要改 `ai-project-template` 模板仓库本身（方法论 / 脚本 / 治理文档）。

见 `CONTRIBUTING.md`：模板仓库一律**提案 → 分支 → PR → 评审 → 合并 → 归档**，`main` 受分支保护、禁止直推。

派生项目里日常开发是否也走 PR 由项目自行决定；模板仓库强制走 PR。

### 多会话并发操作（重要）

多个 AI 会话（或终端）**同时操作同一仓库**时，共用一个工作目录 = 共用一个 HEAD；`先确认分支再 commit` 是非原子操作，**必然偶发 commit 落错分支**。git 本身没有「自动防多会话切分支」的机制——必须靠**每会话一个独立 worktree**：

```bash
# 会话 A 在主仓
cd /path/ai-project-template

# 会话 B 开独立 worktree（建 + 进；各工作区、各 HEAD，共享同一 .git）
git worktree add ../ai-tpl-wt2 -b change/B的分支
cd ../ai-tpl-wt2          # B 在这里改 / 提交 / 推送，完全不碰 A 的工作区
# 完成后回主仓清理
cd /path/ai-project-template && git worktree remove ../ai-tpl-wt2
```

> 详见 `ai/session-rules.md` §8（多会话并发操作）。

## 5. 场景 C：派生项目同步模板（使用者）

你要把模板方法论的更新拉到派生项目（**模板 → 派生，下行获取，不回传**）。

本节是派生项目同步模板方法论的**操作 SOP 权威文档**；`ai/prompts/maintainers/12-sync-template.md` 只是把本节整理成可复制给 AI 执行的 Prompt，`CONTRIBUTING.md` 只记录治理要求。

派生项目同步模板方法论更新时，优先使用同步脚本，不要手动逐文件复制。该流程是**模板 → 派生项目**的下行获取，不会把派生项目内容提交回模板。

> **批量同步（维护者）**：发新版后要一次更新父目录下所有派生项目，用 `bash scripts/sync-all-derived.sh <父目录> --dry-run`（场景 C8），不用逐个进派生项目终端；确认后 `--commit`。

### 5.1 路径判定

先在派生项目根目录判断当前项目属于哪种情况：

| 情况 | 使用流程 |
|---|---|
| 缺少 `scripts/sync-template.ps1` | 旧派生项目首次同步，走 §5.2 |
| 缺少 `template-sync.json` | 旧派生项目首次同步，走 §5.2 |
| `VERSION` 低于 `v1.6.8` 或不确定同步脚本是否为新版 | 旧派生项目首次同步，走 §5.2 |
| 已有新版 `scripts/sync-template.ps1` 与 `template-sync.json` | v1.6.8+ 后续同步，走 §5.3 |

无论哪种路径，`scripts/check-template.sh` / `scripts/check-template.ps1` 都是**模板仓库完整性自检**，不应作为派生项目同步成功判断。派生项目同步后只检查同步边界与最近提交。

> Windows 说明：
> 若 `scripts/sync-template.ps1` 或 `scripts/check-derived-sync.ps1` 报 Git Bash / MSYS 启动错误，脚本会先明确标注并进入 PowerShell fallback；fallback 可完成同步 dry-run / commit 与派生边界检查，并按 UTF-8 bytes 解码 Git 输出，避免 Windows PowerShell 5.1 代码页导致中文 Markdown、JSON 或文件名乱码。若 fallback 也失败，再优先视为本机 Git / 权限 / 网络问题，不要先把它理解成模板缺了新手步骤。

### 5.2 旧派生项目首次同步到 v1.6.8+

适用于：项目里没有 `scripts/sync-template.ps1`、没有 `template-sync.json`、`VERSION` 低于 `v1.6.8`，或不确定当前同步脚本是否为新版。

在派生项目根目录执行：

```powershell
git status
git switch -c chore/sync-template-vX.Y.Z
git fetch --no-tags --depth=1 <模板仓库远端URL> main
git show FETCH_HEAD:VERSION
git checkout FETCH_HEAD -- scripts/sync-template.sh
git add scripts/sync-template.sh
git commit -m "chore: bootstrap latest sync script"
& "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --dry-run
```

若 `git commit` 提示无变更，说明本地 `scripts/sync-template.sh` 已是最新版，可直接继续 `--dry-run`。若 Git for Windows 安装位置不同，用本机实际 `bash.exe` 路径替换示例路径。

确认 `--dry-run` 输出只涉及 `template-sync.json` 中的模板方法论文件；尤其不应出现：

- `README.md`
- `ai/project-rules.md`
- `docs/00-scenario.md` ~ `docs/09-verification.md`
- `frontend/`、`backend/`、`tests/`、`docker/` 等业务代码或项目专属目录

> 例外：`ai/doc-standards/00-09`（模板撰写规范镜像）会在本次同步中**新增 / 刷新**，属预期产物（见 §5.6），不等于、也不覆盖项目自己的 `docs/00-09` 项目事实。旧项目残留的 `docs/_scaffold/00-09` 仅作兼容参考。

确认后执行：

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --commit
git status --short --branch
git show --name-only --stat HEAD
```

检查最新同步提交没有误覆盖 `README.md`、`ai/project-rules.md`、`docs/00-09` 或业务代码。旧派生项目首次同步到新版脚本后，不要停在同步提交；应继续读取新同步到的 `ai/prompts/maintainers/12-sync-template.md`，按标准闭环完成边界验证、同步后整理、文档体系审计、项目验证建议和同步运行记录。同步到包含 `scripts/check-derived-sync.ps1` 的版本后，也可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
```

随后继续执行 `/run post-sync-cleanup`、`/run docs-system-audit` 的同步后审计模式，并按 `template-docs/derived-sync-report-template.md` 生成或更新 `sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`。若项目当前 AI 入口仍是旧版本，先直接打开新同步到的 `ai/prompts/maintainers/12-sync-template.md` 作为后续步骤清单。

### 5.3 v1.6.8+ 后续同步

适用于：派生项目已经有新版 `scripts/sync-template.ps1` 与 `template-sync.json`。

在派生项目根目录执行：

```powershell
git status
git switch -c chore/sync-template-vX.Y.Z
powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
```

确认 `--dry-run` 输出只涉及模板方法论同步文件，且不会覆盖项目专属内容后，再执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit
powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
git status --short --branch
git show --name-only --stat HEAD
```

如果项目要求走 PR，继续执行：

```powershell
git push -u origin chore/sync-template-vX.Y.Z
gh pr create --fill
```

### 5.4 两类检查命令

```
powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1  # 派生项目同步边界检查
powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1       # 仅模板仓库完整性自检
```

### 5.4.1 派生项目 GitHub Actions

模板仓 `.github/workflows/template-check.yml` 只服务 `ai-project-template` 自身，会运行 `scripts/check-template.sh`。派生项目普通 PR 不应使用该 workflow，否则会被模板仓 README、占位文档、提案收件箱等规则误拦截。

`scripts/new-project.sh` 会为新派生项目生成 `.github/workflows/project-check.yml`：普通 PR / push 只运行 `git diff --check`；仅当最新提交信息匹配 `sync template vX.Y.Z from ai-project-template` 时，才运行 `scripts/check-derived-sync.sh HEAD` 验证模板同步边界。

旧派生项目若仍保留 `.github/workflows/template-check.yml`，同步后整理时应迁移为项目版 workflow，或至少禁用模板仓 `scripts/check-template.sh` 步骤。

### 5.5 注意事项

- 执行前工作区应干净；若 `git status` 显示未提交改动，先提交 / 暂存 / 放弃这些改动，不要混入同步提交。
- 同步前先 bootstrap 模板远端最新版 `scripts/sync-template.sh`；不要无条件信任派生项目本地旧脚本。
- 新版 `sync-template.sh` 会在 fetch 后对比远端自身版本；若本地脚本不是最新版，会停止并提示先更新脚本。
- `--dry-run` 只预览差异，不修改工作区、不 stage。
- `--commit` 会覆盖同步清单中的文件并自动提交；普通派生项目建议追加 `--preserve-project-version`，保留项目自身 `VERSION` / `CHANGELOG.md`，并用 `TEMPLATE-BASE.md` 记录继承模板版本；领域模板（如 `agent-system-template`）改用 `--domain-template`（与 `--preserve-project-version` 互斥），保留领域模板自身 `VERSION` / `CHANGELOG.md`，并用领域版 `TEMPLATE-BASE.md` 记录继承母模板版本；若仓库已存在对应角色的 `TEMPLATE-BASE.md`，新版脚本会自动启用相应模式；提交信息仍由脚本生成。
- 根 `README.md` 是项目件，`ai/project-rules.md` 是项目专属规则，均不在 `template-sync.json` 中，不参与模板下行同步。
- 被 `template-sync.json` 列入的 Markdown 方法论文档会在同步时被覆盖；派生项目不要直接修改这些文件，如需改进请在 `_proposals/` 起草提案并回流模板。
- 同步文件清单以 `template-sync.json` 为准；`scripts/sync-template.sh` 会优先读取模板远端清单。
- 同步后若 `check-derived-sync` 失败，先修复同步边界问题，再 push / PR。
- 若已经完成同步提交但不确定后续是否执行，使用 `/run sync-methodology` 的“同步后续接模式”：不要重新 dry-run / commit，先核对 `git log --oneline -8`、`VERSION`、`TEMPLATE-BASE.md`（若存在）、最近同步记录和工作区，再从 `check-derived-sync` 开始补完后续闭环。
- 同步后进入标准闭环：`check-derived-sync` 边界验证 → `post-sync-cleanup` 整理计划 → `docs-system-audit` 同步后审计 → 项目验证建议 → 同步报告留痕。
- 同步后整理项目内容时，另开分支执行 `ai/prompts/maintainers/15-post-sync-cleanup.md` 第一段，先只审计并输出迁移计划，不要混入同步提交；整理摘要应回写同步报告。
- 项目文档成型后，再用 `ai/prompts/review/16-docs-system-audit.md` 对照本次同步产出的 `ai/doc-standards` 规范基线，回溯审计整条 PLM 链路（先出报告不改文件；旧项目可 fallback 到 `docs/_scaffold`）。同步后审计模式应区分规范基线缺口、兼容差异和项目事实问题。
- 同步报告推荐写入 `sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`，记录同步命令、边界验证、整理摘要、文档审计摘要、项目验证建议、未验证项和后续任务；旧路径 `docs/archive/template-sync/` 仅作兼容读取。
- 老派生项目若执行 `--dry-run` 后出现 staged 改动，说明本地 `scripts/sync-template.sh` 过旧；先恢复工作区，手动用模板最新版覆盖该脚本，再重新执行 `--dry-run`。

### 5.6 `doc-standards` 规范镜像（v1.20.0+）

下行同步除覆盖 `template-sync.json` 方法论文件外，还会把模板 `docs/00-09` 的**撰写规范**镜像到派生项目 `ai/doc-standards/00-09`（AI 文档标准区，**只读、非项目事实**，随模板版本刷新）。

- 派生项目自己的 `docs/00-09`（项目事实）**完全不动**；`ai/doc-standards/*` 与项目事实物理分离，不会互相覆盖。
- 因此 `--dry-run` 中出现 `Δ ai/doc-standards/00-scenario.md（新增规范镜像）` 之类条目是**预期**的，`scripts/check-derived-sync.ps1` 也明确放行 `ai/doc-standards/*`；真正不能出现的是项目事实 `docs/00-09` 被改。
- 用途：同步后用 `ai/prompts/review/16-docs-system-audit.md` 对照 `ai/doc-standards`（规范基线）回溯审计整条 PLM 链路（见 §5.5 末尾闭环）。
- 兼容：v1.18.x 旧路径 `docs/_scaffold/00-09` 不再是主路径；迁移期审计提示词和边界检查会 fallback / 放行该旧路径，但 `sync-template` 不主动删除旧目录。

### 5.7 网络与代理配置（受限网络环境）

受限网络（如国内直连 GitHub）下，`git fetch` / `git push` 直连常被重置（症状：HTTPS `curl 16 framing` / `curl 52 empty reply`、连接 reset），`sync-template` 的 `git fetch` 会失败。此时需要走代理，且 `git` 与 `gh` 的代理配置**不共用**：

- **git（fetch/push）**：对仓库设 local 代理，或临时带 `-c`：
  ```bash
  git config --local http.proxy http://127.0.0.1:<代理端口>
  git config --local https.proxy http://127.0.0.1:<代理端口>
  # 或临时：git -c http.proxy=http://127.0.0.1:<代理端口> fetch ...
  ```
- **gh（不读 `git http.proxy`）**：命令必须单独带环境变量：
  ```bash
  HTTPS_PROXY=http://127.0.0.1:<代理端口> HTTP_PROXY=http://127.0.0.1:<代理端口> gh pr create ...
  ```

`<代理端口>` 以本机代理工具（如 clash mixed-port）实际端口为准。`sync-template` fetch 失败时会打印上述配置提示；后续 `gh pr create` / `gh pr merge` / `gh pr checks` 等命令都要带 `HTTPS_PROXY` / `HTTP_PROXY`。

### 5.8 Windows 大同步输出与超时

Windows / Git Bash 下大批量同步（跨多版本 / 首次同步）会输出大量 `warning: LF will be replaced by CRLF` 与 diff-stat，可能命中 AI 工具默认超时（如 120s），但脚本本身未必失败。大同步建议：

- **重定向到 log**：`sync-template.sh --dry-run > sync.log 2>&1`（或 `.ps1`），完整输出落盘，不直接灌入上下文。
- **长超时**：大同步 dry-run / commit 用更长超时（300s+），避免工具超时被误判为脚本失败。
- **grep 摘要**：只看 EXIT、变化文件数、删除数、项目专属触及、版本机制结果：
  - 禁止路径：`grep -nE 'README\.md|ai/project-rules\.md|docs/00-09|frontend/|backend/|tests/|docker/' sync.log`
  - 版本机制：`grep -nE 'VERSION|CHANGELOG|TEMPLATE-BASE|preserve-project-version|domain-template' sync.log`
- **CRLF warning 不判失败**：`LF will be replaced by CRLF` 是 Windows 换行提示，不等于错误；只有真实 Git 错误、冲突、越界覆盖或校验失败才算失败。
- **失败才展开**：成功时只保留摘要计数；失败或可疑时再打开 log 的最小相关片段。

`check-derived-sync` 成功路径同理：优先看同步文件计数、越界检查摘要、版本机制结果；逐文件列表在失败 / 可疑时再展开。

## 6. 场景 D：新建派生项目（使用者 / 维护者）

你要从模板创建一个新项目。

本节是新建派生项目的**操作 SOP 权威文档**；`INIT-PROMPT.md` 索引与 `ai/prompts/` 可提供可复制给 AI 执行的 Prompt。正式起项目推荐使用 `scripts/new-project.sh`，不要先人工复制模板文件夹再运行脚本。

### 6.1 推荐流程

在本地 `ai-project-template` 仓库或任意能访问该脚本的位置执行：

```powershell
bash scripts/new-project.sh <项目名>
```

默认行为：

- 从 GitHub `ai-project-template` 的 `main` 拉取最新模板（事实来源）。
- 创建新项目目录。
- 移除模板仓库 `.git`，初始化新项目 Git。
- 创建首提交。
- 创建 GitHub 仓库并推送。

### 6.2 常用选项

```powershell
bash scripts/new-project.sh <项目名> --no-remote          # 只创建本地项目，不建远端
bash scripts/new-project.sh <项目名> --local --no-remote  # 用当前本地模板副本烟测
bash scripts/new-project.sh <项目名> --account <账号> --visibility public
```

正式项目优先不要使用 `--local`，除非你能确认本地模板已同步到 GitHub `main` 最新版本。

### 6.3 新项目创建后

```powershell
cd <项目名>
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

随后填写：

- `docs/00-scenario.md` ~ `docs/02-srs.md`
- `docs/env/local-env.md` 的人工确认项
- `ai/project-rules.md` 的 Phase 边界、技术栈、运行环境与资源约束、项目形态裁剪

再使用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料，并用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 补齐 docs 文档体系。

### 6.4 不推荐做法

- 不推荐手工复制整个模板文件夹。
- 不推荐自己先 `git clone ai-project-template` 再手动改成新项目。
- 不推荐复制后再运行 `new-project.sh`，因为脚本本身就是"创建新项目"的入口。

## 7. 常见踩坑

| 现象 | 原因 / 处理 |
|---|---|
| push 报 403 / 权限不足 | 活跃账号不对：`gh auth switch -u <目标账号>`；或目标仓库不在该账号下 |
| `gh repo delete` 报 needs delete_repo | classic PAT 无此权限；网页删除，或重登带 `delete_repo` 的 token |
| 提交不归属账号 | commit 邮箱未在该账号验证：GitHub Settings → Emails 添加验证 |
| 两个账号 credential 串 | `git config --global --get credential.helper` 看 GCM；多账号优先用 gh 管理的 credential helper |
| `git push origin main` 被拒（模板仓库） | 预期行为：`main` 受分支保护，改走分支 + PR |

## 8. 命令速查

```
gh auth status                            # 账号总览
gh repo create <acct>/<name> --private    # 建私有仓库
gh pr create / gh pr merge --squash       # 提 / 合 PR
git switch -c <分支>                      # 建并切分支
git push -u origin <分支>                 # 推分支并设上游
bash scripts/new-project.sh <name>        # 一键起新项目
bash scripts/sync-template.sh --dry-run   # 同步预览
```

> 脚本命令（`check-prereqs.ps1` / `sync-template.ps1` / `check-template.ps1` / `collect-env.ps1` 等 PowerShell/Bash 入口与 Windows 脚本矩阵）见 `SOP.md` 常用命令。
