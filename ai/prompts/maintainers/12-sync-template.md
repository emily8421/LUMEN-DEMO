# 12 派生项目同步模板方法论

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在派生项目中，让 AI 按标准流程执行 `ai-project-template` 方法论下行同步。

**快捷命令**：`/run sync-methodology`（自然语言：更新方法论 / 同步模板方法论 / 派生项目同步模板）。

**目的**：避免人工记忆命令，确保先按派生项目版本选择正确入口，再 dry-run、确认不覆盖项目专属内容，最后完成同步、边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕。

**适用场景**：模板仓库已有新版方法论，派生项目需要同步 `ai/global-rules.md`、Prompt、治理文档、脚本和 AI 入口文件。

**不适用场景**：要把派生项目经验回流到模板；这种情况应先在派生项目 `_proposals/` 起草提案，再按 `CONTRIBUTING.md` 上行流程处理。

**使用前准备**：确认当前在派生项目根目录，已保存业务改动；目标模板版本必须从模板仓库根目录 `VERSION` 读取，不在 Prompt 中固定写死。

**续接要求**：同步流程开始后，按 `ai/session-rules.md` 记录当前同步路径、目标版本、已执行命令、边界验证结果、整理 / 审计摘要、项目验证建议、待确认项和下一步。

**预期产出**：同步分支、同步提交、派生同步边界检查结果、同步后整理计划、文档体系审计摘要、项目验证建议、派生同步运行记录、派生项目已处理提案归档计划和 PR 链接。

**使用后下一步**：评审并合并派生项目同步 PR；用 `template-docs/derived-sync-report-template.md` 生成或更新同步运行记录；若 `post-sync-cleanup`、`docs-system-audit` 或项目验证建议发现待办，按最小任务继续处理。若 `ai/project-rules.md` 需要人工迁移新骨架项、`_proposals/` 中仍有未处理提案，或运行记录中出现可通用模板优化点，单独开任务处理。

> 事实来源：下行同步标准流程以 `git-guide.md` 与 `CONTRIBUTING.md` 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

### 标准 SOP Prompt（直接复制到派生项目使用）

```text
请按标准 SOP 帮我执行派生项目模板方法论下行同步。

目标：将当前派生项目同步到 ai-project-template 最新模板方法论版本。目标版本必须以模板仓库根目录 `VERSION` 为准，不要使用本 Prompt 文本中的示例版本号。

先说明本次标准闭环计划：同步预检 → dry-run → 同步提交 → `check-derived-sync` 边界验证 → `post-sync-cleanup` 整理计划 → `docs-system-audit` 同步后审计 → 项目验证建议 → `sync-records/template-sync/` 同步报告。每一步说明是否只读、是否会写文件；写入前等待确认。

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
11. 检查派生项目 workflow：
   - 普通 PR 不应运行 `scripts/check-template.sh` 或 `scripts/check-template.ps1`。
   - 若存在 `.github/workflows/template-check.yml`，说明它通常是模板仓自检入口，提示迁移为 `.github/workflows/project-check.yml`。
   - 派生项目版 workflow 应保留 `git diff --check`，并仅在提交信息匹配 `sync template vX.Y.Z from ai-project-template` 时运行 `scripts/check-derived-sync.sh HEAD`。
12. 如本次同步引入新的项目专属骨架项，不要直接覆盖 ai/project-rules.md；列出需要人工迁移的字段，例如 `§2.5 运行环境与资源约束`。
13. 如项目已同步到含 `scripts/collect-env.ps1` 的模板版本，但尚无 `docs/env/local-env.md`，提示运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1，并补齐人工确认项。
14. 检查本项目 `_proposals/`：
   - 如果其中提案已被模板仓库采纳，并且本次同步已拿到对应模板版本，将这些已处理提案移动到本项目 `_archive/proposals/` 归档。
   - 未处理、延后处理或不确定状态的提案继续保留在 `_proposals/`，不要误归档。
   - 如执行归档，补充或更新 `_archive/proposals/README.md`，说明归档规则与对应模板版本 / PR。
15. 如有归档改动，运行 git status 并确认只移动提案记录，不改业务文件。
16. 进入同步后整理闭环：
   - 触发或引导执行 `/run post-sync-cleanup`，先只读输出整理审计与迁移计划。
   - 实际移动、重命名、删除或修改项目事实文档前必须再次等待用户确认。
   - 将整理发现的问题、待确认项、迁移建议和可回流优化点记录到同步运行记录或 `.ai/session-handoff.md`。
17. 进入文档体系同步后审计：
   - 触发或引导执行 `/run docs-system-audit` 的同步后审计模式。
   - 对照最新 `ai/doc-standards/00-09`（旧项目 fallback：`docs/_scaffold/00-09`）检查项目 `docs/00-09`、`docs/design/`、`docs/env/`。
   - 区分规范基线缺口、兼容差异和项目事实问题；不要把旧文档机械重写成新规范。
   - 将回梳计划、待确认项和同步报告回写建议记录到同步运行记录或 `.ai/session-handoff.md`。
18. 输出项目验证建议：
   - 根据项目形态建议运行测试、lint、文档自检、脚本验证或人工验收。
   - 若无法运行或项目没有验证入口，记录为未验证项，不得写成已通过。
19. 生成或更新派生同步运行记录：
   - 读取 `template-docs/derived-sync-report-template.md`。
   - 推荐保存到 `sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`（长期记录，与项目文档分离，便于审计和回流扫描）；如果用户暂不想提交长期记录，先写入 `.ai/session-handoff.md`。
   - 记录同步前版本、目标版本、同步分支、dry-run / commit / check-derived-sync 命令、同步结果、是否新增 / 刷新 `ai/doc-standards/00-09`、是否残留旧 `docs/_scaffold/`、同步后整理摘要、文档体系审计摘要、项目验证建议、遇到的问题和后续动作。
20. 从运行记录归纳可优化点：
   - 区分项目专属问题、环境问题和模板方法论问题。
   - 对可通用于多个项目的问题，生成去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`；不得包含客户、账号、路径敏感信息或项目专属业务细节。
   - 若没有可回流问题，记录“本次无模板回流提案”。
21. 推送当前分支：git push -u origin chore/sync-template-vX.Y.Z。
22. 创建 PR：gh pr create --fill。
23. 最后汇总：同步到的模板版本、同步提交、采用的同步路径、同步边界检查结果、workflow 迁移建议、同步后整理状态、文档体系审计状态、项目验证建议、同步运行记录路径、是否需要人工迁移 project-rules、是否需要运行 collect-env、提案归档情况、是否生成回流提案和 PR 链接。

遇到以下情况必须停止并说明原因：
- 工作区不干净。
- 无法读取模板仓库 `VERSION`。
- dry-run 后出现 staged 改动。
- dry-run 显示会覆盖项目专属文件。
- sync-template 提示本地脚本不是最新版，且无法完成 bootstrap。
- 派生同步边界检查显示最新同步提交包含 README.md、ai/project-rules.md、docs/00-09 或业务代码。
- 无法判断 `_proposals/` 中某个提案是否已被模板采纳。
- 运行记录中包含敏感信息且无法去项目化。
- 脚本失败。
- GitHub 认证或权限失败。
```
