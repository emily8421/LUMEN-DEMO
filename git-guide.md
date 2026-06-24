# Git 使用说明

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


本项目（及所有派生自 `ai-project-template` 的项目）的 git 工作流。模板变更治理见 `CONTRIBUTING.md`。

## 1. 账号体系

- **主账号 `emily8421`**：模板仓库 `emily8421/ai-project-template` 与各派生项目（如 `emily8421/LUMEN-DEMO`）都在此账号下。日常推送用它。
- **次账号 `emilymmhere`**：备用 / 历史账号。
- 多账号切换用 gh：

  ```
  gh auth login             # 添加账号（网页或 token）
  gh auth status            # 查看已登录账号与活跃账号
  gh auth switch -u <账号>  # 切换活跃账号
  ```

- **提交身份**：commit 作者按 `git config user.name/user.email`（本项目为 `mmemily <maixh2012@gmail.com>`）。只要该邮箱在 GitHub 账号上验证过，提交会自动归属该账号——换账号不必改 git 身份。

> ⚠️ `emilymmhere` 用的是 classic PAT（`ghp_`），权限在创建时固定，`gh auth refresh` 无法给它追加权限（如 `delete_repo`）。需要高危权限时用网页流程重登或新建带相应权限的 PAT。`emily8421` 是网页 OAuth 登录（`gho_`），可随时 refresh 追加 scope。

## 2. 新建项目（模板 → 派生项目）

本节是新建派生项目的**操作 SOP 权威文档**；`INIT-PROMPT.md` 可提供可复制给 AI 执行的 Prompt。正式起项目推荐使用 `scripts/new-project.sh`，不要先人工复制模板文件夹再运行脚本。

### 2.1 推荐流程

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

### 2.2 常用选项

```powershell
bash scripts/new-project.sh <项目名> --no-remote          # 只创建本地项目，不建远端
bash scripts/new-project.sh <项目名> --local --no-remote  # 用当前本地模板副本烟测
bash scripts/new-project.sh <项目名> --account <账号> --visibility public
```

正式项目优先不要使用 `--local`，除非你能确认本地模板已同步到 GitHub `main` 最新版本。

### 2.3 新项目创建后

```powershell
cd <项目名>
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

随后填写：

- `docs/00-scenario.md` ~ `docs/02-srs.md`
- `docs/env/local-env.md` 的人工确认项
- `ai/project-rules.md` 的 Phase 边界、技术栈、运行环境与资源约束、项目形态裁剪

再使用 `INIT-PROMPT.md` 的初始化 Prompt 生成 / 补齐 `docs/03-09`。

### 2.4 不推荐做法

- 不推荐手工复制整个模板文件夹。
- 不推荐自己先 `git clone ai-project-template` 再手动改成新项目。
- 不推荐复制后再运行 `new-project.sh`，因为脚本本身就是“创建新项目”的入口。

## 3. 日常提交规范

- **一功能 = 一任务 = 一提交**（见 `ai/global-rules.md` §1.2），禁止一次提交整个系统。
- Commit message 用「完成 XX」式，避免「修改 / update / test」等模糊词；跨模块改动拆成多条（见 `INIT-PROMPT.md` §6）。
- 任何模块开发前先有设计说明再写代码（`global-rules.md` §1.3）。

### 3.1 代码修改完成后的标准流程

完成一次任务后，按以下顺序收尾：

```powershell
git status
git diff
# 运行项目对应验证命令，例如：bash scripts/check-template.sh / npm test / pytest
git add <文件路径>
git commit -m "类型: 简短说明"
git push -u origin <当前分支名>   # 首次推送该分支
gh pr create --fill              # 模板仓库必须走 PR
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

## 4. 模板变更流程

见 `CONTRIBUTING.md`：模板仓库一律**提案 → 分支 → PR → 评审 → 合并 → 归档**，`main` 受分支保护、禁止直推。

派生项目里日常开发是否也走 PR 由项目自行决定；模板仓库强制走 PR。

## 5. 下行同步（模板 → 项目）

本节是派生项目同步模板方法论的**操作 SOP 权威文档**；`INIT-PROMPT.md` §12 只是把本节整理成可复制给 AI 执行的 Prompt，`CONTRIBUTING.md` 只记录治理要求。

派生项目同步模板方法论更新时，优先使用同步脚本，不要手动逐文件复制。该流程是**模板 → 派生项目**的下行获取，不会把派生项目内容提交回模板。

