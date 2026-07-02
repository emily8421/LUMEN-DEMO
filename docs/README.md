# docs/ 项目文档体系与分区规则

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录保存项目事实、需求、设计、计划与验证材料。本文档说明三件事：**(1) 文档体系怎么构成**（输入 / 输出 + 00-09 主链）、**(2) 分区规则**（放哪）、**(3) 裁剪**（保留哪些）。文档生成、追溯链、横切事实、变更传播规则见 `ai/document-lifecycle-rules.md`。

## 1. 输入与输出：两类文档

`docs/` 里的文档分两类——你提供的人工输入，和 AI 生成的项目事实。

| 类型 | 目录 | 谁放 / 怎么来 |
|---|---|---|
| **人工输入**（原料） | `docs/vision/`、`docs/inputs/` | 你提供：愿景叙事、客户 PRD/SRS、brief、现有系统说明、外部接入包 |
| **AI 输出**（项目事实，约束代码） | `docs/`（根 `00-09`）、`docs/design/` | AI 根据输入评审后生成：需求 / 设计 / 计划 / 验证 |
| 辅助留痕 | `docs/decisions/`、`docs/research/`、`docs/env/`、`docs/meetings/`、`docs/archive/` | 决策记录 / 调研 / 环境 / 会议 / 归档 |

一句话：**人写输入 → AI 生成 `00-09` 与 `design/` → `00-09` 约束代码**。人工输入不直接驱动开发，必须先经评审（`ai/prompts/docs/01-review-inputs.md`）再进入 `00-09`。

## 2. 核心文档 00-09 各自干什么

| 文档 | 阶段 | 一句话作用 | 何时省略 |
|---|---|---|---|
| `00-scenario.md` | 需求 | 工程想定、背景、典型场景、输入指针 | 必备 |
| `01-user-requirements.md` | 需求 | 用户需求全集，每条带来源锚点 + 阶段标签 | 必备 |
| `02-srs.md` | 需求 | 系统需求规格 + REQ 编号 | 必备 |
| `03-prd.md` | 需求 / 产品 | 功能范围、优先级、阶段路线图（阶段标签唯一来源） | 必备 |
| `04-architecture.md` | 总体设计 | 系统模块、边界、运行拓扑、子系统划分 | 必备 |
| `05-tech-spec.md` | 总体设计 | 技术选型、版本、资源评估、降级 / Mock | 必备 |
| `06-db-design.md` | 详细设计 | 表、字段、索引、约束，每张表追溯 REQ | 无持久化可省 |
| `07-api-spec.md` | 详细设计 | 接口契约、请求响应、权限、错误码 | 无对外接口可省 |
| `08-dev-plan.md` | 实现计划 | Sprint / task 拆分、验收标准、禁止事项 | 必备 |
| `09-verification.md` | 测试验证 | REQ → 用例追溯、资源验证、验收策略 | 必备 |

每个文档的完整生成关系（上游输入 / 输出职责 / 禁止项 / 下游影响）见 `ai/document-lifecycle-rules.md` §5 生成矩阵。

## 3. 规范约束（写 docs/ 时必须遵守）

- **编号固定**：`00-09` 编号不因项目而变；根目录只放 `README.md` 与 `00-09`，不堆其它文档（见 §4）。
- **追溯链**：`U-ID → REQ-ID → Phase → 设计 → Sprint → 测试 → 代码`，不留悬空 ID（权威见 `ai/document-lifecycle-rules.md` §6）。
- **阶段双维度标签**：功能范围 `[P1]/[P2]/[愿景]` × 交付物形态 `Demo/MVP/产品`；状态 `骨架 → P{N}-已设计 → P{N}-已实现`（权威见 `ai/global-rules.md` §8）。
- **只增不删**：设计类文档（03-09、design）按积累式演进，不删既有阶段内容（权威见 `ai/global-rules.md` §8.2-3）。
- **撰写规范**：`00-09` 每份文档的撰写规范见 `ai/doc-standards/00-09`（只读镜像、审计基线、不手改；由 `sync-template` 刷新）。

## 4. 根目录只放核心文档

`docs/` 根目录只放：

- `README.md`：本文档。
- `00-scenario.md` ~ `09-verification.md`：核心工程文档；其中 `06` / `07` 可按项目形态省略。

> 模板 `00-09` 撰写规范镜像在 `ai/doc-standards/00-09`，不属于 `docs/` 项目事实区。

除上述外，AI 不得在 `docs/` 根目录新增文档。确需新增时，必须先说明原因、建议路径和影响范围，等待人工确认。

## 5. 标准子目录

