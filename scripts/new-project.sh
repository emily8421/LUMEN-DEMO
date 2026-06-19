#!/usr/bin/env bash
# new-project.sh — 从 ai-project-template 一键派生新项目并初始化 git 远端
#
# 用法:
#   bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples]
#     <项目名>          新项目目录名（相对当前目录，或绝对路径），默认也是 GitHub 仓库名
#     --account <login> 建仓库的 GitHub 账号（默认 emily8421）
#     --no-examples     不复制 _archive/ 与 _examples/ 参考材料
# 依赖: git、gh（目标账号已登录或可 switch 到）
set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACCOUNT="emily8421"
NO_EXAMPLES=0
NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --account) ACCOUNT="${2:?--account 需要值}"; shift 2;;
    --no-examples) NO_EXAMPLES=1; shift;;
    -h|--help) echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples]"; exit 0;;
    -*) echo "未知选项: $1" >&2; exit 1;;
    *) if [[ -n "$NAME" ]]; then echo "多余的位置参数: $1" >&2; exit 1; fi; NAME="$1"; shift;;
  esac
done

[[ -n "$NAME" ]] || { echo "用法: bash scripts/new-project.sh <项目名> [--account <login>] [--no-examples]" >&2; exit 1; }

TARGET="$NAME"; [[ "$TARGET" = /* ]] || TARGET="$PWD/$TARGET"
[[ ! -e "$TARGET" ]] || { echo "目标已存在: $TARGET" >&2; exit 1; }
BASE="$(basename "$TARGET")"

echo "==> 模板: $TEMPLATE_DIR"
echo "==> 目标: $TARGET（账号 $ACCOUNT，仓库 $ACCOUNT/$BASE）"

# 1) git archive 导出 tracked 文件（天然排除 .git / .history / 未跟踪文件）
mkdir -p "$TARGET"
git -C "$TEMPLATE_DIR" archive --format=tar HEAD | tar -x -C "$TARGET"

# 2) 按需丢弃参考材料
if [[ "$NO_EXAMPLES" -eq 1 ]]; then
  rm -rf "$TARGET/_archive" "$TARGET/_examples"
fi

# 3) git init + 首提交
cd "$TARGET"
git init -b main >/dev/null
git add -A
git commit -q -m "init: $BASE (based on ai-project-template)"

# 4) 确保活跃账号为目标账号
ACTIVE="$(gh api user --jq .login 2>/dev/null || true)"
if [[ -n "$ACTIVE" && "$ACTIVE" != "$ACCOUNT" ]]; then
  echo "==> 切换 gh 活跃账号: $ACTIVE -> $ACCOUNT"
  gh auth switch -u "$ACCOUNT"
fi

# 5) 建远端私有仓库 + 推送
gh repo create "$ACCOUNT/$BASE" --private --source=. --remote=origin --push \
  --description "Derived from ai-project-template"

echo
echo "✅ 完成：$ACCOUNT/$BASE"
echo "后续："
echo "  cd \"$TARGET\""
echo "  填写 docs/00-scenario.md ~ 02-srs.md，再按 README 快速开始推进"
