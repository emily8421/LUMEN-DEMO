# 12 派生项目同步模板方法论

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在派生项目中，让 AI 按标准流程执行 `ai-project-template` 方法论下行同步。

**快捷命令**：`/run sync-methodology`（自然语言：更新方法论 / 同步模板方法论 / 派生项目同步模板）。

**目的**：避免人工记忆命令，确保先按派生项目版本选择正确入口，再 dry-run、确认不覆盖项目专属内容，最后 commit / PR。

**适用场景**：模板仓库已有新版方法论，派生项目需要同步 `ai/global-rules.md`、Prompt、治理文档、脚本和 AI 入口文件。

**不适用场景**：要把派生项目经验回流到模板；这种情况应先在派生项目 `_proposals/` 起草提案，再按 `CONTRIBUTING.md` 上行流程处理。

**使用前准备**：确认当前在派生项目根目录，已保存业务改动；目标模板版本必须从模板仓库根目录 `VERSION` 读取，不在 Prompt 中固定写死。

**续接要求**：同步流程开始后，按 `ai/session-rules.md` 记录当前同步路径、目标版本、已执行命令、待确认项和下一步。

**预期产出**：同步分支、同步提交、派生同步边界检查结果、派生项目已处理提案归档计划和 PR 链接。

**使用后下一步**：评审并合并派生项目同步 PR；若 `ai/project-rules.md` 需要人工迁移新骨架项，或 `_proposals/` 中仍有未处理提案，单独开任务处理。

> 事实来源：下行同步标准流程以 `git-guide.md` 与 `CONTRIBUTING.md` 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

### 标准 SOP Prompt（直接复制到派生项目使用）

```text
请按标准 SOP 帮我执行派生项目模板方法论下行同步。

目标：将当前派生项目同步到 ai-project-template 最新模板方法论版本。目标版本必须以模板仓库根目录 `VERSION` 为准，不要使用本 Prompt 文本中的示例版本号。

执行要求：
1. 先阅读 ai/index.md 及其列出的全部规则文件。
2. 检查 git status；若有未提交改动，立即停止并说明，不要覆盖。
3. 判断当前派生项目同步路径：
   - 如果缺少 `scripts/sync-template.ps1`，或缺少 `template-sync.json`，或 `VERSION` 低于 `v1.6.8`，或不确定当前同步脚本是否为新版，则按“旧派生项目首次同步”路径执行。
   - 如果已有新版 `scripts/sync-template.ps1` 与 `template-sync.json`，则按“v1.6.8+ 后续同步”路径执行。
   - 不要运行 `scripts/check-template.sh` 或 `scripts/check-template.ps1` 作为派生项目同步验收；它们是模板仓库完整性自检。
4. 先拉取模板 main 并读取目标版本：
   - 运行：git fetch --no-tags --depth=1 https://github.com/emily8421/ai-project-template.git main
   - 运行：git show FETCH_HEAD:VERSION
   - 记录输出的目标版本，例如 vX.Y.Z。
5. 新建或切换到同步分支：chore/sync-template-vX.Y.Z（X.Y.Z 取上一步读取到的目标模板版本）。
6. 如果是旧派生项目首次同步：
   - 先 bootstrap 最新同步脚本；旧项目使用 Bash 入口，不要无条件信任派生项目本地旧脚本：
   - 运行：git checkout FETCH_HEAD -- scripts/sync-template.sh
   - 运行：git add scripts/sync-template.sh
   - 若 `git diff --cached --quiet` 显示无 staged 差异，说明本地脚本已是最新版，跳过本次提交并继续下一步。
   - 若有 staged 差异，运行：git commit -m "chore: bootstrap latest sync script"
   - 运行：& "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --dry-run
   - 如果 Git for Windows 安装位置不同，用本机实际 `bash.exe` 路径替换示例路径。
7. 如果是 v1.6.8+ 后续同步：
   - 运行：powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
8. 检查 dry-run 输出，确认只涉及模板方法论同步文件；不应出现 README.md、ai/project-rules.md、docs/00-09、frontend/、backend/、tests/、docker/ 或业务代码。
9. 如果 dry-run 合理，执行同步：
   - 旧派生项目首次同步：运行 & "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --commit
   - v1.6.8+ 后续同步：运行 powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit
10. 只做派生同步边界检查：
   - 运行：git status --short --branch
   - 运行：git show --name-only --stat HEAD
   - 如已同步到包含 `scripts/check-derived-sync.ps1` 的版本，运行：powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
   - 确认最新同步提交没有误覆盖 README.md、ai/project-rules.md、docs/00-09 或业务代码。
11. 如本次同步引入新的项目专属骨架项，不要直接覆盖 ai/project-rules.md；列出需要人工迁移的字段，例如 `§2.5 运行环境与资源约束`。
12. 如项目已同步到含 `scripts/collect-env.ps1` 的模板版本，但尚无 `docs/env/local-env.md`，提示运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1，并补齐人工确认项。
13. 检查本项目 `_proposals/`：
   - 如果其中提案已被模板仓库采纳，并且本次同步已拿到对应模板版本，将这些已处理提案移动到本项目 `_archive/proposals/` 归档。
   - 未处理、延后处理或不确定状态的提案继续保留在 `_proposals/`，不要误归档。
   - 如执行归档，补充或更新 `_archive/proposals/README.md`，说明归档规则与对应模板版本 / PR。
14. 如有归档改动，运行 git status 并确认只移动提案记录，不改业务文件。
15. 推送当前分支：git push -u origin chore/sync-template-vX.Y.Z。
16. 创建 PR：gh pr create --fill。
17. 最后汇总：同步到的模板版本、同步提交、采用的同步路径、同步边界检查结果、是否需要人工迁移 project-rules、是否需要运行 collect-env、提案归档情况和 PR 链接。

遇到以下情况必须停止并说明原因：
- 工作区不干净。
- 无法读取模板仓库 `VERSION`。
- dry-run 后出现 staged 改动。
- dry-run 显示会覆盖项目专属文件。
- sync-template 提示本地脚本不是最新版，且无法完成 bootstrap。
- 派生同步边界检查显示最新同步提交包含 README.md、ai/project-rules.md、docs/00-09 或业务代码。
- 无法判断 `_proposals/` 中某个提案是否已被模板采纳。
- 脚本失败。
- GitHub 认证或权限失败。
```
