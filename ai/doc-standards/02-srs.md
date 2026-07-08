# 02 SRS Standard（系统需求规格规范镜像）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `docs/02-srs.md` 的细粒度规范标准，用于 AI 生成、精修、审计和评估系统需求规格。它不是项目事实文档，派生项目的实际系统需求仍写入 `docs/02-srs.md`。

## 1. 定位与边界

`02` 是系统需求事实源，负责把用户需求转成可验证的功能需求、非功能需求、约束、假设和异常场景。它回答“系统必须表现出什么行为”，不写产品路线图、架构模块、技术选型、接口字段或实现计划。

- 不得引入 `01` 未授权的功能需求；无来源需求必须标为待确认。
- 当前 Phase 相关 REQ 必须有可验证口径；远期 REQ 可保留骨架并标待细化。
- 候选、待技术验证、Mock、降级、默认关闭、禁止等状态必须据实标注。
- NFR 和约束必须说明来源、验证方式或待确认状态。

## 2. 最低结构

| 能力 | 最低字段 / 结构 |
|---|---|
| 文档元信息 | 输入来源、覆盖 U-ID、当前状态、最后更新 |
| 功能需求 | REQ-ID、系统需求、来源 U-ID、可验证口径、初步阶段、状态 |
| 非功能需求 | NFR-ID、类型、需求描述、来源、验证方式、状态 |
| 约束与假设 | 编号、类型、内容、状态、影响范围 |
| 边界条件与异常场景 | 编号、关联 REQ、条件、期望行为、验证提示 |
| U-ID → REQ-ID 追溯 | U-ID、REQ-ID、覆盖说明、是否完整覆盖、备注 |
| 验证入口 | 当前 Phase REQ 应能导向 `09` AC / TC 或至少保留验证提示 |
| 待人工确认项 | 结构化确认项表，不得只写问题列表 |

## 3. ID 与追溯规则

- 功能需求使用 `REQ-001`，非功能需求使用 `NFR-001`，约束可使用 `CON-001`，异常 / 边界可使用 `EX-001`。
- 最低链路：`U-ID → REQ-ID / NFR-ID → Phase → AC / TC`。
- 每个当前 Phase REQ 必须有验证入口；后续 Phase REQ 可标“后续阶段待细化”。
- 删除或新增 REQ 时必须评估 `03-09` 下游影响。

## 4. 审计检查

| 检查项 | 通过标准 | 常见问题 |
|---|---|---|
| U-ID 覆盖 | 每个关键 U-ID 有 REQ 覆盖 | U-ID 悬空 |
| 可验证 | 当前 Phase REQ 有验证入口 | 需求无法验收 |
| NFR 有来源 | NFR 写明来源和验证方式 | 性能 / 安全要求凭空生成 |
| 状态准确 | 候选 / 待验证 / 已确认不混用 | 候选能力写成已确认 |
| 异常覆盖 | 边界和异常能导向设计 / 测试 | 只写成功路径 |

## 5. 下游影响

- 给 `03`：功能聚合、Phase 路线图和产品取舍输入。
- 给 `04/05`：架构约束、技术风险和 NFR 输入。
- 给 `06/07/design`：数据、接口和详细设计来源。
- 给 `08/09`：Sprint 范围、验收标准和测试用例来源。
