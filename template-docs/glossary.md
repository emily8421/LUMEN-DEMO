# Glossary（模板术语表）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本术语表是**人读索引**，帮助使用者快速理解 `ai-project-template` 的核心词汇、缩写和常见误用。它不替代规则文件、`ai/doc-standards/` 或项目事实文档；若术语解释与权威规则冲突，以权威来源为准。

## 1. 文档链路

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| PLM | 从输入材料到需求、设计、计划、验证、代码的可追溯生命周期链路。 | `ai/document-lifecycle-rules.md` | 把 PLM 当成只生成 `docs/` 的一次性流程。 |
| Scenario | `docs/00-scenario.md` 的工程想定与典型场景。 | `ai/doc-standards/00-scenario.md` | 在 00 里写完整功能清单或技术方案。 |
| URS | User Requirements，`docs/01-user-requirements.md` 的用户需求全集。 | `ai/doc-standards/01-user-requirements.md` | 把系统实现细节写成用户需求。 |
| SRS | Software Requirements Specification，`docs/02-srs.md` 的系统需求规格。 | `ai/doc-standards/02-srs.md` | 从 SRS 直接新增 PRD 外功能。 |
| PRD | `docs/03-prd.md`，定义功能范围、优先级、Phase 路线图和交付物形态。 | `ai/doc-standards/03-prd.md` | 把愿景能力直接写成当前 Phase 必做。 |
| Architecture | `docs/04-architecture.md`，描述系统边界、组件、模块、流程和运行拓扑。 | `ai/doc-standards/04-architecture.md` | 在架构文档里写具体依赖版本或表字段。 |
| Tech Spec | `docs/05-tech-spec.md`，描述技术栈、依赖、资源、风险和 readiness gate。 | `ai/doc-standards/05-tech-spec.md` | 把候选依赖写成已启用。 |
| DB Design | `docs/06-db-design.md`，仅在项目有持久化数据库时保留。 | `ai/doc-standards/06-db-design.md` | 无数据库时仍预留空表设计。 |
| API Spec | `docs/07-api-spec.md`，描述接口、命令、SDK、事件或集成契约。 | `ai/doc-standards/07-api-spec.md` | 只把 REST API 算作接口，忽略 CLI / SDK 契约。 |
| Dev Plan | `docs/08-dev-plan.md`，把 Phase 拆成 Sprint / Task 和验证包。 | `ai/doc-standards/08-dev-plan.md` | 用 handoff 替代正式进度摘要。 |
| Verification | `docs/09-verification.md`，记录测试用例、资源验证和验收结果。 | `ai/doc-standards/09-verification.md` | 未运行验证就写“已通过”。 |

## 2. ID / 追溯

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| SC-ID | 场景编号，用于从输入 / 愿景追溯到用户场景。 | `ai/doc-standards/00-scenario.md` | 只有背景叙述，没有可追溯场景。 |
| U-ID | 用户需求编号，必须能回到场景或人工输入来源。 | `ai/doc-standards/01-user-requirements.md` | 无来源的 AI 推断需求。 |
| REQ-ID | 系统需求编号，连接用户需求、Phase、设计、任务和测试。 | `ai/doc-standards/02-srs.md` | 功能点没有对应用户价值或验收口径。 |
| NFR | 非功能需求，如性能、安全、隐私、资源、可维护性。 | `ai/doc-standards/02-srs.md` | 把 NFR 当成可选备注，不进入验证。 |
| COMP-ID | 架构组件编号。 | `ai/doc-standards/04-architecture.md` | 新增组件无法追溯到 REQ / NFR。 |
| MOD-ID | 模块编号，通常挂在组件下。 | `ai/doc-standards/04-architecture.md` | 模块边界与代码目录随意漂移。 |
| Flow-ID | 关键流程编号，连接场景、架构、接口和测试。 | `ai/doc-standards/04-architecture.md` | 只画流程图，不给可追溯编号。 |
| API-ID | 接口或命令契约编号。 | `ai/doc-standards/07-api-spec.md` | 接口没有错误码、权限或 TC 映射。 |
| TC-ID | Test Case 编号，记录验证步骤和通过标准。 | `ai/doc-standards/09-verification.md` | 把临时手测描述当作正式用例。 |
| Risk-ID | 技术风险编号，连接 `05` readiness gate 和 `09` 验证证据。 | `ai/doc-standards/05-tech-spec.md` | 只写风险，不写验证方式和解锁条件。 |
| ADR | Architecture Decision Record，记录重要架构取舍。 | `docs/README.md`、`ai/document-lifecycle-rules.md` | 把横切事实散落在多个文档里。 |

