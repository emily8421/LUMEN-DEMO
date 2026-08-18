# DIAG-FE-COMP-01 · 前端组件树（App 装配 → Shell → Feature）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/frontend-interaction.md`（本图所在块）。阶段：详细设计；类型：组件树（前端）；追溯：REQ-011 / COMP-001 · CQ-P1-008；渲染：GitHub 原生。

```mermaid
flowchart TB
  App["App.tsx（装配根）"]
  App --> TopBar["TopBar（空间切换 / 栏开关 / 搜索入口 / 用户菜单）"]
  App --> AuthGate{"session 存在？"}
  AuthGate -- "未登录" --> AuthShell["AuthShell（登录 + 忘记密码弹窗）"]
  AuthGate -- "已登录" --> WS["WorkspaceShell（workspace-layout）"]
  App --> Overlay["OverlayShell（仅登录后）"]
  Overlay --> Palette["CommandPalette（命令面板）"]
  Overlay --> AiAssistant["AiAssistant（AI 助手抽屉）"]
  App --> StatusBar["StatusBar（通知 / 错误）"]

  WS --> ViewNav["WorkspaceViewNav（九视图导航；members 按权限过滤）"]
  WS --> ContextPane["ContextPane（左栏：目录树 / 术语树 / 本地挂载 / info-list）"]
  ContextPane --> FolderTree["FolderTree + FolderTreeHeader"]
  ContextPane --> TermsPane["TermsContextPane（术语领域树）"]
  ContextPane --> LocalMount["LocalMountPane（REQ-049 本地挂载）"]
  ContextPane --> InfoList["ContextInfoList（搜索 / 问答）"]
  WS --> Resizer["pane-resizer（左栏宽度拖拽，收起时隐藏）"]
  WS --> Main["WorkspaceMain（activeView 条件渲染）"]

  Main --> Home["WelcomeFeature（home · 默认落地页）"]
  Main --> Docs["WorkspaceMainDocuments（documents）"]
  Docs --> DocsFeature["DocumentsFeature（toolbar + 编辑 / 预览 / 空态）"]
  Docs --> LocalPreview["LocalDocPreview（本地挂载文档预览）"]
  DocsFeature --> Editor["DocumentEditorForm / DocumentPreviewPane"]
  DocsFeature --> Inspector["DocumentInspectorFeature（右栏：版本 / 标签 / 链接）"]
  Main --> Search["SearchFeature"]
  Main --> Query["QueryFeature"]
  Main --> Terms["TermsFeature"]
  Main --> Tags["TagsFeature"]
  Main --> Timeline["TimelineFeature"]
  Main --> Members["MembersFeature（members · 空间 admin 可见）"]
  Main --> AdminUsers["AdminUsersFeature（admin-users · 全局 admin）"]

  WS --> QuickEntry["QuickEntryFeature（快速录入 modal）"]
  WS --> ImportModal["ImportFeature（导入 modal，§9.5.8）"]
  WS --> Onboarding["OnboardingGuide（新手引导，未完成时）"]
```
