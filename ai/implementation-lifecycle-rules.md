# Implementation Lifecycle Rules（实现生命周期规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 `docs/` 文档体系确认之后，AI 如何进行阶段规划、Sprint / Task 拆分、编码实现、验证与验收留痕。它与 `ai/document-lifecycle-rules.md` 分工如下：

- `document-lifecycle-rules`：约束输入材料、文档生成、文档追溯、文档变更传播。
- `implementation-lifecycle-rules`：约束从已确认文档到代码实现、测试验证、提交 / PR、验收记录的执行闭环。

## 1. 基本原则

1. **先计划后编码**：未确认当前 Phase、Sprint / Task、输入文档、修改范围和验收标准前，不得开始实现代码。
2. **小步可验收**：一个 Task 只做一个可验收目标；一个提交或小 PR 应对应一个 Task 或一个清晰的修复闭环。
3. **验证闭环**：不能只说“已实现”；必须说明验证方式、执行结果、失败项和未验证风险。
4. **边界优先**：当前 Phase 以 `docs/03-prd.md` §3 与 `ai/project-rules.md` §1 为准，愿景或后续阶段内容不得提前实现。
5. **事实可追溯**：实现必须能追溯到 `REQ → Phase → Sprint / Task → Test Case → Commit / PR → 验收记录`。

## 2. 层级模型

| 层级 | 权威来源 | 作用 | 最小输出 |
|---|---|---|---|
| Phase | `docs/03-prd.md` §3、`ai/project-rules.md` §1 | 定义当前阶段允许 / 禁止 / 下一阶段预告 | 阶段目标、退出标准、禁止越界 |
| System Skeleton | `ai/implementation-lifecycle-rules.md` §3、`docs/08-dev-plan.md` Sprint 0 | non-trivial 项目首个业务 Sprint 前的可运行系统框架先行 | 框架验收证据、豁免理由 |
| Sprint | `docs/08-dev-plan.md` | 把 Phase 拆成可执行增量 | 目标、输入文档、修改范围、验收标准 |
| Task | `docs/08-dev-plan.md` 或 `tasks/task-*.md` | 执行一个小范围目标 | 1–3 个文件 / 模块、明确禁止项 |
| Test Case | `docs/09-verification.md` | 定义怎么算通过 | TC-ID、步骤、通过标准、自动化位置 |
| Commit / PR | Git 历史、PR 说明 | 固化实现事实与审查记录 | 关联 Task / Sprint、验证摘要 |
| Acceptance Record | `docs/09-verification.md` §验收记录 | 记录 Sprint / Phase 是否完成 | 执行人、日期、结果、失败项 / 后续任务 |

## 3. 阶段规划规则

阶段规划发生在文档体系成型并通过评估 / 审计之后，通常对应 Scenario A9。若刚经历关键阶段转换，建议先用 `ai/prompts/review/19-docs-evaluation.md` 做整体或阶段评估；结论为 `No Go` 时不得进入 Sprint 规划，`Conditional Go` 必须列明条件、风险接受口径和待人工确认项。

若项目包含真实运行依赖（如 `backend/`、`frontend/`、`docker/`、数据库、本机模型、外部 API、重型 SDK、LLM、真实数据或权限安全能力），进入首个会触发这些依赖的编码 Sprint 前，必须已有技术路线与环境支撑评估，并在 `docs/05-tech-spec.md` 记录 Risk-ID、依赖配置、readiness gate 和解锁条件；或记录用户明确跳过的原因、风险、影响范围和补做时点。评估结论为 `No-Go` 时不得进入相关 Sprint；`Conditional Go` 只能进入满足限制条件或不触发该风险的 Sprint。

若项目为 non-trivial（多模块 / 有对外接口 / 有运行依赖），进入首个业务模块 Sprint 前必须先实现并验收一套可运行系统框架（System Skeleton）：基于 `docs/04-architecture.md` 架构与功能划分、`docs/07-api-spec.md` 接口规范和主业务流程，落地最小可运行框架——模块边界就位、关键接口连通、至少一条纵切可跑通、错误 / 空 / 加载入口存在，但不含完整业务逻辑；并在 `docs/08-dev-plan.md`（Sprint 0 / Framework Sprint）与 `docs/09-verification.md`（系统框架测试大纲）留框架验收证据。quick-script、纯计算库、单文件工具等可豁免，须在 `ai/project-rules.md` §3 写明豁免理由、风险和补做时点。未完成且无豁免时，不得直接堆入完整业务模块。

