#!/usr/bin/env bash
# check-derived-sync.sh — 检查派生项目最近一次模板同步提交是否越过同步边界
#
# 用法（在派生项目根目录执行）:
#   bash scripts/check-derived-sync.sh [commit]
#
# 说明: 本脚本只读取 git 状态与最近提交，不检查模板仓库完整结构，不修改工作区。
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

COMMIT="${1:-HEAD}"
FAILURES=0

pass() {
  echo "✓ $1"
}

fail() {
  echo "✗ $1" >&2
  FAILURES=$((FAILURES + 1))
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "存在: $file"
  else
    fail "缺失: $file"
  fi
}

extract_sync_files() {
  sed -n '/"files"[[:space:]]*:[[:space:]]*\[/,/\]/ s/^[[:space:]]*"\([^"]\+\)"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p' template-sync.json
}

is_sync_file() {
  local changed_file="$1"
  case "$changed_file" in
    ai/doc-standards/*) return 0 ;; # 模板 00-09 撰写规范镜像，由 sync-template 专用镜像步骤产生
    docs/_scaffold/*) return 0 ;;   # v1.18.x 旧规范镜像路径，迁移期兼容
  esac
  local sync_file
  for sync_file in "${SYNC_FILES[@]}"; do
    if [[ "$changed_file" == "$sync_file" ]]; then
      return 0
    fi
  done
  return 1
}

is_protected_project_file() {
  local changed_file="$1"
  case "$changed_file" in
    README.md|ai/project-rules.md|docs/0[0-9]-*|frontend/*|backend/*|tests/*|docker/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

echo "==> 派生项目同步边界检查"
echo "==> 当前状态"
git status --short --branch
echo

if [[ -n "$(git status --porcelain)" ]]; then
  fail "工作区不干净；请先确认未提交改动，避免把同步校验与项目改动混在一起"
else
  pass "工作区干净"
fi

require_file "template-sync.json"

if ! git rev-parse --verify "$COMMIT^{commit}" >/dev/null 2>&1; then
  fail "无法解析提交: $COMMIT"
fi

SYNC_FILES=()
if [[ -f template-sync.json ]]; then
  while IFS= read -r sync_file; do
    [[ -n "$sync_file" ]] && SYNC_FILES+=("$sync_file")
  done < <(extract_sync_files)
fi

if [[ "${#SYNC_FILES[@]}" -eq 0 ]]; then
  fail "无法从 template-sync.json 解析同步清单"
else
  pass "已读取同步清单: ${#SYNC_FILES[@]} 个文件"
fi

echo
echo "==> 最近同步提交"
git show --name-only --stat --oneline --no-renames "$COMMIT"
echo

mapfile -t CHANGED_FILES < <(git diff-tree --no-commit-id --name-only -r "$COMMIT")

if [[ "${#CHANGED_FILES[@]}" -eq 0 ]]; then
  fail "提交 $COMMIT 未包含文件变更"
fi

subject="$(git log -1 --format=%s "$COMMIT" 2>/dev/null || true)"
if [[ "$subject" =~ ^sync[[:space:]]template[[:space:]]v[0-9]+\.[0-9]+\.[0-9]+[[:space:]]from[[:space:]]ai-project-template$ ]]; then
  pass "提交信息是模板同步提交"
else
  fail "提交信息不像模板同步提交: $subject"
fi

for changed_file in "${CHANGED_FILES[@]}"; do
  if is_sync_file "$changed_file"; then
    pass "同步清单内变更: $changed_file"
  else
    fail "同步清单外变更: $changed_file"
  fi

  if is_protected_project_file "$changed_file"; then
    fail "疑似项目专属文件被同步提交修改: $changed_file"
  fi
done

echo
if [[ "$FAILURES" -eq 0 ]]; then
  echo "✅ 派生项目同步边界检查通过。"
  echo "   下一步：若需要整理项目内容，另开分支执行 ai/prompts/maintainers/15-post-sync-cleanup.md，先审计并输出迁移计划。"
else
  echo "❌ 派生项目同步边界检查失败：$FAILURES 项。" >&2
  echo "   请不要把 scripts/check-template.sh/.ps1 作为派生项目验收；它是模板仓库完整性自检。" >&2
  exit 1
fi
