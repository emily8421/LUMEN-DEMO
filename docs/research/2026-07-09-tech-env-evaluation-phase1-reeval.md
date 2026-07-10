# 技术路线与环境评估复核报告：Phase1 真实化阻塞

> 定位：技术环境评估留痕（`ai/document-lifecycle-rules.md §2`），**复核**（re-evaluation），对照首评 `docs/research/2026-07-04-tech-env-evaluation-phase1.md`。
> 审计日期：2026-07-09；触发：P2-E 文档回梳（PR #37–#42）完成后，评估 Phase1 真实化阻塞现状与解锁路径。
> 不替代 `docs/env/local-env.md`、`docs/05-tech-spec.md`、`docs/09-verification.md`；结论回填 `05 §5.1` Readiness Gate。

## 1. 评估摘要

- **范围**：Phase1 真实化 4 阻塞（pgvector / Embedding / OCR / LLM）+ Web/ORM 基础栈。
- **结论**：整体仍 **No-Go（完整闭环）**——RG-001（pgvector）、RG-003（OCR）未解除；**RG-002（Embedding）、RG-004（LLM）已验证 / Go**（2026-07-09 续）；Web/ORM 基础栈 Conditional Go。
- **最关键阻塞（2026-07-09 续）**：
  1. Docker daemon **仍 No-Go**（`dockerDesktopLinuxEngine` pipe 不存在），pgvector 全链路卡此——**唯一剩余硬阻塞**；
  2. `backend/requirements.txt` 与 `.venv` 实际版本 **drift**（锁的版本在 Python 3.14 下构建失败，实际跑的是另一套）；
  3. ✅ **RG-002（Embedding）、RG-004（LLM）已验证 / Go**——torch 经 VC++ Redist 修复（§5.3）、LLM 经 GLM 中转验证（#45）。
- **是否阻塞**：不阻塞当前降级 Demo（内存 `demo_repository`）继续可用；真实化移 Phase2/MVP（见 `05 §5.1`）。

## 2. 评估范围与依据

### 2.1 读取输入
- 首评报告 `docs/research/2026-07-04-tech-env-evaluation-phase1.md`
- `docs/env/local-env.md`（2026-06-24 采集）、`docs/05-tech-spec.md` §5.1 RG、`docs/09-verification.md` §6
- `backend/requirements.txt`、`docs/04-architecture.md`、`docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/08-dev-plan.md`、`docs/design/*`
- `ai/project-rules.md` §2.5 / §2、`ai/prompts/review/20-tech-env-evaluation.md`

### 2.2 本次诊断（只读，2026-07-09，未安装/未启动/未联网）
- `python --version`、`docker version` / `docker info`（daemon 状态）
- `.venv/Scripts/python.exe --version` + `pip list`（实际依赖）
- `.venv` torch import 测试
- `backend/migrations/`、`docker/`、`scripts/` 现状

### 2.3 未做（SOP 只读，需另行确认）
- 依赖安装、Docker 镜像拉取、服务启动、联网验证——均未执行（sandbox 受限 + SOP 要求确认）。

## 3. 本机 / 团队环境事实摘要

| 项 | 事实 | 来源 |
|---|---|---|
| Python | 3.14.3（本机默认） | 本次诊断 + local-env |
| Docker | 29.5.2 Client；**daemon 未运行**（pipe 不存在） | 本次诊断 |
| .venv | 存在（Python 3.14.3） | 本次诊断 |
| .venv 实际依赖 | fastapi 0.136.3 / pydantic 2.13.4 / pydantic_core 2.46.4 / python-docx 1.2.0 / uvicorn 0.49.0；RG-002 验证另装 torch 2.13.0+cpu / sentence-transformers 5.6.0 / numpy 2.5.1 / transformers 5.13.0（**仅验证用，未入 requirements.txt**） | 本次诊断 pip list + RG-002 验证 |
| requirements.txt 锁定 | fastapi 0.115.14 / uvicorn 0.34.3 / pydantic 2.10.6 | backend/requirements.txt |
| torch | **已装 2.13.0+cpu**（RG-002 验证：装 VC++ Redist 后 import OK，见 §5.3） | 本次诊断 + RG-002 验证 |
| migrations | `001_sprint1_space_permissions.sql`、`002_sprint2_document_versions.sql`（已写未接线） | 本次诊断 |
| docker/ | 空（仅 `.gitkeep`，无 compose） | 本次诊断 |
| 端口 | `7998-8097` 被系统排除；改用 18000 可绑定（首评 §10.2 已解） | 首评 |

