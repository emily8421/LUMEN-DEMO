#!/usr/bin/env bash
# new-project.sh — 从 ai-project-template 派生新项目并初始化 git 远端
#
# 用法:
#   bash scripts/new-project.sh <项目名> [--account <login>] [--visibility public|private] [--no-examples] [--local] [--no-remote]
#     <项目名>           新项目目录名（相对当前目录，或绝对路径），默认也是 GitHub 仓库名
#     --account <login>  建仓库的 GitHub 账号（优先级高于 ACCOUNT 和当前 gh 登录账号）
#     --visibility <v>   GitHub 仓库可见性：private 或 public（默认取 VISIBILITY，未设置则为 private）
#     --no-examples      不复制 _archive/ 与 _examples/ 参考材料
#     --local            走本地模板派生（默认 = 脚本所在仓库根，需自行确保 git pull 到最新）；
#                        不加此参数则从 GitHub main 派生（推荐，事实来源）
#     --no-remote        只创建本地项目与首提交，不创建 GitHub 仓库、不推送（用于烟测或离线起步）
#   环境变量:
#     ACCOUNT            默认建库账号（可被 --account 覆盖）
#     VISIBILITY         默认仓库可见性：private 或 public（可被 --visibility 覆盖）
#     TEMPLATE_REMOTE    模板远端（默认 https://github.com/emily8421/ai-project-template.git）
# 依赖: git、gh（目标账号已登录或可 switch 到）
# 说明: 默认从 GitHub main 派生（事实来源）；--local 走本地。两种产物等价，派生时任选。
set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
VISIBILITY="${VISIBILITY:-private}"
NO_EXAMPLES=0
USE_LOCAL=0
NO_REMOTE=0
NAME=""
TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-https://github.com/emily8421/ai-project-template.git}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --account) ACCOUNT="${2:?--account 需要值}"; shift 2;;
    --visibility) VISIBILITY="${2:?--visibility 需要值}"; shift 2;;
    --no-examples) NO_EXAMPLES=1; shift;;
    --local) USE_LOCAL=1; shift;;
    --no-remote) NO_REMOTE=1; shift;;
    -h|--help) echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--visibility public|private] [--no-examples] [--local] [--no-remote]"; exit 0;;
    -*) echo "未知选项: $1" >&2; exit 1;;
    *) if [[ -n "$NAME" ]]; then echo "多余的位置参数: $1" >&2; exit 1; fi; NAME="$1"; shift;;
  esac
done

[[ -n "$NAME" ]] || { echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--visibility public|private] [--no-examples] [--local] [--no-remote]" >&2; exit 1; }
case "$VISIBILITY" in
  private|public) ;;
  *) echo "--visibility 仅支持 private 或 public: $VISIBILITY" >&2; exit 1;;
esac

