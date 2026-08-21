# Pitfall 汇总：2026-08-13 ~ 2026-08-21（阶段一 AI 代码缺陷 + 阶段二工具/环境坑 + 阶段三环境/模板缺口坑 + 阶段四命令编排/契约复用/环境运行时坑）

> 记录类型：AI 协作观察材料的阶段性汇总；不属于项目事实文档，不替代 handoff / docs/08 / docs/09。
> 隐私口径：不记录 token、密钥、账号密码、客户敏感数据或完整对话正文。
> 结构说明：阶段一（2026-08-13，9 份）为首次 rollup 原文；阶段二（2026-08-14，2 份，PR #175 §7）与阶段三（2026-08-15，3 份，PR #176 §8）按追加结构续写；阶段一 / 阶段二正文见各 PR 版本。

## 0. 覆盖边界

- 已覆盖（本地 `.ai/pitfalls/`，共 9 份，全部 2026-08-13）：
  `ai-code-type-lies` / `ai-legacy-type-bugs-mypy` / `ai-legacy-hook-bug-eslint`（AI 代码缺陷三样本，本汇总主体）
  + `ai-records-git-info-exclude` / `cq-p1-001-code-reuse-precheck` / `e4-slice-d-browser-smoke-setup` / `explore-agent-line-estimate-drift` / `grep-head-pipefail-sigpipe` / `lint-rule-over-grep`（流程 / 工具坑 6 份，简要归入 §3）
- 未覆盖：无。
- 下一次 rollup 起点：2026-08-14 起，只统计 `汇总状态：未汇总` 的本地记录。
  （2026-08-14 阶段二追加后更新：08-14 两份已纳入 §7，下一次 rollup 起点改为 2026-08-15。）
  （2026-08-21 阶段四追加后更新：08-16 ~ 08-21 共 14 份已纳入 §9，下一次 rollup 起点改为 2026-08-22。）

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

---

## 8. 阶段三（2026-08-15 · 环境 / 模板缺口坑 3 份）

### 0. 覆盖边界（阶段三）

- 已覆盖（本地 `.ai/pitfalls/`，共 3 份，1 份 2026-08-14 + 2 份 2026-08-15）：`ps51-utf8-no-bom-script` / `volta-package-image-corruption` / `docker-build-context-secrets`
- 未覆盖：无（本地 14 份全部纳入阶段一 §3/§5、阶段二 §7、本阶段 §8；另有 1 条坑候选未落盘——smoke 脚本 PG 模式 401，环境前提类，可并入既有记录，暂不新增文件）
- 下一次 rollup 起点：2026-08-16 起，只统计 `汇总状态：未汇总` 的本地记录

### 1. 记录归纳

| 记录 | 现象 | 根因 | 规避 / 修复 | 通用性 |
|---|---|---|---|---|
| `ps51-utf8-no-bom-script` | Write 默认写无 BOM UTF-8，含中文的 .ps1 在 PS 5.1 下按 ANSI 解析 → 乱码 + 语法解析失败 | 环境（PS 5.1 与无 BOM UTF-8 不兼容；PS 7+ 无此问题） | 交 PS 5.1 执行的脚本一律**纯 ASCII**，或显式写 UTF-8 with BOM | 高（任何 Windows 项目 + PS 5.1） |
| `volta-package-image-corruption` | `volta list` 显示 codex 正常，跑 `codex` 却报「不是内部或外部命令」——镜像目录缺 `package.json` + shim 三件套 | 环境（包镜像安装中断致文件不完整；`volta list` 只读注册信息不校验镜像，注册表「看似正常」≠ 镜像可用） | `volta uninstall` + 重装；诊断口径：**勿信 `volta list`，直接核对镜像目录文件** | 高（volta 管理的全局包跨平台同理） |
| `docker-build-context-secrets` | 仓库无 `.dockerignore`，`COPY . /app` 把 `.env`（LLM key）打进镜像层；研发文档全入镜像 | 模板缺口（容器化项目部署就绪检查清单缺「build context 卫生」项；demo 阶段不构建生产镜像故从未暴露） | 新建 `.dockerignore`（PR #176）；根治归模板回流提案 | 高（任何容器化项目 `COPY .` + 仓库根有 `.env`） |

### 2. 与前阶段的关联

阶段三两条环境坑延续阶段二「验证 / 诊断手段不覆盖缺陷维度」主线并各进一步：ps51-no-bom 是「编码契约双方不一致」（工具写端与读端编码假设不同）；volta 镜像损坏是阶段二 volta PATH 坑的同域变体——阶段二在 **PATH 解析层**、本条在**镜像文件完整性层**，两坑合并强化了「工具链诊断先查实际文件 / 会话环境，勿只看注册信息」的证据（该提案候选继续攒样本）。`docker-build-context-secrets` 则超出环境坑范畴，根因指向**模板缺口**——demo 形态项目长期不构建生产镜像，「部署就绪」维度从未进入任何检查，是「验证手段不覆盖缺陷维度」在项目生命周期层的再现。

### 3. 模板回流判断（阶段三）

