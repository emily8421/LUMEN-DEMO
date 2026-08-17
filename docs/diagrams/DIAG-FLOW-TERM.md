# DIAG-FLOW-TERM · 术语维护与口径对齐流程

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/term-management.md`（本图所在块）。阶段：详细设计；类型：流程图；追溯：Flow-D-005..007；渲染：GitHub 原生。

```mermaid
flowchart TB
  edit[术语创建 / 更新] --> terms[(lumen_terms)]
  terms --> recognize[文档阅读 / 编辑轻量匹配]
  recognize --> tooltip[悬浮提示]
  terms --> query[/api/query 加载候选术语]
  query --> inject[术语定义注入 Prompt]
  inject --> answer[RAG 回答优先采用空间定义]
```
