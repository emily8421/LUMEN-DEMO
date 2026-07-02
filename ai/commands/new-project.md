# Command: new-project

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run new-project`
- 新建派生项目
- 从模板创建项目
- 初始化新项目

## 适用场景

需要从 `ai-project-template` 创建新的派生项目。

## 必读文件

- `ai/index.md`
- `git-guide.md` §6（场景 D：新建派生项目）
- `ai/prompts/setup/14-new-project.md`
- `scripts/new-project.sh`
- `template-docs/beginner-guide.md`

## 执行流程

1. 明确项目名、远端 / 本地模式、GitHub 可见性和账号需求。
2. 说明不推荐手工复制模板文件夹。
3. 用户确认后运行 `scripts/new-project.sh`。
4. 引导采集环境、填写愿景和初始化 `ai/project-rules.md`。

## 写入风险

会在工作区外创建新目录或远端仓库；执行前必须确认。

## 续接要求

记录项目创建命令、目标路径、下一步初始化事项。
