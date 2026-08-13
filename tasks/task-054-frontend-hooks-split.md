# task-054：前端文件膨胀拆分 Slice B——hooks/工具拆分

> 维护态批22 / Sprint-47 / CQ-P1-008 后续候选 E4 / governance rollout §4 轨道3 P2 剩余候选。
> 状态：**已完成（2026-08-13，Slice B hooks/工具拆分，bump v3.8.19）**。
> 依据：`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.1；plan（`adaptive-humming-kettle.md` Slice B）。

## 背景 / 目标

Slice A（v3.8.18）拆 App 后，baseline 剩 15 个超限文件。本 Slice B 拆 4 个超限 .ts hooks/工具：`useLocalVaultMount` 442 / `useDocuments` 335 / `local-vault-fs` 310 / `useFolders` 300，按风险低→高。成功判定：4 个文件全降到阈值内（或登记核心编排例外），baseline 收窄。

## 方案

按风险低→高（各新文件补 §4.2.5 JSDoc；`useLocalVaultMount` 原无 JSDoc 顺带补）：
1. **local-vault-fs 310 → 3 纯工具**（唯一调用方 useLocalVaultMount）：
   - `local-vault-walk.ts` 67（常量/谓词/pickDirectory/walkVault）
   - `local-vault-idb.ts` 152（IDB 句柄存取 + restore + asPermissionable）
   - `local-vault-fs.ts` 94（verifyPermission + 写路径 + readVaultFile）
2. **useFolders 300 → folder-utils.ts 46（parentKey + buildMoveTargets + buildDocumentMoveTargets）+ useFolderInlineEdit.ts 122（inline 编辑组，ensureParentLoaded 注入）+ 主 hook 202**
3. **useDocuments 335 → useDocumentSideData.ts 110（versions/links 侧数据）+ download-actions.ts 30（下载/导出）+ 主 hook 286（登记）**
4. **useLocalVaultMount 442 → local-vault-tree.ts 32（buildLocalMountTree）+ local-vault-types.ts 60（类型）+ useLocalVaultEditor.ts 184（REQ-049 写组）+ 主 hook 236**

## 验证包

- `npm run lint` 0 problem + `npm run tsc` 0 error + `npm run build` **314 modules**（+9 文件）+ `npm run check:file-size` OK（baseline 18→15）
- 负向探针：280 行临时文件 fail；删除后 OK
- 浏览器 smoke：demo + headless Edge 渲染登录页无运行时错误
- CI PR #159 待跑（8 job）

## 完成记录

- **编码**：4 个超限 .ts 全拆（310/300/335/442 → 全部 <250 或登记例外）。`useDocuments` 286 仍超 250——文档域核心 CRUD hook，拆 useDocumentActions 需注入 15+ 依赖（大 prop-drill，ROI 低），按 useAppState 同类「核心编排例外」登记基线（用户在 Slice A 已确认该模式）。
- **修正**：`verifyPermission` 归 fs（拆分后 walk 无该导出）；`editor` 声明提前（unmount 引用）；`mountSeq` 移主 hook（types 内无 reassign 触发 prefer-const）；searchIndex import 置顶。
- **验证**：lint 0 + tsc 0 + build 314 modules + check:file-size OK（15 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（headless Edge 登录页渲染无错误）。
- **收尾**：PR #159 squash merge main `bad7e4c`（CI 8 job 全绿）；回写 + bump v3.8.19 直推 main。
- **残留候选**：Slice C（CSS）/ D（组件低风险）/ E（组件中风险）见 plan。

## 后续候选（不在本次范围）

- Slice C：CSS 拆分（workspace 722 / local-mount 589 / layout 458 / onboarding 317）
- Slice D/E：组件拆分（FolderTree 569 等 9 个）
