# 前端修复候选实施计划（2026-08-19）

> **定位**：本文件把 `2026-08-19-frontend-code-evaluation.md` 的评估结论转为可审阅的候选工作包。它是 `docs/research/` 研究计划，**不是已批准的 `docs/08-dev-plan.md` Sprint，也不授权编码**。只有用户批准具体工作包后，才将范围、验收与状态回填到 `docs/08-dev-plan.md`、`docs/09-verification.md` 并建立任务单。
> **修订记录**（2026-08-19 二次评审采纳）：FEP-01 验收补验证手段与方向键范围界定；FEP-02 依赖措辞澄清；FEP-03 补错误留痕要求；FEP-05 补「修改范围」与 FEP-04 协同触发；§8 债表补 FE-ERR-1（P8）。
> **修订记录 2**（2026-08-19 外部 AI 评审反馈采纳）：FEP-01 补「双 panel 常驻 DOM + hidden 隐藏」实现口径与 `[hidden]` 样式覆盖坑——若只给 tab 挂 `aria-controls` 而表单仍条件渲染，未选中 tab 指向不存在的 panel，语义不完整。
> **修订记录 3**（2026-08-19 复评采纳）：FEP-01 补错误优先、避免通知重复播报及具体键盘规则；FEP-02 将带遮罩的用户空间抽屉按模态 dialog 验收；FEP-03 明确临时故障注入验证；FEP-05 扩展为全部 token/空间触发异步读的清单与分层保护策略。

## 1. 依据与边界

- 依据：`2026-08-19-frontend-code-evaluation.md`（复核版）、`ai/project-rules.md` §5、`docs/05-tech-spec.md` §4.2。
- 当前不改：需求、API 契约、后端、路由模型、认证存储模型、CSS 文件导入顺序。
- 当前不运行：构建、依赖安装或会写入工作区的命令；实施时按各工作包验证要求执行。
- 共同约束：不引入组件库；所有后端请求继续经 `frontend/src/api/client.ts`；新增依赖须单独确认。

## 2. 候选工作包

| ID | 工作包 | 状态 | 依赖 | 目标 |
|---|---|---|---|---|
| FEP-01 | 状态播报与登录 tabs 语义 | 编码 + 自动验证完成（Sprint-61 / Task-059）；读屏人工抽查延后 | 无 | 让异步成功/失败可被读屏软件播报，登录/注册切换满足 tab 模式语义 |
| FEP-02 | 弹层焦点生命周期 | 建议优先 | 无硬依赖；建议在 FEP-01 之后实施（同批 a11y 语义，降低评审负担） | 统一 dialog 的初始焦点、焦点圈定、关闭与焦点归还 |
| FEP-03 | 根 ErrorBoundary | 建议优先 | 无 | 为渲染期异常提供可恢复降级页 |
| FEP-04 | 纯函数测试基础设施 | 待确认 | 新增 Vitest devDependency | 为高价值纯函数建立可重复的回归保护 |
| FEP-05 | 刷新响应归属保护 | 条件立项 | 先复现或触及刷新链 | 防止旧空间/会话请求结果覆盖当前状态 |
| FEP-06 | `RunAction` 类型收敛 | 延后 | 与下一轮 hooks 改动合并 | 消除 16 处重复类型声明，不单独制造大范围重构 |

## 3. FEP-01：状态播报与登录 tabs 语义

### 修改范围

- `frontend/src/components/StatusBar.tsx`：为 notice 与 error 使用恰当的 live region；错误与普通状态采用不同播报强度。**错误优先口径：**同一操作同时更新 error 和 notice 时，仅播报 error（assertive）；notice 保持视觉可见但不进入 live region，避免读屏连续播报通用失败提示和具体错误。
- `frontend/src/features/auth/AuthShell.tsx`：把登录/注册按钮补全为 `role="tab"`、`aria-selected`、`aria-controls`，为对应表单提供关联 panel 标识。**实现口径：两个表单均常驻 DOM（`role="tabpanel"`），未选中者以 `hidden` 属性隐藏**——现实现为条件渲染（`authMode` 三目，AuthShell.tsx:33-78），任一时刻仅一个表单在 DOM；只给 tab 挂 `aria-controls` 会令未选中 tab 指向不存在的 panel（broken reference）。表单输入均为 `useSession` 受控状态，panel 常驻不卸载无副作用。
- **配套 CSS**（`frontend/src/styles/workspace-layout.css` 或 auth 相关文件）：须补高特异性规则（如 `.login-panel form[hidden] { display: none }`）——现有 `.login-panel form { display: grid }`（workspace-layout.css:21）会覆盖 UA 对 `[hidden]` 的默认 `display: none`，不加此规则两个表单会同时显示；且项目 CSS 纪律禁 `!important`，不得用 `hidden { display: none !important }` 绕过。

