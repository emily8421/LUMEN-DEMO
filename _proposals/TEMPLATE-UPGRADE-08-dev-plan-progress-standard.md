# TEMPLATE-UPGRADE: 细化 08 开发计划、任务拆分与进度留痕规范

> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流
> 依据：`docs/research/2026-07-06-template-proposal-audit-batch-4-08-09-dev-verification.md` Batch 4 审计报告
> 关联提案：`_proposals/TEMPLATE-UPGRADE-09-verification-standard-detail.md`

## 1. 背景与问题

派生项目对 `docs/08-dev-plan.md`、`tasks/*`、`docs/09-verification.md` 与 `ai/doc-standards/08-dev-plan.md`、`ai/doc-standards/09-verification.md` 做 Batch 4 只读审计时发现：当前模板已经要求每个 Sprint 写目标、输入文档、修改范围、验收标准和禁止事项，但对“如何从 Phase 规划到可执行 Task、如何记录验证包、如何形成 Sprint 完成包、如何回写正式进度”的约束仍不足。

典型问题包括：

1. `08` 有 Sprint 详情，但缺少当前 Phase 目标、退出标准和禁止越界的集中声明。
2. `08` 缺少 Sprint 总览表，无法快速查看每个 Sprint 的 REQ、修改范围、验证包、状态和依赖。
3. Sprint 输入文档常只列文件名，未精确到 REQ、设计章节、API-ID、表名、TC-ID。
4. Sprint 修改范围常写模块名，缺少“是否超过 3 个文件 / 模块、是否应拆 task、是否需要 worktree”的判断。
5. Sprint 验收标准常是自然语言，未强制连接 `docs/09-verification.md` TC-ID、测试等级、验证命令、人工步骤和资源验证。
6. `tasks/*` 任务单模板缺少 Task-ID、所属 Sprint、关联 REQ / TC、任务状态、验证命令、完成记录和残留风险。
7. 降级 / Mock 任务没有统一字段说明“为什么降级、是否等价真实能力、何时补齐真实能力”。
8. Sprint 完成事实容易散落在 Git、PR、续接文件和聊天中，正式 `08` / `09` 不易审计。

这些问题不依赖具体业务项目。凡是采用文档驱动开发并按 Sprint / Task 小步实现的派生项目，都需要更细的 `08` 与 `tasks/*` 模板规范。

## 2. 目标

细化 `08-dev-plan` 与 `tasks/*` 规范，使模板能稳定支撑以下链路：

```text
03 Phase / REQ / 退出标准
  → 04-07 设计 / 技术 / DB / API 契约
  → 09 TC / 验证计划
  → 08 Sprint 总览 / Sprint 详情 / Task 拆分
  → code / tests / Git commit / PR
  → 09 验收记录 / Sprint 完成包 / 残留风险
```

目标能力：

1. 当前 Phase 的功能范围、交付物形态、退出标准和禁止事项在 `08` 一眼可见。
2. 每个 Sprint 能追溯到 REQ、设计章节、API-ID / 表名、TC-ID 和验证方式。
3. 复杂 Sprint 能按规则拆成 `tasks/task-*.md`，并记录拆分原因和任务状态。
4. 每个 Sprint 有验证包，明确测试等级、命令 / 人工步骤、资源验证和不适用原因。
5. 每个 Sprint 完成时形成完成包，包含改动文件、验证结果、验收记录、残留风险和下一步。
6. Mock / 降级任务能明确“不等价真实能力完成”的边界。
7. 续接文件只记录临时状态，正式验收和进度应回填到 08 / 09 或说明暂不落盘原因。

## 3. 拟修改范围

