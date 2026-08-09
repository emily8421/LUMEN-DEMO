# 03 产品需求文档（PRD）

> 基于 00-02，明确功能范围、优先级、阶段路线图。
> **§3 路线图是阶段标签 `[P1]` / `[P2]` / `[愿景]` 的唯一来源**；所有设计文档的阶段标签必须与此一致（global-rules §8）。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 输入来源 | `docs/01-user-requirements.md`、`docs/02-srs.md`、`ai/project-rules.md` §1 |
| 覆盖 REQ | REQ-001..REQ-042（按 Phase1 / Phase1.5A / Phase1.5B / Phase2A / Phase2B / Phase2C / Phase2D / 愿景分阶段；REQ-040..047 为 Phase2D 账户与多人权限（已完成 2026-08-07 收口）） |
| 当前状态 | 已确认（§3 为阶段标签唯一来源；Phase1.5B 单文档 PDF 导出已完成；Phase2A 个人知识组织已完成；Phase2B 团队 MVP 已完成（2026-08-05 收口）；Phase2C 本地知识源接入已完成（2026-08-06，Sprint-23C TC-P2-VAULT-001 通过 / PR#108 v2.0.0）；**Phase2D 账户与多人权限已完成（2026-08-07 收口）：Sprint-26 账号体系基础（TC-P2-AUTH-001 / PR#112 v3.0.0）+ Sprint-27 权限多人化（TC-P2-ACC-001 / PR#114）+ Sprint-28 角色分层 + 用户管理 + 团队空间加入（TC-P2-ACC-002 / PR#117 v3.1.0）三 slice 全部验收通过、退出标准达成；**项目 demo 目标已达成（2026-08-07 评估收尾），进入维护态，下一阶段未定义；成果总结见 `docs/research/2026-08-07-project-closure-summary.md`**） |
| 最后更新 | 2026-08-07（Phase2D 收口：Sprint-26/27/28 三 slice 全部验收通过，退出标准达成，不升 Phase；Sprint-27 P2 两项 + Sprint-28 偏差经用户确认全接受、留后续；下一阶段范围待用户定义）；前次 2026-08-07（Phase2D 立项 + Sprint-26/27/28 实现） |

## 1. 功能范围（完整，对齐 01 / 02）

完整清单见 `docs/01-user-requirements.md`（U-01..U-43）与 `02-srs.md`（REQ-001..REQ-038）。

- 已完成基线：Phase1（U-01..U-12、U-42 / REQ-001..REQ-011、REQ-036）、Phase1.5A（U-43 / REQ-037、REQ-038）、Phase2A（U-13、U-31、U-32 / REQ-012、REQ-025、REQ-026）
- 个人增强（Phase1.5B）：U-33 / REQ-027 已实现并通过 TC-P1-017；真实 Word/PDF 文本提取、zhparser 中文分词增强仍为后续候选
- 团队 MVP（Phase2B）：U-14..U-20、U-30 / REQ-013..REQ-017、REQ-024（其中 U-18..U-20 不进首批团队 MVP）；REQ-039 文档目录树（第三 slice 候选）
- Phase2C 本地知识源接入：U-21 / REQ-018 模式 B（仅本地挂载，浏览器 File System Access，RG-009 Go；**已完成 Sprint-23C**）；模式 A 导入数据库已随 Phase2B 交付
- Phase2D 账户与多人权限（已完成 2026-08-07 收口）：真实多用户账号体系（注册 / 凭证登录 / 登出会话，REQ-040..042）+ 多人权限（REQ-043/044 owner 过滤 + 跨用户隔离）+ 团队治理（REQ-045..047 角色分层 + 用户管理 + 团队空间加入）；从 Demo 占位账号侧升级，交付物形态团队验证；Sprint-26/27/28 三 slice 全部验收通过；**维护态批5（Sprint-30，v3.7.0，2026-08-09 已完成）：REQ-050 成员空间可见性（admin 用户详情抽屉，跨空间授予 / 撤销）+ REQ-051 登录密码小眼睛 / 忘记密码自助重置**
- 远期愿景：U-22..U-29、U-34..U-41 / REQ-019..REQ-023、REQ-028..REQ-035

## 2. 优先级与取舍

> 本节是跨阶段的**产品优先级**排序（Must / Should / Could），与 §3 的**阶段标签** `[P1]` / `[P2]` / `[愿景]` 是正交维度，含义不同、不得混用：优先级回答"多重要"，阶段标签回答"在哪个 Phase 做"。避免把 Phase1（Demo）功能误读为 MVP（Phase2）。