## 4. 阻塞复核（vs 2026-07-04 首评）

| RG-ID | 真实依赖 | 2026-07-04 首评 | 2026-07-09 复核 | 变化 |
|---|---|---|---|---|
| RG-001 | PostgreSQL + pgvector | No-Go（Docker daemon 未起） | **仍 No-Go**（daemon 仍未起，pipe 不存在） | 未变 |
| RG-002 | Embedding（bge-small-zh） | No-Go（`--target` 装 torch 后导入失败 WinError 1114） | **已验证**（2026-07-09 续：VC++ Redist 修复后 torch 2.13.0+cpu import OK，bge-small-zh-v1.5 生成 512 维 float32；见 §5.3） | **解除**（已验证；待 pgvector 接入才已启用） |
| RG-003 | OCR（PaddleOCR） | No-Go（2.8.x 依赖 numpy<2.0，Python 3.14 无） | **仍 No-Go（降级）** | 未变 |
| RG-004 | LLM（OpenAI 兼容） | Mock（未配置） | **Go（GLM-5.2 已验证，Sprint-7 #45）** | **解除**（05 §5.1 已回填） |
| RG-005 | Web/ORM 基础栈 | Conditional Go（53 tests） | **Conditional Go**（未变） | 未变 |

> 2026-07-09 续：RG-002（Embedding）、RG-004（LLM）**已验证 / Go**；RG-001（pgvector / Docker）、RG-003（OCR）**仍 No-Go 未变**。torch 经 VC++ Redist 修复、LLM 经 GLM 中转验证；待解锁仅余 Docker（pgvector）与 OCR。

## 5. 新发现（本次复核增量）

### 5.1 `requirements.txt` 与 `.venv` drift（一致性缺口）
- `requirements.txt` 锁定 `fastapi==0.115.14 / uvicorn==0.34.3 / pydantic==2.10.6`——首评 §9.2 已证该组合在 Python 3.14 下 `pydantic-core` 源码构建失败（缺 MSVC linker）。
- `.venv` 实际跑的是 `fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4`（本机较新版本，`pydantic_core 2.46.4 cp314` wheel 可用，53 tests 通过）。
- 即：**锁的版本装不上，跑的版本没锁**。首评 §5.2 建议"锁定可安装版本"**未落实**。任何按 `requirements.txt` 重建 venv 的尝试都会失败。

### 5.2 `python-docx 1.2.0` 已在 .venv
- .docx 解析基础栈就绪（首评 §9.2 验证导入 Go）；但 `pdfplumber` / `psycopg` / `sqlalchemy` / `alembic` 仍缺（requirements.txt 未列）。

