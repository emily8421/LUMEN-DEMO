# Task 019：AI 润色前端（Sprint-19 / REQ-014 / Phase2B 首批核心）

> 本 task 是 Sprint-19 的前端 half（写作侧边栏 + textarea selection + 应用/丢弃）。
> 后端 half 已完成合并（PR #89 / merge ba78467，API-028 + RG-008 升 Go）。前端跑通后 TC-P2-AI-001 的 UI smoke 部分闭环。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-19（Phase2B 首个 vertical slice，前端 half） |
| REQ | REQ-014（AI 润色 + 写作引用） |
| 接口 | API-028 `POST /api/documents/{id}/polish`（mode=polish/citation；后端已实现） |
| 设计 | `docs/design/ai-polish.md`、`docs/design/frontend-interaction.md` §9.2/§9.3（FL-P2-008 / CMP-P2-AI-POLISH / PATH-P2-007） |
| 仿照 | QuickEntry 三件套（`api/quickEntry.ts` + `app/useQuickEntry.ts` + `features/QuickEntryFeature.tsx`） |
| 前置 | 后端 PR #89 已合并；build Node 22（project-rules §2.9，须 `volta run --node 22.17.1`） |
| 分支 | feat/sprint-19-frontend（off main ba78467） |

## 目标

文档编辑器选中文本 → 右侧 AI 润色侧边栏触发 polish/citation → 预览草稿 + sources → 应用（替换选区 + PUT update 留版本）/ 丢弃。降级提示清楚（5030/无来源/只读）。

## 关键决策

1. **应用 = 替换选区 + PUT update**（D-C-002 替换选区 + REQ-006 版本），复用 useDocuments 保存链路（新增 `handleApplyPolishedContent`）。
2. **丢弃 = 本地清预览**（API-028 无 discard endpoint；DB 草稿留 generated）。
3. **只读禁用**：client canWrite（external + 非 owner 禁触发）+ 后端 4003 兜底。
4. **侧边栏 = inspector 常驻 section**（仿 backlinks/tags-block；minimal 不做浮层/折叠动效）。
5. **selection 失效守卫**：apply 时校验 `contentMd.slice(start,end)===selection.text`，不一致提示重选。
6. **降级文案**：5030（msg-based）→「AI 暂不可用，可重试」；**no-sources 是成功草稿**（output「未找到可引用来源」+ sources=[]，非错误）。
7. **CSS 新文件**（不动 panels.css 667，尊重 WSG/CSS 300 拆分）。

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `frontend/src/api/aiPolish.ts` | 新 | types（PolishMode/PolishSource/PolishView）+ `polishDocument` client |
| 2 | `frontend/src/app/useAiPolish.ts` | 新 | hook：selection/mode/instruction/result/status/error；requestPolish/apply/discard；canWrite；reset |
| 3 | `frontend/src/features/AiPolishFeature.tsx` | 新 | 纯展示侧边栏 |
| 4 | `frontend/src/styles/ai-polish.css` | 新 | 侧边栏样式 |
| 5 | `frontend/src/api.ts` | 改 | +`export * from './api/aiPolish'` |
| 6 | `frontend/src/app/useDocuments.ts` | 改 | +`handleApplyPolishedContent(newContentMd)` |
| 7 | `frontend/src/features/DocumentsFeature.tsx` | 改 | textarea ref+onSelect；inspector 渲染 AiPolishFeature；+aiPolish prop |
| 8 | `frontend/src/app/WorkspaceMain.tsx` | 改 | 透传 aiPolish |
| 9 | `frontend/src/App.tsx` | 改 | 实例化 useAiPolish，传 WorkspaceMain |
| 10 | `frontend/src/main.tsx` | 改 | +`import './styles/ai-polish.css'` |

## 验证包

- **自动门禁**：`volta run --node 22.17.1 npm run build`（tsc + vite）绿。
- **浏览器 UI smoke（TC-P2-AI-001）**：选区→polish→草稿、citation→sources、应用→版本回退、5030/无来源/只读提示。**需 PG+LLM 运行栈**（本会话 Docker/PG 已停），列为待跑。
- WSG：App.tsx 231→~234、useDocuments 270→~282、DocumentsFeature 268→~283（均 < 300；重 UI 在独立 AiPolishFeature）。

## 禁止事项

- 不碰后端（PR #89 已合并）。
- 不实现时间轴（Sprint-20）、REQ-015/016/017。
- 不新建 discard/apply 端点（应用走既有 PUT；丢弃本地清）。
- 不做主题切换 / 动效 / 移动端。
- VERSION MINOR + CHANGELOG 条目留 release。

## 待确认

- D-C-001（citation 异步）：首版同步，前端拿到结果直接渲染。
- D-C-002（应用=替换选区）：已定替换 + 版本。

## 完成记录

- [x] api/aiPolish.ts（types + polishDocument）
- [x] useAiPolish.ts（hook：selection/mode/instruction/result/phase/error；requestPolish/apply/discard；canWrite；selection 失效守卫）
- [x] AiPolishFeature.tsx + ai-polish.css（侧边栏：mode 切换 + instruction + 触发 + 草稿预览 + sources + 应用/丢弃 + 5030/无来源/只读提示）
- [x] 接线（api.ts / useDocuments.handleApplyPolishedContent / DocumentsFeature / WorkspaceMain / App / main.tsx）+ useTextareaSelection（WSG 抽出）
- [x] build 验证绿
- [ ] 浏览器 UI smoke（TC-P2-AI-001，待 PG+LLM 栈起来）

### 验证结果（2026-07-31）

- `volta run --node 22.17.1 npm run build`（tsc -b + vite build）→ **exit 0**，239 modules，1.06s。类型检查 + 构建均通过。
- WSG：App.tsx 244 / useDocuments.ts 291 / DocumentsFeature.tsx 297（均 < 300；DocumentsFeature 因接线一度到 306，已抽 `useTextareaSelection` 降回 297）/ 新文件均小（AiPolishFeature 157、useAiPolish 162、aiPolish.ts 53、ai-polish.css 119、useTextareaSelection 24）。
- **浏览器 UI smoke（TC-P2-AI-001）待跑**：需 PG+LLM 运行栈（本会话 Docker/PG 已停）。启动栈后补：选区→polish→草稿、citation→sources、应用→版本回退、5030/无来源/只读提示。

### 实现偏差（待回写 design §9）

- F-impl-1：侧边栏挂 inspector 右栏作常驻 section（仿 backlinks/tags-block），未做「选区时才展开」浮层动效（design CMP-P2-AI-POLISH 推荐「默认折叠选区展开」，minimal 首版取常驻，更稳）。
- F-impl-2：选区捕获抽成 `useTextareaSelection` hook（WSG 拆分，非 design 要求）。
- F-impl-3：apply 后立即清本地预览（保存异步由 useVariables 负责）；若保存失败反馈走全局 StatusBar（minimal，未做面板内 applying 态）。
