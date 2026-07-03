# Global Rules（跨项目通用规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 本文件对所有基于本模板创建的项目逐字复用，不针对具体项目修改。
> 如需调整通用原则，先改本模板仓库的本文件，再覆盖同步到各项目（见README）。
>
> **全局规则版本：v1.8（2026-06-26）**。本文件仅记录跨项目通用规则自身版本；
> 整个模板版本以根目录 `VERSION` 为准，并在 `CHANGELOG.md` 登记。

## 1. AI编程总体原则

1. **文档驱动开发**：开发顺序固定为
   `Scenario → 用户需求 → SRS → PRD → 架构 → 技术方案 → 数据库设计 → API设计 → 开发计划 → 代码`。
   其中"数据库设计 / API设计"仅当本项目涉及持久化 / 对外接口时才经此环节；无则按 `ai/project-rules.md` §3 跳过 `docs/06`、`docs/07`。
   文档生成、追溯链、变更传播和多入口裁剪细则见 `ai/document-lifecycle-rules.md`。
   禁止直接从想法生成代码。
2. **小步快跑**：一个功能 = 一个任务 = 一次提交。禁止一次实现整个系统。
3. **先设计后实现**：任何模块开发前必须先有设计说明，再允许生成代码。
4. **AI不可自主扩展需求**：AI只能实现 `docs/` 中已定义的功能，不得自主新增功能，
   不得"顺手"优化未被要求的部分。

## 2. AI代码生成规范

| 阶段 | 要求 |
|---|---|
| 生成前 | 必须先阅读 `ai/index.md` 列出的全部规则文件，及相关 `docs/` 文档 |
| 生成时 | 必须先用文字说明实现方案，再输出代码 |
| 生成后 | 必须列出新增/修改的文件清单，并说明如何验证 |

## 3. AI任务体系

- 所有开发通过任务单进行；一个任务单对应一个功能模块；禁止一个任务单实现整个系统。
- Phase1阶段不强制使用 `tasks/` 独立文件，`docs/08-dev-plan.md` 中每个Sprint按以下
  结构书写即可：

```markdown
## Sprint-X：功能名

### 目标
（这个任务要实现什么）

### 输入文档
（需要参考哪些 docs/ 文件的哪些章节）

### 修改范围
（预计新增/修改哪些文件，限制在1~3个文件/模块）

### 验收标准
（如何判断这个任务完成）

### 禁止事项
（明确不允许做的事，例如不允许引入新依赖、不允许改动其他模块）
```

  当某个Sprint复杂到需要拆成多个独立任务时，将对应内容原样复制为
  `tasks/task-00X-xxx.md`，格式不变。

## 4. AI审查体系

审查维度：

```text
需求审查   —— 是否符合PRD
架构审查   —— 是否符合架构设计
技术审查   —— 是否符合技术方案
数据库审查 —— 是否符合DB设计
API审查    —— 是否符合API设计
边界审查   —— 是否超出当前Phase范围
```

统一输出格式：

```text
1. 合规项
2. 问题项
3. 风险项
4. 修复建议
```

## 5. 通用目录标准

```text
ProjectName/
├─ docs/        # 项目事实：需求、设计、计划
├─ ai/          # AI行为规范（本目录）
├─ tasks/       # AI任务单（按需启用）
├─ frontend/ backend/ tests/ scripts/ docker/   # 按项目技术栈与演示形态创建，不必全有
├─ AGENTS.md / CLAUDE.md / .cursor/rules/project-rules.mdc
├─ README.md
└─ .gitignore
```

`docs/` 核心文档固定编号 `00-09`，编号本身不因项目而变；其中 `00-05`、`08`、`09` 对所有项目必备，
`06-db-design`、`07-api-spec` 按项目形态决定（无持久化 / 无对外接口的项目可省略，
并在 `ai/project-rules.md` §3 声明）。`docs/` 根目录只放 `README.md` 与 `00-09` 核心文档；
额外项目文档必须按 `docs/README.md` 放入 `vision/`、`inputs/`、`design/`、`decisions/`、`research/`、`env/`、`meetings/`、`archive/` 等子目录，
不占用、不挪动 `00-09` 编号，禁止把新增文档直接堆到 `docs/` 根目录。

