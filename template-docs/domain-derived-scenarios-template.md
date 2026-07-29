# Domain-Derived Scenarios Template（领域派生项目场景剧本模板）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

定位：本文件是 **L2-to-L3 playbook template**，给领域模板复制后领域化。领域模板可将本文件复制为 `template-docs/<domain>/domain-derived-scenarios.md`，再替换 `<domain>`、领域事实、脚本名、清单名和验证项。

本文件只提供通用骨架，不承载 agent / OCR / IoT 等具体领域内容，不替代母模板 `scenario-guides.md` 的两层主路径，也不实现 `new-project --profile <domain>` 或多级同步自动化。

## 0. 元信息与使用边界

| 项 | 填写 |
|---|---|
| 领域模板 | `<domain-template-repo>` |
| 领域名 | `<domain>` |
| 领域派生项目 | `<domain-derived-project>` |
| 继承来源 | `ai-project-template` + 当前领域模板版本 |
| 领域同步入口 | `<domain-sync-script>` |
| 领域自检入口 | `<domain-check-script>` |
| 维护者 | `<owner>` |

使用本剧本前先确认当前仓库角色：

1. **母模板 L1**：只维护通用方法论，不直接创建领域派生项目。
2. **领域模板 L2**：维护领域 scaffold、领域同步清单、领域自检和本剧本。
3. **领域派生项目 L3**：从领域模板接收领域 overlay，不直接跨层同步母模板。

## 1. 适用性判断

| 用户目标 | 路由 |
|---|---|
| 创建普通业务项目 | 回到母模板 A2 / `new-project`，不走本剧本 |
| 创建或维护领域模板 | 走母模板 A20 / `/run domain-template-lab` |
| 从领域模板创建同类项目 | 走本 L2→L3 剧本 |
| 同步普通项目的母模板方法论 | 走母模板 A13 |
| 同步领域派生项目的领域标准件 | 走本剧本的领域同步流程 |
| 把领域经验回流给上游 | 领域 L3 先回流 L2；跨领域通用结论由 L2 提炼后回流 L1 |

不适用情况：

- 只有一个项目需要这些内容，尚未证明领域标准件可复用。
- 需要修改母模板同步协议或 `git-guide.md` 主路径。
- 想把领域项目事实直接写回母模板。

## 2. 创建领域派生项目

过渡期可以用组合流程：

1. 从领域模板仓库或指定骨架复制项目初始目录。
2. 写入领域派生项目自己的 `VERSION`、`CHANGELOG.md`、`CHANGELOG-PLAIN.md` 和 `TEMPLATE-BASE.md`。
3. 记录继承信息：领域模板仓库、领域模板版本、领域标准件范围。
4. 复制领域 overlay 文件时采用 copy-if-missing 原则，不覆盖项目事实。
5. 初始化 Git 后运行领域自检，确认同步边界。

成熟期如果领域模板提供 profile 或脚本，可以改为：

```text
<domain-sync-script> new --name <domain-derived-project> --from <domain-template-repo>
```

本模板不规定脚本名。领域模板必须在自己的剧本里写清楚真实命令、参数、目标目录和失败回滚方式。

## 3. 同步领域模板更新

领域派生项目只从领域模板同步领域 overlay。推荐最小流程：

1. 读取领域派生项目的 `TEMPLATE-BASE.md`，确认上游是 `<domain-template-repo>`。
2. 运行 dry-run，列出将新增、修改、跳过的文件。
3. 确认 copy-if-missing 与 preserve-project-version 是否生效。
4. 用户确认后再 commit 同步。
5. 将运行记录写入领域模板约定的同步记录目录。

同步不得覆盖：

- 项目自身 `docs/` 事实。
- 项目自身版本与 changelog。
- 业务代码、业务配置、密钥、客户数据。
- 已明确由项目维护的领域配置。

## 4. 初始化后整理与领域自检

创建或同步后，按此顺序整理：

1. 填写项目身份、目标用户、交付边界和环境前提。
2. 填写领域必需 facts、checklist、risk register 或 eval 配置。
3. 运行领域自检脚本。
4. 若自检只有 advisory，记录风险后可继续；若是 gate，必须修复或暂停。
5. 将验证摘要写入项目记录，不把项目事实回写母模板。

领域模板应在自己的 `domain-derived-scenarios.md` 中列出具体文件，例如：

```text
template-docs/<domain>/checklist.md
template-docs/<domain>/rules.md
scripts/check-domain-derived-sync.ps1
scripts/check-domain-derived-sync.sh
```

## 5. 领域派生项目日常开发

母模板的通用 A 场景仍适用：需求、设计、实现、验证、PR、CI、版本和回流流程不重写。

领域派生项目在执行这些场景前，还要叠加领域规则：

- 开始任务前读取领域模板规定的 rules / checklist。
- 修改领域 overlay 文件前确认是否应回流 L2。
- 发现跨项目共性问题时先进入领域模板收件箱。
- 只有 L2 提炼出的跨领域通用结论，才提交到母模板。

## 6. L3→L2 回流

领域派生项目回流给领域模板的内容包括：

- 领域 scaffold 缺口。
- 领域 checklist 漏项。
- 领域同步清单误覆盖或漏同步。
- 多个同类项目可复用的 prompt、脚本、评估样例或验收口径。

不直接回流给母模板的内容包括：

- 单个领域项目的业务事实。
- 领域专属工具、字段、流程和客户约束。
- 尚未在多个领域项目验证的候选做法。

## 7. 领域模板发布后的下游同步

领域模板发布后，维护者应给领域派生项目一份同步说明：

1. 领域模板新版本号和变更摘要。
2. 受影响的领域 overlay 文件。
3. 推荐 dry-run 命令。
4. 必跑自检命令。
5. 已知迁移风险和人工检查项。

领域派生项目完成同步后，应记录：

- 同步前后版本。
- dry-run 摘要。
- 实际变更文件。
- 自检结果。
- 项目侧保留或跳过的文件。

## 8. 验证与完成判据

本剧本的一次执行完成，至少满足：

- 已确认当前是 L2→L3 路径，不是普通 L1→L3 路径。
- 已明确领域模板版本和领域派生项目身份。
- 已运行领域模板要求的 dry-run 或说明为何暂无脚本。
- 已运行领域自检或列明阻塞原因。
- 已记录同步结果、待办和回流项。
- 未让领域 L3 直接跨层同步母模板。

## 9. 待确认项

领域模板复制本模板后，必须把以下项从占位改成真实内容：

- 领域名与仓库名。
- 领域创建命令。
- 领域同步命令。
- 领域自检命令。
- 领域 overlay 文件清单。
- 领域 L3 回流入口。
- 发布后通知和同步记录格式。

## 10. 禁止事项

- 不把领域 scaffold 写进母模板默认同步范围。
- 不让领域派生项目同时直接同步母模板和领域模板。
- 不把领域项目业务事实回写母模板。
- 不把未验证的领域候选资产写成成熟机制。
- 不用本模板绕过领域模板自己的版本、changelog 和验证记录。
