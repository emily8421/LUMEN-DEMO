# OO 方法五阶段覆盖度评估 + 图表镜像方案（一稿）

> 本方案为评估留痕与执行计划，按 `ai/document-lifecycle-rules.md` §2 写入 `docs/research/`。它不替代 `docs/00-09` 正式修订；实施按 §5 分批推进，每批经确认后落回正式文档 / 代码。
> 状态：**方案已确认（用户 2026-08-17「全部执行，按 A1→A2→B→C 顺序走」）**。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-08-17 |
| 触发 | 用户要求：以《软件系统面向对象开发方法的过程要点及关系》五阶段产物矩阵（阶段 × 核心图 / 模型 × 核心文档）与 `docs/references/Doc_ref-md/` 模板大纲为指导依据，评估 LUMEN 文档体系覆盖度、补齐缺失文档 / 图 / 模型；并提出新需求——图表除保留在文档内以外，抽出到专门目录并给出索引供审核；最终目的是将改动回流项目模板方法论 |
| 指导依据 | ① `docs/references/软件系统面向对象开发方法的过程要点及关系.md`（五阶段 + ①~⑩ 转换关系）② `docs/references/Doc_ref-md/`（15 份模板 md 转换件：需求规格 / 概要设计 / 设计说明 / 系统测试 / 编码规范等） |
| 现状基线 | main `569248f`（PR #193/#194 收口后）：OO 方法论改造步骤①-④已完成（用例图 / 领域模型 / 概设类图 / 4 份详细类图 / 02/04 概述章对齐 / 00-09 审核 P1+P2 全部完成）；步骤⑤回流模板未提交 |
| 关联文档 | 前序评估：`2026-08-17-docs-evaluation-oo-methodology-03-04.md`（G1-G7 缺口 / M1-M5 错放）、`2026-08-17-docs-system-oo-methodology-redesign.md`（图纸体系设计 / REDESIGN-C-001..004） |
| 结论 | 大框架已闭合；剩余缺口 4 类（需求获取层显式映射 / 详细类图 4-of-12 / 状态图仅 1 处 / 类代码规格无专文）+ 2 个小尾巴（06 ERD 无图 ID、Doc_ref-md 未入库）；图表镜像采用**生成式镜像**方案（文档内为唯一权威源，脚本抽取生成镜像目录 + 索引，CI 校验同步） |

## 1. 五阶段 × LUMEN 现状对照矩阵

> 对照指导依据①的阶段产物表逐格评估。✅ = 已覆盖；⚠️ = 实质有但需补显式映射 / 部分覆盖；❌ = 缺失。

