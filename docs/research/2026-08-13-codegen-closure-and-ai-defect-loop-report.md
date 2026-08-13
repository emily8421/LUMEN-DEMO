# 前端 codegen 全量闭环与 AI 缺陷记录机制验证报告（维护态批 26-30 · 2026-08-13）

> 类型：阶段研究报告（过程记录 + 方法论沉淀）。本文不新增需求 / 接口 / 验收目标；项目事实以 `docs/08-dev-plan.md` / `docs/09-verification.md` / Git 历史为准。
> 范围：维护态批 26-30（Sprint-51~55，2026-08-13，v3.8.23 → v3.8.27）。
> 关联：`tasks/task-058-frontend-codegen.md`（实施口径）；`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3（治理来源）；模板 issue [#350](https://github.com/emily8421/ai-project-template/issues/350)（机制回流）。

## 1. 背景与目标

两个同日完成、相互验证的工作线：

1. **前端 codegen 全量接入**（CQ-P1-006 后续，轨道3 P1）：后端 v3.8.13 已全量 `response_model` + OpenAPI 快照 + CI `schema-diff` required；前端 17 个 `api/*.ts` 手工双写 snake_case 响应类型。目标：`openapi-typescript` 生成类型替代手写双写，后端契约变更 → 前端类型自动同步 + CI 拦截。
2. **AI 生成代码缺陷记录机制**（用户发起）：维护期发现大量 AI 生成代码的存量问题（「看似可行、实靠巧合运行」），需要「发现 → 记录 → 归纳 → 回流规范」的闭环机制。机制本身（pitfall log，模板 v1.61.1）已存在，本日完成首轮完整实践验证并回流模板提案。

两线的交汇点：codegen 接入过程本身**产出**了最有价值的缺陷样本（前端手写类型与后端契约的多处失配），样本进入 pitfall 记录，归纳成模式，驱动模板提案——一条完整的自举验证链。

## 2. 批次执行总览

| 批次 | Sprint | PR | 版本 | 范围 | 关键验证 |
|---|---|---|---|---|---|
| 批26 | Sprint-51 | #165 `1a06f8d` | v3.8.23 | Slice A 试点：openapi-typescript@^7.13.0 + tags 混合接入 + CI drift 门 advisory | gen 幂等 + lint/build 零回归；9 job 含新 job 首跑 |
| 批27 | Sprint-52 | #166 `59dea01` | v3.8.24 | Slice B-1 内容域：folders / docLinks / timeline / search（含 rag） | lint/build 零回归 |
| 批28 | Sprint-53 | #167 `397382f` | v3.8.25 | Slice B-2 术语导入域：terms / termCategories / quickEntry / aiPolish / imports / exports | + 浏览器 smoke（术语/快速录入/AI 润色） |
| 批29 | Sprint-54 | #168 `90d06d5` | v3.8.26 | Slice B-3 账户空间域：auth / spaces / spaceMembers / admin | + 浏览器 smoke（登录/空间切换/成员/用户管理）；bundle 逐字节不变 |
| 批30 | Sprint-55 | #169 `f66b00f` | v3.8.27 | Slice B-4 documents：真 union + 契约失配修正 + **drift 门升 required**（Slice B 收口） | + 浏览器 smoke 全链路（7 步）；ratchet 拦截案例 1 次 |

每批固定闭环：编码 → 本地验证 → PR → CI 9 job → squash merge → 回写（task-058 / docs/08 / docs/09 / project-rules §1 / rollout §4）→ bump 三件套直推 main。回写 + bump 合并 commit 直推（`af2f0b8` / `c1c5ec4` / `891c277` / `aff2eb9`）。

## 3. 混合接入方法论（五批迭代沉淀）

### 3.1 三类接入形态

| 形态 | 判据 | 示例 |
|---|---|---|
| **零差异 alias** | 手写与生成逐字段一致（命名错位也算：前端名 ↔ 生成 View 名） | `FolderView` / `Space=SpaceView` / `SessionInfo=SessionView` / `DocumentVersion` |
| **Omit + narrow overlay** | 主体一致，个别字段生成侧退化（裸 string）或口径偏宽（`number\|null`） | `TagView`（status）/ `Term=Omit<TermDetail,'status'>` / `LoginResponse`（current_space_id + role）/ `AdminUserView`（role+status） |
| **手写保留** | 生成无对应（分页容器 items 未 narrow / 前端专属 File-FormData / union 请求体） | `ListEnvelope<T>` / `ImportDocumentPayload` / `QuickEntryCapturePayload` |

关键判断依据（task-058 Explore 评估结论）：openapi 几乎无 enum（仅 `DocumentPermission` / `TermStatus` 两个），响应字段多裸 `string`——全量替换会让 ~12 处 union literal 退化丢编译期 narrow，故取混合策略。

### 3.2 两次范围修正（计划 vs 契约事实）

- B-2：原计划 7 域，rag 域已随 B-1 `search.ts` 完成 → 实际 6 文件。
- B-3：原计划 6 域，config 域已随 B-1、users 域本在 `spaceMembers.ts` → 实际 4 文件。

教训：分域计划基于文件直觉，域的实际归属以 API 契约落点为准——计划阶段先做一次端点 ↔ 文件映射可免修正。

### 3.3 消费方核验模式（每批主要上下文成本）

对每个 union / optionality 差异点 grep 前端消费方，确认 alias 后兼容或需 narrow。三类典型差异点：
1. **union → 裸 string**：保 narrow（消费方 `status === 'draft'` 等分支依赖编译期保护）；
2. **optionality 收紧**（`parsed_doc_id` `number→number\|null`、`artifact_path` `?→required`）：grep 确认消费方兼容后对齐后端；
3. **反向 narrow**（后端 `number\|null` → 前端 `number`）：仅当有运行时哨兵支撑（LoginResponse current_space_id：注册即建个人空间）才做，注释写明理由。

## 4. Slice B-4 documents（最高风险批）详记

### 4.1 前置全景梳理（本批方法论核心）

编码前一次 grep 定位 `KnowledgeDocument` 全部 15 个消费文件，按消费方式分类：

- **哨兵消费**（2 文件 5 处）：`useDocuments.ts:89/96/151/248` + `useDocumentSideData.ts:81`——旧实现以 `content_md === undefined` 判断「详情是否已加载」；
- **公共字段只读**（11 文件）：union 化后零改动；
- **tagDocuments 链**（3 处）：随契约失配修正改类型。

效果：plan 直接按消费方分类给出改动面，编码阶段零重复扫描、零返工（token-hotspot 阶段 C 记录为「高风险重构批标准前置」）。

### 4.2 契约事实与 union 化

后端两种形状（`backend/api/documents.py` response_model 交叉验证 generated.ts）：

- `GET /api/documents` → `DocumentSummary[]`（无 content_md，省流量）；
- 详情 / POST / PUT / PATCH folder / restore → `DocumentDetail`（content_md 必填）。

前端旧手写把两者压平为 `content_md?: string`，用**字段存在性当运行时哨兵**——隐式协议，契约不可见。B-4 改为真 union + 显式守卫：

```ts
export type KnowledgeDocument = DocumentSummaryView | DocumentDetailView;
export function isDocumentDetail(document: KnowledgeDocument): document is DocumentDetailView {
  return 'content_md' in document;
}
```

5 处哨兵同步改写，2 处冗余 `??` 删除（Detail 必有 content_md），effect deps 数组以 narrow 布尔替换字段访问。

### 4.3 顺手修正的契约失配（既有「类型撒谎」）

`listDocumentsByTag` 手写声明返回完整 `KnowledgeDocument[]`，后端实际返回瘦身 `DocumentTagItemView[]`（少 space_id / folder_id / type / current_version，多 updated_at）——运行时字段少于声明，「碰巧没炸」（TagsFeature 只用 id / title / permission）。修正为 `TaggedDocumentItem` narrow + 类型链 3 处。

### 4.4 CI 拦截案例（机制有效性实证）

- **ratchet 拦截**：B-4 首推 PR 的 project-check 被 file-size ratchet 拦下（`useDocuments.ts` 286→287 行，登记基线只进不退；新增 import 行导致）——import 项合并同行修正复绿。教训：涉及登记基线文件的改动，本地验证包须加 `npm run check:frontend-file-size`。
- **drift 门升 required 首跑通过**：`frontend-schema-diff` 删 `continue-on-error`，后端契约与前端生成类型不同步将直接拦合并。

## 5. AI 缺陷记录机制闭环（用户发起 → 模板回流）

### 5.1 用户诉求与机制评估

用户提出：AI 生成代码在维护中暴露大量问题，需要「记录 → 归纳 → 给出生成代码规范约束 → 逐步验证完善」的机制。评估结论：模板 pitfall log（`ai/session-rules.md` §4.3）已覆盖记录 / rollup / 回流三段，**缺口在触发口径**——§4.3 写的是「**本次**是否产生坑观察」（会话视角），「维护中发现的存量 AI 代码问题」无显式引导；且此类问题的典型形态是「障眼法」：看似可行、功能演示通过，实际靠巧合运行。

### 5.2 三样本（codegen / mypy / eslint 交叉印证）

| 模式 | 样本 | 机理 | 机器化规避 |
|---|---|---|---|
| 类型契约「障眼法」 | 前端手写类型 3 处失配（形状压平哨兵 / 瘦身 shape 谎称完整 / optionality 不一致） | 按想象写类型，tsc 只保证内部自洽 | openapi codegen + drift 门 required |
| 隐式非空假设 | `current_space_id` `int\|None` → service(int)，45 处传播缺口 + ~20 真 bug（批14 mypy 发现，补录） | 按当前调用链巧合写类型 | mypy required + 契约收紧源头 |
| 框架语义违反 | `useRef/useEffect` 在 early return 后（批13 eslint 发现，补录） | tsc 语法合法，hooks 顺序靠运行时偶然 | eslint react-hooks error 级 |

共性根因：**生成时的验证手段（tsc / 演示通过）不覆盖缺陷维度**——「能跑」≠「契约 / 语义正确」；规避方向是「与缺陷维度匹配的机器检查」。

### 5.3 闭环链路（本日走通）

```
发现（B-4 梳理 + 历史批次审计背书）
  → 记录（.ai/pitfalls/ 3 条：1 当场 + 2 补录，标注根因 / 可通用性 / 流转去向）
  → 归纳（ai-records/pitfalls/SUMMARY.md 首次 rollup：三模式 + 共性根因）
  → 回流（_proposals/TEMPLATE-UPGRADE-pitfall-legacy-code-trigger.md
         → PR #170 入库 → 模板仓 issue #350，labels proposal + from:LUMEN_demo_T2.1）
  → 待验证（§4.3 口径扩展采纳后，后续批次复核记录习惯是否稳定触发）
```

配套：token-hotspot SUMMARY 追加阶段 C（B-2..B-4 成本热点，与 pitfall「质量坑」正交的「成本坑」线同样完成 rollup）；本地 6 份新记录补标「已纳入 SUMMARY」。

## 6. 量化小结

- 接入 17 域（tags + 内容域 4 + 术语导入域 6 + 账户空间域 4 + documents），18 个 api 文件全部对齐生成类型（`client.ts` / `generated.ts` 本身除外）。
- 5 个功能 PR（#165-#169）+ 4 个回写 bump commit；CI 全绿（9 job × 5 PR + main 10 run）。
- 类型定义行数净减（alias 替代手写）：B-1 +45/-74、B-2 +52/-90、B-3 +50/-56、B-4 +73/-54。
- bundle 前后几乎不变（350 modules，JS 437.15→437.15 kB，CSS 65.60 kB）——全程纯类型层 + 1 处 null 字段补齐。
- 机制产出：pitfall 3 样本 + 2 SUMMARY rollup + 模板 issue #350 + hotspot 阶段 C 结论。

## 7. 经验与教训（跨批通用）

**有效模式（后续沿用）**：
1. 高风险重构批前置「消费方全景 grep → plan 按消费方分类」（B-4 验证零返工）；
2. generated.ts schema 先 grep offset 再批量读（B-3 起，定位成本 ~300 行/批）；
3. `session-rules §3.2` 同会话规则复用（B-3 验证规则加载成本归零）；
4. 浏览器 smoke fixture 自建自清 + CDP 模式复用（sliceD→B-2/B-3/B-4 三次迭代稳定）。

**待改进**：
1. 涉及登记基线文件（useAppState / useDocuments）的改动，本地验证包加 `check:file-size`（B-4 CI 一次往返）；
2. UI smoke 编写前先读目标组件渲染条件（模式切换 / handler 挂载点 / Markdown 解析后文本），B-4 四轮调试中两轮可免；
3. 分域计划前先做端点 ↔ 前端文件映射（两次范围修正的根因）。

## 8. 追溯索引

- 实施口径：`tasks/task-058-frontend-codegen.md`（含 Slice A / B-1..B-4 逐批记录）
- 验收：`docs/09-verification.md` TC-P2-GOV-016~020；`docs/08-dev-plan.md` Sprint-51~55
- 机制材料：`ai-records/pitfalls/SUMMARY.md`、`ai-records/token-hotspots/SUMMARY.md` §7、`.ai/pitfalls/2026-08-13-ai-*.md` ×3
- 模板回流：`_proposals/TEMPLATE-UPGRADE-pitfall-legacy-code-trigger.md` → emily8421/ai-project-template#350
- Git 锚点：v3.8.23（`1a06f8d`）→ v3.8.27（`f66b00f` 功能 / `aff2eb9` 回写）→ `f41b3d2`（记录收口 PR #170）
