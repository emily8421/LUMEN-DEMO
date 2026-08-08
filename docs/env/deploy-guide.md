# LUMEN 生产部署手册（⑪ 开放团队使用）

> 状态：**部署方案 A（全容器化）落盘 · 2026-08-08**。本文指导把 LUMEN 从「本机运行」开放为「团队成员可访问」。
> 适用：公司内网服务器 / 云服务器（Linux + Docker）。本地 Demo 启动见 `local-demo-runbook.md`，两者不冲突。

## 0. 快速结论

- **推荐方案**：后端 + 前端 + PostgreSQL 全部容器化，一条命令起三服务。
- 成员通过 `http://<服务器地址>` 访问，`/api` 由 Nginx 同源反代（无跨域）。
- 登录为真实账号体系（REQ-040..047）：注册 / 凭证登录，admin 可加成员。

## 1. 前置条件

| 项 | 要求 | 说明 |
|---|---|---|
| 服务器 OS | Linux（Debian/Ubuntu 等） | Docker Desktop 也可，但生产推荐原生 Docker Engine |
| Docker + Compose | Docker 20+ / Compose v2 | `docker compose version` 确认 |
| 内存 | ≥ 8GB（Embedding CPU 推理 + 后端 + PG） | `bge-small-zh` CPU 跑，见 `project-rules §2.5` |
| 磁盘 | ≥ 20GB（镜像 + 模型缓存 + 数据卷） | torch 镜像较大（CPU 版 ~1-2GB） |
| 端口 | 80（前端入口） | 可改 compose 映射 |
| 网络 | 服务器能访问 LLM 中转（如 `192.168.15.190:7777`） | 否则 RAG / AI 功能降级，问答不报错但走模板 |

## 2. 部署步骤

### 2.1 拉取代码到服务器

```bash
git clone https://github.com/emily8421/LUMEN-DEMO.git lumen
cd lumen
```

### 2.2 准备环境变量

后端容器通过 compose `env_file: .env` 透传全部 `LLM_*` 变量（多配置格式，不进 git，勿 commit）：

```bash
cp .env.example .env    # 或手动创建
```

`.env` 关键项（多配置格式，示例）：

```bash
# LLM 中转（OpenAI 兼容），deepseek 默认通道
LLM_PROVIDERS=deepseek_a
LLM_DEEPSEEK_A_PROVIDER=deepseek
LLM_DEEPSEEK_A_BASE_URL=http://192.168.15.190:7777/v1
LLM_DEEPSEEK_A_MODEL=deepseek-v4-flash
LLM_DEEPSEEK_A_API_KEY=你的key

# 生产 PG 密码（强烈建议修改默认；compose 读取，DATABASE_URL 会被 compose 覆盖为容器内地址）
LUMEN_PG_PASSWORD=强密码
```

> 完整变量名见 `.env.example`（多配置段）。`.env` 里的 `DATABASE_URL` 在生产会被 compose 覆盖为 `postgresql://lumen:<密码>@postgres:5432/lumen`，无需手改。

### 2.3 构建并启动

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

首次启动后端会跑 migration（014..017）+ seed（幂等，约 1-3 分钟，取决于 Embedding 首次下载模型）。

### 2.4 验证

```bash
docker compose -f docker/docker-compose.prod.yml ps        # 三服务 healthy / Up
curl -s http://localhost/api/auth/sessions | head -c 200    # API 可达（未登录 4001）
```

浏览器访问 `http://<服务器IP>` → 注册新账号 → 登录 → 建文档 / 搜索 / 问答。

## 3. 常见运维

| 操作 | 命令 |
|---|---|
| 查看日志 | `docker compose -f docker/docker-compose.prod.yml logs -f backend` |
| 重启后端 | `docker compose -f docker/docker-compose.prod.yml restart backend` |
| 停止全部 | `docker compose -f docker/docker-compose.prod.yml down` |
| 数据备份 | PG 数据卷 `lumen_pgdata_prod`；`docker volume inspect` 定位后备份 |
| 升级 | `git pull && docker compose -f docker/docker-compose.prod.yml up -d --build` |
| 改前端端口 | compose `frontend.ports` 改 `"8080:80"` → 访问 `http://<IP>:8080` |

## 4. HTTPS（公网部署必需）

内网部署可暂用 HTTP；公网必须 HTTPS，两种方式：

1. **Nginx 反代 + Let's Encrypt**（推荐）：前置系统 Nginx 反代 `:80/:443` 到 compose 前端端口，`certbot` 签证书。
2. **改前端容器**：把 443 映射进容器 + 挂载证书（需改 `nginx.conf`）。

## 5. 安全注意

- **改默认 PG 密码**（`LUMEN_PG_PASSWORD`）。
- **LLM key 不外泄**：`.env` 不入 git，容器内只读注入。
- **数据外发**：RAG / AI 润色会经 LLM 中转外发用户显式触发的片段（RG-008 已人工接受）。若团队文档含敏感信息，建议先明确边界或仅开放本地挂载浏览。
- **真实账号**：生产是真实凭证登录（`LUMEN_ENV=production` 强制，demo 免密被禁）。首管理员需在 DB 里把某用户 `role` 置为 `admin`，或用既有 admin 账号建团队。

## 6. 与本地 Demo 的关系

| 模式 | 命令 | 存储 | 登录 |
|---|---|---|---|
| 本地内存 Demo | `scripts/run-sprint16-demo.ps1`（无 `-UsePostgres`） | 内存（重启清空） | alice 免密 |
| 本地 PG Demo | 同脚本 + `-UsePostgres` | `lumen-pg` 容器 | 凭证登录 |
| **生产部署（本文）** | `docker compose -f docker/docker-compose.prod.yml` | PG 数据卷 | 真实凭证 |

## 7. 遗留 / 未覆盖

- 未做：多节点 / 负载均衡 / 自动备份 job / 邮件（忘记密码依赖，见 REQ-051 立项）。
- Embedding 首次启动需联网下载 `bge-small-zh`（已挂 `lumen_hf_cache` 卷避免重复下载）。
- 镜像较大（torch CPU ~2GB）；如需瘦身可评估 llama.cpp / ONNX 替代 sentence-transformers（本期不做）。
