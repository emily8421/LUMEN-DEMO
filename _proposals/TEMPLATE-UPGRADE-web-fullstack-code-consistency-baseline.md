> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

> **【状态：已拆分 / 实证索引】（2026-08-12）**
> 本提案原把「跨项目通用 / Web Profile / 技术栈 Adapter」三类内容混在一份 Web 文档。按 governance §8.3 要求，已拆分为三份分层提案：
> - **R1/R2 通用层** → `_proposals/TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`
> - **R3 Web Profile** → `_proposals/TEMPLATE-UPGRADE-web-profile-code-consistency.md`
> - **R5 Stack Adapter** → `_proposals/TEMPLATE-UPGRADE-stack-adapters-fastapi-react.md`
>
> **本文件保留为实证索引**（governance §8.3「保留该提案作为实证输入」）：§1 动机实证 + §1.1 去重分析仍有效；§2 原 §9 混合内容已替换为「条目 → A/B/C 归属索引表」。本提案不单独回流，回流走 A/B/C。

# TEMPLATE-UPGRADE：Web Fullstack Profile 增补「代码层一致性基线」【实证索引·已拆分】

## 1. 动机（去项目化）—— 实证保留

`template-docs/web-fullstack-profile.md` 已覆盖复杂 Web / 全栈项目的**结构骨架**：WSG-001~006 Gate（App Shell / 目录边界 / Vertical Slice / 验证入口 / UI 链路）、§5 文件膨胀阈值表、§5.1 主应用文件职责边界与业务下沉。这些回答了「文件怎么组织、何时该拆、主文件放什么」。

但它**完全没有覆盖「代码层一致性」**——即同一项目内，错误处理、分层 import、类型契约、工程化护栏、命名语义应有一致基线。在 AI 自主编码（功能逐个累加、缺强约束）场景下，这类一致性缺口是随机性的主要来源：每个端点 / 模块各写各的错误映射、装配样板、配置读取、日志方式，随时间漂移成「同一项目像 N 个人写的」。

**实证观察（LUMEN 派生项目，2026-08 全栈代码审查）**——结构骨架已对齐 profile（目录边界 / 膨胀阈值 / App Shell 均落地），但代码层一致性出现以下系统性缺口：

- **错误契约**：错误响应 `code` 字段二义（同一字段既是 4 位业务码、又是 HTTP 码）；`code→HTTP` 映射在 4 个 api 文件各维护一份且键集不同；多处 `detail={"msg": str(exc)}` 把 service 异常原文抛给客户端（泄露内部细节）；**只注册了 `HTTPException` handler，无兜底 5xx envelope**，service 未捕获异常走框架默认响应、不带项目 envelope，前端契约在异常路径断裂。
- **分层与装配**：18 个 router 用 `if router is not None` 逐个 `include_router`（新增必改 main）；17 个 api 文件各自复制 `try/except ImportError` 兜底块；`service/` 目录下存在 `from fastapi import HTTPException` 并直接 `raise` 的 web 适配器（分层边界活化石，无注释说明）；同文件出现 3 处分散的 `import` 块（Phase 段 + Sprint 段历史拼接未收敛，AI 追加式编码典型痕迹）。
- **类型与契约**：前后端类型手工双写（后端 dataclass ↔ 前端 TS interface），无 codegen、无 schema diff，后端加字段前端无感直至运行期；repository 双实现（demo / 真实）仅靠 docstring 声明接口对齐、无 Protocol/ABC，新增方法只加到一个实现时另一实现静默缺失；service 函数的 `repository` 形参全程无类型注解。
- **工程化护栏**：CI 只校验 whitespace + `VERSION`/`CHANGELOG` 一致性，**零代码质量门**——~30 个后端测试从未在 CI 跑、前端零测试、后端零 lint；API 测试直接 import 并调用端点函数、不经 HTTP 客户端，全局 `exception_handler`（envelope 序列化层）无回归保护；env 读取散落 6+ 处、无集中 Settings，弱默认 token 签名密钥无生产期校验；`print()` 与 `logging` 混用，降级 `except` 路径静默吞异常无日志。
- **命名语义**：纯 localStorage 序列化层（`load/persist/clamp` 纯函数，非响应式）命名为 `*-store.ts`，暗示 redux/zustand 语义，误导新 AI 误改成订阅模式；同文件端点函数后缀混用（`list_documents` vs `xxx_endpoint`）。

