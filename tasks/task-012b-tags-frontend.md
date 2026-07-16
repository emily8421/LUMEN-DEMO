# REQ-012 Task B：标签视图前端（扁平标签最小版）

> Phase2A 第二个 vertical slice「标签视图」的前端部分。后端见 Task A（commit `1e4cf48`，API-014/027/031/032 已就绪）；文档回写见 Task C。
> 参照实现：REQ-026 doc-links 前端模式（commit `6228f3f`）—— `DocumentsFeature.backlinks-block` 面板 + `App.tsx loadDocLinks` handler + `WorkspaceViewNav` 视图项。
> 本任务借机把标签 state/handler 抽成 `useTags` hook，给 App.tsx 减压（APP-SIZE-C-011）。

## 目标

实现 REQ-012 标签视图**最小版前端**：独立标签视图（NavRail 入口）+ 文档详情标签面板（打/移除）。完成后 TC-P2-TAG-001 前端 smoke 可通过。

## 输入文档

- `docs/02-srs.md` REQ-012；`docs/07-api-spec.md` API-014/027/031/032（Task A 已实现）
- `docs/09-verification.md` TC-P2-TAG-001（前端 smoke 部分）
- 参照代码：`features/DocumentsFeature.tsx` backlinks-block、`app/WorkspaceViewNav.tsx`、`App.tsx` loadDocLinks/handleOpenDocument、`features/TermsFeature.tsx`（列表布局）

## REQ-012 最小版范围（用户已确认）

- 扁平标签（无层级）；空间隔离
- 独立标签视图：标签列表含 `document_count`；点标签看文档（API-032）
- 单标签筛选（不做多标签组合）
- 文档详情标签面板：打标签 / 移除（API-031），复用 backlinks 面板模式
- 打标签入口：**下拉选已有标签**（新建统一在标签视图做）
- **不做**：层级 / 嵌套、组合筛选、AI / 导入自动打标签、跨空间标签

## 修改范围（9 文件）

| # | 文件 | 操作 | 关键内容 |
|---|---|---|---|
| 1 | `api/tags.ts` | 新增 | tag client（listTags/createTag/updateTag/archiveTag/getTag/listDocumentTags/addDocumentTag/removeDocumentTag/listDocumentsByTag）+ Tag 类型 |
| 2 | `api.ts`(barrel) | 改 | 加 `export * from './api/tags'` |
| 3 | `app/WorkspaceViewNav.tsx` | 改 | `ActiveView` 加 `'tags'` + `workspaceViews` 加「标签」项 |
| 4 | `features/TagsFeature.tsx` | 新增 | 标签视图：标签列表(name+document_count) + 点标签看文档 |
| 5 | `features/DocumentsFeature.tsx` | 改 | 加文档详情「标签」面板（参照 backlinks-block，下拉打标/移除） |
| 6 | `app/useTags.ts` | 新增 | 标签 state+handler 抽成 hook（顺势拆 App.tsx） |
| 7 | `App.tsx` | 改 | 接 `useTags` + `activeView==='tags'` 分发 + 文档详情传标签 props + loadDocumentTags 接入 |
| 8 | `styles/panels.css` | 改 | 标签视图 + 标签面板样式 |
| 9 | `tasks/task-012b-tags-frontend.md` | 新增 | 本任务文档 |

## 关键设计

- **`useTags` hook（顺势拆）**：标签 state（tags / documentTags / selectedTagId / tagDocuments）+ handler 全抽到 `app/useTags.ts`；App.tsx 只调 `useTags({ token, currentSpaceId, selectedDocumentId })`。标签逻辑独立（主要依赖 token/spaceId/selectedId），抽离风险可控；新功能不堆进 App()。
- **TagsFeature**：上方标签列表（名称 + 文档数），点标签 → 下方列该标签下可见文档；布局参照 TermsFeature。
- **文档详情标签面板**：在 `DocumentsFeature` aside（版本历史 + 反链 旁）加「标签」section，复刻 backlinks-block；下拉从空间已有标签选来打标，已打标签可移除。
- **打标签入口**：下拉选已有标签（tag_id）；新建在标签视图做。

## 验收标准（对齐 TC-P2-TAG-001 前端）

- 标签视图：列当前空间标签 + document_count；点标签看可见文档；跨空间 / 私有文档不进入
- 文档详情：下拉打标签 / 移除；标签同空间 active
- `npm run build` 通过；浏览器 smoke 通过

## 验证方式

- `npm run build`（tsc + vite）—— 类型 / import 正确
- 浏览器 smoke（TC-P2-TAG-001 前端）：登录 → 标签视图建标签 → 文档详情打 / 移标签 → 点标签看文档 → 跨空间 / 私有不泄露

## 禁止事项

- 不做多标签组合筛选、层级 / 嵌套、AI 自动打标签
- 不改后端（Task A 已完成）、不改 docs（Task C）
- 不改 API-032 路径（按 `/api/tags/{id}/documents`）

## 完成记录

- **状态**：代码完成·build 通过（2026-07-16）；待浏览器 smoke（TC-P2-TAG-001 前端）
- **改动**：8 文件（`api/tags.ts` 新 / `api.ts` barrel / `WorkspaceViewNav` / `TagsFeature` 新 / `DocumentsFeature` 标签面板 / `app/useTags` 新 / `App.tsx` 接入 / `styles/panels.css`）
- **验证**：
  - `npm run build` 通过（tsc -b + vite build，221 modules；CSS +1.7kB / JS +5.5kB）
  - TypeScript 接线全绿：useTags hook 接口、App props 流转、barrel、类型（TagView / DocumentTagView / KnowledgeDocument）
  - 浏览器 smoke（TC-P2-TAG-001 前端）待用户执行
- **关键设计落地**：`useTags` hook 自洽监听 token / currentSpaceId / selectedDocumentId；标签 state/handler 不堆进 App()（APP-SIZE-C-011 顺势拆）；文档详情标签面板复刻 backlinks-block + 下拉选已有标签打标
- **遗留**：浏览器 smoke；Task C 文档回写（06/07 → 已实现；09 TC-P2-TAG-001 前端 smoke + API-032 措辞统一）
