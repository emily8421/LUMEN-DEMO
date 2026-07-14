# 16 文档体系全链路回溯审计

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：项目已成型（完成若干 Sprint / Phase）后，用 `ai/document-lifecycle-rules.md` 回溯审视整条 PLM 链路的合理性、可行性与一致性；派生项目同步模板方法论后，可作为同步后审计模式，判断旧方法生成内容是否需要按新方法回梳。

**目的**：一次性产出全链路健康度报告，而不是分别跑生成、编码前验收、合规审查再拼接；定位追溯断点、横切传播残留、外部文档孤岛和阶段可行性缺口。

**与 docs-evaluation 的区别**：`docs-system-audit` 偏事后全链路回溯和同步后回梳，重点发现断点、漂移和规范基线缺口；`docs-evaluation` 偏阶段转换判断、单文档评估和正式评估留痕，输出 `Go / Conditional Go / No Go`。

**适用场景**：项目已成型，想用最新方法论回头审视「vision → 需求是否合理、需求 → 设计是否可行、设计 → 计划 → 验证是否自洽」；或刚完成 `sync-methodology`，需要确认旧派生文档与最新方法论之间的兼容差异、规范基线缺口和项目事实问题。

**不适用场景**：

- 刚生成 03-09、准备进入编码前验收 → 用 `ai/prompts/review/10-docs-checklist.md`。
- 审查实现是否符合设计、是否越界 → 用 `ai/prompts/review/03-project-review.md`。
- 从输入生成 / 补齐文档体系 → 用 `ai/prompts/docs/00-generate-or-complete-docs.md`。

**使用前准备**：完整的 `docs/00-09`（及 `docs/design/*`、`docs/decisions/*`、`docs/inputs/*` 等项目事实）、`ai/project-rules.md`、`docs/env/local-env.md`，以及人工已知的项目边界。

**预期产出**：链路健康度总览表 + 各维度问题清单（定位 `文件:行` + 权威源）+ 回梳计划（按横切事实分组）+ 审计新发现（可行性 / 部署缺口）+ 待人工确认项。**不改文件，先出报告。**

**使用后下一步**：确认后按 `ai/prompts/docs/04-edit-single-doc.md` 做最小变更回梳；若发现实现越界，用 `ai/prompts/review/03-project-review.md` 或 `ai/prompts/dev/05-fix-bug.md`。

```text
请基于 ai/index.md 列出的规则文件（尤其 ai/document-lifecycle-rules.md）+ 本项目 docs/ 全部文档，做一次「文档体系全链路回溯审计」。

适用场景：项目已成型（完成若干 Sprint / Phase），用最新方法论回头审视整条 PLM 链路的合理性、可行性与一致性；或派生项目刚完成模板方法论同步，需要执行“同步后审计模式”。区别于 00（生成）/ 10（编码前验收）/ 19（阶段评估）/ 03（合规审查），本提示词是「事后全链路回溯」。

若为同步后审计模式，请先读取最近一次 `sync-records/template-sync/` 同步运行记录；若不存在，再兼容读取旧路径 `docs/archive/template-sync/`。输出时单独列出“同步后回梳建议”，说明哪些是新规范带来的结构缺口，哪些是可接受兼容差异，哪些是项目事实风险。

按以下维度逐段核查并输出：

1. 纵向追溯链（document-lifecycle-rules §6）：输入 → U-ID → REQ-ID → Phase → 模块 / 表 / 接口 / Sprint / 用例，是否闭合、有无悬空 ID。
2. 横切一致性（§7）：每个横切事实（平台能力 / 合规裁决 / 技术选型禁令 / 可行性核实）是否有唯一权威源；他处引用而非各自声明。
3. 变更传播（§9）：上游变更（尤其已核实横切事实）是否传播到所有下游；列出残留（措辞过时 / 未引用权威源）。
4. 外部文档接入（§8）：外部接入文档是否有锚定 / 定位 / 追溯 / 正确分区；有无命名冲突孤岛。
5. 生成矩阵（§5）：每份文档的输入 / 输出职责 / 禁止项 / 追溯锚点 / 下游影响是否兑现。
6. 可行性维度：需求 → 设计是否技术可行（受 ai/project-rules.md §2 / §2.5 + docs/env 约束）、设计 → 计划是否可执行、计划 → 验证是否可验收；各约束有无降级方案。
7. 交付物形态（ai/global-rules.md §8.1）：各 Phase 是否声明 Demo / MVP / 产品，有无 Demo 误称 MVP / 产品。
8. 规范基线对照：优先读取 `ai/doc-standards/00-09`（模板撰写规范镜像，随 `sync-template` 刷新，只读、非项目事实）；若不存在，再 fallback 到旧路径 `docs/_scaffold/00-09`。对照规范基线核查项目 `docs/00-09` 的关键约束（文档定位 / 上游输入 / §0 文档元信息 / 追溯矩阵 / 接口或表或用例矩阵 / 验收记录 / 风险与未验证项 / 环境验证）与撰写规范偏离；重点对照 `ai/doc-standards/04-architecture.md`、`05-tech-spec.md`、`06-db-design.md`、`07-api-spec.md` 检查架构视图、COMP / MOD / Flow ID、ADR、依赖配置、Risk-ID、readiness gate、字段级契约、endpoint contract matrix、契约状态和 DB / API / TC 追溯；旧派生项目按语义等价和最小补齐审计，不要求逐字重写成规范示例，规范镜像只作基准，不直接驱动开发。
   - 审计需求阶段时，必须逐份对照 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md`，而不是只看 docs 大纲。
   - 审计 DB / API 阶段时，必须逐份对照 `ai/doc-standards/06-db-design.md`、`07-api-spec.md`，检查字段级契约、endpoint contract matrix、契约状态、迁移 / seed / 回滚、API-ID、错误码、权限和 DB / API / TC 交叉追溯。
   - 审计计划 / 验证阶段时，必须逐份对照 `ai/doc-standards/08-dev-plan.md`、`09-verification.md`，检查 Sprint 验证包、完成包、TC 详情、验收证据、缺陷 / 回归和正式回写闭环。

