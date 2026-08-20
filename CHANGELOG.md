# CHANGELOG

本文件自 2026-07-18 起记录 LUMEN-DEMO 项目自身版本；历史上随模板同步带入的记录保留在下方，作为模板同步审计材料，不再作为项目版本语义。

- 项目版本入口：`VERSION`
- 模板继承版本入口：`TEMPLATE-BASE.md`
- 模板同步运行记录：`sync-records/template-sync/`

## v3.14.1（2026-08-20）

**Sprint-63 / Task-062 / Task-063（FEP-04）：前端纯函数测试基础——为既有本地 Vault、文件夹移动、Markdown TOC 与草稿逻辑建立 Vitest 回归保护。质量保障 PATCH，无新用户可见能力 / 无 API / 无后端运行时行为变化。**（依据：`docs/research/2026-08-19-frontend-remediation-plan.md` §6）

- **新增 Vitest 单测入口**：`npm test` 在 Node 环境执行，不依赖浏览器目录授权、真实后端、localStorage 或遗留测试数据。
- **19 个风险驱动用例**：覆盖 `local-vault-index` 的 token / 搜索边界、`folder-utils` 的移动环路保护、`markdown-toc` 的标题锚点与层级、`drafts` 的提交前规范化。
- **CI 守护**：Frontend CI 新增 `Frontend unit tests` job，在 Node 22.17.1 下执行 `npm ci` 与 `npm test`。
- **验证**：Vitest 4 files / 19 tests PASS；lint、build（360 modules / 446.05 kB）、`check:css`、`check:file-size` 全绿。Vitest 输出 `@vitejs/plugin-react` 的 esbuild 弃用兼容性警告，非阻断。
- **文档回写**：08 Sprint-63 + FEP-04、09 §5.4 TC-P2-GOV-027、Task-062 / Task-063 已完成。

## v3.14.0（2026-08-20）

**Sprint-62 / Task-061（FEP-03）：根 ErrorBoundary——子树渲染 / 生命周期异常的页面级恢复 UI + 控制台留痕。稳健性交付，无新业务能力 / 无 API / 无依赖变化，bump MINOR（Sprint 验收交付）。**（依据：`docs/research/2026-08-19-frontend-code-evaluation.md` FE-C2；`docs/research/2026-08-19-frontend-remediation-plan.md` §5 FEP-03）

- **新增 `components/ErrorBoundary.tsx`**：无依赖 React 类组件，`getDerivedStateFromError` 进入恢复态，`componentDidCatch` 以 `console.error` 记录原始错误与 component stack（不渲染到 UI）；恢复 UI `role="alert"` + `aria-live="assertive"`，含「重新加载」按钮（`window.location.reload()`）。
- **`main.tsx` 根入口接入**：在 `React.StrictMode` 内以 ErrorBoundary 包裹 `App`；新增 `styles/error-boundary.css`（全令牌化，复用 tokens.css，多主题经同一变量机制生效）。
- **边界**：只覆盖子树渲染 / 生命周期异常；不覆盖事件处理、异步回调或 React 根节点初始化异常（不夸大防护范围）。
- **验证（2026-08-20）**：受控异常浏览器验证（CDP 真实 Chrome，URL 参数门控临时 throw，验证后已还原）9/9 断言 PASS——恢复 UI 渲染 / 无堆栈泄露 / alert 语义 / console 留痕 / reload 真实导航 / 正常路径登录页渲染；既有认证 smoke PASS；lint / build（446.05 kB）/ `check:css` / `check:file-size` 全绿。详见 09 §5.3 TC-P2-GOV-026。
- **文档回写**：08 Sprint-62（批37）+ Backlog FEP-03 已完成 + 09 §5.3 + `tasks/task-061` 完成记录。

## v3.13.5（2026-08-19）

**Sprint-61 / Task-060（FEP-02）：弹层焦点生命周期——六对象模态键盘圈定 + 焦点归还 + aria-modal。P2/P3 登记缺陷修复，无新能力 / 无 API / 无依赖变化，bump PATCH。**（依据：`docs/research/2026-08-19-frontend-code-evaluation.md` FE-A11Y-2；`docs/research/2026-08-19-frontend-remediation-plan.md` FEP-02）

- **新增 `shared/useModalFocus`**：无依赖焦点生命周期 hook——打开后 `requestAnimationFrame` 聚焦初始元素，Tab / Shift+Tab 在首尾可聚焦元素间循环圈定不逸出，关闭后归还焦点到触发元素；`hidden` / 不可见元素过滤。
- **接入六对象**：`CommandPalette`、`PasswordResetModal`、`ImportFeature`、`QuickEntryFeature`、`OnboardingGuide`、`UserSpacesDrawer`；`PasswordResetModal` / `UserSpacesDrawer` 补 `aria-modal="true"`。
- **CommandPalette 补面板级 Esc**：`.cmdk-panel` 层 `Escape` 关闭（原仅输入框 `onKeyDown` 处理，Tab 移到命令条目后 Esc 无法关闭——补齐模态键盘语义，双路径关闭幂等）。
- **`QuickEntryFeature` 拆分 `features/quick-entry/QuickEntryResult.tsx`**：把「最近一次录入」结果区抽成独立组件，主文件回 250 行棘轮内（258 → 217 行，DOM / 行为零变化）。
- **验证**：lint / build（445.38 kB）/ `check:css` / `check:file-size` 全绿；`scripts/smoke-auth-browser.mjs` 扩展断言（六对象真实打开路径、初始焦点、Tab / Shift+Tab 圈定、关闭后焦点归还 + API 子集）**PASS**。
- **测试插曲（已修复，脚本侧为主）**：① 命令面板关闭断言暴露组件级 Esc 缺口 → 组件补面板级 Esc；② import 模态触发选择器 `.document-view-grid button.secondary` 实际命中空态「展开左目录」（导入按钮在兄弟工具栏）→ 改按按钮文本「导入」定位。均为 FEP-02 扩展 smoke 首次实跑发现，非回归。
- **文档回写**：08 Sprint-61（批36）+ 09 §5.2 TC-P2-GOV-025 + `tasks/task-060` 完成记录。

## v3.13.4（2026-08-19）

**Sprint-61 / Task-059（FEP-01）：前端无障碍语义——状态信息播报去重 + 登录/注册 tabs 完整语义。P2/P3 登记缺陷修复，无新能力 / 无 API / 无依赖变化，bump PATCH。**（依据：`docs/research/2026-08-19-frontend-code-evaluation.md` FE-A11Y-1 / FE-A11Y-2；`docs/research/2026-08-19-frontend-remediation-plan.md` FEP-01）

- **`StatusBar` 状态播报分离（FE-A11Y-1）**：普通 notice 挂 `role="status"` + `aria-live="polite"`（`aria-atomic`）——礼貌播报不打断；error 挂 `role="alert"`——立即播报；error 存在时 notice 的 `aria-live` 切 `off`，同一失败只播报具体错误一次，不再连读通用 notice。
- **`AuthShell` 登录 / 注册 tabs 完整语义（FE-A11Y-2）**：双 form 改为**常驻 DOM** 的 `role="tabpanel"`（`aria-labelledby` 关联 + 非选中 `hidden` 不进 Tab 序）；tablist 按钮补 `role="tab"` / `aria-selected` / `aria-controls` + roving tabindex（选中 0 / 未选 -1）；`ArrowLeft` / `ArrowRight` 循环切换并聚焦激活 tab、`Home` / `End` 跳首尾。`auth.css` 补 `.login-panel form[hidden]`（防 workspace 表单布局覆盖 UA 隐藏，未用 `!important`）。
- **验证**：lint / build（443.49 kB）/ `check:css` / `check:file-size` 全绿；`scripts/smoke-auth-browser.mjs` 扩展 DOM + 键盘断言（live-region 去重、tab/tabpanel 属性关联、双 panel 常驻 + `hidden`、四键切换 + 焦点停留）连跑 2 次 PASS。**读屏人工抽查（NVDA / 讲述人）用户裁决延后**，09 §5.2 如实标注待补，不宣称完全验收。
- **测试插曲（已修复，脚本侧）**：smoke 键盘断言初版同步连发合成事件读到期前状态，根因为 React setState 异步批处理——测试须逐键等渲染帧再采样；已注释说明，组件行为经独立 CDP 会话验证正确。
- **文档回写**：08 Sprint-61（批36）+ 09 §5.2 TC-P2-GOV-024（含断言清单与插曲）+ research 双文档索引行 + `tasks/task-059`。后续工作包 FEP-02（弹层焦点）待用户裁决后另行立项。

## v3.13.3（2026-08-19）

**R3：local-vault 六模块从 app/ 迁 features/local-mount/（目录归属修正）。纯移动零逻辑变化，bump PATCH。**（依据：`docs/research/2026-08-18-code-directory-review.md` §2.2 / §4 R3）

- **`git mv` 6 文件**：`local-vault-{fs,idb,index,tree,types,walk}.ts` 从 `frontend/src/app/` → `frontend/src/features/local-mount/`——REQ-018 同业务域，**并入既有 local-mount 域不新开目录**（"一个功能一个抽屉"）；搬后「改本地库功能只动一个目录」真正成立（原先要动 app/ + features/ 两处）。
- **12 个消费文件改 import 路径**（app 层 7 + context-pane 1 + features 层 3 + 冒烟脚本 `smoke-local-vault-index.mjs` 1），机械替换无逻辑变化。
- **时机依据**：职责表（05 §4.1.1）昨日刚立——立表当天保留 6 个已知违反项会折损表的可信度；且 build/lint 必然拦截漏改（机器门护航）。
- **评审报告状态回写**：R1/R2/R3 均完成，仅剩 R4（触发线定死 ≥60 或实际查找摩擦，当前 43）；08 Sprint-60（批35）+ 09 TC-P2-GOV-023。

## v3.13.2（2026-08-19）

**R2 Slice B：repository 101 方法 god object 按域拆 8 子 Protocol + 聚合父契约。纯内部结构重构，零 API/DB/运行时变化，22 消费方零迁移，bump PATCH。**（依据：`docs/research/2026-08-18-code-directory-review.md` §1.4 / §4 R2；2026-08-18 评审登记债，本轮收敛）

- **`backend/repository/protocol.py` 重排**：101 方法按**实际调用聚类**拆 8 个域子 Protocol——DocumentRepository（15）/ UserRepository（23）/ FolderRepository（12）/ TermRepository（17）/ TagRepository（8）/ SpaceRepository（8）/ OpsRepository（14）/ SearchRepository（4）；`RepositoryProtocol` 改聚合签名（8 子接口并集）。**拆分依据实测**：16/18 个 service 跨 2-5 域调用，纯拆会迫使 22 消费方改注入——聚合层保持对外零破坏；边界按主要消费方归组（如 `list_memberships`→Space）并注释可调。
- **契约测试 +2**（`test_repository_contract.py` 5→7）：域子 Protocol 方法面互不重叠且并集 == 父契约（防"拆了域但漏方法/重挂"）+ PgRepository 满足每个子接口（为 Slice C service 注解收窄铺路）。
- **pg_repository / demo_repository 零改动**：Python Protocol 结构化子类型，双实现不需显式继承。
- **评审报告状态回写**：R2 置已完成；R1（v3.13.0）/ R2 均闭环，R3/R4 仍为登记债；08 Sprint-59（批34）+ 09 TC-P2-GOV-022。
- **Slice C 留后续裁决**：service 函数注解从 `RepositoryProtocol` 收窄为实际使用的域子 Protocol（最小依赖面，需逐模块迁移）。

## v3.13.1（2026-08-19）

**文件治理第三步（FG-C4）：职责表模式回流模板提案——跨仓 issue #374。纯提案文档，无代码改动，bump PATCH。**

