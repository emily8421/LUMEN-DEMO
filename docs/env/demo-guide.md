# LUMEN Demo 演示操作手册

> **定位**：本机运行与演示操作手册，属 `docs/env/` 运行环境类（与 `local-env.md` 同区）。
> 它是"怎么把 Demo 跑起来 + 怎么一步步演示 + 出问题怎么排"的实操指南，**不替代 `00-09` 事实文档**；功能定义以 `01/02/03` 为准，验收以 `09` 为准。
> 对应阶段：Phase1（功能范围 `[P1]` · 交付物形态 **Demo**）。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-11 |
| 适用 | Phase1 Demo 收口状态（Sprint-1~8 + task-009，RG-001/002/004/005 Go） |
| 本机环境 | Windows 11 / i7-12650H / 31.7GB / RTX 3050（详见 `local-env.md`） |
| 访问入口 | 前端 http://127.0.0.1:5173 ；后端 http://127.0.0.1:18000 |

---

## 1. 前置条件（一次性准备）

| 组件 | 要求 | 检查命令 |
|---|---|---|
| Docker | 已启动，能起 `lumen-pg` | `docker ps`（见 `lumen-pg` healthy） |
| Python venv | `.venv`（Python 3.14 实测版，含后端依赖） | `.venv\Scripts\python.exe --version` |
| Node | frontend 依赖已装（`frontend/node_modules`） | `npm.cmd --prefix frontend -v` |
| `.env` | 根目录 `.env`，含 LLM 配置（见 §2） | 见下 |

> `.env` 是 **gitignored 本地文件**，LLM key 只放这里、不入库。

---

## 2. `.env` LLM 配置（关键，缺了 RAG 会降级）

`.env` 至少包含（key 用你自己的有效值）：

```ini
LLM_PROVIDER=glm
LLM_BASE_URL=http://192.168.15.190:7777/v1
LLM_MODEL=glm-5.2
LLM_API_KEY=<你的有效 key>
```

要点：
- `LLM_PROVIDER` 必须是 `glm`/`gpt`/`local` 之一（留空或 `mock` → RAG 降级，不调真 LLM）。
- `LLM_BASE_URL` 是 OpenAI 兼容 **base**（程序自动拼 `/chat/completions`），填到 `/v1` 为止。
- `LLM_MODEL` 填中转支持的模型名（`192.168.15.190:7777` 支持：`glm-4.7/5.1/5.2`、`MiniMax-2.7`、`mimo-v2.*` 等；可 `curl -H "Authorization: Bearer <key>" http://192.168.15.190:7777/v1/models` 查全表）。
- **后端不会自动加载 `.env`**（无 python-dotenv），必须在启动时把 `.env` 注入进程环境（见 §3 第 2 步），否则 LLM 走代码默认/旧中转 → 401。

---

## 3. 启动 Demo（3 步）

> 三个终端分别跑，保持开着。DB 已在 Docker 里常驻的话，第 1 步可跳过。

**① 起数据库**（PostgreSQL+pgvector，端口 5432→15432）：
```bash
docker compose -f docker/compose.yml up -d lumen-pg
docker ps   # 确认 lumen-pg healthy
```

**② 起后端**（FastAPI :18000，**必须先注入 .env**）：
```bash
# Git Bash / WSL：
set -a && . ./.env && set +a
.venv/Scripts/python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 18000
```
```powershell
# PowerShell 等价（手动 export）：
$env:LLM_PROVIDER="glm"; $env:LLM_BASE_URL="http://192.168.15.190:7777/v1"; $env:LLM_MODEL="glm-5.2"; $env:LLM_API_KEY="<key>"
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 18000
```
看到 `Application startup complete.` + `Uvicorn running on http://127.0.0.1:18000` 即成功。

**③ 起前端**（Vite :5173）：
```bash
npm.cmd --prefix frontend run dev
```
看到 `Local: http://127.0.0.1:5173/` 即成功。

**冒烟验证**（后端通不通 + LLM 配置对不对）：
```bash
curl -s -X POST http://127.0.0.1:18000/api/auth/login -H "Content-Type: application/json" -d '{"external_id":"alice"}'
# 期望：{"code":0,...,"data":{"token":"...","user_id":1,"current_space_id":10}}
```

---

## 4. 演示账号（Demo 无密码，输 external_id 登录）

| external_id | 身份 | 可见空间 | 适合演示 |
|---|---|---|---|
| `alice` | 管理员 | nova-internal + brightlite-team（可切换） | 空间切换、跨空间隔离 |
| `kira` | 成员 | 仅 nova-internal | 单空间视角、权限隔离 |
| `brightlite-member` | 成员 | 仅 brightlite-team | 客户方视角、术语对齐 |

