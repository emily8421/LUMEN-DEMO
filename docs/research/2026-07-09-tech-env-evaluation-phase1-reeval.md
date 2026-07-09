# 技术路线与环境评估复核报告：Phase1 真实化阻塞

> 定位：技术环境评估留痕（`ai/document-lifecycle-rules.md §2`），**复核**（re-evaluation），对照首评 `docs/research/2026-07-04-tech-env-evaluation-phase1.md`。
> 审计日期：2026-07-09；触发：P2-E 文档回梳（PR #37–#42）完成后，评估 Phase1 真实化阻塞现状与解锁路径。
> 不替代 `docs/env/local-env.md`、`docs/05-tech-spec.md`、`docs/09-verification.md`；结论回填 `05 §5.1` Readiness Gate。

## 1. 评估摘要

- **范围**：Phase1 真实化 4 阻塞（pgvector / Embedding / OCR / LLM）+ Web/ORM 基础栈。
- **结论**：整体仍 **No-Go（完整闭环）**——4 个真实化阻塞**均未解除**；Web/ORM 基础栈 **Conditional Go**（与 2026-07-04 一致）。
- **最关键 3 条理由**：
  1. Docker daemon **仍 No-Go**（`dockerDesktopLinuxEngine` pipe 不存在），pgvector 全链路卡此；
  2. `backend/requirements.txt` 与 `.venv` 实际版本 **drift**（锁的版本在 Python 3.14 下构建失败，实际跑的是另一套）；
  3. **LLM 中转（RG-004）是唯一不依赖 Docker/torch 的真实化路径**，可独立 Spike。
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
| .venv 实际依赖 | fastapi 0.136.3 / pydantic 2.13.4 / pydantic_core 2.46.4 / python-docx 1.2.0 / uvicorn 0.49.0 | 本次诊断 pip list |
| requirements.txt 锁定 | fastapi 0.115.14 / uvicorn 0.34.3 / pydantic 2.10.6 | backend/requirements.txt |
| torch | **未装**（import 失败 = 缺包，非装坏） | 本次诊断 |
| migrations | `001_sprint1_space_permissions.sql`、`002_sprint2_document_versions.sql`（已写未接线） | 本次诊断 |
| docker/ | 空（仅 `.gitkeep`，无 compose） | 本次诊断 |
| 端口 | `7998-8097` 被系统排除；改用 18000 可绑定（首评 §10.2 已解） | 首评 |

## 4. 阻塞复核（vs 2026-07-04 首评）

| RG-ID | 真实依赖 | 2026-07-04 首评 | 2026-07-09 复核 | 变化 |
|---|---|---|---|---|
| RG-001 | PostgreSQL + pgvector | No-Go（Docker daemon 未起） | **仍 No-Go**（daemon 仍未起，pipe 不存在） | 未变 |
| RG-002 | Embedding（bge-small-zh） | No-Go（`--target` 装 torch 后导入失败 WinError 1114） | **仍 No-Go**（`.venv` 根本未装 torch） | 未变（原因细化：未装而非装坏） |
| RG-003 | OCR（PaddleOCR） | No-Go（2.8.x 依赖 numpy<2.0，Python 3.14 无） | **仍 No-Go（降级）** | 未变 |
| RG-004 | LLM（OpenAI 兼容） | Mock（未配置） | **仍 Mock** | 未变（最少阻塞） |
| RG-005 | Web/ORM 基础栈 | Conditional Go（53 tests） | **Conditional Go**（未变） | 未变 |

> 4 个真实化阻塞自首评以来**一个都没解除**；环境侧（Docker 启动、torch 安装、OCR 定版、LLM 凭据）均需本机 / 人工操作，AI 在 sandbox 无法代劳。

## 5. 新发现（本次复核增量）

### 5.1 `requirements.txt` 与 `.venv` drift（一致性缺口）
- `requirements.txt` 锁定 `fastapi==0.115.14 / uvicorn==0.34.3 / pydantic==2.10.6`——首评 §9.2 已证该组合在 Python 3.14 下 `pydantic-core` 源码构建失败（缺 MSVC linker）。
- `.venv` 实际跑的是 `fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4`（本机较新版本，`pydantic_core 2.46.4 cp314` wheel 可用，53 tests 通过）。
- 即：**锁的版本装不上，跑的版本没锁**。首评 §5.2 建议"锁定可安装版本"**未落实**。任何按 `requirements.txt` 重建 venv 的尝试都会失败。

### 5.2 `python-docx 1.2.0` 已在 .venv
- .docx 解析基础栈就绪（首评 §9.2 验证导入 Go）；但 `pdfplumber` / `psycopg` / `sqlalchemy` / `alembic` 仍缺（requirements.txt 未列）。

### 5.3 torch「未装」而非「装坏」
- 首评用 `pip install --target` 装 torch 后导入失败（WinError 1114 加载 c10.dll），怀疑 `--target` 安装方式 + DLL 搜索路径问题（首评 §9.5 建议 1）。
- 本次：`.venv` 直接**未装 torch**。**在标准 venv（非 --target）直接装 torch 是否 OK，仍未验证**——这是 RG-002 可能的低成本解锁点。

