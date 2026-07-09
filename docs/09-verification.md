# 验证计划（Verification Plan）

> 测试策略与 REQ → 用例追溯。按阶段增量：本期覆盖 `[P1]` 全部 REQ；升阶段在原位追加（global-rules §8）。
> 与 `08-dev-plan`（"何时做"）正交：本文回答"怎么算对"。
>
> 定位：本项目「验证」支柱，对应 global-rules §5 编号档 `09-verification`（由语义命名 `verification-plan.md` 升格而来）。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | Phase1 |
| 交付物形态 | Demo |
| 覆盖 REQ | Phase1：REQ-001..REQ-011、REQ-036；P2 / 愿景验证项待升阶段细化 |
| 当前状态 | P1 验证计划已确认；Sprint-2~6 降级口径验收已执行；已引入稳定 TC-ID（见 §2 矩阵与 TC 用例详情、§5 验收记录、§6 未验证项） |
| 最后更新 | 2026-07-09 |

## 1. 测试策略

- **单元测试**：service 层——权限过滤、切块、检索排序、导入解析
- **集成测试**：导入 → 检索 → 问答 端到端闭环（双空间、三级权限场景）
- **验收测试**：逐条 REQ 的可验证口径（见 §2 矩阵）
- **数据夹具**：`nova-internal` / `brightlite-team` 两空间 + 私有 / 团队共享 / 外部只读 各若干文档

## 2. REQ → 用例追溯矩阵

### Phase1（功能范围 `[P1]` · 交付物形态 **Demo**）

| TC-ID | REQ | 验收用例 | 阶段 | 状态 |
|---|---|---|---|---|
| TC-P1-001 | REQ-001 隔离 | brightlite 账号查询 nova-internal 文档 = 0 命中 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-002 | REQ-002 切换 | 切换后搜索 / 问答只反映目标空间 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-003 | REQ-003 权限 | 作者私有文档，同空间他人搜不到、问答不引用 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-004 | REQ-004 CRUD | 创建 / 读 / 改 / 删均成功，删后不可检索 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-005 | REQ-005 行内编辑 | 编辑保存后内容持久、再打开一致 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-006 | REQ-006 版本 | 3 次修改 → 3 版本 → 能恢复指定版本 | [P1] | 条件通过（降级口径·内存） |
| TC-P1-007 | REQ-007 搜索 | 已知关键词返回正确文档 | [P1] | 条件通过（降级口径·内存关键词匹配） |
| TC-P1-008 | REQ-008 RAG | 库内问答正确 + 标来源；库外回复"未找到" | [P1] | 通过（真实 LLM·glm-5.2；向量检索仍缺——RG-002 已验证，待 pgvector 接入） |
| TC-P1-009 | REQ-009 导入 | 导入 .pdf 后可搜、可问答引用 | [P1] | 条件通过（仅 `.md`/`.txt`；真实 PDF 未验证） |
| TC-P1-010 | REQ-010 OCR | 中文白板照片 OCR 后可搜 | [P1] | 后续阶段（OCR 未实现，降级移出 P1 必过） |
| TC-P1-011 | REQ-011 桌面端 | Chrome / Edge 完成上述全部 | [P1] | 条件通过（降级口径·Edge Headless + Chrome 人工 smoke） |
| TC-P1-012 | REQ-036 术语管理 | 新建空间术语后，文档识别该词，问答优先使用空间定义且不被同名全局术语覆盖 | [P1] | 条件通过（降级口径·内存） |

> 状态说明：Sprint-2~6 已按**降级口径**验收（内存 `demo_repository`，无 pgvector / Embedding / OCR / 真实 LLM）。「条件通过」= 降级实现满足 Demo 级别验收；真实化（向量检索 / 真实 PDF / OCR / LLM）移至 Phase2 / MVP（见 §6 与 `docs/05-tech-spec.md §5.1`）。

#### Phase1 TC 用例详情

> P2-E 回梳新增（C-4：引入稳定 TC-ID）。`TC-P1-NNN` 与 REQ 一一映射；自动化位置指向 `tests/backend/`，证据见 §5。

