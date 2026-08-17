# TEMPLATE-UPGRADE：图表生成式镜像目录——docs/diagrams/ + docs/tables/ + 索引 + CI 同步校验

> 来源：LUMEN-DEMO（emily8421/LUMEN-DEMO）派生项目回流
> 提案日期：2026-08-17
> 目标文件：`ai/document-lifecycle-rules.md`（§5 生成矩阵旁 / §13 图表规范附注）、`docs/README.md` scaffold（子目录分区表）、`template-docs/`（可选附脚本样例 `scripts/extract-diagrams.*`）
> 状态：**已提交模板维护者**——issue [#358](https://github.com/emily8421/ai-project-template/issues/358)（2026-08-17 开，OPEN，等维护者 triage）；本文件留作审计底稿，**勿重复提交**

## 1. 动机

文档体系的图（mermaid / plantuml）与核心表（REQ / MOD / API / TC 矩阵）**埋在长文档正文里**。审计 / 评审者要「逐图逐表过一遍」时，只能翻几百行正文定位——无法单点查阅、无法按方法论阶段通览图纸、无法一眼盘点「体系里到底有多少图」。派生项目 LUMEN 实证：44 张图散在 15 份文档中，用户提出「除保留在文档里以外，抽出到专门目录 + 图表索引供审核」的明确需求。

关键设计问题：抽出 = 双份存在，如何不产生双源漂移？三种做法：

| 方案 | 漂移风险 | 阅读流 | 判定 |
|---|---|---|---|
| 手工复制双维护 | 必漂移（图 + 表数十份，改一处忘另一处） | 好 | 否决 |
| 搬出式（图只存目录，正文留链接） | 无 | 差（GitHub markdown 无嵌入语法，读正文要跳转，破坏「图表服务于表达」） | 否决 |
| **生成式镜像** | 无（过期即 CI 红，重跑脚本即恢复） | 好（正文完整 + 审核独立入口） | **采纳** |

## 2. 拟改（可选机制，Full 剖面项目建议启用）

1. **`docs/diagrams/` 镜像目录**：脚本从文档正文（唯一权威源）抽取全部 fenced mermaid / plantuml 图块，每图一文件（图块 + 源锚点 + 阶段 / 类型 / 追溯 / 渲染方式元数据）+ `INDEX.md`——索引按方法论阶段分组（需求分析 / 概要设计 / 详细设计 / 实现）+ 按文档反查，作为**审核主入口**。
2. **`docs/tables/` 镜像目录**：核心矩阵表（REQ 主表 / 覆盖矩阵 / MOD / API 清单 / TC 矩阵 / RG 等）同样抽取成单文件 + `INDEX.md`。**表分两档**：
   - 镜像抽取档：稳定核心矩阵（变更频率 = 需求 / 设计变更频率）；
   - 原位登记档：增量日志型（08 Sprint 完成包、09 验收记录）**只挂章节锚点链接不抽镜像**——每次验收都更新，抽了必过期。
3. **抽取脚本（模板附样例）**：manifest 驱动——每图 / 每表登记「源文档 + 块序号 / 章节锚点 → 输出文件名 + 元数据」；新增图先落源文档再登记 manifest。`--check` 模式供 CI：逐文件比对 + 孤儿文件（目录有但 manifest 无 = 更名 / 删除残留）检测。
4. **CI 同步校验（启用前提）**：轻量 workflow 步骤 `node scripts/extract-diagrams.* --check`，镜像与源不一致即红。**未启用 CI 校验的项目建议不建镜像目录**（过期镜像误导审核，比没有更糟）——此约束写入机制说明。
5. **`docs/README` scaffold 分区表登记**：两个新子目录标注「生成式产物、不手改、脚本再生成」，与既有「根目录只放 00-09」规则衔接（镜像目录是子目录，不占编号）。
6. **表索引不新增 TBL-ID 命名空间**：表用「文档 + 章节锚点」定位，避免全文档表格编号改动；图沿用既有 `DIAG-*` ID 作镜像文件名。

## 3. 与既有规则关系（去重）

- `document-lifecycle-rules §13` 图表规范管「正文里图怎么写」（格式 / 图 ID / 四维度）——本提案管「图抽出后怎么放」（镜像 / 索引 / 同步），**内容层 vs 分发层**，正交。
- 与同批 `TEMPLATE-UPGRADE-doc-system-oo-diagrams.md`（OO 图纸要求）正交：那份管「该有哪些图型」，本提案对**任何图**（含既有架构 / ER / 流程图）做镜像分发，两者可独立采纳（只要 OO 图纸、不要镜像目录 = 可行；反之亦然）。
- 与 `TEMPLATE-UPGRADE-back-sync-placement-audit.md`（反向同步落点约束）相邻但不同：E6 落点约束管「实现证据落在哪个**权威文档**层」；本提案的镜像目录是**审核视图**（非权威源，头部声明「以源文档为准」），不构成第二落点。
- `docs/README` 既有分区规则（§5 子目录表）——本提案新增两行登记，不改变既有分区。
- 表原位登记档与「08 进度摘要 / 09 验收记录是活文档」的既有定位一致，不为镜像冻结它们。

## 4. 版本影响与影响面

- 改动：`ai/document-lifecycle-rules.md`（机制说明，建议 + 可选）+ `docs/README.md` scaffold（分区表 + 机制说明）+ `template-docs/` 附脚本样例（`scripts/extract-diagrams.mjs`，项目按语言 / 结构改写）。
- 版本：MINOR bump。
- 兼容性：纯可选机制；既有项目不强制启用；Lean / 小工具剖面建议豁免（图少，镜像不值）。

## 5. 验证方式

- `scripts/check-template.sh` 自检通过。
- 行为验证（维护者侧人工复核口径）：启用项目改源文档图后不重跑脚本，CI `docs-mirror` 步骤应变红；重跑后恢复绿。LUMEN 实证：`scripts/extract-diagrams.mjs`（manifest 44 图 + 20 表），本地「生成 → check PASS → 再生成 → check PASS」幂等三验 + CI 首跑通过（PR #198 project-check 含新步骤）。

## 6. 备选方案与取舍

- **维持现状（图只在正文）**：审核动线差——LUMEN 用户明确提出抽出需求，跨项目通用（任何 Full 剖面项目都有审核场景）。
- **手工双维护**：漂移必现，否决（见 §1 表）。
- **搬出式**：破坏正文阅读流 + GitHub 无嵌入语法，否决。
- **全量表抽取（含日志型）**：08/09 每次验收都 churn 镜像，脚本输出不稳定，CI 红噪音——本提案选「核心矩阵抽 + 日志型挂锚点」两档。
- **图表平台（结构化图库 / Wiki）**：引入外部工具依赖，与「git 内文本文档」体系不符，否决。

## 7. LUMEN 实证样例（供维护者参考）

- 脚本：`scripts/extract-diagrams.mjs`（66 输出文件 = 44 图 + 20 表 + 双 INDEX）
- 图索引：`docs/diagrams/INDEX.md`（OO 五阶段分组 + 按文档反查）
- 表索引：`docs/tables/INDEX.md`（镜像抽取 20 + 原位登记 2）
- CI：`project-check.yml` `Check docs diagrams/tables mirror sync` 步骤
- 方案与裁决：`docs/research/2026-08-17-oo-coverage-evaluation-and-diagram-mirror-plan.md` §2
