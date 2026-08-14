# Token 优化候选评估与决策记录（2026-08-14）

> 类型：阶段分析记录（候选评估 + 人工决策留痕）。本文不新增需求 / 接口 / 验收目标；项目事实以 `docs/08-dev-plan.md` / `docs/09-verification.md` / `ai/project-rules.md` / Git 历史为准。
> 范围：token 消耗根因分析结论（2026-08-14）的候选清单评估与本轮决策（做 A1 + A2 + B4，攒实证 B3/B5/B6，观察 C7）。
> 关联：`ai-records/token-hotspots/SUMMARY.md` §4（改进建议）、`ai-records/pitfalls/SUMMARY.md` §5（smoke 一键启动合流）、`.ai/token-hotspots/2026-08-14-summary-backfill-and-token-analysis.md`（根因分析）。

## 1. 背景与触发

2026-08-14 会话对 token 消耗做根因分析，结论：

- **最大固定成本 = 规则入口底座**，其中 `ai/project-rules.md` §1 批次史（批7-30 单行巨段）为最大单项。
- 已在本会话完成 project-rules 治理精简（§1 批次史压缩 + §1 再次精简，整文件 -43%，21.6k→12.3k 字符），直推 main `030f3ce`。
- 决定「本项目先尝试压缩 → 实证后回流模板（历史锚点压缩模式）」。

在精简之上，用户要求将 token 优化候选清单（A/B/C 三组）写入续接点，本会话完成评估并落盘决策。

## 2. 候选清单评估

### A. 项目内可直接做（低风险，价值直接）

| 项 | 内容 | 证据 | 评估结论 |
|---|---|---|---|
| **A1** | browser smoke 一键启动脚本（demo 后端 + 前端 + CDP） | token-hotspot SUMMARY §4 P1 + pitfall SUMMARY §5 合流；`.tmp/sliceD-workspace-smoke.mjs` 已含真实凭证登录 + localStorage 注入 + CDP 拉起，但假设 18000/5174 已在跑 | **做（本轮）**：缺的只是「起 demo 服务」编排层；`scripts/run-sprint16-demo.ps1` 已是一键 demo 启动器（-Detached + runtime.json），编排器复用即可 |
| **A2** | 两条编码流程约定：① 登记基线文件改动本地验证加 `npm run check:file-size`；② 写 UI smoke 前先读目标组件渲染条件 | token-hotspot SUMMARY §7.1 阶段 C 待改进（B-4 一次 CI ratchet 往返 + 4 轮 smoke 试错） | **做（本轮）**：成本极低，写进 project-rules §5 一行执行纪律，不引入 check 断言 / CI 门禁（守 SUMMARY §5 定调） |
| **A3** | demo 脚本「仅重载后端」+ LLM 通道验证单一脚本 | usepostgres hotspot（信息量最少） | **攒实证**：价值中等，维护态小改，不单独开一轮 |

### B. 规则 / 模板层候选（攒实证再回流）

| 项 | 内容 | 评估结论 |
|---|---|---|
| **B4** | document-lifecycle 按章节读取（回写只读状态词 / 反向同步 / 变更传播 / 自检） | **采纳为执行纪律（本轮）**：阶段 A/B 持续热点，但 SUMMARY §5 定调「避免过度治理，先当执行纪律、回流等实证」——立即执行零规则改动，攒实证后再判断回流 |
| **B5** | vertical slice 最小参照清单 | **暂缓**：需先设计；codegen 已全闭环，后续 slice 类任务频率未估，设计成本 vs 未来收益不确定 |
| **B6** | 编码任务规则裁剪（global-rules §8 阶段标签对编码非必需） | **非本轮**：涉及模板规则，影响面大，需更多实证 |

### C. 观察项（时间未到）

| 项 | 内容 | 结论 |
|---|---|---|
| **C7** | §4.2 触发稳定性观察（未来 2-3 会话收尾核对「未汇总 ≥3 份」是否稳定触发） | **观察**：本轮收尾自检顺带核对，不发起轻量提案 |

## 3. 决策

人工确认（2026-08-14）：

- **本轮做**：A1（一键 smoke 脚本，**入库 `scripts/`**，团队复用）+ A2（project-rules §5 两行约定）+ B4（采纳为执行纪律）。
- **攒实证**：A3、B5、B6。
- **观察**：C7（会话收尾核对）。

## 4. 待办与落点

| 项 | 落点 | 状态 |
|---|---|---|
| A1 编排器 | `scripts/run-smoke.ps1`：起 demo（复用 run-sprint16-demo.ps1 -Detached）→ 等 ready → 跑 smoke .mjs → finally 停止 | 本轮 |
| A2 两行约定 | `ai/project-rules.md` §5.1 | 本轮 |
| B4 执行纪律 | 每次回写 document-lifecycle 只读需要的章节（状态词 / 反向同步 / 变更传播 / 自检） | 本轮起生效 |
| B5 / B6 / A3 | 攒实证后另议（B5 待下一个 slice 类任务启动时顺手攒参照） | 暂缓 |
| C7 | 会话收尾自检核对 §4.2 触发 | 观察中 |

## 5. 追溯索引

- 根因分析：`.ai/token-hotspots/2026-08-14-summary-backfill-and-token-analysis.md`（本地，gitignored）
- 改进建议源：`ai-records/token-hotspots/SUMMARY.md` §4（P1 建议）+ `ai-records/pitfalls/SUMMARY.md` §5（合流）
- project-rules 精简落地：Git commit `030f3ce`（docs(rules): project-rules 治理精简）
- 本轮落地：A1 → `scripts/run-smoke.ps1`；A2 → `ai/project-rules.md` §5.1（见对应 commit）
