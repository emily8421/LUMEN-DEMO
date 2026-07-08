# 03 PRD Standard（产品需求文档规范镜像）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `docs/03-prd.md` 的细粒度规范标准，用于 AI 生成、精修、审计和评估产品需求文档。它不是项目事实文档，派生项目的实际 PRD 仍写入 `docs/03-prd.md`。

## 1. 定位与边界

`03` 是产品范围、Phase 路线图、交付物形态和取舍决策事实源。它回答“哪些需求在哪个阶段做、做到什么交付物形态、为什么这样取舍”，不写架构、技术方案、接口字段、数据库表或 Sprint 任务细节。

- Phase 路线图可由 AI 提议，但必须标为待人工确认，确认后才成为开发边界。
- 每个 Phase 必须同时声明功能范围和交付物形态（Demo / MVP / 产品）。
- 不得把 Demo 声称为 MVP / 产品；不得把远期愿景写成当前阶段承诺。
- 非目标和排除需求必须能约束 `04-09` 和 Sprint 禁止事项。

## 2. 最低结构

| 能力 | 最低字段 / 结构 |
|---|---|
| 文档元信息 | 输入来源、覆盖 REQ、当前状态、最后更新 |
| 产品目标与范围 | 当前 Phase 目标、交付物形态、范围边界 |
| 功能清单 | 功能 ID、功能描述、覆盖 REQ、阶段、交付物形态、状态 |
| Phase 路线图 | Phase、功能范围、交付物形态、进入标准、退出标准、状态 |
| 优先级与取舍 | 功能 / REQ、优先级、是否进入当前 Phase、理由、风险 |
| 非目标 | 编号、非目标、适用范围、来源、备注 |
| REQ 覆盖矩阵 | REQ-ID、对应功能、阶段、交付物形态、覆盖状态 |
| 证据 / 验收引用 | 链接 `09` 验收记录、Sprint 总结或人工确认证据 |
| 待人工确认项 | 结构化确认项表，不得只写问题列表 |

## 3. ID 与追溯规则

- 功能使用 `F-001`，Phase 使用 `Phase1 / Phase2` 等稳定名称。
- 最低链路：`REQ-ID → F-ID → Phase → AC / TC / Sprint`。
- 每个 REQ 必须有阶段归属：当前 Phase、后续 Phase、愿景或非目标。
- Phase 变更必须传播到 `ai/project-rules.md` §1、`04-09`、tasks 和验证计划。

## 4. Phase 规则

| 检查项 | 要求 |
|---|---|
| 功能范围 | 明确覆盖哪些 REQ / F-ID |
| 交付物形态 | Demo / MVP / 产品，不得混用 |
| 进入标准 | 进入该阶段前必须满足的文档、环境、验证或确认条件 |
| 退出标准 | 阶段完成时必须满足的验收和证据 |
| 状态 | AI建议·待确认 / 已确认 / 进行中 / 已完成 / 阻塞 |
| 证据引用 | `09`、Sprint 总结、人工确认或报告路径 |

## 5. 审计检查

| 检查项 | 通过标准 | 常见问题 |
|---|---|---|
| REQ 覆盖 | 每个 REQ 有功能或非目标归属 | REQ 有但 PRD 无承接 |
| Phase 明确 | 每个 Phase 有范围、形态、进入 / 退出标准 | 只列阶段名 |
| 取舍有据 | 优先级和排除理由可追溯 | AI 自行决定范围 |
| 非目标传播 | 非目标约束下游设计 / 计划 | 后续重新引入非目标 |
| 证据引用 | 当前 Phase 有验收或证据入口 | 状态写完成但无证据 |

## 6. 下游影响

- 给 `ai/project-rules.md`：当前 Phase 允许 / 禁止 / 下一阶段预告。
- 给 `04/05`：架构和技术方案范围边界。
- 给 `06/07/design`：详细设计范围和非目标边界。
- 给 `08/09`：Sprint 规划、验收用例和 Phase 升级依据。
