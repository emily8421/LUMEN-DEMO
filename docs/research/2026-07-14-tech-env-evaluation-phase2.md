# 技术路线与环境支撑评估：Phase2 MVP 真实依赖边界

> **草案状态（2026-07-14）**：本文件为未跟踪草案，保留用于后续复核；当前不代表 `docs-open-items`、UI / WSG 门禁或 Phase2 进入条件已闭环。
> **使用边界**：提交或回填 `docs/05-tech-spec.md` / `docs/08-dev-plan.md` / `docs/09-verification.md` 前，需先由用户确认，并与 open-items 校准和 Batch B 契约补齐结果对齐。
> **下一步关系**：先处理 open-items 状态校准，再执行 Batch B；本草案只作为依赖风险与 readiness gate 的输入材料。

> 定位：技术环境评估留痕，对照 `ai/prompts/review/20-tech-env-evaluation.md` 与 `ai/commands/tech-env-evaluation.md`。
> 评估日期：2026-07-14；触发：Batch A 文档回梳后，Phase2 前置 open items 要求确认 PDF / AI 润色 / 写作引用 / OCR 的真实依赖边界。
> 本报告不替代 `docs/env/local-env.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`；正式结论需在用户确认后再回填对应章节。

## 1. 评估摘要

- **范围**：Phase2 MVP 核心 5 项（REQ-012 / 014 / 025 / 026 / 027）相关运行时、数据库 / API 前置、PDF 导出、AI 润色 / 写作引用、真实 Word / PDF 解析与 OCR 边界。
- **结论**：**Conditional Go**。可继续做 Phase2 文档契约补齐、P2 UI / WSG 门禁确认和不触发新重依赖的首个 vertical slice 设计；不建议直接进入编码或切换阶段指针。
- **是否阻塞进入编码**：阻塞无条件 Phase2 编码。当前 `ai/project-rules.md` 阶段指针仍为 Phase1；`docs/03-prd.md` 要求 Phase2 进入前补齐 `04/05` 设计、tech-env-eval、`06/07` 契约并复跑升级评估。
- **最关键理由**：
  1. Python 3.14.3 / Node 22.17.1 / Docker 29.5.2 与现有 P1 基础栈本机可用；PostgreSQL + pgvector 容器已 healthy。
  2. LLM / Embedding / PG / Web 基础栈已有 P1 Go 证据；AI 润色与写作引用可复用现有 OpenAI-compatible adapter，不需要先引入闭源 SDK。
  3. Phase2 新真实依赖中，PDF 导出库仍是 `RG-006 待评估`；`reportlab` / `weasyprint` 未安装，必须另行安装 / 导入 / 最小导出验证后才能 Go。
  4. 真实 Word / PDF 解析仍未接入：`.venv` 中存在 `python-docx==1.2.0`，但未写入 `backend/requirements.txt`；`pdfplumber` 未安装。
  5. OCR 继续 **No-Go / 后置**：`paddleocr` / `paddlepaddle` 未安装，`docs/05-tech-spec.md` 已将 `RG-003` 标为 No-Go。

## 2. 评估范围与依据

### 2.1 读取输入

