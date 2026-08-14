# GitHub Actions 免费账户计费分析与省额度建议（2026-08-14）

> 类型：阶段分析记录（计费机制解读 + 实测数据 + 省额度决策留痕）。本文不新增需求 / 接口 / 验收目标；项目事实以 `docs/08-dev-plan.md` / `docs/09-verification.md` / Git 历史为准。
> 范围：GitHub 免费个人账户（emily8421）Actions 计费机制、本项目 8/11-8/13 额度耗尽根因、省额度方案评估与已落地决策（方案 1+2 → PR #172）。
> 关联：`docs/research/2026-08-14-token-optimization-candidate-analysis.md`（token 优化同源）；PR #171（token 候选落地）/ #172（CI 拆分）。

## 1. 触发与背景

2026-08-14 提交 PR #171 后，GitHub Actions 9 个 job **全部未启动即失败**，annotation 提示：

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings.

经核验非代码问题（本地验证全过），根因是 **GitHub 账号（emily8421，免费个人账户）Actions 免费额度耗尽**，且因未绑信用卡无法超额计费，额度用完即拒绝启动 job。

## 2. GitHub Actions 计费机制（免费个人账户）

| 项目 | 口径 | 说明 |
|---|---|---|
| 免费额度 | **私有仓库 2,000 分钟/月** | 每月重置、不累积；仅私有仓库消耗 |
| 公开仓库 | **无限免费** | 标准 runner（Linux/Windows/macOS） |
| 自托管 runner | **免费** | 不计入额度 |
| 超额计费 | Linux $0.006/min（2026-01 调降）；Windows $0.010/min；macOS $0.062/min | **需绑卡设消费上限**，否则额度用完即停 |
| OS 倍率 | macOS 分钟 ≈10x Linux、Windows ≈2x | 免费额度按 Linux 速率折算 |
| 计费单位 | **每个 job 独立计时**，并行也各算各 | 非墙钟时长；9 job 并行 = 9 份时长之和 |
| 大 runner | 4-core+ 按固定费率另计，不消耗 2000 池 | 本项目未用 |

**结论**：本项目是私有仓库（`emily8421/LUMEN-DEMO`）+ 免费个人账户 + 未绑卡 → 2000 分钟/月用尽即停，无法超额。

## 3. 本项目额度消耗实测（2026-08-14 API 数据）

### 3.1 单次全量 CI 成本构成

取 8/13 一个正常成功 run（id 31732362461），9 job 计费分钟之和：

| Job | 计费分钟 | 占比 |
|---|---|---|
| Backend mypy typecheck | 3.8 min | 27% |
| Backend integration (PG) | 3.3 min | 23% |
| Backend unit tests | 3.1 min | 22% |
| OpenAPI schema diff | 2.6 min | 18% |
| Frontend build | 0.5 min | 4% |
| Frontend OpenAPI codegen drift | 0.3 min | 2% |
| Frontend ESLint | 0.3 min | 2% |
| Ruff (advisory) | 0.1 min | 1% |
| project-check | 0.1 min | 1% |
| **合计（单次 run）** | **14.2 min** | 100% |

**关键发现：后端 4 个 Python job（mypy / integration / unit / schema-diff）共 12.8 min，占 90%**——是烧额度的绝对大头。

### 3.2 8/13 一天消耗

- 触发 54 次 run（51 success / 3 fail），墙钟合计约 210 min
- 按「每次 run ≈ 14.2 计费分钟」估算，**8/13 一天 ≈ 750+ 计费分钟**

### 3.3 为什么一个月就爆

维护态批次（v3.8.0→27，2026-08-08~13）固定闭环「PR 全跑 + main 合并再全跑」，**一个批次 ≈ 28 分钟**：

- 8/11-13 集中 30 批次 → 估算 800-1500 分钟
- 加失败重试、push 重复触发、advisory job 常态跑 → 2000 分钟/月额度 3 天内烧穿

## 4. 省额度方案评估（按 ROI 排序，均不绑卡）

