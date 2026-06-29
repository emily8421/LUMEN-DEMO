# Command: collect-env

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run collect-env`
- 采集本机环境
- 收集运行环境
- 生成 local-env

## 适用场景

新项目初始化或同步后，需要生成 / 更新 `docs/env/local-env.md`。

## 必读文件

- `ai/index.md`
- `ai/prompts/setup/13-collect-env.md`
- `scripts/collect-env.ps1`
- `docs/env/README.md`（如存在）

## 执行流程

1. 说明将运行的环境采集脚本和输出文件。
2. 用户确认后运行 `scripts/collect-env.ps1`。
3. 提醒用户补齐人工确认项。
4. 后续架构和技术方案必须参考采集结果。

## 写入风险

会生成或更新 `docs/env/local-env.md`；执行前必须确认。

## 续接要求

记录采集结果路径、待人工补齐项和后续使用位置。