空间：`nova-internal`（Nova 内部）、`brightlite-team`（客户 BrightLite）。

---

## 5. 演示前准备：建一篇"可被检索"的 Demo 文档

> ⚠️ **重要**：seed 自带的文档（如 `Nova Sprint Notes`）**没有切块/向量**（seed 不建索引），搜不到、问不到。搜索 / RAG 只命中**经过新建/编辑/导入**（自动切块 + Embedding）的文档。所以演示前先建一篇带内容的文档。

在浏览器登录 `alice` 后，**新建一篇文档**（或导入 `.md`），标题 `场景联动延迟约束`，正文粘贴：

```markdown
# 场景联动延迟约束

Nova 项目对场景联动的延迟有明确约束：从触发条件满足到指令发出的**触发延迟不得超过 200ms**。
这是客户 BrightLite 在合同里确认的硬性下限（confirmed），别名"开关延迟"。

测试时若触发延迟超过 200ms，需排查事件总线队列与下游执行链路。术语统一称"触发延迟"。
```

保存后系统会自动切块 + 生成向量（首次约 7~10s 加载 Embedding 模型）。之后搜索 / 问答才能命中它。

> 也可用导入：准备一个 `.md`/`.txt`，在"导入"入口上传 —— 同样会自动索引。

---

## 6. 演示脚本（建议顺序，约 15 分钟）

### 6.1 登录与空间隔离（REQ-001/002）
1. 用 `alice` 登录 → 默认进 `nova-internal`，看到本空间文档。
2. 右上角切换到 `brightlite-team` → 列表/搜索/问答上下文**随之切换**，看不到 nova 文档。
3. （对比）退出，用 `kira` 登录 → **只能看到 nova-internal**，下拉无 brightlite。
> 亮点：空间隔离在**数据查询层**过滤，不是前端隐藏。

### 6.2 文档 CRUD + 行内编辑 + 版本历史（REQ-004/005/006）
1. 新建文档 → 行内编辑正文 → 保存。
2. 再改 2 次（改不同内容）→ 保存。
3. 打开"版本历史" → 看到 3 个版本 → 选第 1 个"恢复" → 内容回到初版。
> 亮点：每次保存自动留版本，可查看、可恢复。

### 6.3 三级权限（REQ-003/REQ-012 私有）
1. 建一篇文档，权限设 **私有** → 用同空间另一账号登录 → **搜不到、问不到**该文档。
2. 改成 **团队共享** → 同空间成员可见。
3. **外部只读** → Phase1 仅表达权限类型（跨空间推送留 Phase2）。
> 亮点：私有文档不进他人检索/问答候选。

### 6.4 内容导入（REQ-009）
1. 准备 `demo.md`（任意已提取文本）。
2. "导入"入口上传 → 生成文档 + 自动切块入库。
3. 搜索其中关键词 → 命中。
> 边界：Phase1 只导 `.md`/`.txt` 已提取文本；真实 Word/PDF 解析、OCR 留后续。

### 6.5 Hybrid 搜索（REQ-007）
1. 搜索框输入 `触发延迟`（关键词命中）→ 返回 §5 建的文档，带标题/摘要/定位。
2. 再输入一个**没有直接关键词重叠但语义相关**的问题（如 `场景联动的响应时间上限`）→ 靠**向量语义召回**也能命中。
> 亮点：关键词（`ts_vector`）+ pgvector 语义双路召回；结果按当前空间 + 权限过滤。

### 6.6 RAG 问答带来源（REQ-008，核心亮点）
1. 问答框问：`触发延迟不得超过多少毫秒？依据是什么？`
2. 期望：真 LLM（glm-5.2）生成的自然语言回答——**"不得超过 200ms"**，并**标注来源**（文档「场景联动延迟约束」+ 术语「触发延迟」）。
3. 再问一个**库里没有**的问题（如 `火星到地球距离`）→ 回复 **"未找到 / 未在知识库找到"**，**不编造**（产品红线）。
> 亮点：答案带来源可溯源；库外明确"未找到"，不胡说。
> ⚠️ 若回答是"降级模式：未调用 LLM…"→ 见 §8 故障排查（多半是 `.env` 没注入或 key/中转/模型有问题）。

### 6.7 术语管理（REQ-036）
1. 进 `brightlite-team` 空间 → 术语管理 → 新建术语：`触发延迟` = "从触发条件满足到指令发出"。
2. 问包含该术语的问题 → 答案优先用 **当前空间术语定义**；同名全局术语**不覆盖**空间术语。
> 亮点：跨客户口径一致，问答不误解客户习惯用语。

