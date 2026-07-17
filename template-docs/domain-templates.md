# DOMAIN-TEMPLATES（领域模板可选中间层）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 0. 定位声明（先读这段）

本文件说明「领域模板（domain template）」作为**可选中间层**的方法论定位。它不改变模板主线治理。

- **主线治理仍为两层**：母模板（`ai-project-template`）↔ 派生项目。绝大多数项目**直连母模板**，不经过领域模板。
- **三层是可选增强**：只有当**多类同类项目需要共享一组领域标准件**时，才在母模板与具体项目之间插入一层领域模板。
- **领域模板层尚在候选 / 演进中**：三层继承机制的设计源头 `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` 状态为部分落地，其 Batch 2（建仓 + scaffold MVP）、Batch 3 多级同步自动化与 Batch 4 仍**未落地**；Batch 3 的版本保留机制（C-004）已于 v1.47.0 落地（见 §5 / §7）。本文件先固化方法论定位，其余机制产物随后续 Batch 补齐。
- **现有派生项目无需迁移**：本文件不要求任何已存在的两层派生项目改变形态。
- **非强制**：没有任何项目必须经过领域模板。

> 简言之：读到「领域模板」时，请把它理解为「**需要时才插入的可选层**」，而不是「两层模型被推翻」。

## 1. 三层模型

```text
母模板 ai-project-template（base template，通用方法论）
  │
  ├─ 默认主路径（直连）──→ 普通派生项目
  │                        web / CLI / 数据管道 / 研究原型
  │                        （现有派生项目均为这条路径）
  │
  └─ 可选增强（领域层）──→ 领域模板（如 agent-system-template）
                            │   继承母模板通用方法论 + 叠加领域标准件
                            └──→ 领域派生项目（如某 agent 业务系统）
```

两层模型（母模板 → 派生项目）是默认主路径，三层模型（母模板 → 领域模板 → 项目）是它在「需要共享领域标准件」时的可选扩展。两层是三层的「直接派生」特例，二者不冲突。

**本文使用的术语**（glossary 仅收录「领域模板」一条并指向本文件，其余在此定义）：

| 术语 | 定义 |
|---|---|
| 母模板 / base template | `ai-project-template` 自身，提供跨项目通用方法论，不承担任何领域的全部细节。 |
| 领域模板 / domain template | 继承母模板通用方法论、再叠加某一类系统专用标准件的可复用模板（如面向 agent 系统的 `agent-system-template`）。 |
| 普通派生项目 | 直连母模板派生的项目（web / CLI / 数据 / 研究原型等通用项目）。 |
| 领域派生项目 | 从某个领域模板派生、填入业务事实的具体项目。 |
| `TEMPLATE-BASE.md` | 领域模板的溯源文件，记录继承自母模板的 base version 与来源（**当前为约定，产物尚未生成，见 §5**）。 |

## 2. 何时该用领域模板（判定标准）

只有**同时**满足以下条件，才考虑插入领域模板层；否则直连母模板：

1. **服务多个同类项目**：预期有多个同类系统会复用同一套规范（不是单个项目）。
2. **需要自己的版本 / scaffold / 自检**：该领域的标准件需要独立演进、独立版本化、独立完整性自检。
3. **需要共享一组领域标准件**：存在母模板不应承担、但该领域多个项目都需要的内容。

典型例子：agent 类系统需要 **tool 权限矩阵、memory / state 模型、trace / replay、agent eval、human-in-the-loop** 等标准件——这些若塞进母模板，会增加所有非 agent 项目的负担（见 inheritance 提案 §1）。因此适合作为 `agent-system-template` 领域模板。

反例：单个 web 应用、单个 CLI 工具、单个数据脚本——**直连母模板**即可，不必为此建领域模板。

Web App scaffold 也不自动等于领域模板。复杂 Web / 全栈交互项目先使用 `template-docs/web-fullstack-profile.md` 与 `template-docs/web-app-scaffold-experiment.md` 做普通项目或独立实验仓验证；只有当多个同类 Web 项目共享领域标准件、独立版本和自检需求时，才进入领域模板评估。

## 3. 三层职责边界

完整定义见 `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` §4.1 / §4.2 / §4.3，本节为结论摘要，不复制正文：

| 层 | 职责 | 不承担 |
|---|---|---|
| 母模板 | 跨项目通用能力：文档链路 `docs/00-09`、AI 行为规范 `ai/`、会话续接、提案 / 版本治理、通用验证、模板同步与自检 | 任何领域的全部细节（如 agent memory 模型、工具权限矩阵） |
| 领域模板 | 继承母模板通用方法论 + 叠加该领域专用标准件；可维护自己的版本 / CHANGELOG / 领域 scaffold / 自检 | fork 母模板规则后长期漂移；不应把业务事实写进自身 |
| 领域派生项目 | 填入业务事实：业务需求、真实工具 / 数据 / 账号权限 / 部署环境、领域知识、验收用例 | 不得把业务事实回写母模板或领域模板；只有可通用改进才经提案回流 |

