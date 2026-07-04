# 技术路线与环境评估报告：Phase1 后端运行基线

## 1. 评估摘要

本次评估由 Sprint-1 后端运行接入时暴露的问题触发：项目文档将后端运行时固定为 Python 3.12.x，但本机实际默认环境为 Python 3.14.3。按既有 `backend/requirements.txt` 在 Python 3.14 下安装时，`pydantic-core` 回退到源码构建并因缺少 MSVC `link.exe` 失败。

结论：

- **不是 Python 3.14 路线已被证明不可行**；当前失败是“旧依赖锁定版本 + Python 3.14”组合不兼容。
- Sprint-1 已实现的 FastAPI / Pydantic API 逻辑，在本机已有较新依赖下可导入并通过 13 个后端测试。
- Phase1 全链路依赖不止 FastAPI / Pydantic，还包括 PostgreSQL 驱动、SQLAlchemy/Alembic、文档解析、Embedding、OCR 等；因此不能仅凭 Sprint-1 测试直接把整个 Phase1 基线升级到 Python 3.14。
- 建议采用“**环境优先、最新优先、兼容性实测**”原则：默认贴近本机主版本，除非依赖实测不支持，再退到 LTS / 旧版本。

本报告建议将当前结论标为 **Conditional Go：倾向评估 Python 3.14 路线，但需完成 Phase1 依赖矩阵安装 / 导入 / 最小运行验证后，再修订 `docs/05-tech-spec.md` 与依赖文件。**

## 2. 评估范围与依据

### 2.1 输入文档

- `docs/env/local-env.md`：本机环境采集，记录 Python 3.14.3。
- `docs/05-tech-spec.md`：当前技术方案，后端运行时写为 Python 3.12.x。
- `docs/09-verification.md`：本机资源与依赖验证口径。
- `backend/requirements.txt`：Sprint-1 后端运行依赖清单。
- Sprint-1 本地运行日志：`pip install -r backend/requirements.txt` 在 Python 3.14 下构建 `pydantic-core` 失败；`python -m unittest discover -s tests/backend -v` 通过。

### 2.2 当前事实

| 项 | 当前事实 | 影响 |
|---|---|---|
| 本机 Python | 3.14.3 | 与 `docs/05-tech-spec.md` 的后端 3.12.x 基线不一致 |
| 后端锁定依赖 | FastAPI 0.115.x / Uvicorn 0.34.x / Pydantic 2.10.x | 与 Python 3.14 组合安装失败 |
| 本机已有较新依赖 | FastAPI 0.136.3 / Uvicorn 0.49.0 / Pydantic 2.13.4 | Sprint-1 API 可导入、测试可通过 |
| 失败点 | `pydantic-core` 源码构建缺 MSVC linker | 说明旧依赖未覆盖 Python 3.14 wheel 场景 |
| 端口绑定 | Uvicorn 绑定 localhost 出现 WinError 10013 | 与 Python 版本无关，需独立排查端口 / 权限 / 安全策略 |

## 3. 问题复盘

### 3.1 为什么不应直接硬锁 3.12

项目模板与当前项目确实有环境评估缺口：环境采集记录了本机 Python 3.14.3，但技术方案在未充分说明取舍的情况下选择 Python 3.12.x。对单项目而言这可运行；对多项目长期维护而言，会造成每个项目一个 Python 主版本，增加维护成本。

更合理的策略应是：

1. 先识别本机默认工具链与团队标准工具链。
2. 优先尝试当前主版本 / 最新稳定版本。
3. 对全部关键依赖做安装、导入、最小运行验证。
4. 只有在明确不兼容或风险不可接受时，才退到旧版本或 LTS。
5. 将评估证据写入报告，再修订 `docs/05-tech-spec.md`。

### 3.2 为什么之前没有提前发现

原因是环境评估只覆盖了“工具存在与资源是否大致可用”，没有执行“按锁定依赖实际安装”的验证步骤。

