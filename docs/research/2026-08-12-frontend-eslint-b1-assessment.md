# LUMEN 前端 ESLint B1 引入前现状评估（2026-08-12）

> 定位：**前端代码静态现状只读评估 · 方案设计实证依据 · 待人工确认治理范围**。
> 本文记录 LUMEN 前端在引入 ESLint（governance P1 子项「eslint B1」）前的代码规模、质量基线、文件膨胀与工具链现状，为后续 ESLint 配置 / CI 接入方案设计提供量化实证。
> 本文不是新的产品需求、已批准实施方案或验收记录，不替代 `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`。文中候选方案与建议在人工确认并进入 Sprint / Task 前，不视为已批准实施。
> 上位依据：`tasks/task-042-ci-minimum-gates.md` §降级边界（B1：frontend-lint(eslint) P0 不做，留 P1，须在 `docs/05 §4.2.4` / NFR-006 显式留痕）+ `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-2 第 5 点。本文为该 P1 子项的落地前现状评估。

## 0. 元数据与评估边界

| 项 | 值 |
|---|---|
| 评估日期 | 2026-08-12 |
| 代码基线 | `main` @ `c16fe62`（= origin/main，工作区 clean） |
| 项目版本 | `v3.8.9` |
| 评估对象 | `frontend/src/`、`frontend/package.json`、`frontend/tsconfig.json`、`.github/workflows/project-check.yml`（前端相关 CI） |
| 主要目标 | 摸清引入 ESLint 前的规模 / 质量基线 / 文件膨胀 / 现有工具链，为方案设计（规则集严格度、advisory vs required、存量债登基线、是否引入 prettier）提供实证 |
| 不在范围 | 后端 lint（已闭环，见 task-044 / 维护态批12）、前端文件膨胀拆分（另议）、真实安装 ESLint 跑基线（方案设计阶段做）、UI 视觉验收、真实性能压测 |
| 验证性质 | 静态源码与配置只读审查 + 规模/残留指标统计；未执行 `npm install` / 前端 build / eslint 实跑 |

### 0.1 为什么需要本次评估

「eslint B1」是 P0 立 CI 最小代码门（task-042 / NFR-006）时显式推迟到 P1 的子项：当时 A1（backend-test / frontend-build / backend-lint 三 job advisory→required）落地，B1（frontend-lint(eslint)）记 P1 留痕。后端轨道的 P1 子项（CQ-P1-005 错误契约、002 Protocol、003 UoW、ruff 37 旧债清零）已全部闭环（v3.8.9），轮到这个被推迟的前端 lint 子项。

引入前先做现状评估，回答：

1. 前端代码规模多大，ESLint 跑起来成本如何；
2. 现有质量基线如何，引入后存量债预计多大（决定 advisory 过渡期长度）；
3. 现有工具链（tsc / vite build）已覆盖什么，ESLint 应补什么、应避免与什么重复；
4. 文件膨胀是否会被 ESLint 暴露为阻塞（决定是否要先拆分再 lint）。

## 1. 评估方法与证据口径

### 1.1 方法

四类只读检查：

1. **规模与结构基线**：统计 `frontend/src` 下 `.ts/.tsx/.css/.js/.jsx` 文件数与行数、目录结构、最大文件。
2. **现有工具链核查**：`frontend/package.json` scripts / devDependencies、根目录配置文件清单、CI workflow 前端相关 job。
3. **残留指标 grep**：`console.log/debug`、`as any / : any` 等可粗估 lint 存量问题的启发式指标。
4. **范式对照**：对照 `tasks/task-042`（B1 留痕）、后端 ruff 引入路径（advisory→清零，task-044）、`ai/project-rules.md §5.1` 前端编码约定。

### 1.2 证据等级

| 等级 | 含义 | 本文使用方式 |
|---|---|---|
| E1 | 源码或配置直接证明 | 规模、行数、残留指标计数、现有依赖清单 → 可写成已确认事实 |
| E2 | 多处模式与规模统计共同支持 | 代码质量基线整体判断、工具链覆盖判断 |
| E3 | 基于架构/机制推断，未做故障注入或运行复现 | ESLint 能抓什么、ROI 判断 |
| E4 | 候选治理建议 | 规则集、advisory/required、prettier 等方案选项 → 不写成已批准方案 |

### 1.3 限制

- 未真实安装 ESLint 跑检查，存量 lint 问题量为基于残留指标的估算，真实基线以方案设计阶段首次 `eslint` 实跑为准。
- 残留指标（console / any）只覆盖 ESLint 规则集的一小部分；React Hooks 规则违例（exhaustive-deps / rules-of-hooks）、未使用变量等需实跑才能量化。
- 行数阈值是治理信号，不单独证明代码差。

## 2. 量化基线

### 2.1 规模

| 维度 | 数据 | 证据 |
|---|---|---|
| 源码文件 | **113**（tsx 34 + ts 56 + css 23） | E1 |
| 代码行（ts/tsx/css） | **17330** | E1 |
| JS/JSX 文件 | **0**（纯 TypeScript） | E1 |
| 目录结构 | `api / app / components / features(admin,auth) / styles` | E1 |

### 2.2 现有前端工具链

| 项 | 现状 | 证据 |
|---|---|---|
| lint 脚本 | **无**（package.json 仅 `dev / build / preview`） | E1 |
| eslint / prettier / biome 依赖 | **无** | E1 |
| 根目录配置 | 仅 `package.json / tsconfig.json / vite.config.ts` | E1 |
| 类型检查 | `build` 脚本含 `tsc -b`（CI `frontend-build` job 跑） | E1 |
| CI 前端 job | 仅 `frontend-build`（tsc + vite build，required）；**无 `frontend-lint`** | E1 |

技术栈锁定版本：React 18.2.0 / TypeScript 5.5.4 / Vite 5.4.19 / Node 22.17.1（Volta，见 `project-rules §2.5`）。

## 3. 现状发现

### 3.1 代码质量基线极干净（E1+E2）

| 残留指标 | 计数 | 说明 |
|---|---|---|
| `console.log` / `console.debug` | **0** | 无 debug 残留 |
| `as any` / `: any` | **1**（`features/LocalMountPane.tsx`） | 与 `project-rules §5.1`「前端禁 any」冲突，属技术债 |

**结论（E2）**：前端代码基线非常干净。引入 ESLint 后存量债预计极小——与后端当初 ruff **41 条旧债**（task-044 已清零）完全不是一个量级。这直接影响方案策略（见 §4）。

### 3.2 文件膨胀：19 文件超阈值，但属拆分问题、非 ESLint 范围（E1）

超 250 行的文件（节选 top，共 19 个）：

| 文件 | 行数 | 类型 |
|---|---|---|
| `styles/workspace.css` | 722 | CSS |
| `styles/local-mount.css` | 589 | CSS |
| `app/FolderTree.tsx` | 569 | 组件 |
| `features/LocalMountPane.tsx` | 563 | feature |
| `App.tsx` | 545 | 主应用 |
| `features/DocumentsFeature.tsx` | 485 | feature |
| `styles/layout.css` | 458 | CSS |
| `app/useLocalVaultMount.ts` | 442 | hook |
| `app/TermCategoryTree.tsx` | 405 | 组件 |
| `app/ContextPane.tsx` | 366 | 组件 |

**结论（E1）**：触发用户偏好「超文件膨胀先拆」红线（App/CSS>300 / service>250），但 **ESLint 不检查文件大小**——这是拆分问题，不是 lint 问题。`eslint B1` 不碰拆分；膨胀整治应单独立项（候选，E4，见 §6）。

## 4. ESLint B1 引入的影响分析

### 4.1 纯 TS 利好配置（E2）

`frontend/src` 零 JS/JSX，ESLint 配置无需考虑 JS 混合，可统一走 `@typescript-eslint` flat config。配置复杂度低。

### 4.2 存量债极小 → advisory 过渡期可极短或跳过（E2+E3）

后端 ruff 引入时背 41 旧债、走「恒 advisory + ratchet 逐步整治」剧本（task-042 / task-044）。前端因基线干净（§3.1），存量 lint 问题预计个位数到数十量级，**advisory（不阻断）过渡期可极短，甚至首跑清完后直接 required**——与后端那种长期 advisory 不同。真实基线以首次实跑为准。

### 4.3 主要价值：防退化 + React Hooks 规则（E3）

ESLint 在本项目的价值不是「清理存量」，而是：

- **机器守护，防未来退化**：新增代码立即被 CI 拦。
- **补 tsc 管不到的盲区**，尤其 **React Hooks 规则**：
  - `react-hooks/rules-of-hooks`：禁止在条件/循环里调 hook。
  - `react-hooks/exhaustive-deps`：依赖数组漏项——项目大量用自定义 hook（`useDocuments / useFolders / useTags / useTermCategories / useLocalVaultMount` 等），是高价值区，tsc 完全不管。
- TypeScript 规则（`@typescript-eslint/no-explicit-any` 等）兑现 `project-rules §5.1`「前端禁 any」的机器守护。

### 4.4 需避免与 tsc 重复检查（E2）

`build` 已含 `tsc -b`，类型错误已被 CI `frontend-build` 捕获。ESLint 的 TypeScript 规则应聚焦 tsc 不管的（代码风格、潜在 bug 模式、any 禁用），避免与 tsc 的类型检查重叠造成双重报错噪音。具体规则集取舍留方案设计。

## 5. 候选方案与待确认项（E4 · 待人工确认）

> 以下均为候选，未确认前不视为已批准。将在方案设计阶段（plan）逐一拍板。

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 |
|---|---|---|---|---|---|
| ESLINT-C1 | 规则集严格度 | 偏严（基线干净，无需为存量妥协） | §3.1 | 最小集（对标后端 ruff E4/E7/E9/F 风格） | 偏严更早防退化，但首跑可能暴露更多需手工修 |
| ESLINT-C2 | advisory vs required | 首跑 advisory 看基线 → 清完后升 required（类比 A1） | §4.2；task-042 A1 先例 | 直接 required | advisory 多一轮 PR；直接 required 风险=首跑失败阻塞 |
| ESLINT-C3 | 是否引入 prettier | 不引入（ESLint 规则覆盖风格即可，避免双工具复杂度） | 后端 ruff「不自动格式化」先例 | 引入 prettier 分管格式 | 不引入=单一工具；引入=格式与 lint 分离更专业但多依赖 |
| ESLINT-C4 | 存量债登基线方式 | 首跑实跑后登记问题清单到 `docs/05 §4.2.4`，ratchet 整治 | 后端 ruff 37 基线登记先例 | 一次性全修 | 登基线=渐进；全修=若个位数可接受 |
| ESLINT-C5 | CI job 名与位置 | 新增 `frontend-lint` job，对称后端 `backend-lint` | task-042 CI 结构 | 合并进 `frontend-build` | 独立 job 更清晰；合并省一个 job |

## 6. 不在范围

- 后端 lint（已闭环，task-044 维护态批12，ruff 37→0）。
- 前端文件膨胀拆分（§3.2，19 文件超阈值，单独立项，E4 候选）。
- 真实安装 ESLint 与首次基线实跑（方案设计 / 编码阶段）。
- 引入前端类型检查器到 CI（本项目已 `tsc -b`；mypy/pyright 对应物在维护态批8 已记「后续候选」）。

## 7. 落地结果（2026-08-12 全闭环 v3.8.10）

本文作为实证依据已完成使命，ESLint B1 全闭环：

- **方案设计**（plan）：C1 偏严规则集 / C2 advisory→required / C3 不引入 prettier / C4 存量基线登法 / C5 独立 `frontend-lint` job——全按推荐执行。
- **Slice A**（PR #146 `92ea36a`）：装依赖 + flat config + advisory CI。首跑基线 **10 problems（5 error + 5 warning）**，印证本文 §3.1「前端基线极干净」+ §4.3「React Hooks 规则是高价值区」（QuickEntryFeature 2 个 `rules-of-hooks` 真 bug，tsc 没拦住）。
- **Slice B**（PR #147 `c9d8911`）：5 error + 5 warning 全清零 + 升 required。验证：`npm run lint` 0 problem + `npm run build` 301 modules 零回归 + CI `frontend-lint` required 绿（21s）。
- **回写**：`docs/05 §4.2.4`（L164/L165/L171 + 新增批13 条）+ `docs/08` Sprint-38 + `ai/project-rules.md §1` 维护态批13 + `tasks/task-045-frontend-eslint.md` + bump v3.8.10。

本文 §3.2 登记的「19 文件膨胀」不在 eslint B1 范围（拆分问题，非 lint 问题），未随本次处理，仍为单独立项候选（E4）。