## 3. 阶段 / 交付物

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| Phase | 产品路线图阶段，定义当前允许 / 禁止 / 下一阶段预告。 | `docs/03-prd.md`、`ai/project-rules.md` | 默认 Phase1 就是 MVP。 |
| Sprint | Phase 内的可验收增量。 | `docs/08-dev-plan.md` | 一个 Sprint 承载整个系统。 |
| Task | 从 Sprint 拆出的单任务，通常限制在小范围文件 / 模块。 | `ai/implementation-lifecycle-rules.md` | 单个 Task 混入多个无关功能。 |
| Demo | 核心价值可演示，可有 Mock / 降级，但必须标明边界。 | `ai/global-rules.md` | 把 Demo 声称为 MVP / 产品。 |
| MVP | 可真实上线的最小产品，包含关键生产要素。 | `ai/global-rules.md` | 用 Mock 通过演示就宣称 MVP。 |
| 产品 | 全功能生产化形态，覆盖愿景完整图景和运营要求。 | `ai/global-rules.md` | 在早期 Phase 过早写死完整产品细节。 |
| 愿景 | 长期完整图景或上游叙事，不等于当前阶段范围。 | `docs/vision/product-vision.md`、`ai/global-rules.md` | 把愿景功能直接塞进当前 Sprint。 |

## 4. 状态词典

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| 草案 | 尚未完成审查的临时起草内容。 | `ai/document-lifecycle-rules.md` §7.1 | 把草案作为唯一编码依据。 |
| 候选 | 可能采用的方案、依赖、接口或需求。 | `ai/document-lifecycle-rules.md` §7.1 | 把候选写成已启用。 |
| 待人工确认 | AI 无法替用户决定的事实、范围、成本、权限或风险。 | `ai/document-lifecycle-rules.md` §6.1 | 把 AI 建议写成已确认事实。 |
| 待技术验证 | 技术可行性、性能、资源或集成方式尚未实证。 | `ai/document-lifecycle-rules.md` §7.1 | 未做 Spike / PoC 就进入真实实现。 |
| Mock | 为演示、测试或未接入依赖而模拟的数据 / 服务 / 行为。 | `ai/document-lifecycle-rules.md` §7.1 | 声称已接入真实系统。 |
| 降级 | 主路径不可用时的备用方案或功能收缩。 | `ai/document-lifecycle-rules.md` §7.1 | 不说明触发条件和用户影响。 |
| 默认关闭 | 能力存在或预留，但当前交付默认不启用。 | `ai/document-lifecycle-rules.md` §7.1 | 把默认关闭能力计入当前验收成果。 |
| 预留 / 未启用 | 设计或代码留扩展点，但当前阶段不用。 | `ai/document-lifecycle-rules.md` §7.1 | 写成当前 Phase 已实现。 |
| 已验证 | 已通过指定验证方式得到证据。 | `docs/09-verification.md` | 把已验证等同于已启用。 |
| 已启用 | 已在当前交付物默认启用或演示 / 生产路径可用。 | `ai/document-lifecycle-rules.md` §7.1 | 没写启用范围、配置和回退方式。 |
| 禁止 | 项目或模板明确不允许的做法。 | `ai/project-rules.md`、`ai/global-rules.md` | 绕过规则，在代码里“先实现再说”。 |

