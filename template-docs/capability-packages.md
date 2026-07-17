# Capability Packages 与 Profile 契约索引

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文是模板维护者与高级使用者的人读索引，用于描述可选能力包 / Profile 的契约边界。它不是 AI 每次任务的默认必读规则包，不替代 `ai/index.md`、`ai/rules-core.md`、`ai/session-rules.md`、`docs/00-09`、`tasks/*` 或 Git / PR 事实。

## 1. 定位

Capability Package / Profile 是一组围绕特定场景的轻量契约，目标是降低模板继续变重后的全局联动成本。它只说明：什么时候适用、需要读什么、输入输出是什么、谁消费它、如何验证、有哪些禁止项。

它不是新的强制层级，也不要求所有项目默认启用。只有当任务命中对应场景时，AI 才按 `ai/index.md` 的任务路由读取相关规则、SOP、Profile 或本索引。

## 2. 能力包契约模板

```markdown
# Capability / Profile Contract: <name>

## 1. 适用场景
- 触发条件：
- 不适用场景：
- 相关 scenario / command：

## 2. 必读文件
- 核心规则：
- Profile 规则：
- 权威模板 / SOP：
- 可选参考：

## 3. 输入契约
- 上游事实来源：
- 必填字段 / 前置状态：
- 禁止从哪里推断：

## 4. 输出契约
- 必须产出：
- 可选产出：
- 不得写入：

## 5. 消费者
- 下游文档：
- 代码 / 测试：
- SOP / 命令：
- 同步 / 自检：

## 6. 验证方式
- 自动检查：
- 人工验收：
- 失败 / pending 处理：

## 7. 自检断言
- 必须存在的入口：
- 必须存在的关键词：
- 必须禁止的漂移：

## 8. 禁止项
- 不得新增未授权需求：
- 不得替代的权威事实：
- 不得默认启用的高风险行为：
```

## 3. 影响域表

| 层级 | 主要职责 | 输入 | 输出 | 消费者 | 典型文件 |
|---|---|---|---|---|---|
| Core | AI 行为硬约束、路由、写入确认、handoff、Checkpoint Mode | 用户任务、Git 事实、规则入口 | 规则包选择、确认边界、恢复策略 | 所有任务 | `ai/index.md`、`ai/rules-core.md`、`ai/session-rules.md`、`ai/project-rules.md` |
| Docs | 需求到文档体系、追溯链、变更传播、裁剪 | 输入材料、愿景、PRD / SRS / task | `docs/00-09`、`docs/design/*` | Implementation、Verification、README | `ai/document-lifecycle-rules.md`、`ai/doc-standards/*` |
| Implementation | Phase / Sprint / Task、实现边界、完成包 | `03-09`、`tasks/*`、设计文档 | 代码改动、验证摘要、完成记录 | Verification、Git / PR | `ai/implementation-lifecycle-rules.md`、`ai/commands/run-dev-task.md` |
| Verification | TC、smoke、回归、资源验证、验收记录 | REQ、实现事实、环境事实 | `docs/09`、测试证据、验收结论 | Phase 升级、PR、维护者 | `docs/09-verification.md`、`template-docs/*report*` |
| Profiles | 可选能力剖面，如 Web App、UI Prototype、Remote / CI SOP、Domain Template | Core + Docs / Implementation 的子集 | Profile Gate、契约、局部 SOP、最小验证 | Commands、Docs、Implementation、自检 | `template-docs/web-fullstack-profile.md`、`git-guide.md`、`SOP.md` |
| Governance | 版本、同步、提案、发布、自检 | 变更 diff、提案、PR / issue 事实 | VERSION、CHANGELOG、sync list、归档记录 | 模板维护者、派生同步 | `MAINTAINERS.md`、`CONTRIBUTING.md`、`template-sync.json`、`scripts/check-template.*` |

## 4. Remote / CI SOP Profile（试点）

### 4.1 适用场景

- `git push`、创建 / 合并 PR、关闭 issue、删除远端分支、tag / release。
- 查询 GitHub Actions / CI、处理 pending / failed checks。
- GitHub CLI 认证、权限、askpass、sandbox、network restricted、DNS / registry 失败等远端上下文问题。
- 模板维护、派生同步、PR / CI 收尾等高风险操作链路。

不适用于单纯本地编辑、只读文档评估或无需远端状态的普通编码任务。

### 4.2 必读文件

