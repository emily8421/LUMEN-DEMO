# LUMEN-DEMO 模板同步运行记录 — v1.54.1

> 基于 `template-docs/derived-sync-report-template.md`。派生项目同步留痕，point-in-time。

## 基本信息

- 项目：LUMEN-DEMO（ordinary derived project）
- 同步日期：2026-07-17
- 同步前 / 目标模板版本：v1.51.0 → **v1.54.1**
- 项目自身版本（`VERSION`）：v1.47.1（保留）
- 继承版本记录（`TEMPLATE-BASE.md`）：ordinary；同步到 v1.54.1
- 同步分支：`chore/sync-template-v1.54.1`（合并后远端已删）
- 同步提交：`c4da709` → PR LUMEN-DEMO#81 squash 合并 commit `2a68b41`
- 操作入口：手动命令（git-guide §5.3）
- AI 工具：Claude Code

## 执行命令与结果

| 步骤 | 命令 | 退出 | 完整执行 |
|---|---|---|---|
| bootstrap | `git checkout FETCH_HEAD -- scripts/sync-template.sh` + commit | 0 | 是 |
| dry-run | `sync-template.ps1 --dry-run` | 0 | 是 |
| commit | `sync-template.ps1 --commit` | 0 | 是 |
| check-derived-sync | `check-derived-sync.ps1` | 0 | 是 |
| post-sync-cleanup | — | — | 未执行（另开分支） |
| docs-system-audit | — | — | 未执行 |
| 项目验证 | — | — | 未执行 |

- 版本保留：`--preserve-project-version`（自动启用，因 `TEMPLATE-BASE.md` 为 ordinary 角色）
- 同步前先 bootstrap：本地 `sync-template.sh` 为 v1.51.0 旧版，脚本版本自检要求更新（+2 行），单独提交 `40acab2`

## 同步结果

- ✅ 成功；22 文件变更，全部在 `template-sync.json` 清单内
- ✅ `VERSION`/`CHANGELOG` 保留项目自身版本（v1.47.1）；`TEMPLATE-BASE.md` 更新至 synced v1.54.1
- ✅ 项目专属文件未误改：`README.md` / `ai/project-rules.md` / `docs/00-09` / 业务代码（frontend/backend/tests）均未触及
- `ai/doc-standards/*` 无差异（已存在）

## 同步后整理摘要

- post-sync-cleanup：**未执行**（按 §5.5 另开分支）
- ⚠️ 待办：版本机制完整启用 —— `.github/workflows/project-check.yml` 加「Check project version consistency」+ `ai/project-rules.md` 加「项目版本管理」章节（check-derived-sync 非阻断提示）

## 遇到的问题

- **网络**：本机 git fetch 母模板远端 HTTPS 直连被 reset（HTTP/2 `curl 16` framing / HTTP/1.1 `curl 52` empty reply）；SSH 通道可达但 publickey 未配（`Permission denied`）。
  - 解决：clash 代理端口 **7897**（mixed-port）；对派生项目设 local `http.proxy`/`https.proxy = http://127.0.0.1:7897`；`gh` 命令带 `HTTPS_PROXY=http://127.0.0.1:7897`（gh 不读 git http.proxy）。
- **bootstrap**：本地 `sync-template.sh` 旧版，脚本自检拦截，先 bootstrap 最新版再同步。
- **母模板 registry 更新**：main 为保护分支（`GH006`），直接 push 被拒，改走 PR（ai-project-template#228）。

## 可优化点（建议回流模板）

| 问题 | 是否项目专属 | 建议回流 | 建议提案 |
|---|---|---|---|
| 国内网络下 sync-template fetch 易失败，脚本/文档缺代理配置说明（含 gh 不读 git http.proxy 的坑） | 否（环境共性） | 是 | 文档增强：git-guide §5 / 脚本提示补充代理配置 |

## 后续动作

- [ ] 版本机制完整启用（post-sync-cleanup，另开分支）
- [ ] docs-system-audit 同步后审计（可选）
- [ ] 项目验证（按 web-fullstack 技术栈跑测试/lint/build）
