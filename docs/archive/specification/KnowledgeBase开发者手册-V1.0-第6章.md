# 第6章 系统部署

## 6.1 本章目标

### 6.1.1 为什么需要部署

开发完成后：

```text
代码
≠
系统可用
```

---

只有完成：

```text
启动
运行
验证
部署
```

整个流程。

项目才真正可用。

---

因此：

```text
部署
=
让代码变成系统
```

---

### 6.1.2 Phase1部署目标

KnowledgeBase Phase1目标：

```text
本地单机部署
```

运行环境：

```text
Windows
```

---

最终效果：

```text
浏览器
↓
KnowledgeBase
↓
AI问答
```

能够正常工作。

---

### 6.1.3 本章完成标准

完成后：

```text
✓ 前端启动

✓ 后端启动

✓ Ollama启动

✓ SQLite正常工作

✓ 浏览器可访问

✓ AI问答可运行
```

---

## 6.2 Phase1部署架构

### 6.2.1 部署结构

KnowledgeBase Phase1：

```text
Windows
│
├─ Vue3
│
├─ FastAPI
│
├─ Ollama
│
├─ SQLite
│
└─ Vault
```

---

### 6.2.2 数据流

```text
浏览器
↓
Vue3

↓ API

FastAPI

↓ AI

Ollama

↓ 数据

SQLite
```

---

### 6.2.3 服务端口

建议：

| 服务       | 端口    |
| -------- | ----- |
| Vue3     | 5173  |
| FastAPI  | 8000  |
| Ollama   | 11434 |
| PlantUML | 8888  |

---

## 6.3 本地开发启动

### 6.3.1 启动顺序

推荐：

```text
Ollama
↓
FastAPI
↓
Vue3
```

---

### 6.3.2 启动Ollama

检查：

```bash
ollama list
```

---

查看模型：

```text
qwen3

bge-m3
```

---

如果能看到模型：

说明正常。

---

### 6.3.3 启动后端

进入：

```bash
cd backend
```

---

激活环境：

```bash
.venv\Scripts\activate
```

---

启动：

```bash
uvicorn app.main:app --reload
```

---

成功：

```text
http://localhost:8000
```

---

### 6.3.4 FastAPI验证

打开：

```text
http://localhost:8000/docs
```

---

看到：

```text
Swagger UI
```

说明成功。

---

### 6.3.5 启动前端

进入：

```bash
cd frontend
```

---

启动：

```bash
npm run dev
```

---

成功：

```text
http://localhost:5173
```

---

### 6.3.6 验证系统

访问：

```text
http://localhost:5173
```

---

看到首页：

说明部署成功。

---

## 6.4 前端部署

### 6.4.1 开发模式

开发阶段：

```bash
npm run dev
```

---

特点：

```text
热更新
```

---

修改代码：

```text
自动刷新
```

---

### 6.4.2 构建模式

执行：

```bash
npm run build
```

---

生成：

```text
dist
```

目录。

---

### 6.4.3 dist目录

例如：

```text
frontend
│
├─ src
│
├─ public
│
└─ dist
```

---

作用：

```text
最终发布版本
```

---

### 6.4.4 部署方式

推荐：

```text
FastAPI托管
```

即可。

---

## 6.5 后端部署

### 6.5.1 开发模式

启动：

```bash
uvicorn app.main:app --reload
```

---

特点：

```text
自动重启
```

---

适合开发。

---

### 6.5.2 生产模式

启动：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

特点：

```text
稳定运行
```

---

### 6.5.3 配置文件

推荐：

```text
.env
```

---

例如：

```env
OLLAMA_HOST=http://localhost:11434

DB_PATH=data/kb.db
```

---

### 6.5.4 环境变量

读取：

```python
import os
```

---

避免：

```python
写死配置
```

---

## 6.6 SQLite部署

### 6.6.1 为什么选择SQLite

Phase1：

```text
单机
单用户
```

---

SQLite足够。

---