| TC-ID | REQ | 前置 | 步骤 | 期望 | 自动化 / 证据 | 状态 |
|---|---|---|---|---|---|---|
| TC-P1-001 | REQ-001 | nova / brightlite 双空间 + 成员 | brightlite 账号搜索 nova 文档 | 0 命中 | `tests/backend/test_permission.py`、`test_search.py` | 条件通过 |
| TC-P1-002 | REQ-002 | 用户属多空间 | 切换空间后搜索 / 问答 | 仅目标空间结果 | `tests/backend/test_space.py`、`test_api_routes.py` | 条件通过 |
| TC-P1-003 | REQ-003 | 作者私有文档 + 同空间他成员 | 他成员搜索 / 问答该私有文档 | 不命中、不引用 | `tests/backend/test_permission.py` | 条件通过 |
| TC-P1-004 | REQ-004 | 已登录 + 当前空间 | 创建 / 读 / 改 / 删文档 | 四项成功，删后不可检索 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-005 | REQ-005 | 已有文档 | 行内编辑保存后重开 | 内容持久、一致 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-006 | REQ-006 | 已有文档 | 改 3 次 → 查版本 → 恢复 | 3 版本可见、能恢复指定版本 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-007 | REQ-007 | 已索引文档 | 关键词搜索 | 返回正确文档 + 摘要 | `tests/backend/test_search.py` | 条件通过（内存关键词） |
| TC-P1-008 | REQ-008 | 已索引文档 | 库内问答 / 库外问答 | 库内正确 + 来源；库外「未找到」 | `tests/backend/test_rag.py` + GLM-5.2 真实验证 | 通过（真实 LLM；向量检索缺） |
| TC-P1-009 | REQ-009 | `.md`/`.txt` 文件 | 导入后搜索 / 问答 | 可命中 | `tests/backend/test_imports.py` | 条件通过（仅 .md/.txt） |
| TC-P1-010 | REQ-010 | 中文白板照片 | OCR 后搜索 | 可搜 | — | 后续阶段（OCR 未实现） |
| TC-P1-011 | REQ-011 | 桌面端浏览器 | 走查全部 P1 功能 | 全部可用 | Edge Headless + Chrome 人工 smoke（§5） | 条件通过 |
| TC-P1-012 | REQ-036 | brightlite 空间 | 新建术语 → 文档识别 → 问答 | 识别 + 空间术语优先于全局 | `tests/backend/test_term.py`、`test_rag.py` | 条件通过 |

> TC-P1-010 暂为「后续阶段」，待 OCR 落地后补步骤与证据；其余 TC 自动化均含于 53 后端 tests（见 §5）。

### Phase2（功能范围 `[P2]` · 交付物形态 **MVP**，升阶段时追加）
- REQ-012..017、REQ-024..027 用例（标签 / 视图 / 润色 / 推送 / 协作 / 移动端 / v18 追加项）——待该阶段细化

### 远期愿景（不承诺）
- REQ-018..023、REQ-028..035 用例——待 05 技术验证可行后补

## 3. 分阶段验证范围

- **Phase1（Demo）**：覆盖 REQ-001..011、REQ-036（上表）——可演示 + 守产品红线
- **Phase2（MVP）**：原位追加 REQ-012..017、REQ-024..027 用例
- **愿景（产品）**：待技术验证后再补用例

## 4. 本机资源验证

> 验证 Demo 在本机资源范围内可运行（受 `docs/env/local-env.md` 与 `ai/project-rules.md` §2.5 约束）。

- 本机起库与依赖：Docker Compose 起 PostgreSQL+pgvector，确认本机内存 / 磁盘足够。
- Demo 运行资源占用：峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；Embedding 必须使用本机 `bge-small-zh`（512 维），不依赖外部 Embedding API。
- 数据边界验证：默认夹具使用已标注的虚构 Demo 数据；如导入真实团队文档，需检查来源 / 敏感级别标注，并验证敏感片段不默认发送到外部模型。
- 依赖 / 镜像验证：仅安装项目所需依赖与镜像；新增依赖必须进入依赖文件并说明用途。
- 资源超限的验证口径：超过软上限或本机 Embedding 在导入规模、响应时间、检索质量上无法满足要求时，先优化批处理、增量索引与 chunk 策略；仍不足则触发公司内网 Embedding / reranker 服务预案。

## 5. 验收记录