> 注：以上为「代码层」一致性缺口（2026-08 时点实证；其中多项后经 CQ-P1-005 错误契约 / CQ-P1-002 repository Protocol 落地修复）。LUMEN 同时也有强实践（统一成功 envelope、领域异常分离、零 `any` + `ReturnType<typeof useXxx>`、HTTP 单出口 `fetch` 仅存于 client、bcrypt + 防枚举恒定时序、不透明 token 仅存摘要）——这些**已落地的好实践恰恰证明：缺的不是能力，是「把好实践固化为可执行基线」的规范载体**，导致新模块不一定对齐。

## 1.1 与既有规则的关系（去重）—— 实证保留

- **`web-fullstack-profile §5` 文件膨胀阈值 / `§5.1` 主文件职责边界**（现行）：管「文件大小与主文件该放什么」。**对象不同**（结构/体量 vs 代码内部一致性），**互补不重复**——拆分后 R3 Web Profile 提案在其同载体补「代码层」维度。
- **`app-main-file-size-rule`**（已归档）：代码文件膨胀阈值。**对象不同**（文件大小 vs 错误/装配/类型一致性），不重复。
- **`global-rules §2` AI 代码生成规范**（现行）：高层「生成前 / 生成时 / 生成后」要求。**层级不同**（跨所有项目形态的高层 AI 行为 vs Web 全栈特化的可执行口径），互补不重复。
- **`implementation-lifecycle-rules §3` System Skeleton Gate**（现行）：管「首个业务 Sprint 前跑通最小纵切」。**阶段不同**（启动门禁 vs 持续编码一致性），不重复。
- **L0 通用代码原则**（`global-rules §2.1`，#322 已采纳）：拆分后 R1/R2 通用层提案与 L0 去重（见该提案 §1.1），多数通用项已被 L0 覆盖。

**本实证索引不再单独追溯「不重复它们」的结论**——拆分后由 A/B/C 三提案各自在其 §1.1 承担去重。差异化结论：原 §9 给 profile 补「代码层」维度的诉求，已按 R 分层拆入 A（通用）/ B（Web Profile）/ C（Stack Adapter）。

## 1.2 已按 governance R1/R3/R5 重构（原「待重构标注」已关闭）

原 §1.2 自标「待重构：作为 `_proposals` 起草区草案先提交（带本待重构标注），不本次重构。重构作为提交后独立任务：① 类拆入 R1/R2 通用层、② 类留 R3 Web Profile、③ 类移 R5 Stack Adapter」——**该处置已于 2026-08-12 完成**：

- 按 governance §8.3 评价 + `rule-consolidation-map.md` §2/§5 的 R 归位，§9 内容拆入 A/B/C 三提案（见 §2 索引表）。
- governance §14 第 3 项（"现有 Web 全栈代码一致性提案是否在回流前按'全局 / Web Profile / Stack Adapter'重新分类？"）由此闭合——**答：是，已分类**。
- 三套规则清单（本提案 §9 + L0 基线 12 条 + assessment TQG 15 条）的去重对照仍见 `docs/research/2026-08-10-rule-consolidation-map.md`（注：该文档 §1 表里 L0 提案路径 `_proposals/...` 已过时，实际在 `_archive/proposals/`）。

## 2. 原 §9 条目 → A/B/C 归属索引（替换原混合 §9）

原 §9 的 21 条已按 consolidation-map R 归位全部分配到 A/B/C，无遗漏、无重复（横跨条目的「原则 / 实现」分别落 A/C，已在备注说明）：

