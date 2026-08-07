# 术语管理「领域树」增强分析报告

> **已确认并实施（2026-08-07）**。本报告承接 `docs/inputs/术语管理补充材料/`（10 份原始输入，公司内部术语管理素材，原为 OA 系统术语模块设计，拟迁移至 LUMEN 知识库）的评审结论，输出术语管理从「平铺列表」升级为「领域树 + 阅读/编辑态分离」的设计分析、数据 / API 契约草案、前端交互建议、实施计划与待确认项。
> 本报告初始为 **AI 评估 · 待人工确认** 草案；**TM-C-001..007 用户 2026-08-07 按推荐确认**，随后完成步 A 后端（migration 017 + API-051..053 + terms 扩字段，298 tests OK）+ 步 B 前端（build 291 modules + 运行时 smoke + 用户浏览器验收通过）。契约已回写 `docs/02/03/06/07/08/09` + `docs/design/term-management.md`（REQ-048 / TC-P2-TERM-001）。

- 日期：2026-08-07
- 状态：**已确认并实施**（领域树方向用户确认；TM-C-001..007 全部确认；步 A 后端 + 步 B 前端已完成 + 用户验收通过）
- 输入来源：`docs/inputs/术语管理补充材料/` 全部 10 份 + 现状核查（Git 事实 / 06 / 07 / 前端代码）
- 复用参考：`docs/design/folder-tree.md`（REQ-039 文档目录树，嵌套树 CRUD 已有成熟实现）
- 关联 REQ：REQ-036（术语管理，现有）+ **REQ-048（术语领域树，2026-08-07 已分配并实现，见 §7）**

---

## 1. 输入材料评审（去 OA 化后）

### 1.1 材料清单与定位

`docs/inputs/术语管理补充材料/` 共 10 份，分三类：

| 类别 | 文件 | 定位 |
|---|---|---|
| 需求 / 规范 | `Lelight-Doc0-术语分类与陈述形式规范`（14 类 + 陈述句式） | 术语内容如何分类、定义如何表述 |
| 需求 / 规范 | `Lelight-DOC0-OA系统优化需求汇总：术语管理模块优化的需求说明` | 术语模块需求（去 OA 化后提取核心） |
| 数据 / 模板 | `研发部术语集 v0.1` / `TPL0 各部门术语收集汇总模板` / `OA平台术语整理` / `W模型开发与测试过程术语集` / `基本概念术语集` / `简明逻辑学` / `系统科学.术语docx` | 已收集的实际术语数据（各部门 / 各主题域） |
| 单术语深论 | `公司"新品"定义讨论稿` | 单个复杂术语的完整定义 + 判定标准 + 分级（S/D/X）+ 生命周期 |

> 用户澄清：**忽略 OA 系统承载的陈述**（如「体创部 / 总经办审核」「部门主管管理二级术语」等组织审批流），只关注**术语管理本身的需求**；迁移目标是 LUMEN 知识库。

### 1.2 提炼的术语管理核心需求（与 OA 无关）

| 需求点 | 来源 | 对 LUMEN 的意义 |
|---|---|---|
| 术语有**归属层级**（公司全局 / 部门特定） | OA 需求「一级 / 二级术语」 | LUMEN 已有 `space_id`（NULL=全局 / 非 NULL=当前空间），**天然两级归属** |
| 术语有**内容分类**（14 类：物体设备 / 操作过程 / 指令命令 / 标识符 / 功能作用 / 协议标准 / 安全机制 / 理论概念 / 状态 / 版本更新 / 数据 / 性能 / 系统 / 文档） | 分类陈述规范 | 需给 `lumen_terms` 加 `category` 字段；14 类可作为**默认候选分类**（不锁死枚举） |
| 每类有**标准陈述句式**（如「X 是指……」） | 分类陈述规范 | 表单编辑时给**句式提示**，提升定义一致性 |
| 术语有**状态流转**（新增→待审核→发布） | OA 需求 | LUMEN 已有 `status`（confirmed / pending），承担「确认/待确认」语义 |
| 术语有**来源追溯**（行业标准 / 公司内部 / 外部文献 / 项目背景） | 各部门术语集表头「术语来源」 | 需给 `lumen_terms` 加 `source` 字段 |
| 术语有**关联部门 / 应用场景 / 备注** | 各部门术语集表头 | 部分与 LUMEN 文档 / 标签体系重叠，**不全部引入**（见 §4 边界） |
| 复杂术语需要**多字段结构化**（判定标准 / 分级 / 生命周期） | 「新品」定义讨论稿 | 属**单术语长文档**能力，非术语目录树范畴；LUMEN 可用文档 + 链接承载，本期不做 |
| 术语按**主题域组织**（研发 / 测试 / 系统科学 / 逻辑学） | 各术语集文件本身就是分主题的 | **这是领域树的直接依据**：每个术语集文件 ≈ 一个领域 |

