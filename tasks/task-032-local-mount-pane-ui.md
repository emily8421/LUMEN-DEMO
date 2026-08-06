# task-032：左侧「本地挂载」分区 UI + 本地预览（Sprint-23C · REQ-018 模式 B）

## 任务元信息

- 所属 Sprint：Sprint-23C
- 关联 REQ：REQ-018 模式 B
- 关联 TC：TC-P2-VAULT-001（② 本地树 / ③ 本地搜索 / ④ 分区隔离 / ① 刷新恢复 / ⑤ 本地预览）
- 关联设计：CMP-P2-TREE / PG-P2-002 / PATH-P2-008（`docs/design/frontend-interaction.md`）
- 状态：待编码（依赖 task-031）

## 目标

在左侧文件管理器 documents 分支新增「本地挂载」分区（下层，未入库），与上层 LUMEN DB 文件管理器视觉隔离。复用 task-031 数据层，渲染本地目录树、本地搜索、本地预览（不上传），刷新自动恢复挂载。

- 上层「LUMEN 知识库」=既有 FolderTree（不动）。
- 下层「本地挂载·未入库」=新 LocalMountPane。

## 上游依据

- `docs/design/frontend-interaction.md` CMP-P2-TREE（:417 上下分区 + 未入库徽标）、PG-P2-002（:403）、PATH-P2-008（:440）
- `docs/design/ingestion.md` Flow-D-014 §4（分区视觉隔离，不伪装团队文档）
- PoC 原型 `renderTree/renderNode/bindTree/openDoc`（:258-298）

## 修改范围

| 文件 | 变更 |
|---|---|
| `frontend/src/app/local-mount-store.ts` | 新增：挂载元信息 localStorage（挂载名 / 授权状态 / 文件数 / lastSynced），沿用 `*-store.ts` 模式；句柄走 task-031 IDB |
| `frontend/src/app/useLocalVaultMount.ts` | 新增 hook：编排 pick→verify→index→tree；页面加载自动 `restoreHandle`（granted 无感重建）；暴露 `mount/unmount/reindex/search/openDoc` |
| `frontend/src/features/LocalMountPane.tsx` | 新增分区 UI：header（挂载 / 恢复 / 重扫 + 授权徽标）、本地搜索框、目录树（INDEX 路径聚合 + 折叠 / 点击 + 📁/📄 + 本地·未入库徽标）、本地预览（点文件本地读取，不上传）、空态 / 授权失效态 |
| `frontend/src/styles/local-mount.css` | 新增分区样式（分隔线 / 徽标 / 与 DB 区区分） |
| `frontend/src/app/ContextPane.tsx` | 组装点：documents 分支（:83）`<FolderTree />`（:158-167）后追加 `<LocalMountPane />` section |

## 验证包

- `cd frontend && volta run --node 22.17.1 npm run build` → 通过
- 浏览器 smoke（localhost，task-033 host 修正后）：挂载 vault → 目录树 → 本地搜索命中 → 点文件本地预览 → F5 刷新无感恢复 → Network 零上传

## 验收标准

- 左侧 documents 分支上下双 section：上层 LUMEN DB（既有 FolderTree 不动），下层本地挂载（LocalMountPane）。
- 本地挂载条目带「本地·未入库」徽标，与 DB 文档视觉区分，不伪装团队文档。
- 本地搜索命中本地索引（不上传）；点文件本地读取预览（不上传）。
- 刷新后 granted 自动恢复挂载（无感）；`prompt`/`denied` 提示手动重授权。
- 不动 `FolderTree.tsx`（558 行）；ContextPane 仅作组装点。

## 降级 / Mock 边界

- 无 FSA 浏览器：分区显示「浏览器不支持本地挂载（需 Chrome/Edge）」。
- 未挂载：分区空态「选择本地 vault / Markdown 文件夹挂载（仅本地，不上传）」。
- 授权失效：徽标提示 + 「重新授权」按钮。

## 残留风险 / 未验证

- 自动文件变更监听未做，手动「重扫」。
- 大规模 vault（万级）目录树渲染性能留工程验证（PoC 1200 达标）。

## 完成记录

- **2026-08-06 完成（编码 + build）**。
- 新增 / 修改文件：
  - `frontend/src/app/useLocalVaultMount.ts`（编排 hook：`mount` / `reauth` / `reindex` / `unmount` / `openDoc`；页面加载 `restoreVaultHandle(false)` 无感恢复；`buildLocalMountTree` 路径聚合）
  - `frontend/src/features/LocalMountPane.tsx`（分区 UI：header + 授权徽标 + 挂载 / 恢复 / 重扫 / 卸载 + 本地搜索 + 目录树 + 本地预览 + 空 / 不支持 / 授权失效态；`LocalMountTreeView` 递归）
  - `frontend/src/styles/local-mount.css`（分区视觉：分隔线 + 徽标 + 本地 tag + 预览面板）
  - `frontend/src/app/ContextPane.tsx`（组装点：documents 分支 `<FolderTree />` 后追加 `<LocalMountPane />`）
  - `frontend/src/main.tsx`（import local-mount.css）
- **简化**：未实现独立 `local-mount-store.ts`（plan 原列）——挂载元信息（mountName / fileCount / 授权态）都能从 handle + 索引运行时重建，句柄已走 task-031 IndexedDB；另建 localStorage store 冗余，按「反对堆砌」省略。
- 验证：`cd frontend && volta run --node 22.17.1 npm run build` → **267 modules 绿**（262→267，+5：local-vault-index/fs、useLocalVaultMount、LocalMountPane、local-mount.css；CSS +2.78kB / JS +8.5kB）。
- 功能 smoke：待 task-034（FSA 授权需用户手势 + localhost secure context，host 切换在 task-033）；build 通过保证编译期类型 / 打包正确，运行时渲染 + 授权 / 索引 / 搜索 / 恢复随 task-034 TC smoke + 用户人工 smoke 统一验证。

## 待确认项

无。
