# 本机运行环境采集

> 由 `scripts/collect-env.ps1` 自动生成。自动采集项用于辅助技术方案选择；“人工确认项”仍需项目负责人补充。

## 自动采集

- 采集时间：2026-06-24 21:51:24 +08:00
- 计算机名：DESKTOP-9TC9SR2
- 当前用户：maixh
- 工作目录：D:\2-Project\0-Product\3-LUMEN_KnowledgeBase\LUMEN_demo_T2.1
- 操作系统：Microsoft Windows 11 家庭版 中文版 10.0.26200 64 位
- PowerShell：5.1.26100.8655
- CPU：12th Gen Intel(R) Core(TM) i7-12650H
- CPU 核心 / 线程：10 核 / 16 线程
- 内存总量：31.73 GB
- 系统架构：AMD64

### GPU

- Intel(R) UHD Graphics（显存/显存近似：2.00 GB）
- OrayIddDriver Device（显存/显存近似：未知）
- NVIDIA GeForce RTX 3050 6GB Laptop GPU（显存/显存近似：4.00 GB）

### 磁盘

- C: 可用 150.78 GB / 总计 464.95 GB
- D: 可用 99.79 GB / 总计 259.26 GB
- E: 可用 168.16 GB / 总计 195.31 GB

### 常用工具

- Git：git version 2.54.0.windows.1
- Python：Python 3.14.3
- Node.js：v22.17.1
- npm：11.11.0
- Java：已安装（未获取到版本）
- Docker：Docker version 29.5.2, build 79eb04c
- Docker 运行状态：可用

## 人工确认项

- Demo 阶段允许最大内存占用：峰值 < 8GB（本机总内存 31.73GB，保留系统 / IDE / 浏览器 / Docker 余量）
- Demo 阶段允许最大显存占用：峰值 < 4GB（RTX 3050 采集约 4GB 可用；`bge-small-zh` 可 CPU 跑，显存应尽量接近 0）
- Demo 阶段允许最大磁盘占用：< 20GB（覆盖镜像、依赖、模型文件、Demo 数据与导入文件；项目盘 D: 当前可用约 99.79GB）
- 是否允许联网调用外部 API：允许 LLM 经公司内网中转调用 OpenAI 兼容接口；Embedding 本机运行，不依赖外部 Embedding API
- 是否允许安装新依赖 / Docker 镜像：允许本机 `pip install` / `npm install` / `docker pull` 项目所需依赖与镜像；新增依赖须写入依赖文件并说明用途
- 是否允许使用公司服务器：Phase1 Demo 暂不使用；后续本机 Embedding / reranker 不够用时按服务器资源预案申请
- 是否涉及公司数据 / 隐私数据：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档，真实文档必须显式标注来源 / 敏感级别，并优先避免发送到外部模型
- 本机必须跑通的功能：FastAPI 后端、PostgreSQL+pgvector、React 前端、Word / PDF 文字解析、Embedding（`bge-small-zh`，512 维）
- 可 Mock / 可远程运行的功能：LLM 可走公司内网中转或明确 Mock；OCR 可降级为已提取文本（具体边界待 05-tech-spec / 09-verification 细化）

## 服务器资源预案

> 当本机资源不足以实现完整功能时填写。若 Demo / MVP 全部可本机运行，可写“暂不需要”。

- 触发条件：Demo 资源超过内存 < 8GB、显存 < 4GB、磁盘 < 20GB 软上限，或本机 `bge-small-zh` Embedding 在导入规模、响应时间或检索质量上无法满足 Demo / 后续阶段要求；先优化批处理、增量索引与 chunk 策略，仍不足时申请公司内网 Embedding / reranker 服务
- CPU：待确认（按目标 Embedding / reranker 模型与并发评估）
- 内存：待确认（按目标 Embedding / reranker 模型与数据规模评估）
- GPU / 显存：待确认（若使用更大 Embedding / reranker 模型再评估）
- 磁盘：待确认（按模型文件、缓存、索引与导入数据规模评估）
- 网络 / 端口：内网可访问，建议提供 OpenAI-compatible `/v1/embeddings`；具体端口待确认
- 部署方式建议：独立 Embedding / reranker 服务，业务后端通过 adapter 调用，避免业务代码绑定具体模型
- 权限 / 成本 / 安全注意事项：真实团队 / 客户文档场景优先内网处理；具体权限、成本与脱敏要求待确认
