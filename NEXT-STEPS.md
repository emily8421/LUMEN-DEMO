# NEXT-STEPS — LUMEN §2.5 运行环境约束确认（会话接续点）

> 本文件是**跨会话交接单**。新窗口先读本文件 + `ai/index.md` 列出的全部规则文件，再继续。
> 属临时交接文档，事项办完后可删除（不是永久编号文档，不放 `docs/`）。
>
> **第一步建议**：读本文件 → 复核本分支已落的 §2.5 决策 → 开 PR。

---

## 0. 当前位置（截至 2026-06-26）

模板方法论已下行同步并整理完毕，三步**均已合入 main**：

| PR | 内容 | merge |
|---|---|---|
| #4 | sync template v1.6.9 → **v1.7.0**（global-rules §8 阶段双维度等） | `3b66ca9` |
| #5 | Phase 标签双维度对齐（Phase1 = 功能范围 `[P1]` + 交付物形态 **Demo**，全仓一致） | `caf25fe` |
| #6 | stale 清理（README 版本号 v1.7.0、`docs/09` 顶部定位注） | `6506384` |

main 干净、`VERSION=v1.7.0`、无 open PR。

**当前状态**：`ai/project-rules.md §2.5 运行环境与资源约束` 已按用户确认落值。Phase1 = Demo；Sprint-1/2 不依赖，Sprint-3 前需以这些约束为准。

---

## 1. 已敲定（新窗口不必再问）

| 项 | 已定值 |
|---|---|
| 联网 | **允许**。形态：本机 → 公司内网中转站 `192.168.15.190:7777`（LeMeshSub2Api 网关）→ 统一出口外网 `47.107.134.2` → OpenAI/智谱/minimax。**本机无需直连外网** |
| LLM API | 公司中转站，**OpenAI 兼容**。建议 **GLM-4.7**（配额 8000 次/周；避开 14:00–18:00 高峰 3x 消耗），重任务/高峰备选 **minimax-m2.7**（无周月限额） |
| 本机业务栈 | 后端 FastAPI + DB PostgreSQL/pgvector + 前端 React + Word/PDF 文字解析，**均本机 Docker 运行** |
| Embedding | **本机运行 `bge-small-zh`，512 维，对应 pgvector `vector(512)`**。当前公司暂无 Embedding 资源；后续不够用时申请公司内网 Embedding / reranker 服务，提供 OpenAI-compatible `/v1/embeddings` |
| 禁止本机跑 | 大参数本地 LLM / 大型 Embedding / reranker（`bge-small-zh` 本机 Embedding 属 Phase1 例外） |
| 公司服务器 | **暂不需要**（Demo 本机可跑；后续本机 Embedding / reranker 不够用时再申请内网服务） |
| 数据范围 | 默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档，真实文档必须显式标注来源 / 敏感级别，并优先避免发送到外部模型 |
| 依赖 / 镜像 | 允许本机 `pip install` / `npm install` / `docker pull` 项目所需依赖与镜像；新增依赖须写入依赖文件并说明用途，不得替换既定技术栈 |
| 资源软上限 | Demo 峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；超限先优化批处理、增量索引与 chunk 策略，再触发服务器预案 |

---

## 2. 中转站 Embedding 探测结论（关键技术点）

RAG 需要**两类模型**：LLM（生成答案）+ **Embedding**（文档切块向量化、喂 pgvector 做相似度检索）。中转站探测结果：

- `/v1/models` 需有效 Key（无 Key → `API_KEY_REQUIRED`；假 Key → `INVALID_API_KEY`，不泄露模型）
- 公开端点（`/api/pricing` `/api/models` `/api/status` 等）**全部 404**；dashboard/pricing 是 SPA，curl 拿不到模型清单
- 用户已知的可用模型表（gpt-5.4/5.5、GLM-5.1/5-Turbo/4.7/4.5-Air、minimax-m2.7）**无任何 embedding 模型**
- **倾向结论：中转站不提供 Embedding**（LeMeshSub2Api 这类 Sub2Api 网关只代理对话订阅，订阅本身不含 embedding 接口）

### 实测确认（已跳过）

用户已确认不先实测中转站，Phase1 直接采用本机 Embedding：`bge-small-zh`（512 维）。下列命令仅保留为后续排查参考：

