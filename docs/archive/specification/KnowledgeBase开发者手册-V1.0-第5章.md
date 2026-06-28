# 第5章 Phase1开发实施

## 5.1 Phase1开发目标

### 5.1.1 Phase1定位

KnowledgeBase Phase1 的定位是：

```text
个人知识库 Demo
```

目标不是：

```text
企业级知识平台
```

而是：

```text
可运行
可演示
可持续迭代
```

的个人知识库系统。

---

### 5.1.2 Phase1核心能力

必须实现：

```text
目录管理

文件浏览

Markdown预览

快速录入

全文搜索

AI问答
```

---

### 5.1.3 Phase1技术边界

允许：

```text
Vue3

FastAPI

SQLite

Ollama
```

---

不允许：

```text
PostgreSQL

Qdrant

权限系统

多用户

工作流引擎

Agent平台
```

---

### 5.1.4 开发原则

遵循：

```text
最小可用产品（MVP）
```

原则。

优先：

```text
先跑起来
```

而不是：

```text
先做复杂
```

---

## 5.2 开发阶段划分

### 5.2.1 为什么划分Sprint

很多初学者容易：

```text
一次开发整个系统
```

结果：

```text
项目越来越复杂

最终无法完成
```

---

推荐：

```text
分阶段开发
```

---

### 5.2.2 Sprint规划

```text
Sprint1
项目骨架

Sprint2
目录树

Sprint3
文件列表

Sprint4
Markdown预览

Sprint5
快速录入

Sprint6
全文搜索

Sprint7
AI问答

Sprint8
Embedding缓存

Sprint9
测试与部署
```

---

### 5.2.3 开发顺序原则

遵循：

```text
先基础
后高级
```

例如：

```text
目录树
↓
文件列表
↓
Markdown
↓
搜索
↓
AI
```

而不是：

```text
先AI
```

---

## 5.3 Sprint1：项目骨架

### 5.3.1 目标

建立：

```text
前端项目

后端项目
```

---

### 5.3.2 前端初始化

进入项目目录：

```bash
cd frontend
```

创建项目：

```bash
npm create vite@latest .
```

---

选择：

```text
Vue

TypeScript
```

---

安装依赖：

```bash
npm install
```

---

启动：

```bash
npm run dev
```

---

成功后：

```text
http://localhost:5173
```

可访问。

---

### 5.3.3 安装Element Plus

执行：

```bash
npm install element-plus
```

---

安装后：

```text
统一UI组件
```

---

### 5.3.4 后端初始化

进入：

```bash
cd backend
```

---

创建虚拟环境：

```bash
python -m venv .venv
```

---

安装：

```bash
pip install fastapi

pip install uvicorn
```

---

创建：

```text
app
└─ main.py
```

---

测试：

```bash
uvicorn app.main:app --reload
```

---

访问：

```text
http://localhost:8000/docs
```

成功即可。

---

## 5.4 Sprint2：目录树模块

### 5.4.1 模块目标

实现：

```text
知识库目录浏览
```

---

### 5.4.2 功能要求

支持：

```text
目录展开

目录收起

文件数量显示
```

---

### 5.4.3 后端接口

设计：

```text
/api/v1/tree
```

---

返回：

```json
{
  "name":"Projects",
  "children":[]
}
```

---

### 5.4.4 前端组件

创建：

```text
DirectoryTree.vue
```

---

职责：

```text
显示目录树

响应点击
```

---

### 5.4.5 验收标准

实现：

```text
显示完整目录结构
```

即可。

---

## 5.5 Sprint3：文件列表模块

### 5.5.1 模块目标

实现：

```text
目录对应文件列表
```

---

### 5.5.2 功能要求

支持：

```text
文件名

更新时间

标签

来源
```

展示。

---

### 5.5.3 后端接口

设计：

```text
/api/v1/files
```

---

参数：

```text
folder

keyword
```

---

### 5.5.4 前端组件

创建：

```text
FileList.vue
```

---

### 5.5.5 验收标准

点击目录：

```text
文件列表更新
```

---

## 5.6 Sprint4：Markdown预览