| 功能或 REQ | 优先级 | 是否进入当前 Phase | 理由 | 风险 |
|---|---|---|---|---|
| F-001 空间隔离 + 权限（REQ-001..003） | Must | 是（Phase1 Demo） | 权限与检索底座，核心闭环必须 | — |
| F-002 文档 CRUD + 版本（REQ-004..006） | Must | 是（Phase1 Demo） | 知识沉淀基础 | — |
| F-003 全文 / 语义搜索 + RAG 问答（REQ-007 / 008） | Must | 是（Phase1 Demo） | 核心价值：带来源问答 | 真实 LLM / 向量召回资源占用 |
| F-004 内容导入（REQ-009 / 010） | Must | 是（Phase1 Demo，降级） | 存量资料入库 | 真实 Word / PDF / OCR 留后续（05/09 边界） |
| F-006 术语管理（REQ-036） | Must | 是（Phase1 Demo） | 口径对齐，问答不误解术语 | — |
| F-005 桌面端体验（REQ-011） | Should | 是（Phase1 Demo） | 浏览器即用，免安装 | — |
| 私有文档（REQ-003 / U-12） | Should | 是（Phase1 Demo） | 个人草稿不泄露 | — |
| P1.5A 个人可用 Alpha（REQ-037 / 038） | Should | 已完成 | 解决“资料放不进去、备份不出来”两个真实使用阻塞 | Sprint-16/17 完成，TC-P1-015/016 通过；不引重依赖 |
| P1.5B 个人增强 Beta（REQ-027 + REQ-009 真实文本提取 / REQ-007 分词增强） | Should | 是（Alpha 后） | PDF、Word/PDF 文本提取、中文搜索改善体验，但不应阻塞 Alpha | REQ-027 已实现并通过 TC-P1-017；真实 Word/PDF 解析需选型验证 |
| Phase2A 个人知识组织（REQ-012 / 026 / 025） | Could | 已完成 | 资料多起来后需要标签、内链和轻量条目避免变乱 | TC-P2-TAG/LINK/QUICK-001 通过，2026-07-20 closure |
| Phase2B 团队 MVP（REQ-014 / 013 / 024，后续 015..017；候选 REQ-039 文档目录树） | Could | 否（个人可用后） | 小团队协作和写作辅助增强；文档目录树为第三 slice 候选 | 需 Phase2 重新确认范围 / 进入 / 退出标准 |
| F-009 / F-010 热力矩阵 / 因果推理 / 对外简报等（REQ-018..023 / 028..035） | 待验证 | REQ-018 Vault 已升 Phase2C；其余否（愿景） | REQ-018 RG-009 Go；其余依赖未定数据来源或高难度 AI | REQ-018 已定阶段；其余需 05 技术验证 |

## 2.1 功能清单（F-ID）

| F-ID | 功能描述 | 覆盖 REQ | 阶段 | 交付物形态 | 状态 |
|---|---|---|---|---|---|
| F-001 | 空间隔离与权限底座 | REQ-001 / REQ-002 / REQ-003 | `[P1]` | Demo | Phase1 必演示 |
| F-002 | 文档管理与版本 | REQ-004 / REQ-005 / REQ-006 | `[P1]` | Demo | Phase1 必演示 |
| F-003 | 检索与 RAG 问答 | REQ-007 / REQ-008 | `[P1]` | Demo | Phase1 必演示（真实 LLM + hybrid search） |
| F-004 | 内容导入降级闭环 | REQ-009 / REQ-010 | `[P1]` | Demo | Phase1 降级演示；真实 Word / PDF / OCR 留后续 |
| F-005 | 桌面端访问 | REQ-011 | `[P1]` | Demo | Phase1 必演示 |
| F-006 | 术语管理与口径对齐 | REQ-036 | `[P1]` | Demo | Phase1 必演示 |
| F-007 | 个人知识组织增强 | REQ-012 / REQ-025 / REQ-026 / REQ-039 | `[P2]` | 个人知识组织 | Phase2A 已完成（TC-P2-TAG-001 / LINK-001 / QUICK-001 通过）；REQ-039 文档目录树为 Phase2B 第三 slice 候选 |
| F-008 | 写作、团队协作与跨端体验 | REQ-013 / REQ-014 / REQ-015 / REQ-016 / REQ-017 / REQ-024 | `[P2]` | 团队 MVP / 后续 | 骨架，Phase2B 时细化 |
| F-009 | 存量知识源与交付能力 | REQ-019 / REQ-022 / REQ-023 / REQ-028 / REQ-035 | `[愿景]` | 产品 | 待技术验证 |
| F-009a | 本地知识源挂载（Obsidian Vault / 本地 Markdown 文件夹） | REQ-018 | `[P2]` | 本地知识源接入 MVP | Phase2C·已设计（模式 B 浏览器 File System Access，RG-009 Go）；模式 A 导入数据库已随 Phase2B 交付 |
| F-010 | 情报分析与高风险 AI 能力 | REQ-020 / REQ-021 / REQ-029 / REQ-030 / REQ-031 / REQ-032 / REQ-033 / REQ-034 | `[愿景]` | 产品 | 高风险，待技术验证 |
| F-011 | P1.5 导入 / 导出可用性收口 | REQ-027 / REQ-037 / REQ-038 | `[P1]` | 个人可用增强 | REQ-037/038 为 Alpha 已实现；REQ-027 为 Beta 已实现 |
| F-012 | 账户与认证 | REQ-040 / REQ-041 / REQ-042 | `[P2]` | 团队验证 | Phase2D·Sprint-26 已完成（PR#112 v3.0.0，TC-P2-AUTH-001 通过）：注册 / 凭证登录 bcrypt / 登出会话·不透明 token + `lumen_sessions`；权限多人化 Sprint-27 已完成 / 角色与用户管理 UI 已随 Sprint-28 完成 |
| F-013 | 权限多人化（owner 过滤与隔离） | REQ-043 / REQ-044（REQ-001/002/003 扩展） | `[P2]` | 团队验证 | Phase2D·Sprint-27 已完成（2026-08-07，PR#114，TC-P2-ACC-001 通过）：owner_id 跨用户过滤 + 私有按 owner 过滤 + 跨用户隔离回归；全局角色 / 用户管理 UI 已随 Sprint-28 完成 |
| F-014 | 角色分层与用户管理 | REQ-045 / REQ-046 | `[P2]` | 团队验证 | Phase2D·已完成（2026-08-07，Sprint-28，PR#117 v3.1.0，TC-P2-ACC-002 通过）：全局角色 admin/member（`lumen_users.role`）+ admin 域用户管理后台（用户列表 / 改角色 / 禁用启用）；管理接口仅 admin（4030） |
| F-015 | 团队空间加入 | REQ-047 | `[P2]` | 团队验证 | Phase2D·已完成（2026-08-07，Sprint-28，PR#117 v3.1.0，TC-P2-ACC-002 通过）：space 域成员 CRUD（按 email 搜索添加 / 改空间角色 / 移除）+ 空间设置成员管理 UI |