### 验收标准

- 登录、注册、保存、失败等状态变化在不移动焦点的情况下可被辅助技术播报。**验证手段**：① smoke / DOM 断言确认 `StatusBar` 挂 `role="status"`（错误用 `role="alert"`）且内容随状态更新；error 存在时 notice 不参与 live region；② 用读屏软件（NVDA 或 Windows 讲述人）人工抽查一次登录成功 / 失败的播报行为，失败只播报具体错误一次。
- 键盘焦点位于登录/注册 tab 时，语义与当前选中状态一致；表单与 tab 的关联可由 DOM 属性确认（`role="tab"` / `aria-selected` / `aria-controls` 与面板 `role="tabpanel"` 对应）。**两个 tabpanel 常驻 DOM、未选中者处于 `hidden` 状态**可由 DOM 断言确认；未选中 panel 内无可聚焦元素（Tab 序不含隐藏表单）。
- **方向键范围界定**：按 WAI-ARIA APG tabs 模式实现 roving tabindex；`ArrowLeft` / `ArrowRight` 循环切换并激活 tab，`Home` / `End` 跳至首个 / 最后一个 tab，切换后焦点停在新激活 tab。若实施中发现登录页键盘结构不适配，缩小范围须回到本计划修订，不得静默砍半。
- `npm run lint`、`npm run build`、`npm run check:css` 通过；浏览器 smoke 覆盖登录/注册切换。

### 禁止事项

- 不改变登录、注册、密码重置 API 或文案业务含义。
- 不引入第三方无障碍组件库。

## 4. FEP-02：弹层焦点生命周期

### 修改范围

- 新增最小本地焦点管理 hook 或工具，复用于 `CommandPalette`、`PasswordResetModal`、`ImportFeature`、`QuickEntryFeature`、`OnboardingGuide`、`UserSpacesDrawer`。
- 逐个判定六个对象的模态性并补齐相应语义、可访问名称和关闭行为。当前 `CommandPalette`、`PasswordResetModal`、`ImportFeature`、`QuickEntryFeature`、`OnboardingGuide`、`UserSpacesDrawer` 均有遮罩或阻断背景交互；其中 `UserSpacesDrawer` 虽为抽屉，但有遮罩和遮罩点击关闭，按模态 dialog 补 `aria-modal`、焦点圈定与焦点归还，不得仅因外形是抽屉而降为非模态。

### 验收标准

- 打开弹层后，焦点进入其第一个可操作元素；Tab/Shift+Tab 不会落到遮罩后的页面。
- 关闭后，焦点回到打开该弹层的触发元素；Esc 行为与现有关闭约束一致。
- 使用键盘完成命令面板、密码重置、导入、快速录入各一次打开/关闭；现有浏览器 smoke 不回归。
- 焦点圈定与归还行为应有可重复的验证证据（键盘操作录屏或 smoke 中的焦点断言），不依赖「试了一下感觉没问题」。

### 风险

- 六类弹层当前实现不一致，不能假设一段全局逻辑可无差别套用；逐个验证关闭按钮、遮罩点击和 busy 状态。

## 5. FEP-03：根 ErrorBoundary

### 修改范围

- 新增根级 ErrorBoundary 组件，在 `main.tsx` 中包裹 `App`。
- 提供简洁的恢复 UI（刷新或重新加载）；错误信息不得暴露内部堆栈。
- **错误留痕**：`componentDidCatch` / `getDerivedStateFromError` 配套 `console.error` 记录错误与组件栈（对齐 L0-4「降级必须记录原因」与 project-rules §5.1 日志口径）——只给降级 UI 不记日志会把渲染异常变成静默失败。

### 验收标准

- 正常登录和工作区渲染不受影响。
- 受控渲染异常能够展示恢复 UI，且控制台可查到对应错误记录；验证时允许在本地临时向受边界包裹的子组件注入 `throw`，完成 UI 与 `console.error` 核验后立即回退该临时改动，不得把故障开关提交到产品代码。FEP-04 落地后应补同一场景的自动化测试。事件回调与异步请求错误仍由既有 `runAction` / 状态栏机制处理。
- lint、build 与既有浏览器 smoke 通过。

### 禁止事项

