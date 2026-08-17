# DIAG-FLOW-INGEST-BATCH · Flow-006 批量导入流程

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/ingestion.md`（本图所在块）。阶段：详细设计；类型：流程图；追溯：REQ-037；渲染：GitHub 原生。

```mermaid
flowchart TB
  batch[files[] + relative_paths[]] --> validate[逐文件校验 .md / .txt]
  validate -->|合法| ps{preserve_structure?}
  validate -->|不合法| failed[items[].status=failed]
  ps -->|true 默认| folder[建/复用 lumen_folders 幂等 + folder_id]
  ps -->|false 向后兼容| title[相对路径标题前缀]
  title --> conflict{同名?}
  folder --> conflict
  conflict -->|是| skipped[items[].status=skipped]
  conflict -->|否| single[复用 Flow-D-001]
  single --> done[done + parsed_doc_id + folder_id?]
  failed --> summary[批量结果汇总]
  skipped --> summary
  done --> summary
```