## 3. 阶段路线图

> 路线图原则：**先以 Demo 跑通核心价值闭环（Phase1），再优先完成个人可用（P1.5A/B），资料量上来后补个人知识组织（Phase2A），最后再进入团队 MVP（Phase2B）。**
> 每个阶段按 global-rules §8.1 同时声明**功能范围**（`[P1]` / `[P2]` / `[愿景]`）与**交付物形态**（Demo / MVP / 产品），按"原位增量"落地——升阶段不重写需求，只动 04-08 的细节。

**阶段双维度总览**（一眼可见交付物形态演进；各阶段详情见下方子节）：

| 阶段 | 功能范围 | 交付物形态 | 状态 | 进入标准 | 退出标准 |
|---|---|---|---|---|---|
| Phase1（已完成 / 当前基线） | `[P1]` · REQ-001..011、REQ-036 | **Demo** | 已完成（Conditional Go） | 项目起点（无前置 Phase） | REQ-001..011、REQ-036 可演示 + REQ-009/010 降级边界清晰 + 产品红线未被破坏 |
| Phase1.5A（已完成） | `[P1]` · REQ-037、REQ-038 | **个人可用 Alpha** | 已完成（Sprint-16/17，TC-P1-015/016 通过） | Phase1 Demo closure 已完成；Sprint-0′ 框架补课不阻塞 | 批量 / 文件夹 `.md/.txt` 入库可搜可问答；单文档 `.md` 与空间 ZIP 可导出备份；权限过滤正确；产品红线未破坏 |
| Phase1.5B（Alpha 后） | `[P1]` · REQ-027 + REQ-009 真实文本提取 / REQ-007 搜索增强候选 | **个人增强 Beta** | PDF 已实现；Word-PDF / zhparser 候选 | Phase1.5A 可用；PDF 已通过选型与环境验证；Word-PDF 解析 / zhparser 分别通过选型与环境验证 | PDF 中文导出可用（已达成）；真实 Word/PDF 文本提取可用或明确降级；中文检索体验增强；不得阻塞 Alpha |
| Phase2A（个人知识组织 · 已完成） | `[P2]` · REQ-026、REQ-012、REQ-025 | **个人知识组织** | 已完成（REQ-026 / REQ-012 / REQ-025 三个 vertical slice 通过） | Phase1.5A 使真实资料量进入系统；06/07/09 已补最小契约与 TC | 文档可用内链 / 反链互联，可用标签组织，可快速录入轻量条目；权限过滤不泄露 |
| Phase2B（团队 MVP） | `[P2]` · REQ-014 首批核心 + REQ-013/024 时间轴紧随 + REQ-039 文档目录树（第三 slice 候选）；REQ-015/016/017 延后 | **团队 MVP** | **已完成（2026-08-05 收口；REQ-014 / REQ-013a+024 / REQ-039 验收通过）** | Phase2A 稳定；04/05 Phase2 设计补强；**RG-008（AI 数据外发风险接受）Go**；06/07 契约齐备；Sprint-19/20 已规划 | 小团队可真实使用知识组织与写作辅助；AI 润色数据外发风险已接受（护栏见 `ai/project-rules.md` §2.1 / `docs/05-tech-spec.md` RG-008）；产品红线未破坏 |
| Phase2C（本地知识源接入） | `[P2]` · REQ-018 模式 B（仅本地挂载） | **本地知识源接入 MVP** | **已完成（2026-08-06，Sprint-23C TC-P2-VAULT-001 通过 / PR#108 v2.0.0）** | RG-009 PoC Go；`06/07/09` 契约齐备 | TC-P2-VAULT-001 通过；本地挂载内容不进服务端 RAG（硬天花板）；隐私边界未被破坏 |
| Phase2D（账户与多人权限） | `[P2]` · REQ-040.. 账号体系基础（Sprint-26 已完成）；权限多人化（Sprint-27 已完成）；角色 / 用户管理 + 团队空间加入（Sprint-28 已完成） | **团队验证** | **Sprint-26 已完成（2026-08-07，PR#112 v3.0.0）；Sprint-27 已完成（2026-08-07，PR#114，TC-P2-ACC-001 通过）；Sprint-28 已完成（2026-08-07，PR#117 v3.1.0，TC-P2-ACC-002 通过）；Phase2D 收口（2026-08-07）** | Phase2C 完成；认证选型确认（bcrypt + 不透明 token session）；readiness gate（密码哈希 / token session 安全 / 跨用户隔离）Go（RG-011/012/013） | Sprint-26：真实账号可注册 / 凭证登录 / 登出 / 统一鉴权 / 基础 UI；demo 模式保留开关 + 物理隔离；凭证安全与跨用户隔离红线未破坏。Sprint-27：TC-P2-ACC-001 通过（私有仅 owner + 全路径跨用户隔离 + 空间隔离切换回归）。Sprint-28：TC-P2-ACC-002 通过（全局角色分层 + 用户管理后台 + 团队空间加入） |
| 远期愿景（不承诺时间） | `[愿景]` · REQ-019..023、REQ-028..035（REQ-018 已升 Phase2C） | **产品** | 骨架 | 05 技术验证高难度 AI 可行 | 不承诺时间 |

