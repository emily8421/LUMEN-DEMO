# BEGINNER-GUIDE

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本手册面向第一次使用 `ai-project-template` 的人。它回答“先看什么、先做什么、常见错误是什么”；规则正文仍以 `ai/` 和 `docs/` 里的活文件为准。

## 1. 这份手册适合谁

- 第一次使用这套模板的新手。
- 会开发，但还不熟悉 AI 协作开发流程的人。
- 想先跑通一遍最小路径，再逐步理解完整体系的人。

## 2. 先建立正确预期

- 这不是“给 AI 一个想法，然后直接生成整个项目”的模板。
- 这是一套“准备输入材料 -> 生成或补齐文档体系 -> 按 Sprint 小步开发”的模板。
- AI 不能替代项目边界、需求来源和验收标准；这些要先由人提供或确认。

## 3. 第一次先看哪些文件

1. `README.md`：5 分钟最小路径和总导航。
2. `SOP.md`：不同场景该看哪个文档或 Prompt。
3. `ai/index.md`：当前任务前 AI 必须读取哪些规则文件。
4. `ai/project-rules.md`：你这个项目自己的阶段边界、技术栈和裁剪决策。

## 4. 10 分钟最小路径

```bash
bash scripts/new-project.sh my-demo --local --no-remote
cd my-demo
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

然后按顺序做：

1. 准备上游输入。优先放 `docs/vision/product-vision.md`，已有客户 PRD / SRS / brief 时可先放 `docs/inputs/`。
2. 补齐 `docs/env/local-env.md` 的人工确认项，明确本机是否能跑 Demo。
3. 初填 `ai/project-rules.md` 的 `§1`、`§2`、`§2.5`、`§3`，先把阶段边界和项目形态写清楚。
4. 用 `ai/prompts/docs/01-review-inputs.md` 先评审输入材料，确认入口模式和文档剖面。
5. 评审通过后，再用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成或补齐 `docs/00-09`。
6. 人工确认 `docs/03-prd.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md` 后，用 `ai/prompts/dev/02-run-task.md` 执行第一个 Sprint。

如果机器还没准备好开发环境，先看 `template-docs/env-setup.md`，并先运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

## 5. 开工前你需要准备什么

- 愿景文档、客户 PRD、SRS、任务说明、现有系统说明，至少要有一种明确输入。
- 本机环境和资源信息，尤其是 Python / Node / Docker / 数据库等是否可用。
- 必备基础工具：Git for Windows、Git Bash、PowerShell。
- 至少一种 AI CLI 工具：`Claude CLI` 或 `Codex CLI`。
- 当前阶段的允许项、禁止项、下一阶段预告。
- 技术栈倾向和禁区，不要让 AI 猜。
- 项目形态裁剪：是否需要 `docs/06`、`docs/07`、`frontend/`、`backend/`、`tests/`、`docker/`。

如果公司要求通过内部中转站访问模型，先看：

- `http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model`

这份内网手册更适合用来处理 LeMesh / CC-Switch / 公司中转站代理配置，不应直接当作 `Claude CLI` 或 `Codex CLI` 的官方安装文档。

推荐顺序：

1. 先按官方文档安装并登录 `Claude CLI` 或 `Codex CLI`。
2. 再按这份内网手册处理公司中转站、密钥和代理接入。
3. 具体代理、地址、鉴权或环境变量配置，以这份内网手册为准。

## 6. `docs/` 核心文档怎么理解

| 文件 | 作用 |
|---|---|
| `docs/00-scenario.md` | 工程想定、背景和典型场景 |
| `docs/01-user-requirements.md` | 用户需求全集与来源 |
| `docs/02-srs.md` | 系统需求规格和 REQ |
| `docs/03-prd.md` | 当前阶段功能范围和路线图 |
| `docs/04-architecture.md` | 总体模块、边界和运行拓扑 |
| `docs/05-tech-spec.md` | 技术选型、依赖、降级与资源策略 |
| `docs/06-db-design.md` | 数据模型与存储设计；无持久化可省略 |
| `docs/07-api-spec.md` | 接口或命令契约；无对外接口可省略 |
| `docs/08-dev-plan.md` | Sprint / task 拆分、验收标准和禁止事项 |
| `docs/09-verification.md` | 验证矩阵、验收与资源验证口径 |

## 7. `docs/` 子目录怎么理解

- `docs/vision/`：愿景、叙事、业务背景等输入。
- `docs/inputs/`：尚未归类的原始输入包。
- `docs/design/`：项目子系统详细设计，不是模板方法论文档。
- `docs/decisions/`：ADR 和关键取舍。
- `docs/research/`：调研、实验和可行性结论。
- `docs/env/`：本机环境、资源约束、服务器预案。
- `docs/meetings/`：会议纪要、访谈、评审记录。
- `docs/archive/`：已废弃但需要留痕的项目文档。

## 8. `ai/` 目录怎么理解

- `ai/index.md`：路由表，决定 AI 要先读哪些规则。
- `ai/global-rules.md`：跨项目通用规则。
- `ai/document-lifecycle-rules.md`：文档怎么生成、追溯、传播和裁剪。
- `ai/project-rules.md`：本项目自己的边界和禁区。

## 9. 第一次生成文档体系怎么做

- 输入材料不确定时，先评审，不要直接让 AI 生成一整套文档。
- 先判断入口模式：Vision-first、PRD-first、Task-first、Existing-system 等。
- 再判断文档剖面：Full、Standard、Lean、Existing-system。
- 生成后重点检查四件事：范围是否越界、`docs/06` / `docs/07` 是否裁剪正确、Demo 是否真能在本机跑、`docs/08` 是否已经拆成可执行 Sprint。

## 10. 第一次执行任务怎么做

- 一次只执行一个 Sprint 或一个 task。
- 执行前先读相关 `docs/03-09` 和 `ai/index.md` 指向的规则文件。
- 修改范围尽量限制在 1 到 3 个文件或模块。
- 完成后把验证结果记到 `docs/09-verification.md` 或当前 Sprint 的验收记录。

## 11. `README`、`SOP`、Prompt 的关系

- `README.md`：总入口，告诉你先看什么。
- `SOP.md`：按场景找流程入口。
- `INIT-PROMPT.md` 和 `ai/prompts/`：可复制给 AI 的操作模板。
- Prompt 不是需求本身；输入不足时，先补输入，不要让 AI 猜。

## 12. 常见错误

- 只有一句想法，没有上游输入材料，就直接让 AI 生成代码。
- 没填 `ai/project-rules.md`，就开始生成设计文档。
- 把愿景功能直接当当前阶段需求。
- 把模板自身文档和派生项目过程文档混在一起。
- 一次让 AI 改太多文件，最后无法验收。
- 没有验证记录，就认为任务已经完成。

## 13. 常见问题

- 什么时候省略 `docs/06` 和 `docs/07`：看 `ai/project-rules.md` §3 和 `docs/README.md` 的裁剪决策表。
- 什么时候需要 `tasks/`：当 `docs/08-dev-plan.md` 里的某个 Sprint 已经复杂到需要拆成多个独立任务。
- 什么时候需要 `docs/design/`：当某个子系统已经非平凡，光靠 `docs/04` / `docs/05` 不够表达内部逻辑。
- 什么时候需要服务器预案：当本机资源不能支撑当前阶段 Demo / MVP，且不能通过降级或 Mock 解决时。
- 切换 AI 工具怎么办：规则不变，先记录当前进度，再让新工具从 `ai/index.md` 和当前 Sprint 继续。

## 14. 推荐阅读路径

- 第一次使用模板：`README.md` -> 本手册 -> `SOP.md`。
- 第一次准备开发环境：`template-docs/env-setup.md` -> `scripts/check-prereqs.ps1` -> `scripts/bootstrap-dev-env.ps1`。
- 想验证一遍新手链路：`template-docs/smoke-test.md`。
- 想记录一遍烟测结果：`template-docs/smoke-test-report-template.md`。
- 想单独安装 `Claude CLI` / `Codex CLI`：`template-docs/ai-cli-setup.md`。
- 准备生成文档体系：`ai/project-rules.md` -> `docs/README.md` -> `ai/prompts/docs/01-review-inputs.md`。
- 准备执行第一个 Sprint：`docs/08-dev-plan.md` -> `ai/prompts/dev/02-run-task.md`。
- 想理解模板为什么这么设计：`template-docs/template-methodology.md`。
