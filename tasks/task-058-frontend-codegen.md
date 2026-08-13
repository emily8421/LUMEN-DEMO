# task-058：前端 codegen openapi-typescript（CQ-P1-006 后续 / Slice A 试点）

> 维护态批26 / Sprint-51 / CQ-P1-006 后续 / governance rollout §4 轨道3 P1（前端 codegen）。
> 状态：**Slice A 试点（2026-08-13）**。
> 依据：task-048 后续候选；`docs/05-tech-spec.md §4.2.3`；`docs/research/2026-08-10-code-governance-rollout-plan.md §4` 轨道3。

## 背景 / 目标

后端 v3.8.13（task-048）已全量 `response_model=ApiEnvelope[X]` + OpenAPI 快照 `openapi/openapi.json` + CI `schema-diff` required；前端 17 个 `api/*.ts` 手工双写 snake_case 响应类型。目标：`openapi-typescript` 从 `openapi/openapi.json` 生成 `frontend/src/api/generated.ts`，前端响应类型对齐生成类型，消除手工双写（后端改契约 → 前端类型自动同步 + tsc 报错）。

**关键利好**：前端类型已 snake_case（与后端 Pydantic 一致），零命名转换冲突；`client.ts` `request<T>` 不变，只是 `T` 来源切换。

**Explore 评估揭示 → 混合接入策略（非全量替换）**：
- openapi 几乎无 enum（仅 `DocumentPermission` / `TermStatus`），响应字段多裸 `string` → ~12 处手写 union 直接 alias 会退化为 `string`、丢编译期 narrow。
- documents 是拦路虎（`KnowledgeDocument` = `DocumentSummary`|`DocumentDetail` 合并 + `useDocuments` 把 `content_md===undefined` 当运行时哨兵）→ Slice B 单独最高风险批。
- 前端专属类型（`imports` 的 File/FormData payload、`search` 的 `QueryKnowledgeBaseOptions`）无 openapi 对应 → 保留手写。

## Slice A（试点 · 本次）

- **装依赖**：`openapi-typescript@^7.13.0`（devDep）+ `gen:api` script（`openapi-typescript ../openapi/openapi.json -o src/api/generated.ts`，避开 `--immutable`——v7 有 `readonly interface` 无效 TS 已知 bug，issue #1368）。
- **生成 + 入库**：`generated.ts` 入库；`api.ts` barrel 不 re-export（generated 是内部类型源）。
- **CI drift 门**：`frontend-schema-diff` job（advisory，复用 `frontend-lint` node setup + `schema-diff` 的 `git diff --exit-code` 模式）；Slice B 全量后升 required。
- **tags.ts 混合接入试点**：
  - `TagView = Omit<components['schemas']['TagView'], 'status'> & { status: TagStatus }`（主体 alias + union narrow，后端加字段自动同步 + status 保 narrow）。
  - `DocumentTagView` / `TagLinkView` 与生成类型零差异 → 直接 alias。
  - `ListEnvelope<T>` 保留手写（生成 `TagListPage.items` 是未 narrow 的 TagView，不匹配 narrow 元素）。
  - 请求体 payload（createTag/updateTag）保留手写。

## 验证包

- `npm run gen:api` 幂等（`git diff --exit-code -- frontend/src/api/generated.ts` 绿）✓
- `npm run lint` 0 problem ✓
- `npm run build` 0 error（**350 modules** 零回归，CSS 65.60 kB / JS 437.15 kB 不变）✓
- tags 消费方 tsc 零回归（build 含 `tsc -b`）✓
- 浏览器 smoke：**留 Slice B**（tags.ts 纯类型改动 + build 强保证，风险低；Slice B 全量接入 16 域时系统性跑）
- CI `frontend-schema-diff` advisory（PR 上验证）

## Slice B（全量 · 待续）

其余 16 域按 task-048 B-1/B-2/B-3 分组（内容域 / 术语导入域 / 账户空间域）批量接入；**documents 单独最高风险批**（`KnowledgeDocument = Summary|Detail` union + narrowing + `useDocuments`/`useDocumentSideData` state 重构）；CI drift 门升 required。

## 完成记录

- **编码**：`frontend/package.json`（+ openapi-typescript@^7.13.0 devDep + gen:api script）+ `frontend/src/api/generated.ts`（新生成入库）+ `frontend/src/api/tags.ts`（混合接入试点）+ `.github/workflows/project-check.yml`（+ frontend-schema-diff job advisory）。
- **验证**：gen 幂等 drift exit 0 + lint 0 + build 350 modules 0 error + tags 消费方零回归；浏览器 smoke 留 Slice B。
- **收尾**：PR merge 后回写 `docs/05 §4.2.3` + `project-rules §1` 批26 + `docs/08/09` + rollout §4 + bump（PATCH）。
