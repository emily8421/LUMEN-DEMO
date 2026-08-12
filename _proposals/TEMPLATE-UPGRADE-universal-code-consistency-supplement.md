> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

# TEMPLATE-UPGRADE：通用层（R1/R2）代码一致性补充——补 L0 未覆盖项

> 本提案是原混合提案 `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` 按 governance R1/R3/R5 分层拆分后的 **R1/R2 跨项目通用部分**。Web 形态契约见 `TEMPLATE-UPGRADE-web-profile-code-consistency.md`（R3），FastAPI/React 具体写法见 `TEMPLATE-UPGRADE-stack-adapters-fastapi-react.md`（R5）。拆分依据 `docs/research/2026-08-10-rule-consolidation-map.md`；governance §8.3 要求「稳定的跨项目原则提升到 R1/R2」。

## 1. 动机（去项目化）

governance 上位框架（`docs/research/2026-08-10-ai-code-governance-framework.md` §8.3）把原 web-fullstack 提案里的**跨项目通用**条目（与语言 / 框架 / 项目形态均无关）划归 **R1 全局质量宪章 / R2 实现 Gate**。这类条目换到 CLI、库、数据流水线项目仍成立，不应固定在 Web 文档里。

**但 L0 通用代码原则基线（`global-rules §2.1`，已由 #322 采纳合并到模板 v1.61.0）已覆盖了其中多数**：禁泄露内部细节（L0-7）、import 卫生（L0-10）、失败必须可见 / 日志统一（L0-4）、命名传达意图（L0-1）——这 4 条**已被 L0 采纳，本提案不重复**，仅在 §1.1 列出去重指针。

本提案**只补 L0 未覆盖的 3 条跨项目通用一致性项**（实证来自 LUMEN 2026-08 全栈审查）：

- **CI 只校验文档 / 版本 / 空白，零代码质量门**——~30 个后端测试从未在 CI 跑、前端零测试、后端零 lint；L0-8「可测试性」只讲「CI 必须跑测试」，**未要求 type + lint**，留了缺口；
- **关键 secret 用弱默认值无启动校验**——弱默认 token 签名密钥无生产期校验，缺失也能启动；§8.3 点名「关键 secret 不能使用弱默认值」属跨项目安全底线；
- **多实现仅靠 docstring 声明接口对齐、无显式契约**——repository 双实现新增方法只加到一个实现时另一实现静默缺失；L0-12「先契约后实现」沾边但**不专门约束多实现一致性**。

> 诚实声明：本提案去重后独有内容仅 3 条，较薄。仍独立成案的理由见 §5 备选——governance §8.3 明确要求通用项「提升到 R1/R2」而非留在 Web 文档，且这 3 条是 L0 确未覆盖的通用一致性项，有独立回流价值。

## 1.1 与既有规则的关系（去重）

- **L0 通用代码原则**（`global-rules §2.1`，#322 已采纳）：跨形态通用基线。本提案**补 L0 未覆盖项**，不重复。已被 L0 覆盖、本提案**不重复**的 §9 原条目：
  - 禁泄露内部细节 / 禁 `str(exc)` → = **L0-7 对外信息最小化**（也 = assessment TQG-013）
  - import 收敛顶部 → = **L0-10 import / 依赖卫生**（具体执行口径在 Stack Adapter）
  - 日志统一禁 `print` + 降级 `except` 记日志 → = **L0-4 失败必须可见**
  - 命名反映真实语义 → = **L0-1 命名传达意图**
- **Web Profile 提案**（R3）/ **Stack Adapter 提案**（R5）：形态契约与栈写法。本提案给其**上层原则**（如多实现契约原则 → C 给 Python Protocol 写法；secret 校验原则 → C 给 Settings 写法）。原则 vs 形态 / 栈实现，互补不重复。
- **assessment TQG**（§7）：TQG-003（CI 至少跑质量命令）→ **合并入**本提案 R2 Gate；TQG-007（多实现共享 Protocol + contract suite）→ 原则层**合并入**本提案 R1（实现层在 Stack Adapter）。
- **governance R1 质量宪章 7 条**（§4.1）：governance 已给 R1 高强度价值排序条目。本提案**不重写宪章**，只补「代码一致性」维度的 2 条可执行条目（secret 校验、多实现契约），属宪章「重要边界必须显式」「不得以安全换速度」的落实。

**本提案不重复它们**：L0 有通用基线、governance §4.1 有 R1 宪章、Web/Stack 提案有形态与栈；缺的是「L0 未覆盖的 3 条通用一致性补充」。差异化：给 R1/R2 补这 3 条。

## 1.2 与 governance R1-R7 上位框架的关系

本提案对应 governance **R1 全局质量宪章 + R2 实现生命周期 Gate**，建议落点 `ai/implementation-lifecycle-rules.md`（governance §9.1 行 689「R1 质量宪章 + R2 Gate 的权威入口」；§14 待确认项 #2「R1 与 R2 是否优先合并进现有 implementation-lifecycle-rules.md」即此方向）。**最终落点与章节位置由模板维护者按 governance §14 #2 确认**——本提案只给内容，不绑死章节号。

每条按 governance §1.2 试金石归位：**换到 CLI / 库 / 数据流水线仍成立**才入本提案（换栈失效者归 R5，仅 Web 全栈成立者归 R3）。