复杂 Web / 全栈交互项目在通用 System Skeleton 基础上叠加 `template-docs/profiles/web-fullstack-profile.md` 的 Web 特化（触发条件见 `ai/global-rules.md` §5）：App Shell、前后端目录边界、API client ↔ API-ID 追溯、至少一个 vertical slice、文件膨胀阈值和最小浏览器 / API smoke。未完成且无豁免时，不得把多页面 / 多状态功能继续堆入单个主应用文件、全局样式或后端 controller / service。

1. 输入必须至少包括 `docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`。
2. 若项目涉及持久化或对外接口，还必须读取 `docs/06-db-design.md`、`docs/07-api-spec.md` 的相关章节。
3. Phase 划分必须同时说明功能范围与交付物形态（Demo / MVP / 产品），不得默认 Phase1 等于 MVP。
4. 当前 Phase 的“允许 / 禁止 / 下一阶段预告”必须同步到 `ai/project-rules.md` §1。
5. 不得把后续 Phase 的测试用例列为当前必过项；可保留骨架，但状态必须标明“后续阶段”。`04/05` 中为候选、默认关闭、Mock、降级或禁止的能力，不得在当前 Sprint 默认解锁。

## 4. Sprint 与 Task 拆分规则

1. 每个 Sprint 应对应一个小功能、一个验证闭环或一组紧密相关的改动，不能承载整个系统。
2. Sprint 必须写明：目标、输入文档、预计修改范围、验证包、验收标准、禁止事项和完成包位置。
3. 出现以下任一情况时，必须拆成 `tasks/task-00X-xxx.md`：
   - 修改范围超过 3 个文件 / 模块；
   - 验收标准无法一次完成；
   - 涉及多个不相干功能；
   - 多人 / 多 AI 会话并行；
   - 需要跨测试等级逐步验证。
4. Task 命名与内容必须能追溯回 Sprint、REQ 和 Test Case；Task 文件必须包含任务元信息、验证包、降级 / Mock 边界、完成记录和待确认项。

## 5. 单任务执行规则

AI 执行 Sprint / Task 前必须先输出实现方案，并等待用户确认后再修改文件。方案至少包含：

- 上游依据：关联 REQ、Phase、设计章节、Sprint / Task。
- 修改范围：预计新增 / 修改 / 删除文件，原则上限制 1–3 个文件 / 模块；若一次 patch 涉及多个文件，逐项列出变更摘要。
- 验证方式：关联 Test Case、自动化命令、人工验收步骤。
- 越界检查：说明不会实现哪些后续阶段内容。
- 风险与待确认：依赖、环境、资源、账号、外部服务等不确定项。
- 技术环境门禁：若任务会触发真实运行依赖，确认已有 `docs/research/*tech-env-evaluation*.md` 或同等技术环境评估结论，并核对 `docs/05-tech-spec.md` 中对应 Risk-ID / readiness gate 为 Go 或满足 Conditional Go 条件；缺失时先停止并建议运行 `tech-env-evaluation`，除非用户明确要求跳过并接受风险。
- 审计兜底：修改前后查看 `git status --short --branch`；必要时让用户审阅 `git diff`。

执行过程中如发现文档与代码事实冲突，必须先停下说明冲突；不得直接把代码实现扩展为新需求。

## 6. 测试与验证分层

验证方案应按项目形态裁剪，但必须说明适用 / 不适用原因。

| 测试等级 | 用途 | 常见证据 |
|---|---|---|
| 单元测试 | 验证函数、类、组件的局部行为 | 测试命令、通过日志、覆盖关键边界 |
| 集成测试 | 验证模块、数据库、外部接口协作 | 测试命令、测试数据、服务依赖说明 |
| 系统 / 端到端测试 | 验证主流程从入口到输出可跑通 | E2E 命令、截图、日志、演示步骤 |
| 验收测试 | 验证 REQ / Sprint 是否满足用户目标 | TC-ID、人工验收步骤、结论 |
| 回归测试 | 验证修复或改动未破坏既有能力 | 回归范围、历史用例、结果 |
| 资源 / 环境验证 | 验证本机或目标环境能运行 | `docs/env/local-env.md`、耗时、内存、端口、降级记录 |
| Readiness gate | 验证真实依赖进入 Sprint / Phase 的条件 | `docs/05-tech-spec.md` Risk-ID / RG-ID、技术环境评估报告、命令输出、TC 证据 |
| 系统框架 smoke | 验证 System Skeleton 可运行：纵切可跑通、关键接口连通、错误 / 空 / 加载入口存在 | `docs/09-verification.md` 系统框架测试大纲、smoke 命令 / 截图 / 日志 |

