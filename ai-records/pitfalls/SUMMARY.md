# Pitfall 汇总：2026-08-13 ~ 2026-08-14（阶段一 AI 代码缺陷 + 阶段二工具/环境坑）

> 记录类型：AI 协作观察材料的阶段性汇总；不属于项目事实文档，不替代 handoff / docs/08 / docs/09。
> 隐私口径：不记录 token、密钥、账号密码、客户敏感数据或完整对话正文。
> 结构说明：阶段一（2026-08-13，9 份，AI 代码缺陷 + 流程坑）为首次 rollup 原文；阶段二（2026-08-14，2 份，工具 / 环境坑）追加于 §7 起。

## 0. 覆盖边界

- 已覆盖（本地 `.ai/pitfalls/`，共 9 份，全部 2026-08-13）：
  `ai-code-type-lies` / `ai-legacy-type-bugs-mypy` / `ai-legacy-hook-bug-eslint`（AI 代码缺陷三样本，本汇总主体）
  + `ai-records-git-info-exclude` / `cq-p1-001-code-reuse-precheck` / `e4-slice-d-browser-smoke-setup` / `explore-agent-line-estimate-drift` / `grep-head-pipefail-sigpipe` / `lint-rule-over-grep`（流程 / 工具坑 6 份，简要归入 §3）
- 未覆盖：无。
- 下一次 rollup 起点：2026-08-14 起，只统计 `汇总状态：未汇总` 的本地记录。
  （2026-08-14 阶段二追加后更新：08-14 两份已纳入 §7，下一次 rollup 起点改为 2026-08-15。）

## 1. 汇总范围

9 份记录全部产生于 2026-08-13 维护态批次（工程治理 CQ-P1 系列 + 前端 codegen 全量接入）收尾自检；其中 3 份为「存量 AI 生成代码缺陷」样本（1 份当场发现 + 2 份历史补录），6 份为流程 / 工具坑。

## 2. 为什么触发 / 为什么此前未触发

- pitfall 机制随模板 v1.61.4 于 2026-08-13 同步落地，当日即为首个完整执行日——本汇总是机制落地后的首次 rollup。
- 「存量 AI 代码问题」此前不记录的根因：§4.3 触发口径是「**本次**是否产生坑观察」（会话视角），维护中发现的旧账无显式触发引导——已起草模板提案
  `_proposals/TEMPLATE-UPGRADE-pitfall-legacy-code-trigger.md`（待提交）。

## 3. 重复模式（AI 生成代码缺陷 · 3 样本归纳）

| 模式 | 样本 | 机理 | 通用规避 |
|---|---|---|---|
| **类型 / 契约「障眼法」**：类型按想象写，内部自洽、演示通过，与运行时契约失配，靠「消费方碰巧只用存在的字段」运行 | `ai-code-type-lies`（前端响应类型 3 处失配：形状压平哨兵 / 瘦身 shape 谎称完整 / optionality 不一致） | AI 生成时无机器可读契约对照，tsc 只保证内部自洽 | 响应类型源自 codegen（OpenAPI 生成 + drift 门 required）；手写类型逐字段 diff 生成类型，差异显式 narrow + 注释 |
| **隐式非空 / 范围假设**：上游「碰巧不为 None」，下游签名收窄类型 | `ai-legacy-type-bugs-mypy`（current_space_id `int\|None` → service(int)，45 处传播缺口 + ~20 真 bug） | 生成时按当前调用链的运行时巧合写类型 | 类型检查器（mypy/pyright）尽早引入；契约收紧到源头 + fail-closed guard |
| **框架语义规则违反**：编译器不检查的框架约束（如 hooks 调用顺序） | `ai-legacy-hook-bug-eslint`（useRef/useEffect 在 early return 后，tsc 未拦、演示碰巧不炸） | tsc 语法层面合法，语义靠运行时偶然 | 框架专属 lint 插件（react-hooks 等）error 级入质量门 |

**共性根因**：三者都是「生成时验证手段（tsc / 演示）不覆盖缺陷维度」——「看似可行」≠「契约 / 语义正确」。对应生成规范方向：AI 生成代码的可信度来自**与缺陷维度匹配的机器检查**（契约 codegen / 类型检查器 / 框架 lint），而非「能跑」。