三套规则清单去重对照见 `docs/research/2026-08-10-rule-consolidation-map.md`。

## 2. 拟改（`ai/implementation-lifecycle-rules.md` 增补 R1/R2 条目）

按 governance §14 #2 方向，把下列 3 条合并进现有 `implementation-lifecycle-rules.md` 的 R1 质量宪章 / R2 Gate 段（具体章节由模板维护者定）。**不新增入口文件**、**不重复 L0**、**不引入栈具体写法**（写法在 Stack Adapter）。

> **R2 Gate 补强：CI 必跑 test + type + lint**
>
> 本地 / CI 快检（G2 代码可合入 Gate）必须覆盖「测试 + 类型检查 + lint」三类，不得只校验文档 / 版本 / 空白。后端 `pytest` + `ruff`/`mypy`、前端 `tsc` + `eslint`；CI 默认只跑 unit（无外部依赖），integration 夜跑或手动。补 L0-8「可测试性」只讲测试、未含 type + lint 的缺口。（合并 assessment TQG-003；具体命令见 Stack Adapter。）

> **R1 安全底线：关键 secret 启动期校验（fail-closed）**
>
> 关键 secret（token 签名密钥、数据库凭证、第三方 API key 等）不得使用弱默认值；启动期校验——缺失或为默认值即启动失败（fail-closed），不得带弱默认静默运行。属 R1「不得以安全 / 数据完整性换交付速度」的落实（governance §4.1）；§8.3 点名为跨项目通用底线。具体 Settings 模块写法见 Stack Adapter。

> **R1 契约显式：多实现契约显式化**
>
> 同一接口的多个实现（demo / 真实、mock / prod、read-replica / primary）须用 Protocol / ABC / interface 显式声明接口对齐 + contract 测试守护，禁止仅靠鸭子类型 + docstring 声明——否则新增方法只加到一个实现时另一实现静默缺失。属 R1「重要边界必须显式」的落实（governance §4.1）；具体 `typing.Protocol` 写法见 Stack Adapter。（合并 assessment TQG-007。）

## 3. 版本

模板版本：下一 **MINOR**。仅 `ai/implementation-lifecycle-rules.md` 同文件内增补上述 3 条（纯文本规范，无新文件、无脚本、无 CI 强制——其中「CI 必跑 type+lint」是要求派生项目 CI 自建质量门，模板层不预置跨语言通用 lint）。不触碰 R1 宪章 7 条本身、不触碰 L0 §2.1、不触碰任何 profile / Adapter。

## 4. 影响

- **改动文件**：`ai/implementation-lifecycle-rules.md`（+3 条 R1/R2 条目）。
- **不触碰**：`global-rules §2 / §2.1`（L0 已覆盖禁泄露 / import 卫生 / 失败可见 / 命名意图）；`web-fullstack-profile.md`（R3，Web Profile 提案另改）；`stack-adapters/`（R5，Stack Adapter 提案另建）；governance §4.1 R1 宪章 7 条。
- **预期效果**：派生项目 CI 不再只校验文档 / 版本；关键 secret 有启动期护栏；多实现有一致性守护——这 3 项跨形态成立，补 L0 缺口后与 L0 共同构成完整通用层。
- **回测口径**：采纳后，派生项目 CI 应跑 test+type+lint 三类；启动期 secret 校验 fail-closed；多实现有 Protocol/ABC + contract test。LUMEN 多数已落地（CQ-P1-002 Protocol + 批6 CI 门），可对照标注。

## 5. 备选（已评估未采）

- **把这 3 条并入 Web Profile 提案（R3）**：governance §8.3 明确要求通用项「提升到 R1/R2」，不得留在 Web 文档（否则 CLI / 数据流水线项目无法复用）。否决。
- **把这 3 条并入 L0 §2.1**：L0 已由 #322 采纳合并，本批提案不再改动已采纳的 L0；且 L0 定位「跨形态通用代码原则」，CI Gate 属 R2 实现 Gate 层（governance 分层），secret 校验属 R1 安全底线——分层更清晰。若模板维护者倾向并入 L0，可在回流时合并，本提案不强制。**这是「过薄」的备选合并路径，供模板维护者定。**
- **重复 L0 已覆盖的 4 条**：禁泄露 / import 卫生 / 失败可见 / 命名意图已被 L0-7/10/4/1 采纳，重复回流会造成 consolidation-map §3 点名的「重复主题」。本提案只列去重指针，不展开。否决重复。
- **设为硬 CI 门禁**：「CI 必跑 type+lint」要求派生项目 CI 自建，模板无法预置跨语言通用 lint；本条是「CI 必须有质量门」的元规则，具体规则由派生项目按栈落地。否决模板层硬门禁。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；与 R3（Web Profile）、R5（Stack Adapter）提案同批成熟后，经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 L0 §2.1 的覆盖关系——本提案 4 条原 §9 项已被 L0 覆盖，只回流 3 条独有项；secret / Protocol 原则与 Stack Adapter 实现配合；consolidation-map §5 建议按 R1-R7 统一回流）→ 辅助修改 `implementation-lifecycle-rules.md`（或按 §14 #2 决定并入 L0）→ PR 落地。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
