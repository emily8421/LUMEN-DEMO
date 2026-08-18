#!/usr/bin/env bash
# Sync notice: 本文件由 ai-project-template 模板同步维护，派生项目同步时会被覆盖；不应直接修改，通用改进请经 _proposals/ 回流模板仓库。
# sync-template.sh — 在派生项目里下行同步 ai-project-template 的方法论文件
#
# 用法（在派生项目根目录执行）:
#   bash scripts/sync-template.sh [--dry-run [--no-stat]|--summary|--commit] [--preserve-project-version|--domain-template]
#     --dry-run  仅抓取并预览差异，不修改工作区、不 stage（默认）
#     --no-stat  与 --dry-run 搭配，跳过逐文件 diff stat，仅输出轻量摘要
#     --summary  等价于 --dry-run --no-stat
#     --commit   抓取、覆盖、stage 并提交 "sync template vX.Y.Z"
#     --preserve-project-version
#                普通派生项目路线 A：保留项目自己的 VERSION/CHANGELOG/CHANGELOG-PLAIN，改写 TEMPLATE-BASE.md 记录继承的模板版本
#                若仓库已存在 TEMPLATE-BASE.md，本模式会自动启用
#     --domain-template
#                领域模板角色（如 agent-system-template）：保留领域模板自己的 VERSION/CHANGELOG/CHANGELOG-PLAIN，
#                改写 TEMPLATE-BASE.md 为领域版（Lineage type: domain template，含领域标准件范围字段）
#                若仓库已存在领域版 TEMPLATE-BASE.md，本模式会自动启用；与 --preserve-project-version 互斥
#   环境变量:
#     TEMPLATE_REMOTE  模板远端（默认 https://github.com/emily8421/ai-project-template.git）
# 依赖: git（网络可达模板远端；模板私有，活跃 gh 账号须有访问权限）
set -euo pipefail

# MSYS PATH 自举守卫（MSYS_PATH_GUARD）：非登录 bash 或 PATH 被沙箱刮掉时，
# /usr/bin（dirname/grep/sed）与 /mingw64/bin（git）可能不在 PATH 上，导致
# 早期 dirname/sed/git 调用塌掉、后续雪崩。只用 bash 内建判定
# （command -v / [[ -d ]]），不依赖 uname 等外部工具——触发场景本身就是 /usr/bin 缺失。
# 三种 canonical 调用方式见 template-docs/env-setup.md §8.1。
if [[ -z "${MSYS_PATH_GUARD:-}" ]] && ! command -v dirname >/dev/null 2>&1; then
  for _guard_dir in /usr/bin /mingw64/bin /mingw32/bin; do
    [[ -d "$_guard_dir" ]] || continue
    case ":${PATH:-}:" in
      *":$_guard_dir:"*) ;;
      *) PATH="$_guard_dir:$PATH" ;;
    esac
  done
  export PATH MSYS_PATH_GUARD=1
fi

usage() {
  echo "用法: bash scripts/sync-template.sh [--dry-run [--no-stat]|--summary|--commit] [--preserve-project-version|--domain-template]" >&2
  echo "  --preserve-project-version（普通派生项目）与 --domain-template（领域模板）互斥，二选一" >&2
}

MODE="--dry-run"
MODE_EXPLICIT=0
SKIP_STAT=0
PRESERVE_PROJECT_VERSION=0
DOMAIN_TEMPLATE_MODE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      if [[ "$MODE_EXPLICIT" -eq 1 && "$MODE" != "--dry-run" ]]; then
        usage
        exit 1
      fi
      MODE="--dry-run"
      MODE_EXPLICIT=1
      ;;
    --commit)
      if [[ "$MODE_EXPLICIT" -eq 1 && "$MODE" != "--commit" ]]; then
        usage
        exit 1
      fi
      MODE="--commit"
      MODE_EXPLICIT=1
      ;;
    --summary)
      if [[ "$MODE_EXPLICIT" -eq 1 && "$MODE" == "--commit" ]]; then
        usage
        exit 1
      fi
      MODE="--dry-run"
      MODE_EXPLICIT=1
      SKIP_STAT=1
      ;;
    --no-stat)
      SKIP_STAT=1
      ;;
    --preserve-project-version)
      PRESERVE_PROJECT_VERSION=1
      ;;
    --domain-template)
      DOMAIN_TEMPLATE_MODE=1
      ;;
    *)
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ "$PRESERVE_PROJECT_VERSION" -eq 1 && "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
  echo "✗ --preserve-project-version 与 --domain-template 互斥，请二选一" >&2
  usage
  exit 1
fi

if [[ "$MODE" == "--commit" && "$SKIP_STAT" -eq 1 ]]; then
  usage
  exit 1
fi

TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-https://github.com/emily8421/ai-project-template.git}"

