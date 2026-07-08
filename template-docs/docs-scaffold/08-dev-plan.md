# 08 开发计划（Development Plan）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


> **文档定位**：把已确认的 Phase 范围拆成可执行 Sprint / 任务。本文回答“先做哪个小任务、改哪些文件、怎样验收”。
>
> **上游输入**：`docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/06-db-design.md`（如有）、`docs/07-api-spec.md`（如有）、`docs/09-verification.md`、`ai/project-rules.md`。
>
> **下游输出**：为 `tasks/*`、代码实现、测试和 Sprint 验收提供边界。一个 Sprint 不应实现整个系统。

## 0. 文档元信息

【撰写提要：记录本文输入来源、覆盖范围、当前状态和最后更新时间；不得把模板占位内容当作项目事实。】
| 项 | 内容 |
|---|---|
| 当前 Phase | Phase1 |
| 交付物形态 | Demo / MVP / 产品 |
| 输入基线 | 03-09 文档版本 / 日期 |
| 当前状态 | 草稿 / 待人工确认 / 已确认 |
| 最后更新 | YYYY-MM-DD |

## 1. 当前 Phase 目标

【撰写提要：概述当前 Phase 要交付的功能范围和验收目标；必须与 `docs/03-prd.md` §3 和 `ai/project-rules.md` §1 一致。】

- 功能范围：
- 交付物形态：
- 退出标准：
- 禁止越界：

## 1.1 Phase / Sprint / Task 定义

【撰写提要：按 `ai/implementation-lifecycle-rules.md` 统一术语，避免把阶段、迭代和单任务混用。】

| 层级 | 定义 | 本文要求 |
|---|---|---|
| Phase | 一段有明确交付物形态、允许范围和退出标准的阶段 | 对齐 `docs/03-prd.md` §3 与 `ai/project-rules.md` §1 |
| Sprint | Phase 内一个可验收的增量 | 对应一个小功能、验证闭环或紧密相关改动 |
| Task | Sprint 复杂时拆出的独立执行单元 | 落到 `tasks/task-00X-xxx.md`，关联 Sprint / REQ / Test Case |
| Sprint 完成包 | 判断 Sprint 是否完成的证据集合 | 改动文件、验证结果、验收记录、残留风险、下一步 |

## 2. Sprint 总览

【撰写提要：每个 Sprint 对应一个小功能或验证闭环；复杂 Sprint 再拆 `tasks/task-00X-xxx.md`。测试等级 / 验证包必须能追溯到 `docs/09-verification.md`。】

| Sprint-ID | 目标 | 覆盖 REQ / NFR | 输入设计 / 契约 | 修改范围 | 验证包 / TC | 状态 | 任务单 |
|---|---|---|---|---|---|---|---|
| Sprint-1 |  | REQ-001 / F-001 | 04/05/06/07 章节 | 1-3 个模块 | TC-001 + 验收记录 | 待开始 / 进行中 / 已完成 / 条件完成 / 阻塞 | 不拆 / `tasks/task-001-xxx.md` |

## 3. Sprint 详情模板

【撰写提要：以下格式必须用于每个 Sprint；“修改范围”要足够窄，“禁止事项”要明确。】

## Sprint-1：

【撰写提要：填写本章节的项目事实；依据上游文档和对应 ai/doc-standards，不得新增未确认内容。】
### 目标

（这个任务要实现什么；说明关联 REQ / 功能 / 交付物形态）

### 输入文档

- `docs/02-srs.md`：REQ-...
- `docs/03-prd.md`：F-... / Phase...
- `docs/04-architecture.md`：模块 / 流程...
- `docs/05-tech-spec.md`：技术约束...
- `docs/06-db-design.md`：表 / 字段 / 迁移...（如适用）
- `docs/07-api-spec.md`：API-ID / 错误码 / 权限...（如适用）
- `docs/09-verification.md`：TC-...

### 修改范围

（预计新增 / 修改哪些文件，限制在 1-3 个文件 / 模块；复杂则拆任务）

### 验收标准

（如何判断完成；对应 `docs/09-verification.md` 用例）

### 验证包

| 项 | 内容 |
|---|---|
| 关联 TC | TC-... |
| 测试等级 | 单元 / 集成 / API / E2E / 验收 / 回归 / 资源环境 |
| 自动化命令 |  |
| 人工步骤 |  |
| 资源 / 环境验证 | 端口 / 内存 / 显存 / 磁盘 / Docker / DB / 模型 / 网络 / 权限 |
| Mock / 降级口径 | 是否等价真实能力；用户可见提示；补验时点 |
| 不适用说明 |  |

### 禁止事项

（不允许改什么、不允许引入什么、不允许实现哪些后续阶段功能）

### Sprint 完成包

- 改动文件：
- 验证命令 / 人工步骤：
- 验证结果：
- 关联提交 / PR：
- `docs/09-verification.md` 验收记录：
- 残留风险 / 未验证项：
- 下一步：

## 4. 依赖关系与里程碑

【撰写提要：说明 Sprint 顺序、前置条件和阻塞项。】

| 项 | 前置依赖 | 阻塞风险 | 是否可并行 | 处理方式 | 里程碑 |
|---|---|---|---|---|---|
| Sprint-1 |  |  | 是 / 否 |  |  |

## 5. 任务拆分规则

【撰写提要：当 Sprint 修改范围超过 3 个模块、验收标准不可一次验证、或多人 / 多 AI 并行时，拆成 `tasks/task-00X-xxx.md`。】

- 拆分触发条件：超过 3 个文件 / 模块；验收标准不可一次完成；涉及多个不相干功能；多人 / 多 AI 并行；需要跨测试等级逐步验证。
- 任务命名：`tasks/task-00X-xxx.md`。
- 任务追溯要求：task → Sprint → REQ → TC-ID / 验证包。
- 提交 / PR 粒度：一个 Task 对应一个提交或一个小 PR；不得把多个无关 Task 混入一次提交。
- 任务拆分决策树：
  1. 能否用 1–3 个文件 / 模块完成并一次验收？能则保留为 Sprint 内单 Task。
  2. 是否跨多个功能或测试等级？是则拆 `tasks/task-00X-xxx.md`。
  3. 是否需要多人 / 多 AI 并行？是则拆 task 或独立 worktree。
  4. 是否存在未确认需求或阶段边界？是则回到 `docs/03-prd.md` / `ai/project-rules.md`，不得开工。

## 6. 当前进度记录

【撰写提要：切换 AI 工具或新会话前，在这里记录已完成、未完成、验证结果和下一步。】

| 日期 | Sprint / Task | 进度 | 验证结果 | 关联提交 / PR | 下一步 | 是否已回填 09 |
|---|---|---|---|---|---|---|
| YYYY-MM-DD |  | 待开始 / 进行中 / 已完成 / 条件完成 / 阻塞 | 通过 / 未通过 / 未执行 |  |  | 是 / 否 / 不适用 |

## 7. 待人工确认项

【撰写提要：记录本阶段仍需人工确认的事项；必须包含 AI 建议、建议依据、备选方案和取舍影响，确认前不得写成事实。】
> 待确认项必须保留 AI 建议、建议依据、备选方案和取舍影响；AI 建议不等于用户确认。

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 |  |  |  |  |  |
