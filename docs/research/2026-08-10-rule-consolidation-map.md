# 三套代码规则清单去重与 R1-R7 归位对照

> 定位：**整合产物**。把三套独立起草的代码规则清单按 governance R1-R7 上位框架去重归位，给出统一的回流形态建议。本表是 governance §8.3 / §14.3（提案重构）与 §10（回流晋升）的执行输入。
>
> 上位框架：`2026-08-10-ai-code-governance-framework.md`（R1-R7）。
> 内容分层：`2026-08-10-code-constraint-framework.md`（L0-L3）。
> 诊断基线：`2026-08-10-code-quality-maintainability-assessment.md`（TQG 来源）。
>
> 来源：两套 AI 独立处理同一主题（LUMEN 代码规范回流）的产物汇合；差异源于独立起草，本表负责去重与归位，非新增规则。

## 1. 三套清单来源

| 清单 | 载体 | 条目数 | 分层视角 | 起草会话 |
|---|---|---:|---|---|
| **L0 通用原则** | `_proposals/TEMPLATE-UPGRADE-global-rules-l0-code-principles.md` §2.1 | 12 | L0 跨形态通用 | 本会话 |
| **§9 代码层一致性** | `_proposals/TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` §9（5 组） | ~21 | L1+L2 混合（含通用/Web/栈） | 本会话 |
| **TQG 工程护栏** | `2026-08-10-code-quality-maintainability-assessment.md` §7 | 15 | 未分层（MUST/SHOULD） | 配套会话 |

合计 ~48 条；去重后约 **30 条独立规则**。

## 2. 按 R1-R7 分组的去重对照

> 来源标记：`L0-n` = L0 第 n 条；`§9.x` = §9 该组；`TQG-nnn` = assessment TQG。「合并」列标注重复条目。

### R1 全局质量宪章（跨项目通用底线）

| 规则 | 来源 | 合并 / 说明 |
|---|---|---|
| 命名传达意图 / 命名反映真实语义 | L0-1, §9.5 | **合并**（同一原则） |
| 单一职责 | L0-2 | governance §3.5 模块化 |
| 一致性优先（新代码对齐既有） | L0-3 | governance 贯穿 |
| 失败必须可见（禁静默吞） | L0-4, §9.4, TQG-013 | **合并**（失败可见 + 静默 catch 须注释） |
| 不重复 DRY / 三次法则 | L0-5 | |
| 显式优于隐式（禁魔法值） | L0-6 | |
| 对外信息最小化（禁 str(exc) 泄露） | L0-7, §9.1, TQG-013 | **合并**（错误不泄露内部细节） |
| 可测试性（逻辑与副作用分离） | L0-8 | 兼入 R2 Gate |
| Repository Protocol / 模块化 | §9.2, TQG-007 | **合并**（多实现须显式契约） |
| 注释卫生（过程史不入代码） | TQG-014 | assessment 独有，governance §3.3 |

### R2 实现生命周期 Gate（编码前/中/后）

| 规则 | 来源 | 合并 / 说明 |
|---|---|---|
| 变更最小与可追溯 | L0-9 | |
| 先契约后实现 | L0-12 | |
| CI 必跑 test+type+lint | §9.4, TQG-003 | **合并** |
| 质量命令矩阵（项目声明命令） | TQG-002 | assessment 独有 |
| 测试分层 + 契约序列化回归 | §9.4 | 兼入 R3 |
| changed-file ratchet（新代码不扩大债） | TQG-010 | assessment 独有，governance §7.3 |

### R3 项目形态 Profile（Web / CLI / 库 / 数据）

| 规则 | 来源 | 合并 / 说明 |
|---|---|---|
| 单一业务码命名空间（envelope code 语义） | §9.1 | |
| 兜底 5xx envelope | §9.1 | 兼 R1 失败可见 |
| 结构化客户端错误（ApiError，不靠文案） | §9.1, TQG-004 | **合并** |
| 单源类型（response_model / OpenAPI codegen） | §9.3, TQG-009 | **合并** |
| HTTP 单出口（禁裸 fetch） | §9.5 | 兼 R6（LUMEN `client.ts`） |
| 阈值覆盖 repository / smoke（不只 App/service） | TQG-011 | assessment 独有 |
| E2E 共享 harness（禁复制 CDP driver） | TQG-012 | assessment 独有 |

### R4 技术风险 Concern Pack（跨形态按风险触发）⚠️ assessment 主要贡献

| 规则 | 来源 | 说明 |
|---|---|---|
| 测试数据库隔离（破坏性 SQL 须 test 库 + guard） | TQG-001 | **P0**，本会话评估漏；governance §5.2 示例 |
| scoped repository query（用户态查询带 actor/space） | TQG-005 | 越权防护，assessment 独有 |
| 多步写用例事务边界（UoW，repository 不独立 commit） | TQG-006 | 数据完整性，assessment 独有 |
| 强依赖 fail-fast / readiness 真实 | TQG-008 | 可靠性，assessment 独有 |

### R5 技术栈 Adapter（FastAPI / React / PG 具体写法）

| 规则 | 来源 | 说明 |
|---|---|---|
| service 禁 import web 框架（抛领域异常） | §9.2 | FastAPI Adapter |
| 集中 code→HTTP 映射 + envelope helper | §9.1 | FastAPI Adapter |
| 批量装配循环化（router 列表注册） | §9.2 | |
| import 收敛顶部 | L0-10, §9.2 | **合并**（L0 意识 + Adapter 具体执行） |
| 禁 any + 泛型贯穿 + ReturnType | §9.3 | React/TS Adapter |
| service 参数类型化（Repository Protocol 标注） | §9.3 | |
| 配置集中 Settings + 启动校验 secret | §9.4 | 兼 R6 |
| 日志统一禁 print | §9.4 | 兼 R1 可观测 |
| 体量克制（具体阈值） | L0-11 | 意识在 R1，阈值在 R3 §5 |

