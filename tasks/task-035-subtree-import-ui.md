# task-035：子树导入 UI（Sprint-24 · REQ-018 模式 B 增强）

## 任务元信息

- 所属 Sprint：Sprint-24（Phase2C 增强·Wave 1）
- 关联 REQ：REQ-018 模式 B 增强（子树导入；复用模式 A = REQ-037/039 导入能力）
- 关联 TC：TC-P2-VAULT-002
- 关联 API：API-029 `POST /api/import/batch`（复用，不改契约）
- 状态：已完成（TC-P2-VAULT-002 通过，2026-08-06）

## 目标

1. 本地挂载目录树支持「选子文件夹导入」：任意目录节点可导入其子树（该目录 + 子目录 + 文件）到 LUMEN，`preserveStructure:true` 保留目录结构；补齐 task-033 留的子树导入 UI 尾巴。
2. 按前端交互评估（主流设计视角）提升导入体验：目录行 hover 浮现导入入口、批量导入确认、进度带范围、结果带去向。

## 前端交互设计评估（2026-08-06 · 主流设计参考）

现状诊断（LocalMountPane.tsx）：
- 目录节点只有展开 / 折叠，无子树导入入口；「导入全部」无确认、无规模提示（大 vault 误触风险）。
- 导入反馈仅一行内联文字，无范围 / 进度可视化；结果只有计数，失败 / 跳过原因不可查、不知去向。
- 树行 `div + onClick` 键盘不可达；无已入库可见性。

主流参考：Obsidian / VS Code（文件夹行 hover 操作，文件夹=容器）；Google Drive / Dropbox（批量导入确认 + 进度 + 结果位置）；Notion（导入文件数 + 目标 + 权限）；Linear（选中态明确）。

推荐设计（本 Sprint 落地）：
1. 目录行 hover 浮现「导入此文件夹」按钮——导入该子树（含子文件夹 + 文件），`preserveStructure:true`。
2. 批量导入确认：子树 ≥2 文件或「导入全部」时内联确认条「将导入 N 个文件到 LUMEN（保留目录结构）」，确认 / 取消；单篇导入不打扰。
3. 进度 / 结果增强：进度带范围标签；完成后提示去向（已入上层 DB，保留目录结构，可在文档视图查看）。
4. 数据层：`LocalMountTreeNode` 增加 `path` 字段（buildLocalMountTree 填充目录路径前缀）。
5. a11y 最小处理：hover 按钮为原生 `button` + `aria-label`；树行整体键盘化列为后续增强（记录边界）。
6. 零新依赖；改动限制 3 个文件。

## 上游依据

- `docs/design/ingestion.md` Flow-D-014（按需导入单篇 / 子树）
- `docs/09-verification.md` TC-P2-VAULT-002（本 Sprint 验收）
- `docs/08-dev-plan.md` Sprint-24 详情（规划）
- `docs/07-api-spec.md` API-029（`preserve_structure` + `relative_paths`）
- 前端交互基线：`frontend-interaction.md` CMP-P2-TREE / PATH-P2-008（本地挂载 != 已入库）

## 修改范围

| 文件 | 变更 |
|---|---|
| `frontend/src/app/useLocalVaultMount.ts` | `LocalMountTreeNode` 增加 `path`；`buildLocalMountTree` 填充目录路径前缀（root path 为空串） |
| `frontend/src/features/LocalMountPane.tsx` | 目录行 hover「导入此文件夹」按钮（stopPropagation 不触发折叠）；子树 / 全部导入内联确认条；进度带范围标签；结果带去向提示；复用 `importBatchDocuments` + `onImported` |
| `frontend/src/styles/local-mount.css` | 新增 hover 导入按钮与内联确认条样式（视觉与现有分区一致：白底深色字、细分隔线） |

## 验证包

- `cd frontend && volta run --node 22.17.1 npm run build` → 通过
- 人工 smoke（localhost + FSA 授权）：挂载带子目录的 vault → 目录行 hover 出现「导入此文件夹」→ 确认后导入 → 上层 DB 出现且目录结构保留（preserveStructure）→ 单篇 / 整库入口回归

## 验收标准

- 任意目录节点可导入其子树，走 API-029、`preserveStructure:true` 保留目录；导入后出现在上层 DB 分区且可搜。
- 子树 / 全部导入有确认（含文件数）；单篇导入不确认。
- 进度显示范围与计数；完成显示成功 / 失败 / 跳过与去向提示。
- 不改 API-029 契约 / 后端 / 不引依赖。

## 降级 / Mock 边界

- 导入复用既有 API-029 分批（50/批）+ 失败隔离，无新增降级。
- FSA 授权仍需用户手势 + localhost 访问（CDP 无法自动化 `showDirectoryPicker`），核心走用户人工 smoke。

## 残留风险 / 未验证

- 树行整体键盘化（方向键导航 / Enter 展开）未做，列为后续增强（帮助 L3 / a11y 迭代）。
- 已入库可见性（本地条目是否已在 DB）未做，跳过计数可提示重复，细粒度标识后续增强。

## 完成记录

- **2026-08-06 编码完成（build 绿）**。
- 数据层：`useLocalVaultMount.ts` `LocalMountTreeNode` 增加 `path`（buildLocalMountTree 填充目录路径前缀，root path 为空串），供子树筛选。
- UI（`LocalMountPane.tsx`）：
  - 目录行 hover 浮现「⤓ 导入」按钮（原生 button + aria-label + stopPropagation，不触发折叠），点击导入该子树（该目录 + 子目录 + 文件），`preserveStructure:true`。
  - 子树 ≥2 文件或「导入全部」时出现内联确认条「将导入「xxx」的 N 个文件到 LUMEN（保留目录结构）」+ 确认 / 取消；单篇导入不确认。
  - 进度带范围标签（正在导入「xxx」… done/total）；完成后提示去向「已入上层 DB，保留目录结构，可在文档视图查看」+ 成功 / 失败 / 跳过计数；`onImported` 刷新 DB 文档列表。
  - 样式：`local-mount.css` 新增 hover 导入按钮 + 确认条（白底深色字、细分隔线，与分区一致）。
- 验证：`cd frontend && volta run --node 22.17.1 npm run build` → **270 modules 绿**（tsc + vite）。
- 运行态人工 smoke（TC-P2-VAULT-002）：**通过（2026-08-06）**——4 项全过（① 子树导入 hover+确认+进度+去向 ② 目录结构保留 ③ 单篇不确认 ④ 整库+导入中禁用）。验收期修复 2 处：上下分隔条拖动方向反转（`useLocalMountHeight` 符号）、首页空左栏（`App.tsx` 左栏视图感知），均见 `docs/09` §5.1。

## 待确认项

无（设计已随本任务落盘）。
