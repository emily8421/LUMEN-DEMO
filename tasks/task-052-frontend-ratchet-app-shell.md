# task-052：前端 ratchet + App 减压（CQ-P1-008）

> 维护态批20 / Sprint-45 / CQ-P1-008 / governance rollout §4 轨道3 P2。
> 状态：**已完成（2026-08-13，App 拆三 shell + 文件膨胀 ratchet，bump v3.8.17）**。
> 依据：rollout 口径 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.1（文件膨胀阈值）；`ai/global-rules.md` §2.1 L0-11（体量克制）。

## 背景 / 目标

App.tsx 546 行超 250 阈值，且 frontend/src 19 个文件超限；项目无 changed-file ratchet 检查（rollout §7「ratchet 缺脚本」风险），新 PR 可能继续引入 / 膨胀超限文件。目标：App 减压（拆 auth / workspace / overlay shell，职责分离）；落地文件膨胀 ratchet（拦新增超限 + 超限膨胀，棘轮只进不退）。成功判定：App.tsx 行数显著下降；新脚本在新增超限 / 膨胀时 fail（负向探针验证）；CI 接入。

## 方案

- **App 减压**：App.tsx 546→360——拆 `AuthShell`（登录 / 注册面板 + 忘记密码，features/auth/）+ `WorkspaceShell`（主工作区容器，app/）+ `OverlayShell`（命令面板 + AI 助手，app/）；App 保留 hooks 初始化 + effects + 回调 + 三 shell 装配（props 聚合对象 + tsc 类型兜底）。
- **ratchet**：新 `scripts/check-frontend-file-size.mjs`（Node 零依赖，`wc -l` 口径）+ `frontend/.file-size-baseline.json`（19 个超限基线）+ `package.json` `check:file-size` + CI project-check step（拦新增超限 / 超限膨胀）。

## 验证包

- `npm run lint` 0 problem + `npm run build` 304 modules（+3 shell）+ `npm run check:file-size` OK
- 负向探针：临时新增 260 行文件 → ratchet fail；删除后 OK
- CI 8 job 全绿（project-check 含新 file-size step）

## 后续候选（不在本次范围）

- useAppState 再抽（App 360 仍超 250，可后续单独迭代彻底降行数）
- 其余 18 个超限文件拆分（workspace.css 722 等，候选 E4）

## 完成记录

- **编码**：App.tsx 拆三 shell（AuthShell / WorkspaceShell / OverlayShell，各 <250）；ratchet 脚本 + 基线 + package.json + CI step。
- **修正**：import 路径（AuthShell `../app`→`../../app`）；`useImport` 无 `importModalOpen`/`closeImport` 字段 → importModalOpen 传 App state + `onOpenImport`/`onCloseImport` 回调；行数统计口径与 `wc -l` 对齐（换行符计数，非 split+1）。
- **验证**：lint 0 + build 304 modules + file-size OK + 负向探针拦新增超限（260 行 fail）；CI PR #157 **8 job 全绿**。
- **收尾**：PR #157 squash merge main `7b5444f`；bump v3.8.17（VERSION / CHANGELOG / CHANGELOG-PLAIN）+ docs 08/09/05 + ai/project-rules §1 + rollout §8.1 状态回写。
- **残留候选**：useAppState 抽 hook（App 360 仍超 250）、其余超限文件拆分——均不在本次范围。
