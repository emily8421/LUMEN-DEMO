# 08 开发计划（Development Plan）

> **文档定位**：把已确认的 Phase 范围拆成可执行 Sprint / 任务。本文回答“先做哪个小任务、改哪些文件、怎样验收”。
>
> **上游输入**：`docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/06-db-design.md`（如有）、`docs/07-api-spec.md`（如有）、`docs/09-verification.md`、`ai/project-rules.md`。
>
> **下游输出**：为 `tasks/*`、代码实现、测试和 Sprint 验收提供边界。一个 Sprint 不应实现整个系统。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | Phase1 |
| 交付物形态 | Demo / MVP / 产品 |
| 输入基线 | 03-09 文档版本 / 日期 |
| 当前状态 | 草稿 / 待人工确认 / 已确认 |
| 最后更新 | YYYY-MM-DD |

## 1. 当前 Phase 目标

**撰写提要**：概述当前 Phase 要交付的功能范围和验收目标；必须与 `docs/03-prd.md` §3 和 `ai/project-rules.md` §1 一致。

- 功能范围：
- 交付物形态：
- 退出标准：
- 禁止越界：

## 2. Sprint 总览

**撰写提要**：每个 Sprint 对应一个小功能或验证闭环；复杂 Sprint 再拆 `tasks/task-00X-xxx.md`。

| Sprint | 目标 | 覆盖 REQ / 功能 | 修改范围 | 验收方式 | 状态 |
|---|---|---|---|---|---|
| Sprint-1 |  | REQ-001 / F-001 | 1-3 个模块 | TC-001 | 待开始 / 进行中 / 完成 |

## 3. Sprint 详情模板

**撰写提要**：以下格式必须用于每个 Sprint；“修改范围”要足够窄，“禁止事项”要明确。

## Sprint-1：

### 目标

（这个任务要实现什么；说明关联 REQ / 功能 / 交付物形态）

### 输入文档

- `docs/02-srs.md`：REQ-...
- `docs/03-prd.md`：F-... / Phase...
- `docs/04-architecture.md`：模块 / 流程...
- `docs/05-tech-spec.md`：技术约束...
- `docs/09-verification.md`：TC-...

### 修改范围

（预计新增 / 修改哪些文件，限制在 1-3 个文件 / 模块；复杂则拆任务）

### 验收标准

（如何判断完成；对应 `docs/09-verification.md` 用例）

### 禁止事项

（不允许改什么、不允许引入什么、不允许实现哪些后续阶段功能）

## 4. 依赖关系与里程碑

**撰写提要**：说明 Sprint 顺序、前置条件和阻塞项。

| 项 | 前置依赖 | 阻塞风险 | 处理方式 |
|---|---|---|---|
| Sprint-1 |  |  |  |

## 5. 任务拆分规则

**撰写提要**：当 Sprint 修改范围超过 3 个模块、验收标准不可一次验证、或多人 / 多 AI 并行时，拆成 `tasks/task-00X-xxx.md`。

- 拆分触发条件：
- 任务命名：
- 任务追溯要求：task → Sprint → REQ → 测试用例

## 6. 当前进度记录

**撰写提要**：切换 AI 工具或新会话前，在这里记录已完成、未完成、验证结果和下一步。

| 日期 | Sprint / Task | 进度 | 验证结果 | 下一步 |
|---|---|---|---|---|
| YYYY-MM-DD |  |  |  |  |

## 7. 待人工确认项

-