# task-031：本地 Vault 挂载数据层 + 本地索引（Sprint-23C · REQ-018 模式 B）

## 任务元信息

- 所属 Sprint：Sprint-23C（Phase2C · 本地知识源接入 · REQ-018 模式 B）
- 关联 REQ：REQ-018（模式 B「仅本地挂载」）
- 关联 TC：TC-P2-VAULT-001（② 本地树 / ③ 本地搜索 / ① 刷新恢复）
- 关联 API：无（纯前端，模式 B 后端零新 API，`07:304/332`）
- 状态：待编码

## 目标

把 RG-009 PoC 原型的「浏览器 File System Access + 原生 IndexedDB 持久化 + vanilla 倒排索引」纯逻辑移植为两个可独立验证的模块，供 task-032 UI 层调用。零第三方依赖。

- `local-vault-fs.ts`：FSA 句柄获取 / 授权 / 递归遍历过滤 / 句柄 IndexedDB 持久化 / 刷新恢复。
- `local-vault-index.ts`：分词 + 倒排索引构建 + ranked 本地搜索。

## 上游依据

- `docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html`（编码蓝本：`openIdb/idbPut/idbGet` :155-165、`verifyPermission` :170、`walk` :182、`tokenize/buildInverted/buildIndex` :201-227、`search` :235、`restoreHandle` :330）
- `docs/research/2026-08-05-rg009-vault-local-mount-poc.md`（RG-009 Go，8 能力 + 5 场景）
- `docs/design/ingestion.md` Flow-D-014（§2.3，模式 B 硬天花板）
- `docs/05-tech-spec.md` RG-009 / TCD-011（:151/:169）

## 修改范围

| 文件 | 变更 |
|---|---|
| `frontend/src/app/local-vault-fs.ts` | 新增：`pickDirectory()`、`verifyPermission(handle, readWrite)`、`walk(dirHandle, prefix, acc, onProgress)`（递归 + `isHiddenSeg`/`isImportable` 过滤）、原生 IndexedDB `openVaultIdb/idbPutHandle/idbGetHandle/idbDelHandle`、`restoreHandle()`（`queryPermission`→`granted` 自动恢复 / 否则返回需重授权）、类型 `LocalVaultDoc` |
| `frontend/src/app/local-vault-index.ts` | 新增：`tokenize`、`buildInvertedIndex(docs)`、`searchIndex(index, q)`（ranked）、类型 `LocalVaultIndex` |
| `scripts/smoke-local-vault-index.mjs` | 新增：Node 直接 import 纯函数，断言 tokenize/buildInverted/search 命中与排序，不引依赖 |

## 验证包

- `cd frontend && volta run --node 22.17.1 npm run build`（`tsc -b && vite build`）→ 类型检查通过
- `node scripts/smoke-local-vault-index.mjs` → 纯逻辑断言通过（tokenize 分词、buildInverted 倒排、search ranked 命中）

## 验收标准

- FSA 句柄可经原生 IndexedDB 结构化克隆持久化；刷新后 `queryPermission({mode:'read'})` 返回 `granted` 时 `restoreHandle` 自动恢复（不弹授权框）。
- `walk` 递归遍历，过滤隐藏段（`.obsidian` 等）与非白名单扩展。
- `buildInvertedIndex` + `searchIndex` 对 1200 文件量级「很快」（索引 <2s / 搜索 <100ms 量级，PoC 实测）。
- 零第三方依赖；模块在浏览器无 FSA / IndexedDB 时 guarded 不崩。

## 降级 / Mock 边界

- 浏览器无 `showDirectoryPicker`（Firefox/Safari）→ `pickDirectory` 抛明确错误，UI 层提示「浏览器不支持」。
- IndexedDB 不可用（隐私模式）→ 句柄持久化降级为仅内存（刷新后需重选），不崩。
- 本地索引纯内存，不上传服务端（Network 零请求，TC-P2-VAULT-001 ⑥）。

## 残留风险 / 未验证

- 自动文件变更监听（FileSystemObserver）未做，留 task-032 手动「重扫」（PoC ⑦ 部分 Go，达标）。
- 改名细粒度冲突检测留工程细化（PoC ⑤ path diff 达标）。
- 万级文件本地索引性能留工程验证（PoC 1200 文件达标）。

## 完成记录

- **2026-08-06 完成**。
- 新增文件：
  - `frontend/src/app/local-vault-index.ts`（`tokenize` / `buildInvertedIndex` / `searchIndex` + 类型 `LocalVaultDoc` / `LocalVaultIndex` / `LocalVaultSearchHit`）
  - `frontend/src/app/local-vault-fs.ts`（`pickDirectory` / `verifyPermission` / `walkVault` 递归过滤 / `readVaultFile` / 原生 IndexedDB `saveVaultHandle`·`loadVaultHandle`·`clearVaultHandle` / `restoreVaultHandle` queryPermission→granted 自动恢复）
  - `scripts/smoke-local-vault-index.mjs`（Node 22 `--experimental-strip-types` 直接 import TS 纯函数，零依赖）
- 验证：
  - `cd frontend && volta run --node 22.17.1 npm run build` → **262 modules 绿**（tsc -b 类型检查通过；含 Chromium 扩展 API cast helper `directoryValues` / `PermissionableHandle`，因 TS 5.5 lib.dom 未声明 `FileSystemDirectoryHandle.values()` / `queryPermission`）
  - `volta run --node 22.17.1 node --experimental-strip-types scripts/smoke-local-vault-index.mjs` → **LOCAL_VAULT_INDEX_SMOKE ok**（7 断言：tokenize 中英文 / 短 token、search 命中数 / 多词 score 排序 / 空查询 / 无命中）
- 关键实现点：
  - 句柄持久化走原生 IndexedDB（`lumen-demo-vault` / store `handles` / key `vault-root`），FileSystemHandle 不可序列化、不进 localStorage。
  - `restoreVaultHandle(autoRequestIfPrompt=false)` 页面加载调用：queryPermission→granted 无感恢复（RG-009 ① 决定性证据）；prompt/denied 返回 needs-auth，由 UI 在用户手势内触发 requestPermission。
  - `walkVault` 过滤隐藏段（`.obsidian` 等）+ 非白名单扩展（`.md` / `.markdown` / `.txt`）。
  - 零第三方依赖；浏览器无 FSA / IndexedDB 时 guarded 不崩。

## 待确认项

无。
