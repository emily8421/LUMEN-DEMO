# Batch 6 审计报告：模板提案去重收口与回流路线

> 定位：本报告是 Batch 6 去重收口报告，用于判断 P-07 Mock / 降级规范、P-08 权限 / 安全 checklist 是否需要独立提案，并给出已起草提案的回流顺序建议。
> 评估日期：2026-07-06
> 上游总览报告：`docs/research/2026-07-06-docs-system-template-proposal-audit.md`
> 相关报告：Batch 1-5 审计报告

## 1. 审计范围

本 Batch 只做去重、合并与回流顺序建议，不再审计新的项目文档。

审计对象：

| 类别 | 文件 |
|---|---|
| 总览报告 | `docs/research/2026-07-06-docs-system-template-proposal-audit.md` |
| Batch 报告 | `docs/research/2026-07-06-template-proposal-audit-batch-1-00-03-requirements-chain.md` |
| Batch 报告 | `docs/research/2026-07-06-template-proposal-audit-batch-2-04-05-architecture-tech.md` |
| Batch 报告 | `docs/research/2026-07-06-template-proposal-audit-batch-3-06-07-db-api-contract.md` |
| Batch 报告 | `docs/research/2026-07-06-template-proposal-audit-batch-4-08-09-dev-verification.md` |
| Batch 报告 | `docs/research/2026-07-06-template-proposal-audit-batch-5-design-docs.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-00-03-requirements-chain-standard.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-04-05-architecture-tech-standard.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-06-07-db-api-contract-standard.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-08-dev-plan-progress-standard.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-09-verification-standard-detail.md` |
| 新提案 | `_proposals/TEMPLATE-UPGRADE-design-doc-standard.md` |
| 既有待处理提案 | `_proposals/TEMPLATE-UPGRADE-powershell-sync-fallback-utf8.md` |
| 既有待处理提案 | `_proposals/TEMPLATE-UPGRADE-submit-proposal-gh-robustness.md` |

## 2. 总体结论

本轮文档体系模板优化已形成 6 个主题提案（P-01 到 P-06）和 6 份审计报告（Batch 0 到 Batch 5）。经去重评估：

- **P-07 Mock / 降级规范：暂不建议立即独立成提案。** 其核心要求已经分布在 P-02、P-03、P-04、P-05、P-06 中；若现在独立起草，容易与这些提案重复。建议先作为 P-02/P-04/P-05/P-06 的横切验收点回流，待模板维护者评审后，如认为需要统一横切章节，再拆独立 P-07。
- **P-08 权限 / 安全 checklist：暂不建议立即独立成提案。** 权限 / 安全内容已分别进入 P-02 的安全隐私合规、P-03 的 API 权限 / DB 安全、P-06 的权限 / 安全 design checklist。建议先不单独拆，以免与 P-03 / P-06 重叠。
- 当前最适合回流的是 P-01 到 P-06 六个主题提案；P-07 / P-08 作为“暂缓拆分、待维护者反馈”的候选项写入回流说明即可。

## 3. 现有提案去重矩阵

| 提案 | 主责范围 | 与其他提案重叠点 | 去重结论 |
|---|---|---|---|
| P-01 `00-03` 需求链 | 来源、U-ID、REQ、NFR、Phase、非目标 | 与 P-02 / P-05 共享 NFR、验证入口 | 保留；它是上游，不拆分 |
| P-02 `04-05` 架构技术 | 架构视图、技术状态、依赖配置、环境评估、安全隐私、风险验证 | 与 P-07 Mock / 降级、P-08 安全重叠 | 保留；P-07/P-08 暂不拆 |
| P-03 `06-07` DB/API 契约 | 数据字段、迁移、安全留存、API-ID、请求响应、错误权限 | 与 P-08 权限 / 安全重叠 | 保留；权限安全在契约层必须出现 |
| P-04 `08` 开发计划 | Sprint 总览、验证包、完成包、Task 模板、降级任务边界 | 与 P-07 降级边界重叠 | 保留；任务执行必须有降级边界 |
| P-05 `09` 验证 | TC-ID、用例详情、Mock / 降级验收、资源验证、验收记录 | 与 P-07 降级验收重叠 | 保留；09 是验收权威点 |
| P-06 `design` | design 元信息、流程、状态机、失败 / 降级、分类 checklist | 与 P-07/P-08 重叠 | 保留；通用 detailed design 需要分类 checklist |
| P-07 候选 | Mock / 降级统一口径 | P-02/P-04/P-05/P-06 已覆盖 | 暂不新增 |
| P-08 候选 | 权限 / 安全 checklist | P-02/P-03/P-06 已覆盖 | 暂不新增 |

