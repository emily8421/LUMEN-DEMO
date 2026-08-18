# TEMPLATE-UPGRADE：反向同步落点约束 + 文档评估「阶段归属审计」维度

> 来源：LUMEN-DEMO（emily8421/LUMEN-DEMO）派生项目回流
> 提案日期：2026-08-17
> 目标文件：`ai/document-lifecycle-rules.md` §2（E6）、`ai/prompts/review/19-docs-evaluation.md`
> 状态：**已落地关闭**——issue [#355](https://github.com/emily8421/ai-project-template/issues/355) 已由模板维护者采纳落地（Batch A / PR A1 #362，squash `49c1f2b`，v1.63.0，2026-08-18 关闭）；本文件已归档，勿重复提交

## 1. 动机

模板 `document-lifecycle-rules §2` 有 E6「实现结果 → 文档回写」，但**只规定"要回写"，未规定"实现证据落在哪个文档层"**。派生项目 LUMEN 在代码事实反向同步时，把实现细节（表名 `lumen_*`、migration 号、API-ID、类名、router 计数、Sprint 号、版本史）大量倒灌进需求规格（02/03）与概要设计（04），违反自身 doc-standards 的「不写实现细节」禁条，且无机制拦截：

- `03` §4 REQ 矩阵的「覆盖状态」列一度退化为实现日志（每 REQ 一行含表 / API / migration / PR 号）。
- `04` §5.1 顺序图写死 endpoint 路径，与 07 双源失同步（登录图仍写 Demo 账号，与凭证登录现状不符）。
- `19-docs-evaluation.md` 只有「合理性 → 阶段归属、优先级」一项泛检查，**抓不住这类阶段错置**。

## 2. 拟改（最小增量，不改机制结构）

1. **`document-lifecycle-rules §2` E6 补「反向同步落点约束」**（去项目化表述）：
   > 代码事实反向同步时，实现证据（表名 / 接口 ID / migration / 类名 / 实现算法 / Sprint / 版本史）落 `docs/09-verification.md`、`docs/design/*`、CHANGELOG 与实现索引；`00-05`（需求规格 / 概要设计）只保留「状态 + 追溯指针」，不得倒灌实现机制细节。若需求 / 概要文档需承载「REQ → 实现证据」单点索引，应另立独立文档（如 `docs/design/req-implementation-index.md`），不内联在需求 / 概要矩阵行。
2. **`19-docs-evaluation.md` 增「阶段归属审计」维度**：检查需求 / 概要文档是否混入详细设计 / 实现级内容——典型信号：表名 / API-ID / migration 号 / 类名 / 实现算法 / 版本演进史出现在 00-05；无权限访问 / 接口契约应指向 07 而非内联。审计项给出「通过 / 需收敛」判定与收敛动作（归 09 / design / CHANGELOG 或另立索引）。
3. **`ai/doc-standards/03-prd.md` / `04-architecture.md` 的「不写实现细节」禁条补为可审计检查项**（与 §1 现有禁条对应，提供审计口径）。

## 3. 与既有规则关系（去重）

- `03 doc-standards §1` / `04 doc-standards §1` 已有「不写接口字段 / DB 表 / Sprint 细节」禁条——本提案**对象相同、补机制**（落点规则 + 审计项），不新增禁条。
- `document-lifecycle-rules §2` E6 已存在——本提案补 E6 的**落点约束**，不新增加密回写节点。
- `§7` 横切状态词典（目标设计 / 候选 / 已验证等）与本文正交：状态词管「确定度」，落点规则管「放哪个文档层」。

## 4. 版本影响与影响面

- 只改 `document-lifecycle-rules §2`（E6 落点约束）+ `19-docs-evaluation.md`（新增审计维度）；同步清单内文件。
- 版本：MINOR bump。
- 兼容性：纯增量；既有文档评估报告（`docs/research/*docs-evaluation*`）不追溯改动，新评估启用新维度。

## 5. 验证方式

- `scripts/check-template.sh` 自检通过。
- 行为验证（维护者侧人工复核口径）：对任一经历过代码反向同步的派生项目跑 `19-docs-evaluation`，应能抓出「实现细节混入需求 / 概要层」问题；LUMEN 已按本提案收敛（03/04 实现证据归 `req-implementation-index`，`02` REQ 可验证口径剥离实现方案）。

## 6. 备选方案与取舍

- **不扩展，维持现状**：派生项目继续在 03/04 内联实现证据——已被 LUMEN 实证为违反自身标准、双源失同步，且跨项目通用。
- **反向同步禁止写入 00-05（绝对禁条）**：过于严格，需求 / 概要文档仍需「状态 + 指针」级事实；本提案选「落点约束 + 指针」。
- **只在 doc-standards 强化禁条、不加评估维度**：规则存在但无机制执行（LUMEN 实证规则被违反）；本提案补评估审计维度作为执行机制。