- **`_proposals/TEMPLATE-UPGRADE-file-responsibility-table.md` 起草并提交**：文件治理三层体系（L1 职责表 + L2 结构检查 + L3 阈值定位修正）去项目化回流 `ai-project-template` → issue [#374](https://github.com/emily8421/ai-project-template/issues/374)（OPEN，等维护者 triage）；与 #370（目录划分依据）同口径不同粒度——#370 管「放哪个目录」、#374 管「放哪个文件」。
- **INDEX 登记更新**：在途 3 份（#334 / #370 / #374）+ 边界去重节补「file-responsibility-table vs #370」粒度递进关系。
- 提交前校验（submit-proposal 流程）：去项目化扫描（LUMEN 仅出现于来源标识与实证引用）/ 无重复 issue / 标签 `proposal` + `from:LUMEN_demo_T2.1` 齐备 / gh auth ADMIN。

## v3.13.0（2026-08-19）

**文件治理三层体系第二步（FG-C2 + R1 扩容）：后端结构检查 + 后端 file-size ratchet + CI 接线。新增 CI 治理能力，bump MINOR。**（依据：`docs/research/2026-08-19-file-governance-mechanism-analysis.md` FG-C1~C4 全采纳；第一步 = v3.12.5）

- **`scripts/check-backend-structure.mjs` 新增（FG-C2）**：按内容拦分层违规、不看行数——R1 `service/` 不 import fastapi（豁免清单唯一登记 `auth_context.py`，附豁免失效自动检测）/ R2 `api/` 不 import sqlalchemy·`backend.model.orm`（读路径直连 repository 合法〔05 §4.2〕故只查 ORM import）/ R3 `repository/`·`model/` 不 import fastapi。负向探针 ×3 全拦截验证。
- **`scripts/check-backend-file-size.mjs` + `backend/.file-size-baseline.json` 新增（R1）**：后端行数棘轮（与前端版同构）——service/api/model 250 / main·config 300；repository·migrations 不设行数门（god object 拆分属 R2 债、迁移脚本一文件一主题）。基线登记 9 个既有超限文件（service×6，max export.py 576 + model×3），棘轮只进不退。补齐前后端治理不对称（2026-08-18 评审 R1）。
- **CI project-check +2 step**：`Check backend structure` + `Check backend file-size ratchet`（轻量 workflow，runner 自带 node 零依赖，随任何改动校验）。
- **文档回写**：05 §4.2 工程化护栏行 + 文件治理行（结构检查已落地）；08 Sprint-58（维护态批33）；09 TC-P2-GOV-021 验收行。
- 追溯：FG-C2 ← research 2026-08-19 §3.2；R1 ← `docs/research/2026-08-18-code-directory-review.md` §4；职责表 = 05 §4.1.1（v3.12.5）。

## v3.12.5（2026-08-19）

**文件治理机制升级第一步：05 §4.1 落「文件职责表」+ 阈值表措辞改「症状信号」。纯文档，无代码改动，bump PATCH。**（触发：用户对阈值机制根本性质疑——阈值怎么取的 / 为何治不了「AI 不知道往哪写」；分析报告 `docs/research/2026-08-19-file-governance-mechanism-analysis.md`，FG-C1~C4 全采纳）

- **`docs/05-tech-spec.md` §4.1.1 文件职责表新增**：10 类文件 ×（只准放 / 不准放 / 超出职责去哪）三列——写代码前先对表，表里没有的职责就不进这个文件；与 §4.1.0 五依据两级粒度互补（依据管「放哪个目录」、职责表管「放哪个文件、文件里放什么」）。
- **§4.1.2 阈值表措辞修正（FG-C3）**：行数定性为「职责混居的间接代理指标 / 症状信号」，250/300 标注「约定值而非推导值」（来源 = 模板整数惯例；行业参照系差异大），处置入口改为「对照职责表拆分」而非机械砍行数；数字本身保留作 CI 棘轮基线。
- **§4.2 基线表新增「文件治理」行**：三层体系声明（职责表管源头 → 结构检查管过程〔随 FG-C2 落地〕→ 阈值棘轮管兜底）。
- **§4.2 分层与装配行 + `ai/project-rules.md` §5.2**：`service/auth_context.py` 从「历史破例」改「唯一登记豁免」并挂 §4.1.1 指针（新代码不得复制）。
- **research 报告登记裁决记录**（FG-C1~C4 全采纳 + 实施状态）；`docs/research/00-index.md` 双行登记。
- 追溯：FG-C1/C3 ← `docs/research/2026-08-19-file-governance-mechanism-analysis.md` §4；后续 FG-C2+R1（后端结构检查 + 后端棘轮）、FG-C4（模板回流提案）另行 PR。

## v3.12.4（2026-08-18）

**代码目录逐目录评审报告落盘 + 软件工程依据扩展。纯文档，无代码改动，bump PATCH。**

- **`docs/research/2026-08-18-code-directory-review.md` 新建**：逐目录评审报告（独立成文不进 05，避免规范膨胀——用户裁决）——backend 四层 / frontend 五区 / openapi·tests·docker·scripts 横切目录，各含判级（✅/⚠️）+ 实测数据（文件数 / 行数 / 结构分布）；整体结论**结构健康、无 ❌ 级问题**，核心短板 = 治理不对称（前端有 file-size ratchet、后端无，致 6 个 service 文件超 250 阈值无人拦截，max export.py 576 行）。
- **改进建议 R1-R4 登记（AI 评审，待人工确认采纳范围）**：R1 后端补 file-size ratchet（高优先，小成本）；R2 repository 按域拆子 Protocol（protocol.py 101 方法 god object，中优先，docstring 已自带 Slice B 方案）；R3 local-vault-* 六模块从 app/ 迁 features/（低优先技术债）；R4 scripts/ 分子目录（文件翻倍时）。
- **`docs/references/software-engineering-basics.md` 扩 §3「分层与接口设计依据」**：本轮评审涉及的学科出处 6 条（Fowler PoEAA 分层·Repository·UoW / SOLID ISP·LSP / God Object 反模式 Brown 1998 / 棘轮机制·童子军军规 CI 化 / Conway 定律按功能 vs 按技术组织）× 原始文献 × 大白话 × 评审落点；术语词典 +5 条（ISP / LSP / Repository / UoW / God Object / 棘轮 / 按功能组织）。
- **05 §4.1.0 尾部仅加一行指针**（评审报告 + references §3），规范本体不膨胀。
- 追溯：评审基准 = 05 §4.1.0（v3.12.2 引入）+ §4.1 阈值；数据快照 main `2bd82b3`。



**提案收件箱收口 + v1.64.0 同步欠账补记（OI-105 关闭）。纯治理文档，无代码改动，bump PATCH。**

- **6 份已吸收提案归档**：模板维护者 2026-08-18 Batch A/B+C 三批落地（PR #362 / #363 = v1.63.0，PR #364 = v1.64.0）——#350 pitfall 存量触发、#354 OO overlay、#355 落点审计、#356 概述章骨架、#358 图表镜像全部采纳；#357 根目录结构**部分采纳**（仅 §2.2 三层区框架，§2.1 物理归拢另立评估）。6 份 `git mv` 至 `_archive/proposals/`（归档不删），头部状态行补落地链接，归档 README 登记表 +6 行。
- **`_proposals/TEMPLATE-UPGRADE-INDEX.md` 重构收口**：收件箱现状节（在途 2 份：#334 暂无维护者回应 / #370 新开）+ 已归档 6 份落地一览 + 历史批次记录（Batch C 提交 → 维护者落地 → 本仓同步闭环）。
- **v1.64.0 同步运行记录补写**：`sync-records/template-sync/2026-08-18-sync-template-v1.64.0.md`——该同步实际发生在 PR #207 分支内（bootstrap `4561893` + sync `a2f99d2` 搭载，36 文件 +596/-72），当日未落记录（最新停在 v1.62.0）；本记录按 Git 事实补写，含命令真实性表（check-derived-sync 无留痕如实标注）与「PR 搭载同步必须落运行记录 + 提案归档」教训。
- **OI-105 关闭**：open-items 登记「6 份吸收关闭 + 在途 2 份转长期跟踪，无需派生侧动作」。
- 追溯：OI-105 / 模板仓 issue #350 / #354-#358 / PR #362-#364 / sync commit `a2f99d2`。



**代码目录划分依据成文：规范（05 §4.1.0 五条依据 + 目录映射）+ 学科出处参考（references）+ 模板回流提案草稿。纯文档 / 规范增强，无代码改动，bump PATCH。**

- **`docs/05-tech-spec.md` 新增 §4.1.0 目录划分依据**：五条依据表（部署 / 运行时边界、架构分层、业务特性纵切、契约单源、开发生命周期；各含原理一句话 + 主流印证 + 判断口径）+ LUMEN 目录→依据映射表（backend / frontend / openapi / tests / docker / scripts / 根级配置）+「契约」术语注（DbC，Meyer 1986；openapi 单源 / generated.ts 拓印 / CI drift 违约探测）。既有 §4.1 边界表与阈值表不动——本节回答「凭什么这么切」，边界表回答「放哪」。
- **`docs/references/software-engineering-basics.md` 新建**（外部参考，非权威规格）：五条依据的学科出处详表——四条知识线（模块化分解 Parnas 1972→CCP / 架构模式 Layers / 设计规约 DbC / 配置管理 IEEE 828）× 原始文献 × 大白话 × LUMEN 落点 + 术语小词典 10 条（契约 / 前后置条件 / 分层 / 纵切 / 内聚耦合 / 信息隐藏 / CCP / SSOT / 部署单元 / IaC）；`references/00-index.md` 登记。
- **`ai/project-rules.md` §4 同步**：删过时「目录树待 04 落定后回填」残留；backend 三层改四层（补 repository，与 05 §4.2 基线对齐）；scripts / tests 描述对齐现状（浏览器冒烟在 `scripts/smoke-*`）；补指向 05 §4.1.0。
- **`_proposals/TEMPLATE-UPGRADE-directory-partition-principles.md` 新建草稿**（未提交跨仓 issue，待审定）：模板侧建议方案 A 并采——`global-rules §5` 补精简五条（全形态可见）+ `web-fullstack-profile §4` 补依据→推荐树映射（Web 特化）；与 issue #357（根目录分类）正交；MINOR bump。INDEX 主题 C 登记。
- 追溯：无 REQ / MOD 新增（编码约定范畴）；来源 = 用户提问「代码实现目录有哪些 / 划分依据是什么 / 参考主流还是方法论」两轮会话。



**OI-103 / C-001 部署前置修复：`backend/Dockerfile` 路径错误 + `.dockerignore` 已在位确认。bump PATCH（bug fix，不新增可演示能力）。**

- **Dockerfile 路径修复**（`backend/Dockerfile` 第 24 行）：`COPY requirements.txt /app/requirements.txt` → `COPY backend/requirements.txt /app/requirements.txt`——文件实际在 `backend/requirements.txt`，原写法导致 `docker build` 第 4 步 `failed to calculate checksum "/requirements.txt": not found`，⑪ 方案 A 全容器化路径本就不能跑通。
- **`.dockerignore` 已在位确认**（2026-08-15 readiness 评估时落盘，OI-103 C-001 实际提前完成）：`.env*` / `.venv` / `node_modules` / `docs` / `ai` / `tests` / `scripts` 等非运行时文件不进镜像层；构建实测确认 `.env` 未进入 `lumen-backend-test:latest`，`backend/` / `openapi/` / `requirements.txt` 保留。
- **本机构建实测**：`docker build -f backend/Dockerfile -t lumen-backend-test .` 成功；`/app` 含 `backend/`（api / config.py / main.py / migrations / model / repository）+ `openapi/openapi.json` + `requirements.txt`，镜像 2.16GB（torch CPU + sentence-transformers 下限，符合预期）。
- **未做**（保留为人工 / 后续）：笔记本实际部署、PR #171-175 收编、自动备份、迁移 018 是否被 init_db 自动执行（部署实测时核对）。
- 追溯：OI-103 / C-001 / C-002 / docs/research/2026-08-15-deployment-readiness-laptop-plan.md §2 gap #1+#6。

## v3.12.0（2026-08-18）

**Wave 3 收口：TC-P2-VAULT-003——本地挂载目录 FileSystemObserver 自动监听（REQ-018 模式 B 增强，RG-010 Go）。用户可感知能力（文件变更自动刷新 + 手动重扫按钮），bump MINOR。纯前端零新依赖零后端改动，隐私红线不变（仍仅本地，不上传）。**

- **自动重扫**：`useVaultAutoRescan`——per-mount `FileSystemObserver`（Chromium 系，Edge 139+ 默认可用）观察挂载目录；变更事件只当信号，1.5s 防抖合并后复用既有 `reindex` 全量重扫（walk + 重建索引路径，1000+ 文件 PoC 已验证；不做增量 diff，demo 级 YAGNI）。needs-auth 挂载不观察；observe / 构造失败 console.warn 降级；卸载 / 会话退出 disconnect（RG-010-N2 观察期随会话，与单会话挂载模型一致）。
- **手动重扫兜底（TC 要求保留）**：本地挂载 header 补「重扫」按钮——修复既有 `reindex` 函数无 UI 入口的缺口；title 按浏览器支持性提示（不支持自动监听时明示需手动）。
- **验证**：eslint 0 + build 绿 + file-size + css token PASS + CDP 冒烟（observerSupported=true / 无挂载时重扫隐藏 / 无运行时错误）；真实 picker 句柄监听 + 文件变更自动刷新（RG-010-N1 复测）留用户人工 smoke（showDirectoryPicker 授权无法 headless，同 TC-P2-VAULT-001 分界）。05/08/09 + design/ingestion + req-implementation-index 回写。**Wave 3（跨设备元数据 + 自动监听）全部收口。**

## v3.11.0（2026-08-18）

**Wave 3 / OI-109：REQ-018 模式 B 增强——跨设备 vault 挂载元数据（TC-P2-VAULT-004）。新增 API endpoint（API-059）+ migration 015 + 前端接线，bump MINOR。隐私天花板不变：仅同步挂载清单元数据，句柄/路径/正文仍只留各设备浏览器 IndexedDB，不进服务端 RAG。**

- **数据库**（migration 015）：`lumen_vault_mounts` 新表——`user_id / device_id（客户端自生 device token）/ mount_name / source_type(obsidian|markdown_folder) / auth_status(granted|revoked) / last_synced_at`；`UNIQUE(user_id, device_id, mount_name)` 自然键 upsert（重复挂载刷新时间戳，不刷行）+ `(user_id)` 跨设备清单索引；revoked 软撤销保留审计行（仿 `lumen_sessions.revoked_at`）。
- **后端 API**（API-059）：`GET /api/vault-mounts`（本人全部设备挂载清单，updated_at 倒序）+ `POST /api/vault-mounts`（挂载成功 granted / 卸载 revoked；参数非法 4220；revoked 无对应行幂等返回 null）；仅登录本人、无空间维度。repository 三件（protocol / pg / demo）+ `upsert_vault_mount` / `list_vault_mounts` 双实现（契约测试守护）。
- **前端**：挂载成功自动上报 granted（effect 驱动，页面恢复亦自愈刷新）/ 卸载上报 revoked / 登录拉取清单；「本地挂载」分区新增**跨设备挂载只读列表**（标注本机/其他设备 + 来源类型 + 日期，revoked 默认隐藏）；同步失败 console.warn 降级不阻塞本地挂载（本地优先红线）。零改动 useAppState / useLocalVaultMount（file-size ratchet 无余量）。
- **契约产物**：openapi.json + generated.ts 再生成（CI 双 drift 门同步）。
- 验证：pytest 331 passed（+10 vault 用例）/ mypy 0 / lint+build 355 modules / file-size + css token 检查过 / 真实 PG migration 015 应用 + API smoke（登录→上报→upsert→清单→撤销→4220）/ `scripts/smoke-vault-mounts-browser.mjs`（设备 B 侧可见 + revoked 过滤）；本机挂载即上报留用户人工可选验收。REQ-018 / TC-P2-VAULT-004 / migration 015 / API-059 追溯见 09 §5。

## v3.10.0（2026-08-17）

**前端设计系统规范工作流全 6 步（charter 立项 → 收口）：视觉语言审计 → 结构专项 RA → 令牌升级 → 去框化试点与全站铺开 → 规范成文 → CI 白名单。全站观感变化 + 首份完整设计规范文档，bump MINOR。目标「AI 依据规范与约束生成代码，而非各写各的」落地为三道闸：规范可查（design-system.md）→ 参数单点（tokens.css）→ 违规可拦（CI）。**

- **审计与 RA**（docs/research/）：10 层视觉语言实证（22 种字号 / 65 处全边框 / 3 处 outline:none 可达性缺陷等 gap 表 P0-P4）+ 6 案例结构配方提取（linear/sanity/notion/claude/raycast/mintlify，D 级封顶、参数按 LUMEN 现状对齐）。
- **令牌升级**：tokens.css 新增正交维度令牌——字阶 5 档（`--font-micro/caption/body/emphasis/title`，22 种字面收敛）/ 字重 3 档（400/500/600，650 历史遗留与 700/800 归并）/ 行高 3 档 / 圆角 4 档 + pill（9 种字面收敛）/ 动效 2 档；**3 处裸 `outline:none` 可达性缺陷修复**（resizer×2 / 编辑器工具栏按钮补 `:focus-visible` 焦点环）。
- **去框化**（用户试点确认「配方照单全收」后铺开）：一视图一容器 + 分隔四手段（留白/分隔线/边框/投影）——列表行改分隔线、次要按钮幽灵化、输入框保留框但边线降档 `--line-soft`、hover 两路统一 `--hover`；全站 31 处定性处置（容器壳/浮层/品牌触发器/分组壳/数据表保留 `--line`）。
- **规范成文**：`docs/design/frontend-design-system.md` v1.0——§1 基础层 10+1 项三段式（规则/token/边界豁免表）+ §2 组件契约 8 类与新增组件 checklist + §3 模式层 + §4 治理（token 变更流程/CI 门禁/豁免登记）+ §5 回流清单（5 项 PAT-VIS 候选，跨仓另议）。
- **CI 扩展**：`check-frontend-css.mjs` 增字号/字重/圆角白名单（token 引用或登记豁免），全仓一次通过；`ai/project-rules.md` §5.1 CSS 纪律升级为规范执行入口。
- 验证：check:css（扩展版）/ eslint / build / file-size ratchet / 主题 smoke 19/19 每步全过；三主题截图留档。PR #180 squash merge main `3faf365`，4 job 全绿（paths 过滤：前端 + project-check）。

## v3.9.0（2026-08-16）

**多主题试点（UI-G-003 用户确认四套）：CSS 设计令牌单点 → `[data-theme]` 多主题全量落地 + 组件样式硬编码色值清零 + CSS 纪律成文。新增可演示能力（主题切换器 + 四套主题），bump MINOR。母模板 UI 知识层（ui-knowledge v1.62.0）首个消费试点，双层评估落盘。**

- **四套主题**：`light`（默认，对比度精修）/ `dark`（深色）/ `paper`（暖米纸，衔接 brief 既有米白候选）/ `legacy`（试点前原稿冻结对照，2 处历史对比度缺陷留证不改）；代码块四套统一固定深色（C-RA-002 拍板）。
- **tokens.css 单点化**：重写为四套 `[data-theme]` 变量 + 新增 20 余个整值令牌（文字阶梯 4 级 / 语义色 border 三件套 / 阴影遮罩 / 焦点环实色 / 时间线热力 ramp / `--on-accent` / `--hover` 等）。
- **硬编码清零**：28 个组件 CSS 字面色值 **202 处 → 0**（含 `var(--x, #fallback)` 死 fallback 清理、阴影 / 遮罩整值收编）；新增 `scripts/check-frontend-css.mjs` CI 守门防回潮。
- **切换器**：用户菜单内 select（`frontend/src/theme.ts` 单点）+ localStorage 持久化 + `index.html` 内联预置脚本防首帧闪烁（FOUC）。
- **light 套过渡优化**（用户实测反馈）：画布 `#f4f6f9`→`#eef2f7` 加深一档 + 卡片 `--shadow-card` 轻投影，白面板层次可读；对比度复核全过（muted 4.54 / 主色 4.60）。
- **规范成文**：`ai/project-rules.md` §5.1 CSS 纪律 5 条（色值只准 var() / 禁主题分支选择器 / 一文件一域 300 行 / 禁 !important / CI 守门）；brief §3.1.1 多主题方向 + 新增主题三步法。
- **证据链**（docs/research/）：RA（theme-pilot，UI-G-002/003 双 Gate 过）→ 视觉探索（WCAG 2.2 全 token 组合对比度校验，4 处起点值否决修订）→ 静态原型 → 双层评估（第 1 层五维全过；第 2 层机制复盘含母模板回流候选 5 条）；设计系统规范工作流立项（charter）。
- 验证：eslint 0 error / tsc+build / file-size ratchet / check:css 全过；CDP 浏览器 smoke **19/19**（四套切换生效 + 背景期望值 + 持久化 + 刷新保持 + 每套正文对比度实算 14.47-16.91:1）；用户浏览器实测通过。PR #179 squash merge main `fcecdfe`，9 job 全绿。

## v3.8.27（2026-08-13）

**维护态批30（Sprint-55）：前端 codegen Slice B-4 documents——union 接入 + 契约失配修正 + CI drift 门升 required（CQ-P1-006 后续·**前端 codegen Slice A+B 全量闭环**）。纯类型层 + CI 门收口、非功能，不改对外 API / DB；无新依赖。聚合 bump PATCH。**

- **documents 真 union**：后端对文档有两种形状（列表 → `DocumentSummary` 无正文；详情 / 写操作 → `DocumentDetail` 必带正文），旧手写压平为 `content_md?: string` 用字段存在性当运行时哨兵；本批改为 `KnowledgeDocument = DocumentSummaryView | DocumentDetailView` 真 union + 导出 `isDocumentDetail` 类型守卫 + 函数签名精确化（list→Summary[]；get/create/update/move/restore→Detail）。
- **哨兵重写**：`useDocuments` / `useDocumentSideData` 5 处「字段存在性」判断改 `isDocumentDetail` narrow + 冗余 `??` 清理（Detail 必有 content_md）+ effect deps 同步；11 个公共字段只读消费方 union 直接兼容零改动。
- **契约失配修正**：`listDocumentsByTag` 后端实际返回瘦身 `DocumentTagItemView[]`（旧手写谎称完整 `KnowledgeDocument[]`，运行时字段少于声明）→ `TaggedDocumentItem` narrow + useTags / TagsFeature 类型链。
- **CI drift 门收口**：`frontend-schema-diff` 删 `continue-on-error` 升 **required**——前端 codegen 17 域全量接入完成，后端改契约 + 前端忘重新生成直接红灯。
- 验证：`npm run lint` 0 + `npm run build` **350 modules** 0 error + 浏览器 smoke **全链路 PASS**（list→选中→详情加载→草稿回填→编辑保存→右键移动→版本 tab→标签瘦身列表→从标签打开→编辑器回填，fixture 自建自清）；CI PR #169 **9 job 全绿**（drift 门首跑 required 通过；project-check ratchet 拦截 useDocuments 286→287 → import 合并修正复绿）。PR #169 squash merge main `f66b00f`。

## v3.8.26（2026-08-13）

**维护态批29（Sprint-54）：前端 codegen Slice B-3 账户空间域混合接入（CQ-P1-006 后续）。纯类型层重构、非功能，不改对外 API / DB；无新依赖。聚合 bump PATCH。**

- 账户空间域 4 域接入生成类型（**范围修正**：原计划 6 域中 config 域已随 Slice B-1 `search.ts`、users 域本在 `spaceMembers.ts`）：`auth` / `spaces` / `spaceMembers` / `admin`。
- 混合接入（Slice A/B-1/B-2 验证模式）：主体 alias 生成类型 + union literal（role / status）保留手写 narrow + 请求体手写。
- 特殊处理：auth `LoginResponse = Omit<LoginView,'current_space_id'|'role'> & narrow`（命名错位；后端 `current_space_id: number|null` / `role: string` → 前端 `number` / union，运行时哨兵=注册即建个人空间 C-AUTH-001，与 `Session` 类型 / session-store 校验对齐）；`RegisterResponse` email narrow；`SessionInfo` / `PasswordResetMessageView` / `Space` / `SwitchSpaceView` / `UserSearchResult` / `AdminUserSpaceAvailable` 零差异 alias（多处命名错位）；admin 嵌套 narrow（`AdminUserSpacesResult.joined` 元素 role）。
- 接入后类型定义行数微减（alias 替代手写，4 文件 +50/-56）；JS / CSS bundle 逐字节不变（纯类型层）。
- 验证：`npm run lint` 0 + `npm run build` **350 modules** 0 error + 浏览器 smoke PASS（登录 → 空间下拉 + 真实切换 + 还原 → 成员管理表 → 用户管理表 → 用户空间抽屉，无运行时 / console 错误）。CI PR #168 **9 job 全绿**。PR #168 squash merge main `90d06d5`。

## v3.8.25（2026-08-13）

**维护态批28（Sprint-53）：前端 codegen Slice B-2 术语导入域混合接入（CQ-P1-006 后续）。纯类型层重构、非功能，不改对外 API / DB；无新依赖。聚合 bump PATCH。**

- 术语导入域 6 域接入生成类型（**范围修正**：原计划 7 域中 rag 已随 Slice B-1 `search.ts` 完成）：`terms` / `termCategories` / `quickEntry` / `aiPolish` / `imports` / `exports`。
- 混合接入（Slice A/B-1 验证模式）：主体 alias 生成类型 + union literal（status 等）保留手写 narrow + 分页容器 / 请求体 / 前端专属手写。
- 特殊处理：terms `TermStatus` alias 生成 enum（openapi 唯二 enum）+ `Term=Omit<TermDetail,'status'>` narrow（命名错位）+ `TermWritePayload=TermWriteRequest` 零差异 alias；termCategories 零差异 alias；imports 命名错位 alias（ImportResponse↔ImportFileView）+ ImportBatchItem status narrow（import_id 等对齐后端必填）+ ImportBatchResponse 嵌套 narrow + `failedBatchFromSlice` 本地构造补 3 个必填 null；exports `PdfExportResponse` status narrow + `artifact_path` 对齐必填。
- 接入后类型定义行数减少（alias 替代手写，6 文件 +52/-90）。
- 验证：`npm run lint` 0 + `npm run build` **350 modules** 0 error（零回归）+ 浏览器 smoke PASS（术语树 / 详情 pending 分支 + 快速录入 converted 分支 + AI 润色面板，无运行时 / console 错误；imports/exports 纯类型层由 build + tsc 覆盖）。CI PR #167 **9 job 全绿**。PR #167 squash merge main `397382f`。

## v3.8.24（2026-08-13）

**维护态批27（Sprint-52）：前端 codegen Slice B-1 内容域混合接入（CQ-P1-006 后续）。纯类型层重构、非功能，不改对外 API / DB；无新依赖。聚合 bump PATCH。**

- 内容域 4 模块接入生成类型（tags 已 Slice A）：`folders` / `docLinks` / `timeline` / `search`。
- 混合接入（Slice A 验证模式）：主体 alias 生成类型 + union（status / event_type / level / permission / source_type）保留手写 narrow + 分页 / 请求体 / 前端专属手写。
- 特殊处理：folders `FolderDetail` 清理冗余 `created_at`/`updated_at`（后端 schema 不返回、grep 确认无消费方）；timeline 嵌套 narrow（items / density / window）；search 命名错位 alias（Result↔ResultView / Response↔PageView / Meta↔View）+ RagSource optionality。
- 接入后类型定义行数减少（alias 替代手写，4 文件 +45/-74）。
- 验证：`npm run lint` 0 + `npm run build` **350 modules** 0 error（零回归）。CI PR #166 **9 job 全绿**。PR #166 squash merge main `59dea01`。

## v3.8.23（2026-08-13）

**维护态批26（Sprint-51）：前端 codegen Slice A 试点——openapi-typescript 引入 + tags 混合接入（CQ-P1-006 后续，轨道3 P1 剩余候选）。纯工程治理引入前端类型 codegen、消除手工双写、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；新增 devDep openapi-typescript。聚合 bump PATCH。**

- **codegen 引入**：`openapi-typescript@^7.13.0`（devDep）+ `gen:api` 脚本（`openapi-typescript ../openapi/openapi.json -o src/api/generated.ts`），从后端 OpenAPI 快照生成 `frontend/src/api/generated.ts`（入库；避开 `--immutable` v7 bug #1368）。前端类型与后端 Pydantic 同为 snake_case，零命名转换冲突。
- **混合接入试点（tags）**：响应主体类型 alias 生成类型（字段对齐消除双写）；union literal（TagStatus 等）保留手写 narrow overlay（Explore 评估揭示 openapi 几乎无 enum，全量替换会让 ~12 处 union 退化为 `string`、丢编译期 narrow）；分页容器 / 请求体 / 前端专属类型保留手写。TagView `Omit<生成,'status'> & {status: TagStatus}` narrow；DocumentTagView·TagLinkView 零差异 alias。
- **CI drift 门**：`frontend-schema-diff` job（advisory，`gen:api` + `git diff --exit-code`，复用 schema-diff 模式）；Slice B 全量后升 required。
- **file-size ratchet 豁免**：`check-frontend-file-size.mjs` 豁免 codegen 产物（`*generated.ts` 机器生成、行数随契约可增可减，不适用手写膨胀 ratchet）。
- 验证：`npm run gen:api` 幂等（drift 0）+ `npm run lint` 0 + `npm run build` **350 modules** 0 error（零回归）+ `npm run check:file-size` OK + tags 消费方 tsc 零回归；浏览器 smoke 留 Slice B（纯类型改动 + build 强保证）。CI **9 job 全绿**（含新 frontend-schema-diff 首跑）。PR #165 squash merge main `1a06f8d`。

## v3.8.22（2026-08-13）

**维护态批25（Sprint-50）：前端文件膨胀拆分 Slice E——组件拆分·中风险 + baseline 收窄（CQ-P1-008 候选 E4 收口 / GOV-015，轨道3 P2 剩余候选）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **组件拆分·中风险**：3 个超限 .tsx 组件全拆——`WorkspaceMain`（279 行）抽 documents 视图分支为 `app/WorkspaceMainDocuments`；`DocumentsFeature`（485 行）拆 `features/documents/`（useSplitDragController + useEditorUndoStack + MarkdownToolbar + DocumentEditorForm + DocumentPreviewPane）；`LocalMountPane`（563 行）拆 `features/local-mount/`（useLocalMountImport + LocalMountHeader + LocalMountImportBar + LocalMountTreeView + LocalMountContextMenus + useInlineEdit + LocalMountInlineInput）。
- **textareaRef 三方共享内聚**：编辑器撤销栈 / AI 选区 / MD 工具插入共用同一 textarea ref，内聚于 DocumentEditorForm（内部 useRef + 装配三处），不拆成三组件各持一份。
- **TreeView 二次拆**：LocalMountTreeView 302 行抽右键菜单（DirContextMenu / FileContextMenu）+ 内联编辑（useInlineEdit / LocalMountInlineInput）落到 242。
- **baseline 收窄**：5→2（3 个组件全出基线；剩 useAppState / useDocuments 两核心编排 hook 登记例外）。
- 验证：`npm run lint` 0 + `tsc` 0 + `npm run build` **350 modules**（+13 文件，无新依赖）+ CSS bundle **65.60 kB**（不变）+ `npm run check:file-size` OK（2 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（smoke-vault-local-mount OK：登录 alice → documents → `.local-mount-pane` 渲染）；CI **8 job 全绿**。PR #162 squash merge main `9f5c967`。

## v3.8.21（2026-08-13）

**维护态批24（Sprint-49）：前端文件膨胀拆分 Slice D——组件拆分（CQ-P1-008 候选 E4，轨道3 P2 剩余候选）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **组件拆分**：6 个超限 .tsx 组件全拆——`FolderTree`（569 行）拆「主树 / 文件夹节点 / 文档行」；`TermCategoryTree`（405 行）拆「主树 / 领域节点」；`TopBar`（274 行）拆「顶栏 / 帮助弹层 / 用户菜单 / 栏开关」；`ContextPane`（366 行）拆「面板 / 文件头 / 术语区 / 上下文列表」；`ImportFeature`（335 行）拆「文件收集工具 / 拖拽区 / 结果列表」；`DocumentInspectorFeature`（266 行）拆「主面板 / 版本 / 链接 / 标签 tab」。
- **共享 tree/ 抽取**：文件夹树与术语树的「内联改名输入框」和「右键菜单关闭」是复制粘贴的重复代码（共约 170 行），抽成共享组件 `app/tree/TreeInlineEditor` + `useTreeMenuDismiss` 消除。
- **baseline 收窄**：11→5（6 个组件全出基线；剩 3 个复杂组件 + 2 个核心编排 hook）。
- 验证：`npm run lint` 0 + `tsc` 0 + `npm run build` **337 modules**（+17 文件，无新依赖）+ CSS bundle **65.60 kB**（不变）+ `npm run check:file-size` OK（5 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（真实登录 → 工作区渲染全部拆分组件 + 文件夹右键菜单 / 内联编辑器 / Esc 关闭 + 文档侧栏四 tab，无运行时 / JS 错误）；CI **8 job 全绿**。PR #161 squash merge main `8ea9031`。

## v3.8.20（2026-08-13）

**维护态批23（Sprint-48）：前端文件膨胀拆分 Slice C——CSS 拆分（CQ-P1-008 候选 E4，轨道3 P2 剩余候选）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **CSS 拆分**：4 个超限 CSS（阈值 300）全拆——`workspace` 722 行拆 tree/editor/workspace 三份；`local-mount` 589 行拆 pane/tree/doc-preview/menu 四份；`layout` 458 行拆 topbar/workspace-layout 两份；`onboarding` 317 行的新手清单并入 welcome.css。所有新文件按层叠顺序原位引入。
- **baseline 收窄**：15→11（CSS 全出基线；剩余 9 个 .tsx 组件 + 2 个核心编排 hook）。
- 验证：`npm run build` 320 modules + CSS bundle **65.60 kB**（= 拆分前，内容无丢失）+ `npm run check:file-size` OK（11 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（headless Edge 登录页渲染正常）；CI **8 job 全绿**。PR #160 squash merge main `071a73b`。

## v3.8.19（2026-08-13）

**维护态批22（Sprint-47）：前端文件膨胀拆分 Slice B——hooks/工具拆分（CQ-P1-008 候选 E4，轨道3 P2 剩余候选）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **hooks/工具拆分**：4 个超限 `.ts` 按风险低→高拆——`local-vault-fs` 310 行拆 3 个纯工具（walk 目录遍历 / idb 句柄持久化 / fs 授权+读写）；`useFolders` 300 行拆 folder-utils 纯函数 + useFolderInlineEdit 内联编辑组；`useDocuments` 335 行拆 useDocumentSideData（版本/出入链/反链）+ download-actions；`useLocalVaultMount` 442 行拆 tree/types/useLocalVaultEditor（REQ-049 本地读写）+ 主 hook 236。
- **baseline 收窄**：18→15（useLocalVaultMount / local-vault-fs / useFolders 出基线）；useDocuments 286 因文档域核心 CRUD 强拆需大 prop-drill 登记（核心编排例外，与 useAppState 同类，Slice A 确认模式）。
- 验证：`npm run lint` 0 + `tsc` 0 + `npm run build` 314 modules（+9 文件）+ `npm run check:file-size` OK（15 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（headless Edge 登录页无错误）；CI **8 job 全绿**。PR #159 squash merge main `bad7e4c`。

## v3.8.18（2026-08-13）

**维护态批21（Sprint-46）：前端文件膨胀拆分 Slice A——App 减压收口 + ratchet 分层阈值（CQ-P1-008 候选 E4，轨道3 P2 剩余候选）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **App 减压收口（②useAppState 再抽）**：`App.tsx` 359→90 行——新 `app/useAppShellState.ts`（UI/布局派生 + 局部弹窗/引导 state）+ 新 `app/useAppState.ts`（17 个域 hook 编排 + cross-cutting 回调 + 3 effects，依赖顺序原样搬移，登记基线）+ App 只剩 import + 装配。
- **ratchet 分层阈值**：`scripts/check-frontend-file-size.mjs` 按 docs/05 §4.1 分层（`.css` / `App.tsx` 主应用入口→300，`.ts/.tsx`→250，原统一 250 与文档口径不一致）；baseline 重生成（19→18，App.tsx / ai-assistant.css 出基线，useAppState.ts 进）。
- 验证：`npm run lint` 0 problem + `npm run build` 306 modules（+2 hook）+ `npm run check:file-size` OK + 负向探针（280 行临时文件 fail）+ 浏览器 smoke（demo + headless Edge 渲染登录页无运行时错误）；CI **8 job 全绿**。PR #158 squash merge main `ee95523`。

## v3.8.17（2026-08-13）

**维护态批20（Sprint-45）：前端 ratchet + App 减压（CQ-P1-008，轨道3 P2）。纯工程治理收敛前端文件膨胀、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **App 减压**：`App.tsx` 546→360 行——拆 `AuthShell`（登录 / 注册 + 忘记密码）/ `WorkspaceShell`（主工作区容器）/ `OverlayShell`（命令面板 + AI 助手）三个 shell 组件，App 只留状态编排 + 装配（职责分离，对齐 L0-11 体量克制）。
- **文件膨胀 ratchet**：新 `scripts/check-frontend-file-size.mjs`（Node 零依赖）+ `frontend/.file-size-baseline.json`（19 个既有超限文件基线）+ `package.json` `check:file-size` + CI `project-check` step——拦「新增超限文件」+「既有超限文件继续膨胀」（棘轮只进不退）。
- 验证：`npm run lint` 0 problem + `npm run build` 304 modules（+3 shell）+ `npm run check:file-size` OK + 负向探针（260 行临时文件 fail）；CI **8 job 全绿**。PR #157 squash merge main `7b5444f`。

## v3.8.16（2026-08-13）

**维护态批19（Sprint-44）：配置集中 + secret 校验（CQ-P2-003，轨道3 P2）。纯工程治理 + 生产安全加固，集中 env 读取并为生产补弱默认签名 key 的 fail-closed 校验；不改 Phase / 交付物范围 / 对外 API 语义 / DB。新增依赖 pydantic-settings（pydantic 生态标准扩展，已确认）。聚合 bump PATCH。**

- **集中配置**：新 `backend/config.py`（pydantic-settings `Settings`：`lumen_env` / `database_url` / `demo_token_key` 三字段显式 alias + `get_settings()` lru_cache 单例 + `validate_runtime_secrets`）；`db.py` / `main.py` / `auth.py` 三处静态 env 读取收敛到 settings（单一事实源）。
- **secret 校验（安全加固）**：`main.py` lifespan 生产 fail-closed——`LUMEN_ENV=production` 且 `TOKEN_SIGNING_KEY` 为弱默认 / 空时拒绝启动；补既有生产护栏（只挡 demo 仓储、不挡弱 key）的安全缺口。test / 本地开发 / demo 为受控豁免（理由见 docs/05 §4.2.4 / implementation-lifecycle §6.2）。
- **显式豁免**：`llm_adapter.py` `LLM_<NAME>_*` 动态命名配置（key 运行时拼接）、`embedding.py` `HF_HUB_DISABLE_XET` 环境约束注入（huggingface 导入前 setdefault）不收敛。
- 验证：mypy **0 error**（58 files）+ ruff passed（含 T20）+ 默认 pytest **321 passed / 49 deselected**（+8 config 用例）零回归 + secret 校验单测 8/8。PR #156 squash merge main `7388ff6`。

## v3.8.15（2026-08-13）

**维护态批18（Sprint-43）：日志统一（CQ-P2-002，轨道3 P2）。纯工程治理收敛 print 债与静默吞异常日志、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **print()→logging**：`backend/repository/pg_repository.py` embedding 降级 `print` → `logger.warning`（后端生产代码 print 债清零，对齐 L0-4「失败必须可见」）。
- **静默吞 except 补日志**：`service/document.py` 索引回填单文档失败、`service/rag.py` RAG / 通用对话 LLM 降级 ×2、`api/auth.py` 登录 `SpaceAccessError` 回退——均补 `logger.warning` 记原因（故障有诊断证据）。
- **ratchet 机制**：`ruff.toml` select 加 `T20`（flake8-print）禁 print；`scripts/` smoke / CLI 脚本 stdout 输出豁免（不在 ruff 扫描范围，属合理用途）。本地 `ruff check` + CI backend-lint 均会检查。
- 验证：mypy **0 error**（57 files）+ ruff passed（含 T20）+ 默认 pytest **313 passed / 49 deselected** 零回归 + `grep` 复核 backend/ 无 print 残留 + T20 负向探针确认可抓 print。PR #155 squash merge main `edb5df1`。

## v3.8.14（2026-08-13）

**维护态批17（Sprint-42）：强依赖 fail-fast / readiness（CQ-P1-001，轨道3 P1）。纯工程治理补强依赖失败语义与运维探针、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **Slice A（启动 fail-fast）**：`backend/main.py` lifespan 改 except 分支化——PG 模式（非 demo 仓储）`init_db` / `ensure_documents_indexed` 失败时 `logger.error(exc_info=True)` + re-raise 拒绝启动（避免带病运行）；demo 仓储模式保留容忍降级（`logger.warning`）。顺带收口 `main.py` 2 处 `print` → `logger.info` / `logger.warning`（`docs/05` §4.2.4 print 债 main.py 部分）。
- **Slice B（liveness / readiness）**：`backend/model/error_codes.py` 新增 `ErrorCode.DB_NOT_READY=5031`（→ HTTP 503，与 5030「外部 AI / OCR 不可用」语义分离，单一含义）；`backend/model/schemas.py` 新增 `HealthView`（status / db）；新 `backend/api/health.py`——`GET /api/health/live` 进程存活 200、`GET /api/health/ready` demo 200 / PG 模式 `db.ping()` 失败 503 + 5031，均 `response_model=ApiEnvelope[HealthView]`；`create_app` 注册 `health_router`；`openapi/openapi.json` 重生成（+91）。prod `docker-compose.prod.yml` 后端 healthcheck 接 `/api/health/ready`、frontend `depends_on: backend: service_healthy`。
- **Slice C（测试）**：`tests/backend/test_health.py` 5 用例（live / ready demo / ready PG 503 / PG 启动 fail-fast RuntimeError / demo 容忍仍启动）；`test_error_contract.py` 码集断言 + 5031。
- 验证：mypy **0 error**（57 files）+ ruff passed + 默认 pytest **313 passed / 49 deselected** 零回归；openapi 快照 `git diff --exit-code` 绿；CI **8 job 全绿**（含 backend-integration 48 用例 / schema-diff required）。PR #154 squash merge main `dd75329`。

## v3.8.13（2026-08-13）

**维护态批16（Sprint-41）：API 响应契约 response_model·codegen（CQ-P1-006，轨道3 P1）。纯工程治理给全部 JSON 端点补机器可执行响应契约、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **Slice A（地基）**：`backend/model/schemas.py` 新增 `ApiEnvelope[T]` 泛型（`{code,msg,data}` envelope，对齐 CQ-P1-005 NFR-007 契约）；`scripts/export-openapi.py` 生成并固定 `openapi/openapi.json` 快照；CI 新增 `schema-diff` job（advisory 起步，复刻 eslint/mypy B1 三段式）。
- **Slice B-1..B-3（按域接入，62/62 JSON 端点）**：内容域 `documents/tags/folders/doc_links/timeline/search`（27）+ 术语/导入域 `terms/term_categories/quick_entry/imports/rag`（16）+ 账户/空间域 `auth/spaces/space_members/users/admin/export(JSON)`（19）全部标注 `response_model=ApiEnvelope[X]`，响应序列化按模型校验 / 过滤，OpenAPI 快照随之携带精确字段与可空性；二进制端点 3 个（md/zip/pdf 下载）明确排除；`schema-diff` 升 required（Slice B-3 收尾）。另修正评估遗漏：实际 65 端点（含 `config_router` llm-configs，评估数 64 漏 1）。
- 验证：本地路由全量 smoke **60/60 通过**（62 JSON 端点 + 3 二进制端点经 TestClient + DemoRepository 实测，response_model 校验零失配）；mypy **0 error**（56 files）+ ruff passed + 默认 pytest **304 passed / 4 skipped** 零回归；快照再生成 `git diff --exit-code` 绿；CI `schema-diff` required（integration 48 用例由 CI 兜底，本地 docker 不可用未跑）。

## v3.8.12（2026-08-13）

**维护态批15（Sprint-40）：权限查询边界 scoped query（CQ-P1-004，轨道3 P1）。纯工程治理收敛用户态查询的权限边界、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；不新增依赖。聚合 bump PATCH。**

- **PR #151 `945bf8f`（squash merge main）**：`RepositoryProtocol` 新增 `list_visible_documents(user_id, space_id)` 安全默认查询（pg 两段式：membership 校验 + SQL where 下推 `space_id` + 非 private 或 owner；demo 复用 `filter_visible_documents` 单一事实源）+ `list_documents()` / `list_memberships()` 标 internal + 用户态 8 处调用点收口（timeline / search / rag / folder / export / tag / imports / api documents）+ repository 级 cross-space / cross-user 负向单测与契约测试守护双实现。验证：mypy **0 error**（55 files）+ ruff passed + 默认 pytest **304 passed / 4 skipped** 零回归 + CI **7 job 全绿**（含 backend-integration 48 用例）。实施口径 `tasks/task-047-scoped-query.md`。

## v3.8.11（2026-08-12）

**维护态批14（Sprint-39）：后端引入 mypy 类型检查（mypy B1，NFR-006 P1 落地 / CQ-P1-002 Slice C 收益兑现前提）。纯工程治理引入类型检查器、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；新增 1 个后端 devDep（mypy）。聚合 bump PATCH。**

- **Slice A**（PR #148 `de88d3a`，装依赖 + 配置 + advisory CI）：`backend/requirements-dev.txt` 加 `mypy==2.3.0`（支持 python_version=3.14）+ 根 `mypy.ini`（默认非 strict，查 `backend/` 不含 tests；ASCII 注释避 Windows gbk 编码坑）+ `.github/workflows/project-check.yml` 加 `backend-typecheck` job（advisory 起步 `continue-on-error`）。首跑基线 **190 errors / 28 files**。
- **Slice B-1**（PR #149 `18a6a63`，current_space_id C + reportlab + 真实 bug，190→119）：`TokenContext.current_space_id` `int|None`→`int` + `get_current_user` 入口 fail-closed guard（None→401/4001 重登录；DB 列 nullable 不动）——清 45 条 api arg-type（**mypy 核心价值兑现：current_space_id None 传播契约缺口，ruff/tsc 抓不到**）；`mypy.ini` reportlab override（清 8 import-untyped）；真实 bug 修复 ~18（export re.match if/elif、uow _token 注解+assert、pg_repository cast(CursorResult) rowcount + user None guard、demo replace dict[str,Any]、quick_entry/db/tag guard）。
- **Slice B-2**（本 PR，§3 删 try/except + 补 assert + 升 required，119→0）：删 19 文件（17 api + main.py + auth_context.py）的 `try: from fastapi import except ImportError` 防御块 + `if APIRouter is not None:` 包裹（改直接 import + 顶层代码，main.py/auth_context.py 特殊 guard 删）；补 6 处 service 层 `repository.move/rename/update_X` 返回 `X|None` 临时变量 narrow（term_category/folder/quick_entry，与 B-1 tag.py:188 同类）。`mypy backend` **0 error** + 移除 `continue-on-error` 升 required。
- **关键价值兑现**：mypy 抓到 ruff/tsc 都抓不到的 ① **current_space_id `int|None`→service(int) None 传播缺口** 45 条（api 层契约不一致）；② 真实类型 bug ~20（re.match None 守卫 / Result.rowcount 误用 / tuple|None 未守卫 / repository.update 返回 None 未守卫 等）。
- **验证**：mypy **190→0** + ruff passed + 默认 **307 passed**（+1 None guard 单测）零回归 + CI `backend-typecheck` required 绿。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯工程治理引入类型检查器 + CI 门，不改对外 API 契约语义 / DB / 不新增可演示能力（mypy 属 dev 依赖，非运行时）。验证：mypy 0 + ruff passed + pytest 307 零回归 + CI backend-typecheck required 绿。实施口径 `tasks/task-046-backend-mypy.md`；实证 `docs/research/2026-08-12-backend-mypy-b1-assessment.md`。

## v3.8.10（2026-08-12）

**维护态批13（Sprint-38）：前端引入 ESLint（eslint B1，NFR-006 P1 落地）。纯工程治理引入 lint 工具、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB；新增 5 个前端 devDeps（eslint 工具链）。聚合 bump PATCH。**

- **Slice A**（PR #146 `92ea36a`，装依赖 + flat config + advisory CI）：`frontend/package.json` 加 eslint^9 / @eslint/js^9 / typescript-eslint^8 / eslint-plugin-react-hooks^5.2 / globals^15 devDeps + `lint` / `lint:fix` 脚本；`frontend/eslint.config.js`（新）flat config——typescript-eslint recommended（非 type-checked，避开 tsc strict 重叠）+ react-hooks（`rules-of-hooks` error / `exhaustive-deps` warn）+ `no-explicit-any`（warn）/ `no-unused-vars`（error）；`.github/workflows/project-check.yml` 加 `frontend-lint` job（advisory 起步 `continue-on-error`，对称 backend-lint）。
- **Slice B**（PR #147 `c9d8911`，存量整治 + 升 required）：5 error 清零（**QuickEntryFeature `rules-of-hooks` 真 bug**——`useRef`/`useEffect` 原在 `if(!isOpen)` early return 之后调用，移到之前；**tsc 完全没拦住** + 3 trivial `no-useless-escape` / `no-irregular-whitespace`）+ 5 warning 清零（`useLocalVaultMount` createFile 加 `mountNameOf` 依赖 + `useCommandPalette` items `useMemo` + `App`/`DocumentsFeature` `exhaustive-deps` 有意忽略加 disable + 删冗余 disable）+ 升 required（移除 `continue-on-error`）。
- **关键价值兑现**：QuickEntryFeature 条件调 hook 是 React 运行时崩溃级真 bug，tsc 不管——ESLint 的 React Hooks 规则补了 tsc 最大盲区，印证评估报告 §4.3。
- **验证**：首跑基线 10 problems（5 error + 5 warning）→ Slice B 清零；`npm run lint` **0 problem** + `npm run build` **301 modules** exit 0 零回归 + CI `frontend-lint` required 绿（21s）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯工程治理引入 lint 工具，不改对外 API 契约语义 / DB / 不新增可演示能力（新增 5 devDeps 属 lint 工具链，非运行时依赖）。验证：lint 0 problem + build 301 modules 零回归 + CI `frontend-lint` required 绿。实施口径 `tasks/task-045-frontend-eslint.md`；实证 `docs/research/2026-08-12-frontend-eslint-b1-assessment.md`。

## v3.8.9（2026-08-12）

**维护态批12（Sprint-37）：ruff 37 条存量 lint 旧债清零。纯 lint 债清理、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB / 依赖。聚合 bump PATCH。**

- **37 条分布**：F841×15（未用局部变量）/ E402×11（模块级 import 未在顶部）/ F401×10（未用 import）/ F811×1（重复 import）。
- **自动修复 26 条**（`ruff check --fix --unsafe-fixes`）：10 F401 删未用 import + 1 F811 删 `auth.py` 重复 `import json` + 15 F841 去未用赋值**保留调用**（`token = create_demo_token(...)` / `a = create_folder(...)`，纯函数无副作用、行为不变）。
- **手工结构修复 11 条 E402**：`backend/service/auth.py` 6 处（os / secrets / datetime / bcrypt / entities / logging import 上移文件顶部，纯结构重排、bcrypt 本为模块级 import 无惰性语义）+ `tests/backend/test_document.py` 4 处（import 块上移 `_demo_ctx` 定义之前）。
- **re-export 保留**：`backend/api/auth.py` 的 `TOKEN_SIGNING_KEY` 被 ruff 判 F401 但实为 **re-export**（8 个测试文件 13 处经 `backend.api.auth` 读取 demo signing key）——恢复并 `# noqa: F401` 标注，保留既有 API 面。
- **验证**：ruff **37→0** + 默认 **306 passed / 48 deselected** 零回归。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯 lint 债清理 / 代码结构整理，非功能、不改对外 API 契约语义、不新增可演示能力。验证：ruff 37→0 + 默认 306 零回归。实施口径 `tasks/task-044-ruff-debt-cleanup.md`；rollout §4 轨道3 ratchet（指标只减不增）。

## v3.8.8（2026-08-12）

**维护态批11（Sprint-36）：PG integration 全量入 CI gate——新增独立 `backend-integration` job。纯工程治理配置、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB / 依赖。聚合 bump PATCH。**

- **新增 CI job**（`.github/workflows/project-check.yml`）`backend-integration`：独立 job 跑 PG integration 全量 48 用例——`pgvector/pgvector:pg16` 服务容器（healthcheck `pg_isready -h 127.0.0.1` 走 TCP，不挂 `/docker-entrypoint-initdb.d/`）+ guard 三 env + fail-closed 预检（复用 `tests/backend/pg_test_support.assert_test_database_safe` → 连 `DATABASE_URL` → `InvalidCatalogName` 幂等补建 `lumen_test` → 校验 `pg_available_extensions` 含 vector）+ pytest `-m integration` + 行尾 grep `passed` 防全 skip 假绿。单元 gate（backend-test）保持无 DB 依赖 hermetic；integration gate 可单独 required。
- **关键实现点**：不挂 `/docker-entrypoint-initdb.d/`（服务容器先于 checkout 启动，缺失源 bind-mount 成空目录会炸容器）；healthcheck 走 TCP（官方镜像 init 阶段临时 server 仅 unix socket）；预检 fail-closed 杜绝「PG 不可达 / 库缺失 / 镜像缺 pgvector → 整类 `SkipTest` 静默假绿」。
- **验证**：本地 integration 全量 **48 passed**（32s，零 skip 零失败）+ 预检脚本本地跑通（PG OK + pgvector 可装）+ 负向 smoke（开发库 `lumen` / 缺 `ALLOW_DESTRUCTIVE_TEST_DB` → `UnsafeTestDatabaseError` 硬失败）+ 默认 **306 passed** 零回归 + ruff 37 不增 + PR CI `backend-integration` 绿。
- **回写**：`docs/05 §4.2.4`（integration 入 gate「另议」→ 已落地）+ `docs/08` Sprint-36 + `ai/project-rules.md §1` 维护态批11 + `docs/research/2026-08-10-code-governance-rollout-plan.md` §8。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：CI 配置 / 工程治理调整，非功能、不改对外 API 契约语义、不新增可演示能力。验证：本地 integration 48 passed + 默认 306 零回归 + ruff 37 不增。**integration 全量入 CI gate 已落地（闭环 `docs/05 §4.2.4` 另议）**；免费版私有仓库无分支保护，`backend-integration` 未强制 required；merge 前人工核对后端 checks 绿为流程约定。实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §5 轨道C。

## v3.8.7（2026-08-12）

**维护态批10（Sprint-35）：7 个存量 PG integration 失败整治——补 17 处缺失的 `session.flush()`。纯债修复、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB / 依赖。聚合 bump PATCH。**

- **根因**：`backend/repository/pg_repository.py` 多处 `session.add(row)` 或 `row.x = func.now()` 后、`_to_xxx(row)` 转换前缺 `session.flush()`（Slice A UoW 收口后 commit 只在 `_session_scope` 块退出时发生，方法内不自动 flush）→ ① 8 处 create_*（create_session/create_tag/create_quick_entry/create_ai_draft/create_doc_export/create_term/create_folder/create_term_category）`_to_xxx` 读 `row.id` 返回 `None`（SQLAlchemy autoflush 不因访问 pending 主键触发）；② 9 处 `= func.now()` 后立即转换（update_session_space/update_document/restore_document_version/update_term/rename_folder/move_folder/rename_term_category/move_term_category/update_doc_export）读到 `func.now()` SQL 表达式（Comparator）无 `.isoformat()` → `'Comparator' object has no attribute 'isoformat'`（实验证实 flush 后 server-side 时间戳 reload 成真 datetime）。
- **修复**：上述 17 处统一补 `session.flush()`（机械一行，无行为变更；create_document/create_import_job/create_user_with_personal_space 已有 flush 不动）。
- **登记修正**：`docs/05 §4.2.4` 原登记 ③ `test_ai_polish` 为「LLM 环境」系误判——LLM 已 `patch.object` mock，实为 `create_ai_draft` 缺 flush 致 `draft_id=None`（同属 pending-id 类）。
- **验证**：integration 全量 **48 passed**（原 41 passed + 7 failed → 48 passed 零失败）+ 默认 **306 passed 零回归** + ruff **37 不增**。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯 bug 修复，不改对外 API 契约语义、不新增可演示能力。验证：integration 48 passed 零失败 + 默认 306 零回归 + ruff 37 不增。**7 个存量 integration 失败已全部整治**（`docs/05 §4.2.4` 已识别→已整治）；`integration` 全量入 CI gate 未做（当前 CI 仅 `not integration`），另议；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §5 轨道C。

## v3.8.6（2026-08-12）

**维护态批9（Sprint-34）：CQ-P1-003 事务边界 UoW——service 层原子事务 + rollback 真语义验证。纯事务边界重构、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB / 依赖。CQ-P1-003 全闭环（Slice A 地基 + Slice B service 包 + Slice C rollback 测试），聚合 bump PATCH。**

- **Slice A UoW 地基（PR #141 `5f017b6`）**：新增 `backend/repository/uow.py`——contextvar 感知 `_session_scope`（PgRepository 统一经此取得 session，收口 commit）+ `UnitOfWork`（PG 真实事务，enter 开 session / exit commit/rollback，支持 nested join）/ `DemoUnitOfWork`（内存 no-op）+ `unit_of_work` 工厂（按 `is_demo` 分流）+ `UnitOfWorkProtocol`；pg_repository 96 处 `with SessionLocal()`→`with _session_scope()` 机械替换 + 删 50 处 `session.commit()`（commit 收口 `_session_scope` else 分支，3 处 flush 保留）；`test_uow_contract.py` 5 测试守护双实现契约 + 工厂分流。
- **Slice B service 包 UoW（PR #142 `09137a4`）**：`document.py` `create_document`/`update_document`/`restore_version` 三函数写步（主表 + sync_chunks + sync_wikilinks）包 `with unit_of_work(repository):`，权限校验读在事务外，imports 嵌套调用 nested join；`imports.py` `import_extracted_text` 主流程（create_document + chunk 统计 + complete_import_job）原子提交，`create_import_job`/`fail_import_job` 在事务外独立提交（失败标记不随 rollback 抹掉、不掩盖原异常），删 :108 重复 `replace_document_chunks`（create_document 内 sync_chunks 已写），chunk_count 改 `list_document_chunks` 取（数值不变）。
- **Slice C rollback 真语义 + 隐藏缺陷修复（PR #143 `7c64545`）**：新增 `tests/backend/test_uow_rollback.py`（integration，patch `replace_document_wikilinks` 注入 RuntimeError）验证 import 主事务真正回滚（文档/版本/chunks 全撤销）+ import_job 不残留 done（fail_import_job 事务外独立写 failed）；**修复 `create_import_job` pending-id 缺陷**——`_to_import` 读 `job.id` 前显式 `flush`（SQLAlchemy autoflush 不因访问 pending 主键触发 → 真实 PG 下 `ImportJob.id=None` → complete/fail_import_job KeyError）。
- **验证**：Slice A/B 默认 **306 passed 零回归** + ruff 37 不增；Slice C `test_uow_rollback` + `test_import_lifecycle`（PG integration）PASSED + 默认 306 零回归 + ruff 干净；PR CI required 全绿（backend-test + frontend-build + project-check；ruff advisory 不阻断）。
- **已知债**：PG integration 首次全量跑暴露 **7 个存量失败**（`create_term` 等 pending-id 类 / datetime `isoformat` 序列化 / LLM mock 环境）——与本次无关、此前被默认 `not integration` 跳过，已登记 `docs/05 §4.2.4`，待单独立项整治。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯事务边界重构，不改对外 API 契约语义、不新增可演示能力；CQ-P1-003 聚合 bump（三 slice 闭环）。验证：默认 306 零回归 ×3 + ruff 37 不增 + Slice C PG integration PASSED。**CQ-P1-003 全闭环（Slice A 地基 + Slice B service 包 + Slice C rollback 测试）**；诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.6 CQ-P1-003；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 + §5 轨道C。

## v3.8.5（2026-08-12）

**维护态批8（Sprint-33）：CQ-P1-002 repository 契约 Slice C——service 层 repository 参数类型注解 + 动态调用收口。纯契约化 + 类型注解、非功能，不改 Phase / 交付物范围 / 对外 API 语义 / DB / 依赖。CQ-P1-002 全闭环（Slice A 契约 + Slice C 注解；Slice B 按域拆评估搁置），聚合 bump PATCH。**

- **Slice C service repository 参数注解（PR #140 `8faa68c`）**：`backend/repository/__init__.py` 模块级单例 `repository: RepositoryProtocol = PgRepository()` + 17 个 service 文件 ~80 个 `repository` 参数加 `: RepositoryProtocol` 注解（覆盖全部接收 repository 的 service 函数，含跨行签名；`auth_context.py` 用模块级单例无需注解）；`timeline.py` + `search.py` 动态 `getattr(repository,"search_chunks",None)` 死兜底收口为直接调用 `repository.search_chunks(...)`（contract test 已守护双实现都有此方法）。
- **设计裁决：Slice B（按域拆 god object）评估后搁置/转方案 B 候选**：service 平均跨 3-4 域（timeline 跨 7）→ 细拆后 god object 从 repository 转移到 service 签名；`DemoRepository` 已抵消 mock 痛点；项目无类型检查器 CI 不守护类型 → 细拆 ROI 不足。
- **ROI 诚实声明**：项目无 mypy/pyright（ruff 只选 E4/E7/E9/F），CI 不守护类型，本次注解收益当前只在 IDE（补全/跳转/越界提示）+ 动态调用收口 + 为类型检查器铺路；后续候选：引入 mypy/pyright 到 CI。
- **验证**：contract test **4 passed**（双实现契约守护未破）+ 全量 **301 passed / 47 deselected 零回归**（24.87s）+ ruff advisory **37** 基线不增（17 新 import 全被注解用到无新 F401）+ PR CI required 全绿（Linux backend-test 3m17s + frontend-build 24s + project-check；ruff advisory fail 不阻断）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯契约化 + 类型注解，不改对外 API 契约语义、不新增可演示能力；CQ-P1-002 聚合 bump（Slice A 契约未单独 bump + Slice C 注解）。验证：contract 4 + 全量 301 零回归 + ruff 37 不增 + PR #140 CI required 全绿。**CQ-P1-002 全闭环（Slice A RepositoryProtocol 契约 + Slice C service 注解；Slice B 按域拆搁置）**；为 CQ-P1-003 事务边界 UoW 提供 Protocol 基础。诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.5 CQ-P1-002；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 + §5 轨道C。

## v3.8.4（2026-08-11）

**维护态批7（Sprint-32）：CQ-P1-005 错误契约收口 Slice B-6 + Slice C——main.py HTTPException else 分支 code 二义收口 + 前端错误契约收口。纯契约收口、非功能，不改 Phase / 交付物范围 / 对外 API 语义。CQ-P1-005 全闭环（Slice A + B-1..B-6 + C），聚合 bump PATCH。**

- **Slice B-6 main.py HTTPException else 分支（PR #137 `226923c`）**：`main.py` HTTPException handler else 分支（FastAPI/Starlette 内置 404/405 等不带业务 code）收口——code 走新增 `HTTP_TO_CODE` 反向映射到业务码（旧实现把 HTTP 码当 code 返回，与 `07-api-spec §1`「HTTP 码与业务码分离」相悖）+ msg 固定 "request failed" 禁 `str(exc)`（NFR-007）+ 原始 detail 进 `logger.warning` 不外泄；HTTP `status_code` 保持原值。`backend/model/error_codes.py` 新增 `HTTP_TO_CODE` 反向映射。
- **Slice C 前端错误契约收口（PR #138 `c40f591`）**：`frontend/src/api/client.ts` 新增 `ApiError` class（携带 code + status，继承 Error 保留 `.message`）+ `request`/`downloadBlob` 错误改抛 `ApiError`（旧 `throw new Error(envelope.msg)` 丢失后端业务 code）；`session-store.ts` `isAuthTokenError` 改 `error instanceof ApiError && code === 4001` 判定，删正则文案匹配；`App.tsx`（2 处）+ `useDocuments.ts`（1 处）调用方传 `caughtError`。**005 ROI 兑现——前端不再靠文案判 auth。** 向后兼容：`ApiError.message === envelope.msg`，现有 catch/setError/notice 显示零改动。
- **验证**：B-6 契约 `test_error_contract` 11 passed（3 新用例：404→4004 / 405→4004 / 418→5000）+ 全量 **297 passed / 47 deselected 零回归**（294→297）+ ruff advisory **37** 基线不增；Slice C tsc + vite build 全绿（301 modules，CI frontend-build 29s）；前端无单测/smoke 基础设施（`scripts/` 空），按 build + 逻辑审查验证；2 PR CI required 全绿（Linux backend-test + frontend-build + project-check；ruff advisory fail 不阻断）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯重构 / 契约收口，不改对外 API 契约语义、不新增可演示能力；Slice B-6 + Slice C 聚合 bump，**CQ-P1-005 全闭环**。验证：B-6 全量 297 passed 零回归 + ruff 37 不增 + Slice C tsc/vite build 全绿 + 2 PR CI required 全绿。诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.8 CQ-P1-005；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。

## v3.8.3（2026-08-11）

**维护态批7（Sprint-32）：CQ-P1-005 错误契约收口 Slice B-5——auth+admin+space+space_members+users 域异常迁移继承 `ApiError` + api 层 `_status_for`/`_http_error` 收口。纯契约收口、非功能，不改 Phase / 交付物范围 / 对外 API 语义。Slice B-5 全部完成，聚合 bump PATCH。**

- **Slice B-5a space 域（PR #133 `2fd868e`）**：`service/space.py` `SpaceAccessError` 继承 `ApiError`（固定 4003，raise 文案对齐「space access denied」）+ `api/spaces.py`/`export.py`/`imports.py` 删 4 处 `SpaceAccessError` except + `service/auth_context.py require_space_member` 删 except 直接冒泡（403/4003 envelope）；保留 `api/auth.py` 登录静默回退（流程控制非错误契约）+ `service/term.py` 内部转换；清 `service/export.py` 未用 import；test_export API 级错误测试改断言冒泡；ruff 39→37。
- **Slice B-5b auth 域（PR #134 `b29661b`）**：`service/auth.py` `AuthenticationError` 继承 `ApiError`（保留 `(code, message)` 签名，raise 点零改动）+ `api/auth.py` 删 `_status_for`/`_http_error`/4 处 `except AuthenticationError`（register/login/refresh/password-reset-confirm）；保留 `_extract_token` TokenError 处理（非领域转 4001）+ 登录 `except SpaceAccessError: pass`（流程控制）+ `TOKEN_SIGNING_KEY` re-export（测试依赖，ruff F401 但不可删）。
- **Slice B-5c admin 域（PR #135 `1b13d56`）**：`service/admin.py` `AdminError` 继承 `ApiError`（保留 `(code, message)` 签名）+ `api/admin.py` 删 `_http_error`/3 处 except；保留 api 层 `raise AdminError(4220,...)`（删 except 后冒泡 handler，AdminError import 仍需保留）。
- **Slice B-5d space_members+users 域（PR #136 `d69c9d6`）**：`service/space_members.py` `SpaceMemberError` 继承 `ApiError`（保留 `(code, message)` 签名）+ `api/space_members.py` 删 `_http_error`/4 处 except + `api/users.py` 删 `_http_error`/1 处 except；异常冒泡 `main.py` handler。
- **integration 断言清扫（B-4 遗留，CI unit 门未覆盖）**：`test_api_sprint28` space_member + `test_api_routes` document/version/search/rag + `test_ai_polish` 断言全部改 ApiError 冒泡（修 7 个 B-4 遗留：test_ai_polish×2 + test_api_routes×5）。
- **验证**：全量 **294 passed / 47 deselected 零回归** + ruff advisory **37** 基线不增 + **integration 47/47 全绿** + 4 PR CI required 全绿（Linux backend-test 3m12s / frontend-build / project-check；ruff advisory fail 不阻断）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯重构 / 契约收口，不改对外 API 契约语义、不新增可演示能力；Slice B-5 各 sub-slice 聚合 bump。验证：4 个 sub-slice 全量 294 passed 零回归 + integration 47/47 + ruff 37 基线不增 + 4 个 PR CI required 全绿。**B-5 全部完成（space+auth+admin+space_members+users + `_status_for`/`_http_error` 收口）；B-6（`main.py` HTTPException else 分支 code 二义收口）/ Slice C（前端 `client.ts` `ApiError` + `session-store` 删文案判 auth）待续。** 诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.8 CQ-P1-005；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。

## v3.8.2（2026-08-11）

**维护态批7（Sprint-32）：CQ-P1-005 错误契约收口 Slice B——~35 领域异常迁移继承 `ApiError` + api 层删 except（str(exc) 清零）。纯契约收口、非功能，不改 Phase / 交付物范围 / 对外 API 语义。Slice B 全部完成，聚合 bump PATCH。**

- **Slice B-1 folder 域（PR #126 `84e4d84`）**：`service/folder.py` 4 异常（FolderValidation/Access/Conflict/NotFoundError）迁移继承 `ApiError`（4220/4003/4090/4004）+ `api/folders.py` 删 5 端点 try/except + 清 unused import。
- **Slice B-2 tag 域（PR #127 `23661f3`）**：`service/tag.py` 4 异常（TagValidation/Access/Conflict/NotFoundError）迁移继承 `ApiError` + `api/tags.py` 删 8 端点 Tag* except（保留 3 处 `DocumentNotFoundError`，document 域 B-4a 前未迁移）。
- **Slice B-3 term+term_category 域（PR #128 `2aabab1`）**：`service/term.py` 3 异常 + `term_category.py` 4 异常迁移继承 `ApiError` + 2 api 删 10 端点 except。
- **Slice B-4a document 域（PR #129 `2aa65a3`）**：`service/document.py` 4 异常（DocumentAccess/NotFound/Validation/VersionNotFoundError）迁移继承 `ApiError` + `api/documents.py` 删 document except（保留 ai_polish 域 2 except）+ **收口 B-2 遗留**（`api/tags.py` 删 3 处 DocumentNotFoundError except + `service/tag.py` 清 unused）。
- **Slice B-4b quick_entry+doc_links 域（PR #130 `4a23e58`）**：`service/quick_entry.py` 3 异常 + `doc_links.py` 1 异常迁移继承 `ApiError` + 2 api 删 except（含 DocumentNotFoundError）。
- **Slice B-4c timeline+search+rag 域（PR #131 `7f4b6f8`）**：`service/timeline.py` 2 异常 + `search.py` 1 + `rag.py` 1 迁移继承 `ApiError` + 3 api 删 except。
- **Slice B-4d export+imports 域（PR #132 `737c915`）**：`service/export.py` 5 异常 + `imports.py` 1 迁移继承 `ApiError` + 2 api 删 except；**imports 收敛 code 二义**——space access 不再转 `ImportValidationError`（msg 判断反模式），直接冒泡 space 域 `SpaceAccessError`（4003，符合 07 契约 API-011/029）；api 层保留 `SpaceAccessError` except（space 域 B-5 未迁移）。
- **验证**：各 sub-slice 单测全绿（B-1 folder 19 + B-2 tag 15 + B-3 term 23 + B-4a document+tags 23 + B-4b quick+doc_links 29 + B-4c timeline+search+rag 31 + B-4d export+imports 40）+ 全量 **294 passed / 47 deselected 零回归** + ruff advisory **41→39**（清 unused import 收益，基线不增）+ CI required 全绿（Linux backend-test / frontend-build / project-check）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯重构 / 契约收口，不改对外 API 契约语义、不新增可演示能力；Slice B 各 sub-slice 聚合 bump。验证：7 个 sub-slice 单测全绿 + 全量 294 passed 零回归 + ruff 41→39 基线不增 + 7 个 PR CI required 全绿。Slice B-5（auth+admin+space `_status_for` 收口）/ B-6（`main.py` HTTPException else 分支 code 二义收口）/ Slice C（前端 `client.ts` `ApiError` + `session-store` 删文案判 auth）待续。诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.8 CQ-P1-005；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。

## v3.8.1（2026-08-11）

**维护态批7（Sprint-32）：CQ-P1-005 错误契约收口 Slice A——错误响应契约地基（NFR-007）。纯契约收口、非功能，不改 Phase / 交付物范围 / 对外 API 语义。**

- **Slice A 错误响应契约地基（NFR-007 / task-043 / TC-P2-GOV-003）**：新增 `backend/model/error_codes.py`（`ErrorCode` IntEnum 权威码表对齐 `docs/07-api-spec.md` §1 + 集中 `CODE_TO_HTTP` 映射 + `ApiError` 领域异常基类 code/message/status_code，禁 `str(exc)` 直传）；`backend/main.py` 注册 `ApiError` handler（领域异常→envelope `{code,msg,data}`）+ 通用 `Exception` 兜底 handler（未捕获异常→`{code:5000,msg:"internal error",data:null}`，`logger.error` 记详情不外泄，不回传堆栈 / 内部路径）；顺带引入模块级 `logger`（现有 HTTPException handler 不动）。补 `tests/backend/test_error_contract.py`（8 单测含 TestClient 断言 envelope 序列化层，补 §4.2.4 回归保护）。

> PATCH 依据（`ai/project-rules.md` §2.4.1）：纯重构 / 契约收口，不改对外 API 契约语义、不新增可演示能力。验证：新单测 8/8 + 全量 294 passed（286→294，零回归）/ 47 deselected + ruff 不恶化（advisory 41 基线）+ CI Linux backend-test 294 passed。Slice B（api `str(exc)` 清零 + ~40 异常迁移继承 `ApiError` + 散落 `_status_for` 收口）/ Slice C（前端 `client.ts` `ApiError` + `session-store` 删文案判 auth）待续。诊断 `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.8 CQ-P1-005；实施口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。

## v3.8.0（2026-08-11）

**维护态批6（Sprint-31）：P0 工程治理——test DB 安全 guard（NFR-005）+ CI 最小回归门（NFR-006）。纯工程、非功能，不改 Phase / 交付物范围 / 对外 API。**

- **P0-1 测试数据库安全 guard（NFR-005 / task-041）**：新增 `tests/backend/pg_test_support.py` 三重 fail-closed guard（`LUMEN_ENV=test` + 库名 `_test` 结尾 + `ALLOW_DESTRUCTIVE_TEST_DB=1` 三条件全满足才放行，缺任一抛 `UnsafeTestDatabaseError` 不降级 skip）+ 独立 `lumen_test` 库（`docker/init-test-db.sql` + compose 挂载）+ 4 PG 测试面接入（连接 try 外 + TRUNCATE 前二次 guard）+ 根 `pytest.ini` integration marker + guard 单测 + README/backend README/demo-guide 默认命令分离。防止 PG 集成测试误清开发库 `lumen`。
- **P0-2 CI 最小回归门（NFR-006 / task-042）**：`.github/workflows/project-check.yml` 从零代码门升级到三 job——`backend-test`（pytest `-m "not integration" --strict-markers`，required）/ `frontend-build`（Node 22.17.1 + `npm run build`，含 `tsc -b`，required）/ `backend-lint`（ruff `E4/E7/E9/F`，恒 advisory）；A1：test/build advisory 起步→合并前升 required、lint 恒 advisory；B1：eslint 暂缓 P1。新增根 `ruff.toml`（py314）+ `backend/requirements-dev.txt`（pytest 9.1.1 / httpx 0.28.1 / ruff 0.15.14）。
- **CI 首跑暴露并修复 2 个潜伏 bug**：① `python-multipart` 运行依赖漏声明（`backend/api/imports.py` / `service/export.py` 用 UploadFile/Form，`requirements.txt` 补 `python-multipart==0.0.32`）；② `backend/service/llm_adapter.py` env key 大小写——`LLM_PROVIDERS` 值小写 name 但 env key 约定大写，`_build_config`/`_read_env_configs` 用 `f"LLM_{name}_*"` 拼 key 不 upper() → Linux（case-sensitive）不匹配 → fallback mock（**生产影响：Linux 部署 LLM 多通道切换失效**）；修复 `name.upper()`。

> MINOR 依据（`ai/project-rules.md` §2.4.2）：Sprint 验收 + 新增工程治理能力（CI 代码门 + 测试安全 guard）+ 2 个潜伏生产 bug 修复。验证：P0-1 guard 单测 10/10 + default unit 286 passed/47 deselected + 真实 PG integration 47 passed（`lumen_test`）+ 开发库保护；P0-2 CI 三 job（backend-test/frontend-build required、backend-lint advisory 41 基线）5 轮验证；前端 build 301 modules。口径见 `docs/research/2026-08-10-code-governance-rollout-plan.md` §3。

## v3.7.0（2026-08-09）

**维护态批5：REQ-050 成员空间可见性 + REQ-051 忘记密码 / 登录密码显隐。**

- **REQ-050 成员空间可见性（admin 用户详情抽屉）**：admin 在用户管理页点用户行打开「可访问空间」抽屉，跨空间授予 / 撤销成员资格 + 就地改空间角色（即时操作，复用 space 域成员 API + 最后一个 space admin 4090 保护）。后端新增 admin 只读查询接口 **API-054**（`GET /api/admin/users/{id}/spaces`，一次返回 `{joined, available}`，不改 `GET /api/spaces` 以免影响 admin 自身空间切换）；service `list_user_spaces_for_admin` 内存过滤，repo 零改动。
- **REQ-051 登录密码显隐（小眼睛）**：登录 / 注册密码框统一换 `PasswordInput`（受控 + 「显示 / 隐藏」toggle，复用于重置弹窗），降低 `App.tsx` 负载。
- **REQ-051 忘记密码自助重置（reset token 全链路）**：登录页加「忘记密码？」入口 → 两步弹窗（email 申请 → token + 新密码确认）。后端 **migration 018**（`lumen_users` reset 3 列 + 稀疏索引）+ service `auth_reset.py`（从 `auth.py` 拆出——auth.py 已超 service 250 阈值）+ **API-055** `/password-reset/request`（恒响应防枚举 + dummy bcrypt 恒时序；demo 无 SMTP 降级，token 写 `lumen.auth.reset` WARNING 日志）+ **API-056** `/password-reset/confirm`（token 一次性 TTL 30min + 重置成功吊销该用户全部活跃 session）。
- **安全**：reset token DB 只存 `sha256_hex`，明文仅进日志；`/request` 恒响应不泄露账号是否存在；重置吊销全部 session（跨设备安全）；`update_password` 顺带解锁。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：REQ-050 / REQ-051 均为新增可演示能力 + 3 新 API（054/055/056）+ migration 018。验证：后端 **276 tests OK**（+12：REQ-051 reset 9 + REQ-050 空间查询 3，零回归）；前端 build **301 modules 绿**；`docs/design/accounts-auth.md` §19 增量设计落盘。真 PG migration 018 应用 + 浏览器 smoke `scripts/smoke-batch5-auth-admin-browser.mjs` 待环境（Docker / demo）就绪后补。

## v3.6.0（2026-08-08）

**维护态批4：REQ-049 增强（多挂载目录 + 导入入口补充）+ UI 优化批次。**

- **多挂载目录**：`local-vault-fs.ts` IDB 从单句柄升级为句柄数组（`loadVaultHandles` / `saveVaultHandle` 追加 / `removeVaultHandle` / `clearVaultHandle`，兼容旧单值自动升级）；`useLocalVaultMount` 重构为 `mounts` 数组（每挂载独立 handle/状态/目录句柄，docs 聚合且 path 加挂载名前缀保证全局唯一）；左栏支持多次「挂载 vault」，聚合树平铺所有挂载，待重授权挂载逐个授权/移除 + 卸载全部。
- **导入入口补充**：文件夹右键补「导入全部挂载」；文件右键补「导入此篇」（不再依赖全局选中）。
- **并排布局修复**：切「并排」自动收起右栏（Inspector）释放横向空间；`editor-content-grid` grid 显式定位（工具栏 `grid-column:1/-1` 占首行，编辑/分隔/预览第二行三列）修复「4 子元素挤 3 列」导致的编辑列压窄、预览/编辑错位。
- **md 工具栏优化**：去边框紧凑分组（格式/结构/插入 + 分隔线）+ 单行滚动不换行挤压 + hover 仅文字变蓝（`:not(:disabled)` 压过 `base.css` 全局深蓝底）；块级插入改行首加前缀**保留原文**（原整行替换误删光标行文字）；代码块光标处插入不覆盖原文。
- **编辑撤销（Ctrl+Z）**：受控 textarea 使浏览器原生撤销失效，自建 undo 栈（上限 50 步，恢复内容 + 光标；切换文档/新建/保存重置）。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：多挂载为新增可演示能力。验证：前端 build 296 modules 绿；用户浏览器验收通过（多挂载平铺 / 右键导入入口 / 并排正常 / 工具栏 / 插入保留原文 / Ctrl+Z 撤销）。

## v3.5.0（2026-08-08）

**维护态使用反馈：REQ-049 本地挂载可编辑 + ⑪ 部署落地。** 三项立项中的两项已实现：

- **REQ-049 本地挂载文件可编辑（增删改查）**：放开 Phase2C「只读」边界为本地可读写。`local-vault-fs.ts` 补 `writeVaultFile` / `createVaultFile` / `deleteVaultFile` / `renameVaultFile`（Chromium `move()`）+ 目录句柄收集；`useLocalVaultMount` 补 `beginEdit/saveEdit/cancelEdit` + `createFile/deleteFile/renameFile`（写前 `readwrite` 授权、写后重建索引）；主区 `LocalDocPreview` 加「编辑」→ textarea 保存/取消；左栏 `LocalMountPane` 目录右键/「＋」新建文件、文件右键重命名 + 删除（确认弹窗）。**边界不变**：内容只写本地文件系统，不上传服务端、不进团队 RAG。
- **⑪ 部署落地（方案 A 全容器化）**：`backend/Dockerfile`（Python 3.14-slim + CPU torch + uvicorn 0.0.0.0）+ `frontend/Dockerfile`（Node 22 build → Nginx 托管 + `/api` 反代）+ `frontend/nginx.conf`（SPA fallback + envsubst）+ `docker/docker-compose.prod.yml`（postgres + backend + frontend，`env_file ../.env` 透传 LLM，DATABASE_URL 覆盖容器内）+ `docs/env/deploy-guide.md`（部署手册：步骤 / 验证 / 运维 / HTTPS / 安全）+ `.env.example` 补多配置格式示例。
- 剩余立项（REQ-050 成员空间可见性 / REQ-051 忘记密码+登录交互）待人工确认。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：REQ-049 新增可演示能力（本地文件增删改查）；⑪ 为部署工程能力。验证：前端 build 296 modules 绿；`docker compose -f docker/docker-compose.prod.yml config --quiet` 通过；真实 FSA 写文件待用户浏览器授权验收（`showDirectoryPicker` 无法 headless 自动化）。

## v3.4.0（2026-08-08）

**维护态使用反馈增强（批2）：3 项前端能力。** 使用 LUMEN 时的长文档阅读 / 编写体验增强：

- **④ 长 md 文档预览目录导航（TOC）**：新增 `markdown-toc.ts`（ATX 标题提取 + slug + 层级）；`MarkdownBlock` 支持 `showToc`——为标题注入 id（按行号与 TOC 计数对齐），渲染左侧 sticky 目录，点击滚动定位；DocumentsFeature 阅读态与 LocalDocPreview 均启用。
- **⑤ md 编辑工具栏**：新增 `markdown-editor-actions.ts`（13 个快捷插入动作：加粗 / 斜体 / H1-3 / 列表 / 引用 / 行内代码 / 代码块 / 链接 / 图片 / 分割线）；DocumentsFeature 编辑态 textarea 上方加工具栏，光标处插入语法并恢复选区（有选区时包裹）。
- **⑥ 文件夹内新建文档**：后端 `DocumentCreate.folder_id` 全链路（api / service / pg + demo repository）；前端 Draft / `handleCreateDocument` 支持 folder_id；`FolderTree` 文件夹右键加「在此新建文档」→ 新文档保存到该文件夹（不再一律落根目录）。
- 立项（待人工确认，编码时回写 02/07/09）：`docs/design/batch-maintenance-2026-08-08.md`（REQ-049 本地挂载可编辑 / REQ-050 成员空间可见性 / REQ-051 忘记密码+登录交互 / ⑪ 部署建议）。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：新增可演示能力（TOC / md 工具栏 / 文件夹内新建）。验证：前端 build 296 modules 绿；后端 311 tests OK；浏览器 smoke `scripts/smoke-batch2-ui-browser.mjs` 全绿（TOC 渲染 + 标题锚点、md 工具栏插入、文件夹内新建 folder_id 持久化）。

## v3.3.3（2026-08-08）

**维护态使用反馈缺陷修复（批1）：4 个交互 bug。** 使用 LUMEN 时逐条反馈定位：

- **① 首页新手清单做完关不掉**：`OnboardingGuide` 弹层 footer 无「× 关闭」，首页 `WelcomeFeature` 新手清单无关闭 / 收折入口。修复：弹层 header 加「×」关闭（未完成时下次登录重新弹出）；首页清单加「× 关闭」（会话内记忆）与完成态自动收起 + 「展开」。
- **② 预览本地文档后再新建，看不到新建视图**：`WorkspaceMain` 以 `localPreviewDoc` 决定渲染，`App.tsx` 仅 `selectedId !== null` 时清预览，而新建态 selectedId 保持 null → 本地预览一直显示。修复：`App.handleCreateDocument` 包装先清预览，全入口透传。
- **⑦ 文档权限选项「外部只读」出现两次**：`constants.ts` `permissionLabels` 含 4 键，`external` 与 `external_readonly` 均映射「外部只读」→ 下拉重复。后端枚举仅三值（private/team/external）。修复：移除前端遗留 `external_readonly`（类型 + labels + AI 润色只读判断）。
- **⑨ 右上角用户图标显示 `#1` 而非用户名**：登录响应不含 `name`，`Session` 无 name 字段。修复：后端 login/refresh 响应补 `name`（additive），前端 `Session.name` + `TopBar` 显示用户名，旧 localStorage 无 name 时回退 `#userId`。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯 bug 修复，不改对外 API 契约（登录响应补 name 为 additive 字段）、不新增可演示能力。验证：前端 build 296 modules 绿；后端 311 tests OK；验收记录见 `docs/09-verification.md` §5.1。

## v3.3.2（2026-08-08）

**团队 E2E 验证缺陷修复：AI 助手切换用户后对话未清空。** E2E-14（AI 助手浏览器交互）用户验证发现：同一用户切换空间时对话清空（符合预期），但登出后换账号登录，前用户 AI 助手对话及来源仍残留。

- 根因：`useSession` 登录 / 登出 / 换账号只更新 session，无回调通知 App；`aiAssistant.reset()` 仅挂在 `handleSpaceChanged`（空间切换）上，用户身份变化不触发清空 → 前用户对话（含 RAG 来源，可能指向前用户可见文档）残留给下一位用户，违反跨用户隔离红线。
- 修复：`frontend/src/App.tsx` 登录态变化 `useEffect`（依赖 `[session.session?.token]`）中追加 `aiAssistant.reset()`，登录 / 登出 / 换账号 / 鉴权失效时清空 AI 助手对话；不改 `useSession.ts`，复用既有模式。
- 验证：`volta run --node 22.17.1 npm run build` 294 modules 绿（tsc 无错误）+ 用户浏览器复测通过（alice 发消息 → 登出 → kira 登录 → AI 助手对话已清空）。
- 文档：`docs/09-verification.md` §5.1 新增缺陷登记；TEAM-E2E-001 E2E-14 浏览器交互已验。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯 bug 修复，不改对外 API 契约、不新增可演示能力。

## v3.3.1（2026-08-08）

**PG 团队 E2E 验证缺陷修复：导入文档无法删除（`DELETE /api/documents/{id}` 返回 HTTP 500）。** 团队端到端验证（`docs/env/team-e2e-verification-runbook.md`，TEAM-E2E-001）在 E2E-18 清理阶段发现：导入产生的文档删除时后端抛 500。

- 根因：`lumen_imports.parsed_doc_id` 外键无 `ON DELETE CASCADE`（`backend/migrations/004_sprint8_imports_terms.sql`），而 `PgRepository.delete_document` 只删 `lumen_documents` 依赖级联清理，imports 一路未覆盖 → 删除导入文档违反 `lumen_imports_parsed_doc_id_fkey` 约束。内存 Demo 无 FK 不受影响；versions / chunks 的 FK 均有 CASCADE，仅 imports 遗漏。
- 修复（方案 A）：`backend/repository/pg_repository.py` `delete_document` 删除前先 `UPDATE lumen_imports SET parsed_doc_id=NULL WHERE parsed_doc_id=:id` 解绑引用，不改 migration / 现有库无需迁移。
- 回归：`tests/backend/test_pg_repository.py` 新增 `test_delete_imported_document_unbinds_import_job`；PG 集成 17/17 OK + 后端全量 311 OK + 真 PG 复验（导入 → 删除 HTTP 200 `deleted:true`，imports 解绑为 NULL）。
- 文档：`docs/09-verification.md` §5.1 缺陷状态更新为「已修复（本轮）」；TEAM-E2E-001 状态 BLOCKED → PASS WITH ISSUE；新增 `docs/env/team-e2e-verification-runbook.md`（团队 E2E 验证 SOP）。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯 bug 修复，不改对外 API 契约、不新增可演示能力。

## v3.3.0（2026-08-08）

**维护态批次批3（Sprint-30，REQ-008 扩展）：AI 助手悬浮窗 + 「基于知识库」开关 + 多轮对话 + LLM 多通道切换（TC-P2-ASSIST-001）。** 右下角新增 AI 助手悬浮窗（悬浮图标 → 对话抽屉），支持多轮对话与「基于知识库」开关（勾选 = RAG 检索增强问答带来源；关闭 = 通用对话不检索）；命令面板「问 AI」改为直接打开抽屉并带入问题。同时把 LLM 通道做成**多配置可切换**（`.env` 的 `LLM_PROVIDERS` 命名配置，deepseek / glm / gpt，新增 `deepseek` provider），抽屉底部可下拉切换通道，避免单一中转 / 模型达上限后卡死。

- API（向后兼容）：`POST /api/query` 请求体扩展 `history`（多轮对话历史，前端维护路径 A）+ `use_knowledge_base`（RAG / 通用对话开关）+ `llm_provider`（命名 LLM 通道）；新增 `GET /api/llm-configs`（脱敏配置列表，不含 api_key）。
- LLM 多配置（`llm_adapter`）：`LLM_PROVIDERS=name1,name2`（第一个默认）+ 每项 `LLM_<NAME>_PROVIDER/BASE_URL/MODEL/API_KEY`；旧单配置兼容为 default；新增 `deepseek` provider；`load_config(name)` / `list_configs()`。
- 前端：`AiAssistant` 抽屉（对话区 / 答案来源可点开文档 / 多轮 / LLM 通道下拉 / 全局 Esc 收起）；`useAiAssistant` 维护多轮 state；命令面板「问 AI」开抽屉预填；空间切换清空对话。
- Demo 环境：`run-sprint16-demo.ps1` 新增加载 `.env` 注入后端进程（原不加载致 LLM 全降级），demo 现可走真实 deepseek 通道。
- 修复：`_resolve_chat_fn` 闭包绑定 LLM config，避免显式切换通道后仍走默认通道（demo 曾复现）。
- 验证：`test_rag.py` +7 + `test_llm_adapter.py` +6 → backend discover **310 OK**；`volta run --node 22.17.1 npm run build` **294 modules 绿**；`scripts/smoke-ai-assistant-browser.mjs` **PASS**（切 deepseek 通用对话真实出文）；用户浏览器验收通过（2026-08-08）。

> MINOR 依据（`ai/project-rules.md` §2.8.2）：新增可演示能力（AI 抽屉 + 通用对话 + 多轮 + LLM 多通道切换）+ 新增 API endpoint（GET /api/llm-configs）。REQ-008 扩展不另编号（用户确认）。

## v3.2.0（2026-08-07）

**维护态 UI 改进批次（Sprint-29，REQ-048 术语领域树 + 批2b 步2 标签 CRUD + 批1 顶栏 + 批2a 命令面板，TC-P2-TERM-001）。** 项目收尾进入维护态后的一批前端体验增强：术语管理从平铺列表升级为**领域树组织 + 阅读/编辑态分离**，标签补齐重命名/描述/颜色/归档前端接线，顶栏图标语义化 + 左右栏折叠箭头，全局搜索命令面板（Ctrl+K / ⌘K）。

- 数据契约（migration 017）：新增 `lumen_term_categories` 术语领域树表（嵌套邻接表 `parent_id` 自引用，仿 folder-tree）+ `lumen_terms` 扩 `category_id` / `category`（内容分类） / `source`（术语来源）三可空字段（向后兼容）。
- API：新增 API-051 `GET/POST /api/term-categories` / API-052 `PATCH/DELETE /api/term-categories/{id}` / API-053 `POST /api/term-categories/reorder`（领域树 CRUD / 移动防环 / 排序 / 删非空 4090 / 同 parent 重名 4090）；API-012/013 扩 `category_id` / `category` / `source` 请求·响应字段（`category_id` 跨空间 → 4220）；领域树不独立设权限（复用 folder 口径）。批2b 步2：`PUT /api/tags/{id}`（重命名/描述/颜色）+ `DELETE /api/tags/{id}`（归档）前端接线（API-027，后端早已实现）。
- 术语管理（REQ-048）：左栏「全局术语固定区 + 空间领域树」（右键新建领域/子领域/重命名/排序/删除/「在此新建术语」预填领域；上下分区可拖拽调高）；主区单一详情面板（阅读态：名称 + 状态/全局/领域/分类徽标 + 定义/别名/来源；编辑态：领域下拉 + 内容分类 datalist 候选 + 来源字段）；全局术语只读。
- 标签 CRUD：标签项 hover「✎」→ 内联编辑（名称/描述/颜色 + 保存/取消/归档）；归档确认后从列表移除、关联文档保留（后端 DELETE 实为 archived）。
- 顶栏（批1）+ 命令面板（批2a）：顶栏图标迁移内联 SVG + 左右栏边缘折叠箭头（PaneEdgeToggle）；`Ctrl+K`/`⌘K` 全局搜索命令面板（即时搜索 + 键盘导航 + 跳转/操作 + 「问 AI」入口）。
- 验证：`tests/backend/test_term_category.py`（18 例）+ `test_term.py` 扩字段回归（2 例）→ backend discover **298 OK**（skipped=2）；真 PG migration 017 应用（`init_db()` schema 校验）；`volta run --node 22.17.1 npm run build` **291 modules 绿**；运行时 API smoke（领域建树 / 术语挂领域 / term_count / 标签 CRUD）；用户浏览器验收通过（术语领域树 3 轮反馈迭代 + 批2a + 批2b 步2）。

> MINOR 依据（`ai/project-rules.md` §2.8.2）：新增可演示能力（REQ-048 术语领域树）+ 新增 API endpoint（API-051..053）。

## v3.1.0（2026-08-07）

**Sprint-28 角色分层 + 用户管理 + 团队空间加入（Phase2D 收口，REQ-045/046/047，TC-P2-ACC-002，task-040）。** 在 Sprint-26 账号体系 + Sprint-27 权限底座上补齐团队治理能力：全局角色分层（`lumen_users.role` admin/member）、admin 域用户管理后台、space 域成员管理（按 email 添加 / 改空间角色 / 移除）。

- 数据契约（migration 016）：`lumen_users.role`（默认 member + CHECK）+ seed 对齐（alice=admin / kira·brightlite-member=member）+ `lumen_space_members.created_at`（支撑 API-046 `joined_at`）。
- API：新增 API-044 admin 用户列表 / API-045 改角色·禁用启用 / API-046..049 空间成员 CRUD / API-050 受限用户搜索；登录响应新增 `role`（additive）；错误码 4003/4004/4030/4090/4220。
- 安全：管理接口仅全局 admin 或空间 admin（member 4030，demo 仓储不旁路）；不返回 `password_hash`；禁用后登录 4030 且既有会话失效；最后一个空间 admin 降级 / 移除 4090（C-ROLE-006）；审计事件（user_role_changed / user_status_changed / member_added / member_role_changed / member_removed）。
- 前端：用户管理页（admin 域入口「用户管理」+ 列表 / 过滤 / 行内改角色 / 禁用开关）+ 空间设置成员管理（email 搜索添加 / 改角色 / 移除确认）；管理入口按角色显隐（member 不可见）。
- 实现偏差（`docs/design/accounts-auth.md` §18.9）：API-044/046 契约草案分页（`page?` / `{items,total,page}`）未实现，实际为扁平 `{code,msg,data:[...]}`（3-5 人团队规模）；API-045/048 响应不含 `updated_at`（用 `last_login_at` / `joined_at`）；`last_login_at` 为只读展示列，未实现显式排序；refresh 响应未附带 `role`（仅登录响应）。
- 验证：backend discover 275 OK（skipped=2）；`volta run --node 22.17.1 npm run build` 绿；`node scripts/smoke-sprint28-role-admin-browser.mjs` PASS（admin/member 双视角 + API 矩阵：member 4030 / 改角色 / 禁用登录 403 / 重复添加 409 / 最后一个 admin 4090 / 搜索 4030 / 移除后失权 4003）。

> MINOR 依据（`ai/project-rules.md` §2.8.2）：Sprint 验收 / 里程碑交付 + 新增 API endpoint（API-044..050）。

## v3.0.0（2026-08-07）

**Sprint-26 账号体系基础（Phase2D 首个 vertical slice，REQ-040/041/042，TC-P2-AUTH-001）。** 把 Demo 占位账号侧（无密码 / seed 用户 / 手撸 token）升级为真实多用户账号体系：注册（bcrypt 哈希 + 默认个人空间）、凭证登录（API-001 login 契约变更）、登出 / token 刷新轮换 / 多设备会话管理（不透明 token + `lumen_sessions`，token 只存 SHA-256 摘要，TTL 8h / 滑动续期 / 撤销幂等）。

- 数据契约（migration 014）：`lumen_users` 扩列（email / password_hash / status / last_login_at / failed_login_count / locked_until）+ `lumen_sessions`；`lumen_vault_mounts` 顺延 015。
- API：新增 API-039 register / API-040 logout / API-041 refresh / API-042 sessions / API-043 revoke；API-001 login 契约变更（`login_id`/`password` + bcrypt verify）；错误码 4010/4030/4090/4220/4004 映射。
- 安全：bcrypt cost 12（RG-011 Go）；登录失败锁定 5 次 / 15min（RG-012）；统一错误防枚举（RG-013）；结构化审计日志（register / login_success / login_failed / login_locked / logout）；统一 `get_current_user` 收敛 13 router；`LUMEN_ENV=production` 下 demo 仓储 fail-fast。
- 实现偏差（`docs/design/accounts-auth.md` §15）：`current_space_id` 补列；seed 用户 demo 密码 `demo-pass-1234`；`LUMEN_ENABLE_DEMO_AUTH` 未实现（demo 模式由仓储类型决定）；前端登录/注册为内联 tab 而非独立路由。
- 验证：`tests/backend/test_auth.py` 20/20 + backend discover 222 OK（skipped=2）；`volta run --node 22.17.1 npm run build` 273 modules 绿；`node scripts/smoke-auth-browser.mjs` PASS（注册 / 登录 / 登出 / refresh 轮换 / 多设备会话撤销）；demo 启动验证通过（18000/5173）。

> MAJOR 依据（`ai/project-rules.md` §2.8.1 / `docs/design/accounts-auth.md` §13）：Phase2C → Phase2D Phase 跨越 + API-001 login 对外契约破坏性变更。

## v2.2.0（2026-08-06）

**Sprint-25 帮助手册 L0+L1（REQ-011 可用性收口，TC-P2-HELP-001）+ 验收期 2 修复。** 把 `docs/env/user-guide.md` 重组成任务导向的唯一内容源（开始使用 → 把资料放进知识库 → 找到内容 → 组织与维护 → 导出与分享 → 权限 → 能力边界 → FAQ），并把「导入」入口修正为弹窗形态、标注 Phase2B/2C 章节待补；前端补齐首次引导、新手清单、各视图空状态入口与顶栏帮助速查弹层。

- L0 内容源（task-036）：`docs/env/user-guide.md` 任务导向重组为唯一内容源，保留全部既有事实，修正导入入口为弹窗形态。
- L1 首次引导：`app/onboarding-store.ts`（localStorage `lumen-demo-onboarding`，不可用降级）+ `features/OnboardingGuide.tsx` + `styles/onboarding.css`，登录后一次性 3 步引导（新建文档 → 保存后去搜索 → 去问答提问，可跳过，全部完成持久化不再弹出）。
- L1 新手清单 / 提示：欢迎页 3 步进度 +「示例文档未建索引」提示；搜索 / 问答空态「去新建文档 / 去导入」按钮；标签 / 时间线空态入口。
- L1 帮助速查：顶栏「?」弹层分类速查 + 轻量过滤（可检索「导入」）+「查看完整手册」链接（单一来源）。
- 验收期修复 2 缺陷（`docs/09` §5.1）：帮助弹层无法关闭（新增点击外部 / Esc /「×」三种关闭方式）；搜索 / 问答空态按钮被纵向拉伸（`align-content: start` + `align-items: center`，实测 294px → 30px）。
- 验证：`volta run --node 22.17.1 npm run build` 273 modules 绿；`node scripts/smoke-help-onboarding-browser.mjs` PASS（登录 → 3 步引导 → 未建索引提示 → 空态按钮 → 帮助过滤 10→3 → 跳过持久化）；CDP 实测修复生效；人工新用户路径 smoke 确认通过（2026-08-06）。`docs/08` / `docs/09`（TC-P2-HELP-001 + §5.1）/ `task-036` 落盘。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收（Sprint-25）+ 新增可演示能力（首次引导 / 帮助速查）；向后兼容，不改 API / 后端 / DB 契约。

## v2.1.0（2026-08-06）

**Sprint-24 子树导入 UI（REQ-018 模式 B 增强）+ 验收期 2 修复。** 本地挂载目录树支持「导入此文件夹」子树导入（目录 + 子目录 + 文件，`preserveStructure:true` 保留目录结构），补齐 task-033 留的子树导入 UI 尾巴；按主流交互设计（Obsidian / VS Code 目录行 hover 操作、Drive / Dropbox 批量确认 + 进度 + 结果）提升批量导入体验。

- 子树导入（task-035，TC-P2-VAULT-002）：`LocalMountPane` 目录行 hover 浮现「⤓ 导入」按钮（原生 button + aria-label + stopPropagation 不触发折叠），点击导入该子树到 LUMEN，复用 API-029（不改契约）；`useLocalVaultMount` 的 `LocalMountTreeNode` 增加 `path` 字段（`buildLocalMountTree` 填充目录路径前缀，root 为空串），供子树筛选。
- 导入体验增强：子树 ≥2 文件或「导入全部」时内联确认条「将导入 N 个文件到 LUMEN（保留目录结构）」+ 确认 / 取消；单篇导入不打扰；进度带范围标签（正在导入「xxx」… done/total）；完成后提示去向「已入上层 DB，保留目录结构，可在文档视图查看」+ 成功 / 失败 / 跳过计数；`onImported` 刷新 DB 文档列表。
- 验收期修复 2 缺陷（`docs/09` §5.1）：上下分隔条拖动方向反转（`useLocalMountHeight` 符号修正）；首页空左栏（`App.tsx` 左栏视图感知）。
- 验证：`cd frontend && volta run --node 22.17.1 npm run build` → 270 modules 绿（tsc + vite）；TC-P2-VAULT-002 人工 smoke 4 项全过（①子树导入 hover+确认+进度+去向 ②目录结构保留 ③单篇不确认 ④整库+导入中禁用）；`docs/08`（Sprint-24→已完成）/ `docs/09`（§2 矩阵 + §5 验收 + §5.1 缺陷）/ `task-035` 验收落盘。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收（Sprint-24）+ 新增可演示能力（子树导入）；向后兼容，不改 API-029 / 后端 / DB 契约。

## v2.0.0（2026-08-06）

**Phase2C 首个能力：REQ-018 模式 B「本地 Vault 仅本地挂载」（Sprint-23C）。** 让涉隐私 / 不愿入库的本地知识库（Obsidian vault / 本地 Markdown 文件夹）在 LUMEN 内以「仅本地挂载」方式一并浏览与本地搜索，数据不出本机；可按需把单篇 / 子树 / 整库导入 LUMEN 获得完整能力。纯前端（浏览器 File System Access + 原生 IndexedDB），后端零新 API。

- 数据层（task-031）：`local-vault-fs.ts`（FSA 句柄获取 / 授权 / 递归遍历过滤 / 原生 IndexedDB 持久化句柄 / 刷新 `queryPermission`→granted 自动恢复）+ `local-vault-index.ts`（vanilla 倒排索引 + ranked 本地搜索，中文单字可搜）。零第三方依赖。
- UI（task-032）：左侧文件管理器 documents 分支新增「本地挂载」分区（下层·未入库），与上层 LUMEN DB 视觉隔离；`LocalMountPane`（目录树 / 本地搜索 / 未入库徽标）+ `useLocalVaultMount` hook（页面加载无感恢复）；上下分区垂直分隔条可拖拽调高（`useLocalMountHeight`，复用 usePaneWidth 垂直版）。
- 主区本地预览：点本地文件在中间主区渲染 markdown（`LocalDocPreview`，只读，标注本地·未入库·不上传）；左栏不再显示预览，避免遮挡目录；DB / 本地预览互斥联动。
- 按需导入（task-033，走 API-029）：单篇 / 整库导入到 LUMEN，复用 `importBatchDocuments`（`preserveStructure` 保留目录结构），导入后获完整搜索 / RAG / 团队能力。
- demo / dev host：前端访问 `127.0.0.1` → `localhost`（FSA secure context 硬前提）。
- 硬天花板（不变）：浏览器句柄后端读不到，仅本地挂载内容**不进服务端 RAG / 全文搜索**；要 AI 能力须走按需导入（模式 A）。
- 验证：tsc build 270 modules 绿；`smoke-local-vault-index.mjs` 8 断言（含单字搜索）；`smoke-vault-local-mount-browser.mjs` CDP 验证前提（secure/FSA/IDB）+ 分区 UI；用户人工 smoke（2026-08-06）TC-P2-VAULT-001 六口径全过（①授权+刷新恢复 ②本地树 ③本地搜索含单字 ④分区隔离 ⑤主区预览+按需导入 ⑥Network 零上传）；`docs/09-verification.md` §2/§5/§6 回写。

> MAJOR 依据（`ai/project-rules.md` §2.8.1）：Phase2B（团队 MVP）→ Phase2C（本地知识源接入）交付物形态跨越，同 Phase2A→Phase2B 的 MAJOR 惯例；REQ-018 从 `[愿景]`→`[P2]` 实质性阶段升级。

## v1.7.5（2026-08-05）

**Phase2B 收口后 UI 收口批次。** 修复左右栏宽度不可调 / 不持久、编辑保存后不自动回阅读态（连点易产生多余版本）、左侧目录右键缺「删除文档」入口、快速录入抽屉过窄、搜索视图输入栏大空档；附带编辑器留白、编辑工具栏视觉（去框 / 防按钮竖排）、顶栏面板图标与帮助入口、左侧栏图标语义化 + 收起/展开切换 + 显示当前文件、右栏重复标题去除、AI 润色模式紧凑分段控件、移除 9 处用户可见 REQ 角标（代码注释与 docs 保留追溯）。

- 左右栏拖拽调宽 + 持久化：新增 `frontend/src/app/pane-width-store.ts`（localStorage `lumen-demo-pane-widths`，左 180–420 / 右 220–480，默认 240）与 `usePaneWidth.ts`（pointer capture、←/→ 键盘 10px、双击复位）；App 左栏与文档右栏各加 `.pane-resizer` 分隔条，`.workspace-layout` / `.document-view-grid` 改 4 / 3 列；responsive 小屏隐藏分隔条并修正列位。
- 保存自动回阅读态：`useDocuments.ts` 保存成功自增 `savedRevision`，`DocumentsFeature` 收到信号且非新建态时 `setDocumentMode('read')`；连点「保存」不再产生多余版本（另有 `isBusy` 守卫防重复提交）。
- 删除入口迁移：左侧目录文档行右键菜单新增「删除文档」（danger 项，confirm 确认，可删任意树内文档）；编辑工具栏删除按钮移除。
- 快速录入抽屉：`quick-entry.css` 宽度 `min(420px, 92vw)` → `min(560px, 94vw)`。
- 搜索视图布局：`panels.css` `.search-panel` 改三行网格（工具栏 / 输入栏 / 结果区），关键词输入栏紧贴标题，消除底部大空档。
- 验证：`volta run --node 22.17.1 npm run build` → 262 modules 绿；用户本机 Chrome/Edge smoke 覆盖清单全部通过（拖拽变宽 / 刷新保持 / 右栏唤出 / 保存回阅读 / 右键删除 / 抽屉 560px / 搜索紧贴标题）；`docs/09-verification.md` §5 / §5.1 回写验收与缺陷记录。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：bug 修复 + 纯前端 UI 收口，不改 API / DB / 测试契约。

## v1.7.4（2026-08-05）

**Obsidian wikilink 兼容性修复（别名 / 锚点）+ REQ-018 模式 A 收尾入库。** 让 `[[目标|别名]]` / `[[目标#锚点]]` 两种 Obsidian 常见写法能解析到 `目标` 文档，并把模式 A 评估报告与 vault 导入 smoke 脚本正式入库。

- wikilink 修复（PR #107，REQ-026）：`backend/service/document.py` `_WIKILINK_PATTERN` 改为只捕获标题部分并剥离 `|alias` / `#anchor`——之前 `[[目标|别名]]` / `[[目标#锚点]]` 整段文本作为 target 匹配不到文档，永远 unresolved；现在两种写法（含 `[[目标#锚点|别名]]`）都解析为 `目标`，同目标去重为一条；`[[#锚点]]`（仅当前文件内标题）不再产生伪目标。
- 测试与验收：`tests/backend/test_doc_links.py` 补 3 条 extract 断言 + `test_sync_wikilinks_strips_alias_and_anchor`；`docs/09-verification.md` §5.1 补缺陷记录、TC-P2-LINK-001 测试数 8→9。
- 收尾入库：REQ-018 可行性评估报告登记 `docs/research/00-index.md` §1（模式 A 导入链路已交付、模式 B 零代码待 RG-009）；`scripts/smoke-vault-import-demo.py` 作为模式 A 可复用 smoke 入库。
- 版本收尾：补打 `v1.7.2` / `v1.7.3` 注解 tag（v1.7.0~v1.7.3 现均带 tag 并已推 origin）。
- 验证：`test_doc_links` 9/9 OK；后端全量 210 OK；`compileall` OK；PR #107 CI（project-check）通过。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：bug 修复（wikilink 解析）+ 文档 / 脚本入库，不新增可演示能力、不改对外 API / DB 契约。

## v1.7.3（2026-08-05）

**REQ-018 模式 A（Obsidian vault 导入）收尾 + 真实 PG 搜索/RAG smoke。** 修两个 Obsidian 导入的小缺口让 vault 导入完整可用，并补一个验证脚本确认导入到真实 PG 的数据能搜、能问答（内存 demo 下搜不出）。

- 缺口①（PR #106，REQ-018 模式 A）：`backend/service/imports.py` 的 `import_batch` 批末回扫整个 space 的 wikilink（`sync_document_wikilinks` 幂等 replace，保留 manual 链接），补建「先导入引用后导入 / 跨批上传」残留——之前按导入顺序逐篇解析，先导文档引用后导文档会 unresolved 且永不回填。
- 缺口②（PR #106，REQ-018 模式 A）：`frontend/src/features/ImportFeature.tsx` 加纯函数 `filterImportable`，在单文件 / 文件夹 input、拖拽三个入口过滤掉隐藏段（`.` 开头，含 `.obsidian` 元目录、`.DS_Store`）与非白名单附件——之前前端一股脑上传、后端白名单拒，用户看一堆 failed 噪音。
- 搜索/RAG smoke（`f601ecb`）：新增 `scripts/smoke-search-rag-pg.py`，导入 3 篇含特定关键词的 .md 到真实 PG，断言 embedding 写入、关键词搜索命中、RAG 真实 LLM 带来源引用——验证「内存 demo 搜不出」是演示模式限制，真 PG 下搜索 + RAG 正常工作。
- 验证：`.venv\Scripts\python.exe -m unittest tests.backend.test_imports tests.backend.test_doc_links` 20/20 OK（缺口① +2 测试）；`volta run --node 22.17.1 npm run build` 通过（缺口②，tsc + vite 259 modules）；`smoke-search-rag-pg.py` 跑通（keyword_hits=3 / rag_sources=3 / llm_real=True）；PR #106 CI（project-check）通过。
- 版本：同步 `VERSION` / `CHANGELOG.md` / `CHANGELOG-PLAIN.md` 到 `v1.7.3`。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：bug 修复（wikilink 内链）+ 体验修复（前端过滤）+ 验证脚本，不新增可演示能力、不改对外 API / DB 契约。

## v1.7.2（2026-08-04）

**导入大规模 PG perf smoke 脚本 + RISK-P1-008 perf 量化。** 补一个可复现的真实 PostgreSQL + embedding 性能 smoke，量化批量导入在 PG 下的真实耗时，回填 `09` RISK-P1-008 的 perf 结论。

- 脚本：新增 `scripts/smoke-import-pg-performance.py`，照 `smoke-timeline-pg-performance.py` 模式——直连 lumen-pg、隔离 fixture、真 `import_batch`（50/批顺序）、warmup embedding 模型、采样确认 `lumen_chunks.embedding` 写入、自动清理。CLI：`--documents`(默认 200) / `--batch-size` / `--preserve-structure` / `--max-seconds` / `--json-out` / `--keep-data`。
- perf 实测（200 文档）：~41s、~205ms/doc、embedding 已写入；每批随 `list_documents` 去重略增（9.9→10.6s/批，+7%）。1000+ 文档预计数分钟——大规模 vault 的后台异步导入留后续。
- 文档：`09` RISK-P1-008 把「PG perf 待测」替换为实测结论 + 脚本引用。
- 验证：`python -m py_compile` 通过；`--documents 5`（逻辑）+ `--documents 200`（perf）两轮跑通，`embedding_written=True`。
- 版本：同步 `VERSION` / `CHANGELOG.md` / `CHANGELOG-PLAIN.md` 到 `v1.7.2`。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：验证脚本 + 文档状态修正，不新增可演示能力、不改 API / DB 契约。

## v1.7.1（2026-08-04）

**大文件夹导入修复 + REQ-018 Vault 兼容愿景文档落地。** 修掉 1000+ 文件夹导入失败（前端一次性 multipart 请求撞 Starlette `max_files/max_fields=1000`），并把 REQ-018「Obsidian Vault 兼容」愿景文档（双模式：导入数据库 / 仅本地挂载）补入 docs，作为远期 RG-009 立项依据。

- 导入修复（PR #104，REQ-037 / REQ-039）：前端批量导入改为按 `IMPORT_BATCH_SIZE=50` **顺序**分批上传，逐批 try/catch（传输级失败记该批 failed、不中断后续批，部分成功语义），`onProgress` 实时更新进度；结果列表失败/跳过项全显、成功项截断前 50。纯前端，不改后端 API / DB。批大小取 50 而非 100-200：导入路径 embedding 同步（`pg_repository._safe_embed`，bge-small-zh CPU），单批过大有请求超时风险；50 把单批压到几秒级、part 数 ~103 远低于上限。
- Vault 愿景文档（PR #105，REQ-018，[愿景]/待 RG-009）：采纳 + 精修中断会话草稿——`design/ingestion §2.3` Flow-D-014、`04` ADR-011/Flow-010、`05` RG-009/TCD-011、`06` lumen_vault_mounts、`07` API 口径、`design/frontend-interaction` 分区、`01/02/03` REQ-018 追溯；明确「数据库权威 + 个人本地连接器」双模式，补「浏览器硬天花板」约束（仅本地挂载内容后端读不到、无法进服务端 RAG，要进 RAG 必须 agent/桌面端 或 导入 DB）。
- 状态同步：`08` Sprint-23A「候选·待编码」→「已编码（PR #104）」；`09` RISK-P1-008「待 Sprint-23A」→「✅ 已解决」。
- 验证：`volta run --node 22.17.1 npm run build`（259 modules）；`.venv\Scripts\python.exe -m unittest tests.backend.test_imports tests.backend.test_import_api` 11 OK；PR #104 / #105 CI（project-check）通过。
- 版本：同步 `VERSION` / `CHANGELOG.md` / `CHANGELOG-PLAIN.md` 到 `v1.7.1`。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：bug 修复 + 文档，不新增可演示能力、不改对外 API / DB 契约。

## v1.7.0（2026-08-04）

**PDF 下载端点 + 前端下载闭环。** 在 Sprint-18 已完成的同步 PDF 生成基础上，补齐 REQ-027 / API-019 的 artifact 下载路径：前端点击"导出 PDF"后会生成 PDF 并直接触发浏览器下载，不再只提示本机 artifact 路径。

- 后端：新增 `GET /api/export-pdf/{export_id}/download`，返回 `application/pdf` 二进制；下载时重新校验当前 token 空间、源文档可见性、导出任务状态和 artifact 目录边界。
- 安全 / 错误：不可见文档或不存在 artifact 仍按 4004 处理；任务未完成 / failed / 无 artifact 映射 4090；读取失败映射 5000；中文 / 空格文件名继续用 ASCII fallback + `filename*=UTF-8''...`。
- 前端：`frontend/src/api/exports.ts` 新增 PDF artifact 下载 client 和生成后下载组合函数；文档详情"导出 PDF"按钮改为生成后直接下载，并提示下载文件名。
- 验证：`.venv\Scripts\python.exe -m unittest tests.backend.test_export` 27/27 OK；`.venv\Scripts\python.exe -m unittest discover -s tests/backend -v` 203 OK（skipped=2，既有 embedding torch DLL 权限警告按 text-only fallback 继续）；`volta run --node 22.17.1 npm run build` 通过（259 modules）；运行态 demo API smoke 通过（OpenAPI 含下载路由，`export_id=1` 下载 9145 bytes，prefix `%PDF`）。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：新增对外 API endpoint + 用户可感知下载闭环；默认向后兼容。

## v1.6.0（2026-08-04）

**Sprint-18 单文档 PDF 导出闭环。** 完成 REQ-027 / API-019 / TC-P1-017：文档详情页可以发起 PDF 导出，后端生成绑定具体版本的中文 PDF，并记录导出任务状态。

- 后端：新增 migration 013 `lumen_doc_exports`、`DocExport` entity / ORM、Demo/Pg repository 导出记录；`POST /api/export-pdf` 同步生成 PDF 并返回 `export_id/status/artifact_path`。
- PDF 渲染：使用 ReportLab 渲染 Markdown 子集（标题、段落、列表、表格、引用、页眉页脚）；artifact 首版写入 `tmp/pdf_exports`；不可见文档不创建任务，依赖 / 字体不可用映射 5030 并标记 failed。
- 前端：文档详情工具栏新增"导出 PDF"入口，接入 `frontend/src/api/exports.ts` client，成功后提示生成路径。
- 文档：同步 `docs/00`~`09`、`docs/design/export-delivery.md` 与 `ai/project-rules.md` 中 REQ-027 / API-019 / TC-P1-017 状态。
- 验证：`py_compile` 通过；`tests.backend.test_export` 20/20 OK；backend discover 196 OK（skipped=2，embedding torch DLL 警告按 text-only fallback 继续）；`volta run --node 22.17.1 npm run build` 通过；产品样例 `tmp/pdf_exports/Sprint18 产品 PDF 验证-v1-export-1.pdf` 经 `pdftoppm` 渲染、人工 PNG 检查、`pdfplumber` 抽文本与 PIL 非白像素检查通过（`non_white_pixels=122856`）。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收 / 新增可演示能力 + 新增对外 API endpoint（API-019）；默认向后兼容。

## v1.5.2（2026-08-04）

**Sprint-20 / Sprint-22 验证债收口。** 不新增业务功能，补齐两个 release 后的可复现 smoke：Sprint-22 folder-tree 浏览器自动化点击流，以及 Sprint-20 主题时间线真实 PostgreSQL 大数据性能 smoke。

- 脚本：新增 `scripts/smoke-folder-tree-browser.mjs`，不引入 Playwright 等新依赖，使用 Node 22 内置 `fetch` / `WebSocket` 驱动 Chrome/Edge CDP；先检查运行态 OpenAPI，再创建临时 folder/document fixture，浏览器登录 `alice`，切到 Documents，验证目录树渲染、UI 新建子文件夹、UI 单文档移动，并用 API 后验 `folder_id` 后自动清理。
- 脚本：新增 `scripts/smoke-timeline-pg-performance.py`，连接真实 `lumen-pg` / `PgRepository` / `get_timeline()` 服务路径，插入隔离临时 space/user/docs/tags/links 后自动清理；620 docs + 240 links 实测 `density_events=2100`、`returned=200`、`degraded=True`、`window=week`、`elapsed_ms=2677.61`。
- 文档：同步 `docs/08-dev-plan.md` / `docs/09-verification.md` / `docs/06-db-design.md` / `docs/07-api-spec.md` / `docs/design/timeline.md` / `docs/design/folder-tree.md` / `docs/design/frontend-interaction.md` / `tasks/task-029-folder-tree-frontend.md` 中的“待补 / 未实测”状态。
- 版本：同步 `VERSION` / `CHANGELOG.md` / `CHANGELOG-PLAIN.md` 到 `v1.5.2`。
- 验证：`volta run --node 22.17.1 node --check scripts/smoke-folder-tree-browser.mjs`；`.venv\Scripts\python.exe -m py_compile scripts\smoke-timeline-pg-performance.py`；运行态 OpenAPI preflight；`scripts/smoke-folder-tree-browser.mjs` 通过；`docker ps` 显示 `lumen-pg` healthy；`.venv\Scripts\python.exe scripts\smoke-timeline-pg-performance.py --documents 620 --links 240 --max-seconds 12` 通过。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：验证脚本 + 文档状态修正，不新增可演示能力，不改 API / DB 契约。

## v1.5.1（2026-08-04）

**Release 后文档状态收口。** 修正 Sprint-20 在正式进度 / 验证文档中的滞后状态，把已 push、CI 通过和 `v1.5.0` tag 事实同步进项目事实文档。

- 文档：`docs/08-dev-plan.md` 的 Sprint-20 完成包从“本地未提交”更新为 `3e23d78` + `28843cb`，并补充 `origin/main`、`v1.5.0` tag 与 `Project Check` 成功证据；`docs/09-verification.md` 补 release 状态收口验收记录。
- 版本：同步 `VERSION` / `CHANGELOG.md` / `CHANGELOG-PLAIN.md` 到 `v1.5.1`。
- 验证：版本一致性检查 + Sprint-20 release 状态文本检查 + `git diff --check`。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯文档 / 发布状态修正，不新增可演示能力，不改 API 契约。

## v1.5.0（2026-08-03）

**Sprint-20 主题时间线可用闭环：关键词 / 标签驱动的时间线视图 + 密度热条。** 在 Phase2B 团队 MVP 范围内完成 REQ-013a / REQ-024 第二 slice，新增 API-033 与前端独立时间线视图，按候选 A 实时聚合，不引入 timeline 事件表。

- 后端（task-030）：新增 `GET /api/spaces/{id}/timeline`（API-033），实时聚合 documents / tag_links / doc_links / chunks；支持 `q`、`tag_ids`、`from`、`to`、`density`，仅返回当前用户可见文档事件；`created/updated/tagged/linked` 四类事件与 actor 规则落地。
- 数据与 demo runtime：migration 012 只增加时间索引，不建事件表；修复 runtime demo 新建 / 更新文档 `created_at/updated_at` 为空导致时间线无事件的问题。
- 前端：新增独立时间线视图、导航入口、首页入口、关键词搜索、标签入口、密度热条、事件列表和打开文档链路；兼容后端实际返回的 `external` permission 字符串。
- smoke 基础设施收口：新增运行态 OpenAPI route preflight；`run-sprint16-demo.ps1 -Detached` 改为 WMI/CIM launcher + runtime state，前端直接 `npm exec vite -- --port`，避免 AI 执行器回收后端或双端口参数干扰 smoke。
- 验证：`tests.backend.test_timeline` 7/7 OK；timeline/document/tag/doc_links 回归 38/38 OK；backend discover 190 OK（skipped=2，embedding torch DLL 权限警告按 text-only fallback 继续）；frontend `npm run build` 通过（259 modules）；运行态 API smoke 通过（OpenAPI 含 API-033，关键词 / 标签 / 空 q 422）；Edge headless CDP 浏览器 smoke 通过；demo detached 启动 / 独立 preflight / stop 回归通过。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收 / 新增可演示能力 + 新增对外 API endpoint（API-033）；默认向后兼容（不建 timeline 事件表）。

## v1.4.0（2026-08-03）

**Sprint-22 文档目录树可用闭环：导入保留结构 + 前端文件管理器 + 单文档移动。** 在 v1.3.0 的 folder-tree 后端核心之上，补齐 API-029 `preserve_structure`、前端 Obsidian 式文件管理器基础能力和 API-038 单篇文档移动。

- 导入保留结构（task-028）：API-029 默认 `preserve_structure=true`，按 `relative_paths[]` 建 / 复用 `lumen_folders` 并回填 `lumen_documents.folder_id`；`false` 保留旧标题前缀兼容；成功项返回 `folder_id`；PgRepository `_to_document` 补映射 `folder_id`。
- 前端文件管理器（task-029）：新增 `frontend/src/app/FolderTree.tsx` + `useFolders` + folders API client；左侧文件夹树支持受控菜单、点外部 / Esc / 滚动关闭、inline 新建 / 重命名、Obsidian 式简洁树样式。
- 单文档移动（API-038）：`PATCH /api/documents/{document_id}/folder`，目标 folder 必须属于当前空间；`folder_id=null` 移到根；移动只更新文档归属，不新增版本、不重建索引。前端文档行右键菜单“移动到”已接入并刷新文档列表与已加载 folder 计数。
- 输入证据：补充 `docs/inputs/images/obsidian-folder-tree-01.png` / `02.png` / `03.png` 与 `welcom page.png` 作为本轮 UI 参考素材。
- 验证：`tests.backend.test_imports tests.backend.test_import_api` 11/11 OK；folder/import/document/tag/quick/doc_links 回归 75/75 OK；`.venv\Scripts\python.exe -m unittest tests.backend.test_document tests.backend.test_folder tests.backend.test_imports tests.backend.test_import_api` 38/38 OK；`volta run --node 22.17.1 npm run build` 通过（255 modules）；运行态 API smoke 确认 API-038 可用并移动成功；用户浏览器 smoke 确认单篇文档移动无问题；push 到 `main` 后 `Project Check` success（run 30803119643）。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：新增可演示能力 + 新增对外 API endpoint（API-038）+ Sprint-22 前端文件管理器验收；默认向后兼容。

## v1.3.0（2026-08-03）

**Phase2B 第三 slice：REQ-039 文档目录树（folder-tree）后端核心。** 新增嵌套文件夹（`lumen_folders` 邻接表）+ 文档归属（`folder_id`），文件夹 CRUD / 移动（防环 / 跨空间）/ 改名（重名 4090）/ 删非空 4090 / 排序；folder 不独立设权限，文档可见性仍按 `permission` 过滤。

- 后端（Sprint-22 / task-027）：migration 011（`lumen_folders` + `lumen_documents.folder_id`）+ `Folder` entity/ORM + pg/demo repository 11 方法（pg `WITH RECURSIVE` 递归 CTE 防环 / demo 内存递归）+ `service/folder.py`（FolderView + 异常 4003/4004/4090/4220 + CRUD/移动/删非空/排序；document_count 按可见性过滤）+ API-034..037 `/api/folders`（token `current_space_id`；PATCH 用 `model_fields_set` 区分未传 / null）。
- 验证：`tests.backend.test_folder` 19/19 OK（18 service + 1 API）+ 回归 `test_tags/test_document/test_quick_entry/test_doc_links` 45/45 OK + `import backend.main` 通过。
- API 路径裁定 `/api/folders`（token current_space_id，对齐既有 tags/documents 惯例；07 原草案 `/api/spaces/{id}/folders` 已修订）。
- 越界（留后续 slice）：导入保留结构 `preserve_structure`（Flow-D-012）/ 前端文件管理器 / folder 独立权限 / 文档 `order` / folder 软删除。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收 + 新增对外 API endpoint（API-034..037）+ 新增 migration（011）；默认向后兼容（现有文档 `folder_id=null` 空间根）。

## v1.2.0（2026-08-02）

**Sprint-21 Doc-First UX 收口（slice 3a/3b/3c/3d）+ smoke 反馈修复。** 工作台从「多栏常驻工具台」收敛为「内容为中心、工具边缘化、按需呼出」的阅读器范式；文档阅读 / 编辑 / 并排三态切换，导入弹窗化，单列优先。

- slice 3a/3c（PR #97，merge `5712cef`）：栏显隐 + 默认收起 + Ctrl+B/R 唤出；首页默认落地；主区少容器视觉收口；documents 空态引导与返回；layout grid 显式锁列 hotfix（F-impl-9）。
- slice 3d（`c4cf867`）：导入入口从 ContextPane 常驻区迁到 DocumentsFeature toolbar「导入」按钮 + 居中 modal（复用 `useImport` / API-029）。
- slice 3b（`0f90974`）：文档阅读 / 编辑 / 并排三态切换（Doc-First §9.5.4）；快速录入迁 TopBar + 用户头像；右栏重构为 `DocumentInspectorFeature`（版本 / 链接 / 标签 / AI tabs）。
- smoke 反馈修复：① download 中文标题 `.md` 导出 500（`export.py` ASCII fallback + `filename*=UTF-8''` + `client.ts` 解析 + 单测）② quick-entry 默认 `create_document` + 移除 draft 入口（后端 draft 契约保留）③ 标签 inspector 内联「新建并打标签」+ 首页标签卡片 + placeholder。
- 验证：`volta run --node 22.17.1 npm run build` 通过（252 modules）；`tests.backend.test_export` 14 OK；用户 Chrome smoke G1–G26 全过；TC-P1-014 / TC-P1-015 / TC-P2-QUICK-001 回归通过。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收 / 里程碑交付 + 新增可演示能力（Doc-First 阅读器范式 + 文档三态切换）；默认向后兼容（不改后端 API / DB 契约）。

## v1.1.0（2026-07-31）

**Phase2B 首个 vertical slice：REQ-014 AI 润色 / 写作引用（后端 + 前端）。** 文档选中片段 → AI 润色 / 带来源引用 → 预览草稿 → 应用（替换选区 + 版本）/ 丢弃；数据外发风险正式通关（RG-008 升 Go）。

- 后端（Sprint-19 / task-019 后端 half，PR #89 / merge `ba78467`）：migration 010 `lumen_ai_drafts`（hash + 摘要留存，不存原文 / key）；entity/ORM/repo + `service/ai_polish.py`（polish / citation，citation 复用 RAG 权限收敛，越权 chunk 不进 prompt / 不返回）；API-028 `POST /api/documents/{id}/polish`（4001/4003/4004/4220/5030）；LLM 不可用 → 5030 不落库不编造；service 测试 9/9 + 全量后端 125 OK。**RG-008 升 Go**（05/09/ai-polish + living-doc 全量传播）；TC-P2-AI-001 后端通过、RISK-P2-005 关闭。
- 前端（Sprint-19 / task-019 前端 half，PR #90 / merge `f411c30`）：`api/aiPolish.ts` + `useAiPolish` + `AiPolishFeature`（右栏侧边栏：mode 切换 + instruction + 草稿预览 + sources + 应用 / 丢弃）+ `useTextareaSelection`（选区捕获，WSG 拆分）；`useDocuments.handleApplyPolishedContent`（替换选区 + PUT → 版本）；降级文案（5030 / 无来源 / 只读 / 选区失效守卫）；build 绿（Node 22）。
- 待办：浏览器 UI smoke（TC-P2-AI-001）待 PG+LLM 栈起来（REQ-014 vertical slice 最后闭环）；Sprint-20 时间轴（REQ-013/024）待 `docs/design/timeline.md` 定稿。

> MINOR 依据（`ai/project-rules.md` §2.8.1）：Sprint 验收 / 里程碑交付 + 新增可演示能力 + 新增对外 API endpoint（API-028）；默认向后兼容。

## v1.0.0（2026-07-30）

**Phase 跨越：Phase2A（个人知识组织）→ Phase2B（团队 MVP）。** 切阶段指针，正式进入团队 MVP 阶段。

- `ai/project-rules.md` §1 当前阶段 → **Phase2B 进行中**；AI 润色 / 时间轴从禁止清单移到允许清单；双维度 + 阶段进度更新。
- `docs/00 / 03 / 04 / 08 / 09` 当前 Phase 元信息 + `03` §3 双维度表 Phase2B 行 → **已启动（2026-07-30 切指针；RG-008 Conditional Go）**。
- Phase2B 首批：REQ-014 AI 润色 / 写作引用（Sprint-19）、REQ-013/024 时间轴（第二 slice，Sprint-20）；数据外发风险已接受（RG-008 Conditional Go，待 Sprint-19 实跑升 Go）。
- 历史记录保留原始时间点表述：`03` §4.1 Phase2A closure 证据、`09` §5 2026-07-20 closure 验收、ADR-010、`docs/research/2026-07-30-phase2b-kickoff-decision.md` 决策快照。

> MAJOR 依据（`ai/project-rules.md` §2.8.1）：Phase 跨越（Phase2A 个人知识组织 → Phase2B 团队 MVP）。

## v0.2.7（2026-07-30）

App.tsx 拆分重构（WSG 文件膨胀阈值，纯结构搬运，不改业务逻辑）。

- 抽出 `frontend/src/app/WorkspaceMain.tsx`（115 行）承接 `workspace-main` 的 views 切换（documents / search / query / terms / tags Feature + quick-entry 触发）。
- `frontend/src/App.tsx` **305 → 231 行**（低于 WSG 阈值 300），为 Phase2B Sprint-19（AI 润色侧边栏）留余量。
- 纯 JSX 搬运 + props 传递（类型用 `ReturnType<typeof useX>`）；不改任何业务逻辑、API、DB；build + tsc 绿（Node 22）。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：重构 / 结构调整，不新增可演示能力、不改对外 API 契约。

## v0.2.6（2026-07-30）

Phase2B 前端交互设计补全 + 构建环境修复（纯文档 / 配置，未切指针、未编码）。

- 补 `docs/design/frontend-interaction.md` Phase2B AI 润色交互设计：FL-P2-008（润色 / 写作引用 Flow）、CMP-P2-AI-POLISH（侧边栏组件）、PATH-P2-007（点击路径）、PG-P2-003 布局补侧边栏、§9.2.3 状态行、阶段表 / UXD 更新。
- 修复前端 build：根因 Node ≤16 与 Vite 5.4.19 不兼容（`crypto.getRandomValues is not a function`）；`volta pin node@22.17.1` 锁定项目 Node；新增 `ai/project-rules.md §2.9` 运行时版本锁定。
- 本版本不新增可演示能力、未切阶段、不改对外 API；前端 build 在 Node 22 验证绿。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯文档 / 配置修订，不新增可演示能力、未切阶段、不改对外 API 契约。

## v0.2.5（2026-07-30）

Phase2B 启动范围确认与数据外发风险接受落盘（纯文档 / 决策留痕，未切阶段指针、未编码）。

- 用户确认 Phase2B 首批范围：REQ-014 AI 润色 / 写作引用为首批核心，REQ-013 / 024 时间轴紧随作为第二 slice（REQ-014 先行，时间轴从零设计成本更高）。
- 数据外发风险接受口径落锤：允许 AI 润色将真实文档片段经公司内网中转 LLM 外发，护栏 = sources 权限过滤 + 草稿只存 hash / 摘要 + 不做敏感字段自动过滤 + 5030 / Mock 降级；`ai/project-rules.md §2.5` 升级为横切权威源，同步 `04 §1.1` / `05 §5.2` / `09 RISK-P2-005`。
- 新增 `docs/05-tech-spec.md` **RG-008（Conditional Go）** 与 **TCD-010**；REQ-014 的 `lumen_ai_drafts`（`06`）/ API-028（`07`）推进到 MVP 级已设计；新增时间轴 API-033；新建 `docs/design/ai-polish.md`、`docs/design/timeline.md`。
- 新增 `docs/08-dev-plan.md` Sprint-19（REQ-014）/ Sprint-20（时间轴）；`docs/09-verification.md` 细化 TC-P2-AI-001、新增 TC-P2-TL-001、RISK-P2-005 转 Conditional Go。
- 新增 `docs/research/2026-07-30-phase2b-kickoff-decision.md` 决策锚点；关闭 `03` PRD-C-003、部分关闭 open-items OI-001。
- **阶段指针未切**（`project-rules.md §1` 仍 Phase2A 已完成 / 未进入 Phase2B）；待 RG-008 首个 vertical slice 验证升 Go + Sprint-11 UI/WSG 门禁重跑后，再切指针并编码。
- 本版本不新增可演示能力、不改对外已生效 API 契约、不改代码，仅做 Phase2B 启动的设计就绪与决策落盘。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯文档修订 / 决策落盘 / 状态校准，不新增可演示能力、未切阶段、不改对外 API 契约；切指针与首个 Sprint 验收时再 bump MINOR / MAJOR。

## v0.2.4（2026-07-21）

Phase2A 文档漂移同步与输入评估落盘（纯文档 / 状态校准）。

- 新增 `docs/research/2026-07-20-inputs-architecture-review.md`，汇总 2026-07-20 输入材料、另一 AI 评估与本仓 Git / docs / frontend 事实核对结论。
- 同步 6 份核心 / 设计文档中的 Phase2A 状态字段，将 REQ-026 内链 / 反链、REQ-012 标签、REQ-025 快速录入统一标为 `P2-已实现`，追溯到 TC-P2-LINK-001 / TC-P2-TAG-001 / TC-P2-QUICK-001。
- 补 `docs/vision/product-vision.md` 的 v19 溯源说明；保持 Phase2B 候选、愿景项和编辑器 Spike 事项为后续待确认，不提前写成已实现。
- 本版本不新增可演示能力、不改 API / DB / 前端代码，仅做文档一致性修正与研究记录落盘。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯文档修正 / 状态校准，不新增可演示能力、不改对外 API 契约。

## v0.2.3（2026-07-20）

Phase2A 个人知识组织整体验收闭环（纯文档 / 状态校准）。

- 将 `docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 与 `ai/project-rules.md` 的阶段状态统一为 Phase2A 已完成、未进入 Phase2B。
- 补 Phase2A closure 记录：REQ-026 内链 / 反链、REQ-012 标签、REQ-025 快速录入三个 vertical slice 均已有 TC 与实现证据。
- 校准过期待确认 / 风险项：Phase2A 不再标为待确认或未实现；Phase2B 首批范围、REQ-014 AI 润色 / 写作引用、P1.5B PDF / Word-PDF / zhparser 仍待后续确认或 RG。
- 本版本不新增可演示能力、不改 API / DB / 前端代码，仅做验收状态和版本记录闭环。

> PATCH 依据（`ai/project-rules.md` §2.8.1）：文档状态校准 / 验收闭环，不新增可演示能力、不改对外 API 契约。

## v0.2.2（2026-07-19）

新增面向最终用户的《用户操作手册》（`docs/env/user-guide.md`），覆盖 Phase1 + Phase1.5 + Phase2A 全部已实现功能的日常使用操作；`demo-guide.md` 补交叉引用。纯文档，不新增可演示能力、不改 API 契约。

- 新增 `docs/env/user-guide.md`（16 节：30 秒上手 / 界面总览 / 登录空间 / 文档 / 批量导入 / 版本 / 双向链接 / 标签 / 快速录入 / 搜索 / 问答 / 术语 / 导出 / 权限 / 能力边界 / 常见问题）
- `docs/env/demo-guide.md` 定位块加 1 行交叉引用，指向 user-guide 并说明分工（起服务 + 演示 SOP vs 日常使用）
- 内容基于 `frontend/src/` 真实 UI 入口核对（按钮文案 / 字段 / 入口均对照实际组件，未经浏览器实走校验）

> PATCH 依据（`ai/project-rules.md` §2.8.1）：纯文档新增，不新增可演示能力、不改对外 API 契约。

## v0.2.1（2026-07-19）

APP-SIZE-C-011：App.tsx 主应用文件重构减压（内部改进，不新增可演示能力）。

- App.tsx 741→306 行，业务全下沉到 8 个域 hook（useWorkspace/Session/Documents/Search/Query/Terms/Import + 既有 useTags/useQuickEntry）；helpers 迁出 `session-store.ts` / `drafts.ts`
- hotfix：切换空间后保存 UI 不刷新（跨域闭包 → useDocuments 自身 `reloadDocuments(token)`）
- 模板提案回流：[ai-project-template#232](https://github.com/emily8421/ai-project-template/issues/232)（主应用文件膨胀约束规则）

> PATCH 依据（`ai/project-rules.md` §2.8.1）：重构 / bug 修复，不新增可演示能力、不改对外 API 契约。

## v0.2.0（2026-07-19）

Phase2A 个人知识组织「快速录入」交付（REQ-025，Task A 后端 + Task B 前端）。

- **REQ-025 快速录入索引条目**：30s 录标题/来源/摘要，mode=draft 保留私有草稿 / create_document 转新私有文档 / append_document 追加到已有文档；可关联 tag_ids；draft 可丢弃。
- **Task A 后端**（`f771e02`）：迁移 009 `lumen_quick_entries` + service（capture 三 mode + discard）+ API-017（POST `/api/quick-entry` + DELETE `/api/quick-entry/{id}`）；test_quick_entry 17/17 + service 回归 53 + PG smoke。
- **Task B 前端**（`bad8fe5`）：顶部胶囊 + 侧滑抽屉（标题/来源/摘要/tag_ids/mode 表单 + 结果区）+ useQuickEntry hook；build + API smoke + 浏览器 smoke 通过。
- **文档回写**：02 REQ-025 / 06 `lumen_quick_entries` / 07 API-017 / 08 完成包 / 09 TC-P2-QUICK-001 草案→已实现/通过；补 API-017 `source` 字段 + DELETE discard endpoint。
- **discard 最小版限制**：后端无 list endpoint，会话内保留最近一次草稿可丢弃，刷新/切空间丢失（持久草稿列表留后续）。
- **追溯**：REQ-025 / U-31 / API-017 / TC-P2-QUICK-001 / Sprint 完成包（08）。

> MINOR 递增依据（`ai/project-rules.md` §2.8.2）：Phase2A 内功能增强 + 新增 API endpoint，里程碑交付。

## v0.1.0（2026-07-18）

项目版本基线重定义：从模板沿用版本切换为项目自有版本语义，不沿用旧 `VERSION=v1.47.1`。

- **版本语义**：`VERSION` 自本版本起只表示 LUMEN-DEMO 项目版本；继承的 `ai-project-template` 版本由 `TEMPLATE-BASE.md` 记录。
- **基线定位**：`v0.1.0` 作为项目自有语义版本起点，承接当前 Phase2A（个人知识组织）状态，不代表新增业务功能发布。
- **同步关系**：当前已同步模板方法论 `v1.54.1`；后续模板同步继续使用 `--preserve-project-version`，避免覆盖项目 `VERSION` / `CHANGELOG.md`。
- **审计记录**：见 `sync-records/template-sync/2026-07-17-sync-template-v1.54.1.md` 及本次版本机制启用记录。

## 历史模板同步记录（保留）

> 以下内容来自双版本治理前的模板同步记录，保留用于审计和追溯；其中的版本号是 `ai-project-template` 历史版本，不代表 LUMEN-DEMO 项目自身版本。
> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。版本是发布边界，不是提案数量边界；提案收件箱增长不触发版本递增，只有合并到同步范围内并改变模板行为或下游同步判断的 PR 才判断 `PATCH / MINOR / MAJOR`。`ai/global-rules.md` 顶部仅记录全局规则自身版本。

## v1.47.1（2026-07-12）

领域模板 `TEMPLATE-BASE.md` 迁移兼容小修：基于 `agent-system-template` 真实 sync 验证，补齐旧领域溯源格式到新 `Domain standards scope` 字段的迁移，避免旧文件的“叠加的标准件范围”在首次 `--domain-template` 同步后退化为 TODO。

- `scripts/sync-template.sh` 与 PowerShell fallback 现在会识别旧版 `TEMPLATE-BASE.md` 的 `## 叠加的标准件范围` / `## Domain Standards Scope` 小节，把其中 bullet 合并迁移到新字段；若新字段已有非 TODO 内容，则优先保留新字段。
- 旧版 `base version` 也会迁移为 `Base template version`，继续保持初始母模板溯源锚点。
- `scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加旧领域范围迁移关键词断言，防止兼容逻辑回退。

## v1.47.0（2026-07-12）

领域模板版本治理（inheritance Batch 3 / C-004）：把普通派生项目的双版本保留机制扩展到领域模板线，让领域模板（如 `agent-system-template`）从母模板 sync 时保留自身 `VERSION` / `CHANGELOG.md`，并用领域版 `TEMPLATE-BASE.md` 记录继承的母模板版本与领域标准件范围，解决 2026-07-11 试跑中"每次 sync 覆盖领域版本需手动恢复"的问题。与普通派生项目版本治理（v1.46.0）是两条独立线，互不混用。

- **同步脚本**：`scripts/sync-template.sh` 与 PowerShell fallback 新增 `--domain-template`（与 `--preserve-project-version` 互斥）；启用后跳过 `VERSION` / `CHANGELOG.md`，并新增 / 更新领域版 `TEMPLATE-BASE.md`（`Lineage type: domain template` + `Domain standards scope`，首次生成留 TODO 占位，后续 sync 保留）；仓库存在领域版 `TEMPLATE-BASE.md` 时自动启用，与显式标志冲突时停止并提示。
- **角色判定**：新增 `detect_lineage_role` / `Get-LineageRole`，按 `TEMPLATE-BASE.md` 的 `Lineage type` 字段判定普通版 / 领域版（兼容 v1.46.0 旧普通版 header 嗅探）；普通派生 `--preserve-project-version` 行为不变。
- **边界验证**：`scripts/check-derived-sync.*` 按 `Lineage type` 识别角色，领域版额外校验 `Domain standards scope` 字段，仍跳过 README ↔ `VERSION` 一致性检查。
- **自检防漂移**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 把旧的 `TEMPLATE-BASE.md` 自动检测断言更新为 `detect_lineage_role` / `Get-LineageRole`，并新增 `--domain-template`、`write_domain_template_base` / `Write-DomainTemplateBase` 与领域版字段断言。
- **文档与提案**：`template-docs/domain-templates.md` §0 / §4 / §5 / §7 更新 C-004 落地状态；`_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` C-004 标 ✅、Batch 3 标部分落地；`ai/prompts/maintainers/12-sync-template.md`、`ai/commands/sync-methodology.md`、`git-guide.md` §5.5、`template-docs/scenario-guides.md` A13 / A20 与 `template-docs/derived-sync-report-template.md` 均补充领域模板角色口径。
- 回流自 `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` Batch 3 / C-004；多级同步自动化（领域模板作为领域派生项目上游）仍待后续。

## v1.46.0（2026-07-11）

普通派生项目双版本治理：新增可选的路线 A 同步模式，让普通派生项目用 `VERSION` 记录项目自身版本，用 `TEMPLATE-BASE.md` 记录继承的母模板版本，避免每次模板同步覆盖项目版本。

- **同步脚本**：`scripts/sync-template.sh` 与 PowerShell fallback 增加 `--preserve-project-version`；启用后跳过 `VERSION` / `CHANGELOG.md`，并新增 / 更新 `TEMPLATE-BASE.md` 作为继承版本记录，提交信息仍为 `sync template vX.Y.Z from ai-project-template`。
- **新项目默认**：`scripts/new-project.sh` 为普通派生项目生成精简版 `TEMPLATE-BASE.md`，README 模板关系改为“`VERSION` = 项目自身版本，`TEMPLATE-BASE.md` = 继承模板版本”。
- **边界验证**：`scripts/check-derived-sync.*` 允许同步提交修改 `TEMPLATE-BASE.md`，并在双版本模式下跳过 README ↔ `VERSION` 的模板版本一致性检查，改查 `TEMPLATE-BASE.md` 的当前同步模板版本。
- **A13 同步流程**：`ai/prompts/maintainers/12-sync-template.md`、`ai/commands/sync-methodology.md`、`git-guide.md`、`template-docs/scenario-guides.md` 与同步报告模板均补充 `--preserve-project-version`、`VERSION` / `TEMPLATE-BASE.md` 双字段和同步后续接判定。
- **边界说明**：`template-docs/domain-templates.md` 明确普通派生项目的精简 `TEMPLATE-BASE.md` 不等同于领域模板线的 `TEMPLATE-BASE.md`；领域模板版本治理仍走 inheritance / domain-template-lab 独立线。
- 回流自 `_proposals/TEMPLATE-UPGRADE-derived-project-version-governance.md`（DV-001 / DV-003 / DV-004 部分落地，试点反馈后再决定归档）。

## v1.45.7（2026-07-11）

Token 热点候选规则小落地：把首批 token hotspot 记录反复出现的 H-001 / H-003 升级为受限会话规则，减少同一任务链内重复规则读取和成功长日志回灌，同时保留首次完整规则门禁、规则变更重读和失败日志证据。

- **同会话规则复用**：`ai/session-rules.md` 新增 §3.2，明确完整规则读取仍是任务执行前门禁；仅当同一未中断会话、规则文件未变、任务链未切换且上下文可追溯时，后续 edit / amend / push / PR checks / merge closure / handoff 可复用已加载规则。
- **重读边界**：规则 / 入口文件变更、切换命令或仓库角色、长时间中断、上下文压缩、handoff 与 Git 冲突或动作不在已加载规则覆盖范围内时，必须重读相关规则；无法判断时回到完整规则读取。
- **验证摘要**：`ai/session-rules.md` §4.1 增加成功长检查的证据摘要约定，默认记录命令名、退出码 / check 结论和关键摘要，不把完整成功日志重复带入 handoff / hotspot / 回复上下文；失败、警告或人工审计场景仍保留可定位日志。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-token-hotspot-records.md` 标记 H-001 / H-003 已作为小规则落地，记录模板、正式目录规范、H-002 与后续 sync 体验优化仍保留候选。
- **自检防回归**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加同会话复用边界和验证摘要关键词断言。

## v1.45.6（2026-07-11）

领域模板独立实验入口：新增 `domain-template-lab` 命令与维护者 Prompt，让 AI 能自动识别并规划 `母模板 → 派生领域模板 → 领域派生项目` 的独立试验线，同时保持普通 `母模板 → 直接派生项目` 主同步路径不变。

- **新增命令**：`ai/commands/domain-template-lab.md`，用于“初始化领域模板实验线 / 创建派生领域模板 / 创建 agent-system-template / 试跑领域模板同步”等场景。
- **新增 Prompt**：`ai/prompts/maintainers/23-domain-template-lab.md`，定义仓库角色判定、只相邻同步、不跨层操作、两级回流和实验资产计划。
- **独立边界**：`template-docs/domain-templates.md` 明确该入口不接入 `git-guide.md` §5 主同步路径，不修改母模板 `sync-template` 语义，不让领域派生项目直接同步母模板。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` 标记 Batch 3 的母模板侧 AI 实验入口部分落地；领域 scaffold、领域同步清单和领域自检仍待独立仓库试验。
- **同步与自检**：`template-sync.json` 纳入新命令 / Prompt；`scripts/check-template.sh` 与 `scripts/check-template.ps1` 加入口断言。

## v1.45.5（2026-07-10）

Token 热点记录最小自动提醒：把候选机制中的 B+「最小同步可发现入口」落到 `ai/session-rules.md`，让 AI 在长任务收尾时自动识别并询问是否记录 token hotspot，同时保留写入确认和隐私边界。

- **自动提醒触发**：新增 `ai/session-rules.md` §4.1，覆盖完整规则读取后的长任务、模板维护 / 提案 / 文档审计 / PR / CI 闭环、大文件或长日志重复读取、用户询问 token 热点等场景。
- **写入边界**：默认只自动识别并询问，不静默创建文件；首次创建 `ai-records/token-hotspots/` 或写入记录仍需遵守 `ai/project-rules.md` §6 的确认规则。
- **隐私边界**：记录只写任务类型、文件路径、命令类别、热点判断、质量影响和优化建议；不得写入密钥、账号密码、客户敏感数据或完整对话正文。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-token-hotspot-records.md` 标记 B+ 部分落地，记录模板 / summary / 正式目录规范仍待 3–5 份记录后评估。
- **自检防回归**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加 token hotspot 触发规则和记录路径断言。

## v1.45.4（2026-07-10）

Windows 新手 smoke-test 真实体验小修：基于 2026-07-10 本地烟测结果，修正 Git Bash / WSL stub 提示、前置检查 next steps 与新建项目完成提示，避免新手在本地最小链路中误判下一步。

- **Git Bash fallback**：`template-docs/smoke-test.md` 补充 `bash` 指向 Windows / WSL stub 并报 `E_ACCESSDENIED`、`/bin/bash` 不存在时改用 `C:\Program Files\Git\bin\bash.exe` 全路径。
- **前置检查提示**：`scripts/check-prereqs.ps1` 检测 `bash` 是否真的可从 PowerShell 启动；Required 全通过时不再默认建议运行 `bootstrap-dev-env.ps1`，而是提示可继续本地项目 / smoke-test。
- **新建项目完成提示**：`scripts/new-project.sh` 完成后指向 `collect-env`、`docs/inputs/`、`ai/project-rules.md`、`/run review-inputs` 与 `/run generate-docs` 链路，与派生项目 README 保持一致。
- **提案留痕**：新增 `_proposals/TEMPLATE-UPGRADE-smoke-test-followups.md` 记录本次 smoke-test 发现、非目标、验证方式和待确认项。

## v1.45.3（2026-07-10）

SOP 去三写（减负）：使用原则 / 文档入口表 / 常见选择三段重复同一组路由（新手 / 环境 / CLI / 烟测 / 方法论）×3，措辞略不同，用户扫三遍、维护改三处。合并去重。

- **使用原则**（12→5 条）：只留原则（scenario 兜底 / Git Bash 排障 / git-guide 与 Prompt 权威 / 治理），路由指向文档入口表 + 场景索引。
- **文档入口表**：补 env-setup（成为唯一权威路由表）。
- **常见选择**（15→8 条）：只留带分支判断的决策（同步后续接 / push 预检 / 改模板 / 续接等），删纯文档路由。
- `SOP.md` 净减 11 行；`check-template.sh` 断言仍过（关键词在文档入口表 + 场景表）。

## v1.45.2（2026-07-10）

模板易填性增强与防漂移断言（UX 审核 C+D）：可填模板补范例行降低填写门槛；check-template 加回写一致性断言防未来漂移。

- **批次 C（模板范例）**：`ui-prototype-strategy-template` 各表补 `<示例>` 行 + doc-standards 权威指针；`derived-sync-report-template` 命令真实性表 + A13 判据矩阵补填写范例 + `_proposals/`↔`_archive/proposals/` 归档关系说明。
- **批次 D（防漂移断言）**：`check-template.sh` 加 7 条断言——验证 show-demo 回写到 scenario A21 / beginner §7、domain-templates 进 beginner §7、implementation-lifecycle / session-rules 进 methodology §2、glossary 含演示 SOP、scenario 索引含 A8.5（防漏场景）。

## v1.45.1（2026-07-10）

文档体验对齐与正确性修复（UX 审核 A+B）：把 v1.44.3 / v1.45.0 新能力回写到所有核心文档，修正场景码漂移与锚点 / 命令 bug，不新增能力。

- **新能力回写**：`show-demo` 回写到 scenario-guides（新增 A21 场景，引用命令不双写）、beginner-guide（§3 / §7 入口）、glossary（演示 SOP 条目，演示≠09 验收）；`domain-templates` 进 template-methodology §2 权威源表 + beginner §7 导航。
- **场景码一致性**：全仓统一「A0–A21（含 .5）/ C1–C8 / M0–M1」，删 "23 场景" 硬编码；scenario 速查索引补 A8.5；SOP 场景表对齐（补 16 漏码 + 修 A5/A6、A8/A10 共享码歧义 + 去三写冗余留待后续）。
- **正确性 bug**：git-guide 3 处锚点（§7→§8、§1.2 / §1.3→§1 第 2/3 条）+ 场景码桥接列；e2e-regression-checklist 建仓命令重复触发修复 + "bootstrap sync 脚本"改真实命令；ai-cli-setup §8 重号→§9；smoke-test / report 旧根名→template-docs/ + 步骤对齐；INIT-PROMPT 删 v1.22.2 + 补 ai/index.md 自动读取说明。
- **权威源**：template-methodology §2 补 `implementation-lifecycle-rules` / `session-rules` / `domain-templates`。
- **README**：术语表入口 + A0–A21 范围。

## v1.45.0（2026-07-10）

项目演示 SOP 与 AI 触发规则：新增 `show-demo` 命令和 `demo-runbook-template`，约定项目级演示 SOP 默认路径 `docs/env/local-demo-runbook.md`，让「查看演示效果 / 启动 Demo / 二维码 / 检查 Demo」成为一等入口。

- **新增命令**：`ai/commands/show-demo.md`——路由到项目演示 SOP，含 AI 执行边界表（只读说明 vs 启动脚本 vs 健康检查 vs 二维码 vs 安装依赖 / 外部服务）和禁止项。
- **新增模板**：`template-docs/demo-runbook-template.md`——八节演示 SOP 结构（适用范围 / AI 场景 / 启动前提 / 启动方式 / 访问入口 / 检查验证 / 推荐演示路径 / 安全与边界），明确不替代 `docs/09-verification.md`。
- **入口与定位**：`ai/commands/README.md` 命令表 + 触发词；`docs/README.md` §5 `docs/env/` 加 `local-demo-runbook.md` 命名。
- **同步与自检**：`template-sync.json` 纳入两新文件；`scripts/check-template.sh` 加 8 条断言。
- 回流自 GitHub issue #160（zhiyan-digital-cs-platform）。

## v1.44.3（2026-07-10）

领域模板可选中间层方法论独立文档：新增 `template-docs/domain-templates.md` 作为「领域模板（domain template）可选中间层」的单一权威源，主线文件零内容改动、仅加引用指针，明确「两层为默认主路径、三层为可选增强」，消除现有使用者的理解歧义。

- **新增方法论文件**：`template-docs/domain-templates.md` 固化三层模型、何时该用领域模板、三层职责边界（引用 inheritance 提案结论）、同步 / 继承关系、`TEMPLATE-BASE.md` 约定（标注未落地）和演进状态；纳入下行同步清单。
- **主线仅加引用指针**：`template-methodology.md` §5、`glossary.md` §7（新增「领域模板」术语条目）、`scenario-guides.md` A20（反向引用）、`README.md` 目录速览各加一处指针，不重写两层叙述。
- **演进中定位**：文档顶部明确领域模板层尚候选 / 演进中（inheritance 提案 Batch 2-4 未落地）、主线治理仍两层、现有派生项目无需迁移、非强制。
- **自检防回归**：`scripts/check-template.sh` 增加 `domain-templates.md` 存在、可选中间层定位、三层继承模型、主线仍两层与术语表条目断言。

## v1.44.2（2026-07-09）

领域模板派生场景引导：在 `template-docs/scenario-guides.md` 中新增 A20，用于从母模板派生独立领域模板（如 `agent-system-template`）时的路由、预检和边界判断。

- **新增 A20 场景**：明确“母模板 → 领域模板 → 具体项目”的三层关系，区分领域模板派生与普通业务项目创建。
- **创建前预检**：要求先检查 `new-project.*`、目标目录、远端仓库名、工具链和权限，再输出创建方案。
- **母模板边界**：强调不把领域 scaffold 直接塞进母模板；agent scaffold 后续应在独立 `agent-system-template` 仓库内维护。
- **自检防回归**：`scripts/check-template.sh` 增加 A20 场景和关键边界断言。

## v1.44.1（2026-07-09）

版本影响门槛收敛：将兼容、可选、默认行为不变的模板增强明确归入默认 `PATCH` 判断，避免 `MINOR` 变成功能次数计数器。

- **PATCH 默认口径**：`CONTRIBUTING.md` 明确可选脚本参数、默认关闭能力、额外自检和治理说明补强，在不改变默认行为、不要求迁移、不新增强制采用面时优先判为 patch。
- **MINOR 门槛收紧**：`MINOR` 仅用于新增能力层级或新的下游采用面，例如新增同步范围结构、必填入口、用户场景或推荐工作流变化。
- **维护 checklist**：`MAINTAINERS.md` 同步发布判断口径，PATCH 可包含兼容性脚本参数 / 默认关闭能力 / 文档与治理小修。
- **提案口径同步**：`_proposals/README.md` 和 A13 提案补充说明，`v1.44.0` 保留为旧口径历史发布；后续同类可选参数增强默认按 patch 论证。
- **自检防回归**：`scripts/check-template.sh` 增加版本影响门槛关键断言。

## v1.44.0（2026-07-09）

同步 dry-run 轻量预览增强：为 `scripts/sync-template.sh` 与 PowerShell fallback 增加 `--summary` / `--no-stat`，让大版本模板同步可跳过逐文件 diff stat，同时保留可审计边界。

- **轻量摘要参数**：`--summary` 等价于 dry-run 轻量预览；`--dry-run --no-stat` 保持兼容修饰符语义，均不修改工作区、不 stage、不提交。
- **可审计输出**：轻量摘要保留同步文件状态、目标版本、变更计数、按顶层目录聚合的新增 / 修改 / 删除 / 跳过数量，以及风险路径命中。
- **完整 dry-run 保留**：默认 `--dry-run` 仍输出逐文件 `git diff --no-index --stat`，满足需要完整 diff stat 的人工复核场景。
- **双入口一致**：Bash 入口与 PowerShell native fallback 均支持 `--summary` 和 `--no-stat`；PowerShell 正常路径继续转发到 Bash。
- **自检防回归**：`scripts/check-template.sh` 增加 summary/no-stat 烟测和关键断言，确保轻量模式不输出逐文件 diff stat。
- 回流自 GitHub issue #148 Batch 3；`--list-only` 与 `--max-stat-files N` 继续延后。

## v1.43.3（2026-07-09）

PowerShell fallback 同步参数修复：修正 `scripts/sync-template.ps1 --commit` 在 Git Bash 不可用 fallback 路径中可能误回默认 dry-run 的问题。

- **参数绑定修复**：`Invoke-NativeTemplateSync` 不再使用易与 PowerShell 自动变量 / 调用语义混淆的 `$Args` 参数名，改为 `$NativeSyncArgs`。
- **commit 路径保护**：fallback 调用显式传递 `-NativeSyncArgs $SyncArgs`，确保 `--commit` 进入 commit 分支而不是静默回到 `--dry-run`。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 sync-template fallback 参数名与传参断言。
- 回流自 GitHub issue #148；dry-run 轻量预览模式仍保留为后续候选。

## v1.43.2（2026-07-09）

A13 同步闭环门禁增强：补齐派生项目模板同步的完成判据矩阵、同步报告真实性记录和提案回流收口矩阵，避免把轻量抽查误写成完整闭环。

- **A13 收尾门禁**：`ai/commands/sync-methodology.md` 与 `ai/prompts/maintainers/12-sync-template.md` 要求最终输出 A13 完成判据矩阵；若存在轻量执行 / 未执行 / 失败项，不得称“A13 完整闭环完成”。
- **同步报告真实性**：`template-docs/derived-sync-report-template.md` 增加命令真实性记录、A13 完成判据矩阵和提案回流收口矩阵。
- **提案收口规则**：同步报告模板明确仅有 issue `closed` 不得自动归档，必须结合 VERSION / CHANGELOG / PR / issue 说明判断“归档 / 保留 / follow-up / 等待”。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A13 收尾门禁和报告真实性关键断言。
- 回流自 GitHub issue #148；本批不包含 `sync-template.ps1 --commit` fallback 修复和 dry-run 轻量预览模式。

## v1.43.1（2026-07-08）

Docs scaffold P2 Task 模板落位评估：明确 Task 文件模板若后续落地，应作为独立 `template-docs/task-template.md` 入口，而不是放入 `template-docs/docs-scaffold/`。

- **信息架构边界**：`template-docs/docs-scaffold/README.md` 明确 `tasks/` 是执行任务单目录，不属于 `docs/` 项目事实链；禁止新增 `template-docs/docs-scaffold/tasks/`。
- **提案更新**：`_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` 记录 Task 模板推荐落位、同步策略和后续落地前置条件。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 docs scaffold README 的 Task 模板边界断言。
- **版本影响**：本轮仅做同步范围内的边界说明和自检增强，不新增同步文件，按 PATCH 发布。

## v1.43.0（2026-07-08）

Docs scaffold P1 后续模板补强：补齐输入评审、产品愿景、待确认事项总览和 ADR 结构模板，让 `template-docs/docs-scaffold/` 覆盖主文档链路的上游输入、愿景、决策与 open items 常用入口。

- **输入与愿景模板**：新增 `template-docs/docs-scaffold/inputs/input-review-report.md` 与 `vision/product-vision.md`，对应 `docs/inputs/input-review-report.md` 和 `docs/vision/product-vision.md` 的长期结构副本。
- **决策与 open items 模板**：新增 `decisions/ADR-template.md` 与 `research/docs-open-items.md`，分别承接横切事实权威源和待确认事项总览。
- **导航与同步**：更新 `README.md`、`docs/README.md`、`template-docs/README.md`、`template-docs/beginner-guide.md`、`template-docs/template-methodology.md` 和 `template-docs/docs-scaffold/README.md`，统一说明 inputs / vision / decisions / research scaffold 边界。
- **同步与自检**：更新 `template-sync.json`、`scripts/sync-template.sh`、`scripts/check-template.sh` / `.ps1`，确保新增 P1 scaffold 下行同步并防止入口漂移。
- **分批治理**：P2 的 env、meetings、archive、task template 继续保留在 `_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` 候选池，不并入本版本。
- 回流自 `_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` P1 批次。

## v1.42.1（2026-07-08）

模板版本治理优化：将提案收件箱增长与模板发布边界解耦，明确 release impact / release strategy 判断，避免高频回流提案导致 `MINOR` 过快增长。

- **版本边界**：`CONTRIBUTING.md` 明确版本是发布边界，不是提案数量或编辑次数边界；新增 / 更新 `_proposals/` 默认 `Release impact = none`。
- **影响分级**：补充 `none / patch / minor / major` 决策表，区分治理文档 / 自检增强、模板能力新增和不兼容变更。
- **聚合发布**：同一提案、同一 PR、同一维护主题下的多个 Batch 默认聚合为一个版本；后续候选留在提案池，不阻塞当前发布。
- **维护 checklist**：`MAINTAINERS.md` 增加 release impact、release strategy、即时发布与同主题维护窗口判断。
- **提案头部**：`_proposals/README.md` 建议新提案声明 `Release impact` 与 `Release strategy`，让版本判断在处理前置化。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加版本治理关键文字断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-version-governance.md`。

## v1.42.0（2026-07-08）

模板易用性文档补强：将前端交互设计、UI 原型策略 / 实现前原型从分散规则提升为独立细粒度标准，补充实现前原型场景，并新增长期结构模板库与人读术语表。

- **细粒度标准**：新增 `ai/doc-standards/frontend-interaction.md` 与 `ai/doc-standards/ui-prototype-strategy.md`，分别规范前端交互设计和 UI 原型策略 / 实现前原型。
- **记录模板**：新增 `template-docs/ui-prototype-strategy-template.md`，用于记录原型形式、权威位置、覆盖范围、未覆盖项、Mock / 降级口径和验收映射。
- **场景路由**：`template-docs/scenario-guides.md` 新增 A7.5 UI 原型策略 / 实现前原型场景，区分 `00-03` 前的需求探索原型与前端实现前的可视化门禁。
- **规则联动**：更新 `ai/doc-standards/README.md`、`ai/document-lifecycle-rules.md`、`docs/README.md`、`ai/prompts/docs/00-generate-or-complete-docs.md`、`ai/prompts/docs/04-edit-single-doc.md` 和命令索引，统一引用新标准。
- **结构模板**：新增并扩展 `template-docs/docs-scaffold/`，长期保留 `docs/00-09`、`docs/design/*` 与 `docs/research/*` 的结构模板副本，区分项目事实、结构模板和 `ai/doc-standards/` 规则 / 审计基线。
- **详细设计 / 门禁模板**：新增子系统详细设计、前端交互设计、UI 原型策略、需求探索原型和技术环境评估 scaffold，覆盖实现前设计与 readiness gate 的常用结构。
- **术语入口**：新增 `template-docs/glossary.md`，按文档链路、ID / 追溯、阶段 / 交付物、状态词典、原型 / 前端交互、会话续接和模板治理 / 同步分类索引核心术语。
- **人读导航**：更新 `README.md`、`template-docs/README.md`、`template-docs/beginner-guide.md`、`template-docs/template-methodology.md` 和 `docs/README.md`，增加 scaffold 与 glossary 入口并说明三层边界。
- **同步与自检**：更新 `template-sync.json`、`scripts/sync-template.sh`、`scripts/check-template.sh` / `.ps1`，确保派生项目可同步新标准并防止入口漂移。
- 回流自 `_proposals/TEMPLATE-UPGRADE-template-usability-docs.md` Batch 1 / Batch 2 / Batch 3 / Batch 4。

## v1.41.1（2026-07-08）

快速续接优先路由：明确“读取续接点 / 继续上次 / resume”是纯恢复摘要场景时，可先按最小只读路径输出结论，避免被入口规则误扩展为完整规则审计。

- **入口裁剪**：`ai/index.md`、`AGENTS.md`、`CLAUDE.md` 与 `.cursor/rules/project-rules.mdc` 明确快速续接例外；分析、设计、编码或状态变更仍必须完整读取规则。
- **续接规则**：`ai/session-rules.md` 增加流程分流，说明快速续接只服务恢复摘要；一旦继续执行任务，立即回到完整规则读取和对应 command。
- **命令路由**：`ai/commands/README.md` 与 `ai/commands/resume.md` 明确 `resume` 不展开完整规则审计，后续执行再升级。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加快速续接例外与入口裁剪断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-fast-resume-routing.md`。

## v1.41.0（2026-07-07）

快速续接模式与 handoff stale 裁决：将“读取续接点 / 继续上次”默认限定为本地只读恢复，避免误扩展成完整规则审计、远端 issue / PR 复核或任务继续执行。

- **快速恢复**：`ai/session-rules.md` 新增快速续接模式，默认只读 `git status`、最近提交、stash、`VERSION` 和 `.ai/session-handoff.md` 摘要；不联网、不查 GitHub issue / PR、不继续执行任务。
- **过期裁决**：当 handoff 的分支、HEAD、版本或进度与 Git 客观事实不一致时，立即标记 `handoff stale`，以 Git 与当前用户输入为准，停止深挖旧记录。
- **命令路由**：新增 `ai/commands/resume.md`，并在 `ai/commands/README.md` 注册 `resume`，统一承接“读取续接点 / 继续上次”。
- **样例增强**：`template-docs/session-handoff.example.md` 增加 `Updated at`、`Status`、`Branch`、`HEAD`、`VERSION` 和 `Remote snapshot` 元数据头。
- **同步与自检**：`template-sync.json`、`scripts/check-template.sh` / `.ps1` 增加 `resume` 命令和快速续接关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-fast-session-resume.md`。

## v1.40.0（2026-07-07）

需求探索原型场景与模板：在正式 `00-03` 定稿、架构和技术路线选择前，用低保真 UI 原型、页面流、截图标注或静态 Mock 帮用户确认需求。

- **早期场景**：`template-docs/scenario-guides.md` 新增 A5.5 需求探索原型 / Demo 前原型确认场景，触发说法包括“先看原型”“先做页面原型确认需求”“先别定技术栈，先画界面流程”。
- **边界规则**：`ai/document-lifecycle-rules.md` 新增 §10.2，明确需求探索原型不是正式需求、架构、技术栈、接口、数据库、任务或验收事实；确认后必须回填 `00-03`。
- **模板与路由**：新增 `template-docs/ui-prototype-exploration-template.md`、`ai/prompts/docs/22-ui-prototype-exploration.md` 和 `ai/commands/ui-prototype-exploration.md`，默认建议落盘到 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`。
- **索引与同步**：更新 `ai/commands/README.md`、`ai/prompts/README.md`、`docs/README.md` 和 `template-sync.json`，让派生项目同步获得该场景能力。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A5.5、探索模板、命令、Prompt、同步清单和 docs 分区关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-ui-prototype-exploration.md`。

## v1.39.0（2026-07-07）

UI 原型策略与可视化验收门禁：UI 型项目在进入前端实现前需选择可视化原型策略或写明豁免，减少实现后才暴露页面结构、状态反馈、信息密度和 Demo / Mock / 降级口径问题。

- **生命周期规则**：`ai/document-lifecycle-rules.md` 新增 UI 原型策略触发与边界规则；满足前端交互触发条件且存在实现前预览、点击验收、多状态、多角色、权限可见性或 Demo / Mock / 降级误读风险时，必须选择原型策略或写明豁免。
- **项目级字段**：`ai/project-rules.md` 新增 §2.7 UI 原型策略，记录是否需要开发前可视化原型、原型形式、权威位置、覆盖范围、与 `frontend-interaction` / `08` / `09` 的关系和豁免理由。
- **标准与设计链路**：`ai/doc-standards/05-tech-spec.md` 和 `ai/doc-standards/README.md` 增加 UI 原型策略记录位，明确原型不替代 `00-09`、前端交互设计或 `09` 验收，不作为需求权威源。
- **Prompt / 场景门禁**：文档生成、单文档修订、编码前 checklist、系统审计、文档评估和 A7 场景均检查原型形式、位置、覆盖主流程 / 关键状态 / 权限与降级、设备范围、未覆盖项和豁免理由。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 UI 原型策略、原型证据、项目规则 §2.7、生成 Prompt、checklist、audit 和 evaluation 关键断言。
- 回流自 GitHub issue #131，镜像归档为 `_archive/proposals/_remote-issues/issue-131.md`，提案归档为 `_archive/proposals/TEMPLATE-UPGRADE-ui-prototype-strategy.md`。

## v1.38.2（2026-07-07）

C1 提案收件箱远端 issue 本地镜像硬门禁：防止维护者或 AI 直接基于未落盘远端 issue 正文做提案分析，确保先镜像、后分析。

- **镜像硬门禁**：`_proposals/README.md` 明确远端 issue 正文只允许用于生成 / 刷新 `_proposals/_remote-issues/issue-<number>.md`，不得直接作为去重、冲突、依赖、分批计划、拟修改文件或续接记录依据。
- **命令 / Prompt 阻断**：`template-proposal-summary` 命令和维护 Prompt 要求输出本轮本地镜像路径、`Updated` 与 `Mirrored at`；没有本地镜像路径的 issue 不得进入正文分析。
- **误读纠偏**：若 AI 已误读远端正文但尚未落镜像，必须丢弃该轮分析结论，先刷新镜像，再重新读取本地镜像继续。
- **场景与自检**：C1 场景增加“镜像路径确认后再分析”；`scripts/check-template.sh` / `.ps1` 增加镜像硬门禁、本地镜像路径和未落盘正文不得分析的关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-issue-mirror-hard-gate.md`。

## v1.38.1（2026-07-07）

GitHub issue / PR 查询鲁棒性补强：降低模板维护者处理提案收件箱时误判远端 open issue、PR 或关闭状态的风险。

- **远端状态核对**：`_proposals/README.md` 明确 GitHub `/issues` API 同时返回 issue 与 PR，PowerShell 需用 `PSObject.Properties['pull_request']` 判断普通 issue，并在关闭 / 改标签 / 评论前执行“列表 + 单项状态复核”。
- **维护 Prompt**：`template-proposal-summary` 要求 open 列表与单项状态交叉验证；若列表与单项状态冲突，以单项状态和 GitHub 页面为准并先报告。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 GitHub issue 稳定过滤与单项状态复核关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-github-issue-query-robustness.md`。

## v1.38.0（2026-07-07）

Batch 6 `docs/design/*` 通用详细设计标准落地：补齐非平凡子系统、复杂 UI、权限 / 安全、AI / 外部服务、导入 / 异步任务和高风险愿景能力的详细设计基线。

- **design 独立标准**：新增 `ai/doc-standards/design-doc.md`，覆盖触发 / 豁免、元信息、职责边界、上游追溯、流程 / 状态机、数据 / 接口 / 权限契约、失败 / 降级、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项。
- **分类 checklist**：内置服务型、页面 / 交互型、权限 / 安全型、AI / RAG / 外部模型型、导入 / 异步任务 / 外部集成型、策略 / 规则型、配置型和高风险愿景型裁剪要求。
- **生命周期门禁**：`document-lifecycle-rules`、`global-rules`、`project-rules` 明确 `docs/design/*` 触发、豁免、不得新增需求 / 接口 / 表 / 验收目标，以及实现偏差正式回写边界。
- **Prompt / command 路由**：生成、单文档修订、代码反向同步、编码前 checklist、文档体系审计和文档评估均读取 design 标准并检查元信息、追溯、readiness gate、验收路径和实现偏差区。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 纳入 `ai/doc-standards/design-doc.md`，并增加 design 标准、Prompt 引用和派生同步烟测断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-6-design-doc-standard.md`，对应 GitHub issue #110、#116。
## v1.37.0（2026-07-07）

Batch 5 开发计划、验证证据与正式回写闭环落地：补齐 `08-09` 独立细粒度标准，强化 Sprint 验证包、完成包、TC 详情、验收证据、缺陷 / 回归和 handoff 边界。

- **08-09 独立标准**：新增 `ai/doc-standards/08-dev-plan.md`、`09-verification.md`，覆盖 Phase 目标、Sprint 总览、验证包、完成包、任务拆分规则、REQ → TC 追溯、TC 状态、用例详情、验收记录、Sprint 验收包、缺陷 / 回归和风险项。
- **模板骨架增强**：`docs/08-dev-plan.md` 与 `docs/09-verification.md` 增加更精确的 Sprint / Task / TC / 完成包字段，并明确 `08` 管计划 / 进度摘要、`09` 管验证证据 / 验收记录。
- **回写与续接边界**：`implementation-lifecycle-rules`、`session-rules`、`sprint-summary`、`run-dev-task`、`phase-upgrade` 和 `sync-docs-from-code` 强调 handoff 不替代正式 `08/09` 记录，长期事实需回写或说明暂不落盘原因。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-09` 独立标准直接同步，移除 docs→doc-standards 兼容镜像的实际条目。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-5-dev-plan-verification-evidence-handoff.md`，对应 GitHub issue #108、#109、#115。

## v1.36.0（2026-07-07）

Batch 4 DB / API 契约状态与升阶段门槛落地：补齐 `06-07` 独立细粒度标准，强化字段级、endpoint 级和 DB / API / TC 交叉追溯。

- **06-07 独立标准**：新增 `ai/doc-standards/06-db-design.md`、`07-api-spec.md`，覆盖数据对象、概念模型、字段级契约、目标 / 当前实现对照、迁移 / seed / 回滚、API-ID、endpoint contract matrix、请求 / 响应 / 错误 / 权限 / 兼容契约和异步状态机。
- **模板骨架增强**：`docs/06-db-design.md` 与 `docs/07-api-spec.md` 增加目标结构与当前实现对照、契约状态、DB / API 交叉追溯、API ↔ DB / Service / Test 映射和 Phase 升级所需验证入口。
- **生命周期与 Prompt 门禁**：生成、修订单文档、体系审计、文档评估、Phase 升级和单任务执行均检查 DB / API 契约状态，防止草案、候选、Mock、默认关闭或目标设计被当成当前实现或稳定契约。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-07` 独立标准直接同步，`08-09` 暂保留兼容镜像，待 Batch 5 替换。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-4-db-api-contract-status-gates.md`，对应 GitHub issue #107、#114。

## v1.35.0（2026-07-07）

Batch 3.1 文档标准分层落地：明确 `ai/doc-standards/` 是细粒度标准源，补齐 `00-03` 独立标准，并让 `docs/00-09` 回归项目事实大纲模板。

- **00-03 独立标准**：新增 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md`，吸收 Batch 2 的需求链细则和 Batch 1 / 7 的状态、待确认与生成门禁规则。
- **标准分层**：`ai/doc-standards/README.md` 与 `ai/document-lifecycle-rules.md` 明确 lifecycle / doc-standards / docs 大纲三层职责，以及按生成、精修、审计、评估 scope 读取对应标准。
- **docs 大纲轻量化**：`docs/00-09` 每个 H2 章节统一使用 `【撰写提要：……】`，保留填写提示和占位表格，复杂规则进入 doc-standards。
- **Prompt / command 路由**：生成、单文档修订、系统审计、文档评估、编码前 checklist 和 docs-evaluation 命令改为按范围读取对应 `ai/doc-standards/<doc>.md`。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-05` 独立标准直接同步，`06-09` 暂保留兼容镜像，待 Batch 4 / 5 替换。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-3-1-doc-standards-layering.md`。
## v1.34.0（2026-07-07）

Batch 3 架构与技术方案 readiness 规范落地：强化 `04-05` 总体设计、技术风险验证、依赖矩阵和 Phase / Sprint 前门禁。

- **04-05 标准镜像**：新增 `ai/doc-standards/04-architecture.md`、`ai/doc-standards/05-tech-spec.md`，明确架构视图、COMP / MOD / Flow ID、ADR、技术状态、依赖配置、Risk-ID、readiness gate 和 `05 ↔ 09` 映射。
- **模板骨架增强**：`docs/04-architecture.md` 补上下文边界、异常 / 降级 / 权限拒绝路径、部署端口 / 外部依赖和架构视图检查表；`docs/05-tech-spec.md` 补依赖敏感性、验证证据、技术风险矩阵和 readiness gate。
- **生命周期与执行门禁**：`ai/document-lifecycle-rules.md` 和 `ai/implementation-lifecycle-rules.md` 要求真实依赖进入 Sprint / Phase 前具备 Risk-ID、readiness gate、验证证据和解锁条件。
- **生成 / 审计 / 评估门禁**：`generate-docs`、`edit-single-doc`、`docs-system-audit`、`docs-evaluation`、`tech-env-evaluation`、`phase-upgrade` 强化 `04/05` 架构视图、依赖配置、技术风险验证和 readiness gate 检查。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 04-05 标准文件、风险矩阵、readiness gate 和 `05 ↔ 09` 映射断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-3-architecture-tech-risk-readiness.md`，对应 GitHub issue #106、#113。

## v1.33.0（2026-07-07）

Batch 2 需求链规范落地：强化 `00-03` 需求入口、健康度矩阵、Phase 状态传播和兼容补齐规则。

- **00-03 骨架增强**：`docs/00-scenario.md`、`docs/01-user-requirements.md`、`docs/02-srs.md`、`docs/03-prd.md` 补充来源锚点、边界 / 非目标、用户 AC、验证入口、Phase 状态和证据 / 验收引用等字段。
- **规范镜像说明**：`ai/doc-standards/README.md` 明确 `00-03` 需求链基线和 `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 健康度链路；派生项目仍通过 doc-standards 镜像获得标准文件。
- **生命周期规则**：`ai/document-lifecycle-rules.md` 增加 00-03 需求链健康度矩阵、P0 / P1 断点输出和旧项目兼容映射策略。
- **生成 / 审计 / 评估门禁**：`generate-docs`、`edit-single-doc`、`docs-system-audit`、`docs-evaluation`、`phase-upgrade` 强化 `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 检查和 Phase 状态传播。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 00-03 需求链、健康度矩阵、Phase 证据引用和 doc-standards 关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-2-requirements-chain-00-03.md`，对应 GitHub issue #105、#112。

## v1.32.0（2026-07-07）

Batch 7 文档体系生成引导落地：补全文档体系生成场景、open items 总览命令、专题方案讨论和定稿门禁。

- **场景引导**：`template-docs/scenario-guides.md` 扩展 A17-A19，覆盖待确认事项总览、专题方案讨论和文档定稿门禁；A6 生成文档骨架增加 open items 更新和生成后收口路径。
- **open items 入口**：新增 `ai/commands/docs-open-items.md`、`ai/prompts/docs/21-docs-open-items.md` 和 `template-docs/docs-open-items.example.md`，并加入 `template-sync.json`，统一待确认项字段、门禁结论和默认落盘路径。
- **生成 / 评估 / 审计门禁**：`generate-docs`、`00-generate-or-complete-docs`、`docs-evaluation`、`docs-system-audit`、`phase-upgrade` 和 `docs-checklist` 均增加 open items 检查；阻塞项未关闭或未风险接受时不得无条件进入编码或 Phase 升级。
- **专题讨论边界**：需求层人机交互、总体设计 / 技术选型、交互设计方案先输出多方案、依据、AI 推荐、待确认项和回填位置；人工确认前不得写成正式项目事实。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 Batch 7 关键断言，防止新增命令、Prompt、同步清单、场景和门禁规则被误删。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-7-docs-generation-guidance-open-items.md`。

## v1.31.0（2026-07-07）

Batch 1 文档治理底座落地：建立提案收件箱远端 issue 本地镜像机制、分批治理原则、横切状态词典、待确认事项总览和文档体系生成总控最低规则。

- **提案收件箱镜像**：`_proposals/README.md`、`template-proposal-summary` 命令与维护者 Prompt 要求先刷新 `_proposals/_remote-issues/issue-<number>.md`，再基于本地镜像做去重、冲突和分批计划；关闭 issue 前仍以 GitHub 远端状态为准。
- **分批治理**：C1 场景和提案汇总 Prompt 明确“一批一范围、报告先行、事实与模板分离、去重可审计、可续接”，降低大范围文档体系提案的评审和续接风险。
- **状态与待确认门禁**：`ai/document-lifecycle-rules.md` 新增横切状态词典、状态传播规则和待确认事项总览；文档审计 / 评估 Prompt 将状态冲突、Mock / 降级 / 默认关闭 / 已验证 / 已启用等状态纳入 Go / Conditional Go / No Go 判断。
- **文档体系生成总控**：A6 场景与 `00-generate-or-complete-docs` Prompt 要求用户说“生成整个文档体系”时，先说明阶段路线，并在“分阶段确认模式”和“输入充分后批量生成模式”之间确认。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 Batch 1 关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-1-proposal-inbox-governance-status-dictionary.md`，对应 GitHub issue #111、#117。

## v1.30.7（2026-07-07）

模板自检 CI 编码修复：移除关键文件 UTF-8 BOM，避免 GitHub Actions 中 Bash shebang 与版本号解析失败。

- **脚本入口**：移除 `scripts/check-template.sh` 文件开头 BOM，确保 Linux runner 可正确识别 `#!/usr/bin/env bash`。
- **版本解析**：移除 `VERSION` 与 `CHANGELOG.md` 文件开头 BOM，并将模板版本递增到 `v1.30.7`。
- **影响范围**：仅修复编码 / CI 自检问题，不改变模板方法论或文档规范内容。

## v1.30.6（2026-07-06）

A13 同步闭环说法补充：在同步模板场景中增加可直接复述的完整闭环话术，并让命令索引显式提示 A13 完整闭环。

- **场景引导**：`template-docs/scenario-guides.md` 的 A13 场景新增“完整闭环说法”，明确 `sync-methodology → post-sync-cleanup → docs-system-audit → 提案回流收口 → 同步报告留痕`。
- **命令索引**：`ai/commands/README.md` 的 `sync-methodology` 入口补充 `A13 完整闭环` 触发提示。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A13 完整闭环关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-0-a13-sync-closure.md`，对应 GitHub issue #118。

## v1.30.5（2026-07-06）

派生同步边界检查 merge commit 指引加固：补齐 `check-derived-sync` 在 PR merge 后应校验实际同步提交的提示，并避免 PowerShell fallback 使用易与自动变量混淆的参数名。

- **同步提交定位**：`scripts/check-derived-sync.sh` 与 `.ps1` 在 `HEAD` 为 merge commit 时提示显式传入实际 `sync template vX.Y.Z from ai-project-template` 提交，失败输出同步给出 `<sync-commit>` 用法。
- **PowerShell fallback**：`scripts/check-derived-sync.ps1` 将原生 fallback 参数从 `$Args` 改为 `$CheckArgs`，降低 Windows PowerShell 5.1 参数转发歧义风险。
- **同步闭环文档**：`sync-methodology` Prompt 与派生同步运行记录模板要求记录实际同步提交，避免把 PR merge commit 当作同步边界检查目标。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加显式同步提交、merge commit 指引和 fallback 参数名断言。
- 回流自 GitHub issue #102。

## v1.30.4（2026-07-06）

会话续接运行时元数据边界加固：明确 `读取续接点` 必须按项目 Session Handoff 机制恢复，禁止把 CLI 私有 session、memory、subagent 或 cache 等运行时元数据直接作为项目续接事实。

- **恢复依据**：`ai/session-rules.md` 明确恢复结论只能来自 Git 客观事实、项目续接文件、项目正式文档和当前用户输入。
- **运行时边界**：Claude / Codex / Cursor 等 CLI 自身产生的 sessions、projects、memory、subagents、cache、trace、history、conversation dump、agent meta 文件仅可作为调试信息或用户明确要求时的辅助参考。
- **交叉验证**：未经 Git、handoff 或项目文档验证，不得据此推断当前任务、阶段、待办事项、Agent / SubAgent 运行状态或项目事实；无法验证时必须标记为“推测信息”。
- 回流自 `_proposals/TEMPLATE-UPGRADE-session-resume-runtime-metadata-boundary.md`。

## v1.30.3（2026-07-05）

PowerShell 派生边界检查 fallback 空 stderr 热修：修复 `check-derived-sync.ps1` 在 Git Bash 探测阶段 stderr 文件为空时，Windows PowerShell 5.1 对 `$null.Trim()` 报错导致边界检查无法进入 fallback 的问题。

- **脚本修复**：`scripts/check-derived-sync.ps1` 在读取 Bash probe stderr 时显式处理空文件 / `$null`，与 `sync-template.ps1` 的 v1.30.2 热修保持一致。
- **发布目的**：确保旧派生项目同步到新版脚本后，可在 Git Bash / MSYS 启动失败的 Windows 环境继续运行派生同步边界检查。

## v1.30.2（2026-07-05）

PowerShell 同步 fallback 空 stderr 热修：修复 Git Bash 探测阶段 stderr 文件为空时，Windows PowerShell 5.1 对 `$null.Trim()` 报错导致 fallback 尚未进入就中断的问题。

- **脚本修复**：`scripts/sync-template.ps1` 在读取 Bash probe stderr 时显式处理空文件 / `$null`，避免 `You cannot call a method on a null-valued expression`。
- **发布目的**：补齐 v1.30.1 UTF-8 fallback 修复的 Windows PowerShell 5.1 实机兼容性缺口，确保旧派生项目 bootstrap 最新同步脚本后可继续进入 fallback dry-run / commit。

## v1.30.1（2026-07-05）

PowerShell 同步 fallback UTF-8 兼容性修复：加固 Windows Git Bash / MSYS 启动失败后的原生 PowerShell 同步与边界检查路径，避免 Windows PowerShell 5.1 代码页误解码 UTF-8 模板文件。

- **fallback Git 读取**：`scripts/sync-template.ps1` 与 `scripts/check-derived-sync.ps1` 新增 UTF-8 bytes 解码 helper，避免 `git show` / `git log` / `git diff-tree` 输出经系统代码页转换后乱码。
- **同步写回**：`sync-template.ps1` 读取 `template-sync.json`、`VERSION` 和模板 Markdown / 文本文件时按 UTF-8 解码，并以 UTF-8 no BOM 写回，减少中文 Markdown、JSON 和文件名兼容风险。
- **环境提示**：`scripts/check-prereqs.ps1`、`template-docs/env-setup.md` 与 `git-guide.md` 补充 Windows PowerShell 5.1 native command 代码页风险及 fallback 处理口径。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 PowerShell fallback UTF-8 helper 断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-powershell-sync-utf8-fallback.md`，对应 GitHub issue #92。

## v1.30.0（2026-07-05）

技术路线与环境支撑评估机制：新增 `tech-env-evaluation` 命令与 20 号 Prompt，把运行时版本、依赖安装 / 导入 / 最小运行、Docker / 数据库 / 模型、网络权限和资源约束纳入编码前门禁。

- **新增命令 / Prompt**：新增 `ai/commands/tech-env-evaluation.md` 与 `ai/prompts/review/20-tech-env-evaluation.md`，输出 `Go / Conditional Go / No-Go` 结论和可落盘报告建议。
- **报告定位**：技术环境评估报告推荐写入 `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`，不替代 `docs/env/local-env.md` 或 `docs/05-tech-spec.md`。
- **规则门禁**：`ai/document-lifecycle-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` 区分环境事实采集与支撑评估；真实运行依赖项目进入首个相关 Sprint 前需评估或记录跳过风险。
- **Prompt / 文档模板**：`collect-env`、`generate-docs`、`edit-single-doc`、`docs-checklist`、`run-dev-task`、`docs/05`、`docs/09` 增加技术环境评估落点。
- **场景与自检**：`template-docs/scenario-guides.md` 增加 A8.5 技术路线与环境支撑评估；`template-sync.json` 与 `scripts/check-template.*` 纳入新增命令 / Prompt 和关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-tech-env-evaluation.md`，对应 GitHub issue #87。

## v1.29.0（2026-07-05）

前端交互设计文档规则：新增 UI 型项目的条件性详细设计触发规则、推荐路径和审查口径，避免前端编码阶段临场补交互或把前端可见性误当权限边界。

- **文档定位**：`docs/design/frontend-interaction.md` 或 `docs/design/*interaction*.md` 作为条件性详细设计，不新增 `docs/00-09` 固定编号，也不进入 `docs/` 根目录。
- **触发规则**：独立 Web、移动端、小程序、桌面端、多页面、多角色、复杂表单、状态流、管理页、搜索问答 UI 或点击路径验收，应在开发前补交互设计或记录豁免理由。
- **内容边界**：交互设计只承接 `03/04/05/07/08/09` 已授权内容，记录页面流、状态、文案、接口依赖和验收路径；不得新增需求、接口或验收目标。
- **权限边界**：前端隐藏入口、按钮禁用或路由守卫只属于可见性控制，不能替代后端接口和服务层权限执行。
- **Prompt / 审查**：`generate-docs`、`edit-single-doc`、`docs-checklist`、`docs-system-audit`、`docs-evaluation` 和 `project-review` 增加前端交互设计判断与越界检查。
- **场景与自检**：`template-docs/scenario-guides.md` 增加“补前端交互设计”触发语；`scripts/check-template.sh` / `.ps1` 增加关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-frontend-interaction-design.md`，对应 GitHub issue #81 与 #86。

## v1.28.0（2026-07-05）

文档评估机制：新增整体 / 阶段 / 单文档评估入口，用于在关键阶段转换前后输出 `Go / Conditional Go / No Go` 结论，并支持确认后落盘评估报告。

- **新增命令 / Prompt**：新增 `ai/commands/docs-evaluation.md` 与 `ai/prompts/review/19-docs-evaluation.md`，支持整体评估、E1-E6 阶段评估和单文档评估。
- **评估报告机制**：默认只读输出评估报告草稿；用户确认后写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`，不进入 `docs/` 根目录，不覆盖 `00-09`。
- **场景路由**：`ai/commands/README.md` 和 `template-docs/scenario-guides.md` 增加 `docs-evaluation`，明确它与 `docs-system-audit`、`docs-checklist` 的分工。
- **生命周期规则**：`ai/document-lifecycle-rules.md` 增加 E1-E6 评估码和结论含义；`ai/implementation-lifecycle-rules.md` 要求 `No Go` 不得进入 Sprint 规划，`Conditional Go` 需列条件和风险接受口径。
- **审查分工**：`10-docs-checklist` 与 `16-docs-system-audit` 补充与 `docs-evaluation` 的区别，避免评估、审计和编码前 checklist 混用。
- **同步与自检**：`template-sync.json` 纳入新增 command / prompt；`scripts/check-template.sh` / `.ps1` 增加路由、同步清单和评估关键字断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-docs-evaluation-mechanism.md`，对应 GitHub issue #85。

## v1.27.9（2026-07-05）

待人工确认项增强：将正式文档、任务与续接文件中的待确认项从纯问题清单升级为“AI 建议 + 依据 + 备选 + 影响 / 阻塞”的结构化协作格式。

- **规则边界**：`ai/global-rules.md`、`ai/document-lifecycle-rules.md`、`ai/session-rules.md` 明确 AI 可以给推荐口径，但不得把建议写成用户已确认事实；用户确认后才回填权威文档或续接文件。
- **文档骨架**：`docs/00-scenario.md` 至 `docs/09-verification.md` 的“待人工确认项”统一为表格，字段包含 `ID`、`待确认项`、`AI 建议`、`建议依据`、`备选方案`、`取舍影响 / 阻塞关系`。
- **Prompt / Command**：`generate-docs`、`edit-single-doc`、`sync-docs-from-code` 和 `docs-checklist` 要求新增或审查待确认项时补齐建议、依据、备选方案和影响；`ai/commands/README.md` 增加命令输出通用要求。
- **规范镜像**：`ai/doc-standards/README.md` 增加待人工确认项基线，供文档生成和审计引用。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加待确认项字段、规则和 Prompt 关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-confirmation-items-with-ai-recommendations.md`，对应 GitHub issue #83。

## v1.27.8（2026-07-04）

用户输入入口与 Product Vision 就绪评审闭环：将普通用户原始材料统一引导到 `docs/inputs/`，并在生成 `product-vision` / `00-09` 前增加可复评的输入补齐机制。

- **统一输入入口**：`docs/README.md`、`docs/inputs/README.md`、`docs/vision/README.md` 和 `docs/vision/product-vision.md` 明确 `docs/inputs/` 是原始材料默认入口，`docs/vision/` 是整理后愿景叙事 / 兼容已有愿景。
- **愿景就绪评审**：`ai/document-lifecycle-rules.md` 增加 Inputs-first 默认入口与 `docs/inputs/` → 愿景就绪评估 → `product-vision` → `00-09` 闭环；输入不足时必须输出评估报告和最小补充清单，补齐后复评。
- **Prompt / Command**：`review-inputs` 输出 Product Vision 就绪度、缺口矩阵、AI 建议与依据、评估报告路径；`generate-docs` 增加前置门槛，Not Ready 时不得直接生成 product-vision 或 `00-09`。
- **新手与新项目引导**：`template-docs/beginner-guide.md`、`template-docs/scenario-guides.md`、`scripts/new-project.sh`、`new-project` Prompt / Command 统一引导原始材料先入 `docs/inputs/`，评审通过后再生成 / 更新 `docs/vision/product-vision.md`。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 inputs 统一入口、愿景就绪评估、`input-review-report.md`、最小补充清单和生成前置门槛断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-inputs-single-user-entry.md`。

## v1.27.7（2026-07-04）

派生项目 CI 检查入口分离：区分模板仓自检 workflow 与派生项目普通 PR 检查，避免派生项目误跑模板仓 `check-template`。

- **派生项目 workflow**：`scripts/new-project.sh` 生成 `.github/workflows/project-check.yml`，普通 PR / push 运行 `git diff --check`，仅模板同步提交运行 `scripts/check-derived-sync.sh HEAD`。
- **模板 workflow**：`.github/workflows/template-check.yml` 明确仅供模板仓使用，继续运行 `scripts/check-template.sh`。
- **同步提示**：`scripts/sync-template.sh` / `.ps1` 检测旧派生 `.github/workflows/template-check.yml` 并提示迁移。
- **文档与 Prompt**：`sync-methodology`、`post-sync-cleanup`、`git-guide.md`、`SOP.md`、`MAINTAINERS.md` 补充派生 CI 边界与迁移口径。
- **自检**：`scripts/check-template.sh` 增加派生 workflow、同步脚本迁移提示和模板 workflow 边界断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-derived-ci-check-entry.md`，对应 GitHub issue #82。

## v1.27.6（2026-07-04）

方法论同步标准闭环：将派生项目“更新方法论”从单次同步升级为同步、边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕的标准流程。

- **`sync-methodology`**：明确同步后默认串联 `check-derived-sync`、`post-sync-cleanup`、`docs-system-audit`、项目验证建议与 `sync-records/template-sync/` 同步报告。
- **同步后整理 / 审计**：`post-sync-cleanup` 优先读取 `sync-records/template-sync/`，兼容旧路径；`docs-system-audit` 增加同步后审计模式，区分规范基线缺口、兼容差异和项目事实问题。
- **同步报告模板**：`template-docs/derived-sync-report-template.md` 增加同步后整理摘要、文档体系审计摘要和项目验证建议。
- **场景与 SOP**：A13 场景和 `git-guide.md` 明确“同步 → 验证 → 整理 → 审计 → 报告”的标准闭环与报告路径。
- **自检**：`scripts/check-template.sh` 增加同步闭环、同步报告和同步后审计关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-sync-methodology-standard-workflow.md`。

## v1.27.5（2026-07-04）

Issue 提案收件箱与维护者 triage 场景：补齐派生项目通过 GitHub issue 回流提案后的模板侧处理机制。

- **`template-docs/scenario-guides.md` C1**：从“处理 `_proposals` 提案”扩展为“处理提案收件箱”，明确同时读取 `_proposals/`、带 `proposal` / `feedback` 标签的 issue，以及标题为 `TEMPLATE-UPGRADE:` 的 open issue。
- **`ai/commands/template-proposal-summary.md`**：适用场景、必读文件和执行流程补充 issue 查询、标签 triage、去项目化审查与 issue 关闭计划。
- **治理文档**：`CONTRIBUTING.md` 与 `_proposals/README.md` 明确 GitHub issue 收件箱和 `_proposals/` 文件收件箱的关系。
- **自检**：`scripts/check-template.sh` 增加关键断言，防止 C1 / command / governance 回退成只读 `_proposals/`。
- 回流自 `_proposals/TEMPLATE-UPGRADE-issue-proposal-triage-flow.md`。

## v1.27.4（2026-07-04）

模板自检脚本可维护性整理：在不拆分脚本、不改变检查语义的前提下，先完成 `check-template.sh` 小步分组与重复断言收敛。

- **`scripts/check-template.sh`**：补充脚本结构说明，明确基础 helper、专项检查函数与主流程分组。
- **脚本文件检查**：新增 `require_files` helper，将连续脚本存在性断言收敛为列表式调用。
- **专项检查函数**：新增 `check_script_entrypoints` 集中维护 `.ps1` 入口、fallback 与权威边界断言；新增 `check_project_bootstrap_scripts` 集中维护 `new-project`、环境采集、前置检查与 bootstrap 断言。
- **提案状态**：继续保留 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`，后续再评估是否拆分 `scripts/checks/*.sh`。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`。

## v1.27.3（2026-07-04）

跨 AI CLI 修改前确认机制：强化项目级写入确认协议，并补充 Claude / Codex / IDE 工具配置建议与 Git 审计兜底。

- **`ai/project-rules.md` §6**：写入前确认要求细化为目的、影响范围、预计文件、变更摘要、风险与验证方式；批量 patch 必须列出全部文件；单次“直接修改”授权仅对当前任务和已说明范围生效。
- **`ai/implementation-lifecycle-rules.md`**：单任务执行规则补充多文件 patch 逐项摘要、修改前后 `git status` 和必要时审阅 `git diff`。
- **`template-docs/ai-cli-setup.md`**：新增“写入前确认与权限模式”，明确三层防线：项目规则、工具配置、Git 审计；Claude / Codex / Cursor 等具体配置以官方文档为准，不承诺模板可硬性拦截所有写入。
- **写入类 Prompt**：`run-dev-task`、`fix-bug`、`edit-single-doc` 均要求写入前列出预计文件 / 变更摘要 / 风险 / 验证方式并等待确认，修改后输出 `git status` 摘要和文件清单。
- **自检**：`scripts/check-template.sh` / `.ps1` 增加关键确认协议和三层防线断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-cross-cli-edit-confirmation.md`。

## v1.27.2（2026-07-04）

Scenario Guide 场景体系整理：让场景层承接 implementation lifecycle，并补齐 HELP / 能力索引与维护者场景说明。

- **`template-docs/scenario-guides.md`**：新增 M0 HELP / 能力索引 / 角色选择；A9 改为正式指向 `implementation-lifecycle-rules` 与 `19-plan-phases-and-sprints`；A10/A12 强化 Test Case、验证包和 Sprint 验收包；C5/C6/C7 明确适用范围、跨仓同步验收与模板能力设计流程。
- **`ai/prompts/dev/02-run-task.md`**：执行任务前要求读取实现生命周期规则，关联 REQ / Sprint / Task / Test Case、验证包和 Phase 边界。
- **`ai/prompts/dev/09-sprint-summary.md`**：Sprint 总结增加验证证据、09 验收记录 / Sprint 验收包、风险与未验证项输出。
- **`template-docs/beginner-guide.md`**：补实现阶段入口说明，指向 A9 规划 prompt、A10 执行和 A12 验收。
- **自检**：`scripts/check-template.sh` / `.ps1` 增加 M0、A9 prompt、C6 跨仓、C7 模板能力流程、dev prompt 和 beginner guide 断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scenario-guide-clarity.md`，并吸收 v1.27.0 / v1.27.1 的 implementation lifecycle 新入口。

## v1.27.1（2026-07-04）

实现生命周期规则第二步：让开发计划、验证计划和 A9 规划 Prompt 承接 v1.27.0 的核心实现生命周期规则。

- **`docs/08-dev-plan.md`**：补充 Phase / Sprint / Task 定义、测试等级 / 验证包、Sprint 完成包、任务拆分决策树和提交 / PR 粒度说明。
- **`docs/09-verification.md`**：补充测试等级矩阵、Phase 测试大纲、Sprint 验收包、缺陷与回归记录、验证证据字段。
- **新增 `ai/prompts/planning/19-plan-phases-and-sprints.md`**：作为 A9 阶段 / Sprint / 验证闭环规划 Prompt，先输出草稿等待确认，不直接修改文件。
- **同步与自检**：`template-sync.json` 加入新 Prompt；`scripts/check-template.sh` / `.ps1` 增加 08、09、A9 Prompt 关键断言。
- 后续仍待处理：Scenario Guide A9-A12、`run-dev-task` / `sprint-summary` prompt、`beginner-guide` 引导文案增强。
- 回流自 `_proposals/TEMPLATE-UPGRADE-implementation-lifecycle.md`。

## v1.27.0（2026-07-04）

实现生命周期规则（implementation-lifecycle）第一步：新增实现侧权威规则入口，补齐文档体系之后的阶段规划、Sprint / Task、编码执行、分层验证和验收留痕闭环。

- **新增 `ai/implementation-lifecycle-rules.md`**：定义 `Phase → Sprint → Task → Test Case → Commit / PR → 验收记录` 追溯链，明确阶段规划、Sprint / Task 拆分、单任务执行、测试与验证分层、验收留痕和代码事实反向同步规则。
- **`ai/index.md`**：将实现生命周期规则加入 AI 必读清单，位于 `document-lifecycle-rules` 之后。
- **`ai/global-rules.md`**：文档驱动开发原则补充实现生命周期规则指针，避免规则链只停留在“开发计划 → 代码”。
- **同步与自检**：`template-sync.json` 与 `scripts/sync-template.sh` 兜底清单加入新规则；`scripts/check-template.sh` / `.ps1` 增加必读入口、同步清单和关键内容断言。
- 本版本先建立核心规则与同步入口；`docs/08-dev-plan.md`、`docs/09-verification.md`、A9 专门 prompt、Scenario Guide A9-A12 增强留待后续 PR 分步落地。
- 回流自 `_proposals/TEMPLATE-UPGRADE-implementation-lifecycle.md`。

## v1.26.2（2026-07-03）

scripts 说明与模板自检可维护性：补齐 scripts README 说明，明确 `.sh` / `.ps1` 主从关系与 fallback 权威边界。

- **`scripts/README.md`**：补齐 `e2e-sync-check.sh`、`sync-all-derived.sh` 说明；新增运行位置 / 读写 / 谁用列；明确 `.sh` / `.ps1` 主从关系（`.sh` 为主实现，`.ps1` 优先委托 Git Bash）；新增 Windows 脚本入口选择章节与权威性说明。
- **`SOP.md`**：Windows 脚本入口选择补充权威性说明（完整权威检查：Bash `check-template.sh` + CI；结构性兜底检查：PowerShell native fallback；fallback 通过 ≠ 完整自检通过）。
- **`MAINTAINERS.md`**：自检与 CI 章节补充权威性说明，明确 Bash check-template.sh + CI 为完整权威检查，PowerShell fallback 为结构性兜底检查。
- **`scripts/check-template.ps1`**：fallback 输出明确"非完整权威检查"，避免用户误把 fallback 通过当作完整自检通过；提示发布 / CI 仍应以 Bash 自检为准。
- check-template 全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`。

## v1.26.1（2026-07-03）

派生同步运行记录路径分离（sync-records-location）：将模板同步运行记录与项目开发文档分离，降低理解成本。

- **路径变更**：同步运行记录推荐路径从 `docs/archive/template-sync/` 改为 `sync-records/template-sync/`，与 `docs/` 项目事实层分离。
- **`template-docs/derived-sync-report-template.md`**：推荐路径更新 + 补充临时续接说明（`.ai/session-handoff.md` 不替代长期同步运行记录）。
- **`ai/prompts/maintainers/12-sync-template.md`**：同步 Prompt 路径更新，区分长期记录（`sync-records/`）与临时续接（`.ai/session-handoff.md`）。
- **`ai/commands/sync-methodology.md`**：命令文档路径更新 + 说明长期记录与临时续接区别。
- **`ai/prompts/maintainers/15-post-sync-cleanup.md`**：同步后整理 Prompt 兼容新旧两个路径扫描。
- **`ai/prompts/maintainers/18-submit-feedback.md`**：反馈汇集 Prompt 扫描源兼容新旧路径。
- **`ai/commands/submit-feedback.md`**：反馈命令候选来源兼容新旧路径。
- **`SOP.md`**：派生同步运行记录场景补充路径说明（长期记录路径 + 与项目文档分离）。
- **`README.md`**：目录速览新增 `sync-records/` 说明（同步运行记录专用）。
- 迁移策略：新记录默认写入 `sync-records/template-sync/`，旧项目 `docs/archive/template-sync/` 不强制迁移，扫描工具兼容新旧路径一段时间。
- check-template 全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-sync-records-location.md`。

## v1.26.0（2026-07-03）

会话续接场景化 + 被动中断裁决优先级（session-resume）：让「读取续接点 / 继续上次 / 换 CLI 接手」在多 CLI + 被动中断下更稳。

- **`ai/session-rules.md` §1 加固**：新增「裁决优先级」链（Git 客观事实 > `.ai/session-handoff.md` > `NEXT-STEPS.md` > 冲突停下问用户）+「主动 vs 被动中断」表（被动中断含跨 CLI 接手，handoff 缺失/过时时以 Git 为唯一锚点）；「兼容旧文件」收紧为「仅读旧项目时兜底，新项目不再创建 `NEXT-STEPS.md`」。
- **`ai/session-rules.md` §2 调整**：恢复流程改为「先取 Git 客观事实，再读续接文件」（原顺序反，易被过时 handoff 先入为主）；第 4 步显式「交叉核对判主动 / 被动中断」，被动中断以 Git 为唯一锚点重建并标注不确定项。
- **新场景 A16**（scenario-guides + 速查索引）：「会话续接 / 中断恢复（跨 CLI 接手）」——跨 Claude / Codex / Cursor 的统一恢复入口，换 CLI 不丢上下文；顺带修正已有索引 bug（标题 A0–A14 / A0–A15 → A0–A16）。
- **`ai/commands/README.md`**：自然语言示例加「读取续接点 / 继续上次」，让 AI 识别该短语时路由到 scenario → A16。
- 动机：多 CLI 实际使用中，撞 token / 时间上限被迫换 CLI、窗口中断重开是高频场景；原规范裁决优先级散落、被动中断未显式命名、场景层无入口。
- housekeeping：删除本仓库根目录过时的 `NEXT-STEPS.md`（v1.21.3 旧记录，已 gitignore，不进版本库）。
- check-template 全过。
- 起草自 `_proposals/TEMPLATE-UPGRADE-session-resume.md`。

## v1.25.0（2026-07-03）

派生 → 模板反馈与提案回流渠道（标准化 + 半自动）。回流自派生提案 `derived-feedback-channel`。

- **来源标识规则**（`ai/global-rules.md` §9 增补）：回流提案 / 反馈头部标 `> 来源：<派生>(owner/repo)`，解决来源不可识别（曾导致回流 PR 被误判为「另一会话并发」）。
- **2 新命令**（跨仓库开 issue，免 fork）：
  - `submit-proposal`（`/run submit-proposal` + `ai/prompts/maintainers/17-submit-proposal.md`）：成熟提案校验（去项目化 + 来源 + 字段）后 `gh issue create`（label `proposal`）。
  - `submit-feedback`（`/run submit-feedback` + `ai/prompts/maintainers/18-submit-feedback.md`）：半自动汇集候选问题（sync 运行记录 / audit / check 告警 / 草稿）+ 人工勾选 + 开 issue（label `feedback`）。
- **Issue 模板** `.github/ISSUE_TEMPLATE/derived-feedback.md`（template-local）：预填来源 / 类型 / 去项目化确认。
- **`template-proposal-summary`（11）扩展**：除 `_proposals/`，也读模板仓带 `proposal`/`feedback` 标签的 issue。
- **新场景 A15**（scenario-guides + 速查索引 + SOP 场景索引）：「回流提案 / 反馈到模板」——派生使用者上报侧（C1 是维护者收侧）。
- 动机：团队场景（多成员 / 多机器 / 多派生）回流摩擦 + 来源混淆；半自动（非全自动）保留人工判断。
- check-template 加断言（§9 来源标识 + commands/README `submit-proposal` + 命令循环含 2 新命令 + 4 新文件入 sync 清单）；全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-derived-feedback-channel.md`。

## v1.24.5（2026-07-03）

多会话并发操作规范：git-guide + MAINTAINERS + session-rules 记录「独立 worktree」约定，防并发 commit 落错分支。

- `git-guide.md` §4（场景 B）：加「多会话并发操作」小节——`git worktree add` 命令 + why（共用工作区 = 共用 HEAD，`先确认分支再 commit` 非原子，必然偶发落错）+ 完成清理。
- `MAINTAINERS.md` §2：加「多会话并发」指针 bullet（→ git-guide §4）。
- `ai/session-rules.md`：加 §7「多会话并发操作」AI 行为约定（并发前先确认是否开独立 worktree）。
- 动机：多次 AI 会话并发操作模板仓导致 commit 落错分支（3 起）；git 无自动机制，须靠每会话独立目录这一约定。
- check-template 全过。

## v1.24.4（2026-07-03）

INIT-PROMPT reframe：标题 + 定位行对齐「启动入口」定位（#17 子问）。

- `INIT-PROMPT.md`：标题「常用 Prompt 模板索引」→「**AI 任务启动入口**」（原标题 v1.22.2 后 stale——索引已迁到 `ai/prompts/README` + `commands-README`）；正文首行改为定位声明「首次在本模板项目里启动 AI 工作时，从这里入手」。
- 解决名 / 题 / 内容不一致：文件名 `INIT-PROMPT` + 新标题「启动入口」+ 内容（4 入口指针 + 原则）现在三者一致。
- 不改规则、不挪位、不断引用 / 断言（`ai/commands/README.md` 指针保留）；check-template 全过。
- 回应 #17 子问（INIT-PROMPT 定位评估）。

## v1.24.3（2026-07-03）

`check-derived-sync` 加非阻断「README 模板版本号 vs VERSION」一致性告警（回流自派生项目提案 readme-version-check）。

- `scripts/check-derived-sync.sh` + `.ps1`：同步边界检查后加一项**非阻断**告警——读 `VERSION` + 扫 README 里「当前 / 已同步」语义的模板版本声明，与 `VERSION` 不一致就告警（不计入失败、不改退出码）；README 无版本声明则跳过。
- 动机：根 README 是项目专属（sync 不碰），其「同步至 vX.Y.Z」声明全靠人工维护，sync 后易滞后且无提示（实测某派生项目跨多版同步 README 仍标旧版本）。
- 非阻断设计：README 可能有历史 / 叙事性版本引用，硬阻断会误伤；告警 + 人工核对是正确粒度。
- check-template 加防滞后断言（`check-derived-sync` 含「README 模板版本」）。
- 回流自派生项目提案 `TEMPLATE-UPGRADE-readme-version-check`；非破坏；check-template 全过。

## v1.24.2（2026-07-03）

global-rules §8.1 加「双维度总览表」撰写推荐（回流自派生项目提案 phase-overview-table，另一 AI 起草）。

- `ai/global-rules.md` §8.1：加推荐——`docs/03-prd.md` §3 路线图顶部用「双维度总览表」集中呈现阶段 × 交付物形态（Demo/MVP/产品），避免交付物形态被要素级 `[P1]`/`[P2]`/`[愿景]` 标签淹没。Lean 剖面可裁剪列集；非强制。
- `docs/03-prd.md` §3：加「双维度总览表」标注，显式说明下方表是双维度总览、与要素级标签形成「全景 ↔ 要素」对照（呼应 §8.1）。
- 动机：交付物形态是阶段级属性（少数点声明），功能范围是要素级标签（遍布 04-09，上百次），前者易被后者淹没；总览表让 Demo→MVP→产品 演进线一目了然。
- cherry-pick 自 `change/phase-overview-table`（去项目化提案）；非破坏、不改双维度定义；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-phase-overview-table.md`。

## v1.24.1（2026-07-02）

v1.24 infrastructure release 收官。**PR-7 测试基础设施（#9）**。

- **L3 端到端回归机制**：
  - `template-docs/e2e-regression-checklist.md`（随模板同步）：6 项回归（R1 同步链路 / R2 check-derived-sync / R3 sync-all-derived 批量 / R4 场景引导路由 / R5 文档生成 / R6 PowerShell fallback），可自动化 + 人工 + 通过标准。
  - `scripts/e2e-sync-check.sh`（随模板同步）：L3 发布门，聚合 `check-template`（含 doc-standards 镜像 + 新项目烟测）+ `sync-all-derived` 批量烟测，人工项指向 checklist。运行通过。
  - `template-docs/e2e-report-template.md`（随模板同步）：回归报告模板。
  - `MAINTAINERS` 发布 Checklist 补：MINOR / MAJOR 发布前跑 L3 + 报告确认（PATCH 可豁免）。
- 专用测试派生项目 `ai-project-template-e2e` 是**外部 repo**（维护者 `gh repo create` + `new-project` 派生），模板仓内只给文档 + 命令。
- check-template 加 5 断言（3 `require_file` + MAINTAINERS L3 + 回归清单 R6）。
- **同步归属修订（含 PR-6）**：`scripts/sync-all-derived.sh` + `scripts/e2e-sync-check.sh` + `template-docs/e2e-regression-checklist.md` + `template-docs/e2e-report-template.md` 改为**随模板下行同步**（加入 `template-sync.json` + `sync-template.sh` 兜底清单 + Sync notice），消除 synced 文档（MAINTAINERS / scenario-guides / SOP / git-guide）对 template-local 文件的悬空引用；去掉 template-local 表述。
- 覆盖用户诉求 **#9**（最小测试清单 + 回归机制 + 专用测试派生项目 + 报告）。
- 提案：`_proposals/TEMPLATE-UPGRADE-test-infra-pr7-v1.24.1.md`。
- **#1–#16 + #9 全部完成；v1.23 文档重构 + v1.24 infrastructure release 收官。**

## v1.24.0（2026-07-02）

v1.24 infrastructure release 启动。**PR-6 批量同步派生项目（#15）**。

- **新增 `scripts/sync-all-derived.sh`**（template-local 维护者脚本，不进 sync 清单）：一条指令批量同步父目录下所有派生项目——遍历子目录、判定派生项目（`VERSION`+`scripts/sync-template.sh`+`docs/`，排除模板本体 `_examples/`）、逐个跑该项目的 `sync-template` + `check-derived-sync`、汇总成功 / 跳过 / 失败。默认 `--dry-run`，`--commit` 才写；工作区有未提交跟踪改动 / 非派生 / 同步失败 自动跳过，绝不强行写入。最小自测通过（2 假派生 + 非派生 + 模板本体）。
- **新场景 C8 批量同步所有派生项目**（`scenario-guides.md`，C 维护者）：触发「批量同步 / sync all derived」；步骤 确认目录版本账户 → dry-run 全预览 → commit 批量 → 看汇总。`--commit` 在每个派生当前分支提交；要 PR-per-project 可审计流程改用 A13。
- **交叉引用**：scenario-guides（C8 + 速查索引 C1–C8 + §5 C 头 C1–C8）、SOP（场景索引 C8 行）、MAINTAINERS（下行同步节批量 bullet）、git-guide §5（批量同步 note）。
- **check-template 新断言**：`require_file scripts/sync-all-derived.sh` + scenario-guides C8 + SOP / MAINTAINERS `sync-all-derived` 引用。
- 覆盖用户诉求 **#15**（23 场景未覆盖的「一条指令批量更新派生项目」缺口）。
- 提案：`_proposals/TEMPLATE-UPGRADE-batch-sync-pr6-v1.24.0.md`。

## v1.23.7（2026-07-02）

文档体系重构 PR-5（ai/ 规则件）：document-lifecycle-rules 读者导向 + global-rules 去重，覆盖用户诉求 #12 + #14。

- `ai/document-lifecycle-rules.md`（#12）：顶部加**阅读地图**（是什么 / 为什么 / 怎么做 / 规范 / 图表 → §1–§13 映射）；§1 加「文档体系是什么 + 为什么需要这套规则」framing。**不重组、不重编号**（§2 / §3 / §5 / §6 / §13 被 7 处跨引用）；6 锚点全保留。
- `ai/global-rules.md`（#14）：§6「最佳实践流程总览」改为 stub 指针（指向 §1.1，删重复的 Scenario→Code 链，保留「避免想法→AI→代码」）；**保留 §6 号**（§7 / §8 / §9 被 6 处跨引用，不能重编号）。§8 阶段双维度不动（与 doc-lifecycle §4 文档剖面是不同概念，非重复——纠正 #13 评估误判）。
- 11 个 global-rules 锚点 + 全部跨引用保留；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-ai-rules-pr5-v1.23.7.md`。

## v1.23.6（2026-07-02）

文档体系重构 PR-5b（导航衔接）：SOP 场景索引 ↔ scenario-guides 场景码对齐，覆盖用户诉求 #16。

- `SOP.md`：顶部加**分工声明**（SOP = 命令速查 vs scenario-guides = 场景剧本，场景码对齐、互补不重复）；场景索引加**场景码列**（A0–A14 / C1–C7 / M1 对齐 scenario-guides）；拆「操作场景（带码 + 命令）」与「文档入口（看哪）」两区。
- 解决 SOP 与 scenario-guides「各说各的」：两边现在用同一套场景码，可双向跳（找命令看 SOP，看剧本看 scenario-guides 对应码）。
- ~24 个 SOP 断言锚点全保留（场景名 + 命令 + PowerShell fallback 等）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-sop-scenario-coordination-v1.23.6.md`。

## v1.23.5（2026-07-02）

文档体系重构 PR-4b（scenario-guides 导航）：加场景速查索引，覆盖用户诉求 #11（scenario-guides 部分）。

- `template-docs/scenario-guides.md`：§5 顶部加**场景速查索引**（A0–A14 / C1–C7 / M1 共 23 场景的「触发说法 + 一句话」表，按角色分组）；§5 目录正文不动；§1 入口提示加「§5 顶部有速查索引」。
- 5 个断言锚点全保留（场景路由入口 / 引导计划输出契约 / A0 冷启动 / mermaid / 当前 `gh` 登录账户）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr4b-v1.23.5.md`。

## v1.23.4（2026-07-02）

文档体系重构 PR-4a（template-docs 可读性）：3 份手册结构优化，覆盖用户诉求 #11。

- `template-docs/env-setup.md`：15 节 → 10 节——合并 3 个「顺序 / 路径」节（§6 建议顺序 + §7 一键安装 + §8 三种路径）+ 2 个「脚本行为」节（§9 check-prereqs + §10 bootstrap）+ §1/§2 合并 + §5 折入 §4；§4 加速览表；§15 改导航表。
- `template-docs/ai-cli-setup.md`：9 节 → 8 节——§7「推荐操作顺序」并入 §2「推荐顺序」。
- `template-docs/template-methodology.md`：17 节碎片 → 6 主题（①定位 ②权威源 ③问题+目标 ④核心原则 ⑤各子系统设计 why ⑥演进+历史）。
- 全部断言锚点保留（env-setup 8 / ai-cli-setup 5+1 absent / template-methodology 仅 file-existence）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr4a-v1.23.4.md`。

## v1.23.3（2026-07-02）

文档体系重构 PR-3b（导航）：关键文件夹补 README，覆盖用户诉求 #7。

- 新增 7 个文件夹 README（template-local，不进 sync 清单）：`template-docs/README`（手册导航）、`scripts/README`（脚本说明 + 模板/派生检查区别）、`ai/README`（ai/ 目录概览）、`frontend/` / `backend/` / `tests/` / `docker/` README（用途 + 裁剪提示，指向 `project-rules` §3）。
- 派生项目的目录指引已由同步的 `beginner-guide` §5 三层结构覆盖；本批 README 为模板仓可读性增强。
- check-template 全过；无脚本 / 同步清单 / 断言变更。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr3b-v1.23.3.md`。

## v1.23.2（2026-07-02）

文档体系重构 PR-3（操作）：`git-guide.md` 分场景重构，覆盖用户诉求 #6。

- `git-guide.md`：从「按主题」改为「**按场景**」组织——§1 先准备（gh 账号 + 身份）+ §2 场景速查表 + §3 场景 A 派生日常提交 + §4 场景 B 模板维护 + §5 场景 C 派生同步 + §6 场景 D 新建项目 + §7 踩坑 + §8 命令速查。下行同步保持在 §5（CONTRIBUTING / sync-methodology 的 `§5` 引用不断）；新建项目 §2 → §6。
- 跨引用同步：`ai/commands/new-project.md`、`ai/prompts/setup/14-new-project.md` 的 `git-guide §2` → `§6（场景 D）`。
- SOP 细节与 ~15 个断言锚点全保留；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr3-v1.23.2.md`。

## v1.23.1（2026-07-02）

文档体系重构 PR-2（治理文档）：覆盖用户诉求 #3（MAINTAINERS）/ #4（CONTRIBUTING）/ #5（README 目录速览）/ #10（同步回流闭环显化）。

- `MAINTAINERS.md`：开头简化（使用者只看 README + beginner-guide）+ 板块重构为「维护者怎么干活」递进（①你是谁 ②改模板全流程 ③发布 checklist ④下行同步清单 ⑤自检与CI ⑥README边界 ⑦文档分区维护）。
- `CONTRIBUTING.md`：修编号（去 0/2.5）+ 重构为「贡献流程」递进 1-9（什么算模板改动→双向闭环→改模板流程→版本号纪律→回流→下行同步→分支命名→禁止→治理变更记录）。
- `README.md`：开头加两类读者划分（使用者/维护者）；目录速览补 `CONTRIBUTING.md` / `MAINTAINERS.md` / `INIT-PROMPT.md` / `template-sync.json` 4 行。
- 同步回流闭环显化（#10）：`CONTRIBUTING.md` §2「观察·回流」+ `MAINTAINERS.md` §1 点名完整链路（`sync-methodology` 生成运行记录 → `post-sync-cleanup` 归纳 → 去项目化提案）。
- 与 PR-1（#54，v1.23.0）文件无重叠；check-template 全过，无脚本/同步清单变更。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr2-v1.23.1.md`。

## v1.23.0（2026-07-02）

文档体系重构 PR-1（核心全貌）：模板文档从「规则堆砌」转向「读者导向 + 通俗 + 条理 + 互相导航」。覆盖用户最初诉求 #1（docs 输入/输出区分）、#2（beginner-guide 全貌）、#8（docs 文档体系介绍 + 规范）。

- `template-docs/beginner-guide.md` 全貌重构（5 章 → 7 节）：①是什么/能干啥 ②准备啥（工具/输入/决策三类合一）③怎么用（指 scenario-guides）④输入材料→文档体系→实现代码关系（新增核心心智图）⑤目录结构三层（模板方法/文档事实/代码骨架）⑥常见错误/问题 ⑦导航。
- `docs/README.md` 重构（「文档分区规则」→「项目文档体系与分区规则」）：新增 §1 输入/输出二分（人工输入 vision/inputs vs AI 输出 00-09+design）、§2 00-09 各自干什么、§3 规范约束（编号/追溯/阶段标签/只增不删/撰写见 doc-standards）；保留分区/裁剪/根目录约束等。
- `docs/vision/README.md`（新增）：标「人工输入区」定位，呼应 docs/README §1（#1 机制主力为已同步的 docs/README §1；本文件为模板仓本地增强）。
- `docs/inputs/README.md`：顶部补「人工输入区」显式标注 + 指向 docs/README §1。
- 后续 PR-2（MAINTAINERS/CONTRIBUTING/README 目录速览）、PR-3（git-guide/文件夹 README）另轮落地。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr1-v1.23.0.md`。

## v1.22.5（2026-07-02）

端到端验证（`zhiyan-digital-cs-platform` 同步 v1.22.4）发现并修复的灰色地带：

- **#1 修复 PowerShell fallback Null bug**（`sync-template.ps1` / `check-template.ps1` / `check-derived-sync.ps1`）：`Test-TemplateBash` 在 `Start-Process` 返回 Null（Git Bash 启动失败）时对 `$proc.ExitCode` 调用报 InvokeMethodOnNull，脚本在 probe 阶段终止未进 fallback；加 `$proc` Null 防御 → `Ready=$false` → 正常进 fallback。
- **#2 修复 check-derived-sync 工作区干净过严 + 误导提示**（`.sh` / `.ps1`）：工作区检查改为只看已跟踪改动（未跟踪项目内容如 `docs/inputs` 不阻塞）；失败提示精准化（见上方失败项，不再固定"scripts/check-template"）。
- **派生 README 规范**：`MAINTAINERS.md` 明确派生 README section 结构（简介 / 它能做什么 / 快速开始 / 当前阶段 / 目录速览 / 文档入口 / 模板关系）+ 约束（不照搬模板通用能力、保留模板关系 + VERSION、new-project 生成 + sync 不覆盖）；`new-project.sh` README 模板对齐（「当前能力」→「它能做什么」+ AI CLI 引导段收敛指 scenario-guides）。
- 提案：`_proposals/TEMPLATE-UPGRADE-fix-sync-derived-readme-v1.22.5.md`。

## v1.22.4（2026-07-02）

- `README.md` 开头通俗化：重写首段（「用 AI 按软件工程规范开发软件」+ 解决"AI 代码难维护"的目的），新增「它能做什么」能力段（6 条：生成工程文档体系 / 文档约束代码 + 六维度合规审查 / 分阶段交付 Demo→MVP→产品 / 场景引导 / 跨项目复用 + 经验回流 / 多 AI 工具 + 会话续接），基于模板实际能力梳理。
- `template-docs/beginner-guide.md`：15 章 → 5 章精简（适合谁 + 预期 / 起步 / 准备 / 文档与目录理解 / 常见错误与问题）；删 v1.22.3 精简后变空的操作/路由章节（§3/§6/§10/§11/§12/§15）；§4 路径 A 简化为直接引导 scenario-guides；保留环境 keyword。
- 提案：`_proposals/TEMPLATE-UPGRADE-refine-readme-beginner-v1.22.4.md`。

## v1.22.3（2026-07-02）

文档整理（v1.22.0–2 入口简化后的连带）：

- `README.md` 目录速览补缺失：`_archive/`、`tasks/`、骨架目录（`frontend/ backend/ tests/ docker/`）、`ai/prompts/`、`ai/doc-standards/`、`.github/`。
- `git-guide.md` §7 命令速查加交叉引用（脚本命令见 SOP 常用命令）。
- `CONTRIBUTING.md` / `MAINTAINERS.md`：修陈旧引用（5 分钟路径→快速开始、README 方法论同步 section→`template-sync.json`）；提案组织建议去重（归 `CONTRIBUTING.md` §3.1，MAINTAINERS 改引用）。
- `template-docs/beginner-guide.md`：操作/路由章节（§3/§10/§11/§12/§15）精简为指向 scenario-guides/SOP/README，强化「理解手册」定位（预期/准备/目录心智/常见错误）。
- `SOP.md` 场景索引标注为速查（完整剧本见 scenario-guides）。
- 提案：`_proposals/TEMPLATE-UPGRADE-cleanup-docs-v1.22.3.md`。

## v1.22.2（2026-07-01）

- `INIT-PROMPT.md` 简化为指针：删「场景→命令→Prompt」明细表（与 SOP 场景索引重复），改为指向 scenario-guides / SOP 场景索引 / commands-README / prompts-README 的入口指针；~13 处引用不动（文件保留，向下兼容派生项目）。
- `scripts/check-template.sh` 删 INIT-PROMPT 的 3 个 Prompt 明细断言（内容由 SOP 场景索引 + prompts/README 承担），保留 `require_file` 与「指向 commands-README」断言。
- 提案：`_proposals/TEMPLATE-UPGRADE-simplify-init-prompt.md`。

## v1.22.1（2026-07-01）

- 入口文档简化：README 瘦身到 1 屏（开头简介 + 快速开始三入口「说场景 / 找命令 / 理解设计」+ 当前版本 + 目录速览），删除「5 分钟最小路径」「我该看哪个文件」大表、常用命令、轻量项目路径等冗余 section。
- `SOP.md` 接收 README 的「常用命令」（派生使用者 / 模板维护者 / Windows 脚本入口矩阵），定位为速查表。
- `docs/README.md` 接收「轻量项目路径」。
- `template-docs/beginner-guide.md` 删冗余「路径 B」手动命令，路径 A 收拢环境入口 keyword，定位为「理解手册」；起步动作统一指向 scenario-guides。
- `scripts/check-template.sh` 配套调整断言：README 改为入口指引断言，详细命令断言移到 SOP，环境/烟测入口由 beginner-guide 断言覆盖。
- 提案：`_proposals/TEMPLATE-UPGRADE-simplify-entry-docs.md`。

## v1.22.0（2026-07-01）

- 新增场景引导编排层 `template-docs/scenario-guides.md` 与元命令 `ai/commands/scenario.md`（`/run scenario`）：按角色（A 使用者 / C 维护者）组织 23 个端到端场景剧本，用户说一个具体场景意图，AI 即按契约产出「做什么 + 为什么」引导计划，确认后逐步执行；含 cwd 路由入口（零资产 / 模板仓库 / 派生项目三分支）、A7 PLM 文档精修转换子场景、A9 阶段规划与 M1 元场景；每个场景步骤三层一一对应（做什么 / 为什么 / 机器执行）。
- `scenario-guides.md` 含前提条件声明：零资产（只有仓库链接）时 AI 读不到本文件，A0 冷启动需先手动获取资产（给出模板仓库 clone 地址与 `new-project.sh` 派生路径），拿到本地项目后才进入 AI 场景引导。
- 收敛 `README.md`、`template-docs/beginner-guide.md`、`template-docs/ai-cli-setup.md` 三处重复的新手 7 步话术，统一指向 `scenario-guides.md` 为唯一源；`ai/commands/README.md` 加「场景优先」约定与 `scenario` 命令行。
- 新增设计文档图表规范（`ai/document-lifecycle-rules.md §13`，默认 mermaid、可选 plantuml）与 `ai/project-rules.md §2.6` 图表格式偏好填项。
- 把 `project-review`(03) 实现合规审查补进 A10 场景；17 个 command 全部被场景编排覆盖。
- `template-sync.json` 纳入 `scenario-guides.md` 与 `scenario.md`；`SOP.md`、`README.md` 补场景引导入口；`scripts/check-template.sh` / `.ps1` 加场景引导、去账户化、防漂移断言（含新增 `require_absent_contains` 函数）。
- 提案：`_proposals/TEMPLATE-UPGRADE-scenario-guides.md`。

## v1.21.3（2026-07-01）

- `scripts/sync-template.ps1` 增加原生 PowerShell fallback：Git Bash / MSYS 无法从 PowerShell 启动时，仍可执行模板抓取、dry-run 差异预览、`--commit` 同步清单文件与 `ai/doc-standards/00-09` 规范镜像，并保留脏工作区保护。
- `scripts/check-derived-sync.ps1` 增加原生 PowerShell fallback：Git Bash 启动失败时仍可读取 `template-sync.json`、检查最近同步提交、放行 `ai/doc-standards/*` / 旧 `docs/_scaffold/*`，并拦截项目专属文件越界。
- 更新 Windows 入口说明与派生同步运行记录模板，要求记录是否触发 PowerShell fallback；`README.md`、`git-guide.md`、`MAINTAINERS.md` 与 `template-docs/env-setup.md` 同步澄清 fallback 边界。
- 归档已落地提案：`TEMPLATE-UPGRADE-sync-powershell-fallback.md`。
## v1.21.2（2026-06-30）

- 增强 `ai/prompts/review/16-docs-system-audit.md`：审计报告必须区分事实 / 追溯断点、横切传播残留、规范基线缺口、可行性 / 部署缺口和本地续接状态，避免把新版文档标准差异误判为业务事实错误。
- 补充旧派生文档兼容审计规则：对照 `ai/doc-standards/00-09` 时按语义等价和最小补齐处理，不要求逐字重写成示例骨架；历史 `F-*` 等编号优先用兼容矩阵闭合追溯。
- 为审计回梳增加修复后聚焦自检清单，覆盖 `git diff --check`、旧措辞残留、必需章节 / 追溯矩阵、悬空 ID 和本地续接状态。
- 归档 / 更新已吸收提案：`TEMPLATE-UPGRADE-docs-spec-sync.md`、`TEMPLATE-UPGRADE-docs-system-audit-prompt.md`；保留 `TEMPLATE-UPGRADE-sync-powershell-fallback.md` 作为后续较大功能待办。

## v1.21.1（2026-06-30）

- 优化新手入口顺序：`README.md` 与 `template-docs/beginner-guide.md` 前置 `scripts/check-prereqs.ps1` 环境自检，再进入 `new-project.sh`、`collect-env.ps1`、输入评审和文档生成。
- `README.md` 的 5 分钟路径在环境缺失时直接给出 `scripts/bootstrap-dev-env.ps1` 命令，并把“本地烟测项目”命令从派生项目使用者区移到模板维护者区，避免把烟测路径误当正式项目起步路径。
- 新增新手 AI CLI 推荐路径：`README.md`、`template-docs/beginner-guide.md` 与 `template-docs/ai-cli-setup.md` 提供首次打开 AI CLI 后可复制的引导提示词，让 AI 读取 `ai/index.md`、路由命令并辅助执行后续步骤。
- `template-docs/env-setup.md` 新增新手决策表，明确缺 Git Bash / `winget` / Node.js / Python / `gh` / AI CLI 时的下一步，以及本地烟测可跳过项。
- `template-docs/smoke-test.md` 与新手指南对齐，要求烟测验证“先检查环境、缺失项有下一步、再建项目”的最小链路。
- `scripts/new-project.sh` 生成的派生项目 README 改为指向 `template-docs/env-setup.md`，并优先使用 AI CLI 引导模式、`/run review-inputs`、`/run generate-docs`、`/run run-dev-task` 入口。
- `scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加防入口滞后断言，避免新手文档再次回到默认已安装环境的假设。

## v1.21.0（2026-06-29）

- 新增 `template-docs/derived-sync-report-template.md`，用于派生项目真实同步模板方法论后记录同步前后版本、执行命令、边界检查结果、问题和可回流优化点。
- `/run sync-methodology` 与 `ai/prompts/maintainers/12-sync-template.md` 在 `check-derived-sync` 后增加同步运行记录步骤，并提示将可通用问题转写为去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。
- `/run post-sync-cleanup` 与 `ai/prompts/maintainers/15-post-sync-cleanup.md` 支持读取最近同步运行记录，提炼待确认项和模板优化回流建议。
- `README.md`、`SOP.md`、`MAINTAINERS.md`、`CONTRIBUTING.md`、`template-sync.json`、`scripts/sync-template.sh` 与 `scripts/check-template.sh` 同步纳入运行记录模板和防入口滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-derived-sync-observation.md`。

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
