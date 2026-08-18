# 回流提案总览（TEMPLATE-UPGRADE 索引）

> 本文件汇总 LUMEN-DEMO（emily8421/LUMEN-DEMO）待回流 `ai-project-template` 的 TEMPLATE-UPGRADE 提案：说明**整体意图**、主题分组、每份改模板的什么、优先级与**提交状态**。提交走 `ai/commands/submit-proposal.md`（跨仓 issue）。
> 建立：2026-08-17。**2026-08-17 提案审查校准**：逐份对照模板仓 issue 实况，修正 2 份失实状态（#350 / #334 实际已提交）、并入 Batch A1/A2 图纸结论、新增第 7 份（图表镜像）。

## 1. 整体目标

把模板的文档体系改造成「**适配 OO 开发方法 + 可读可导航 + 图表可审核 + 根目录分类**」，使派生项目按模板初始化后：

- **五阶段有图纸**：需求获取 → 需求分析 → 概要设计 → 详细设计 → 实现，每阶段有对应图纸（用例图 / 领域模型 / 概设交互·类图 / 详细类图 / 状态图），图纸驱动编码实现；
- **阶段不串味**：需求 / 概要层不混入实现细节——反向同步有落点约束、文档评估有阶段归属审计；
- **骨架齐全**：需求规格 / 概要设计 / 详细设计有完整章节骨架（引用式概述章），README 有三核心节点定位 + 五阶段产物映射；
- **图表可审核**：图 / 核心表从正文抽出为生成式镜像目录 + 索引（CI 校验同步），审核有独立动线；
- **根目录可读**：按「模板继承 / 项目自身 / 本地临时」三大区分类，标注来源。

## 2. 主题分组（文档体系工作，5 份）

### 主题 A · 图纸体系

| 提案 | 改模板的什么 | 优先级 | 状态 |
|---|---|---|---|
| `doc-system-oo-diagrams.md` | doc-standards `00-02`、`04`、`06`、`design-doc` 增可选 OO 建模 overlay（用例图 / 领域模型 / 概设交互·类图 / 详细类图 / **状态图族 / ERD 图 ID 合规 / 五阶段产物映射表**）+ `document-lifecycle-rules §13` 增「用例图用 plantuml」指引 | 中 | **已提交 [#354](https://github.com/emily8421/ai-project-template/issues/354)（2026-08-17，OPEN）——勿重复提交** |

### 主题 B · 阶段分离机制

| 提案 | 改模板的什么 | 优先级 | 状态 |
|---|---|---|---|
| `back-sync-placement-audit.md` | `document-lifecycle-rules §2` E6 补「反向同步落点约束」（实现证据落 09/design/CHANGELOG，不倒灌 00-05）+ `19-docs-evaluation.md` 增「阶段归属审计」维度 | 中 | **已提交 [#355](https://github.com/emily8421/ai-project-template/issues/355)（2026-08-17，OPEN）——勿重复提交** |

### 主题 C · 文档骨架与目录

| 提案 | 改模板的什么 | 优先级 | 状态 |
|---|---|---|---|
| `doc-overview-skeleton-alignment.md` | doc-standards `02`、`04`、`00-05` 增引用式概述章（引言 / 任务 / 数据 / 性能 / 运行 / 接口 / 数据结构 / 安全 / 维护）+ 元信息「当前状态」精简口径 + scaffold README 三核心节点定位 | 低（低风险先做） | **已提交 [#356](https://github.com/emily8421/ai-project-template/issues/356)（2026-08-17，OPEN）——勿重复提交** |
| `root-directory-organization.md` | `global-rules §5` 补目录分类框架 + 来源标注；模板根目录方法论文档归 `methodology/`（2.1，MAJOR 单独评估）；派生项目 README 模板加「项目结构」三大区说明 | 低（2.2）/ 后（2.1） | **已提交 [#357](https://github.com/emily8421/ai-project-template/issues/357)（2026-08-17，OPEN）——勿重复提交** |
| `directory-partition-principles.md` | `global-rules §5` 补「代码目录划分依据」五条通用原理（部署边界 / 架构分层 / 特性纵切 / 契约单源 / 生命周期）+ web-fullstack-profile §4 依据→推荐树映射；与 #357 正交（#357 管根目录，本份管代码目录内部分层维度） | 低 | **草稿（2026-08-18，待审定后提交）** |

### 主题 D · 图表审核动线（2026-08-17 新增）

| 提案 | 改模板的什么 | 优先级 | 状态 |
|---|---|---|---|
| `diagrams-tables-mirror.md` | 生成式镜像目录机制：`docs/diagrams/` + `docs/tables/` + manifest 驱动抽取脚本（附样例）+ 双 INDEX（图按阶段分组 / 表分两档）+ CI `--check` 同步校验；`docs/README` scaffold 分区登记 | 中 | **已提交 [#358](https://github.com/emily8421/ai-project-template/issues/358)（2026-08-17，OPEN）——勿重复提交** |

## 3. 之前独立提案（不同主题）

| 提案 | 主题 | 改模板的什么 | 状态 |
|---|---|---|---|
| `pitfall-legacy-code-trigger.md` | pitfall 触发口径扩展（存量 AI 代码问题登记） | `session-rules §4.3` | **已提交 issue [#350](https://github.com/emily8421/ai-project-template/issues/350)（2026-08-13，OPEN）——勿重复提交** |
| `stack-adapters-fastapi-react.md` | Stack Adapter（R5）—— FastAPI / Python + React / TS | 新建 `template-docs/stack-adapters/` | **已提交 issue [#334](https://github.com/emily8421/ai-project-template/issues/334)（2026-08-12，OPEN）——勿重复提交** |

## 4. 边界与去重（2026-08-17 审查校准）

- **A（图纸）vs C-骨架（章节）**：A 管「图」，C 管「章节」，目标文件重叠但改动面不同，互补不重复；独立 triage（审查时评估过合并，否决：绑定「是否要 OO 图纸」与「骨架对齐」两个独立决策）。
- **A（图纸）vs D（镜像）**：A 管「文档内该有哪些图」（内容层），D 管「图抽出后怎么放」（分发层），可独立采纳。
- **B（落点审计）vs D（镜像）**：B 管「实现证据落哪个权威文档层」，D 的镜像是审核视图（非权威源、头部声明以源为准），不构成第二落点。
- **C 内（根目录 vs 骨架对齐）**：根目录管「根层分类」，骨架对齐管「docs 内章节」，互补。
- 全部提案不新增需求 / 表 / 接口 / 验收目标，只改模板方法论 / 规范 / 目录结构。

## 5. 提交建议

- **独立提案提交**（模板维护者偏好逐个 triage）；本总览供维护者理解整体意图与边界。
- **顺序建议**：低风险先（C 骨架对齐 / 根目录 2.2）→ 中（A 图纸 / B 落点审计 / D 镜像）→ 单独评估（根目录 2.1 MAJOR）。
- **勿重复提交**：#350 / #334 已在模板仓 OPEN（见 §3 状态列）。
- **提交方式**：`ai/commands/submit-proposal.md`（跨仓 issue，`emily8421/ai-project-template`；每份头部已带来源标识与去项目化声明）。

## 6. 待提交清单（Batch C 执行口径）

本次跨仓提交 5 份（A / B / C×2 / D）；提交后各提案头部状态行同步更新为对应 issue 号，INDEX §2-§3 状态列跟进。