| 文件 | 建议 |
|---|---|
| `ai/doc-standards/08-dev-plan.md` | 强化 Phase 目标、Sprint 总览、Sprint 验证包、完成包、依赖关系、任务拆分规则、当前进度记录 |
| `tasks/README.md` 或任务模板来源 | 强化 Task 元信息、关联 REQ / TC、状态、降级边界、验证命令、完成记录 |
| `ai/implementation-lifecycle-rules.md` | 可选：补充 Sprint 验证包、完成包、正式进度回写和续接文件边界 |
| `ai/prompts/dev/02-run-task.md` | 执行任务前要求引用 Sprint / Task / REQ / TC / 验证包和拆分规则 |
| `ai/prompts/dev/09-sprint-summary.md` | Sprint 总结时要求输出完成包，并回填 09 或说明暂不落盘原因 |
| `ai/prompts/docs/00-generate-or-complete-docs.md` | 生成 08 时输出 Sprint 总览、依赖关系、验证包和完成包骨架 |
| `ai/prompts/docs/04-edit-single-doc.md` | 修订 08 时提示同步 09 TC、tasks、续接记录和验收状态 |
| `ai/prompts/review/10-docs-checklist.md` | 编码前检查时确认 Sprint 验证包和技术环境门禁 |

## 4. 建议的 08 文档规范

### 4.1 结构建议

```markdown
# 08 开发计划（Development Plan）

## 0. 文档元信息
## 1. 当前 Phase 目标
## 1.1 Phase / Sprint / Task 定义
## 2. Sprint 总览
## 3. Sprint 详情
## 4. 依赖关系与里程碑
## 5. 任务拆分规则
## 6. 当前进度记录
## 7. 待人工确认项
```

### 4.2 当前 Phase 目标

建议模板要求：

| 项 | 内容 | 权威源 |
|---|---|---|
| 当前 Phase |  | `docs/03-prd.md` / `ai/project-rules.md` |
| 功能范围 | `[P1] / [P2] / [愿景]` | `docs/03-prd.md` |
| 交付物形态 | Demo / MVP / 产品 | `docs/03-prd.md` |
| 退出标准 |  | `docs/03-prd.md` / `docs/09-verification.md` |
| 禁止越界 |  | `ai/project-rules.md` |

要求：不得把 Demo 阶段写成 MVP / 产品，不得把后续 Phase 功能排入当前 Sprint。

### 4.3 Phase / Sprint / Task 定义

建议模板保留层级定义：

| 层级 | 定义 | 本文要求 | 输出位置 |
|---|---|---|---|
| Phase | 有明确功能范围、交付物形态和退出标准的阶段 | 对齐 03 和 project-rules | `docs/03-prd.md` / `docs/08-dev-plan.md` |
| Sprint | Phase 内一个可验收增量 | 对应小功能、验证闭环或紧密相关改动 | `docs/08-dev-plan.md` |
| Task | Sprint 复杂时拆出的独立执行单元 | 关联 Sprint / REQ / TC | `tasks/task-*.md` |
| 完成包 | 判断 Sprint / Task 是否完成的证据集合 | 改动、验证、验收、风险、下一步 | `docs/09` / PR / summary |

### 4.4 Sprint 总览

建议表格：

| Sprint-ID | Sprint | 目标 | 覆盖 REQ / NFR | 输入设计 / 契约 | 修改范围 | 验证包 | 状态 | 任务单 |
|---|---|---|---|---|---|---|---|---|

状态建议：`待开始`、`进行中`、`已实现待验收`、`已完成`、`条件完成`、`阻塞`、`拆分为 tasks`、`后续阶段`。

### 4.5 Sprint 详情模板

每个 Sprint 建议包含：

```markdown
## Sprint-X：<名称>

### 目标
- 覆盖 REQ / NFR：
- 所属 Phase / 交付物形态：
- 本 Sprint 不做：

### 输入文档
- `docs/02-srs.md`：REQ-...
- `docs/04-architecture.md`：COMP / MOD / Flow...
- `docs/06-db-design.md`：表 / 字段 / 约束...
- `docs/07-api-spec.md`：API-ID...
- `docs/09-verification.md`：TC-...

### 修改范围
- 预计文件 / 模块：
- 是否超过 3 个文件 / 模块：是 / 否
- 是否需要拆 task：是 / 否（理由：）

### 验证包
- 测试等级：单元 / 集成 / E2E / 验收 / 回归 / 资源
- 关联 TC-ID：
- 自动化命令：
- 人工步骤：
- 不适用项及原因：

### 验收标准
- 与 TC-ID 对齐的通过标准：

### 禁止事项
- 不允许改动：
- 不允许引入：
- 不允许实现的后续阶段能力：

### Sprint 完成包
- 改动文件：
- 验证命令 / 人工步骤：
- 结果：通过 / 条件通过 / 未通过
- `docs/09-verification.md` 验收记录：已回填 / 待回填 / 暂不落盘（原因）
- 残留风险 / 未验证项：
- 下一步：
```