### Phase1 —— 已完成基线（功能范围 `[P1]` · 交付物形态 **Demo**）
- **目标**：在双空间隔离 + 三级权限下，跑通"导入 → 检索 → 问答带来源 → 编辑留版本 → 术语对齐"的最小闭环，演示 LUMEN 核心价值。
- **功能范围 `[P1]`**：REQ-001..REQ-011、REQ-036（U-01..U-12、U-42）。
- **交付物形态 Demo**：核心价值可演示，可用最简实现 / 明确 Mock，**保留产品红线**（库外问答回复"未找到"、不编造）；不默认称为 MVP。
- **演示场景**：Kira 入职第一天，用搜索 + 问答定位"场景联动 200ms 延迟约束"，答案带来源，并按 brightlite-team 术语表解释"触发延迟"。
- **进入标准**：本阶段即项目起点（无前置 Phase）。
- **退出标准（Demo 验收）**：REQ-001..011、REQ-036 全部可演示（见 `docs/09-verification.md` §2 矩阵）；其中 REQ-009/010 以 `.md` / `.txt` 已提取文本降级演示，真实 Word / PDF 解析与 OCR 不作为 Phase1 Demo 退出阻塞；产品红线未被破坏。

### Phase1.5A —— 个人可用 Alpha（功能范围 `[P1]` · 交付物形态 **个人可用 Alpha**）
- **目标**：最快让用户个人能把 LUMEN 当日常工具用起来，解决“资料放不进去、备份不出来”的阻塞。
- **功能范围 `[P1]`**：REQ-037 批量 / 文件夹 `.md` / `.txt` 导入、REQ-038 单文档 `.md` + 空间 ZIP 导出。
- **交付物形态个人可用 Alpha**：可真实导入一批个人资料、搜索、问答、编辑、导出备份；仍不等同团队 MVP。
- **进入标准**：Phase1 Demo closure 已完成；Sprint-0′ 框架补课不阻塞。
- **退出标准**：TC-P1-015 / TC-P1-016 通过；导入成功 / 失败逐条可见；同名跳过；ZIP 权限过滤正确；产品红线未被破坏。

### Phase1.5B —— 个人增强 Beta（功能范围 `[P1]` · 交付物形态 **个人增强 Beta**）
- **目标**：在 Alpha 可用后补高价值增强，改善格式兼容、导出排版和中文检索体验。
- **功能范围 `[P1]`**：REQ-027 单文档 PDF 导出；REQ-009 真实 Word/PDF 文本提取候选；REQ-007 zhparser 中文分词增强候选。
- **交付物形态个人增强 Beta**：PDF 可对外分享、更多存量资料可直接入库、中文搜索更顺手。
- **进入标准**：Phase1.5A 已可用；PDF / Word-PDF 解析 / zhparser 各自完成选型和环境验证。
- **退出标准**：Sprint-18 已在 RG-006 Go 后通过 TC-P1-017；真实 Word/PDF 解析和 zhparser 可独立 Go / No-Go，不得反向阻塞 Alpha。

### Phase2A —— 已完成（功能范围 `[P2]` · 交付物形态 **个人知识组织**）
- **目标**：资料量上来后，补标签、内部链接和快速录入，让个人知识库不变成文件堆。
- **功能范围 `[P2]`**：REQ-026 内部链接 + 反向链接、REQ-012 标签视图、REQ-025 快速录入索引条目。
- **交付物形态个人知识组织**：文档可互联、按主题聚合、无原文条目也能快速沉淀。
- **进入标准**：Phase1.5A 个人可用 Alpha 已完成；`06/07/09` 为 REQ-012/025/026 补最小可实现契约和 TC。
- **退出标准**：内链 / 反链、标签筛选、快速录入三个可真实使用 vertical slice 已通过验收；权限过滤不泄露。

