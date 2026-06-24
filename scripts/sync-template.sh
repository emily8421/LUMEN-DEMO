#!/usr/bin/env bash
# sync-template.sh — 在派生项目里下行同步 ai-project-template 的方法论文件
#
# 用法（在派生项目根目录执行）:
#   bash scripts/sync-template.sh [--dry-run|--commit]
#     --dry-run  仅抓取并预览差异，不修改工作区、不 stage（默认）
#     --commit   抓取、覆盖、stage 并提交 "sync template vX.Y.Z"
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

# 兜底同步清单；优先读取模板远端 template-sync.json。
DEFAULT_SYNC_FILES=(
  "VERSION"
  "CHANGELOG.md"
  "MAINTAINERS.md"
  "template-sync.json"
  "ai/index.md"
  "ai/global-rules.md"
  "AGENTS.md"
  "CLAUDE.md"
  ".cursor/rules/project-rules.mdc"
  "SOP.md"
  "INIT-PROMPT.md"
  "CONTRIBUTING.md"
  "git-guide.md"
  "docs/README.md"
  "scripts/new-project.sh"
  "scripts/sync-template.sh"
  "scripts/sync-template.ps1"
  "scripts/check-template.sh"
  "scripts/check-template.ps1"
  "scripts/check-derived-sync.sh"
  "scripts/check-derived-sync.ps1"
  "scripts/collect-env.ps1"
)

SYNC_FILES=()

parse_sync_files_json() {
  sed -n '/"files"[[:space:]]*:[[:space:]]*\[/,/\]/ s/^[[:space:]]*"\([^"]\+\)"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p'
}

load_sync_files() {
  local ref="$1"
  SYNC_FILES=()

  if git cat-file -e "$ref:template-sync.json" 2>/dev/null; then
    while IFS= read -r file; do
      [[ -n "$file" ]] && SYNC_FILES+=("$file")
    done < <(git show "$ref:template-sync.json" | parse_sync_files_json)
  else
    SYNC_FILES=("${DEFAULT_SYNC_FILES[@]}")
  fi

  if [[ "${#SYNC_FILES[@]}" -eq 0 ]]; then
    echo "✗ 无法解析模板同步清单 template-sync.json" >&2
    exit 1
  fi
}

git rev-parse --is-inside-work-tree >/dev/null

echo "==> 抓取模板: $TEMPLATE_REMOTE (main)"
if ! git fetch --no-tags --depth=1 "$TEMPLATE_REMOTE" main; then
  echo "✗ 抓取失败。模板仓库是私有的——确保活跃 gh 账号有访问权限：" >&2
  echo "    gh auth switch -u emily8421" >&2
  exit 1
fi
REF="FETCH_HEAD"

# 自身更新保护：派生项目里的旧脚本可能漏同步新文件或不是真 dry-run。
# 因此先确认本地脚本与模板远端最新版一致；不一致时停止，让用户先 bootstrap 脚本。
if git cat-file -e "$REF:scripts/sync-template.sh" 2>/dev/null; then
  REMOTE_SCRIPT_HASH="$(git rev-parse "$REF:scripts/sync-template.sh")"
  LOCAL_SCRIPT_HASH="$(git hash-object --path=scripts/sync-template.sh scripts/sync-template.sh 2>/dev/null || true)"
  if [[ -z "$LOCAL_SCRIPT_HASH" || "$REMOTE_SCRIPT_HASH" != "$LOCAL_SCRIPT_HASH" ]]; then
    echo "✗ 本地 scripts/sync-template.sh 不是模板远端最新版，已停止同步。" >&2
    echo "  请先执行以下 bootstrap 步骤，单独提交脚本更新后，再重新运行本命令：" >&2
    echo "    git checkout FETCH_HEAD -- scripts/sync-template.sh" >&2
    echo "    git add scripts/sync-template.sh" >&2
    echo "    git commit -m \"chore: bootstrap latest sync script\"" >&2
    exit 1
  fi
fi

load_sync_files "$REF"

# 解析模板版本号（用于提交信息）
VERSION="$(git show "$REF:VERSION" 2>/dev/null | tr -d '[:space:]' || true)"
if [[ -z "$VERSION" ]]; then
  LINE="$(git show "$REF:ai/global-rules.md" 2>/dev/null | grep -E '模板版本|全局规则版本' | head -1 || true)"
  VERSION="$(printf '%s' "$LINE" | grep -oE 'v[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || true)"
fi
[[ -n "$VERSION" ]] || VERSION="unknown"

echo "==> 模板版本: $VERSION"
echo "==> 同步文件:"

remote_file_matches_local() {
  local file="$1"
  local remote_hash
  local local_hash

  remote_hash="$(git rev-parse "$REF:$file")"
  local_hash="$(git hash-object --path="$file" "$file" 2>/dev/null || true)"
  [[ -n "$local_hash" && "$remote_hash" == "$local_hash" ]]
}

show_local_to_template_stat() {
  local file="$1"
  local tmp_dir
  local local_file
  local remote_file

  tmp_dir="$(mktemp -d)"
  local_file="$tmp_dir/local/$file"
  remote_file="$tmp_dir/template/$file"
  mkdir -p "$(dirname "$local_file")"
  mkdir -p "$(dirname "$remote_file")"
  git show "$REF:$file" > "$remote_file"

  if [[ -f "$file" ]]; then
    cp "$file" "$local_file"
    git diff --no-index --stat -- "$local_file" "$remote_file" || true
  else
    git diff --no-index --stat -- /dev/null "$remote_file" | sed "s#${tmp_dir//\/\\}/##g" || true
  fi

  rm -rf "$tmp_dir"
}

if [[ "$MODE" == "--dry-run" ]]; then
  for f in "${SYNC_FILES[@]}"; do
    if git cat-file -e "$REF:$f" 2>/dev/null; then
      if remote_file_matches_local "$f"; then
        echo "    = $f（无差异）"
      else
        echo "    Δ $f"
      fi
    else
      echo "    · $f （模板无此文件，跳过）"
    fi
  done

  echo
  echo "ℹ️  dry-run：仅预览，未修改工作区、未 stage。差异统计："
  echo "   方向：本地当前文件 -> 模板 $VERSION（即执行 --commit 后的变化）"
  for f in "${SYNC_FILES[@]}"; do
    if git cat-file -e "$REF:$f" 2>/dev/null; then
      if ! remote_file_matches_local "$f"; then
        show_local_to_template_stat "$f"
      fi
    fi
  done
  echo "   确认后执行: bash scripts/sync-template.sh --commit"
else
  UPDATED_FILES=()
  for f in "${SYNC_FILES[@]}"; do
    if git cat-file -e "$REF:$f" 2>/dev/null; then
      git checkout "$REF" -- "$f"
      git add "$f"
      UPDATED_FILES+=("$f")
      echo "    ✓ $f"
    else
      echo "    · $f （模板无此文件，跳过）"
    fi
  done

  echo
  if git diff --quiet HEAD -- "${UPDATED_FILES[@]}"; then
    echo "ℹ️  无需提交：同步文件与模板一致。"
    exit 0
  fi

  git commit -q -m "sync template $VERSION from ai-project-template" -- "${UPDATED_FILES[@]}"
  echo "✅ 已提交：sync template $VERSION"
  echo "   推送: git push"
fi