Lean / 小工具项目可以采用最小验证包，但至少需要：一个可复现的运行命令或人工步骤、预期输出、实际结果、未验证项。

验收还可按大纲层次组织（与测试等级矩阵正交的另一维度）：需求验收大纲 → 系统框架测试大纲 → 集成测试大纲 → 单元模块测试大纲；层次化结构见 `docs/09-verification.md`，等级矩阵保留为「等级维度」，不替代层次维度。

### 6.1 破坏性测试数据库安全 guard

跑数据库集成测试（`TRUNCATE` / 重建 schema / 批量删除等破坏性 fixture）时，**必须**防止误清开发 / 生产库。要求：

1. **独立测试库**：集成测试用独立测试库（库名含 `_test` 后缀或等价明确测试标识），不与开发 / 生产库共用同一物理库。
2. **三重 fail-closed guard**：破坏性操作前，测试侧 guard 校验三条件（**全部**满足才放行，任一不满足直接抛错且**不降级为 skip**）：
   - 测试环境标记（如 `<PROJECT>_ENV=test` 精确匹配）；
   - `DATABASE_URL` 指向测试库（库名 `_test` 后缀 + 正确 scheme）；
   - 显式破坏性开关（如 `ALLOW_DESTRUCTIVE_TEST_DB=1` 精确匹配）。
3. **guard 位置与形态**：guard 是**测试侧纯函数**（接收 URL 字符串校验，不连库、不 import 生产 engine / ORM 初始化），**不进生产 service 目录**；在连接 `try/except` **外**调用（避免被宽泛 `except Exception` 吞成 skip），破坏性 SQL 前应二次调用。
4. **错误信息**：只列失败条件，**不含连接串 / 凭证 / 主机**（防日志与 CI 输出泄露）。
5. **fail-closed 语义**：guard 不满足时**抛错不 skip**——skip 会让破坏性测试在配置错误时静默跳过保护，违背 guard 初衷；仅在 guard 已过、DB 连接 / 环境本身不可用时才 skip 连接类失败。

> 口径：`ai/project-rules.md §3` 声明「有持久化存储」的项目，在首个 DB 集成测试 Sprint 前落地此 guard；guard 代码放 `tests/` 侧（如 `tests/<lang>/db_test_support.<ext>`），不进生产代码目录。无持久化项目豁免（`ai/project-rules.md §3` 声明）。验证方式：guard 纯单测（三条件全满足才过、缺任一即拒、非测试库 URL 拒）+ 负向 smoke（指向开发库时即使 DB 可达也在连接 / SQL 前拒）。

### 6.2 自动检查归位与质量门口径

自动质量门（test / type / lint / build）属于本节「验证方案」维度：按项目形态裁剪，必须说明适用 / 不适用原因，不强制固定工具组合（与 §6 主节开门句同口径）。它解决"某项可执行检查该作为强制 Gate 还是通用原则"的归位问题，统一采适用性裁剪立场（来源：派生项目回流 #335 §3；#332「固定三件套」退回重写后与本口径统一）。

1. **不与 L0 通用原则重复定义**：test / type / lint / build 的"是否必跑"在 §6 给 Gate 口径，"为什么跑 / 怎么写可测代码"在 `global-rules §2.1` L0（L0-8「CI 必须跑测试」用指针回指本节，不在两处重复定义）。
2. **适用性裁剪 + 显式说明**：项目按形态声明适用的自动检查；不适用项（如无类型系统语言、build 已覆盖 type check、CLI 脚本无独立 test、纯文档 Sprint）必须显式说明理由，不得默认跳过或隐瞒。
3. **声明位置**：选定的质量命令写在 `ai/project-rules.md §5` 或 `docs/05-tech-spec.md`；CI 具体落地由派生项目按栈自建，模板不预置跨语言通用 lint / type 命令。

> 口径：任何有可执行代码的项目均适用；无代码项目（纯文档 / 纯配置）豁免。验证方式：`ai/project-rules.md §5` 或 `docs/05-tech-spec.md` 能查到项目声明的适用质量门与不适用项理由；CI 实际跑通的检查与声明一致。`web-fullstack-profile §9.4` 的「质量门按形态裁剪」指针指向本节。