### Phase2B —— 已完成（功能范围 `[P2]` · 交付物形态 **团队 MVP**）
- **目标**：从个人可用推进到小团队可真实使用，补写作辅助与团队化体验。
- **功能范围 `[P2]`**：REQ-014 AI 润色 + 写作引用（**首批核心，已落地**）；**REQ-013a 主题时间线（按关键词/标签生成事件时间线）** + REQ-024 时间轴密度热条（**第二 slice，已实现并补齐验证**：候选 A 实时聚合 + 关键词/标签驱动 + TL-C-001..011 已确认，运行态 API smoke / Edge headless 浏览器 smoke / 真实 PG 大数据性能 smoke 已通过；**关联图 REQ-013b 愿景**）；REQ-039 文档目录树（**第三 slice**，folder-tree 基础能力已完成，浏览器自动化 smoke 已补）；REQ-015 / 016 / 017 延后确认。
- **交付物形态 MVP**：可真实上线给小团队试用，补齐 Phase1 Demo 缺的生产要素，而非演示原型。
- **进入标准**：Phase2A 稳定；`04/05` Phase2 设计补强、**RG-008（AI 数据外发风险接受）Go**、`06/07/09` MVP 级契约齐备、Sprint-11 UI/WSG 门禁重跑。
- **退出标准**：团队使用场景有真实验收 TC；**AI 润色数据外发风险已接受（真实外发 + 权限护栏，见 `ai/project-rules.md` §2.1 / `docs/05-tech-spec.md` RG-008）**；产品红线未被破坏。
- **收口（2026-08-05）**：三项功能范围全部完成验收——REQ-014（TC-P2-AI-001）、REQ-013a/024（TC-P2-TL-001）、REQ-039（TC-P2-FOLDER-001）；退出标准三条达成，详见 `docs/09-verification.md` §5。

### Phase2C —— 本地知识源接入（功能范围 `[P2]` · 交付物形态 **本地知识源接入 MVP**）
- **目标**：让用户把涉隐私 / 不愿入库的本地知识库（Obsidian vault / 本地 Markdown 文件夹）以"仅本地挂载"方式在 LUMEN 内一并浏览与本地搜索，数据不出本机。
- **功能范围 `[P2]`**：REQ-018 模式 B「仅本地挂载」（U-21）。模式 A「导入数据库」已随 Phase2B 交付（复用 REQ-037/039），不在本阶段重复。
- **交付物形态 本地知识源接入 MVP**：浏览器 File System Access 句柄 + IndexedDB 持久化 + 本地索引 / 搜索 + 左侧文件管理器上下分区（上层 LUMEN DB / 下层本地挂载·未入库）+ 按需导入走 API-029；可真实用于本人管理私密库。**硬天花板**：仅本地挂载内容不进服务端 RAG（浏览器句柄后端读不到），要 AI 能力须导入（模式 A）或上桌面 agent（留更后）。
- **进入标准**：RG-009 PoC Go（2026-08-05，8 能力 + 5 场景，刷新自动恢复 granted）；`06/07/09` 契约齐备（`lumen_vault_mounts` 仅元数据 / 模式 B 后端零新 API / TC-P2-VAULT-001 已定义）。
- **退出标准**：TC-P2-VAULT-001 通过（授权+刷新恢复 / 1000+ 本地树 / IndexedDB 本地搜索 / 左侧分区视觉隔离+不进团队 RAG / 按需导入走 API-029 / 隐私红线不上传）；产品红线（不上传、不越权）未被破坏。

