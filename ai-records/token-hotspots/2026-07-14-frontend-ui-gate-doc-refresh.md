# Token Hotspot Record: Frontend UI Gate Doc Refresh

> 本文件是 AI 协作观察材料，不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。

## 元数据

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-14 |
| 任务主题 | 前端实现前 UI 原型收敛、08/09 门禁回填、`frontend-interaction` 重梳 |
| 记录性质 | token / 上下文热点观察 |
| 隐私过滤 | 未记录 token、密钥、账号密码、客户敏感数据或完整对话正文 |

## 热点判断

本轮属于 token hotspot，原因：

- 从快速续接进入分析 / 设计 / 文档写入任务后，完整读取了 `ai/index.md` 及规则清单。
- 多次读取和修改长文档：`docs/design/frontend-interaction.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`docs/research/2026-07-13-ui-prototype-exploration.md`。
- 反复检查 HTML 原型结构、CSS 类、卡片 / 圆角矩形密度和关键标记。
- 多次运行 Markdown 表格列数检查、HTML section 数量检查、`git diff --check` 和 Git 状态摘要。

## 主要上下文热点

| 类别 | 路径 / 对象 | 热点原因 |
|---|---|---|
| 项目规则 | `ai/index.md`、`ai/*-rules.md`、`ai/commands/README.md`、`ai/project-rules.md` | 进入分析 / 设计 / 写入任务前必须完整读取，规则文件较长 |
| 交互设计 | `docs/design/frontend-interaction.md` | 多轮重梳 P1 / P1A / P1B / P2 UI Gate、表格多、追溯关系多 |
| 计划验证 | `docs/08-dev-plan.md`、`docs/09-verification.md` | 需要新增 Sprint-11 与 TC-P2-UI 草案，并保持“不直接编码”边界 |
| 研究记录 | `docs/research/2026-07-13-ui-prototype-exploration.md` | 需要同步用户反馈、少容器清爽稿和 08/09 回填状态 |
| HTML 原型 | `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html` | 文件较长，多次定位 CSS、页面结构、关键交互标记和 section 平衡 |
| 续接记录 | `.ai/session-handoff.md` | 多次追加阶段性状态，便于跨会话恢复 |

## 执行命令类别

- Git 状态 / 摘要：`git status --short --branch`、`git diff --stat`、`git diff --check`。
- 文档定位：`Select-String`、`Get-Content` 按标题 / 行号 / 关键标记读取。
- 文件写入：PowerShell `Set-Content` / `[System.IO.File]::WriteAllText`。
- 结构校验：Markdown 表格列数扫描、HTML `<section>` / `</section>` 数量检查、关键标记扫描。

## 质量影响

| 影响 | 说明 |
|---|---|
| 正向 | 通过多轮局部校验，降低了表格列数错位、HTML section 不闭合、旧状态口径残留的风险 |
| 成本 | 反复读取长 HTML / Markdown 文档增加上下文压力，尤其是原型 CSS 与 `frontend-interaction` 多表格段落 |
| 风险 | 若后续继续在同一轮中进入编码，容易把设计草案、实现任务和验证状态混在一起，应重新确认 Phase2 范围后再开代码任务 |

## 后续优化建议

1. 对长 HTML 原型优先使用关键标记和局部行段读取，避免全文件反复输出。
2. 将 Markdown 表格列数检查抽成脚本或复用命令，减少重复内联校验代码。
3. `frontend-interaction` 后续若继续增长，可考虑拆分为 P1 已实现基线与 P2 UI Gate 附录，但拆分前需确认文档体系规则。
4. 进入编码前新开独立任务链：先确认 Phase2 范围、进入 / 退出标准、代码修改范围，再读取相关实现文件。

## 当前建议续接点

- 当前仍处于文档 / 原型 / 08 / 09 草案阶段，不直接编码。
- 若继续推进到实现，先确认 Phase2 范围、进入 / 退出标准和具体代码任务。
- 以 `.ai/session-handoff.md` 最新段落为任务续接主入口。