| 方案 | 内容 | 预期节省 | 状态 |
|---|---|---|---|
| **方案 1** | **paths 路径过滤**：纯文档/前端/后端改动只跑对应 workflow | 纯文档批 14→0.1min（~99%）；纯前端批 14→1.2min（~90%） | **已落地（PR #172）** |
| **方案 2** | **main 合并后不 9 job 全量重跑**：push main 同 paths 过滤，只跑实际改动域 | 每批省一半（约 7min） | **已落地（PR #172）** |
| 方案 3 | 合并后端 4 job 依赖安装（共享 pip install / setup-python cache） | 省 ~30% 后端耗时 | 候选 |
| 方案 4 | Ruff advisory job 降频（仅 backend/ 变更时跑，或关闭） | 0.1min/次 | 候选 |
| 方案 5 | 规避 Windows/macOS runner | 已满足（全 ubuntu），无需动作 | 已满足 |

## 5. 已落地决策（方案 1+2 → PR #172）

按路径拆分 `project-check.yml` 为 3 个 workflow，9 job 全迁移无丢失：

| 文件 | 内容 | 触发条件 |
|---|---|---|
| `project-check.yml`（改造） | whitespace / 版本一致性 / sync boundary / file-size ratchet | **总是跑**（~0.1min） |
| `backend-ci.yml`（新增） | unit / integration(PG) / mypy / ruff / schema-diff | paths：`backend/**`、`tests/backend/**`、`openapi/**`、`requirements*`、`mypy.ini`、`ruff.toml`、`scripts/export-openapi.py` |
| `frontend-ci.yml`（新增） | build / eslint / codegen drift | paths：`frontend/**`、`openapi/**` |

关键设计：**`openapi/**` 同时触发两端**——后端契约变更自动联动前端 `gen:api` 校验，防 `generated.ts` 失配。push main 同 paths 过滤（方案 2）。

**验证**：本地 PyYAML 语法 + 结构 + 9 job 迁移完整性校验全过；真实触发行为待额度恢复后确认。

## 6. 建议（后续可选）

- **优先**：额度恢复后 merge PR #172，首个纯文档批 PR 应只跑 project-check（实测 paths 生效）。
- **候选**：若后续仍有额度压力，评估方案 3（后端依赖安装合并）——当前后端 job 占比 90%，是该方向主攻点。
- **长期**：维护态发版频率低后，2,000 分钟/月免费额度应充足，无需绑卡。

## 7. 模板回流判断

**候选回流点**：模板的 CI 质量门指引（`template-docs/web-fullstack-profile.md` §测试分层与质量门 / `ai/implementation-lifecycle-rules.md` §6.2）目前只有「按项目形态裁剪、说明适用 / 不适用项」，**缺一个成本 / 配额维度**——派生项目在私有仓库 + 免费账户下建 CI 时，没有「路径过滤 / 配额意识」的模板级指引。这是一个真实的模板缺口（通用性高：任何私有仓库免费账户的派生项目都可能踩）。

**回流形态**：应为 `template-docs/web-fullstack-profile.md`（或 `remote-ci-sop-profile.md`）的一条指引性条目，而非硬规则——「CI 质量门 + 路径过滤（paths）按域拆分 workflow，避免全量 job 常态跑；私有仓库注意 Actions 分钟配额」。去项目化：只写机制，不写本项目 job 集 / 路径 / 版本。

**决策（2026-08-14 人工确认）：暂不回流，攒实证。** 理由：
1. 本轮 CI 拆分的实际效果（paths 过滤省额度）**尚未实测**——PR #172 因账号额度耗尽未跑 CI，真实触发行为待验证。
2. 符合 `ai-records/token-hotspots/SUMMARY.md` §5「避免过度治理，先当执行纪律、回流等实证」定调。
3. 待本项目用 1-2 个批次实证 paths 生效 + 配额压力确实缓解后，再起草 `_proposals/TEMPLATE-UPGRADE-ci-budget-paths-filter.md` 回流。

**实证触发点**：① PR #172 merge 后首个纯文档批 PR 只跑 project-check（~0.1min）；② 连续 1-2 个维护批次未再触发额度停跑。

## 8. 追溯索引

- 实测数据来源：GitHub REST API（`repos/emily8421/LUMEN-DEMO/actions/runs`、`/jobs`），2026-08-14 查询
- 计费口径：[GitHub docs — GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)、[GitHub Actions Pricing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions)
- 落地：PR #172（commit `bc185dc`，分支 `chore/ci-split-paths-filter`）
- 同源：`docs/research/2026-08-14-token-optimization-candidate-analysis.md`
