# REQ-018 Vault 兼容可行性评估（Sprint-23B）

> **定位**：调研记录 / 可行性评估。**AI 辅助分析 · 待人工确认 · 不直接驱动开发。**
> 本报告**不修改任何项目事实**：REQ-018 仍为 `[愿景]`、Sprint-23B 在 `docs/08-dev-plan.md` 仍标记「不得直接作为当前 Phase 编码任务」、`ai/project-rules.md §1` 的 Phase2B 指针不动、`docs/00-09` / `docs/design/` / `docs/vision/` 权威文档未改动。
> **落盘目的**：记录「REQ-018 能否作为下一步实现」的完整评估，供用户后续决策参考。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-08-05 |
| 触发 | 用户质疑 Sprint-23B「不得直接作为当前 Phase 编码任务」是否可松动，要求评估「如果我想用这个功能，是否可下一步实现」 |
| 范围 | REQ-018 Vault 兼容（Sprint-23B / Obsidian Vault 连接器 / 双模式） |
| 依据 | `docs/01/02/03/04/05/06/07/08/09` + `docs/design/ingestion.md` + `docs/design/frontend-interaction.md` + Git（HEAD `b5c40eb` / VERSION `v1.7.2`） |
| 方法 | 规则口径（`global-rules` / `project-rules` / `document-lifecycle-rules`）+ 文档事实采集 + 代码层关键词核查 |
| 性质 | **AI 评估；所有结论与建议均为「待人工确认」，不作为已确认项目事实**。所引文档行号为采集结果，未在本次逐一复核，落地前请按行号回核 |

## 1. REQ-018 现状速览

- REQ-018 = 用户故事 **U-21**（`docs/01-user-requirements.md:54`），**UFlow-010**（`01:85`），挂「愿景场景1」（`01:191` / `docs/vision/product-vision.md:807`），**无 SC-ID**（对比 REQ-039 已补 SC-009，`docs/02-srs.md:145`）。
- 阶段标签 **`[愿景]`**（`02-srs.md:87` / `03-prd.md:140`）；Feature **F-009 存量知识源与交付能力**（`03-prd.md:55`）；Module **MOD-008 存量接入**（`04-architecture.md:108`）；状态「已确认方向 · 待技术验证」。
- **NOGO-002**：Phase1 明确禁入，留 Phase2 / 愿景（`03-prd.md:180`）。
- PR #105（v1.7.1/v1.7.2）已采纳愿景文档：Flow-D-014 / ADR-011 / RG-009 / TCD-011 / `lumen_vault_mounts` 骨架等共 11 处位点（见 `CHANGELOG.md` 顶部 v1.7.1 条目）。
- **代码层核查**：`backend/` / `frontend/` / migration 全目录搜 `vault` / `Vault` / `mount` / `File System Access` / `showDirectoryPicker` / `lumen_vault` → **0 命中**，REQ-018 在代码层**零实体**。

## 2. 核心结论：REQ-018 是「双模式」，成熟度天差地别

ADR-011（`04-architecture.md:136`）/ Flow-D-014（`docs/design/ingestion.md:74-99`）/ TCD-011（`05-tech-spec.md:59`）把 Vault 兼容定义为两条路径，二者成熟度完全不同：

| 模式 | 含义 | 现状 | 合规 |
|---|---|---|---|
| **A 导入数据库** | vault 文件夹 → 分批导入 → 保留目录结构 → 成为 LUMEN 正式文档（参与权限 / 搜索 / RAG / 版本 / 团队共享） | ✅ **链路已交付**（Sprint-22 `preserve_structure` + Sprint-23A 千文件分批 PR #104） | 复用已批准 REQ-037/039，**不碰愿景 / 不触发 Phase 升级** |
| **B 仅本地挂载** | vault 留本地不上传，前端可浏览 / 本地搜索，个人 · 当前设备可见 | ⛔ **零代码**，卡 RG-009 浏览器硬天花板 | 需阶段升级 + RG-009 PoC |