TARGET="$NAME"; [[ "$TARGET" = /* ]] || TARGET="$PWD/$TARGET"
[[ ! -e "$TARGET" ]] || { echo "目标已存在: $TARGET" >&2; exit 1; }
BASE="$(basename "$TARGET")"
mkdir -p "$(dirname "$TARGET")"

DEFAULT_GIT_NAME="${GIT_AUTHOR_NAME:-Codex Local Init}"
DEFAULT_GIT_EMAIL="${GIT_AUTHOR_EMAIL:-codex-local-init@example.invalid}"

write_derived_project_workflow() {
  mkdir -p "$TARGET/.github/workflows"
  rm -f "$TARGET/.github/workflows/template-check.yml"
  cat > "$TARGET/.github/workflows/project-check.yml" <<'EOF'
name: Project Check

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  project-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check whitespace
        shell: bash
        run: |
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            git diff --check "${{ github.event.pull_request.base.sha }}" "${{ github.event.pull_request.head.sha }}"
          elif [[ "${{ github.event.before }}" =~ ^0+$ ]]; then
            git diff-tree --check --no-commit-id --root -r "${{ github.sha }}"
          else
            git diff --check "${{ github.event.before }}" "${{ github.sha }}"
          fi

      - name: Check template sync boundary
        shell: bash
        run: |
          subject="$(git log -1 --format=%s)"
          if [[ "$subject" =~ ^sync[[:space:]]template[[:space:]]v[0-9]+\.[0-9]+\.[0-9]+[[:space:]]from[[:space:]]ai-project-template$ ]]; then
            bash scripts/check-derived-sync.sh HEAD
          else
            echo "Not a template sync commit; skip derived sync boundary check."
          fi
EOF
}

if [[ "$USE_LOCAL" -eq 1 ]]; then
  TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  echo "==> 模板（本地）: $TEMPLATE_DIR（请确保已 git pull 到最新）"
  mkdir -p "$TARGET"
  git -C "$TEMPLATE_DIR" archive --format=tar HEAD | tar -x -C "$TARGET"
  SOURCE="local"
else
  echo "==> 模板（远端）: $TEMPLATE_REMOTE (main)"
  git clone --depth 1 -q "$TEMPLATE_REMOTE" "$TARGET"
  rm -rf "$TARGET/.git"
SOURCE="remote"
fi

TEMPLATE_VERSION="$(tr -d '[:space:]' < "$TARGET/VERSION" 2>/dev/null || true)"
[[ -n "$TEMPLATE_VERSION" ]] || TEMPLATE_VERSION="unknown"
cat > "$TARGET/TEMPLATE-BASE.md" <<EOF
# Template Base

> Records the upstream template lineage for this ordinary derived project. Do not use this file for domain-template inheritance metadata.

- Template repository: github.com/emily8421/ai-project-template
- Base template version: $TEMPLATE_VERSION
- Current synced template version: $TEMPLATE_VERSION
- Synced at: $(date +%Y-%m-%d)
- Project version file: VERSION
- Project version at sync time: $TEMPLATE_VERSION

## Version Semantics

- \`VERSION\` is owned by this derived project and records the project version.
- \`TEMPLATE-BASE.md\` records the inherited ai-project-template version used for methodology sync audit.
- Template sync commits keep the message format \`sync template $TEMPLATE_VERSION from ai-project-template\`.
EOF

rm -rf "$TARGET/_proposals"
mkdir -p "$TARGET/_proposals"
cat > "$TARGET/_proposals/README.md" <<EOF
# 模板优化提案起草区

本目录用于在本项目内临时起草可回流到 \`ai-project-template\` 的模板优化提案。

当开发过程中发现可通用于多个项目的规则、流程、文档骨架或脚本优化时，可在此新增：

\`\`\`text
TEMPLATE-UPGRADE-vX.Y.Z.md        # 提案主体：动机、拟改、版本影响、影响面
TEMPLATE-UPGRADE-vX.Y.Z-patch.md  # 可选：具体 old→new 修改建议
\`\`\`

提案应保持去项目化，不写入本项目的具体业务需求、技术栈细节或私有信息。提案成熟后，回到模板仓库开 PR，把提案提交到模板仓库的 \`_proposals/\` 收件箱，由模板维护者汇总分析并落地。

模板改动合并并下行同步后，应将本项目内已处理的提案移动到项目历史记录 / \`_archive/proposals/\` 或删除，避免继续作为待办重复执行。
EOF

write_derived_project_workflow

cat > "$TARGET/README.md" <<EOF
# $BASE

> 本项目由 \`ai-project-template\` 派生。请在初始化阶段把本文件改写为项目说明，而不是保留模板仓库说明。

## 项目简介

（用 2-3 句话说明本项目要解决的问题、目标用户与当前阶段范围。）

## 当前阶段

- 当前阶段：Phase1（待确认）
- 交付物形态：Demo / MVP / 产品（待确认；Phase1 不默认等于 MVP）
- 阶段目标：（说明当前阶段要演示、上线或生产化到什么程度）
- 非目标：（说明当前阶段明确不做什么）

## 它能做什么

- （列出当前 Phase 已确认要实现的核心能力——本项目自己的能力，不照搬模板通用能力）

## 快速开始

1. 若尚未确认机器环境，先看 \`template-docs/env-setup.md\`，运行 \`powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1\`；缺必备工具时再执行 \`scripts/bootstrap-dev-env.ps1\` 或手工安装。
2. 运行 \`powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1\` 生成 \`docs/env/local-env.md\`，补齐本机必须跑通的功能、允许降级 / Mock 项与服务器预案。
3. 准备可审计上游输入：把产品愿景草稿、小工具 brief、PRD / SRS、任务单、现有系统说明等原始材料统一先放入 \`docs/inputs/\`；若已经有成熟 \`docs/vision/product-vision.md\`，后续也要用输入评审复核来源和缺口。
4. 初填 \`ai/project-rules.md\` 的项目名称、Phase1 目标、技术栈倾向、运行环境约束与项目形态裁剪；不确定项标“待确认”。
5. 在 AI CLI 中说“评审输入材料”（或 \`/run review-inputs\`），让 AI 评估 Product Vision 就绪度；不足时先按 \`docs/inputs/input-review-report.md\` 和最小补充清单补齐，复评通过后再说“生成文档体系”（或 \`/run generate-docs\`），先生成 / 更新 \`docs/vision/product-vision.md\`，再多入口生成 / 补齐 \`docs/00-09\`、必要的 \`docs/design/\` 详细设计、项目 README 与 Sprint1；底层 Prompt 见 \`ai/prompts/docs/00-generate-or-complete-docs.md\`。
6. 人工确认 \`docs/03-prd.md\` §3 阶段路线图、交付物形态和 \`docs/05-tech-spec.md\` 的本机 Demo 可行性；确认后再说“执行当前 Sprint”（或 \`/run run-dev-task\`）。

> 纯本地烟测可以暂时不安装 AI CLI；真正开始 AI 协作开发前，至少准备并登录一种 AI CLI，安装顺序见 \`template-docs/ai-cli-setup.md\`。

### 推荐：打开 AI CLI 后让 AI 带你继续

> Keyword for template checks: newbie AI CLI onboarding path.

如果已经安装并登录 \`Claude CLI\` 或 \`Codex CLI\`，在本项目根目录打开 AI CLI，不用记具体步骤——直接说一个具体场景（如「帮我准备输入材料」「帮我生成文档体系」），或 \`/run scenario\`。AI 会读取 \`template-docs/scenario-guides.md\`，先给你「做什么 + 为什么」的引导计划，确认后再执行。

### \`ai/project-rules.md\` 首次必填 checklist

生成 \`docs/03-09\` 前，至少确认以下项目不再保留模板占位：

- 项目名称与代号 / 缩写。
- Phase1 允许事项、禁止事项与 Phase2 预告。
- 已确定或待确认的前端 / 后端 / 数据库 / AI 模型等技术栈。
- 本机 Demo 必须运行的部分、允许降级 / Mock 的部分、是否需要服务器。
- 是否有持久化存储、是否有对外接口、演示形态。
- \`docs/06-db-design.md\` 与 \`docs/07-api-spec.md\` 的保留 / 省略决策。
- 需要保留的代码目录；不用的目录后续再删除，不要先删再补依据。

## 文档入口

- \`docs/00-scenario.md\`：场景
- \`docs/inputs/\`：原始输入统一入口，可放愿景草稿、PRD / SRS、brief、任务说明、现有系统说明和评估报告
- \`docs/vision/product-vision.md\`：由输入评审通过后生成 / 更新的产品愿景叙事源文档
- \`docs/01-user-requirements.md\`：用户需求
- \`docs/02-srs.md\`：软件需求规格
- \`docs/03-prd.md\`：产品需求与阶段路线图
- \`docs/README.md\`：文档分区规则，新增文档前先看这里
- \`docs/env/local-env.md\`：本机运行环境与资源约束
- \`docs/design/\`：子系统 / 模块详细设计
- \`docs/08-dev-plan.md\`：开发计划
- \`docs/09-verification.md\`：验证计划

## 运行环境

- 本机环境记录：\`docs/env/local-env.md\`
- 本机 Demo 可行性：（待确认）
- 降级 / Mock 策略：（待确认）

## 开发计划

- 当前 Sprint：见 \`docs/08-dev-plan.md\`
- 执行单个任务时使用 \`ai/prompts/dev/02-run-task.md\`

## 验证方式

- 验证计划：见 \`docs/09-verification.md\`
- 本机资源验证：见 \`docs/09-verification.md\` 的资源验证项

## 模板关系

- 通用方法论来自 \`ai-project-template\`。
- 项目自身版本记录在 \`VERSION\`；继承 / 当前同步到的模板版本记录在 \`TEMPLATE-BASE.md\`。
- 文档生成、追溯链、变更传播与多入口规则见 \`ai/document-lifecycle-rules.md\`；可复制 Prompt 见 \`INIT-PROMPT.md\` 索引与 \`ai/prompts/\`。
- 根 \`README.md\` 是项目专属文档，不参与模板下行同步。
- 模板方法论文件由 \`template-sync.json\` 定义，执行 \`scripts/sync-template.*\` 时可能被覆盖。
- 项目专属规则写在 \`ai/project-rules.md\`。
- 项目事实文档写在 \`docs/\`，但新增文档必须遵守 \`docs/README.md\` 的分区规则，不要直接堆到 \`docs/\` 根目录。
- 如发现可通用的模板优化，先在 \`_proposals/\` 起草提案，再回流到模板仓库。
EOF

if [[ "$NO_EXAMPLES" -eq 1 ]]; then
  rm -rf "$TARGET/_archive" "$TARGET/_examples"
fi

cd "$TARGET"
git init -b main >/dev/null
git add -A
if git config user.name >/dev/null 2>&1 && git config user.email >/dev/null 2>&1; then
  git commit -q -m "init: $BASE (based on ai-project-template)"
else
  echo "==> 未检测到当前仓库或全局 Git 身份，使用临时本地提交身份完成初始化"
  echo "    user.name=$DEFAULT_GIT_NAME"
  echo "    user.email=$DEFAULT_GIT_EMAIL"
  git -c user.name="$DEFAULT_GIT_NAME" -c user.email="$DEFAULT_GIT_EMAIL" \
    commit -q -m "init: $BASE (based on ai-project-template)"
fi

if [[ "$NO_REMOTE" -eq 1 ]]; then
  echo "==> 跳过远端建库与推送（--no-remote）"
else
  if [[ -z "$ACCOUNT" ]]; then
    ACCOUNT="$(gh api user --jq .login 2>/dev/null || true)"
  fi

  [[ -n "$ACCOUNT" ]] || {
    echo "未获取到 GitHub 账号。请先执行 gh auth login，或显式传 --account <login>，或设置 ACCOUNT 环境变量。" >&2
    exit 1
  }

  echo "==> 目标: $TARGET（账号 $ACCOUNT，仓库 $ACCOUNT/$BASE，$VISIBILITY）"

  ACTIVE="$(gh api user --jq .login 2>/dev/null || true)"
  if [[ -n "$ACTIVE" && "$ACTIVE" != "$ACCOUNT" ]]; then
    echo "==> 切换 gh 活跃账号: $ACTIVE -> $ACCOUNT"
    gh auth switch -u "$ACCOUNT"
  fi

  gh repo create "$ACCOUNT/$BASE" "--$VISIBILITY" --source=. --remote=origin --push \
    --description "Derived from ai-project-template"
fi

echo
if [[ "$NO_REMOTE" -eq 1 ]]; then
  echo "==> 目标: $TARGET（本地-only，无需 GitHub 账号）"
  echo "✅ 完成：$TARGET（来源：$SOURCE，本地-only）"
else
  echo "✅ 完成：$ACCOUNT/$BASE（来源：$SOURCE）"
fi
echo "后续："
echo "  cd \"$TARGET\""
echo "  先运行 scripts/collect-env.ps1，再按 README 准备 docs/inputs/、初填 ai/project-rules.md，并通过 /run review-inputs -> /run generate-docs 进入文档链路"
echo "  GitHub Actions 已使用派生项目版 .github/workflows/project-check.yml；普通 PR 不运行模板仓 check-template"