| OO 阶段 | 期望产出 | LUMEN 承载 | 状态 | 本方案动作 |
|---|---|---|---|---|
| 需求获取与说明 | 项目策划说明书 | 无直接对应；实质分散：立项叙事=`docs/vision/product-vision.md`、可行性=`docs/research/*`（tech-env-evaluation 等）、开发计划=`08-dev-plan.md` | ⚠️ | A3：README 登记显式映射表，不新建文档 |
| 〃 | 用户需求说明书 | `01-user-requirements.md`（U-ID + 来源锚点 + 验收口径） | ✅ | — |
| 〃 | ERD（需求级 / 概念） | 概念模型 `DIAG-DOM-01`（06 §0.5）实质承载概念 ERD 职责但未声明；物理 ERD 在 06 §4 但**无图 ID** | ⚠️ | A2：补声明行 + `DIAG-DB-ER-01` 图 ID |
| 〃 | 事物-事件表（E-E 表） | 无（AUD-C-004 / REDESIGN-C-004 已裁决不回补：需求定稿、维护态） | ❌ | A7：维持不回补 + 00 §3.4 登记方法论偏差 |
| 需求分析 | 分析阶段类图 | `DIAG-DOM-01`（02 §0.3 已声明「分析类图性质」） | ✅ | — |
| 〃 | 用例图 | `DIAG-UC-01`（00 §3.4，plantuml 规范用例图） | ✅ | — |
| 〃 | 软件需求规格说明书 | `02-srs.md`：§0.1-0.6 概述章与 Doc_ref「需求规格模板」第 1-7 章逐章对应（引言 / 任务概述 / 数据描述 / 功能需求 / 性能 / 运行 / 其它） | ✅ | — |
| 概要设计 | 概设阶段类图 | `DIAG-CLS-PRELIM-01`（04 §1.2.2，后端四层关键类） | ✅ | — |
| 〃 | 交互图（顺序图） | `DIAG-ARCH-SEQ-01/02`（04 §5.6，消息级无 endpoint） | ⚠️ 仅 2 张 | A8：补 SEQ-03/04（AI 润色、批量导入） |
| 〃 | 概要设计规格说明书 | `04-architecture.md`：§0.2 需求概述、§5.5 出错处理、§5.6 交互图、§5.7-5.10 接口 / 数据结构 / 安全 / 维护——与 Doc_ref「概设模板」9 章逐章对应 | ✅ | — |
| 详细设计 | 详细阶段类图 | 4 份：`DIAG-CLS-AUTH/INGEST/RAG/PERM-01`（design/* §0.5）；8 个子系统未补 | ⚠️ 4/12 | A4：补 5 份（term / folder / export / polish / ai-assistant）+ 2 份豁免登记（timeline 逻辑薄、intelligence-analysis 愿景骨架） |
| 〃 | 活动 / 状态图 | flowchart 13 份 design 全有；**stateDiagram 仅 1 处**（ai-polish）；无 activityDiagram | ⚠️ | A5：补 4 个核心状态机（ImportJob / DocExport / AiDraft / Session） |
| 〃 | 详细设计规格说明书 | `06`（数据契约 + ERD）+ `07`（接口契约 + 时序图）+ `design/*`（统一含「职责→流程→契约→类图→降级→验收→偏差」，对应 Doc_ref「设计说明模板」第 4 章构件逐个设计） | ✅ | — |
| 〃 | （Doc_ref 附加）数据词典 | 06 §2 表结构 = 字段级数据词典实质等价；无 DFD 四类条目（LUMEN 走 OO 非 SA，不需要 DFD） | ✅ | — |
| 实现 | 类代码 | `backend/` + `frontend/`（已实现并反向同步） | ✅ | — |
| 〃 | 类代码规格说明书 | 无专文；内容分散在 `05 §4.2` 编码基线 + `project-rules §5` + `design/frontend-design-system.md` | ⚠️ | A6：05 §4.2 头部加定位声明 + 映射清单（维持 G7 不新建文档裁决） |
| 验证（Doc_ref 系统测试说明书） | 测试目标 / 环境 / 用例 | `09-verification.md`：测试策略 / REQ→TC 矩阵（153 TC）/ 资源验证 / 验收记录 | ✅ | — |

图纸总量：现存 33 张（04 内 9 + design 19 + 06 ERD 2 处 + 00 plantuml 1 + 05 1 + 07 1）+ 本方案新增 11 张 ≈ **44 张**。

## 2. 图表镜像方案（生成式镜像）

### 2.1 需求与关键决策

用户需求：核心图 / 表除保留在文档内以外，抽出到专门目录 + 图表索引，供查阅审核。

三种做法对比（关键：文档内 + 目录 = 双份存在，如何不产生双源漂移）：

| 方案 | 做法 | 漂移风险 | 阅读流 | 结论 |
|---|---|---|---|---|
| ① 手工复制 | 图表复制到目录，双处手维护 | 必漂移（44 图 + 数十表） | 好 | ❌ 不可取 |
| ② 搬出式 | 图只存目录，文档内留链接 | 无 | 差（GitHub markdown 无嵌入语法，读 04 要跳转） | ❌ 不建议 |
| ③ **生成式镜像（采纳）** | 文档内图表 = 唯一权威源不动；脚本从文档抽取生成镜像目录 + 索引；CI 校验同步 | 无（过期即 CI 红，再生成即恢复） | 好（文档完整 + 审核独立入口） | ✅ |

`docs/diagrams/`、`docs/tables/` 定位为**产物目录**（generated），不是第二权威源——与 CI build 产物同性质。审核动线：从索引进，逐图 / 逐表一个文件。

### 2.2 目录与索引设计

```text
docs/
├─ diagrams/                      # 新增子目录（生成式镜像，脚本产出，不手改）
│  ├─ INDEX.md                    # 图索引（审核主入口，按 OO 五阶段组织 + 按文档反查）
│  ├─ DIAG-UC-01.md               # 每图一文件：小标题 + 源锚点 + mermaid/plantuml 块
│  ├─ DIAG-DOM-01.md
│  ├─ DIAG-ARCH-01.md …
│  └─ DIAG-CLS-*.md …（含 Batch A2 新增 11 张）
└─ tables/                        # 新增子目录（同样生成式）
   ├─ INDEX.md                    # 核心表索引
   └─ <doc>-<matrix>.md …（按「文档-矩阵名」命名）
```

图索引按 OO 五阶段分组（需求分析 / 概要设计 / 详细设计 / 实现 / + 需求获取），列：图 ID / 类型 / 源文档（章节锚点）/ 追溯 / 渲染方式（mermaid = GitHub 原生 ✓；plantuml = 需本机预览）。另设「按文档反查」视图。

表索引**不新增 TBL-ID 命名空间**（避免全文档编号改动），用「文档 + 章节锚点」定位。表分两档：

- **镜像抽取**（核心矩阵，脚本复制成单文件，约 20 张）：00 角色 / 场景 / 映射表、01 总览 / 追溯、02 REQ 主表 / NFR、03 §3 路线图 / §4 覆盖矩阵、04 COMP / MOD / Flow / 追溯、05 依赖 / RG、06 表清单 / 表结构 / 追溯、07 接口清单 / 交叉追溯、09 REQ→TC 矩阵。
- **原位登记**（日志型不抽镜像，只挂索引链接）：08 Sprint 完成包、09 §5 验收记录——增量日志，抽镜像每次验收都 churn。

### 2.3 落地件与防漂移

| 件 | 说明 |
|---|---|
| `scripts/extract-diagrams.mjs` | manifest 驱动（登记每图 / 每表的源文档 + 章节 → 输出文件）；抽出 fenced mermaid / plantuml 块与指定章节表格，生成镜像 + 双 INDEX；风格对齐既有 `scripts/check-frontend-css.mjs` |
| CI 同步校验 | `project-check.yml` 加轻量 job（paths 过滤 `docs/**`）：抽取到临时目录 + `git diff --quiet`，镜像过期即红。仓库 public，Actions 免费无配额 |
| `docs/README.md` §5 | 登记两个新子目录（生成式产物、不手改、脚本再生成）；目录约定随 Batch C 回流模板 |
| plantuml 说明 | DIAG-UC-01 镜像文件在 GitHub 显示为代码块（非渲染图），索引「渲染」列标注——既有限制，非本次引入 |

## 3. 与模板回流的联动

图表镜像机制是可通用方法论改进，新增第 7 份提案 `TEMPLATE-UPGRADE-diagrams-tables-mirror.md`（生成式镜像目录 + 图表索引约定 + CI 同步校验模式），与既有 6 份一并跨仓提交；`doc-system-oo-diagrams.md` 并入本批新结论（概念 ERD 映射 / 状态图族 / ERD 图 ID 合规 / 类代码规格映射），INDEX 同步。

## 4. 待确认项裁决记录

| ID | 待确认项 | 裁决 | 备注 |
|---|---|---|---|
| C-101 | 抽出方式 | 生成式镜像（方案③） | 用户确认「全部执行」 |
| C-102 | 表分两档（核心矩阵抽镜像 / 日志型只挂索引） | 采纳 | 避免验收记录 churn |
| C-103 | 表索引不新增 TBL-ID 命名空间 | 采纳 | 用章节锚点定位 |
| C-104 | CI 加镜像同步校验 job | 采纳 | public 免费，零成本 |
| C-105 | E-E 表维持不回补 | 维持（A7 登记偏差） | 历史裁决一致 |
| C-106 | 执行顺序 A1→A2→B→C，3 PR + 1 提交流程 | 采纳 | 用户确认 |

## 5. 执行计划（已确认）

| 批 | 内容 | 明细 | PR |
|---|---|---|---|
| **A1** | 登记收尾（贴标签） | A1 `Doc_ref-md/` 入库 + `references/00-index.md` 登记 + `docs/README.md` 三核心节点表引用路径改 md 版；A2 06 §4 ERD 挂 `DIAG-DB-ER-01` + §0.5 概念 ERD 映射行；A3 README 需求获取层文档映射表；A6 05 §4.2 类代码规格说明书等价物声明；A7 00 §3.4 E-E 偏差登记 | 1 个 PR（小） |
| **A2** | 补 11 张图（补果子） | A4 详细类图 5 份（term-management / folder-tree / export-delivery / ai-polish / ai-assistant，各 §0.5 `DIAG-CLS-TERM/FOLDER/EXPORT/POLISH/AI-01`）+ timeline / intelligence-analysis 豁免登记（00-index）；A5 状态机 4 份（ImportJob / DocExport / AiDraft / Session stateDiagram，放对应 design/*）；A8 04 §5.6 补 `DIAG-ARCH-SEQ-03/04`（AI 润色、批量导入） | 1 个 PR（中） |
| **B** | 图表镜像（建展厅） | `scripts/extract-diagrams.mjs` + `docs/diagrams/` + `docs/tables/` 双镜像 + 双 INDEX + README §5 登记 + CI job | 1 个 PR（中） |
| **C** | 回流模板（回娘家） | A9 更新 `doc-system-oo-diagrams.md` + INDEX + 新增第 7 份提案 + 按 submit-proposal 跨仓提交 `emily8421/ai-project-template` | 提交流程 |

顺序理由：先贴标签（A1）、补齐图（A2），再建展厅（B）——脚本一跑抽出的是全套最新图，不返工；最后回流（C）。

## 6. 验证方式

- A1/A2：新增图过 `document-lifecycle-rules §13` 四维度（可渲染 / 图 ID / 可追溯 / 覆盖异常路径）；diff 复核无既有内容丢失。
- B：脚本本地跑通 + 镜像文件数与 manifest 一致 + CI job 在干净树上绿。
- C：提案头部带来源标识（`> 来源：LUMEN-DEMO（emily8421/LUMEN-DEMO）派生项目回流`）+ 跨仓 issue 提交成功回执。
