# 代码目录逐目录评审报告（2026-08-18）

> **定位**：`docs/research/` 评估报告，非权威规格。评审基准 = `docs/05-tech-spec.md` §4.1.0 五条目录划分依据 + §4.1 目录边界与文件膨胀阈值；学科出处见 `docs/references/software-engineering-basics.md` §0-§3。
> **性质声明**：本文是 **AI 评审结论，待人工确认采纳范围**；改进建议均为"登记为债、不强制当前维护态回改"口径（同 `docs/05-tech-spec.md` §4.2 处理方式）。
> **评审方法**：逐目录实测（文件数 / 行数 / 结构分布），对照依据与阈值判级：✅ 健康 / ⚠️ 注意项（有债但可控）/ ❌ 需处理（无）。

## 0. 总览

| 目录 | 判级 | 一句话结论 |
|---|---|---|
| `backend/` 整体 | ✅ | 四层分层纪律执行好；短板 = 后端阈值无机器门 |
| `backend/api/` | ✅ | 20 域一文件，路由层不含业务，平均 96 行/文件 |
| `backend/service/` | ⚠️ | 6 文件超 250 阈值（最高 export.py 576 行），无 CI 拦截 |
| `backend/model/` | ✅ | entities / orm / schemas / error_codes 四件职责清晰 |
| `backend/repository/` | ⚠️ | 双实现契约守护正确；但 protocol.py 101 方法 god object（已登记 Slice B 未做） |
| `backend/migrations/` | ✅ | 001-018 顺序编号一文件一主题 |
| `frontend/src/features/` | ✅ | 12 域纵切纪律好，local-mount 域为典型样本（11 文件全在域内） |
| `frontend/src/app/` | ⚠️ | hooks + store + local-vault-* 业务模块混居；local-vault 族归属存疑 |
| `frontend/src/api/` | ✅ | client 单出口 + 域文件对齐后端 + 契约派生，教科书级 |
| `frontend/src/styles/` | ✅ | 每视图一 CSS + tokens 单源 + CI 门 |
| `frontend` 缺 `pages/` | ✅ | 合理偏离：无路由库，视图入口在 features/*Feature.tsx，文档已声明 |
| `openapi/` | ✅ | 单源 + 双端派生 + CI drift 校验 |
| `tests/` | ✅ | 38 文件按域命名对齐 service/api；冒烟 19 个在 scripts/（工具链归类自洽） |
| `docker/` | ✅ | dev / prod 两 compose 分离 |
| `scripts/` | ⚠️ 轻微 | 29 文件平铺（校验/冒烟/运行混居），量再涨宜分子目录 |

## 1. backend/ 逐层评审

### 1.1 api/ —— ✅ 健康

- **实测**：20 模块（auth / spaces / documents / search / rag / imports / vault_mounts / admin…），共 1911 行，平均 96 行/文件，无一超 250 阈值。
- **纪律证据**（抽样 `documents.py`）：只做 参数解析 → 调 service → 转 envelope；业务逻辑、SQL、领域计算零出现；错误码经 service 领域异常 → api 统一映射（05 §4.2 契约）。
- **依据对齐**：#2 架构分层——传输层职责纯净。

### 1.2 service/ —— ⚠️ 6 文件超阈值，无机器门

- **实测**：23 模块共 4803 行；超 250 阈值 6 个：export.py **576** / imports.py 336 / auth.py 329 / rag.py 323 / timeline.py 313 / document.py 255。
- **问题**：`docs/05-tech-spec.md` §4.1 阈值表对后端 service/controller 是 250 行提醒，但 **CI 无 ratchet**（`check-frontend-file-size.mjs` 只覆盖 frontend/src）——阈值停留在"文档提醒"，超限无拦截。与前端形成治理不对称。
- **依据对齐**：单一职责（SRP）——超阈值 = 多个变更原因已混居的信号；export.py 超限 2.3 倍最突出（导出编排 + ZIP + 文件名 + 权限混居）。

### 1.3 model/ —— ✅ 健康

- **实测**：entities.py 337（冻结 dataclass）/ orm.py 333（SQLAlchemy，只读写不建表）/ schemas.py 490（Pydantic）/ error_codes.py 96；各司其职，大小合理（schemas 490 承载全部 API DTO，尚未到必须拆域的程度）。

### 1.4 repository/ —— ⚠️ god object 已认账未拆

- **实测**：protocol.py 单 Protocol **101 方法**（`def` 计数，docstring 自述"99 公共方法机器提取"）；pg_repository.py 1681 行 / demo_repository.py 1308 行。
- **做对了的**：双实现（生产 PG / 测试 fake）共享显式 `RepositoryProtocol`，一致性由 `test_repository_contract.py` 机器契约守护——这是 LSP + 契约测试的正确实践，取代了原 duck-typed 人工对照。
- **债**：protocol.py docstring 自己写了「Slice B：按域拆子 Protocol（DocumentRepository / UserRepository 等）收敛 god object」——已登记未执行。101 方法的胖接口违反 ISP：service 层每个模块都被迫"看得见"全部 101 个方法。
- **依据对齐**：#ISP / God Object 反模式；学科出处见 references §3。

### 1.5 migrations/ —— ✅ 健康

- 001-018 顺序编号，一文件一主题（与 06-db-design 追溯）。

## 2. frontend/src/ 逐区评审

### 2.1 features/ —— ✅ 纵切纪律好

- **实测**：12 域；大域已建子目录（local-mount 11 文件：组件 + hooks 全在域内；documents 6 文件；auth 3；admin 1；import 2），小域单文件平铺（TermsFeature.tsx 等），粒度自适应。
- **典型样本**：改"本地挂载"功能（Wave 3 的 observer / mounts / 手动重扫）只动 local-mount/ + app 层接线——纵切生效的实证。
- **依据对齐**：#3 业务特性纵切（CCP：改一个功能只动一个目录）。

### 2.2 app/ —— ⚠️ 三类职责混居

- **实测**：28 个 use*.ts hooks + 7 个 *-store.ts（localStorage 序列化层）+ **6 个 local-vault-*.ts**（fs / idb / index / tree / types / walk——"本地库文件系统"领域模块）+ 3 个 UI 子目录（context-pane / folder-tree / topbar）。
- **债**：local-vault 族是领域逻辑而非应用壳，按 #3 纵切应属 feature（如 features/local-vault/）；放 app/ 是历史原因（早于 features 分层）。跨视图共享不是放错层的充分理由（见 references §3 Conway 一行）。
- **缓解现状**：`useAppState.ts` 339 行 / `useDocuments.ts` 286 行已在 ratchet 基线（`.file-size-baseline.json`），棘轮只拦膨胀不强制回改——治理机制在工作，只是归属问题遗留。

### 2.3 api/ —— ✅ 教科书级

- **实测**：client.ts 113 行单出口（HTTP / 错误镜像 / download 唯一入口）+ 18 域文件与后端 api 层一一对应 + generated.ts 契约派生 + api.ts barrel 零破坏迁移；混合接入（手写类型别名 + codegen union）注释直接写明设计决策与理由。
- **依据对齐**：#4 契约单源——本仓最佳实践区，可作为模板回流素材。

### 2.4 styles/ —— ✅ 健康

- 29 文件每视图一 CSS + tokens.css 单一来源 + `check-frontend-css.mjs` CI 门（零字面色值 / 字阶字重圆角 token 化）。

### 2.5 缺 pages/ —— ✅ 合理偏离

- 模板 `web-fullstack-profile §4` 建议有 pages/；本仓无路由库（05 §4.1 已声明"未经确认不引入路由库"），视图经 useAppState 切换，视图入口 = features/*Feature.tsx。裁剪正当，无需回补。

## 3. 横切目录评审

- **openapi/** ✅：openapi.json 唯一手写源 → 前端 generated.ts 派生 + 后端 response_model 快照，CI schema-diff / codegen drift 双向防漂移。
- **tests/** ✅：tests/backend 38 文件 test_<域>.py 与 service/api 命名对齐；pg_test_support.py 分层（demo 测业务 / PG 测持久化）；冒烟 19 个在 scripts/（生命周期归类，自洽）。
- **docker/** ✅：compose.yml（开发）/ docker-compose.prod.yml（生产）分离；backend/frontend 各自 Dockerfile。
- **scripts/** ⚠️ 轻微：29 文件平铺（check-* / smoke-* / run-* / sync-* 混居）；当前量尚可，翻倍时宜分 check/ smoke/ 子目录。

## 4. 改进建议（待人工确认采纳范围）

> 全部按"登记为债、不强制当前维护态回改"口径；优先级按 ROI 排序。

| # | 建议 | 依据 | 成本 | 优先级 |
|---|---|---|---|---|
| R1 | **后端补 file-size ratchet**：仿 `.file-size-baseline.json` 做后端版（baseline 先登记 6 个超限 service 文件 + pg/demo repository），新文件超限即 CI 失败、存量不得膨胀——把 05 §4.1 后端阈值从文档提醒变机器门 | SRP + 棘轮（references §3） | 小（一个脚本 + baseline JSON + CI step） | **高**（治不对称，防继续劣化） |
| R2 | **repository 按域拆子 Protocol**：protocol.py 已自带方案（Slice B）——拆 DocumentRepository / UserRepository / SearchRepository 等域接口，pg/demo 实现与 contract test 不动，service 侧逐模块迁移注解 | ISP / God Object | 中（接口拆分 + service 逐个迁移，可渐进） | 中（god object 已有契约守护兜底，非紧急） |
| R3 | **local-vault-* 六模块迁 features/local-vault/**（或至少 app/README 注明归属理由与迁移意向） | #3 纵切 / Conway | 小（纯移动 + 改 import，无逻辑变化） | 低（技术债不影响正确性） |
| R4 | **scripts/ 分子目录**（check/ smoke/ run/）——文件数翻倍时执行 | #5 生命周期 | 极小 | 低（现在不动） |

## 5. 结论

- **整体判级：结构健康**。四层分层与特性纵切两条主干纪律执行良好，横切面（契约 / 测试 / 部署）组织正确；无 ❌ 级问题。
- **唯一结构性短板**：前端有 ratchet 而后端没有——治理不对称是 6 个超限 service 文件无人拦截的直接原因（R1）。
- **本报告不改变任何规范**；R1-R4 采纳与否、采纳顺序由用户裁决，裁决后回写 `docs/05-tech-spec.md` §4.2 技术债登记或 `docs/08-dev-plan.md` 立项。

## 6. 评审数据快照（2026-08-18，main `2bd82b3`）

```text
backend/api        20 文件 1911 行（avg 96）    超限 0
backend/service    23 文件 4803 行             超限 6（max export 576）
backend/model       4 文件 1256 行             超限 0（schemas 490）
backend/repository  4 文件 protocol 101 方法    pg 1681 / demo 1308 行
backend/migrations 18 文件
frontend features  12 域（3 子目录 + 单文件混合）
frontend app       28 hooks + 7 store + 6 local-vault-* + 3 UI 子目录
frontend api       1 client + 18 域 + 1 generated + 1 barrel
frontend styles    29 CSS + tokens.css（CI 门）
tests/backend      38 文件；scripts 冒烟 19
scripts            29 文件平铺
```
