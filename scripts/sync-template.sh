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
  "template-docs/beginner-guide.md"
  "template-docs/env-setup.md"
  "template-docs/ai-cli-setup.md"
  "template-docs/smoke-test.md"
  "template-docs/smoke-test-report-template.md"
  "template-docs/template-methodology.md"
  "template-docs/session-handoff.example.md"
  "template-docs/derived-sync-report-template.md"
  "template-sync.json"
  "ai/index.md"
  "ai/global-rules.md"
  "ai/document-lifecycle-rules.md"
  "ai/session-rules.md"
  "ai/doc-standards/README.md"
  "ai/commands/README.md"
  "ai/commands/sync-methodology.md"
  "ai/commands/post-sync-cleanup.md"
  "ai/commands/docs-system-audit.md"
  "ai/commands/template-proposal-summary.md"
  "ai/commands/generate-docs.md"
  "ai/commands/review-inputs.md"
  "ai/commands/project-review.md"
  "ai/commands/edit-single-doc.md"
  "ai/commands/sync-docs-from-code.md"
  "ai/commands/phase-upgrade.md"
  "ai/commands/docs-checklist.md"
  "ai/commands/run-dev-task.md"
  "ai/commands/fix-bug.md"
  "ai/commands/sprint-summary.md"
  "ai/commands/collect-env.md"
  "ai/commands/new-project.md"
  "ai/commands/commit-message.md"
  "AGENTS.md"
  "CLAUDE.md"
  ".cursor/rules/project-rules.mdc"
  "SOP.md"
  "INIT-PROMPT.md"
  "ai/prompts/dev/02-run-task.md"
  "ai/prompts/dev/05-fix-bug.md"
  "ai/prompts/dev/09-sprint-summary.md"
  "ai/prompts/docs/00-generate-or-complete-docs.md"
  "ai/prompts/docs/01-review-inputs.md"
  "ai/prompts/docs/04-edit-single-doc.md"
  "ai/prompts/docs/07-sync-docs-from-code.md"
  "ai/prompts/git/06-commit-message.md"
  "ai/prompts/maintainers/11-template-proposal-summary.md"
  "ai/prompts/maintainers/12-sync-template.md"
  "ai/prompts/maintainers/15-post-sync-cleanup.md"
  "ai/prompts/planning/08-phase-upgrade.md"
  "ai/prompts/README.md"
  "ai/prompts/review/03-project-review.md"
  "ai/prompts/review/10-docs-checklist.md"
  "ai/prompts/review/16-docs-system-audit.md"
  "ai/prompts/setup/13-collect-env.md"
  "ai/prompts/setup/14-new-project.md"
  "CONTRIBUTING.md"
  "git-guide.md"
  "docs/README.md"
  "docs/inputs/README.md"
  "scripts/new-project.sh"
  "scripts/sync-template.sh"
  "scripts/sync-template.ps1"
  "scripts/check-template.sh"
  "scripts/check-template.ps1"
  "scripts/check-derived-sync.sh"
  "scripts/check-derived-sync.ps1"
  "scripts/collect-env.ps1"
  "scripts/check-prereqs.ps1"
  "scripts/bootstrap-dev-env.ps1"
  "scripts/sync-all-derived.sh"
  "scripts/e2e-sync-check.sh"
  "template-docs/e2e-regression-checklist.md"
  "template-docs/e2e-report-template.md"
  "ai/commands/submit-proposal.md"
  "ai/commands/submit-feedback.md"
  "ai/prompts/maintainers/17-submit-proposal.md"
  "ai/prompts/maintainers/18-submit-feedback.md"
)

# doc-standards 规范镜像：把模板 docs/00-09 撰写规范镜像到派生项目 ai/doc-standards/。
# 与 SYNC_FILES 不同，这是 src(docs/0X) != dest(ai/doc-standards/0X) 的专用镜像步骤；
# 产物是只读 AI 文档标准，不是项目事实，绝不覆盖派生项目自己的 docs/0X。
DOC_STANDARD_DOCS=(
  "docs/00-scenario.md"
  "docs/01-user-requirements.md"
  "docs/02-srs.md"
  "docs/03-prd.md"
  "docs/04-architecture.md"
  "docs/05-tech-spec.md"
  "docs/06-db-design.md"
  "docs/07-api-spec.md"
  "docs/08-dev-plan.md"
  "docs/09-verification.md"
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
  echo "    gh auth status" >&2
  echo "    gh auth switch -u <有模板仓库访问权限的账号>" >&2
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

  echo
  echo "==> doc-standards 规范镜像（docs/00-09 → ai/doc-standards/，只读规范，不覆盖项目事实）:"
  for src in "${DOC_STANDARD_DOCS[@]}"; do
    dest="ai/doc-standards/$(basename "$src")"
    if git cat-file -e "$REF:$src" 2>/dev/null; then
      if [[ -f "$dest" ]]; then
        remote_hash="$(git rev-parse "$REF:$src")"
        local_hash="$(git hash-object --path="$dest" "$dest" 2>/dev/null || true)"
        if [[ -n "$local_hash" && "$remote_hash" == "$local_hash" ]]; then
          echo "    = $dest（无差异）"
        else
          echo "    Δ $dest（规范镜像）"
        fi
      else
        echo "    Δ $dest（新增规范镜像）"
      fi
    else
      echo "    · $dest（模板无 $src，跳过）"
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

  echo "==> doc-standards 规范镜像（docs/00-09 → ai/doc-standards/，只读规范，不覆盖项目事实）:"
  for src in "${DOC_STANDARD_DOCS[@]}"; do
    dest="ai/doc-standards/$(basename "$src")"
    if git cat-file -e "$REF:$src" 2>/dev/null; then
      mkdir -p ai/doc-standards
      git show "$REF:$src" > "$dest"
      git add "$dest"
      UPDATED_FILES+=("$dest")
      echo "    ✓ $dest（规范镜像）"
    else
      echo "    · $dest（模板无 $src，跳过）"
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
