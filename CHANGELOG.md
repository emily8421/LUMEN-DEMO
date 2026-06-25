# CHANGELOG

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。任何会影响下游同步判断的模板合并都应递增版本；`ai/global-rules.md` 顶部仅记录全局规则自身版本。

## v1.7.0（2026-06-24）

- `ai/global-rules.md` §8 新增阶段双维度：功能范围（P1/P2/愿景）与交付物形态（Demo/MVP/产品）必须同时声明。
- `INIT-PROMPT.md` §0 / §1 / §10 增加 vision→docs 与 00-02→03-09 的硬约束：REQ 全覆盖、无悬空 REQ、产品红线、不编造事实、声称据实。
- `docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 更新模板桩与最小示例，要求 Phase、Sprint 与验证矩阵体现交付物形态。
- 增强 `scripts/check-template.sh` 自检断言，防止 Demo/MVP/产品语义和 REQ 追溯约束回退。

## v1.6.9（2026-06-24）

- 修正派生项目同步模板方法论的标准流程：明确区分 v1.6.8 之前旧派生项目首次同步路径与 v1.6.8+ 后续同步路径。
- 新增 `scripts/check-derived-sync.sh` / `scripts/check-derived-sync.ps1`，用于派生项目同步后的边界校验；该校验只检查同步提交是否限定在 `template-sync.json` 清单内，不检查模板仓库完整结构。
- 明确 `scripts/check-template.sh` / `scripts/check-template.ps1` 是模板仓库完整性自检，不应作为派生项目同步成功判断。
- 更新 `git-guide.md` §5、`INIT-PROMPT.md` §12、`SOP.md` 与 README 常用命令，避免旧派生项目误跑模板自检。

## v1.6.8（2026-06-24）

- `INIT-PROMPT.md` 新增 §15「同步后项目整理」，用于派生项目完成方法论同步后审计并迁移项目专属内容。
- §15 覆盖 docs 分区整理、根 README 标准版块、`ai/project-rules.md` 项目规则补齐，以及运行环境与资源约束补齐。
- 明确同步后需检查 / 生成 `docs/env/local-env.md`，并补齐 `ai/project-rules.md` §2.5、`docs/04` 运行拓扑、`docs/05` 资源评估、`docs/09` 本机资源验证。
- `SOP.md` 增加“同步后项目整理”场景，提示同步方法论后先出迁移计划，人工确认后再执行。

## v1.6.7（2026-06-24）

- 为模板同步 Markdown 文件补充同步覆盖说明，提示派生项目不要直接修改，应通过 `_proposals/` 回流模板。
- 明确根 `README.md` 是项目专属文档，不参与模板下行同步。
- 标准化 `scripts/new-project.sh` 生成的派生项目 README 版块。
- 补齐 `_examples/` 的 docs 分区结构，与 v1.6.6 文档分区规则保持一致。
- 增强 `scripts/check-template.sh` 对同步说明、派生 README 模板和样例分区的检查。

## v1.6.6（2026-06-24）

- README 瘦身：保留 5 分钟最小路径、入口导航、常用命令、目录速览和最近版本摘要。
- 新增 `MAINTAINERS.md`：承载模板维护原则、发布 checklist、同步清单维护规则、自检 / CI 说明。
- 新增 `CHANGELOG.md`：承载完整版本记录，README 只保留最近版本摘要。
- 新增 `docs/README.md`：定义派生项目文档分区，约束 AI 不把新增文档直接堆到 `docs/` 根目录。
- 调整 `docs/design/` 约定：子系统详细设计统一进入 `docs/design/`，替代历史上的 `docs/design-<子系统>.md` 根目录命名。

## v1.6.5（2026-06-23）

- 新增 GitHub Actions PR 自检，自动运行 `git diff --check` 与 `bash scripts/check-template.sh`。
- README 增加“5 分钟最小路径（愿景 → 本机 Demo）”和裁剪决策表，明确先采集 `docs/env/local-env.md`，再由 `docs/vision/product-vision.md` 驱动 AI 生成 `docs/00-09` 与 Sprint1。
- 新增 `template-sync.json` 作为下行同步清单事实来源。
- 补充 `check-template.ps1` / `sync-template.ps1` Windows 入口。
- 自检加入 `new-project --local --no-remote --no-examples` 烟测。

## v1.6.4（2026-06-23）

- 新增 `SOP.md` 标准操作流程索引，按场景汇总新建派生项目、初始化 docs、环境采集、Sprint 执行、审查、模板同步与模板回流等入口。
- 同步更新 README 目录说明、下行同步清单与模板自检规则。

## v1.6.3（2026-06-23）

- 修正 `scripts/sync-template.sh --dry-run` 的差异预览方向。dry-run 现在按“本地当前文件 → 模板 VERSION”显示统计，与 `--commit` 实际覆盖方向一致，避免将模板新增内容误显示为删除。

## v1.6.2（2026-06-23）

- 将派生项目新建 / 同步标准 SOP 固化为可复制 Prompt。
- `git-guide.md` §2 明确新建项目推荐使用 `scripts/new-project.sh` 从 GitHub `main` 派生。
- `INIT-PROMPT.md` 新增 §14 新建项目 Prompt。
- `INIT-PROMPT.md` §12 同步 Prompt 改为运行时读取模板 `VERSION`，避免固定版本号。

## v1.6.1（2026-06-23）

- 增强派生项目下行同步安全性。
- `scripts/sync-template.sh` 在 fetch 模板后会对比远端最新版脚本与本地脚本，不一致时停止并提示先 bootstrap 最新脚本。
- `git-guide.md`、`INIT-PROMPT.md` 和 `scripts/check-template.sh` 同步补充该 SOP，避免旧脚本漏同步新文件或错误解析版本。

## v1.6.0（2026-06-23）

- 新增运行环境与资源约束机制：`scripts/collect-env.ps1` 自动生成 `docs/env/local-env.md`。
- `ai/project-rules.md` 新增 §2.5。
- `docs/04` / `docs/05` / `docs/09` 增加运行拓扑、资源评估与本机资源验证。
- `INIT-PROMPT.md` 新增环境采集 Prompt。
- 同步更新 README、`new-project`、自检脚本、同步清单和 `_examples/`。
- 版本治理改为根目录 `VERSION` 三段式，并规定所有模板修改必须先形成提案、完成后归档到 `_archive/proposals/`。

## v1.5（2026-06-22）

- `ai/global-rules.md` §5 明确 `frontend/` 由 `project-rules.md` §3「演示形态」决定，并注明根 `README.md` 是项目件。
- 新增 §9「模板优化反馈」，规定派生项目起草 `TEMPLATE-UPGRADE-*.md`、模板仓库 `_proposals/` 汇总分析与 PR 落地。
- 同期非 global-rules 改动：`ai/project-rules.md` §3 增加「演示形态」必填项；`INIT-PROMPT.md` 增加演示形态推导、README 项目化与模板优化汇总 Prompt；`scripts/new-project.sh` 创建干净 `_proposals/` 起草区并项目化 README；`CONTRIBUTING.md` 升级上行回流流程；`scripts/check-template.sh` 增加 `_proposals` 检查。

## v1.4（2026-06-19）

- `ai/global-rules.md` 新增 §8 文档演进规则（积累式：完整骨架 + 阶段标签 + 状态，只增不删）。
- §5 目录标准扩为 00-09（新增 09-verification 验证支柱）。
- 新增 `docs/vision/` 源文档与 `design-*` 子系统设计两类语义命名约定（v1.6.6 起新项目改用 `docs/design/` 子目录）。
- 同期非 global-rules 改动：`INIT-PROMPT.md` 新增 §0 愿景→完整文档体系主 prompt、§1/§10 扩至 03-09；`ai/project-rules.md` §5.2 禁区补阶段归属条；`docs/` 00-08 模板补完整需求+阶段标签写法指引、新增 09-verification 模板；`README` 快速开始加愿景起步分支。

## v1.3（2026-06-17）

- `ai/global-rules.md` §1 文档驱动开发顺序链补充说明（数据库 / API 环节仅按项目形态启用）。
- 同期非 global-rules 改动：修正 `text-cleaner-cli` 样例 README 自相矛盾（原误标 `docs/07` 省略）、`INIT-PROMPT.md` §10 checklist C 对 06/07 加“（如有）”标注、`ai/project-rules.md` §3 补前端持久化指引（localStorage / IndexedDB 等不触发 06）、新增 `md-notes-frontend` 纯前端样例。

## v1.2（2026-06-17）

- 将 `ai/project-rules.md` 的“项目形态与文档裁剪”前置为初始化必填。
- 初始化 / 单任务 Prompt 改为按条件处理 docs/06、07。
- `docs/05-tech-spec.md` 不再依赖初始化时尚未填写的编码约定。
- 新增无 DB / 无 API 样例项目。

## v1.1（2026-06-16）

- Cursor 入口加 frontmatter（`alwaysApply`）。
- docs 06/07 按项目形态可省略。
- 新增模板版本戳与 docs/03-08 验收 checklist。
- 同期非 global-rules 改动：docs 03-07 预置内容骨架、project-rules 补 §4 编码约定与禁区、`_archive` 两份合并为纯-why 单文档、init 顺序前置（§1/§2 在生成 03-08 前填、§3/§4 审核后补）。

## v1.0

- 初始体系（设计说明见 `_archive/`）。
