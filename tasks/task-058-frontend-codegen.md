# task-058：前端 codegen openapi-typescript（CQ-P1-006 后续 / Slice A 试点）

> 维护态批26 / Sprint-51 / CQ-P1-006 后续 / governance rollout §4 轨道3 P1（前端 codegen）。
> 状态：**Slice B-3 账户空间域完成（2026-08-13，PR #168 / v3.8.26）；Slice B-4 待续**。
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

## Slice B（全量 · 分批推进）

- **B-1 内容域（已完成，批27 / PR #166 / v3.8.24）**：folders / docLinks / timeline / search（含 rag 域 RagSource/QueryResponse）。
- **B-2 术语导入域（已完成，批28 / PR #167 / v3.8.25）**：terms / termCategories / quickEntry / aiPolish / imports / exports（**范围修正**：原计划 7 域中 rag 已随 B-1 完成）。逐文件：terms（TermStatus alias 生成 enum + Term=Omit<TermDetail,'status'> narrow + TermWritePayload=TermWriteRequest 零差异 alias + TermListResponse 手写保留）；termCategories（View/Detail/ListPage 零差异 alias + 请求体手写）；quickEntry（QuickEntryView status narrow）；aiPolish（PolishView status narrow + PolishSource alias）；imports（ImportResponse=ImportFileView 命名错位 + ImportBatchItem status narrow（import_id 等对齐必填）+ ImportBatchResponse 嵌套 narrow + failedBatchFromSlice 补 3 个必填 null + File/FormData payload 手写）；exports（PdfExportResponse status narrow + artifact_path 对齐必填）。验证：lint 0 + build 350 modules 0 error + 浏览器 smoke（`.tmp/sliceB2-codegen-smoke.mjs`：术语树/详情 pending 分支 + 快速录入 converted 分支 + AI 润色面板）PASS；CI 9 job 全绿。
- **B-3 账户空间域（已完成，批29 / PR #168 / v3.8.26）**：auth / spaces / spaceMembers / admin（**范围修正**：config 域已随 B-1 search.ts、users 域本在 spaceMembers.ts）。逐文件：auth（LoginResponse=Omit<LoginView,'current_space_id'|'role'> narrow——后端 `number|null`/裸 string → 前端 number/union，运行时哨兵=注册即建个人空间；RegisterResponse email narrow；SessionInfo/PasswordResetMessageView 零差异 alias）；spaces（Space=SpaceView / SwitchSpaceView 零差异 alias）；spaceMembers（SpaceMemberView role narrow + UserSearchResult=UserSearchView 命名错位 alias）；admin（AdminUserView role/status narrow + AdminUserSpaceView role narrow 命名错位 + AdminUserSpaceAvailable alias + AdminUserSpacesResult 嵌套 narrow）。验证：lint 0 + build 350 modules 0 error（bundle 逐字节不变）+ 浏览器 smoke（登录/空间切换/成员表/用户管理/用户空间抽屉）PASS；CI 9 job 全绿。
- **B-4 documents（待续·最高风险单独 plan）**：`KnowledgeDocument = DocumentSummary|DocumentDetail` union + narrowing + useDocuments/useDocumentSideData state 重构（content_md 运行时哨兵）；批末 CI drift 门升 required + 浏览器 smoke 系统性跑。

## 完成记录

- **编码**：`frontend/package.json`（+ openapi-typescript@^7.13.0 devDep + gen:api script）+ `frontend/src/api/generated.ts`（新生成入库）+ `frontend/src/api/tags.ts`（混合接入试点）+ `.github/workflows/project-check.yml`（+ frontend-schema-diff job advisory）。
- **验证**：gen 幂等 drift exit 0 + lint 0 + build 350 modules 0 error + tags 消费方零回归；浏览器 smoke 留 Slice B。
- **收尾**：PR merge 后回写 `docs/05 §4.2.3` + `project-rules §1` 批26 + `docs/08/09` + rollout §4 + bump（PATCH）。
- **Slice B-2 收尾（批28）**：PR #167 squash merge main `397382f`；回写 docs/08 Sprint-53 + docs/09 TC-P2-GOV-018 + project-rules §1 批28 + 本文件；bump v3.8.25。
- **Slice B-3 收尾（批29）**：PR #168 squash merge main `90d06d5`；回写 docs/08 Sprint-54 + docs/09 TC-P2-GOV-019 + project-rules §1 批29 + 本文件；bump v3.8.26。
