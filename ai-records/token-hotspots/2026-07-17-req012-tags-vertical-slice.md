# Token Hotspot Record: REQ-012 Tags Vertical Slice (Task A + api 拆分 + Task B + Task C)

> 本文件是 AI 协作观察材料，不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。

## 元数据

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-17（任务主体执行于 2026-07-16，跨天收尾） |
| 任务主题 | Phase2A 第二个 vertical slice REQ-012 标签视图**全链路**：Task A 后端 + api.ts barrel 拆分 + Task B 前端 + Task C 文档回写（06/07/09），4 commit 均 push |
| 记录性质 | token / 上下文热点观察 |
| 隐私过滤 | 未记录 token、密钥、账号密码、客户敏感数据或完整对话正文；smoke 用 demo 虚构数据（alice / Nova Internal 空间） |

## 热点判断

本轮属于较重 token hotspot（比 2026-07-16 REQ-026 那条更重——那次只覆盖 Task B+C，本会话覆盖 A+拆分+B+C 全链路），原因：

- 从「读取续接点」快速续接升级到完整 vertical slice，完整读取 `ai/index.md` 规则路由 + 编码必读 4 包（`global-rules` / `implementation-lifecycle-rules` / `project-rules` / `commands/run-dev-task`）+ `rules-core`；Task C 文档回写阶段又完整读取 `document-lifecycle-rules.md`（~550 行）。
- **后端参照代码读取量大**：为让 Task A 写对，全链路参照 REQ-026 doc_links 模式——`migrations/007` + `entities.py`(DocLink 段) + `orm.py`(DocLinkORM + Base + import) + 两份 `repository`（demo + pg 的 doc_links 方法 + `_to_doc_link` + class 头部存储结构）+ `service/doc_links.py` + `api/doc_links.py` + `main.py`(注册) + `service/document.py`(get_visible_document) + `service/permission.py` + `tests/test_doc_links.py`。
- **前端代码多轮读**：`App.tsx`（~670 行，分 import / state+effect / handler / render 四段读）、`DocumentsFeature.tsx`（全量）、`TermsFeature.tsx`（布局参照）、`WorkspaceViewNav.tsx`、`panels.css`（全量）、`api.ts`（全量 414 行，为 barrel 拆分）。
- **中间插入 api.ts barrel 拆分**：9 个新域文件 + barrel，额外读 api.ts 全文 + 写 9 文件。
- docs 回写：`docs/06`（表状态）/ `docs/07`（5 处：总览/§3.1.1/说明/service 映射）/ `docs/09`（TC-P2-TAG-001 + API-032 措辞）多处 grep + 精确 Edit。
- 运行验证链：`pytest test_tags`（修 import 后 15/15）+ 全量回归（**25 分钟**，PG+embedding 慢）+ `python init_db` 验迁移 008 + Pg 路径 smoke（自清理）+ `npm run build`（多次）+ 起后端 uvicorn + 前端 vite background + curl sanity + 用户浏览器 smoke。
- 环境插曲：`lumen-pg` 容器曾 Exited 255（用户以为在跑），`docker ps` 诊断 + `docker start` 重启。

## 主要上下文热点

| 类别 | 路径 / 对象 | 热点原因 |
|---|---|---|
| 规则门禁 | `ai/index.md` + `rules-core` + 编码 4 包 | 快速续接→编码强制门禁，必读 |
| 文档规则 | `ai/document-lifecycle-rules.md` | Task C 全读（~550 行），实际只用 §7.1/§8/§9/§10/§11（同 REQ-026 hotspot 已识别） |
| 后端参照（最重） | doc_links 全链路 10+ 文件 | Task A 须按既有模式 1:1 对齐（迁移风格 / entity / ORM / 两份 repository 同接口 / service 权限口径 / api 错误码 / test 模式），逐一核对 |
| 前端代码 | `App.tsx`（分段）、`DocumentsFeature`、`TermsFeature`、`WorkspaceViewNav`、`panels.css`、`api.ts` | App.tsx 大文件分段读；DocumentsFeature 全量读 + 加标签面板；api.ts 全量读为拆分 |
| docs 回写 | `docs/06/07/09` | 多处 grep + 行段读 + 13 处精确 Edit |
| smoke + 环境 | uvicorn:18000 / vite:5173 / lumen-pg / curl | 起服务 + 诊断容器 + sanity，占上下文 |
| 续接记录 | `.ai/session-handoff.md` | 多次重写反映 A/拆分/B/C 进度 |

