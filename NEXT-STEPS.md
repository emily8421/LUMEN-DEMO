# NEXT-STEPS — LUMEN-DEMO 项目自有版本机制启用（会话接续点）

> 本文件是跨会话交接单。新窗口先读本文件 + `ai/index.md` 列出的规则文件，再继续。
> 属临时交接文档，事项办完后可删除（不是永久编号文档，不放 `docs/`）。
>
> 旧交接（§2.5 运行环境确认，v1.7.0 时代）已全部沉淀进 `ai/project-rules.md §2.5` 与 `docs/env/local-env.md`，交接单退役。

---

## 0. 当前位置（截至 2026-07-18）

LUMEN-DEMO 启用项目自有版本机制（v0.1.0 起点），落地 v1.54.1 同步后的 post-sync-cleanup 待办（见 `sync-records/template-sync/2026-07-17-sync-template-v1.54.1.md`「后续动作」）。

- 分支：`chore/enable-project-versioning`
- 启用 commit：`f91c09e chore(versioning): 启用 LUMEN-DEMO 项目自有版本机制 v0.1.0`（5 文件：VERSION v0.1.0 / CHANGELOG 顶部项目版本段 / TEMPLATE-BASE / project-rules §2.8 / 新建 project-check.yml）
- 验证：check-derived-sync 确认「派生项目版本机制已启用」；本地模拟 CI 版本一致性校验通过
- 留痕：`sync-records/2026-07-18-enable-project-versioning.md`

---

## 1. 进行中 / 待办

- [ ] push `chore/enable-project-versioning` + 开 PR（走 clash 7897 代理；gh 带 `HTTPS_PROXY`）
- [ ] CI 自检 `project-check.yml`（PR 上 pull_request 触发，验证新 workflow 本身有效）
- [ ] 合并 PR 到 main
- [ ] 更正母模板 memory `derived-project-lumen-demo.md`（"双版本正常"→"原沿用模板版本，2026-07-18 启用自有版本机制 v0.1.0"）
- [ ] （可选）母模板 registry 更新 LUMEN 版本机制状态

---

## 2. 关键事实（避免重复解释）

- VERSION 原值 `v1.47.1` 是**模板沿用值**（CHANGELOG 顶部原也是模板脚本记录），LUMEN 此前**未建立自有版本机制**——非"项目自有版本落后于继承版本"的双版本现象。
- 起点定 **v0.1.0**（与 zhiyan v0.3.0 同思路：派生项目启用时重置干净自有起点，切割模板版本号）。
- VERSION/CHANGELOG **保留在 `template-sync.json` 清单**（不删，删了过不了 `check-template.sh` 自检）；靠 `--preserve-project-version` 防 sync 覆盖（ordinary 派生自动启用）。
- 章节放 **§2.8**（check-derived-sync 按字符串「项目版本管理」检测，不挑编号；脚本提示亦建议 §2.8）。
- 参考实现：zhiyan-digital-cs-platform（已启用 v0.3.0）。

---

## 3. 网络备忘（复用）

- 本机访问 GitHub git 协议需 clash 代理 **7897**（mixed-port）；LUMEN 仓库已设 local `http.proxy/https.proxy=http://127.0.0.1:7897`，git push 直接走代理。
- `gh` 不读 git http.proxy，命令带 `HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897`。
- gh 账号 emily8421，LUMEN-DEMO ADMIN 权限，token 含 `repo`+`workflow` scope（push 新 workflow 必需）。

---

## 4. 恢复命令

```bash
cd "D:/2-Project/0-Product/3-LUMEN_KnowledgeBase/LUMEN_demo_T2.1"
git status --short --branch
git log --oneline -3
# push（代理已 local 设）
git push -u origin chore/enable-project-versioning
# 开 PR（gh 带代理）
HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897 gh pr create --base main --head chore/enable-project-versioning --title "chore(versioning): 启用项目自有版本机制 v0.1.0" --body "..."
```