## 6. 解锁路线图（按 价值 / 阻塞 排序）

| 顺序 | 解锁项 | 前置 | 解锁后价值 | 谁执行 |
|---|---|---|---|---|
| 1 | **LLM 中转（RG-004）** | 公司内网 OpenAI 兼容 endpoint + key | RAG 从"返回模板"→**真实问答**；不依赖 Docker/torch | 用户提供凭据 + AI 改 `rag.py`/adapter |
| 2 | **Docker daemon（RG-001 前置）** | 手动启动 Docker Desktop + WSL 权限 | 解锁 pgvector 容器路线 | 用户本机 |
| 3 | **pgvector 接入（RG-001）** | Docker 起来 + 补 `docker-compose.yml` + 接线 SQLAlchemy/Alembic/psycopg + 跑 migration | 向量检索真实化（REQ-007/008） | Docker 解锁后 AI 可做 |
| 4 | **Embedding（RG-002）** | 标准装 torch（复测 §9.5）或公司内网 `/v1/embeddings` | 向量召回 | AI 验证 + 可能服务器 |
| 5 | OCR（RG-003） | PaddleOCR 3.x 或替代引擎定版 | REQ-010 | 最低优先，降级已接受 |

## 7. Readiness Gate 复核结论

> 与 `05 §5.1` 一致，本次复核确认 RG-001..005 状态**均未变**，无需修订 05 §5.1（除非落实解锁）。`05 ↔ 09 §6` 双向链接（RG-ID）已在 P0/P1 批次建立。

## 8. Go / Conditional Go / No-Go 结论

| 范围 | 结论 | 说明 |
|---|---|---|
| 当前降级 Demo（内存） | Go | 继续可用，53 tests + 浏览器 smoke 通过 |
| Web/ORM 基础栈（RG-005） | Conditional Go | 已接入，但 requirements.txt drift 待修 |
| LLM 真实化（RG-004） | Conditional Go | **可独立 Spike**，仅需凭据 + 改 adapter |
| 完整闭环（pgvector + Embedding + OCR + LLM） | **No-Go** | 4 阻塞未解除，真实化移 Phase2/MVP |

## 9. 修改建议（需用户确认后另行 PR）

1. **修 `requirements.txt` drift**：锁定版本改为匹配 `.venv` 实际可跑版本（fastapi 0.136.3 / uvicorn 0.49.0 / pydantic 2.13.4），或显式标注"Python 3.12 锁定 / Python 3.14 实际"双轨。否则 `pip install -r` 重建必失败。
2. **LLM Spike（RG-004）**：用户提供内网中转 endpoint + key 后，新增 `backend/service/llm_adapter.py`（OpenAI 兼容封装），改 `rag.py` 从模板 → 调真实 LLM；同步 07 API-010 状态、09 TC-P1-008。
3. **`docker-compose.yml`（RG-001）**：Docker 解锁后补 `docker/compose.yml`（PostgreSQL 16 + pgvector 0.7）+ 接线 SQLAlchemy/Alembic。

## 10. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选 | 取舍影响 / 阻塞 |
|---|---|---|---|---|---|
| TE-C-001 | 是否有公司内网 OpenAI 兼容 LLM endpoint + key 可用于 Demo | 有则启动 RG-004 Spike（最高价值真实化） | RG-004 是唯一不依赖 Docker/torch 的路径 | 无则 LLM 继续 Mock，转 Phase2 规划 | 阻塞 RAG 真实化 |
| TE-C-002 | `requirements.txt` drift 修法 | 锁定版本对齐 .venv 实际（0.136.3/0.49.0/2.13.4） | 锁的版本在 Py3.14 装不上 | 标注双轨 / 降 Python | 不修则重建 venv 必失败 |
| TE-C-003 | 是否启动 Docker Desktop 解锁 pgvector | 用户本机启动后通知 AI 补 compose + 接线 | pgvector 是向量检索唯一路径 | 用内网 `/v1/embeddings` + 外部向量库（违 project-rules §2） | 阻塞 RG-001/002 真实化 |
| TE-C-004 | torch 标准装复测（验证首评 §9.5） | 在标准 venv `pip install torch` 复测 import | 首评 --target 方式致 DLL 失败，标准装可能 OK | 公司内网 Embedding 服务 | 阻塞 RG-002 |

## 11. 报告落盘说明

- 本文件已落盘至 `docs/research/2026-07-09-tech-env-evaluation-phase1-reeval.md`（用户确认）。
- 不替代 `docs/env/local-env.md`（环境事实）、`docs/05-tech-spec.md`（技术方案 / RG）、`docs/09-verification.md`（验证）。
- 解锁落实后（如 LLM Spike 成功、Docker 起来），应更新 `05 §5.1` 对应 RG 状态 + `09 §6` 风险项 + 本报告追加验证记录。