- 不把 ErrorBoundary 描述为异步错误或根初始化错误的通用捕获器。
- 不引入运行时依赖。

## 6. FEP-04：纯函数测试基础设施

### 决策门

实施前必须单独确认：新增 `vitest` devDependency、`test` 脚本，以及 CI 是否新增测试 step。

### 修改范围（获批后）

- `frontend/package.json` 与 lockfile：新增测试依赖和脚本。
- `local-vault-index`、`folder-utils`、`markdown-toc`、`drafts` 各自的测试文件。
- CI：只在本地测试命令稳定后再增加测试 step。

### 验收标准

- 先覆盖 15-25 个高风险分支：中文/英文分词、搜索排序与上限、目录防环、重复标题锚点、草稿规范化与 `folder_id` 透传。
- 测试可重复运行，且不依赖浏览器目录授权、真实后端或测试数据残留。

## 7. FEP-05：刷新响应归属保护

### 触发条件

- 复现快速切空间/换账号导致旧结果覆盖当前视图；或下一项工作已触及 `useAppState.refreshWorkspace()` 与各域 reload 链。
- **与 FEP-04 的协同触发**：若 FEP-04 获批，可用 Vitest 对 reload 链写时序单测（模拟旧响应晚到）代替人工复现——浏览器时序竞态靠人手复现不稳定，不应作为唯一门槛。

### 修改范围（触及时展开）

- 先枚举全部由 token、currentSpaceId、selectedDocumentId 或显式刷新触发的异步读及其 state 提交点；不能只收口在 `useAppState.refreshWorkspace()` 的五条 reload 链。当前已核验：`useSession.reloadSpaces`、`useDocuments.reloadDocuments`、`useFolders.reloadLoadedFolders`、`useTerms.reloadTerms`、`useTermCategories.reloadRoot`、`useTags` 的空间标签 / 文档标签读取、`useSpaceMembers` 的成员读取、`useLocalVaultMount` 的本地挂载读取；`useAiAssistant` 的 token-only 配置读取已检查，因不随空间变化暂不纳入空间竞态改造。
- 保护策略按调用类型选取，不强制套用同一种机制：effect 自发读取优先对齐既有 cleanup + `cancelled` 模式（`useSpaceMembers`、`useLocalVaultMount`）；显式并发刷新及可能重叠的手动读取使用 request generation 或提交前的 token/空间归属校验。`setDocuments` / `setFolders` 等 state 提交发生在各域 hook 内部，保护必须落在实际提交点。

### 技术方向

- 先设计 request generation 或会话/空间归属保护，确保旧结果不能提交 state。
- `frontend/src/api/client.ts` 已透传 `RequestInit.signal`，不修改 client；仅在高频、可取消调用点接入 `AbortController`，并正确忽略取消结果。

### 验收标准

- 快速连续切换空间时，文档、文件夹、术语、标签、成员等最终页面数据只来自最后一次选择的空间；已登记为低风险的 token-only 读取保持原行为并在验收记录中注明。
- 取消请求不显示错误状态、不影响后续刷新；既有登录失效处理保留。

## 8. 延后债与升阶段触发

| 项 | 当前处置 | 重新评估触发 |
|---|---|---|
| 原生 confirm | Demo 保留 | 统一弹层基础设施稳定，且需要主题一致/非阻塞确认时 |
| URL 路由 | Demo 保留 | 需要刷新保留视图、浏览器前进后退、可分享深链接时 |
| localStorage token | Demo 风险接受 | 进入 MVP、引入 XSS 威胁模型或服务端会话策略调整时 |
| props 编排膨胀 | 观察 | 新域加入已使 App/WorkspaceShell 修改出现实际查找或回归摩擦时 |
| effect dependency 豁免 | 观察 | 修改对应 effect，或出现 stale closure 证据时 |
| CSS import 聚合 | 不立项 | 仅在出现实际漏导入或顺序维护问题时 |
| `request()` 非 JSON 错误体回退（FE-ERR-1，P8） | 随下次触及 `client.ts` 的改动合并 | 后端不可用 / 网关错误页场景实际出现解析错误直达 UI 时提前 |

## 9. 推进规则

1. 用户选择一个或多个 FEP 工作包。
2. 对于获批工作包，回填 `docs/08-dev-plan.md` 的任务范围和 `docs/09-verification.md` 的验收证据，并建立独立任务单。
3. 一次只实施一个工作包；新增依赖、CI、版本变更和提交按项目规则另行确认。
4. 未获批的工作包继续保持候选状态，不得作为项目已确认需求或实现结论。