### 5.3 RG-002 已验证（2026-07-09 续，TE-C-004 闭合）
- **根因**：首评 / 复核 `import torch` 失败 `WinError 1114`（加载 `c10.dll`）的真因是**本机 VC++ runtime 过旧**（`v14.28.29325`，2020 VS2019 时代）+ `C:\Windows\System32\VCRUNTIME140.dll` 缺失，torch 2.13 `c10.dll` 需更新 runtime 初始化。**非** `--target` 安装方式问题（标准 venv 同样失败）。
- **修复**：装 Microsoft Visual C++ Redistributable 2015-2022 x64 最新版（`https://aka.ms/vs/17/release/vc_redist.x64.exe`）后，标准 venv `import torch` → `torch OK 2.13.0+cpu`。
- **Embedding 验证**：`.venv` 装 `sentence-transformers 5.6.0`（带 numpy 2.5.1 / transformers 5.13.0 / tokenizers / scipy / scikit-learn，**仅验证用，未入 requirements.txt**），加载 `BAAI/bge-small-zh-v1.5` 生成向量 = **`dim (1, 512) float32`**（与 project-rules §2 的 512 维约束一致）。
- **关键环境约束（真实化接入必须遵循，否则公司网络下必崩）**：
  - **`HF_HUB_DISABLE_XET=1`**：huggingface_hub 1.22 默认装 `hf-xet` 走 Xet 协议**绕过 HTTP 代理**，公司网络下连不上（curl / python requests 通，但 huggingface_hub 加载模型失败）；禁用后走传统 HTTP，经本地 `HTTPS_PROXY=http://127.0.0.1:7897` 可达 huggingface.co。
  - 模型缓存 `C:\Users\maixh\.cache\huggingface\hub\`（Windows symlink 警告，无害）。
- **状态**：RG-002「本机 Embedding 可运行」**已验证**（≠已启用，尚未接入后端 RAG / pgvector；接入待 RG-001 Docker 解锁）。

## 6. 解锁路线图（按 价值 / 阻塞 排序）

| 顺序 | 解锁项 | 前置 | 解锁后价值 | 谁执行 |
|---|---|---|---|---|
| 1 | **LLM 中转（RG-004）** | ✅ **已验证**（GLM-5.2，Sprint-7 #45） | RAG 从"返回模板"→**真实问答** | 已完成 |
| 2 | **Docker daemon（RG-001 前置）** | 手动启动 Docker Desktop + WSL 权限 | 解锁 pgvector 容器路线 | 用户本机 |
| 3 | **pgvector 接入（RG-001）** | Docker 起来 + 补 `docker-compose.yml` + 接线 SQLAlchemy/Alembic/psycopg + 跑 migration | 向量检索真实化（REQ-007/008） | Docker 解锁后 AI 可做 |
| 4 | **Embedding（RG-002）** | ✅ **已验证**（torch 修复 + 512 维 float32） | 向量召回（待 pgvector 接入生成真实向量） | AI 验证完成；接入待 RG-001 |
| 5 | OCR（RG-003） | PaddleOCR 3.x 或替代引擎定版 | REQ-010 | 最低优先，降级已接受 |

## 7. Readiness Gate 复核结论

> 2026-07-09 续：RG-002、RG-004 **已变**（已验证 / Go），本次回填执行修订 `05 §5.1` 对应行 + `09 §6`。RG-001（pgvector / Docker）、RG-003（OCR）**仍 No-Go 未变**。`05 ↔ 09 §6` 双向链接（RG-ID）已在 P0/P1 批次建立。

## 8. Go / Conditional Go / No-Go 结论

| 范围 | 结论 | 说明 |
|---|---|---|
| 当前降级 Demo（内存） | Go | 继续可用，53 tests + 浏览器 smoke 通过 |
| Web/ORM 基础栈（RG-005） | Conditional Go | 已接入，但 requirements.txt drift 待修 |
| Embedding（RG-002） | Conditional Go | **已验证**（torch 修复 + 512 维 float32），待 pgvector 接入才已启用 |
| LLM 真实化（RG-004） | Go | GLM-5.2 已验证（Sprint-7，#45） |
| 完整闭环（pgvector + Embedding + OCR + LLM） | **No-Go** | RG-001（pgvector/Docker）、RG-003（OCR）未解除；RG-002/004 已验证 |

## 9. 修改建议（需用户确认后另行 PR）

1. **修 `requirements.txt` drift**：锁定版本改为匹配 `.venv` 实际可跑版本（fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4），或显式标注"Python 3.12 锁定 / Python 3.14 实际"双轨。否则 `pip install -r` 重建必失败。
2. **LLM Spike（RG-004）**：用户提供内网中转 endpoint + key 后，新增 `backend/service/llm_adapter.py`（OpenAI 兼容封装），改 `rag.py` 从模板 → 调真实 LLM；同步 07 API-010 状态、09 TC-P1-008。
3. **`docker-compose.yml`（RG-001）**：Docker 解锁后补 `docker/compose.yml`（PostgreSQL 16 + pgvector 0.7）+ 接线 SQLAlchemy/Alembic。

## 10. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选 | 取舍影响 / 阻塞 |
|---|---|---|---|---|---|
| TE-C-001 | ~~是否有公司内网 OpenAI 兼容 LLM endpoint + key 可用于 Demo~~ | 有则启动 RG-004 Spike | RG-004 是唯一不依赖 Docker/torch 的路径 | 无则 LLM 继续 Mock，转 Phase2 规划 | ✅ **已闭合**（#45 GLM-5.2 验证） |
| TE-C-002 | `requirements.txt` drift 修法 | 锁定版本对齐 .venv 实际（0.136.3/0.49.0/2.13.4） | 锁的版本在 Py3.14 装不上 | 标注双轨 / 降 Python | 不修则重建 venv 必失败 |
| TE-C-003 | 是否启动 Docker Desktop 解锁 pgvector | 用户本机启动后通知 AI 补 compose + 接线 | pgvector 是向量检索唯一路径 | 用内网 `/v1/embeddings` + 外部向量库（违 project-rules §2） | 阻塞 RG-001/002 真实化 |
| TE-C-004 | ~~torch 标准装复测（验证首评 §9.5）~~ | 在标准 venv `pip install torch` 复测 import | 首评 --target 方式致 DLL 失败，标准装可能 OK | 公司内网 Embedding 服务 | ✅ **已闭合**（VC++ Redist 修复后 torch import OK，RG-002 验证，见 §5.3） |

## 11. 报告落盘说明

- 本文件已落盘至 `docs/research/2026-07-09-tech-env-evaluation-phase1-reeval.md`（用户确认）。
- 不替代 `docs/env/local-env.md`（环境事实）、`docs/05-tech-spec.md`（技术方案 / RG）、`docs/09-verification.md`（验证）。
- 解锁落实后（如 LLM Spike 成功、Docker 起来），应更新 `05 §5.1` 对应 RG 状态 + `09 §6` 风险项 + 本报告追加验证记录。

## 12. 后续更新（2026-07-10，task-008 T1–T7 落地后）

> 本节为 point-in-time 留痕的后续追加（不改 §1–§11 的 2026-07-09 复核结论，保审计链）。Sprint-7（LLM）+ Sprint-8（pgvector 接入 task-008 T1–T7）后，原阻塞已大面积解除。

- **RG-001（pgvector）→ Go**：Docker daemon 已 live（TE-C-003 闭合）；`docker/compose.yml` 起 `lumen-pg`（pgvector/pgvector:pg16，:15432）；task-008 T1–T6 完成基建 / migrations（8 张 `lumen_*` 表 + hnsw + GIN）/ ORM + PgRepository / 切单例 / embedding 写入 / RAG 向量召回（bge 余弦 topK，threshold 0.6，加法式叠加关键词路）。74 后端 tests 通过（含 PG 集成 + embedding）。
- **RG-002（Embedding）→ 已启用**：T6 起 `pg_repository.replace_document_chunks` 写 `lumen_chunks.embedding`（512 维 float32）；RG-002 从「已验证」升级为「已启用」。须设 `HF_HUB_DISABLE_XET=1`（公司网络，§5.3 约束保留）。
- **TE-C-002 / PG-C-001（requirements drift）→ 闭合**：T7 起 `backend/requirements.txt` 锁 Python 3.14 实测版本（fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4 / sqlalchemy 2.0.51 / psycopg 3.3.4 / pgvector 0.5.0 / openai 2.44.0 / sentence-transformers 5.6.0）；`05 §1` 声明 Python 3.14 为运行基线。原 3.12 锁定版在 3.14 下构建失败问题消除。
- **TE-C-003（Docker 解锁）→ 闭合**：用户本机启动 Docker Desktop 后，AI 补 compose + 接线完成（task-008 T1）。
- **仍未解除**：RG-003（OCR / PaddleOCR，REQ-010，后续阶段）；真实 Word/PDF 解析（python-docx/pdfplumber，REQ-009 真实化）；GPT/ollama LLM provider（配置位就绪未验证）。完整闭环仍 No-Go（卡 OCR / 真实文档解析）。
- **下游回写**：本节结论已同步 `05 §5.1`（RG-001/002/005 行）、`09 §6`、`06` / `07` / `04` / `design/*`（task-008 T7 分批 PR）。