## 4. P-07 判断：Mock / 降级是否独立成提案

### 4.1 已覆盖位置

| 覆盖位置 | 已包含内容 |
|---|---|
| P-02 `04-05` | 技术状态枚举、Mock / 降级、技术风险、环境评估、验证映射 |
| P-03 `06-07` | Mock / Demo / 内存仓储与真实 DB / API 能力差异 |
| P-04 `08` | 降级任务边界、是否等价真实能力、补齐时点、对验收影响 |
| P-05 `09` | Mock / 降级验收口径、不等价真实能力通过、升阶段补验 |
| P-06 `design` | Mock / 降级与实现偏差表、分类 checklist |

### 4.2 不立即拆分的理由

1. P-07 若单独起草，会大量重复 P-02 / P-04 / P-05 / P-06 的字段和验收标准。
2. Mock / 降级不是单一文档职责，而是技术、任务、验证、详细设计共同承载的横切口径。
3. 当前六个提案已足以让模板维护者看到 Mock / 降级的全链路问题。
4. 若维护者认为需要统一“横切事实权威源”，可后续基于六个提案提炼出 P-07。

### 4.3 保留候选条件

若模板维护者评审后出现以下情况，再单独拆 P-07：

- 希望在 `ai/document-lifecycle-rules.md` 中建立 Mock / 降级的统一状态枚举。
- 希望新增 `ai/doc-standards/mock-degradation.md` 或通用横切 checklist。
- 希望所有文档统一使用同一张 Mock / 降级口径表。
- 希望对 Demo / MVP / 产品的 Mock 接受标准做模板级定义。

## 5. P-08 判断：权限 / 安全 checklist 是否独立成提案

### 5.1 已覆盖位置

| 覆盖位置 | 已包含内容 |
|---|---|
| P-02 `04-05` | 安全、隐私与合规章节；真实数据、外部 AI、密钥、日志边界 |
| P-03 `06-07` | DB 字段敏感性、数据安全留存、API 权限、安全与限流、越权失败策略 |
| P-06 `design` | 权限 / 安全设计 checklist，角色 × 动作矩阵、负向用例、泄露边界 |

### 5.2 不立即拆分的理由

1. 权限 / 安全在 04-07 / design 中各自有不同职责，单独提案容易抽象过度。
2. 当前 P-02 / P-03 / P-06 已能覆盖安全隐私、DB / API 权限和详细设计 checklist。
3. 过早拆 P-08 会让提案数量膨胀，降低模板维护者一次性吸收的概率。
4. 若模板维护者认为权限 / 安全应成为跨项目强制 checklist，再单独提炼 P-08 更稳。

### 5.3 保留候选条件
若出现以下维护者反馈，再单独拆 P-08：

- 希望新增 `ai/doc-standards/security-permission-checklist.md`。
- 希望所有项目在 02 / 04 / 05 / 06 / 07 / design / 09 中统一权限安全字段。
- 希望对多租户、空间隔离、敏感数据、审计日志、越权失败策略建立模板级红线。

## 6. 回流顺序建议

建议按依赖链和维护者认知成本分批回流，而不是一次性将全部提案开成多个 issue。

| 顺序 | 提案 | 理由 | 是否依赖前序 |
|---|---|---|---|
| 1 | P-01 `00-03` 需求链 | 上游源头，定义 REQ / Phase / NFR / 非目标 | 无 |
| 2 | P-02 `04-05` 架构技术 | 承接需求链，定义总体设计与技术风险 | 依赖 P-01 |
| 3 | P-03 `06-07` DB/API 契约 | 承接 04-05，进入详细契约 | 依赖 P-01/P-02 |
| 4 | P-05 `09` 验证 | 验证规范独立且已起草，可与 P-04 联动 | 依赖 P-01/P-02/P-03 的 REQ / 风险 / 契约 |
| 5 | P-04 `08` 开发计划 | 需要引用 09 TC 和上游设计契约 | 依赖 P-05 更清晰 |
| 6 | P-06 `design` 通用详细设计 | 横跨 04-09，内容最宽，建议最后回流 | 依赖 P-02/P-03/P-04/P-05 |

