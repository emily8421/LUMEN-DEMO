# 详细设计：帮助与引导体系（help-onboarding）

> 按「完整骨架 + 阶段增量」：`[P1]` 写细。对应 REQ-011（可用性收口，不新增 REQ）；面向最终用户的应用内帮助。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 设计对象 | 帮助与引导体系（COMP-002） |
| 文档路径 | docs/design/help-onboarding.md |
| 输入来源 | docs/env/user-guide.md（现状）、frontend-interaction.md §9.5（Doc-First 基线）、frontend/src/app/TopBar.tsx 帮助弹层现状、主流产品帮助体系（Notion / Slack / Linear / Obsidian） |
| 覆盖 REQ | REQ-011（可用性收口，不新增 REQ） |
| 所属 Phase | [P1]（体验层）· 随 Phase2C 增强 / 可用性收口迭代 |
| 交付物形态 | Demo |
| 当前状态 | 规划中（2026-08-06 拍板：Wave 1 先做 L0+L1；L2-L4 后续） |
| 流程 ID | Flow-H-001（首次引导）、Flow-H-002（帮助中心检索，L2） |
| 最后更新 | 2026-08-06 |
| 下游影响 | 08 Sprint-25（L0+L1）、09 TC-P2-HELP-001 |

## 1. 职责与边界

职责：
- 应用内帮助入口（顶栏「?」）→ 可检索帮助内容
- 首次使用引导（登录后一次性 3 步 + 新手清单）
- 各视图空状态引导（下一步做什么）
- 关键概念上下文提示（权限 / 导入 / 本地挂载 / 快速录入）
- 帮助内容单一来源（docs/env/user-guide.md）

不做：
- 部署 / 运维 / 演示 SOP（属 docs/env/demo-guide.md）
- 教程视频 / 第三方 help 平台 / 工单系统
- 不新增后端 API 与权限模型（帮助为公开静态内容）

## 2. 上游依据与追溯

- 现状：顶栏「?」弹层仅 6 行文字（TopBar.tsx:105）；完整手册 docs/env/user-guide.md（16 章）产品内不可达；无首次引导、无空状态指引、无上下文帮助。
- 基线：frontend-interaction.md §9.5 Doc-First（欢迎页 WelcomeFeature 已存在）。
- 主流参考（模式提炼）：Notion / Slack 首次引导清单 + 可搜索帮助中心；Linear / Discord 快捷键面板与字段级提示；Obsidian 帮助即内容。

## 3. 核心流程 / 状态机

### Flow-H-001：首次引导（L1）
登录成功 → 判断 onboarding 进度（localStorage key `lumen-demo-onboarding`）→ 未完成：弹引导 3 步（①新建文档 ②保存后去搜索 ③去问答提问），每步可跳过 / 直达对应视图；完成勾选 → 下次不再弹出；欢迎页展示新手清单（3-5 项）。

### Flow-H-002：帮助中心检索（L2）
顶栏「?」→ 帮助面板：顶部搜索 + 分类列表（快速开始 / 文档 / 搜索问答 / 导入导出 / 权限 / 本地挂载 / FAQ / 快捷键）→ 命中高亮 → 底部「查看完整手册」链接。

### 空状态映射（L1）

| 视图 | 空态引导 |
|---|---|
| 文档 | 「新建文档」/「导入 .md、.txt」按钮 |
| 搜索 / 问答 | 提示「先新建或导入文档（示例文档未建索引）」 |
| 术语 / 标签 / 时间线 | 最小说明 + 入口 |

## 4. 数据、接口与权限契约

- 内容源：docs/env/user-guide.md（唯一事实源，前端帮助面板渲染或内联数据引用，避免双写漂移）。
- 前端状态：onboarding 进度 / 新手清单存 localStorage（key `lumen-demo-onboarding`），非敏感。
- 接口：无新增后端 API；不涉及权限（帮助为公开静态内容）。
- 组件：HelpPanel（独立组件防 WSG-004 文件膨胀）、onboarding store。

## 5. 失败、异常与降级路径

- localStorage 不可用 / 被清 → 引导重出但可跳过，不阻塞主流程。
- 帮助内容源加载失败 → 内联兜底文案（保留现 6 行速查）。
- 浏览器不支持 FSA / 非桌面 → 帮助仍可用；引导不依赖 FSA。

## 6. 阶段增量、readiness gate 与实现状态

- L0 + L1（Wave 1 · Sprint-25）：内容源重组 + 首次引导 / 新手清单 / 空状态。状态：已规划·待实现。
- L2（后续）：可搜索帮助中心。依赖 L0 内容源。
- L3 / L4（随功能迭代）：上下文「?」+ 错误关联帮助 + 快捷键速查。
- 门禁：不引第三方依赖；HelpPanel 独立文件；帮助内容单一来源。

## 7. 验证与验收追溯

- TC-P2-HELP-001（docs/09）：新用户路径（登录 → 引导 → 建文档 → 搜索命中 → 问答）+ 空状态 + 帮助可搜「导入」+ 单一来源核对。
- 验证：`volta run --node 22.17.1 npm run build` + 浏览器人工 smoke；TC-P1-014 回归。

## 8. 与其他子系统交互

- TopBar：「?」入口替换为 HelpPanel。
- WelcomeFeature：新手清单 / 引导步骤落地。
- DocumentsFeature / SearchFeature / QueryFeature 等：空状态文案与按钮。
- notice / 错误：错误提示关联帮助（L3）。

## 9. 实现偏差 / 设计回写

- 初始为空；实现后按 design-doc 标准回写。

## 10. 待人工确认项

| ID | 待确认项 | AI 建议 | 依据 | 备选 | 取舍影响 |
|---|---|---|---|---|---|
| help-scope | Wave 1 是否只做 L0+L1 | 是（先解决新用户看不懂） | 成本最低收益最大 | 连 L2 一起 | L2 依赖 L0，晚做不阻塞 |
| help-media | 帮助内容是否需要截图 / 演示动画 | 首版纯文字 + 步骤，截图后补 | 成本 | 含截图 | 影响 Sprint-25 工作量 |
| help-source | 帮助面板渲染方式 | 渲染 user-guide 内容源（单一来源） | 防双写漂移 | 前端内置独立 help 数据 | 影响维护成本 |
