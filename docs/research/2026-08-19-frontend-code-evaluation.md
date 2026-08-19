# 前端代码评估报告（2026-08-19，复核版）

> **定位**：`docs/research/` 评估报告，非权威规格。评估基准 = `ai/project-rules.md` §5 编码约定与禁区 + `ai/global-rules.md` §2.1 L0 通用代码原则基线 + `docs/05-tech-spec.md` §4 代码层一致性基线。
> **性质声明**：本文是 **AI 评审结论，待人工确认采纳范围**；问题项多为「登记为债、不强制当前维护态回改」口径（同 `docs/05-tech-spec.md` §4.2 处理方式），修复建议均未执行。
> **评估方法**：初评为静态走读（170 文件：TS/TSX 约 19.4k 行含生成物、CSS 约 5k 行）+ 实跑四道本地质量门（ESLint / tsc / build / file-size 棘轮 + css token 检查）。复核补充静态检查了请求取消能力、刷新竞态、动态状态播报、tab 语义与弹层焦点；复核未重复运行会生成构建产物的命令。
> **修订记录**（2026-08-19 二次评审采纳）：新增 P8（`request()` 非 JSON 错误体回退缺口）并在 §0 / §1.6 同步措辞；R5 计数修正 5→7；P5 行号校正 64-75→64-76。修复建议仍均未执行。
> **触发**：用户要求「评估 lumen 的前端代码」；上一轮目录级评审见 `2026-08-18-code-directory-review.md`（本文为其前端深化，聚焦代码质量而非目录结构）。

## 0. 总览

| 维度 | 判级 | 一句话结论 |
|---|---|---|
| 质量门实测 | ✅ | ESLint 0/0 · tsc strict 0 错 · build 356 模块 1.38s · 棘轮 PASS · css PASS |
| HTTP 单出口（§5.2 禁区） | ✅ | 全仓仅 `client.ts` 两处 fetch，18 域模块全经 request/downloadBlob |
| 类型纪律 | ✅ | 显式 any 0 处；`as unknown as` 仅 6 处且有注释（浏览器新 API 探测） |
| CSS 纪律（2026-08-16 成文） | ✅ | 零字面色值 · `!important` 0 处 · 四主题纯变量切换 · FOUC 预置 |
| 文件膨胀 | ✅ | 170 文件全 ≤300；超限基线仅 2 个（useAppState 339 / useDocuments 286） |
| 分层与特性纵切 | ✅ | api → app → features → components 边界清晰；App.tsx 纯装配 89 行 |
| 契约单源 | ✅ | openapi codegen + drift CI 门；手写仅 narrow 并注释理由 |
| 失败可见 / 降级 | ✅ | ApiError 保业务码；vault 降级三处全 console.warn + 兜底 UI（缺口 P8：`request()` 非 JSON 错误体无回退，见 §2） |
| 可访问性 | ⚠️ | 组件级 aria 标注较多，但状态栏缺 live region、登录/注册 tabs 语义不完整，弹层焦点管理未统一 |
| 安全 | ✅ | 无 dangerouslySetInnerHTML / eval / cookie 裸读 |
| 测试深度 | ⚠️ | 前端零单元测试，回归全靠端到端 smoke（P1） |
| 运行时容错 | ⚠️ | 无 ErrorBoundary；刷新链无响应归属保护，快速切空间时存在旧响应覆盖新状态的风险 |

**总评**：纪律执行度明显高于典型 demo——机器门禁（lint / tsc / 棘轮 / css / codegen drift 五道）+ 人工规范双轨真实在跑，注释追溯链（REQ / TC / Slice ID）完整。主要缺口是测试深度、动态交互的无障碍语义，以及会话/空间切换时的响应归属保护；其余多数属于 Demo 到 MVP 的演进决策。

## 1. 合规项（对照 project-rules §5.1 与 L0 基线）

### 1.1 HTTP 单出口（禁区项，零违反）

- 全仓 `fetch` 仅 `src/api/client.ts:55,73` 两处（request / downloadBlob 本体）；18 个域模块（auth / documents / search / terms / tags / vaultMounts 等）全部经 `request()`，barrel `src/api.ts` 统一 re-export，调用方 `import { ... } from '../api'` 零改动。
- `ApiError`（client.ts:30）保留后端业务码 `code` + HTTP `status`，下游用 `error.code` 判定而非文案正则（CQ-P1-005 Slice C 的客户端镜像），登录失效识别 `isAuthTokenError`（session-store.ts:59）建立其上。