缺失检查包括：

- 没有用本机默认 Python 执行 `python -m pip install -r backend/requirements.txt`。
- 没有检查关键依赖是否有当前 Python 主版本的预编译 wheel。
- 没有建立“本机已安装版本 / 文档锁定版本 / 最新可用版本”的差异矩阵。
- 没有把运行时主版本不一致列为阻塞或风险项。

## 4. Phase1 依赖评估矩阵

| 层 | 当前文档基线 | Python 3.14 状态 | 评估结论 |
|---|---|---|---|
| FastAPI API | FastAPI 0.115.x / Pydantic 2.10.x | 旧组合安装失败；本机较新组合可导入并通过 Sprint-1 测试 | 倾向升级，但需锁定可安装版本 |
| Uvicorn | 0.34.x | 本机 0.49.0 可导入；端口绑定另有 WinError 10013 | 需区分依赖兼容与端口权限 |
| ORM / 迁移 | SQLAlchemy 2.0.x / Alembic 1.14.x / psycopg 3.2.x | 未测试 | 阻塞 Python 3.14 全面升级结论 |
| 文档解析 | python-docx 1.1.x / pdfplumber 0.11.x | 未测试 | 需安装 / 导入 / 样例解析验证 |
| Embedding | sentence-transformers 3.0.x / bge-small-zh | 未测试 | 高风险，需单独验证 Python、PyTorch、模型下载 / 本地加载 |
| OCR | PaddleOCR 2.8.x | 未测试 | 高风险，可维持降级策略 |
| 前端 | Node.js 22.17.1 / npm 11.11.0 | 本机一致 | 非本次 Python 问题范围 |
| 数据库 | PostgreSQL 16.x / pgvector 0.7.x | 未启动验证 | 需 Docker Compose 验证 |

## 5. 建议决策

### 5.1 当前不建议立即提交“强制 Python 3.12”

`scripts/run-backend.ps1` 中强制拒绝 Python 3.14 只解决了旧依赖安装失败，但不符合“减少本机多版本维护成本”的目标。该策略应降级为临时说明，而非长期基线。

### 5.2 建议新增一个技术环境评估任务

在进入 Sprint-2 前执行：

1. 建立干净虚拟环境。
2. 以本机默认 Python 3.14 为优先路线，尝试锁定新依赖版本。
3. 逐项安装 / 导入 / 最小运行验证：FastAPI、SQLAlchemy、psycopg、Alembic、python-docx、pdfplumber、sentence-transformers、PaddleOCR。
4. 若 Python 3.14 路线可行，修订：
   - `docs/05-tech-spec.md`
   - `backend/requirements.txt`
   - `backend/README.md`
   - `scripts/run-backend.ps1`
5. 若部分依赖不支持 Python 3.14，记录不支持证据，再决定是否使用 Python 3.12 或按功能降级。

### 5.3 建议模板层新增机制

模板应在生成 `docs/05-tech-spec.md` 或进入编码前，要求产出“技术路线与环境评估报告”。这不是仅采集环境，而是基于项目阶段和交付物形态，对技术栈、工具链、依赖、模型、系统资源、网络 / 权限、Docker / 本机服务进行可执行验证。

对于保留 `backend/`、`frontend/`、`docker/`、数据库、本机模型或外部 API 等真实运行依赖的项目，该报告应作为进入首个编码 Sprint 的门禁输入；未形成报告时不得开工，除非用户明确批准跳过并记录风险与补做时点。

## 6. 风险项

| 风险 | 影响 | 建议处理 |
|---|---|---|
| 仅测试 Sprint-1 API，不代表整个 Phase1 | 后续导入 / Embedding / OCR 可能仍不支持 Python 3.14 | 进入 Sprint-2 前补完整依赖矩阵验证 |
| Python 3.14 为较新主版本 | 部分 AI / OCR / 科学计算包可能滞后 | 优先验证高风险包，不盲目升级 |
| 端口绑定 WinError 10013 | 影响真实 Uvicorn 本机启动 | 独立排查端口保留 / 防火墙 / 安全软件；保留无端口 handler 测试 |
| 依赖版本升级可能带来 API 差异 | 文档和代码可能漂移 | 升级后同步 `docs/05` 与测试 |

