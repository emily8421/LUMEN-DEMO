# 13 采集本机运行环境与资源约束

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在派生项目中生成 `docs/env/local-env.md`，作为架构设计、技术方案和本机 Demo 可行性评估的输入；它只采集环境事实，不替代技术路线与环境支撑评估。

**目的**：减少人工填写硬件 / 软件环境信息，让 AI 在选择技术栈、模型、数据库、部署方式时受本机资源约束，避免方案超出 Demo 机器承载能力。

**适用场景**：新项目初始化前、生成 `docs/04-architecture.md` / `docs/05-tech-spec.md` 前，或技术方案需要重新评估资源消耗时。

**不适用场景**：已经有最新且人工确认过的 `docs/env/local-env.md`，且本机环境未变化。

**使用前准备**：确认当前在派生项目根目录；允许运行只采集本机信息并写入 `docs/env/local-env.md` 的脚本。

**预期产出**：`docs/env/local-env.md`，包含自动采集项、人工确认项和服务器资源预案。

**使用后下一步**：人工补齐 `docs/env/local-env.md` 中的确认项；随后先用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料，再用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 更新 docs 文档体系，并要求技术方案读取该文件。若项目存在真实运行依赖，生成 / 修订 `docs/05-tech-spec.md` 或进入首个编码 Sprint 前，再用 `ai/prompts/review/20-tech-env-evaluation.md` 做技术路线与环境支撑评估。

```text
请帮我采集本机运行环境与资源约束，供后续架构设计和技术方案使用。

执行要求：
1. 先阅读 ai/index.md 及其列出的全部规则文件。
2. 检查是否存在 scripts/collect-env.ps1；如果不存在，停止并说明需要先同步模板方法论或从模板复制该脚本。
3. 运行：powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
4. 确认已生成 docs/env/local-env.md。
5. 阅读 docs/env/local-env.md，汇总自动采集到的关键资源信息：OS、CPU、内存、GPU、磁盘、Docker、Git、Python、Node 等。
6. 列出仍需人工确认的项目，至少包括：Demo 最大内存 / 显存 / 磁盘占用、是否允许联网、是否允许安装依赖、是否允许使用公司服务器、本机必须跑通的功能、可 Mock / 远程运行的功能。
7. 不要替用户虚构人工确认项；未知项保持“待确认”。
8. 明确说明：本次只完成环境事实采集，不代表依赖安装 / 导入 / 最小运行验证已通过。
9. 输出后续建议：生成 docs/04-architecture.md、docs/05-tech-spec.md、docs/09-verification.md 时必须读取 docs/env/local-env.md，并给出本机 Demo 可行性与服务器资源预案；涉及真实运行依赖时，进入首个编码 Sprint 前应执行 `tech-env-evaluation`。

遇到以下情况必须停止并说明原因：
- 当前不在项目根目录。
- scripts/collect-env.ps1 不存在。
- PowerShell 脚本执行失败。
- docs/env/local-env.md 未生成。
```
