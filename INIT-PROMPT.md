# 常用Prompt模板

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


本文件收集项目生命周期中常用的可复制 Prompt。使用时先判断当前所处阶段，再复制对应章节中的 `text` 代码块给 AI；代码块外的说明用于帮助人判断“何时使用、输入什么、产出什么、下一步做什么”。

## 使用方式总览

1. **先判断入口**：如果项目起点是产品愿景，用 §0；如果 00-02 已写好，用 §1。
2. **再按任务阶段选择**：开发用 §2，审查用 §3 / §10，局部文档变更用 §4，修 Bug 用 §5。
3. **收尾时使用辅助 Prompt**：提交前可用 §6，代码与文档不一致用 §7，阶段升级用 §8，Sprint 完成用 §9。
4. **模板同步与维护**：新建派生项目用 §14，派生项目同步模板方法论用 §12；同步后整理项目专属内容用 §15；模板仓库处理 `_proposals/` 时用 §11。

| 当前场景 | 使用章节 | 主要目的 |
|---|---|---|
| 需要采集本机资源约束 | §13 | 自动生成 `docs/env/local-env.md` 并补人工确认项 |
| 需要从模板新建派生项目 | §14 | 调用 `scripts/new-project.sh` 创建项目并完成初始化入口 |
| 只有产品愿景，还没有完整 docs | §0 | 从愿景一次性抽取 00-09、阶段建议与验证计划 |
| 已有人写好 00-02，要补 03-09 | §1 | 基于需求输入生成设计、计划与验证文档 |
| 要实现某个 Sprint / 切换 AI 工具续接 | §2 | 限定范围执行单任务，避免跨范围改动 |
| 要审查项目或实现是否合规 | §3 | 按需求、架构、技术、DB/API、边界维度审查 |
| 单独修订一份 docs 文档 | §4 | 在规则约束下做局部文档更新 |
| 修复 Bug | §5 | 先定位和提出最小方案，再改代码 |
| 需要生成提交信息 | §6 | 根据实际改动给出清晰 commit message |
| 代码实现与 docs 不一致 | §7 | 先把事实差异同步回文档 |
| 准备进入下一 Phase | §8 | 评估当前完成度并草拟 Phase 边界更新 |
| Sprint 做完要验收 | §9 | 对照验收标准总结是否完成 |
| 生成 03-09 后人工验收 | §10 | 在编码前拦住文档空洞、越界和自相矛盾 |
| 模板仓库汇总派生项目提案 | §11 | 读取 `_proposals/` 并形成模板优化计划 |
| 派生项目同步模板方法论 | §12 | 按 SOP 执行 `sync-template.sh` 下行同步并创建 PR |
| 同步后整理派生项目 | §15 | 审计 docs 分区、README、project-rules 与运行环境约束，先出迁移计划再执行 |

> 原则：Prompt 不是需求本身。AI 只能基于 `docs/`、`ai/project-rules.md` 与人工确认的信息工作；如果输入不足，先补输入，不要让 AI 猜。

## 0. 从产品愿景文档生成完整文档体系（vision → docs）

**用途**：从一份产品愿景 / 故事叙述文档出发，一次性生成完整 `docs/` 文档体系。

**目的**：把非结构化愿景转成可开发、可审查、可验收的工程文档，并给出 Phase 路线图建议。

**适用场景**：项目刚开始，只有 `docs/vision/product-vision.md`，还没有可靠的 00-09 文档。

**不适用场景**：已经人工写好 `docs/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`；这种情况用 §1。

**使用前准备**：准备愿景文档；建议先用 §13 生成 `docs/env/local-env.md`，并确认 `ai/project-rules.md` 的项目名称、Phase 边界、技术栈、运行环境与项目形态能被初步填写或由 AI 提出待确认项。

**预期产出**：`docs/00-09`、必要的 `docs/design/*` 子系统设计、阶段建议、验证计划、项目化 README。

**使用后下一步**：人工确认 `docs/03-prd.md` §3 阶段路线图；确认后进入 §2 执行 Sprint-1。

```text
请基于产品愿景文档生成完整 docs/ 文档体系（含阶段建议）。

愿景文档：docs/vision/product-vision.md（约定路径，可替换）
先阅读：ai/index.md 列出的全部规则文件 + 该愿景文档 + docs/env/local-env.md（如存在）。

【心智模型，务必遵守】
- 两层分离：需求层(00-03)完整描述系统、跨阶段稳定、不按阶段裁剪；
  执行层(project-rules §1 + 04-09 + docs/design/* + 09-verification)描述"现在建什么"。
- 积累式(global-rules §8)：设计文档「完整骨架 + 阶段标签 + 状态」，只增不删、不建分阶段文档。
- 阶段是 AI 提议、非决定：在 03 §3 提议路线图(MVP优先)并标"待人工确认"；所有阶段标签取自该提议。

【按依赖顺序生成，可分批但须全部产出】

1) 需求层（完整）
   - 给愿景文档加定位声明头："产品愿景叙事，不直接驱动开发"
   - 00-scenario：背景/目标用户/典型场景 + 指针行；极简，不放功能表
   - 01-user-requirements：愿景全部功能点，每条带 [来源锚点][阶段标签][状态]
   - 02-srs：全部 REQ；当前阶段 REQ 写清可验证口径，其余粗粒度标"待该阶段细化"

2) 阶段建议 → 写入 03-prd §3（标"AI建议·待确认"）
   - Phase1/MVP：能独立演示核心价值的最小连贯子集（列功能 + 为何这样切 + 演示什么）
   - Phase2：优化扩展
   - 远期愿景：高风险/待技术验证项单列
   - 据此给 project-rules §1（当前=MVP）允许/禁止草稿

3) 总体设计（完整框架）
   - 04-architecture：完整架构图 + 子系统表（每行：职责/阶段/状态/指向 docs/design/*）
   - 05-tech-spec：技术栈 + 关键决策（版本可标"待确认"）

4) 详细设计（完整骨架 + 当前阶段细节）
   - 06-db-design：愿景全部表 + 阶段标签/状态；当前阶段表写全字段/索引，其余骨架
   - 07-api-spec：全部接口 + 阶段标签/状态；当前阶段写请求/响应示例，其余骨架
   - docs/design/<子系统>.md：每个非平凡子系统一份（框架 + 当前阶段细节）
   - 08-dev-plan：当前阶段拆 Sprint
   - 09-verification：测试策略 + REQ→用例追溯矩阵（当前阶段）

5) 项目 README
   - 将根 README 项目化：根据愿景与阶段建议生成项目简介、当前能力、快速开始、文档入口、模板关系与当前进度
   - 不得保留模板仓库 README 的 `# ai-project-template` 说明作为项目 README

