# Sprint-3 降级任务：已提取文本导入最小闭环

## 目标

在 Docker / PDF / OCR / Embedding 环境未就绪时，先实现 Phase1 Demo 的导入入口最小闭环：上传已提取文本或 Markdown 文件，创建文档并生成内存 chunks，为后续搜索与 RAG Sprint 提供数据入口。

## 输入文档

- `docs/08-dev-plan.md` Sprint-3：内容导入流水线
- `docs/design/ingestion.md`：异构文件 → 纯文本 → 切块 → 入库流程
- `docs/06-db-design.md`：`lumen_imports` / `lumen_chunks`
- `docs/07-api-spec.md`：`POST /api/import`

## 修改范围

- `backend/model/entities.py`：补充 Demo import / chunk 数据结构
- `backend/service/demo_repository.py`、`backend/service/imports.py`：内存导入任务、简单文本清洗与切块
- `backend/api/imports.py`、`backend/main.py`：提供 `POST /api/import` 降级接口
- `tests/backend/*`：补充 service 与 API 测试

## 验收标准

- `POST /api/import` 接收 `.txt` / `.md` 上传并返回 `status=done`、`parsed_doc_id`、`chunk_count`
- 导入后可通过现有 `/api/documents/{id}` 读取生成的 Markdown 文档
- 非空间成员不能导入到无权空间
- 空文件或不支持的文件类型返回明确错误

## 禁止事项

- 不接真实 PostgreSQL / pgvector
- 不安装或启用 `pdfplumber`、PaddleOCR、`sentence_transformers`
- 不实现真实 PDF 解析、图片 OCR、Embedding 向量写入
- 不扩展到搜索 / RAG / 术语页面
