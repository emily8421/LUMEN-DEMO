# 07 API设计

RESTful 风格，JSON 收发，错误用标准 HTTP 状态码。

## 1. 统一约定
- 请求/响应均为 JSON
- 成功：2xx；入参错误：422；资源不存在：404；服务错误：500
- 无鉴权（Phase1 单人）

## 2. 接口清单

| 方法 | 路径 | 用途 | 对应需求 |
|---|---|---|---|
| POST | /todos | 创建待办 | REQ-1 |
| GET | /todos | 查询全部待办 | REQ-2 |
| PATCH | /todos/{id} | 更新完成状态 | REQ-3 |
| DELETE | /todos/{id} | 删除待办 | REQ-4 |

## 3. 请求 / 响应示例

**POST /todos**

```json
请求：{ "title": "写周报" }
响应 201：{ "id": 1, "title": "写周报", "done": 0, "created_at": "2026-06-16T09:00:00" }
```

**GET /todos**

```json
响应 200：[{ "id": 1, "title": "写周报", "done": 0, "created_at": "..." }]
```

**PATCH /todos/1**

```json
请求：{ "done": 1 }
响应 200：{ "id": 1, "title": "写周报", "done": 1, "created_at": "..." }
```

**DELETE /todos/1** → 响应 204（无 body）
