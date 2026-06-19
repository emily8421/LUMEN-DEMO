# 项目专属规则

> 本文件每个新项目都需要重新填写，不参与跨项目同步。
> 判断标准：一条规则换到另一个完全不同的项目上是否还成立——
> 不成立（涉及具体技术栈/具体功能/具体Phase定义）就属于本文件。
>
> 填写时机：§1 Phase边界、§2 技术栈、§3 项目形态与文档裁剪在生成 docs/03-08 **之前**填
> （作为约束）；§4 目录特例、§5 编码约定与禁区在审核 03-08 **之后**补。

## 0. 项目标识
项目名称：MdNotes
代号/缩写：mn

## 1. Phase边界
当前阶段：Phase1

允许：
- 原生 HTML/CSS/JavaScript（ES6+）单页应用
- 浏览器 localStorage 存储笔记
- Markdown 文本编辑与预览

禁止：
- 前端框架（React / Vue / Svelte 等）
- 构建工具 / npm 依赖
- 后端服务 / HTTP API / 数据库
- 多用户、登录、云同步

下一阶段预告：
- Phase2：笔记分类、导出、IndexedDB 大容量存储

## 2. 技术栈约束
- 确定：原生 HTML5 / CSS3 / JavaScript ES6+ / 浏览器 localStorage API
- 禁止引入：任何 npm 包、任何前端框架、任何构建工具、任何后端

## 3. 项目形态与文档裁剪
- 是否有持久化存储：无（注：localStorage 属浏览器端键值缓存，非数据库，不在 docs/06 建模；其数据结构在 docs/05-tech-spec.md 说明）
- 是否有对外接口：无
- docs/06-db-design.md：省略
- docs/07-api-spec.md：省略
- 需要保留的代码目录：frontend/ tests/

## 4. 目录规范的项目特例
无后端、无数据库，故无 backend/ docker/ scripts/ 目录；仅 frontend/ + tests/。
与 global-rules 通用目录标准一致（该骨架本就标注“按项目技术栈创建，不必全有”）。

## 5. 编码约定与禁区

> Phase 级功能禁止见 §1，技术栈替代品禁止见 §2，本节只管代码层。

### 5.1 既有约定（新代码必须向其看齐）
- 命名：JS 函数 / 变量 camelCase；CSS 类名 kebab-case；常量 UPPER_SNAKE_CASE
- 分层：store.js 只管读写 localStorage；render.js 只管 Markdown → HTML；app.js 编排事件与渲染
- 既有模式：localStorage 读写统一经 store.js，UI 层不直接碰 localStorage
- 错误处理：localStorage 不可用或 JSON 解析失败时回退空列表，并在控制台告警

### 5.2 禁区（未经人工确认不得触碰）
- 不得引入任何框架 / npm 包 / CDN 脚本
- 不得新增后端、HTTP 请求、外部存储
- 不得在 store.js 之外直接读写 localStorage
