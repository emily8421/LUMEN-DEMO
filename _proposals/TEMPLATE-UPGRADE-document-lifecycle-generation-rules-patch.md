# TEMPLATE-UPGRADE Patch: Document Lifecycle Generation Rules

> 对应提案：`_proposals/TEMPLATE-UPGRADE-document-lifecycle-generation-rules.md`
>
> 本文件给出未来回流 `ai-project-template` 模板仓库时的具体修改建议。当前派生项目不直接修改模板同步文件；以下内容作为模板 PR 的 patch 设计稿。

## 1. 目标文件清单

建议模板 PR 修改 / 新增：

```text
ai/document-lifecycle-rules.md   # 新增
ai/index.md                      # 追加规则文件入口
ai/global-rules.md               # 原则级引用新规则
INIT-PROMPT.md                   # 各 Prompt 改为读取 / 引用新规则
docs/README.md                   # 补充内容生成与追溯规则入口
CHANGELOG.md                     # 记录模板方法论升级
VERSION                          # 小版本升级，例如 v1.8.0
```

## 2. 新增 `ai/document-lifecycle-rules.md`

建议新增完整文件如下。

````markdown
# Document Lifecycle Rules（文档生命周期生成规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义从产品愿景到需求、总体设计、详细设计、实现计划、测试验证、代码实现的文档生命周期生成规则。AI 生成或修改任何项目事实文档时，必须先识别该文档的上游输入、约束来源、输出职责和下游影响，不得凭空生成。

## 1. 基本原则

1. **有据生成**：每个文档必须由明确上游输入生成，不得只凭对话印象或 AI 猜测补齐。
2. **逐级约束**：下游文档不得引入上游未授权的需求、模块、表、接口、依赖或测试目标。
3. **全链追溯**：愿景场景、用户需求、系统需求、阶段路线图、设计、任务、测试、代码之间必须能建立追溯关系。
4. **变更传播**：上游文档变更后，必须评估下游影响；不得只改单点文档。
5. **阶段分离**：愿景功能不等于当前阶段功能；当前阶段范围以 `docs/03-prd.md` §3 与 `ai/project-rules.md` §1 为准。
6. **状态据实**：候选、预留、默认关闭、Mock 或未实现能力不得写成已接入 / 已实现。

## 2. PLM 阶段链路

```text
产品愿景 / 输入材料
  → 需求阶段（00 / 01 / 02 / 03）
  → 总体设计阶段（04 / 05）
  → 详细设计阶段（06 / 07 / docs/design/*）
  → 实现计划阶段（08 / tasks/*）
  → 测试验证阶段（09 / tests）
  → 实现阶段（code / scripts / docker / runtime docs）
```

每个阶段必须声明：

- 输入来源。
- 输出职责。
- 禁止引入内容。
- 追溯 ID 或来源锚点。
- 下游影响范围。

## 3. 多入口生成策略

文档生命周期规则不假设所有项目都从 `docs/vision/product-vision.md` 开始。愿景文档是完整产品叙事入口，但小系统、内部工具、已有 PRD / SRS 的项目允许从更成熟的输入开始。

上游输入包：

```text
上游输入包 = 愿景文档 / 00-scenario / 用户需求清单 / SRS / PRD / 任务单 / 现有系统说明 / 接口草案 / 人工确认约束
```

入口选择矩阵：

| 入口模式 | 已有输入 | 允许动作 | 必须补齐 | 停下问人的情况 |
|---|---|---|---|---|
| Vision-first | 产品愿景 / 故事叙事 | 生成 `00-09` 完整骨架 | `project-rules` 初值、环境约束 | 愿景无法抽出角色 / 场景 / 功能点 |
| Scenario-first | `00-scenario.md` | 从 `01` 起补齐需求链与设计 | 来源说明、阶段建议 | 场景无法枚举功能点 |
| URS-first | 用户需求清单 / 访谈结论 | 补轻量 `00`，生成 `02-09` | `00` 工程想定摘要、需求来源 | 需求无法编号或无法验收 |
| SRS-first | 系统需求规格 | 反向补轻量 `00/01` 摘要，生成 `03-09` | U-ID / 来源映射、阶段路线图 | REQ 来源不明或范围冲突 |
| PRD-first | 已有 PRD / 路线图 | 补追溯所需 `00-02` 摘要，生成 `04-09` | REQ 清单、阶段标签唯一来源 | PRD 功能无法追溯到需求 |
| Existing-system | 现有系统 / 代码 / 接口说明 | 先做事实盘点，再补 docs | 现状 / 目标 / 差距 / 风险 | 代码事实与目标需求冲突 |
| Task-first | 明确任务单 | 仅在现有 docs 足够时执行任务 | task → Sprint → REQ 追溯 | 缺少可追溯 REQ 或设计依据 |

