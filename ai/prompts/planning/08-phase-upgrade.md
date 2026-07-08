# 08 Phase升级评估

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：评估项目是否可以从当前 Phase 进入下一 Phase。

**目的**：先确认当前阶段完成度，再草拟下一阶段允许 / 禁止 / 预告边界，避免提前解锁愿景功能。

**适用场景**：当前 Phase 的 Sprint 基本完成，准备规划下一阶段。

**不适用场景**：当前 Phase 验收尚未完成或核心缺陷未关闭；应先用 `ai/prompts/dev/09-sprint-summary.md` 做验收总结。

**使用前准备**：准备当前 `ai/project-rules.md`、`docs/03-prd.md` 路线图、`docs/08-dev-plan.md` 完成情况、验证结果和待确认事项总览（如 `docs/research/*docs-open-items*.md`）。

**预期产出**：当前 Phase 完成情况、下一 Phase 解锁清单、`ai/project-rules.md` §1 更新草稿。

**使用后下一步**：人工确认 Phase 边界后，再用 `ai/prompts/docs/04-edit-single-doc.md` 修订相关文档；不要让 AI 直接推进阶段。

```text
项目准备从当前Phase进入下一Phase。

请阅读：
- ai/project-rules.md（当前Phase边界）
- docs/03-prd.md、docs/04-architecture.md、docs/05-tech-spec.md、docs/08-dev-plan.md
- docs/09-verification.md（当前 Phase 验收与证据引用）
- docs/research/*tech-env-evaluation*.md（如下一 Phase 解锁真实依赖、数据库、外部服务、LLM、Docker / 部署或权限安全能力）
- docs/06-db-design.md、docs/07-api-spec.md（如下一 Phase 解锁持久化、对外接口、Mock → 真实调用、内部 API → 外部 API 或真实隐私 / 业务数据处理）
- docs/research/*docs-open-items*.md 或会话中的待确认事项总览（如存在）

输出：
1. 当前Phase的完成情况核对
2. 下一Phase可以解锁的功能/技术清单
3. `03-prd` Phase 状态传播检查：功能范围、交付物形态、进入 / 退出标准、证据 / 验收引用是否已与 `09` 和 Sprint 总结一致
4. `04/05` readiness gate 检查：下一 Phase 涉及的真实依赖、数据库、外部服务、LLM、Docker / 部署、权限安全是否有 Risk-ID、验证证据、Go / Conditional Go / No-Go 结论和 `05 ↔ 09` 映射；No-Go 或阻塞 Risk-ID 未关闭时，不得建议直接升级
5. `06/07` DB / API 契约门槛检查：当前 Phase 表 / API 是否有字段级契约、endpoint contract、API-ID、错误码、权限边界、迁移 / seed / 回滚、兼容策略、数据留存和验证项；草案、候选、Mock、默认关闭或目标设计未补齐时，不得建议直接升级为 MVP / 对外 / 真实能力
6. `08/09` 完成包和验证证据检查：当前 Phase 必过 TC、Sprint 验收包、资源验证、缺陷 / 回归记录、残留风险和 `08` 进度状态是否已回写；handoff 中的长期状态是否已转写正式文档
7. 状态一致性检查：`03/08/09/ai/project-rules.md/README/.ai/session-handoff.md` 对当前 Phase、完成情况、验证结论和下一阶段范围是否一致
8. 待确认事项总览中与下一 Phase 相关的阻塞 / 条件阻塞项；阻塞项未关闭或未被风险接受时，不得建议直接升级
9. 针对 ai/project-rules.md 的"Phase边界"一节，给出更新后的内容草稿
   （允许/禁止/下一阶段预告三段式），等待人工确认后再实际修改该文件
```
