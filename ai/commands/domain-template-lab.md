# Command: domain-template-lab

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run domain-template-lab`
- 初始化领域模板实验线
- 创建领域模板试验线
- 创建派生领域模板
- 创建 agent-system-template
- 试跑领域模板同步
- 设计领域模板同步与回流机制

## 适用场景

需要在不污染 `母模板 → 直接派生项目` 主同步路径的前提下，启动或维护一条独立的领域模板试验线，例如 `母模板 → agent-system-template → agent 领域派生项目`。

本命令只处理领域模板实验线的规划、初始化和边界验证；普通派生项目同步母模板仍走 `/run sync-methodology`。

## 必读文件

- `ai/index.md`
- `template-docs/domain-templates.md`
- `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md`
- `ai/prompts/maintainers/23-domain-template-lab.md`
- `template-sync.json`（只用于确认母模板同步范围，不能直接作为领域模板下发清单）
- `git-guide.md` §5（只读参考普通两端同步边界，不修改主路径）

## 执行流程

1. 判断当前仓库角色：母模板、领域模板仓库、领域派生项目，或普通派生项目。
2. 若当前是普通派生项目，停止领域模板操作，提示应走 `/run sync-methodology`。
3. 若当前是母模板仓库，仅输出领域模板实验线计划、目标仓库 / 目录、预计生成文件、验证方式和风险；不得把领域 scaffold 写进母模板。
4. 若当前是领域模板仓库，按 Prompt 输出实验资产计划，例如 `TEMPLATE-BASE.md`、`domain-template-sync.json`、`scripts/sync-domain-template.*`、`scripts/check-domain-derived-sync.*`、`sync-records/domain-template-sync/` 和领域 scaffold。
5. 用户确认后再创建或修改实验资产；首次写入前列出全部预计文件和每个文件的变更摘要。
6. 验证时只检查领域模板实验线，不改 `git-guide.md` §5、不改母模板 `sync-template` 主流程、不让领域派生项目直接同步母模板。
7. 输出相邻层同步与两级回流矩阵，明确：母模板只与领域模板交互；领域派生项目只与领域模板交互；跨层回流必须经领域模板提炼。

## 写入风险

可能在领域模板仓库新增实验资产；在母模板仓库内默认只改方法论入口和提案状态。任何文件新增 / 修改 / 删除前必须等待用户确认。

## 续接要求

领域模板实验线是多步骤任务；开始后应按 `ai/session-rules.md` 记录当前仓库角色、目标领域模板、已确认边界、拟生成文件、验证结果和下一步。