# 兜底同步清单；优先读取模板远端 template-sync.json。
DEFAULT_SYNC_FILES=(
  "VERSION"
  "CHANGELOG.md"
  "CHANGELOG-PLAIN.md"
  "MAINTAINERS.md"
  "template-docs/beginner-guide.md"
  "template-docs/env-setup.md"
  "template-docs/ai-cli-setup.md"
  "template-docs/smoke-test.md"
  "template-docs/smoke-test-report-template.md"
  "template-docs/template-methodology.md"
  "template-docs/capability-packages.md"
  "template-docs/remote-ci-sop-profile.md"
  "template-docs/domain-derived-scenarios-template.md"
  "template-docs/glossary.md"
  "template-docs/docs-scaffold/README.md"
  "template-docs/docs-scaffold/inputs/input-review-report.md"
  "template-docs/docs-scaffold/vision/product-vision.md"
  "template-docs/docs-scaffold/00-scenario.md"
  "template-docs/docs-scaffold/01-user-requirements.md"
  "template-docs/docs-scaffold/02-srs.md"
  "template-docs/docs-scaffold/03-prd.md"
  "template-docs/docs-scaffold/04-architecture.md"
  "template-docs/docs-scaffold/05-tech-spec.md"
  "template-docs/docs-scaffold/06-db-design.md"
  "template-docs/docs-scaffold/07-api-spec.md"
  "template-docs/docs-scaffold/08-dev-plan.md"
  "template-docs/docs-scaffold/09-verification.md"
  "template-docs/docs-scaffold/design/subsystem-design.md"
  "template-docs/docs-scaffold/design/frontend-experience-brief.md"
  "template-docs/docs-scaffold/design/frontend-interaction.md"
  "template-docs/docs-scaffold/design/ui-prototype-strategy.md"
  "template-docs/docs-scaffold/decisions/ADR-template.md"
  "template-docs/docs-scaffold/research/docs-open-items.md"
  "template-docs/docs-scaffold/research/ui-prototype-exploration.md"
  "template-docs/docs-scaffold/research/tech-env-evaluation.md"
  "template-docs/session-handoff.example.md"
  "template-docs/derived-sync-report-template.md"
  "template-docs/frontend-experience-brief-template.md"
  "template-docs/ui-brief-intake-template.md"
  "template-docs/frontend-ui-reference-analysis-template.md"
  "template-docs/examples/extract-diagrams.mjs"
  "template-docs/ui-knowledge/README.md"
  "template-docs/ui-knowledge/source-registry.md"
  "template-docs/ui-knowledge/visual-patterns.md"
  "template-docs/ui-knowledge/interaction-patterns.md"
  "template-docs/web-fullstack-profile.md"
  "template-docs/web-app-scaffold-experiment.md"
  "template-docs/ui-prototype-strategy-template.md"
  "template-sync.json"
  "ai/index.md"
  "ai/rules-core.md"
  "ai/global-rules.md"
  "ai/document-lifecycle-rules.md"
  "ai/implementation-lifecycle-rules.md"
  "ai/session-rules.md"
  "ai/doc-standards/README.md"
  "ai/doc-standards/00-scenario.md"
  "ai/doc-standards/01-user-requirements.md"
  "ai/doc-standards/02-srs.md"
  "ai/doc-standards/03-prd.md"
  "ai/doc-standards/04-architecture.md"
  "ai/doc-standards/05-tech-spec.md"
  "ai/doc-standards/06-db-design.md"
  "ai/doc-standards/07-api-spec.md"
  "ai/doc-standards/08-dev-plan.md"
  "ai/doc-standards/09-verification.md"
  "ai/doc-standards/design-doc.md"
  "ai/doc-standards/frontend-interaction.md"
  "ai/doc-standards/ui-prototype-strategy.md"
  "ai/doc-standards/project-rules.md"
  "ai/commands/README.md"
  "ai/commands/sync-methodology.md"
  "ai/commands/post-sync-cleanup.md"
  "ai/commands/docs-system-audit.md"
  "ai/commands/template-proposal-summary.md"
  "ai/commands/domain-template-lab.md"
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
  "ai/prompts/planning/19-plan-phases-and-sprints.md"
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
  "scripts/check-markdown-clean.ps1"
  "scripts/check-derived-sync.sh"
  "scripts/check-derived-sync.ps1"
  "scripts/check-github-context.ps1"
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
  "ai/prompts/maintainers/23-domain-template-lab.md"
)

# doc-standards 兼容镜像：历史保留入口；当前 00-09 均已升级为独立标准文件。
# 与 SYNC_FILES 不同，这是 src(docs/0X) != dest(ai/doc-standards/0X) 的专用镜像步骤；
# 00-09 已升级为独立标准文件，由 SYNC_FILES 同步，避免被项目模板骨架覆盖。
# 产物是只读 AI 文档标准，不是项目事实，绝不覆盖派生项目自己的 docs/0X。
DOC_STANDARD_DOCS=(
)

