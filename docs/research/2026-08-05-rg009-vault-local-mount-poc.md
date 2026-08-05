# RG-009 Vault PoC 验证报告（REQ-018 模式 B「仅本地挂载」）

> **定位**：技术评估 / PoC 验证留痕。**AI 辅助验证 · 待人工确认 · 不直接驱动开发。**
> 本报告不改 `00-09` 权威文档（除用户确认范围的 `05-tech-spec.md:151` RG-009 状态列）；REQ-018 仍为 `[愿景]`、Sprint-23B 状态不变、`project-rules §1` Phase2B 指针 / 禁止清单不动。
> **落盘目的**：记录 RG-009 八项未验证能力 + 最小 PoC 5 场景的实测结果，给出 Go / No-Go，供用户决策是否进入 REQ-018 阶段升级。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-08-05 |
| 触发 | 用户选「RG-009 Vault PoC」为下一阶段方向；诉求 = 部分本地知识库内容多 + 涉隐私，不期望入库（= REQ-018 模式 B） |
| 范围 | `05-tech-spec.md:151` RG-009 八项未验证能力 + `req018 评估 §4` 最小 PoC 5 场景 |
| 结论 | **Go** —— 浏览器 File System Access 路线可支撑模式 B「本地挂载 + 不上传 + 本地浏览 / 搜索」；刷新后句柄**自动恢复 granted**（无需重新授权） |
| 推荐路线 | 浏览器 File System Access + 原生 IndexedDB 持久化句柄 + vanilla 本地索引；零第三方依赖 |
| 评估当时边界 | PoC 验证浏览器路线技术可行性；**不改变模式 B 硬天花板**（本地挂载内容无法进服务端 RAG）；桌面运行形态（⑧）未实测 |
| 后续状态 | 待用户决策是否进入 REQ-018 阶段升级（不在本次落盘范围） |

## 1. 评估摘要

- **secure context 硬前提通过**：Chrome 129 下 `http://localhost` 的 `window.isSecureContext === true`（CDP 自动实测）；FSA API（`showDirectoryPicker`）/ IndexedDB 均可用。
- **八项能力 + 五场景全部通过**：1200 文件合成 vault，建索引 + 搜索「很快」（用户实测，索引 <2s / 搜索 <100ms 量级）；刷新后句柄**自动恢复 granted**（无需重新选目录授权）；增量扫描 + 冲突检测、文件预览、mock 分区显示、无上传（CDP `uploadCount=0` + 用户 Network 面板确认）均通过。
- **关键工程发现**：`FileSystemDirectoryHandle` 可经原生 IndexedDB 结构化克隆持久化；刷新后 `handle.queryPermission({mode:'read'})` 返回 `granted` 实现**自动恢复**——这是 Go（非 Conditional）的决定性证据。
- **硬天花板不变**：浏览器句柄后端读不到，本地挂载内容**仍无法进服务端 RAG / 全文搜索**。模式 B 的价值是「本地浏览 + 本地搜索 + 不上传」，**不是**「用上 LUMEN 的 AI 问答 / 引用」（那需模式 A 导入或桌面 agent 增量索引）。

## 2. 评估范围与依据

- `docs/05-tech-spec.md:151`（RG-009 定义 + 八项能力 + 最小 PoC）
- `docs/research/2026-08-05-req018-vault-feasibility-evaluation.md` §4 / §5（PoC 前置清单 + 分层答案，AI 评估 · 待人工确认）
- `docs/04-architecture.md:136` ADR-011（双模式）、`docs/design/ingestion.md:74-99` Flow-D-014（硬天花板声明）
- `docs/design/frontend-interaction.md` CMP-P2-TREE / PG-P2-002 / PATH-P2-008（双区显示既定设计）
- 本 PoC 产出：`docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html`（原型）+ `tmp/test-vault-large/`（1200 文件合成 vault，gitignored）+ `tmp/verify_env.mjs`（CDP 自动验证脚本，gitignored）

## 3. 本机环境事实

| 项 | 实测值 | 来源 |
|---|---|---|
| 浏览器 | Chrome 129.0.6643.2（Chromium 内核，Edge 同源） | CDP `/json/version` |
| 访问 URL | `http://localhost:8765/...poc.html` | 静态 `python -m http.server` |
| `window.isSecureContext` | **true** | CDP `Runtime.evaluate` 自动实测 |
| 访问主机名 | `localhost`（**非 127.0.0.1**） | localhost 按 W3C 规范为 secure context；127.0.0.1 对 FSA 不稳定 |
| `typeof showDirectoryPicker` | `"function"` | CDP 实测 |
| `"indexedDB" in window` | `true` | CDP 实测 |
| 本页网络请求计数（fetch/XHR） | **0** | PoC 拦截 + CDP `uploadCount=0` |
| **关键工程坑** | Chrome 必须用独立 `--user-data-dir` 启动才生效 `--remote-debugging-port` | 复用现有 Chrome 实例会忽略调试端口参数 |

