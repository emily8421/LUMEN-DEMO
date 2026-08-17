# TEMPLATE-UPGRADE：文档体系可选 OO 建模 overlay——用例图 / 领域模型 / 概设交互图

> 来源：LUMEN-DEMO（emily8421/LUMEN-DEMO）派生项目回流
> 提案日期：2026-08-17
> 目标文件：`ai/doc-standards/00-scenario.md` ~ `02-srs.md`、`ai/doc-standards/04-architecture.md`、`ai/doc-standards/design-doc.md`、`ai/document-lifecycle-rules.md` §13
> 状态：待提交模板维护者（跨仓 issue）

## 1. 动机

模板的 `ai/doc-standards/*` 与 `template-docs/docs-scaffold/*` **无任何用例图 / 类图 / 领域模型要求**（全仓 0 处）。派生项目 LUMEN 按模板产出 Full 剖面文档体系，对照 OO 方法论（需求获取→需求分析→概要设计→详细设计）审计发现：需求分析层的**用例图、领域模型完全缺失**，概要设计的**概设类图、交互图**仅零星覆盖——REQ 链可追溯但不可视、不可按用例评审边界，实体概念直接从需求落到物理表（06），缺少概念层过渡。

实证：LUMEN `docs/00-09 + design/*` 现有 10+ 张 mermaid 图（架构 / ER / 顺序 / 状态 / 流程），但用例图与领域模型一张都没有；用户对照行业模板与 OO 方法论明确期望「规范图纸」。

## 2. 拟改（最小增量，建议 + 可选，不强制）

1. **需求层 OO 建模（可选）**：`ai/doc-standards/00-scenario.md` ~ `02-srs.md` 增「OO 建模 overlay」——建议 Full 剖面产品级项目在需求分析层补：
   - 用例全景图 `DIAG-UC-*`：参与者 + 用例域 + 挂 REQ 追溯；
   - 领域模型 `DIAG-DOM-*`：核心实体 + 关联 + 关键属性（**概念层，非物理表**），作为 06 物理表的「概念上游」。
2. **概要设计交互图 / 类图（可选）**：`ai/doc-standards/04-architecture.md` 增概要级交互图（顺序图 / 协作图，消息级不写 endpoint）+ 可选概设类图要求。
3. **详细类图（可选）**：`ai/doc-standards/design-doc.md` 增详细类图要求（非平凡子系统）。
4. **用例图格式指引**：`ai/document-lifecycle-rules.md` §13 增「**用例图用 plantuml**」——mermaid 无原生用例图语法（无椭圆用例 / 火柴人 actor / `<<include>>` 语义），规范 UML 用例图只能用 plantuml `usecase` 表达；GitHub 不原生渲染 plantuml，需本机 / CI 预览，故作为指定图型的明确指引而非默认格式。
5. 全部新图挂 §13 已有图纸审核四维度（可渲染 / 图 ID `DIAG-*` / 可追溯挂 REQ→MOD→Flow / 覆盖异常·降级·权限路径）。

**性质**：「建议 + 可选」而非强制——不要求所有项目凑齐 OO 图纸（与 §13「图表服务于表达」一致）；但 Full 剖面产品级项目建议启用，Lean / 小工具可豁免并在 `project-rules §3` 说明。

## 3. 与既有规则关系（去重）

- `document-lifecycle-rules §13` 已定义设计文档图表规范与图纸审核四维度——本提案**复用四维度**，只补「缺哪些图型」与「用例图→plantuml」指引，不新增规范框架。
- `global-rules §8` 阶段双维度 / `doc-standards` REQ 追溯链——新图挂既有 `REQ→F-ID→Phase` 链，不引入新 ID 体系。
- 与 `template-docs/web-fullstack-profile.md`（App Shell / WSG）正交：WSG 管代码结构门禁，本提案管文档图纸，互不重复。

## 4. 版本影响与影响面

- 只改 `ai/doc-standards/00-02`、`04-architecture.md`、`design-doc.md` + `ai/document-lifecycle-rules.md §13`；同步清单内文件。
- 版本：MINOR bump（doc-standards 新增可选用图要求）；派生项目下行同步后生效。
- 兼容性：纯增量；既有项目不强制回补图，新 Full 剖面项目从骨架期即可选用。

## 5. 验证方式

- `scripts/check-template.sh` 自检通过（无断言变化，预期绿）。
- 行为验证（维护者侧人工复核口径）：模板仓任一 Full 剖面新项目生成需求阶段文档时，可选用用例图 / 领域模型；模板仓可用 LUMEN 已落地实例（`docs/00-scenario.md §3.4 DIAG-UC-01` plantuml、`docs/06-db-design.md §0.5 DIAG-DOM-01` mermaid classDiagram）作为样板参考。

## 6. 备选方案与取舍

- **不扩展，维持现状**：派生项目继续产出无 OO 图纸的文档——已被 LUMEN 实证为不满足「规范图纸」期望，且图纸缺口跨项目通用。
- **强制所有项目出全 OO 图纸**：过度治理，与 §13「图表服务于表达、不凑齐所有图」冲突；本提案选「建议 + 可选」。
- **用例图用 mermaid flowchart 近似**：符号非标准（无椭圆 / 火柴人 / include-extend 语义），已由 LUMEN 试点后放弃改用 plantuml；本提案直接写 plantuml 指引。