### 1.3 关键洞察

- 输入材料里**每个术语集文件本身就是一个领域**（W模型测试术语、系统科学、逻辑学、研发嵌入式、Git……）→ **领域树就是这些材料在 LUMEN 里的组织形态**。
- 14 分类规范是「术语**内容怎么写**」的分类，**不是**「术语**怎么组织查找**」的分类（后者是领域树）。两者互补，不冲突：领域树管组织，14 类管陈述规范。
- OA 的「一级 / 二级」是**组织审批树**（公司↔部门），LUMEN 没有公司/部门结构，硬套会得到无根之树。**领域树替代之**。

---

## 2. 现状核查（Git 事实 + 契约）

### 2.1 数据模型

`lumen_terms`（`backend/migrations/004`）：

```sql
CREATE TABLE IF NOT EXISTS lumen_terms (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT REFERENCES lumen_spaces(id) ON DELETE CASCADE,  -- nullable: global term
    term VARCHAR NOT NULL,
    definition TEXT NOT NULL,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner_id BIGINT NOT NULL REFERENCES lumen_users(id),
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending')),
    source_document_id BIGINT REFERENCES lumen_documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (space_id, term)
);
```

**无 `category`、无 `source`、无 `folder_id` / `category_id`**。demo seed 仅 1 条（`触发延迟`，全局，id=1）。

### 2.2 后端契约

- `backend/api/terms.py`：`GET/POST /api/terms` + `GET/PUT/DELETE /api/terms/{id}`；`TermWriteRequest` = term / definition / aliases / status / source_document_id。**无分类、无来源字段**。
- `backend/service/term.py`：`TermWrite` 数据类同 API 字段；`list_visible_terms` / `create_term` / `update_term` / `delete_term` / `get_visible_term`。
- `backend/repository`：`pg_repository.py` 有 `list_terms` / `get_term` / `require_term` / `create_term` / `update_term` / `delete_term`；`demo_repository.py` 有对应 fake。
- `docs/07-api-spec.md`：API-012 / API-013（术语 CRUD，[P1] P1-已实现）。

### 2.3 前端现状

- `frontend/src/features/TermsFeature.tsx`：单栏表单 →（批2b 步1 已改）**双栏**「术语列表 | 术语编辑」，但点击列表直接进编辑态（用户反馈要改阅读态）。
- `frontend/src/app/ContextPane.tsx`：左栏术语 = **平铺 `<ul class="term-list">`**，无层级、无分组。
- `frontend/src/app/useTerms.ts`：`terms` / `selectedTermId` / `termDraft` + `selectTerm` / `newTerm` / `handleSaveTerm` / `handleDeleteTerm` / `reloadTerms`。无分类 / 目录状态。
- 术语样式：批2b 步1 已抽 `frontend/src/styles/terms.css`（`term-workspace-body` / `term-list-pane` / `term-edit-pane` / `term-form-grid`）。
- 左栏文档 folder-tree 复用组件：`frontend/src/app/FolderTree.tsx`（558 行）+ `useFolders.ts`（300 行）+ `styles/`（folder 树样式）。

### 2.4 差距总结