## 4. 已形成的改进建议

- **必须保留（已落地）**：openapi-typescript codegen + `frontend-schema-diff` required（v3.8.27 全量闭环）；mypy required（v3.8.11）；eslint react-hooks error 级（v3.8.10）。
- **应沉淀（本次产出）**：模板提案「pitfall 触发口径扩展」——存量 AI 代码问题发现也记录，作为生成规范迭代验证材料（见 §2）。
- **应观察（暂不落地）**：「AI 生成 API 类型必须源自机器可读契约」是否值得升为通用 L0 规范条目——样本集中于前后端双写形态，待 pitfall 继续积累证据后另起提案（提案备选节已注明）。

## 5. 流程 / 工具坑（6 份，简要）

git info/exclude 与 .gitignore 优先级坑 / 代码复用前置检查 / smoke 环境一键启动缺失（Explore 行数估算漂移 + 浏览器环境多轮往返）/ `grep | head` SIGPIPE / lint 规则优先于 ad-hoc grep——均已在对应批次内闭环，其中「smoke 一键启动」与 token-hotspot SUMMARY §4 P1 建议合流。

## 6. 模板回流判断（阶段一）

- **回流 1 项**：`_proposals/TEMPLATE-UPGRADE-pitfall-legacy-code-trigger.md`（§4.3 触发口径扩展）——本汇总 §2/§3 为其证据基础。
- **不回流**：三样本的规避手段（codegen / mypy / eslint）已是模板 L0 / 形态 profile 既有方向的实例验证，无需重复回流。

---

## 7. 阶段二（2026-08-14 · 工具 / 环境坑 2 份）

### 0. 覆盖边界（阶段二）

- 已覆盖（本地 `.ai/pitfalls/`，共 2 份，均 2026-08-14）：`powershell-array-splat` / `volta-default-toolchain-path-prepended`
- 未覆盖：无（本地 11 份中 9 份属阶段一、2 份属本阶段）
- 下一次 rollup 起点：2026-08-15 起，只统计 `汇总状态：未汇总` 的本地记录

### 1. 记录归纳

| 记录 | 现象 | 根因 | 规避 / 修复 | 通用性 |
|---|---|---|---|---|
| `powershell-array-splat` | `& $script @("-Param", val)` 数组 splat 报类型转换错——`-` 前缀字符串**不被当作参数名**，被当成位置参数的值 | PS 语言细节：数组 splat 无参数名语义 | 命名参数透传用**哈希表 splat**（`@{Param=val}` + `@hash`），开关参数显式 `$true` | 高（任何 PS 脚本透传命名参数都会踩） |
| `volta-default-toolchain-path-prepended` | 项目 volta 钉 node 22，会话却跑 node 16（`where node` 命中裸 image 目录），vite 5 起不来 | volta **shim 启动链**把全局默认工具链裸目录前置进进程 PATH，裸 exe 优先级高于一切 shim；注册表 PATH 无此条目，纯进程继承 | `volta install node@<项目版本>` 对齐全局默认（根除）；当次用全路径直启绕过；**诊断口径：先查会话 PATH，勿只看注册表** | 高（volta + 多 node + shim 启动 CLI 的 Windows 机器） |

### 2. 与阶段一的关联

两者同属「验证 / 诊断手段不覆盖缺陷维度」的变体：数组 splat 坑是「语法合法但语义与直觉相反」（类比阶段一「类型障眼法」）；volta PATH 坑是「诊断依据看错层」（注册表 ≠ 进程继承的会话 PATH）。无新增共性模式，不重复归纳。

### 3. 模板回流判断（阶段二）

- **不回流**：PowerShell 语法细节不属模板规则范围（阶段一单条记录已注明）；volta PATH 坑为环境诊断经验，通用但低频，单条记录已含完整诊断口径——若后续再积累同类「工具链版本漂移」样本（nvm/fnm/asdf 等），可合并起草「运行时版本诊断先查会话环境」提案，暂攒证据。
