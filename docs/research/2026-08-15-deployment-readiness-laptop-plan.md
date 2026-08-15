# LUMEN 部署就绪分析与闲置笔记本部署方案（2026-08-15）

> **定位声明**：本文是专题方案讨论的研究留痕（`ai/document-lifecycle-rules.md` §10.3），状态为**候选 / 待人工确认**——文中所有方案均未执行、所有 gap 均未修复。不替代权威部署文档 `docs/env/deploy-guide.md`；待部署实际执行后，结论再回填该文档。
>
> **背景**：用户希望把 LUMEN 从「本机开发运行」推进到「两人团队可用」，拟用一台闲置笔记本（32GB 内存，Windows）作内网服务器。本文汇总：① 代码结构盘点；② 部署就绪 gap 分析；③ 笔记本部署方案与执行清单；④ 剥离为独立产品仓的分析。

## 0. 结论速览

- **部署基建已就绪**：⑪ 方案 A 全容器化（`docker/docker-compose.prod.yml` + 前后端 Dockerfile + Nginx 同源反代）已于 2026-08-08 落盘并有部署手册，部署不是从零开始。
- **挡路的代码缺口只有一个**：仓库无 `.dockerignore`，`.env`（含 LLM key）会被打进后端镜像层，且镜像严重膨胀——部署前必须先建（走 PR）。
- **硬件无障碍**：闲置笔记本 32GB 内存，为部署手册底线（8GB）的 4 倍；参照开发机（i7-12650H / 32GB，同时跑后端 + vite + Docker PG）负载相当。
- **剥离产品仓建议缓做**：剥离是单向的（断模板下行同步），建议先用现仓库部署跑起来（1-2 个月），等产品形态稳定再剥离。

## 1. 代码结构盘点（产品代码 vs 支撑代码）

一句话口径：**FastAPI 四层后端 + React 前端是产品本体，其余为契约、测试、部署、脚本等支撑层，全部放在一个 monorepo**。

| 类别 | 目录 | 内容 | 删掉的后果 |
|---|---|---|---|
| 产品代码 | `backend/` | FastAPI 四层（api / service / repository / model）+ `migrations/`（SQL 迁移 001..018）+ `config.py` / `main.py` | 产品不存在 |
| 产品代码 | `frontend/` | React + TS + Vite；`src/` 下 api（含 codegen 类型）/ app / features / components / styles | 产品不存在 |
| 支撑代码 | `openapi/` | `openapi.json`——前后端契约冻结快照，CI `frontend-schema-diff` 防漂移 | 可运行，失契约门禁 |
| 支撑代码 | `tests/` | 独立测试仓（103 文件，含 pgvector 集成） | 可运行，失验证手段 |
| 支撑代码 | `docker/` | `compose.yml`（本地 PG/pgvector/PlantUML）+ `docker-compose.prod.yml` + `init-test-db.sql` | 需手工搭环境 |
| 支撑代码 | `scripts/` | smoke 编排、check 系列、起服脚本等 | 失工程化工具 |
| 非代码 | `docs/` `tasks/` `ai/` `ai-records/` `_proposals/` 等 | 研发文档 + AI 协作模板体系 | 不影响运行 |

判断「产品代码」的标准是**运行时是否需要**，不是是否重要——测试 / CI / 脚本服务于开发过程，用户访问时不执行，故归支撑层；`migrations/` 虽是开发工具，但库结构是产品的一部分，归产品代码。

## 2. 部署就绪 gap 分析

基础路径按 `docs/env/deploy-guide.md` §2 五步执行（clone → `.env` → `docker compose up -d --build` → 验证 → 首管理员）。逐项 gap 与优先级：

