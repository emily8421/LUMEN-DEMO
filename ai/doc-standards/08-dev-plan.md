# 08 Development Plan Standard（开发计划规范镜像）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `docs/08-dev-plan.md` 的细粒度标准，用于 AI 生成、修订、审计和评估开发计划。它不是项目事实文档，派生项目的实际计划、进度和完成摘要仍写入 `docs/08-dev-plan.md`。

## 1. 定位与边界

`08` 是计划、拆分、进度摘要和完成摘要事实源，承接 `03` Phase、`04-07` 设计 / 契约和 `09` 验证计划，输出可执行 Sprint、Task 拆分、验证包、完成包和进度记录。

- 不得把后续 Phase 功能排进当前 Sprint。
- 不得用本地 handoff 或聊天记录替代正式进度摘要；长期事实必须回写 `08` 或说明暂不落盘原因。
- 不得把没有 TC-ID、验证命令 / 人工步骤或验收口径的自然语言目标作为 Sprint 完成依据。
- Sprint 超过 3 个文件 / 模块、跨多个不相干功能、多人 / 多 AI 并行或跨测试等级逐步验证时，必须拆成 `tasks/task-*.md`。

## 2. 最低结构

| 能力 | 最低字段 / 结构 |
|---|---|
| 文档元信息 | 当前 Phase、交付物形态、输入基线、当前状态、最后更新 |
| 当前 Phase 目标 | 当前 Phase、功能范围、交付物形态、退出标准、禁止越界、权威源 |
| Phase / Sprint / Task 定义 | Phase、Sprint、Task、完成包的定义和输出位置 |
| Sprint 总览 | Sprint-ID、目标、覆盖 REQ / NFR、输入设计 / 契约、修改范围、验证包、状态、任务单 |
| Sprint 详情 | 目标、输入文档、修改范围、验证包、验收标准、禁止事项、完成包 |
| Web Walking Skeleton | 复杂 Web / 全栈交互项目的 Sprint 0 / Walking Skeleton 计划或豁免 |
| 依赖关系与里程碑 | 项、前置依赖、阻塞风险、是否可并行、处理方式、里程碑 |
| 任务拆分规则 | 复杂度阈值、拆分触发条件、Task 文件命名、worktree / 分支建议 |
| 当前进度记录 | 日期、Sprint / Task、进度、验证结果、关联提交 / PR、下一步、是否已回填 09 |
| 待人工确认项 | 结构化确认项表，不得只写问题列表 |

## 3. Sprint 验证包

每个 Sprint 必须引用或定义最小验证包。复杂 Web / 全栈交互项目若触发 `template-docs/web-fullstack-profile.md`，应在首个业务功能 Sprint 前安排或显式豁免 Sprint 0 / Walking Skeleton，修改范围限于 App Shell、目录边界、最小 API / mock / smoke 和文件膨胀阈值，不得顺手实现完整业务。

| 字段 | 要求 |
|---|---|
| 关联 TC | 当前 Sprint 必过 TC-ID 或待新增 TC-ID |
| 测试等级 | 单元 / 集成 / API / E2E / 验收 / 回归 / 资源环境 |
| 自动化命令 | 具体命令；暂无自动化则写明人工步骤和原因 |
| 人工步骤 | 浏览器 smoke、CLI smoke、桌面端、权限、导入 / 搜索 / 问答等可复现步骤 |
| 资源 / 环境验证 | 端口、内存 / 显存、磁盘、Docker / DB / 模型、网络 / 权限 |
| Mock / 降级口径 | 是否等价真实能力、用户可见提示、补验时点 |
| 不适用说明 | 不适用的测试等级必须说明原因 |

## 4. Sprint 完成包

`08` 记录进度摘要，`09` 记录验证证据。最小完成包职责如下：

| 字段 | `08` 职责 | `09` 职责 |
|---|---|---|
| 改动文件 | 摘要记录 | 可引用详情或 PR |
| 验证命令 / 人工步骤 | 引用验证包 | 记录实际执行命令 / 步骤 |
| 验证结果 | 摘要状态 | 记录证据、日志、截图、失败项 |
| 关联提交 / PR | 记录引用 | 记录引用 |
| 验收记录 | 指向 `09` | 权威记录 |
| 残留风险 | 摘要 | 风险与未验证项权威记录 |
| 下一步 | 计划入口 | 后续验证 / 回归入口 |

## 5. Task 模板最低要求

当 Sprint 复杂到需要拆分时，`tasks/task-*.md` 至少包含任务元信息、目标、输入文档、修改范围、验证包、验收标准、禁止事项、降级 / Mock 边界、完成记录和待确认项。

任务元信息最低字段：`Task-ID`、`所属 Sprint`、`关联 REQ / NFR`、`关联 TC`、`当前状态`、`分支 / worktree`。

降级 / Mock 边界最低字段：降级原因、当前实现、不等价真实能力、用户可见提示、后续补齐时点、对 `09` 验收影响。

## 6. 审计检查

- 当前 Phase 功能范围、交付物形态、退出标准和禁止越界是否与 `03`、`project-rules` 一致。
- 每个 Sprint 是否有 REQ / NFR、输入设计章节、API-ID / 表名、TC-ID、验证包和状态。
- Sprint 修改范围是否超过 3 个文件 / 模块；超过时是否拆 task 或说明原因。
- Sprint 完成包是否记录改动文件、验证结果、关联提交 / PR、`09` 验收记录、残留风险和下一步。
- 当前进度记录是否长期依赖 handoff；若是，是否已回写正式 `08/09` 或说明暂不落盘原因。

## 7. 下游影响

- 给 `tasks/*`：Task 拆分边界、输入文档、验证包和完成记录模板。
- 给实现：单任务修改范围、禁止事项、验证入口和提交 / PR 粒度。
- 给 `09`：TC-ID、验证包、验收记录、Sprint 验收包和残留风险来源。