- **回流 1 项（已定选项 A，时机 = 部署实证后约 2026-09）**：`TEMPLATE-UPGRADE-env-separation-deploy-readiness.md`——「开发/测试/生产环境分离」规范与引导 + 部署就绪检查清单（含 build context 卫生项）+ deploy-guide 模板；证据 = 本阶段 docker-build-context-secrets + LUMEN 部署全路径（`docs/research/2026-08-15-deployment-readiness-laptop-plan.md` C-006）。
- **不回流**：ps51-no-bom 与 volta 镜像损坏——环境诊断经验，单条记录已含完整规避口径；与阶段二同策，若同类「注册信息 ≠ 实际可用」样本继续积累，合并起草工具链诊断提案。

---

## 9. 阶段四（2026-08-16 ~ 2026-08-21 · 命令编排 / 契约复用 / 环境运行时坑 14 份）

### 0. 覆盖边界（阶段四）

- 已覆盖（本地 `.ai/pitfalls/`，共 14 份，2026-08-16 ~ 2026-08-21）：`merge-blocked-ci-red` / `ps51-hashtable-comma` / `reuse-datasource-contract-mismatch` / `bash-node-backtick-escape` / `fep03-validation-command-orchestration` / `stale-vite-port-conflict` / `tc-row-anchor-pitfall` / `cdp-eval-result-unwrapping` / `codex-cli-fep04-command-orchestration` / `codex-cli-fep04-generated-fixture-contract` / `fep05-space-switch-smoke-readiness` / `fep05-browser-controller-node-version` / `fep05-stale-closure-scope-admission` / `git-push-proxy-tls-reset`
- 未覆盖：无（本地 28 份全部纳入阶段一~四）。
- 下一次 rollup 起点：2026-08-22 起，只统计 `汇总状态：未汇总` 的本地记录。

### 1. 记录归纳（简表）

| 记录 | 现象 | 根因 | 规避 / 修复 | 通用性 |
|---|---|---|---|---|
| `merge-blocked-ci-red` | PR project-check 真实失败未修，`gh pr merge` 直接放行 → main CI 红 | 流程坑：无分支保护（checks 非 required），merge 只信 mergeable | 每个 merge 前逐项核对 checks 全绿，批量按序 merge 更要逐个看 | 高（无分支保护 + 批量收 PR） |
| `ps51-hashtable-comma` | `@{f=...; l=89}` 报 Missing expression——PS 5.1 无 `??`、哈希内联混合写法易踩 | 环境（PS 5.1 语法限制） | 元组数组 + 索引访问；避免 `??` 用 `if ($null -eq $x)` | 高（本机默认 shell PS 5.1） |
| `reuse-datasource-contract-mismatch` | 复用 DocumentPreviewPane 后本地预览空白——新容器读 content_md（仅编辑态有值），阅读态恒空 | AI 引入：复用组件未对齐两侧数据源契约 | 复用前列两侧数据源契约差异（字段 + 何时有值）再替换容器 | 高（任何「替换为共享组件」重构） |
| `bash-node-backtick-escape` | Bash 内嵌 node -e 正则反引号被 shell 当命令替换吃掉 → 匹配 0 | 环境 | 反引号字面量用 `\x60` | 高（Bash 内嵌 node/python 内联脚本） |
| `fep03-validation-command-orchestration` | rg 零匹配 / Promise.all 失败域混淆 + Start-Process Path/PATH 双键 ArgumentException + 常驻服务被超时终止误判启动失败 | 流程坑 + 环境 | 预检独立 not-found 语义；不聚合失败域；cmd.exe /c 保留日志 + readiness + PID 回收；外层去重 Path/PATH | 高 |
| `stale-vite-port-conflict` | run-smoke 端口冲突——上一会话遗留 vite 进程没停，日志句柄纠缠误导 | 环境 | smoke 前 netstat 确认端口；遗留 LISTEN 先 Stop-Process | 高 |
| `tc-row-anchor-pitfall` | 裸 TC-ID 做 rfind 锚点，同一 ID 多处出现插错表，返工 2 轮 | AI 引入 | 锚点带行前缀 / 节标题上下文；先 grep -n 确认行号 | 高（大表格文档回写） |
| `cdp-eval-result-unwrapping` | CDP Runtime.evaluate 信封两层 result 只解一层恒 undefined → 断言全 FAIL | AI 引入（验证脚本） | 封装后先用已知表达式冒烟验证解包；eval 错误与轮询未就绪分开 | 高（任何 CDP / WebSocket 两级信封） |
| `codex-cli-fep04-command-orchestration` | npm cache EPERM + rg 失败域 + 文档补丁锚点错 + `git branch` 位置参数误建分支 | 流程坑 + 环境 | 依赖安装权限预检；rg 独立 not-found；行号定位补丁；`git branch --list` 查询 | 高 |
| `codex-cli-fep04-generated-fixture-contract` | 测试夹具漏生成类型字段，npm test 过但 build tsc 失败 | AI 引入 | 夹具从完整类型定义构造；test + build 都要跑 | 高（测试生成类型对象） |
| `fep05-space-switch-smoke-readiness` | 受控下拉框「节点存在 ≠ 数据就绪」，读到无效 0 → 403 | 脚本（AI 引入） | 就绪条件 = 可用 options + value 命中；空值显式处理 | 高（受控选择器 browser smoke） |
| `fep05-browser-controller-node-version` | 控制器要求 Node≥22.22 但解析 22.17.1，反复 setx / 重启无果 | 环境（长驻进程环境固化 + 运行时混淆） | 分「项目锁定运行时」vs「控制器运行时」两事实；以控制器 import playwright 为唯一门禁 | 中高（浏览器驱动类验证） |
| `fep05-stale-closure-scope-admission` | 归属保护只有提交时 owns()，缺发起前准入 + 树分支 key 隔离，验证全绿仍有旧数据回跳 | AI 引入（正确性根因，用户确认 + 代码佐证） | 显式拆三检查点：发起前 scope admission / 同 scope generation / key 并发隔离；审阅对照全量入口 | 高（异步归属 / 竞态设计） |
| `git-push-proxy-tls-reset` | git push 连断（curl 56/35），读全通写全断——本地代理 7897 掐 push POST | 环境 | 绕代理直连 push（`HTTPS_PROXY= HTTP_PROXY= git -c http.proxy= -c https.proxy= push`）；可选按主机持久绕过 | 高（Clash 类代理 + git push） |

