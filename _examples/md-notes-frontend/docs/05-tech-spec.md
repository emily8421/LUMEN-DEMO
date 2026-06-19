# 05 技术方案

## 1. 技术栈与版本
- HTML5 / CSS3 / JavaScript ES6+（浏览器原生）
- 存储：localStorage API（键名 `mn.notes`）

## 2. 关键技术决策
- 笔记数据结构：`[{ id, title, body, updatedAt }]`，整体序列化为 JSON 存入单键 `mn.notes`
- 自动保存：编辑区 `input` 事件防抖（约 500ms）后写存储
- Markdown 渲染：正则替换极简子集（`#` / `-` / 代码块 / 段落），不引第三方库

## 3. Phase 技术约束
与 ai/project-rules.md §1、§2 一致：允许原生 JS + localStorage；禁止框架、构建工具、后端、npm 依赖。

## 4. 编码约定
详见 ai/project-rules.md §5，本文不重复。