| 维度 | 现状 | 目标（领域树） |
|---|---|---|
| 左栏目录 | 平铺单列表 | 全局固定区 + 空间领域树（可折叠、多级） |
| 术语组织 | 无层级 | 按领域（Domain）树组织 |
| 内容分类 | 无 | `category` 字段（14 类候选，自由输入） |
| 来源追溯 | 无 | `source` 字段 |
| 点击行为 | 直接进编辑表单 | **阅读态**，点「编辑」才进编辑表单 |
| 全局 / 空间 | 靠 `space_id` 隐含 | **显式分区**：全局术语固定区 + 空间领域树 |

---

## 3. 设计决策（已与用户确认方向）

### 3.1 领域树方向（✅ 用户确认 2026-08-07）

- **目录维度 = 内容领域（Domain）**，自定义多级嵌套；**不是** OA 的一级/二级组织树，也**不是** 14 分类作为目录。
- **全局术语放顶部固定区**（系统级口径，少量，仅 admin 可改）；**当前空间领域树**为主区。
- **demo 先做粗粒度 3-4 个领域**（如：研发与开发流程 / 软件测试验证 / 系统与理论 / 通信与硬件），术语直接挂领域下；多级嵌套能力保留（后端支持，UI 懒加载）。

### 3.2 阅读态 / 编辑态分离（✅ 用户确认 2026-08-07）

- 点击左栏 / 主区术语 → 右栏显示**阅读态**：术语名 + 状态徽标 + 领域 + 分类 + 来源 + 定义 + 别名 + 应用场景。
- 点「编辑」→ 切**编辑表单**（现有表单 + 新增领域下拉 / 分类 / 来源字段）。
- 点「新建」→ 直接进编辑态空表单。

### 3.3 数据模型（草案，待确认）

给 `lumen_terms` 加 **2 个可空字段**（migration 017）：
- `category VARCHAR`（可空）——内容分类（14 类候选，允许自由输入，demo 不锁枚举）
- `source VARCHAR`（可空）——术语来源（行业标准 / 公司内部 / 外部文献 / 项目背景）

新建 **`lumen_term_categories` 表**（领域树，仿 `lumen_folders`）：

```sql
CREATE TABLE IF NOT EXISTS lumen_term_categories (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES lumen_term_categories(id),   -- nullable: root
    name VARCHAR NOT NULL,
    order_idx INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (space_id, parent_id, name)
);
CREATE INDEX IF NOT EXISTS idx_lumen_term_categories_space_parent
    ON lumen_term_categories (space_id, parent_id);
```

`lumen_terms` 加 `category_id BIGINT REFERENCES lumen_term_categories(id)`（可空=未分类）。字段契约权威以 `06` 为准（本次不入 06，待确认）。

> **不做** `parent_id` 无限术语树（术语本身不入树嵌套，只挂在领域叶子下）；领域树自身才多级嵌套。

### 3.4 API 契约（草案，待确认）

| API-ID（候选） | 方法 | 路径 | 说明 |
|---|---|---|---|
| API-0xx | GET | `/api/term-categories` | 领域树查询（`?parent_id=` 懒加载，复用 folder-tree 口径；Demo 量级可整树递归 CTE） |
| API-0xx | POST | `/api/term-categories` | 新建领域（`parent_id` 可空=根） |
| API-0xx | PATCH/DELETE | `/api/term-categories/{id}` | 改名 / 移动（防环）/ 删除（非空→4090） |
| API-0xx | POST | `/api/term-categories/reorder` | 排序（复用 folder 模式） |
| API-012 / API-013 扩展 | GET/POST /api/terms、PUT /api/terms/{id} | 请求 / 响应加 `category_id` / `category` / `source` |

权限：空间成员（复用 `_ensure_space_member` 模式）；领域树不独立设权限，术语可见性仍按现有 space 过滤。

### 3.5 前端交互（草案）

**左栏（ContextPane 术语区）**：

```
▾ 全局术语（固定区，系统级）
   触发延迟
▾ 当前空间领域（树）
   ▾ 研发与开发流程
       需求分析 · 总体设计 · 物模型
   ▾ 软件测试验证
       ▸ 单元测试
       ▸ 集成测试
   ▸ 系统与理论
```