## 5. 原型 / 前端交互

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| 需求探索原型 | `00-03` 正式定稿前的可视化澄清材料。 | `ai/document-lifecycle-rules.md` §10.2 | 把探索原型当正式需求或实现依据。 |
| UI 原型策略 | 进入前端实现前选择是否需要可视化原型、形式、覆盖范围和证据位置。 | `ai/doc-standards/ui-prototype-strategy.md` | 误以为所有 UI 项目都必须 Figma 高保真。 |
| 实现前原型 | 已有需求链和基本设计后，用于辅助实现和验收映射的 UI 原型。 | `template-docs/ui-prototype-strategy-template.md` | 借原型新增未授权接口或权限规则。 |
| 前端交互设计 | `docs/design/*interaction*.md`，细化页面、用户流、状态、文案、接口依赖和验收路径。 | `ai/doc-standards/frontend-interaction.md` | 用前端隐藏 / 禁用替代后端权限边界。 |
| 可视化证据 | 截图、Storybook、代码原型、设计链接或标注图等可供评审的界面证据。 | `ai/doc-standards/ui-prototype-strategy.md` | 把可视化证据当作 `09` 验收通过记录。 |

## 6. 会话续接

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| handoff | `.ai/session-handoff.md`，本地会话续接状态文件。 | `ai/session-rules.md` | 当作正式项目事实或验收记录。 |
| fresh | handoff 的分支、HEAD、版本和进度与 Git 客观事实一致。 | `ai/session-rules.md` | 不复核 Git 就信任旧 handoff。 |
| stale | handoff 与 Git 或当前任务不一致，需以 Git 为准并向用户确认。 | `ai/session-rules.md` | 用过期“下次优先做”直接继续修改。 |
| 主动中断 | 用户或 AI 正常收尾，handoff 通常可信。 | `ai/session-rules.md` | 忽略后续 Git 变更。 |
| 被动中断 | CLI 撞 token / 时间上限 / 跨工具接手等导致 handoff 可能缺失或落后。 | `ai/session-rules.md` | 从私有会话缓存推断项目事实。 |
| 快速续接 | 只读恢复摘要模式，不联网、不继续执行任务。 | `ai/session-rules.md` §3.1 | 把“读取续接点”误当成执行下一步。 |

## 7. 模板治理 / 同步

| 术语 | 简短定义 | 权威来源 | 常见误用 |
|---|---|---|---|
| proposal | `_proposals/TEMPLATE-UPGRADE-*.md` 或带 proposal 标签的 issue，记录模板优化建议。 | `_proposals/README.md` | 未成提案就直接改模板规则。 |
| feedback | 使用问题或模板体验反馈，可转为 proposal。 | `ai/commands/submit-feedback.md` | 把反馈当作已批准需求。 |
| mirror | `_proposals/_remote-issues/issue-<number>.md`，远端 issue 的本地镜像。 | `_proposals/README.md` | 直接基于未落盘远端正文做分析。 |
| sync | 派生项目从模板仓下行同步方法论文件。 | `scripts/sync-template.sh`、`template-sync.json` | 同步时覆盖项目业务事实。 |
| template-sync | `template-sync.json`，定义下行同步文件清单。 | `template-sync.json` | 把项目专属 README 或业务 docs 纳入通用同步。 |
| 下行同步 | 模板方法论文件从模板仓同步到派生项目。 | `template-docs/template-methodology.md` | 误以为会同步派生项目代码或业务文档。 |
| 回流 | 派生项目的通用经验经提案回到模板仓。 | `CONTRIBUTING.md`、`_proposals/README.md` | 带入客户 / 账号 / 路径等项目敏感细节。 |
| 归档 | 已处理提案移动到 `_archive/proposals/` 留痕。 | `_proposals/README.md` | 处理完成后仍留在 `_proposals/` 造成重复分析。 |
