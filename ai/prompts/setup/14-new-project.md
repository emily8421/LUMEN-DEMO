# 14 从模板新建派生项目

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：从 `ai-project-template` 创建一个新的派生项目，并完成最小初始化入口。

**目的**：避免手工复制模板目录导致版本、Git 历史、远端仓库和提案目录不一致；统一使用 `scripts/new-project.sh` 从模板 GitHub `main` 派生。

**适用场景**：准备创建一个全新项目，而不是同步已有派生项目。

**不适用场景**：已有派生项目需要更新模板方法论；这种情况用 `ai/prompts/maintainers/12-sync-template.md`。

**使用前准备**：确认当前在 `ai-project-template` 模板仓库，或能访问模板仓库中的 `scripts/new-project.sh`；确认新项目名称；若要创建远端仓库，再确认 GitHub 账号和仓库可见性。

**预期产出**：新项目目录、新项目 Git 首提交、可选 GitHub 远端仓库、环境采集文档入口和后续初始化待办。

**使用后下一步**：进入新项目，若机器尚未准备好基础开发环境，先看 `template-docs/env-setup.md` 并运行 `scripts/check-prereqs.ps1`；然后准备 `docs/vision/` 或 `docs/inputs/` 上游输入，补 `docs/env/local-env.md` 人工确认项，再用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料并用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 补齐 docs 文档体系。

> 事实来源：新建项目操作 SOP 以 `git-guide.md` §2 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

```text
请按标准 SOP 帮我从 ai-project-template 新建一个派生项目。

项目名称：<填写项目名>
GitHub 账号：<如需远端仓库再填写；也可让脚本读取当前 gh 登录账号>
仓库可见性：private（如需 public 请说明）
是否创建远端仓库：是（如只需本地烟测请说明 --no-remote）

执行要求：
1. 先确认当前是否在 ai-project-template 模板仓库，或能访问模板仓库的 scripts/new-project.sh。
2. 运行 git status --short --branch；若模板仓库工作区不干净，停止并说明，不要用未确认的本地改动创建正式项目。
3. 正式新项目优先从 GitHub main 派生，不使用 --local；除非用户明确要求本地烟测。
4. 按用户填写的项目名称、账号和可见性执行：
   - 默认远端：bash scripts/new-project.sh <项目名>
   - 指定账号 / 可见性：bash scripts/new-project.sh <项目名> --account <账号> --visibility <private|public>
   - 本地烟测：bash scripts/new-project.sh <项目名> --local --no-remote
5. 创建完成后进入新项目目录。
6. 如机器基础开发环境未准备好，先提醒查看 `template-docs/env-setup.md`，并运行：powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
7. 运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
8. 检查 docs/env/local-env.md 是否生成，并提醒人工补齐确认项。
9. 输出下一步待办：
   - 准备 `docs/vision/` 或 `docs/inputs/` 上游输入材料
   - 填写 ai/project-rules.md 的 Phase 边界、技术栈、运行环境与资源约束、项目形态裁剪
   - 先用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料，再用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 补齐 docs 文档体系
   - 人工审核 03-09 后再进入 Sprint1

禁止事项：
- 不要先手工复制模板文件夹再运行 new-project.sh。
- 不要直接 clone 模板仓库后手动改名当作新项目。
- 不要在模板仓库工作区有未提交改动时创建正式项目；如确需使用本地改动，只能明确作为 --local 烟测。

遇到以下情况必须停止并说明原因：
- 项目名为空或目标目录已存在。
- GitHub 账号、权限或 gh 认证不可用，且用户要求创建远端仓库。
- 无法访问模板仓库 GitHub main，且用户未明确允许 --local。
- collect-env.ps1 执行失败或 docs/env/local-env.md 未生成。
```
