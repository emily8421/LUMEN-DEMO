# 附录A Git操作手册

## A.1 Git能力等级

### L1 保存代码

掌握：

```bash
git add .

git commit -m "说明"
```

作用：

```text
保存版本
```

---

### L2 分支开发

掌握：

```bash
git branch

git switch

git merge
```

作用：

```text
功能开发隔离
```

---

### L3 GitHub协作

掌握：

```text
Pull Request

Code Review

Merge
```

---

### L4 恢复能力

掌握：

```bash
git restore

git reset

git revert

git stash
```

作用：

```text
救命技能
```

---

## A.2 常用命令

### 查看状态

```bash
git status
```

---

### 添加文件

```bash
git add .
```

---

### 提交

```bash
git commit -m "说明"
```

---

### 查看历史

```bash
git log --oneline
```

---

### 推送

```bash
git push
```

---

### 拉取

```bash
git pull
```

---

## A.3 AI开发推荐提交规范

推荐：

```text
项目初始化

完成目录树模块

完成文件列表模块

完成Markdown预览

完成搜索模块

完成AI问答模块
```

避免：

```text
修改

update

test
```

---

# 附录B GitHub操作手册

## B.1 GitHub是什么

Git：

```text
本地仓库
```

GitHub：

```text
云端仓库
```

---

## B.2 推荐仓库设置

仓库：

```text
Private
```

---

原因：

项目中可能包含：

```text
需求文档

业务资料

AI Prompt
```

---

## B.3 GitHub Desktop流程

```text
修改代码
↓
Commit
↓
Push
↓
GitHub
```

---

## B.4 推荐频率

每天：

```text
至少Push一次
```

---

# 附录C Cursor操作手册

## C.1 Cursor核心能力

### Chat

用于：

```text
问问题

分析代码

设计方案
```

---

### Agent

用于：

```text
修改代码

创建文件

实现功能
```

---

## C.2 常用快捷键

打开AI：

```text
Ctrl + L
```

---

打开终端：

```text
Ctrl + `
```

---

## C.3 推荐Prompt

### 分析项目

```text
请分析当前项目结构
```

---

### 设计数据库

```text
请根据PRD设计数据库
```

---

### 设计API

```text
请生成API设计文档
```

---

### 实现功能

```text
请实现目录树模块
```

---

## C.4 禁止行为

不要：

```text
实现整个系统
```

---

推荐：

```text
实现一个模块
```

---

# 附录D Ollama操作手册

## D.1 查看模型

```bash
ollama list
```

---

## D.2 下载模型

例如：

```bash
ollama pull qwen3
```

---

下载Embedding：

```bash
ollama pull bge-m3
```

---

## D.3 运行模型

```bash
ollama run qwen3
```

---

## D.4 推荐模型

### 对话模型

```text
qwen3:8b
```

---

### Embedding模型

```text
bge-m3
```

---

## D.5 默认端口

```text
11434
```

---

# 附录E KnowledgeBase开发规范

## E.1 文档优先原则

开发顺序：

```text
PRD
↓
架构设计
↓
技术方案
↓
代码
```

---

禁止：

```text
先写代码
后补文档
```

---

## E.2 Phase边界原则

Phase1：

允许：

```text
Markdown

搜索

AI问答

SQLite
```

---

禁止：

```text
权限系统

多用户

PostgreSQL

Qdrant
```

---

## E.3 Git规范

完成一个功能：

```text
至少一次Commit
```

---

推荐：

```text
一天至少一次Push
```

---

## E.4 AI开发规范

AI生成代码前：

必须：

```text
先说明方案
```

---

AI修改代码后：

必须：

```text
人工审核
```

---

禁止：

```text
Accept All
```

---

## E.5 项目目录规范

```text
KnowledgeBase_Demo
│
├─ docs
│
├─ frontend
│
├─ backend
│
├─ docker
│
├─ tests
│
├─ scripts
│
└─ .cursor
```

---

## E.6 文档命名规范

推荐：

```text
kb-prd-v4.md

kb-architecture.md

kb-tech-spec.md

kb-db-design.md

kb-api-spec.md

kb-dev-plan.md
```

---

## E.7 版本发布规范

版本格式：

```text
v1.0.0
```

含义：

```text
主版本
次版本
修订版本
```

例如：

```text
v1.0.0

v1.1.0

v1.1.1
```

---

# 附录F KnowledgeBase学习路线图

## 第1阶段

工具准备：

```text
Cursor

Git

GitHub
```

---

## 第2阶段

前后端：

```text
Vue3

FastAPI
```

---

## 第3阶段

知识库：

```text
Markdown

搜索

SQLite
```

---

## 第4阶段

AI能力：

```text
Ollama

Embedding

RAG
```

---

## 第5阶段

工程化：

```text
Docker

部署

发布
```

---

# V1.0结束语

完成本手册后，开发者已经掌握：

```text
项目规划

环境搭建

项目初始化

AI开发工作流

Phase1开发

系统部署

问题处理

开发规范
```

具备独立完成：

```text
KnowledgeBase V1
```

开发的基础能力。

下一阶段目标：

```text
完成Sprint1

项目骨架搭建
```

正式进入：

```text
KnowledgeBase开发阶段
```
