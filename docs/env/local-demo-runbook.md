# LUMEN 本地演示效果手册（local demo runbook）

> 定位：本文件是 `ai/commands/show-demo.md` 对应的项目演示 SOP，说明如何一键启动、检查和查看当前 Demo。它不替代 `docs/09-verification.md` 正式验收记录；更完整的 Phase1 常规演示手册见 `docs/env/demo-guide.md`。

## 1. 当前适用范围

- 适用阶段：Phase1.5A（Sprint-16 已完成批量 / 文件夹 `.md` / `.txt` 导入）。
- 交付物形态：本地 Web Demo。
- 验收依据：`docs/08-dev-plan.md` Sprint-16；`docs/09-verification.md` TC-P1-015。
- Mock / 降级 / 真实能力边界：一键演示脚本使用临时内存仓储，不连接 PostgreSQL，不改本地数据库；仅用于查看 Sprint-16 批量导入交互。生产级 / 持久化演示仍按 `docs/env/demo-guide.md` 启动 PostgreSQL + 后端。

## 2. AI 场景：查看演示效果

- 触发词：`/run show-demo`、帮我启动 Demo、我想看演示效果、怎么看当前项目效果。
- AI 执行流程：先读取本 SOP；说明将启动本地临时后端、前端 dev server 和浏览器；用户确认后运行一键脚本；输出实际 URL、账号、演示路径和降级边界。
- AI 输出模板：演示入口、登录账号、推荐操作、关闭方式、当前边界。
- 需用户确认的动作：启动本地进程、打开浏览器、使用 `-StopExisting` 停止占用默认端口的旧进程。
- 禁止事项：不得安装依赖、不得接真实外部服务、不得把内存 Demo 说成生产可用、不得把临时日志提交进仓库。

## 3. 启动前提

- 运行目录：仓库根目录。
- 必备工具：Python（可导入 FastAPI / Uvicorn）、Node / npm、前端依赖已安装（`frontend/node_modules`）。
- 依赖安装状态：本脚本不安装依赖；缺依赖时按 `backend/README.md` 与 `frontend/package.json` 手动准备。
- 端口占用预检：默认后端 `18000`、前端 `5173`；脚本默认发现占用会停止并提示，可用 `-StopExisting` 主动停止旧进程。
- 本机 / 服务器 / 容器 / 外部服务边界：仅本机；不启动 Docker；不调用真实 LLM；不写 PostgreSQL。

## 4. 启动方式

一键启动：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-sprint16-demo.ps1
```

常用参数：

```powershell
# 不自动打开浏览器，适合 AI / 自动检查
powershell -ExecutionPolicy Bypass -File scripts/run-sprint16-demo.ps1 -NoBrowser

# 默认端口被旧进程占用时，先停止旧进程再启动
powershell -ExecutionPolicy Bypass -File scripts/run-sprint16-demo.ps1 -StopExisting

# 指定备用端口
powershell -ExecutionPolicy Bypass -File scripts/run-sprint16-demo.ps1 -BackendPort 28000 -FrontendPort 5174
```

- 端口策略：脚本预检端口，前端使用 `--strictPort`，最终入口以脚本输出为准。
- 后端代理：脚本通过 `DEMO_BACKEND_PROXY_URL=http://127.0.0.1:<BackendPort>` 注入 Vite dev server 代理；浏览器仍同源请求 `/api`，避免 CORS 问题。
- 关闭方式：在脚本窗口按 Enter，脚本会停止本次启动的前后端进程。

## 5. 访问入口

- 本机 URL：默认 `http://127.0.0.1:5173`；实际入口以脚本输出为准。
- 登录账号：`alice`。
- API 入口：默认 `http://127.0.0.1:18000`；仅服务本次内存 Demo。
- 页面身份标记：`frontend/index.html` 包含 `<meta name="lumen-demo-app" content="knowledge-base-workbench" />`；脚本会检查该 marker，避免端口被其他本地应用占用时误判。
- 运行产物：临时后端脚本与日志位于 `%TEMP%\lumen-sprint16-demo`，不提交进仓库。

## 6. 检查与验证

- 健康检查：脚本等待 `http://127.0.0.1:<BackendPort>/docs` 与前端 URL 可访问。
- 页面身份校验：脚本检查 `lumen-demo-app=knowledge-base-workbench` marker；不匹配则停止并报错。
- 前后端链路：前端同源请求 `/api`，Vite dev server 通过 `DEMO_BACKEND_PROXY_URL` 代理到本次启动的内存后端；登录 `alice` 后可执行批量导入、搜索和问答。
- 期望结果：页面身份匹配；登录成功；批量导入 `.md` / `.txt` 后文档列表出现路径标题，搜索和问答可命中。
- 常见失败：端口占用、依赖未安装、浏览器未自动打开、端口被其他项目页面占用。

## 7. 推荐演示路径

1. 启动脚本并打开页面。
2. 使用账号 `alice` 登录。
3. 进入文档视图，在“批量导入文本”区域拖入多个 `.md` / `.txt`，或点击“选择文件夹”。
4. 观察批量摘要与逐条结果：成功 / 失败 / 跳过。
5. 确认文档标题保留路径前缀，例如 `folder/readme`。
6. 切到搜索视图，用导入文件里的关键词搜索。
7. 切到问答视图，询问导入内容，确认来源指向刚导入文档。

## 8. 安全与边界

- 不处理真实敏感数据：演示文件请使用测试内容。
- 不启用未确认外部服务：一键脚本不连接真实 LLM / 外部 API。
- 不安装依赖 / 不产生费用：脚本只启动已有本地依赖。
- 运行产物忽略规则：脚本日志在 `%TEMP%`；若后续新增 `.ai/local-demo-runtime.json`、二维码或端口状态文件，必须保持 gitignored。

> 演示检查通过只说明本地 Demo 可查看；正式验收仍以 `docs/09-verification.md` 为准。
