# 11 模板优化汇总（供模板维护者）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在 `ai-project-template` 模板仓库内，处理 `_proposals/` 收件箱中的派生项目模板优化提案。

**快捷命令**：`/run template-proposal-summary`（自然语言：汇总模板优化提案 / 处理 proposals）。

**目的**：把多个派生项目的提案统一去重、识别冲突、分析依赖，并形成可评审的模板优化计划。

**适用场景**：模板仓库 `_proposals/` 中已有 `TEMPLATE-UPGRADE-*.md` / `*-patch.md`，或 GitHub issue 中存在 `proposal` / `feedback` / `TEMPLATE-UPGRADE:` 回流事项，准备落地模板优化。

**不适用场景**：普通派生项目日常开发；派生项目只负责起草提案，不使用本节直接改模板。若模板仓库内需要直接修改模板但尚无提案，也应先新增 `TEMPLATE-UPGRADE-*.md`。

**使用前准备**：确认当前在模板仓库，已阅读 `ai/index.md`、`CONTRIBUTING.md`、`MAINTAINERS.md`、`CHANGELOG.md` 与 `_proposals/README.md`。

**续接要求**：输出优化计划后，将分批计划、拟修改文件、版本影响、验证方式和归档计划写入 / 更新续接文件，避免长任务中断后丢失路线。

**预期产出**：提案清单、issue 镜像刷新结果、去重 / 冲突 / 依赖分析、合并或分批计划、拟修改文件清单、版本影响、验证方式和已处理提案归档计划。

**使用后下一步**：人工确认优化计划后，按模板仓库分支 → PR → 评审 → 合并流程修改文件；优化完成后，将已处理提案从 `_proposals/` 移动到 `_archive/proposals/` 归档。

> 事实来源：模板变更治理规则以 `CONTRIBUTING.md` 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

```text
请读取 _proposals/ 下所有 TEMPLATE-UPGRADE-*.md（提案）与可选 *-patch.md（具体改动建议），**先读取既有 `_proposals/_remote-issues/*.md`，再读取模板仓库带 `proposal` / `feedback` 标签的 issue**（`gh issue list --label proposal` 与 `--label feedback`——派生项目经 `submit-proposal` / `submit-feedback` 开的回流 issue），并覆盖 open issue 中标题匹配 `TEMPLATE-UPGRADE:` 的条目。远端 issue 正文必须先镜像 / 刷新到 `_proposals/_remote-issues/issue-<number>.md`，再与本地提案一并纳入分析，输出一份模板优化计划。镜像硬门禁：远端正文只允许用于生成 / 刷新镜像；没有本地镜像路径的 issue 不得进入去重、冲突、依赖、分批计划、拟修改文件或续接记录；若已误读远端正文但尚未落镜像，必须丢弃该轮分析结论，先刷新镜像，再重新读取本地镜像继续。查询远端 issue / PR 时必须避免临时过滤误判：GitHub `/issues` API 会同时返回 issue 与 PR，PowerShell 中应通过 `$null -eq $_.PSObject.Properties['pull_request']` 判断普通 issue；关闭、改标签或评论前必须做 open 列表与单项状态复核。issue 处理完后应关闭；转为实施的，落地后关闭对应 issue。

读取前先确认：
- ai/index.md 列出的全部规则文件
- CONTRIBUTING.md（模板变更治理流程）
- MAINTAINERS.md（模板维护、发布 checklist、同步清单维护）
- CHANGELOG.md（完整版本记录）
- README.md（普通使用者入口，避免塞入维护细节）
- _proposals/README.md（提案收件箱规则）
- _proposals/_remote-issues/*.md（已镜像的远端 issue；若远端更新较新，先刷新镜像）

镜像门禁检查：
- 列出本轮参与分析的 `_proposals/_remote-issues/issue-<number>.md` 路径、远端 `Updated` 和本地 `Mirrored at`。
- 对每个准备分析的远端 issue，确认镜像存在且未过期；未通过时只允许刷新镜像，不得输出正文分析。
- 优化计划中的去重、冲突、依赖、分批计划、拟修改文件、版本影响和续接记录必须引用本地镜像路径作为输入来源。

分析要求：
1. 去重：识别多个提案是否表达同一优化，合并同类项。
2. 冲突：识别是否改同一文件、同一段落、同一版本号或流程定义，并给出取舍建议。
3. 依赖：识别哪些提案必须先落地，哪些可以延后。
4. 分批治理：判断本次应一次合并改，还是拆成多个 Batch / 多个 PR，并说明理由；遵循“一批一范围、报告先行、事实与模板分离、去重可审计、可续接”。
5. 实际 diff 计划：把各 patch 的 old→new 建议合并为模板文件的真实修改清单，解决重叠和冲突。
6. 边界审查：剔除派生项目专属内容，只保留可通用于多个项目的模板优化。
7. 验证计划：列出需要运行的脚本、人工审查项和下行同步影响。
8. 归档计划：列出本次落地完成后应从 `_proposals/` 移动到 `_archive/proposals/` 的已处理提案文件；已关闭且不再参与后续 Batch 的 issue 镜像可归档或在归档说明中列明吸收范围；未处理或延后处理的提案继续留在 `_proposals/` 或 `_proposals/_remote-issues/`。
9. 远端复核：关闭 issue、改标签或评论前必须重新核对远端状态；本地镜像只作为分析输入，不替代 GitHub 权威状态。复核必须包含 open 列表和准备操作对象的单项状态；若列表与单项状态冲突，以单项状态和 GitHub 页面为准，并先向用户说明冲突。

输出格式：
1. 提案清单
2. issue 镜像刷新结果与本地镜像路径清单
3. 去重 / 冲突 / 依赖分析
4. 合并或分批计划
5. 拟修改文件清单与理由
6. 版本影响（按 `VERSION` 三段式判断 MAJOR / MINOR / PATCH / 不递增）
7. 验证方式
8. 已处理提案归档计划
9. 需要人工确认的问题

注意：AI 可辅助修改模板文件与归档已处理提案，但不得直接 push 或合并；所有改动必须经人工审查，通过模板仓库 PR 落地。
```
