> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流
> 体系依据：LUMEN `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1（test DB guard，已落地 `tests/backend/pg_test_support.py`，PR #124 / v3.8.0）

# TEMPLATE-UPGRADE：implementation-lifecycle-rules §6 增补「破坏性测试数据库安全 guard」

## 1. 动机（去项目化）

派生项目跑**数据库集成测试**时，普遍存在**误清开发 / 生产库**的风险：测试 fixture 常用 `TRUNCATE` / 重建 schema / 批量删除来隔离状态，若测试与开发 / 生产共用一个库（或 `DATABASE_URL` 配错、CI 与本地环境不一致），破坏性操作会清掉真实数据，且通常**无 rollback**。

模板当前 `ai/implementation-lifecycle-rules.md §6 测试与验证分层` 有「集成测试验证模块 / DB / 外部接口协作」的等级定义，但**缺一份「破坏性测试 DB 操作的安全 guard」具体口径**——派生项目只能靠「开发者自觉配对库」「README 提醒」，不可靠。

后果（实证·LUMEN 派生项目，P0 治理评估发现）：4 个 PG 集成测试面原共用开发库，`TRUNCATE` fixture 在配置错误时会清开发数据；本地能跑因开发者手动避坑，CI / 新人 / 换机器时风险显化。

去项目化：此风险**跨任何有持久化的项目形态**（PostgreSQL / MySQL / SQLite / MongoDB / …，Web / CLI / 服务端），与具体业务无关。无持久化项目（纯计算库 / 纯前端）豁免。

## 1.1 与既有规则的关系（去重）

- **`implementation-lifecycle-rules §6` 测试分层**：本提案是其下属增补（§6.x），把「集成测试」等级落实到「破坏性 DB 操作的安全 guard」可执行口径，**互补不重复**。
- **`global-rules §2.1` L0 第 7 条「对外信息最小化」**（在途提案 `TEMPLATE-UPGRADE-global-rules-l0-code-principles.md`）：guard 错误信息「不含连接串 / 凭证」是该原则在测试安全场景的具体应用，**层级不同、不重复**（L0 通用 vs 本提案测试 DB 专项）。
- **形态 profile（如 `web-fullstack-profile.md`）若有测试节**：L1+L2 形态特化；本提案是跨形态测试安全基线（任何有 DB 项目）。层级正交。
- **`project-rules §3`「是否有持久化存储」**：本提案以「声明有持久化的项目」为触发条件，复用该字段判定豁免，不重复定义。

**本提案不重复它们**：现有 §6 有测试分层等级、global-rules §2.1 有对外信息最小化、形态 profile 有特化测试口径，但**实现层缺一份「破坏性测试 DB 安全 guard」的跨形态基线**。差异化：给 §6 补 §6.x，填补该空白。

## 2. 拟改（`ai/implementation-lifecycle-rules.md §6` 增补 §6.x）

在 §6 测试分层表之后新增 §6.x「破坏性测试数据库安全 guard」。**不引入模板层硬 CI 门禁**（guard 是测试侧运行时校验，跨语言实现；模板给口径，派生项目按语言自建）、**不与 §6 原表 / global-rules §2.1 / 形态 profile 重复**。

> ### §6.x 破坏性测试数据库安全 guard
>
> 跑数据库集成测试（`TRUNCATE` / 重建 schema / 批量删除等破坏性 fixture）时，**必须**防止误清开发 / 生产库。要求：
>
> 1. **独立测试库**：集成测试用独立测试库（库名含 `_test` 后缀或等价明确测试标识），不与开发 / 生产库共用同一物理库。
> 2. **三重 fail-closed guard**：破坏性操作前，测试侧 guard 校验三条件（**全部**满足才放行，任一不满足直接抛错且**不降级为 skip**）：
>    - 测试环境标记（如 `<PROJECT>_ENV=test` 精确匹配）；
>    - `DATABASE_URL` 指向测试库（库名 `_test` 后缀 + 正确 scheme）；
>    - 显式破坏性开关（如 `ALLOW_DESTRUCTIVE_TEST_DB=1` 精确匹配）。
> 3. **guard 位置与形态**：guard 是**测试侧纯函数**（接收 URL 字符串校验，不连库、不 import 生产 engine / ORM 初始化），**不进生产 service 目录**；在连接 `try/except` **外**调用（避免被宽泛 `except Exception` 吞成 skip），破坏性 SQL 前应二次调用。
> 4. **错误信息**：只列失败条件，**不含连接串 / 凭证 / 主机**（防日志与 CI 输出泄露）。
> 5. **fail-closed 语义**：guard 不满足时**抛错不 skip**——skip 会让破坏性测试在配置错误时静默跳过保护，违背 guard 初衷；仅在 guard 已过、DB 连接 / 环境本身不可用时才 skip 连接类失败。
>
> > 口径：`project-rules §3` 声明「有持久化存储」的项目，在首个 DB 集成测试 Sprint 前落地此 guard；guard 代码放 `tests/` 侧（如 `tests/<lang>/db_test_support.<ext>`），不进生产代码目录。无持久化项目豁免（`project-rules §3` 声明）。验证方式：guard 纯单测（三条件全满足才过、缺任一即拒、非测试库 URL 拒）+ 负向 smoke（指向开发库时即使 DB 可达也在连接 / SQL 前拒）。

## 3. 版本

模板版本：下一 **MINOR**。仅 `ai/implementation-lifecycle-rules.md` 同文件内 §6 之后增补 §6.x（纯文本规范，无新文件、无脚本、无 CI 强制——guard 实现由派生项目按语言 / 技术栈自建）。不触碰 §6 原表、不触碰 `global-rules`、不触碰任何 profile、不触碰 `project-rules` 骨架、不触碰 `scripts/check-template.*`。

## 4. 影响

- **改动文件**：`ai/implementation-lifecycle-rules.md`（§6 +§6.x）。
- **不触碰**：§6 原「测试与验证分层」表；`global-rules.md`（含在途 §2.1）；形态 profile；`ai/project-rules.md §3 / §5` 骨架；`app-main-file-size-rule`（已归档）；`capability-packages.md`；自检脚本。
- **预期效果**：有持久化的派生项目跑 DB 集成测试时有明确安全 guard 口径，不再靠「开发者自觉」；新派生项目首个 DB 集成测试 Sprint 前可对照 §6.x 落地 guard，CI / 换机器 / 新人场景下的误清风险被结构性消除。
- **回测口径**：采纳后，声明「有持久化」的派生项目 `tests/` 侧存在 `assert_test_database_safe` 类 guard（三重 fail-closed + 不降级 skip）；guard 不进生产 service；错误信息不含凭证；`project-rules §3` 无持久化声明者豁免。

## 5. 备选（已评估未采）

- **放 `global-rules`**：test DB guard 只适用有持久化项目，CLI / 纯库 / 纯前端项目无 DB 不适用；放 `implementation-lifecycle`（实现层，有 DB 项目读）更精准，且能复用 `project-rules §3` 豁免判定。否决。
- **放 `web-fullstack-profile`**：test DB guard 跨形态（任何有 DB 项目，含 CLI / 后端服务 / 桌面端），不只 Web 全栈；放实现层通用。否决。
- **给具体 guard 代码**：模板跨语言（Python / JS / TS / Go / Java / …），给具体代码不通用；给口径（三重 fail-closed + 测试侧纯函数 + 不降级 skip + 错误信息不含凭证），派生项目按语言实现。否决具体代码。
- **设为模板层硬 CI 门禁**：guard 是测试侧运行时校验（校验 env + URL），非跨语言可静态 lint 的规则；模板给口径，派生项目测试自带 guard + 自带 guard 单测。否决模板层 CI 门。
- **降级为 skip（而非 fail-closed）**：skip 会让破坏性测试在配置错误时静默跳过保护——恰恰是最危险场景（配置错 + 静默放行）；fail-closed 是 guard 的核心语义。否决 skip 降级。
- **只要求「独立测试库」一条**：仅库隔离不足以防配置错误（DATABASE_URL 配错仍可能命中开发库）；三重 fail-closed（环境标记 + 库名 + 显式开关）是纵深防御。否决单条。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；成熟后经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 `TEMPLATE-UPGRADE-global-rules-l0-code-principles.md` 同涉「错误信息最小化」，但**层级正交**：本提案测试 DB 专项 vs 该提案 L0 通用，不冲突，可同批采纳）→ 辅助修改 `implementation-lifecycle-rules.md §6` → PR 落地。
- 派生项目侧依据：LUMEN `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1 已落地 guard（`tests/backend/pg_test_support.py` 三重 fail-closed + 独立 `lumen_test` + 4 PG 测试面，PR #124 / v3.8.0），本提案是其去项目化回流。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
