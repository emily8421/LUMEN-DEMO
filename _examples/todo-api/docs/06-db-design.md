# 06 数据库设计

## 1. 表清单
- `todos`：存储所有待办项（对应 REQ-1~5）

## 2. 表结构

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 待办唯一 id |
| title | TEXT | NOT NULL | 待办标题 |
| done | INTEGER | NOT NULL DEFAULT 0 | 0=未完成，1=已完成 |
| created_at | TEXT | NOT NULL | 创建时间（ISO8601） |

## 3. 索引设计
无。单人待办数据量小（百级），全表扫描足够，不建索引。

## 4. 表间关系
无。本项目仅一张表。