## 7. Go / No-Go 结论

| 结论 | 说明 |
|---|---|
| Sprint-1 service / API handler 测试 | Go，已通过 |
| 按旧依赖在 Python 3.14 安装 | No-Go，已失败 |
| Python 3.14 作为 Phase1 后端基线 | Conditional Go，需完整依赖矩阵验证 |
| 强制所有开发者安装 Python 3.12 | 不建议作为长期策略，除非完整评估证明 3.14 不可行 |

## 8. 待确认项

- 是否将“减少本机多版本维护成本”作为本项目技术基线原则写入 `docs/05-tech-spec.md`。
- 是否批准在进入 Sprint-2 前执行一次完整 Phase1 依赖矩阵验证。
- 若 Python 3.14 路线验证通过，是否同步升级后端基线和依赖锁定版本。
- 是否将“技术路线与环境评估报告”作为本项目后续 Phase / 首个编码 Sprint 的固定门禁。

## 9. 依赖矩阵实测记录（2026-07-04）

> 本节记录本轮按“优先评估 Python 3.14 路线”执行的实际验证结果。验证尽量使用隔离目录，避免污染全局环境。

### 9.1 验证环境

| 项 | 结果 |
|---|---|
| Python | 3.14.3 |
| venv | `python -m venv .venv-py314-eval` 创建过程触发 `ensurepip` 非零退出，生成的 venv 无 pip；该问题需单独排查 |
| 替代验证方式 | 使用 `pip install --target <临时目录>` 做隔离安装 / 导入验证，验证后已清理临时目录 |
| pip index | 清华镜像 |
| Docker | Docker CLI 存在，但 Docker Desktop Linux engine 未运行，无法连接 daemon |
| Node / npm | Node.js `v22.17.1`；`npm.cmd 11.11.0` 可用，PowerShell 直接执行 `npm.ps1` 会被 ExecutionPolicy 拦截 |

### 9.2 Python 3.14 依赖验证结果

| 层 | 验证包 / 版本 | 安装结果 | 导入 / 最小运行结果 | 结论 |
|---|---|---|---|---|
| FastAPI API | FastAPI 0.136.3 / Uvicorn 0.49.0 / Pydantic 2.13.4 | 成功，`pydantic-core 2.46.4 cp314` wheel 可用 | `create_app()` 可创建；`/api/auth/login`、`/api/spaces`、`/api/spaces/switch` 路由存在 | Go |
| ORM / 迁移 | SQLAlchemy 2.0.51 / Alembic 1.18.5 / psycopg 3.3.4 | 成功 | 导入成功 | Go（未连真实 PostgreSQL） |
| 文档解析 | python-docx 1.2.0 / pdfplumber 0.11.10 / Pillow 12.3.0 / pypdfium2 5.11.0 | 成功 | 导入成功 | Go（未做样本文档解析） |
| Embedding | sentence-transformers 5.6.0 / torch 2.12.1 / transformers 5.13.0 | 成功 | `import torch` 失败：`WinError 1114`，加载 `torch/lib/c10.dll` 或其依赖失败 | No-Go（当前本机 / 验证方式下） |
| OCR（当前文档基线） | PaddleOCR 2.8.1 | dry-run 失败：依赖 `numpy<2.0`，Python 3.14 可用 numpy 版本为 2.x | 未进入导入验证 | No-Go |
| OCR（较新版本路线） | `paddleocr` 未钉版本 | dry-run 可解析到较新依赖组合，但包体较大且未安装 / 未导入验证 | 未验证 | Conditional |
| Docker / PostgreSQL / pgvector | Docker 29.5.2 CLI | CLI 存在 | Docker daemon 连接失败：`dockerDesktopLinuxEngine` pipe 不存在 | No-Go（需启动 Docker Desktop） |
| API 端口启动 | Uvicorn localhost | 依赖可导入 | 绑定 localhost 端口仍出现 WinError 10013 | No-Go（端口 / 权限问题，与 Python 版本独立） |

