# 05 技术方案（Technical Specification）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


> **文档定位**：定义技术栈、版本、依赖、配置、关键技术决策、运行资源、安全隐私、技术风险验证和 readiness gate。本文回答“用什么技术以及如何落地”，不重复 04 的架构图，不写 DB/API 字段细节。
>
> **上游输入**：`docs/04-architecture.md`、`docs/03-prd.md`、`docs/env/local-env.md`、`ai/project-rules.md`、`ai/doc-standards/05-tech-spec.md`。
>
> **下游输出**：约束 `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/design/*`、`docs/08-dev-plan.md`、`docs/09-verification.md`、代码目录、依赖文件和验证方式。

## 0. 文档元信息

【撰写提要：记录本文输入来源、覆盖范围、当前状态和最后更新时间；不得把模板占位内容当作项目事实。】
| 项 | 内容 |
|---|---|
| 输入来源 |  |
| 覆盖架构组件 | COMP-001... |
| 当前状态 | 草稿 / 待人工确认 / 已确认 |
| 最后更新 | YYYY-MM-DD |

## 1. 技术栈与版本

【撰写提要：列出已确认使用的语言、框架、运行时、数据库、模型、工具和最低版本。候选、默认关闭或预留技术必须标明“未启用”。】

| 类别 | 技术 / 版本 | 状态 | 用途 | 约束来源 | 替代品禁令 / 备注 |
|---|---|---|---|---|---|
| 语言 / 框架 / 数据库 / AI / 工具 |  | 已启用 / 已验证 / 候选 / 默认关闭 / Mock / 降级 / 禁止 |  |  |  |

## 2. 关键技术决策

【撰写提要：解释为什么选择这些技术，以及不选哪些替代方案。横切事实引用权威源，技术决策应能关联 04 ADR 或 05 Risk-ID。】

| 决策 ID | 决策 | 理由 | 替代方案 | 影响范围 | 权威源 | 验证状态 |
|---|---|---|---|---|---|---|
| TDR-001 |  |  |  |  |  | 待验证 / 已验证 / 已启用 |

## 3. 依赖与配置

【撰写提要：说明依赖来源、配置文件、环境变量、密钥管理方式、敏感性和验证方式。不要把真实密钥写入文档。】

| 类型 | 名称 / 路径 | 用途 | 启用阶段 | 当前状态 | 配置来源 | 密钥 / 敏感性 | 验证方式 |
|---|---|---|---|---|---|---|---|
| Python 包 / Node 包 / Docker 服务 / 外部 API / 数据库 |  |  | Phase1 / Phase2 | 已启用 / 已验证 / 候选 / 默认关闭 / Mock / 降级 / 禁止 | `.env` / 配置文件 / 手工输入 | 无 / secret / token / 隐私 | 命令 / TC / Spike |

状态使用原则：`候选` 不得作为实现事实；`已验证` 不等于 `已启用`；`Mock` / `降级` 不等价真实能力通过；`默认关闭` 能力不得被 Sprint 默认实现；`禁止` 状态必须被 `08` Sprint 禁止事项和 `09` 验证边界承接。

## 4. 运行环境与资源评估

【撰写提要：读取 `docs/env/local-env.md`，说明本机 Demo 是否可运行、资源瓶颈、降级策略和服务器预案。若项目涉及真实运行依赖，引用 `docs/research/*tech-env-evaluation*.md` 的 Go / Conditional Go / No-Go 结论；缺失时写明跳过理由、风险和补做时点。】

| 运行项 | 本机要求 | 当前本机是否满足 | 验证证据 | 降级 / Mock | 服务器预案 |
|---|---|---|---|---|---|
|  |  | 是 / 否 / 待确认 | 命令 / 报告 / 待验证 |  |  |

### 4.1 技术环境评估结论（如触发）

- 评估报告：`docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md` / 暂无（原因：）
- 评估结论：Go / Conditional Go / No-Go / 待评估
- 阻塞项：
- 需回填章节：`docs/05-tech-spec.md` §3 / §4 / §8 / §9、`docs/09-verification.md`、`docs/08-dev-plan.md`
- 已验证项：依赖安装 / 导入 / 最小运行 / build / dev server / Docker / 模型加载
- 未验证项与补做时点：
- 对 09 验证计划和依赖文件的影响：

