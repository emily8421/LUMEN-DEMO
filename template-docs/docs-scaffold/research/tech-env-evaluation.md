# Tech Environment Evaluation Scaffold（技术路线与环境支撑评估结构模板）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 推荐落盘路径：`docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`
> 对应 Prompt：`ai/prompts/review/20-tech-env-evaluation.md`
> 定位：生成 / 修订 `docs/05-tech-spec.md` 前，或进入首个触发真实运行依赖的 Sprint 前，评估技术路线、依赖安装、最小运行、资源、网络和权限风险；不替代 `docs/env/local-env.md` 或 `docs/05-tech-spec.md`。

## 0. 元信息

【撰写提要：记录评估范围、触发原因、执行环境、评估结论和关联 Risk-ID / RG-ID。】

| 字段 | 内容 |
|---|---|
| 评估日期 | YYYY-MM-DD |
| 评估范围 | frontend / backend / docker / database / LLM / SDK / 外部 API / 其他 |
| 触发原因 | 生成 05 / 进入 Sprint / 依赖升级 / 资源风险 / 其他 |
| 执行环境 | `docs/env/local-env.md` 或实际环境说明 |
| 结论 | Go / Conditional Go / No-Go |
| 关联 Risk-ID / RG-ID | |

## 1. 上游依据与目标

【撰写提要：列出需求、架构、技术方案草案、项目规则和环境事实来源。】

| 来源 | 相关内容 | 影响 |
|---|---|---|
| `docs/03-prd.md` | | |
| `docs/04-architecture.md` | | |
| `docs/05-tech-spec.md` | | |
| `ai/project-rules.md` | | |
| `docs/env/local-env.md` | | |

## 2. 候选技术路线 / 依赖清单

【撰写提要：列出候选依赖、版本、用途、来源和替代方案；候选不得写成已启用。】

| 依赖 / 技术 | 版本 / 来源 | 用途 | 状态 | 备选方案 |
|---|---|---|---|---|
| | | | 候选 / 待验证 / 已验证 / 禁止 | |

## 3. 采集到的环境事实

【撰写提要：引用 `collect-env` 或手工采集结果；环境采集不等于评估通过。】

| 项 | 事实 | 来源 | 影响 |
|---|---|---|---|
| OS / Shell | | | |
| Runtime | | | |
| CPU / RAM / GPU | | | |
| 网络 / 代理 | | | |
| 权限 / 凭据 | | | |

## 4. 最小验证命令与结果

【撰写提要：记录实际执行的安装、导入、启动、连接或 smoke 命令；未执行必须写明原因。】

| 验证项 | 命令 / 步骤 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|
| | | | | 通过 / 失败 / 未执行 | |

## 5. 资源、网络、权限与安全风险

【撰写提要：列出风险、触发条件、影响、缓解、解锁条件和是否阻塞当前 Sprint。】

| Risk-ID | 风险 | 触发条件 | 影响 | 缓解 / 降级 | 阻塞关系 |
|---|---|---|---|---|---|
| RISK-001 | | | | | 阻塞 / 条件阻塞 / 不阻塞 |

## 6. Readiness Gate 结论

【撰写提要：给出 Go / Conditional Go / No-Go；Conditional Go 必须列限制条件和补做时点，No-Go 阻止相关实现。】

| RG-ID | 能力 / 依赖 | 结论 | 条件 / 限制 | 解锁证据 | 回填位置 |
|---|---|---|---|---|---|
| RG-001 | | Go / Conditional Go / No-Go | | | `docs/05` / `docs/08` / `docs/09` |

## 7. 对 05 / 08 / 09 的回填建议

【撰写提要：评估报告不替代正式文档；结论需要回填到技术方案、开发计划和验证计划。】

| 回填位置 | 建议内容 | 状态 |
|---|---|---|
| `docs/05-tech-spec.md` | Risk-ID、依赖状态、readiness gate | 待回填 |
| `docs/08-dev-plan.md` | Sprint 前置条件 / 禁止事项 | 待回填 |
| `docs/09-verification.md` | TC / 证据路径 / 未验证项 | 待回填 |

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 | | | | | |
