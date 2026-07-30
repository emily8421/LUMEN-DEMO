# 待确认事项总览（Open Items）

> 本报告为 `/run docs-open-items` 只读汇总结果，用于集中展示阻塞项、条件阻塞项、风险接受项和回填位置；不替代 `docs/00-09`、`docs/design/*`、`tasks/*` 或 `ai/project-rules.md` 的权威事实。用户确认后，必须回填对应权威文档或任务单。
>
> 2026-07-30 状态校准：本报告是 2026-07-14 历史总览；Phase2A 相关 OI-001/003/004/005 已由 2026-07-20 closure 与 `docs/research/2026-07-30-docs-system-audit-post-v1.59.0.md` 部分关闭 / 降级。最新阶段事实以 `ai/project-rules.md`、`docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 为准。**Phase2B 范围与数据外发口径已于 2026-07-30 确认（OI-001 部分关闭，见 `docs/research/2026-07-30-phase2b-kickoff-decision.md`）；阶段指针未切、编码门禁（RG-008 验证升 Go + Sprint-11 UI/WSG 重跑）仍待；PDF / Word-PDF / zhparser / OCR 仍按候选 / 待 RG 处理**。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-14 |
| 触发场景 | Phase2 UI / MVP 编码前自检未决项；承接同步后文档体系审计 |
| 执行方式 | 只读扫描后落盘汇总；本报告不直接关闭任何事项 |
| 当前门禁结论 | Phase1 / Demo 文档闭环基本健康；Phase2 UI / MVP 实现为 **No Go** |
| 权威事实边界 | 当前阶段指针仍以 `ai/project-rules.md` §1 为准；Phase2 范围与进入标准以 `docs/03-prd.md` §3 为准 |
| Batch A 状态 | 2026-07-14 已回填 `04/05/08/09/frontend-interaction` 的 WSG + UI-G + smoke 证据路径草案；TC-P2-WSG-001 与 TC-P2-UI-001~005 仍未执行 |
| 状态校准 | 2026-07-14 已补充 tech-env 草案状态：`docs/research/2026-07-14-tech-env-evaluation-phase2.md` 为未跟踪草案，仅作依赖风险输入；2026-07-30 已补同步后审计校准，Phase2A closure 与 P1.5A 完成状态以最新正式文档为准，Phase2B / PDF 等后续项仍需确认 |

## 1. 汇总范围与读取依据

- 规则与命令：`ai/index.md`、`ai/rules-core.md`、`ai/document-lifecycle-rules.md`、`ai/global-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md`、`ai/commands/README.md`、`ai/commands/docs-open-items.md`、`ai/prompts/docs/21-docs-open-items.md`。
- 正式文档：`docs/00-scenario.md` 至 `docs/09-verification.md`、`docs/README.md`。
- 设计文档：`docs/design/frontend-interaction.md`、`docs/design/frontend-experience-brief.md`、`docs/design/frontend-workspace-redesign.md`、`docs/design/ingestion.md`、`docs/design/permissions.md`、`docs/design/rag-retrieval.md`、`docs/design/term-management.md`、`docs/design/intelligence-analysis.md`。
- 研究与评估：`docs/research/2026-07-11-phase2-upgrade-evaluation.md`、`docs/research/2026-07-11-phase2-mvp-scope-recommendation.md`、`docs/research/2026-07-13-ui-prototype-exploration.md`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md` 等 `docs/research/*`。
- 任务与续接：`tasks/*`、`.ai/session-handoff.md`、`sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md`。

## 2. 去重规则和合并说明

