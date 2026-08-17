# 05-deps · 依赖与配置矩阵

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/05-tech-spec.md`（### 2.1|## 2. 起的章节）。表格内容以源文档为准。

| TCD-ID | 决策 | 理由 | 替代 / 禁令 | 影响范围 | 验证状态 |
|---|---|---|---|---|---|
| TCD-001 | 向量检索用 pgvector | 关系数据与向量检索一体，Phase1 少引独立向量库 | 禁 Milvus / Qdrant（project-rules §2） | 检索 / RAG（REQ-007/008） | 已启用（RG-001 Go） |
| TCD-002 | AI 调用分层封装（LLM 走 OpenAI 兼容；Embedding 本机 `bge-small-zh` 经 adapter） | 厂商解耦；Embedding 保留迁内网服务空间 | 禁绑定单一闭源 LLM SDK | LLM / Embedding（REQ-008/036） | 已启用（RG-002/004 Go） |
| TCD-003 | 导入流水线收敛异构格式为 纯文本 → 切块 → Embedding → `lumen_chunks` | 检索侧只面对一种数据形态 | 各格式独立检索路径 | 内容导入（REQ-009/010） | 部分启用（`.md`/`.txt`；真实解析后续） |
| TCD-004 | RAG 向量 + 全文双路召回，答案带来源；P1 不做重排调优 | 兼顾语义与关键词；重排留后续 | 纯关键词或纯向量 | RAG（REQ-008） | 已启用（task-009 hybrid） |
| TCD-005 | 术语口径注入：构造 Prompt 前按当前空间查 `lumen_terms`，空间术语优先于全局 | 保证跨客户口径一致 | — | 术语管理（REQ-036） | 已启用 |
| TCD-006 | 鉴权用 Demo Bearer Token（HMAC-SHA256；载荷 `user_id` / `current_space_id` / `exp`，8h）；空间 + 文档两级校验，查询 / 检索 / 问答三层统一过滤 | Demo 可用且权限下沉到查询层 | 真实账号系统（后续） | 权限（REQ-001..003） | 已启用（Demo） |
| TCD-007 | 批量 / 文件夹导入按逐文件循环处理，保留相对路径标题前缀，部分成功不回滚，同名默认跳过 | Phase1.5A 要最快解决“资料放不进去”；不建真实目录表可避免 DB 迁移 | 新增 folder 表 / 真实目录树；失败一项回滚全部 | REQ-037、TC-P1-015 | 已实现（Sprint-16，TC-P1-015 通过） |
| TCD-008 | `.md` / ZIP 导出备份走标准文件流与 Python `zipfile`，导出前统一权限过滤 | Phase1.5A 要可迁出、可备份；标准库不引重依赖 | 先做 PDF；导出数据库整库；长期公开链接 | REQ-038、TC-P1-016 | 已实现（Sprint-17，TC-P1-016 通过） |
| TCD-009 | PDF 导出采用 ReportLab 首版路线，API-019 已实现同步任务返回；覆盖 Markdown 子集映射、权限过滤和 5030 失败态 | ReportLab 在 Python 3.14 / Windows 下安装顺利，可注册 `simhei.ttf` 并通过中文 PDF 渲染样例；比 WeasyPrint 少系统级依赖 | 直接引入 WeasyPrint / HTML 渲染链；跳过中文样例直接编码 | REQ-027、TC-P1-017 | 已实现（Sprint-18 / TC-P1-017 通过） |
| TCD-010 | Phase2B AI 润色 / 写作引用（REQ-014）复用 ADR-002 LLM adapter；polish 同步、citation 复用 RAG 来源检索 + LLM | 厂商解耦、复用既有通道；不引新 LLM SDK | 业务层直连 LLM；新增独立 AI 服务 | AI 润色（REQ-014） | 已实现；**RG-008 已升 Go**；TC-P2-AI-001 live UI smoke 2026-07-31 通过 |
| TCD-011 | Vault 兼容采用“双入口”：导入数据库走既有 ingestion / folder-tree；仅本地挂载走个人本地连接器 | 数据库内容才能获得完整权限 / 搜索 / RAG / 版本能力；本地挂载满足个人低摩擦查看整理，但不能默认共享或进入服务端 RAG | 只做 Obsidian 式本地文件夹为唯一权威；或强制所有 vault 全量导入 | REQ-018、REQ-037、REQ-039 | Phase2C·已确认（RG-009 Go 2026-08-05）/ 浏览器 File System Access 路线采纳 |
| TCD-012 | 密码哈希用 `bcrypt` 库（cost 12）+ 登录会话用不透明 token（`secrets.token_urlsafe` + `lumen_sessions`，TTL / 撤销 / 续期轮换）+ 统一 `get_current_user` 收敛 13 router | NIST 800-63B 长度优先 + OWASP 密码存储（bcrypt 可接受，cost≥12）；官方 `bcrypt` 库在 Python 3.14 实测通过，`passlib` 弃维护不采用；不透明 token 免 JWT 依赖、可撤销、支持 demo 物理隔离 | 禁 JWT / python-jose / 自实现 token 协议（project-rules §1） | REQ-040/041/042 | **RG-011/012/013 Go（2026-08-07）**；TC-P2-AUTH-001 自动化通过 |
| 类型 | 名称 | 用途 | 启用阶段 | 当前状态 | 配置来源 | 密钥 / 敏感性 | 验证方式 |
|---|---|---|---|---|---|---|---|
| 数据库 | PostgreSQL 16 + pgvector 0.8 | 关系存储 + 向量索引（`lumen_*` 表、hnsw） | Phase1 | 已启用 | `docker/compose.yml`（lumen-pg:pg16） | 无 | RG-001 Go；74 后端 tests（PG 集成） |
| Python 包 | FastAPI / Pydantic / SQLAlchemy / Alembic / psycopg | 后端 API + ORM + 迁移 | Phase1 | 已启用 | `backend/requirements.txt`（锁 3.14 实测） | 无 | RG-005 Go；tests |
| Python 包 | sentence-transformers + torch（cpu） | 本机 Embedding `bge-small-zh`（512 维） | Phase1 | 已启用 | `backend/requirements.txt`；须 `HF_HUB_DISABLE_XET=1` | 无 | RG-002 Go；embedding tests |
| Node 包 | React 18 / Vite 5 / TypeScript 5 | 前端 SPA | Phase1 | 已启用 | `frontend/package.json` | 无 | 前端 build + 浏览器 smoke |
| 外部 API | OpenAI 兼容 LLM 中转（GLM `glm-5.2`） | RAG 问答 + 术语注入 | Phase1 | 已启用（可切 Mock） | `.env`（base_url / api_key） | **secret（api_key）** | RG-004 Go；真实问答验证 |
| Docker 服务 | Docker Compose（lumen-pg） | 本机起 PostgreSQL+pgvector | Phase1 | 已启用 | `docker/compose.yml` | 无 | daemon live（TE-C-003 闭合） |
| Python 标准库 | `zipfile` | 空间可见文档 `.md` 打包 ZIP 导出备份 | Phase1.5A | 已启用（Sprint-17） | Python runtime | 无 | TC-P1-016 通过 |
| Python 包 | `reportlab` / `pypdf` / `pdfplumber` / `pillow` | 单文档 PDF 导出与中文排版；产物校验 | Phase1.5B | **已安装 / 已启用（API-019 已实现）** | `backend/requirements.txt`；Windows 字体 `simhei.ttf`，无系统字体时回退 STSong-Light | 无；导出内容继承文档敏感性 | RG-006 样例通过；TC-P1-017 通过 |
| Python 包 | python-docx / pdfplumber | 真实 Word / PDF 文本提取 | Phase1.5B | **候选（未接入）** | 待选型 / RG | 无；真实文档敏感性需确认 | 待后续 tech-env-eval |
| Python 包 | PaddleOCR | 图片 / 白板 OCR | 后续 | **降级 / No-Go（RG-003）** | — | 无 | 待环境兼容验证 |
| Python 包 | `bcrypt` 5.0.0 | 注册 / 登录密码哈希（Sprint-26 账号体系） | Phase2D | **已安装 / RG-011 Go（2026-08-07）** | `backend/requirements.txt` | 无（含盐哈希，非明文） | RG-011 PoC：Python 3.14.3 hash/verify 通过（cost 12 ≈0.21s、恒定时序） |