输出：

1. 链路健康度总览表。
2. 各维度问题清单。问题必须按以下类型分组：
   - 00-03 需求链断点：`SC-ID → U-ID → REQ-ID → Phase → AC / TC` 任一段缺失、悬空、无来源或无验证入口。
   - 事实 / 追溯断点：影响需求、设计、计划或验证闭环的实质问题。
   - 横切传播残留：权威源已变更但下游措辞、引用或阶段标签未同步。
   - 横切状态冲突：`ai/document-lifecycle-rules.md` §7.1 中的候选、待确认、待技术验证、Mock、降级、默认关闭、预留、已验证、已启用、禁止等状态被混用或在下游被升级为无证据事实。
    - 规范基线缺口：对照 `ai/doc-standards/00-09` 与 `ai/doc-standards/design-doc.md`（旧项目 fallback：`docs/_scaffold/00-09`）发现的章节 / 元信息 / 矩阵结构缺失；不代表业务事实错误。
    - 04-05 设计门禁缺口：缺少系统上下文、组件 / 模块 / Flow ID、运行拓扑、ADR、技术状态、依赖配置、Risk-ID、readiness gate 或 `05 ↔ 09` 风险验证映射。
   - 06-07 契约门禁缺口：目标结构、当前实现、Mock、草案、候选、默认关闭或稳定契约混用；当前 Phase 表 / API 缺少字段级契约、endpoint contract、API-ID、错误码、权限边界、迁移 / seed / 回滚或 TC 映射。
   - 08-09 执行闭环缺口：Sprint 缺少验证包、TC-ID、完成包、状态或任务拆分依据；`09` 缺少 TC 详情、证据记录、Sprint 验收包、缺陷 / 回归记录，或长期事实只留在 handoff / 聊天 / PR 中。
   - 通用详细设计缺口：触发 `docs/design/*` 但缺少文档 / 豁免理由；缺少元信息、职责边界、上游追溯、流程 / 状态机、数据 / 接口 / 权限契约引用、失败 / 降级、readiness gate、验收追溯或实现偏差 / 设计回写区。
   - 可行性 / 部署缺口：技术可行性、资源、调度、运行环境或验证入口未说明。
    - 前端交互缺口：UI 型项目缺少 `docs/design/frontend-interaction.md` / `docs/design/*interaction*.md` 或豁免理由；页面流、状态、接口依赖、验收路径不可追溯，或把前端可见性误写为权限边界；前端交互文档也必须满足通用 design 标准。
    - UI 原型策略缺口：UI 型项目触发原型策略但缺少原型形式、权威位置、覆盖页面 / 主流程 / 状态 / 权限与降级、设备 / 浏览器范围、未覆盖项或豁免理由；原型证据不可访问 / 不可复核；原型与 `03/07/08/09` 追溯不一致；只在最终实现后才首次看到界面，缺少开发前可视化证据。
    - Web App Structure Profile 缺口：复杂 Web / 全栈交互项目缺少 App Shell、前后端目录边界、API client ↔ API-ID、vertical slice、文件膨胀阈值、Sprint 0 / Walking Skeleton 或 API / browser smoke；无豁免理由时不得直接进入首个业务 Sprint。
   - 本地续接状态：若存在 `NEXT-STEPS.md`、`.ai/session-handoff.md` 等本地便签，列出需同步的状态项；该类文件不是模板正式文档。
