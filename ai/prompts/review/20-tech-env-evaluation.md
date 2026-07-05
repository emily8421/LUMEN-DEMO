# 20 技术路线与环境支撑评估

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在生成 / 修订技术方案、进入首个真实运行依赖 Sprint、升级运行时版本、引入关键依赖或遇到环境问题前，评估技术路线是否被本机 / 团队环境支撑。

**目的**：把运行时版本、依赖安装、导入、最小运行、Docker / 数据库 / 模型、网络权限和资源约束纳入同一评估，避免编码后才发现环境不兼容。

**适用场景**：项目保留 `backend/`、`frontend/`、`docker/`、数据库、本机模型、外部 API 或其他真实运行依赖；`docs/05-tech-spec.md` 要锁定运行时 / 关键依赖；首个编码 Sprint 前需要门禁判断；本机环境与技术方案基线不一致；依赖安装、build、compose、模型加载或启动失败后需要复评。

**不适用场景**：只想采集本机事实，用 `ai/prompts/setup/13-collect-env.md`；只评估文档质量和阶段转换，用 `ai/prompts/review/19-docs-evaluation.md`；只做已成型项目全链路审计，用 `ai/prompts/review/16-docs-system-audit.md`。

**使用前准备**：准备 `docs/env/local-env.md`、`ai/project-rules.md`、`docs/05-tech-spec.md`、`docs/09-verification.md`、当前 Phase / Sprint 信息、依赖文件、启动脚本、Docker / Compose 文件、模型配置。若 `docs/env/local-env.md` 缺失，先建议运行 `collect-env`；环境采集不等于评估通过。

**预期产出**：技术路线与环境评估报告草稿，包含评估摘要、范围与依据、环境事实、候选技术路线、依赖与工具支撑矩阵、验证证据、资源 / 网络 / 权限风险、降级策略、`Go / Conditional Go / No-Go` 结论、对 `docs/05` / `docs/09` / 依赖文件的修改建议和结构化待人工确认项。

**使用后下一步**：若用户确认落盘，将报告写入 `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`；若结论为 `No-Go`，先修订技术路线或降级方案；若为 `Conditional Go`，只能进入不触发该风险的 Sprint。