### 5.1 路径判定

先在派生项目根目录判断当前项目属于哪种情况：

| 情况 | 使用流程 |
|---|---|
| 缺少 `scripts/sync-template.ps1` | 旧派生项目首次同步，走 §5.2 |
| 缺少 `template-sync.json` | 旧派生项目首次同步，走 §5.2 |
| `VERSION` 低于 `v1.6.8` 或不确定同步脚本是否为新版 | 旧派生项目首次同步，走 §5.2 |
| 已有新版 `scripts/sync-template.ps1` 与 `template-sync.json` | v1.6.8+ 后续同步，走 §5.3 |

无论哪种路径，`scripts/check-template.sh` / `scripts/check-template.ps1` 都是**模板仓库完整性自检**，不应作为派生项目同步成功判断。派生项目同步后只检查同步边界与最近提交。

### 5.2 旧派生项目首次同步到 v1.6.8+

适用于：项目里没有 `scripts/sync-template.ps1`、没有 `template-sync.json`、`VERSION` 低于 `v1.6.8`，或不确定当前同步脚本是否为新版。

在派生项目根目录执行：

```powershell
git status
git switch -c chore/sync-template-vX.Y.Z
git fetch --no-tags --depth=1 https://github.com/emily8421/ai-project-template.git main
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

确认后执行：

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --commit
git status --short --branch
git show --name-only --stat HEAD
```

检查最新同步提交没有误覆盖 `README.md`、`ai/project-rules.md`、`docs/00-09` 或业务代码。同步到包含 `scripts/check-derived-sync.ps1` 的版本后，也可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
```

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

### 5.5 注意事项

- 执行前工作区应干净；若 `git status` 显示未提交改动，先提交 / 暂存 / 放弃这些改动，不要混入同步提交。
- 同步前先 bootstrap 模板远端最新版 `scripts/sync-template.sh`；不要无条件信任派生项目本地旧脚本。
- 新版 `sync-template.sh` 会在 fetch 后对比远端自身版本；若本地脚本不是最新版，会停止并提示先更新脚本。
- `--dry-run` 只预览差异，不修改工作区、不 stage。
- `--commit` 会覆盖同步清单中的文件并自动提交；提交信息通常由脚本生成。
- 根 `README.md` 是项目件，`ai/project-rules.md` 是项目专属规则，均不在 `template-sync.json` 中，不参与模板下行同步。
- 被 `template-sync.json` 列入的 Markdown 方法论文档会在同步时被覆盖；派生项目不要直接修改这些文件，如需改进请在 `_proposals/` 起草提案并回流模板。
- 同步文件清单以 `template-sync.json` 为准；`scripts/sync-template.sh` 会优先读取模板远端清单。
- 同步后若 `check-derived-sync` 失败，先修复同步边界问题，再 push / PR。
- 同步后整理项目内容时，另开分支执行 `INIT-PROMPT.md` §15 第一段，先只审计并输出迁移计划，不要混入同步提交。
- 老派生项目若执行 `--dry-run` 后出现 staged 改动，说明本地 `scripts/sync-template.sh` 过旧；先恢复工作区，手动用模板最新版覆盖该脚本，再重新执行 `--dry-run`。

## 6. 常见踩坑

| 现象 | 原因 / 处理 |
|---|---|
| push 报 403 / 权限不足 | 活跃账号不对：`gh auth switch -u <目标账号>`；或目标仓库不在该账号下 |
| `gh repo delete` 报 needs delete_repo | classic PAT 无此权限；网页删除，或重登带 `delete_repo` 的 token |
| 提交不归属账号 | commit 邮箱未在该账号验证：GitHub Settings → Emails 添加验证 |
| 两个账号 credential 串 | `git config --global --get credential.helper` 看 GCM；多账号优先用 gh 管理的 credential helper |
| `git push origin main` 被拒（模板仓库） | 预期行为：`main` 受分支保护，改走分支 + PR |

## 7. 命令速查

```
gh auth status                            # 账号总览
gh repo create <acct>/<name> --private    # 建私有仓库
gh pr create / gh pr merge --squash       # 提 / 合 PR
git switch -c <分支>                      # 建并切分支
git push -u origin <分支>                 # 推分支并设上游
bash scripts/new-project.sh <name>        # 一键起新项目
bash scripts/sync-template.sh --dry-run   # 同步预览
```
