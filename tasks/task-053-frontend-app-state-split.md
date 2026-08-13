# task-053：前端文件膨胀拆分 Slice A——App 减压收口（useAppState 再抽 + ratchet 分层阈值）

> 维护态批21 / Sprint-46 / CQ-P1-008 后续候选 E4 / governance rollout §4 轨道3 P2 剩余候选。
> 状态：**已完成（2026-08-13，App 减压收口 + ratchet 分层阈值，bump v3.8.18）**。
> 依据：`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.1（文件膨胀阈值）；`ai/global-rules.md` §2.1 L0-11（体量克制）。

## 背景 / 目标

CQ-P1-008（v3.8.17）拆 App 546→360 并落地 file-size ratchet 后，剩余候选：App 360 仍超阈值 + 18 个超限文件待拆。本 Slice A 收口 App 减压（②useAppState 再抽）+ 修正 ratchet 阈值口径（对齐 docs/05 §4.1 分层阈值）。成功判定：App.tsx 显著降到阈值内；ratchet 按分层阈值（.css/App→300，.ts/.tsx→250）工作；baseline 收窄。

## 方案

- **ratchet 分层阈值**：`scripts/check-frontend-file-size.mjs` 按扩展名取阈值——`.css` 与 `App.tsx`（主应用入口）→ 300，其余 `.ts/.tsx` → 250；对齐 docs/05 §4.1（原统一 250 与文档口径不一致）。
- **App 减压（②useAppState 再抽）**：
  - 新 `app/useAppShellState.ts`（57 行）：UI/布局派生（workspace/paneLayout/leftPaneWidth/leftPaneOpen）+ 局部弹窗/引导 state（importModal/localPreview/onboarding/guideDismissed/resetModal）+ setters。
  - 新 `app/useAppState.ts`（339 行）：域 hook 初始化（17 个）+ cross-cutting 回调（runAction/refreshWorkspace/handleSpaceChanged/handleImported/handleExportSpace/onboarding/本地预览）+ 3 effects。**依赖顺序与函数提升原样搬移**，保留 eslint-disable 注释。
  - `App.tsx` 359→90：只剩 import + `const app = useAppState()` + 装配。
- **useAppState 登记基线**（339 > 250）：跨域回调与域 hook 构成循环依赖（runAction↔session、handleSpaceChanged/handleImported↔domains），拆两个 <250 hook 需 ref 后置绑定等复杂模式并改运行语义，ROI 低；作为「主应用编排宿主」例外登记基线（用户确认）。App.tsx 出基线、ai-assistant.css（271）在 300 口径下出基线。

## 验证包

- `npm run lint` 0 problem + `npm run build` **306 modules**（+2 hook，原 304）+ `npm run check:file-size` OK（baseline 19→18）
- 负向探针：280 行临时文件 → ratchet fail；删除后 OK
- CI PR #158 待跑（8 job）

## 完成记录

- **编码**：脚本分层阈值 + useAppShellState/useAppState 抽取 + App 装配壳；baseline 重生成（移除 App.tsx/ai-assistant.css，登记 useAppState.ts）。
- **修正**：useAppState 本地预览互斥 effect 依赖补 `setLocalPreviewDoc`（eslint exhaustive-deps warning → 0）。
- **验证**：lint 0 + build 306 modules + check:file-size OK + 负向探针（280 行 fail，删除后 OK）。
- **收尾**：PR #158 squash merge main `ee95523`（CI 8 job 全绿：Backend unit / mypy / Frontend ESLint / build / project-check / Ruff / schema-diff / integration）；浏览器 smoke（demo + headless Edge）渲染登录页成功、无运行时错误；回写 + bump v3.8.18 直推 main。
- **残留候选**：Slice B（hooks 拆分）/ C（CSS）/ D（组件低风险）/ E（组件中风险）见 plan。

## 后续候选（不在本次范围）

- Slice B：hooks/工具拆分（useLocalVaultMount 442 / useDocuments 335 / local-vault-fs 310 / useFolders 300）
- Slice C：CSS 拆分（workspace 722 / local-mount 589 / layout 458 / onboarding 317）
- Slice D/E：组件拆分（FolderTree 569 等 9 个）