### 2. 重复模式归纳

- **模式 A：绕圈圈找不到根因（6 份）**：`fep05-stale-closure-scope-admission` / `fep05-space-switch-smoke-readiness` / `fep05-browser-controller-node-version` 显式标记「绕圈圈」；`cdp-eval-result-unwrapping`（`.catch` 吞 eval 错误）、`fep03-validation-command-orchestration`（伪失败反复中断）、`git-push-proxy-tls-reset`（误导性「Everything up-to-date」）同型。机理：**在错误层次打转**（DOM 存在 vs 数据就绪 / 仓库 node vs 控制器 node / 外层 result 信封），用错误探针反复自证失败。预防：先问「哪两个独立事实被混淆」，再选与该事实匹配的探针；失败先定位责任侧（页面事实 vs 脚本解包 vs 环境运行时）再决定重试。
- **模式 B：失败域混淆 / 聚合掩盖（4 份）**：`merge-blocked-ci-red`（只信 mergeable）、`fep03-validation-command-orchestration`（Promise.all）、`codex-cli-fep04-command-orchestration`（rg 零匹配）、`cdp-eval-result-unwrapping`（catch 吞错）。「预期未找到 / pending」与「真实 fail」同一失败域。预防：每类检查独立输出、not-found/pending 与 fail 分开；用与缺陷维度匹配的机器探针。
- **模式 C：宿主 / 工具链运行时坑（7 份）**：`ps51-hashtable-comma` / `bash-node-backtick-escape` / `stale-vite-port-conflict` / `fep03` Path/PATH / `fep05-browser-controller-node-version` / `git-push-proxy-tls-reset` / `codex` npm EPERM。延续阶段二/三「工具链诊断先查实际文件 / 会话环境，勿只看注册信息」主线；新增「宿主长驻进程环境固化」「代理写路径」两个维度。跨会话记忆已落地 `lumen-browser-controller-node-runtime.md`。
- **模式 D：AI 引入的契约 / 复用失配（4 份）**：`reuse-datasource-contract-mismatch` / `codex-cli-fep04-generated-fixture-contract` / `fep05-stale-closure-scope-admission` / `tc-row-anchor-pitfall`。延续阶段一「类型 / 契约障眼法」——按直觉而非按契约 / 唯一性。预防：复用前列数据源契约、夹具源自完整类型定义、锚点带位置上下文、shared 工具契约显式化。

### 3. 模板回流判断（阶段四）

- **回流候选 1（模式 A，证据已足）**：「AI 验证失败先分域定位责任侧，勿在错误探针上绕圈」方法论条目——6 份样本（阶段四）+ `fep03-validation-command-orchestration`；待 triage 后起草 `_proposals/TEMPLATE-UPGRADE-*.md`。
- **回流候选 2（工具链诊断合并，续攒）**：阶段二 volta PATH + 阶段三 volta 镜像 + 阶段四 Node 控制器运行时 / 代理写路径——合并「运行时 / 网络诊断先查实际会话环境与真实探针，勿看注册 / 入口信息」提案，待再攒 1-2 份同类样本。
- **不回流**：PS 5.1 / bash 反引号 / 端口冲突等环境细节（单条记录已含完整规避口径）；契约失配类归 codegen / 类型门既有方向（阶段一已定性），不重复回流。
- **阶段四记录均「待审视」未转提案**：`merge-blocked-ci-red` 的 merge checklist 强化（并入 remote-ci-sop-profile 提案池）、`reuse-datasource-contract-mismatch` 的复用前置检查（并入既有「复用前置检查」类）、`fep05-stale-closure-scope-admission` 的异步归属三检查点（跨会话记忆候选）。