### 4.6 依赖关系与里程碑

| 项 | 前置依赖 | 阻塞风险 | 是否可并行 | 处理方式 | 里程碑 |
|---|---|---|---|---|---|

建议说明多 AI / 多 worktree 并行策略：若多人或多 AI 并行，应拆 task 或使用独立 worktree。

### 4.7 任务拆分规则

建议保留并强化决策树：

1. 修改范围是否超过 3 个文件 / 模块？是则拆 task。
2. 验收标准是否无法一次完成？是则拆 task。
3. 是否涉及多个不相干功能？是则拆 task。
4. 是否需要跨测试等级逐步验证？是则拆 task。
5. 是否多人 / 多 AI 并行？是则拆 task 或独立 worktree。
6. 是否存在未确认需求、技术环境 No-Go 或 Phase 边界不清？是则停止，不得开工。

### 4.8 当前进度记录

| 日期 | Sprint / Task | 进度 | 验证结果 | 关联提交 / PR | 下一步 | 是否已回填 09 |
|---|---|---|---|---|---|---|

要求：

- `.ai/session-handoff.md` 是临时续接，不替代正式进度记录。
- 若用户暂不允许更新 08 / 09，应在续接文件记录“未落盘原因”。

## 5. 建议的 Task 模板规范

### 5.1 结构建议

```markdown
# task-00X-<slug>

## 0. 任务元信息
## 1. 目标
## 2. 输入文档
## 3. 修改范围
## 4. 验证包
## 5. 验收标准
## 6. 禁止事项
## 7. 降级 / Mock 边界（如适用）
## 8. 完成记录
## 9. 待人工确认项
```

### 5.2 任务元信息

| 项 | 内容 |
|---|---|
| Task-ID | TASK-00X |
| 所属 Sprint | Sprint-X |
| 关联 REQ / NFR | REQ-... |
| 关联 TC | TC-... |
| 当前状态 | 待开始 / 进行中 / 已完成 / 条件完成 / 阻塞 |
| 分支 / worktree | 如适用 |

### 5.3 降级 / Mock 边界

涉及降级时建议必填：

| 项 | 内容 |
|---|---|
| 降级原因 | 环境 / 资源 / 外部服务 / 时间 / 技术风险 |
| 当前实现 |  |
| 不等价真实能力 |  |
| 用户可见提示 |  |
| 后续补齐时点 |  |
| 对 09 验收影响 | 条件通过 / 不通过 / 后续补验 |

### 5.4 完成记录

| 项 | 内容 |
|---|---|
| 改动文件 |  |
| 验证命令 / 人工步骤 |  |
| 验证结果 |  |
| 关联提交 / PR |  |
| 09 验收记录 |  |
| 残留风险 |  |

## 6. 08 与 09 的分工建议

| 内容 | 写入 08 | 写入 09 |
|---|---|---|
| Sprint 顺序和任务拆分 | 是 | 否 |
| 修改范围和禁止事项 | 是 | 否 |
| TC-ID、用例详情、通过标准 | 引用 | 是 |
| 验证命令 / 人工步骤 | Sprint 验证包中引用 | 用例详情 / 验收记录中承载 |
| Sprint 完成摘要 | 是，可简写 | 是，记录验收证据 |
| 未验证项 / 风险 | 引用或摘要 | 是，作为风险项 / 未验证项 |

## 7. Prompt 增强建议

### 7.1 `generate-docs`

生成 08 时应要求：

- 输出 Phase 目标和退出标准。
- 输出 Sprint 总览表。
- 每个 Sprint 包含验证包和完成包骨架。
- 若 Sprint 复杂，建议生成 tasks 文件或至少标记“需拆 task”。