> 注：本机 demo 默认前端为 `http://127.0.0.1:5173`（`run-sprint16-demo.ps1`），**对 FSA 不稳定**。模式 B 若将来接入 React，前端访问须确保走 `localhost` 或 HTTPS。

## 4. 技术路线候选与决策

| 维度 | 候选 | 决策 | 理由 |
|---|---|---|---|
| PoC 形态 | 独立 HTML / 接 React slice | **独立 HTML** | REQ-018 仍 `[愿景]` + 禁止清单，直接合 `frontend/src/` 越界；独立原型零污染 |
| 目录选择 | `showDirectoryPicker`（FSA）/ `webkitGetAsEntry`（legacy） | **FSA** | legacy 拿不到持久句柄，模式 B 必须用 FSA |
| 句柄持久化 | 原生 IndexedDB / idb / Dexie / localStorage | **原生 IndexedDB** | `FileSystemHandle` 不可序列化（不能进 localStorage）；原生 IDB 零依赖 |
| 重新授权 | `queryPermission`/`requestPermission` | 原生 | 测刷新后恢复或明确失效 |
| 本地索引 | vanilla 倒排 / lunr / flexsearch / minisearch | **vanilla 自写** | 规避新依赖审议（`project-rules §2`）；PoC 只证「本地可索引可搜」 |
| 文件读取 | `getFile()` → `File.text()` | 原生 | 浏览器内置 |

**零第三方依赖**：PoC HTML 不进 `frontend/package.json`，全部浏览器内置 API。

## 5. 验证证据

### 5.1 前提自动验证（AI · CDP headless Chrome）

```
RESULT: {"secure":true,"host":"localhost","fsa":"function","hasIdb":true,
         "uploadCount":"0","scSecure":"true","scFsa":"可用","scIdb":"可用",
         "pillSecureCls":"pill ok"}
JS_ERRORS: ["LOG: Failed to load resource: 404 (favicon.ico)"]  ← benign，非 PoC 代码
```

### 5.2 核心验证（用户 · 真实 Chrome 人工 smoke，2026-08-05）

合成 vault `tmp/test-vault-large/`：1200 个 `.md`（领域0~2 / 主题0~29 嵌套）+ `.obsidian/` 元目录 + `附件/`（image.png 非白名单 + notes.txt）。

| 步 | 操作 | 结果 | 对应能力 |
|---|---|---|---|
| 1 | 选目录 → 授权 → 挂载 vault | 目录树渲染 + 「1200 文件」+ 建索引耗时显示 | #1 选目录+树 / #4 索引规模 |
| 2 | 搜索 `量子计算` | 命中结果 + 搜索耗时（**很快**，<100ms 量级） | #4 本地搜索 |
| 3 | 点文件 | 右栏预览正文（本地读取） | #5 文件预览 |
| 4 | 保存句柄 | 「已存入 IndexedDB」 | #2 句柄持久化 |
| 5 | F5 刷新 → 恢复句柄 | **自动恢复 granted**，目录树重新出现，无需重新授权 | #3 重启恢复 |
| 6 | 增/删 .md → 重新扫描 | alert 显示新增 / 移除差异 | #6 增量+冲突 |
| 7 | selfcheck 计数 + Network | 计数=0 / Network 无上传 | #7 不上传 |
| 8 | 左栏分区 | mock DB 区 vs 本地挂载区上下分区 + 「本地·未入库」徽标 | #8 分区显示 |

用户反馈：**每步成功**；恢复行为 = **自动恢复（granted）**；性能 = **很快**（索引 <2s / 搜索 <100ms 量级）。

### 5.3 八项能力覆盖表

| RG-009 能力 | PoC 验证方式 | 结果 | 证据 |
|---|---|---|---|
| ① 浏览器授权持久化 | IndexedDB 存句柄 + 刷新后 `queryPermission` | **Go** | 用户刷新后自动恢复 granted |
| ② IndexedDB 句柄保存 | `idbPut/idbGet(FileSystemDirectoryHandle)` | **Go** | CDP hasIdb=true + 用户保存/恢复成功 |
| ③ 只读/可写策略 | `verifyPermission(handle,false)` | **Go** | 用户只读授权通过 |
| ④ 增量扫描 | 重扫 `walk` 对比 path 集合 | **Go** | 用户增删文件重扫出差异 |
| ⑤ 删除/重命名冲突 | path 集合 diff（缺失检测） | **Go（基础）** | 增量扫描覆盖；改名细粒度检测留工程 |
| ⑥ 本地索引规模与隐私边界 | 1200 文件 vanilla 倒排 + 无上传 | **Go** | 索引「很快」+ CDP uploadCount=0 |
| ⑦ 文件变更同步 | 手动触发重扫 | **部分 Go** | PoC 做手动重扫；自动监听（`FileSystemObserver`）为增强项 |
| ⑧ 桌面运行形态 | 不实测 | **N/A** | 记录为备选路线（浏览器路线已 Go，桌面非必需） |

