# 自托管 Runner（Self-hosted）方案评估（2026-08-14）

> 类型：阶段分析记录（候选方案评估 + 决策留痕）。本文不新增需求 / 接口 / 验收目标；不把「候选 / 待技术验证」写成已启用能力。项目事实以 `docs/08-dev-plan.md` / `docs/09-verification.md` / Git 历史为准。
> 范围：GitHub Actions 免费额度耗尽（2026-08-14）后，自托管 runner 作为替代方案的可行性评估、启用前置清单、收益 / 代价 / 风险，以及当前「暂缓启用、挂起等额度重置」的决策。
> 关联：`docs/research/2026-08-14-github-actions-billing-analysis.md`（计费分析与省额度方案，本文为其方案延伸）；PR #171（token 优化候选）/ #172（CI 拆分）。

## 1. 背景与决策

2026-08-14 本项目 GitHub Actions 因账号（emily8421，免费个人账户）2000 分钟/月免费额度耗尽且未绑卡而停跑。省额度方案 1+2（paths 路径过滤拆分 workflow）已落地（PR #172），但**当月剩余额度仍不足**，PR #171 / #172 的 CI 验证需等额度重置（约 2026-09-01）。

在「等重置」与「自托管 runner」之间评估后，**人工决策（2026-08-14）：自托管 runner 暂缓启用，本项目先挂起等额度重置。本文落盘候选方案，后续需要时再启用。**

## 2. 自托管 Runner 方案概要

**本质**：在自备机器上注册一个 runner，GitHub Actions 的 job 改由该机器执行。官方口径：**自托管 runner 完全免费**，不消耗 GitHub-hosted 的 2000 分钟/月配额，也不产生超额计费。

**关键事实（官方口径）**：
- 计费：`Minutes usage is charged to the repository owner`——但自托管 runner 不适用分钟计费，**免费无限分钟**。
- **Service containers（`jobs.<id>.services`，本项目 backend-integration 用的 PG 容器）只支持 Linux 自托管 runner**；macOS / Windows 自托管 runner 不支持 service containers。
- 自托管 runner 只自动更新 runner 软件本身；**操作系统与其他工具（Docker / Node / Python）由机器维护者负责**。

## 3. 启用前置清单（需要时执行）

1. **准备 Linux 机器**：本机是 Windows 11（i7-12650H / 32G）——因 service container 限制**必须用 Linux**：Linux 虚拟机 / 云主机 / 旧电脑。Windows 本机直接跑无法满足 backend-integration（PG 容器）。
2. **安装工具**：Docker（service container 必需）、Node 22.17.1（匹配 `frontend/package.json` volta 锁定）、Python 3.14（匹配 `backend/requirements.txt` 锁定）。
3. **注册 runner**：`Settings → Actions → Runners → New self-hosted runner` → 下载 runner → `./config.sh` → `./run.sh`。
4. **改 workflow**：3 个 yml（`project-check.yml` / `backend-ci.yml` / `frontend-ci.yml`）的 `runs-on: ubuntu-latest` → `runs-on: self-hosted`（或 `self-hosted, linux, x64`）。

## 4. 收益

| 收益 | 说明 |
|---|---|
| **免费无限分钟** | 不再消耗 2000min/月配额，不担心超额停跑 |
| **CI 常可用** | 维护态随便跑，额度不再是瓶颈 |
| **数据不出本机/内网** | 代码与测试数据留在自备机器，不经 GitHub 托管 runner（对私有仓库隐私友好） |

## 5. 代价 / 风险

| 代价 | 说明 |
|---|---|
| **机器需常开** | runner 是常驻进程；关机则 CI 不可用。要 CI 随时可用需 24h 在线（或按需开机） |
| **环境维护成本** | OS、Docker、依赖全自管；GitHub 只更新 runner 软件 |
| **Windows 兼容性硬约束** | **service container（PG）仅 Linux runner 支持**；Windows 需跑 Linux VM（占资源）或放弃容器方式改本机 PG |
| **本机资源** | i7/32G 跑 Demo 已吃资源，常驻 Linux VM 跑 CI 可能紧张 |
| **安全** | runner 能执行仓库代码；私有仓库风险可控，但建议与个人/生产机器隔离 |

## 6. 启用触发条件

以下任一成立时，重新评估并启用：
1. 未来某月频繁发版，预计稳定超过 2,000 分钟/月免费额度；
2. 「等额度重置」导致功能 PR 合并阻塞超过可接受范围（当前维护态判定：可接受）；
3. 用户愿意长期养一台 Linux runner 机器并接受维护成本。

## 7. 决策与状态

- **状态**：候选 / 待技术验证，**未启用**。
- **决策（2026-08-14 人工确认）**：暂缓启用。当前走「挂起等额度重置」（约 2026-09-01），PR #171 / #172 挂起待 CI 恢复。
- **理由**：维护态发版频率低，17 天等待影响小；自托管需养 Linux 机器 + 维护环境，收益（无限分钟）对当前低频率场景不匹配。

## 8. 追溯索引

- 计费口径：[About billing for GitHub Actions](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)
- 自托管 runner：[About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)、[Self-hosted runners reference](https://docs.github.com/en/actions/reference/runners/self-hosted-runners)
- Service container 平台限制：[About service containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
- 同源：`docs/research/2026-08-14-github-actions-billing-analysis.md`