### 9.3 实测命令摘要

已通过：

```powershell
python -m pip install --target .eval-py314-site --only-binary=:all: fastapi==0.136.3 uvicorn==0.49.0 pydantic==2.13.4
python -m pip install --target .eval-py314-site --only-binary=:all: SQLAlchemy alembic psycopg python-docx pdfplumber
$env:PYTHONPATH = (Join-Path (Get-Location) '.eval-py314-site')
python -c "import fastapi,uvicorn,pydantic,sqlalchemy,alembic,psycopg,docx,pdfplumber,PIL,pypdfium2; from backend.main import create_app; print([r.path for r in create_app().routes if r.path.startswith('/api')])"
python -m pip install --target .eval-py314-embedding --only-binary=:all: sentence-transformers==5.6.0
```

失败 / 未通过：

```text
python -m venv .venv-py314-eval
# ensurepip 非零退出，venv 中无 pip

import torch
# WinError 1114: 加载 torch/lib/c10.dll 或其依赖失败

python -m pip install --dry-run --only-binary=:all: paddleocr==2.8.1
# No matching distribution for numpy<2.0 on Python 3.14

docker info
# Docker daemon 未运行 / pipe 不存在

uvicorn backend.main:app --host 127.0.0.1 --port 8011
# WinError 10013 端口绑定失败
```

### 9.4 更新后的 Go / No-Go 判断

| 范围 | 结论 | 说明 |
|---|---|---|
| Sprint-1 后端 API / 权限底座 | Go | 当前代码和 API handler 测试可继续使用 |
| Python 3.14 + 后端 Web / ORM / 文档解析基础栈 | Conditional Go | 依赖安装 / 导入通过，但尚未连真实 DB、未跑端口服务 |
| Python 3.14 + Phase1 完整闭环 | No-Go（当前） | Embedding torch 导入失败、PaddleOCR 2.8.x 不兼容、Docker daemon 未运行、端口绑定失败 |
| 是否立即修订 `docs/05-tech-spec.md` 为 Python 3.14 | 暂不建议 | 需要先解决 Embedding / OCR / Docker / 端口问题，或明确降级策略 |

### 9.5 建议后续动作

1. 优先排查 Python 3.14 下 `torch` 导入失败：确认是否与 `--target` 安装方式、VC++ runtime、CUDA / CPU wheel、PATH / DLL 搜索路径有关；建议在可用 pip 的标准 venv 中复测。
2. 决定 OCR 路线：若坚持 PaddleOCR 2.8.x，则 Python 3.14 路线不成立；若接受升级 PaddleOCR 或 Phase1 关闭 OCR，需要同步 `docs/05-tech-spec.md` / `docs/09-verification.md`。
3. 启动 Docker Desktop 后验证 PostgreSQL + pgvector 镜像、容器和扩展。
4. 排查 WinError 10013：端口占用 / 保留 / 防火墙 / 安全策略；不应归因于 Python 版本。
5. 在上述阻塞解决前，不建议把整个 Phase1 后端基线升级为 Python 3.14；可先局部记录“后端 Web / ORM / 文档解析基础栈已具备 Python 3.14 升级可行性”。

## 10. Docker / 端口 / OCR 路线诊断（2026-07-04）

### 10.1 Docker daemon

诊断结果：