> 这个拆分是本评估的关键：把 REQ-018 当作一个整体去判断「能不能做」，会高估难度——因为模式 A 其实已经在 Phase2B 已完成范围内。

## 3. 模式 A「导入数据库」：已交付，不碰愿景

- **链路就绪**（按已交付 Sprint 记录）：打开 LUMEN → 导入 → 选 Obsidian vault 文件夹（`preserve_structure` 默认开）→ vault 目录树变成 LUMEN folder 树 → 文档进 DB，参与权限 / 搜索 / RAG / 标签 / 链接 / 版本 / 团队共享。
- **合规关键**：模式 A 复用的是 **REQ-037（导入）+ REQ-039（folder-tree）**，二者均属 Phase2B 已完成范围。**它不需要 REQ-018 的 `[愿景]` 身份，不触发阶段升级，不在 `project-rules.md §1` 禁止清单内**——也就是说，用户若诉求是「把 vault 导进来用」，**没有规则障碍，也不需要新开发**。
- **实测状态**：已于 2026-08-05 用 `scripts/smoke-vault-import-demo.py`（DemoRepository 内存，直接调 `import_batch_endpoint` + `create_demo_token`，不起独立服务）跑通合成 vault 导入，结论见 §3.1。
- **非阻塞增量**（产品层，非 RG 阻塞，可选；§3.1 实测已确认前两项为真实缺口）：
  1. **导入后全局 wikilink 重解析**（实测确认：按导入顺序，先导文档引用后导文档 → unresolved 且不回填）；
  2. **前端导入过滤** `.obsidian/`、隐藏文件、非白名单附件（实测确认：前端不过滤，后端白名单拒，用户看到 failed 噪音）；
  3. 「导入 Vault」专用入口（区别于通用文件夹导入，可选）。
  - 量级：数百行前端 + 少量 service 逻辑，不涉及新依赖 / 新 DB 表 / 新对外 API 契约。

### 3.1 实测验证（smoke，2026-08-05）

> 性质：模式 A 可行性 smoke，**非正式 Sprint 验收**；DemoRepository 内存验证，**未起 PG**（向量召回未覆盖）。

**验证方式**：`scripts/smoke-vault-import-demo.py`——替换 `imports_api.repository` 为 `DemoRepository()`，用 `create_demo_token(user_id=1, current_space_id=10)` 造 token，直接调 `imports_api.import_batch_endpoint`（仿 `tests/backend/test_import_api.py`，绕过起服务 / 管理员权限问题）；合成 vault `tmp/test-vault/`（`README.md` 含 `[[概念A]]` + `![[附件/image.png]]`、`笔记/概念A.md`、`笔记/概念B.md`、`附件/image.png`、`.obsidian/app.json`、`draft.txt`）。

**结果**（total=6, success=4, failed=2, skipped=0）：

| 验证项 | 结果 | 证据 |
|---|---|---|
| ✅ .md/.txt 导入 | README / draft / 概念A / 概念B 成功（chunk=1） | smoke items `status=done` |
| ✅ 目录树保留 | `笔记/` folder 自动建（id=1），概念A/B 归入；根文件 folder_id=None | `list_folders(10)` |
| ✅ `.obsidian`/附件被拒 | `app.json` / `image.png` 422 failed（白名单 `{.md,.markdown,.txt}`），不中断整批 | items `status=failed` |
| ⚠️ wikilink 解析但按顺序 unresolved | README 的 outbound link 全 unresolved（target=None）：`[[概念A]]`（概念A 后导入）+ 从 `![[...]]` 提取的 `[[附件/image.png]]`（无此文档）；`replace_document_wikilinks` 不回填先导文档的 unresolved link | `list_doc_links` + `demo_repository.py:420-423` |
| ❌ 搜索（demo 限制） | `search_chunks` 返回 `[]`（内存无向量 / tsvector），需 PG | smoke 0 命中 |