## 5. Phase 技术约束

【撰写提要：说明当前 Phase 允许 / 禁止的技术能力；必须与 `ai/project-rules.md` §1、§2、§3 一致。】

| Phase | 允许 | 禁止 | Mock / 降级 | 技术状态说明 | 权威源 |
|---|---|---|---|---|---|
| Phase1 |  |  |  |  | `ai/project-rules.md` / `docs/03-prd.md` |

## 5.1 前端交互设计边界（如适用）

【撰写提要：若项目包含独立 Web、移动端、小程序、桌面端或其他可点击 UI，判断是否触发 `docs/design/frontend-interaction.md` 或 `docs/design/*interaction*.md`，以及是否需要 UI 原型策略；若豁免，写明理由。技术方案只写技术栈、运行方式、状态管理、权限执行位置、原型策略位置和工程约束，不替代页面流、空态 / 错误态、文案和验收路径。】

- 前端交互设计：需要 / 不需要 / 豁免（理由：）
- 交互设计路径：`docs/design/frontend-interaction.md` / `docs/design/...-interaction.md`
- UI 原型策略：需要 / 不需要 / 豁免（形式：Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 其他；位置：；覆盖范围：主流程 / 页面状态 / 响应式范围 / 权限与降级状态）
- 原型与验收关系：原型覆盖项应映射到 `docs/08-dev-plan.md` 前端 Sprint 和 `docs/09-verification.md` 浏览器 smoke / 人工验收 TC；原型不替代正式验收记录
- 权限边界：前端隐藏 / 禁用 / 路由守卫仅作可见性控制；权限必须由后端接口和服务层执行
- 接口依赖与验收路径：见 `docs/07-api-spec.md` / `docs/09-verification.md`

## 6. 编码约定

【撰写提要：定义命名、目录、分层、错误处理、日志、测试和格式化约定。若项目尚未编码，可给最小约定并标待回填。】

- 命名：
- 目录 / 分层：
- 错误处理：
- 日志：
- 测试：
- 格式化 / Lint：

## 7. 安全、隐私与合规考虑

【撰写提要：列出敏感数据、权限、审计、合规、数据留存、第三方服务、外部 AI 和日志要求；无则写“当前阶段无已确认要求”。】

| 项 | 要求 | 阶段 | 状态 | 权威源 | 验证入口 |
|---|---|---|---|---|---|
|  |  |  | 候选 / 已确认 / 默认关闭 / 禁止 |  | TC / Risk-ID |

## 8. 技术风险与验证计划

【撰写提要：列出需要 Spike、PoC 或资源验证的风险，并映射到 `docs/09-verification.md`、Sprint 任务或人工风险接受记录。】

| Risk-ID | 风险 | 触发条件 | 影响 | 当前状态 | 验证方式 | 对应用例 / 任务 | 解锁条件 |
|---|---|---|---|---|---|---|---|
| RISK-001 |  |  |  | 待验证 / 已验证 / 已接受 / 阻塞 | 命令 / Spike / PoC / TC | TC-001 / Sprint-X / task-00X |  |

## 9. Readiness Gate（如触发）

【撰写提要：真实外部服务、数据库、LLM、Docker / 部署、重型 SDK 或权限安全能力进入 Sprint 前，必须给出 readiness gate 结论；Lean 项目无触发项时写“不适用”及理由。】

| Gate | 适用对象 | 进入标准 | 必需证据 | 状态 | 阻塞项 / 下一步 |
|---|---|---|---|---|---|
| RG-001 | 外部 API / 数据库 / LLM / Docker / 部署 |  | `docs/research/*tech-env-evaluation*.md` / 命令输出 / TC | Go / Conditional Go / No-Go / 待评估 |  |

最低通过标准：已引用运行环境；已列出依赖配置、敏感性、验证方式和启用阶段；已给出 Go / Conditional Go / No-Go 结论；Conditional Go 必须说明限制条件和补做时点；No-Go 必须阻止相关 Sprint 或 Phase 升级。

## 10. 待人工确认项

【撰写提要：记录本阶段仍需人工确认的事项；必须包含 AI 建议、建议依据、备选方案和取舍影响，确认前不得写成事实。】
> 待确认项必须保留 AI 建议、建议依据、备选方案和取舍影响；AI 建议不等于用户确认。

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 |  |  |  |  |  |
