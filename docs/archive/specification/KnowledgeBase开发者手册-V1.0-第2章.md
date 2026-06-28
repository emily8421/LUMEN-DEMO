# 第2章 开发环境准备

## 2.1 开发环境目标

### 2.1.1 为什么要准备开发环境

很多初学者学习编程时，容易把注意力全部放在代码上。

实际上，对于现代 AI Coding 开发来说：

```text
开发环境
=
生产工具
```

如果环境没有搭建好：

* AI 无法读取项目
* Git 无法保存版本
* GitHub 无法同步
* 前端无法运行
* 后端无法启动
* AI 模型无法调用

最终会导致：

```text
代码没写多少
环境问题解决一整天
```

因此在正式开发 KnowledgeBase 之前，需要先建立完整的开发环境。

---

### 2.1.2 本项目开发环境组成

KnowledgeBase Phase 1 推荐环境如下：

```text
Windows
│
├─ Cursor
├─ Git
├─ GitHub
├─ GitHub Desktop
├─ Python
├─ Node.js
├─ Ollama
└─ Docker Desktop
```

各组件职责：

| 软件             | 职责       |
| -------------- | -------- |
| Cursor         | AI开发IDE  |
| Git            | 本地版本管理   |
| GitHub         | 云端代码仓库   |
| GitHub Desktop | Git图形化工具 |
| Python         | 后端运行环境   |
| Node.js        | 前端运行环境   |
| Ollama         | 本地大模型    |
| Docker Desktop | 容器环境     |

---

### 2.1.3 学习顺序

推荐学习顺序：

```text
Cursor
↓
Git
↓
GitHub
↓
GitHub Desktop
↓
Python
↓
Node.js
↓
Ollama
↓
Docker
```

不要：

```text
同时学习所有工具
```

容易产生混乱。

---

## 2.2 软件工具清单

### Cursor

作用：

```text
AI编程
```

用于：

* 阅读文档
* 分析项目
* 生成代码
* 修改代码
* 解释错误

---

### Git

作用：

```text
版本管理
```

用于：

* 保存历史版本
* 回滚错误修改
* 分支开发

---

### GitHub

作用：

```text
云端代码仓库
```

用于：

* 云端备份
* 多设备同步
* 协作开发

---

### GitHub Desktop

作用：

```text
Git图形化工具
```

适合初学者。

降低 Git 学习门槛。

---

### Python

作用：

```text
后端开发
```

KnowledgeBase 后端：

```text
FastAPI
```

依赖 Python。

---

### Node.js

作用：

```text
前端开发
```

KnowledgeBase 前端：

```text
Vue3
```

依赖 Node.js。

---

### Ollama

作用：

```text
本地AI模型运行平台
```

用于：

* AI问答
* Embedding生成
* RAG能力

---

### Docker Desktop

作用：

```text
容器部署
```

用于：

* PlantUML
* PostgreSQL
* Qdrant
* Docker Compose

---

## 2.3 Cursor介绍与使用定位

### Cursor是什么

Cursor 是目前最流行的 AI 编程工具之一。

本质：

```text
VS Code
+
AI Agent
```

---

### Cursor在项目中的作用

传统开发：

```text
需求
↓
程序员
↓
代码
```

AI开发：

```text
需求文档
↓
Cursor
↓
设计方案
↓
代码
```

---

### Cursor工作模式

#### Chat模式

适合：

* 问问题
* 设计方案
* 分析代码

例如：

```text
请分析项目架构
```

---

#### Agent模式

适合：

* 创建文件
* 修改代码
* 实现功能

例如：

```text
实现目录树模块
```

---

### Cursor在KnowledgeBase中的定位

```text
开发工作台
```

而不是：

```text
代码编辑器
```

---

## 2.4 Git基础

### Git是什么

Git 是：

```text
版本管理系统
```

可以理解为：

```text
代码时光机
```

---

### 为什么必须学习Git

假设：

```text
版本1
正常运行
```

---

让AI修改：

