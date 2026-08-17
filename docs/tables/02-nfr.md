# 02-nfr · 非功能需求（NFR）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/02-srs.md`（### 0.1.1 起的章节）。表格内容以源文档为准。

| NFR-ID | 类型 | 需求描述 | 来源 | 验证方式 | 状态 |
|---|---|---|---|---|---|
| NFR-001 | 权限 / 隔离 | 空间、成员和文档权限必须约束搜索、问答、文档读取与编辑 | SCB-003、REQ-001..003 | TC-P1-001..003、权限相关后端测试 | P1-已验证（Demo） |
| NFR-002 | 可追溯性 | RAG 答案必须带来源；库外问题明确未找到，不编造 | SCB-004、REQ-008 | TC-P1-008、RAG 相关验收 | P1-已验证（Demo） |
| NFR-003 | 资源约束 | Phase1 Demo 在本机资源软上限内运行，重资源能力按门禁降级 | `ai/project-rules.md` §2.1、`docs/05-tech-spec.md` §5 | 资源 / readiness gate 记录，`docs/09-verification.md` §6 | P1-条件通过 |
| NFR-004 | 数据安全 | 真实文档导入需显式标注来源 / 敏感级别，优先避免发送到外部模型 | `ai/project-rules.md` §2.1 | 人工验收与后续真实导入任务检查 | 后续阶段待细化 |
| NFR-005 | 测试数据库安全 | PG 集成测试必须在独立 `lumen_test` 库执行，破坏性操作（TRUNCATE）受三重 fail-closed guard 保护，不得误清开发库 | `ai/project-rules.md` §2.1/§5、`docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-1 | TC-P2-GOV-001、`tests/backend/test_pg_test_support.py` | 维护态批6·已实现（2026-08-11，PR #124） |
| NFR-006 | CI 最小回归门 | CI 必须跑后端 unit 测试 + 前端 build + 后端 lint，防止坏代码无回归保护混入 main | `docs/05-tech-spec.md` §4.2.4、rollout plan §3 P0-2 | TC-P2-GOV-002、`.github/workflows/project-check.yml` | 维护态批6·已实现（2026-08-11，PR #124） |
| NFR-007 | 错误响应契约 | 错误响应遵守统一契约：业务码 `code` 单一含义（不与 HTTP 码混用）、未捕获异常有兜底 envelope、`msg` 用固定用户文案禁 `str(exc)` 直传泄露内部细节 | `docs/05-tech-spec.md` §4.2.1、rollout plan §4 轨道3、assessment CQ-P1-005 | TC-P2-GOV-003、`backend/model/error_codes.py`、`tests/backend/test_error_contract.py` | 维护态批7·已实现（2026-08-11，PR #125） |