```text
请对当前项目做一次技术路线与环境支撑评估，不要直接修改文件，不要擅自安装依赖或启动服务。

评估范围（任选或由 AI 建议）：
1. 整体技术路线评估：判断当前技术方案是否被本机 / 团队环境支撑。
2. Phase / Sprint 前门禁：判断某个 Phase 或 Sprint 是否可进入真实编码。
3. 运行时 / 依赖评估：判断 Python / Node / Docker / 数据库 / 模型等版本是否可用。
4. 故障复评：针对安装、导入、build、compose、模型加载或启动失败做原因分析和降级建议。

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/project-rules.md
- ai/document-lifecycle-rules.md
- ai/implementation-lifecycle-rules.md
- docs/env/local-env.md（如存在）
- docs/04-architecture.md、docs/05-tech-spec.md、docs/08-dev-plan.md、docs/09-verification.md（如存在）
- 依赖文件、启动脚本、Docker / Compose 文件、模型配置（如存在）

评估原则：
- `collect-env` 只采集事实，不替代技术环境评估。
- 默认优先贴近本机 / 团队当前主版本；除非依赖实测不支持，否则不应为了模板习惯固定旧版本。
- 评估报告属于 `docs/research/` 下的留痕，不替代 `docs/env/local-env.md` 或 `docs/05-tech-spec.md`；结论确认后再修订 05 / 09 / 依赖文件。
- 默认只读；安装依赖、联网下载、拉 Docker 镜像、启动服务、写报告或改文件前必须先说明命令、影响、风险和回滚方式，并等待确认。
- 若用户明确要求跳过评估或跳过验证，必须记录跳过原因、风险项、影响范围、补做时点和是否阻塞 Sprint。

评估维度：

| 维度 | 必查问题 | 输出要求 |
|---|---|---|
| 运行时版本 | 是否优先使用本机 / 团队当前主版本；旧版本是否有必要 | 运行时版本决策和依据 |
| 后端依赖 | Web 框架、ORM、迁移、驱动是否支持目标 Python / 运行时 | 安装 / 导入 / 最小运行结果或待验证命令 |
| 前端依赖 | Node / npm / 框架 / 构建工具是否支持目标版本 | install / build / dev server 结果或待验证命令 |
| 数据库 / Docker | 镜像是否可拉取、容器能否启动、扩展是否可用 | Compose / 迁移 / 连接验证结果 |
| AI / 模型 | Embedding、LLM adapter、OCR、解析库是否支持目标环境 | 模型加载 / Mock / 降级结论 |
| 网络与权限 | 是否需要外网、代理、内网中转、管理员权限、端口绑定 | 风险与替代路径 |
| 资源 | CPU / 内存 / 显存 / 磁盘是否满足阶段目标 | 资源瓶颈与服务器预案 |
| 维护成本 | 是否引入多版本运行时、重型工具链或难维护 SDK | 长期维护判断 |

阶段深度：
- Demo：必须验证核心链路依赖安装、导入、最小运行；允许 Mock / 降级，但要显式记录。
- MVP：必须验证生产必要依赖、数据库迁移、部署脚本、错误恢复和资源边界。
- 产品：必须验证长期维护、升级策略、安全合规、可观测性、容量和多环境部署。

评估结论：
- Go：可进入目标技术方案 / Sprint；只有不阻塞的 P2 优化项。
- Conditional Go：可进入不触发风险的范围；必须列明 P0 / P1 条件、风险接受口径和补做时点。
- No-Go：不得进入相关 Sprint；必须先修订技术路线、降级方案或环境准备。

请输出：

1. 评估摘要
   - 范围、目标阶段 / Sprint、结论（Go / Conditional Go / No-Go）
   - 是否阻塞进入编码或修订 `docs/05-tech-spec.md`
   - 最关键的 3-5 条理由

2. 评估范围与依据
   - 读取了哪些文档、依赖文件和脚本
   - 未读取 / 不存在 / 不适用项
   - 规范依据与项目事实依据

3. 本机 / 团队环境事实
   - 摘要引用 `docs/env/local-env.md`
   - 未人工确认的环境项必须保留待确认

4. 技术路线候选与决策
   - 候选运行时 / 框架 / 数据库 / Docker / 模型方案
   - 推荐方案、依据、备选和维护成本

5. 依赖与工具支撑矩阵
   - 每项包含：名称、目标版本、环境要求、验证方式、验证状态、风险

6. 安装 / 导入 / 最小运行验证
   - 默认先列待执行命令，不自动执行
   - 已执行时记录命令、结果、日志摘要和失败原因

7. 资源、网络、权限与 Docker 验证
   - 说明是否需要联网、代理、管理员权限、端口、Docker、GPU / 大内存等

8. 风险项与降级策略
   - 每项包含 ID、优先级、风险、触发条件、影响、建议降级 / Mock / 服务器预案

9. Go / Conditional Go / No-Go 结论
   - 若 Conditional Go，列必须满足的条件和可安全进入的范围
   - 若 No-Go，列停止原因和重新评估触发条件

10. 对 docs/05、docs/09、依赖文件的修改建议
    - 指明应修订的章节、建议内容和是否需要用户确认

11. 待人工确认项
    - 使用结构化表格：`ID / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`
    - AI 建议不得写成已确认事实

12. 报告落盘建议
    - 默认不写文件
    - 若用户确认记录，建议路径：`docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`
    - 说明报告不替代 `docs/env/local-env.md`、`docs/05-tech-spec.md` 或 `docs/09-verification.md`

若发现模板通用缺口，请单列“可回流模板优化建议”，但不要直接创建 `_proposals/`，除非用户确认。
```
