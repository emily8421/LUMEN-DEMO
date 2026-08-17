# 回流提案总览（TEMPLATE-UPGRADE 索引）

> 本文件汇总 LUMEN-DEMO（emily8421/LUMEN-DEMO）待回流 `ai-project-template` 的 TEMPLATE-UPGRADE 提案：说明**整体意图**、主题分组、每份改模板的什么、优先级。提交走 `ai/commands/submit-proposal.md`（跨仓 issue）。
> 建立：2026-08-17。提案状态随提交 / 采纳更新。

## 1. 整体目标

把模板的文档体系改造成「**适配 OO 开发方法 + 可读可导航 + 根目录分类**」，使派生项目按模板初始化后：

- **五阶段有图纸**：需求获取 → 需求分析 → 概要设计 → 详细设计 → 实现，每阶段有对应图纸（用例图 / 领域模型 / 概设交互·类图 / 详细类图），图纸驱动编码实现；
- **阶段不串味**：需求 / 概要层不混入实现细节——反向同步有落点约束、文档评估有阶段归属审计；
- **骨架齐全**：需求规格 / 概要设计 / 详细设计有完整章节骨架（引用式概述章），README 有三核心节点定位；
- **根目录可读**：按「模板继承 / 项目自身 / 本地临时」三大区分类，标注来源。

## 2. 主题分组（本次文档体系工作，4 份）

### 主题 A · 图纸体系

| 提案 | 改模板的什么 | 优先级 |
|---|---|---|
| `doc-system-oo-diagrams.md` | `doc-standards/00-02`、`04`、`design-doc` 增可选 OO 建模 overlay（用例图 `DIAG-UC-*` / 领域模型 `DIAG-DOM-*` / 概设交互·类图）+ `document-lifecycle-rules §13` 增「用例图用 plantuml」指引 | 中 |

### 主题 B · 阶段分离机制

| 提案 | 改模板的什么 | 优先级 |
|---|---|---|
| `back-sync-placement-audit.md` | `document-lifecycle-rules §2` E6 补「反向同步落点约束」（实现证据落 09/design/CHANGELOG，不倒灌 00-05）+ `19-docs-evaluation.md` 增「阶段归属审计」维度 | 中 |

### 主题 C · 文档骨架与目录

| 提案 | 改模板的什么 | 优先级 |
|---|---|---|
| `doc-overview-skeleton-alignment.md` | `doc-standards/02`、`04`、`00-05` 增引用式概述章（引言 / 任务 / 数据 / 性能 / 运行 / 接口 / 数据结构 / 安全 / 维护）+ 元信息「当前状态」精简口径 + scaffold README 三核心节点定位 | 低（低风险先做） |
| `root-directory-organization.md` | `global-rules §5` 补目录分类框架 + 来源标注；模板根目录方法论文档归 `methodology/`（2.1，MAJOR 单独评估）；派生项目 README 模板加「项目结构」三大区说明 | 低（2.2）/ 后（2.1） |

## 3. 之前独立提案（不同主题，一并提交）

| 提案 | 主题 | 改模板的什么 |
|---|---|---|
| `pitfall-legacy-code-trigger.md` | pitfall 触发口径扩展（存量 AI 代码问题登记） | `session-rules §4.3` |
| `stack-adapters-fastapi-react.md` | Stack Adapter（R5）—— FastAPI / Python + React / TS | 新建 `template-docs/stack-adapters/` |

## 4. 边界与去重

- **A（图纸）vs C（骨架）**：A 管「图」，C 管「章节」，互补不重复。
- **B（落点审计）vs A（图纸）**：B 管「机制 / 审计」，A 管「图纸」，互补。
- **C 内（根目录 vs 骨架对齐）**：根目录管「根层分类」，骨架对齐管「docs 内章节」，互补。
- 全部提案不新增需求 / 表 / 接口 / 验收目标，只改模板方法论 / 规范 / 目录结构。

## 5. 提交建议

- **独立提案提交**（模板维护者偏好逐个 triage）；本总览供维护者理解整体意图与边界。
- **顺序建议**：低风险先（C 骨架对齐 / 根目录 2.2）→ 中（A 图纸 / B 落点审计）→ 单独评估（根目录 2.1 MAJOR + 旧提案一并）。
- **提交方式**：`ai/commands/submit-proposal.md`（跨仓 issue，`emily8421/ai-project-template`；每份头部已带来源标识与去项目化声明）。
