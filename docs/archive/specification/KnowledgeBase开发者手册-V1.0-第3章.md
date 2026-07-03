# 第3章 项目初始化

## 3.1 项目初始化目标

### 3.1.1 为什么要做项目初始化

很多初学者认为：

```text
创建前端项目
↓
开始写代码
```

就是项目开始。

实际上：

```text
项目初始化
=
建立开发规范
+
建立版本管理
+
建立AI开发环境
```

如果初始化阶段没有做好：

后续可能出现：

* AI生成代码找不到依据
* 项目结构混乱
* Git无法管理
* 代码无法回滚
* 文档与代码脱节

因此：

```text
项目初始化
是整个项目最重要的阶段之一
```

---

### 3.1.2 本章目标

完成后应具备：

```text
KnowledgeBase_Demo
│
├─ 已建立项目目录
├─ 已建立Git仓库
├─ 已连接GitHub
├─ 已导入设计文档
├─ 已建立Cursor Rules
└─ 已验证AI理解项目
```

---

## 3.2 创建项目目录

### 3.2.1 项目目录位置

建议：

```text
D:\2-Project\0-Product\KnowledgeBase_Demo
```

当然也可以根据个人习惯调整。

核心原则：

```text
项目目录固定
便于管理
```

---

### 3.2.2 推荐目录结构

初始化阶段：

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
├─ scripts
│
├─ tests
│
├─ .cursor
│
├─ .gitignore
│
└─ README.md
```

---

### 3.2.3 目录说明

#### docs

项目文档。

用于存放：

```text
PRD
架构设计
技术方案
数据库设计
API设计
开发计划
```

---

#### frontend

前端代码。

未来：

```text
Vue3
TypeScript
Element Plus
```

全部放在这里。

---

#### backend

后端代码。

未来：

```text
FastAPI
Python
```

放在这里。

---

#### docker

部署文件。

例如：

```text
Dockerfile
docker-compose.yml
```

---

#### scripts

辅助脚本。

例如：

```text
初始化脚本
数据导入脚本
备份脚本
```

---

#### tests

测试代码。

---

#### .cursor

Cursor配置目录。

---

## 3.3 初始化Git仓库

### 3.3.1 什么是Git仓库

当执行：

```bash
git init
```

时。

Git会创建：

```text
.git
```

目录。

此时：

```text
普通目录
↓
Git仓库
```

完成转换。

---

### 3.3.2 执行初始化

打开 Cursor。

打开项目目录：

```text
KnowledgeBase_Demo
```

---

打开终端：

```text
Terminal
→ New Terminal
```

---

执行：

```bash
git init
```

---

成功后显示：

```text
Initialized empty Git repository
```

---

### 3.3.3 验证结果

执行：

```bash
git status
```

出现：

```text
On branch master

No commits yet
```

说明成功。

---

## 3.4 配置Git身份

### 3.4.1 为什么需要配置

Git需要记录：

```text
谁提交的代码
```

因此需要：

```text
姓名
邮箱
```

---

### 3.4.2 配置方法

执行：

```bash
git config --global user.name "你的名字"

git config --global user.email "你的邮箱"
```

例如：

```bash
git config --global user.name "Emily"

git config --global user.email "xxx@gmail.com"
```

---

### 3.4.3 查看配置

执行：

```bash
git config --global --list
```

例如：

```text
user.name=Emily
user.email=xxx@gmail.com
```

---

### 3.4.4 常见问题

如果出现：

```text
Author identity unknown
```

说明未配置身份。

重新执行上述命令即可。

---

## 3.5 创建README文档

### 3.5.1 README作用

README 是项目首页。

未来：

GitHub打开仓库时：

首先看到：

```text
README.md
```

---

### 3.5.2 推荐内容

```md
# KnowledgeBase

个人知识管理系统

## 项目目标

- Markdown管理
- 全文搜索
- AI问答

## 技术栈

前端：
Vue3

后端：
FastAPI

数据库：
SQLite

AI：
Ollama
```

---

### 3.5.3 编写原则

简洁即可。

不要一开始写太多内容。

后续持续更新。

---

## 3.6 创建.gitignore文件

### 3.6.1 什么是.gitignore

作用：

```text
告诉Git：

哪些文件不要管理
```

---

### 3.6.2 为什么需要

例如：

```text
node_modules
```

可能几十万文件。

没有必要上传。

---

例如：

```text
.env
```

里面可能有：

```text
API Key
密码
```

更不能上传。

---

### 3.6.3 推荐内容

```gitignore
# Python
__pycache__/
*.pyc
.venv/

# Node
node_modules/

# IDE
.vscode/
.idea/

