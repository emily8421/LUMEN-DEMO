# 03 PRD

> 覆盖 02-srs 全部 REQ-1~6，不新增 00-02 未提及的功能。

## 1. 功能范围（Phase1）
- 笔记 CRUD：创建 / 列出 / 编辑 / 删除 —— 对应 REQ-1/4/5
- Markdown 编辑 + 实时预览 —— 对应 REQ-2
- 自动持久化到 localStorage，刷新与重开保留 —— 对应 REQ-3/6

## 2. Phase 边界
与 ai/project-rules.md §1 一致：仅单页纯前端 + localStorage；不做登录、云同步、分类、导出（均 Phase2）。

## 3. 不做的事（Phase1 明确排除）
- 用户系统 / 多端同步
- 富文本编辑器框架
- 后端 API / 远程存储