- 同一问题在 `03`、`08`、`09`、审计报告与 handoff 中重复出现时，以更权威或更新的来源作为主锚点，其他来源作为佐证。
- `PH2-C-001`、`PRD-C-001`、`AUD-C-001`、`08/09` 的“是否进入 Phase2”合并为 `OI-001`。
- UI 输入、原型探索、experience brief、`frontend-interaction`、`09` 中的 UI Gate 事项拆分为：流程门禁 `OI-003` 与体验细节 `OI-004`。
- `docs/03-prd.md` 已将 Phase2 MVP 收敛为核心 5 项，因此本报告不再把“12 个 P2 REQ 如何取舍”作为主要阻塞；当前阻塞是进入标准、WSG、契约、验证和排期是否关闭。
- 真实 PDF / Word 解析与 OCR 不阻塞 Phase1 Demo，但阻塞无条件 MVP / 生产级结论，单独列为 `OI-008`。
- 本地提案归档属于治理清理，不影响业务门禁，单独列为低优先级 `OI-010`。

## 3. 待确认事项总览

| ID | 提出时间 | 来源 | 待确认事项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 | 需确认节点 | 阻塞关系 | 回填位置 | 当前状态 | 关闭依据 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OI-001 | 2026-07-11 / 2026-07-14 | `docs/03-prd.md:76`、`docs/03-prd.md:82`、`docs/08-dev-plan.md:310`、`docs/09-verification.md:148`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:130` | 是否正式启动 Phase2 UI / MVP，实现前是否切换阶段指针 | 建议暂不切 Phase 指针、不直接编码；先关闭 WSG、UI-G、P2 契约、09 风险映射与 open items 总览 | `ai/project-rules.md` 当前阶段仍为 Phase1；`03` 明确 Phase2 进入标准需要 04/05 补强、tech-env-eval、06/07 契约齐备 | 继续只做原型探索；或先仅做 Batch A/B 文档回梳 | 直接切阶段会跳过进入门禁；暂缓编码可降低返工和范围蔓延 | Phase2 启动前 / 首个 Phase2 Sprint 前 | 阻塞 Phase2 实现与阶段指针 | `ai/project-rules.md` §1、`docs/03-prd.md` §3、`docs/08-dev-plan.md`、`docs/09-verification.md` | **部分关闭（2026-07-30）** | 范围（REQ-014 首批 + REQ-013/024 第二 slice）与数据外发口径（真实外发 + 权限护栏，RG-008）已确认，见 `docs/research/2026-07-30-phase2b-kickoff-decision.md`；**阶段指针未切、Phase2B 编码门禁（RG-008 验证升 Go + Sprint-11 UI/WSG 重跑）仍待** |
| OI-002 | 2026-07-14 | `docs/README.md:107`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:118`、`sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:75` | LUMEN 是否采用 Web App Structure Profile / Walking Skeleton Gate，还是记录豁免 | 建议采用轻量 WSG 矩阵，不建议豁免 | 项目是复杂 Web / 全栈交互系统；P1B 已有 App Shell 语义基础，但未以 WSG 形式回填 04/05/08/09 | 写豁免理由；或仅在 Phase2 首个 Web Sprint 前补最小 WSG | 采用会增加少量文档回梳成本，但能明确 App Shell、API client、文件阈值与 browser smoke | 首个 Phase2 Web 业务 Sprint 前 | 阻塞首个 Phase2 Web Sprint | `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` | 待确认 | 待人工确认 |
| OI-003 | 2026-07-14 | `docs/design/frontend-interaction.md:409`、`docs/design/frontend-interaction.md:413`、`docs/design/frontend-interaction.md:417`、`docs/design/frontend-interaction.md:428`、`docs/09-verification.md:77` | P2 UI 编码前门禁是否通过 | 已完成静态评审：TC-P2-WSG-001 与 TC-P2-UI-001~005 条件通过；首个 slice 建议 `REQ-012 + REQ-026`；实现前仍需 smoke 计划 | `frontend-interaction` 已给出 P2-UI-G-001..006；`09` 已记录静态评审结果；当前仍未实现 / 未 smoke | 回到 HTML 原型继续调整；或仅冻结一个最小页面切片 | 静态评审降低 UI 返工风险；但未实现 smoke 前不得标记最终通过 | P2 UI 实现任务前 | 静态门禁阻塞已缓解；实现 smoke 仍阻塞 P2 UI 完成 | `docs/design/frontend-interaction.md` §9.3 / §9.4、`docs/08-dev-plan.md`、`docs/09-verification.md` | 静态评审条件通过 / 待实现 smoke | 2026-07-14 已回填 09 验收记录；待实现任务与 Chrome / Edge smoke |
| OI-004 | 2026-07-13 / 2026-07-14 | `docs/design/frontend-interaction.md:443`、`docs/design/frontend-interaction.md:448`、`docs/research/2026-07-13-ui-prototype-exploration.md:268`、`docs/research/2026-07-13-ui-prototype-exploration.md:270` | P2 UI 体验细节是否采纳当前“少容器清爽稿”及其候选交互 | 建议以当前少容器清爽稿作为首个 slice 的 UI 方向基线；首个实现只落标签 / 内链 / 反链所需入口，不实现全部候选交互 | 用户已反馈第一眼不要复杂、AI 助手高频、当前主题风格可沿用；静态评审已确认关键页面和降级文案存在锚点 | 只保留当前 P1 工作台；或继续做更多原型对比 | 采纳为基线可减少 UI 实现返工；保留候选交互为后续，不扩大首个 slice | 首个 P2 UI 实现任务前 | 条件阻塞已缓解；真实数据密度和 smoke 仍待实现验证 | `docs/design/frontend-experience-brief.md`、`docs/design/frontend-interaction.md`、后续视觉 / 文案规范 | 静态评审条件通过 / 待实现 smoke | 待首个 slice 任务与 UI smoke |
| OI-005 | 2026-07-11 / 2026-07-14 | `docs/06-db-design.md:193`、`docs/07-api-spec.md:202`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:122` | Phase2 核心 5 项的 DB / API 契约是否补齐 | 已按 Batch B 为 REQ-012 / 014 / 025 / 026 / 027 补字段级 DB、endpoint contract、错误码、权限、迁移 / seed / 回滚关注点和 TC 草案；建议后续评审首个 vertical slice | `03` Phase2 进入标准要求 06/07 MVP 级契约齐备；Batch B 已补 `06/07/09` 草案，但尚未实现 / 评审 | 只执行首个 vertical slice 契约评审；或继续补 P2 后续项 | 草案可支撑实现前评审；仍需确认首个 slice、迁移策略和自动化测试，未实现前不得标记 Phase2 Go | Phase2 后端 / API / DB 实现前 | 契约阻塞已缓解；实现仍阻塞 P2 后端、API、DB 交付 | `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/09-verification.md`、对应 `tasks/*` | 契约草案已回填 / 待评审 | 2026-07-14 Batch B 已补 P2 核心 5 项 DB / API / TC 草案；待用户评审与实现任务 |
| OI-006 | 2026-07-11 | `docs/research/2026-07-11-phase2-upgrade-evaluation.md:29`、`docs/research/2026-07-11-phase2-upgrade-evaluation.md:35`、`docs/03-prd.md:82` | Phase2 是否先做 tech-env-evaluation | 建议保留 `docs/research/2026-07-14-tech-env-evaluation-phase2.md` 作为草案输入；提交或回填前先与 Batch B 契约对齐 | Phase2 交付物为 MVP，门禁严于 Demo；真实依赖触发技术环境评估要求；当前 tech-env 文件已标注为未跟踪草案 | 仅对第一个实现切片做最小评估；或暂缓涉及新依赖的功能 | 草案可降低后续依赖风险，但不能替代 open-items 校准、Batch B、UI / WSG 门禁或 Phase2 升级评估 | Phase2 设计补强后、06/07 契约前或首个相关 Sprint 前 | 条件阻塞 Phase2 Go 判断；不阻塞 Batch B 契约补齐 | `docs/research/2026-07-14-tech-env-evaluation-phase2.md`、`docs/05-tech-spec.md`、`docs/09-verification.md` | 草案已生成 / 未提交 | 已有未跟踪草案；待 Batch B 后决定是否提交与回填 |
| OI-007 | 2026-07-14 | `docs/09-verification.md:132`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:132` | 是否补 `09` 风险表的 RG-ID / Risk-ID 追溯列 | 建议补齐 RG-ID / Risk-ID 与 TC 的双向映射 | `05` 已声明待 `09` 补风险映射；审计报告将其列为 Phase2 前门禁之一 | 暂缓到 Phase2 前；或只补 Phase2 相关行 | 不补会降低 readiness gate 可审计性；补齐成本较低 | Phase2 启动前 / 风险评审前 | 条件阻塞 readiness gate 审计 | `docs/09-verification.md` §6、必要时同步 `docs/05-tech-spec.md` | 已回填草案 | 2026-07-14 Batch A 已补 `09` Risk-ID / RG / Gate 列；仍待后续评审 |
| OI-008 | 2026-07-10 / 2026-07-14 | `docs/03-prd.md:83`、`docs/09-verification.md:140`、`docs/09-verification.md:141`、`docs/09-verification.md:118` | 真实 PDF / Word 解析与 OCR 是否纳入 Phase2 MVP 口径 | 建议维持草案结论：PDF 导出 / 真实 PDF 解析 / OCR 未验证前不得编码对应能力；首个 vertical slice 暂避这些依赖 | P1 已明确 `.md` / `.txt` 降级通过；Phase2 MVP 需真实上线，REQ-009/010 真实化按 MVP 口径评估；tech-env 草案显示 RG-006 / RG-003 仍未解 | 将真实解析 / OCR 延后到后续 Phase；或只做真实 Word / PDF，不做 OCR | 纳入会增加依赖与资源风险；延后可降低 MVP 复杂度但影响导入完整性 | Phase2 范围冻结前 / MVP 验收口径定义前 | 阻塞无条件 MVP / 生产级结论，不阻塞 P1 或 Batch B | `docs/03-prd.md` §3、`docs/05-tech-spec.md`、`docs/09-verification.md`、P2 tech-env-eval | 草案已记录风险 / 待验证 | 待人工确认、依赖安装 / 导入 / 最小运行验证与正式回填 |
| OI-009 | 2026-07-14 | `docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:123`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:142` | 早期 `docs/design/*` 是否按新版 design-doc 最小补结构 | 建议按语义最小补齐上游追溯、契约、失败 / 降级、待确认项结构，不机械重写历史事实 | 审计发现部分早期子系统设计缺新版结构；不影响 P1，但影响 Phase2 回梳质量 | 暂缓到相关模块改动前；或只补 Phase2 会触达的设计文档 | 补齐可提升追溯性；一次性全补会增加文档成本 | Phase2 涉及对应模块前 | 不阻塞 P1，条件影响 Phase2 回梳 | `docs/design/ingestion.md`、`docs/design/permissions.md`、`docs/design/term-management.md`、`docs/design/intelligence-analysis.md` | 待确认 | 待文档回填 |
| OI-010 | 2026-07-14 | `sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:117`、`sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:127`、`docs/research/2026-07-14-docs-system-audit-post-v1.51.0.md:133` | 是否归档 4 个已被 v1.50 / v1.51 覆盖的 UI / Web 模板提案 | 建议归档到 `_archive/proposals/` 并更新归档 README | 同步记录已确认这些提案被 v1.50 / v1.51 覆盖或替代采纳 | 保留到下次模板同步；或只在 `_proposals/README.md` 标记已覆盖 | 不影响业务门禁；归档可降低后续治理噪声 | 后续治理整理时 | 不阻塞 Phase2 | `_archive/proposals/`、`_archive/proposals/README.md`、必要时 `_proposals/README.md` | 待确认 | 待用户确认后归档提交 |

## 4. 门禁结论

- **Phase1 / Demo：Go 倾向**。P1 主链、Sprint-1..10 完成包和 TC 证据基本闭合；真实 PDF / OCR 作为后续阶段项，不构成 P1 Demo 阻塞。
- **Phase2 UI / MVP：No Go**。未关闭 `OI-001` 至 `OI-008` 前，不应切换 Phase 指针，不应启动对应编码任务。
- **可先行文档工作：Conditional Go**。可以先按 Batch A / B 做最小文档回梳：补 WSG、UI-G、Phase2 进入标准、smoke 证据路径、P2 DB/API 契约与 09 风险映射。
- **Tech-env 草案：仅作输入材料**。`docs/research/2026-07-14-tech-env-evaluation-phase2.md` 已存在并标注为未跟踪草案；它不关闭 open-items、UI / WSG 门禁或 Phase2 进入条件。
- **治理清理：Go**。`OI-010` 可独立执行，不影响业务阶段，但需另行确认文件移动与归档 README 更新。

## 5. 回填建议

| 优先级 | 回填范围 | 目标 | 对应 OI |
|---|---|---|---|
| P1 | `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`docs/design/frontend-interaction.md` | 补 WSG、UI-G、Phase2 进入标准和 smoke 证据路径 | OI-001 / OI-002 / OI-003 / OI-007 |
| P1 | `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/09-verification.md` | 已补 Phase2 核心 5 项字段 / API / 错误 / 权限 / TC 草案；后续评审首个 vertical slice 与实现任务 | OI-005 |
| P1 | `docs/research/2026-07-14-tech-env-evaluation-phase2.md`、`docs/05-tech-spec.md`、`docs/09-verification.md` | 已生成 tech-env 草案；后续需按 Batch B 契约与用户确认拆分回填 RG / Risk / TC，不直接写成已闭环事实 | OI-006 / OI-008 |
| P2 | `docs/design/ingestion.md`、`docs/design/permissions.md`、`docs/design/term-management.md`、`docs/design/intelligence-analysis.md` | 按新版 design-doc 最小补齐结构 | OI-009 |
| P2 | `_archive/proposals/`、`_archive/proposals/README.md` | 归档已被模板 v1.50 / v1.51 覆盖的本地提案 | OI-010 |

## 6. 建议执行顺序

1. 本报告继续作为 Phase2 前置 open-items 总览使用；本次已校准 Batch A、tech-env 草案与未执行门禁状态。
2. Batch A 已回填：`04/05/08/09/frontend-interaction` 已补 WSG + UI-G + smoke 证据路径草案；TC-P2-WSG-001 与 TC-P2-UI-001~005 仍未执行。
3. Tech-env 草案已生成：`docs/research/2026-07-14-tech-env-evaluation-phase2.md` 仅作依赖风险输入，尚未提交，后续随 Batch B / 正式回填范围再决定是否纳入提交。
4. Batch B 已回填：`docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/09-verification.md` 已补 P2 核心 5 项 DB / API / TC 契约草案；仍需用户评审。
5. UI / WSG 门禁已完成静态评审：TC-P2-WSG-001 与 TC-P2-UI-001~005 条件通过；首个 Phase2 vertical slice 建议 `REQ-012 + REQ-026` 标签 + 内链 / 反链最小闭环。
6. 下一步为首个 slice 开实现任务前评审：明确迁移、API、前端入口、测试 / smoke 命令和不做范围。
7. 复跑 Phase2 升级评估；全部阻塞项关闭或被人工风险接受后，再切 `ai/project-rules.md` 当前阶段指针并创建首个实现任务。

## 7. 需要用户立即确认的问题

1. 是否认可 `OI-001` 的处理方式：继续不切 Phase 指针、不直接编码，先关闭 Batch B 与 UI / WSG 门禁。
2. 是否认可 Batch B 契约草案作为后续实现前评审基线。
3. 是否认可首个 Phase2 vertical slice 优先选择 `REQ-012 + REQ-026`（标签视图 + 内链 / 反向链接最小闭环），并据此开后续实现任务评审。
4. 是否同意暂避 PDF 导出、真实 PDF 解析、OCR 与完整 AI 润色，等依赖验证 / 契约补齐后再进入实现。
