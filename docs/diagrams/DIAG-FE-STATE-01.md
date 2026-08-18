# DIAG-FE-STATE-01 · 工作台视图与栏布局状态机

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/design/frontend-interaction.md`（本图所在块）。阶段：详细设计；类型：状态图（前端）；追溯：REQ-011 · Doc-First §9.5；渲染：GitHub 原生。

```mermaid
stateDiagram-v2
  state "activeView 视图态（九选一）" as View {
    [*] --> home : 登录成功（Doc-First §9.5.2 默认落地页）
    home --> documents : 导航 / 首页卡片
    documents --> search : 导航切换
    search --> query : 导航切换
    query --> terms : 导航切换
    terms --> tags : 导航切换
    tags --> timeline : 导航切换
    timeline --> home : 导航切换
    documents --> members : 仅空间/全局 admin 可见（C-ROLE-007）
    documents --> admin_users : 仅全局 admin（TopBar 用户管理入口）
  }

  state "leftPane 左目录栏" as Left {
    [*] --> left_open : 默认展开（2026-08-14 修订）+ localStorage 记忆
    left_open --> left_collapsed : Ctrl+B / 顶栏 / 边缘按钮（记忆偏好）
    left_collapsed --> left_open : 再次触发（同左）
    left_open --> left_hidden : activeView ∈ {home, tags, timeline}（无左栏内容恒不显示）
    left_hidden --> left_open : 切回 documents / search / query / terms
  }

  state "rightPane 右栏（Inspector）" as Right {
    [*] --> right_collapsed : 默认收起（选区 / AI 唤出）+ 记忆
    right_collapsed --> right_open : Ctrl+R / 边缘按钮（input/textarea 聚焦时守卫不拦截，F-impl-1）
    right_open --> right_collapsed : 再次触发 / 切入并排模式自动收起（不覆盖偏好）
  }
```