### 6.8 桌面浏览器（REQ-011）
- 用 Chrome / Edge 跑完上述全部流程，无阻断。
> 边界：Phase1 只做桌面端，不做移动端响应式。

---

## 7. 演示亮点小结（给观众的一句话版）

- **既协作又隔离**：双空间 + 三级权限，客户/内部知识不互窜。
- **带来源的 RAG**：答案可溯源到文档，库外老实说"未找到"，不编造。
- **关键词 + 语义双搜**：pgvector 向量召回，没关键词也能找到。
- **空间级术语对齐**：问答按客户口径解释，不误解黑话。
- **降级清晰**：Word/PDF/OCR 真实化留后续，当前用已提取文本演示，不假装已实现。

---

## 8. 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| RAG 回答含"降级模式：未调用 LLM" | `.env` 没注入后端进程；或 `LLM_PROVIDER` 空/mock；或 key/中转/模型错 | 按 §3 第②步 **重启后端**（先 `set -a; . ./.env; set +a`）；用 `LLM_API_KEY` 直调 `chat()` 诊断（见附录 B） |
| 登录返回 500 / 连不上 DB | `lumen-pg` 没起或端口不对 | `docker ps` 确认 lumen-pg healthy（5432→15432）；db.py 默认连 `localhost:15432` |
| 搜索/问答搜不到刚建的 seed 文档 | seed 文档**未切块**（无向量） | 对该文档**编辑后保存**或**重新导入**，触发切块+Embedding（见 §5） |
| 后端启动报 `Address already in use :18000` | 旧进程没退 | 找旧 PID 杀掉，或换端口（`--port 18001`，前端需同步改代理） |
| Embedding 首次很慢（~7-10s） | `bge-small-zh` 首次加载 | 正常，等加载完即可；设 `HF_HUB_DISABLE_XET=1` 可避公司网络拉模型问题 |
| `curl /v1/models` 401 | 中转需 key | 带上 `Authorization: Bearer <key>` 再查模型列表 |
| 端口 404 model_not_found | `LLM_MODEL` 名字错（如漏横杠 `glm5.2`） | 改成中转支持的准确名（`glm-5.2`），重启后端 |

---

## 9. 停止 Demo

```bash
# 后端 / 前端：各自终端 Ctrl+C
# 数据库（如要停）：
docker compose -f docker/compose.yml stop lumen-pg
```

---

## 附录 A：API 端点速查（可用 curl 直接演示后端）

| 功能 | 方法 | 路径 | Body / 参数 |
|---|---|---|---|
| 登录 | POST | `/api/auth/login` | `{"external_id":"alice"}` |
| 文档列表 | GET | `/api/documents` | Header `Authorization: Bearer <token>` |
| 建文档 | POST | `/api/documents` | `{"title":..,"content_md":..,"permission":"team"}` |
| 搜索 | GET | `/api/search?q=触发延迟` | — |
| RAG 问答 | POST | `/api/query` | `{"question":"触发延迟不得超过多少毫秒"}` |
| 术语 | `/api/terms` | — | — |
| 导入 | `/api/import` | — | 上传 `.md`/`.txt` |

> 统一响应：`{"code":0,"msg":"ok","data":...}`；`code=0` 成功，业务错用 4 位数字码。

## 附录 B：LLM 连通性诊断（30 秒确认真 LLM 通不通）

```bash
cd <repo>
set -a && . ./.env && set +a
.venv/Scripts/python.exe -c "from backend.service import llm_adapter as a; c=a.load_config(); print('enabled',c.enabled,'model',c.model,'base',c.base_url); print(a.chat('You are concise.','用一句话回答：1+1等于几？') if c.enabled else 'DISABLED')"
```
- 输出类似 `1+1等于2。` → 真 LLM 通。
- 输出 `AuthenticationError 401` → key 无效/停用，换 key。
- 输出 `NotFoundError 404 model_not_found` → `LLM_MODEL` 名错，改准确名。
- 输出 `DISABLED` → `LLM_PROVIDER` 空/mock 或 key 空，改 `.env` 后重跑。

## 附录 C：自动验证（不依赖浏览器）

```bash
.venv/Scripts/python.exe -m unittest discover -s tests/backend -v        # 后端单测/集成
.venv/Scripts/python.exe -m compileall backend tests/backend             # 编译检查
npm.cmd --prefix frontend run build                                       # 前端构建
```
> 覆盖 REQ-001..011、036；用例追溯见 `docs/09-verification.md`。