### 5.6.1 模块目标

实现：

```text
Markdown阅读
```

---

### 5.6.2 功能要求

支持：

```text
标题

表格

代码块

引用

图片
```

---

### 5.6.3 推荐库

```bash
npm install markdown-it
```

---

### 5.6.4 组件

创建：

```text
MarkdownRenderer.vue
```

---

### 5.6.5 验收标准

点击文件：

```text
显示Markdown内容
```

---

## 5.7 Sprint5：快速录入

### 5.7.1 模块目标

实现：

```text
30秒录入知识
```

---

### 5.7.2 支持类型

```text
飞书

腾讯文档

网页

本地文件
```

---

### 5.7.3 表单字段

```text
标题

来源

链接

项目

标签

摘要
```

---

### 5.7.4 保存结果

自动生成：

```md
---
title:
tags:
source:
---

摘要内容
```

---

### 5.7.5 验收标准

录入成功：

```text
自动生成索引文件
```

---

## 5.8 Sprint6：全文搜索

### 5.8.1 模块目标

实现：

```text
搜索能力
```

---

### 5.8.2 搜索范围

支持：

```text
文件名

正文

标签
```

---

### 5.8.3 接口

```text
/api/v1/search
```

---

### 5.8.4 前端功能

顶部：

```text
搜索框
```

---

### 5.8.5 验收标准

输入关键词：

```text
返回匹配结果
```

---

## 5.9 Sprint7：AI问答

### 5.9.1 模块目标

实现：

```text
基于知识库问答
```

---

### 5.9.2 依赖

必须完成：

```text
搜索

Embedding

Chunk
```

---

### 5.9.3 接口

```text
/api/v1/chat
```

---

### 5.9.4 返回内容

```text
回答

引用来源
```

---

### 5.9.5 验收标准

提问：

```text
古晶光电项目痛点是什么？
```

AI能够：

```text
回答

并引用来源
```

---

## 5.10 Sprint8：Embedding缓存

### 5.10.1 模块目标

建立：

```text
向量缓存
```

---

### 5.10.2 模型

推荐：

```text
bge-m3
```

---

### 5.10.3 数据表

```text
chunks
```

---

### 5.10.4 流程

```text
文件
↓
Chunk
↓
Embedding
↓
SQLite
```

---

### 5.10.5 验收标准

新增文件：

```text
自动生成向量
```

---

## 5.11 Sprint9：测试与部署

### 5.11.1 功能测试

验证：

```text
目录树

文件列表

Markdown

搜索

AI问答
```

---

### 5.11.2 部署测试

验证：

```text
前端启动

后端启动

Ollama启动
```

---

### 5.11.3 文档整理

更新：

```text
README

开发手册

部署手册
```

---

### 5.11.4 Git发布

创建：

```text
v1.0.0
```

版本。

---

## 5.12 Phase1目录结构

### 前端

```text
frontend
│
├─ layouts
│
├─ pages
│
├─ components
│
├─ api
│
├─ stores
│
└─ utils
```

---

### 后端

```text
backend
│
├─ routers
│
├─ services
│
├─ models
│
├─ schemas
│
└─ utils
```

---

### 文档

```text
docs
│
├─ PRD
├─ 架构
├─ 技术方案
├─ DB设计
├─ API设计
└─ 开发计划
```

---

## 5.13 Phase1完成标准

达到：

### 功能

```text
目录浏览

文件浏览

Markdown预览

快速录入

全文搜索

AI问答
```

---

### 技术

```text
Vue3

FastAPI

SQLite

Ollama
```

---

### 工程化

```text
Git

GitHub

Cursor Rules

开发文档
```

---

### 可演示

能够向其他人展示：

```text
KnowledgeBase V1
```

完整流程。

---

# 本章小结

本章完成：

```text
Phase1目标定义

Sprint拆分

前端规划

后端规划

AI模块规划

部署规划
```

开发者应明确：

```text
先做什么

后做什么

如何验收

何时进入下一阶段
```

下一章进入：

```text
第6章 系统部署
```

介绍：

```text
本地部署

Docker部署

Ollama部署

项目发布
```
