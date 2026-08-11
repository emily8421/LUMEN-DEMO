# 02 需求规格说明（SRS）

> 基于 00/01，明确"系统必须实现什么"，逐条编号可追溯。
> `[P1]` REQ 写清可验证验收口径；`[P2]` / `[愿景]` 写粗粒度并标"待该阶段细化"（global-rules §8）。
> 验证用例见 `docs/09-verification.md`（REQ → 用例追溯）。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 输入来源 | `docs/00-scenario.md`、`docs/01-user-requirements.md` |
| 覆盖 U-ID | U-01..U-44（按阶段标签区分 P1 / P1.5 / P2 / 愿景） |
| 交付物形态 | Phase1 = **Demo**；Phase1.5A = **个人可用 Alpha**；Phase1.5B = **个人增强 Beta**；Phase2A = **个人知识组织**；Phase2B 为团队 MVP（与 `docs/03-prd.md §3` 一致） |
| 当前状态 | 已确认（P1 可验证；Phase1.5A REQ-037/038 已实现并通过 TC-P1-015/016；Phase1.5B REQ-027 PDF 导出已实现并通过 TC-P1-017；Phase2A REQ-012/025/026 已实现并通过 TC-P2-TAG/QUICK/LINK-001；REQ-009/010 按 Phase1 Demo 降级口径验收；**Phase2B 第三 slice REQ-039 文档目录树已实现基础能力并补浏览器自动化 smoke**；Phase1.5B 其余候选 / Phase2B / 愿景待对应阶段细化） |
| 最后更新 | 2026-08-04（Sprint-18 单文档 PDF 导出闭环：REQ-027 / API-019 / TC-P1-017 通过） |

## 0.1 非功能需求 / 约束 / 异常

> 本节为 P1 回梳新增（对照 `ai/doc-standards/02-srs.md §2`）。LUMEN 作为 Lean 剖面 Demo，NFR / 约束 / 异常不在本文重述，委托如下权威源承载：

- **非功能需求（性能 / 资源 / 可用性）**：见 `docs/05-tech-spec.md §5` 运行环境与资源评估（Demo 资源软上限、降级 / Mock 策略、Readiness Gate）与 `ai/project-rules.md §2.1`。
- **技术约束 / 选型禁令**：见 `ai/project-rules.md` §1（Phase 边界）、§2（技术栈约束）。
- **运行环境约束**：见 `docs/env/local-env.md` 与 `ai/project-rules.md §2.1`。
- **异常场景**：REQ 级异常（库外问答「未找到」、权限拒绝 403 等）见各 REQ 验收口径与 `docs/09-verification.md`；错误码见 `docs/07-api-spec.md §1`。

### 0.1.1 非功能需求（NFR）