| 子目录 | 放什么 | 命名建议 |
|---|---|---|
| `docs/vision/` | 产品愿景、叙事、业务背景等输入材料 | `product-vision.md`、`market-notes.md` |
| `docs/inputs/` | 尚未归类、尚未转成 00-09 的原始输入包，如小工具 brief、客户 PRD/SRS、外部需求包、现有系统说明 | `initial-brief.md`、`client-prd.md`、`<topic>/README.md` |
| `docs/design/` | 子系统 / 模块详细设计 | `<subsystem>.md`、`auth.md`、`workflow-engine.md` |
| `docs/decisions/` | 架构决策记录（ADR）和重要取舍 | `ADR-0001-title.md` |
| `docs/research/` | 技术调研、竞品分析、实验结论 | `topic-summary.md` |
| `docs/env/` | 本机环境、资源约束、服务器预案 | `local-env.md`、`server-plan.md` |
| `docs/meetings/` | 会议纪要、访谈记录、评审记录 | `YYYY-MM-DD-topic.md` |
| `docs/archive/` | 已废弃但需留痕的项目文档 | 保留原名或加日期前缀 |
| `ai/doc-standards/` | 模板 `docs/00-09` 撰写规范镜像，随模板版本刷新；**只读、非项目事实、不直接驱动开发**；改动须走 `_proposals/` 回流模板 | 由 `sync-template` 自动生成，勿手改；旧项目可能残留 `docs/_scaffold/` |

## 6. 子系统详细设计

非平凡子系统详细设计统一放入 `docs/design/`，不要放成 `docs/design-<子系统>.md`。

推荐：

```text
docs/design/auth.md
docs/design/workflow-engine.md
docs/design/reporting.md
```

不推荐：

```text
docs/design-auth.md
docs/workflow-engine-design.md
```

## 7. AI 新增文档规则

AI 判断需要新增文档时，必须按以下顺序处理：

1. 先判断是否能更新现有 `00-09` 或已有子目录文档。
2. 如果必须新增，先按上表选择子目录。
3. 在回复中说明：文档类型、建议路径、为什么不能写入现有文档。
4. 等待人工确认后再创建文件。
5. 新文档必须在标题下写明定位：输入材料 / 详细设计 / 决策记录 / 调研记录 / 会议记录 / 归档。

外部接入文档（策略、调研、决策、会议、接口或客户输入材料）必须先写明与本仓库 docs 的映射、定位声明和影响范围。尚未归类的原始输入先放 `docs/inputs/`；评审后，策略 / 决策类放 `docs/decisions/`，调研 / 实验类放 `docs/research/`，会议或访谈放 `docs/meetings/`，不要误放入 `docs/vision/`。

## 8. 裁剪决策表

初始化时先按下表填写 `ai/project-rules.md` §3，再决定要保留哪些文档和代码目录：

| 判断条件 | 文档处理 | 目录处理 | 备注 |
|---|---|---|---|
| 无持久化存储 | 删除 `docs/06-db-design.md`，并在 §3 声明省略 | 不因 DB 预留目录 | 浏览器 `localStorage` / `IndexedDB` 写入 `docs/05-tech-spec.md`，不触发 06 |
| 有数据库 / 文件存储 | 保留 `docs/06-db-design.md` | 按技术栈保留 `backend/`、`docker/` 等 | 当前阶段写细，后续阶段可只保留骨架 |
| 无对外接口 | 删除 `docs/07-api-spec.md`，并在 §3 声明省略 | 不因 API 预留 `backend/` | 纯内部库 / 纯计算模块适用 |
| CLI / 本地脚本 | 保留 `docs/07-api-spec.md` | 通常保留 `scripts/`，按需保留 `tests/` | 07 用于描述命令、参数、输出契约 |
| 独立 Web / 移动端演示 | `docs/04-05` 必须体现前端架构 | 保留 `frontend/`，按需保留 `backend/` | 若愿景含页面/点击/手机等交互词，需人工复核演示形态 |
| 消息通道内交互 / 不需演示 | `docs/04-05` 不强制写前端 | 通常删除 `frontend/` | 若后续变更演示形态，再补前端设计 |
| 暂无自动化测试 | `docs/09-verification.md` 仍保留 | 可暂删 `tests/` | 09 至少记录人工验证和本机资源验证 |
| 需要容器 / 外部服务 | `docs/04-05` 写明运行拓扑 | 保留 `docker/` | Demo 优先本机；资源不足再写服务器预案 |

## 9. 轻量项目路径

若项目是小脚本、一次性实验或纯工具库，仍保留基本边界与验证口径即可：

1. 写最小 `docs/vision/product-vision.md`。
2. 运行 `scripts/collect-env.ps1`，确认本机可运行边界。
3. 按上面的裁剪表决定是否省略 `docs/06`、`docs/07` 和代码目录。
4. 保留最小版 `docs/03-prd.md`、`04-architecture.md`、`05-tech-spec.md`、`08-dev-plan.md`、`09-verification.md`。
5. 每次只实现一个小任务；验证结果记录到 `docs/09-verification.md` 或当前 Sprint。
