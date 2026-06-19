# 04 架构设计

## 1. 模块划分
- ui 层：笔记列表、编辑器、预览区（DOM 渲染与事件）
- store 层：localStorage 读写、笔记数据结构序列化
- render 层：Markdown → HTML 转换（Phase1 仅极简子集：标题 / 列表 / 段落 / 代码块）

## 2. 数据流
用户输入 → ui 层捕获 → render 层渲染预览 → store 层自动写 localStorage

## 3. 技术选型理由
- 原生 JS：单页 + 零依赖要求（ai/project-rules.md §2），框架属 Phase1 禁止项
- localStorage：满足 REQ-3/6 的本地持久化，浏览器原生、无需后端
- 自实现极简 Markdown 子集：避免引入 marked 等依赖（§2 禁止 npm）