| # | 问题 | 证据 | 影响 | 优先级 | 状态 |
|---|---|---|---|---|---|
| 1 | **无 `.dockerignore`** | 仓库根无该文件；`backend/Dockerfile` 为 `COPY . /app`（build context = 仓库根） | `.env`（LLM key）进后端镜像层，**密钥泄漏面**；`.venv`/`node_modules`/`docs`/`ai/` 等全进镜像，体积膨胀；`frontend/Dockerfile` 的 `COPY frontend/ ./` 会把宿主机 `node_modules` 覆盖进构建层 | **部署前必须修** | 候选：新建 `.dockerignore`（排除 `.env*`、`.venv`、`node_modules`、`dist`、`docs/`、`ai/`、`ai-records/`、`tasks/`、`_proposals/`、`_archive/`、`sync-records/`、`upstream/`、`template-docs/`、`.git*`、`.tmp*`、`tmp/`、`tests/` 等），走 PR |
| 2 | PR #171-175 未合并（CI 额度 8 月耗尽，等 09-01 重置） | handoff / GitHub Actions 配额记录 | main 不含 2026-08-15 验收的四项 UI 修复（PR #175） | 低（不阻塞部署） | 待 09-01 收 PR 后 `git pull` 重建镜像即可 |
| 3 | 密码重置无邮件通道（REQ-051 立项未做） | deploy-guide §7 | 忘密码需手工 DB 操作 | 低（两人团队可接受） | 已接受；备份即自救 |
| 4 | 无自动备份 | deploy-guide §3 仅有手工 `pg_dump` 提示 | PG 数据卷损坏 = 数据全失 | 中 | 候选：cron / 计划任务每日 `docker exec lumen-pg-prod pg_dump` 导出到宿主机目录 |
| 5 | 公网 HTTPS 未配 | deploy-guide §4 | 仅公网部署需要 | 内网不触发 | 挂起（内网 HTTP 可用） |
| 6 | 文档口径漂移（小） | `docker-compose.prod.yml` 头注释与 deploy-guide §2.3 写「migration 014..017」，但 `backend/migrations/` 实际已有 `018_password_reset.sql` | 可能造成「018 是否自动执行」的误判 | 低 | 待核对：确认 `init_db` 是否覆盖 018；部署实测时顺带验证 |

## 3. 部署方案：闲置笔记本（Windows）内网服务器

### 3.1 拓扑

```text
[闲置笔记本 32GB · Windows 11]                [开发机 / 同事浏览器]
 WSL2 + Docker
 ├─ lumen-frontend-prod (nginx :80)  ←────────  http://<笔记本固定IP>
 ├─ lumen-backend-prod  (uvicorn :8000)
 ├─ lumen-pg-prod       (:5432 仅容器内)
 └─ 卷：lumen_pgdata_prod / lumen_hf_cache
```

与手册（Linux 服务器）相比仅多两步前置：启用 WSL2 + Docker Desktop（WSL2 后端；团队规模不受 Docker Desktop 商用授权限制，>250 人公司才收费），以及给笔记本固定 IP（路由器 MAC 绑定或手工静态 IP——同事能否稳定访问的关键）。

### 3.2 笔记本「服务器化」一次性设置

| 项 | 操作 | 目的 |
|---|---|---|
| 电源 | 设置 → 系统 → 电源：合盖不睡眠、接通电源不睡眠 | 合盖即全停，服务中断 |
| 电池 | 厂商工具开「充电上限 80%」（联想/华硕/戴尔均有） | 7×24 插电保护电池 |
| Windows 更新 | 设「使用时间」避开工作时段 | 避免工作时段强制重启 |
| 网络 | 固定 IP；有条件插网线 | 访问稳定性 |
| 恢复力 | compose 各服务已配 `restart: unless-stopped` | 重启后自动拉起 |

### 3.3 执行清单（从现在到可用）

| # | 事项 | 在哪做 | 性质 |
|---|---|---|---|
| 1 | 新建 `.dockerignore`（§2 gap #1） | 开发机，走 PR | 代码改动 |
| 2 | 系统设置（§3.2）+ WSL2 + Docker + 固定 IP | 笔记本 | 运维 |
| 3 | `git clone` + `cp .env.example .env` 填 LLM key + `LUMEN_PG_PASSWORD` | 笔记本 | 配置 |
| 4 | `docker compose -f docker/docker-compose.prod.yml up -d --build` | 笔记本 | 首次构建 10-20 分钟（torch CPU 镜像 ~2GB + Embedding 模型首次下载） |
| 5 | 验证：三服务 healthy → `http://<IP>` 注册登录 → 建文档 / 搜索 / 问答 | 笔记本 + 开发机 | 验收 |
| 6 | 首管理员（DB 置 `role=admin`）+ 每日 pg_dump 备份（§2 gap #4） | 笔记本 | 收尾 |