要求：

- 不强制所有项目编写愿景文档。
- 跳过愿景时，必须有可审计的替代输入，并在生成文档中标注来源。
- 反向补齐的上游文档必须标注“由下游输入摘要生成，待人工确认”，不得伪装成原始需求来源。
- 简化的是文档厚度和可省略项，不是追溯关系。

## 4. 文档体系剖面

| 剖面 | 适用项目 | 必备文档 | 可裁剪项 | 约束 |
|---|---|---|---|---|
| Full | 产品级系统 / 愿景驱动项目 | `vision` + `00-09` + `docs/design/*` | 无，除非 `project-rules §3` 明确省略 | 完整追溯与阶段骨架 |
| Standard | 常规 Web / 服务项目 | `00-09` | 非平凡子系统才建 `docs/design/*` | `06/07` 按持久化 / 接口裁剪 |
| Lean | 小工具 / 内部脚本 / CLI | 轻量 `00-03` + `05` + `08` + `09` | 可省略 `04/06/07/design`，需在 `project-rules §3` 说明 | 仍需任务、验收与依赖边界 |
| Existing-system | 既有系统改造 | 现状说明 + 轻量 `00-03` + 受影响设计 / 验证 | 不受影响文档可保留骨架 | 必须区分“现状事实”和“目标变更” |

## 5. 文档生成矩阵

| 文档 / 产物 | 阶段 | 主要输入 | 输出职责 | 禁止项 | 下游影响 |
|---|---|---|---|---|---|
| `docs/vision/*` | 输入材料 | 人工愿景、访谈、市场材料 | 描述完整产品图景和业务叙事 | 不直接定义开发范围；不替代 PRD | `00-03` |
| `docs/00-scenario.md` | 需求 | `docs/vision/*`、人工背景 | 工程想定：背景、目标用户、典型场景、输入指针 | 不放完整功能表；不定阶段路线图 | `01` |
| `docs/01-user-requirements.md` | 需求 | `00`、`docs/vision/*` | 用户需求全集；每条带来源锚点、阶段标签、状态 | 不丢愿景功能；不写实现方案 | `02`、`03` |
| `docs/02-srs.md` | 需求 | `01`、`00` | 系统需求规格；REQ 编号；当前阶段可验证口径；后续阶段粗粒度 | 不引入 `01` 没有的功能；不把远期写成当前阶段 | `03`、`09` |
| `docs/03-prd.md` | 需求 / 产品 | `02`、`01`、`project-rules` | 功能范围、优先级、阶段路线图；阶段标签唯一来源 | 不绕过 REQ 自行定功能；不把 Demo 写成 MVP | `project-rules §1`、`04-09` |
| `docs/04-architecture.md` | 总体设计 | `03`、`02`、`project-rules`、`docs/env/*` | 系统模块、边界、运行拓扑、子系统划分 | 不新增 PRD 外模块；不忽略资源约束 | `05-09`、`docs/design/*` |
| `docs/05-tech-spec.md` | 总体设计 | `04`、`03`、`project-rules`、`docs/env/*` | 技术选型、版本、资源评估、降级 / Mock、服务器预案 | 不虚构依赖、模型、接口或资源；不把候选写成已用 | `06-09`、代码 |
| `docs/06-db-design.md` | 详细设计 | `02/03`、`04/05` | 表、字段、索引、约束；每张表追溯 REQ / 模块 | 不建无需求来源的表；不提前写死远期字段细节 | 代码、迁移、测试 |
| `docs/07-api-spec.md` | 详细设计 | `02/03`、`04/05` | 接口契约、请求响应、权限、错误码 | 不建孤立接口；不暴露权限边界外能力 | 代码、集成测试 |
| `docs/design/*` | 详细设计 | `04/05`、对应 REQ、`06/07` | 非平凡子系统流程、边界、状态机、失败处理 | 不替代 04/05；不提前实现远期细节 | `08/09`、代码 |
| `docs/08-dev-plan.md` | 实现计划 | `03-07`、`project-rules` | 当前阶段 Sprint / task 拆分、验收标准、禁止事项 | 不把后续阶段排进当前阶段；不一次实现整个系统 | `tasks/*`、代码 |
| `tasks/*` | 实现计划 | `08`、相关设计文档 | 单任务边界、输入文档、修改范围、验收标准 | 不扩大到整个系统；不引入新需求 | 代码、测试 |
| `docs/09-verification.md` | 测试验证 | `02/03`、`04-08`、`docs/env/*` | REQ → 用例追溯、资源验证、验收策略 | 不遗漏当前阶段 REQ；不测试未批准功能为必过项 | tests、验收 |
| `README.md` | 项目说明 | `03`、`04/05`、`08/09`、`project-rules` | 项目状态、文档入口、运行环境、验证方式 | 不替代事实文档；不声明未实现能力 | 用户 / 开发者入口 |
| code / tests / scripts / docker | 实现 | `tasks/*`、`04-09` | 实现当前任务和验证 | 不实现未批准需求；不绕过设计 | 文档反向同步 |