### R6 项目专属基线（LUMEN 选择结果）

| 规则 | 来源 | 说明 |
|---|---|---|
| 读可直连 repository / 写必走 service 约定 | §9.2 | 已落 `project-rules §5` |
| HTTP 出口具体路径（`api/client.ts`） | §9.5 | 已落 `project-rules §5.2` 禁区 |
| 端点后缀统一 | §9.5 | |
| LUMEN envelope / 表前缀 / 不引状态库 | `docs/05 §4.2` + `project-rules §5` | 已落地（R6 实例） |

### R7 任务契约

三套清单均未细化到 R7（governance §4.7 / §6.1 独有「任务局部契约」）。回流时由 governance R7 承载，本表不重复。

## 3. 必须合并的重叠点

| 主题 | 重复条目 | 合并后归属 |
|---|---|---|
| 错误不泄露内部细节 | L0-7 + §9.1 禁 msg + TQG-013 | R1 |
| CI 必跑 test/type/lint | §9.4 + TQG-003 | R2 |
| 多实现 Protocol | §9.2 + TQG-007 | R1 + R5 |
| 结构化 ApiError | §9.1 + TQG-004 | R3 + R5 |
| response_model/codegen | §9.3 + TQG-009 | R3 + R5 |
| 命名反映语义 | L0-1 + §9.5 | R1 |
| 失败可见 / 静默 catch | L0-4 + §9.4 + TQG-013 | R1 |
| import 卫生 | L0-10 + §9.2 | R1 + R5 |

## 4. 各清单独有贡献（不可丢）

- **assessment 独有**（本会话评估 + §9 提案均未覆盖，价值最高）：TQG-001 test DB 隔离（P0）、TQG-005 scoped query、TQG-006 事务边界、TQG-008 fail-fast、TQG-010 ratchet、TQG-011 阈值覆盖、TQG-012 E2E harness、TQG-014 注释卫生、TQG-015 依赖审计。
- **L0 独有**（纯通用原则）：L0-2 单一职责、L0-5 DRY、L0-6 显式优于隐式、L0-9 变更可追溯、L0-12 先契约后实现。
- **§9 独有**（Web/栈特化）：§9.1 envelope 形态、§9.2 service 禁 web 框架、§9.3 禁 any/ReturnType。

## 5. 建议的统一回流形态

去重后约 30 条独立规则，按 R1-R7 回流，**不再以三个独立提案名义**（避免 governance §14.3 担心的"混合/重复"）：

| R 层 | 合并后规则来源 | 回流载体 | 现状提案 |
|---|---|---|---|
| **R1 / R2 通用** | L0 12 条 + §9 通用部分（CI/secret/错误不泄露）+ TQG-002/003/010/014 | `global-rules §2` + `implementation-lifecycle-rules` Gate | L0 提案（B）+ web-fullstack 提案拆出的 R1/R2 部分 |
| **R3 Web Profile** | §9.1/§9.3/§9.5 Web 部分 + TQG-004/009/011/012 | `web-fullstack-profile` | web-fullstack 提案拆出的 R3 部分 |
| **R4 Concern Pack** ⚠️ | TQG-001/005/006/008（assessment 主贡献） | 新建 `concerns/`（DB 事务/删除 + Auth） | **无现成提案**——最高优先新建 |
| **R5 Stack Adapter** | §9.1/§9.2/§9.3/§9.4 栈具体部分 | 新建 `stack-adapters/`（FastAPI / React） | web-fullstack 提案拆出的 R5 部分 |
| **R6 LUMEN 基线** | §9.2/§9.5 项目部分 + §4.2/§5 | `project-rules §5` + `docs/05 §4.2` | 已落地 |

## 6. 衔接 governance 的提案重构方向

- **web-fullstack §9 提案**（governance §8.3 要求重构）：按本表 §2 的 R 归位，拆成 R1/R2（并入通用 Gate）、R3（留 Web Profile）、R5（移 Stack Adapter）三部分。本次先带「待重构」标注提交，重构为提交后独立任务。
- **L0 提案**（对应 R1）：对照 governance §4.1 核对——12 条多数符合 R1，import 卫生/体量克制的具体执行交 R3/R5（已在 L0 提案 §1.2 标注）。
- **assessment TQG**（§7）：按本表 §2 归位后，R4 部分（test DB / 事务 / scoped query / fail-fast）是 governance §11.2 第二阶段 Concern Pack 的直接来源——**这是三套清单里最该优先成案的一类**（含 P0 test DB 隔离）。
- **统一名义**：三套合并后的规则池建议以 governance R1-R7 为唯一组织骨架回流，而非维持「L0 提案 / web-fullstack 提案 / TQG」三个并列名义。

## 7. 待人工确认

- 是否以 governance R1-R7 为唯一骨架，把三套清单合并去重后统一回流（本表 §5 形态）？
- R4 Concern Pack（test DB / 事务 / scoped query / fail-fast）是否优先成案——它是 assessment 主贡献且含 P0，但尚无现成提案？
- web-fullstack §9 提案本次「带标注先提交」还是「重构后再提交」？（本次采纳前者）
