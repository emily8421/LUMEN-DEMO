# 第7章 常见问题处理

## 7.1 本章说明

### 7.1.1 为什么需要问题处理章节

对于初学者来说：

最大的困难通常不是：

```text
不会开发
```

而是：

```text
不知道问题出在哪里
```

例如：

```text
Git提交失败

GitHub同步失败

Cursor无法读取文档

Vue启动失败

FastAPI启动失败

Ollama无法连接
```

---

这些问题：

```text
99%
都有人遇到过
```

---

因此：

```text
先学会排查问题
```

比：

```text
学习更多技术
```

更重要。

---

### 7.1.2 排查原则

遵循：

```text
现象
↓
原因
↓
解决方案
```

---

不要：

```text
看到报错
↓
乱改代码
```

---

## 7.2 Git问题

### 问题1：Author identity unknown

#### 现象

执行：

```bash
git commit
```

出现：

```text
Author identity unknown
```

---

#### 原因

Git不知道：

```text
谁提交代码
```

---

#### 解决

执行：

```bash
git config --global user.name "你的名字"

git config --global user.email "你的邮箱"
```

---

验证：

```bash
git config --global --list
```

---

### 问题2：LF will be replaced by CRLF

#### 现象

执行：

```bash
git add .
```

出现：

```text
LF will be replaced by CRLF
```

---

#### 原因

Windows：

```text
CRLF
```

Linux：

```text
LF
```

---

换行符不同。

---

#### 解决

一般：

```text
忽略即可
```

---

不是错误。

---

### 问题3：提交后发现代码错了

#### 现象

AI改坏代码。

---

#### 解决方案1

未提交：

```bash
git restore .
```

恢复。

---

#### 解决方案2

已提交：

```bash
git revert
```

回滚。

---

### 问题4：改到一半切任务

#### 解决

使用：

```bash
git stash
```

暂存。

---

恢复：

```bash
git stash pop
```

---

## 7.3 GitHub问题

### 问题1：Push失败

#### 现象

执行：

```bash
git push
```

失败。

---

#### 检查项

检查：

```text
网络

GitHub登录状态

仓库权限
```

---

### 问题2：GitHub Desktop找不到仓库

#### 原因

项目未导入。

---

#### 解决

选择：

```text
Add Local Repository
```

---

选择项目目录。

---

### 问题3：发布后GitHub为空

#### 原因

没有Push成功。

---

#### 解决

查看：

```text
History
```

确认：

```text
Commit存在
```

---

然后：

```text
Push Origin
```

---

### 问题4：误删仓库

#### 解决

如果本地还在：

```text
重新发布
```

即可。

---

## 7.4 Cursor问题

### 问题1：Cursor无法读取项目文档

#### 现象

AI不知道：

```text
PRD内容
```

---

#### 原因

打开了：

```text
docs
```

目录。

而不是：

```text
项目根目录
```

---

#### 正确方式

打开：

```text
KnowledgeBase_Demo
```

---

### 问题2：Rules不生效

#### 检查

目录是否正确：

```text
.cursor
└─ rules
   └─ project-rules.mdc
```

---

### 问题3：AI乱生成技术栈

例如：

```text
PostgreSQL

Qdrant

Redis
```

---

而项目要求：

```text
SQLite
```

---

#### 原因

Rules约束不足。

---

#### 解决

补充：

```text
仅允许：

SQLite

禁止：

PostgreSQL
Qdrant
Redis
```

---

### 问题4：AI一次修改几十个文件

#### 原因

Prompt过大。

---

例如：

```text
实现整个系统
```

---

#### 推荐

拆分：

```text
实现目录树

实现文件列表

实现搜索
```

---

## 7.5 Vue问题

### 问题1：npm run dev失败

#### 检查

执行：

```bash
node -v

npm -v
```

---

如果失败：

说明：

```text
Node.js未安装
```

---

### 问题2：node_modules缺失

#### 现象

启动失败。

---

#### 解决

执行：

```bash
npm install
```

---

重新安装依赖。

---

### 问题3：5173端口被占用

#### 解决

关闭占用程序。

---

或者：

```bash
npm run dev -- --port 5174
```

---

更换端口。

---

### 问题4：页面空白

#### 检查

浏览器：

```text
F12
```

查看：

```text
Console
```

错误。

---

## 7.6 FastAPI问题

### 问题1：uvicorn找不到