- 全局区固定顶部（不可折叠删除），仅 admin 可改。
- 空间领域树可折叠 / 展开 / 新建领域 / 重命名 / 排序（复用 folder-tree 交互，`FolderTree` 组件泛化或新建 `TermCategoryTree`）。
- 点击领域 = 筛选该领域下术语；点击术语叶子 = 选中（右栏阅读态）。

**主区（TermsFeature）**：
- 状态：`view`（阅读）↔ `edit`（编辑）。点术语 → 阅读态；点「编辑」/「新建」→ 编辑态。
- 阅读态：术语名 + 徽标（状态 / 全局/空间 / 领域 / 分类）+ 定义 + 别名 + 来源 + 应用场景 + 操作按钮（编辑 / 删除）。
- 编辑态：现有表单 + 领域下拉（挂到树上哪个节点）+ 分类 + 来源 + 应用场景字段。

---

## 4. 边界与裁剪

| 不做（本期） | 原因 |
|---|---|
| OA 组织审批流（体创部 / 总经办审核） | 用户明确去 OA 化；LUMEN 用 `status`（pending/confirmed）承担确认语义 |
| 术语本身入无限 parent 树 | 领域树已满足组织需求；术语只挂领域叶子 |
| 单术语长文档（如「新品」判定标准 / S/D/X 分级） | 属文档 + 链接能力，非目录树范畴；可用现有文档承载 |
| 关联部门 / 应用场景 / 备注字段全量引入 | 与 LUMEN 文档 / 标签体系重叠；只加 `source`（来源追溯高频）+ `category`（分类）；应用场景可后续加 |
| 术语导入（10 份材料批量入库） | 独立后续任务，本期不做（见 §6 后续） |

---

## 5. 复用评估（folder-tree → 领域树）

| 复用面 | folder-tree（REQ-039） | 领域树（本期） | 复用方式 |
|---|---|---|---|
| 后端树 CRUD | `service/folder.py`（list/create/update/delete/reorder + 防环） | `service/term_category.py` | 复制模式改表名（独立模块，不共用 folder） |
| 后端 repository | `pg_repository.py` `list_folders`..`reorder_folders` | `list_term_categories`.. | 复制模式 |
| 前端树组件 | `FolderTree.tsx`（558 行） | `TermCategoryTree.tsx` | 泛化或新建（术语叶子渲染与文档不同） |
| 前端状态 | `useFolders.ts`（300 行） | `useTermCategories.ts` | 复制模式 |
| 懒加载口径 | `GET /folders?parent_id=` 递归 CTE | 同口径 | 复用 |

**结论**：后端 / repository / 前端 hook 高度可复用 folder-tree 模式（改表名 + 字段），但**必须独立模块**（folder 绑定文档，术语树绑定术语，不共用表）。工作量主要为「复制 + 适配 + 前端树组件泛化 + 阅读/编辑态改造」。

---

## 6. 实施计划（草案，待 REQ 归属确认后进 08）

> 拆两步降风险（沿用批2b 分步验收节奏）：**步 A 后端 + 契约 → 步 B 前端 + 验收**。

### 步 A：后端（migration + 领域树 API + terms 扩字段）

| 项 | 内容 |
|---|---|
| 修改范围 | `backend/migrations/017_*.sql`（新）· `backend/model/orm.py`（`TermCategoryORM` + `TermORM.category_id`）· `backend/model/entities.py`（`TermCategory` + `Term.category_id/source`）· `backend/service/term_category.py`（新，仿 folder.py）· `backend/service/term.py`（扩字段）· `backend/api/term_categories.py`（新）+ `backend/api/terms.py`（扩字段）· `backend/repository/pg_repository.py` + `demo_repository.py`（树方法 + term 扩字段） |
| 验证 | `tests/backend/test_term_category.py`（新，仿 test_folder）+ `test_term.py` 扩字段回归 + 后端全量 discover |
| 禁止 | 不建 folder 共用表；不改文档 folder 逻辑；不引新依赖 |

### 步 B：前端 + 验收

