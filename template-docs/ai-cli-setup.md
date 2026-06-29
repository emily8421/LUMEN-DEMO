# AI-CLI-SETUP

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本手册只处理两件事：

1. 如何安装和启动 `Claude CLI` / `Codex CLI`
2. 安装完成后，如何与公司中转站 / LeMesh / CC-Switch 的配置顺序衔接

它不替代这些工具各自的官方文档，也不复制公司内网手册中可能频繁变化的代理细节。

## 1. 先建立边界

- `Claude CLI` / `Codex CLI` 的安装与登录：
  以各自官方文档为准。
- 公司中转站、LeMesh、CC-Switch、模型代理：
  以公司内网手册为准。
- 模板这里做的是：
  给出推荐顺序、最小命令和常见边界，避免新手把“安装工具本身”和“接公司代理”混在一起。

## 2. 推荐顺序

1. 先安装基础开发环境：
   `Git for Windows`、`Git Bash`、`PowerShell`，以及按需的 `Node.js` / `Python`
2. 再安装至少一种 AI CLI：
   `Claude CLI` 或 `Codex CLI`
3. 确认 CLI 本体能启动
4. 如果公司要求走中转站，再按内网手册处理 `LeMesh / CC-Switch / 代理配置`
5. 最后再回到项目里运行模板流程

## 3. Claude CLI

### 它适合谁

- 主要在终端里用 Claude 做代码阅读、编辑、任务执行的人
- 团队已经在用 Claude Code / Claude CLI 工作流的人

### 官方安装入口

- 官方文档：
  `https://docs.anthropic.com/en/docs/claude-code/getting-started`

### Windows 上的常见安装方式

推荐按官方文档优先选择以下任一种：

```powershell
winget install Anthropic.ClaudeCode
```

或：

```powershell
irm https://claude.ai/install.ps1 | iex
```

如果你明确要走 npm 路线，也可以参考官方文档中的 npm 安装方式：

```powershell
npm install -g @anthropic-ai/claude-code
```

### 安装后最小验证

```powershell
claude --version
claude
```

### 登录边界

- 如果你只是验证 CLI 本体是否装好，启动到登录提示即可。
- 如果你后续准备走公司中转站 / CC-Switch 路线，不要把公开文档里的 API key / provider 绑定步骤直接当成最终配置方案。
- 先确认 CLI 能装、能启动、命令可用，再切换到公司内网手册处理代理和供应商配置。

### Windows 补充

- 官方文档说明：Windows 原生可运行，Git for Windows 是推荐项。
- 如果 Claude CLI 在 Windows 上找不到 Git Bash，可参考官方文档中的 Git Bash 路径配置方式。

## 4. Codex CLI

### 它适合谁

- 主要在终端里使用 OpenAI / Codex 工作流的人
- 准备直接在命令行里跑代码任务、审查和迭代的人

### 官方安装入口

- 官方文档：
  `https://developers.openai.com/codex/cli`

### 常见安装方式

当前官方公开快速入口可参考：

```powershell
npm install -g @openai/codex
```

### 安装后最小验证

```powershell
codex --version
codex
```

### 登录边界

- 官方文档说明：首次运行 `codex` 时，会提示你使用 ChatGPT 账号或 API key 登录。
- 如果你后续准备走公司中转站 / CC-Switch 路线，不要急着把公开文档里的默认 API key 绑定流程当作最终配置。
- 先确认 Codex CLI 已安装、命令可启动，再切换到公司内网手册处理 LeMesh / CC-Switch / 代理配置。

## 5. 公司中转站 / LeMesh / CC-Switch

如果公司要求通过内部中转站访问模型，先看这份内部手册：

- `http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model`

根据现有说明，这份手册更适合处理：

- LeMesh 注册与 API 密钥创建
- 分组选择
- CC-Switch 自动导入或手动配置
- 公司中转站 / 模型代理接入

不应把它理解成：

- `Claude CLI` 的官方安装文档
- `Codex CLI` 的官方安装文档

## 6. 推荐操作顺序

如果你要用公司代理配置 `Claude CLI` 或 `Codex CLI`，建议顺序如下：

1. 按官方文档安装 CLI
2. 确认 `claude --version` 或 `codex --version` 可运行
3. 根据公司手册完成 LeMesh / CC-Switch / 密钥 / 模型代理配置
4. 回到项目目录，开始用模板执行任务

## 7. 可复制给 AI 的提示词

### 安装 Claude CLI

```text
请帮我在 Windows 上安装并验证 Claude CLI，但先不要替我配置公司中转站代理。

要求：
1. 优先参考 Claude Code / Claude CLI 官方安装文档。
2. 只完成安装、版本验证和 CLI 能否启动的检查。
3. 如果涉及公司代理、LeMesh、CC-Switch 或供应商配置，先停下并提醒我改看公司内网手册。
4. 输出：
   - 安装命令
   - 验证命令
   - 下一步是否需要看公司中转站手册
```

### 安装 Codex CLI

```text
请帮我在 Windows 上安装并验证 Codex CLI，但先不要替我配置公司中转站代理。

要求：
1. 优先参考 OpenAI / Codex CLI 官方安装文档。
2. 只完成安装、版本验证和 CLI 能否启动的检查。
3. 如果涉及公司代理、LeMesh、CC-Switch 或默认 API key/provider 配置，先停下并提醒我改看公司内网手册。
4. 输出：
   - 安装命令
   - 验证命令
   - 下一步是否需要看公司中转站手册
```

### 接公司中转站

```text
我已经安装好了 Claude CLI / Codex CLI，本机命令可以启动。
现在只需要帮我梳理下一步该如何接公司中转站。

要求：
1. 不重复讲 CLI 安装步骤。
2. 先提醒我查看公司内网手册：
   http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model
3. 只总结我下一步应该关注的配置类型：
   - LeMesh 注册 / 密钥
   - CC-Switch
   - 模型代理 / 供应商配置
4. 如果具体参数以内网手册为准，就明确说明“以内网手册为准”，不要猜。
```

## 8. 这份文档不做什么

- 不提供公司中转站的镜像参数抄录
- 不提供 `Claude CLI` / `Codex CLI` 的自动安装脚本
- 不保证覆盖未来所有安装方式变化

当官方安装文档或公司内网手册变化时，以它们为准；模板只维护最小入口和推荐顺序。