> **应用说明（来源：#332 退回重写稿）**——下列三条为上述归位口径在常见场景的落地说明，非新增规则（第 1 条为形态示例，第 2/3 条为补强说明）：
>
> 1. **质量门常见形态对照（示例）**：有类型系统项目 → type 检查纳入质量门；build 已覆盖类型检查 → 不重复单跑；CLI / 脚本项目无独立测试命令 → 以 smoke / 手动验证替代并在声明中说明理由；纯文档 / 纯配置项目 → 豁免。与本节第 2 条「适用性裁剪 + 显式说明」口径一致，仅补常见形态示例。
> 2. **关键 secret 启动校验（fail-closed）**：关键 secret（token 签名密钥、数据库凭证、第三方 API key 等）在生产或安全敏感运行态不得使用弱默认值；启动期校验，缺失或为默认值即启动失败。本地开发、测试、显式 Mock 场景允许受控替代配置，豁免时点与理由写入 `docs/05-tech-spec.md` 与验证计划，不得静默带弱默认运行。具体校验实现由技术栈决定，模板不预置写法。
> 3. **多实现显式契约**：同一接口的多个可替换实现（demo / 真实、mock / prod、read-replica / primary）须共享机器可检查的契约或兼容性测试，禁止仅靠 docstring + 鸭子类型声明接口对齐；机制由技术栈决定（如 Python `typing.Protocol` / ABC、Java interface、TS interface + 契约测试）。为 `global-rules §2.1` L0-12「先契约后实现」在多实现一致性场景的应用说明。

## 7. 验收与留痕

1. Sprint 完成前必须对照 `docs/08-dev-plan.md` 或 `tasks/*` 的验收标准逐项核对。
2. 验证结果必须写入 `docs/09-verification.md` 的验收记录或项目约定的验收位置。
3. 未通过项不得在总结中写成“已完成”；必须回到 `docs/08-dev-plan.md`、`tasks/*` 或缺陷修复流程。
4. Sprint 总结至少包含：改动文件、关联 REQ / Task / Test Case、验证命令与结果、残留风险、建议提交信息。
5. Phase 升级前必须确认当前 Phase 的必过用例、资源验证、readiness gate 和验收记录均已完成。

### 7.1 Sprint 完成包与正式回写

Sprint / Task 完成后必须形成最小完成包：改动文件、验证命令 / 人工步骤、验证结果、关联提交 / PR、`09` 验收记录、残留风险和下一步。

回写职责：

| 触发 | 必须检查 / 回写 |
|---|---|
| Sprint 完成 | `08` 状态 / 下一步、`09` 验收记录 / Sprint 验收包、残留风险 |
| Bug 修复 | `09` 缺陷与回归记录、相关 TC 状态、`08` 当前进度 |
| Mock / 降级验收 | `09` 条件通过 / 风险接受、`08` 后续补齐任务 |
| Phase 验收 | `03` Phase 状态、`08` Phase 完成情况、`09` Phase 验收、`project-rules` 当前阶段 |
| Phase 升级 | `project-rules`、`03/08/09`、README、handoff 状态一致性 |

`.ai/session-handoff.md` 只记录临时续接状态，不替代正式 `08/09` 进度和验收记录。若暂不回写正式文档，必须在总结和 handoff 中说明原因、风险和补做时点。未经人工确认，AI 不得自动把 Phase 状态改为已完成或自动进入下一 Phase。

## 8. 代码事实反向同步

当实现过程中发现文档与代码事实不一致时，按以下顺序处理：

1. **实现偏离文档**：优先修代码回到文档约束。
2. **文档确实过时**：停止编码，说明差异与影响，使用 `ai/prompts/docs/07-sync-docs-from-code.md` 或对应文档修订流程更新文档。
3. **需求变化**：回到需求 / PRD / Phase 流程，不得在当前 Task 内直接扩展范围。

## 9. 禁止项

- 禁止无设计、无 Sprint、无验收标准直接编码。
- 禁止把 Demo 阶段写成 MVP / 产品阶段。
- 禁止为了测试方便提前实现后续 Phase 功能。
- 禁止未运行验证就宣布完成。
- 禁止把未验证、Mock、降级或人工假设写成已通过。
- 禁止在真实运行依赖未完成技术环境评估且无明确跳过记录时进入相关编码 Sprint。
- 禁止一次提交混入多个无关 Task。
