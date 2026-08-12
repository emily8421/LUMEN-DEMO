> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

# TEMPLATE-UPGRADE：handoff Latest checkpoint rollup 机制

## 1. 动机（去项目化）

`session-rules §6` 推荐 handoff（`.ai/session-handoff.md`）用「Latest checkpoint」累加结构，配合 `global-rules §8`「积累式演进、只增不删、原位追加」。这保证了续接记录的完整追溯，但**只规定了「如何追加」，未规定「何时压缩/归档旧 checkpoint」**。

对照 `session-rules §4.2`，token-hotspot 机制有完整 **rollup**（本地单条累计 ≥3 份 → 提炼 `SUMMARY.md` 入库 → 本地单条可清理）——**handoff 没有对应的 rollup 机制**，Latest checkpoint 日志只增不减。

**实证观察（LUMEN 派生项目，2026-07 ~ 08，持续更新）**：
- handoff 累积至 **265KB / 63 个 Latest checkpoint / 2446 行**（跨 2026-08-03 ~ 08-12，9 天高频会话）。
- **本提案起草（约 2026-08-10，当时 1338 行 / 10+ 段）后未执行 rollup**，2 天涨至 **约 6 倍**——机制缺口持续放大，实证恶化而非停滞。
- 快速续接（§3.1）读取 handoff 时，**已超过 AI 工具上下文读取上限（256KB）**：首轮 `Read` 因文件 >256KB 被强制改用 `offset/limit` 分段读取——续接读取成本随历史累积线性上升，挤占任务上下文；旧 checkpoint 在截断后不可见，削弱「被动中断重建」（§1 表格：被动中断时 handoff 仅作参考，但若旧 checkpoint 已能反映任务演进，截断丢失会减少重建线索）。
- 根因：handoff 缺 rollup；§6 只给累加结构，无压缩/归档触发点。
- **派生项目已于 2026-08-12 按本提案 §2 机制手动执行首例 rollup**（保留近 5 段 checkpoint 原文 + 58 段压缩为「历史阶段摘要」+ 原文归档 `.ai/session-handoff-archive/2026-08-03-to-2026-08-11.md`，handoff **265KB → 19KB**），验证 §4「回测口径」可行：续接可重建性不降（近段原文 + 摘要指针 + 归档原文三层保留）。

> 注：handoff 是**本地 gitignored 续接文件**（§1/§2 明确「不进入正式提交」），与 `docs/` 入库权威文档不同。本提案只解决「本地续接文件膨胀」，不改变 handoff 的本地定位，也不替代 docs/ 回写。

## 1.1 与既有提案的关系（去重）

- **#307 docs-health-review**（已采纳归档）：`docs/` 00-09 + design 权威文档的周期性健康度复核。**对象不同**（docs/ 入库文档 vs handoff 本地续接文件），但**同源**（积累式演进导致膨胀）。docs-health-review 不覆盖 handoff——handoff 非权威源、不入库、不在 docs/ 复核范围。
- **#312 token-hotspot-trigger-nudge**（_proposals/，处理中）：token-hotspot §4.1 触发执行漂移。**机制不同**（hotspot 触发 vs handoff 历史压缩），但本提案**类比**其 §4.2 rollup 形态，为 handoff 补同类机制——这正是「token-hotspot 有 rollup、handoff 没有」的不对称缺口。
- **app-main-file-size-rule**（已归档）：代码文件膨胀阈值。**对象不同**（前端代码文件 vs handoff 文档）。

**本提案不重复它们**：现有 `session-rules §4/§6` 没有 handoff rollup；token-hotspot §4.2 rollup 仅针对 hotspot 单条记录，不针对 handoff checkpoint。差异化：把 §4.2 已验证的 rollup 形态（阈值触发 → 摘要提炼 → 旧记录归档/清理）移植到 handoff，填补 §6「只增不减」的结构缺口。

## 2. 拟改（`session-rules §4` / `§6`）

在**不引入 CI 门禁**（handoff 是 gitignored 本地文件，CI 无法检查）、**不违背「只增不删」**（用归档而非删除）前提下，为 handoff 补 rollup 机制，类比 §4.2：