- 核心规则：`ai/rules-core.md`、`ai/session-rules.md` §3.3。
- 权威 SOP：`git-guide.md` §1.1 / §1.2、`SOP.md` A10/C4。
- 命令入口：`ai/commands/README.md`。
- 脚本入口：`scripts/check-github-context.ps1`。

### 4.3 输入契约

- 当前 repo root、branch、origin URL / slug。
- `git status --short --branch` 结果。
- Git identity：`user.name` / `user.email`。
- `gh auth status`、`gh repo view`、viewer permission。
- 用户确认的目标远端动作和风险接受口径。

不得从 CLI 私有历史、记忆、未复核 handoff 或未落盘的远端正文推断远端状态。

### 4.4 输出契约

- 只读预检摘要：仓库、分支、remote、账号、权限、工作区状态。
- 远端动作确认点：命令、目标仓库 / 分支 / issue / PR、风险、是否删除分支或改变状态。
- CI 摘要：一次查询或短轮询结果，pending 即汇报 pending，不长时间等待。
- 失败分类：auth、permission、sandbox、network、timeout、CI failed、unknown。
- 下一步建议：重试、用户本机登录、宿主机预检、停止等待或进入修复任务。

### 4.5 验证方式

- 本地提交前：`git diff --check`，按任务需要运行项目验证。
- 远端前：`powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1`。
- PR 后：`gh pr checks <number>` 一次或短轮询；成功汇报摘要，pending 不长等。
- 模板完整性：若改动影响模板规则 / 同步 / 自检，运行 `scripts/check-template.*`。

### 4.6 自检断言

- `ai/session-rules.md` 定义 Checkpoint Mode 与风险分级确认。
- `git-guide.md` 保留远端 / CI / sandbox 防卡死策略。
- `SOP.md` 保留 GitHub 远端操作前预检与防卡死入口。
- `template-docs/capability-packages.md` 保留 Remote / CI SOP Profile 契约。

### 4.7 禁止项

- 未确认时不得 push、merge、close issue、delete branch 或发布 release。
- 不得绕过 sandbox / auth / permission 边界继续远端操作。
- 不得无限等待 CI 或在 pending 时声称已通过。
- 不得把本地镜像或 handoff 当作 GitHub issue / PR 的权威状态。

## 5. 后续候选 Profile

### 5.1 Web App Profile

候选来源：`template-docs/web-fullstack-profile.md`、`template-docs/web-app-scaffold-experiment.md`。

建议后续单独评估：App Shell、Walking Skeleton Gate、API client ↔ API-ID、browser / API smoke、scaffold experiment 与 `docs/04-09` 的消费关系。

### 5.2 Domain Template Profile

候选来源：`template-docs/domain-templates.md`。

建议后续单独评估：母模板 → 领域模板 → 具体项目的继承边界、同步策略、领域 scaffold 禁止污染母模板的断言。

### 5.3 UI Prototype Profile

候选来源：UI brief、UI prototype exploration、frontend interaction、UI prototype strategy 相关模板和 Prompt。

建议后续单独评估：需求探索原型、视觉效果探索、实现前原型、`08/09` 回填和验收证据的边界。

## 6. 目录级重组与多 agent 边界

当前不建议执行目录级重组或默认启用真正多 agent 并发。

目录级重组的前置条件：至少完成 1–2 个 Profile 契约试点，证明契约索引不足以降低维护成本，并明确同步清单、入口兼容和自检迁移方案。

多 agent 的短期建议是角色化流程，而不是并发乱跑：

- `Router / Coordinator`：判断任务类型、规则读取、风险分级确认。
- `Editor`：只改已授权影响域内文件。
- `Verifier`：只跑验证、读日志、汇总失败。
- `Maintainer`：处理版本、同步清单、PR / issue 收口。

真正并发时必须使用独立 `git worktree`，共享状态只依赖 Git、handoff、task 文件、验证记录和 PR / issue 事实。

## 7. 维护规则

- 本索引是人读治理文档，不是所有 AI 任务默认必读文件。
- 新增 Profile 时，优先补契约表，再决定是否需要修改规则入口、命令、同步清单或自检。
- 若新增同步范围内文件，必须更新 `template-sync.json`、`scripts/sync-template.sh` fallback 和 `scripts/check-template.*` 断言。
- 若只新增 `_proposals/` 分析，不触发版本递增；若新增本文件或同步范围文档并改变下游可见能力，按 patch 版本处理。