| 日期 | 范围 | 结果 | 记录 |
|---|---|---|---|
| 2026-07-03 | Sprint-2 前端文档编辑器 | 通过（降级口径） | 提交 `83fb782`；前端文档编辑器 Demo UI |
| 2026-07-03 | Sprint-3 降级文本导入 | 通过（降级口径） | 提交 `0fe169b`；仅 `.md`/`.txt` 已提取文本，不接真实 PDF/OCR |
| 2026-07-04 | Sprint-4A/B/C 搜索 + RAG API + 前端 UI | 通过（降级口径） | 提交 `da9f6e5`/`5144f2a`/`bc03839`；内存搜索 + 降级 RAG（不调 LLM）+ 前端搜索 / 问答 UI |
| 2026-07-04 | 缺陷修复：编辑文档索引 | 通过 | 提交 `c5c177e`；修复新建 / 编辑文档无法被搜索 / 问答命中（见 §5.1） |
| 2026-07-05 | Sprint-5 术语管理 | 通过（降级口径） | 提交 `5b78f0a`；空间术语 CRUD + 问答口径对齐 |
| 2026-07-03~07 | 后端单元 / 集成测试 | 通过（53 tests） | `.venv\Scripts\python.exe -m unittest discover -s tests/backend -v` 全通过；`compileall backend tests/backend` 通过 |
| 2026-07-06 | Sprint-6 桌面端集成 smoke（Edge Headless + FastAPI + Vite） | 部分通过（降级口径） | 已通过登录、空间切换、文档新建 / 编辑 / 版本恢复、`.md` 降级导入、搜索、RAG 问答、术语创建与术语来源、跨空间搜索隔离；Chrome 人工点击、真实 PDF 解析、图片 OCR 未验证。 |
| 2026-07-06 | Sprint-6 Chrome 人工 smoke | 通过（降级口径） | 用户反馈已通过 Chrome 桌面端 14 步 smoke：登录、空间切换、文档 CRUD / 版本恢复、`.md` 降级导入、标题 / 正文搜索、RAG 问答、术语创建与术语来源、跨空间搜索隔离；真实 PDF 解析、图片 OCR 未验证。 |
| 2026-07-09 | Sprint-7 LLM adapter（RG-004） | 通过（GLM-5.2 真实验证） | `llm_adapter.py` 多 provider + rag 接入；55 tests + 本机 GLM `glm-5.2` 真实问答验证通过（answer 带来源标注） |
| 待实现后填写 | Phase1 Sprint / 全量验收 | 待记录 | 每个 Sprint 完成后追加验收结果，不删除历史记录 |

### 5.1 缺陷与回归记录

| 缺陷 | 来源 | 修复 | 回归范围 | 结果 |
|---|---|---|---|---|
| 新建 / 编辑文档无法被搜索或问答命中 | Sprint-4 实现期发现 | `c5c177e fix: index edited documents for search and rag` | 搜索 + RAG 索引（新建 / 编辑文档入库后被检索召回） | 回归通过；53 后端 tests 含相关用例 |

## 6. 风险与未验证项

| 风险 / 未验证项 | 影响范围 | 当前处理 |
|---|---|---|
| PostgreSQL+pgvector 未接入（当前内存 Demo） | REQ-007/008 真实化 | Phase1 接受降级基线；真实化移至 Phase2/MVP（见 `docs/05-tech-spec.md §5.1` RG-001） |
| 真实 Embedding（bge-small-zh）未接入后端 | REQ-007/008 向量检索 | RG-002 已验证（torch 修复，512 维 float32）；待 pgvector 接入生成真实向量（RG-001） |
| Docker Desktop Linux engine 阻塞 | 起库 / 真实 PostgreSQL | 当前后端直连内存仓储；Docker daemon 未起，待解锁后接 pgvector |
| OCR 质量与资源占用 | REQ-010、内容导入 | OCR 未实现，REQ-010 移至后续阶段（RG-003）；当前降级为已提取文本 |
| LLM 外部调用可用性 | REQ-008、REQ-036 | GLM `glm-5.2` 真实问答已验证（Sprint-7，RG-004→Go）；GPT/ollama 待验证 |
| P2 / 愿景高风险 AI 能力 | REQ-020 / 021 / 030 / 032 / 033 等 | 不进入 Phase1 必过项，技术验证通过后再补用例 |

## 7. 待人工确认项

- 无新增确认项；验收记录在 Sprint 完成后原位追加。
