# 03-req-coverage · REQ 覆盖矩阵（REQ-001..051）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/03-prd.md`（## 4. 起的章节）。表格内容以源文档为准。

| REQ-ID | F-ID | 功能 / 产品能力 | 阶段 | 交付物形态 | 覆盖状态 |
|---|---|---|---|---|---|
| REQ-001 | F-001 | 多空间隔离 | `[P1]` | Demo | P1-已实现（TC-P1-001） |
| REQ-002 | F-001 | 空间切换 | `[P1]` | Demo | P1-已实现（TC-P1-002） |
| REQ-003 | F-001 | 文档权限分级 / 私有文档 | `[P1]` | Demo | P1-已实现（TC-P1-003） |
| REQ-004 | F-002 | Markdown 文档 CRUD | `[P1]` | Demo | P1-已实现（TC-P1-004） |
| REQ-005 | F-002 | 行内编辑 | `[P1]` | Demo | P1-已实现（TC-P1-005） |
| REQ-006 | F-002 | 版本历史 | `[P1]` | Demo | P1-已实现（TC-P1-006） |
| REQ-007 | F-003 | 全文 / 语义搜索 | `[P1]` | Demo | P1-已实现（hybrid search，TC-P1-007；见 req-implementation-index） |
| REQ-008 | F-003 | AI 问答（RAG） | `[P1]` | Demo | P1-已实现（TC-P1-008） |
| REQ-009 | F-004 | 多格式导入 | `[P1]` | Demo | P1-降级实现：`.md` / `.txt` 已提取文本入库；真实 Word / PDF 解析留后续（TC-P1-009） |
| REQ-010 | F-004 | 图片 / 白板 OCR | `[P1]` | Demo | P1-降级实现：以已提取文本替代；OCR 真实化留后续（TC-P1-010） |
| REQ-011 | F-005 | 桌面浏览器访问 | `[P1]` | Demo | P1-已实现（TC-P1-011） |
| REQ-012 | F-007 | 标签视图 | `[P2]` | 个人知识组织 | P2-已实现（TC-P2-TAG-001） |
| REQ-013 | F-008 | **主题时间线（REQ-013a）+ 关联图视图（REQ-013b）** | `[P2]` | 团队 MVP | REQ-013a·P2-已实现（Phase2B 第二 slice，TC-P2-TL-001；见 req-implementation-index + `docs/design/timeline.md`）；REQ-013b·愿景骨架 |
| REQ-014 | F-008 | AI 润色 + 写作侧边栏引用 | `[P2]` | 团队 MVP | P2-已实现（MVP 级，TC-P2-AI-001；数据外发风险已接受 RG-008，见 req-implementation-index + `docs/design/ai-polish.md`） |
| REQ-015 | F-008 | 跨空间文档推送 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，重依赖 / 安全敏感 |
| REQ-016 | F-008 | 多人协作 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，重依赖 / 并发复杂 |
| REQ-017 | F-008 | 跨设备 / 移动端 | `[P2]` | 后续 Phase | 不进 Phase2B 首批，移动端禁止进入近期 |
| REQ-018 | F-009a | Obsidian Vault 兼容（导入数据库 / 仅本地挂载） | `[P2]` | 本地知识源接入 MVP | Phase2C·已实现（模式 B 浏览器仅本地挂载，RG-009 Go，TC-P2-VAULT-001）；模式 A 已随 Phase2B 交付；仅本地挂载内容不进服务端 RAG |
| REQ-019 | F-009 | 录音转文字 + 摘要 | `[愿景]` | 产品 | 待技术验证 |
| REQ-020 | F-010 | 问题热力矩阵 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-021 | F-010 | 事件因果展开 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-022 | F-009 | 对外只读简报 | `[愿景]` | 产品 | 待技术验证 |
| REQ-023 | F-009 | 文档包 / 管理层摘要 / 气泡图谱 / 跨组织复用 | `[愿景]` | 产品 | 粗粒度骨架，升阶段前需拆分 |
| REQ-024 | F-008 | 时间轴密度热条 | `[P2]` | 团队 MVP | Phase2B 第二 slice·已实现（随 REQ-013a，TC-P2-TL-001；见 req-implementation-index） |
| REQ-025 | F-007 | 快速录入索引条目 | `[P2]` | 个人知识组织 | Phase2A 已完成（TC-P2-QUICK-001 通过） |
| REQ-026 | F-007 | 内部链接 + 反向链接 | `[P2]` | 个人知识组织 | Phase2A 已完成（TC-P2-LINK-001 通过） |
| REQ-027 | F-011 | 单文档导出 PDF | `[P1]` | 个人增强 Beta | P1.5B-已实现（TC-P1-017；从 Phase2 提前） |
| REQ-028 | F-009 | 飞书自动同步 | `[愿景]` | 产品 | 待技术验证 |
| REQ-029 | F-010 | 多视角联动闭环 | `[愿景]` | 产品 | 待技术验证 |
| REQ-030 | F-010 | 路径推理 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-031 | F-010 | 人物关系网络 | `[愿景]` | 产品 | 待技术验证 |
| REQ-032 | F-010 | 矛盾检测 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-033 | F-010 | 假设检验 / 证据地图 | `[愿景]` | 产品 | 高风险，待技术验证 |
| REQ-034 | F-010 | 信号追踪 | `[愿景]` | 产品 | 待技术验证 |
| REQ-035 | F-009 | 分析包 A Kit | `[愿景]` | 产品 | 待技术验证 |
| REQ-036 | F-006 | 术语管理 | `[P1]` | Demo | P1-已实现（TC-P1-012） |
| REQ-048 | F-006 | 术语领域树（REQ-036 增强：领域树组织 + 内容分类 + 来源追溯） | `[P1]` | Demo | 维护态增强·已实现（TC-P2-TERM-001；见 req-implementation-index） |
| REQ-037 | F-011 | 批量 / 文件夹导入（`.md` / `.txt`） | `[P1]` | 个人可用 Alpha | P1.5A-已实现（TC-P1-015） |
| REQ-038 | F-011 | 单文档 `.md` + 空间 ZIP 导出 | `[P1]` | 个人可用 Alpha | P1.5A-已实现（TC-P1-016） |
| REQ-039 | F-007 | 文档目录树（嵌套文件夹 CRUD / 移动 / 排序 + 导入保留结构） | `[P2]` | 团队 MVP | Phase2B 第三 slice·已实现（TC-P2-FOLDER-001；folder 不独立设权限，见 req-implementation-index） |
| REQ-040 | F-012 | 账户注册 | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-26，TC-P2-AUTH-001；见 req-implementation-index） |
| REQ-041 | F-012 | 凭证登录 | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-26，TC-P2-AUTH-001） |
| REQ-042 | F-012 | 登出 / 会话管理 | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-26，TC-P2-AUTH-001） |
| REQ-043 | F-013 | 权限多人化：owner 过滤（REQ-001/002/003 扩展） | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-27，TC-P2-ACC-001） |
| REQ-044 | F-013 | 跨用户隔离（私有仅 owner / external 仅 owner 可写） | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-27，TC-P2-ACC-001） |
| REQ-045 | F-014 | 全局角色分层（admin/member） | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-28，TC-P2-ACC-002；见 req-implementation-index） |
| REQ-046 | F-014 | admin 用户管理后台 | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-28，TC-P2-ACC-002） |
| REQ-047 | F-015 | 团队空间加入（space 域成员 CRUD） | `[P2]` | 团队验证 | Phase2D·已实现（Sprint-28，TC-P2-ACC-002） |
| REQ-049 | F-009a | 本地挂载可编辑（增删查改，REQ-018 模式 B 增强） | `[P2]` | 团队验证 | 维护态·已实现（2026-08-08，v3.5.0）；见 req-implementation-index + `docs/design/batch-maintenance-2026-08-08.md` |
| REQ-050 | F-012 | admin 成员空间可见性（用户详情抽屉跨空间授予 / 撤销） | `[P2]` | 团队验证 | 维护态批5·已实现（Sprint-30，v3.7.0，TC-P2-ACC-003；见 req-implementation-index） |
| REQ-051 | F-012 | 登录密码小眼睛 + 忘记密码自助重置 | `[P2]` | 团队验证 | 维护态批5·已实现（Sprint-30，v3.7.0，TC-P2-AUTH-002；见 req-implementation-index） |
