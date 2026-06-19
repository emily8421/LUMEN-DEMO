#!/usr/bin/env bash
# new-project.sh — 从 ai-project-template 派生新项目并初始化 git 远端
#
# 用法:
#   bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples] [--local]
#     <项目名>           新项目目录名（相对当前目录，或绝对路径），默认也是 GitHub 仓库名
#     --account <login>  建仓库的 GitHub 账号（默认 emily8421）
#     --no-examples      不复制 _archive/ 与 _examples/ 参考材料
#     --local            走本地模板派生（默认 = 脚本所在仓库根，需自行确保 git pull 到最新）；
#                        不加此参数则从 GitHub main 派生（推荐，事实来源）
#   环境变量:
#     TEMPLATE_REMOTE    模板远端（默认 https://github.com/emily8421/ai-project-template.git）
# 依赖: git、gh（目标账号已登录或可 switch 到）
# 说明: 默认从 GitHub main 派生（事实来源）；--local 走本地。两种产物等价，派生时任选。
set -euo pipefail

ACCOUNT="emily8421"
NO_EXAMPLES=0
USE_LOCAL=0
NAME=""
TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-https://github.com/emily8421/ai-project-template.git}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --account) ACCOUNT="${2:?--account 需要值}"; shift 2;;
    --no-examples) NO_EXAMPLES=1; shift;;
    --local) USE_LOCAL=1; shift;;
    -h|--help) echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples] [--local]"; exit 0;;
    -*) echo "未知选项: $1" >&2; exit 1;;
    *) if [[ -n "$NAME" ]]; then echo "多余的位置参数: $1" >&2; exit 1; fi; NAME="$1"; shift;;
  esac
done

[[ -n "$NAME" ]] || { echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples] [--local]" >&2; exit 1; }

TARGET="$NAME"; [[ "$TARGET" = /* ]] || TARGET="$PWD/$TARGET"
[[ ! -e "$TARGET" ]] || { echo "目标已存在: $TARGET" >&2; exit 1; }
BASE="$(basename "$TARGET")"
mkdir -p "$(dirname "$TARGET")"

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

echo "==> 目标: $TARGET（账号 $ACCOUNT，仓库 $ACCOUNT/$BASE）"

if [[ "$NO_EXAMPLES" -eq 1 ]]; then
  rm -rf "$TARGET/_archive" "$TARGET/_examples"
fi

cd "$TARGET"
git init -b main >/dev/null
git add -A
git commit -q -m "init: $BASE (based on ai-project-template)"

ACTIVE="$(gh api user --jq .login 2>/dev/null || true)"
if [[ -n "$ACTIVE" && "$ACTIVE" != "$ACCOUNT" ]]; then
  echo "==> 切换 gh 活跃账号: $ACTIVE -> $ACCOUNT"
  gh auth switch -u "$ACCOUNT"
fi

gh repo create "$ACCOUNT/$BASE" --private --source=. --remote=origin --push \
  --description "Derived from ai-project-template"

echo
echo "✅ 完成：$ACCOUNT/$BASE（来源：$SOURCE）"
echo "后续："
echo "  cd \"$TARGET\""
echo "  填写 docs/00-scenario.md ~ 02-srs.md，再按 README 快速开始推进"