#### 现象

执行：

```bash
uvicorn
```

失败。

---

#### 原因

未安装。

---

#### 解决

执行：

```bash
pip install uvicorn
```

---

### 问题2：8000端口被占用

#### 解决

修改：

```bash
uvicorn app.main:app --port 8001
```

---

### 问题3：访问/docs失败

#### 检查

确认：

```text
main.py
```

是否正常。

---

确认：

```text
FastAPI已启动
```

---

### 问题4：接口404

#### 原因

路由未注册。

---

#### 检查

```python
app.include_router(...)
```

---

## 7.7 SQLite问题

### 问题1：数据库文件找不到

#### 检查

确认：

```text
db路径
```

正确。

---

### 问题2：数据库损坏

#### 原因

异常关闭。

---

#### 解决

恢复备份。

---

### 问题3：查询慢

#### 原因

缺少索引。

---

#### 解决

增加：

```sql
CREATE INDEX
```

---

## 7.8 Ollama问题

### 问题1：ollama命令不存在

#### 原因

未安装。

---

#### 解决

重新安装。

---

### 问题2：模型不存在

#### 现象

调用：

```text
qwen3
```

失败。

---

#### 解决

执行：

```bash
ollama pull qwen3
```

---

### 问题3：无法连接11434

#### 检查

执行：

```bash
ollama list
```

---

如果失败：

说明：

```text
Ollama未启动
```

---

### 问题4：回答很慢

#### 原因

模型过大。

---

#### 解决

换：

```text
7B

8B
```

模型。

---

## 7.9 Docker问题

### 问题1：Docker启动失败

#### 检查

确认：

```text
虚拟化已开启
```

---

### 问题2：容器无法访问

#### 检查

执行：

```bash
docker ps
```

---

查看：

```text
容器是否运行
```

---

### 问题3：端口冲突

例如：

```text
8888
```

已占用。

---

修改映射：

```bash
-p 8889:8080
```

---

## 7.10 AI开发问题

### 问题1：AI生成代码无法运行

#### 原因

上下文不足。

---

#### 解决

补充：

```text
PRD

架构

技术方案
```

---

### 问题2：AI生成内容越来越混乱

#### 原因

长期对话污染。

---

#### 解决

新开Chat。

---

重新加载：

```text
docs
```

文档。

---

### 问题3：AI不按要求实现

#### 原因

Prompt不清晰。

---

#### 解决

增加：

```text
背景

目标

约束

输出要求
```

---

### 问题4：AI忘记项目规则

#### 检查

```text
project-rules.mdc
```

是否存在。

---

## 7.11 问题排查流程

推荐流程：

```text
发现问题
↓
查看报错
↓
定位模块
↓
分析原因
↓
最小修改
↓
验证结果
↓
Git提交
```

---

不要：

```text
看到错误
↓
疯狂修改
```

---

## 7.12 求助原则

### 优先级1

查看：

```text
错误提示
```

---

### 优先级2

询问：

```text
Cursor
```

---

### 优先级3

搜索：

```text
GitHub

Google

官方文档
```

---

### 优先级4

向他人求助。

---

## 7.13 初学者最容易踩的坑

### Git

```text
忘记Commit
```

---

### GitHub

```text
忘记Push
```

---

### Cursor

```text
直接Accept All
```

---

### Vue

```text
忘记npm install
```

---

### Python

```text
没激活虚拟环境
```

---

### Ollama

```text
模型没下载
```

---

### AI开发

```text
一次实现整个项目
```

---

# 本章小结

本章总结了：

```text
Git问题

GitHub问题

Cursor问题

Vue问题

FastAPI问题

SQLite问题

Ollama问题

Docker问题

AI开发问题
```

掌握本章后：

开发者应具备：

```text
独立排查问题

独立定位问题

独立解决问题
```

的基础能力。

---

# 全书总结

完成《KnowledgeBase开发者手册 V1.0》后：

开发者已经掌握：

```text
项目背景

开发环境

项目初始化

AI开发流程

Phase1实施

系统部署

问题处理
```

具备：

```text
Cursor
+
Git
+
GitHub
+
Vue3
+
FastAPI
+
Ollama
```

开发 KnowledgeBase Phase1 的完整基础能力。

下一阶段建议：

```text
开始Sprint1开发

项目骨架搭建
```

正式进入：

```text
KnowledgeBase V1
开发阶段
```
