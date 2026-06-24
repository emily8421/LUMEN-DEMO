# 项目专属规则

> 本文件每个新项目都需要重新填写，不参与跨项目同步。
> 判断标准：一条规则换到另一个完全不同的项目上是否还成立——
> 不成立（涉及具体技术栈/具体功能/具体Phase定义）就属于本文件。
>
> 填写时机：§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪在生成 docs/03-08 **之前**填
> （作为约束）；§4 目录特例、§5 编码约定与禁区在审核 03-08 **之后**补。

## 0. 项目标识

项目名称：LUMEN（KnowledgeBase Demo）
代号/缩写：lumen（数据库表前缀 `lumen_`，后端包名 `lumen`）

## 1. Phase边界

当前阶段：Phase1（MVP Demo）

> 阶段划分的唯一来源是 `docs/03-prd.md` §3 路线图；本节是"当前阶段指针"。
> 升阶段时只改本节指针 + 在设计文档原位补充新阶段细节（见 global-rules §8），不重写需求。

允许（Phase1 内）：
- 后端 Python + FastAPI；存储 PostgreSQL + pgvector；AI 走 OpenAI 兼容 API（LLM + Embedding）；前端 React
- 双空间隔离 + 文档权限三级（私有 / 团队共享 / 外部只读）
- Markdown 文档 CRUD + 全文搜索 + RAG 问答（带来源引用）+ 行内编辑 / 版本历史
- 多格式导入：Word / PDF 文字提取、图片 / 白板照片 OCR
- 桌面端浏览器访问

禁止（Phase1 内不做，留待后续 Phase）：
- 高级视图：时间轴、关联图、问题热力矩阵、事件卡片因果展开、气泡图谱、标签视图
- 外部知识源挂载（Obsidian Vault 路径挂载）、跨空间文档推送
- 录音转文字入库、对外只读简报（临时链接）、文档包生成
- AI 润色、写作侧边栏实时引用、多人实时协作、AI 撰写管理层摘要
- 情报分析（i2 精神）：关联图↔时间轴联动、路径推理、人物关系网络、矛盾检测、假设检验 / 证据地图、信号追踪——均为远期愿景（v18 新增支柱，见 docs/design/intelligence-analysis.md）
- 手机端 / 移动适配（demo 先桌面端）

下一阶段预告：
- Phase2：开放高级导航视图（标签视图、时间轴、关联图），AI 润色与写作引用，跨空间文档推送
- 远期愿景：问题热力矩阵、事件因果推理、对外简报、Obsidian Vault 挂载、移动端——详见 docs/vision/product-vision.md（产品愿景叙事，不直接驱动 Phase 开发）

## 2. 技术栈约束

| 层 | 选型 | 说明 |
|---|---|---|
| 后端 | Python + FastAPI | 异步、RAG/LLM 生态成熟 |
| 数据库 | PostgreSQL + pgvector | 关系存储与向量检索一体化；Phase1 不引入独立向量库 |
| AI | OpenAI 兼容 API（LLM + Embedding） | 可接国内中转 / 自部署；具体型号与 Embedding 维度留 05-tech-spec |
| 前端 | React | 视图层；状态管理 / 路由等细节留 05-tech-spec |
| 文件解析 / OCR | Word / PDF 文字提取 + OCR（建议 PaddleOCR，中文友好） | 具体 OCR 引擎待 05-tech-spec 确认 |

禁止引入的替代品：
- 禁止用独立向量库（Milvus / Qdrant 等）替代 pgvector（Phase1 内）
- 禁止绑定单一闭源 LLM 厂商 SDK；AI 调用统一走 OpenAI 兼容接口
- 任何新依赖须先确认，不得擅自引入

## 2.5 运行环境与资源约束

> 本节约束技术方案与本机 Demo 可行性；事实来源 `docs/env/local-env.md`（由 `scripts/collect-env.ps1` 采集）。未确认项保持「待确认」，不得虚构。

- 本机环境：Windows 11 / i7-12650H（10C16T）/ 31.7GB 内存 / RTX 3050 6GB（详见 `docs/env/local-env.md`）
- Demo 必须本机运行的部分：待确认
- 允许降级 / Mock / 远程运行的部分：待确认
- 禁止在本机运行的重资源部分：待确认
- 是否允许联网（调用外部 OpenAI 兼容 LLM / Embedding API）：待确认
- 是否允许安装新依赖 / Docker 镜像：待确认
- 是否允许使用公司服务器：待确认
- 若需服务器，资源申请口径：待确认

> 技术方案（`docs/05`）与架构（`docs/04`）必须受本节与 `docs/env/local-env.md` 约束；本机资源不足时须明确所需公司服务器资源与触发条件。

## 3. 项目形态与文档裁剪

> 本节用于初始化阶段，决定 docs/06、07 是否保留，以及 frontend/backend/tests/scripts/docker
> 哪些目录真正需要。此节应在生成 docs/03-08 之前先填好。

- 是否有持久化存储：是（PostgreSQL：文档、版本、空间 / 权限、索引、Embedding 向量）
- 是否有对外接口：是（REST API：文档 CRUD、搜索、RAG 问答、导入 / OCR、空间与权限）
- docs/06-db-design.md：保留
- docs/07-api-spec.md：保留（RESTful）
- 需要保留的代码目录：backend/ frontend/ tests/ scripts/ docker/
  （scripts/ 放导入 / 索引脚本；docker/ 放本地起库与依赖编排）

## 4. 目录规范的项目特例

无（遵循 global-rules.md §5 通用目录标准）。代码骨架与分层：

- `backend/`：分 api / service / model 三层；对外接口只进 api 层（待 04-architecture 确认）
- `frontend/`：React
- `tests/`：单元 + 集成 + 验收（对应 docs/09-verification.md）
- `scripts/`：导入 / 索引脚本
- `docker/`：本地起库与依赖编排

具体目录树待 04-architecture 落定后回填。

## 5. 编码约定与禁区

> Phase 级功能禁止见 §1，技术栈替代品禁止见 §2，本节只管代码层。
> 每条尽量具体可执行；没有则写“无”，不要留空占位。
> 本节标注「待回填」的条目待 docs/04–05 落定后确认，暂不虚构。

### 5.1 既有约定（新代码必须向其看齐）
- 命名：后端 snake_case（Python）、前端 camelCase（JS/TS）、组件 PascalCase
- 分层与目录：backend 分 api / service / model 三层，对外接口只进 api 层（待 04-architecture 确认）
- 既有模式：AI 调用统一走 OpenAI 兼容接口封装层（待 04/05 落基类后回填）
- 错误处理 / 日志：统一异常类型与日志格式（待 04/05 回填）

### 5.2 禁区（未经人工确认不得触碰）
- 不得擅改的文件 / 模块：ai/ 规则文件、docs/00–08 编号文档的编号与既有结构
- 不得擅自引入的依赖：任何新依赖须先确认（见 §2）
- 不得自行实现的功能：见 §1 禁止清单；docs/vision/product-vision.md / docs/01 中的功能点不等于已批准实现；阶段归属以 docs/03-prd.md §3 路线图为准，编码以 §1 当前阶段为准

## 6. 文档演进规则

> 已提升至 `ai/global-rules.md` §8（积累式：完整骨架 + 阶段标签 + 状态，只增不删），本节不再重复。