## 执行命令类别

- Git：`git status --short`、`git log --oneline`、`git add`、`git commit`（4 次：A/拆分/B/C）、`git push`（4 次）。
- 测试 / 验证：`python -m pytest tests/backend/test_tags.py -v`（15/15）、全量回归 `pytest tests/backend/`（99 passed/30 skipped，**~25 min**）、`python init_db` + information_schema 查表（迁 008）、Pg 路径 smoke（自清理）、`npm run build`（tsc+vite，多次）。
- 服务 / 环境：`docker ps`（诊断 Exited 255）、`docker start lumen-pg`、background `uvicorn backend.main:app :18000`、background `npm run dev`（:5173）、`curl` 后端 login + tags + 前端 200 sanity。
- 文档定位：Grep 按关键词 + 行号定位（避免全文件刷入）。
- 文件写入：Edit（精确片段替换）/ Write（新文件 + handoff + 本记录）。

## 质量影响

| 影响 | 说明 |
|---|---|
| 正向 | 规则全读确保合规（任务路由 / 方案确认 / 生成前声明 / 自检 / 状态据实 / 追溯链闭合）；后端参照 doc_links 使 Task A 一次 build + 测试通过（首轮 2 失败仅测试自身漏 import）；浏览器 smoke 捕获 build 检测不到的 CSS 白字缺陷（全局 button 特异性覆盖），修复后 smoke 全过 |
| 成本 | 单会话覆盖 A+拆分+B+C 全链路 + 服务管理，**上下文压力很大，跨天收尾**；后端参照代码读取量是本会话最大单项成本 |
| 风险 | 超长会话接近压缩阈值；已通过 4 次及时 commit/push + handoff + docs 回写把事实落盘，续接成本低 |

## 后续优化建议

1. **vertical slice 全链路拆会话**：本会话 A+拆分+B+C 跨天、上下文压力极大。建议后端（Task A）与前端+文档（Task B/C）**分会话**，或至少 A 单独一会话；handoff 已足够支撑跨会话续接（参照 REQ-026 当时也是分会话推进）。
2. **延续 2026-07-16 hotspot 建议**：`document-lifecycle` 按 §5.0 scope 严格裁剪（文档回写只读 §7.1/§8/§9/§10/§11）；大文件先 `wc -l` + Grep 定位再按需读行段；编码规则包为高频任务提供最小必读速查卡。（本次仍全读了 document-lifecycle，未改进——值得下次落实。）
3. **后端参照模式可沉淀速查**：新 vertical slice 后端"迁移+entity+orm+两份repository+service+api+main+test"这套同构套路在 REQ-026/012 重复两次。可在 `docs/design/` 或 task 模板里固化"Phase2A vertical slice 后端骨架清单 + doc_links 参照锚点"，减少每次全链路重读参照代码。
4. **smoke 服务管理固化**：起 PG + uvicorn + vite + sanity 这套验证流程每次手动跑占上下文。项目已有 `scripts/run-sprint16-demo.ps1`，建议 smoke 时直接用它起服务，减少手动 curl/诊断步骤（本次因容器意外退出额外花了诊断成本）。
5. **前端 button 样式约定**：全局 `button` 是 primary 蓝底白字，自定义 button（如列表项）须显式 `color` + 提高特异性盖住全局，否则白字隐形（build 检测不到）。建议在 `docs/design/frontend-interaction.md` 或 CSS 注释里加一条约定，避免每个 slice 重复踩坑。

## 当前建议续接点

- REQ-012 标签视图 vertical slice 端到端闭环：`1e4cf48`(A) + `3609e28`(api 拆分) + `d07688b`(B) + `62bda1f`(C)，均 push origin/main；TC-P2-TAG-001 通过。
- Phase2A 进度：REQ-026 ✅ + REQ-012 ✅，剩 REQ-025 快速录入（建议新会话）。
- APP-SIZE-C-011：api.ts 已拆；App.tsx ~700 仍超阈值，整体拆分留独立任务。
- 详见 `.ai/session-handoff.md`。
