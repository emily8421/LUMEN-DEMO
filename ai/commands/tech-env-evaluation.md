# Command: tech-env-evaluation

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run tech-env-evaluation`
- 技术环境评估
- 技术路线评估
- 评估依赖能不能装
- 评估本机能不能跑
- 依赖安装 / 最小运行验证
- 记录技术环境评估报告

## 适用场景

项目涉及真实运行依赖（如 `backend/`、`frontend/`、`docker/`、数据库、本机模型、外部 API、重型 SDK）时，在生成 / 修订 `docs/05-tech-spec.md`、进入首个编码 Sprint、升级运行时版本、引入关键依赖或遇到环境问题前，评估技术路线是否被本机 / 团队环境支撑，并输出 `Go / Conditional Go / No-Go` 结论。

## 与相近命令的区别

- `collect-env`：只采集事实，生成 `docs/env/local-env.md`；不做依赖安装、导入、最小运行或 Go / No-Go 判断。
- `docs-evaluation`：偏文档质量和阶段转换判断；本命令偏技术路线、运行时、依赖、资源、网络权限和可运行性。
- `docs-checklist`：编码前最后一道就绪检查，可检查是否已有技术环境评估报告。

## 必读文件

- `ai/index.md`
- `ai/project-rules.md`
- `ai/document-lifecycle-rules.md`
- `ai/implementation-lifecycle-rules.md`
- `ai/prompts/review/20-tech-env-evaluation.md`
- `ai/doc-standards/05-tech-spec.md`
- `docs/env/local-env.md`（如存在；不存在时先提示运行 `collect-env`）
- `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`（如存在）
- 依赖文件、启动脚本、Docker / Compose 文件、模型配置（如存在）

## 执行流程

1. 判断评估范围：整体技术路线、某个 Phase、某个运行时 / 依赖升级、某个 Sprint 前门禁。
2. 区分事实采集与验证：读取 `docs/env/local-env.md`，但不得把采集结果当作已通过评估。
3. 只读盘点技术栈、运行时版本、关键依赖、Docker / 数据库 / 模型 / 网络权限 / 资源约束。
4. 默认先输出评估计划、需验证命令、写入影响和风险；实际安装、拉镜像、启动服务或写报告前必须确认。
5. 用户确认后，按范围执行安装 / 导入 / 最小运行 / build / dev server / compose / 模型加载等验证，并记录证据。
6. 输出 `Go / Conditional Go / No-Go` 结论、阻塞项、Risk-ID、readiness gate、降级策略、对 `docs/05` / `docs/09` / `docs/08` / 依赖文件的修改建议。
7. 若用户确认落盘，将报告写入 `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`。

## 写入风险

默认只读；实际安装依赖、联网下载、拉取 Docker 镜像、启动服务、写入报告、修改 `docs/05-tech-spec.md` / `docs/09-verification.md` / `docs/08-dev-plan.md` / 依赖文件前必须确认。报告不得写入 `docs/` 根目录，不替代 `docs/env/local-env.md` 或 `docs/05-tech-spec.md`。

## 续接要求

若结论为 `Conditional Go` 或 `No-Go`，或用户明确跳过评估 / 跳过验证，应把跳过原因、风险项、影响范围、补做时点、报告路径建议和待确认项写入续接文件。