## 4. 同步 / 继承关系

领域模板在同步链路上有**双重身份**：

| 相对谁 | 身份 | 说明 |
|---|---|---|
| 相对母模板 | **下游**（接收方） | 领域模板通过 `scripts/sync-template.sh` 从母模板吸收通用方法论更新，与普通派生项目相同 |
| 相对领域派生项目 | **上游**（同步源） | 领域派生项目从领域模板同步方法论 + 领域标准件 |

回流因此是**两级**：领域派生项目的可通用经验 → 先回流领域模板（领域部分）；领域模板沉淀的、可跨领域的通用经验 → 再回流母模板。回流仍走 `ai/commands/submit-proposal.md` / `submit-feedback.md`（跨仓库开 issue，免 fork）。

> **当前脚本能力边界（重要）**：`scripts/sync-template.sh` 与 `scripts/check-derived-sync.sh` 按「模板侧 ↔ 派生侧」**两端**校验。自 v1.47.0 起，领域模板作为母模板下游 sync 时可用 `sync-template.* --domain-template`（或仓库存在领域版 `TEMPLATE-BASE.md` 时自动启用）保留领域模板自身 `VERSION`/`CHANGELOG`，并维护领域版 `TEMPLATE-BASE.md`（见 §5）。**多级同步自动化（领域模板作为领域派生项目上游的中间同步节点链路）仍属 inheritance 提案 Batch 3，尚未落地**；在它落地前，领域模板的上下游同步沿用两端流程，不引入多级自动化。

## 5. `TEMPLATE-BASE.md` 约定

领域模板应在仓库根维护一个 `TEMPLATE-BASE.md` 溯源文件，至少记录：

- 继承自哪个母模板（仓库名 + 远端）。
- 继承时的母模板 base version（对应母模板 `VERSION`）。
- 本领域模板叠加的标准件范围。

> **状态：机制已落地（v1.47.0，C-004）**。普通派生项目由 `scripts/new-project.sh` / `scripts/sync-template.* --preserve-project-version` 生成**精简版** `TEMPLATE-BASE.md`（`Lineage type: ordinary derived project`，只记母模板继承版本）；领域模板由 `scripts/sync-template.* --domain-template` 生成 / 维护**领域版** `TEMPLATE-BASE.md`（`Lineage type: domain template`，额外记 `Domain standards scope` 领域标准件范围；首次生成留 TODO 占位由维护者填，后续 sync 保留）。`check-derived-sync.*` 按 `Lineage type` 识别角色，领域版额外校验 `Domain standards scope`。两条线互不混用：不得把普通派生精简版套用到领域模板，反之亦然；`--preserve-project-version` 与 `--domain-template` 互斥。

## 6. 操作入口（怎么创建领域模板）

创建领域模板的**操作步骤**见 `template-docs/scenario-guides.md` **A20「领域模板派生」**（含：判定是否为领域模板、内置 vs 独立仓、Phase 0 预检、创建命令、初始化待办）。本文件只讲方法论定位，不复制 A20 的操作步骤。

AI 可执行实验入口为 `/run domain-template-lab`（见 `ai/commands/domain-template-lab.md` 与 `ai/prompts/maintainers/23-domain-template-lab.md`）。该入口只服务领域模板独立试验线：AI 自动判定当前仓库是母模板、派生领域模板、领域派生项目还是普通派生项目，先输出计划和写入范围，用户确认后才在目标领域模板仓库生成实验资产。

边界：`domain-template-lab` 不接入 `git-guide.md` §5 的普通派生项目同步主路径，不修改母模板 `sync-template` 语义，不让领域派生项目直接同步母模板。母模板只提供实验启动器和方法论边界；领域 scaffold、领域同步清单、领域自检和领域回流 SOP 应在独立领域模板仓库内试验。

## 7. 状态与演进

本文件对应 inheritance 提案的落地节奏：

| Batch | 内容 | 状态 |
|---|---|---|
| Batch 1 | 三层继承机制设计 + **方法论文档化（本文件）** | ✅ 本文件落地；机制产物待后续 |
| Batch 2 | 创建独立 `agent-system-template` 仓库 + 领域 scaffold MVP + `TEMPLATE-BASE.md` | 待办 |
| Batch 3 | 领域模板自检、同步链路、多级同步自动化评估 | 部分落地：版本保留机制（C-004）已于 v1.47.0 落地——`sync-template.* --domain-template` 保留领域模板 `VERSION`/`CHANGELOG` 并维护领域版 `TEMPLATE-BASE.md`，`check-derived-sync.*` 识别领域角色；母模板已提供 `domain-template-lab` AI 实验入口；多级同步自动化与具体领域资产仍待独立仓库试验 |
| Batch 4 | `new-project --profile <domain>` / 领域模板发布回流 SOP | 待办（需至少一个真实项目试用后再评估） |

领域模板层在至少一个真实项目试用、Batch 2-3 落地成熟后，再评估是否提升主线地位（如写进 `template-methodology.md` §5）。当前以本可选增强文档为准。