`frontend/` 是否启用取决于 `ai/project-rules.md` §3 的「演示形态」决策：消息通道内交互、CLI 或不需演示通常不启用；独立 Web 页面或移动端通常启用，并在 `docs/04-architecture.md`、`docs/05-tech-spec.md` 体现前端设计。根 `README.md` 是项目件，用于说明具体项目，不纳入下行同步清单，各项目自行维护。

两类常见的语义命名约定：
- **产品愿景/叙事类源文档**：放 `docs/vision/product-vision.md`，头部带“产品愿景叙事·不直接驱动
  开发”定位声明；它是工程文档的**输入**，与 00-09 物理分离。生成或补齐文档体系时先用
  `ai/prompts/docs/01-review-inputs.md` 评审输入，再用 `ai/prompts/docs/00-generate-or-complete-docs.md`，
  并按 `ai/document-lifecycle-rules.md` 判断入口模式与文档剖面。
- **子系统详细设计**：非平凡子系统用 `docs/design/<子系统>.md`，一个子系统一份，不编号；
  与 04（总体）/ 06-07（数据·接口）互补，承载子系统内部逻辑。

AI 判断需要新增项目文档时，必须先阅读 `docs/README.md` 的分区规则；若无法判断放入哪个子目录，先提出建议路径并等待人工确认，不得自行创建到 `docs/` 根目录。

## 6. 最佳实践流程总览

开发顺序与最佳实践流程见 §1.1（文档驱动开发）。核心要避免：`想法 → AI → 代码`——先有输入与设计文档，再生成代码。

## 7. 多AI工具协作与快捷入口

不同AI编程工具（Cursor / Claude Code / Codex 等）的入口文件
（`.cursor/rules/project-rules.mdc` / `CLAUDE.md` / `AGENTS.md`）均只指向本目录的
`index.md`；其中 `.cursor/rules/project-rules.mdc` 额外带 frontmatter（`alwaysApply: true`）
以便 Cursor 自动加载，其余入口由工具原生自动读取。切换工具会丢失"对话历史"，但不会丢失"项目规则"。