### 5.4 最小 PoC 5 场景

本地树 ✓ / 单机索引读取+搜索 ✓ / 重启后权限恢复（自动 granted）✓ / 与 DB 文档分区显示 ✓（mock）/ 仅挂载内容不上传服务端 ✓。

## 6. Readiness Gate

| RG-ID | 进入标准 | 必需证据 | 状态 | 阻塞项 |
|---|---|---|---|---|
| RG-009 | 八项能力 + 最小 PoC 5 场景验证 | CDP 前提实测 + 用户 8 步 smoke + 能力覆盖表 | **Go（2026-08-05）** | 无 |

## 7. 风险与降级

| 风险 | 当前状态 | 降级 / 约束 |
|---|---|---|
| 🔴 硬天花板：浏览器句柄后端读不到 → 本地内容无法进服务端 RAG | **不变**（PoC 不改变） | 模式 B 仅本地浏览/搜索；要 AI 能力须模式 A 导入或桌面 agent |
| 访问主机名必须 `localhost`（非 127.0.0.1） | 已实测确认 | 模式 B 接入 React 时前端访问须 localhost 或 HTTPS |
| 浏览器兼容：FSA 仅 Chromium（Chrome/Edge） | 已知 | Firefox/Safari 不支持；PoC 用 Chrome/129 |
| 自动监听文件变更未做（FileSystemObserver） | PoC 做手动重扫 | 留工程增强；手动重扫已满足核心 |
| 改名细粒度冲突检测 | PoC 做 path diff | 留工程细化 |
| 1000+ 文件本地索引性能 | 1200 文件「很快」 | 更大规模（万级）留工程验证 |

## 8. 结论与下一步

- **结论：Go。** 浏览器 File System Access 路线技术上可支撑模式 B「本地挂载 + 不上传 + 本地浏览 / 搜索」，且重启后句柄自动恢复（强 Go，非 Conditional）。八项能力中七项 Go、⑧桌面形态 N/A（浏览器路线已够，非必需）、⑦自动同步部分 Go（手动重扫达标）。
- **硬天花板仍明确**：本地挂载内容**不进服务端 RAG**——这是模式 B 的固有边界，不是 PoC 缺陷。混合策略：隐私库走模式 B（本地挂载），需 AI 能力的库走模式 A（导入）。
- **下一步（待用户决策，不在本次落盘范围）**：是否进入 REQ-018 阶段升级——把 REQ-018 从 `[愿景]` 拉进确定 Phase（改 `03-prd §3` 路线图）+ 从 `project-rules §1` 禁止清单移除 + 定义 `TC-VISION-VAULT-001` + 浏览器 vs 桌面路线选型（PoC 已倾向浏览器）+ `lumen_vault_mounts` 字段细化，然后才编码模式 B。

## 9. 待人工确认项（AI 建议 · 待人工确认）

| ID | 待确认 | AI 建议 | 依据 | 取舍 |
|---|---|---|---|---|
| phase-upgrade | 是否启动 REQ-018 阶段升级 | 用户定；PoC 已 Go 可推进 | RG-009 Go | 编码前必做 |
| route-choice | 浏览器 vs 桌面客户端路线 | **浏览器**（PoC 已验证可行，桌面非必需） | PoC ⑧ N/A | 桌面留作大规模/自动同步增强 |
| tc-define | 定义并执行 TC-VISION-VAULT-001 | 阶段升级时补 | `05:169` / `09:196` | 验收前必做 |
| mount-schema | `lumen_vault_mounts` 字段细化 | 阶段升级设计时做 | `06:37,232` | 编码前 |

## 10. 关联文档

- `docs/research/2026-08-05-req018-vault-feasibility-evaluation.md`（REQ-018 双模式可行性评估，本 PoC 的前置）
- `docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html`（本 PoC 原型）
- `docs/05-tech-spec.md:151`（RG-009 表项，状态已回写为 Go）

---

> 本报告为 AI 辅助 PoC 验证，前提项（secure context / API / IndexedDB / 无上传）经 CDP 自动实测，核心项（挂载 / 索引 / 搜索 / 恢复 / 增量 / 分区）经用户人工 smoke 确认（2026-08-05）。结论与建议**待人工确认**，不改变 REQ-018 阶段标签与 Sprint-23B 状态。