- 规则 / Prompt：`ai/index.md`、`ai/project-rules.md`、`ai/document-lifecycle-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/commands/tech-env-evaluation.md`、`ai/prompts/review/20-tech-env-evaluation.md`、`ai/doc-standards/05-tech-spec.md`。
- 项目文档：`docs/env/local-env.md`、`docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`docs/research/2026-07-14-docs-open-items.md`。
- 依赖 / 配置：`backend/requirements.txt`、`frontend/package.json`、`docker/compose.yml`、`.env.example`、`backend/service/db.py`、`backend/service/embedding.py`、`backend/service/llm_adapter.py`。

### 2.2 本次只读验证

- 运行时版本：`python --version`、`.venv/Scripts/python.exe --version`、`node --version`、`npm.cmd --version`、`docker --version`、`docker compose version`。
- 已安装依赖：通过 `.venv/Scripts/python.exe` 读取 Python 包版本；通过 `npm.cmd ls --depth=0 --json` 读取前端顶层依赖。
- 容器 / 数据库：提权只读执行 `docker ps -a --filter name=lumen-pg`、`docker image ls pgvector/pgvector`；执行 `backend.service.db.ping()` 与 `pg_extension` 查询确认 PG / pgvector。
- 最小导入：`from backend.main import create_app` 并列出 `/api` 路由，确认后端依赖可导入且不启动端口。

### 2.3 未做

- 未安装任何 Python / npm 依赖，未拉取 Docker 镜像，未启动新服务，未调用外部 LLM，未执行 PDF 导出 / Word / PDF 解析 / OCR 最小样例。
- 未联网复核候选库最新官方兼容矩阵；候选库结论均以“待验证”记录，不能替代安装 / 导入 / 最小运行证据。

## 3. 本机 / 团队环境事实

| 项 | 事实 | 来源 / 证据 |
|---|---|---|
| OS / 资源 | Windows 11；i7-12650H 10C16T；内存 31.73GB；RTX 3050 约 4GB；D 盘采集时可用约 99.79GB | `docs/env/local-env.md` |
| Python | 默认 Python 3.14.3；`.venv` Python 3.14.3 | 本次只读命令 |
| Node / npm | Node v22.17.1；npm 11.11.0（PowerShell 需用 `npm.cmd`，`npm.ps1` 受执行策略拦截） | 本次只读命令 |
| Docker | Docker 29.5.2；Compose v5.1.4；沙箱内 Docker pipe 受限，提权只读可查 | 本次只读命令 |
| PostgreSQL / pgvector | `lumen-pg` 容器 Up 5 days (healthy)；PostgreSQL 16.14；`vector=0.8.3` | 提权 Docker 查询 + PG 查询 |
| 后端包 | fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4 / sqlalchemy 2.0.51 / alembic 1.18.5 / psycopg 3.3.4 / pgvector 0.5.0 / openai 2.44.0 / sentence-transformers 5.6.0 / torch 2.13.0+cpu | `.venv` metadata |
| 前端包 | React 18.2.0 / React DOM 18.2.0 / react-markdown 10.1.0 / Vite 5.4.19 / TypeScript 5.5.4 | `frontend/package.json` + `npm.cmd ls` |
| LLM | 现有 adapter 支持 `glm` / `gpt` / `local` / `mock`；真实 key 只从环境变量读取 | `backend/service/llm_adapter.py` |
| 数据边界 | 默认虚构 Demo 数据；真实团队文档需标注来源 / 敏感级别，优先避免发送到外部模型 | `ai/project-rules.md` §2.5、`docs/05-tech-spec.md` §5.2 |

## 4. 技术路线候选与决策

| 能力 | 候选 / 当前路径 | 推荐决策 | 依据 | 备选 / 维护成本 |
|---|---|---|---|---|
| Phase2 标签 / 反链 / 快速录入 | 继续使用 React + FastAPI + PostgreSQL；新增表 / endpoint / TC 需先补 `06/07/09` | **Conditional Go**：先补 Batch B 契约，再选首个 vertical slice | 基础栈已 Go；但 `06/07` P2 仍是骨架 | 若先编码会绕过字段、权限、错误码和测试契约 |
| AI 润色 / 写作引用（REQ-014） | 复用 `backend/service/llm_adapter.py` OpenAI-compatible chat；引用来源复用 RAG 检索候选 | **Conditional Go**：无需新 SDK；需补 prompt 边界、权限过滤、引用来源和 Mock 降级 TC | P1 RG-004 已 Go；项目禁绑定单一闭源 SDK | 若引入新 LLM SDK 会增加密钥、兼容与合规成本 |
| PDF 导出（REQ-027 / RG-006） | 候选 `reportlab` / `weasyprint`；当前均未安装 | **No-Go until verified**：建议先定义导出复杂度，再做安装 / 最小中文 PDF 导出验证 | `docs/05-tech-spec.md` 明确 RG-006 待评估 | `reportlab` 倾向简单可控；`weasyprint` 倾向 HTML/CSS 还原，但系统依赖风险可能更高，需实测 |
| 真实 Word 解析 | `.venv` 已有 `python-docx==1.2.0`，但未写入 requirements | **Conditional Go**：若纳入 Phase2，先写依赖文件并做最小 `.docx` 提取验证 | local venv 事实 + `docs/05` 候选项 | 不纳入首个 slice 可降低范围风险 |
| 真实 PDF 解析 | `pdfplumber` 未安装 | **No-Go until verified**：需安装 / 导入 / 最小文本提取验证 | `docs/05` 当前仅候选 | 与 PDF 导出独立评估，避免混淆读 PDF 与生成 PDF |
| OCR | `paddleocr` / `paddlepaddle` 未安装；`RG-003 No-Go` | **No-Go / 后置**：不纳入 Phase2 首个实现切片 | 现有 05 / 09 风险映射 | 可继续降级为已提取文本，或后续另评 OCR 引擎 |

## 5. 依赖与工具支撑矩阵

| 名称 | 目标 / 当前版本 | 环境要求 | 启用阶段 | 当前状态 | 配置来源 | 敏感性 | 验证方式 | 验证状态 | 风险 |
|---|---|---|---|---|---|---|---|---|---|
| Python / FastAPI 栈 | Python 3.14.3；FastAPI 0.136.3 | Windows + venv | P1+ | 已启用 | `backend/requirements.txt` | 无 | 版本读取 + `create_app` 导入 | Go | 继续锁定 cp314 wheel 可用版本 |
| PostgreSQL + pgvector | PostgreSQL 16.14；pgvector ext 0.8.3 | Docker Desktop / 本机端口 15432 | P1+ | 已启用 | `docker/compose.yml` | 无 | Docker healthy + PG ping + extversion | Go | 沙箱内 Docker pipe 需提权只读；开发机需 Docker 可用 |
| Embedding | bge-small-zh；torch 2.13.0+cpu；sentence-transformers 5.6.0 | CPU 可跑；`HF_HUB_DISABLE_XET=1` | P1+ | 已启用 | `backend/requirements.txt`、`embedding.py` | 无 | 已安装版本读取；历史 P1 验证 | Go | 公司网络 / HF 缓存仍需保留环境约束 |
| LLM adapter | OpenAI-compatible；openai 2.44.0 | 内网中转或 mock | P1+ / P2 REQ-014 | 已启用；P2 复用 | `.env` / 环境变量 / `llm_adapter.py` | secret（API key） | 代码读取；不调用外部接口 | Conditional Go | 真实文档外发与 HTTP 明文中转需风险接受 |
| React / Vite | React 18.2.0；Vite 5.4.19；TS 5.5.4 | Node 22.17.1 / npm 11.11.0 | P1+ | 已启用 | `frontend/package.json` | 无 | `npm.cmd ls` | Go | PowerShell 执行策略下用 `npm.cmd` |
| PDF 导出库 | `reportlab` / `weasyprint` 候选 | 待确认字体、中文排版、系统依赖、内存 | P2 REQ-027 | 未安装 / 未验证 | 待新增 | 无 | 待安装、导入、最小中文 PDF 导出 | No-Go until verified | RG-006 阻塞 PDF 导出实现 |
| Word 解析 | `python-docx==1.2.0` in venv | Python 包 | P2 候选 / 真实导入 | venv 有；requirements 未登记 | 待新增 | 真实文档隐私 | 待最小 `.docx` 提取 | Conditional Go | drift 风险：重建 venv 会丢失 |
| PDF 解析 | `pdfplumber` 候选 | Python 包；可能引入解析依赖 | P2 候选 / 真实导入 | 未安装 / 未验证 | 待新增 | 真实文档隐私 | 待最小 `.pdf` 文本提取 | No-Go until verified | 与导出库不同，需独立验证 |
| OCR | PaddleOCR / 其他 OCR 候选 | 可能重型依赖 / 模型 / 资源 | 后续阶段 | 未安装；RG-003 No-Go | 待新增 | 真实图片隐私 | 待后续 OCR 专项评估 | No-Go | 不应阻塞首个 P2 slice；不得误标通过 |

## 6. 安装 / 导入 / 最小运行验证

### 6.1 已执行（只读或最小导入）

| 命令 / 操作 | 结果摘要 | 备注 |
|---|---|---|
| `python --version` | `Python 3.14.3` | 只读 |
| `.venv/Scripts/python.exe --version` | `Python 3.14.3` | 只读 |
| `node --version` | `v22.17.1` | 只读 |
| `npm.cmd --version` | `11.11.0` | `npm.ps1` 被 PowerShell 执行策略拦截，改用 `npm.cmd` |
| `docker --version` / `docker compose version` | Docker 29.5.2 / Compose v5.1.4 | 只读 |
| `.venv` package metadata | 核心后端包、AI 包已安装并与 P1 基线一致 | 未安装新包 |
| `npm.cmd ls --depth=0 --json` | 前端顶层依赖与 `package.json` 对齐 | 未安装新包 |
| `docker ps -a --filter name=lumen-pg`（提权只读） | `lumen-pg` healthy，端口 `15432->5432` | 沙箱内 Docker pipe 被拒，提权只读后通过 |
| `backend.service.db.ping()` | PostgreSQL 16.14 | 不启动服务 |
| `select extversion from pg_extension where extname='vector'` | `vector=0.8.3` | 不改数据库 |
| `from backend.main import create_app` | API 路由可装配 | 不绑定端口 |
| 候选包 metadata 查询 | `python-docx==1.2.0`；`pdfplumber` / `weasyprint` / `reportlab` / `paddleocr` / `paddlepaddle` / `pillow` 均缺失 | 只读 |

### 6.2 待执行命令（需另行确认）

```powershell
# PDF 导出候选验证（示例，需先决定候选）
.venv\Scripts\pip install reportlab
.venv\Scripts\python.exe -c "import reportlab; print(reportlab.Version)"

