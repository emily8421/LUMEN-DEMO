# 15 同步后项目整理（派生项目）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：派生项目完成模板方法论同步后，审计并整理项目专属内容，使其符合最新模板建议。

**快捷命令**：`/run post-sync-cleanup`（自然语言：同步后整理项目 / 方法论同步后清理）。

**目的**：弥补 `sync-template` 只同步方法论、不自动修改项目事实文档的空白；先输出迁移计划，经人工确认后再移动 / 修改项目文档。

**适用场景**：派生项目同步到新模板版本后，尤其是模板新增 docs 分区规则、README 标准版块、运行环境约束等项目专属迁移要求时。

**不适用场景**：还未完成模板方法论同步；或用户要求直接开发新功能。

**使用前准备**：确认当前在派生项目根目录，工作区状态已知；已完成 `scripts/sync-template.*` 同步并提交或准备单独提交同步后整理改动；如存在推荐路径 `sync-records/template-sync/` 或旧路径 `docs/archive/template-sync/` 同步运行记录，优先读取推荐路径最近一份，旧路径仅作兼容读取。

**续接要求**：第一段输出迁移计划后，必须把迁移范围、待确认项、禁止事项和下一步写入 / 更新续接文件。

**预期产出**：先输出审计结果与迁移计划，并从同步运行记录中提炼可回流模板优化点；同时给出同步报告回写建议。人工确认后，执行 docs 分区整理、README 补齐、`ai/project-rules.md` 补齐和运行环境约束补齐。

**使用后下一步**：人工确认迁移计划后，用本节第二段 Prompt 执行迁移；完成后运行项目自检 / 文档检查并单独提交，并把整理摘要回写 `sync-records/template-sync/` 同步报告或 `.ai/session-handoff.md`。若想用最新规范回溯审视文档体系（sync 后 `ai/doc-standards/00-09` 已刷新；旧项目可 fallback 到 `docs/_scaffold/00-09`），运行 `ai/prompts/review/16-docs-system-audit.md` 的同步后审计模式——它会对照规范镜像核查项目 `docs/00-09` 的章节完整性与撰写规范偏离。

### 第一段：同步后整理审计与迁移计划

