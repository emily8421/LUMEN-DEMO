# Web App Scaffold Experiment Protocol

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件用于 Batch 6：在真实项目或独立实验仓验证 Web App scaffold 候选方案。它是实验协议，不是母模板内置脚手架；默认不新增 `template-docs/web-app/`，不启用 `new-project --profile web-app`，也不创建领域模板。

## 1. 适用范围

满足以下条件时，可以启动一次 Web App scaffold 实验：

- 已触发 `template-docs/web-fullstack-profile.md`，并完成或计划完成 Sprint 0 / Walking Skeleton。
- 项目需要验证 App Shell、前后端目录边界、API client、state / hooks、样式 token、API / service / tests 的可复用结构。
- 实验发生在真实派生项目或独立实验仓，不污染母模板主同步路径。

## 2. 非目标

- 不在母模板内直接生成 React / Vue / Next.js / FastAPI / Spring 等技术栈代码。
- 不把单个项目的业务目录、组件库、权限模型或数据模型写成通用 scaffold。
- 不在未验证前新增 `new-project --profile web-app`。
- 不把 Web App Profile 直接升级为领域模板；领域模板判断见 `template-docs/domain-templates.md`。

## 3. 实验输入

| 输入 | 最低要求 |
|---|---|
| 项目类型 | 普通派生项目或独立实验仓；若是领域模板仓库，改走 `/run domain-template-lab` |
| 文档依据 | `04/05/08/09` 已记录或准备记录 WSG-001 到 WSG-006 |
| UI 依据 | UI brief、frontend experience brief、frontend-interaction 或 UI 原型策略已满足 / 豁免 |
| 技术边界 | 技术栈、运行命令、端口、mock / persistence、权限 / 降级口径已明确 |

## 4. 实验步骤

1. **选候选结构**：从 `template-docs/web-fullstack-profile.md` 的推荐目录边界裁剪出最小结构。
2. **只生成最小 slice**：只跑通 App Shell、一个页面 / 视图、一个 API client、一个后端 endpoint / mock、一个 API / browser smoke。
3. **记录偏差**：记录哪些目录保留、哪些被裁剪、哪些技术栈命名不同但职责等价。
4. **验证阈值**：观察主应用文件、全局样式、页面、service / controller 是否触发文件膨胀阈值。
5. **回填证据**：把实验结论写回项目 `08/09` 或项目侧实验记录；可通用经验再回流母模板 `_proposals/`。

## 5. 实验记录模板

```markdown
# Web App Scaffold Experiment Record

> 定位：Web App scaffold 候选结构实验记录；不是已确认母模板事实。

## 1. 实验上下文

- Project / repo:
- Template version:
- Tech stack:
- Triggered WSG gates:
- UI / backend order:

## 2. 候选结构

| Area | Candidate path | Kept / changed / removed | Reason |
|---|---|---|---|
| App Shell |  |  |  |
| Pages / views |  |  |  |
| Features |  |  |  |
| API client |  |  |  |
| State / hooks |  |  |  |
| Styles / tokens |  |  |  |
| Backend API |  |  |  |
| Service / model |  |  |  |
| Tests / smoke |  |  |  |

## 3. Walking Skeleton 验证

| Check | Command / step | Result | Evidence |
|---|---|---|---|
| Frontend open |  | Pass / Fail / Skipped |  |
| API / mock smoke |  | Pass / Fail / Skipped |  |
| Browser smoke |  | Pass / Fail / Skipped |  |
| Permission / fallback visible |  | Pass / Fail / Skipped |  |

## 4. 文件膨胀观察

| File / area | Lines / complexity | Threshold | Action |
|---|---:|---:|---|
| App entry |  | 300 |  |
| Global styles |  | 300 |  |
| Page / view |  | 250 |  |
| Service / controller |  | 250 |  |

## 5. 结论

- Candidate status: keep as project-local / propose template-docs example / propose new-project profile / propose domain template / reject
- Reusable parts:
- Project-specific parts:
- Risks:
- Follow-up proposal:
```

## 6. Promotion decision matrix

| 结论 | 触发条件 | 后续动作 |
|---|---|---|
| 保持项目本地 | 只有单项目适用，或技术栈 / 业务上下文过强 | 不回写母模板，只保留项目记录 |
| 补 `template-docs/web-app/` 参考示例 | 2–3 个普通 Web 项目复用相同职责边界，但仍不需要自动生成代码 | 先提案，再加入人读示例和自检；不得写业务事实 |
| 评估 `new-project --profile web-app` | 多个项目需要同一最小目录 / 启动命令 / smoke 结构，且可跨技术栈抽象 | 另起提案；必须说明默认行为、同步风险和验证成本 |
| 迁移为领域模板 | 多个同类项目共享领域标准件、独立版本和自检，不适合所有 Web 项目 | 走 `domain-template-lab`，在独立领域模板仓库试验 |
| 拒绝推广 | 结构只在单一技术栈或单一业务里成立 | 记录反例，避免母模板变重 |

## 7. 母模板回流要求

回流到母模板前必须去项目化：不得包含客户信息、私有路径、真实账号、业务敏感数据或单项目专属表 / 接口 / 权限。推荐先写 `_proposals/TEMPLATE-UPGRADE-web-app-scaffold-experiment-<topic>.md`，说明实验来源、可复用部分、非目标、版本影响和验证证据。