**前端过滤核查**：`frontend/src/api/imports.ts` `postImportBatch` + `app/useImport.ts` `handleImport` 上传链路**均不过滤**文件类型 / 隐藏文件 / 附件 → 用户导整个 vault 会看到 `.obsidian`/附件 failed 噪音（.md 本身不受影响）。

**结论**：模式 A「导入数据库」**核心可用**（导入 + 目录树 + 文档入库），但 Obsidian 两大核心体验有真实缺口——(1) wikilink 交叉引用因导入顺序大量 unresolved 且不回填；(2) `.obsidian`/附件前端不过滤产生 failed 噪音。二者均为**小增量**（复用已批准 REQ-037/039，属体验增强，非 RG 阻塞、非 Phase 升级）。搜索 / RAG 向量召回未在本次验证（demo 限制），PG 路径已有 `smoke-import-pg-performance.py` 覆盖 embedding 写入。

## 4. 模式 B「仅本地挂载」：卡 RG-009，不能直接编码

- **硬天花板（已钉死）**：浏览器 File System Access 句柄只活在浏览器进程，**后端读不到** → 仅本地挂载内容**无法**进服务端 RAG / 全文搜索（`docs/design/ingestion.md:78` / `05-tech-spec.md:151`）。要 RAG 必须：
  - (a) 加本地 agent / 桌面端做服务端可消费的增量索引（桌面运行形态**零设计零代码**）；或
  - (b) 升级到导入数据库（= 回到模式 A）。
- **8 项未验证能力**（`05-tech-spec.md:151` / `08-dev-plan.md:69`）：浏览器授权持久化、IndexedDB 句柄保存、只读 / 可写策略、增量扫描、删除 / 重命名冲突、本地索引规模与隐私边界、文件变更同步、桌面运行形态。
- **未就绪项**：
  - `TC-VISION-VAULT-001` **未定义**（`05-tech-spec.md:169` / `09-verification.md:196`）；
  - 浏览器 vs 桌面客户端路线 **TCD-011 未选型**（`08-dev-plan.md:69` 明列「桌面运行形态未验证」）；
  - `lumen_vault_mounts` 仅骨架、字段待 RG-009 后细化（`06-db-design.md:37,232`）；
  - 暂无稳定服务端 API，导入路径复用 `POST /api/import/batch`（API-029），仅本地挂载默认不上传（`07-api-spec.md:304,332`）。
- **进入产品 Sprint 的完整前置清单**：
  1. **RG-009 PoC 通过**（覆盖 8 项 + 最小 PoC：选 1000+ 文件 vault，展示本地树、单机索引读取 / 搜索、重启后权限恢复或明确失效、与 DB 文档分区显示、仅挂载内容不上传服务端）；
  2. **定义并执行 TC-VISION-VAULT-001**；
  3. **浏览器 vs 桌面客户端技术路线选型**；
  4. **阶段升级决策**：REQ-018 从 `[愿景]` 拉进确定 Phase（改 `03-prd.md §3` 路线图 + `project-rules.md §1` 指针 / 禁止清单）；
  5. **补 SC-ID**（REQ-018 当前仅有「愿景场景1」文字，无 SC 编号）；
  6. **`lumen_vault_mounts` 字段与索引细化**。
- **合规**：REQ-018 `[愿景]` + `project-rules.md §1` 禁止清单（「外部知识源挂载（Obsidian Vault 路径挂载）」）+ `§5.2`（vision / 01 功能点 ≠ 已批准实现）。推进必须先阶段升级（`global-rules.md §8`「升阶段时只改指针 + 在设计文档原位补新阶段要素」）。

## 5. 「是否可下一步实现」的分层答案

