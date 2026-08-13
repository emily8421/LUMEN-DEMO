# 已处理模板优化提案归档

本目录保存已经处理完成、但仍需保留审计记录的模板优化提案。

归档原则：

- `_proposals/` 是待处理 / 汇总中的提案收件箱。
- `_archive/proposals/` 是已处理提案的历史记录。
- 提案归档后，模板变更事实仍以根目录 `VERSION`、README 版本记录和 Git 历史为准。
- 归档内容不得作为当前待办事项重复执行；若要再次调整，应创建新的 `TEMPLATE-UPGRADE-*.md` 提案。

## 已归档提案

| 提案 | 采纳模板版本 | 归档说明 |
|---|---|---|
| `TEMPLATE-UPGRADE-document-lifecycle-generation-rules.md` | `v1.8.0`，本项目已同步至 `v1.20.0` | 模板已新增 `ai/document-lifecycle-rules.md`，并在 `ai/index.md`、`template-sync.json` 与相关 Prompt 中纳入文档生命周期规则。 |
| `TEMPLATE-UPGRADE-document-lifecycle-generation-rules-patch.md` | `v1.8.0`，本项目已同步至 `v1.20.0` | 对应补丁建议已由模板版本记录中的文档生命周期规则落地覆盖。 |
| `TEMPLATE-UPGRADE-phase-overview-table.md` | `v1.24.2`，本项目已同步至 `v1.25.0` | `global-rules §8.1` + `docs/03-prd.md §3` 增加「双维度总览表」撰写推荐（阶段 × 交付物形态全景）。 |
| `TEMPLATE-UPGRADE-readme-version-check.md` | `v1.24.3`，本项目已同步至 `v1.25.0` | `check-derived-sync` 新增非阻断「README 模板版本号 vs VERSION」一致性告警。 |
| `TEMPLATE-UPGRADE-derived-feedback-channel.md` | `v1.25.0`，本项目已同步至 `v1.25.0` | 来源标识规则（§9）+ `submit-proposal`/`submit-feedback` 命令（17/18 prompt）+ Issue 模板 + `template-proposal-summary` 扩展读 issue。 |
| `TEMPLATE-UPGRADE-powershell-sync-fallback-utf8.md`（issue #92） | PR #99（v1.30.x），本项目已同步至 `v1.43.0` | Windows PowerShell 5.1 同步脚本 Git Bash / UTF-8 fallback，已落入 `git-guide.md §5.1` 与同步脚本 fallback 逻辑。 |
| `TEMPLATE-UPGRADE-submit-proposal-gh-robustness.md`（issue #93） | PR #97（v1.30.x），本项目已同步至 `v1.43.0` | `submit-proposal` 改用 `--body-file`，补充创建前校验、来源标签降级与失败恢复流程。 |
| `TEMPLATE-UPGRADE-00-03-requirements-chain-standard.md`（issue #105） | `v1.33.0`，本项目已同步至 `v1.43.0` | 00-03 需求链文档规范已落地为 `ai/doc-standards/00-03`。 |
| `TEMPLATE-UPGRADE-04-05-architecture-tech-standard.md`（issue #106） | `v1.34.0`，本项目已同步至 `v1.43.0` | 04-05 架构与技术方案规范已落地为 `ai/doc-standards/04-05`。 |
| `TEMPLATE-UPGRADE-06-07-db-api-contract-standard.md`（issue #107） | `v1.36.0`，本项目已同步至 `v1.43.0` | 06-07 DB / API 契约规范已落地为 `ai/doc-standards/06-07`。 |
| `TEMPLATE-UPGRADE-08-dev-plan-progress-standard.md`（issue #108） | `v1.37.0`，本项目已同步至 `v1.43.0` | 08 开发计划 / 任务拆分 / 进度留痕规范已落地为 `ai/doc-standards/08`。 |
| `TEMPLATE-UPGRADE-09-verification-standard-detail.md`（issue #109） | `v1.37.0`，本项目已同步至 `v1.43.0` | 09 Verification 文档规范已落地为 `ai/doc-standards/09`。 |
| `TEMPLATE-UPGRADE-design-doc-standard.md`（issue #110） | `v1.38.0`，本项目已同步至 `v1.43.0` | `docs/design/*` 通用详细设计规范已落地为 `ai/doc-standards/design-doc.md`。 |
| `TEMPLATE-UPGRADE-ui-brief-intake-guidance-scenario.md`（issue #192） | `v1.49.0`，本项目已同步至 `v1.59.0` | 模板已新增 UI Brief Intake 场景、`template-docs/ui-brief-intake-template.md`、输入评审 / 原型探索 / 编码前门禁衔接。 |
| `TEMPLATE-UPGRADE-ui-exploration-to-delivery-pipeline.md`（issue #191） | `v1.50.0`，本项目已同步至 `v1.59.0` | UI Exploration to Delivery Pipeline、UI-G-001~007、experience brief、视觉候选与回填链路已落地。 |
| `TEMPLATE-UPGRADE-v1.44.0-ui-prototype-gate.md`（issue #182） | `v1.50.0`，本项目已同步至 `v1.59.0` | 实现前 UI 原型 Gate、默认行业 UI 标准、UI / 后端实施顺序判断已被 v1.50.0 吸收。 |
| `TEMPLATE-UPGRADE-web-fullstack-skeleton-gate.md`（issue #187） | `v1.48.0` / `v1.57.0`，本项目已同步至 `v1.59.0` | Web Fullstack Profile 先落地为 Web 特化结构门禁，后续由 v1.57.0 通用 System Skeleton Gate 吸收并保留 Web 特化扩展。 |
| `TEMPLATE-UPGRADE-windows-utf8-rule-reading.md`（issue #207） | `v1.52.5`，本项目已同步至 `v1.59.0` | `ai/rules-core.md`、`ai/session-rules.md`、`ai/commands/resume.md` 已补 Windows / PowerShell 中文规则显式 UTF-8 读取与乱码处理。 |
| `TEMPLATE-UPGRADE-app-main-file-size-rule.md`（issue #232） | `v1.56.3`，本项目已同步至 `v1.59.0` | `template-docs/web-fullstack-profile.md` 已补主应用文件职责边界、业务下沉约束和 state / handler 软上限；行数阈值已由 Web Profile 覆盖。 |
| `TEMPLATE-UPGRADE-powershell-start-process-path-normalization.md`（issue #293 / #296） | v1.59.1 / v1.59.2（PR #295 / #298），LUMEN 待下行同步 | `Repair-ProcessPathEnvironment` 脚本 helper + `demo-runbook-template §4` Windows Start-Process 指南；core ask 由 #295 覆盖、#296 补文档 residual。 |
| `TEMPLATE-UPGRADE-token-hotspot-trigger-nudge.md`（issue #312） | v1.60.3（PR #315），LUMEN 待下行同步 | `session-rules §4` 收尾自检项 + §4.1 触发强化 + §4.2 收尾即查未汇总计数。 |
| `TEMPLATE-UPGRADE-handoff-checkpoint-rollup.md`（issue #314） | v1.61.0（PR #327），LUMEN 待下行同步 | `session-rules §6.1` handoff Latest checkpoint rollup 机制；派生项目已按 §6.1 实战验证（265KB→19KB），实证评论已补 #314。 |
| `TEMPLATE-UPGRADE-db-safety-concern.md`（issue #320） | v1.61.0（PR #326 Batch A），LUMEN 待下行同步 | `implementation-lifecycle-rules §6` 破坏性测试数据库安全 guard。 |
| `TEMPLATE-UPGRADE-global-rules-l0-code-principles.md`（issue #322） | v1.61.0（PR #326 Batch A），LUMEN 待下行同步 | `global-rules §2` L0 通用代码原则基线。 |
| `TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`（issue #332） | v1.61.4（PR #341），本项目已同步至 v1.61.4 | 通用层代码一致性补充已落地 `global-rules §2.1` 应用说明（#332 退回重写稿）。 |
| `TEMPLATE-UPGRADE-web-profile-code-consistency.md`（issue #333） | v1.61.2（PR #338），本项目已同步至 v1.61.4 | Web Profile 代码层一致性基线已落地 `template-docs/web-fullstack-profile.md §9`（#333 Batch A）。 |
| `TEMPLATE-UPGRADE-ai-code-governance-routing-map.md`（issue #335） | v1.61.3（PR #339），本项目已同步至 v1.61.4 | 规则分层地图选 A 不引入；gap A/B 已落地「去重声明必填 + 自动检查归位」（v1.61.3）。 |
| `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` | 已拆分 | 实证索引·已拆分：回流走 A/B/C（#332/#333/#334）；A/B 已落地，C（#334）暂缓保留。 |
