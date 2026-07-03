# LUMEN 文档评估报告：愿景到总体设计

> 本报告为项目文档评估记录，覆盖 `docs/vision/product-vision.md` → `docs/00-03` → `docs/04-05`。
> 评估日期：2026-07-03
> 报告类型：阶段评估 + 单文档摘要；不直接修改 00-09 主链文档。

## 1. 评估摘要

| 项 | 结论 |
|---|---|
| 总体结论 | 文档链路总体健康，可进入 Sprint-1 编码前准备 |
| ???? Sprint-1 | ??? `REQ-001 / REQ-002 / REQ-003` ????????P0 ??????? |
| 主要优点 | 阶段边界清楚，愿景不直接驱动开发，P1 / P2 / 愿景分层明确 |
| 主要短板 | 部分文档偏清单化，缺用户操作流、完整 REQ 覆盖矩阵、关键流程图、安全隐私控制表 |
| 最高风险 | 权限过滤一致性、OCR 降级验收、LLM / Mock 验收边界、术语管理 P1 复杂度 |
| ?????? | `03` ????? `04` ?????????? P1 / P2 ???? |

## 2. 评估范围与依据

### 2.1 评估范围

| 阶段 | 文档 |
|---|---|
| 愿景输入 | `docs/vision/product-vision.md` |
| 工程场景 | `docs/00-scenario.md` |
| 用户需求 | `docs/01-user-requirements.md` |
| 系统需求 | `docs/02-srs.md` |
| 产品路线图 | `docs/03-prd.md` |
| 总体设计 | `docs/04-architecture.md`、`docs/05-tech-spec.md` |

本次不覆盖 `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/design/*`、`docs/08-dev-plan.md`、`docs/09-verification.md` 的详细评估；仅在判断总体设计可行性时引用其存在性和下游承接关系。

### 2.2 评估依据

- 文档生命周期规则：`ai/document-lifecycle-rules.md` 要求文档链路可追溯、阶段分离、下游不得引入上游未授权内容。
- 项目阶段边界：`ai/project-rules.md` §1 定义当前为 Phase1 Demo。
- 文档分区规则：`docs/README.md` 要求根目录只放 00-09，评估报告应进入子目录。
- 当前文档事实：`docs/00-scenario.md:3` 明确场景从愿景抽取，`docs/03-prd.md:4` 明确 §3 是阶段标签唯一来源。

## 3. 整体评估

### 3.1 完整性

整体完整性较好：愿景、场景、用户需求、SRS、PRD、架构和技术方案均已存在，且均带文档元信息。

- `docs/00-scenario.md:17` 起覆盖背景，`docs/00-scenario.md:27` 起覆盖目标用户，`docs/00-scenario.md:37` 起覆盖典型场景。
- `docs/01-user-requirements.md:20` 起列出 P1 用户需求，`docs/01-user-requirements.md:38` 起列出 P2，`docs/01-user-requirements.md:55` 起列出远期愿景。
- `docs/02-srs.md:16` 起列出 P1 可验证系统需求，`docs/02-srs.md:80` 起提供 U-ID → REQ-ID 追溯矩阵。
- `docs/03-prd.md:37` 起提供阶段 × 交付物形态总览。
- `docs/04-architecture.md:16` 起提供总体架构图，`docs/04-architecture.md:73` 起提供 REQ / 功能 → 模块追溯矩阵。
- `docs/05-tech-spec.md:15` 起明确技术栈与版本，`docs/05-tech-spec.md:65` 起说明运行环境与资源评估。

缺口：`01` 缺用户操作流与用户验收口径，`03` 缺独立 REQ 覆盖矩阵，`04` 缺关键流程与数据流章节，`05` 缺结构化安全、隐私与合规控制表。

### 3.2 合理性

整体合理性较高：文档能体现“先 Demo 跑核心闭环，再 MVP，再产品愿景”的演进思路。

- `docs/03-prd.md:32` 明确先以 Demo 跑通核心价值闭环，再进入 MVP。
- `docs/03-prd.md:43` 起定义 Phase1 目标为双空间隔离、三级权限、导入、检索、问答、编辑、术语对齐闭环。
- `docs/03-prd.md:64` 起列出 Phase1 非目标，防止愿景功能进入当前阶段。
- `docs/04-architecture.md:47` 至 `docs/04-architecture.md:51` 将 P2 / 愿景能力保留为骨架，没有误写成 P1 已设计。

