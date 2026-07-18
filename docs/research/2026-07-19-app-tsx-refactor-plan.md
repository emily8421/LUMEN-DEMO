# App.tsx 整体拆分计划（APP-SIZE-C-011）

> 类型：前端结构重构计划（未执行）
> 日期：2026-07-19
> 状态：**计划·待执行**（已用户确认分批 commit + 务实减压口径）
> 关联：APP-SIZE-C-011（`ai/project-rules.md` 文件膨胀阈值 App.* 300）
> 追溯：Phase2A 前端结构维护；非 REQ 驱动，不新增功能

## 1. 背景

`frontend/src/App.tsx` 已膨胀到 **741 行**（25 个 `useState`、19 个 handler），远超 `App.* 300` 阈值。业务逻辑、状态、跨域 orchestration 全堆在主组件，导致：

- 单文件认知负担高，跑飞 / 失忆风险随上下文增大；
- 新功能（如 REQ-025 快速录入）只能勉强「胶水」式接入，难以继续扩张；
- 既有 `useTags` / `useQuickEntry` 两个域 hook 已验证「业务抽 hook」范式可行，剩余业务域未跟进。

本计划把 App.tsx 剩余业务域全部抽成 hook，让主组件只做**组合 + orchestration + render**。

## 2. 决策口径（用户确认）

- **分批 commit**：按域逐个抽，每批 `npm run build` 验证，易回滚、低风险。
- **务实减压**：业务全抽 hook 后 App.tsx 落在 **300–400 行**可接受；不为凑 300 行强拆 render（props 传参天然占行）。

## 3. 现状与耦合点（事实，来自代码探查）

- **最复杂 feature**：`DocumentsFeature`（21 props：15 文档相关 + 6 已 hook-fed 标签）、`ContextPane`（19 props，跨 documents / import / terms 三域）。
- **最简单 feature**：Search(6) / Query(6) / Terms(7) props，自包含，仅依赖 `onOpenDocument`。
- **`runAction`**（App.tsx 530-549）：cross-cutting，依赖 `setIsBusy/setError/setNotice` + auth reset（`clearStoredSession/setSession`），被所有域 handler 与 useTags / useQuickEntry 使用 → **必须留在域 hook 之上**。
- **`refreshWorkspace`**（228-250）：一次性拉 spaces + documents + terms 并 set 多域 state + selectedId / isCreating 重置 → **跨域 orchestration**。
- **`handleOpenDocument`**（502-528）：跨 view state（activeView / isCreating）+ documents（selectedId / loadDocumentDetail / loadVersions）。
- **helpers 全在 App.tsx module scope**：`emptyDraft/emptyTermDraft/emptyImportDraft/loadStoredSession/persistSession/clearStoredSession/isAuthTokenError`（50-111）+ `normalizeDraft/normalizeTermDraft/termToDraft`（715-739）。
- **既有 hook 范式**（`useTags.ts` / `useQuickEntry.ts`）：接收 `{token, currentSpaceId, runAction, setNotice}` + 跨域回调（`onDocumentsChanged`），自管 effect，返回 state + handler bundle 供 render 直接消费。

## 4. 目标架构

8 个域 hook（新增 6 + 既有 useTags / useQuickEntry）+ App 作 orchestrator：

| Hook | 拥有 state | 关键 handler | 依赖 |
|---|---|---|---|
| `useWorkspace` | activeView, notice, isBusy, error | **runAction**（接收 onAuthError） | onAuthError |
| `useSession` | username, session, spaces | handleLogin, handleSpaceChange, reloadSpaces, handleAuthError | runAction, setNotice |
| `useDocuments` | documents, selectedId, versions, outboundLinks, backlinks, draft, isCreating | 文档 CRUD, loadVersions/loadDocLinks/loadDocumentDetail, **reloadDocuments**, **handleOpenDocument** | token, runAction, setNotice, onAuthError, setActiveView |
| `useSearch` | searchQuery, searchResult | handleSearch | token, runAction |
| `useQuery` | question, queryResult | handleQuery | token, runAction |
| `useTerms` | terms, selectedTermId, termDraft | handleSaveTerm, handleDeleteTerm, selectTerm, newTerm, reloadTerms | token, runAction, setNotice |
| `useImport` | importDraft, importFiles, importInputKey, lastImportSummary, lastImportItems | handleImport | token, runAction, refreshWorkspace |
| `useTags`(既有) / `useQuickEntry`(既有) | — | — | — |

### 4.1 跨域处理（核心设计）

