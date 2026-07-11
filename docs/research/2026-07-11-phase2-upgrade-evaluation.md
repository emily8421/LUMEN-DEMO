# Phase2 升级评估（Phase1 → Phase2）

> 定位：阶段升级评估留痕（对照 `ai/prompts/planning/08-phase-upgrade.md`）。**只读评估**，不替代 `00-09` 正式修订，**不改 Phase 指针**。落盘于 `docs/research/`。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-11 |
| 评估对象 | Phase1（Demo）→ Phase2（MVP）升级就绪度 |
| 结论 | **No-Go（有条件）** —— Phase1 已收口；Phase2 进入前置门禁未满足；不建议现在移动 Phase 指针 |
| 依据 | `ai/project-rules.md` §1、`docs/03-prd.md` §3、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`docs/research/2026-07-09-tech-env-evaluation-phase1-reeval.md` |
| 不做 | 不改 Phase 指针、不启动 Phase2 编码、不新增需求 |

## 1. 当前 Phase 完成度核对

Phase1（Demo）= **Conditional Go（Demo closure）**（`docs/09-verification.md` §5，commit `d8d0f8f`）。REQ-001..011、036 全部有验收口径与证据链。降级遗留（真实 Word / PDF 解析 REQ-009；OCR REQ-010 / RG-003 No-Go）已显式移出 Phase1 必过，不阻塞 Phase1 收口。✅ 达到 Demo 退出标准。

## 2. Phase2 可解锁清单

REQ-012..017、024..027（标签视图 / 时间轴 / 关联图 / AI 润色 / 写作侧边栏引用 / 跨空间推送 / 多人协作 / 移动端 / 时间轴密度热条 / 快速录入索引 / 内部链接 + 反向链接 / 单文档导出 PDF）。REQ 级清单存在；但 `04` MOD-006/007、`06/07`、`08` Sprint、`09` TC 全为骨架，**无可执行解锁清单**。

## 3. 03 状态传播检查 ✅

`03` §3 Phase2 = `骨架·待细化`，退出标准 = 待升阶段细化；`04/05/06/07/08/09` 同步标骨架/待细化。传播一致，无单点漂移。

## 4. 04/05 Readiness Gate 检查 ❌ **未满足**

现 RG-001/002/004/005 = Go（仅 RG-003 OCR No-Go，已移后续）。但 **Phase2 触发新的真实依赖，无对应 tech-env-evaluation / Risk-ID**：

- **多人协作**（REQ-016）：实时并发编辑 → 需 WebSocket / OT·CRDT，新依赖未验证
- **移动端**（REQ-017/020）：响应式 + VPN 接入，未验证
- **导出 PDF**（REQ-027）、**跨空间推送副本**（REQ-015）：新依赖 / 新权限模型

`docs/research/` 仅 Phase1 tech-env-eval（2026-07-04 / 2026-07-09），**无 Phase2 评估**。Phase2 交付物 = **MVP（真实上线）**，门禁严于 Demo；按 `ai/document-lifecycle-rules.md` §5.4 / `ai/implementation-lifecycle-rules.md` §3，触发真实依赖的 Sprint 前必须有 Go / Conditional-Go。**缺失。**

## 5. 06/07 DB / API 契约门槛检查 ❌ **未满足**

Phase2 功能（tags / links / 事件时间轴 / 推送副本 / 协作会话 / 移动端端点）在 `06/07` **无字段级契约、无 endpoint contract、无迁移 / 回滚、无兼容策略**，全骨架。不满足 MVP 级契约门槛。

## 6. 08/09 完成包和验证证据检查 ✅（Phase1 侧）

Phase1 完成包已回写（`08` Sprint 完成包、`09` §5 验收记录、§6 风险、`d8d0f8f` 等）。Phase2 无 Sprint / TC。

## 7. 状态一致性检查 ✅

`03 / 08 / 09 / ai/project-rules.md §1 / .ai/session-handoff.md` 一致：当前 Phase1、Conditional Go、Phase2 进入需人工确认范围 / 进入 / 退出标准。

## 8. 阻塞 / 条件阻塞项（未关闭）

| ID | 待确认项 | 状态 |
|---|---|---|
| PU-C-004 / PRD-C-001 / REQ-C-001 | 是否进入 Phase2 | 未确认 |
| — | Phase2 MVP 范围 / 优先级（REQ-012..017 / 024..027 取舍） | `03` §3 退出标准 = 待细化 |
| — | Phase2 tech-env-evaluation（协作 / 移动端 / PDF / 推送） | 未做 |
| — | Phase2 06/07 MVP 级契约 | 未细化 |

## 9. `ai/project-rules.md` §1 更新草稿（**待人工确认，不擅自应用**）

当前阶段指针**保持 Phase1 不变**。建议在 §1「下一阶段预告」补 Phase2 进入前置清单（见 §10），待前置关闭后再由人工切指针。

## 10. 建议的 Phase2 前置执行顺序（AI 建议）

按 PLM 阶段链路（需求 → 总体设计 → 详细设计），Phase2 详细设计与技术验证**依赖 04/05 总体设计**。建议顺序：

0. **总体设计阶段评估（04/05）** —— 先严格评估总体设计文档能否支撑 Phase2：
   - (B) Phase2 设计就绪度（重点）：MOD-006/007 骨架是否足以驱动 tech-env-eval 与 06/07；05 是否有 Phase2 技术决策与门禁（协作 / 移动端 / PDF / 推送的 Risk-ID）。
   - (A) doc-standards 字段一致性（轻量复核）：对齐刚完成的 00-03 规范化。
1. 人工确认 Phase2 MVP 范围（REQ-012..017 / 024..027 取舍与优先级）与进入 / 退出标准。
2. 对触发真实依赖的功能跑 Phase2 tech-env-evaluation，给 Go / Conditional-Go。
3. 在 `06/07` 为范围内 Phase2 功能补 MVP 级契约。
4. 复跑本评估，阻塞项关闭后再切 Phase1 → Phase2 指针。

每步可独立小 PR；未关闭前不切指针、不启动 Phase2 编码。

## 11. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|
| PH2-C-001 | 是否启动 Phase2 前置工作，及首步是否为 04/05 总体设计评估 | 建议先做 §10 步骤 0（04/05 评估，先 B 后 A） | PLM 阶段链路；Phase2 详细设计 / 技术验证依赖总体设计；当前 MOD-006/007 与 05 Phase2 门禁缺失 | 阻塞 Phase2 tech-env-eval 与 06/07 契约；不阻塞 Phase1 现状 |
| PH2-C-002 | Phase2 MVP 范围（12 个 P2 REQ 取舍） | 待用户确认取舍后再细化 03 §3 退出标准 | `03` §3 Phase2 退出标准 = 待细化 | 阻塞 Phase2 Sprint 规划；不阻塞 04/05 评估 |