需要修正的合理性问题：`docs/03-prd.md:25` 使用 “P0 / P1 / P2” 表示优先级，同时项目又使用 `[P1] / [P2]` 表示阶段，后续沟通存在混淆风险。

### 3.3 可行性

Phase1 Demo 可行性基本成立。

- `docs/05-tech-spec.md:23` 固定 pgvector HNSW 和 512 维 Embedding 参数。
- `docs/05-tech-spec.md:24` 明确 LLM 走 OpenAI 兼容接口，Embedding 本机运行 `BAAI/bge-small-zh-v1.5`。
- `docs/05-tech-spec.md:27` 明确 OCR 可降级。
- `docs/05-tech-spec.md:48` 明确 Demo Bearer Token、空间切换 token 和权限校验方式。
- `docs/05-tech-spec.md:69` 明确本机 Demo 可运行，`docs/05-tech-spec.md:72` 给出资源软上限。

主要可行性风险集中于 OCR、LLM / Mock、术语识别和权限过滤一致性。它们不阻塞 Sprint-1，但应在对应 Sprint 前补充更硬的验收边界。

### 3.4 追溯性

追溯链总体成立。

- 愿景场景覆盖索引在 `docs/vision/product-vision.md:800` 起提供功能来源集合。
- `docs/01-user-requirements.md:15` 标明输入来源为 `00` 与愿景场景覆盖索引。
- `docs/02-srs.md:11` 标明输入来源为 `00/01`，并在 `docs/02-srs.md:80` 起提供 U-ID → REQ-ID 追溯矩阵。
- `docs/03-prd.md:10` 标明输入来源为 `01/02/project-rules`，并在 `docs/03-prd.md:19` 至 `docs/03-prd.md:21` 汇总 U / REQ 阶段归属。
- `docs/04-architecture.md:73` 起将 REQ 映射到模块与下游设计。

缺口：PRD 层缺一张完整的 REQ 覆盖矩阵，当前只在功能范围摘要和阶段路线图中体现。

## 4. 阶段评估：愿景 → 需求

### 4.1 合规项

- 愿景作为输入而非开发事实：`docs/00-scenario.md:3` 说明本文从愿景叙事抽取，`docs/00-scenario.md:50` 明确愿景不直接驱动开发。
- 用户需求完整承接愿景索引：`docs/01-user-requirements.md:3` 说明完整用户期望功能清单源自愿景场景覆盖索引。
- 阶段标签已前置：`docs/01-user-requirements.md:6` 定义 `[P1] / [P2] / [愿景]`，避免愿景直接混入本期。
- P1 能力选择合理：空间隔离、权限、文档管理、搜索、RAG、导入、OCR、桌面访问、术语管理构成可演示闭环。

### 4.2 问题项

| 优先级 | 问题 | 影响 |
|---|---|---|
| P1 | `01` 缺用户操作流 | 业务方难以从用户旅程角度确认需求是否完整 |
| P1 | `01` 缺逐项用户验收口径 | 验收口径主要下沉到 `02/09`，用户需求层可读性不足 |
| P2 | 部分远期需求合并过粗 | 升阶段时需拆分，否则无法独立验收 |

### 4.3 可行性判断

愿景 → 需求转换可行。P2 / 愿景能力被保留为骨架，当前没有明显愿景越界进入 P1 的问题。

## 5. 阶段评估：需求 → 总体设计

### 5.1 合规项

- 架构覆盖 P1 主要模块：`docs/04-architecture.md:40` 起列出空间与权限、文档管理、内容导入、检索问答、术语管理等 P1 子系统。
- 设计保留阶段边界：`docs/04-architecture.md:47` 起将标签视图、协作推送、存量接入、情报分析、情报交付标为 P2 / 愿景骨架。
- 技术方案支撑 P1：`docs/05-tech-spec.md:43` 起说明 pgvector、AI adapter、导入流水线、RAG、术语口径注入、鉴权与错误码。
- 资源与降级策略可支撑 Demo：`docs/05-tech-spec.md:69` 起明确本机 Demo 可行性、资源上限、Mock / 降级和服务器预案。

### 5.2 问题项

