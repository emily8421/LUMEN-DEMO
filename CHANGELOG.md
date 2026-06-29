# CHANGELOG

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。任何会影响下游同步判断的模板合并都应递增版本；`ai/global-rules.md` 顶部仅记录全局规则自身版本。

## v1.20.0（2026-06-29）

- 将模板 `docs/00-09` 撰写规范镜像主路径从 `docs/_scaffold/00-09` 迁移为 `ai/doc-standards/00-09`，明确其定位为 AI 文档标准 / 审计基线，而非项目事实或初始化脚手架。
- `scripts/sync-template.sh` 下行同步改为生成 / 刷新 `ai/doc-standards/00-09`；`scripts/check-derived-sync.sh` 放行新路径，并迁移期兼容旧 `docs/_scaffold/*`。
- 新增 `ai/doc-standards/README.md`，说明只读、非项目事实、由 `sync-template` 刷新、供 AI 审计 / 生成对照使用。
- `16-docs-system-audit` 和 `docs-system-audit` 快捷命令优先读取 `ai/doc-standards/00-09`，旧项目 fallback 到 `docs/_scaffold/00-09`；`15-post-sync-cleanup` 同步说明更新为新路径。
- `README.md`、`SOP.md`、`git-guide.md`、`MAINTAINERS.md`、`docs/README.md` 与 `scripts/check-template.sh` 同步更新路径说明、自检函数和防文档滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-doc-standards-location.md`。

## v1.19.0（2026-06-29）

- 新增 AI CLI 快捷命令路由：`ai/commands/` 提供 `/run ...` 与自然语言意图到权威 Prompt / SOP / 脚本说明的映射，降低用户手工查找、复制、粘贴 prompt 的成本。
- 新增会话续接与断点恢复规则：`ai/session-rules.md` 定义新窗口恢复流程、自动更新触发点和写入确认边界；默认本地续接文件为 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`，并通过 `.gitignore` 排除。
- 新增 `template-docs/session-handoff.example.md` 作为续接文件样例；`README.md`、`SOP.md`、`INIT-PROMPT.md`、`ai/prompts/README.md` 和常用 Prompt 改为命令路由优先、详细 Prompt 作为权威执行模板。
- `template-sync.json`、`scripts/sync-template.sh` 兜底清单与 `scripts/check-template.sh` 纳入新规则 / 命令文件 / 样例文件，并增加防入口滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-ai-command-router.md` 与 `TEMPLATE-UPGRADE-session-handoff.md`；`TEMPLATE-UPGRADE-doc-standards-location.md` 暂留 `_proposals/`，待后续阶段迁移 `docs/_scaffold` 路径。

## v1.18.3（2026-06-28）

- `scripts/check-template.sh` 将 CHANGELOG 当前版本检查改为动态读取根目录 `VERSION`，并增加三段式版本标题降序检查，避免版本记录硬编码或插入顺序漂移。
- `git-guide.md` 账号体系去个人化：移除会随模板同步下发的具体维护者账号、个人邮箱与 Token 类型事实，保留通用多账号 / 提交身份 / scope 排查方法。
- `README.md` 将常用命令拆为“派生项目使用者”和“模板维护者”，并补 Windows 脚本入口选择矩阵，明确哪些命令依赖 Git Bash。
- `MAINTAINERS.md` 补充同步清单摘要边界、个人信息禁入同步文档、关键机制防文档滞后断言规则。
- `scripts/new-project.sh` 生成的派生项目 README 增加 `ai/project-rules.md` 首次必填 checklist，降低占位未填就进入设计阶段的风险。

## v1.18.2（2026-06-28）

- `scripts/check-template.sh` 增加「防文档滞后」断言组：要求根目录人读操作文档（`git-guide §5` / `SOP` / `MAINTAINERS`）引用 `_scaffold` / 16 号审计闭环，避免「脚本层已自洽、人读文档滞后」再现（v1.17/v1.18 引入这些机制时 `git-guide §5` 曾漏更，PR #37 事后补齐，本版把防护固化为断言）。

## v1.18.1（2026-06-28）

- 根目录操作文档追赶 v1.17.0 / v1.18.0 建立的 `_scaffold` / 16 号审计闭环（v1.18.0 落地时漏改了操作权威 `git-guide.md`，脚本层与提示词层已自洽、人读文档滞后）：
  - `git-guide.md §5` 新增 §5.6「`_scaffold` 规范镜像」：说明下行同步会新增只读 `docs/_scaffold/00-09`、不覆盖项目自己的 `docs/00-09`、`docs/_scaffold/*` 在 dry-run 中属预期；§5.2 清单补 `_scaffold` 例外，§5.5 补 `15-post-sync-cleanup → 16-docs-system-audit` 闭环。
  - `SOP.md` 场景索引新增「项目文档成型后回溯审计」行，指向 `ai/prompts/review/16-docs-system-audit.md`。
  - `MAINTAINERS.md` 自检 / CI 章节与发布 Checklist 补 `check-template.sh` 的 `_scaffold` 镜像自检（`require_scaffold_mirror`）；文档分区补 `inputs/`、`archive/`、`_scaffold/`。
  - `README.md` 补 v1.16.1 元文档迁移到 `template-docs/` 的说明，消除早期版本记录旧文件名与现名的矛盾。
  - `CONTRIBUTING.md §8` 注明治理类变更自 v1.6.5 起统一记入 `CHANGELOG.md`，本节不再追加。

## v1.18.0（2026-06-28）

- 新增 `_scaffold` 规范镜像：`sync-template.sh` 下行同步时把模板 `docs/00-09` 撰写规范镜像到派生项目 `docs/_scaffold/`（只读、非项目事实、随模板刷新），不覆盖派生项目自己的 `docs/00-09`。
- `scripts/check-derived-sync.sh` 放行 `docs/_scaffold/*`；`docs/README.md` 增加 `_scaffold/` 分区说明；`scripts/check-template.sh` 增加 `_scaffold` 镜像自检（临时派生项目验证镜像生成、项目事实不变、边界检查通过）。

## v1.17.0（2026-06-28）

- 新增 `ai/prompts/review/16-docs-system-audit.md`，用于项目成型后用 `ai/document-lifecycle-rules.md` 回溯审视整条 PLM 链路（追溯链 / 横切一致 / 变更传播 / 外部接入 / 生成矩阵 / 可行性 / 交付物形态），产出健康度报告与回梳计划，先出报告不改文件。
- `INIT-PROMPT.md` 场景索引、`template-sync.json` 与 `scripts/check-template.sh` 纳入新提示词。

## v1.16.2（2026-06-27）

- `CONTRIBUTING.md`、`MAINTAINERS.md` 与 `_proposals/README.md` 补充模板维护纪律：无论是现有提案驱动，还是对话中主动提出的模板修改，都必须先切维护分支、同步维护提案记录、PR 合并后再归档。
- `.gitignore` 与治理文档补充 `NEXT-STEPS.md` 规则：本地临时续接文档不纳入模板版本库，不进入同步清单。
- `_archive/` 中补入两份早期历史底稿，作为模板方法论演化的归档材料保留；它们不纳入同步清单，也不作为当前活规则来源。

## v1.16.1（2026-06-27）

- 将模板元文档集中迁移到 `template-docs/`，避免根目录继续堆积 `BEGINNER-GUIDE`、`ENV-SETUP`、`AI-CLI-SETUP`、`SMOKE-TEST`、`SMOKE-TEST-REPORT-TEMPLATE`、`TEMPLATE-METHODOLOGY` 等说明文件。
- 更新 `README.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh` 的入口和同步路径。

## v1.16.0（2026-06-27）

- 新增 `AI-CLI-SETUP.md`，把 `Claude CLI` / `Codex CLI` 的安装、验证、与公司中转站配置的衔接顺序独立成文档。
- 更新 `ENV-SETUP.md`、`BEGINNER-GUIDE.md`、`README.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充 AI CLI 独立入口。

## v1.15.1（2026-06-27）

- 修正公司中转站说明边界：`ENV-SETUP.md` 与 `BEGINNER-GUIDE.md` 现在明确区分“CLI 官方安装 / 登录”和“LeMesh / CC-Switch / 中转代理配置”，避免把内网手册误写成 `Claude CLI` / `Codex CLI` 安装指南。

## v1.15.0（2026-06-27）

- `ENV-SETUP.md` 补充 AI CLI 工具说明，把 `Claude CLI`、`Codex CLI` 纳入“至少一种”的推荐清单，并解释为什么当前不优先脚本化这类工具。
- `ENV-SETUP.md` 与 `BEGINNER-GUIDE.md` 新增公司中转站入口：`http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model`，提示实际模型代理配置以内网手册为准。
- `SMOKE-TEST.md` 明确当前烟测不覆盖 AI CLI 安装登录和公司中转站具体配置。

## v1.14.0（2026-06-27）

- `ENV-SETUP.md` 补充“每个工具是什么、为什么要装、什么时候可以跳过”的新手解释，避免只给软件清单却不解释用途。

## v1.13.0（2026-06-27）

- 新增 `SMOKE-TEST-REPORT-TEMPLATE.md`，为每次新手烟测提供统一记录格式，便于区分问题更像出在环境、文档入口还是脚本提示。
- 更新 `SMOKE-TEST.md`、`README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充烟测记录入口并纳入下行同步清单。
- `scripts/check-prereqs.ps1` 将 `gh` 从本地烟测的硬必需项降为条件必需；`scripts/bootstrap-dev-env.ps1` 对 `winget` 安装失败改为明确告警；`SMOKE-TEST.md` 与 `ENV-SETUP.md` 明确本地烟测不要求 `gh`。
- `scripts/check-prereqs.ps1` 进一步区分“Git Bash 已安装”和“bash 命令已加入 PATH”；`SMOKE-TEST.md` 与 `ENV-SETUP.md` 增加使用 Git Bash 完整路径执行脚本的示例。
- `scripts/new-project.sh` 在本机未配置 Git 身份时，改为使用临时本地身份完成初始化提交，避免本地烟测卡在 `Author identity unknown`。
- `scripts/new-project.sh` 不再默认绑定固定 GitHub 账号；远端建仓优先读取当前 `gh` 登录账号，只有需要切换账号时才显式传 `--account`。

## v1.12.0（2026-06-27）

- 新增 `SMOKE-TEST.md`，把 Windows 下的新手环境检查、本地建项目、环境采集和文档入口验证串成一份独立烟测操作单。
- 更新 `README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充新手烟测入口并纳入下行同步清单。
- `scripts/check-template.ps1` 在 PowerShell 无法启动 Git Bash 时，改为退回原生 PowerShell 结构检查；`scripts/check-derived-sync.ps1` 与 `scripts/sync-template.ps1` 则改为输出明确的 Bash 启动错误，避免直接暴露难懂的底层崩溃信息。
- `README.md`、`SOP.md`、`ENV-SETUP.md`、`git-guide.md` 与 `MAINTAINERS.md` 补充 Windows 边界说明：Git Bash / MSYS 启动失败优先视为本机环境问题，不继续靠模板 fallback 扩复杂度。

## v1.11.0（2026-06-27）

- 新增 `ENV-SETUP.md`，把新手环境准备、必备 / 推荐软件清单、Windows 一键安装入口和常见限制独立成环境手册。
- 新增 `scripts/check-prereqs.ps1`，用于检测 Git / Git Bash / gh / Node.js / Python / VS Code / Docker / Java 等前置项。
- 新增 `scripts/bootstrap-dev-env.ps1`，基于 `winget` 尽量一键安装基础开发环境。
- 更新 `README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`docs/env/README.md`、`scripts/new-project.sh` 与新建项目 Prompt，补上“先准备环境，再采集环境”的新手入口。
- `template-sync.json` 与 `scripts/sync-template.sh` 将环境手册和新脚本纳入下行同步清单。
- `ENV-SETUP.md` 补充当前支持边界：正式支持 Windows；Linux / macOS 暂只保留软件清单参考和后续扩展建议，不声称已提供一键安装能力。

## v1.10.0（2026-06-27）

- 新增 `BEGINNER-GUIDE.md`，把“第一次使用模板该先看什么、先做什么、常见错误是什么”独立成新手操作手册。
- 新增 `TEMPLATE-METHODOLOGY.md`，以当前活文件为基准重写模板设计说明，明确它属于模板元文档而不是 `docs/` 中的派生项目过程文档。
- 更新 `README.md`、`SOP.md`、`MAINTAINERS.md`，补充新手入口与方法论入口。
- `template-sync.json` 将上述两份新文档纳入下行同步清单，避免派生项目保留过期副本。

## v1.9.0（2026-06-26）

- 拆分 Prompt Library：`INIT-PROMPT.md` 改为轻量索引，完整可复制 Prompt 迁移到 `ai/prompts/` 并按 docs / dev / review / planning / setup / git / maintainers 分类。
- `template-sync.json` 与 `scripts/sync-template.sh` 兜底清单纳入 `ai/prompts/`、`ai/document-lifecycle-rules.md` 与 `docs/inputs/README.md`，避免下行同步漏文件。
- 更新 `SOP.md`、`README.md`、`scripts/new-project.sh`、`CONTRIBUTING.md` 和自检脚本，统一指向拆分后的 Prompt 文件路径。

## v1.8.0（2026-06-26）

- 新增 `ai/document-lifecycle-rules.md`，定义多入口生成、文档剖面、生成矩阵、全链追溯、变更传播、横切事实权威源和外部文档接入规则。
- `ai/index.md` 追加文档生命周期规则，`template-sync.json` 将其纳入下行同步清单。
- `INIT-PROMPT.md` §0 从 vision-first 扩展为 inputs-first，并在单任务、审查、单文档修订、文档反向同步和 docs 验收 checklist 中引用追溯链与变更传播规则。
- `INIT-PROMPT.md` §1 重构为输入材料评审与入口判定，支持粘贴正文、文件路径和文件夹路径，并引导小工具 / 小系统使用 Lean 剖面。
- `README.md` 与 `scripts/new-project.sh` 轻量改为“多入口生成 / 补齐文档体系”表述，避免普通使用者入口只绑定愿景起步。
- 新增 `docs/inputs/README.md` 原始输入包目录说明；`docs/README.md` 补充外部接入文档锚定与分区要求，避免策略 / 调研 / 决策文档成为无引用孤岛。

## v1.7.1（2026-06-25）

- 跟进 v1.7.0 阶段双维度规则，修正 `scripts/new-project.sh` 生成的派生 README，避免继续把 Phase1 默认写成 MVP。
- 更新 `_examples/` 三个样例的 PRD 与验证计划，补齐交付物形态和退出标准。
- 增强 `scripts/check-template.sh`，将新项目 README 与样例交付物形态纳入自检，防止 Demo/MVP/产品语义回退。
- README 与 `INIT-PROMPT.md` §15 补充同步 v1.7+ 后应审计交付物形态与验证矩阵。

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
