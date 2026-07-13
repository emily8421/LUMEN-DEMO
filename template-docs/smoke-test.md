# SMOKE-TEST

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本手册用于验证一个新手是否能按当前模板，在 Windows 环境下从零跑通最小路径。它不是派生项目文档，而是模板自身的操作验证说明。

## 1. 适用范围

- 当前只覆盖 Windows 路径。
- 目标是验证“先检查环境 -> 缺失项有下一步 -> 新建本地项目 -> 采集环境 -> 准备输入 -> 进入文档生成入口”这条链路是否成立。
- 这是一份烟测，不是完整项目验收，也不是模板仓库完整性自检。

## 2. 烟测前提

- 当前机器能运行 PowerShell。
- 当前目录是 `ai-project-template` 模板仓库根目录。
- 若要测试远端建仓，请另行准备 `gh auth login`；本烟测默认只走本地路径，不依赖远端仓库。
- 因为本烟测只走 `--local --no-remote`，`gh` 不是硬阻塞项；若 `gh` 缺失或安装失败，只要其余本地命令可运行，仍可继续烟测。
- 本烟测不要求安装或登录 `Claude CLI` / `Codex CLI`；真正开始 AI 协作开发前，再按 `template-docs/ai-cli-setup.md` 至少准备一种。

## 3. 烟测目标

完成后，应至少确认：

1. 新手能先运行环境检查，而不是直接从建项目开始。
2. `scripts/check-prereqs.ps1` 能执行并给出结果。
3. 新手能从检查输出看出缺什么、哪些可跳过、下一步是否需要 `scripts/bootstrap-dev-env.ps1`。
4. `scripts/new-project.sh --local --no-remote` 能创建一个本地烟测项目。
5. 新项目内的 `scripts/collect-env.ps1` 能生成 `docs/env/local-env.md`。
6. 新项目 README 能把用户带到文档生成入口，而不是停在半路。

## 4. 标准步骤

### 步骤 1：检查基础环境

在模板仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

检查点：

- 命令能正常执行。
- 输出中能看到 Required / Recommended / Optional 三类结果。
- 输出中能看到 `Summary` 和 `Suggested next steps`。
- 至少能看出下一步是安装缺失项、跳过 `gh` 继续本地烟测，还是进入项目后采集环境。

若缺基础工具，可按需运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1
```

> 说明：如果当前机器本来就已具备环境，本烟测不要求你真的安装软件；这里只验证入口是否可发现、命令是否合理。
> 若 `gh` 安装失败，但你当前只做本地烟测，可继续执行步骤 2。

### 步骤 2：创建本地烟测项目

在模板仓库根目录运行：

```bash
bash scripts/new-project.sh smoke-demo --local --no-remote
```

如果 PowerShell 里找不到 `bash` 命令，或 `bash` 实际指向 Windows / WSL stub 并报 `E_ACCESSDENIED`、`/bin/bash` 不存在等启动错误，但 `scripts/check-prereqs.ps1` 已显示 Git Bash 已安装，可改用：

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/new-project.sh smoke-demo --local --no-remote
```

检查点：

- 成功创建 `smoke-demo/` 目录。
- 成功生成首个本地 Git 提交；若机器未配置 Git 身份，脚本也不应在这一步直接失败。
- 新项目里包含 `README.md`、`ai/`、`docs/`、`scripts/`。
- 新项目 `README.md` 中能看到环境准备、环境采集、输入材料和文档生成入口。
- 新项目 `README.md` 不应再指向已迁移的旧根目录文档名，例如 `ENV-SETUP.md`。

### 步骤 3：进入新项目并采集环境

```powershell
cd smoke-demo
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

检查点：

- 成功生成 `docs/env/local-env.md`。
- 文件中同时包含自动采集项和人工确认项。
- 新手能看出下一步需要补哪些“待确认”信息。

### 步骤 4：验证文档入口是否连通

在 `smoke-demo/` 中检查这些文件：

- `README.md`
- `docs/env/local-env.md`
- `ai/project-rules.md`
- `docs/vision/product-vision.md`
- `docs/inputs/`

检查点：

- README 里明确提示先准备输入材料。
- README 里明确提示填写 `ai/project-rules.md`。
- README 里明确提示优先通过“评审输入材料”或 `/run review-inputs` 进入输入评审。
- README 里明确提示评审通过后再“生成文档体系”或 `/run generate-docs`。

### 步骤 5：最小清理

烟测完成后，回到模板仓库父目录，删除本地烟测项目：

```powershell
cd ..
Remove-Item -Recurse -Force .\smoke-demo
```

## 5. 通过标准

满足以下条件即可判定本轮烟测通过：

- 环境检查脚本可执行。
- 新项目脚本可创建本地项目。
- 环境采集脚本可生成 `docs/env/local-env.md`。
- 新项目 README 能把新手继续带到输入评审和文档生成入口。

## 6. 常见失败点

- `bash` 不可用，或 PowerShell 中的 `bash` 指向 Windows / WSL stub 并报 `E_ACCESSDENIED`、`/bin/bash` 不存在等启动错误；若 Git Bash 已安装，改用 `C:\Program Files\Git\bin\bash.exe` 全路径。
- `scripts/check-prereqs.ps1` 能运行，但输出让新手看不懂下一步该做什么。
- `scripts/new-project.sh` 能创建项目，但生成的 README 没有环境准备入口。
- `scripts/collect-env.ps1` 运行后没有生成 `docs/env/local-env.md`。
- 环境入口、README、SOP 之间互相引用不一致。

## 7. 这份烟测不覆盖什么

- 不覆盖 Linux / macOS 安装链路。
- 不覆盖远端 GitHub 建仓。
- 不覆盖 `Claude CLI` / `Codex CLI` 的安装与登录。
- 不覆盖公司中转站的具体模型代理配置。
- 不覆盖完整文档生成质量。
- 不覆盖模板仓库完整性自检。

完整结构与同步校验仍应分别使用：

- `scripts/check-template.ps1`
- `scripts/check-derived-sync.ps1`

## 8. 结果记录建议

每次做完烟测，至少记录：

- 测试日期
- Windows 版本
- 是否需要运行 `bootstrap-dev-env.ps1`
- 哪一步失败
- 是否需要补 README / SOP / template-docs/env-setup.md / template-docs/beginner-guide.md

若希望统一记录格式，直接使用 `template-docs/smoke-test-report-template.md`。
