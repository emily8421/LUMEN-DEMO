# LUMEN 团队知识库 Demo · 项目收尾总结

> 定位声明：本文是 LUMEN-DEMO 项目的收尾成果总结（`docs/research/`，过程性总结文档），记录项目目标、交付成果、验证结论与已知局限。**不是需求 / 设计事实文档**；项目事实仍以 `docs/00-09` + `ai/project-rules.md` 为准，本文不替代。
> 状态：**2026-08-07 项目 demo 目标达成，进入维护态**（用户评估确认）。

## 0. 元信息

- 收尾日期：2026-08-07
- 最终版本：**v3.1.0**
- 阶段覆盖：Phase1 → Phase1.5A/B → Phase2A → Phase2B → Phase2C → Phase2D（全部完成）
- 决策：用户评估确认 demo 目标达成；标准收尾（A 状态声明 + B 成果总结 + D 归档）；方法论复盘（C）未做，留可选。

## 1. 项目目标

- **方法论验证**：验证「文档驱动开发」方法论（派生自 [`ai-project-template`](https://github.com/emily8421/ai-project-template)：先文档后代码、AI 只实现 `docs/` 已定义功能、规则路由 + 会话续接 + 横切一致性传播）在真实全栈项目中的可行性。
- **产品 demo**：交付一个支持**空间隔离 + 三级文档权限 + AI 检索问答（带来源引用）+ 多人账号与权限 + 本地知识源接入**的团队知识库 demo。

## 2. 交付成果（Phase 全系列）

| Phase | 交付物形态 | 核心能力 | 关键 REQ / Sprint |
|---|---|---|---|
| Phase1 | Demo | 双空间隔离 + 三级权限 + 文档 CRUD/版本 + 降级导入 + 全文/语义搜索 + RAG 问答 + 术语管理 + 桌面端 | REQ-001~011/036，Sprint-1~8 |
| Phase1.5A/B | 个人可用 Alpha/Beta | 批量/文件夹导入 + `.md`/ZIP 导出 + 单文档 PDF 导出 | REQ-037/038/027，Sprint-16~18 |
| Phase2A | 个人知识组织 | 内链/反链 + 标签视图 + 快速录入 | REQ-026/012/025 |
| Phase2B | 团队 MVP | AI 润色/写作引用 + 主题时间线/密度热条 + 文档目录树 | REQ-014/013a/024/039，Sprint-19~22 |
| Phase2C | 本地知识源接入 MVP | Obsidian Vault 兼容（仅本地挂载，浏览器 File System Access）+ 子树导入 UI + 帮助手册 | REQ-018，Sprint-23C~25 |
| Phase2D | 团队验证 | 真实账号体系（注册/凭证登录/会话）+ 权限多人化（owner 过滤/隔离）+ 角色分层 + 用户管理 + 团队空间加入 | REQ-040~047，Sprint-26~28 |

## 3. 版本里程碑

`v0.1.0`（2026-07 起步）→ `v3.1.0`（2026-08-07 Phase2D 收口），~30+ Sprint，约 5 周。

- **v0.x**（2026-07）：Phase1 Demo（Sprint-1~8：权限/文档/版本/导入/搜索/RAG/术语/桌面端；Sprint-7/8 LLM + pgvector + Embedding 真实化）。
- **v1.x**（2026-07~08）：Phase1.5A/B（批量导入、`.md`/ZIP 导出、PDF 导出）+ Phase2A（内链/标签/快速录入）+ Phase2B（AI 润色、时间线、目录树）。
- **v2.0.0**（2026-08-06）：Phase2C 本地知识源接入（Sprint-23C 模式 B，TC-P2-VAULT-001）。
- **v2.1.0 / v2.2.0**（2026-08-06）：Phase2C 增强（子树导入 UI、帮助手册 L0+L1）。
- **v3.0.0**（2026-08-07，MAJOR）：Phase2D 账号体系基础（Sprint-26；API-001 login 破坏性变更）。
- **v3.1.0**（2026-08-07）：Phase2D 角色分层 + 用户管理 + 团队空间加入（Sprint-28，Phase2D 收口）。

## 4. 验证结论

- **`docs/09-verification.md` §6 登记技术风险全部解决 / 关闭**：RG-001/002（pgvector / Embedding）、RG-003（OCR No-Go，降级）、RG-004（LLM）、RG-006（PDF 导出）、RG-008（AI 数据外发，风险已接受 + 护栏）、RG-009/010（Vault 本地挂载 / FileSystemObserver）、RG-011/012/013（bcrypt / 锁定 / 防枚举）等均 Go 或已闭合。
- **产品红线全程未破坏**：库外问答回复「未找到」、不编造；权限不泄露（私有仅 owner、跨用户零泄露、管理接口仅 admin、用户列表不暴露 `password_hash`）。
- **多用户隔离有覆盖**：Sprint-27 双用户 10 路径零泄露自动化回归 + 双用户浏览器 smoke；Sprint-28 admin/member 双角色浏览器 smoke。
- **未做**：真实团队（>2 人）端到端用户验收——技术验证已覆盖，剩余为用户验收（非技术债）。

## 5. 已知局限 / 明确未做

- **真实 Word/PDF 解析、OCR**（RG-003 No-Go）：降级为 `.md` / `.txt` 已提取文本。
- **zhparser 中文分词**：可选增强，当前 pgvector 镜像无扩展时回退 `simple`。
- **REQ-016 多人实时协作**：重依赖（并发 / CRDT），F-008 后续 Phase，demo 不做。
- **团队治理增强**：移除用户 / 重置密码 / 邀请码（Sprint-28 硬约束明确排除，留候选）。
- **Sprint-28 实现偏差**（`docs/design/accounts-auth.md` §18.9）：API-044/046 未分页、`last_login_at` 未显式排序、refresh 不含 `role`（3-5 人规模接受）。
- **`LUMEN_ENABLE_DEMO_AUTH` 未实现**：demo 模式由仓储类型决定（accounts-auth §15）。

## 6. 后续可能方向（若重启）

1. **真实团队端到端验证 / 试用**：找真实团队 / 数据走查 Phase2A-D（需真实参与方）。
2. **产品化 / 部署**：demo → 生产（部署 / 配置 / 监控 / 备份 / 域名 HTTPS）——需明确部署目标与资源。
3. **团队治理完善**：移除用户 / 重置密码 / 邀请码（小 Sprint，建议有真实反馈再做）。
4. **REQ-016 多人实时协作**：需 RG（并发模型 / CRDT 选型）+ 阶段升级。
5. **真实文档解析 / OCR 真实化**：RG-003 解锁 + tech-env-eval。
6. **方法论复盘**：文档驱动开发实战复盘（本次收尾未做，可补 `docs/research/` 或 `TEMPLATE-UPGRADE` 提案回流模板）。

## 7. 收尾状态

- `ai/project-rules.md` §1 指针、`README.md`、`docs/03-prd.md` §0 已标「demo 目标达成，进入维护态」。
- `.ai/session-handoff.md` status → closed。
- 无未决 open items。
- 后续若重启，从本文 §6 选方向，按 `ai/index.md` 规则路由恢复。
