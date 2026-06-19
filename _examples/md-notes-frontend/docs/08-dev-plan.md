# 08 开发计划

## Sprint-1：笔记存储骨架

### 目标
实现 store 层 + 最小 UI，能新建、列出、自动保存、刷新后保留（REQ-1/3/4/6）。

### 输入文档
docs/03-prd §1、docs/04-architecture §1/§2、docs/05-tech-spec §1/§2

### 修改范围
- frontend/index.html（页面骨架：列表 + 编辑器）
- frontend/store.js（localStorage 读写）
- frontend/app.js（事件绑定、自动保存、渲染列表）

### 验收标准
- 新建笔记后列表出现；编辑后刷新页面内容保留
- localStorage 键 `mn.notes` 含合法 JSON

### 禁止事项
- 不引入任何 npm 依赖或框架
- 不实现 Markdown 预览（留到 Sprint-2）

## Sprint-2：Markdown 预览

### 目标
实现 render 层，编辑区实时预览（REQ-2）。

### 输入文档
docs/05-tech-spec §2（Markdown 子集）

### 修改范围
- frontend/render.js（新增）
- frontend/app.js（接入预览）

### 验收标准
- 输入 `# x` 预览为 h1；输入 `- a` 预览为列表项
- 不引入第三方 Markdown 库

### 禁止事项
- 不改 store 层存储结构