### 1.2 类型纪律

- **显式 `any` 0 处**：grep 全仓唯一命中 `anyMounting` 是变量名误报；eslint `no-explicit-any: warn` 下 0 warning，历史「存量 1 个 any 债」已在 codegen Slice B 清偿（eslint.config.js 注释可证）。
- **`as unknown as` 仅 6 处**，全部是浏览器新 API feature detection（`FileSystemObserver` / `showDirectoryPicker` / `FileSystemDirectoryHandle.values()` / `FileHandle.move()`——尚未进 lib.dom），每处均有「TS 最小接口声明」注释（useVaultAutoRescan.ts:21-30 是典型样本），非类型逃避。
- **跨层 props 零手写重复接口**：`WorkspaceShell.tsx:31-66` 全部 `ReturnType<typeof useXxx>` 推导，符合 §5.1「类型纪律」条。
- openapi 契约生成（generated.ts 4868 行）为类型主源；手写仅做窄化（narrow）且注释运行时哨兵理由（auth.ts:13-19 LoginResponse 的 `current_space_id` / `role`；documents.ts:15-27 列表 / 详情 union + `isDocumentDetail` 判别）——「生成为主、手写收窄」模式执行到位。

### 1.3 CSS 纪律

- 实跑 `check-frontend-css.mjs` PASS：styles/ 除 tokens.css 外零字面色值，字阶 / 字重 / 圆角全走 token；`!important` 全仓 0 处。
- 四主题（light / dark / paper / legacy）纯 `[data-theme]` 变量切换，组件文件无主题分支选择器；`index.html` 预置脚本 + `theme.ts` 双端幂等（防 FOUC），三处契约（tokens.css / theme.ts / index.html）注释互指。
- 单 CSS 文件最大 topbar.css 292 行，全部 < 300 阈值。

### 1.4 文件膨胀与棘轮

- 170 文件（TS/TSX 140 + CSS 30）：手写文件全部 ≤300 行；最大两个在棘轮基线锁定（`useAppState.ts` 339 / `useDocuments.ts` 286，`.file-size-baseline.json`），`check-frontend-file-size.mjs` 拦「新增超限 + 基线膨胀」，generated.ts 显式豁免（机器产物）。
- App.tsx 纯装配 89 行；CQ-P1-008 E4 五轮拆分（Slice D/E 组件化 + useAppShellState/useAppState 分刀）后职责注释完整保留。

### 1.5 分层与特性纵切

- `api/`（契约+域模块）→ `app/`（27 hooks + 布局 + store）→ `features/`（12 域）→ `components/`（MarkdownBlock / StatusBar）边界清晰；R3 搬家（PR #215，v3.13.3）后 local-vault 六模块归位 `features/local-mount`，跨层 import 方向正确（features 引 app 类型经 `import type`，app 编排 features）。
- 域 hook 依赖注入模式统一：`{token, runAction, setNotice, onXxx 回调}` 签名一致（useDocuments / useFolders / useTags / useTimeline 等），写路径全走 runAction 统一 busy / notice / error / 登录失效。

### 1.6 失败可见与降级（L0-4）

- 无 `catch: pass` 静默吞异常；14 处空 catch 均有注释理由（localStorage 隐私模式降级、标签列表失败不阻塞主流程等）。
- vault 域三处降级（自动重扫失败 / observe 失败 / observer 构造失败）全部 `console.warn` 记原因 + 「手动重扫」兜底按钮（useVaultAutoRescan.ts），符合「降级必须记录原因」。
- 边界缺口（登记为 §2 P8）：`request()`（client.ts:59）先 `await response.json()` 再判 `response.ok`，非 JSON 错误体（后端不可用 / 网关 HTML 错误页）会抛原生 `SyntaxError` 绕过 `ApiError`；同文件 `downloadBlob` 走 `buildApiError`（client.ts:86）已有非 JSON 回退，两者不对称。demo 触发概率低（本机后端、envelope 恒 JSON），登记为债。

### 1.7 可访问性（局部合规，非全绿）

