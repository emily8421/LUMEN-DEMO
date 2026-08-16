# Source Registry（精选来源登记）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 定位：UI 知识核心层的来源索引。登记可复用的公开设计来源，记录证据范围、许可策略和最后核验状态，供 `visual-patterns.md` / `interaction-patterns.md` 的模式引用。本文件只保存来源元数据、自有摘要和链接，不镜像第三方素材原文、截图或品牌资产。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 维护者 | 模板维护者 |
| 来源数量 | 6（首批） |
| 状态分布 | 全部 candidate（待逐条人工评审，见 `README.md` §9） |
| 最后整体核验 | 2026-08-13（登记；外部链接有效性待联网复核） |
| 许可口径 | 默认只保存摘要 + 链接；保存代码须附资产级许可证据（见 `README.md` §7 §8） |

## 1. 来源清单

| SRC-ID | 类型与维度 | 标题与发布方 | 来源 URL | 证据范围 | 许可与保存策略 | 最后核验 | 状态 |
|---|---|---|---|---|---|---|---|
| `SRC-A11Y-001` | 规范 / 可访问性、组件与表单 | WAI-ARIA Authoring Practices Guide (APG)，W3C | https://www.w3.org/WAI/ARIA/apg/ | A | 可保存摘要 + 链接 | 2026-08-13（登记） | candidate |
| `SRC-A11Y-002` | 规范 / 可访问性、视觉与布局 | Web Content Accessibility Guidelines (WCAG) 2.2，W3C | https://www.w3.org/TR/WCAG22/ | A | 可保存摘要 + 链接 | 2026-08-13（登记） | candidate |
| `SRC-DS-001` | 设计系统 / 交互流程、状态反馈、内容设计、可访问性 | GOV.UK Design System，英国政府数字服务 | https://design-system.service.gov.uk/ | B | 可保存摘要 + 链接；代码片段附 Open Government Licence v3.0 | 2026-08-13（登记） | candidate |
| `SRC-DS-002` | 设计系统 / 组件与表单、可访问性、视觉与布局 | U.S. Web Design System (USWDS)，美国总务管理局 | https://designsystem.digital.gov/ | B | 可保存摘要 + 链接；组件代码附 USWDS 开源许可 | 2026-08-13（登记） | candidate |
| `SRC-HAI-001` | 人机协作指南 / 信任数据与人机协作、状态反馈与恢复 | Human-AI eXperiences (HAX) Toolkit，Microsoft | https://www.microsoft.com/haxtoolkit/ | B | 可保存摘要 + 链接（许可待核验） | 2026-08-13（登记） | candidate |
| `SRC-VIS-001` | 视觉案例集合 / 视觉与布局 | awesome-design-md，VoltAgent（GitHub） | https://github.com/VoltAgent/awesome-design-md | D | 只保存链接 + 自有摘要；不镜像第三方网站素材 | 2026-08-13（登记） | candidate |

## 2. 来源类型与证据范围

| 类型 | 代表来源 | 证据范围 | 主要贡献 |
|---|---|---|---|
| 可访问性规范 | WAI-ARIA APG、WCAG | A | 组件语义、键盘焦点行为、对比度、读屏 |
| 公共服务设计系统 | GOV.UK Design System | B | 服务流程、表单、错误恢复、内容设计、研究方法 |
| 政府设计系统 | USWDS | B | 组件、模式、可访问性与实现边界 |
| 人机协作指南 | Microsoft HAX Toolkit | B | AI 建议纠错、控制、信任、人工接管 |
| 视觉案例集合 | awesome-design-md | D | 风格词汇、布局、排版、色彩候选 |

## 3. 使用与维护说明

- 模式记录引用来源时必须使用 `SRC-ID`，不得只写产品名。
- `SRC-VIS-001`（awesome-design-md）的条目适合观察视觉语言、布局、色彩和品牌表达，**不适合**作为交互决策、用户研究或可用性证据；引用其观察的模式默认从 D 级开始。
- 来源链接失效、版本变化或内容下架时，更新「最后核验」字段并按 `README.md` §8 降级或标 retired。
- 新增来源须先确认证据范围与许可策略，状态默认 candidate；升级到 core 需维护者评审（`README.md` §9）。
- 本文件不记录具体维护者账号、token 或本机私有备忘。
