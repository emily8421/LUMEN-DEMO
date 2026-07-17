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
    TEMPLATE-BASE.md) return 0 ;;   # 普通派生项目路线 A：继承模板版本记录，由 sync-template --preserve-project-version 维护
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

if [[ -n "$(git status --porcelain | grep -v '^??')" ]]; then
  fail "工作区有已跟踪改动未提交；请先确认，避免把同步校验与项目改动混在一起（未跟踪项目内容不阻塞）"
else
  pass "工作区干净（未跟踪项目内容不阻塞）"
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
echo "==> 正在验证的同步提交"
git show --name-only --stat --oneline --no-renames "$COMMIT"
echo

mapfile -t CHANGED_FILES < <(git diff-tree --no-commit-id --name-only -r "$COMMIT")

if [[ "${#CHANGED_FILES[@]}" -eq 0 ]]; then
  fail "提交 $COMMIT 未包含文件变更"
fi

parent_count="$(git rev-list --parents -n 1 "$COMMIT" 2>/dev/null | awk '{ print NF - 1 }')"
if [[ "$COMMIT" == "HEAD" && "${parent_count:-0}" -gt 1 ]]; then
  echo "ℹ️  HEAD 是 merge commit。若这是模板同步 PR 合并后的提交，请显式传入实际同步提交："
  echo "    bash scripts/check-derived-sync.sh <sync-commit>"
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
echo "==> 根 README 模板版本号一致性（非阻断）"
if [[ -f "TEMPLATE-BASE.md" ]]; then
  LINEAGE_ROLE=""
  lineage_val="$(grep -E '^\- Lineage type:' TEMPLATE-BASE.md | head -1 | sed -E 's/^\- Lineage type:[[:space:]]*//' | sed -E 's/[[:space:]]*$//' || true)"
  case "$lineage_val" in
    "ordinary derived project") LINEAGE_ROLE="ordinary" ;;
    "domain template") LINEAGE_ROLE="domain" ;;
    "")
      if grep -qi 'ordinary derived project' TEMPLATE-BASE.md; then LINEAGE_ROLE="ordinary"
      elif grep -qi 'domain template' TEMPLATE-BASE.md; then LINEAGE_ROLE="domain"; fi
      ;;
  esac
  if [[ "$LINEAGE_ROLE" == "domain" ]]; then
    echo "ℹ️  检测到领域版 TEMPLATE-BASE.md（Lineage type: domain template）：VERSION / CHANGELOG 属于领域模板自身；继承母模板版本以 TEMPLATE-BASE.md 为准，跳过 README ↔ VERSION 模板版本一致性检查。"
  else
    echo "ℹ️  检测到 TEMPLATE-BASE.md：按普通派生项目双版本模式，VERSION 属于项目自身版本；继承模板版本以 TEMPLATE-BASE.md 为准，跳过 README ↔ VERSION 模板版本一致性检查。"
  fi
  if grep -qE '^\- Current synced template version:[[:space:]]*v[0-9]+\.[0-9]+\.[0-9]+' TEMPLATE-BASE.md; then
    pass "TEMPLATE-BASE.md 记录当前同步模板版本"
  else
    fail "TEMPLATE-BASE.md 缺少 Current synced template version"
  fi
  if [[ "$LINEAGE_ROLE" == "domain" ]]; then
    if grep -qE '^\- Domain standards scope:' TEMPLATE-BASE.md; then
      pass "TEMPLATE-BASE.md 记录领域标准件范围（领域版）"
    else
      fail "领域版 TEMPLATE-BASE.md 缺少 Domain standards scope"
    fi
  fi
elif [[ -f "VERSION" && -f "README.md" ]]; then
  cur_ver="$(tr -d '[:space:]' < VERSION)"
  readme_ver="$(grep -E '当前|已同步' README.md | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | tail -1 || true)"
  if [[ -z "$readme_ver" ]]; then
    echo "ℹ️  README 未声明当前模板版本号，跳过（README 不强制写版本号）"
  elif [[ "$readme_ver" != "$cur_ver" ]]; then
    echo "⚠️  README 模板版本声明 $readme_ver 与 VERSION $cur_ver 不一致，请人工核对（非阻断，不计入失败）"
  else
    echo "✓ README 模板版本声明 $readme_ver 与 VERSION 一致"
  fi
else
  echo "ℹ️  缺少 VERSION 或 README.md，跳过版本号一致性检查"
fi

echo
echo "==> 派生项目版本机制启用状态（非阻断）"
# 复用前段 LINEAGE_ROLE 判定；前段无 TEMPLATE-BASE.md 时该变量未定义，兜底为空按普通派生项目处理。
LINEAGE_ROLE="${LINEAGE_ROLE:-}"
if [[ "$LINEAGE_ROLE" == "domain" ]]; then
  echo "ℹ️  领域模板（domain lineage）：VERSION / CHANGELOG 由领域模板自身治理，跳过版本机制启用状态检测。"
else
  main_signal_ok=false
  aux_signal_ok=false
  if [[ -f ".github/workflows/project-check.yml" ]] && grep -q "Check project version consistency" ".github/workflows/project-check.yml"; then
    main_signal_ok=true
  fi
  if [[ -f "ai/project-rules.md" ]] && grep -q "项目版本管理" "ai/project-rules.md"; then
    aux_signal_ok=true
  fi
  if $main_signal_ok && $aux_signal_ok; then
    pass "派生项目版本机制已启用（project-check.yml 含版本一致性校验 + ai/project-rules.md 含「项目版本管理」规则）"
  elif $main_signal_ok; then
    echo "⚠️  版本机制主信号在（project-check.yml 校验 VERSION↔CHANGELOG）但辅信号缺：ai/project-rules.md 未含「项目版本管理」规则。建议补 §2.8 明确 PATCH/MINOR/MAJOR 语义（非阻断，不计入失败）。"
  elif $aux_signal_ok; then
    echo "⚠️  版本机制辅信号在（ai/project-rules.md 含「项目版本管理」）但主信号缺：.github/workflows/project-check.yml 未含「Check project version consistency」校验。建议补 CI 校验防 VERSION/CHANGELOG 漂移（非阻断，不计入失败）。"
  else
    echo "⚠️  派生项目版本机制未启用：project-check.yml 缺「Check project version consistency」且 ai/project-rules.md 缺「项目版本管理」。建议按 ai/prompts/maintainers/15-post-sync-cleanup.md 审计版本机制启用状态（非阻断，不计入失败）。"
  fi
fi

echo
if [[ "$FAILURES" -eq 0 ]]; then
  echo "✅ 派生项目同步边界检查通过。"
  echo "   下一步：若需要整理项目内容，另开分支执行 ai/prompts/maintainers/15-post-sync-cleanup.md，先审计并输出迁移计划。"
else
  echo "❌ 派生项目同步边界检查失败：$FAILURES 项。" >&2
  echo "   见上方 ✗ 标注的失败项；另：派生同步验收用 check-derived-sync，不要用 check-template（模板自检）。" >&2
  echo "   若 HEAD 是 PR merge commit，请改传实际同步提交：scripts/check-derived-sync.sh <sync-commit>。" >&2
  exit 1
fi