- **「不得直接编码」不是死规矩**：对模式 A 它根本不适用（复用已批准 REQ）；对模式 B 它是合理的——RG-009 PoC 未做、硬天花板未绕过，直接编码会撞墙。
- **要 A（导入进来用）**：本周可落地——跑一次真实 vault 导入验证 + 按需加 Obsidian 增量。**不走 Phase 升级，不碰愿景**。
- **要 B（留本地不导入）**：下一步是 **RG-009 PoC**（估 1–2 人日技术验证），用真实 vault 验证浏览器 File System Access 天花板；PoC Go 才谈升 Phase 编码。**须接受硬限制**：仅本地挂载内容做不了服务端 RAG，除非另上桌面 agent（大工程，零设计）。

## 6. 文档依据（关键位点 · AI 采集，落地前按行号回核）

| 主题 | 文档:行 |
|---|---|
| REQ-018 定义 / 阶段标签 | `02-srs.md:87` / `03-prd.md:140` |
| U-21 / UFlow-010 / 场景1（无 SC） | `01-user-requirements.md:54,85,191` / `vision/product-vision.md:807` |
| NOGO-002（Phase1 禁入） | `03-prd.md:180` |
| F-009 / MOD-008 | `03-prd.md:55` / `04-architecture.md:108` |
| ADR-011 双模式决策 | `04-architecture.md:136` |
| Flow-010 / Flow-D-014 | `04-architecture.md:224` / `design/ingestion.md:74-99` |
| RG-009 待验证 + 硬天花板 | `05-tech-spec.md:151` / `design/ingestion.md:78` |
| TCD-011 双入口 | `05-tech-spec.md:59` |
| TC-VISION-VAULT-001 待定义 | `05-tech-spec.md:169` / `09-verification.md:196` |
| `lumen_vault_mounts` 骨架 | `06-db-design.md:37,232` |
| 暂无稳定 API / 复用 API-029 | `07-api-spec.md:304,332` |
| Sprint-23B 不得直接编码 / 前置 / 风险 | `08-dev-plan.md:47,69` |
| Sprint-23A 千文件分批（模式 A 链路） | `08-dev-plan.md:68` |
| 前端双区 PG-P2-002 / CMP-P2-TREE / PATH-P2-008 | `design/frontend-interaction.md:403,417,440` |

## 7. 待人工确认项（AI 建议 · 待人工确认）

| ID | 待确认 | AI 建议 | 依据 | 取舍 |
|---|---|---|---|---|
| vault-mode-choice | 真实诉求是 A（导入用）还是 B（留本地） | 先澄清；若 A 则无需新开发 | 双模式成熟度差异 | 决定下一步路径 |
| mode-a-verify | 是否跑真实 vault 导入验证 A | 跑（链路据 Sprint 记录就绪，未实测） | Sprint-22 / 23A | 非阻塞 |
| obsidian-increment | 是否加 Obsidian 增量（wikilink / 附件 / 入口） | 按需，量级小 | 模式 A 增量 | 可选 |
| rg009-poc | 是否启动 RG-009 PoC（仅 B 需要） | 仅当诉求为 B；先 PoC 再谈编码 | `05:151` / `08:69` | B 的硬前置 |
| phase-upgrade | 是否阶段升级把 REQ-018 拉进近期 Phase | 仅 B 需要；A 不需要 | `global §8` / `project §1` | B 编码前必做 |

## 8. 关联文档

- `docs/research/2026-07-20-obsidian-design-reference-suggestions.md`（Obsidian 设计参考）
- `docs/research/2026-07-21-format-conversion-input-review.md`（格式转换输入评审）
- PR #105 引入的 REQ-018 Vault 兼容愿景文档（`CHANGELOG.md` v1.7.1 / v1.7.2 条目）

---

> 本报告为 AI 辅助可行性评估，所有「现状 / 链路就绪」描述基于文档与 Sprint 完成记录，**未经本次实地验证**；结论与建议均**待人工确认**。报告不修改任何 `00-09` / `design/` / `vision/` 权威文档，不改变 REQ-018 阶段标签与 Sprint-23B 状态。
