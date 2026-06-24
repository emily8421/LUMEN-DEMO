# 详细设计：空间与权限子系统（permissions）

> 对应 REQ-001 / 002 / 003。总体定位见 04；数据见 06（lumen_spaces / members / documents.permission）。
> 按「完整骨架 + 阶段增量」：`[P1]` 写细，`[P2]` 骨架。

## 1. 模型

- **空间（space）**：隔离边界，成员关系在 `lumen_space_members`
- **文档权限（permission）**：`private`（仅作者）/ `team`（空间内可见）/ `external`（外部只读；P1 支持字段存在，对外发布走 P2）
- **隔离原则**：任何查询 / 检索 / 问答先按 `space_id` 收敛，再按 `permission` 过滤

## 2. 过滤点（[P1]，三处统一）

权限过滤下沉到 SQL / 检索层，不依赖应用层记忆（防漏过滤）：

1. **列表 / CRUD**：`WHERE space_id=? AND (permission<>'private' OR owner_id=current_user)`
2. **全文搜索**：`ts_vector` 检索 + 同上过滤
3. **RAG**：候选块生成时只取可见文档的 `lumen_chunks`

## 3. 关键决策

- **过滤下沉**：权限条件进 SQL / 检索 where 子句，不在应用层事后裁剪
- **私有文档是否入索引**：P1 决策——仍入 `lumen_chunks` 索引，但检索时按 `owner_id` 过滤（实现简单）；P2 可评估"私有不入索引"以更强隔离
- **空间切换**：切换即换 session 当前 `space_id`，后续所有操作以此为上下文（REQ-002）

## 4. 阶段增量

- `[P1]` 已设计：隔离 + 三级权限 + 三处过滤
- `[P2]` 待细化：跨空间推送的只读副本权限同步（REQ-015）

## 5. 与其他子系统交互

- **被** docs/design/rag-retrieval、文档 / 搜索 service 调用做过滤
- **被** 07 各接口在入口校验（鉴权 + 空间 + 文档权限）
