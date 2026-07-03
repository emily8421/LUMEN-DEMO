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
