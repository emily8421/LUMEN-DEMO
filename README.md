# ai-project-template

跨项目复用的AI编程项目模板。新建项目时，整体复制本目录到新项目根目录即可（`_archive/`、`_examples/` 为模板自带参考材料，新项目可保留或删除）。

## 快速开始

```text
1. 复制本目录 → NewProject/
2. 初始化 git 仓库：进入新目录 `git init -b main`，建远端仓库并推送
   （默认账号 emily8421，账号说明见 docs/git-guide.md；
    或直接用 scripts/new-project.sh 一步完成「复制 + 建库 + 首提交 + 推送」）
3. 填写 docs/00-scenario.md ~ 02-srs.md
4. 先填 ai/project-rules.md 的 §1 Phase边界 + §2 技术栈 + §3 项目形态与文档裁剪（凭 00-02 粗略定即可，作为 03-09 生成的约束）
5. 用 INIT-PROMPT.md 中的“新项目初始化”Prompt，按 §3 的裁剪结果生成 docs/03-09（无数据库则省略 06；无公开接口则省略 07）
6. 人工审核03-09后，补 ai/project-rules.md 的 §4 目录特例 + §5 编码约定与禁区
7. 以下文件直接使用，不需修改：
   ai/index.md、ai/global-rules.md、
   AGENTS.md / CLAUDE.md / .cursor/rules/project-rules.mdc
8. 进入Sprint1
```

> **若起点是一份产品愿景文档**（而非从零写 00-02）：完成步骤 1–2 后，跳过 3–5，直接用 `INIT-PROMPT.md` §0
> 「从产品愿景文档生成完整文档体系」——它会一次性产出 00-09 + design-\* + 阶段建议（含验证计划）；
> 人工只需确认 03 §3 的阶段路线图，即可进入 Sprint1。愿景文档约定放 `docs/vision/product-vision.md`。

## 目录说明

| 路径 | 作用 |
|---|---|
| `ai/index.md` | 路由表，AI每次任务前必读的第一个文件 |
| `ai/global-rules.md` | 跨项目通用规则，逐字复用 |
| `ai/project-rules.md` | 本项目专属规则（Phase边界、技术栈、项目形态裁剪、编码约定与禁区），每个新项目重新填写 |
| `docs/00-09` | 核心文档骨架，00-02人工提供，03-09由AI生成、人工确认；其中06/07按 `ai/project-rules.md` §3 的项目形态可省略 |
| `tasks/` | 任务单，按需启用（见tasks/README.md） |
| `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/project-rules.mdc` | 三个AI工具的入口文件，均指向`ai/index.md`，不随规则增减而修改（Cursor入口额外带frontmatter以便自动加载） |
| `INIT-PROMPT.md` | 常用Prompt模板（初始化/单任务执行/审查） |
| `CONTRIBUTING.md` | 模板变更治理流程（分支→PR→评审→合并，含派生项目回流） |
| `docs/git-guide.md` | git 使用说明（账号体系/起新项目/提交规范/同步/踩坑） |
| `scripts/` | 自动化脚本：`new-project.sh`（起新项目）、`sync-template.sh`（下行同步） |
| `_archive/` | 规范体系设计文档存档，供人查阅，AI不读取，新项目可保留或删除 |
| `_examples/` | 填好的参考样例项目（演示文档填完的样子），仅供对照，新项目可保留或删除 |

## 方法论同步（模板 ⇄ 项目）

模板的「方法论」文件在模板与各派生项目间双向流动；`ai/project-rules.md` 等**项目专属内容不参与同步**。

**上行（改模板 / 派生项目归纳回流）**：见 `CONTRIBUTING.md`——所有模板改动走「分支 → PR → 评审 → 合并」，禁止直推 `main`、禁止在派生项目里改 `ai/global-rules.md` 后手动回抄。

**下行（模板 → 项目）**：把下列**方法论文件**从模板覆盖到派生项目，并在项目提交里注明 `sync template vX.Y`（版本号取自 `ai/global-rules.md` 顶部的「模板版本」）：

```text
ai/global-rules.md        # 跨项目通用规则（带版本号，审计基准）
CONTRIBUTING.md           # 模板变更治理流程
docs/git-guide.md         # git 使用说明
scripts/new-project.sh    # 一键起新项目
scripts/sync-template.sh  # 本下行同步脚本（自举后由它自动完成）
```

手动下行：逐文件覆盖复制 + 提交。自动下行：在派生项目里执行 `bash scripts/sync-template.sh --commit`（先 `--dry-run` 看差异）。审计：在各项目 `grep「模板版本」` 比对，版本落后于模板即需同步。

### 版本记录

> 版本号追踪 `ai/global-rules.md` 内容（随该文件同步到下游，用于跨项目审计）；docs 骨架、project-rules 模板等非 global-rules 改动不触发版本号递增。

- v1.4（2026-06-19）：`ai/global-rules.md` 新增 §8 文档演进规则（积累式：完整骨架+阶段标签+状态，只增不删）；§5 目录标准扩为 00-09（新增 09-verification 验证支柱）、新增 `docs/vision/` 源文档与 `design-*.md` 子系统设计两类语义命名约定。同期非 global-rules 改动：`INIT-PROMPT.md` 新增 §0 愿景→完整文档体系主 prompt、§1/§10 扩至 03-09；`ai/project-rules.md` §5.2 禁区补阶段归属条；`docs/` 00-08 模板补完整需求+阶段标签写法指引、新增 09-verification 模板；`README` 快速开始加愿景起步分支
- v1.3（2026-06-17）：`ai/global-rules.md` §1 文档驱动开发顺序链补充说明（数据库 / API 环节仅按项目形态启用）。同期非 global-rules 改动：修正 `text-cleaner-cli` 样例 README 自相矛盾（原误标 `docs/07` 省略）、`INIT-PROMPT.md` §10 checklist C 对 06/07 加“（如有）”标注、`ai/project-rules.md` §3 补前端持久化指引（localStorage / IndexedDB 等不触发 06）、新增 `md-notes-frontend` 纯前端样例
- v1.2（2026-06-17）：将 `ai/project-rules.md` 的“项目形态与文档裁剪”前置为初始化必填；初始化/单任务 Prompt 改为按条件处理 docs/06、07；`docs/05-tech-spec.md` 不再依赖初始化时尚未填写的编码约定；新增无 DB / 无 API 样例项目
- v1.1（2026-06-16）：Cursor 入口加 frontmatter（`alwaysApply`）；docs 06/07 按项目形态可省略；新增模板版本戳与 docs/03-08 验收 checklist。同期非 global-rules 改动：docs 03-07 预置内容骨架、project-rules 补 §4 编码约定与禁区、`_archive` 两份合并为纯-why 单文档、init 顺序前置（§1/§2 在生成 03-08 前填、§3/§4 审核后补）
- v1.0：初始体系（设计说明见 `_archive/`）

设计说明（这套体系「为什么」这样设计）见 `_archive/AI编程规范体系说明.md`；规则本体（what）在 `ai/global-rules.md` 等 `ai/` 文件中，archive 不重复。