## 6. 追溯链规则

标准追溯链：

```text
上游输入锚点（愿景场景 / 需求条目 / SRS 条款 / PRD 条款 / 任务单 / 现有系统事实）
  → U-ID（用户需求）
  → REQ-ID（系统需求）
  → Phase（03 路线图）
  → 架构模块 / 技术决策 / 数据表 / API / 子系统设计
  → Sprint / task
  → 测试用例
  → 代码 / 测试实现
```

强制要求：

- `01` 中每个 U-ID 必须能回到愿景锚点、人工输入来源或反向摘要来源。
- `02` 中每个 REQ-ID 必须能回到一个或多个 U-ID。
- `03` 必须覆盖全部 REQ-ID，并给出阶段归属。
- `04-07` 中新增的模块、技术、表、接口、子系统必须能追溯到 REQ-ID 或明确的非功能约束。
- `08/09` 必须覆盖当前阶段 REQ-ID；远期 REQ 可保留骨架，不强行细化。
- 代码和测试必须能追溯到 task / Sprint / REQ。

## 7. 变更传播规则

| 变更对象 | 必须评审 / 影响分析 |
|---|---|
| `docs/vision/*` | `00-03`，再评估 `04-09` 与 `docs/design/*` 是否受影响 |
| 其他上游输入包 | 先判断入口模式，再评审其下游文档链路是否需要补齐或重生成 |
| `docs/00-scenario.md` | `01-03`，以及当前阶段演示场景 / 验证夹具 |
| `docs/01-user-requirements.md` | `02/03`，新增或删除 U-ID 时必须评估 REQ 编号和阶段路线图 |
| `docs/02-srs.md` | `03-09`，新增或删除 REQ 时必须更新追溯链 |
| `docs/03-prd.md` | `project-rules §1`、`04-09`、`tasks/*` |
| `ai/project-rules.md` | `03-09`、代码目录结构、运行环境文档 |
| `docs/04-architecture.md` | `05-09`、`docs/design/*`、代码结构 |
| `docs/05-tech-spec.md` | `06-09`、依赖文件、运行脚本、部署配置 |
| `docs/06-db-design.md` | API、service/model、迁移、测试数据 |
| `docs/07-api-spec.md` | API 层、前端调用、集成测试 |
| `docs/design/*` | `08/09`、相关实现任务 |
| `docs/08-dev-plan.md` / `tasks/*` | 当前实现范围和测试计划 |
| code / tests | 若代码事实偏离文档，必须走文档反向同步 |

