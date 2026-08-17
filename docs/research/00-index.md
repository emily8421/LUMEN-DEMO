# docs/research 调研与审计索引

> 定位：本文是 `docs/research/` 的目录索引，登记内部审计、技术评估、输入评审、原型探索和实现前研究记录。它不是权威规格，不替代 `docs/00-09`、`docs/design/*` 或 `docs/decisions/*`。
> 首版建立于 2026-07-21（P1 文档治理）。本首版重点精确登记 2026-07-20 新输入归位；历史 research 文件只做目录级索引，采纳状态未逐条复核。

## 1. 当前重点

| 文件 | 类型 | 状态 | 采纳 / 后续 |
|---|---|---|---|
| `2026-08-17-docs-evaluation-template-alignment-02-04.md` | 文档体系模板对齐评估（02/04/03 对照 Doc_ref NRDC1101 模板） | 已落盘；**评估已确认，调整执行中（02→04→03→README，每文件汇报）** | 三核心节点（需求规格=02 / 概要=04 / 详细=06/07/design）均有承载；02/04 补引用式概述章、02 剥离 REQ 实现方案、03 维持 + 精简重复、README 补节点映射 |
| `2026-08-17-docs-evaluation-oo-methodology-03-04.md` | 03/04 对照 OO 方法论文档审计（缺图纸 + 阶段错置） | 已落盘；**只读评估 · 待人工确认 AUD-C-001..006 后执行修改实例** | 结论 Conditional Go；Batch 1（用例图 + 领域模型）/ Batch 2（03/04 收敛 + 出错处理节 + 概要级交互图）待执行；§8 去项目化判定已形成 TEMPLATE-UPGRADE 提案方向（回流模板前置证据） |
| `2026-08-10-ai-code-governance-framework.md` | AI 基于文档体系编码的分层治理框架 | 已落盘；**AI 建议 · 待人工确认与模板化** | 建议采用 R1-R7 七层路由 + 自动化执行平面；现有 Web 全栈提案作为 Profile 实证输入，回流前需做全局 / Profile / Adapter 去重分类 |
| `2026-08-10-code-constraint-framework.md` | 代码规范 L0-L3 内容稳定性分层与模板载体映射 | 已落盘；**方法论草案 · 已形成两份待回流提案** | 与七层治理文档互补：L0-L3 判断规则内容放哪，R1-R7 判断任务执行时加载什么；关联 L0 通用原则与 Web 全栈一致性提案 |
| `2026-08-10-code-governance-rollout-plan.md` | 代码治理体系落地实施计划（三轨道并行 + P0 先行 + ratchet） | 已落盘；**活文档 · P0 方案已联合裁决定稿（A1/B1）· 待立项编码** | 前置 PR #123 已 merge；§3 P0-1/P0-2 已按评估修订定稿（4 PG 面 / guard 落 pg_test_support.py / CI advisory→required / eslint 暂缓 P1 / 拟定 NFR-005/006 + v3.8.0）；§8 进度表跨会话续接 |
| `2026-08-10-p0-engineering-governance-plan-evaluation.md` | P0 测试数据库安全 + CI 最小门实施方案评估 | 已落盘；**Conditional Go · 裁决已采纳，方案已并入 rollout §3 定稿** | 原方案方向正确但需修订：覆盖四个 PG 测试面、guard 不得被 SkipTest 吞掉、unit/build required、Ruff advisory、NFR-005/006 + 双 Task 追溯——均已纳入 rollout §3 定稿 |
| `2026-08-10-rule-consolidation-map.md` | 三套规则清单（L0 12条 + web-fullstack §9 + assessment TQG 15条）去重 + R1-R7 归位对照 | 已落盘；**整合产物 · 待人工确认回流形态** | 以 governance R1-R7 为骨架归位；标注重叠合并点；指出 assessment 独有 R4 候选（test DB/事务/scoped query）尚无提案 |
| `2026-08-10-code-quality-maintainability-assessment.md` | 前后端代码质量、可读性与可维护性评估 | 已落盘；**只读评估 · 待人工确认治理范围** | P0 建议先处理测试数据库隔离与最小 CI；模板规则候选见报告 §7。已起草 web-fullstack §9 + L0 基线 2 提案（governance §8.3 建议回流前按 R1/R3/R5 重构）；三套清单去重见 rule-consolidation-map |
| `2026-07-30-docs-system-audit-post-v1.59.0.md` | 模板同步后文档体系审计 | 已执行；Phase1.5A / Phase2A 状态回写已落盘 | Phase1.5B / Phase2B 与项目验证仍待后续确认 |
| `2026-08-05-req018-vault-feasibility-evaluation.md` | REQ-018 Vault 兼容可行性评估 | 已落盘；模式 A 导入链路已交付、模式 B 零代码 | 模式 B 待 RG-009 PoC + 阶段升级（待用户决策） |
| `2026-07-20-inputs-architecture-review.md` | 输入评审 + 架构评估 | P0 已采纳并提交 v0.2.4；P1 归位已完成；OB-01 已形成 ADR-010 | OB-02/05 需编辑器 Spike |
| `2026-07-20-doc-system-architecture-evaluation.md` | 文档体系内部评估 | 已从 `docs/inputs/` 归位 | P1 采纳索引 / references 分区建议；`kb-*` 迁移建议因仓库无对应文件不执行 |
| `2026-07-20-obsidian-design-reference-suggestions.md` | 基于外部参考的内部建议 | 已从 `docs/inputs/` 归位 | OB-01 原文不直接采纳，以 ADR-010 为准；OB-06 可后续回填 PRD |
| `2026-07-21-format-conversion-input-review.md` | 文档格式转换输入评审 | 当前 AI 评审已落盘；Conditional Go | 原始输入保留在 `docs/inputs/2026-07-21-doc-format-conversion-requirements.md`；FC-01/02/03/04 需逐项确认后再回填正式文档 |
| `2026-08-05-rg009-vault-local-mount-poc.md` | RG-009 Vault PoC 验证（REQ-018 模式 B） | 已落盘；**Go**（八项能力 + 五场景通过，刷新后句柄自动恢复 granted） | 待用户决策是否进入 REQ-018 阶段升级（不在本次落盘范围） |
| `2026-08-07-term-domain-tree-analysis.md` | 术语管理领域树增强分析（输入材料评审 + 设计 + 实施计划草案） | 已落盘；**AI 评估 · 待人工确认** | TM-C-001..007 确认后回写 02/03/06/07/08/09 与 term-management.md，再独立编码 |
| `2026-08-12-frontend-eslint-b1-assessment.md` | 前端 ESLint B1 引入前现状评估（规模/质量基线/文件膨胀/工具链） | 已落盘；**只读评估 · 待人工确认治理范围** | 为 ESLint B1 方案设计提供实证；候选 ESLINT-C1..C5（规则集 / advisory·required / prettier / 存量基线 / CI job）待方案设计拍板 |
| `2026-08-12-backend-mypy-b1-assessment.md` | 后端 mypy B1 引入前现状评估（覆盖度/工具链/首跑基线 190/§3 根因/价值兑现） | 已落盘；**只读评估 · 待人工确认治理范围** | 为 mypy B1 方案设计提供实证；首跑基线 190 error（§3 optional-import 簇 120 主导 + current_space_id None 传播 45 + reportlab 缺 stub 8 + 真实 bug ~17）；Slice A advisory 起步 / Slice B 清零升 required 候选待立项 |

