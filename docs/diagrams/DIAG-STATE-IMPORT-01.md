# DIAG-STATE-IMPORT-01 · 导入任务状态机（单文件任务态）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/ingestion.md`（本图所在块）。阶段：详细设计；类型：状态图；追溯：REQ-009/037 · EX-003/006；渲染：GitHub 原生。

```mermaid
stateDiagram-v2
  [*] --> processing : 接收 .md / .txt（记 lumen_imports）
  processing --> done : 清洗→切块→Embedding→入库成功（parsed_doc_id）
  processing --> failed : 解析失败 / 编码不合法 / 异常（记原因）
  done --> [*]
  failed --> [*]
```