3. 每个问题给出：类型、严重度、文件:行、权威源、建议修复方式、是否改业务事实。
4. 回梳计划（按横切事实、状态词典或高优先级断点分组）+ 审计新发现（可行性 / 部署缺口）+ 待人工确认事项总览。
5. 若为同步后审计模式，输出同步报告回写建议：审计摘要、需回梳文档、阻塞项、可延后项、下一步命令。

若用户要求“分批审计”或审计范围覆盖完整 00-09 / `docs/design/*`，先给出 Batch 计划，再进入逐批审计。Batch 计划应遵循“一批一范围、报告先行、事实与模板分离、去重可审计、可续接”，并把每批范围、依赖和完成判据写入报告或续接文件。

待人工确认事项总览必须使用结构化表格：`ID / 来源文档或位置 / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响或阻塞关系`。P0 / 阻塞项必须说明停止原因，P1 项说明阶段或 Sprint 前置条件，P2 项说明可延后时点。

完整文档体系生成后的审计还必须检查：
1. 是否已选择分阶段确认模式或输入充分后批量生成模式。
2. 是否存在 `docs-open-items` 总览或明确“不落盘但会话内输出”的说明。
3. 专题讨论结果是否先经人工确认再回填正式文档；未确认的方案不得写成已确认事实。
4. open items 中阻塞项是否已关闭、转任务或被明确风险接受。

00-03 需求链健康度矩阵建议列：`SC-ID / U-ID / REQ-ID / Phase / 用户 AC / 验证入口 TC / 状态 / 断点 / 修复建议`。04-05 总体设计风险矩阵建议列：`REQ / NFR / COMP-ID / MOD-ID / Flow-ID / Risk-ID / readiness gate / TC / Sprint / 状态 / 断点 / 修复建议`。06-07 契约健康度矩阵建议列：`REQ / NFR / Table / Field / API-ID / Error / Permission / TC / 契约状态 / 当前实现 / Mock 差异 / 断点 / 修复建议`。docs/design/* 详细设计健康度矩阵建议列：`REQ / NFR / Phase / Design Point / Flow-D / UI 原型 / Table / Field / API-ID / Permission / readiness gate / Sprint / TC / 实现偏差 / 断点 / 修复建议`。UI 探索到交付矩阵建议列：`输入 / UI brief / 参考分析 / 需求探索原型 / 视觉探索 / experience brief / frontend-interaction / UI 原型策略 / 08 Sprint / 09 TC / 用户确认依据 / 未确认项 / Gate / 断点 / 修复建议`。UI 原型策略矩阵建议列：`REQ / 页面或流程 / 默认 UI 标准基线 / UI-后端顺序 / 原型形式 / 原型位置 / 覆盖状态 / 权限与降级 / 设备范围 / UI-G-004/006/007 / 08 Sprint / 09 TC / 未覆盖项 / 豁免理由 / 断点 / 修复建议`。Web App Structure Profile 矩阵建议列：`REQ / App Shell / 前端目录 / 后端目录 / API client ↔ API-ID / vertical slice / 文件阈值 / WSG-001..006 / Sprint 0 / API smoke / browser smoke / 豁免理由 / 断点`。08-09 执行闭环矩阵建议列：`REQ / Sprint / Task / TC-ID / 验证包 / 完成包 / Commit / PR / 验收记录 / 回写状态 / 断点 / 修复建议`。旧项目使用 `F-*` 等自定义编号时，不强制重命名，优先建议新增兼容映射表闭合追溯。

旧派生文档兼容审计：不要求 `docs/00-09` 逐字重写成 `ai/doc-standards` 示例骨架，但必须检查并报告：同一文档内 H2/H3 标题编号风格是否统一、连续、无明显跳号或重复；是否存在必要但缺失的关键版块；若补充版块，必须保持原项目语义和历史事实，不得机械重写或删除旧内容。若历史项目使用 `F-*` 等自定义需求编号，不要强制全文重命名，优先建议新增 `U-ID ↔ 旧编号` 兼容矩阵以满足追溯闭合。

不改文件，先出报告；确认后按 `ai/prompts/docs/04-edit-single-doc.md` 最小变更回梳。

若审计报告被确认并进入回梳，修复后至少做以下聚焦自检：
1. `git diff --check`。
2. 对照问题清单逐项 `rg` 验证旧措辞 / 旧版本号 / 已完成待办无残留。
3. 若使用 `ai/doc-standards/00-09`（旧项目 fallback：`docs/_scaffold/00-09`），确认 00-09 均有必需章节（如 §0 文档元信息），重点文档的追溯矩阵存在。
4. 确认新增矩阵没有制造新的悬空 ID（U-ID / REQ-ID / Phase / Sprint / 用例）。
5. 若更新了本地续接便签，确认推荐路径不再指向已完成事项。
```