| NFR-ID | 类型 | 需求描述 | 来源 | 验证方式 | 状态 |
|---|---|---|---|---|---|
| NFR-001 | 权限 / 隔离 | 空间、成员和文档权限必须约束搜索、问答、文档读取与编辑 | SCB-003、REQ-001..003 | TC-P1-001..003、权限相关后端测试 | P1-已验证（Demo） |
| NFR-002 | 可追溯性 | RAG 答案必须带来源；库外问题明确未找到，不编造 | SCB-004、REQ-008 | TC-P1-008、RAG 相关验收 | P1-已验证（Demo） |
| NFR-003 | 资源约束 | Phase1 Demo 在本机资源软上限内运行，重资源能力按门禁降级 | `ai/project-rules.md` §2.1、`docs/05-tech-spec.md` §5 | 资源 / readiness gate 记录，`docs/09-verification.md` §6 | P1-条件通过 |
| NFR-004 | 数据安全 | 真实文档导入需显式标注来源 / 敏感级别，优先避免发送到外部模型 | `ai/project-rules.md` §2.1 | 人工验收与后续真实导入任务检查 | 后续阶段待细化 |
| NFR-005 | 测试数据库安全 | PG 集成测试必须在独立 `lumen_test` 库执行，破坏性操作（TRUNCATE）受三重 fail-closed guard 保护，不得误清开发库 | `ai/project-rules.md` §2.1/§5、`docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1 | TC-P2-GOV-001、`tests/backend/test_pg_test_support.py` | 维护态批6·已实现（2026-08-11，PR #124） |
| NFR-006 | CI 最小回归门 | CI 必须跑后端 unit 测试 + 前端 build + 后端 lint，防止坏代码无回归保护混入 main | `docs/05-tech-spec.md` §4.2.4、rollout plan §3 P0-2 | TC-P2-GOV-002、`.github/workflows/project-check.yml` | 维护态批6·已实现（2026-08-11，PR #124） |
| NFR-007 | 错误响应契约 | 错误响应遵守统一契约：业务码 `code` 单一含义（不与 HTTP 码混用）、未捕获异常有兜底 envelope、`msg` 用固定用户文案禁 `str(exc)` 直传泄露内部细节 | `docs/05-tech-spec.md` §4.2.1、rollout plan §4 轨道3、assessment CQ-P1-005 | TC-P2-GOV-003、`backend/model/error_codes.py`、`tests/backend/test_error_contract.py` | 维护态批7·已实现（2026-08-11，PR #125） |

### 0.1.2 约束与假设（CON）

| CON-ID | 类型 | 内容 | 状态 | 影响范围 |
|---|---|---|---|---|
| CON-001 | 技术栈 | Phase1 使用 FastAPI、PostgreSQL + pgvector、OpenAI 兼容 LLM、本机 `bge-small-zh`、React | 已确认 | `04-09`、代码实现 |
| CON-002 | Phase 边界 | Phase1 是 Demo，不等同 MVP；禁止提前实现 Phase2 / 愿景能力 | 已确认 | `03` 路线图、`08` Sprint 禁止事项 |
| CON-003 | 导入降级 | Phase1 只把 `.md` / `.txt` 或已提取文本作为必过导入路径 | 已确认 | REQ-009 / REQ-010、TC-P1-009 / 010 |
| CON-004 | 搜索增强 | zhparser 是可选增强；镜像无扩展时回退 `simple`，语义召回仍由 pgvector 支撑 | 已确认 | REQ-007、`05/06/09` search 状态 |
| CON-005 | P1.5 个人可用优先 | P1.5A 以批量入库 + 导出备份为退出门槛；PDF、真实 Word/PDF 解析、标签 / 内链不阻塞 Alpha | 已确认 | REQ-037 / 038 / 027、TC-P1-015..017 |

### 0.1.3 边界条件与异常场景（EX）

| EX-ID | 关联 REQ | 条件 | 期望行为 | 验证提示 |
|---|---|---|---|---|
| EX-001 | REQ-001 / REQ-003 | 用户访问非所属空间或无权限文档 | 返回空结果或权限拒绝，不泄露标题、摘要和问答引用 | TC-P1-001 / 003 |
| EX-002 | REQ-008 | 无相关知识库内容 | 明确回复未找到，不编造 | TC-P1-008 |
| EX-003 | REQ-009 | 空文件、不支持文件或非 UTF-8 文本 | 返回可理解错误，不生成脏文档 | 导入服务测试 / 后续补充 |
| EX-004 | REQ-010 | 用户上传真实图片 / 白板照片 | Phase1 不承诺真实 OCR；需提示后续阶段或使用已提取文本 | TC-P1-010 状态为后续阶段 |
| EX-005 | REQ-007 | 无关键词重叠但语义相关 | 可通过向量召回返回正确文档；无权限文档仍不可见 | TC-P1-007 |
| EX-006 | REQ-037 | 批量导入中部分文件失败、不支持格式或同名冲突 | 成功项保留并入库；失败项逐条提示；同名默认跳过并提示，不静默覆盖 | TC-P1-015 |
| EX-007 | REQ-038 | 空间导出 ZIP 时包含不可见文档 | 不可见文档不得进入 ZIP，导出结果只包含当前用户可见文档 | TC-P1-016 |
| EX-008 | REQ-027 | PDF 导出库未安装、中文字体缺失或导出任务失败 | 返回依赖不可用 / 导出失败状态，不生成坏文件；Sprint-18 已覆盖 5030 失败态 | TC-P1-017、RG-006 |

## 1. 功能需求（REQ 主表，覆盖 REQ-001..047；REQ-043/044 为 REQ-001/002/003 的 Sprint-27 扩展，REQ-045..047 为 Sprint-28 扩展）

| REQ-ID | 系统需求 | 来源 U-ID | 可验证口径 | 初步阶段 | 状态 |
|---|---|---|---|---|---|
| REQ-001 | 用户仅能访问其所属空间的文档；查询 / 检索 / 问答不得返回其他空间内容 | U-01 | brightlite-team 账号查询 nova-internal 文档零命中 | [P1] | P1-已验证（Demo） |
| REQ-002 | 同一账号可在所属多个空间间切换，切换后上下文随之变更 | U-02 | 切换后首页 / 搜索 / 问答均只反映目标空间 | [P1] | P1-已验证（Demo） |
| REQ-003 | 文档可设私有 / 团队共享 / 外部只读；私有仅作者可见，不进入他人检索 / 问答 | U-03 / U-12 | 作者私有文档，同空间其他成员搜索不到、问答不引用 | [P1] | P1-已验证（Demo） |
| REQ-004 | 可创建 / 读取 / 更新 / 删除 Markdown 文档 | U-04 | 四项操作均成功，删除后不可检索 | [P1] | P1-已验证（Demo） |
| REQ-005 | 可在编辑器内对文档行内编辑并保存 | U-05 | 编辑保存后内容持久化，再打开内容一致 | [P1] | P1-已验证（Demo） |
| REQ-006 | 每次保存生成版本，可查看历史版本与差异、可恢复 | U-06 | 改 3 次后能看到 3 个历史版本，能恢复到指定版本 | [P1] | P1-已验证（Demo） |
| REQ-007 | 按关键词或语义相关查询返回当前空间可见文档，结果含标题 / 摘要 / 定位；语义召回基于已生成 embedding，zhparser 为可选增强 | U-07 | 搜索已知关键词或语义相近问题能返回正确文档；不得返回无权限文档 | [P1] | P1-已验证（hybrid） |
| REQ-008 | 基于当前空间可见文档回答，答案标注来源文档；无相关内容时明确告知而非编造 | U-08 | 文档内事实答对且标来源；文档外内容回复未找到 | [P1] | P1-已验证（Demo） |
| REQ-009 | 支持 `.md` / `.txt` 已提取文本导入，生成文档入库并参与检索 / 问答；真实 `.docx / .pdf` 解析留后续真实化 | U-09 | 导入 `.md` / `.txt` 已提取文本后能搜到、问答能引用；真实 Word / PDF 解析不作为 Phase1 必过 | [P1] | P1-条件通过（降级） |
| REQ-010 | 以 OCR 预提取文本或人工已提取文本替代真实图片 / 白板 OCR；真实 OCR 留后续阶段 | U-10 | 已提取文本导入后能搜到对应文字；真实 OCR 引擎、图片上传识别不作为 Phase1 必过 | [P1] | 后续阶段（P1 降级移出必过） |
| REQ-011 | Chrome / Edge 桌面端可用全部 P1 功能 | U-11 | 桌面浏览器完成上述全部操作无阻断 | [P1] | P1-条件通过（Demo） |
| REQ-036 | 每个空间可维护术语条目，阅读 / 编辑时识别已定义术语，问答时优先采用当前空间术语定义并引用术语来源 | U-42 | 新建「触发延迟」术语后问答优先使用该空间定义，同名全局术语不覆盖空间术语 | [P1] | P1-条件通过（Demo） |
| REQ-048 | 术语领域树（REQ-036 增强）：空间术语按内容领域树组织（`lumen_term_categories` 嵌套领域，全局术语顶部固定区）；术语挂领域叶子 + 内容分类（category）+ 来源追溯（source）；领域树 CRUD / 移动 / 排序 / 删非空拒绝 | U-42 扩展 | 空间内可建「研发与开发流程」等领域，术语挂到领域下并按分类/来源归档；全局术语固定区只读 | [P1] | 维护态增强·已实现（2026-08-07，migration 017，API-051..053） |
| REQ-037 | 批量 / 文件夹导入（`.md`/`.txt`）：drop zone + 多文件 + 文件夹拖拽（`webkitdirectory`）批量入库；标题用相对路径前缀保留目录感；批量进度 + 同名跳过 | U-09 扩展 | 拖入文件夹后所有 `.md`/`.txt` 入库可搜可问答，标题保留路径前缀（**Phase2B folder-tree 扩展**：`preserve_structure=true` 保留真实目录结构建 folder，见 REQ-039） | [P1] | P1.5A-已实现（TC-P1-015 通过） |
| REQ-038 | 文档 / 空间导出：单文档下载 `.md`；空间打包 ZIP 导出所有可见文档 `.md`（权限过滤） | U-43 | 文档详情可下载 `.md`；空间导出 ZIP 含可见文档 | [P1] | P1.5A-已实现（TC-P1-016 通过） |
| REQ-012 | 标签视图：扁平标签（空间隔离；name + color + description + active/archived）跨目录聚合同标签文档；文档详情打标签 / 移除；标签视图列标签 + 可见文档数，点标签看该标签下可见文档；单标签筛选；document_count 只统计当前用户可见文档 | U-13 | Phase2A 最小版：扁平标签、独立标签视图、单标签筛选、文档详情面板打标签；不做层级 / 组合筛选 / AI 自动打标签（link_source 预留 manual 外的值但不实现） | [P2] | P2-已实现（TC-P2-TAG-001 通过） |
| REQ-013 | **主题时间线（REQ-013a·按关键词/标签生成事件时间线）+ 关联图视图（REQ-013b）** | U-14 / U-15 | **REQ-013a（主题时间线，U-14）Phase2B 第二 slice·已实现并补齐验证**：关键词/标签驱动（API-033 `q`/`tag_ids`），候选 A 实时聚合 + 标题 ILIKE / chunk.ts_vector 命中 + actor（linked=null）+ 密度热条（含量化 ratio）+ 列表逃生舱（PG-P2-008）；不传 `q`=空间总览。**REQ-013b（关联图，U-15）愿景**，待主题时间线试用反馈后评估（见 `docs/design/timeline.md` §9 重定位） | [P2] | REQ-013a Phase2B·已实现并补齐验证（TC-P2-TL-001 自动化、运行态 API smoke、Edge headless 浏览器 smoke、真实 PG 大数据性能 smoke 已通过）；REQ-013b 愿景骨架 |
| REQ-014 | AI 润色 + 写作侧边栏引用 | U-16 / U-17 | 待该阶段细化（触发方式、引用块格式） | [P2] | 骨架 |
| REQ-015 | 跨空间文档推送 | U-18 | 待该阶段细化（只读副本模型、权限同步） | [P2] | 骨架 |
| REQ-016 | 多人协作 | U-19 | 待该阶段细化（并发模型、冲突处理） | [P2] | 骨架 |
| REQ-017 | 跨设备 / 移动端 | U-20 | 待该阶段细化（响应式范围、VPN 接入） | [P2] | 骨架 |
| REQ-024 | 时间轴密度热条 | U-30 | Phase2B 第二 slice·已实现并补齐验证：4 档色阶（0 无 / 1 低 / 2 中 / 3 高）**+ 量化 ratio（相对均值倍数）**；密度按事件数 + 渲染去重；日窗口（>180 天切周）；**传 `q` 时反映主题活跃节奏** *(v18)* | [P2] | Phase2B·已实现并补齐验证（TC-P2-TL-001 自动化、运行态 API smoke、Edge headless 浏览器 smoke、真实 PG 大数据性能 smoke 已通过） |
| REQ-025 | 快速录入索引条目 | U-31 | 30s 录标题/来源/摘要；mode=draft 保留私有草稿、create_document 转新私有文档、append_document 追加到已有文档；可关联 tag_ids；draft 可丢弃 *(v18)* | [P2] | P2-已实现（TC-P2-QUICK-001 通过） |
| REQ-026 | 内部链接 + 反向链接 | U-32 | Phase2A 最小版：`[[文件名]]` 解析、resolved / unresolved / no_access 状态、出链 / 反链查询与权限过滤 | [P2] | P2-已实现（TC-P2-LINK-001 通过） |
| REQ-039 | 文档目录树：空间内嵌套文件夹（CRUD / 移动 / 排序）组织文档；导入保留真实目录结构（扩展 REQ-037）；folder 不独立设权限（继承空间，文档可见性仍看 permission） | **U-44** | Phase2B 第三 slice 候选：建 / 移动 / 排序文件夹后文档归属正确；导入文件夹后目录结构保留；防环 / 跨空间 / 重名 / 删非空 folder 拒绝 | [P2] | P2-已实现（folder-tree，TC-P2-FOLDER-001 通过；9a1b479 全链路 + 浏览器 smoke，2026-08-05 验收） |
| REQ-027 | 单文档导出 PDF（Markdown → PDF，含中文排版） | U-33 | ReportLab 首版：基础 Markdown 子集（标题 / 段落 / 列表 / 表格 / 引用）+ 页眉页脚 + 中文字体；导出任务绑定版本，产物继承权限，依赖不可用返回 5030 | [P1] | P1.5B-已实现（Sprint-18 / TC-P1-017 通过，从 Phase2 提前） |
| REQ-018 | Obsidian Vault 兼容：同一文件夹来源可选择“导入数据库”或“仅本地挂载”；导入后成为 LUMEN 正式文档并参与权限 / 搜索 / RAG；仅挂载内容保持个人 / 当前设备可见，不默认进入团队空间、后端 RAG 或共享权限链 | U-21 | Phase2C·模式 B 浏览器 MVP：File System Access 授权+刷新恢复 / IndexedDB 本地索引搜索 / 左侧分区 / 不上传（RG-009 已验证 5 场景 + 8 能力）；模式 A 导入数据库已随 Phase2B 交付 | [P2] | Phase2C·已设计（RG-009 Go 2026-08-05） |
| REQ-019 | 录音转文字 + 摘要 | U-22 | 待技术验证（转写引擎、摘要质量） | [愿景] | 骨架 |
| REQ-020 | 问题热力矩阵 | U-23 | 高风险待验证（需稳定文档分类，数据来源未定） | [愿景] | 骨架 |
| REQ-021 | 事件因果展开 | U-24 | 高风险待验证（跨文档因果推理，RAG 难以可靠实现） | [愿景] | 骨架 |
| REQ-022 | 对外只读简报 | U-25 | 待技术验证（临时链接、可问 AI 不可看原文的隔离） | [愿景] | 骨架 |
| REQ-023 | 文档包生成 / AI 管理层摘要 / 气泡图谱导航 / 跨组织知识复用 | U-26..U-29 | 待技术验证（升阶段前需拆分为独立 REQ） | [愿景] | 骨架 |
| REQ-028 | 飞书自动同步 | U-34 | 待技术验证（飞书 API、webhook、只同步摘要策略） *(v18)* | [愿景] | 骨架 |
| REQ-029 | 多视角联动闭环 | U-35 | 待技术验证（关联图↔时间轴↔因果的视图状态保持） *(v18)* | [愿景] | 骨架 |
| REQ-030 | 路径推理 | U-36 | 高风险待验证（多跳关联路径，图算法 + 语义可解释性） *(v18)* | [愿景] | 骨架 |
| REQ-031 | 人物关系网络 | U-37 | 待技术验证（实体抽取 NER、共现统计） *(v18)* | [愿景] | 骨架 |
| REQ-032 | 矛盾检测 | U-38 | 高风险待验证（跨文档同指标不一致识别） *(v18)* | [愿景] | 骨架 |
| REQ-033 | 假设检验 / 证据地图 | U-39 | 高风险待验证（正反证据自动搜集与分栏） *(v18)* | [愿景] | 骨架 |
| REQ-034 | 信号追踪 | U-40 | 待技术验证（主题匹配、增量推送） *(v18)* | [愿景] | 骨架 |
| REQ-035 | 分析包 A Kit | U-41 | 待技术验证（加密打包、不含原文的脱敏） *(v18)* | [愿景] | 骨架 |
| REQ-040 | 账户注册：新用户提交登录标识（email / external_id）+ 密码；密码 bcrypt 哈希存储（非明文）；注册成功建 `lumen_users` 行（status=active）+ 默认个人空间；重复标识 / 缺字段拒绝 | U-45 | 注册新账号后可用其凭证登录成功；重复标识拒绝；密码 bcrypt 哈希存储 | [P2] | Phase2D·Sprint-26 已完成（TC-P2-AUTH-001 通过，2026-08-07） |
| REQ-041 | 凭证登录：登录接口校验账号 + 密码（bcrypt verify）；通过则发不透明 token + 建 `lumen_sessions`（TTL，存 token_hash 不存明文）；失败计数达阈值锁定；不泄露账号是否存在 | U-46 | 正确凭证登录成功发 token 且后续请求鉴权通过；错误密码失败；连续失败触发锁定 | [P2] | Phase2D·Sprint-26 已完成（TC-P2-AUTH-001 通过，2026-08-07） |
| REQ-042 | 登出 / 会话管理：登出撤销当前 session（token 立即失效）；session TTL 过期自动失效；续期轮换（发新 token 旧 token 失效）；支持查询 / 撤销多设备会话 | U-47 | 登出后原 token 再用被拒；过期 session 自动失效；续期后旧 token 失效 | [P2] | Phase2D·Sprint-26 已完成（TC-P2-AUTH-001 通过，2026-08-07） |
| REQ-043 | 权限多人化（REQ-001/002/003 扩展）：文档按 owner 归属（owner_id）；所有查询 / 检索 / 问答路径对非 owner 用户的私有文档不可见；外部只读文档仅 owner 可写 | U-48 | 两个真实用户同空间：A 的私有文档 B 列表 / 搜索 / 问答零命中；external 文档 B 只读、写操作被拒（4003） | [P2] | Phase2D·Sprint-27 已完成（TC-P2-ACC-001 通过，2026-08-07） |
| REQ-044 | 跨用户隔离回归（REQ-003 扩展）：真实多用户注册后，私有文档仅 owner 可见，不进入他人检索 / 问答 / 时间线 / 目录 / 导出 | U-49 | 注册多用户 + 默认个人空间；全路径跨用户零泄露断言 | [P2] | Phase2D·Sprint-27 已完成（TC-P2-ACC-001 通过，2026-08-07） |
| REQ-045 | 全局角色分层：`lumen_users` 增加全局角色 `role`（admin / member，默认 member）；admin 可访问用户管理后台（用户列表 / 改角色 / 禁用启用）；member 无任何管理权限 | U-50 | 管理接口仅 admin 可调用（member 4030）；新注册用户默认 member | [P2] | Phase2D·Sprint-28 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-046 | 用户管理后台（admin 域）：管理员查看用户列表（姓名 / email / 角色 / 状态 / 最后登录）、按角色 / 状态过滤、修改全局角色、禁用 / 启用账号；列表与接口不暴露 `password_hash` 等敏感字段 | U-51 | admin 可列用户并改角色 / 禁用启用；禁用后该用户登录被拒（4030）且既有会话失效；非 admin 无此能力；接口不返回 `password_hash` | [P2] | Phase2D·Sprint-28 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-047 | 团队空间加入机制（space 域成员管理）：空间 admin 按 email 搜索用户并添加为空间成员（分配空间角色 admin / member）、修改成员空间角色、移除成员；普通成员不可管理成员 | U-52 | 空间 admin 添加成员后该用户可访问并切换空间；改角色即时生效；移除后失去空间访问；非空间 admin 调用成员管理接口被拒（4030） | [P2] | Phase2D·Sprint-28 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-049 | 本地挂载文件可编辑（REQ-018 模式 B 扩展）：浏览器内对本地 vault 文件增删改查（File System Access 写句柄：write / create / delete / rename），编辑态切换 + 左栏增删改 UI；边界不变（仅本地读写，不上传服务端、不进团队 RAG） | U-21 | 新建 / 编辑 / 删除 / 重命名本地文件后目录树与搜索即时反映；写失败走重授权流程 | [P2] | 维护态·已实现（v3.5.0，2026-08-08） |
| REQ-050 | 成员空间可见性配置（admin 域）：全局 admin 可查询任意用户所属空间 + 各空间角色，并跨空间授予 / 撤销成员关系（复用 space 域成员 API；前端用户详情抽屉即时操作） | U-53 | admin 查用户空间返回所属空间 + 角色；授予新空间后该用户空间下拉出现；撤销后立即不可见；非 admin 4030 | [P2] | 维护态批5·Sprint-30 已完成（v3.7.0，TC-P2-ACC-003 通过，2026-08-09） |
| REQ-051 | 登录注册密码可见性 toggle + 忘记密码自助重置：密码小眼睛；reset token 一次性短 TTL（30min），demo 无 SMTP 降级 token 写后端日志人工下发；重置成功吊销该用户全部活跃 session | U-54 | 小眼睛切换；请求重置恒响应（防枚举）；确认重置后新密码可登录、旧密码失败、token 过期 / 二次使用拒绝、该用户全部活跃 session 吊销 | [P2] | 维护态批5·Sprint-30 已完成（v3.7.0，TC-P2-AUTH-002 通过，2026-08-09） |

> 阅读索引：上方 REQ 主表已覆盖全部 REQ-001..051 的「系统需求 / 来源 U-ID / 可验证口径 / 初步阶段 / 状态」，不再以分组 bullet 双写（避免与主表漂移）。P1 / P1.5 REQ 可验证口径见上表；P2 / 愿景 REQ 保留骨架，可验证口径写「待该阶段细化 / 待技术验证」，升阶段时再细化。

## 4. U-ID → REQ-ID 追溯矩阵

| U-ID | REQ-ID | 阶段 | 覆盖说明 | 是否完整覆盖 | 备注 |
|---|---|---|---|---|---|
| U-01 | REQ-001 | [P1] | 多空间隔离 | 是 | — |
| U-02 | REQ-002 | [P1] | 空间切换 | 是 | — |
| U-03 / U-12 | REQ-003 | [P1] | 文档权限分级 / 私有文档 | 是 | — |
| U-04 | REQ-004 | [P1] | Markdown 文档 CRUD | 是 | — |
| U-05 | REQ-005 | [P1] | 行内编辑 | 是 | — |
| U-06 | REQ-006 | [P1] | 版本历史 | 是 | — |
| U-07 | REQ-007 | [P1] | 全文 / 语义搜索 | 是 | — |
| U-08 | REQ-008 | [P1] | AI 问答（RAG） | 是 | — |
| U-09 | REQ-009 | [P1] | 多格式导入 | 条件覆盖 | 降级口径：`.md` / `.txt` 已提取文本 |
| U-10 | REQ-010 | [P1] | OCR 导入 | 条件覆盖 | 降级口径：已提取文本替代 OCR |
| U-11 | REQ-011 | [P1] | 桌面浏览器访问 | 是 | — |
| U-42 | REQ-036 | [P1] | 术语管理 | 是 | — |
| U-13 | REQ-012 | [P2] | 标签视图 | P2-已实现（TC-P2-TAG-001 通过） | — |
| U-14 / U-15 | REQ-013 | [P2] | **REQ-013a 主题时间线（U-14）/ REQ-013b 关联图（U-15）** | REQ-013a P2-已设计（主题时间线，编码移至 folder-tree 后）；REQ-013b 愿景骨架 | — |
| U-16 / U-17 | REQ-014 | [P2] | AI 润色 / 写作侧边栏引用 | 待细化（骨架） | — |
| U-18 | REQ-015 | [P2] | 跨空间文档推送 | 待细化（骨架） | — |
| U-19 | REQ-016 | [P2] | 多人协作 | 待细化（骨架） | — |
| U-20 | REQ-017 | [P2] | 跨设备 / 移动端 | 待细化（骨架） | — |
| U-30 | REQ-024 | [P2] | 时间轴密度热条 | 待细化（骨架） | — |
| U-31 | REQ-025 | [P2] | 快速录入索引条目 | P2-已实现（TC-P2-QUICK-001 通过） | — |
| U-32 | REQ-026 | [P2] | 内部链接 + 反向链接 | P2-已实现（TC-P2-LINK-001 通过） | — |
| U-33 | REQ-027 | [P1] | 单文档导出 PDF | P1.5B-已实现（Sprint-18 / TC-P1-017 通过，从 Phase2 提前） | — |
| U-43 | REQ-038 | [P1] | 单文档 `.md` + 空间 ZIP 导出备份 | P1.5A-已实现（TC-P1-016 通过） | — |
| U-21 | REQ-018 | [P2] | Obsidian Vault 兼容（导入数据库 / 仅本地挂载双模式） | Phase2C·已设计（模式 B 浏览器路线 RG-009 Go） | 仅挂载不默认写入 LUMEN DB，不进入团队共享 |
| U-22 | REQ-019 | [愿景] | 录音转文字 + 摘要 | 待验证（骨架） | — |
| U-23 | REQ-020 | [愿景] | 问题热力矩阵 | 待验证（骨架） | 高风险 |
| U-24 | REQ-021 | [愿景] | 事件因果展开 | 待验证（骨架） | 高风险 |
| U-25 | REQ-022 | [愿景] | 对外只读简报 | 待验证（骨架） | — |
| U-26 / U-27 / U-28 / U-29 | REQ-023 | [愿景] | 文档包、管理层摘要、气泡图谱、跨组织复用 | 待验证（骨架） | 升阶段前需拆分为独立 REQ |
| U-34 | REQ-028 | [愿景] | 飞书自动同步 | 待验证（骨架） | — |
| U-35 | REQ-029 | [愿景] | 多视角联动闭环 | 待验证（骨架） | — |
| U-36 | REQ-030 | [愿景] | 路径推理 | 待验证（骨架） | 高风险 |
| U-37 | REQ-031 | [愿景] | 人物关系网络 | 待验证（骨架） | — |
| U-38 | REQ-032 | [愿景] | 矛盾检测 | 待验证（骨架） | 高风险 |
| U-39 | REQ-033 | [愿景] | 假设检验 / 证据地图 | 待验证（骨架） | 高风险 |
| U-40 | REQ-034 | [愿景] | 信号追踪 | 待验证（骨架） | — |
| U-41 | REQ-035 | [愿景] | 分析包 A Kit | 待验证（骨架） | — |
| U-44 | REQ-039 | [P2] | 文档目录树（folder-tree） | 是 | SC-009（已补，SRS-C-002 已确认 2026-08-02） |
| U-45 | REQ-040 | [P2] | 账户注册 | 待细化（骨架） | 立项 2026-08-07，认证选型已定（bcrypt + 不透明 token） |
| U-46 | REQ-041 | [P2] | 凭证登录 | 待细化（骨架） | 立项 2026-08-07 |
| U-47 | REQ-042 | [P2] | 登出 / 会话管理 | 待细化（骨架） | 立项 2026-08-07 |
| U-48 | REQ-043 | [P2] | 权限多人化（owner 过滤） | 待细化（骨架） | 立项 2026-08-07（Sprint-27） |
| U-49 | REQ-044 | [P2] | 跨用户隔离回归 | 待细化（骨架） | 立项 2026-08-07（Sprint-27） |
| U-50 | REQ-045 | [P2] | 全局角色分层（admin / member） | 是 | Sprint-28 已完成（TC-P2-ACC-002 通过） |
| U-51 | REQ-046 | [P2] | 用户管理后台（admin 域） | 是 | Sprint-28 已完成（TC-P2-ACC-002 通过） |
| U-52 | REQ-047 | [P2] | 团队空间加入机制（space 域成员） | 是 | Sprint-28 已完成（TC-P2-ACC-002 通过） |
| U-53 | REQ-050 | [P2] | 成员空间可见性配置（admin 域，跨空间授予 / 撤销） | 是 | 立项 2026-08-08（Sprint-30） |
| U-54 | REQ-051 | [P2] | 登录密码小眼睛 + 忘记密码自助重置 | 是 | 立项 2026-08-08（Sprint-30） |

## 4.1 验证入口

| REQ-ID | AC-ID | TC-ID | 验证入口 | 当前状态 |
|---|---|---|---|---|
| REQ-001 | AC-P1-001 | TC-P1-001 | `docs/09-verification.md` §2 / §5、权限测试 | 条件通过 |
| REQ-002 | AC-P1-002 | TC-P1-002 | `docs/09-verification.md` §2 / §5、空间切换测试 | 条件通过 |
| REQ-003 | AC-P1-003 | TC-P1-003 | `docs/09-verification.md` §2 / §5、权限测试 | 条件通过 |
| REQ-004 | AC-P1-004 | TC-P1-004 | `docs/09-verification.md` §2 / §5、文档 CRUD 测试 | 条件通过 |
| REQ-005 | AC-P1-004 | TC-P1-005 | `docs/09-verification.md` §2 / §5、文档编辑测试 | 条件通过 |
| REQ-006 | AC-P1-004 | TC-P1-006 | `docs/09-verification.md` §2 / §5、版本测试 | 条件通过 |
| REQ-007 | AC-P1-005 | TC-P1-007 | `docs/09-verification.md` §2 / §5、search hybrid 测试 | 条件通过（hybrid） |
| REQ-008 | AC-P1-006 | TC-P1-008 | `docs/09-verification.md` §2 / §5、RAG 问答验收 | 通过 |
| REQ-009 | AC-P1-007 | TC-P1-009 | `docs/09-verification.md` §2 / §5、导入测试 | 条件通过（仅 `.md` / `.txt`） |
| REQ-010 | AC-P1-007 | TC-P1-010 | `docs/09-verification.md` §2 / §6、OCR 风险记录 | 后续阶段（P1 不必过） |
| REQ-011 | AC-P1-008 | TC-P1-011 | `docs/09-verification.md` §2 / §5、浏览器 smoke | 条件通过 |
| REQ-036 | AC-P1-009 | TC-P1-012 | `docs/09-verification.md` §2 / §5、术语验收 | 条件通过 |
| REQ-037 | AC-P1-010 | TC-P1-015 | `docs/09-verification.md` §2、批量导入后端 tests + Chrome smoke | P1.5A-已实现 / 通过 |
| REQ-038 | AC-P1-011 | TC-P1-016 | `docs/09-verification.md` §2、导出后端 tests + 端到端 HTTP smoke | P1.5A-已实现 / 通过 |
| REQ-027 | AC-P1-012 | TC-P1-017 | `docs/09-verification.md` §2、RG-006 + Sprint-18 PDF 产品样例验证 | P1.5B-已实现 / 通过 |
| REQ-012 | AC-P2-TAG-001 | TC-P2-TAG-001 | `docs/09-verification.md` §2、标签后端 tests + 浏览器 smoke | P2-已实现 / 通过 |
| REQ-025 | AC-P2-QUICK-001 | TC-P2-QUICK-001 | `docs/09-verification.md` §2、快速录入后端 tests + API / 浏览器 smoke | P2-已实现 / 通过 |
| REQ-026 | AC-P2-LINK-001 | TC-P2-LINK-001 | `docs/09-verification.md` §2、内链后端 tests + API / 浏览器 smoke | P2-已实现 / 通过 |
| REQ-039 | AC-P2-FOLDER-001 | TC-P2-FOLDER-001 | `docs/09-verification.md` §2、folder 后端 tests + 浏览器 smoke（已实现） | P2-已实现 / 通过 |
| REQ-040 | AC-P2-AUTH-001 | TC-P2-AUTH-001 | `docs/09-verification.md` §2、账户注册 + 凭证登录后端 tests（`tests/backend/test_auth.py` 20/20，Sprint-26） | Sprint-26 已完成 |
| REQ-041 | AC-P2-AUTH-002 | TC-P2-AUTH-001 | `docs/09-verification.md` §2、凭证登录 + 失败锁定 tests（`tests/backend/test_auth.py`，Sprint-26） | Sprint-26 已完成 |
| REQ-042 | AC-P2-AUTH-003 | TC-P2-AUTH-001 | `docs/09-verification.md` §2、登出 / 会话撤销 / 续期 tests（`tests/backend/test_auth.py`，Sprint-26） | Sprint-26 已完成 |
| REQ-043 | AC-P2-ACC-001 / AC-P2-ACC-002 | TC-P2-ACC-001 | `docs/09-verification.md` §2、权限过滤全路径回归 tests（`tests/backend/test_permission.py` MultiUserIsolationTest，Sprint-27） | Sprint-27 已完成 |
| REQ-044 | AC-P2-ACC-002 | TC-P2-ACC-001 | `docs/09-verification.md` §2、跨用户隔离回归 tests + 浏览器 smoke（Sprint-27） | Sprint-27 已完成 |
| REQ-045 | AC-P2-ACC-004 | TC-P2-ACC-002 | `docs/09-verification.md` §2、全局角色 admin/member 权限校验 tests + 浏览器 smoke | 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-046 | AC-P2-ACC-005 | TC-P2-ACC-002 | `docs/09-verification.md` §2、admin 域用户管理 tests + 浏览器 smoke | 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-047 | AC-P2-ACC-006 | TC-P2-ACC-002 | `docs/09-verification.md` §2、space 域成员管理 tests + 浏览器 smoke | 已完成（TC-P2-ACC-002 通过，2026-08-07） |
| REQ-049 | —（REQ-018 模式 B 扩展） | 浏览器 smoke（v3.5.0） | 本地挂载编辑 `frontend`（write / create / delete / rename） | 维护态·已实现（v3.5.0） |
| REQ-050 | AC-P2-ACC-007 | TC-P2-ACC-003 | `docs/09-verification.md` §2、admin 用户空间查询 tests + 浏览器 smoke（用户详情抽屉授予 / 撤销） | Sprint-30 已完成（v3.7.0，2026-08-09） |
| REQ-051 | AC-P2-AUTH-004 | TC-P2-AUTH-002 | `docs/09-verification.md` §2、reset request / confirm tests（防枚举 / 过期 / 二次使用 / session 吊销）+ 浏览器 smoke | Sprint-30 已完成（v3.7.0，2026-08-09） |
| REQ-048 | AC-P1-009 扩展 | TC-P2-TERM-001 | `docs/09-verification.md` §2、术语领域树后端 tests（`tests/backend/test_term_category.py` 18 例 + `test_term.py` 扩字段，Sprint-29） | 维护态增强·已实现 |

## 5. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| SRS-C-001 | 是否确认 P1.5A 以 REQ-037/038 为个人可用 Alpha 退出门槛 | 建议确认 | 用户目标是尽快个人使用；批量导入和导出备份比 PDF / 标签 / AI 润色更能解锁真实使用 | 继续把 PDF 或 Phase2 能力作为下一步 | 会延后个人可用 |
| SRS-C-002 ✅已确认（2026-08-02） | REQ-039（文档目录树）的来源 U-ID / SC 追溯锚点 | **已补：新建 U-44（01）+ SC-009（00）；02 REQ-039 来源 U-ID=U-44** | 追溯链硬规则要求 REQ→U-ID→SC | 复用 U-13（未采）；新建 SC-009 + U-44（已采） | ~~阻塞 REQ-039 立项编码~~ 已解除 |
| SRS-C-003 ✅已记录（2026-08-02） | REQ-039 编号占用：office/wps→MD 格式转换原输入材料"建议 REQ-039"已被 folder-tree 正式占用 | **REQ-039 已正式分配给文档目录树（folder-tree）**；`docs/inputs/2026-07-21-doc-format-conversion-requirements.md` 的"建议 REQ-039"需重新编号 | 输入材料自声明"建议编号，不污染正式编号"（FCR-C-005）；02 权威最新 REQ-038 → REQ-039 可用 | office→MD 格式转换若立项用 REQ-048+（REQ-040..047 已分别被 Sprint-26/27/28 占用） | 不阻塞 folder-tree；office→MD 立项时重新编号 |
| SRS-C-004 ✅已记录（2026-08-07） | REQ-045..047 编号占用：Sprint-28（角色分层 + 用户管理后台 + 团队空间加入）占用 REQ-045/046/047 | **REQ-045/046/047 已正式分配给 Sprint-28**（对应 U-50..52）；office→MD 格式转换（SRS-C-003）若立项顺延 REQ-048+ | 02 权威最新 REQ-044 → REQ-045..047 可用；Sprint-28 为已确认立项，优先占用 | office→MD 立项时用 REQ-048+ | 不阻塞 Sprint-28；office→MD 立项时重新编号 |