会话中断、切换工具或开启新 CLI 窗口时，按 `ai/session-rules.md` 读取 / 更新本地续接文件
（优先 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`），并结合 `git status --short --branch`
恢复上下文。任何多步骤任务、执行计划、文件修改或阻塞项，都应及时写入续接文件，避免计划只留在聊天上下文。

当用户提出“更新方法论”“文档体系审核”“同步后整理项目”“执行 Sprint”等常见操作意图时，
AI 应优先查 `ai/commands/README.md` 与对应 `ai/commands/*.md`，再读取命令路由指向的权威
Prompt / SOP / 脚本说明执行；不要要求用户手工打开 prompt 文件、复制再粘贴。

## 8. 文档演进规则（积累式）

> 设计类文档（03–09、design-\*）按「完整骨架 + 阶段增量」演进，**只增不删**。
> 框架一次铺满，细节随阶段在原位完善。

### 8.1 阶段双维度与标签（每个设计要素必带）

阶段必须同时声明两个正交维度：
- **功能范围**：`[P1]` / `[P2]` / `[愿景]`，表示做哪些 REQ，取自 `docs/03-prd.md` §3 已确认的路线图。
- **交付物形态**：`Demo` / `MVP` / `产品`，表示做到什么程度，不得与功能范围混用。
- **状态标签**：`骨架` → `P{N}-已设计` → `P{N}-已实现`。

推荐定义（项目可在 `ai/project-rules.md` 中细化）：
- **Demo**：核心价值可演示，可使用模拟器 / 原型通道 / 最简实现，但必须保留产品红线。
- **MVP**：可真实上线，包含真实通道、关键生产要素和已启用的必要能力。
- **产品**：全功能生产化，覆盖愿景完整图景与运营级要求。

`docs/vision/product-vision.md` 描述最终完整图景时，默认最终交付物为“产品”；`docs/03-prd.md` §3 的每个 Phase 必须写明“功能范围 + 交付物形态 + 进入 / 退出标准”。

**推荐：双维度总览表**。功能范围 `[P1]/[P2]/[愿景]` 是「要素级」标签（遍布 `04-09`、`docs/design/*`，可达上百次），而交付物形态 `Demo/MVP/产品` 是「阶段级」属性（仅在 `03 §3` 等少数点声明），后者易被前者淹没、读者难一眼把握演进线。建议 `docs/03-prd.md` §3 路线图**顶部**用一张总览表集中呈现双维度，列至少含：阶段 / 功能范围 / 交付物形态 / 状态 / 进入标准 / 退出标准；表下方保留各阶段 `###` 子节展开详情。这样 `Demo→MVP→产品` 演进一目了然，与全文要素级标签形成「全景 ↔ 要素」对照。Lean 剖面项目可裁剪列集；此为撰写推荐（非强制）。

### 8.2 演进方式
1. **初次生成**：按完整愿景铺出全部要素并打标签；只把 `[P1]` 及其交付物形态写细，其余留 `骨架·待细化`
2. **阶段执行**：在原位补本阶段要素的详细设计，状态推进到 `P{N}-已设计` → `已实现`
3. **升阶段**：当前阶段指针（`project-rules.md` §1）后移；在原位补新阶段要素细节，前阶段内容原封不动
4. **最终态**：愿景实现完毕时，每份文档即完整系统设计

### 8.3 禁止
- 不得为不同阶段建独立文档（如 `06-db-p1.md`），一切在原文件原位演进
- 不得删除既有阶段内容、只保留当前阶段
- 不得把 `[P2]` / `[愿景]` 要素的详细设计提前写死
- 不得把 Demo 声称为 MVP / 产品；不得把候选、预留或默认关闭的技术写成已使用
- 需求层（00-02）跨阶段稳定；阶段调整只动 03 §3 与 `project-rules.md` §1 指针

## 9. 模板优化反馈

`ai/global-rules.md` 是模板复用件，派生项目不得直接修改后长期保留；通用规则调整必须回到 `ai-project-template` 模板仓库走 PR，避免版本漂移、无法审计。

每次任务收尾时，AI 应顺带审视本次工作是否暴露出可通用于多个项目的模板优化点（如规则不清、决策前置不足、文档骨架缺口、脚本流程别扭）。任何需要修改项目模板的工作，都必须先形成 `TEMPLATE-UPGRADE-*.md` 提案（去项目化：动机 / 拟改 / 版本 / 影响），可附 `TEMPLATE-UPGRADE-*-patch.md` 记录具体 old→new 修改建议；成熟后回流到模板仓库 `_proposals/` 收件箱，由模板仓库 PR 落地。模板改动合并并下行同步后，已处理提案必须移动到 `_archive/proposals/` 归档或在派生项目历史中留痕。

在模板仓库内，模板维护者 AI 处理 `_proposals/` 时必须先读取全部 `TEMPLATE-UPGRADE-*.md` 与可选 `*-patch.md`，输出去重 / 冲突 / 依赖分析和合并或分阶段优化计划，再辅助修改 `ai/global-rules.md`、`INIT-PROMPT.md`、`ai/prompts/`、脚本和治理文档；所有实际改动仍需人工审查并通过 PR 合并。

**回流来源标识**：派生项目回流到模板仓库的提案 / 反馈（`TEMPLATE-UPGRADE-*.md`、issue、PR），必须在头部标明来源派生：`> 来源：<派生项目名>（<owner>/<repo>）派生项目回流`。来源是「出处元数据」（公开仓库引用），不属于去项目化禁止的客户 / 账号 / 路径 / 业务细节。模板自产提案标「模板维护者」。这让维护者处理 `_proposals/` / issue 时一眼知出处，不与「别的会话 / 模板自产」混淆。派生项目提交提案 / 反馈的流程见 `ai/commands/submit-proposal.md`、`ai/commands/submit-feedback.md`（跨仓库开 issue，免 fork）。