- `docker context ls` 显示当前上下文为 `desktop-linux`，endpoint 为 `npipe:////./pipe/dockerDesktopLinuxEngine`。
- `docker version` 只能返回 Client 信息，无法连接 Server。
- `docker info` Server 字段为空，并报错：`dockerDesktopLinuxEngine` pipe 不存在。
- `wsl -l -v` / Docker 相关 WSL 枚举出现 `E_ACCESSDENIED`。

判断：Docker CLI 已安装，但 Docker Desktop Linux engine 未运行或当前用户无权访问 WSL / Docker Desktop engine。该问题与 Python 版本无关。

建议处理：

1. 手动启动 Docker Desktop，并确认界面显示 Engine running。
2. 若仍失败，检查 WSL 权限 / Docker Desktop 后端设置。
3. Docker 可用后再验证 PostgreSQL + pgvector；当前不能把数据库容器路线判为 Go。

### 10.2 localhost 端口绑定

诊断结果：

- `netsh interface ipv4 show excludedportrange protocol=tcp` 显示端口 `7998-8097` 被系统排除，因此 `8000`、`8010`、`8020` 均不可绑定。
- Python 原生 socket bind 测试：`8000 / 8010 / 8020` 均返回 WinError 10013；`18000 / 28000 / 49152` 可绑定。
- 使用 `127.0.0.1:18000` 启动 Uvicorn 后，Sprint-1 smoke test 成功：登录、空间列表、空间切换均返回预期结果。

判断：端口绑定失败是 Windows 端口排除范围导致，不是 FastAPI / Uvicorn / Python 版本问题。

建议处理：

- 将本地后端默认端口从 `8000` 调整为 `18000`，或在运行说明中明确避开 `7998-8097`。
- 若后续必须使用 8000，需要管理员权限调整端口排除 / 相关服务配置，不建议作为 Demo 前置条件。

### 10.3 OCR 路线

诊断结果：

- 当前文档基线 `PaddleOCR 2.8.1` 在 Python 3.14 下 dry-run 失败，原因是其依赖 `numpy<2.0`，而 Python 3.14 可用 numpy wheel 为 2.x。
- `paddleocr>=3.0` dry-run 会进入 3.x / paddlex 依赖路线；在 `--only-binary=:all:` 条件下卡在 `GPUtil>=1.4` 无可用二进制包。该失败不等同于 3.x 路线不可行，但说明依赖链仍需进一步安装 / 导入验证。

判断：

- 若坚持 PaddleOCR 2.8.x，则 Python 3.14 作为完整 Phase1 基线不成立。
- 若允许 Phase1 OCR 降级为“已提取文本”或升级到 PaddleOCR 3.x，则 Python 3.14 路线仍可继续评估。

建议决策：Phase1 Demo 优先采用 OCR 降级策略，不把 OCR 作为阻塞 Python 3.14 Web/ORM/文档解析基础栈的条件；若必须演示 OCR，再单独评估 PaddleOCR 3.x 或替代 OCR 引擎。

### 10.4 更新后的建议

| 问题 | 结论 | 是否阻塞 Sprint-2 |
|---|---|---|
| Docker daemon 未运行 | 需手动启动 / 修复 WSL 权限后再验证 DB 容器 | 不阻塞文档管理 service 设计；阻塞真实 PostgreSQL 集成 |
| 端口 8000/8010/8020 不可绑定 | 改用 18000 可成功跑通 Sprint-1 API | 不阻塞，改默认端口即可 |
| PaddleOCR 2.8.x 不支持 Python 3.14 | 当前 OCR 基线不适配 | 不阻塞 Sprint-2；进入导入/OCR Sprint 前必须决策降级或升级 |
| torch 导入失败 | Embedding 路线仍阻塞 Python 3.14 完整闭环 | 不阻塞 Sprint-2 文档 CRUD；阻塞检索/RAG Sprint |

因此，Sprint-2（文档管理 + 版本）可以继续，但真实 PostgreSQL 接入前需先恢复 Docker daemon；检索 / RAG / OCR 相关 Sprint 前必须解决 torch / OCR 路线。
