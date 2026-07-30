# 同步后文档体系审计：v1.59.0 后状态回写

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-30 |
| 触发来源 | v1.59.0 派生项目同步后的 docs-system-audit 建议 |
| 审计模式 | 轻量 PLM 状态校准 + 同步后留痕 |
| 输入依据 | `ai/project-rules.md` §1、`docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`sync-records/template-sync/2026-07-29-sync-template-v1.59.0.md` |
| 输出范围 | 纯文档状态回写；不新增需求、不改代码、不切 Phase2B |

## 1. 结论

- Phase1 Demo、Phase1.5A、Phase2A 均已有完成记录；本次将 00-09 与相关 design 文件中仍停留在“候选 / 待编码 / 契约草案”的陈旧描述回写为已完成。
- Phase1.5B 仍是候选：PDF 导出、真实 Word/PDF 文本提取、zhparser / OCR 等依赖项不得因本次回写被标为完成。
- Phase2B 未启动：AI 润色 / 写作引用、时间轴 / 团队 MVP、完整 UI / WSG 门禁仍需重新确认范围、进入 / 退出标准和验证包。
- 本次不运行项目测试 / lint / build；验证方式以文档差异检查和陈旧状态 grep 为主。

## 2. 已回写范围

| 范围 | 文件 | 回写内容 |
|---|---|---|
| 需求链 | `docs/00-scenario.md`、`docs/01-user-requirements.md`、`docs/02-srs.md`、`docs/03-prd.md` | 补 Phase2A 个人知识组织场景 / 用户需求 / REQ 与验收追踪；校准 REQ-037/038、REQ-012/025/026 状态 |
| 总体设计 | `docs/04-architecture.md`、`docs/05-tech-spec.md` | 校准 MOD / ADR / TCD / Flow 中 P1.5A 与 Phase2A 状态；保留 PDF / Phase2B 门禁 |
| 详细设计 | `docs/06-db-design.md`、`docs/07-api-spec.md` | 将 API-029/030、REQ-012/025/026 的 DB / API 契约状态回写为已实现；Phase2B 契约继续保留草案 |
| 计划与验证 | `docs/08-dev-plan.md`、`docs/09-verification.md` | 顶部索引与验证摘要指向 Sprint-16/17、Phase2A closure 的已有完成包 |
| 子设计 | `docs/design/ingestion.md`、`docs/design/export-delivery.md`、`docs/design/frontend-experience-brief.md`、`docs/design/frontend-interaction.md` | 将 P1.5A 导入 / 导出、Phase2A 标签 / 反链 / 快录状态校准为已完成；Phase2B UI/AI/时间轴仍候选 |
| 治理留痕 | `docs/research/00-index.md`、`docs/research/2026-07-14-docs-open-items.md`、本同步记录 | 新增本审计入口；对历史 open-items 加状态校准说明；同步记录改为审计已执行 |

## 3. 保留的后续项

| 后续项 | 当前状态 | 处理口径 |
|---|---|---|
| Phase1.5B PDF 导出 / Word-PDF / zhparser / OCR | 待 RG / 候选 | 不阻塞 Phase2A closure；进入实现前先补 tech-env 选型、最小中文样例、测试与 smoke |
| Phase2B 团队 MVP | 未启动 | 需重新确认首批范围、AI 数据外发风险接受方式、UI / WSG 门禁和 08/09 验证包 |
| 项目测试 / lint / build | 本次未运行 | 因本轮为纯文档状态回写，后续提交前可按需要补 `git diff --check`、项目测试或构建 |
| 模板提案回流复核 | 未执行 | 需联网复核 `_proposals/` 对应 issue / PR 后再归档 |

## 4. 审计判定

- 同步后 docs-system-audit：已执行。
- 项目事实风险：已降低，核心风险是不得再将 Phase2A 已完成能力误写为“待确认 / 未实现”。
- 可接受兼容差异：历史 research / open-items 记录保留原始时间点结论，通过 2026-07-30 校准说明覆盖最新口径。
- 下一步建议：先完成文档差异检查；若需要提交，再按单步确认执行测试 / push / PR。