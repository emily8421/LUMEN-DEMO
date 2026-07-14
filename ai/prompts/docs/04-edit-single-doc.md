# 04 单文档修订

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：只修订某一份文档或某个章节，不启动完整初始化流程。

**目的**：在变更原因明确时，保持文档局部更新并维持跨文档一致性。

**适用场景**：PRD 新增/调整需求、API 契约变化、DB 设计变化、Phase 标签需要同步，或按触发条件新增 / 补齐 `docs/design/*` 通用详细设计、`docs/design/frontend-interaction.md` 等详细设计文档。

**不适用场景**：需要重新生成或补齐 03-09 全套文档；这种情况先用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料，再用 `ai/prompts/docs/00-generate-or-complete-docs.md`。

**使用前准备**：明确要修订的文档、变化原因、关联需求和受影响章节。

**预期产出**：修订方案、修改后的文档内容、影响范围说明；若来源是专题方案讨论，还必须包含人工确认依据和 open item 回填状态。

**使用后下一步**：用 `ai/prompts/review/10-docs-checklist.md` 或相关审查项检查一致性，再继续开发或提交。

```text
docs/07-api-spec.md 需要修订：（说明变化原因，例如PRD新增了XX需求）

请先阅读：
- ai/index.md 列出的全部规则文件
- 对应的 `ai/doc-standards/<doc>.md`（例如精修 `docs/02-srs.md` 时读取 `ai/doc-standards/02-srs.md`；新增 / 修订 `docs/design/*` 时读取 `ai/doc-standards/design-doc.md`）
- docs/03-prd.md（相关章节）
- docs/07-api-spec.md（当前内容）

要求：
1. 只修改 docs/07-api-spec.md，不重新生成其他文档
2. 先说明本次修订的范围、理由、预计文件、变更摘要、风险和验证方式，等待确认后再修改
3. 修订前先按 `ai/document-lifecycle-rules.md` 判断该文档的上游输入、变更类型与下游影响
4. 修订 `00-03` 时必须对照 `ai/doc-standards/00-scenario.md` 至 `03-prd.md`，检查 `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 是否仍闭合；新增 / 删除场景、U-ID、REQ 或 Phase 状态时，先指出下游影响清单和同步计划
5. 若修订 `docs/06-db-design.md`，必须对照 `ai/doc-standards/06-db-design.md` 检查数据对象、概念模型、目标结构与当前实现对照、字段级契约、迁移 / seed / 回滚、数据安全留存、DB / API 字段映射和契约状态；目标设计、Mock、草案或未迁移数据不得写成当前真实实现
6. 若修订 `docs/07-api-spec.md`，必须对照 `ai/doc-standards/07-api-spec.md` 检查 API-ID、endpoint contract matrix、请求 / 响应 / 错误 / 权限 / 兼容契约、异步状态机、API ↔ DB / Service / Test 追溯和契约状态；草案、候选或默认关闭 API 不得直接写成可实现或已验证
7. 若修订 `docs/08-dev-plan.md`，必须对照 `ai/doc-standards/08-dev-plan.md` 检查当前 Phase 目标、Sprint 总览、验证包、完成包、任务拆分规则、进度记录和是否已回填 09；长期进度不得只留在 handoff
8. 若修订 `docs/09-verification.md`，必须对照 `ai/doc-standards/09-verification.md` 检查 REQ → TC 追溯、TC 用例详情、TC 状态、资源验证、Sprint / Phase 验收记录、Sprint 验收包、缺陷 / 回归和风险与未验证项；Mock / 降级不得写成真实能力已通过
9. 局部变更如影响 docs/06-db-design.md、docs/07-api-spec.md、08-dev-plan.md 或 09-verification.md，先指出影响清单和同步计划，等待确认后再处理，不要自行连带修改
10. 若新增或补齐 `docs/design/*`，必须对照 `ai/doc-standards/design-doc.md`，承接 `02/03/04/05/06/07/08/09`，覆盖文档元信息、职责边界、上游追溯、流程 / 状态机、数据 / 接口 / 权限契约引用、失败 / 降级路径、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项；不得新增需求、接口、表或验收目标。若依据来自 UI brief、参考分析、需求探索原型、视觉效果探索或 `docs/design/frontend-experience-brief.md`，必须说明用户确认依据、采纳 / 未采纳项和 open item 关闭状态，未确认候选不得进入正式设计。`docs/design/frontend-interaction.md` 是页面 / 交互型子类型，还必须对照 `ai/doc-standards/frontend-interaction.md`，覆盖页面 / 路由清单、用户流、组件职责、状态 / 空态 / 错误态、表单校验、文案、权限可见性、接口依赖、UI 原型与可视化证据和验收路径；若触发 UI 原型策略 / 实现前原型，必须对照 `ai/doc-standards/ui-prototype-strategy.md`，检查默认 UI 标准基线、UI / 后端 / 双轨顺序判断、原型形式、权威位置、覆盖页面 / 主流程 / 状态 / 权限与降级、未覆盖项、UI-G-004 / UI-G-006 / UI-G-007 和待确认项，且原型不得越过上游需求或接口边界
11. 若修订 `docs/04-architecture.md`，必须对照 `ai/doc-standards/04-architecture.md` 检查上下文图、COMP / MOD / Flow ID、运行拓扑、ADR、异常 / 降级 / 权限拒绝路径和 REQ / 功能追溯；新增真实依赖或外部系统时，同步评估 `docs/05-tech-spec.md`、`docs/09-verification.md` 和 `docs/08-dev-plan.md`
12. 若修订 `docs/05-tech-spec.md` 且项目涉及真实运行依赖，必须检查是否已有 `docs/research/*tech-env-evaluation*.md` 或同等评估结论，并对照 `ai/doc-standards/05-tech-spec.md` 补齐技术状态、依赖配置、密钥 / 敏感性、Risk-ID、readiness gate、`05 ↔ 09` 验证映射和 Sprint 解锁条件；缺失时先建议运行 `tech-env-evaluation`，或在 05 中记录跳过理由、风险和补做时点
13. 若 `04/05/06/07/08/09` 中存在候选、默认关闭、Mock、降级、草案、目标设计、条件通过或禁止能力，必须确认不会被 `08` Sprint 或 `09` 必过用例误写为当前实现、已验证或已启用
14. 横切事实 / 约束变更除外：必须主动列出所有受影响文档、权威源与引用同步计划，并在获得本次修改授权后按计划更新和做聚焦一致性检查
15. 若修订依据来自需求层人机交互、总体设计 / 技术选型或交互设计专题讨论，先确认用户已选择方案；未确认前只能写入“候选 / 待人工确认”，不得写成项目事实
16. 专题讨论确认后，必须说明回填位置、被关闭或更新的 open item ID，并检查是否需要同步 `docs-open-items`
17. 若新增或修改待人工确认项，必须补齐 `ID / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`；AI 建议不得写成已确认事实
```