1. **`§6 推荐结构` 新增「Latest checkpoint rollup」小节**，给出压缩规则：
   > ### 6.x Latest checkpoint rollup
   > - **触发**：当 handoff Latest checkpoint 累计 **≥ N 个**（建议 8-10）或文件 **≥ M 行**（建议 800-1000；具体阈值由维护者定）时，AI 在任务收尾（§4 触发点）提示 rollup。
   > - **压缩**：保留**近 3-5 个** Latest checkpoint 原文；更早的 checkpoint 压缩为一段「**历史阶段摘要**」（每个 Phase / Sprint 收口或固定时间窗口一段，提炼：任务结论 / 已完成关键项 / 未完成与待确认 / Git 锚点 commit）。
   > - **归档**：被压缩的原文 checkpoint 移入 `.ai/session-handoff-archive/YYYY-MM-DD-<range>.md`（**本地 gitignored，保留可追溯，不删除**）。
   > - **原位指针**：handoff 顶部「历史阶段摘要」段附归档文件路径指针，确保被动中断重建（§1）仍可回溯。
   > - **不替代 docs/ 回写**：有长期价值的结论（Phase 收口、验收通过、缺陷回归）仍必须回写 `docs/08/09`（§5 既有规则）；handoff 摘要只保留「续接线索」，不是项目事实。

2. **`§4 自动更新触发点` 新增一项 rollup 自检**（类比 §4.2 的收尾自检）：
   > - 结束回复前（handoff rollup 自检）：若 handoff Latest checkpoint 达 §6.x 触发阈值，提示按 rollup 流程压缩旧 checkpoint + 归档原文。

3. **`§1` / `§2` 措辞补一句**：handoff 虽为本地 gitignored，但体积仍受 rollup 约束（避免「本地文件可无限膨胀」的误读）。

## 3. 版本

模板版本：下一 **MINOR**。仅 `ai/session-rules.md` 同文件内 §4 / §6 / §1-§2 的措辞与结构补充，无新文件、无脚本、无 CI 变更（归档目录 `.ai/session-handoff-archive/` 由派生项目按需创建并自行 `.gitignore`，类比 token-hotspot `.ai/token-hotspots/`）。

## 4. 影响

- **改动文件**：`ai/session-rules.md`（§6 +rollup 小节；§4 +1 项 rollup 自检；§1/§2 措辞）。
- **不触碰**：handoff 作为续接依据的核心定位（§1-§3）；「被动中断以 Git 为唯一锚点」规则（rollup 归档不删 Git 事实，旧 checkpoint 移本地归档仍可追溯）；token-hotspot §4.2；`global-rules §8`「只增不删」（用归档实现，非删除）；`scripts/check-template.*` 不变。
- **预期效果**：handoff 体积稳定在阈值内，降低快速续接读取成本与上下文截断风险；保留近 N 个 checkpoint 原文 + 历史摘要指针，续接可重建性不降。
- **回测口径**：采纳后，派生项目 handoff 行数应稳定在阈值内；旧 checkpoint 经 rollup 后仍可通过归档文件 + 摘要指针追溯。

## 5. 备选（已评估未采）

- **CI 门禁检查 handoff 行数**：handoff 是 gitignored 本地文件，CI 无法检查。否决。
- **固定上限硬截断（删旧 checkpoint）**：违背 `global-rules §8`「只增不删」，丢失追溯。否决——用「归档 + 摘要指针」替代删除。
- **handoff 摘要入库（`ai-records/`）**：handoff 是本地过程性状态，非项目事实；入库会模糊「handoff 本地 / docs 权威」边界。否决——摘要与归档均留本地；长期价值结论回写 docs/。
- **不改（接受膨胀）**：续接读取成本持续上升 + 截断风险累积。否决。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；成熟后经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 #312 token-hotspot-trigger-nudge 同涉 §4，但不冲突——一个加 hotspot 自检项、一个加 handoff rollup 自检项）→ 辅助修改 `session-rules.md` → PR 落地。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
