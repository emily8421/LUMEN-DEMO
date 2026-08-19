# UI Prototype Strategy Template（UI 原型策略 / 实现前原型记录模板）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 定位：实现前 UI 原型策略记录；用于已有需求链和基本设计后、进入前端实现前确认原型形式、覆盖范围和验收映射。它不是需求权威源，不替代 `00-09`、`docs/design/frontend-interaction.md` 或 `09` 验收记录。
> 字段标准见 `ai/doc-standards/ui-prototype-strategy.md` §4；本模板为可填副本，各表给 `<示例>` 行供参考（填写时替换或删除）。

## 0. 元信息

| 字段 | 内容 |
|---|---|
| 项目 / 入口 |  |
| 适用 Phase |  |
| 交付物形态 | Demo / MVP / 产品 |
| 策略状态 | 需要 / 不需要 / 豁免 / 待确认 |
| 原型负责人 |  |
| 最后更新 |  |
| 关联文档 | `docs/03-prd.md` / `docs/05-tech-spec.md` / `docs/design/frontend-interaction.md` / `docs/09-verification.md` |
| 上游探索依据 | UI brief / 需求探索原型 / 视觉效果探索 / experience brief / 无 |

## 1. 策略结论

| 项 | 结论 |
|---|---|
| 是否需要开发前可视化原型 | 需要 / 不需要 / 豁免 |
| 原型形式 | Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 低保真草图 / 其他 |
| 原型权威位置 | 链接 / 仓库路径 / Storybook / 截图目录 |
| 默认 UI 标准基线 | 管理后台 / 知识库工作台 / 数据密集表格 / 问答界面 / 营销页 / 其他 |
| 信息密度 / 布局方向 | 字号、行高、列表密度、导航与主工作区布局 |
| 实施顺序判断 | UI / 原型优先 / 后端或技术验证优先 / 双轨并行 / 豁免 |
| 豁免理由 | 不需要或暂不做时填写，说明风险、影响范围和补做时点 |

## 1.1 用户确认依据

| 日期 | 评审人 | 确认范围 | 未确认项 | 回填位置 / Open Item |
|---|---|---|---|---|
| YYYY-MM-DD |  |  |  |  |

## 2. 覆盖范围

| Page-ID / Flow-ID | 页面 / 流程 | 覆盖状态 | 覆盖角色 | 覆盖设备 / 浏览器 | 原型证据 | 关联 REQ / TC |
|---|---|---|---|---|---|---|
| <示例 P-001> | <登录页> | <已覆盖> | <终端用户> | <Chrome / Safari> | <Figma 链接> | <REQ-001 / TC-01> |

## 3. 关键状态覆盖

| Page / Component | 加载 | 空态 | 错误 | 禁用 | 成功 | 无权限 | 降级 / Mock | 风险提示 |
|---|---|---|---|---|---|---|---|---|
| <示例 登录页> | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |

## 4. Mock / Demo / 降级口径

| 能力 | 当前状态 | 用户可见提示 | 与真实能力差异 | 替换 / 启用条件 | 后续任务 |
|---|---|---|---|---|---|
| <示例 登录鉴权> | <Mock（Demo）> | <「演示账号 demo / demo」> | <不连真实后端> | <MVP 前接真实鉴权> | <Sprint-3> |

## 5. 未覆盖项与风险

| ID | 未覆盖项 | 原因 | 影响 | AI 建议 | 补做时点 / 阻塞关系 |
|---|---|---|---|---|---|

## 6. 评审记录

| 日期 | 评审人 | 结论 | 反馈摘要 | 回填位置 | 状态 |
|---|---|---|---|---|---|

## 7. 回填与验收映射

| 原型发现 / 确认项 | 回填文档 | 关联 ID | 是否已回填 | 验收入口 / 证据 |
|---|---|---|---|---|
| <示例 登录需短信验证码> | <docs/02-srs.md> | <REQ-012> | <是> | <TC-12> |

## 7.1 晋级 Gate

| Gate | 是否满足 | 证据 | 未满足影响 |
|---|---|---|---|
| UI-G-004：可视化原型确认后先回填文档体系 | 是 / 否 / 不适用 |  |  |
| UI-G-006：frontend-interaction → implementation prototype / Sprint | 是 / 否 / 不适用 |  |  |
| UI-G-007：implementation → verification | 是 / 否 / 不适用 |  |  |

## 8. 禁止事项确认

- [ ] 原型未新增 `03` 未授权需求。
- [ ] 原型未定义 `07` 未同步接口。
- [ ] 原型未新增 `09` 未覆盖验收目标。
- [ ] 前端可见性控制未替代后端权限边界。
- [ ] Mock / 降级口径已明确用户可见提示。
- [ ] 未确认视觉候选 / AI 默认建议未写成正式设计事实。
- [ ] 可视化原型确认后未绕过 `frontend-interaction`、`08`、`09` 直接编码。
