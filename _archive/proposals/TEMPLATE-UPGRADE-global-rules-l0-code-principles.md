> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流
> 体系依据：`docs/research/2026-08-10-code-constraint-framework.md` §3.1（L0 层）

# TEMPLATE-UPGRADE：global-rules §2 增补「L0 通用代码原则基线」

## 1. 动机（去项目化）

`ai/global-rules.md §2 AI 代码生成规范` 当前只有一张「生成前 / 生成时 / 生成后」的高层要求表（先读规则、先说方案再写代码、列文件清单与验证方式）。它是**跨所有项目形态的 Core 层 AI 行为约束**，但**没有任何一条「代码本身该怎么写」的通用原则基线**。

后果（实证观察·LUMEN 派生项目，2026-08-10 全栈评估）：派生项目在代码层从零开始、靠 AI 自觉——

- 静默吞异常（`except: pass` / 空 catch，降级路径不记日志）；
- 错误信息 `str(exc)` 直传客户端，泄露内部细节；
- 同文件 import 散落多处（Phase 段 + Sprint 段历史拼接未收敛）；
- 重复样板（router 逐个 `if-include` 注册、4 份 `code→HTTP` 映射表）；
- 魔法值散落（错误码裸整数字面量、超时 / 阈值硬编码）；
- 新代码另起炉灶不向既有看齐（命名 / 模式 / 契约随模块漂移）。

这些都是**跨语言、跨技术栈、跨项目形态**的「写代码基本功」缺口，属于 L0 层（见体系框架 `docs/research/2026-08-10-code-constraint-framework.md` §3）。L0 原则**基于软件工程公认的跨语言跨项目原则**（命名传达意图、单一职责、一致性、失败可见、DRY、显式优于隐式等）——**不依赖单一项目样本即可确立**（需要多样本归纳的是 L1/L2 特化规则，非 L0）。因此现在提出 L0 基线不偏早。

补 L0 后，与按形态特化的 L1+L2（`web-fullstack-profile §9`，已在途提案）和项目专属 L3（`ai/project-rules.md §5`）共同构成完整的 **L0–L3 代码规范分层**。

## 1.1 与既有规则的关系（去重）

- **`global-rules §2` 原表**（生成前 / 时 / 后）：本提案是其下属增补（§2.1），把「生成时必须先说明方案」落实到「代码本身该怎么写」的可执行口径，**互补不重复**。
- **`web-fullstack-profile §9 代码层一致性基线`**（在途提案 `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md`）：**层级正交**——§9 是 **L1 职责层 + L2 技术栈**的 Web 全栈特化（如「service 禁 import fastapi」「禁 any」）；本提案是 **L0 跨形态通用**（如「命名传达意图」「失败必须可见」换到 CLI / 纯库也成立）。Web 全栈项目两者都读，不重叠。
- **`ai/project-rules.md §5` / `doc-standards/project-rules.md §5`**：L3 项目专属（如 LUMEN 的 envelope `{code,msg,data}`），换项目不成立；本提案 L0 换项目成立。层级不同。
- **`app-main-file-size-rule`**（已归档）：对象是文件膨胀阈值；本提案 L0 第 11 条「体量克制」是意识层、指向形态 profile §5 的具体阈值，不重复。
- **`capability-packages.md` 影响域分层**：是模板分层索引（Core/Docs/Implementation/Verification/Profiles）；本提案是 Core 层内容，不重复。

**本提案不重复它们**：现有 `global-rules §2` 有高层生成纪律、`web-fullstack-profile §9` 有 Web 特化代码一致性、`project-rules §5` 有项目专属约定，但** Core 层缺一份「跨形态的 L0 通用代码原则基线」**。差异化：给 §2 补 §2.1，填补 L0 空白。

## 1.2 与 governance R1-R7 上位框架的关系

本提案（L0 通用代码原则）对应 `docs/research/2026-08-10-ai-code-governance-framework.md` 的 **R1 全局质量宪章**。对照 governance §4.1（R1「不放具体技术条目，如 React 命名、pytest marker、FastAPI 异常类型」）：本提案 12 条多为跨语言跨项目通用原则（命名传达意图、单一职责、一致性、失败可见、DRY、显式优于隐式等），符合 R1 定位；个别口径（import 卫生、体量克制的具体阈值）属 R1 意识层、具体执行交 R3 Profile §5 阈值与 R5 Adapter 工具规则，回流时确认分层。

三套规则清单（本提案 12 条 + web-fullstack §9 + assessment TQG 15 条）的去重对照见 `docs/research/2026-08-10-rule-consolidation-map.md`。

## 2. 拟改（`ai/global-rules.md §2` 增补 §2.1）

在 §2 原表之后新增 §2.1。**不引入硬 CI 门禁**（L0 多数需人工 review，模板无法预置跨语言通用 lint 规则）、**不与 §9 / project-rules §5 重复**（L0 vs L1+L2 vs L3 正交）。定位为「治理提醒 + 可执行口径」，能机械化检查的优先。