## 8. AI 生成前声明

AI 生成或修改任何项目事实文档前，必须先简短说明：

```text
本次输入文档：...
入口模式与文档剖面：...
本次约束文档：...
本次允许修改范围：...
本次不得新增内容：...
预计下游影响：...
```

若上游输入不足，AI 必须停下并列出待确认项，不得用猜测补齐。

## 9. AI 生成后自检

AI 生成或修改后必须输出：

```text
新增 / 修改文件：...
上游依据清单：...
入口模式与剖面选择理由：...
新增 / 变更 ID 清单：...
追溯链检查：...
下游影响清单：...
需人工确认项：...
验证方式：...
```

## 10. 一票否决

- 不得凭空新增需求、模块、表、接口、依赖或测试目标。
- 不得强制所有项目从愿景文档起步；但跳过愿景时必须声明替代输入来源与可信度。
- 不得因当前 Phase 裁剪掉愿景中的功能；应保留为后续阶段或愿景骨架。
- 不得把愿景功能直接塞进当前阶段，除非 `docs/03-prd.md` 和 `ai/project-rules.md` §1 已明确批准。
- 不得留下悬空 ID：无来源的 U-ID、无 U-ID 的 REQ、无 REQ 的表 / 接口 / Sprint / 测试用例。
- 不得把候选、预留、默认关闭、Mock 或未实现能力写成已接入 / 已实现。
- 不得只修改上游文档而不评估下游影响。
- 不得把由下游文档反向摘要得到的 `00/01` 内容伪装成原始用户输入。
````

## 3. 修改 `ai/index.md`

### 3.1 old

```markdown
请按顺序阅读以下文件，再开始任何分析、设计或编码：

- ai/global-rules.md
- ai/project-rules.md
```

### 3.2 new

```markdown
请按顺序阅读以下文件，再开始任何分析、设计或编码：

- ai/global-rules.md
- ai/document-lifecycle-rules.md
- ai/project-rules.md
```

说明：

- `global-rules` 保持最高层原则。
- `document-lifecycle-rules` 约束文档生成、追溯与变更传播。
- `project-rules` 继续承载项目专属 Phase、技术栈、环境与禁区。

## 4. 修改 `ai/global-rules.md`

### 4.1 在 §1 “文档驱动开发”后补充

old：

```markdown
1. **文档驱动开发**：开发顺序固定为
   `Scenario → 用户需求 → SRS → PRD → 架构 → 技术方案 → 数据库设计 → API设计 → 开发计划 → 代码`。
```

new：

```markdown
1. **文档驱动开发**：开发顺序固定为
   `Scenario → 用户需求 → SRS → PRD → 架构 → 技术方案 → 数据库设计 → API设计 → 开发计划 → 代码`。
   每个文档必须按 `ai/document-lifecycle-rules.md` 声明上游输入、输出职责、追溯关系与下游影响；禁止凭空生成无上游依据的需求、设计、接口、表、任务或测试。
```

### 4.2 在 §8 开头补充引用

old：

```markdown
## 8. 文档演进规则（积累式）

> 设计类文档（03–09、design-*）按「完整骨架 + 阶段增量」演进，**只增不删**。
> 框架一次铺满，细节随阶段在原位完善。
```

new：

```markdown
## 8. 文档演进规则（积累式）

> 文档生成、追溯与变更传播细则见 `ai/document-lifecycle-rules.md`。
> 设计类文档（03–09、design-*）按「完整骨架 + 阶段增量」演进，**只增不删**。
> 框架一次铺满，细节随阶段在原位完善。
```

## 5. 修改 `INIT-PROMPT.md`

### 5.1 使用方式总览

建议在原则段补充：

old：

```markdown
> 原则：Prompt 不是需求本身。AI 只能基于 `docs/`、`ai/project-rules.md` 与人工确认的信息工作；如果输入不足，先补输入，不要让 AI 猜。
```

new：

```markdown
> 原则：Prompt 不是需求本身。AI 只能基于 `docs/`、`ai/document-lifecycle-rules.md`、`ai/project-rules.md` 与人工确认的信息工作；如果输入不足，先补输入，不要让 AI 猜。生成或修改任何项目事实文档前，必须按文档生命周期规则声明上游输入、约束来源、允许修改范围和下游影响。
```