# Environment
.env

# Database
*.db
*.sqlite
*.sqlite3

# Logs
*.log

# Build
dist/
build/
```

---

### 3.6.4 验证方法

执行：

```bash
git status
```

被忽略文件不会显示。

---

## 3.7 第一次Commit

### 3.7.1 为什么要Commit

Commit相当于：

```text
存档
```

---

例如：

```text
项目初始化
↓
Commit

完成目录树
↓
Commit

完成搜索
↓
Commit
```

---

### 3.7.2 添加文件

执行：

```bash
git add .
```

含义：

```text
把当前项目加入Git管理
```

---

### 3.7.3 创建提交

执行：

```bash
git commit -m "项目初始化"
```

---

成功显示：

```text
[master (root-commit)]
项目初始化
```

---

### 3.7.4 查看历史

执行：

```bash
git log --oneline
```

例如：

```text
4f3350d 项目初始化
```

---

## 3.8 发布到GitHub

### 3.8.1 为什么发布

作用：

```text
云端备份
```

---

### 3.8.2 创建GitHub仓库

建议：

```text
knowledge-base
```

或：

```text
KnowledgeBase_Demo
```

---

仓库类型：

```text
Private
```

---

### 3.8.3 使用GitHub Desktop发布

打开：

```text
GitHub Desktop
```

---

选择：

```text
Publish Repository
```

---

发布成功后：

```text
本地Git
↓
GitHub
```

建立连接。

---

### 3.8.4 验证

打开GitHub。

看到仓库即可。

---

## 3.9 创建Cursor Rules

### 3.9.1 为什么需要Rules

没有Rules：

AI可能：

```text
想到什么写什么
```

---

有Rules：

AI遵守：

```text
技术栈
开发规范
功能边界
```

---

### 3.9.2 创建目录

项目根目录：

```text
.cursor
└─ rules
```

---

创建：

```text
project-rules.mdc
```

---

最终：

```text
.cursor
└─ rules
    └─ project-rules.mdc
```

---

### 3.9.3 推荐规则

包含：

```text
项目目标

技术架构

开发原则

文档来源

编码规范

接口规范
```

---

### 3.9.4 当前项目规则

重点约束：

```text
只开发Phase1

不提前实现：

权限系统
PostgreSQL
Qdrant
MCP
Agent
```

---

## 3.10 导入项目设计文档

### 3.10.1 导入位置

放入：

```text
docs
```

目录。

---

### 3.10.2 当前核心文档

```text
docs
│
├─ kb-prd-v4.md
│
├─ kb-architecture.md
│
├─ kb-tech-spec.md
```

---

### 3.10.3 后续新增

```text
kb-db-design.md

kb-api-spec.md

kb-dev-plan.md
```

---

### 3.10.4 文档原则

项目开发：

```text
文档驱动
```

而不是：

```text
代码驱动
```

---

## 3.11 验证AI理解项目能力

### 3.11.1 为什么要验证

很多人：

```text
导入文档
↓
直接写代码
```

这是错误的。

---

必须先验证：

```text
Cursor是否理解项目
```

---

### 3.11.2 推荐Prompt

在Cursor Chat输入：

```text
请阅读docs目录中的全部文档。

输出：

1. 项目目标
2. 系统架构
3. 功能模块划分
4. Phase1范围
5. 数据库设计建议
6. API规划建议
```

---

### 3.11.3 验证标准

如果Cursor能够：

```text
正确理解PRD

正确理解架构

正确理解技术方案
```

说明：

```text
AI开发链路打通
```

---

### 3.11.4 发现问题及时修正

例如：

Cursor输出：

```text
PostgreSQL
Qdrant
权限系统
```

而PRD没有。

说明：

```text
Rules不完整
```

需要修正。

---

## 3.12 项目初始化完成标准

完成以下内容：

```text
✓ 项目目录

✓ Git仓库

✓ Git身份

✓ README

✓ .gitignore

✓ 第一次Commit

✓ GitHub仓库

✓ Cursor Rules

✓ PRD导入

✓ AI理解验证
```

即视为：

```text
项目初始化完成
```

---

# 本章小结

本章完成了：

```text
项目目录建立

Git仓库建立

GitHub连接

Cursor配置

项目文档导入

AI开发链路验证
```

完成本章后：

```text
项目具备：

开发能力
版本管理能力
云端备份能力
AI协作能力
```

下一章进入：

```text
第4章 AI开发工作流
```

学习如何使用：

```text
PRD
↓
Cursor
↓
数据库设计
↓
API设计
↓
代码生成
```

完成真正意义上的 AI Coding 开发流程。