### 6.6.2 数据库文件

例如：

```text
data
│
├─ kb.db
│
└─ vectors.db
```

---

### 6.6.3 备份方式

直接复制：

```text
.db文件
```

即可。

---

### 6.6.4 优势

无需：

```text
安装数据库服务
```

---

部署简单。

---

## 6.7 Ollama部署

### 6.7.1 Ollama作用

负责：

```text
AI问答

Embedding
```

---

### 6.7.2 查看状态

执行：

```bash
ollama list
```

---

### 6.7.3 推荐模型

问答：

```text
qwen3:8b
```

---

向量：

```text
bge-m3
```

---

### 6.7.4 端口

默认：

```text
11434
```

---

### 6.7.5 API验证

浏览器：

```text
http://localhost:11434
```

---

返回：

```text
Ollama is running
```

说明正常。

---

## 6.8 PlantUML部署

### 6.8.1 为什么需要

KnowledgeBase支持：

```text
PlantUML
```

图表。

---

### 6.8.2 Docker启动

执行：

```bash
docker run -d -p 8888:8080 plantuml/plantuml-server
```

---

### 6.8.3 验证

访问：

```text
http://localhost:8888
```

---

成功即可。

---

### 6.8.4 当前阶段要求

Phase1：

```text
可选
```

---

不是必须。

---

## 6.9 Docker部署

### 6.9.1 Docker是什么

容器平台。

---

作用：

```text
统一运行环境
```

---

### 6.9.2 为什么后续需要

未来：

```text
PostgreSQL

Qdrant

PlantUML
```

都可以容器化。

---

### 6.9.3 当前阶段

了解即可。

---

不要求掌握。

---

## 6.10 Docker Compose

### 6.10.1 什么是Compose

管理多个容器。

---

例如：

```text
frontend

backend

ollama

plantuml
```

统一启动。

---

### 6.10.2 启动方式

未来：

```bash
docker compose up -d
```

---

即可启动整个系统。

---

### 6.10.3 Phase1要求

预留即可。

---

暂不强制。

---

## 6.11 项目发布

### 6.11.1 发布条件

满足：

```text
功能可运行

无重大Bug

文档完整
```

---

### 6.11.2 Git标签

创建：

```bash
git tag v1.0.0
```

---

### 6.11.3 GitHub发布

创建：

```text
Release
```

---

版本：

```text
v1.0.0
```

---

### 6.11.4 发布内容

包含：

```text
源码

README

部署说明
```

---

## 6.12 Phase1部署检查清单

### 环境

```text
□ Cursor

□ Git

□ GitHub

□ Python

□ Node.js

□ Ollama
```

---

### 前端

```text
□ npm install

□ npm run dev

□ 页面正常
```

---

### 后端

```text
□ FastAPI启动

□ Swagger正常
```

---

### AI

```text
□ Ollama启动

□ qwen3安装

□ bge-m3安装
```

---

### 数据

```text
□ SQLite正常

□ 文件读取正常
```

---

### Git

```text
□ Commit完成

□ Push完成
```

---

## 6.13 Phase1最终部署图

```text
浏览器
    │
    ▼
Vue3
    │
    ▼
FastAPI
    │
 ┌──┴──┐
 ▼     ▼
SQLite Ollama
```

---

## 6.14 Phase1部署完成标准

达到：

```text
浏览器打开

目录树显示

文件列表显示

Markdown预览

全文搜索

AI问答
```

---

即可认为：

```text
KnowledgeBase V1
部署成功
```

---

# 本章小结

本章介绍：

```text
本地部署

前端部署

后端部署

SQLite部署

Ollama部署

PlantUML部署

Docker规划

项目发布
```

开发者应掌握：

```text
如何启动项目

如何验证项目

如何发布项目
```

下一章进入：

```text
第7章 常见问题处理
```

总结：

```text
Git问题

GitHub问题

Cursor问题

环境问题

AI开发问题
```

帮助开发者快速定位和解决问题。