```text
请在当前派生项目中，按照最新 ai-project-template 方法论，对项目专属内容做一次“同步后整理审计与迁移计划”。

重要前提：
- 我已经完成模板方法论同步，当前项目中应已有最新版 `docs/README.md`、`ai/global-rules.md`、`INIT-PROMPT.md`、`SOP.md` 等方法论文件。
- `sync-template` 只同步方法论文件，不会自动改项目事实文档。
- 本次任务不是开发新功能，不允许扩展需求，不允许改业务代码。
- 根 `README.md`、`ai/project-rules.md`、`docs/00-09`、业务代码都是项目专属内容，整理前必须先审计再给迁移计划。

请按以下步骤执行：

1. 读取规则
   - 先读取 `ai/index.md` 列出的全部规则文件。
   - 再读取 `docs/README.md`，理解最新 docs 分区规则。
   - 再读取 `ai/project-rules.md`、根 `README.md`、`docs/00-09`、`docs/inputs/`、`docs/vision/product-vision.md`（如存在）。
   - 如存在 `sync-records/template-sync/` 或旧路径 `docs/archive/template-sync/` 下的同步运行记录，优先读取推荐路径 `sync-records/template-sync/` 最近一份，旧路径仅作兼容读取，提取同步问题、待确认项和可回流模板优化点。

2. 审计当前 docs 结构
   - 列出 `docs/` 根目录下所有文件和子目录。
   - 判断哪些文件允许留在 `docs/` 根目录：`README.md`、`00-scenario.md` ~ `09-verification.md`。
   - 找出不应留在 `docs/` 根目录的文件，例如调研文档、会议纪要、临时分析、子系统详细设计、ADR、环境记录、历史归档。
   - 按 `docs/README.md` 给出建议迁移路径：
     - 未经评审的愿景草稿 / 客户输入 / brief / 现有系统说明 → `docs/inputs/`
     - 经输入评审、补齐和确认后的产品愿景叙事 → `docs/vision/`
     - 子系统 / 模块详细设计 → `docs/design/`
     - 架构决策记录 → `docs/decisions/`
     - 技术调研 / 实验 → `docs/research/`
     - 环境 / 资源约束 → `docs/env/`
     - 会议 / 访谈 / 评审记录 → `docs/meetings/`
     - 废弃但需留痕 → `docs/archive/`

3. 审计运行环境与资源约束
   - 检查是否存在 `docs/env/local-env.md`。
   - 若不存在，检查是否存在 `scripts/collect-env.ps1`；若存在，建议先运行：
     `powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1`
   - 若 `scripts/collect-env.ps1` 不存在，说明需要先完成模板方法论同步。
   - 检查 `docs/env/local-env.md` 是否已补齐人工确认项，至少包括：
     - Demo 阶段必须在本机运行的部分
     - 允许降级 / Mock / 远程运行的部分
     - 禁止在本机运行的重资源部分
     - 是否允许联网
     - 是否允许安装依赖
     - 是否允许使用公司服务器
     - 若需服务器，资源申请口径
   - 检查 `ai/project-rules.md` 是否存在并补齐 §2.5「运行环境与资源约束」。若没有 §2.5，请建议新增；未知项保持“待确认”，不得虚构。
   - 检查 `docs/04-architecture.md` 是否包含“部署 / 运行拓扑约束”，并明确本机单机 / 公司服务器 / 远程服务边界。
    - 检查 `docs/05-tech-spec.md` 是否包含“运行环境与资源评估”，并说明本机 Demo 可行性、资源瓶颈、降级 / Mock 策略、服务器资源预案。
    - 检查 `docs/09-verification.md` 是否包含“本机资源验证”，并说明如何验证 Demo 在本机资源范围内可运行。
   - 若项目已同步到 v1.7.0+，检查 `docs/03-prd.md` §3 是否为每个 Phase 声明交付物形态（Demo/MVP/产品）和退出标准。
   - 若项目已同步到 v1.7.0+，检查 `docs/09-verification.md` 的 REQ → 用例追溯矩阵或分阶段验证范围是否体现交付物形态。

4. 审计根 README
   - 检查根 `README.md` 是否是项目说明，而不是模板说明。
   - 若缺少版块，请给出补齐建议，推荐包含：项目简介、当前阶段、当前能力、快速开始、文档入口、运行环境、开发计划、验证方式、模板关系。
   - 必须明确：
     - 根 `README.md` 是项目专属文档，不参与模板下行同步。
     - 模板方法论文件由 `template-sync.json` 定义，执行 `scripts/sync-template.*` 时可能被覆盖。
     - 项目专属内容写入 `ai/project-rules.md`、`docs/` 和根 `README.md`。

5. 审计 `ai/project-rules.md`
   - 检查初始化必填检查是否包含：`docs/README.md` 分区规则、不得把新增项目文档直接放到 `docs/` 根目录。
   - 检查 §2.5 是否引用 `docs/env/local-env.md`，并保留待人工确认项。
   - 检查 §3 是否明确 `docs/06`、`docs/07`、`frontend/`、`backend/`、`tests/`、`scripts/`、`docker/` 的保留 / 省略 / 删除决策。
   - 不要把模板方法论长文复制进 project-rules；只补项目专属约束和裁剪决策。

6. 输出迁移计划
   先不要修改文件，只输出计划，格式如下：

   A. 当前结构审计
   - 合规项
   - 需要迁移的文件
   - 不确定项

   B. 建议迁移表
   | 当前路径 | 建议路径 | 类型 | 理由 | 是否需要人工确认 |
   |---|---|---|---|---|

   C. 运行环境约束补齐建议
   - 缺失文件 / 章节
   - 建议先运行的脚本
   - 可自动补骨架的内容
   - 必须人工确认的内容

   D. README 补齐建议
   - 缺失版块
   - 建议新增内容摘要

   E. project-rules 补齐建议
   - 缺失项
   - 建议新增位置

   F. 风险与注意事项
   - 哪些文件移动可能影响链接
   - 哪些引用需要同步更新
   - 哪些内容不建议移动
   - 如存在 `.github/workflows/template-check.yml`，提示这是模板仓自检入口；派生项目普通 PR 应迁移到 `.github/workflows/project-check.yml`，不要用 `scripts/check-template.sh` 阻塞项目 PR

   G. 待人工确认问题
   - 列出所有无法自动判断的问题

   H. 模板优化回流建议
   - 从同步运行记录和本次整理中归纳可通用于多个项目的问题
   - 区分项目专属问题 / 环境问题 / 模板方法论问题
   - 对建议回流模板的问题，给出 `_proposals/TEMPLATE-UPGRADE-*.md` 草案标题和去项目化摘要

   I. 同步报告回写建议
   - 建议回写到 `sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md` 的整理摘要
   - 已处理项、未处理项、待确认项、后续文档审计入口
   - 若用户暂不提交长期报告，写入 `.ai/session-handoff.md` 的临时续接内容

7. 等我确认后再执行迁移
   - 未经确认，不要移动 / 重命名 / 删除文件。
   - 经确认后，按最小变更执行：创建必要子目录、移动文件、更新内部链接、补根 README、补 `ai/project-rules.md`、补环境约束章节骨架。
   - 完成后输出变更清单、迁移前后路径对照、需要人工复核的链接和建议验证命令。
```

### 第二段：确认后执行迁移

```text
我确认执行上述同步后整理迁移计划。

请按已确认的迁移表执行，但必须遵守：
- 不改业务代码。
- 不扩展需求。
- 不删除任何项目事实文档；如确需移除，只能移动到 `docs/archive/`。
- 移动文件后，更新被影响的相对链接。
- 根 `README.md` 只补项目说明版块，不改成模板 README。
- `ai/project-rules.md` 只补项目专属约束，不复制模板方法论长文。
- 若 `docs/env/local-env.md` 缺失且用户允许，先运行 `powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1`；否则只给出待执行命令。
- 环境约束未知项必须保留“待确认”，不得虚构本机资源或服务器资源。
- 每一步保持最小变更。
- 若需要生成 `_proposals/TEMPLATE-UPGRADE-*.md`，必须去项目化，不得包含客户、账号、路径敏感信息或项目专属业务细节。

完成后请输出：
1. 实际变更清单
2. 文件迁移对照表
3. 已更新的链接
4. 环境约束补齐情况
5. 未能自动确认的链接 / 风险
6. 从同步运行记录提炼出的模板优化建议 / 已新增提案
7. 同步报告回写建议
8. 建议验证命令
```