| §9 原条目（简述） | 去向 | R | 去重 | 目标载体 |
|---|---|---|---|---|
| 9.1 单一业务码命名空间 | **B** | R3 | §9 独有 | web-fullstack-profile §9 |
| 9.1 集中 code→HTTP 映射 | **C** | R5 | §9 独有 | stack-adapters/FastAPI |
| 9.1 envelope helper `ok(data)` | **C** | R5 | §9 独有 | stack-adapters/FastAPI |
| 9.1 兜底 5xx envelope | **B** | R3（兼 R1） | §9 独有 | web-fullstack-profile §9 |
| 9.1 结构化客户端错误 ApiError | **B**（实现兼 C） | R3 | 合并 TQG-004 | web-fullstack-profile §9 |
| 9.1 禁泄露内部细节 | **A 标 L0 覆盖** | R1 | =L0-7=TQG-013 | L0 已覆盖，A 不重复 |
| 9.2 service 禁 import web 框架 | **C** | R5 | §9 独有 | stack-adapters/FastAPI |
| 9.2 批量装配循环化 | **C** | R5 | §9 独有 | stack-adapters/FastAPI |
| 9.2 import 收敛顶部 | **A 标 L0 覆盖** | R1（兼 R5） | =L0-10 | L0 已覆盖，A 不重复 |
| 9.2 读/写分层约定 | **B** | R3（原 R6） | §9 独有 | web-fullstack-profile §9 |
| 9.2 Repository Protocol 显式化 | **A 原则 + C 实现** | R1+R5 | 合并 TQG-007 | A: impl-lifecycle / C: stack-adapters |
| 9.3 单源类型 / schema 同步 | **B**（实现兼 C） | R3 | 合并 TQG-009 | web-fullstack-profile §9 |
| 9.3 禁 any + 泛型 + ReturnType | **C** | R5 | §9 独有 | stack-adapters/React |
| 9.3 service 参数类型化 | **C** | R5 | §9 独有 | stack-adapters/FastAPI |
| 9.4 CI 必跑 test+type+lint | **A** | R2 | 合并 TQG-003（补 L0-8） | impl-lifecycle-rules R2 Gate |
| 9.4 测试分层 + 契约序列化回归 | **B** | R3 | §9 独有 | web-fullstack-profile §9 |
| 9.4 配置集中 + secret 校验 | **A 原则 + C 实现** | R1+R5 | §9 独有 | A: impl-lifecycle / C: stack-adapters |
| 9.4 日志统一禁 print + 降级记日志 | **A 标 L0 覆盖** | R1 | =L0-4 | L0 已覆盖，A 不重复 |
| 9.5 命名反映真实语义 | **A 标 L0 覆盖** | R1 | =L0-1 | L0 已覆盖，A 不重复 |
| 9.5 端点/函数后缀统一 | **B** | R3（原 R6） | §9 独有 | web-fullstack-profile §9 |
| 9.5 HTTP 单出口 | **B** | R3（兼 R6） | §9 独有（已落 LUMEN） | web-fullstack-profile §9 |

**统计**：B 8 条 / C 8 条（含 2 条与 A 横跨）/ A 独有 3 条 + 标注 L0 覆盖 4 条。

## 3. 版本

本提案已拆分为 A/B/C，**不单独回流、不单独 bump**。版本节奏由 A/B/C 各自的 MINOR 承载（均纯文本规范、无脚本、无 CI 强制）。

## 4. 影响

见 A/B/C 三提案的「改动文件」：`ai/implementation-lifecycle-rules.md`（A）/ `template-docs/web-fullstack-profile.md`（B）/ `template-docs/stack-adapters/` 新建（C）。本实证索引**不改任何载体**。

## 5. 备选（已评估，拆分中已吸收）

原备选（把 §9 放 `global-rules §2` / 设为硬 CI 门禁 / 只给检查清单 / 不改）已在拆分中吸收：通用项提升到 R1/R2（A）、Web 形态留 Profile（B）、栈写法进 Adapter（C）、三提案一致「不设模板层硬门禁」。

## 6. 后续

本文件作为实证索引保留，不再演进。回流走 A/B/C（`ai/commands/submit-proposal.md` 跨仓开 issue）。A/B/C 合并下行后移入 `_archive/proposals/`；本实证索引可同步归档，或保留作为「拆分前实证 + 归属索引」的历史指针（不删除，符合 archive-over-delete）。
