# SMOKE-TEST-REPORT-TEMPLATE

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件用于记录一次新手烟测结果。目标是让每次烟测都至少留下同一套最小事实，便于判断问题出在环境、入口文档、脚本提示，还是模板流程本身。

## 使用方式

1. 复制本文件内容到临时记录文档或 issue。
2. 按 `template-docs/smoke-test.md` 实际执行一遍。
3. 把每一步的结果填进去。
4. 只记录事实，不先急着给解决方案。

---

## 一、基本信息

- 测试日期：
- 测试人：
- 模板版本：
- 操作系统版本：
- PowerShell 版本：
- Git for Windows 版本：
- Git Bash 是否可用：可用 / 不可用
- 是否在干净机器或新账号环境下测试：是 / 否

## 二、测试目标

- 是否验证“新手能否从零跑通最小链路”：是 / 否
- 是否验证环境准备脚本：是 / 否
- 是否验证本地新建项目：是 / 否
- 是否验证环境采集：是 / 否
- 是否验证文档入口连通性：是 / 否

## 三、逐步记录

### 步骤 1：检查基础环境

- 执行命令：
  `powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1`
- 结果：通过 / 失败
- 看到的关键输出：
- 是否知道下一步该做什么：是 / 否
- 若缺基础工具，是否运行 `scripts/bootstrap-dev-env.ps1`：是（通过 / 失败）/ 否（跳过）
- 安装后是否需要重开终端：是 / 否
- 问题描述：

### 步骤 2：创建本地烟测项目

- 执行命令：
  `bash scripts/new-project.sh smoke-demo --local --no-remote`
- 结果：通过 / 失败
- 是否成功生成 `smoke-demo/`：是 / 否
- 问题描述：

### 步骤 3：进入新项目并采集环境

- 执行命令：
  先 `cd smoke-demo`，再 `powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1`
- 结果：通过 / 失败
- 是否成功生成 `docs/env/local-env.md`：是 / 否
- 问题描述：

### 步骤 4：验证文档入口是否连通

- 是否在新项目 `README.md` 里找到环境准备入口：是 / 否
- 是否在新项目 `README.md` 里找到输入材料入口：是 / 否
- 是否在新项目 `README.md` 里找到文档生成入口：是 / 否
- 是否知道下一步该打开哪个文件：是 / 否
- 问题描述：

### 步骤 5：最小清理

- 是否成功删除本地烟测项目 `smoke-demo/`：是 / 否
- 问题描述：

## 四、问题归因初判

- 更像本机环境问题：是 / 否
- 更像文档入口不清楚：是 / 否
- 更像脚本输出不清楚：是 / 否
- 更像模板流程过长或过重：是 / 否
- 暂时无法判断：是 / 否

## 五、建议修改面

- 需要改 `README.md`：是 / 否
- 需要改 `template-docs/beginner-guide.md`：是 / 否
- 需要改 `template-docs/env-setup.md`：是 / 否
- 需要改 `template-docs/smoke-test.md`：是 / 否
- 需要改脚本提示：是 / 否
- 需要改脚本逻辑：是 / 否

## 六、结论

- 本轮烟测是否通过：通过 / 不通过
- 最关键的阻塞点：
- 下一步建议：
