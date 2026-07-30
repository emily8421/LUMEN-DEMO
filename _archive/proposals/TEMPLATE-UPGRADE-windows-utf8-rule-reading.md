# TEMPLATE-UPGRADE-windows-utf8-rule-reading

> 来源：LUMEN Demo T2.1（emily8421/LUMEN-DEMO）派生项目回流。
> 去项目化说明：本文提炼自 Windows / PowerShell 环境下读取中文模板规则时的通用编码问题，不包含客户资料、私有路径、业务敏感信息或不可公开运行内容。

## 1. 背景与问题

在 Windows + PowerShell 环境中，AI 读取模板中文规则文件时可能出现输出乱码。文件本身通常仍是 UTF-8；问题出在 PowerShell 控制台输出编码、`$OutputEncoding`、宿主终端或工具链解码方式不一致。

该问题在快速续接场景中影响更明显：

- `ai/session-rules.md` 是“读取续接点 / resume”的关键入口。
- 若首次读取出现乱码，AI 可能无法可靠识别 `§3.1 快速续接模式`。
- 快速续接本应是最小只读恢复；编码问题会迫使 AI 重新读取、猜测或暂停询问，降低跨 CLI / 跨会话稳定性。
- 同类问题也可能影响 `ai/index.md`、`ai/rules-core.md`、`ai/project-rules.md`、`AGENTS.md`、`CLAUDE.md` 等包含中文规则的入口文件。

该问题不是某个派生项目的业务缺陷，而是中文模板规则在 Windows 终端链路中的通用可用性问题。

## 2. 拟改目标

建议模板补充 Windows / PowerShell 下读取中文规则文件的推荐命令与排障提示，目标是：

1. 让 AI 在读取中文规则文件时优先使用显式 UTF-8。
2. 避免把编码乱码误判为规则文件损坏、无响应或续接信息缺失。
3. 降低快速续接、规则路由、模板维护任务中的首次读取失败概率。
4. 为派生项目保留统一、可复制的排障说明。

## 3. 建议新增规则

### 3.1 PowerShell 读取中文规则推荐命令

在 Windows + PowerShell 环境读取 `ai/*.md`、`AGENTS.md`、`CLAUDE.md`、`docs/*.md` 等中文 Markdown 文件时，建议 AI 使用显式 UTF-8 输出：

```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-Content -Path ai/session-rules.md -Encoding UTF8 -Raw
```

若需要一次读取多个规则文件，可在同一 PowerShell 进程中先设置输出编码，再逐个 `Get-Content -Encoding UTF8 -Raw`。

### 3.2 乱码判定与处理

建议补充如下判定：

- 如果中文规则输出出现明显乱码，但命令退出码为 0，不应直接判定文件损坏或命令无响应。
- 应先用显式 UTF-8 方式重新读取最小必要章节。
- 重新读取仍乱码时，再检查文件编码、终端编码、仓库实际内容或 Git diff。
- 不得基于乱码内容继续推断任务规则、续接状态或项目事实。

### 3.3 快速续接特别提示

建议在快速续接规则附近补充：

- Windows / PowerShell 环境下，读取 `ai/session-rules.md` 的 `§3.1 快速续接模式` 时应使用显式 UTF-8。
- 若快速续接规则读取乱码，应暂停解释为“编码输出问题”，重读后再执行 `.ai/session-handoff.md`、`git status --short --branch`、`NEXT-STEPS.md` 等最小只读检查。

## 4. 建议修改位置

可由维护者在以下位置择一或组合落地：

1. `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/project-rules.mdc`：在入口说明中补充 Windows 中文规则读取提示。
2. `ai/session-rules.md`：在快速续接模式或恢复命令附近补充编码排障提示。
3. `ai/rules-core.md`：在启动顺序或输出与上下文卫生处补充“乱码时先重读，不以乱码推断规则”。
4. `ai/commands/resume.md`：在续接命令流程里加入 PowerShell UTF-8 读取示例。
5. `template-docs/session-handoff.example.md`：可选补充恢复命令示例，避免派生项目复制到乱码风险较高的命令。

## 5. 验收标准

建议模板落地后满足：

- Windows + PowerShell 用户可直接复制一段命令读取中文规则文件并正常显示。
- 快速续接规则明确说明乱码不等于文件损坏或命令无响应。
- AI 在读取中文规则乱码时，有明确的重读路径，而不是继续基于乱码内容推断。
- 变更不改变模板方法论含义，仅补充环境兼容性和排障说明。

## 6. 影响面

- 影响范围：模板规则入口、快速续接流程、Windows / PowerShell 用户体验。
- 风险：低；主要是说明性规则和命令示例，不改变任务流程本身。
- 下行同步：所有包含中文规则文件的派生项目都可受益。
- 非 Windows 环境：无实质影响；macOS / Linux 可继续使用现有读取方式。

## 7. 版本影响建议

建议作为 PATCH 或小版本文档体验改进处理。

如果只补充说明和命令示例，不改变规则语义，建议 PATCH；若同时调整 `resume` 命令流程或入口文件行为规范，可由维护者评估是否进入 MINOR。

## 8. 待维护者确认项

1. 编码提示应优先放在 `ai/session-rules.md`，还是统一放在入口文件与命令文档中。
2. 是否需要同步更新 `ai/commands/resume.md` 的恢复命令模板。
3. 是否需要在模板自检脚本中增加中文 Markdown 读取 / 编码检查。

## 9. 非目标

- 不要求修改所有中文文件编码；默认仍按 UTF-8 管理。
- 不要求为每个命令都复制编码设置；应避免说明膨胀。
- 不处理终端字体缺失、系统区域设置或第三方 CLI 私有日志乱码问题。
- 不改变快速续接的事实来源优先级与只读恢复边界。