### Phase2D —— 账户与多人权限（功能范围 `[P2]` · 交付物形态 **团队验证** · **已完成 2026-08-07 收口**）
- **目标**：把 Demo 占位的账号侧（无密码 / 3 seed 用户 / 手撸 token）升级为真实多用户账号体系，完成「账号 → 权限 → 团队协作」闭环，为团队验证打基础。
- **功能范围 `[P2]`**：REQ-040/041/042 账号体系基础（注册 / 凭证登录 bcrypt / 登出会话，不透明 token + `lumen_sessions`）+ REQ-043/044 权限多人化（REQ-001/002/003 扩展：owner_id 跨用户过滤 + 私有按 owner 过滤 + external 仅 owner 可写 + 跨用户隔离回归）+ REQ-045/046/047 角色分层 + 用户管理 + 团队空间加入（`lumen_users.role` admin/member + admin 域用户管理 + space 域成员 CRUD，migration 016）；REQ-016 多人实时协作留后续。三 slice 拆分（Sprint-26/27/28）见 `docs/08-dev-plan.md` Sprint 总览 + `docs/design/accounts-auth.md` §17/§18。
- **交付物形态 团队验证**：真实账号可注册 / 凭证登录 / 登出，凭证安全（bcrypt 哈希、token 可撤销），13 router 统一 `get_current_user` 鉴权；**demo 模式（`create_demo_token` + alice/kira/brightlite-member 无密码快速登录）保留为 env 开关 + 物理隔离护栏（PG 仓储强制真实认证，内存仓储 `demo_repository` 允许 demo）**，真实账号为正式路径；admin 可治理用户与空间成员（管理能力后端强制鉴权，非 admin 4030，用户列表不暴露 `password_hash`）。
- **进入标准**：Phase2C 完成；认证选型确认（bcrypt + 不透明 token session，`secrets` 标准库零新 token 依赖）；readiness gate——密码哈希选型 / token session 安全（密钥 env 注入、TTL、撤销）/ 跨用户隔离回归——Go（RG-011/012/013，见 `docs/05-tech-spec.md` + `docs/design/accounts-auth.md`）。
- **退出标准**：TC-P2-AUTH-001（注册 / 凭证登录 / 登出 / 会话撤销 / 续期轮换）+ TC-P2-ACC-001（私有仅 owner / 全路径跨用户隔离 / 空间隔离切换回归）+ TC-P2-ACC-002（admin/member 角色校验 + admin 域用户管理 + space 域成员管理）通过；13 router 统一鉴权且 demo 模式开关可切；登录失败锁定 + 审计日志生效；权限红线（凭证安全 / 跨用户隔离 / 管理接口仅 admin / 用户列表不暴露 `password_hash`）未被破坏。
- **硬约束**：Sprint-26 只立账号基础不做权限多人化实质改造；不做 REQ-016 多人实时协作、移除用户 / 重置密码 / 邀请码 / 邀请链接（留候选或后续）；不引入新依赖；不因 demo 仓储类型旁路管理鉴权。
- **收口结论（2026-08-07）**：Phase2D 三 slice（Sprint-26/27/28）退出标准全部达成——TC-P2-AUTH-001 / TC-P2-ACC-001 / TC-P2-ACC-002 通过（PR#114 / PR#117 v3.1.0），权限红线（凭证安全 / 跨用户隔离 / 管理接口仅 admin / 用户列表不暴露 `password_hash`）未被破坏，「账号 → 权限 → 团队协作」闭环成形。已知偏差经用户确认全接受、留后续，不阻塞收口——`accounts-auth` §18.9（API-044/046 未分页 / `last_login_at` 未显式排序 / API-045/048 无 `updated_at` / refresh 不含 `role`）+ Sprint-27 P2（`visible_document_where_clause` 未使用 / `upsert_link` 目标解析）。不升 Phase；下一阶段范围待用户定义（候选：移除用户 / 重置密码 / 邀请码 / REQ-016 / 真实团队端到端验证 / 产品化）。

### 远期愿景（不承诺时间）（功能范围 `[愿景]` · 交付物形态 **产品**）
- **目标**：补存量知识接入、**情报分析（i2 精神）**、情报交付能力——情报分析（路径推理 / 矛盾检测 / 证据地图等）是 v18 强调的远期差异化方向。
- **功能范围 `[愿景]`**：REQ-019..REQ-023、REQ-028..REQ-035（REQ-018 已升 Phase2C）。
- **交付物形态 产品**：愿景最终交付物默认为产品，全功能生产化、覆盖运营级要求；本阶段不承诺时间。
- **前置**：热力矩阵 / 因果推理 / 矛盾检测 / 假设检验等高难度 AI 需 05 技术方案验证可行后再纳入某 Phase。

## 4. REQ 覆盖矩阵

> 本表用于固定 `02-srs` 的全部 REQ 在 PRD 层的阶段归属与交付物形态；不得据此扩大 Phase1 范围。