## 4. 剥离为独立产品仓的分析

**先回答要不要剥离**：部署走 Docker 镜像，服务器 clone 整仓库后多余文件（docs/ai/tasks）不进运行时（`.dockerignore` 配好后连镜像都不进）。两人团队先不剥离最省事；剥离的适用触发是「给更多人用 / 开源 / 交付客户」。

**剥离清单（将来执行时参考）**：

```text
保留（产品本体 + 面向使用者裁剪）
  backend/  frontend/  openapi/  docker/  tests/
  scripts/（仅运行相关，如 run-smoke）
  .env.example  README.md  pytest.ini / mypy.ini / ruff.toml
  docs/env/{deploy-guide,user-guide}.md + docs/05-tech-spec.md
剥离（模板 / AI 协作体系）
  ai/  ai-records/  template-docs/  _proposals/  _archive/  tasks/
  sync-records/  upstream/  .cursor/  .agents/
  CLAUDE.md  AGENTS.md  INIT-PROMPT.md  TEMPLATE-BASE.md
  template-sync.json  SOP.md  MAINTAINERS.md  CONTRIBUTING.md
  docs/ 其余（00-04/08/09/design/vision/research/archive）
  .github/workflows（或保留精简版：build + test，删模板检查类）
```

**风险与时机**：剥离是**单向的**——剥出去的仓库断掉模板下行同步（`sync-template.ps1` 依赖 `template-sync.json` 与本仓结构）。建议等「维护态收尾、不再频繁同步模板」后再剥离；剥离仓需自配精简 CI。

## 5. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 | `.dockerignore` 新建并走 PR | 立即做（部署前唯一挡路的代码改动） | gap #1 密钥进镜像 + 镜像膨胀；纯新增文件风险极低 | 部署时临时改 Dockerfile `COPY` 白名单 | 不阻塞 Sprint；阻塞「安全部署」（不改则 key 进镜像） |
| C-002 | migration 018 是否被 `init_db` 自动执行 | 部署实测时以容器日志验证，再回填 deploy-guide 口径 | gap #6 文档写 014..017 与实际 018 漂移 | 现在读代码核对 | 不阻塞；防「018 漏跑」误判 |
| C-003 | 备份方案（每日 pg_dump 计划任务） | 部署跑通后第 2 步做 | gap #4；零额外花费（无云备份依赖） | 购买云存储异地备份 | 不阻塞部署；阻塞「数据安全底线」 |
| C-004 | 剥离产品仓时机 | 缓 1-2 个月，实际用起来再定 | §4 单向风险 + sync 依赖；现部署不剥离零成本 | 立即剥离 | 立即剥离断模板同步，维护成本上升 |
| C-005 | 笔记本具体型号 / CPU / 磁盘 | 已确认 32GB 内存；CPU / 磁盘在装 WSL2 时顺带核对（磁盘需 ≥20GB 余量） | deploy-guide §1 前置条件 | 不够时先清磁盘或换机 | 不阻塞方案，阻塞执行 |

## 6. 追溯与后续动作

- 上游依据：`docs/env/deploy-guide.md`（⑪ 方案 A）、`docker/docker-compose.prod.yml`、前后端 Dockerfile、`.env.example`、`docs/env/local-env.md`（开发机资源参照）。
- 下游影响：无正式文档修改；后续执行 C-001（.dockerignore PR）→ 回写本文状态；部署实际执行后 → 结论回填 `docs/env/deploy-guide.md`，验收证据进 `docs/09-verification.md`。
- 本文不新增 REQ / API / 表 / 验收目标；所有方案在用户确认前均为候选。