> 注：如果模板维护者偏好“先结构后细节”，也可以将 P-06 提前到 P-03 之后；但 P-06 中引用 08 / 09 的追溯和验收，放在 P-04 / P-05 后更易吸收。

## 7. 提交与 issue 策略建议

### 7.1 本派生仓提交建议

建议先在本派生仓做一次提交，包含：

- Batch 0-6 审计报告。
- P-01 到 P-06 提案。
- 不包含 `.ai/session-handoff.md`。

建议提交信息：

```text
docs: propose document standards refinements
```

### 7.2 模板仓 issue 回流建议

建议不要一次性提交一个超大 issue；推荐按 P-01 到 P-06 分别创建 issue，并在每个 issue 中引用 Batch 0 / 对应 Batch 报告。

每个 issue 建议包含：

- 提案文件全文（使用 `--body-file`）。
- 标签：`proposal`、`from:LUMEN_demo_T2.1`。
- 在正文顶部保留来源标识。
- 在正文中标注依赖关系，如“依赖 / 后续：P-02”。

### 7.3 已有旧提案处理

`_proposals/TEMPLATE-UPGRADE-powershell-sync-fallback-utf8.md` 与 `_proposals/TEMPLATE-UPGRADE-submit-proposal-gh-robustness.md` 已属独立流程问题，不应混入本轮文档体系提案包。

建议处理方式：

- 若已回流 issue，保留在 `_proposals/` 直到模板仓处理后归档。
- 本轮文档体系提案回流时无需重复提交这两个旧提案。

## 8. 当前待回流材料清单

| 类型 | 文件 | 建议动作 |
|---|---|---|
| 审计报告 | `docs/research/2026-07-06-docs-system-template-proposal-audit.md` | 随派生仓提交；作为总览依据 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-1-00-03-requirements-chain.md` | 随派生仓提交；P-01 issue 可引用 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-2-04-05-architecture-tech.md` | 随派生仓提交；P-02 issue 可引用 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-3-06-07-db-api-contract.md` | 随派生仓提交；P-03 issue 可引用 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-4-08-09-dev-verification.md` | 随派生仓提交；P-04/P-05 issue 可引用 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-5-design-docs.md` | 随派生仓提交；P-06 issue 可引用 |
| 审计报告 | `docs/research/2026-07-06-template-proposal-audit-batch-6-dedup-roadmap.md` | 随派生仓提交；回流顺序依据 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-00-03-requirements-chain-standard.md` | 回流 issue P-01 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-04-05-architecture-tech-standard.md` | 回流 issue P-02 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-06-07-db-api-contract-standard.md` | 回流 issue P-03 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-08-dev-plan-progress-standard.md` | 回流 issue P-04 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-09-verification-standard-detail.md` | 回流 issue P-05 |
| 提案 | `_proposals/TEMPLATE-UPGRADE-design-doc-standard.md` | 回流 issue P-06 |

## 9. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-B6-001 | P-07 Mock / 降级是否现在独立起草 | 暂不独立起草 | P-02/P-04/P-05/P-06 已覆盖核心字段，单独起草会重复 | 立即起草 P-07 | 更集中，但提案数量增加、重复风险高 |
| C-B6-002 | P-08 权限 / 安全是否现在独立起草 | 暂不独立起草 | P-02/P-03/P-06 已覆盖安全隐私、DB/API 权限和 design checklist | 立即起草 P-08 | 更聚焦，但会与 P-03/P-06 重叠 |
| C-B6-003 | 文档体系提案是否一次性提交到派生仓 | 建议一次性提交报告 + P-01..P-06 | 便于保留完整审计链和提案包 | 分多个提交 | 粒度更细，但当前文件互相引用，拆分成本较高 |
| C-B6-004 | 模板仓 issue 是否一次性创建 6 个 | 建议按 P-01 → P-06 顺序逐个创建 | 每个主题独立，便于维护者评审 | 合并成 1 个总 issue | issue 过大，不易审查和落地 |

## 10. 后续动作

- 已完成：Batch 6 去重收口。
- 不新增 P-07 / P-08 提案；保留为维护者反馈后的候选拆分项。
- 下一步建议：先提交本派生仓新增报告与 P-01..P-06 提案，再按 `/run submit-proposal` 逐个回流到模板仓 issue。