| 优先级 | 问题 | 影响 |
|---|---|---|
| P0 | `04` 缺鉴权 / 空间切换 / 权限过滤关键流程图 | Sprint-1 实现空间权限时容易出现入口遗漏 |
| P1 | `04` 缺导入索引与 RAG 问答统一数据流 | 后续导入、检索、问答实现可能各自理解不一致 |
| P1 | `05` 缺结构化安全隐私控制表 | 真实文档、外部 LLM、日志脱敏和审计策略不够硬 |
| P1 | Mock / 降级验收边界不够明确 | Demo 验收时可能对“可演示”与“真实可用”产生争议 |

### 5.3 可行性判断

需求 → 总体设计基本可行。Sprint-1 可以启动，但建议先补最小权限流程图，确保空间、文档权限、搜索、RAG 上下文过滤的一致实现。

## 6. 单文档评估摘要

| 文档 | 结论 | 建议 |
|---|---|---|
| `docs/vision/product-vision.md` | 场景丰富，覆盖索引可作为需求来源 | 保持为输入材料，不直接驱动开发 |
| `docs/00-scenario.md` | 工程场景摘要清晰，目标用户和典型场景足够 | 可在后续补“场景边界与非目标”独立小节 |
| `docs/01-user-requirements.md` | U-ID 清单完整，阶段标签清楚 | 增加用户操作流和用户验收口径 |
| `docs/02-srs.md` | P1 可验证，U→REQ 追溯完整 | 升阶段时拆粗粒度远期 REQ |
| `docs/03-prd.md` | 阶段路线图清楚，非目标有效 | 增加完整 REQ 覆盖矩阵，避免 P0/P1/P2 优先级命名混淆 |
| `docs/04-architecture.md` | 模块划分和追溯矩阵有效 | 增加关键流程与数据流，优先补权限流程 |
| `docs/05-tech-spec.md` | 技术基线和资源可行性已钉住 | 增加安全隐私控制表和 Mock / 降级验收边界 |

## 7. 问题清单与优先级

| 优先级 | 问题 | 建议落点 | 是否阻塞 Sprint-1 |
|---|---|---|---|
| P0 | ??????? | `docs/04-architecture.md` | ????2026-07-03? |
| P0 | PRD ??? REQ ???? | `docs/03-prd.md` | ????2026-07-03? |
| P1 | 用户需求缺操作流 | `docs/01-user-requirements.md` | 不阻塞，但影响业务评审 |
| P1 | 安全隐私控制表缺失 | `docs/05-tech-spec.md` | 不阻塞 Sprint-1，需在真实文档导入前处理 |
| P1 | Mock / 降级验收边界不硬 | `docs/05-tech-spec.md`、`docs/09-verification.md` | 不阻塞 Sprint-1，需在 RAG / OCR Sprint 前处理 |
| P2 | 远期合并 REQ 过粗 | `docs/02-srs.md` | 不阻塞，升阶段时处理 |

## 8. P0 ??????

| ?? | ? | ???? |
|---|---|---|
| 2026-07-03 | `docs/03-prd.md` REQ ???? | ??? `## 4. REQ ????`??? REQ-001..036 ?????????????? |
| 2026-07-03 | `docs/04-architecture.md` ???? | ??? `## 5. ?????????`????? / ?????????????RAG ?????? |

## 8. 修复建议与后续动作

1. Sprint-1 ?????????`docs/03-prd.md` ?? REQ ?????`docs/04-architecture.md` ???? / ???? / ???????
2. 需求评审增强：补 `docs/01-user-requirements.md` 用户操作流，覆盖 Kira 入职、Alice 切空间、私有文档隔离、术语问答。
3. 技术风险前置：补 `docs/05-tech-spec.md` 安全隐私控制表，明确外部 LLM 发送策略、日志脱敏、敏感级别、Mock 标识。
4. 验收边界收紧：在进入 RAG / OCR Sprint 前补充 Mock、OCR 降级和固定夹具验收口径。
5. 模板回流：将本次“文档评估报告需要落盘”沉淀为模板提案，见 `_proposals/TEMPLATE-UPGRADE-docs-evaluation-mechanism.md`。

## 9. 待人工确认项

- 是否在 Sprint-1 前立即修订 `docs/03-prd.md` 与 `docs/04-architecture.md`。
- 文档评估报告是否作为后续阶段升级前的固定入口。
- Mock / OCR 降级在 Demo 验收中的通过口径是否接受“固定夹具可演示”。
