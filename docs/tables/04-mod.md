# 04-mod · 模块清单（MOD · 含详细设计列）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/04-architecture.md`（## 2. 起的章节）。表格内容以源文档为准。

| MOD-ID | 子系统 | 职责 | 输入 → 输出 | 边界（不负责） | 关联组件 | 阶段 | 设计状态 | 实现状态（Phase1 Demo） | 详细设计 |
|---|---|---|---|---|---|---|---|---|---|
| MOD-001 | 空间与权限 | 多空间隔离、权限分级、查询时过滤 | 用户 / 空间成员关系 → 过滤后可见数据 | 不负责文档内容解析 | COMP-002 / 003 | [P1] | P1-已实现 | PostgreSQL 成员 / 文档权限过滤已接入；内存 `DemoRepository` 仅作单测 fake | docs/design/permissions.md |
| MOD-002 | 文档管理 | CRUD、行内编辑、版本历史 | 文档字段 → 持久化文档 / 版本 | 不负责检索 / 导入 | COMP-002 / 003 | [P1] | P1-已实现 | PostgreSQL 文档 / 版本持久化已接入 | （逻辑简单，见 06/07） |
| MOD-003 | 内容导入 | `.md` / `.txt` 单文件与批量 / 文件夹导入、切块入库；真实 Word/PDF 解析、OCR 留后续 | 文件 / 文件夹 → 文档 + 切块 + 逐条导入结果 | 不负责检索 / 问答；不在 P1.5A 建真实目录表 | COMP-001 / 002 / 003 / 004 | [P1] | P1.5A-已实现 | `.md`/`.txt` 已提取文本导入 + 切块入 PG；批量 / 文件夹导入已随 Sprint-16 完成；真实 Word/PDF/OCR 仍降级（RG-003） | docs/design/ingestion.md |
| MOD-004 | 检索问答 | 全文搜索、RAG（向量+全文+引用） | 查询 → 结果 + 来源 | 不负责导入解析 | COMP-002 / 003 / 004 | [P1] | P1-条件通过（hybrid search + RAG） | search=substring + `ts_vector` SQL 候选 + pgvector 语义召回；RAG=关键词 + pgvector 向量召回 + GLM LLM | docs/design/rag-retrieval.md、docs/design/ai-assistant.md |
| MOD-005 | 术语管理 | 空间级术语表、文档术语识别、问答口径对齐 | 术语 → 口径注入 | 不负责问答生成 | COMP-002 / 003 / 004 | [P1] | P1-已实现 | PostgreSQL 术语存储已接入；术语定义已注入真实 LLM Prompt | docs/design/term-management.md |
| MOD-006 | 个人知识组织 | 标签体系、内部链接 + 反向链接、快速录入索引条目；时间轴 / 关联图留 Phase2B / 后续 | 文档 + 标签 / `[[文件名]]` / 轻量条目 → 标签聚合视图、反向链接索引、可检索条目 | 不负责文档内容生成 / 问答；不负责团队协作 | COMP-001 / 002 / 003 | [P2] | P2-已实现（TC-P2-LINK/TAG/QUICK-001 通过） | — | docs/design/frontend-interaction.md、docs/design/folder-tree.md、docs/design/timeline.md |
| MOD-007 | 导出交付与写作增强（协作 / 推送延后） | 单文档 `.md` 下载、空间 ZIP 导出备份、单文档 PDF；Phase2B AI 润色 + 写作引用 | 文档 / 空间 → `.md` / ZIP / PDF；选中文本 / 写作上下文 → 润色建议 + 引用块 | 不负责实时协作（延后）、不负责检索 / 问答；P1.5A 不做 PDF | COMP-001 / 002 / 003 / 004（润色走 LLM） | [P1] / [P2] | P1.5A-已实现；P1.5B PDF 已实现；Phase2B AI 已实现 | `.md` / ZIP 已随 Sprint-17 完成；PDF 已随 Sprint-18 完成；AI 润色已闭环 | docs/design/export-delivery.md；docs/design/ai-polish.md |
| MOD-008 | 存量接入 | Vault 兼容（导入数据库 / 仅本地挂载）、录音转写、飞书同步 | 本地文件夹 / 外部源 → LUMEN 文档或个人本地来源 | 不把仅本地挂载内容默认写入团队知识库；不绕过文档权限进入共享 RAG | COMP-001 / 002 / 003 / 004 | [P2]（Vault REQ-018 模式 B）/ [愿景]（录音/飞书） | Vault 模式 B Phase2C·已设计（RG-009 Go）；录音转写 / 飞书同步仍愿景 | DB 为正式知识库权威；本地挂载为个人连接器 | docs/design/ingestion.md（Flow-D-014）+ docs/design/frontend-interaction.md §9.3（CMP-P2-TREE） |
| MOD-009 | 情报分析（i2 精神） | 关联图↔时间轴联动、路径推理、人物网络、矛盾检测、证据地图、信号追踪 | — | — | — | [愿景] | 骨架 | — | docs/design/intelligence-analysis.md |
| MOD-010 | 情报交付 | 对外只读简报、管理层摘要、分析包 A Kit | — | — | — | [愿景] | 骨架 | — | 待技术验证 |
| MOD-011 | 账户与认证（多人权限） | 真实多用户账号（注册 / 凭证登录 / 登出会话）、owner 过滤与跨用户隔离、全局角色 admin/member、admin 用户管理、space 域成员 CRUD、忘记密码自助重置（token 写日志降级） | 注册 / 凭证 / 会话 → 认证上下文 + 用户 / 成员治理能力 | 不负责 REQ-016 多人实时协作、邀请码 / 移除用户（候选）；不负责空间内文档权限规则本体（属 MOD-001） | COMP-001 / 002 / 003 | [P2] | Phase2D·已实现（2026-08-07 三 slice 收口） | 统一鉴权；demo 模式 env 开关 + 物理隔离护栏（PG 仓储强制真实认证） | docs/design/accounts-auth.md |
