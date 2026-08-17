# DIAG-FLOW-INTEL · 情报分析功能骨架（愿景）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/intelligence-analysis.md`（本图所在块）。阶段：详细设计（愿景）；类型：流程图；追溯：REQ-029..034 骨架；渲染：GitHub 原生。

```mermaid
flowchart LR
  docs[文档 / chunks / doc_links] --> graph[关联图]
  docs --> timeline[时间轴]
  graph --> path[路径推理]
  timeline --> causality[因果展开]
  docs --> evidence[证据地图]
  docs --> signals[信号追踪]
  path -.高风险验证.-> decision[是否纳入未来 Phase]
  causality -.高风险验证.-> decision
  evidence -.高风险验证.-> decision
```
