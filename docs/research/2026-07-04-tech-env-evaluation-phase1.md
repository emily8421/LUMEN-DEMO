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