### 5.2 §0 从产品愿景文档生成完整文档体系

建议将标题从：

```markdown
## 0. 从产品愿景文档生成完整文档体系（vision → docs）
```

调整为：

```markdown
## 0. 多入口生成 / 补齐完整文档体系（inputs → docs）
```

并在适用场景中补充：

```markdown
适用场景：项目已有愿景文档、00 场景、用户需求清单、SRS、PRD、任务单或现有系统说明等任一上游输入包，需要生成或补齐 docs 文档体系。若从非愿景入口开始，必须按 `ai/document-lifecycle-rules.md` 声明入口模式、文档剖面和需反向补齐的最小上游摘要。
```

old：

```markdown
先阅读：ai/index.md 列出的全部规则文件 + 该愿景文档 + docs/env/local-env.md（如存在）。
```

new：

```markdown
先阅读：ai/index.md 列出的全部规则文件（尤其 `ai/document-lifecycle-rules.md`）+ 该愿景文档 + docs/env/local-env.md（如存在）。
```

建议在【心智模型】后补充：

```markdown
- 文档生命周期：每份文档必须按 `ai/document-lifecycle-rules.md` 说明上游输入、输出职责、追溯关系和下游影响；愿景场景锚点 → U-ID → REQ-ID → Phase → 设计 / Sprint / 验证必须可追溯。
- 多入口：不强制所有项目从愿景文档开始；若从 00 / 01 / 02 / 03 / task / 现有系统事实开始，必须声明入口模式与文档剖面，并为缺失的上游文档生成“轻量摘要·待人工确认”，不得伪装成原始输入。
```

建议将【硬约束】第 6 条改为：

old：

```markdown
6. REQ 全覆盖：03 §1 列出全部 REQ；每个 REQ 在 03 §3 有阶段归属，并能追溯到 08 Sprint 与 09 验收用例；生成后自检无悬空 REQ
```

new：

```markdown
6. 全链追溯：愿景场景锚点 → U-ID → REQ-ID → 03 §3 阶段 → 04/05 模块与技术决策 → 06/07 表与接口 → 08 Sprint / task → 09 验收用例；生成后自检无悬空 U-ID / REQ / 设计要素 / Sprint / 验证用例
```

### 5.3 §1 新项目初始化（生成03-09）

old：

```markdown
请先阅读：
- docs/00-scenario.md
- docs/01-user-requirements.md
- docs/02-srs.md
- ai/global-rules.md
- ai/project-rules.md（§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪含「演示形态」——生成前已由人工填好，作为约束）
```

new：

```markdown
请先阅读：
- docs/00-scenario.md
- docs/01-user-requirements.md
- docs/02-srs.md
- ai/global-rules.md
- ai/document-lifecycle-rules.md
- ai/project-rules.md（§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪含「演示形态」——生成前已由人工填好，作为约束）
```

建议在要求中新增：

```markdown
14. 若项目选择 Lean / Existing-system 剖面，可按 `ai/project-rules.md` §3 裁剪 04/06/07/docs/design，但必须说明裁剪依据、保留最小追溯链，并在 README / 09 中保留验证入口。
```

建议将要求第 7 条改为：

old：

```markdown
7. REQ 全覆盖：03 §1列出 02-srs 全部 REQ；每个 REQ 在 03 §3 有阶段归属，并能追溯到 08 Sprint 与 09 验收用例；不得留下悬空 REQ
```

new：

```markdown
7. 全链追溯：03 §1 列出 02-srs 全部 REQ；每个 REQ 在 03 §3 有阶段归属，并能追溯到 04/05 模块与技术决策、06/07 表与接口、08 Sprint、09 验收用例；不得留下悬空 REQ 或无 REQ 来源的设计要素
```

### 5.4 §2 单任务执行 / 切换工具续接

建议在“请先阅读”列表中加入：

```markdown
- ai/document-lifecycle-rules.md
```

建议在任务约束中补充：

