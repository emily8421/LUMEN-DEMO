# Command: show-demo

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run show-demo`
- 查看演示效果
- 我想看演示效果
- 帮我启动 Demo
- 怎么看当前项目效果
- 给我演示入口 / 二维码
- 检查服务是否起来
- 手机扫码看一下

## 适用场景

项目已有可运行交付物（Demo / MVP / 产品），用户想把当前交付物跑起来并查看效果。这不是开发任务，也不是文档问答，而是「把交付物跑起来 + 引导查看效果」。项目尚无演示 SOP 时，先按模板引导生成草案，等待用户确认后再落盘。

## 必读文件

- `ai/index.md`
- 项目演示 SOP：`docs/env/local-demo-runbook.md`（若无，参考 `template-docs/demo-runbook-template.md` 生成草案）
- `ai/project-rules.md` §1（确认当前阶段是否已进入可演示）
- `docs/05-tech-spec.md`（运行依赖、Mock / 降级边界）

## 执行流程

1. 判断项目是否有演示 SOP（`docs/env/local-demo-runbook.md`）；无则按 `template-docs/demo-runbook-template.md` 引导生成草案，**等待用户确认后**再落盘。
2. 按用户意图对照下方「AI 执行边界」表，明确只读 / 启动 / 检查 / 生成的边界。
3. 启动服务、生成运行产物（如二维码）或安装依赖等写入动作前，必须说明影响并等待确认。
4. 输出演示入口、访问方式、推荐演示路径和当前 Mock / 降级边界。
5. 演示检查不替代正式验收；正式验收仍以 `docs/09-verification.md` 为准。

## AI 执行边界

| 用户意图 | AI 默认行为 |
|---|---|
| "怎么看演示效果" | 只读输出口、入口和步骤，不启动服务 |
| "帮我启动 Demo" | 可运行已存在的启动脚本；运行前说明会打开服务 / 窗口 |
| "检查 Demo" | 可运行只读健康检查命令 |
| "给我二维码" | 可生成本地运行产物；产物应加入 `.gitignore` |
| "安装依赖 / 接外部服务 / 部署公网" | 必须单独确认，不能隐式执行 |

## 禁止项

- 不得为演示擅自安装依赖、启动付费服务或接真实外部系统。
- 不得把 Mock / Demo 说成生产可用。
- 不得把本地二维码、临时日志、端口状态等运行产物提交进仓库。
- 不得绕过项目 `docs/03` / `docs/05` / `docs/09` 的阶段边界与验证口径。

## 写入风险

启动服务、生成运行产物或安装依赖会改变本机或仓库状态；执行前必须说明并确认。运行产物（二维码、临时日志等）应由项目加入 `.gitignore`。

## 续接要求

记录演示 SOP 路径、已执行命令、运行产物位置和未验证项；演示检查不等于正式验收通过。
