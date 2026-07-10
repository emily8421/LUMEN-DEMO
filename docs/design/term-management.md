# 详细设计：术语管理子系统（term-management）

> 对应 REQ-036。总体定位见 04；数据见 06（lumen_terms）；接口见 07（/api/terms）。
> 按「完整骨架 + 阶段增量」：`[P1]` 写最小 Demo 能力，后续能力原位追加。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 设计对象 | 术语管理子系统（MOD-005） |
| 文档路径 | docs/design/term-management.md |
| 输入来源 | 02/03、04 §2、06（lumen_terms）、07（API-012 / API-013） |
| 覆盖 REQ | REQ-036 |
| 所属 Phase | [P1] |
| 交付物形态 | Demo |
| 当前状态 | P1-已实现（Sprint-5 降级实现，Sprint-7/8 后术语存储切 PostgreSQL 且问答口径注入真实 LLM；见 §6） |
| 流程 ID | Flow-D-005（术语维护）/ Flow-D-006（文档术语识别）/ Flow-D-007（问答口径对齐），见 §2 |
| 最后更新 | 2026-07-10 |
| 下游影响 | 08 Sprint-5、09 TC-P1-012 |

## 1. 职责

维护空间级术语表，并在阅读、编辑与 RAG 问答中统一关键术语口径。

## 2. 核心流程（[P1]）

**术语维护（/api/terms）**
1. 用户在当前空间创建术语，填写标准名称、定义、客户习惯用语、负责人和状态。
2. 保存到 `lumen_terms`；`space_id` 非空时为当前空间术语，`space_id` 为空时为全局术语。
3. 同名术语读取时优先返回当前空间术语，再回退全局术语。

**文档术语识别**
1. 打开文档或编辑保存后，按当前空间术语 + 全局术语做轻量匹配。
2. 命中术语时在阅读 / 编辑界面显示悬浮提示，内容包含定义、负责人、状态和客户习惯用语。
3. P1 只做提示，不自动改写正文。

**RAG 问答口径对齐**
1. `/api/query` 收到问题后，按当前空间加载候选术语。
2. 命中问题或候选块中的术语时，将术语定义注入 Prompt 的上下文约束。
3. 回答中优先采用空间术语定义，并在来源中包含术语表引用；无相关文档时仍按 REQ-008 回复未找到，不因术语存在编造答案。

```mermaid
flowchart TB
  edit[术语创建 / 更新] --> terms[(lumen_terms)]
  terms --> recognize[文档阅读 / 编辑轻量匹配]
  recognize --> tooltip[悬浮提示]
  terms --> query[/api/query 加载候选术语]
  query --> inject[术语定义注入 Prompt]
  inject --> answer[RAG 回答优先采用空间定义]
```

## 3. 关键决策（[P1]）

- **空间优先**：空间术语优先级高于同名全局术语，避免客户项目语境被通用定义覆盖。
- **状态不阻断**：`pending` 术语可用于提示，但 UI 需显示待确认状态；P1 不因待确认术语阻断编辑。
- **轻量匹配**：P1 先用术语表字符串匹配，复杂的候选术语发现、冲突检测和聚合视图后续再细化。

## 4. 阶段增量

- `[P1]` 已设计：术语 CRUD、空间优先、文档悬浮提示、RAG 术语上下文注入。
- `[P2]` 待细化：AI 建议术语、术语冲突检测、术语聚合视图与批量核对工作流。
- `[愿景]` 待验证：跨组织术语复用与行业术语库沉淀。

## 5. 与其他子系统交互

- **依赖** docs/design/permissions：术语接口按空间成员权限校验。
- **影响** docs/design/rag-retrieval：构造 Prompt 前注入术语上下文。
- **写** 06 `lumen_terms`。
- **被** 07 `/api/terms`、`/api/query` 调用。

## 6. 实现偏差 / 设计回写

> 对照 `ai/doc-standards/design-doc.md` §4.10。记录 Sprint-5 降级实现与 Sprint-7/8 真实化后的偏差关闭事实。

| 偏差 ID | 代码 / 配置事实 | 原设计 | 偏差类型 | 处理结论 | 回写目标 | 验证 / 证据 |
|---|---|---|---|---|---|---|
| DEV-001 | ~~术语存储在内存 `demo_repository`~~ → **已实现（Sprint-8）**：术语落地 `lumen_terms` 表（PostgreSQL，`PgRepository`） | `lumen_terms` 表（PostgreSQL） | 已实现 | 术语 CRUD 已切 PG 存储；内存 `demo_repository` 仅作单测 fake | 06 lumen_terms、05 RG-001 | TC-P1-012 |
| DEV-002 | ~~问答口径注入不调 LLM~~ → **已实现（Sprint-7）**：术语定义注入 Prompt → 调真实 LLM（GLM-5.2，RG-004 Go） | 术语定义注入 Prompt → LLM | 已实现 | 与 rag-retrieval DEV-002 同源；RAG 已调真实 LLM，术语定义正常注入 | 07 API-010、05 RG-004 | TC-P1-012 |

## 7. 验收追溯

| 设计点 | 关联 REQ | 关联 Sprint | 关联 TC | 验证方式 | 状态 |
|---|---|---|---|---|---|
| 术语 CRUD + 空间优先 | REQ-036 | Sprint-5（+ Sprint-8 PG 存储） | TC-P1-012 | `tests/backend/test_term.py`（PG 真实化见 `test_api_routes.py` / Sprint-8 74 tests） | 条件通过（Demo）；存储已切 PostgreSQL |
| 问答口径对齐 | REQ-036 | Sprint-5（+ Sprint-7 LLM） | TC-P1-012 | `tests/backend/test_rag.py` + GLM-5.2 真实问答验证 | 条件通过（Demo）；LLM 已真实化 |
| Flow-D-005/006/007 | REQ-036 | Sprint-5 / Sprint-7 / Sprint-8 | TC-P1-012 | 见上 | P1-已实现（Demo 口径） |
