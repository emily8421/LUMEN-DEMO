# 第4章 AI开发工作流

## 4.1 为什么要建立AI开发工作流

### 4.1.1 传统开发模式

传统软件开发流程：

```text
需求
↓
设计
↓
编码
↓
测试
↓
部署
```

其中：

```text
编码
≈
70%工作量
```

---

对于专业开发者：

```text
需求
↓
程序员翻译
↓
代码
```

---

### 4.1.2 AI开发模式

AI时代：

```text
需求
↓
AI理解
↓
AI生成
↓
人工审核
↓
运行验证
```

---

变化最大的部分：

```text
写代码
↓
变成
写文档
```

---

### 4.1.3 AI开发最大的误区

很多初学者会这样使用AI：

```text
帮我做一个知识库系统
```

---

结果：

```text
生成几十个文件

无法运行

无法维护
```

---

原因：

AI不知道：

```text
项目目标

技术栈

功能边界

开发阶段
```

---

因此：

```text
AI开发
=
文档驱动开发
```

---

## 4.2 文档驱动开发

### 4.2.1 什么是文档驱动开发

传统方式：

```text
先写代码
↓
再补文档
```

---

推荐方式：

```text
先写文档
↓
再写代码
```

---

### 4.2.2 KnowledgeBase文档体系

当前项目：

```text
docs
│
├─ kb-prd-v4.md
│
├─ kb-architecture.md
│
├─ kb-tech-spec.md
│
├─ kb-db-design.md
│
├─ kb-api-spec.md
│
└─ kb-dev-plan.md
```

---

### 4.2.3 文档关系

```text
PRD
↓
架构设计
↓
技术方案
↓
数据库设计
↓
API设计
↓
开发计划
↓
代码实现
```

---

### 4.2.4 为什么AI需要文档

因为：

AI本身不知道：

```text
项目是什么
```

---

需要通过文档告诉AI：

```text
项目目标

功能范围

技术栈

开发规范
```

---

因此：

```text
文档质量
=
AI生成代码质量
```

---

## 4.3 AI开发整体流程

### 4.3.1 推荐流程

KnowledgeBase推荐流程：

```text
Step1
需求分析

↓
Step2
架构设计

↓
Step3
数据库设计

↓
Step4
API设计

↓
Step5
开发计划

↓
Step6
代码实现

↓
Step7
测试验证

↓
Step8
Git提交
```

---

### 4.3.2 每一步作用

#### Step1 需求分析

目标：

```text
明确做什么
```

输入：

```text
PRD
```

输出：

```text
功能清单
```

---

#### Step2 架构设计

目标：

```text
明确系统结构
```

输入：

```text
PRD
```

输出：

```text
系统架构图
```

---

#### Step3 数据库设计

目标：

```text
明确数据结构
```

输出：

```text
表结构
ER图
```

---

#### Step4 API设计

目标：

```text
明确接口
```

输出：

```text
API文档
```

---

#### Step5 开发计划

目标：

```text
明确开发顺序
```

输出：

```text
Sprint规划
```

---

#### Step6 代码实现

目标：

```text
生成代码
```

---

#### Step7 测试验证

目标：

```text
确认可运行
```

---

#### Step8 Git提交

目标：

```text
保存版本
```

---

## 4.4 Cursor使用规范

### 4.4.1 Cursor角色定位

Cursor不是：

```text
代码生成器
```

而是：

```text
AI开发助手
```

---

### 4.4.2 正确提问方式

不要：

```text
帮我实现整个知识库
```

---

推荐：

```text
请实现目录树模块
```

---

不要：

```text
帮我写所有API
```

---

推荐：

```text
请实现文件列表接口
```

---

### 4.4.3 推荐开发节奏

```text
一个模块
↓
一个Commit
```

例如：

```text
目录树
↓
Commit

文件列表
↓
Commit

Markdown预览
↓
Commit
```

---

### 4.4.4 AI输出审核原则

不要直接：

```text
Accept All
```

---

先检查：

```text
修改了哪些文件

是否符合PRD

是否符合技术栈
```

---

## 4.5 Prompt设计方法

