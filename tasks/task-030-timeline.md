# task-030：主题时间线与密度热条（Sprint-20 · REQ-013a / REQ-024）

## 任务元信息

- 所属 Sprint：Sprint-20（Phase2B · 主题时间线 · 第二 slice）
- 关联 REQ：REQ-013a（主题时间线）、REQ-024（密度热条）
- 关联 TC：TC-P2-TL-001
- 关联 API：API-033 `GET /api/spaces/{id}/timeline`
- 状态：**已完成：后端自动化验证（含全量 discover）+ frontend build + 运行态 API smoke + Edge headless 浏览器 smoke 通过**

## 目标

按已确认的候选 A 实现只读主题时间线：

- 不新建 timeline 事件表，实时聚合 `lumen_documents`、`lumen_tag_links`、`lumen_doc_links` 与 chunk 命中结果。
- 支持关键词 `q`、标签主题入口 `tag_ids`、时间范围、密度热条、actor 与大集合降级标记。
- 仅返回当前用户可见文档事件；`linked` 事件 actor 按 TL-C-011 返回 `null`。

## 修改范围

| 文件 | 变更 |
|---|---|
| `backend/service/timeline.py` | 新增 Candidate A 时间线聚合 service、关键词 / 标签过滤、4 类事件、density、degraded |
| `backend/api/timeline.py` | 新增 API-033 `GET /api/spaces/{space_id}/timeline` |
| `backend/main.py` | 注册 timeline router |
| `backend/repository/demo_repository.py` | 补齐 demo runtime 文档创建 / 更新时间戳，避免 API 新建文档匹配主题但无可展示事件 |
| `backend/migrations/012_timeline_indexes.sql` | 新增 `lumen_documents(space_id, created_at/updated_at)` 时间索引 |
| `tests/backend/test_timeline.py` | 覆盖关键词命中、权限过滤、4 类事件 actor、标签过滤、density/degraded、参数校验 |
| `frontend/src/api/timeline.ts` | 新增 API-033 client 类型与请求封装 |
| `frontend/src/app/useTimeline.ts` | 新增时间线视图状态与加载逻辑 |
| `frontend/src/features/TimelineFeature.tsx` | 新增时间线 UI：关键词、标签入口、密度热条、事件列表 |
| `frontend/src/styles/timeline.css` | 新增时间线视图样式 |
| `frontend/src/App.tsx` / `WorkspaceMain.tsx` / `WorkspaceViewNav.tsx` / `WelcomeFeature.tsx` / `main.tsx` / `api.ts` | 接入时间线导航、首页入口、样式与 API barrel |
| `frontend/src/api/documents.ts` / `frontend/src/app/constants.ts` | 兼容后端实际返回的 `external` 权限字符串 |

## 验证包

- `.venv\Scripts\python.exe -m unittest tests.backend.test_timeline` → **7/7 OK**
- `.venv\Scripts\python.exe -m unittest tests.backend.test_timeline tests.backend.test_document tests.backend.test_tags tests.backend.test_doc_links` → **38/38 OK**
- `.venv\Scripts\python.exe -m unittest discover -s tests/backend` → **190 OK，skipped=2**（embedding 输出既有 torch DLL 权限警告，按 text-only fallback 继续）
- `npm run build`（frontend）→ **通过**（259 modules）
- 运行态 API smoke → **通过**：OpenAPI 暴露 API-033；创建文档 / 标签；关键词 timeline、tag timeline、空 `q` 422 均符合预期。
- Edge headless CDP 浏览器 smoke → **通过**：登录、切换时间线、搜索 `Phoenix`，事件列表命中 `Phoenix Sprint20 Timeline Smoke`，density=1，无错误文本。

## 验收标准

- API-033 支持 `q` / `tag_ids` / `from` / `to` / `density`。
- 关键词命中只在当前用户可见文档集内取子集，标题命中 + chunk 正文命中；PG 路径复用 `search_chunks` 的全文索引召回。
- 事件类型包含 `created` / `updated` / `tagged` / `linked`；actor 规则为 owner / created_by / `null`。
- 密度热条返回 `event_count`、`level`、`ratio` 与 `window`。
- 大集合超过阈值时返回 `degraded=true` 并限制事件列表数量。
- 前端有独立时间线视图，支持关键词、标签筛选、密度热条和打开文档。

## 残留风险 / 未验证

- 大集合阈值按设计草案固化，并由单测覆盖 degraded 逻辑；未做真实 PG 大数据性能实测。
- `linked` actor 仍为 `null`，后续如需全量 actor 需另加 `lumen_doc_links.created_by` migration。