1. **`runAction`** → `useWorkspace`，接收 `onAuthError`（由 `useSession.handleAuthError` 提供：`clearStoredSession` + `setSession(null)`）。所有域 hook 接收 `workspace.runAction`。
2. **`refreshWorkspace`** → 留 **App 级 orchestrator**：`Promise.all([session.reloadSpaces(), documents.reloadDocuments(), terms.reloadTerms()])`。各域 hook 暴露 `reloadX()` 自管自己的 state + selectedId / isCreating 重置。session effect、handleSpaceChange、useImport、useQuickEntry.onDocumentsChanged 均调 App.refreshWorkspace。
3. **`handleOpenDocument`** → 放 `useDocuments`，接收 `setActiveView`（来自 workspace）。
4. **helpers 迁移** → 新建 `frontend/src/app/session-store.ts`（loadStoredSession / persistSession / clearStoredSession / isAuthTokenError / SESSION_STORAGE_KEY）+ `frontend/src/app/drafts.ts`（emptyDraft / emptyTermDraft / emptyImportDraft / normalizeDraft / normalizeTermDraft / termToDraft）。App.tsx 与各 hook import。

### 4.2 App.tsx 最终职责（~300–400 行）

- 组合 8 个 hook（顺序：session → workspace(onAuthError) → documents / search / query / terms / import / tags / quickEntry）
- `refreshWorkspace` orchestrator + session effect
- render（TopBar + login-panel + workspace-layout[WorkspaceViewNav + ContextPane + workspace-main + QuickEntryFeature] + StatusBar）—— render 不强拆（传参天然占行）

## 5. 分批 commit 计划

每批后 `npm run build`（tsc -b + vite）；Commit 4 后加浏览器全业务 smoke。

### Commit 1：useSearch + useQuery（最低风险，独立）
- 新增 `app/useSearch.ts`、`app/useQuery.ts`（各 ~25 行，参照 useTags 范式）
- App.tsx：移除 searchQuery / searchResult / question / queryResult state + handleSearch / handleQuery，改用 hook
- 减 ~30 行；build 验证

### Commit 2：useTerms
- 新增 `app/useTerms.ts`（terms / selectedTermId / termDraft + handleSaveTerm / handleDeleteTerm / **selectTerm / newTerm** + reloadTerms）
- 消除 ContextPane 与 TermsFeature 重复的 `onSelectTerm` / `onNewTerm` 内联闭包
- 减 ~50 行；build 验证

### Commit 3：useImport
- 新增 `app/useImport.ts`（5 个 import state + handleImport，依赖 refreshWorkspace）
- 减 ~40 行；build 验证

### Commit 4：核心 — useWorkspace + useSession + useDocuments + helpers 迁移
- 新增 `app/session-store.ts`、`app/drafts.ts`（helpers 迁出）
- 新增 `app/useWorkspace.ts`（runAction + 全局 UI state）
- 新增 `app/useSession.ts`（login / spaceChange / reloadSpaces / handleAuthError）
- 新增 `app/useDocuments.ts`（文档域全 state + CRUD + selectedDocument effect + handleOpenDocument + reloadDocuments）
- App.tsx：refreshWorkspace orchestrator + session effect + render，落到 ~300–400 行
- build + **浏览器 smoke（全业务回归）**

## 6. 关键文件

- 修改：`frontend/src/App.tsx`（主减压目标）
- 新增 hook：`frontend/src/app/{useSearch,useQuery,useTerms,useImport,useWorkspace,useSession,useDocuments}.ts`
- 新增 helpers：`frontend/src/app/{session-store,drafts}.ts`
- 复用范式：`frontend/src/app/useTags.ts`、`useQuickEntry.ts`
- 类型：`frontend/src/app/types.ts`（Session / Draft / TermDraft / ImportDraft 已存在）
- 不改：所有 `features/*` 组件、`api/*`、后端、CSS（纯 App 层重构，props 契约不变）

## 7. 验证

1. **每批**：`cd frontend && npm run build`（tsc -b + vite build 必须通过，类型错误即卡住）
2. **Commit 4 后浏览器 smoke**（全业务回归）：起 lumen-pg + uvicorn:18000 + vite:5173，登录 alice → 文档新建 / 编辑 / 保存 / 删除 / 版本恢复 / 下载、搜索、问答、术语新建 / 删除、标签视图 / 打标签、导入、快速录入 draft / create / append / discard、空间切换、刷新不掉线（Sprint-12①）
3. 行数核对：`wc -l frontend/src/App.tsx` 确认减压到 300–400 区间

## 8. 风险与对策

- **Commit 4 最复杂**（refreshWorkspace orchestration + runAction auth reset + selectedDocument effect 迁移）→ 单独一批，build + 全 smoke，出问题只回滚这一批。
- **handleOpenDocument 跨域**（view + documents）→ 放 useDocuments + 注入 setActiveView，保持行为不变。
- **ContextPane 19 props 跨 3 域** → 不拆组件，App render 从各域 hook bundle 取值传入（props 契约不变）。
- **行为不变性**：纯重构，不改 API / UI / 业务逻辑；每批 build 兜底类型，最后 smoke 兜底行为。

## 9. 后续

- 执行后回写：本报告状态 → 已执行；`docs/09-verification.md` 补 APP-SIZE-C-011 验证记录；VERSION 视情况 PATCH（重构不新增能力，按 `project-rules §2.8.1` 走 PATCH，非 MINOR）。
- APP-SIZE-C-011 关闭后，App.tsx 持续 monitored（新功能优先抽 hook，不再堆主组件）。