```markdown
- 本任务涉及文档或代码变更时，先按 `ai/document-lifecycle-rules.md` 说明上游依据与下游影响；不得实现 task / Sprint / REQ 之外的功能。
```

### 5.5 §3 项目审查

建议在审查维度中新增：

```markdown
追溯审查 —— 愿景 / U-ID / REQ / Phase / 设计 / Sprint / 验证 / 代码是否成链，无悬空项
传播审查 —— 上游文档变更是否已评估下游影响
```

### 5.6 §4 单文档修订

建议在 Prompt 中补充：

```markdown
修订前先按 `ai/document-lifecycle-rules.md` 判断该文档的上游输入与下游影响。若修改会影响下游文档，先列影响清单和计划，等待人工确认后再改。
```

### 5.7 §7 文档反向同步

建议在 Prompt 中补充：

```markdown
反向同步时，先判断代码事实对应的 task / Sprint / REQ；若代码实现超出已批准需求，优先标记为越界风险，而不是直接把越界事实写入需求文档。
```

### 5.8 §10 docs/03-09 文档验收 checklist

建议新增小节：

```markdown
### B0. 文档生命周期追溯
- [ ] 每个 `01` U-ID 都能回到愿景锚点或人工输入来源。
- [ ] 每个 `02` REQ-ID 都能回到一个或多个 U-ID。
- [ ] `03` 覆盖全部 REQ，并给出阶段归属。
- [ ] `04-07` 的模块、技术决策、表、接口、子系统均能追溯到 REQ 或明确的非功能约束。
- [ ] `08/09` 覆盖当前阶段全部 REQ，且未把后续阶段 / 愿景功能作为当前阶段必做项。
- [ ] 本次上游文档变更已列出下游影响；无“只改上游不评估下游”的情况。
```

建议在一票否决中补充：

```markdown
- 出现无上游依据的 U-ID / REQ / 模块 / 表 / 接口 / Sprint / 验证用例 → 退回补追溯或删除。
- 上游文档发生变更但未评估下游影响 → 退回补影响分析。
```

## 6. 修改 `docs/README.md`

建议在开头说明后补充：

old：

```markdown
本目录保存项目事实、需求、设计、计划与验证材料。AI 新增文档前必须先判断文档类型，放入对应子目录；不得把临时文档、调研记录或详细设计直接堆到 `docs/` 根目录。
```

new：

```markdown
本目录保存项目事实、需求、设计、计划与验证材料。AI 新增文档前必须先判断文档类型，放入对应子目录；不得把临时文档、调研记录或详细设计直接堆到 `docs/` 根目录。

文档内容生成、上游输入、追溯链与下游影响规则见 `ai/document-lifecycle-rules.md`。
```

## 7. 修改 `CHANGELOG.md`

建议新增版本记录，例如：

```markdown
## v1.8.0 - YYYY-MM-DD

### Added
- 新增 `ai/document-lifecycle-rules.md`，定义从愿景、需求、总体设计、详细设计、实现计划、测试验证到代码实现的文档生命周期生成规则。

### Changed
- `ai/index.md` 追加读取文档生命周期规则。
- `INIT-PROMPT.md` 的文档生成、单文档修订、反向同步和验收 checklist 改为引用统一追溯与变更传播规则。
- `ai/global-rules.md` 保留原则级文档驱动说明，并引用文档生命周期规则承载细则。
```

## 8. 修改 `VERSION`

建议：

```text
v1.8.0
```

## 9. 模板 PR 验收建议

模板 PR 合并前建议验证：

1. `ai/index.md` 中规则文件顺序正确。
2. AGENTS / CLAUDE / Cursor 入口无需单独修改，仍只指向 `ai/index.md`。
3. `INIT-PROMPT.md` 不再重复承载全部文档生命周期细则，而是引用 `ai/document-lifecycle-rules.md`。
4. 新建派生项目时，AI 能在生成任何 `docs/` 文档前列出输入、约束、允许修改范围和下游影响。
5. 使用 §10 checklist 能检查愿景 → U-ID → REQ → Phase → 设计 → Sprint → 验证 → 代码的追溯链。