| REQ-ID | F-ID | 功能 / 产品能力 | 阶段 | 交付物形态 | 覆盖状态 |
|---|---|---|---|---|---|
| REQ-001 | F-001 | 多空间隔离 | `[P1]` | Demo | Phase1 必演示 |
| REQ-002 | F-001 | 空间切换 | `[P1]` | Demo | Phase1 必演示 |
| REQ-003 | F-001 | 文档权限分级 / 私有文档 | `[P1]` | Demo | Phase1 必演示 |
| REQ-004 | F-002 | Markdown 文档 CRUD | `[P1]` | Demo | Phase1 必演示 |
| REQ-005 | F-002 | 行内编辑 | `[P1]` | Demo | Phase1 必演示 |
| REQ-006 | F-002 | 版本历史 | `[P1]` | Demo | Phase1 必演示 |
| REQ-007 | F-003 | 全文 / 语义搜索 | `[P1]` | Demo | Phase1 必演示（hybrid：关键词 + `ts_vector` SQL 候选 + pgvector 语义召回） |
| REQ-008 | F-003 | AI 问答（RAG） | `[P1]` | Demo | Phase1 必演示 |
| REQ-009 | F-004 | 多格式导入 | `[P1]` | Demo | Phase1 降级演示：`.md` / `.txt` 已提取文本入库；真实 Word / PDF 解析留后续真实化 |
| REQ-010 | F-004 | 图片 / 白板 OCR | `[P1]` | Demo | Phase1 降级演示：以已提取文本替代；OCR 引擎真实化留后续阶段（RG-003 No-Go） |
| REQ-011 | F-005 | 桌面浏览器访问 | `[P1]` | Demo | Phase1 必演示 |
| REQ-012 | F-007 | 标签视图 | `[P2]` | 个人知识组织 | Phase2A 最小版已细化（扁平标签 + 独立视图 + 单标签筛选 + 文档详情打标签；见 02/06/07/09） |
| REQ-013 | F-008 | **主题时间线（REQ-013a）+ 关联图视图（REQ-013b）** | `[P2]` | 团队 MVP | **REQ-013a 主题时间线·Phase2B 首批·第二 slice（紧随 REQ-014）·已实现并补齐验证**：关键词/标签驱动（API-033 `q`/`tag_ids`）+ 候选 A 实时聚合不建表 + 标题 ILIKE/chunk.ts_vector 命中 + actor（linked=null）+ 密度 ratio + 逃生舱；TC-P2-TL-001 自动化、运行态 API smoke、Edge headless 浏览器 smoke、真实 PG 大数据性能 smoke 已通过（TL-C-001..011 已确认，见 `docs/design/timeline.md`）。**REQ-013b 关联图愿景**，待主题时间线试用反馈后评估 |
| REQ-014 | F-008 | AI 润色 + 写作侧边栏引用 | `[P2]` | 团队 MVP | **Phase2B 首批核心·已实现（MVP 级，前端 vertical slice 闭环：PR#89–95 / v1.1.0 / TC-P2-AI-001 live 通过）**；数据外发风险已接受（RG-008 Go）；详见 `docs/design/ai-polish.md` |
| REQ-015 | F-008 | 跨空间文档推送 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，重依赖 / 安全敏感 |
| REQ-016 | F-008 | 多人协作 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，重依赖 / 并发复杂 |
| REQ-017 | F-008 | 跨设备 / 移动端 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，移动端禁止进入近期 |
| REQ-018 | F-009a | Obsidian Vault 兼容（导入数据库 / 仅本地挂载） | `[P2]` | 本地知识源接入 MVP | Phase2C·已设计（模式 B 浏览器 File System Access，RG-009 Go）；模式 A 导入数据库已随 Phase2B 交付；仅本地挂载=个人/当前设备来源，与 LUMEN DB 文档左侧分区，不进服务端 RAG |
| REQ-019 | F-009 | 录音转文字 + 摘要 | `[愿景]` | 产品 | 待技术验证 |
| REQ-020 | F-010 | 问题热力矩阵 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-021 | F-010 | 事件因果展开 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-022 | F-009 | 对外只读简报 | `[愿景]` | 产品 | 待技术验证 |
| REQ-023 | F-009 | 文档包 / 管理层摘要 / 气泡图谱 / 跨组织复用 | `[愿景]` | 产品 | 粗粒度骨架，升阶段前需拆分 |
| REQ-024 | F-008 | 时间轴密度热条 | `[P2]` | 团队 MVP | **Phase2B 首批·第二 slice（依赖 REQ-013a）**；**已实现（随 REQ-013a 第二 slice 落地：候选 A 4 档色阶 + 量化 ratio + 事件数密度，传 `q` 反映主题活跃节奏；TC-P2-TL-001 通过）** |
| REQ-025 | F-007 | 快速录入索引条目 | `[P2]` | 个人知识组织 | Phase2A 已完成（TC-P2-QUICK-001 通过） |
| REQ-026 | F-007 | 内部链接 + 反向链接 | `[P2]` | 个人知识组织 | Phase2A 已完成（TC-P2-LINK-001 通过） |
| REQ-027 | F-011 | 单文档导出 PDF | `[P1]` | 个人增强 Beta | P1.5B 已实现（Sprint-18 / TC-P1-017 通过）；从 Phase2 提前 |
| REQ-028 | F-009 | 飞书自动同步 | `[愿景]` | 产品 | 待技术验证 |
| REQ-029 | F-010 | 多视角联动闭环 | `[愿景]` | 产品 | 待技术验证 |
| REQ-030 | F-010 | 路径推理 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-031 | F-010 | 人物关系网络 | `[愿景]` | 产品 | 待技术验证 |
| REQ-032 | F-010 | 矛盾检测 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-033 | F-010 | 假设检验 / 证据地图 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-034 | F-010 | 信号追踪 | `[愿景]` | 产品 | 待技术验证 |
| REQ-035 | F-009 | 分析包 A Kit | `[愿景]` | 产品 | 待技术验证 |
| REQ-036 | F-006 | 术语管理 | `[P1]` | Demo | Phase1 必演示 |
| REQ-048 | F-006 | 术语领域树（REQ-036 增强：领域树组织 + 内容分类 + 来源追溯） | `[P1]` | Demo | 维护态增强·已实现（2026-08-07，migration 017，API-051..053，TC-P2-TERM-001） |
| REQ-037 | F-011 | 批量 / 文件夹导入（`.md` / `.txt`） | `[P1]` | 个人可用 Alpha | P1.5A 已完成（TC-P1-015 通过） |
| REQ-038 | F-011 | 单文档 `.md` + 空间 ZIP 导出 | `[P1]` | 个人可用 Alpha | P1.5A 已完成（TC-P1-016 通过） |
| REQ-039 | F-007 | 文档目录树（嵌套文件夹 CRUD / 移动 / 排序 + 导入保留结构） | `[P2]` | 团队 MVP | **Phase2B 第三 slice（folder-tree）已实现**：`lumen_folders` 嵌套树 + 文档 `folder_id` + CRUD / 移动 / 排序（API-034..038）+ 导入 `preserve_structure`（API-029 扩展）+ 前端文件管理器；TC-P2-FOLDER-001 通过；folder 不独立设权限 |
| REQ-040 | F-012 | 账户注册 | `[P2]` | 团队验证 | Phase2D·已完成（2026-08-07，Sprint-26，PR#112 v3.0.0，TC-P2-AUTH-001 通过）：bcrypt 哈希 + `lumen_users` 扩列 + 默认个人空间 |
| REQ-041 | F-012 | 凭证登录 | `[P2]` | 团队验证 | Phase2D·已完成（Sprint-26）：bcrypt verify + 不透明 token + `lumen_sessions` + 失败锁定 |
| REQ-042 | F-012 | 登出 / 会话管理 | `[P2]` | 团队验证 | Phase2D·已完成（Sprint-26）：会话撤销 + TTL + 续期轮换 + 多设备会话 |