warn_derived_workflow_migration() {
  if [[ -f ".github/workflows/template-check.yml" ]]; then
    echo "⚠️  检测到 .github/workflows/template-check.yml。"
    echo "   该 workflow 通常属于模板仓自检入口；派生项目普通 PR 不应运行 scripts/check-template.sh。"
    echo "   建议迁移为派生项目版 .github/workflows/project-check.yml：普通 PR 仅跑 git diff --check，模板同步提交再跑 scripts/check-derived-sync.sh HEAD。"
    echo
  fi
}

SYNC_FILES=()

# 从 stdin（template-sync.json 内容）提取指定数组键（files_all / files_ordinary / files_domain / legacy files）的文件清单。
# 下划线在正则中是字面量：传 "files" 不误匹配 "files_all"。依赖每个数组 ] 独占行。
parse_sync_array() {
  local key="$1"
  sed -n "/\"${key}\"[[:space:]]*:[[:space:]]*\[/,/\]/ s/^[[:space:]]*\"\([^\"]\+\)\"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p"
}

load_sync_files() {
  local ref="$1"
  SYNC_FILES=()

  local -A seen=()
  local json_content="" has_files_all=0 file main_key route_key key

  if git cat-file -e "$ref:template-sync.json" 2>/dev/null; then
    json_content="$(git show "$ref:template-sync.json")"
    if printf '%s' "$json_content" | grep -q '"files_all"'; then has_files_all=1; fi
    # 主集：files_all（legacy "files" fallback）；路线补充：领域 → files_domain，普通 → files_ordinary
    if [[ "$has_files_all" -eq 1 ]]; then main_key="files_all"; else main_key="files"; fi
    if [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then route_key="files_domain"; else route_key="files_ordinary"; fi
    # 关联数组去重保序：先主集后路线组
    for key in "$main_key" "$route_key"; do
      while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        if [[ -z "${seen[$file]:-}" ]]; then seen["$file"]=1; SYNC_FILES+=("$file"); fi
      done < <(printf '%s' "$json_content" | parse_sync_array "$key")
    done
  else
    SYNC_FILES=("${DEFAULT_SYNC_FILES[@]}")
  fi

  if [[ "${#SYNC_FILES[@]}" -eq 0 ]]; then
    echo "✗ 无法解析模板同步清单 template-sync.json" >&2
    exit 1
  fi

  if [[ "$PRESERVE_PROJECT_VERSION" -eq 1 || "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
    local filtered=()
    local f
    for f in "${SYNC_FILES[@]}"; do
      case "$f" in
        VERSION|CHANGELOG.md|CHANGELOG-PLAIN.md)
          ;;
        *)
          filtered+=("$f")
          ;;
      esac
    done
    SYNC_FILES=("${filtered[@]}")
  fi
}

template_source_label() {
  case "$TEMPLATE_REMOTE" in
    https://github.com/emily8421/ai-project-template.git|git@github.com:emily8421/ai-project-template.git)
      echo "github.com/emily8421/ai-project-template"
      ;;
    *)
      echo "$TEMPLATE_REMOTE"
      ;;
  esac
}

extract_template_base_version() {
  [[ -f TEMPLATE-BASE.md ]] || return 0
  grep -Ei '^[[:space:]]*-[[:space:]]*(\*\*)?(base template version|base version)' TEMPLATE-BASE.md \
    | head -1 \
    | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' \
    | head -1 || true
}

extract_legacy_domain_standards_scope() {
  [[ -f TEMPLATE-BASE.md ]] || return 0
  awk '
    /^##[[:space:]]+(叠加的标准件范围|Domain Standards Scope)[[:space:]]*$/ { in_scope=1; next }
    /^##[[:space:]]+/ && in_scope { exit }
    in_scope && /^[[:space:]]*-[[:space:]]+/ {
      line=$0
      sub(/^[[:space:]]*-[[:space:]]+/, "", line)
      gsub(/[[:space:]]+/, " ", line)
      if (line != "") {
        items[++count]=line
      }
    }
    END {
      for (i=1; i<=count; i++) {
        printf "%s%s", (i == 1 ? "" : "；"), items[i]
      }
    }
  ' TEMPLATE-BASE.md
}

