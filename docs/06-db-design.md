# 06 数据库设计

> 按「完整骨架 + 阶段增量」演进（global-rules §8）。铺出**完整愿景**的全部表；
> `[P1]` 表写全字段 / 索引，`[P2]` / `[愿景]` 表留骨架。
> 表前缀 `lumen_`；每张表可追溯到 REQ。

## 1. 表清单（完整）

| 表 | 用途 | 阶段 | 状态 | 追溯 |
|---|---|---|---|---|
| lumen_users | 账号 | [P1] | P1-已设计 | REQ-001 基础 |
| lumen_spaces | 空间 | [P1] | P1-已设计 | REQ-001 |
| lumen_space_members | 成员-空间-角色 | [P1] | P1-已设计 | REQ-001/002 |
| lumen_documents | 文档 | [P1] | P1-已设计 | REQ-003/004 |
| lumen_document_versions | 版本历史 | [P1] | P1-已设计 | REQ-006 |
| lumen_chunks | 切块 + Embedding 向量 + 全文向量 | [P1] | P1-已设计 | REQ-007/008 |
| lumen_imports | 导入任务 | [P1] | P1-已设计 | REQ-009/010 |
| lumen_tags | 标签 | [P2] | 骨架 | REQ-012 |
| lumen_tag_links | 标签-文档关联 | [P2] | 骨架 | REQ-012 |
| lumen_push_copies | 跨空间推送只读副本 | [P2] | 骨架 | REQ-015 |
| lumen_vault_mounts | Vault 挂载配置 | [愿景] | 骨架 | REQ-018 |
| lumen_audio_records | 录音转写记录 | [愿景] | 骨架 | REQ-019 |
| lumen_brief_links | 对外只读简报链接 | [愿景] | 骨架 | REQ-022 |
| lumen_doc_links | 文档间内部链接 / 反向链接 | [P2] | 骨架 | REQ-026 |
| lumen_external_sync | 外部源同步配置（飞书等） | [愿景] | 骨架 | REQ-028 |
| lumen_doc_participants | 文档参与人物（实体抽取） | [愿景] | 骨架 | REQ-031 |
| lumen_hypotheses | 假设检验记录 | [愿景] | 骨架 | REQ-033 |
| lumen_evidence | 证据条目（支持 / 反对） | [愿景] | 骨架 | REQ-033 |
| lumen_signal_subscriptions | 信号追踪主题订阅 | [愿景] | 骨架 | REQ-034 |
| lumen_analysis_kits | 分析包（A Kit）配置 | [愿景] | 骨架 | REQ-035 |

## 2. 表结构（[P1] 已设计）

### lumen_users
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| external_id | varchar | 外部账号标识 |
| name | varchar | 显示名 |
| created_at | timestamptz | |

### lumen_spaces
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| code | varchar UK | 如 `nova-internal` / `brightlite-team` |
| name | varchar | 显示名 |
| created_at | timestamptz | |

### lumen_space_members
| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | bigint FK→users | |
| space_id | bigint FK→spaces | |
| role | varchar | admin / member |
| | PK(user_id, space_id) | |

### lumen_documents
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| space_id | bigint FK→spaces | 隔离边界 |
| title | varchar | |
| content_md | text | Markdown 正文 |
| owner_id | bigint FK→users | |
| permission | varchar | private / team / external |
| type | varchar | markdown / index_entry（P1 默认 markdown；P2 快速录入用 index_entry，见 REQ-025） |
| current_version | int | 当前版本号 |
| created_at / updated_at | timestamptz | |
- 索引：`(space_id, permission)` 复合——支撑隔离 + 权限过滤

### lumen_document_versions
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| document_id | bigint FK→documents | |
| version_no | int | |
| content_md | text | 该版本正文 |
| editor_id | bigint FK→users | |
| created_at | timestamptz | |
- 约束：`UNIQUE(document_id, version_no)`

### lumen_chunks（pgvector，检索核心）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| document_id | bigint FK→documents | |
| ordinal | int | 块序号 |
| text | text | 块原文 |
| embedding | vector(N) | pgvector 向量，维度 N 待 05 定 |
| ts_vector | tsvector | 全文检索向量 |
- 索引：向量近邻（ivfflat / hnsw，参数待 05）+ `ts_vector` GIN

### lumen_imports
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| space_id | bigint FK→spaces | |
| source_filename | varchar | |
| mime | varchar | docx / pdf / image |
| status | varchar | processing / done / failed |
| parsed_doc_id | bigint FK→documents | 解析生成/关联的文档 |
| created_at | timestamptz | |

### [P2] / [愿景] 表（骨架·待该阶段细化）
- `lumen_tags` / `lumen_tag_links`：标签模型与聚合规则待 P2 细化（REQ-012）
- `lumen_push_copies`：跨空间只读副本与权限同步待 P2 细化（REQ-015）
- `lumen_vault_mounts`：Vault 挂载（路径、账号绑定、只读索引）待愿景验证（REQ-018）
- `lumen_audio_records`：录音转写记录待愿景验证（REQ-019）
- `lumen_brief_links`：对外简报（token、有效期、AI 可问不可看原文）待愿景验证（REQ-022）
- `lumen_doc_links`：内部链接 `[[文件名]]` 与反向链接索引（P2，REQ-026）
- `lumen_external_sync`：外部源（飞书等）同步配置与摘要同步（愿景，REQ-028）
- `lumen_doc_participants`：文档参与人物、共现统计（愿景，REQ-031）
- `lumen_hypotheses` / `lumen_evidence`：假设检验与正反证据（愿景，REQ-033）
- `lumen_signal_subscriptions`：信号追踪主题订阅（愿景，REQ-034）
- `lumen_analysis_kits`：分析包 A Kit 配置（愿景，REQ-035）

## 3. 索引设计

- `lumen_chunks`：向量近邻索引 + `ts_vector` GIN（全文）——检索双路召回的基础
- `lumen_documents`：`(space_id, permission)` 复合——隔离 + 权限过滤
- `lumen_document_versions`：`UNIQUE(document_id, version_no)`

## 4. 表间关系

```text
users ──< space_members >── spaces
spaces ──< documents ──< document_versions
spaces ──< documents ──< chunks
spaces ──< imports ──> documents（解析产物）
documents.permission / owner_id 与 space_members 共同决定可见性（见 docs/design/permissions）
```