| 项 | 内容 |
|---|---|
| 修改范围 | `frontend/src/api/terms.ts`（类型 + category/source）+ `api/term_categories.ts`（新）· `frontend/src/app/useTerms.ts`（+categories + 阅读态 state）· `frontend/src/app/useTermCategories.ts`（新）· `frontend/src/features/TermsFeature.tsx`（阅读/编辑态分离 + 领域下拉 + 分类/来源字段）· `frontend/src/app/ContextPane.tsx`（左栏全局区 + 领域树）· `frontend/src/app/WorkspaceMain.tsx`（透传）· `frontend/src/styles/terms.css`（树 + 阅读态）· `main.tsx`（import） |
| 验证 | `npm run build`（tsc + vite）+ 浏览器验收（左栏树 / 阅读态 / 编辑态 / 分类字段 / 窄屏） |
| 禁止 | 不改文档 folder-tree；不新增依赖 |

### 后续（非本期）
- 术语批量导入（把 10 份材料入库为 demo 数据，3-4 个领域）。
- 领域树拖拽排序 UI（首版可只做 inline 新建 / 重命名 / 折叠）。

---

## 7. 待人工确认项（TM-C-001..007 已确认 2026-08-07）

> **全部按 AI 推荐确认**，并已实施 + 验收通过。确认结论回填见 `docs/02/03/06/07/08/09` 与 `docs/design/term-management.md`。

| ID | 待确认项 | AI 建议 | 确认结论 |
|---|---|---|---|
| TM-C-001 ✅ | 领域树 REQ 归属 | **REQ-036 增强**（新增 REQ-048） | **REQ-048 已分配**（02/03 收录），归属维护态增强 |
| TM-C-002 ✅ | 数据模型是否动后端 | **动后端**（migration 017 + 3 字段 + 领域树表 + API） | **migration 017 已落地**（真 PG 应用验证）；API-051..053 + terms 扩字段 |
| TM-C-003 ✅ | demo 领域粒度 | **粗粒度 3-4 个领域** | 已按粗粒度实现（领域树支持多级，demo 用 3-4 个） |
| TM-C-004 ✅ | `category` 是否锁枚举 | **不锁**（14 类作 datalist 候选） | 已实现自由输入 + datalist 候选 |
| TM-C-005 ✅ | 是否引入 `source` / 应用场景 | **加 `source`**；不加应用场景 | `source` 字段已落地；应用场景留后续 |
| TM-C-006 ✅ | 术语是否支持多级子目录 | **不做**，术语挂领域叶子 | 已按「术语挂领域叶子」实现 |
| TM-C-007 ✅ | 与批2b 未提交批次的关系 | 领域树独立成批，不混入 | 批2c 独立成批；批2b 步2 标签 CRUD 已独立接线；ui-batch-归属整批提交策略仍待拍板 |

---

## 8. 工作量评估

| 维度 | 规模 | 说明 |
|---|---|---|
| 后端 | 中 | migration + 1 新 service + 1 新 api + terms 扩字段 + repository 复制模式 |
| 前端 | 中偏大 | 左栏树（复用 folder 模式）+ 阅读/编辑态 + 领域下拉 + 字段扩展 |
| 测试 | 中 | test_term_category（新）+ test_term 回归 + build + 浏览器验收 |
| 总量 | **独立 Sprint（可拆 2 task）** | 先落本报告 + 实施计划；编码后续独立进行 |

---

## 9. 结论

领域树方向正确且贴合输入材料（每个术语集文件≈一个领域），与 folder-tree 高度可复用，规模可控（独立 Sprint）。**已确认并实施**：TM-C-001..007 全部确认 → 步 A 后端（migration 017 + API-051..053 + terms 扩字段，298 tests OK + 真 PG 应用）+ 步 B 前端（build 291 modules + 运行时 smoke + 用户浏览器验收通过，含 3 轮反馈迭代）→ 契约回写 02/03/06/07/08/09 + `docs/design/term-management.md`（REQ-048 / TC-P2-TERM-001）。批2b 步2 标签 CRUD 前端接线（API-027）同批验收通过。整批提交 + bump 待 ui-batch-归属拍板。