write_template_base() {
  local template_version="$1"
  local synced_at
  local project_version
  local base_version
  local source_label
  local existing_base_version

  synced_at="$(date +%Y-%m-%d)"
  project_version="$(sed '1s/^\xEF\xBB\xBF//' VERSION 2>/dev/null | tr -d '[:space:]' || true)"
  base_version="$template_version"
  if [[ -f TEMPLATE-BASE.md ]]; then
    existing_base_version="$(extract_template_base_version)"
    [[ -n "$existing_base_version" ]] && base_version="$existing_base_version"
  fi
  source_label="$(template_source_label)"

  cat > TEMPLATE-BASE.md <<EOF
# Template Base

> Records the upstream template lineage for this ordinary derived project. Do not use this file for domain-template inheritance metadata.

- Lineage type: ordinary derived project
- Template repository: $source_label
- Base template version: $base_version
- Current synced template version: $template_version
- Synced at: $synced_at
- Project version file: VERSION
- Project version at sync time: ${project_version:-unknown}

## Version Semantics

- \`VERSION\` is owned by this derived project and records the project version.
- \`CHANGELOG.md\` and \`CHANGELOG-PLAIN.md\` are owned by this derived project and record project evolution; template sync does not overwrite them.
- \`TEMPLATE-BASE.md\` records the inherited ai-project-template version used for methodology sync audit.
- \`upstream/CHANGELOG.md\` and \`upstream/CHANGELOG-PLAIN.md\` are generated read-only references for upstream ai-project-template release notes.
- Template sync commits keep the message format \`sync template $template_version from ai-project-template\`.

## Managed Files

- Files managed by template sync are listed in \`template-sync.json\` (synced from ai-project-template).
- Direct edits to those files are overwritten on the next template sync; propose reusable changes via \`_proposals/\`.
- Project-owned files (\`ai/project-rules.md\`, \`docs/\`, business code) are not in the sync list and are preserved.
EOF
}

write_domain_template_base() {
  local template_version="$1"
  local synced_at
  local domain_version
  local base_version
  local source_label
  local standards_scope
  local existing_scope
  local existing_base_version
  local legacy_scope

  synced_at="$(date +%Y-%m-%d)"
  domain_version="$(sed '1s/^\xEF\xBB\xBF//' VERSION 2>/dev/null | tr -d '[:space:]' || true)"
  base_version="$template_version"
  standards_scope="(TODO: 领域模板维护者填写叠加的领域标准件范围，例如 agent-system 的 planner/executor、tool permission、memory/state、eval、trace/replay、HITL)"
  if [[ -f TEMPLATE-BASE.md ]]; then
    existing_base_version="$(extract_template_base_version)"
    [[ -n "$existing_base_version" ]] && base_version="$existing_base_version"
    existing_scope="$(grep -E '^\- Domain standards scope:' TEMPLATE-BASE.md | head -1 | sed -E 's/^\- Domain standards scope:[[:space:]]*//' || true)"
    legacy_scope="$(extract_legacy_domain_standards_scope)"
    if [[ -n "$existing_scope" && "$existing_scope" != *TODO* ]]; then
      standards_scope="$existing_scope"
    elif [[ -n "$legacy_scope" ]]; then
      standards_scope="$legacy_scope"
    fi
  fi
  source_label="$(template_source_label)"

  cat > TEMPLATE-BASE.md <<EOF
# Template Base

> Records the upstream template lineage for this domain template (inherits ai-project-template methodology, adds domain-specific standards). Do not use this file for ordinary derived project metadata.

- Lineage type: domain template
- Template repository: $source_label
- Base template version: $base_version
- Current synced template version: $template_version
- Synced at: $synced_at
- Domain template version file: VERSION
- Domain template version at sync time: ${domain_version:-unknown}
- Domain standards scope: $standards_scope

## Version Semantics

- \`VERSION\` is owned by this domain template and records the domain template version.
- \`CHANGELOG.md\` and \`CHANGELOG-PLAIN.md\` are owned by this domain template and record domain template evolution; template sync does not overwrite them.
- \`TEMPLATE-BASE.md\` records the inherited ai-project-template version used for methodology sync audit.
- \`upstream/CHANGELOG.md\` and \`upstream/CHANGELOG-PLAIN.md\` are generated read-only references for upstream ai-project-template release notes.
- Template sync commits keep the message format \`sync template $template_version from ai-project-template\`.

## Managed Files

- Files managed by template sync are listed in \`template-sync.json\` (synced from ai-project-template).
- Direct edits to those files are overwritten on the next template sync; propose reusable changes via \`_proposals/\`.
- Domain-template-owned files (\`ai/project-rules.md\`, \`ai/domain-rules.md\`, \`docs/\`, business code) are not in the sync list and are preserved.
EOF
}

first_changelog_plain_version() {
  [[ -f CHANGELOG-PLAIN.md ]] || return 0
  grep -E '^## v[0-9]+\.[0-9]+\.[0-9]+（' CHANGELOG-PLAIN.md \
    | head -1 \
    | sed -E 's/^## (v[0-9]+\.[0-9]+\.[0-9]+).*/\1/' || true
}

warn_if_changelog_plain_needs_project_rewrite() {
  [[ "$PRESERVE_PROJECT_VERSION" -eq 1 || "$DOMAIN_TEMPLATE_MODE" -eq 1 ]] || return 0

  local owner_label="派生项目"
  [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]] && owner_label="领域模板"

  if [[ ! -f CHANGELOG-PLAIN.md ]]; then
    echo "⚠️  根 CHANGELOG-PLAIN.md 不存在；从本版起模板同步不会覆盖该文件，请补 $owner_label 自有大白话 changelog。"
    return 0
  fi

  local project_version
  local plain_version
  local template_hash
  local local_hash
  local reason=""

  project_version="$(sed '1s/^\xEF\xBB\xBF//' VERSION 2>/dev/null | tr -d '[:space:]' || true)"
  plain_version="$(first_changelog_plain_version)"
  template_hash="$(git rev-parse "$REF:CHANGELOG-PLAIN.md" 2>/dev/null || true)"
  local_hash="$(git hash-object --path=CHANGELOG-PLAIN.md CHANGELOG-PLAIN.md 2>/dev/null || true)"

  if [[ -n "$template_hash" && -n "$local_hash" && "$template_hash" == "$local_hash" ]]; then
    reason="内容与当前母模板 CHANGELOG-PLAIN.md 相同"
  elif [[ -n "$project_version" && -n "$plain_version" && "$plain_version" != "$project_version" ]]; then
    reason="顶部版本 $plain_version 与本地 VERSION $project_version 不一致"
  fi

  if [[ -n "$reason" ]]; then
    echo "⚠️  根 CHANGELOG-PLAIN.md 可能仍是母模板内容（$reason）。"
    echo "   从本版起模板同步会保留该文件，不再覆盖；请把它改写为 $owner_label 自有大白话 changelog。"
  fi
}

detect_lineage_role() {
  # 返回 ordinary / domain / 空（无 TEMPLATE-BASE.md 或无法判定）
  [[ -f TEMPLATE-BASE.md ]] || return 0
  local lineage
  lineage="$(grep -E '^\- Lineage type:' TEMPLATE-BASE.md | head -1 | sed -E 's/^\- Lineage type:[[:space:]]*//' | sed -E 's/[[:space:]]*$//' || true)"
  case "$lineage" in
    "ordinary derived project") echo "ordinary" ;;
    "domain template") echo "domain" ;;
    "")
      # v1.46.0 旧普通版无 Lineage type 字段，fallback 嗅探 header
      if grep -qi 'ordinary derived project' TEMPLATE-BASE.md; then
        echo "ordinary"
      elif grep -qi 'domain template' TEMPLATE-BASE.md; then
        echo "domain"
      fi
      ;;
  esac
}

git rev-parse --is-inside-work-tree >/dev/null

echo "==> 抓取模板: $TEMPLATE_REMOTE (main)"
if ! git fetch --no-tags --depth=1 "$TEMPLATE_REMOTE" main; then
  echo "✗ 抓取失败。常见两类原因：" >&2
  echo "  1) 模板仓库私有——确保活跃 gh 账号有访问权限：" >&2
  echo "       gh auth status" >&2
  echo "       gh auth switch -u <有模板仓库访问权限的账号>" >&2
  echo "  2) 网络——受限网络（如国内直连 GitHub）需走代理；git fetch/push 走 git 代理，gh 另带环境变量：" >&2
  echo "       git config --local http.proxy http://127.0.0.1:<代理端口>" >&2
  echo "       git config --local https.proxy http://127.0.0.1:<代理端口>" >&2
  echo "       # gh 不读 git http.proxy，命令需单独带：" >&2
  echo "       HTTPS_PROXY=http://127.0.0.1:<代理端口> HTTP_PROXY=http://127.0.0.1:<代理端口> gh ..." >&2
  echo "  直连症状：HTTPS 被 reset（curl 16 framing / curl 52 empty reply）。详见 git-guide.md §5.7。" >&2
  exit 1
fi
REF="FETCH_HEAD"

LINEAGE_ROLE="$(detect_lineage_role)"
if [[ "$PRESERVE_PROJECT_VERSION" -eq 0 && "$DOMAIN_TEMPLATE_MODE" -eq 0 ]]; then
  # 用户未显式指定角色：按 TEMPLATE-BASE.md 自动判定
  case "$LINEAGE_ROLE" in
    ordinary) PRESERVE_PROJECT_VERSION=1 ;;
    domain) DOMAIN_TEMPLATE_MODE=1 ;;
  esac
else
  # 用户显式指定角色：校验与现有文件不冲突
  if [[ "$LINEAGE_ROLE" == "domain" && "$PRESERVE_PROJECT_VERSION" -eq 1 ]]; then
    echo "✗ 显式 --preserve-project-version 与现有领域版 TEMPLATE-BASE.md 冲突" >&2
    echo "  该仓库 TEMPLATE-BASE.md 是领域模板（Lineage type: domain template）" >&2
    echo "  请改用 --domain-template，或先确认仓库角色" >&2
    exit 1
  fi
  if [[ "$LINEAGE_ROLE" == "ordinary" && "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
    echo "✗ 显式 --domain-template 与现有普通派生 TEMPLATE-BASE.md 冲突" >&2
    echo "  该仓库 TEMPLATE-BASE.md 是普通派生项目（Lineage type: ordinary derived project）" >&2
    echo "  请改用 --preserve-project-version，或先确认仓库角色" >&2
    exit 1
  fi
fi

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
if [[ "$PRESERVE_PROJECT_VERSION" -eq 1 ]]; then
  echo "==> 普通派生项目版本治理: 保留本地 VERSION/CHANGELOG/CHANGELOG-PLAIN，更新 TEMPLATE-BASE.md 为继承版本记录"
elif [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
  echo "==> 领域模板版本治理: 保留领域模板 VERSION/CHANGELOG/CHANGELOG-PLAIN，更新 TEMPLATE-BASE.md 为领域版继承版本记录"
fi
warn_derived_workflow_migration
if [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
  echo "==> 同步路线: 领域模板（files_all ∪ files_domain）"
else
  echo "==> 同步路线: 普通派生（files_all ∪ files_ordinary）"
fi
echo "==> 同步文件:"

remote_file_matches_local() {
  local file="$1"
  local remote_hash
  local local_hash

  remote_hash="$(git rev-parse "$REF:$file")"
  local_hash="$(git hash-object --path="$file" "$file" 2>/dev/null || true)"
  [[ -n "$local_hash" && "$remote_hash" == "$local_hash" ]]
}

should_sync_upstream_changelogs() {
  [[ "$PRESERVE_PROJECT_VERSION" -eq 1 || "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]
}

upstream_changelog_notice() {
  local source="$1"
  cat <<EOF
> Upstream template changelog reference: generated by scripts/sync-template from ai-project-template root $source.
> It records upstream template releases only. Do not edit this file in a derived project; the next template sync refreshes it. Project-owned history stays in root VERSION, CHANGELOG.md, and CHANGELOG-PLAIN.md; inherited template version is audited in TEMPLATE-BASE.md.

EOF
}

write_generated_upstream_changelog() {
  local source="$1"
  local output="$2"

  upstream_changelog_notice "$source" > "$output"
  git show "$REF:$source" >> "$output"
}

upstream_changelog_matches_local() {
  local source="$1"
  local dest="$2"
  local tmp_file
  local generated_hash
  local local_hash

  [[ -f "$dest" ]] || return 1
  tmp_file="$(mktemp)"
  write_generated_upstream_changelog "$source" "$tmp_file"
  generated_hash="$(git hash-object "$tmp_file")"
  local_hash="$(git hash-object "$dest" 2>/dev/null || true)"
  rm -f "$tmp_file"
  [[ -n "$local_hash" && "$generated_hash" == "$local_hash" ]]
}

show_local_to_template_stat() {
  local file="$1"
  local tmp_dir
  local local_file
  local remote_file
  # 仅 dry-run diff：临时关 autocrlf/safecrlf 消 Windows 临时文件 CRLF 噪音；
  # git -c 内联只作用于下面 git show/diff，不影响 --commit 的 git checkout 写入（v1.56.12）。
  local -a NOCRLF=(-c core.autocrlf=false -c core.safecrlf=false)

  tmp_dir="$(mktemp -d)"
  local_file="$tmp_dir/local/$file"
  remote_file="$tmp_dir/template/$file"
  mkdir -p "$(dirname "$local_file")"
  mkdir -p "$(dirname "$remote_file")"
  git "${NOCRLF[@]}" show "$REF:$file" > "$remote_file"

  if [[ -f "$file" ]]; then
    cp "$file" "$local_file"
    git "${NOCRLF[@]}" diff --no-index --stat -- "$local_file" "$remote_file" || true
  else
    git "${NOCRLF[@]}" diff --no-index --stat -- /dev/null "$remote_file" | sed "s#${tmp_dir//\/\\}/##g" || true
  fi

  rm -rf "$tmp_dir"
}

show_upstream_changelog_stat() {
  local source="$1"
  local dest="$2"
  local tmp_dir
  local local_file
  local generated_file
  local -a NOCRLF=(-c core.autocrlf=false -c core.safecrlf=false)

  tmp_dir="$(mktemp -d)"
  local_file="$tmp_dir/local/$dest"
  generated_file="$tmp_dir/template/$dest"
  mkdir -p "$(dirname "$local_file")"
  mkdir -p "$(dirname "$generated_file")"
  write_generated_upstream_changelog "$source" "$generated_file"

  if [[ -f "$dest" ]]; then
    cp "$dest" "$local_file"
    git "${NOCRLF[@]}" diff --no-index --stat -- "$local_file" "$generated_file" || true
  else
    git "${NOCRLF[@]}" diff --no-index --stat -- /dev/null "$generated_file" | sed "s#${tmp_dir//\/\\}/##g" || true
  fi

  rm -rf "$tmp_dir"
}

sync_upstream_changelog_references() {
  local source
  local dest

  for source in CHANGELOG.md CHANGELOG-PLAIN.md; do
    dest="upstream/$source"
    if git cat-file -e "$REF:$source" 2>/dev/null; then
      mkdir -p "$(dirname "$dest")"
      write_generated_upstream_changelog "$source" "$dest"
      git add "$dest"
      UPDATED_FILES+=("$dest")
      echo "    ✓ $dest（母模板 $source 继承参考）"
    else
      echo "    · $dest （模板无 $source，跳过）"
    fi
  done
}

summary_bucket_for() {
  local file="$1"
  if [[ "$file" == */* ]]; then
    echo "${file%%/*}/"
  else
    echo "./"
  fi
}

matches_risk_path() {
  local file="$1"
  case "$file" in
    README.md|ai/project-rules.md|docs/0[0-9]-*.md|frontend/*|backend/*|tests/*|docker/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

record_summary() {
  local file="$1"
  local status="$2"
  local bucket

  bucket="$(summary_bucket_for "$file")"
  SUMMARY_BUCKETS["$bucket"]=1
  case "$status" in
    added) SUMMARY_ADDED["$bucket"]=$(( ${SUMMARY_ADDED["$bucket"]:-0} + 1 )) ;;
    modified) SUMMARY_MODIFIED["$bucket"]=$(( ${SUMMARY_MODIFIED["$bucket"]:-0} + 1 )) ;;
    skipped) SUMMARY_SKIPPED["$bucket"]=$(( ${SUMMARY_SKIPPED["$bucket"]:-0} + 1 )) ;;
  esac
  SUMMARY_TOTAL["$status"]=$(( ${SUMMARY_TOTAL["$status"]:-0} + 1 ))

  if matches_risk_path "$file" && [[ "$status" != "unchanged" ]]; then
    RISK_HITS+=("$status $file")
  fi
}

print_summary() {
  local bucket

  echo "==> dry-run 轻量摘要（未输出逐文件 diff stat）"
  echo "   变更计数: added=${SUMMARY_TOTAL[added]:-0}, modified=${SUMMARY_TOTAL[modified]:-0}, deleted=${SUMMARY_TOTAL[deleted]:-0}, skipped=${SUMMARY_TOTAL[skipped]:-0}"
  echo "   按顶层目录聚合:"
  if [[ "${#SUMMARY_BUCKETS[@]}" -eq 0 ]]; then
    echo "    = 无变更"
  else
    for bucket in $(printf '%s\n' "${!SUMMARY_BUCKETS[@]}" | sort); do
      echo "    - $bucket added=${SUMMARY_ADDED["$bucket"]:-0}, modified=${SUMMARY_MODIFIED["$bucket"]:-0}, deleted=${SUMMARY_DELETED["$bucket"]:-0}, skipped=${SUMMARY_SKIPPED["$bucket"]:-0}"
    done
  fi

  echo "   风险路径命中:"
  if [[ "${#RISK_HITS[@]}" -eq 0 ]]; then
    echo "    = 无"
  else
    printf '    ! %s\n' "${RISK_HITS[@]}"
  fi
}

if [[ "$MODE" == "--dry-run" ]]; then
  declare -A SUMMARY_BUCKETS=()
  declare -A SUMMARY_ADDED=()
  declare -A SUMMARY_MODIFIED=()
  declare -A SUMMARY_DELETED=()
  declare -A SUMMARY_SKIPPED=()
  declare -A SUMMARY_TOTAL=()
  RISK_HITS=()

  for f in "${SYNC_FILES[@]}"; do
    if git cat-file -e "$REF:$f" 2>/dev/null; then
      if remote_file_matches_local "$f"; then
        echo "    = $f（无差异）"
      else
        echo "    Δ $f"
        if [[ -f "$f" ]]; then
          record_summary "$f" "modified"
        else
          record_summary "$f" "added"
        fi
      fi
    else
      echo "    · $f （模板无此文件，跳过）"
      record_summary "$f" "skipped"
    fi
  done

  echo
  echo "ℹ️  dry-run：仅预览，未修改工作区、未 stage。"
  echo "   方向：本地当前文件 -> 模板 $VERSION（即执行 --commit 后的变化）"
  if [[ "$PRESERVE_PROJECT_VERSION" -eq 1 || "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
    LINEAGE_MODE_LABEL="普通派生项目"
    [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]] && LINEAGE_MODE_LABEL="领域模板"
    if [[ -f TEMPLATE-BASE.md ]]; then
      echo "    Δ TEMPLATE-BASE.md（继承版本记录，$LINEAGE_MODE_LABEL）"
      record_summary "TEMPLATE-BASE.md" "modified"
    else
      echo "    Δ TEMPLATE-BASE.md（新增继承版本记录，$LINEAGE_MODE_LABEL）"
      record_summary "TEMPLATE-BASE.md" "added"
    fi
    warn_if_changelog_plain_needs_project_rewrite
  fi
  if should_sync_upstream_changelogs; then
    echo
    echo "==> upstream/ 母模板 changelog 继承参考:"
    for source in CHANGELOG.md CHANGELOG-PLAIN.md; do
      dest="upstream/$source"
      if git cat-file -e "$REF:$source" 2>/dev/null; then
        if upstream_changelog_matches_local "$source" "$dest"; then
          echo "    = $dest（无差异）"
        else
          echo "    Δ $dest（母模板 $source 继承参考）"
          if [[ -f "$dest" ]]; then
            record_summary "$dest" "modified"
          else
            record_summary "$dest" "added"
          fi
        fi
      else
        echo "    · $dest （模板无 $source，跳过）"
        record_summary "$dest" "skipped"
      fi
    done
  fi
  if [[ "$SKIP_STAT" -eq 1 ]]; then
    print_summary
  else
    echo "   差异统计："
    for f in "${SYNC_FILES[@]}"; do
      if git cat-file -e "$REF:$f" 2>/dev/null; then
        if ! remote_file_matches_local "$f"; then
          show_local_to_template_stat "$f"
        fi
      fi
    done
    if should_sync_upstream_changelogs; then
      for source in CHANGELOG.md CHANGELOG-PLAIN.md; do
        dest="upstream/$source"
        if git cat-file -e "$REF:$source" 2>/dev/null && ! upstream_changelog_matches_local "$source" "$dest"; then
          show_upstream_changelog_stat "$source" "$dest"
        fi
      done
    fi
  fi

  echo
  echo "==> doc-standards 兼容镜像（当前无 docs/* 镜像；00-09 用独立标准文件）:"
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
  if [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
    write_domain_template_base "$VERSION"
    git add TEMPLATE-BASE.md
    UPDATED_FILES+=("TEMPLATE-BASE.md")
    echo "    ✓ TEMPLATE-BASE.md（领域版继承版本记录）"
  elif [[ "$PRESERVE_PROJECT_VERSION" -eq 1 ]]; then
    write_template_base "$VERSION"
    git add TEMPLATE-BASE.md
    UPDATED_FILES+=("TEMPLATE-BASE.md")
    echo "    ✓ TEMPLATE-BASE.md（继承版本记录）"
  fi
  if should_sync_upstream_changelogs; then
    sync_upstream_changelog_references
  fi
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

  echo "==> doc-standards 兼容镜像（当前无 docs/* 镜像；00-09 用独立标准文件）:"
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

  warn_if_changelog_plain_needs_project_rewrite

  echo
  if git diff --quiet HEAD -- "${UPDATED_FILES[@]}"; then
    echo "ℹ️  无需提交：同步文件与模板一致。"
    exit 0
  fi

  git commit -q -m "sync template $VERSION from ai-project-template" -- "${UPDATED_FILES[@]}"
  echo "✅ 已提交：sync template $VERSION"
  echo "   推送: git push"
  echo
  echo "下一步（不要停在同步提交）："
  echo "  1. 运行派生边界检查: powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1"
  echo "  2. 在 AI 中执行: /run post-sync-cleanup"
  echo "  3. 在 AI 中执行: /run docs-system-audit（同步后审计模式）"
  echo "  4. 按项目技术栈运行测试 / lint / build；无法运行的记录为未验证项"
  echo "  5. 生成或更新同步运行记录: sync-records/template-sync/YYYY-MM-DD-sync-template-$VERSION.md"
  echo "     可参考: template-docs/derived-sync-report-template.md"
  if [[ "$PRESERVE_PROJECT_VERSION" -eq 1 ]]; then
    echo "  6. 核对项目自身版本仍记录在 VERSION，项目演进记录在 CHANGELOG.md / CHANGELOG-PLAIN.md；继承模板版本见 TEMPLATE-BASE.md，母模板发布参考见 upstream/CHANGELOG.md / upstream/CHANGELOG-PLAIN.md"
  elif [[ "$DOMAIN_TEMPLATE_MODE" -eq 1 ]]; then
    echo "  6. 核对领域模板版本仍记录在 VERSION、领域演进在 CHANGELOG.md / CHANGELOG-PLAIN.md；继承母模板版本见 TEMPLATE-BASE.md（领域版），母模板发布参考见 upstream/CHANGELOG.md / upstream/CHANGELOG-PLAIN.md"
  fi
fi
