# docs/ 文档分区规则

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


本目录保存项目事实、需求、设计、计划与验证材料。AI 新增文档前必须先判断文档类型，放入对应子目录；不得把临时文档、调研记录或详细设计直接堆到 `docs/` 根目录。

## 根目录只放核心文档

`docs/` 根目录只放：

- `README.md`：本文档分区规则。
- `00-scenario.md` ~ `09-verification.md`：核心工程文档；其中 `06` / `07` 可按项目形态省略。

除上述文件外，AI 不得在 `docs/` 根目录新增文档。确需新增时，必须先说明原因、建议路径和影响范围，等待人工确认。

## 标准子目录

| 子目录 | 放什么 | 命名建议 |
|---|---|---|
| `docs/vision/` | 产品愿景、叙事、业务背景等输入材料 | `product-vision.md`、`market-notes.md` |
| `docs/design/` | 子系统 / 模块详细设计 | `<subsystem>.md`、`auth.md`、`workflow-engine.md` |
| `docs/decisions/` | 架构决策记录（ADR）和重要取舍 | `ADR-0001-title.md` |
| `docs/research/` | 技术调研、竞品分析、实验结论 | `topic-summary.md` |
| `docs/env/` | 本机环境、资源约束、服务器预案 | `local-env.md`、`server-plan.md` |
| `docs/meetings/` | 会议纪要、访谈记录、评审记录 | `YYYY-MM-DD-topic.md` |
| `docs/archive/` | 已废弃但需留痕的项目文档 | 保留原名或加日期前缀 |

## 子系统详细设计

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

## AI 新增文档规则

AI 判断需要新增文档时，必须按以下顺序处理：

1. 先判断是否能更新现有 `00-09` 或已有子目录文档。
2. 如果必须新增，先按上表选择子目录。
3. 在回复中说明：文档类型、建议路径、为什么不能写入现有文档。
4. 等待人工确认后再创建文件。
5. 新文档必须在标题下写明定位：输入材料 / 详细设计 / 决策记录 / 调研记录 / 会议记录 / 归档。

## 裁剪决策表

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