> ### 2.1 L0 通用代码原则基线
>
> 以下原则跨语言、跨技术栈、跨项目形态成立（换到 CLI / 纯库 / Web / 移动端均适用），是所有代码的下层约束。与按项目形态特化的 L1/L2（见 `template-docs/*-profile.md`，如 `web-fullstack-profile.md §9`）和项目专属的 L3（见 `ai/project-rules.md §5`）正交。定位为治理提醒 + 可执行口径；能写成 lint / grep / CI 门的优先机械化检查。
>
> 1. **命名传达意图**——名字回答「是什么 / 做什么」；禁无意义名（`a` / `b` / `tmp` / `data` / `foo`）。口径：code review + lint 拦截单字母与保留泛名。
> 2. **单一职责**——一个函数 / 文件 / 模块承担一个明确职责；超职责的拆分。口径：配合形态 profile §5 体量阈值 + 人工 review。
> 3. **一致性优先**——项目内命名、模式、契约、风格统一；**新代码对齐既有而非另起炉灶**。口径：新代码不得引入与既有同类不一致（PR review 对照既有实现）。
> 4. **失败必须可见**——禁止静默吞异常（`except: pass` / 空 catch）；降级 / 兜底必须记录原因（日志）。口径：lint 禁裸 except / 空 catch；grep 禁 `except.*pass`。
> 5. **不重复（DRY / 三次法则）**——重复 ≥3 次的逻辑必须抽象；批量同构操作用循环 / 列表，禁逐个手写。口径：人工 review + 重复样板提示。
> 6. **显式优于隐式**——行为不靠隐式默认 / 魔法值 / 全局可变状态；关键开关、超时、阈值用命名常量。口径：lint 禁魔法数字 / 字符串字面量。
> 7. **对外信息最小化**——错误信息、日志、对外响应不泄露内部实现细节 / 路径 / 堆栈（生产态）。口径：禁 `str(exc)` 直传客户端；生产禁回传堆栈（PR review）。
> 8. **可测试性**——关键业务逻辑写成可被自动化测试覆盖的形态，逻辑与 IO / 副作用分离。口径：CI 必须跑测试（见形态 profile §9.4 工程化护栏）。
> 9. **变更最小与可追溯**——小步改动、单一职责的 commit、可回滚；一次改动只解决一个问题。口径：commit / PR 粒度约束。
> 10. **import / 依赖卫生**——依赖声明集中在单元顶部 / 清单，不散落；历史拼接产生的新 import 块必须收敛；未用依赖移除。口径：lint 未用 import；review 禁文件中部追加 import。
> 11. **体量克制**——单文件 / 函数有拆分意识，超阈值先拆再加功能（具体阈值见形态 profile §5）。口径：profile §5 阈值 + `wc -l` 检查。
> 12. **先契约后实现**——对外接口 / 数据形状 / 错误码先定义并稳定，再写实现；契约变更须显式。口径：API 先登记 `docs/07-api-spec.md`；`response_model` / 类型先定。
>
> > 这 12 条是「写代码的下层基本功」，适用于所有项目所有代码；形态特化规则（L1/L2）进各 profile，项目专属规则（L3）进 `ai/project-rules.md §5`。派生项目可在 `ai/project-rules.md §5` 补项目专属条目，但不得削弱 L0。

## 3. 版本

模板版本：下一 **MINOR**。仅 `ai/global-rules.md` 同文件内 §2 之后增补 §2.1（纯文本规范，无新文件、无脚本、无 CI 强制——本节自述为治理提醒 + 可执行口径）。不触碰 §2 原表、不触碰任何 profile、不触碰 project-rules 骨架。

## 4. 影响

- **改动文件**：`ai/global-rules.md`（§2 +§2.1）。
- **不触碰**：§2 原「生成前 / 时 / 后」表；`web-fullstack-profile.md §5 / §5.1 / §9`；`ai/project-rules.md §5` / `ai/doc-standards/project-rules.md §5`；`app-main-file-size-rule`（已归档）；`capability-packages.md` 影响域分层；`scripts/check-template.*`。
- **预期效果**：派生项目代码层有 L0 通用基线，新派生项目的 `global-rules §2` 不再只有高层口号；与 §9（L1+L2）/ project-rules §5（L3）构成完整 L0–L3 分层；AI 编码时「写代码基本功」有可对照清单，降低跨模块随机性。
- **回测口径**：采纳后，新派生项目代码 review 可对照 §2.1 的 12 条；§2.1 与 web-fullstack §9 / project-rules §5 三者覆盖范围不重叠（L0 跨形态 / L1+L2 形态特化 / L3 项目专属）。

## 5. 备选（已评估未采）

- **把 L0 放进 `web-fullstack-profile`**：L0 跨所有形态（不止 Web 全栈），CLI / 纯库 / 移动端项目也适用；放 Core 层 `global-rules §2` 才能覆盖所有项目。否决。
- **设为硬 CI 门禁**：L0 多数原则（命名意图、单一职责、一致性、先契约后实现）需人工 review，模板无法预置跨语言通用 lint；能机械化的（禁裸 except / 禁魔法值 / 禁未用 import）由派生项目按语言自建 lint。本节定位「治理提醒 + 可执行口径」，与 web-fullstack §9 提案同逻辑。否决模板层硬门禁。
- **等多样本再提**：L0 基于软件工程公认的跨语言原则（命名 / 单一职责 / DRY / 失败可见 / 显式优于隐式 等），**不依赖单一项目样本**即可确立；需要多样本归纳的是 L1/L2 特化规则。推迟 L0 反而让所有新派生项目继续无基线。否决。
- **只给检查清单、不给口径**：纯 checklist 无法约束 AI 自主编码（AI 会勾选但代码仍各写各的）；本提案每条配「可执行口径」。否决纯清单形态。
- **不改（接受 L0 空白）**：Core 层继续无代码原则基线，派生项目代码层从零开始。否决。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；成熟后经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` 同涉「代码层」，但**层级正交**：本提案 L0 跨形态 vs 该提案 L1+L2 Web 特化，不冲突，可同批采纳）→ 辅助修改 `global-rules.md` → PR 落地。
- 派生项目侧体系依据：LUMEN `docs/research/2026-08-10-code-constraint-framework.md` §3.1 引用本提案作为 L0 具体清单；采纳回流后该备忘补「已入库 `global-rules §2.1`」指针。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
