# Sprint-6 Chrome 人工 Smoke 清单

> 定位：调研 / 验收执行辅助记录。本文档用于人工执行 Sprint-6 桌面端 Chrome smoke，不新增需求、不替代 `docs/09-verification.md`；执行结论需回填到 `docs/09-verification.md` §5 验收记录。

## 1. 映射与范围

| 项 | 内容 |
|---|---|
| 关联 Sprint | `docs/08-dev-plan.md` Sprint-6：桌面端集成与验收 |
| 关联 REQ | REQ-001..REQ-011、REQ-036 |
| 交付物形态 | Phase1 Demo（降级口径） |
| 浏览器 | Chrome 桌面端 |
| 不验证 | 真实 PDF 解析、图片 OCR、移动端 / 响应式移动适配、真实 PostgreSQL / pgvector / Embedding / LLM |
| 已有自动化参考 | Edge Headless smoke 已通过；后端 48 tests、compileall、前端 build 已通过 |

## 2. 启动命令

在项目根目录分别启动两个终端。

### 2.1 后端

```powershell
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 18000
```

期望：终端显示 Uvicorn 正在监听 `http://127.0.0.1:18000`，浏览器访问 `http://127.0.0.1:18000/docs` 可打开 FastAPI 文档。

### 2.2 前端

```powershell
npm.cmd --prefix frontend run dev
```

期望：Vite 显示本地地址 `http://127.0.0.1:5173`。

## 3. 测试数据准备

在本地任意临时目录创建文件 `chrome-smoke.md`，内容如下：

```markdown
# Chrome Import

Chrome导入关键词 桌面端闭环 术语验收。
```

说明：Sprint-6 仅验证 `.txt/.md` 已提取文本降级导入；真实 `.pdf` 与图片 OCR 不在本清单内验证。

## 4. 操作步骤

| 步骤 | 操作 | 预期结果 | 实际结果 | 结论 |
|---|---|---|---|---|
| 1 | 用 Chrome 打开 `http://127.0.0.1:5173` | 出现 Demo 登录页 |  | 待执行 |
| 2 | 使用默认账号 `alice` 点击“登录” | 顶部显示 `LUMEN Demo · Sprint-6`，当前空间为 `Nova Internal` |  | 待执行 |
| 3 | 检查桌面布局 | 左侧空间 / 文档 / 导入，中间编辑器，右侧版本 / 搜索 / 问答 / 术语均可见 |  | 待执行 |
| 4 | 点击文档区“新建” | 中间编辑器切换为新建文档 |  | 待执行 |
| 5 | 标题填 `Chrome Smoke Doc`，内容填 `# Chrome Smoke Doc` 与一段正文，点击“保存” | 状态栏显示已保存，文档列表出现 `Chrome Smoke Doc` |  | 待执行 |
| 6 | 连续修改 Markdown 内容两次并保存 | 版本历史至少出现 3 个版本 |  | 待执行 |
| 7 | 在版本历史点击旧版本“恢复” | 状态栏显示“已恢复到版本 ...”，编辑器内容回到对应版本 |  | 待执行 |
| 8 | 在“导入已提取文本”选择 `chrome-smoke.md`，标题填 `Chrome Import Doc`，点击“导入” | 显示 `导入完成：文档 #...`，文档列表出现 `Chrome Import Doc` |  | 待执行 |
| 9 | 在全文搜索输入 `Chrome导入关键词` 并点击“搜索” | 搜索结果出现 `Chrome Import Doc` 和命中片段 |  | 待执行 |
| 10 | 在 RAG 问答输入 `Chrome导入关键词 是什么` 并点击“提问” | 出现答案，来源包含 `Chrome Import Doc` |  | 待执行 |
| 11 | 在术语管理点击“新建”，标准名称填 `Chrome验收术语`，定义填 `Chrome 手工 smoke 的空间术语。`，别名填 `术语验收`，点击“保存术语” | 状态栏显示术语已保存，术语列表出现 `Chrome验收术语` |  | 待执行 |
| 12 | 在 RAG 问答输入 `术语验收 是什么` 并点击“提问” | 来源中出现“术语表来源” |  | 待执行 |
| 13 | 切换空间到 `BrightLite Team` | 状态栏显示空间已切换，文档列表不再显示 Nova 空间新增文档 |  | 待执行 |
| 14 | 在 BrightLite Team 搜索 `Chrome导入关键词` | 显示“未找到匹配文档。” |  | 待执行 |

## 5. 判定口径

| 结论 | 判定标准 |
|---|---|
| 通过（降级口径） | 步骤 1..14 全部符合预期；真实 PDF / OCR 仍记录为未验证。 |
| 部分通过 | 主流程可用，但存在非阻塞 UI 文案、布局或单项失败；需列明失败步骤与影响。 |
| 不通过 | 登录、文档 CRUD、降级导入、搜索、RAG、术语来源或空间隔离任一主链路阻塞。 |

## 6. 执行记录模板

| 项 | 内容 |
|---|---|
| 执行日期 | 2026-07-06 |
| 执行人 | 待填写 |
| Chrome 版本 | 待填写 |
| 后端命令 | `.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 18000` |
| 前端命令 | `npm.cmd --prefix frontend run dev` |
| 总体结论 | 待填写：通过（降级口径） / 部分通过 / 不通过 |
| 失败步骤 | 待填写；无则写“无” |
| 截图 / 证据 | 待填写；可记录截图文件路径或说明未截图 |
| 回填位置 | `docs/09-verification.md` §5 验收记录 |

## 7. 回填建议

若 Chrome smoke 通过，建议在 `docs/09-verification.md` §5 追加：

```markdown
| 2026-07-06 | Sprint-6 Chrome 人工 smoke | 通过（降级口径） | 已通过 Chrome 桌面端登录、空间切换、文档 CRUD / 版本恢复、`.md` 降级导入、搜索、RAG 问答、术语创建与术语来源、跨空间搜索隔离；真实 PDF 解析、图片 OCR 未验证。 |
```

