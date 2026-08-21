# task-069：RunAction 类型收敛

> Sprint-65（维护态批40）/ REQ-011 既有桌面端体验维护 / TC-P2-GOV-029。
> 状态：已完成（2026-08-21）。

## 目标

消除 `RunAction` 操作包装类型在 16 个 app 模块的逐字重复声明，收敛为 `app/types.ts` 的单一共享类型（DRY / global-rules L0-5）。

## 依据

- `docs/08-dev-plan.md` Sprint-65 / FEP-06
- `docs/research/2026-08-19-frontend-code-evaluation.md` FE-MAINT-1（P7）
- `docs/research/2026-08-19-frontend-remediation-plan.md` §2 FEP-06

## 修改范围

- `frontend/src/app/types.ts`：新增导出 `RunAction` 类型（运行时实现仍为 `useAppState.runAction` 单一处）。
- 16 个 app 模块删除本地重复声明，改为从 `./types` 导入 `RunAction`：download-actions、useAdminUsers、useAiPolish、useDocuments、useFolderInlineEdit、useFolders、useImport、useQuery、useQuickEntry、useSession、useSearch、useTermCategories、useTags、useSpaceMembers、useTimeline、useTerms。

## 验收标准

1. `frontend/src/app` 下不再存在本地 `type RunAction = ...` 重复声明；唯一定义在 `app/types.ts`。
2. 运行时行为零变化（`useAppState.runAction` 实现与各 hook 的 runAction 透传语义不变）。
3. lint、build（tsc + vite）、全量前端 Vitest、CSS token、file-size 通过。

## 禁止事项

- 不改 API、后端、依赖、组件或 `client.ts`。
- 不把 FE-ERR-1 等其他债务混入本 Task。

## 完成记录

- `app/types.ts` 新增共享 `RunAction`；16 个模块改为 `import type { RunAction } from './types'`。改动 17 文件 +19/-35，纯类型收敛零运行时变化。
- 验证通过：ESLint 0、全量前端 Vitest 5 文件 / 24 用例、`tsc -b && vite build`（364 modules / 450.80 kB JS）、check:css、check:file-size、`git diff --check`（仅 LF/CRLF 提示）。