### 4.5.1 Prompt是什么

Prompt：

```text
给AI的任务说明书
```

---

### 4.5.2 Prompt结构

推荐结构：

```text
背景

目标

约束

输出要求
```

---

### 4.5.3 示例

```text
背景：

KnowledgeBase项目

技术栈：

Vue3
FastAPI
SQLite

目标：

实现目录树接口

约束：

仅开发Phase1

不要使用PostgreSQL

输出要求：

1. 先说明方案

2. 再输出代码

3. 说明文件路径
```

---

### 4.5.4 为什么有效

因为AI知道：

```text
项目背景

开发边界

技术限制
```

---

## 4.6 AI生成数据库设计

### 4.6.1 推荐Prompt

```text
请阅读：

kb-prd-v4.md

kb-architecture.md

kb-tech-spec.md

生成：

kb-db-design.md

要求：

包含：

ER图

字段说明

索引设计

迁移策略
```

---

### 4.6.2 输出要求

应包含：

```text
knowledge_objects

chunks

sync_sources

document_relations
```

---

### 4.6.3 验证方法

检查：

```text
是否符合PRD

是否符合架构设计
```

---

## 4.7 AI生成API设计

### 4.7.1 推荐Prompt

```text
生成：

kb-api-spec.md

要求：

RESTful

OpenAPI风格

请求示例

响应示例
```

---

### 4.7.2 输出内容

例如：

```text
/api/v1/tree

/api/v1/files

/api/v1/chat

/api/v1/cache
```

---

### 4.7.3 验证方法

检查：

```text
是否覆盖功能模块
```

---

## 4.8 AI生成开发计划

### 4.8.1 推荐Prompt

```text
生成：

kb-dev-plan.md

要求：

Sprint划分

交付物

验收标准

风险点
```

---

### 4.8.2 推荐Sprint

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
部署测试
```

---

### 4.8.3 为什么需要Sprint

避免：

```text
一次开发整个系统
```

---

改为：

```text
逐模块完成
```

---

## 4.9 AI代码生成流程

### 4.9.1 推荐流程

```text
需求
↓
设计
↓
AI生成代码
↓
人工审核
↓
运行验证
↓
Git提交
```

---

### 4.9.2 推荐粒度

例如：

不要：

```text
实现整个前端
```

---

而是：

```text
实现DirectoryTree.vue
```

---

### 4.9.3 每次修改范围

推荐：

```text
1~3个文件
```

---

不要：

```text
一次修改50个文件
```

---

## 4.10 Git与AI开发结合

### 4.10.1 推荐提交频率

每完成：

```text
一个功能
```

提交一次。

---

例如：

```text
目录树完成
↓
Commit

文件列表完成
↓
Commit

Markdown预览完成
↓
Commit
```

---

### 4.10.2 Commit命名规范

推荐：

```text
项目初始化

完成目录树模块

完成文件列表模块

完成Markdown预览

完成AI问答模块
```

---

### 4.10.3 为什么频繁提交

因为：

```text
AI可能改坏项目
```

---

有Git：

```text
恢复
```

---

没有Git：

```text
重写
```

---

## 4.11 AI开发最佳实践

### 原则一

```text
先文档
后代码
```

---

### 原则二

```text
先设计
后实现
```

---

### 原则三

```text
小步快跑
```

---

### 原则四

```text
频繁提交
```

---

### 原则五

```text
人工审核
```

---

### 原则六

```text
不要一次实现整个系统
```

---

# 本章小结

本章介绍了：

```text
文档驱动开发

AI开发流程

Cursor使用规范

Prompt设计方法

数据库设计生成

API设计生成

开发计划生成

Git协作流程
```

掌握本章后：

开发流程将变成：

```text
PRD
↓
Cursor
↓
数据库设计
↓
API设计
↓
开发计划
↓
代码生成
↓
Git提交
```

这也是 KnowledgeBase 项目推荐的标准 AI Coding 工作流。

下一章进入：

```text
第5章 Phase1开发实施
```

开始正式进入：

```text
Vue3
+
FastAPI
+
SQLite
+
Ollama
```

的项目开发阶段。
