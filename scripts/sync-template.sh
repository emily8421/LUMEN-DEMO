#!/usr/bin/env bash
# sync-template.sh — 在派生项目里下行同步 ai-project-template 的方法论文件
#
# 用法（在派生项目根目录执行）:
#   bash scripts/sync-template.sh [--dry-run|--commit]
#     --dry-run  仅抓取并 stage、显示差异，不提交（默认）
#     --commit   抓取、覆盖、stage 并提交 "sync template vX.Y"
#   环境变量:
#     TEMPLATE_REMOTE  模板远端（默认 https://github.com/emily8421/ai-project-template.git）
# 依赖: git（网络可达模板远端；模板私有，活跃 gh 账号须有访问权限）
set -euo pipefail

MODE="--dry-run"
if [[ $# -gt 0 ]]; then
  case "$1" in
    --dry-run|--commit) MODE="$1";;
    *) echo "用法: bash scripts/sync-template.sh [--dry-run|--commit]" >&2; exit 1;;
  esac
fi

TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-https://github.com/emily8421/ai-project-template.git}"

# 同步清单（与 README「方法论同步」单一来源；项目专属的 project-rules 不在此列）
SYNC_FILES=(
  "ai/global-rules.md"
  "CONTRIBUTING.md"
  "docs/git-guide.md"
  "scripts/new-project.sh"
  "scripts/sync-template.sh"
)

git rev-parse --is-inside-work-tree >/dev/null

echo "==> 抓取模板: $TEMPLATE_REMOTE (main)"
if ! git fetch --no-tags --depth=1 "$TEMPLATE_REMOTE" main; then
  echo "✗ 抓取失败。模板仓库是私有的——确保活跃 gh 账号有访问权限：" >&2
  echo "    gh auth switch -u emily8421" >&2
  exit 1
fi
REF="FETCH_HEAD"

# 解析版本号（用于提交信息）
LINE="$(git show "$REF:ai/global-rules.md" 2>/dev/null | grep '模板版本' | head -1 || true)"
VERSION="$(printf '%s' "$LINE" | grep -oE 'v[0-9]+\.[0-9]+' | head -1 || true)"
[[ -n "$VERSION" ]] || VERSION="unknown"

echo "==> 模板版本: $VERSION"
echo "==> 同步文件:"

for f in "${SYNC_FILES[@]}"; do
  if git cat-file -e "$REF:$f" 2>/dev/null; then
    git checkout "$REF" -- "$f"
    echo "    ✓ $f"
  else
    echo "    · $f （模板无此文件，跳过）"
  fi
done

echo
if [[ "$MODE" == "--commit" ]]; then
  git commit -q -m "sync template $VERSION from ai-project-template"
  echo "✅ 已提交：sync template $VERSION"
  echo "   推送: git push"
else
  echo "ℹ️  dry-run：已 stage，未提交。差异预览："
  git diff --cached --stat || true
  echo "   确认后执行: bash scripts/sync-template.sh --commit"
fi