# 若选择 HTML/CSS 到 PDF，再单独验证 weasyprint 系统依赖
.venv\Scripts\pip install weasyprint
.venv\Scripts\python.exe -c "import weasyprint; print(weasyprint.__version__)"

# 真实 Word / PDF 解析验证（若纳入 P2 范围）
.venv\Scripts\pip install python-docx pdfplumber
.venv\Scripts\python.exe -c "import docx, pdfplumber; print('parser imports ok')"
```

> 上述命令会写入 `.venv` / 可能联网下载，执行前必须再次说明影响范围，并在通过后将实际新增依赖写入 `backend/requirements.txt` 或另行记录不落盘原因。

## 7. 资源、网络、权限与 Docker 验证

- **资源**：当前机器内存与磁盘余量足以支撑 P2 文档契约、Web UI、PG、LLM adapter 调用和轻量 PDF / 解析候选验证；OCR / 大模型 / reranker 仍可能触发资源预案。
- **网络**：LLM 可走公司内网 OpenAI-compatible 中转；Embedding 本机运行。真实团队文档进入 LLM 前必须显式风险接受，并避免把敏感片段发送到外部模型。
- **权限**：沙箱内访问 Docker pipe 被拒；提权只读可查询 Docker。后续若需 `docker compose up`、拉镜像、安装依赖或启动 dev server，均需再次确认。
- **Docker**：`lumen-pg` 已 healthy，PG + pgvector 不阻塞 P2 契约补齐；但本报告未重跑全量迁移 / tests。
- **PowerShell**：`npm.ps1` 受执行策略拦截；本项目验证命令建议使用 `npm.cmd` 或在脚本中显式调用 `.cmd`。

## 8. 风险项与降级策略

| Risk-ID | 优先级 | 风险 | 触发条件 | 影响 | 当前状态 | 降级 / 预案 | 对应用例 / Sprint | 解锁条件 |
|---|---|---|---|---|---|---|---|---|
| RISK-P2-TE-001 | P0 | PDF 导出库未验证 | 实现 REQ-027 前直接选库编码 | PDF 导出无法验收或中文排版失败 | Open | 先做最小中文 PDF 导出 spike；失败则降级为 Markdown / HTML 导出候选 | TC-P2-PDF 待补；RG-006 | 候选库安装 / 导入 / 导出样例通过，依赖入 `requirements.txt` |
| RISK-P2-TE-002 | P0 | P2 DB/API/TC 契约未补齐 | 实现标签、反链、快速录入或写作引用前未补 `06/07/09` | 代码先行、权限与错误码漂移 | Open | 先执行 Batch B，只补契约不编码 | P2 核心 5 项 | `06/07/09` 字段、endpoint、错误、权限、TC 齐备 |
| RISK-P2-TE-003 | P1 | AI 润色外发与引用边界不清 | 对真实团队文档调用中转 LLM | 隐私 / 合规风险，引用不可追溯 | Open | 默认 Mock / Demo 数据；真实文档前加敏感标记与过滤 | REQ-014 | Prompt 边界、权限过滤、来源引用 TC 通过 |
| RISK-P2-TE-004 | P1 | Word / PDF 解析依赖 drift | `.venv` 有包但 requirements 未登记，或 PDF 解析未安装 | 重建环境失败，导入真实化不可复现 | Open | 首个 P2 slice 不触发真实解析；或先补依赖并做最小解析验证 | REQ-009 / Phase2 真实化评估 | 依赖入文件 + 最小样例通过 |
| RISK-P2-TE-005 | P1 | OCR 重型依赖 / 兼容风险 | 将 OCR 纳入 P2 MVP 或首个 slice | 安装体积、资源、兼容和验收成本上升 | No-Go | 保持已提取文本降级；OCR 后置专项评估 | REQ-010 | OCR 引擎定版 + 环境兼容验证 |
| RISK-P2-TE-006 | P2 | Docker / npm 命令在沙箱或 PowerShell 下受限 | 自动化脚本直接调用 Docker pipe 或 `npm.ps1` | 验证脚本误报失败 | Known | 需要 Docker 时提权只读 / 确认；npm 使用 `npm.cmd` | 开发验证 | 脚本文档明确 Windows 调用方式 |

## 9. Readiness Gate

| RG-ID | 能力 / 真实依赖 | 进入标准 | 必需证据 | 当前状态 | 阻塞项 | 回填建议 |
|---|---|---|---|---|---|---|
| RG-001 | PostgreSQL + pgvector | 容器 healthy；PG 可连接；vector 扩展可用 | Docker healthy、PG ping、extversion | Go | 无 | 保持 `05 §5.1` Go；P2 契约可复用 |
| RG-002 | Embedding | bge-small-zh 本机可用；512 维；写入 PG | P1 既有测试 + 依赖版本 | Go | 无 | P2 不新增门禁，除非更换模型 / 维度 |
| RG-003 | OCR | OCR 引擎定版、安装导入、中文样例和资源验证 | 待专项验证 | No-Go | PaddleOCR 未安装，现有文档已标 No-Go | 保持后置，不纳入 P2 首个 slice |
| RG-004 | LLM / AI 润色复用 | OpenAI-compatible adapter 可用；Mock 降级；真实 key 不入库 | P1 GLM 证据 + P2 prompt / citation TC | Conditional Go | P2 prompt、引用与隐私边界未补 | 在 `09` 增加 REQ-014 TC，在 `05` 记录复用 adapter |
| RG-005 | Web / ORM 基础栈 | React / FastAPI / ORM 可导入，前端依赖对齐 | 版本读取 + create_app 导入 | Go | 未重跑全量 test/build | P2 开码前再执行 targeted tests / build |
| RG-006 | PDF 导出（REQ-027） | 候选库选型；中文 PDF 最小样例；依赖入文件；资源可接受 | 待安装 / 导入 / 导出验证 | No-Go until verified | `reportlab` / `weasyprint` 未安装 | `05 §5.1` 保持待评估；`09` 补 TC-P2-PDF |
| RG-007 | 真实 Word / PDF 解析 | `.docx` / `.pdf` 最小提取样例；依赖可复现；隐私边界 | 待验证 | Conditional / No-Go split | `python-docx` 未入 requirements；`pdfplumber` 未安装 | 若 MVP 纳入真实化，在 `05/09` 新增或扩展 gate |

## 10. Go / Conditional Go / No-Go 结论

- **Go**：继续使用现有基础栈（Python 3.14 + FastAPI、PostgreSQL + pgvector、React / Vite、OpenAI-compatible adapter、bge-small-zh）作为 Phase2 的技术底座。
- **Conditional Go**：进入 Phase2 前置文档工作与契约工作；可设计首个不触发 PDF 导出、真实 PDF 解析或 OCR 的 vertical slice，但必须先补 `06/07/09` 契约和 UI / WSG 门禁。
- **No-Go until verified**：REQ-027 PDF 导出实现、真实 PDF 解析实现、OCR 实现。上述能力必须先做安装 / 导入 / 最小运行验证，并将新增依赖写入依赖文件后再进入编码。
- **阶段指针**：本报告不改变当前阶段；`ai/project-rules.md` 仍为 Phase1。Phase2 指针切换仍需完成 open items、契约补齐、升级评估和人工确认。

## 11. 对 docs/05、docs/09、docs/08 和依赖文件的修改建议

| 文件 | 建议 | 是否本报告已改 | 触发条件 |
|---|---|---|---|
| `docs/05-tech-spec.md` | 在 §5.1 保持 RG-006 待评估，并补充本报告路径；若确认 AI 润色复用 adapter，可在 TCD / 依赖矩阵补 P2 REQ-014 条目 | 否 | 用户确认回填正式文档后 |
| `docs/09-verification.md` | 新增 P2 TC：AI 润色引用、PDF 导出、标签 / 反链 / 快速录入、Word / PDF 解析真实化边界 | 否 | Batch B 或 P2 TC 回填时 |
| `docs/08-dev-plan.md` | Sprint-11 后续加 tech-env 结论作为 Phase2 前置条件；首个 vertical slice 需避开未解 RG-006 / OCR | 否 | Phase2 计划冻结时 |
| `docs/06-db-design.md` | 为 REQ-012 / 025 / 026 补字段、索引、迁移策略和权限影响 | 否 | Batch B |
| `docs/07-api-spec.md` | 为标签、反链、快速录入、AI 润色 / 引用、PDF 导出补 endpoint contract、错误码、权限 | 否 | Batch B |
| `backend/requirements.txt` | 仅在实际安装验证通过后加入 `reportlab` / `weasyprint` / `python-docx` / `pdfplumber` 等新增依赖 | 否 | 用户确认安装 + 验证通过后 |

## 12. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 | 阻塞关系 |
|---|---|---|---|---|---|---|
| TE-P2-C-001 | 首个 Phase2 vertical slice 是否避开 PDF / OCR | 建议避开，优先做标签 / 反链 / 快速录入中的最小闭环 | RG-006 与 RG-003 未解；基础栈已 Go | 先做 PDF 导出 spike | 避开可更快进入可验收 slice；先做 PDF 可提前解除 REQ-027 但增加依赖风险 | 阻塞 P2 实现任务选择 |
| TE-P2-C-002 | PDF 导出候选库优先级 | 建议先根据导出复杂度决定：简单文档优先验证 `reportlab`；若需 HTML/CSS 还原则验证 `weasyprint` | 两者均未安装；`docs/05` 仅登记候选 | 同时验证两个库 | 同时验证更全面但更耗时；单库 spike 更快 | 阻塞 REQ-027 Go |
| TE-P2-C-003 | Word / PDF 解析是否纳入 Phase2 MVP | 建议与 PDF 导出分开评估；首个 P2 slice 不强绑真实解析 | `python-docx` 未入 requirements，`pdfplumber` 未安装 | 将真实解析作为 MVP 必做 | 纳入会提升导入真实度，也会扩大依赖和隐私验证范围 | 阻塞真实导入验收口径 |
| TE-P2-C-004 | OCR 是否继续后置 | 建议继续后置，维持 `RG-003 No-Go` 和已提取文本降级 | OCR 重型依赖未安装，现有文档已标 No-Go | 开 OCR 专项评估 | 后置可降低 MVP 风险；专项评估会消耗环境验证时间 | 不阻塞非 OCR P2 slice；阻塞 OCR 实现 |
| TE-P2-C-005 | 是否允许下一步执行 Batch B | 建议允许，补 P2 核心 5 项 DB / API / TC 契约 | open-items 建议顺序：tech-env 后执行 Batch B | 先做 PDF spike | Batch B 可解除编码前契约阻塞；PDF spike 可优先解除 REQ-027 技术风险 | 阻塞 Phase2 升级评估 |

## 13. 报告落盘说明

- 本报告已按用户确认写入 `docs/research/2026-07-14-tech-env-evaluation-phase2.md`。
- 本报告只记录本地环境事实、已执行只读验证、候选路线与待确认项；未修改 `docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 或依赖文件。
- 若后续用户确认回填正式文档，应将本报告的 RG / Risk / TC 建议拆分写入 `05/08/09/06/07`，不得直接把候选建议写成已验收事实。

## 可回流模板优化建议

- 暂无必须回流项。可选优化：`tech-env-evaluation` Prompt 可增加 Windows PowerShell 下 `npm.cmd` 与 Docker pipe 沙箱隔离的提示，但本项目可先作为本地经验记录，不直接创建 `_proposals/`。