- 152 个 aria 属性；pane 分隔条 `role="separator"` + `aria-orientation` + `aria-label` + tabIndex 键盘操作（WorkspaceShell.tsx:141-155）；命令面板提供初始焦点、方向键导航与 `role="dialog"`。
- 复核发现三项缺口：`StatusBar` 不用 `aria-live` / `role="status"` / `role="alert"` 播报异步结果；`AuthShell` 的 `tablist` 子项未使用 `role="tab"`、`aria-selected` 与受控面板关联；命令面板只在打开时聚焦输入框，未见关闭后焦点归还或焦点圈定。密码重置弹窗也未声明 `aria-modal` 或管理焦点。

### 1.8 安全

- 无 `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` / `document.cookie`。
- localStorage 读取全部 try-catch + 字段类型校验后再用（session-store.ts:10-27 loadStoredSession 五字段逐一校验）。

### 1.9 依赖与追溯

- 运行时依赖仅 3 个（react 18.2.0 / react-dom 18.2.0 / react-markdown ^10.1.0），版本 pin + Volta 锁 Node 22.17.1；构建产物 442KB JS（gzip 137KB），356 模块 1.38s。
- 每文件头部职责说明 + REQ / TC / Slice 追溯注释（useVaultAutoRescan.ts 边界 N1-N3 全列、useAppState.ts 函数提升顺序警示），远超 demo 平均水平。

## 2. 问题项

| # | 问题 | 证据 | 严重度 |
|---|---|---|---|
| P1 | **前端零单元测试**：`src` 下无任何 `.test.ts`；验证链 = build / lint / 浏览器 smoke（`scripts/smoke-*-browser.mjs` 14 个）。纯函数模块（`local-vault-index` 倒排索引、`folder-utils`、`markdown-toc`、`drafts`）完全可单测但无覆盖——回归只靠端到端 smoke，定位成本高 | `find src -name "*.test.*"` 为空；docs/05 无 vitest / jest 声明（后端 331 pytest 对照悬殊） | 中 |
| P2 | **动态状态未向辅助技术播报**：全仓未见 `aria-live` / `role="status"` / `role="alert"`；`StatusBar` 只是普通文本 | `StatusBar.tsx` | 中 |
| P3 | **登录/注册 tabs 与弹层焦点语义不完整**：`AuthShell` 的 `tablist` 缺 tab 语义；命令面板和密码重置弹窗未完整管理焦点生命周期 | `AuthShell.tsx` / `CommandPalette.tsx` / `PasswordResetModal.tsx` | 中 |
| P4 | **无 ErrorBoundary**：组件树渲染或生命周期异常会令主界面无恢复 UI | `main.tsx` 直接 render；全仓无 `componentDidCatch` / `getDerivedStateFromError` | 中 |
| P5 | **刷新结果无归属保护**：`refreshWorkspace()` 并行刷新五个域，调用链中没有 request generation、空间归属检查或 AbortController 使用；快速切空间时旧响应有覆盖新状态的风险 | `useAppState.ts:64-76`；全仓无 `AbortController` 使用 | 中（风险） |
| P6 | **10 处 `window.confirm` 原生对话框**（8 文件）：无法主题化、阻塞式，文案风格各自为政 | 实测 10 处：useDocuments / useFolders / useTags / useTerms / useTermCategories / useAdminUsers / useSpaceMembers / LocalMountTreeView | 低（demo 取舍） |
| P7 | **`RunAction` 类型在 16 个 app 模块逐字重复声明**——违反 L0-5 DRY，改签名时需多点同步 | `useDocuments.ts` 等 16 个 app 模块 | 低 |
| P8 | **`request()` 对非 JSON 错误体无回退**：先 `await response.json()` 再判 `response.ok`，后端不可用 / 网关返回 HTML 错误页时抛原生 `SyntaxError`（「Unexpected token…」类解析错误直达 UI），绕过 `ApiError` 业务码与固定用户文案，触碰 L0-7 对外信息最小化；同文件 `downloadBlob` 经 `buildApiError` 已有非 JSON 回退，`request()` 未对齐 | `client.ts:59`（对照 `buildApiError` client.ts:86-97） | 低 |

## 3. 风险项