```bash
# A. 列模型，看有无 embed* / embedding*
curl -sS -H "Authorization: Bearer 你的KEY" http://192.168.15.190:7777/v1/models | head -c 3000

# B. 直接打 embedding 接口，看能否返回向量
curl -sS -H "Authorization: Bearer 你的KEY" -H "Content-Type: application/json" \
  -d '{"model":"text-embedding-3-small","input":"测试"}' \
  http://192.168.15.190:7777/v1/embeddings
```

> 让用户用输入框 `! curl ...` 自己跑可避免 Key 进对话；或用户贴 Key 由 AI 跑。

### 若确认无 Embedding → 本机方案

走 **`bge-small-zh`**（或 `bge-m3`）：CPU 可跑、~100MB、中文友好；LLM 仍走中转站。"本机 Embedding + 远程 LLM"是 RAG 成熟混搭，不依赖中转站是否支持 embedding。维度决定 pgvector 建表字段类型：

- `bge-small-zh` → 512 维 → `vector(512)`
- `bge-m3`（中英多语） → 1024 维 → `vector(1024)`

---

## 3. 已拍板的开放项

1. **Embedding 落地**：不先实测中转站，Phase1 直接采用本机 `bge-small-zh`（512 维）。
2. **数据范围**：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档，真实文档必须显式标注来源 / 敏感级别，并优先避免发送到外部模型。
3. **装依赖 / 拉镜像**：允许本机 `pip install` / `npm install` / `docker pull` 项目所需依赖与镜像；新增依赖须写入依赖文件并说明用途，不得替换既定技术栈。
4. **资源软上限**：Demo 峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；超限先优化批处理、增量索引与 chunk 策略，再触发服务器预案。

---

## 4. 拍板后要落值的文件（按跨文档一致性同步）

| 文件 | 改什么 |
|---|---|
| `ai/project-rules.md` §2.5 | 已落联网、Embedding、依赖 / 镜像、公司服务器预案、数据范围、资源软上限 |
| `docs/env/local-env.md` | "人工确认项" + "资源软上限" + "服务器资源预案" 三段已补齐 |
| `docs/05-tech-spec.md` | Embedding 模型 + **维度**（已定 `bge-small-zh` / `vector(512)`）、本机 Demo 可行性、降级/Mock 策略、服务器资源预案 |
| `docs/09-verification.md` §4 | 本机资源验证口径（峰值内存/显存/磁盘、超限触发服务器预案的条件） |

> 04（架构运行拓扑）、05、09 的运行环境假设须与 `project-rules §2.5` 和 `docs/env/local-env.md` **一致**（global-rules §10 checklist C）。

---

## 5. 规则红线（务必遵守）

- 未确认项保持"待确认"，**不得虚构**本机资源或服务器资源（`project-rules §2.5`、global-rules）
- `README.md` / `ai/project-rules.md` / `docs/00-09` 均为**项目专属**，不参与模板下行同步；改它们走**分支 + PR**（main 受分支保护、禁直推）
- 技术栈 / 实现状态须区分"已用 / 预留·未启用 / 默认关闭"，不得把候选、预留或默认关闭写成已用（声称据实）
- 产品红线永久有效：Demo 阶段 RAG 也必须用真 LLM / 明确 Mock / 明确占位，库外问答回复"未找到"、不编造

---

## 6. 相关文件与上下文

- 跨会话状态记忆：`~/.claude/projects/D--2-Project-0-Product-3-LUMEN-KnowledgeBase-LUMEN-demo-T2-1/memory/template-lumen-two-repo-setup.md`（PR#4/5/6 + §2.5 待办全貌）
- 本机事实来源：`docs/env/local-env.md`（`collect-env.ps1` 采集：Win11 / i7-12650H 10C16T / 31.7GB / RTX 3050 6GB（可用~4GB）/ 磁盘 C150 D99 E168 GB / Docker 29.5.2 可用 / Python 3.14 / Node 22）
- 约束载体：`ai/project-rules.md` §2.5
- 中转站：内网 `http://192.168.15.190:7777`（dashboard `/dashboard`、注册 `/register`）；云端 `http://47.107.134.2:7777`（邀请制）
- 同步方法论 SOP：`INIT-PROMPT.md` §12（下行同步）、§15（同步后整理）、§13（collect-env）