```text
增加搜索功能
```

---

结果：

```text
项目崩溃
```

---

没有Git：

```text
重新写
```

---

有Git：

```text
恢复到昨天
```

---

### Git核心概念

#### Repository

仓库

一个项目对应一个仓库。

---

#### Commit

提交

一次保存记录。

---

#### Branch

分支

独立开发线路。

---

#### Remote

远程仓库

例如：

```text
GitHub
```

---

### 当前阶段掌握内容

先掌握：

```bash
git init

git status

git add .

git commit

git push
```

即可。

---

## 2.5 GitHub基础

### GitHub是什么

GitHub 是：

```text
代码托管平台
```

可以理解为：

```text
代码网盘
```

---

### Git与GitHub区别

```text
Git
=
版本管理工具

GitHub
=
代码托管网站
```

---

### GitHub作用

#### 云端备份

电脑损坏：

```text
重新克隆项目
```

即可恢复。

---

#### 多设备同步

例如：

```text
公司电脑
↓
GitHub
↓
家里电脑
```

---

#### 团队协作

支持：

* Pull Request
* Code Review
* Issue

---

### 仓库类型

建议：

```text
Private
```

不要公开。

---

## 2.6 GitHub Desktop

### 为什么推荐

对于初学者：

```text
命令行
↓
学习成本高
```

---

GitHub Desktop：

```text
图形界面
```

更加直观。

---

### 常见操作

#### 查看修改

Changes

---

#### 提交

Commit

---

#### 上传

Push

---

#### 下载

Pull

---

### 推荐方式

当前阶段：

```text
Git命令
+
GitHub Desktop
```

结合使用。

---

## 2.7 Python环境

### Python作用

KnowledgeBase 后端：

```text
FastAPI
```

依赖 Python。

---

### 验证安装

终端执行：

```bash
python --version
```

例如：

```text
Python 3.12.4
```

---

### 虚拟环境

推荐：

```bash
python -m venv .venv
```

作用：

```text
隔离依赖
```

---

### 常见依赖

```text
fastapi

uvicorn

pydantic

sqlalchemy
```

---

## 2.8 Node.js环境

### Node.js作用

KnowledgeBase 前端：

```text
Vue3
```

依赖 Node.js。

---

### 验证安装

执行：

```bash
node -v

npm -v
```

---

### npm作用

Node包管理工具。

用于：

```bash
npm install
```

安装依赖。

---

### Vite作用

前端脚手架。

用于：

```bash
npm create vite@latest
```

创建项目。

---

## 2.9 Ollama环境

### Ollama是什么

本地运行大模型的平台。

---

### 项目中的作用

#### LLM

例如：

```text
qwen3:8b
```

负责：

```text
AI问答
```

---

#### Embedding

例如：

```text
bge-m3
```

负责：

```text
向量生成
```

---

### 验证安装

执行：

```bash
ollama list
```

查看模型列表。

---

### 默认端口

```text
11434
```

---

## 2.10 Docker环境

### Docker是什么

容器运行平台。

---

### 为什么需要

避免：

```text
我的电脑能运行
你的电脑不能运行
```

---

### KnowledgeBase中的用途

#### PlantUML

图表渲染。

---

#### PostgreSQL

Phase3使用。

---

#### Qdrant

Phase3使用。

---

### 当前阶段要求

Phase1：

```text
了解即可
```

不要求立即掌握。

---

# 本章小结

本章主要介绍了：

* 开发环境目标
* Cursor
* Git
* GitHub
* GitHub Desktop
* Python
* Node.js
* Ollama
* Docker

阅读完本章后，开发者应理解：

```text
每个工具是什么

每个工具解决什么问题

工具之间如何协同工作

KnowledgeBase为什么选择这些工具
```

下一章将进入：

```text
第3章 项目初始化
```

包括：

* 创建项目目录
* 初始化Git仓库
* 创建.gitignore
* 第一次Commit
* 发布GitHub
* Cursor Rules
* AI开发链路验证