| # | 风险 | 说明 |
|---|---|---|
| R1 | **Props 传递深度线性增长**：WorkspaceShell 35+ props、DocumentsFeature 30+ props、useAppState 返回 40+ 字段。当前靠类型推导 + 注释支撑尚可维护，但每新增一个域 hook，Shell / App 两层 props 同步膨胀。这是「不引状态库」路线的固有代价，登记即可，不构成现问题 | |
| R2 | **视图状态不进 URL**：手写 activeView state，刷新丢视图位置、浏览器后退无效。demo 已接受；转 MVP 需补路由 | |
| R3 | **token 存 localStorage**（XSS 可窃取）：demo 级已声明接受（session-store.ts:4 注释），且无 innerHTML 降低实际风险；转 MVP 须重评 | |
| R4 | **main.tsx 手动 import 29 个 CSS**：顺序敏感，但现有顺序是级联契约；聚合没有明确收益 | 不立项，继续维持 |
| R5 | **7 处 `eslint-disable react-hooks/exhaustive-deps`，分布 5 文件**（useAppState ×2 / DocumentsFeature ×2 / useDocuments / useDocumentSideData / LocalMountPane）：均有注释说明理由（多为「仅响应 token 变化」防对象引用抖动），是有意识权衡，但也是 stale closure 潜在温床——改动这些 effect 时需人工盯 | |

## 4. 修复建议（AI 建议，均未执行，待人工裁决）

按「当前影响 × 变更风险 × 项目维护态」处置：

| 建议 | 对应项 | 建议处置 | 说明 |
|---|---|---|---|
| **FE-A11Y-1 状态与 tabs 语义** | P2 / P3 | 建议当前修复 | 为 `StatusBar` 补 live region；把登录/注册改为完整 tab 语义。零依赖，直接改善键盘与读屏体验。 |
| **FE-A11Y-2 弹层焦点生命周期** | P3 | 建议当前立项 | 统一六类 dialog 的初始焦点、Tab 圈定、Esc 关闭（适用时）与关闭后焦点归还；不改变业务流程。 |
| **FE-RES-1 根 ErrorBoundary** | P4 | 建议当前修复 | 添加刷新/重试降级页，降低渲染期异常导致的整页不可用风险。它**不**捕获事件处理、异步请求或根初始化错误，不能宣称「消除白屏」。 |
| **FE-TEST-1 纯函数测试** | P1 | 待确认后立项 | 先以 15-25 个风险驱动用例覆盖 `local-vault-index` / `folder-utils` / `markdown-toc` / `drafts`。需确认新增 `vitest`、测试脚本与 CI step；它是维护性建设，不是现有验收缺陷修复。 |
| **FE-RACE-1 刷新响应归属** | P5 | 下次触及刷新链时处理 | `client.ts` 已经因 `RequestOptions extends RequestInit` + `...options` 而支持 `signal`；不改 client。先给刷新链加代次/归属保护，再按高频调用点接入 AbortController。 |
| **FE-MAINT-1 `RunAction` 类型收敛** | P7 | 随下一轮 hooks 改动合并 | 建议定义 `app/action-types.ts`，避免 `run-action.ts` 暗示存在运行时实现；16 文件纯类型改动不值得单独制造噪声。 |
| **FE-ERR-1 `request()` 非 JSON 回退** | P8 | 随下次触及 `client.ts` 的改动合并 | 为 `response.json()` 解析失败路径补非 JSON 回退（对齐 `buildApiError` 口径：code=0 + HTTP 状态描述文案）；几行改动，不单独立项。 |
| **Demo→MVP 债** | P6 / R1 / R2 / R3 / R5 | 分项登记 | confirm、路由、token 存储、props 膨胀、effect 豁免的触发条件不同，不能笼统称为「纯化妆」。 |

## 5. 与既有评审的关系

- 本文是 `2026-08-18-code-directory-review.md` §2（frontend 逐区评审）的**代码级深化**：目录评审回答「文件放得对不对」，本文回答「代码写得好不好」；目录评审的 R1-R4 已全处置（R4 维持不动），本文 FE-A11Y-1/2、FE-RES-1、FE-TEST-1、FE-RACE-1 与 FE-MAINT-1 是新一轮独立候选。
- 上游规范：`ai/project-rules.md` §5.1（CSS 纪律 / 类型纪律 / 验证纪律）、`ai/global-rules.md` §2.1 L0、`docs/05-tech-spec.md` §4.2 一致性基线。
- 更早的前端专项评估：`2026-08-12-frontend-eslint-b1-assessment.md`（工具链引入前基线，已落地）；`2026-08-10-code-quality-maintainability-assessment.md`（前后端首轮，含前端章节）。