## 2. 历史 research 清单

| 文件 | 主题 | P1 索引状态 |
|---|---|---|
| `2026-07-19-app-tsx-refactor-plan.md` | App.tsx 重构计划 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-system-completion-audit.md` | 系统完成度审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-requirements-00-03-route-audit.md` | 需求链路审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-overall-design-04-05-audit.md` | 总体设计审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-15-detailed-design-06-07-design-audit.md` | 详细设计审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-tech-env-evaluation-phase2.md` | Phase2 技术环境评估 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-docs-system-audit-post-v1.51.0.md` | 模板同步后文档体系审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-14-docs-open-items.md` | 文档待确认项汇总 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-ui-prototype-exploration.md` | UI 原型探索 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-lumen-frontend-design-exploration.md` | 前端设计探索 | 历史留痕，未在本轮逐条复核 |
| `2026-07-13-frontend-ui-reference-analysis.md` | 前端 UI 参考分析 | 历史留痕，未在本轮逐条复核 |
| `2026-07-11-*` | Phase2 / 前端 / 04-05 / 需求链系列评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-10-docs-evaluation-requirements-stage.md` | 需求阶段评估 | 历史留痕，未在本轮逐条复核 |
| `2026-07-09-*` | Phase1 技术环境复评、pgvector 影响评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-08-docs-system-audit-post-v1.43.0.md` | 模板同步后文档体系审计 | 历史留痕，未在本轮逐条复核 |
| `2026-07-06-*` | 模板提案审计批次、Sprint-6 smoke、文档模板审计 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-04-*` | Phase1 技术环境 / React 选型评估 | 批量历史留痕，未在本轮逐条复核 |
| `2026-07-03-docs-evaluation-vision-to-design.md` | 愿景到设计阶段评估 | 历史留痕，未在本轮逐条复核 |
| `prototypes/*.html` | 探索期 HTML 原型证据 | 原型证据，引用关系见 `docs/design/00-index.md` |

## 3. 维护规则

- 新增 research 文档时，登记类型、状态和被采纳 / 待确认去向。
- 内部审计、输入评审、Spike、技术评估留在 `docs/research/`。
- 外部产品 / 方法论 / 第三方资料放入 `docs/references/`，避免与本项目结论混淆。