### 7.2 `run-dev-task`

执行任务前应检查：

- 是否有 Sprint / Task。
- 是否有关联 REQ、设计章节、API-ID / 表名、TC-ID。
- 是否已有技术环境评估或跳过记录。
- 是否需要拆 task 或 worktree。
- 是否明确 Mock / 降级边界。

### 7.3 `sprint-summary`

Sprint 总结应输出完成包：

- 改动文件。
- 关联 REQ / Task / TC。
- 验证命令与结果。
- 09 验收记录是否已回填。
- 残留风险和未验证项。
- 建议提交信息。

### 7.4 `docs-checklist`

编码前检查应拦截：

- 无 Sprint / Task。
- 无 TC-ID 或验证包。
- 修改范围超过 3 个模块但未拆 task。
- 真实依赖未完成技术环境评估且无跳过记录。
- Mock / 降级边界不清。

## 8. 兼容与迁移建议

对已存在派生项目，不建议强制重写 08。建议渐进迁移：

1. 先补 Sprint 总览表。
2. 为当前 Sprint 补验证包和完成包字段。
3. 将已拆出的 `tasks/*` 回填到 Sprint 总览任务单列。
4. 对降级任务补“降级 / Mock 边界”。
5. Sprint 完成后补 09 验收记录或在续接文件说明暂不落盘原因。
6. 历史 Sprint 可标“历史完成，证据见 Git / PR / 续接记录”，不得伪造未执行过的验证证据。

## 9. 验收标准

本提案落地后，模板应满足：

1. 新项目生成 08 时默认包含 Phase 目标、Sprint 总览、依赖关系、任务拆分规则、当前进度记录。
2. 每个 Sprint 默认包含验证包和完成包字段。
3. 复杂 Sprint 能按规则拆成 `tasks/task-*.md`，任务单包含 Task 元信息、验证包、完成记录和降级边界。
4. `run-dev-task` 能引用 Sprint / Task / REQ / TC / 验证包，不再只凭自然语言任务开工。
5. `sprint-summary` 能推动验收结果回填 09 或记录暂不落盘原因。
6. Mock / 降级任务不会被模板引导写成真实能力已完成。
7. 旧项目可按最小迁移步骤补齐当前 Sprint，不需要重写全部开发计划。

## 10. 版本影响

建议版本：模板方法论 minor 版本升级。

影响面：

- 对新项目：08 会更可执行、可验证、可续接。
- 对旧项目：同步后不会自动修改项目事实文档；可通过 `edit-single-doc` 按当前 Sprint 逐步迁移。
- 对 Prompt：`run-dev-task`、`sprint-summary`、`docs-checklist` 检查项增加。
- 对脚本：原则上无需脚本变更。

## 11. 非目标

- 不要求所有 Sprint 都必须拆成 `tasks/*`。
- 不要求所有历史 Sprint 补齐完整验收截图或日志。
- 不替代 09 的 TC 详情和验收记录规范；09 细化见关联 P-05。
- 不替代 Git commit / PR 记录；08 / 09 只记录与任务验收相关的摘要和证据路径。
- 不把派生项目的具体 Sprint 名、文件路径或业务功能写入模板默认事实。

## 12. 待模板维护者确认

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 | 是否将 Sprint 验证包设为 08 必填字段 | 建议必填 | Sprint 完成必须追溯到 TC 和验证证据 | 复杂 Sprint 才必填 | 简单 Sprint 也可能出现验收断链 |
| C-002 | 是否将 Sprint 完成包设为 08 必填字段 | 建议必填，完成前可为空 | 可避免完成事实散落在聊天 / 续接文件 | 仅由 sprint-summary 输出 | 不落入文档时跨会话难审计 |
| C-003 | 是否要求降级任务填写降级边界表 | 建议必填 | 防止 Demo 降级被误认为真实能力完成 | 放到 09 风险项即可 | 任务执行时仍可能误判范围 |
| C-004 | 是否在任务单中强制 Task-ID | 建议强制 | 便于 task → Sprint → REQ → TC → commit 追溯 | 用文件名替代 | 文件名可读但不便表格追溯 |