6) 运行环境与资源评估
   - 若 `docs/env/local-env.md` 不存在，提示先运行 §13 的环境采集 Prompt
   - 04-architecture：说明本地单机 / 公司服务器 / 远程服务的运行拓扑约束
   - 05-tech-spec：必须输出本机 Demo 可行性、资源瓶颈、降级 / Mock 策略和服务器资源预案
   - 09-verification：必须包含本机资源验证项

【硬约束】
1. 完整不裁剪：01/02 装下整个愿景，每条可回锚点为证；不得因阶段而删功能
2. 阶段是提议非决定：03 §3 路线图标"待确认"，阶段标签据此打
3. 框架一次完整：04-09 + docs/design/* 铺全部要素（含 P2/愿景骨架），不只写当前阶段
4. 新增文档必须遵守 `docs/README.md`：根目录只放 00-09 和 README；调研、决策、会议、详细设计等必须进入对应子目录
5. 只增不删、原位增量（global-rules §8）
6. 当前阶段 REQ 可验证；远期粗粒度，不硬凑
7. 高风险 AI 项（跨文档推理/矛盾检测/证据地图等）标"愿景·待技术验证"，不进当前阶段
8. 演示形态：据 ai/project-rules.md §3「演示形态」推导 `frontend/` 是否启用、docs/04-05 是否体现前端；解析愿景文档，若含「页面 / 界面 / 点击 / 手机 / 打开」等界面交互词且 §3 标为无前端或不需演示，必须警告并提示人工复核
9. 技术方案必须受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束；Demo / MVP 优先本机可运行，若本机资源不足，必须明确所需公司服务器资源与触发条件
10. 每份文档生成前用 1-2 句说结构；全部生成后用第 10 节 checklist 自查，单列"需人工确认项"

【人工确认后】
确认/调整 03 §3 路线图 → 若调整，按第 4 节（单文档修订）把阶段标签同步到各文档（需求不变，只动标签）→ 用第 2 节执行 Sprint-1，进入编码。
```

## 1. 新项目初始化（生成03-09）

**用途**：在 `docs/00-02` 已经人工写好的情况下，生成后续设计、计划和验证文档。

**目的**：把已确认的场景、用户需求和 SRS 转成可进入开发的 `docs/03-09`。

**适用场景**：项目不是从愿景文档起步，或者 00-02 已经由人明确填写并通过初步检查。

**不适用场景**：只有模糊想法或愿景叙事，尚未形成 00-02；这种情况用 §0 或先补 00-02。

**使用前准备**：确认 `ai/project-rules.md` §1 Phase 边界、§2 技术栈、§3 项目形态与文档裁剪已填写，不得保留占位。

**预期产出**：`docs/03-prd.md`、`04-architecture.md`、`05-tech-spec.md`、按需生成 `06/07`、`08-dev-plan.md`、`09-verification.md`、项目化 README。

**使用后下一步**：用 §10 checklist 验收 03-09；人工确认后用 §2 执行第一个 Sprint。

```text
请先阅读：
- docs/00-scenario.md
- docs/01-user-requirements.md
- docs/02-srs.md
- ai/global-rules.md
- ai/project-rules.md（§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪含「演示形态」——生成前已由人工填好，作为约束）
- docs/env/local-env.md（如不存在，先使用 §13 生成；若暂不能生成，说明原因并列为需人工确认项）

然后依次生成：
- docs/03-prd.md
- docs/04-architecture.md
- docs/05-tech-spec.md
- docs/06-db-design.md（仅当 ai/project-rules.md §3 标记为“保留”时生成）
- docs/07-api-spec.md（仅当 ai/project-rules.md §3 标记为“保留”时生成）
- docs/08-dev-plan.md
- docs/09-verification.md
- README.md（项目说明；根据 00-02 与当前阶段项目化，不保留模板仓库说明）

要求：
1. 严格遵循 ai/global-rules.md 中的文档驱动开发原则
2. 03-09 必须落在 ai/project-rules.md §1 Phase边界、§2 技术栈、§3 项目形态约束内，不得越界引入禁止项
3. 不增加00-02中没有提及的功能
4. 明确标注当前Phase允许和禁止的技术/功能边界
5. 根据 ai/project-rules.md §3「演示形态」推导 `frontend/` 是否启用、docs/04-05 是否体现前端；若 00-02 出现界面交互诉求但 §3 未启用前端，必须列为需人工确认项
6. 技术方案必须受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束；`docs/05-tech-spec.md` 必须包含本机 Demo 可行性、资源瓶颈、降级 / Mock 策略和服务器资源预案
7. `docs/09-verification.md` 必须包含本机资源验证项
8. 对 ai/project-rules.md §3 已标记为“省略”的文档，不得生成空壳；应直接跳过，并在结果中说明跳过原因
9. `docs/05-tech-spec.md` 的“编码约定”一节若引用不到 ai/project-rules.md §5，可先写“待 03-09 审核后回填”，不要虚构内容
10. 每份文档生成前先用1-2句话说明本文档的结构安排
11. 生成后用第10节的验收 checklist 自查 03-09，列出未通过项再修订
```

## 2. 单任务执行 / 切换工具续接

**用途**：执行 `docs/08-dev-plan.md` 中的单个 Sprint，或在切换 AI 工具 / 新会话时续接当前任务。

**目的**：让 AI 在明确输入、范围和验收标准内小步实现，避免一次性扩展整个系统。

**适用场景**：03-09 已通过人工审核，当前要开发某个 Sprint 或继续未完成任务。

**不适用场景**：需求、架构或技术方案还未确认；这种情况先回到 §1 / §10。

**使用前准备**：确认当前 Sprint 的目标、输入文档、修改范围、验收标准和禁止事项已写在 `docs/08-dev-plan.md` 或 `tasks/` 中。

**预期产出**：实现方案、受影响文件清单、代码 / 文档改动、验证方式与执行结果。

**使用后下一步**：运行验证；若通过，用 §9 总结 Sprint，必要时用 §6 生成 commit message。

```text
请执行：docs/08-dev-plan.md 中的 Sprint-X

执行前请先阅读：
- ai/index.md 列出的全部规则文件
- docs/03-prd.md（相关章节）
- docs/07-api-spec.md（若本项目有对外接口，阅读相关接口）
- docs/06-db-design.md（若本任务涉及持久化，阅读相关表结构）

当前进度：已完成A，下一步需要B

要求：
1. 先说明实现方案
2. 列出将新增或修改的文件（限制1~3个）
3. 确认不超出本任务范围
4. 再开始生成代码
5. 完成后说明修改了哪些文件，以及如何验证
```

## 3. 项目审查

**用途**：审查当前项目文档或实现是否符合模板规则与已确认设计。

**目的**：发现需求越界、架构偏离、技术栈不一致、DB/API 不一致和 Phase 边界风险。

**适用场景**：完成一轮设计、实现或阶段交付后，需要进行合规性审查。

**不适用场景**：只想检查 03-09 文档是否可进入编码；这种情况优先用 §10 checklist。

**使用前准备**：准备相关 `docs/03-09`、当前实现状态和需要审查的范围。

**预期产出**：合规项、问题项、风险项和修复建议。

**使用后下一步**：对问题项拆分任务；若涉及单文档修订，用 §4；若涉及代码修复，用 §2 或 §5。

```text
请根据 ai/index.md 列出的全部规则文件及 docs/03-09，审查当前项目，输出：
（若项目尚未编码、只想审 03-09 文档质量，改用第10节 checklist 逐项核对）

1. 合规项
2. 问题项（是否超出当前Phase范围 / 是否存在技术栈偏离 / 是否存在未按API或DB设计实现的部分）
3. 风险项
4. 修复建议
```

## 4. 单文档修订

**用途**：只修订某一份文档或某个章节，不启动完整初始化流程。

**目的**：在变更原因明确时，保持文档局部更新并维持跨文档一致性。

**适用场景**：PRD 新增/调整需求、API 契约变化、DB 设计变化、Phase 标签需要同步等。

**不适用场景**：需要重新生成 03-09 全套文档；这种情况用 §1。

**使用前准备**：明确要修订的文档、变化原因、关联需求和受影响章节。

**预期产出**：修订方案、修改后的文档内容、影响范围说明。

**使用后下一步**：用 §10 或相关审查项检查一致性，再继续开发或提交。

```text
docs/07-api-spec.md 需要修订：（说明变化原因，例如PRD新增了XX需求）

请先阅读：
- ai/index.md 列出的全部规则文件
- docs/03-prd.md（相关章节）
- docs/07-api-spec.md（当前内容）

要求：
1. 只修改 docs/07-api-spec.md，不重新生成其他文档
2. 先说明本次修订的范围和理由
3. 如改动影响 docs/06-db-design.md 或 08-dev-plan.md，先指出来，
   等待确认后再处理，不要自行连带修改
```

## 5. Bug修复

**用途**：处理已出现的报错、异常行为或测试失败。

**目的**：先定位根因并提出最小修改方案，避免盲目大范围改代码。

**适用场景**：已有可描述现象、复现步骤、错误日志或失败测试。

**不适用场景**：需求变更或新增功能；这种情况应回到文档和 Sprint 流程。

**使用前准备**：提供现象、环境、复现步骤、期望行为和相关日志。

**预期产出**：根因分析、最小修复方案、改动文件、验证结果。

**使用后下一步**：若实现与 docs 不一致，用 §7 做文档反向同步；否则用 §6 准备提交信息。

```text
现象：（描述报错信息或异常表现）

请按以下流程处理，不要直接大范围修改代码：
1. 阅读 ai/index.md 列出的规则文件
2. 定位问题模块，分析可能原因
3. 提出最小修改方案（限制1~3个文件）
4. 说明方案后再修改代码
5. 给出验证步骤
```

## 6. Commit message生成

**用途**：根据本次已完成改动生成清晰、可审计的提交信息。

**目的**：让一次任务对应一次清楚的 commit，避免 “update / fix / test” 这类模糊记录。

**适用场景**：改动已完成、验证已通过、准备提交。

**不适用场景**：工作区还混有多组无关改动；应先拆分暂存或拆分任务。

**使用前准备**：提供 `git diff --stat`、关键变更点和验证结果。

**预期产出**：一条或多条候选 commit message，必要时建议拆分提交。

**使用后下一步**：人工选择提交信息，执行 `git add` / `git commit`。

```text
请根据本次修改内容，生成符合 ai/global-rules.md 规范的Commit message：
- 格式参考"完成XX模块"风格
- 避免"修改/update/test"等模糊描述
- 如本次修改跨越多个模块，拆分为多条建议的Commit message
```

## 7. 文档反向同步

**用途**：当实现结果与 `docs/` 中的设计产生差异时，先把事实同步回文档。

**目的**：避免代码已经改变但文档仍描述旧事实，导致后续 AI 或人按错误设计继续开发。

**适用场景**：实现中发现原设计不可行、接口字段调整、DB 字段调整、验收口径变化等。

**不适用场景**：实现超出当前 Phase 或新增未经批准功能；这种情况应先审查是否越界，而不是直接改文档背书。

**使用前准备**：列出实际实现与文档差异、变化原因、涉及文件和是否仍在 Phase 边界内。

**预期产出**：受影响文档的修订建议、章节清单和边界确认。

**使用后下一步**：文档确认后再继续开发；如需补代码，用 §2 或 §5。

```text
本次代码实现与 docs/ 中的设计存在以下差异：（说明差异点）

请：
1. 先更新 docs/ 中受影响的文档（如 06-db-design.md / 07-api-spec.md），
   使文档与实际实现一致
2. 说明更新了哪些文档、哪些章节
3. 确认本次差异是否在当前Phase允许范围内（参考 ai/project-rules.md）
4. 文档更新确认后，再继续后续开发
```

## 8. Phase升级评估

**用途**：评估项目是否可以从当前 Phase 进入下一 Phase。

**目的**：先确认当前阶段完成度，再草拟下一阶段允许 / 禁止 / 预告边界，避免提前解锁愿景功能。

**适用场景**：当前 Phase 的 Sprint 基本完成，准备规划下一阶段。

**不适用场景**：当前 Phase 验收尚未完成或核心缺陷未关闭；应先用 §9 做验收总结。

**使用前准备**：准备当前 `ai/project-rules.md`、`docs/03-prd.md` 路线图、`docs/08-dev-plan.md` 完成情况和验证结果。

**预期产出**：当前 Phase 完成情况、下一 Phase 解锁清单、`ai/project-rules.md` §1 更新草稿。

**使用后下一步**：人工确认 Phase 边界后，再用 §4 修订相关文档；不要让 AI 直接推进阶段。

```text
项目准备从当前Phase进入下一Phase。

请阅读：
- ai/project-rules.md（当前Phase边界）
- docs/03-prd.md、docs/08-dev-plan.md

输出：
1. 当前Phase的完成情况核对
2. 下一Phase可以解锁的功能/技术清单
3. 针对 ai/project-rules.md 的"Phase边界"一节，给出更新后的内容草稿
   （允许/禁止/下一阶段预告三段式），等待人工确认后再实际修改该文件
```

## 9. Sprint验收总结

**用途**：在一个 Sprint 完成后，对照验收标准做收尾总结。

**目的**：判断本 Sprint 是否真正完成，并沉淀修改文件、验证结果和建议提交信息。

**适用场景**：单个 Sprint 的实现和验证已经完成，准备提交或进入下一 Sprint。

**不适用场景**：还没有运行验证，或验收标准本身不清楚；应先补验证或修订 `docs/08-dev-plan.md`。

**使用前准备**：提供 Sprint 条目、实际改动、测试 / 自检结果和未完成事项。

**预期产出**：逐项验收结果、文件清单、commit message 建议、是否进入下一 Sprint 的判断。

**使用后下一步**：通过则提交；未通过则拆出修复任务或回到 §2。

```text
请对照 docs/08-dev-plan.md 中 Sprint-X 的验收标准，逐项核对当前实现：

输出：
1. 验收标准逐项结果（通过/未通过+原因）
2. 本Sprint修改/新增的文件清单
3. 建议的Commit message
4. 是否可以进入下一个Sprint
```

## 10. docs/03-09 文档验收 checklist

**用途**：生成 03-09 后、进入编码前，人工逐项核对；也可让 AI 自查。

**目的**：在「代码写错」之前，先拦住「文档本身错了 / 空了 / AI 自行加料」。

**适用场景**：刚用 §0 或 §1 生成 / 更新 03-09，准备进入 Sprint 开发。

**不适用场景**：已经进入代码修复或实现细节定位；这种情况用 §2 / §5。

**使用前准备**：准备完整的 00-09 文档、`ai/project-rules.md`、`docs/env/local-env.md` 和人工已知的项目边界。

**预期产出**：通过 / 未通过项清单，以及需要修订的文档位置。

**使用后下一步**：未通过则先修文档；通过后再用 §2 执行 Sprint。

### A. 00-02 输入门槛（生成 03-09 前先确认输入够不够）
- [ ] 00-scenario：背景 / 目标用户 / 典型场景均已填写，非空
- [ ] 01-user-requirements：功能点可枚举、不模糊（"一个好用的系统"不算需求）
- [ ] 02-srs：每条 REQ 可验证（能说清"怎样算满足这条"）
- [ ] docs/env/local-env.md：已由 `scripts/collect-env.ps1` 生成；人工确认项未补齐时，后续方案已明确列为待确认
- 判据：若你自己都无法凭 00-02 向同事讲清"要做什么"——补输入，别让 AI 用幻觉补

### B. 03-09 逐项验收（生成后逐项打钩）
- [ ] 03-prd：覆盖 02-srs 全部 REQ，无遗漏；无 00-02 未提及的新增功能
- [ ] 04-architecture：模块划分对应 03 的功能范围；技术选型有理由；部署 / 运行拓扑受 `docs/env/local-env.md` 约束
- [ ] 05-tech-spec：技术栈与版本明确；Phase 边界与 ai/project-rules.md §1 一致；已给出本机 Demo 可行性、资源瓶颈、降级 / Mock 策略和服务器资源预案；若 §5 尚未填写，编码约定处已明确标注待回填
- [ ] 06-db-design（如有）：每张表可追溯到某个 REQ；无"看起来有用但没人查"的表
- [ ] 07-api-spec（如有）：每个接口对应一个需求/功能；无孤立接口
- [ ] 08-dev-plan：Sprint 拆分合理，单 Sprint 限制在 1~3 个文件；验收标准可判断
- [ ] 09-verification：REQ → 用例追溯矩阵覆盖当前阶段全部 REQ；包含本机启动、内存 / 显存 / 磁盘 / 端口等资源验证项

### C. 交叉一致性（最易出错，单独核一遍）
- 04 模块 ⊆ 03 功能范围（架构不超出 PRD）
- 04 / 05 / 09 的运行环境假设一致，且与 `ai/project-rules.md` §2.5、`docs/env/local-env.md` 不冲突
- 06 表 / 07 接口 ⊆ 04 模块（若有 06/07，其数据与接口都落在架构内）
- 08-09 ⊆ 05-07 中实际保留的文档（开发计划不引入技术方案外的依赖）

### D. 一票否决
- 03-09 中任何"00-02 未提及、AI 自行添加"的功能 → 删除（对应 global-rules「AI不可自主扩展需求」）
- 技术方案默认使用本机无法承载的重资源组件，且未给出降级 / Mock 或服务器资源预案 → 退回重写
- 任何文档只剩标题、无实质内容 → 要么补全，要么按 project-rules §3 声明省略，不留空壳

## 11. 模板优化汇总（供模板维护者）

**用途**：在 `ai-project-template` 模板仓库内，处理 `_proposals/` 收件箱中的派生项目模板优化提案。

**目的**：把多个派生项目的提案统一去重、识别冲突、分析依赖，并形成可评审的模板优化计划。

**适用场景**：模板仓库 `_proposals/` 中已有 `TEMPLATE-UPGRADE-*.md` 或 `*-patch.md`，准备落地模板优化。

**不适用场景**：普通派生项目日常开发；派生项目只负责起草提案，不使用本节直接改模板。若模板仓库内需要直接修改模板但尚无提案，也应先新增 `TEMPLATE-UPGRADE-*.md`。

**使用前准备**：确认当前在模板仓库，已阅读 `ai/index.md`、`CONTRIBUTING.md`、`MAINTAINERS.md`、`CHANGELOG.md` 与 `_proposals/README.md`。

**预期产出**：提案清单、去重 / 冲突 / 依赖分析、合并或分阶段计划、拟修改文件清单、版本影响、验证方式和已处理提案归档计划。

**使用后下一步**：人工确认优化计划后，按模板仓库分支 → PR → 评审 → 合并流程修改文件；优化完成后，将已处理提案从 `_proposals/` 移动到 `_archive/proposals/` 归档。

> 事实来源：模板变更治理规则以 `CONTRIBUTING.md` 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

```text
请读取 _proposals/ 下所有 TEMPLATE-UPGRADE-*.md（提案）与可选 *-patch.md（具体改动建议），并输出一份模板优化计划。

读取前先确认：
- ai/index.md 列出的全部规则文件
- CONTRIBUTING.md（模板变更治理流程）
- MAINTAINERS.md（模板维护、发布 checklist、同步清单维护）
- CHANGELOG.md（完整版本记录）
- README.md（普通使用者入口，避免塞入维护细节）
- _proposals/README.md（提案收件箱规则）

分析要求：
1. 去重：识别多个提案是否表达同一优化，合并同类项。
2. 冲突：识别是否改同一文件、同一段落、同一版本号或流程定义，并给出取舍建议。
3. 依赖：识别哪些提案必须先落地，哪些可以延后。
4. 分阶段：判断本次应一次合并改，还是拆成多个版本 / 多个 PR，并说明理由。
5. 实际 diff 计划：把各 patch 的 old→new 建议合并为模板文件的真实修改清单，解决重叠和冲突。
6. 边界审查：剔除派生项目专属内容，只保留可通用于多个项目的模板优化。
7. 验证计划：列出需要运行的脚本、人工审查项和下行同步影响。
8. 归档计划：列出本次落地完成后应从 `_proposals/` 移动到 `_archive/proposals/` 的已处理提案文件；未处理或延后处理的提案继续留在 `_proposals/`。

输出格式：
1. 提案清单
2. 去重 / 冲突 / 依赖分析
3. 合并或分阶段计划
4. 拟修改文件清单与理由
5. 版本影响（按 `VERSION` 三段式判断 MAJOR / MINOR / PATCH / 不递增）
6. 验证方式
7. 已处理提案归档计划
8. 需要人工确认的问题

注意：AI 可辅助修改模板文件与归档已处理提案，但不得直接 push 或合并；所有改动必须经人工审查，通过模板仓库 PR 落地。
```

## 12. 派生项目同步模板方法论

**用途**：在派生项目中，让 AI 按标准流程执行 `ai-project-template` 方法论下行同步。

**目的**：避免人工记忆命令，确保先按派生项目版本选择正确入口，再 dry-run、确认不覆盖项目专属内容，最后 commit / PR。

**适用场景**：模板仓库已有新版方法论，派生项目需要同步 `ai/global-rules.md`、Prompt、治理文档、脚本和 AI 入口文件。

**不适用场景**：要把派生项目经验回流到模板；这种情况应先在派生项目 `_proposals/` 起草提案，再按 `CONTRIBUTING.md` 上行流程处理。

**使用前准备**：确认当前在派生项目根目录，已保存业务改动；目标模板版本必须从模板仓库根目录 `VERSION` 读取，不在 Prompt 中固定写死。

**预期产出**：同步分支、同步提交、派生同步边界检查结果、派生项目已处理提案归档计划和 PR 链接。

**使用后下一步**：评审并合并派生项目同步 PR；若 `ai/project-rules.md` 需要人工迁移新骨架项，或 `_proposals/` 中仍有未处理提案，单独开任务处理。

> 事实来源：下行同步标准流程以 `git-guide.md` 与 `CONTRIBUTING.md` 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

### 标准 SOP Prompt（直接复制到派生项目使用）

```text
请按标准 SOP 帮我执行派生项目模板方法论下行同步。

目标：将当前派生项目同步到 ai-project-template 最新模板方法论版本。目标版本必须以模板仓库根目录 `VERSION` 为准，不要使用本 Prompt 文本中的示例版本号。

执行要求：
1. 先阅读 ai/index.md 及其列出的全部规则文件。
2. 检查 git status；若有未提交改动，立即停止并说明，不要覆盖。
3. 判断当前派生项目同步路径：
   - 如果缺少 `scripts/sync-template.ps1`，或缺少 `template-sync.json`，或 `VERSION` 低于 `v1.6.8`，或不确定当前同步脚本是否为新版，则按“旧派生项目首次同步”路径执行。
   - 如果已有新版 `scripts/sync-template.ps1` 与 `template-sync.json`，则按“v1.6.8+ 后续同步”路径执行。
   - 不要运行 `scripts/check-template.sh` 或 `scripts/check-template.ps1` 作为派生项目同步验收；它们是模板仓库完整性自检。
4. 先拉取模板 main 并读取目标版本：
   - 运行：git fetch --no-tags --depth=1 https://github.com/emily8421/ai-project-template.git main
   - 运行：git show FETCH_HEAD:VERSION
   - 记录输出的目标版本，例如 vX.Y.Z。
5. 新建或切换到同步分支：chore/sync-template-vX.Y.Z（X.Y.Z 取上一步读取到的目标模板版本）。
6. 如果是旧派生项目首次同步：
   - 先 bootstrap 最新同步脚本；旧项目使用 Bash 入口，不要无条件信任派生项目本地旧脚本：
   - 运行：git checkout FETCH_HEAD -- scripts/sync-template.sh
   - 运行：git add scripts/sync-template.sh
   - 若 `git diff --cached --quiet` 显示无 staged 差异，说明本地脚本已是最新版，跳过本次提交并继续下一步。
   - 若有 staged 差异，运行：git commit -m "chore: bootstrap latest sync script"
   - 运行：& "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --dry-run
   - 如果 Git for Windows 安装位置不同，用本机实际 `bash.exe` 路径替换示例路径。
7. 如果是 v1.6.8+ 后续同步：
   - 运行：powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
8. 检查 dry-run 输出，确认只涉及模板方法论同步文件；不应出现 README.md、ai/project-rules.md、docs/00-09、frontend/、backend/、tests/、docker/ 或业务代码。
9. 如果 dry-run 合理，执行同步：
   - 旧派生项目首次同步：运行 & "C:\Program Files\Git\bin\bash.exe" scripts/sync-template.sh --commit
   - v1.6.8+ 后续同步：运行 powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit
10. 只做派生同步边界检查：
   - 运行：git status --short --branch
   - 运行：git show --name-only --stat HEAD
   - 如已同步到包含 `scripts/check-derived-sync.ps1` 的版本，运行：powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
   - 确认最新同步提交没有误覆盖 README.md、ai/project-rules.md、docs/00-09 或业务代码。
11. 如本次同步引入新的项目专属骨架项，不要直接覆盖 ai/project-rules.md；列出需要人工迁移的字段，例如 `§2.5 运行环境与资源约束`。
12. 如项目已同步到含 `scripts/collect-env.ps1` 的模板版本，但尚无 `docs/env/local-env.md`，提示运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1，并补齐人工确认项。
13. 检查本项目 `_proposals/`：
   - 如果其中提案已被模板仓库采纳，并且本次同步已拿到对应模板版本，将这些已处理提案移动到本项目 `_archive/proposals/` 归档。
   - 未处理、延后处理或不确定状态的提案继续保留在 `_proposals/`，不要误归档。
   - 如执行归档，补充或更新 `_archive/proposals/README.md`，说明归档规则与对应模板版本 / PR。
14. 如有归档改动，运行 git status 并确认只移动提案记录，不改业务文件。
15. 推送当前分支：git push -u origin chore/sync-template-vX.Y.Z。
16. 创建 PR：gh pr create --fill。
17. 最后汇总：同步到的模板版本、同步提交、采用的同步路径、同步边界检查结果、是否需要人工迁移 project-rules、是否需要运行 collect-env、提案归档情况和 PR 链接。

遇到以下情况必须停止并说明原因：
- 工作区不干净。
- 无法读取模板仓库 `VERSION`。
- dry-run 后出现 staged 改动。
- dry-run 显示会覆盖项目专属文件。
- sync-template 提示本地脚本不是最新版，且无法完成 bootstrap。
- 派生同步边界检查显示最新同步提交包含 README.md、ai/project-rules.md、docs/00-09 或业务代码。
- 无法判断 `_proposals/` 中某个提案是否已被模板采纳。
- 脚本失败。
- GitHub 认证或权限失败。
```

## 13. 采集本机运行环境与资源约束

**用途**：在派生项目中生成 `docs/env/local-env.md`，作为架构设计、技术方案和本机 Demo 可行性评估的输入。

**目的**：减少人工填写硬件 / 软件环境信息，让 AI 在选择技术栈、模型、数据库、部署方式时受本机资源约束，避免方案超出 Demo 机器承载能力。

**适用场景**：新项目初始化前、生成 `docs/04-architecture.md` / `docs/05-tech-spec.md` 前，或技术方案需要重新评估资源消耗时。

**不适用场景**：已经有最新且人工确认过的 `docs/env/local-env.md`，且本机环境未变化。

**使用前准备**：确认当前在派生项目根目录；允许运行只采集本机信息并写入 `docs/env/local-env.md` 的脚本。

**预期产出**：`docs/env/local-env.md`，包含自动采集项、人工确认项和服务器资源预案。

**使用后下一步**：人工补齐 `docs/env/local-env.md` 中的确认项；随后用 §0 或 §1 生成 / 更新 03-09，并要求技术方案读取该文件。

```text
请帮我采集本机运行环境与资源约束，供后续架构设计和技术方案使用。

执行要求：
1. 先阅读 ai/index.md 及其列出的全部规则文件。
2. 检查是否存在 scripts/collect-env.ps1；如果不存在，停止并说明需要先同步模板方法论或从模板复制该脚本。
3. 运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
4. 确认已生成 docs/env/local-env.md。
5. 阅读 docs/env/local-env.md，汇总自动采集到的关键资源信息：OS、CPU、内存、GPU、磁盘、Docker、Git、Python、Node 等。
6. 列出仍需人工确认的项目，至少包括：Demo 最大内存 / 显存 / 磁盘占用、是否允许联网、是否允许安装依赖、是否允许使用公司服务器、本机必须跑通的功能、可 Mock / 远程运行的功能。
7. 不要替用户虚构人工确认项；未知项保持“待确认”。
8. 输出后续建议：生成 docs/04-architecture.md、docs/05-tech-spec.md、docs/09-verification.md 时必须读取 docs/env/local-env.md，并给出本机 Demo 可行性与服务器资源预案。

遇到以下情况必须停止并说明原因：
- 当前不在项目根目录。
- scripts/collect-env.ps1 不存在。
- PowerShell 脚本执行失败。
- docs/env/local-env.md 未生成。
```

## 14. 从模板新建派生项目

**用途**：从 `ai-project-template` 创建一个新的派生项目，并完成最小初始化入口。

**目的**：避免手工复制模板目录导致版本、Git 历史、远端仓库和提案目录不一致；统一使用 `scripts/new-project.sh` 从模板 GitHub `main` 派生。

**适用场景**：准备创建一个全新项目，而不是同步已有派生项目。

**不适用场景**：已有派生项目需要更新模板方法论；这种情况用 §12。

**使用前准备**：确认当前在 `ai-project-template` 模板仓库，或能访问模板仓库中的 `scripts/new-project.sh`；确认新项目名称、GitHub 账号和仓库可见性。

**预期产出**：新项目目录、新项目 Git 首提交、可选 GitHub 远端仓库、环境采集文档入口和后续初始化待办。

**使用后下一步**：进入新项目，填写 00-02、补 `docs/env/local-env.md` 人工确认项，再用 §0 或 §1 生成 / 补齐 docs 文档体系。

> 事实来源：新建项目操作 SOP 以 `git-guide.md` §2 为准；本节只是把该流程整理成可复制给 AI 执行的 Prompt。

```text
请按标准 SOP 帮我从 ai-project-template 新建一个派生项目。

项目名称：<填写项目名>
GitHub 账号：emily8421（如需其他账号请说明）
仓库可见性：private（如需 public 请说明）
是否创建远端仓库：是（如只需本地烟测请说明 --no-remote）

执行要求：
1. 先确认当前是否在 ai-project-template 模板仓库，或能访问模板仓库的 scripts/new-project.sh。
2. 运行 git status --short --branch；若模板仓库工作区不干净，停止并说明，不要用未确认的本地改动创建正式项目。
3. 正式新项目优先从 GitHub main 派生，不使用 --local；除非用户明确要求本地烟测。
4. 按用户填写的项目名称、账号和可见性执行：
   - 默认：bash scripts/new-project.sh <项目名>
   - 指定账号 / 可见性：bash scripts/new-project.sh <项目名> --account <账号> --visibility <private|public>
   - 本地烟测：bash scripts/new-project.sh <项目名> --local --no-remote
5. 创建完成后进入新项目目录。
6. 运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
7. 检查 docs/env/local-env.md 是否生成，并提醒人工补齐确认项。
8. 输出下一步待办：
   - 填写 docs/00-scenario.md ~ docs/02-srs.md
   - 填写 ai/project-rules.md 的 Phase 边界、技术栈、运行环境与资源约束、项目形态裁剪
   - 根据项目起点选择 INIT-PROMPT.md §0 或 §1 生成 / 补齐 docs/03-09
   - 人工审核 03-09 后再进入 Sprint1

禁止事项：
- 不要先手工复制模板文件夹再运行 new-project.sh。
- 不要直接 clone 模板仓库后手动改名当作新项目。
- 不要在模板仓库工作区有未提交改动时创建正式项目；如确需使用本地改动，只能明确作为 --local 烟测。

遇到以下情况必须停止并说明原因：
- 项目名为空或目标目录已存在。
- GitHub 账号、权限或 gh 认证不可用，且用户要求创建远端仓库。
- 无法访问模板仓库 GitHub main，且用户未明确允许 --local。
- collect-env.ps1 执行失败或 docs/env/local-env.md 未生成。
```

## 15. 同步后项目整理（派生项目）

**用途**：派生项目完成模板方法论同步后，审计并整理项目专属内容，使其符合最新模板建议。

**目的**：弥补 `sync-template` 只同步方法论、不自动修改项目事实文档的空白；先输出迁移计划，经人工确认后再移动 / 修改项目文档。

**适用场景**：派生项目同步到新模板版本后，尤其是模板新增 docs 分区规则、README 标准版块、运行环境约束等项目专属迁移要求时。

**不适用场景**：还未完成模板方法论同步；或用户要求直接开发新功能。

**使用前准备**：确认当前在派生项目根目录，工作区状态已知；已完成 `scripts/sync-template.*` 同步并提交或准备单独提交同步后整理改动。

**预期产出**：先输出审计结果与迁移计划；人工确认后，执行 docs 分区整理、README 补齐、`ai/project-rules.md` 补齐和运行环境约束补齐。

**使用后下一步**：人工确认迁移计划后，用本节第二段 Prompt 执行迁移；完成后运行项目自检 / 文档检查并单独提交。

### 第一段：同步后整理审计与迁移计划

```text
请在当前派生项目中，按照最新 ai-project-template 方法论，对项目专属内容做一次“同步后整理审计与迁移计划”。

重要前提：
- 我已经完成模板方法论同步，当前项目中应已有最新版 `docs/README.md`、`ai/global-rules.md`、`INIT-PROMPT.md`、`SOP.md` 等方法论文件。
- `sync-template` 只同步方法论文件，不会自动改项目事实文档。
- 本次任务不是开发新功能，不允许扩展需求，不允许改业务代码。
- 根 `README.md`、`ai/project-rules.md`、`docs/00-09`、业务代码都是项目专属内容，整理前必须先审计再给迁移计划。

请按以下步骤执行：

1. 读取规则
   - 先读取 `ai/index.md` 列出的全部规则文件。
   - 再读取 `docs/README.md`，理解最新 docs 分区规则。
   - 再读取 `ai/project-rules.md`、根 `README.md`、`docs/00-09`、`docs/vision/product-vision.md`（如存在）。

2. 审计当前 docs 结构
   - 列出 `docs/` 根目录下所有文件和子目录。
   - 判断哪些文件允许留在 `docs/` 根目录：`README.md`、`00-scenario.md` ~ `09-verification.md`。
   - 找出不应留在 `docs/` 根目录的文件，例如调研文档、会议纪要、临时分析、子系统详细设计、ADR、环境记录、历史归档。
   - 按 `docs/README.md` 给出建议迁移路径：
     - 愿景 / 叙事 → `docs/vision/`
     - 子系统 / 模块详细设计 → `docs/design/`
     - 架构决策记录 → `docs/decisions/`
     - 技术调研 / 实验 → `docs/research/`
     - 环境 / 资源约束 → `docs/env/`
     - 会议 / 访谈 / 评审记录 → `docs/meetings/`
     - 废弃但需留痕 → `docs/archive/`

3. 审计运行环境与资源约束
   - 检查是否存在 `docs/env/local-env.md`。
   - 若不存在，检查是否存在 `scripts/collect-env.ps1`；若存在，建议先运行：
     `powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1`
   - 若 `scripts/collect-env.ps1` 不存在，说明需要先完成模板方法论同步。
   - 检查 `docs/env/local-env.md` 是否已补齐人工确认项，至少包括：
     - Demo 阶段必须在本机运行的部分
     - 允许降级 / Mock / 远程运行的部分
     - 禁止在本机运行的重资源部分
     - 是否允许联网
     - 是否允许安装依赖
     - 是否允许使用公司服务器
     - 若需服务器，资源申请口径
   - 检查 `ai/project-rules.md` 是否存在并补齐 §2.5「运行环境与资源约束」。若没有 §2.5，请建议新增；未知项保持“待确认”，不得虚构。
   - 检查 `docs/04-architecture.md` 是否包含“部署 / 运行拓扑约束”，并明确本机单机 / 公司服务器 / 远程服务边界。
   - 检查 `docs/05-tech-spec.md` 是否包含“运行环境与资源评估”，并说明本机 Demo 可行性、资源瓶颈、降级 / Mock 策略、服务器资源预案。
   - 检查 `docs/09-verification.md` 是否包含“本机资源验证”，并说明如何验证 Demo 在本机资源范围内可运行。

4. 审计根 README
   - 检查根 `README.md` 是否是项目说明，而不是模板说明。
   - 若缺少版块，请给出补齐建议，推荐包含：项目简介、当前阶段、当前能力、快速开始、文档入口、运行环境、开发计划、验证方式、模板关系。
   - 必须明确：
     - 根 `README.md` 是项目专属文档，不参与模板下行同步。
     - 模板方法论文件由 `template-sync.json` 定义，执行 `scripts/sync-template.*` 时可能被覆盖。
     - 项目专属内容写入 `ai/project-rules.md`、`docs/` 和根 `README.md`。

5. 审计 `ai/project-rules.md`
   - 检查初始化必填检查是否包含：`docs/README.md` 分区规则、不得把新增项目文档直接放到 `docs/` 根目录。
   - 检查 §2.5 是否引用 `docs/env/local-env.md`，并保留待人工确认项。
   - 检查 §3 是否明确 `docs/06`、`docs/07`、`frontend/`、`backend/`、`tests/`、`scripts/`、`docker/` 的保留 / 省略 / 删除决策。
   - 不要把模板方法论长文复制进 project-rules；只补项目专属约束和裁剪决策。

6. 输出迁移计划
   先不要修改文件，只输出计划，格式如下：

   A. 当前结构审计
   - 合规项
   - 需要迁移的文件
   - 不确定项

   B. 建议迁移表
   | 当前路径 | 建议路径 | 类型 | 理由 | 是否需要人工确认 |
   |---|---|---|---|---|

   C. 运行环境约束补齐建议
   - 缺失文件 / 章节
   - 建议先运行的脚本
   - 可自动补骨架的内容
   - 必须人工确认的内容

   D. README 补齐建议
   - 缺失版块
   - 建议新增内容摘要

   E. project-rules 补齐建议
   - 缺失项
   - 建议新增位置

   F. 风险与注意事项
   - 哪些文件移动可能影响链接
   - 哪些引用需要同步更新
   - 哪些内容不建议移动

   G. 待人工确认问题
   - 列出所有无法自动判断的问题

7. 等我确认后再执行迁移
   - 未经确认，不要移动 / 重命名 / 删除文件。
   - 经确认后，按最小变更执行：创建必要子目录、移动文件、更新内部链接、补根 README、补 `ai/project-rules.md`、补环境约束章节骨架。
   - 完成后输出变更清单、迁移前后路径对照、需要人工复核的链接和建议验证命令。
```

### 第二段：确认后执行迁移

```text
我确认执行上述同步后整理迁移计划。

请按已确认的迁移表执行，但必须遵守：
- 不改业务代码。
- 不扩展需求。
- 不删除任何项目事实文档；如确需移除，只能移动到 `docs/archive/`。
- 移动文件后，更新被影响的相对链接。
- 根 `README.md` 只补项目说明版块，不改成模板 README。
- `ai/project-rules.md` 只补项目专属约束，不复制模板方法论长文。
- 若 `docs/env/local-env.md` 缺失且用户允许，先运行 `powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1`；否则只给出待执行命令。
- 环境约束未知项必须保留“待确认”，不得虚构本机资源或服务器资源。
- 每一步保持最小变更。

完成后请输出：
1. 实际变更清单
2. 文件迁移对照表
3. 已更新的链接
4. 环境约束补齐情况
5. 未能自动确认的链接 / 风险
6. 建议验证命令
```
