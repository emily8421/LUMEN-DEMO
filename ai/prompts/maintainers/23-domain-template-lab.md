# Prompt: Domain Template Lab（领域模板独立实验线）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 目的

在不污染 `母模板 → 直接派生项目` 主同步路径的前提下，让 AI 能自动识别、规划并执行“领域模板独立实验线”。该实验线服务于 `母模板 → 派生领域模板 → 领域派生项目`，但母模板只提供启动器和边界，不直接操作领域派生项目。

## 触发语

- `/run domain-template-lab`
- 初始化领域模板实验线
- 创建领域模板试验线
- 创建派生领域模板
- 创建 agent-system-template
- 试跑领域模板同步
- 设计领域模板同步与回流机制

## 必读输入

1. `ai/index.md` 及其列出的全部规则文件。
2. `ai/commands/domain-template-lab.md`。
3. `template-docs/domain-templates.md`。
4. `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md`。
5. 当前仓库的 `git status --short --branch`、`VERSION`、`template-sync.json`（若存在）。
6. 若当前仓库已是领域模板：读取 `TEMPLATE-BASE.md`、`domain-template-sync.json`、`scripts/sync-domain-template.*`、`scripts/check-domain-derived-sync.*`（若存在）。

## 核心原则

- **只相邻同步，不跨层操作**：母模板只与直接派生项目 / 派生领域模板交互；领域派生项目只与派生领域模板交互。
- **跨层回流必须经中间层提炼**：领域派生项目的反馈先回流领域模板，只有跨领域通用结论才由领域模板回流母模板。
- **独立实验线**：不修改 `git-guide.md` §5 主同步 SOP，不修改母模板 `sync-template` 语义，不让普通派生项目承担领域模板复杂度。
- **母模板不承载领域 scaffold**：agent / OCR / IoT 等领域标准件先在独立领域模板仓库试验。
- **先计划后写入**：生成任何实验资产前，必须列出目标路径、每个文件的变更摘要、风险和验证方式，并等待用户确认。

## 仓库角色判定

| 角色 | 判定线索 | 默认动作 |
|---|---|---|
| 母模板 | 仓库为 `ai-project-template`，存在 `_proposals/README.md`、`template-sync.json`、`scripts/check-template.sh` | 只输出实验线计划或维护入口；不写领域 scaffold |
| 派生领域模板 | 存在 `TEMPLATE-BASE.md` 或用户明确声明这是领域模板仓库 | 可规划 / 创建 / 更新领域实验资产 |
| 领域派生项目 | 用户说明从某领域模板派生，或存在领域模板同步记录 | 不直接同步母模板；建议回到领域模板入口 |
| 普通派生项目 | 常规业务项目，只需要母模板通用方法论 | 走 `/run sync-methodology`，不启动本命令 |

无法判断时先停下提问，不要猜测并写文件。

## 领域模板实验资产候选

以下资产只在**领域模板仓库**内创建；母模板仓库只提供本 Prompt 和命令入口。

| 文件 / 目录 | 用途 | 状态 |
|---|---|---|
| `TEMPLATE-BASE.md` | 记录母模板来源、base version、继承范围和叠加领域标准件 | 实验线建议资产 |
| `domain-template-sync.json` | 领域模板下发给领域派生项目的同步清单，避免和母模板 `template-sync.json` 混淆 | 实验线建议资产 |
| `scripts/sync-domain-template.ps1` / `.sh` | 领域模板 → 领域派生项目的 dry-run / commit 同步入口 | 实验线建议资产 |
| `scripts/check-domain-derived-sync.ps1` / `.sh` | 检查领域派生项目同步边界，避免覆盖业务事实 | 实验线建议资产 |
| `sync-records/domain-template-sync/` | 领域同步运行记录 | 实验线建议资产 |
| `template-docs/<domain>/` | 领域 scaffold / checklist / 示例骨架 | 按领域试点生成 |
| `domain-proposals/` 或 `_proposals/` | 领域共性反馈收件箱 | 按仓库约定选择 |

## 执行流程

1. **恢复上下文**：读取规则、当前仓库 Git 状态、版本和已有实验资产。
2. **判定角色**：输出仓库角色与依据；若不是母模板或领域模板，说明应路由到哪个命令。
3. **确认边界**：复述“只相邻同步，不跨层操作；跨层回流经中间层提炼”。
4. **输出计划**：列出目标领域、目标仓库 / 目录、预计新增 / 修改文件、验证方式和不做事项。
5. **等待确认**：未经用户确认，不创建文件、不复制脚本、不提交。
6. **创建实验资产**：在领域模板仓库内生成最小资产；脚本可参考母模板同步脚本的思想，但必须使用领域清单名和领域提示语。
7. **验证**：至少运行结构检查、同步清单解析检查、dry-run（如脚本已生成），并确认不会覆盖领域派生项目的业务事实。
8. **记录结果**：更新领域模板的同步记录或续接文件；如暴露跨领域通用问题，再通过 `submit-proposal` 回流母模板。

## 输出格式

1. 仓库角色判断与依据。
2. 相邻层边界矩阵。
3. 实验资产计划（文件、用途、写入风险）。
4. 验证计划。
5. 待确认项（含 AI 建议、依据、备选方案、取舍影响）。
6. 若用户确认执行：实际改动、验证结果、下一步。

## 禁止项

- 不得把领域 scaffold 写进母模板默认同步范围。
- 不得修改 `git-guide.md` §5 的普通派生项目同步主路径。
- 不得让领域派生项目同时直接同步母模板和领域模板。
- 不得把领域派生项目业务事实回写母模板。
- 不得把实验资产写成已正式成熟机制；未验证前使用“实验 / 候选 / 待确认”。