## 4.1 证据 / 验收引用

| 阶段 / 功能 | 证据 / 验收引用 | 说明 |
|---|---|---|
| Phase1 Demo closure | `docs/09-verification.md` §5，commit `d8d0f8f` | Phase1 全量验收为 Conditional Go（Demo closure） |
| F-001 / F-002 / F-005 / F-006 | `docs/09-verification.md` §2 / §5 | Sprint-1~6 降级口径验收记录 |
| F-003 | `docs/09-verification.md` §2 / §5，task-009 | 真实 LLM、pgvector、Embedding 与 hybrid search 已验证 |
| F-004 | `docs/09-verification.md` §2 / §6 | `.md` / `.txt` 导入条件通过；真实 Word / PDF / OCR 留后续 |
| F-011（P1.5A/B） | `docs/08-dev-plan.md` Sprint-16~18、`docs/09-verification.md` TC-P1-015~017 | Alpha=REQ-037/038 已完成；Beta=REQ-027 已完成 Sprint-18 产品实现与中文 PDF 验证 |
| Phase2A closure | `docs/09-verification.md` §2 / §5，`docs/08-dev-plan.md` Phase2A 完成包 | REQ-026 / REQ-012 / REQ-025 三个 vertical slice 已通过；未进入 Phase2B |
| Phase2B / 愿景 | 本文 §3 / §6 待确认项 | 团队 MVP 首批范围和进入标准待确认；不直接把愿景写入当前阶段 |
| Phase2C | 本文 §3 Phase2C 子节；`docs/research/2026-08-05-rg009-vault-local-mount-poc.md`（RG-009 Go）；TC-P2-VAULT-001（已通过 2026-08-06） | REQ-018 模式 B 本地知识源接入；Sprint-23C 已完成（PR#108 v2.0.0）；Sprint-24 子树导入（PR#109 v2.1.0）+ Sprint-25 帮助（PR#110 v2.2.0）随 Wave 1 收口 |
| Phase2D | 本文 §3 Phase2D 子节；`docs/design/accounts-auth.md`（§17 Sprint-27 增量设计 + §18 Sprint-28 增量设计）；`docs/05-tech-spec.md` RG-011/012/013（Go） | 账号体系基础 Sprint-26 已完成（PR#112 v3.0.0）；权限多人化 Sprint-27 已完成（REQ-043/044 / TC-P2-ACC-001 / task-039，PR#114）；角色分层 + 用户管理 + 团队空间加入 Sprint-28 已完成（REQ-045..047 / TC-P2-ACC-002 / task-040，PR#117 v3.1.0）；Phase2D 三 slice 已收口（2026-08-07） |

## 5. 非目标（明确不做，防范围蔓延）

| 编号 | 非目标 | 适用范围 | 来源 | 备注 |
|---|---|---|---|---|
| NOGO-001 | 高级视图（时间轴 / 关联图 / 热力矩阵 / 气泡图谱 / 标签） | Phase1 | `ai/project-rules.md` §1、本文 §3 | 留 Phase2 / 愿景 |
| NOGO-002 | 跨空间推送、对外简报、Vault 挂载、录音转写、实时协作、移动端 | Phase1 | `ai/project-rules.md` §1、本文 §3 | 留 Phase2 / 愿景（**Vault 挂载已随 Phase2C 解锁**；其余仍愿景） |
| NOGO-003 | 跨文档因果推理、问题热力矩阵 | 全程（除非 05 验证可行） | `docs/05-tech-spec.md` 风险门禁、本文 §3 | 需技术验证后再定阶段 |

完整禁止清单见 `ai/project-rules.md` §1。

## 6. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| PRD-C-003 ✅已确认（2026-07-30） | Phase2B 首批范围与进入标准 | ~~建议先确认团队 MVP 是否优先 REQ-014~~ **已确认**：REQ-014 首批核心 + REQ-013/024 时间轴紧随第二 slice；AI 数据外发=真实外发 + 权限护栏 | Phase2A 已完成个人知识组织闭环；Phase2B 涉及数据外发、团队化体验与更高验证成本 | （未采纳）先做 Phase1.5B PDF / Word-PDF / zhparser | **已回填** 03 §3/§4、04、05(RG-008)、06/07、08/09、project-rules §2.1；详见 `docs/research/2026-07-30-phase2b-kickoff-decision.md`；后续已完成 REQ-014 前端闭环，REQ-013a/024 已本地实现，剩运行态 API smoke / 浏览器 smoke |
