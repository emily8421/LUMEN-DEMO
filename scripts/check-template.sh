#!/usr/bin/env bash
# check-template.sh — 检查 ai-project-template 的关键入口、文档骨架与同步清单是否自洽
#
# 用法:
#   bash scripts/check-template.sh
#
# 说明: 本脚本只读取文件并输出检查结果，不修改工作区。
#
# 结构:
#   1. 基础 helper：文件 / 目录 / 内容断言。
#   2. 专项检查函数：复杂或容易增长的检查主题。
#   3. 主流程：按入口、文档、治理、脚本、同步清单、样例分组调度。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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

require_contains() {
  local file="$1"
  local pattern="$2"
  local message="$3"
  if [[ ! -f "$file" ]]; then
    fail "$message（文件缺失: $file）"
  elif grep -Eq -- "$pattern" "$file"; then
    pass "$message"
  else
    fail "$message"
  fi
}

require_dir() {
  local dir="$1"
  if [[ -d "$dir" ]]; then
    pass "存在目录: $dir"
  else
    fail "缺失目录: $dir"
  fi
}

require_absent_dir() {
  local dir="$1"
  if [[ -d "$dir" ]]; then
    fail "不应存在目录: $dir"
  else
    pass "目录已清理: $dir"
  fi
}

require_absent_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    fail "不应存在文件: $file"
  else
    pass "文件已省略: $file"
  fi
}

require_absent_contains() {
  local file="$1"
  local pattern="$2"
  local message="$3"
  if [[ ! -f "$file" ]]; then
    fail "$message（文件缺失: $file）"
  elif grep -Eq -- "$pattern" "$file"; then
    fail "$message（仍含应收敛内容）"
  else
    pass "$message"
  fi
}

require_files() {
  local file
  for file in "$@"; do
    require_file "$file"
  done
}

extract_index_rules() {
  grep -E '^- ai/.+\.md$' ai/index.md | sed 's/^- //'
}

extract_sync_files() {
  sed -n '/"files"[[:space:]]*:[[:space:]]*\[/,/\]/ s/^[[:space:]]*"\([^"]\+\)"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p' template-sync.json
}

require_sync_notice() {
  local sync_file
  while IFS= read -r sync_file; do
    [[ -n "$sync_file" ]] || continue
    case "$sync_file" in
      *.md)
        require_contains "$sync_file" 'Sync notice' "$sync_file 包含同步覆盖说明"
        ;;
    esac
  done < <(extract_sync_files)

  require_contains "AGENTS.md" 'Sync notice' "AGENTS.md 包含入口同步说明"
  require_contains "CLAUDE.md" 'Sync notice' "CLAUDE.md 包含入口同步说明"
  require_contains ".cursor/rules/project-rules.mdc" 'Sync notice' "Cursor 规则包含入口同步说明"
}

require_changelog_current_version() {
  local version
  version="$(tr -d '\r\n[:space:]' < VERSION)"

  require_contains "CHANGELOG.md" "^## ${version//./\\.}（" "CHANGELOG 包含当前 VERSION: $version"

  local first_version
  first_version="$(grep -E '^## v[0-9]+\.[0-9]+\.[0-9]+（' CHANGELOG.md | head -n 1 | sed -E 's/^## (v[0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
  if [[ "$first_version" == "$version" ]]; then
    pass "CHANGELOG 最新三段式版本位于顶部: $version"
  else
    fail "CHANGELOG 最新三段式版本不在顶部（期望 $version，实际 ${first_version:-未找到}）"
  fi
}

require_changelog_semver_desc() {
  local previous_key=""
  local version key major minor patch
  local ok=1

  while IFS= read -r version; do
    IFS=. read -r major minor patch <<<"${version#v}"
    key="$(printf '%06d%06d%06d' "$major" "$minor" "$patch")"
    if [[ -n "$previous_key" && "$key" > "$previous_key" ]]; then
      fail "CHANGELOG 三段式版本未按降序排列: $version"
      ok=0
      break
    fi
    previous_key="$key"
  done < <(grep -E '^## v[0-9]+\.[0-9]+\.[0-9]+（' CHANGELOG.md | sed -E 's/^## (v[0-9]+\.[0-9]+\.[0-9]+).*/\1/')

  if [[ "$ok" -eq 1 ]]; then
    pass "CHANGELOG 三段式版本按降序排列"
  fi
}

require_example_common() {
  local example_dir="$1"
  require_dir "$example_dir"
  require_file "$example_dir/OVERVIEW.md"
  require_file "$example_dir/ai/project-rules.md"
  require_contains "$example_dir/ai/project-rules.md" '初始化必填检查' "$example_dir project-rules 含初始化必填检查"
  require_contains "$example_dir/ai/project-rules.md" 'AI修改确认规则' "$example_dir project-rules 含 AI 修改确认规则"
  require_contains "$example_dir/ai/project-rules.md" 'docs/README\.md' "$example_dir project-rules 含 docs 分区规则检查"
  require_contains "$example_dir/ai/project-rules.md" 'ai/prompts/docs/01-review-inputs\.md' "$example_dir project-rules 指向输入评审 Prompt"
  require_contains "$example_dir/ai/project-rules.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "$example_dir project-rules 指向文档生成 Prompt"
  require_file "$example_dir/docs/README.md"
  require_contains "$example_dir/docs/README.md" 'AI 新增文档规则' "$example_dir docs README 含 AI 新增文档规则"
  for docs_dir in design decisions research meetings archive; do
    require_dir "$example_dir/docs/$docs_dir"
  done
  require_file "$example_dir/docs/vision/product-vision.md"
}

require_example_docs() {
  local example_dir="$1"
  shift
  local doc
  for doc in "$@"; do
    require_file "$example_dir/docs/$doc"
    require_contains "$example_dir/docs/$doc" '^# ' "$example_dir/docs/$doc 含一级标题"
  done
}

require_example_deliverable_shape() {
  local example_dir="$1"
  require_contains "$example_dir/docs/03-prd.md" '交付物形态' "$example_dir PRD 含交付物形态"
  require_contains "$example_dir/docs/03-prd.md" '退出标准' "$example_dir PRD 含退出标准"
  require_contains "$example_dir/docs/09-verification.md" '交付物形态' "$example_dir 验证矩阵含交付物形态"
  require_contains "$example_dir/docs/09-verification.md" 'Phase1（Demo）' "$example_dir 验证范围含 Phase1 Demo"
}

require_sync_dry_run_direction() {
  local test_root
  local template_dir
  local derived_dir
  local output

  test_root="$(mktemp -d)"
  template_dir="$test_root/template"
  derived_dir="$test_root/derived"
  mkdir -p "$template_dir/scripts" "$template_dir/ai" "$template_dir/.cursor/rules" \
    "$derived_dir/scripts" "$derived_dir/ai" "$derived_dir/.cursor/rules"

  (
    cd "$template_dir"
    git init -b main >/dev/null
    cp "$ROOT/scripts/sync-template.sh" scripts/sync-template.sh
    cp "$ROOT/scripts/sync-template.ps1" scripts/sync-template.ps1
    cp "$ROOT/scripts/check-template.sh" scripts/check-template.sh
    cp "$ROOT/scripts/check-template.ps1" scripts/check-template.ps1
    cp "$ROOT/scripts/collect-env.ps1" scripts/collect-env.ps1
    printf 'v9.9.9\n' > VERSION
    cp "$ROOT/template-sync.json" template-sync.json
    printf '# index\n' > ai/index.md
    printf '# global\n' > ai/global-rules.md
    printf '# lifecycle\n' > ai/document-lifecycle-rules.md
    mkdir -p ai/prompts ai/doc-standards
    cp -R "$ROOT/ai/prompts/." ai/prompts/
    cp "$ROOT/ai/doc-standards/README.md" ai/doc-standards/README.md
    mkdir -p docs/inputs
    printf '# docs\n' > docs/README.md
    printf '# inputs\n' > docs/inputs/README.md
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
    printf 'sop\n' > SOP.md
    printf 'init\n' > INIT-PROMPT.md
    printf 'contrib\n' > CONTRIBUTING.md
    printf 'guide\n' > git-guide.md
    git add -A
    git -c user.name=test -c user.email=test@example.com commit -m init >/dev/null
  )

  if (
    cd "$derived_dir"
    git init -b main >/dev/null
    cp "$ROOT/scripts/sync-template.sh" scripts/sync-template.sh
    printf 'v0.0.1\n' > VERSION
    printf '# index\n' > ai/index.md
    printf '# old global\n' > ai/global-rules.md
    mkdir -p docs
    printf '# old docs\n' > docs/README.md
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
    printf 'old sop\n' > SOP.md
    printf 'old init\n' > INIT-PROMPT.md
    printf 'old contrib\n' > CONTRIBUTING.md
    printf 'old guide\n' > git-guide.md
    git add -A
    git -c user.name=test -c user.email=test@example.com commit -m init >/dev/null
    output="$(TEMPLATE_REMOTE="$template_dir" bash scripts/sync-template.sh --dry-run 2>&1)"
    if grep -Eq 'scripts/(check-template\.sh|collect-env\.ps1).*\|' <<<"$output" \
      && grep -Eq 'insertions?\(\+\)' <<<"$output" \
      && ! grep -Eq 'scripts/(check-template\.sh|collect-env\.ps1).*deletions?\(-\)' <<<"$output"; then
      exit 0
    fi
    printf '%s\n' "$output" >&2
    exit 1
  ); then
    pass "sync-template dry-run 对模板新增文件显示为新增"
  else
    fail "sync-template dry-run 对模板新增文件的方向错误"
  fi

  rm -rf "$test_root"
}

require_new_project_local_smoke() {
  local test_root
  local project_dir

  test_root="$(mktemp -d)"
  project_dir="$test_root/smoke-demo"

  if (
    cd "$test_root"
    GIT_AUTHOR_NAME=template-check \
      GIT_AUTHOR_EMAIL=template-check@example.com \
      GIT_COMMITTER_NAME=template-check \
      GIT_COMMITTER_EMAIL=template-check@example.com \
      bash "$ROOT/scripts/new-project.sh" smoke-demo --local --no-remote --no-examples >/dev/null
  ); then
    pass "new-project 本地-only 烟测可运行"
  else
    fail "new-project 本地-only 烟测失败"
    rm -rf "$test_root"
    return
  fi

  require_file "$project_dir/README.md"
  require_contains "$project_dir/README.md" 'docs/inputs/' "new-project 烟测 README 从 inputs 起步"
  require_contains "$project_dir/README.md" 'docs/env/local-env\.md' "new-project 烟测 README 提醒环境采集"
  require_contains "$project_dir/README.md" 'input-review-report\.md' "new-project 烟测 README 说明输入评审报告"
  require_contains "$project_dir/README.md" 'docs/vision/product-vision\.md' "new-project 烟测 README 说明 product-vision 生成结果"
  require_contains "$project_dir/README.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "new-project 烟测 README 指向多入口生成 Prompt"
  require_contains "$project_dir/README.md" '交付物形态：Demo / MVP / 产品' "new-project 烟测 README 提醒交付物形态"
  require_contains "$project_dir/README.md" 'Phase1 不默认等于 MVP' "new-project 烟测 README 避免 Phase1 默认 MVP"
  require_file "$project_dir/_proposals/README.md"
  require_file "$project_dir/scripts/collect-env.ps1"
  require_absent_dir "$project_dir/_examples"
  require_absent_dir "$project_dir/_archive"

  rm -rf "$test_root"
}

require_doc_standards_mirror() {
  local test_root template_dir derived_dir
  test_root="$(mktemp -d)"
  template_dir="$test_root/template"
  derived_dir="$test_root/derived"
  mkdir -p "$template_dir/scripts" "$template_dir/ai" "$template_dir/.cursor/rules" \
    "$template_dir/docs/inputs" \
    "$derived_dir/scripts" "$derived_dir/ai" "$derived_dir/.cursor/rules" "$derived_dir/docs"

  local d
  # 模板仓库：当前脚本 + template-sync.json + docs/00-09 规范骨架 + 最小入口
  (
    cd "$template_dir"
    git init -b main >/dev/null
    cp "$ROOT/scripts/sync-template.sh" scripts/sync-template.sh
    cp "$ROOT/scripts/sync-template.ps1" scripts/sync-template.ps1
    cp "$ROOT/scripts/check-template.sh" scripts/check-template.sh
    cp "$ROOT/scripts/check-template.ps1" scripts/check-template.ps1
    cp "$ROOT/scripts/check-derived-sync.sh" scripts/check-derived-sync.sh
    cp "$ROOT/scripts/check-derived-sync.ps1" scripts/check-derived-sync.ps1
    cp "$ROOT/scripts/collect-env.ps1" scripts/collect-env.ps1
    printf 'v9.9.9\n' > VERSION
    cp "$ROOT/template-sync.json" template-sync.json
    printf '# index\n' > ai/index.md
    printf '# global\n' > ai/global-rules.md
    printf '# lifecycle\n' > ai/document-lifecycle-rules.md
    mkdir -p ai/prompts
    cp -R "$ROOT/ai/prompts/." ai/prompts/
    printf '# docs\n' > docs/README.md
    printf '# inputs\n' > docs/inputs/README.md
    for d in 00-scenario 01-user-requirements 02-srs 03-prd 04-architecture 05-tech-spec 06-db-design 07-api-spec 08-dev-plan 09-verification; do
      printf '# template spec %s\n' "$d" > "docs/$d.md"
    done
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
    printf 'sop\n' > SOP.md
    printf 'init\n' > INIT-PROMPT.md
    printf 'contrib\n' > CONTRIBUTING.md
    printf 'guide\n' > git-guide.md
    git add -A
    git -c user.name=test -c user.email=test@example.com commit -m init >/dev/null
  )

  # 派生项目：自带 docs/00-09 项目事实（与模板规范不同）+ 执行 sync --commit
  if ! (
    cd "$derived_dir"
    git init -b main >/dev/null
    cp "$ROOT/scripts/sync-template.sh" scripts/sync-template.sh
    cp "$ROOT/scripts/check-derived-sync.sh" scripts/check-derived-sync.sh
    cp "$ROOT/scripts/check-derived-sync.ps1" scripts/check-derived-sync.ps1
    printf 'v0.0.1\n' > VERSION
    printf '# index\n' > ai/index.md
    printf '# old global\n' > ai/global-rules.md
    printf '# old docs\n' > docs/README.md
    for d in 00-scenario 01-user-requirements 02-srs 03-prd 04-architecture 05-tech-spec 06-db-design 07-api-spec 08-dev-plan 09-verification; do
      printf '# project fact %s\n' "$d" > "docs/$d.md"
    done
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
    printf 'old sop\n' > SOP.md
    printf 'old init\n' > INIT-PROMPT.md
    printf 'old contrib\n' > CONTRIBUTING.md
    printf 'old guide\n' > git-guide.md
    git add -A
    git -c user.name=test -c user.email=test@example.com commit -m init >/dev/null
    GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com \
      GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com \
      TEMPLATE_REMOTE="$template_dir" bash scripts/sync-template.sh --commit
  ) >"$test_root/sync.log" 2>&1; then
    cat "$test_root/sync.log" >&2
    fail "doc-standards 同步执行失败"
    rm -rf "$test_root"
    return
  fi

  local count
  count="$(find "$derived_dir/ai/doc-standards" -type f 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$count" -eq 10 ]]; then
    pass "doc-standards 生成 10 个规范镜像"
  else
    fail "doc-standards 应生成 10 个规范镜像，实际 $count"
  fi

  if grep -q '# template spec 00-scenario' "$derived_dir/ai/doc-standards/00-scenario.md" 2>/dev/null; then
    pass "doc-standards 镜像内容来自模板规范"
  else
    fail "doc-standards 镜像内容不是模板规范"
  fi

  local drift=0
  for d in 00-scenario 01-user-requirements 02-srs 03-prd 04-architecture 05-tech-spec 06-db-design 07-api-spec 08-dev-plan 09-verification; do
    grep -q "# project fact $d" "$derived_dir/docs/$d.md" 2>/dev/null || drift=1
  done
  if [[ "$drift" -eq 0 ]]; then
    pass "派生 docs/00-09 项目事实未被覆盖"
  else
    fail "派生 docs/00-09 项目事实被覆盖（违反 doc-standards 红线）"
  fi

  if ( cd "$derived_dir" && bash scripts/check-derived-sync.sh ) >"$test_root/check.log" 2>&1; then
    pass "check-derived-sync 接受 doc-standards 同步提交"
  else
    cat "$test_root/check.log" >&2
    fail "check-derived-sync 误判 doc-standards 越界"
  fi

  rm -rf "$test_root"
}

check_script_entrypoints() {
  require_contains "scripts/sync-template.ps1" 'sync-template\.sh' "sync-template PowerShell 入口调用 Bash 脚本"
  require_contains "scripts/sync-template.ps1" 'Invoke-NativeTemplateSync' "sync-template PowerShell 入口含原生 fallback"
  require_contains "scripts/sync-template.ps1" 'PowerShell fallback template sync' "sync-template fallback 输出明确标识"
  require_contains "scripts/sync-template.ps1" 'doc-standards mirror' "sync-template fallback 同步 doc-standards 镜像"
  require_contains "scripts/check-template.ps1" 'check-template\.sh' "check-template PowerShell 入口调用 Bash 脚本"
  require_contains "scripts/check-derived-sync.ps1" 'check-derived-sync\.sh' "check-derived-sync PowerShell 入口调用 Bash 脚本"
  require_contains "scripts/check-derived-sync.ps1" 'Invoke-NativeDerivedSyncCheck' "check-derived-sync PowerShell 入口含原生 fallback"
  require_contains "scripts/check-derived-sync.ps1" 'PowerShell fallback derived sync boundary check' "check-derived-sync fallback 输出明确标识"
  require_contains "SOP.md" 'PowerShell fallback' "SOP 常用命令说明 PowerShell fallback"
  require_contains "git-guide.md" 'PowerShell fallback' "git-guide 说明同步 fallback"
  require_contains "template-docs/env-setup.md" 'PowerShell fallback' "环境准备文档说明 fallback 边界"
  require_contains "template-docs/derived-sync-report-template.md" 'PowerShell fallback' "同步运行记录模板记录 fallback"
}

check_project_bootstrap_scripts() {
  require_contains "scripts/new-project.sh" 'rm -rf "\$TARGET/_proposals"' "new-project 清理模板提案收件箱内容"
  require_contains "scripts/new-project.sh" 'mkdir -p "\$TARGET/_proposals"' "new-project 创建派生提案起草区"
  require_contains "scripts/new-project.sh" 'cat > "\$TARGET/README.md"' "new-project 项目化 README"
  require_contains "scripts/new-project.sh" '--no-remote' "new-project 支持本地-only 烟测"
  require_contains "scripts/new-project.sh" '未获取到 GitHub 账号' "new-project 在远端模式下缺少账号时给出明确提示"
  require_contains "scripts/new-project.sh" 'collect-env\.ps1' "new-project README 提醒采集本机环境"
  require_contains "scripts/new-project.sh" 'template-docs/env-setup\.md' "new-project README 指向环境准备手册"
  require_contains "scripts/new-project.sh" 'check-prereqs\.ps1' "new-project README 指向前置检测脚本"
  require_contains "scripts/new-project.sh" 'newbie AI CLI onboarding path' "new-project README 包含 AI CLI 新手引导路径"
  require_contains "scripts/new-project.sh" 'docs/inputs/' "new-project README 从 inputs 起步"
  require_contains "scripts/new-project.sh" 'Product Vision 就绪度' "new-project README 说明愿景就绪评估"
  require_contains "scripts/new-project.sh" 'input-review-report\.md' "new-project README 说明输入评审报告"
  require_contains "scripts/new-project.sh" 'docs/vision/product-vision\.md' "new-project README 说明 product-vision 生成结果"
  require_contains "scripts/new-project.sh" '多入口生成 / 补齐' "new-project README 使用多入口生成补齐 Prompt"
  require_contains "scripts/new-project.sh" 'ai/document-lifecycle-rules\.md' "new-project README 指向文档生命周期规则"
  require_contains "scripts/new-project.sh" '交付物形态：Demo / MVP / 产品' "new-project README 提醒交付物形态"
  require_contains "scripts/new-project.sh" 'Phase1 不默认等于 MVP' "new-project README 避免 Phase1 默认 MVP"
  require_contains "scripts/new-project.sh" 'docs/README\.md' "new-project README 指向文档分区规则"
  require_contains "scripts/new-project.sh" 'docs/design/' "new-project README 使用 docs/design 详细设计目录"
  require_contains "scripts/new-project.sh" '## 当前阶段' "new-project README 包含当前阶段版块"
  require_contains "scripts/new-project.sh" '## 运行环境' "new-project README 包含运行环境版块"
  require_contains "scripts/new-project.sh" '## 开发计划' "new-project README 包含开发计划版块"
  require_contains "scripts/new-project.sh" '## 验证方式' "new-project README 包含验证方式版块"
  require_contains "scripts/new-project.sh" '本地-only，无需 GitHub 账号' "new-project 本地模式说明无需 GitHub 账号"
  require_contains "scripts/new-project.sh" '根 \\`README\.md\\` 是项目专属文档，不参与模板下行同步' "new-project README 说明根 README 不同步"
  require_contains "scripts/new-project.sh" 'template-sync\.json' "new-project README 说明模板同步清单"
  require_contains "scripts/collect-env.ps1" 'docs/env/local-env\.md' "collect-env 默认生成 local-env.md"
  require_contains "scripts/collect-env.ps1" '人工确认项' "collect-env 保留人工确认项"
  require_contains "scripts/collect-env.ps1" '服务器资源预案' "collect-env 保留服务器资源预案"
  require_contains "scripts/check-prereqs.ps1" 'Git Bash' "check-prereqs 检查 Git Bash"
  require_contains "scripts/check-prereqs.ps1" 'bootstrap-dev-env\.ps1' "check-prereqs 提示一键安装脚本"
  require_contains "scripts/bootstrap-dev-env.ps1" 'Git\.Git' "bootstrap 脚本安装 Git for Windows"
  require_contains "scripts/bootstrap-dev-env.ps1" 'GitHub\.cli' "bootstrap 脚本安装 GitHub CLI"
  require_contains "scripts/bootstrap-dev-env.ps1" 'OpenJS\.NodeJS\.LTS' "bootstrap 脚本安装 Node.js LTS"
  require_contains "scripts/bootstrap-dev-env.ps1" 'Python\.Python\.3\.11' "bootstrap 脚本安装 Python"
  require_contains "scripts/bootstrap-dev-env.ps1" 'Microsoft\.VisualStudioCode' "bootstrap 脚本安装 VS Code"
}

echo "==> 检查 AI 入口文件"
require_file "AGENTS.md"
require_file "CLAUDE.md"
require_file ".cursor/rules/project-rules.mdc"
require_contains "AGENTS.md" 'ai/index\.md' "AGENTS.md 指向 ai/index.md"
require_contains "CLAUDE.md" 'ai/index\.md' "CLAUDE.md 指向 ai/index.md"
require_contains ".cursor/rules/project-rules.mdc" 'ai/index\.md' "Cursor 规则指向 ai/index.md"
require_contains ".cursor/rules/project-rules.mdc" '^alwaysApply: true$' "Cursor 规则启用 alwaysApply"

echo
echo "==> 检查 AI 规则索引"
require_file "ai/index.md"
while IFS= read -r rule_file; do
  [[ -n "$rule_file" ]] || continue
  require_file "$rule_file"
done < <(extract_index_rules)

echo
echo "==> 检查核心文档骨架"
for doc in \
  docs/00-scenario.md \
  docs/01-user-requirements.md \
  docs/02-srs.md \
  docs/03-prd.md \
  docs/04-architecture.md \
  docs/05-tech-spec.md \
  docs/08-dev-plan.md \
  docs/09-verification.md; do
  require_file "$doc"
  require_contains "$doc" '^# ' "$doc 含一级标题"
done

require_dir "docs/env"
require_dir "docs/inputs"
require_dir "docs/design"
require_dir "docs/decisions"
require_dir "docs/research"
require_dir "docs/meetings"
require_dir "docs/archive"
require_file "docs/README.md"
require_file "docs/inputs/README.md"
require_file "docs/env/README.md"
require_contains "docs/README.md" '根目录只放核心文档' "docs README 约束根目录只放核心文档"
require_contains "docs/README.md" 'docs/inputs/' "docs README 说明原始输入包目录"
require_contains "docs/README.md" '原始输入.*统一入口|统一入口.*原始输入' "docs README 明确 inputs 是原始输入统一入口"
require_contains "docs/README.md" 'docs/inputs/input-review-report\.md' "docs README 说明输入评审报告路径"
require_contains "docs/README.md" 'docs/design/' "docs README 说明详细设计目录"
require_contains "docs/README.md" 'AI 新增文档规则' "docs README 说明 AI 新增文档规则"
require_contains "docs/inputs/README.md" '输入材料评审与入口判定' "docs/inputs README 指向输入评审 Prompt"
require_contains "docs/inputs/README.md" '愿景就绪评估' "docs/inputs README 说明愿景就绪评估"
require_contains "docs/inputs/README.md" '最小补充清单' "docs/inputs README 说明最小补充清单"
require_contains "docs/inputs/README.md" 'input-review-report\.md' "docs/inputs README 说明输入评审报告"
require_contains "docs/env/README.md" 'collect-env\.ps1' "docs/env README 说明环境采集脚本"
require_contains "docs/vision/product-vision.md" '派生项目首次初始化时必须替换本文内容' "Product Vision 提醒派生项目必须替换模板内容"
require_contains "docs/vision/product-vision.md" '## 0\. 启用状态与替换说明' "Product Vision 包含启用状态说明"
require_contains "docs/vision/product-vision.md" 'docs/inputs/' "Product Vision 说明原始输入放 docs/inputs"
require_contains "docs/vision/product-vision.md" 'PV-SC-001' "Product Vision 提供场景锚点格式"
require_contains "docs/vision/product-vision.md" 'PV-CAP-001' "Product Vision 提供能力锚点格式"
for doc in \
  docs/00-scenario.md \
  docs/01-user-requirements.md \
  docs/02-srs.md \
  docs/03-prd.md \
  docs/04-architecture.md \
  docs/05-tech-spec.md \
  docs/06-db-design.md \
  docs/07-api-spec.md \
  docs/08-dev-plan.md \
  docs/09-verification.md; do
  require_contains "$doc" '文档定位' "$doc 包含文档定位"
  require_contains "$doc" '上游输入' "$doc 包含上游输入"
  require_contains "$doc" '## 0\. 文档元信息' "$doc 包含文档元信息"
  require_contains "$doc" '撰写提要' "$doc 包含撰写提要"
  require_contains "$doc" '待人工确认项' "$doc 包含待人工确认项"
  require_contains "$doc" 'AI 建议' "$doc 待确认项包含 AI 建议"
  require_contains "$doc" '建议依据' "$doc 待确认项包含建议依据"
  require_contains "$doc" '备选方案' "$doc 待确认项包含备选方案"
  require_contains "$doc" '取舍影响 / 阻塞关系' "$doc 待确认项包含取舍影响和阻塞关系"
done
require_contains "docs/00-scenario.md" '上游来源映射' "00 场景包含来源映射"
require_contains "docs/01-user-requirements.md" 'U-ID' "01 用户需求包含 U-ID"
require_contains "docs/02-srs.md" 'U-ID → REQ-ID 追溯矩阵' "02 SRS 包含 U 到 REQ 追溯"
require_contains "docs/03-prd.md" 'REQ 覆盖矩阵' "03 PRD 包含 REQ 覆盖矩阵"
require_contains "docs/04-architecture.md" 'REQ / 功能 → 模块追溯矩阵' "04 架构包含模块追溯矩阵"
require_contains "docs/05-tech-spec.md" '已用 / 预留·未启用 / 候选' "05 技术方案区分技术状态"
require_contains "docs/06-db-design.md" '保留 / 省略决策' "06 DB 设计包含保留省略决策"
require_contains "docs/07-api-spec.md" '接口形态' "07 API 设计包含接口形态"
require_contains "docs/08-dev-plan.md" 'Sprint 总览' "08 开发计划包含 Sprint 总览"
require_contains "docs/08-dev-plan.md" 'Phase / Sprint / Task 定义' "08 开发计划定义 Phase Sprint Task"
require_contains "docs/08-dev-plan.md" '测试等级 / 验证包' "08 开发计划包含测试等级验证包"
require_contains "docs/08-dev-plan.md" 'Sprint 完成包' "08 开发计划包含 Sprint 完成包"
require_contains "docs/09-verification.md" 'REQ → 用例追溯矩阵' "09 验证计划包含 REQ 用例追溯"
require_contains "docs/09-verification.md" '测试等级矩阵' "09 验证计划包含测试等级矩阵"
require_contains "docs/09-verification.md" 'Phase 测试大纲' "09 验证计划包含 Phase 测试大纲"
require_contains "docs/09-verification.md" 'Sprint 验收包' "09 验证计划包含 Sprint 验收包"
require_contains "docs/09-verification.md" '缺陷与回归记录' "09 验证计划包含缺陷与回归记录"
require_contains "docs/04-architecture.md" '部署 / 运行拓扑约束' "04 架构含运行拓扑约束"
require_contains "docs/05-tech-spec.md" '运行环境与资源评估' "05 技术方案含资源评估"
require_contains "docs/09-verification.md" '本机资源验证' "09 验证计划含本机资源验证"

for optional_doc in docs/06-db-design.md docs/07-api-spec.md; do
  if [[ -f "$optional_doc" ]]; then
    require_contains "$optional_doc" '^# ' "$optional_doc 存在且含一级标题"
  else
    pass "可选文档已省略: $optional_doc"
  fi
done

echo
echo "==> 检查版本号与治理文件"
require_file "VERSION"
require_file "CHANGELOG.md"
require_file "MAINTAINERS.md"
require_file "template-sync.json"
require_contains "VERSION" '^v[0-9]+\.[0-9]+\.[0-9]+$' "VERSION 使用三段式模板版本号"
require_changelog_current_version
require_changelog_semver_desc
require_contains "MAINTAINERS.md" '发布 Checklist' "MAINTAINERS 包含发布 checklist"
require_contains "MAINTAINERS.md" 'template-sync\.json' "MAINTAINERS 说明同步清单维护"
require_contains "MAINTAINERS.md" 'README\.md.*轻量' "MAINTAINERS 约束 README 保持轻量"
require_contains "MAINTAINERS.md" 'Sync notice' "MAINTAINERS 说明同步文档提示块"
require_contains "MAINTAINERS.md" '根 `README\.md` 是项目专属文档' "MAINTAINERS 说明派生 README 不同步"
require_contains "template-sync.json" '"files"' "template-sync.json 包含同步文件清单"
require_contains "template-sync.json" '"CHANGELOG\.md"' "template-sync 同步 CHANGELOG"
require_contains "template-sync.json" '"MAINTAINERS\.md"' "template-sync 同步 MAINTAINERS"
require_contains "template-sync.json" '"ai/document-lifecycle-rules\.md"' "template-sync 同步文档生命周期规则"
require_contains "template-sync.json" '"ai/implementation-lifecycle-rules\.md"' "template-sync 同步实现生命周期规则"
require_contains "template-sync.json" '"ai/session-rules\.md"' "template-sync 同步会话续接规则"
require_contains "template-sync.json" '"ai/doc-standards/README\.md"' "template-sync 同步 doc-standards README"
require_contains "template-sync.json" '"ai/commands/README\.md"' "template-sync 同步 AI 快捷命令索引"
require_contains "template-sync.json" '"ai/commands/docs-evaluation\.md"' "template-sync 同步 docs-evaluation 命令"
require_contains "template-sync.json" '"ai/prompts/review/19-docs-evaluation\.md"' "template-sync 同步 docs-evaluation Prompt"
require_contains "template-sync.json" '"ai/prompts/README\.md"' "template-sync 同步 Prompt Library README"
require_contains "template-sync.json" '"ai/prompts/planning/19-plan-phases-and-sprints\.md"' "template-sync 同步 A9 阶段 Sprint 规划 Prompt"
require_contains "template-sync.json" '"template-docs/session-handoff\.example\.md"' "template-sync 同步会话续接样例"
require_contains "template-sync.json" '"template-docs/derived-sync-report-template\.md"' "template-sync 同步派生同步运行记录模板"
require_contains "template-sync.json" '"docs/README\.md"' "template-sync 同步 docs README"
require_contains "template-sync.json" '"docs/inputs/README\.md"' "template-sync 同步 docs inputs README"
require_contains "template-sync.json" '"scripts/check-derived-sync\.sh"' "template-sync 同步派生边界检查 Bash 入口"
require_contains "template-sync.json" '"scripts/check-derived-sync\.ps1"' "template-sync 同步派生边界检查 PowerShell 入口"
require_contains "ai/global-rules.md" '全局规则版本：v[0-9]+\.[0-9]+' "global-rules 含全局规则版本号"
require_file "README.md"
require_file "template-docs/beginner-guide.md"
require_file "template-docs/env-setup.md"
require_file "template-docs/ai-cli-setup.md"
require_file "template-docs/smoke-test.md"
require_file "template-docs/smoke-test-report-template.md"
require_file "template-docs/derived-sync-report-template.md"
require_file "ai/document-lifecycle-rules.md"
require_file "ai/session-rules.md"
require_file "ai/doc-standards/README.md"
require_file "ai/commands/README.md"
for command_file in \
  ai/commands/sync-methodology.md \
  ai/commands/post-sync-cleanup.md \
  ai/commands/docs-system-audit.md \
  ai/commands/docs-evaluation.md \
  ai/commands/template-proposal-summary.md \
  ai/commands/generate-docs.md \
  ai/commands/review-inputs.md \
  ai/commands/project-review.md \
  ai/commands/edit-single-doc.md \
  ai/commands/sync-docs-from-code.md \
  ai/commands/phase-upgrade.md \
  ai/commands/docs-checklist.md \
  ai/commands/run-dev-task.md \
  ai/commands/fix-bug.md \
  ai/commands/sprint-summary.md \
  ai/commands/collect-env.md \
  ai/commands/new-project.md \
  ai/commands/commit-message.md \
  ai/commands/submit-proposal.md \
  ai/commands/submit-feedback.md; do
  require_file "$command_file"
  require_contains "$command_file" '## 必读文件' "$command_file 含必读文件"
  require_contains "$command_file" '## 写入风险' "$command_file 含写入风险"
done
require_file "template-docs/session-handoff.example.md"
require_file "CONTRIBUTING.md"
require_file "SOP.md"
require_file "INIT-PROMPT.md"
require_file "git-guide.md"
require_file ".github/workflows/template-check.yml"
require_file ".github/pull_request_template.md"
require_file ".github/ISSUE_TEMPLATE/template-change.md"
require_files \
  "scripts/new-project.sh" \
  "scripts/sync-all-derived.sh" \
  "scripts/e2e-sync-check.sh" \
  "scripts/sync-template.sh" \
  "scripts/sync-template.ps1" \
  "scripts/check-template.sh" \
  "scripts/check-template.ps1" \
  "scripts/check-derived-sync.sh" \
  "scripts/check-derived-sync.ps1" \
  "scripts/collect-env.ps1" \
  "scripts/check-prereqs.ps1" \
  "scripts/bootstrap-dev-env.ps1"
require_file "template-docs/e2e-regression-checklist.md"
require_file "template-docs/e2e-report-template.md"
require_file "_proposals/README.md"
require_file "_archive/proposals/README.md"
require_contains "_proposals/README.md" '模板优化提案收件箱' "_proposals README 标明提案收件箱"
require_contains "_proposals/README.md" 'TEMPLATE-UPGRADE-vX\.Y\.Z' "_proposals README 说明三段式提案命名"
require_contains "_proposals/README.md" '任何需要修改项目模板' "_proposals README 说明提案先行"
require_contains "_archive/proposals/README.md" 'VERSION' "归档 README 以 VERSION 为事实来源"
require_contains "CONTRIBUTING.md" '提案 → 分支 → PR → 评审 → 合并 → 归档' "CONTRIBUTING 含提案先行流程"
require_contains "CONTRIBUTING.md" 'vMAJOR\.MINOR\.PATCH' "CONTRIBUTING 含三段式版本规则"
require_contains "README.md" 'SOP\.md' "README 包含 SOP 索引入口"
require_contains "README.md" 'ai/commands/README\.md' "README 包含 AI 快捷命令入口"
require_contains "README.md" 'ai/session-rules\.md' "README 包含会话续接规则入口"
require_contains "README.md" 'scenario-guides' "README 快速开始指向 scenario-guides"
require_contains "README.md" 'SOP\.md' "README 快速开始指向 SOP"
require_contains "README.md" 'beginner-guide' "README 快速开始指向 beginner-guide"
require_contains "README.md" 'git-guide\.md' "README 指向 git-guide"
require_contains "README.md" 'scripts/check-prereqs\.ps1' "README 提示环境检查"
require_contains "README.md" 'scripts/bootstrap-dev-env\.ps1' "README 提示基础安装脚本"
require_contains "README.md" 'template-docs/ai-cli-setup\.md' "README 包含 AI CLI 安装入口"
require_contains "README.md" 'ai/session-rules\.md' "README 包含会话续接规则入口"
require_contains "README.md" 'MAINTAINERS\.md' "README 指向 MAINTAINERS"
require_contains "README.md" 'CHANGELOG\.md' "README 指向 CHANGELOG"
require_contains "README.md" 'docs/README\.md' "README 指向 docs 分区规则"
# README 瘦身后，详细命令断言移到 SOP「常用命令」；环境/烟测入口由 beginner-guide 断言覆盖；5 分钟路径要点并入 scenario-guides/docs-README。
require_contains "SOP.md" 'bash scripts/new-project\.sh my-demo --visibility private' "SOP 常用命令含正式建项路径"
require_contains "SOP.md" 'smoke-demo --local --no-remote' "SOP 常用命令含本地烟测路径"
require_contains "SOP.md" 'check-template\.ps1' "SOP 常用命令含 PowerShell 自检入口"
require_contains "template-docs/beginner-guide.md" 'template-docs/env-setup\.md' "BEGINNER-GUIDE 指向环境准备手册"
require_contains "template-docs/beginner-guide.md" 'scripts/bootstrap-dev-env\.ps1' "BEGINNER-GUIDE 前置新手环境准备路径"
require_contains "template-docs/beginner-guide.md" 'scripts/check-prereqs\.ps1' "BEGINNER-GUIDE 前置环境检查脚本"
require_contains "template-docs/beginner-guide.md" 'newbie AI CLI onboarding path' "BEGINNER-GUIDE 包含 AI CLI 新手引导路径"
require_contains "template-docs/beginner-guide.md" 'template-docs/smoke-test\.md' "BEGINNER-GUIDE 指向新手烟测"
require_contains "template-docs/beginner-guide.md" 'template-docs/smoke-test-report-template\.md' "BEGINNER-GUIDE 指向烟测记录模板"
require_contains "template-docs/beginner-guide.md" 'lemesh_ai_model' "BEGINNER-GUIDE 指向公司中转站手册"
require_contains "template-docs/beginner-guide.md" '官方文档安装并登录 `Claude CLI` 或 `Codex CLI`' "BEGINNER-GUIDE 区分 CLI 安装与中转站配置"
require_contains "template-docs/beginner-guide.md" 'template-docs/ai-cli-setup\.md' "BEGINNER-GUIDE 指向 AI CLI 安装文档"
require_contains "template-docs/env-setup.md" 'bootstrap-dev-env\.ps1' "ENV-SETUP 指向一键安装脚本"
require_contains "template-docs/env-setup.md" 'check-prereqs\.ps1' "ENV-SETUP 指向前置检测脚本"
require_contains "template-docs/env-setup.md" 'OK: all required items are present' "ENV-SETUP 包含新手决策表"
require_contains "template-docs/env-setup.md" 'Claude CLI' "ENV-SETUP 包含 Claude CLI 说明"
require_contains "template-docs/env-setup.md" 'Codex CLI' "ENV-SETUP 包含 Codex CLI 说明"
require_contains "template-docs/env-setup.md" 'lemesh_ai_model' "ENV-SETUP 指向公司中转站手册"
require_contains "template-docs/env-setup.md" '不应被理解为 `Claude CLI` 或 `Codex CLI` 本身的官方安装指南' "ENV-SETUP 区分中转站手册与 CLI 安装指南"
require_contains "template-docs/ai-cli-setup.md" 'claude --version' "AI-CLI-SETUP 包含 Claude CLI 启动验证"
require_contains "template-docs/ai-cli-setup.md" 'codex --version' "AI-CLI-SETUP 包含 Codex CLI 启动验证"
require_contains "template-docs/ai-cli-setup.md" 'newbie AI CLI onboarding path' "AI-CLI-SETUP 包含首次运行模板提示词"
require_contains "template-docs/ai-cli-setup.md" 'lemesh_ai_model' "AI-CLI-SETUP 指向公司中转站手册"
require_contains "template-docs/smoke-test.md" 'scripts/check-prereqs\.ps1' "SMOKE-TEST 包含环境检查脚本"
require_contains "template-docs/smoke-test.md" 'Suggested next steps' "SMOKE-TEST 保持环境检查优先"
require_contains "template-docs/smoke-test.md" 'scripts/new-project\.sh smoke-demo --local --no-remote' "SMOKE-TEST 包含本地烟测项目创建"
require_contains "template-docs/smoke-test.md" 'scripts/collect-env\.ps1' "SMOKE-TEST 包含环境采集"
require_contains "template-docs/smoke-test.md" 'template-docs/smoke-test-report-template\.md' "SMOKE-TEST 指向烟测记录模板"
require_contains "template-docs/smoke-test-report-template.md" '本轮烟测是否通过' "烟测记录模板包含最终结论"
require_contains "CHANGELOG.md" 'docs/design/' "CHANGELOG 记录 docs/design 分区变更"
require_contains "CHANGELOG.md" 'ENV-SETUP\.md' "CHANGELOG 记录环境准备入口"
require_contains "CHANGELOG.md" 'SMOKE-TEST\.md' "CHANGELOG 记录新手烟测入口"
require_contains "CHANGELOG.md" 'SMOKE-TEST-REPORT-TEMPLATE\.md' "CHANGELOG 记录烟测记录模板"
require_contains "CHANGELOG.md" 'Claude CLI' "CHANGELOG 记录 AI CLI 工具说明"
require_contains "CHANGELOG.md" '中转站说明边界' "CHANGELOG 记录中转站边界修正"
require_contains "CHANGELOG.md" 'AI-CLI-SETUP\.md' "CHANGELOG 记录 AI CLI 独立文档"
require_contains "ai/index.md" 'ai/document-lifecycle-rules\.md' "ai/index 读取文档生命周期规则"
require_contains "ai/global-rules.md" 'docs/README\.md' "global-rules 引用 docs 分区规则"
require_contains "ai/global-rules.md" 'ai/document-lifecycle-rules\.md' "global-rules 引用文档生命周期规则"
require_contains "ai/global-rules.md" 'ai/prompts/docs/01-review-inputs\.md' "global-rules 指向输入评审 Prompt"
require_contains "ai/global-rules.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "global-rules 指向文档生成 Prompt"
require_contains "ai/document-lifecycle-rules.md" '多入口生成策略' "document-lifecycle 定义多入口生成策略"
require_contains "ai/document-lifecycle-rules.md" 'docs/inputs' "document-lifecycle 定义原始输入包"
require_contains "ai/document-lifecycle-rules.md" '横切事实' "document-lifecycle 定义横切事实一致性"
require_contains "ai/document-lifecycle-rules.md" '外部文档接入规则' "document-lifecycle 定义外部文档接入"
require_contains "docs/README.md" 'ai/document-lifecycle-rules\.md' "docs README 指向文档生命周期规则"
require_contains "ai/global-rules.md" 'docs/design/<子系统>\.md' "global-rules 使用 docs/design 子系统设计路径"
require_contains "ai/global-rules.md" '回流来源标识' "global-rules §9 含回流来源标识规则"
require_contains "ai/global-rules.md" '阶段双维度' "global-rules 定义阶段双维度"
require_contains "ai/global-rules.md" '交付物形态.*Demo.*MVP.*产品' "global-rules 定义交付物形态"
require_contains "ai/global-rules.md" '不得把 Demo 声称为 MVP / 产品' "global-rules 禁止混淆 Demo 与 MVP/产品"
require_file "ai/prompts/README.md"
require_file "ai/prompts/docs/00-generate-or-complete-docs.md"
require_file "ai/prompts/docs/01-review-inputs.md"
require_file "ai/prompts/dev/02-run-task.md"
require_file "ai/prompts/review/03-project-review.md"
require_file "ai/prompts/docs/04-edit-single-doc.md"
require_file "ai/prompts/dev/05-fix-bug.md"
require_file "ai/prompts/git/06-commit-message.md"
require_file "ai/prompts/docs/07-sync-docs-from-code.md"
require_file "ai/prompts/planning/08-phase-upgrade.md"
require_file "ai/prompts/planning/19-plan-phases-and-sprints.md"
require_file "ai/prompts/dev/09-sprint-summary.md"
require_file "ai/prompts/review/10-docs-checklist.md"
require_file "ai/prompts/maintainers/11-template-proposal-summary.md"
require_file "ai/prompts/maintainers/12-sync-template.md"
require_file "ai/prompts/setup/13-collect-env.md"
require_file "ai/prompts/setup/14-new-project.md"
require_file "ai/prompts/maintainers/15-post-sync-cleanup.md"
require_file "ai/prompts/review/16-docs-system-audit.md"
require_contains "ai/prompts/review/16-docs-system-audit.md" '全链路' "16 系统审计提示词覆盖全链路回溯"
require_contains "ai/prompts/review/16-docs-system-audit.md" 'ai/document-lifecycle-rules\.md' "16 系统审计提示词引用文档生命周期规则"
require_contains "ai/prompts/review/16-docs-system-audit.md" 'ai/doc-standards' "16 系统审计提示词优先对照 doc-standards 规范基线"
require_contains "ai/prompts/review/16-docs-system-audit.md" 'docs/_scaffold' "16 系统审计提示词兼容旧 _scaffold 规范基线"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '16-docs-system-audit\.md' "同步后整理 Prompt 指向 16 系统审计（doc-standards 闭环）"
# INIT-PROMPT v1.22.2 起简化为指针：Prompt 明细索引由 SOP 场景索引 + ai/prompts/README 承担，不再要求 INIT-PROMPT 含 Prompt 明细。
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'docs/design/\*' "生成 Prompt 使用 docs/design 详细设计路径"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '模板骨架' "生成 Prompt 要求保留文档模板骨架"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'Product Vision 处置' "生成 Prompt 说明 Product Vision 处置"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '文档定位 / 上游输入 / 下游输出 / 文档元信息 / 撰写提要' "生成 Prompt 要求核心文档结构"
require_contains "ai/prompts/README.md" 'ai/prompts/docs/01-review-inputs\.md' "Prompt Library README 指向输入评审 Prompt"
require_contains "ai/prompts/setup/13-collect-env.md" 'ai/prompts/docs/01-review-inputs\.md' "环境采集 Prompt 指向输入评审 Prompt"
require_contains "ai/prompts/setup/13-collect-env.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "环境采集 Prompt 指向文档生成 Prompt"
require_contains "ai/prompts/docs/01-review-inputs.md" '输入材料评审与入口判定' "输入评审 Prompt 标题正确"
require_contains "ai/prompts/docs/01-review-inputs.md" '文件夹路径' "输入评审 Prompt 支持文件夹输入材料"
require_contains "ai/prompts/docs/01-review-inputs.md" '将读取 / 忽略 / 无法读取' "输入评审 Prompt 要求盘点文件夹输入"
require_contains "ai/prompts/docs/01-review-inputs.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "输入评审 Prompt 指向文档生成 Prompt"
require_contains "ai/prompts/docs/01-review-inputs.md" 'Product Vision 就绪度' "输入评审 Prompt 要求 Product Vision 就绪度"
require_contains "ai/prompts/docs/01-review-inputs.md" '愿景缺口矩阵' "输入评审 Prompt 要求愿景缺口矩阵"
require_contains "ai/prompts/docs/01-review-inputs.md" '最小补充清单' "输入评审 Prompt 要求最小补充清单"
require_contains "ai/prompts/docs/01-review-inputs.md" 'docs/inputs/input-review-report\.md' "输入评审 Prompt 说明评估报告路径"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'Product Vision 就绪度' "生成 Prompt 检查输入评审结论"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'Not Ready' "生成 Prompt 阻止未就绪输入直接生成"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '先生成 / 更新 `docs/vision/product-vision\.md`' "生成 Prompt 要求先生成 product-vision"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'AI 建议' "生成 Prompt 要求待确认项含 AI 建议"
require_contains "ai/prompts/docs/04-edit-single-doc.md" 'AI 建议' "单文档修订 Prompt 要求待确认项含 AI 建议"
require_contains "ai/prompts/docs/07-sync-docs-from-code.md" 'AI 建议' "文档反向同步 Prompt 要求待确认项含 AI 建议"
require_contains "ai/prompts/review/10-docs-checklist.md" 'AI 建议' "docs checklist 检查待确认项 AI 建议"
require_file "ai/prompts/review/19-docs-evaluation.md"
require_contains "ai/prompts/review/19-docs-evaluation.md" 'Go / Conditional Go / No Go' "docs-evaluation Prompt 输出 Go 结论"
require_contains "ai/prompts/review/19-docs-evaluation.md" 'E1' "docs-evaluation Prompt 定义阶段评估码"
require_contains "ai/prompts/review/19-docs-evaluation.md" 'docs/research/YYYY-MM-DD-docs-evaluation-<scope>\.md' "docs-evaluation Prompt 定义报告路径"
require_contains "ai/commands/docs-evaluation.md" 'Go / Conditional Go / No Go' "docs-evaluation 命令说明 Go 结论"
require_contains "ai/commands/README.md" 'docs-evaluation' "commands README 注册 docs-evaluation"
require_contains "template-docs/scenario-guides.md" 'docs-evaluation' "scenario guides 注册 docs-evaluation"
require_contains "ai/document-lifecycle-rules.md" 'E1' "document-lifecycle 定义 E1-E6 评估码"
require_contains "ai/implementation-lifecycle-rules.md" 'Conditional Go' "implementation-lifecycle 承接 docs-evaluation"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '功能范围 \+ 交付物形态' "生成 Prompt 要求阶段双维度"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '全链追溯' "生成 Prompt 要求全链追溯"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'ai/prompts/review/10-docs-checklist\.md' "生成 Prompt 指向 docs checklist"
require_contains "ai/prompts/docs/04-edit-single-doc.md" '横切事实' "单文档修订 Prompt 要求横切事实传播"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '声称据实' "生成 Prompt 要求声称据实"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" '不得把候选、预留或默认关闭写成已用' "生成 Prompt 禁止过度声称技术状态"
require_contains "docs/03-prd.md" '交付物形态（Demo/MVP/产品）' "03 PRD 模板要求交付物形态"
require_contains "docs/08-dev-plan.md" '交付物形态' "08 开发计划模板体现交付物形态"
require_contains "docs/09-verification.md" '交付物形态' "09 验证计划模板体现交付物形态"
require_contains "ai/project-rules.md" 'docs/README\.md' "project-rules 初始化检查引用 docs 分区规则"
require_contains "ai/project-rules.md" 'ai/prompts/docs/01-review-inputs\.md' "project-rules 指向输入评审 Prompt"
require_contains "ai/project-rules.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "project-rules 指向文档生成 Prompt"
require_contains ".github/workflows/template-check.yml" 'scripts/check-template\.sh' "GitHub Actions 运行模板自检"
require_contains ".github/workflows/template-check.yml" 'git diff --check' "GitHub Actions 运行 diff 空白检查"
require_contains ".github/workflows/template-check.yml" 'git diff-tree --check' "GitHub Actions 处理新分支 push 空白检查"
require_contains "scripts/sync-template.sh" 'template-sync\.json' "sync-template 从 template-sync.json 读取同步清单"
require_contains "scripts/sync-template.sh" '"ai/document-lifecycle-rules\.md"' "sync-template 兜底清单含文档生命周期规则"
require_contains "scripts/sync-template.sh" '"ai/session-rules\.md"' "sync-template 兜底清单含会话续接规则"
require_contains "scripts/sync-template.sh" '"ai/doc-standards/README\.md"' "sync-template 兜底清单含 doc-standards README"
require_contains "scripts/sync-template.sh" '"ai/commands/README\.md"' "sync-template 兜底清单含 AI 快捷命令索引"
require_contains "scripts/sync-template.sh" '"template-docs/derived-sync-report-template\.md"' "sync-template 兜底清单含派生同步运行记录模板"
require_contains "scripts/sync-template.sh" '"ai/prompts/README\.md"' "sync-template 兜底清单含 Prompt Library README"
require_contains "scripts/sync-template.sh" '"ai/prompts/review/16-docs-system-audit\.md"' "sync-template 兜底清单含 16 系统审计 Prompt"
require_contains "scripts/sync-template.sh" '"ai/prompts/docs/00-generate-or-complete-docs\.md"' "sync-template 兜底清单含文档生成 Prompt"
require_contains "scripts/sync-template.sh" '"ai/prompts/planning/19-plan-phases-and-sprints\.md"' "sync-template 兜底清单含 A9 阶段 Sprint 规划 Prompt"
require_contains "scripts/sync-template.sh" '"docs/inputs/README\.md"' "sync-template 兜底清单含 docs inputs README"
check_script_entrypoints
require_contains "scripts/check-derived-sync.sh" '同步清单外变更' "check-derived-sync 检查同步清单外变更"
require_contains "scripts/check-derived-sync.sh" 'README 模板版本' "check-derived-sync 含 README 模板版本一致性告警（非阻断）"
require_contains "scripts/check-derived-sync.sh" 'README\.md\|ai/project-rules\.md\|docs/0\[0-9\]-\*' "check-derived-sync 保护项目专属文件"
require_contains "scripts/check-derived-sync.sh" 'git show --name-only --stat' "check-derived-sync 输出最近同步提交文件"
require_contains "scripts/check-derived-sync.sh" 'ai/prompts/maintainers/15-post-sync-cleanup\.md' "check-derived-sync 指向同步后整理 Prompt"
require_contains "scripts/sync-template.sh" 'ai/doc-standards' "sync-template 含 doc-standards 规范镜像步骤"
require_contains "scripts/check-derived-sync.sh" 'ai/doc-standards/\*' "check-derived-sync 放行 doc-standards 规范镜像"
require_contains "scripts/check-derived-sync.sh" 'docs/_scaffold/\*' "check-derived-sync 迁移期兼容旧 _scaffold 规范镜像"
require_contains "ai/doc-standards/README.md" 'Document Standards' "doc-standards README 说明规范镜像定位"

# AI CLI 使用体验入口：快捷命令与会话续接必须贯穿规则、Prompt、同步清单和人读文档。
require_contains "ai/index.md" 'ai/session-rules\.md' "ai/index 纳入会话续接规则"
require_contains "ai/index.md" 'ai/implementation-lifecycle-rules\.md' "ai/index 纳入实现生命周期规则"
require_contains "ai/index.md" 'ai/commands/README\.md' "ai/index 纳入 AI 快捷命令索引"
require_contains "ai/global-rules.md" 'AI 建议' "global-rules 约束 AI 建议不等于确认"
require_contains "ai/document-lifecycle-rules.md" '待人工确认项结构' "document-lifecycle 定义待确认项结构"
require_contains "ai/session-rules.md" 'AI 建议' "session-rules 要求续接待确认项含 AI 建议"
require_contains "ai/doc-standards/README.md" 'AI 建议' "doc standards 定义待确认项 AI 建议字段"
require_contains "ai/commands/README.md" 'AI 建议' "commands README 说明待确认项 AI 建议要求"
require_contains "ai/global-rules.md" 'frontend-interaction\.md' "global-rules 定义前端交互设计路径"
require_contains "ai/document-lifecycle-rules.md" '前端交互设计触发规则' "document-lifecycle 定义前端交互触发规则"
require_contains "docs/README.md" 'docs/design/frontend-interaction\.md' "docs README 定义前端交互设计路径"
require_contains "ai/prompts/docs/00-generate-or-complete-docs.md" 'docs/design/frontend-interaction\.md' "generate-docs Prompt 支持前端交互设计"
require_contains "ai/prompts/review/10-docs-checklist.md" '前端交互设计' "docs-checklist 校验前端交互设计"
require_contains "ai/prompts/review/16-docs-system-audit.md" '前端交互' "docs-system-audit 校验前端交互设计"
require_contains "template-docs/scenario-guides.md" '补前端交互设计' "scenario-guides 路由前端交互设计请求"
require_contains "ai/commands/tech-env-evaluation.md" '技术环境评估' "tech-env-evaluation 命令存在"
require_contains "ai/prompts/review/20-tech-env-evaluation.md" 'No-Go' "tech-env-evaluation Prompt 定义 No-Go 结论"
require_contains "template-sync.json" 'ai/commands/tech-env-evaluation\.md' "template-sync 纳入 tech-env-evaluation 命令"
require_contains "template-sync.json" 'ai/prompts/review/20-tech-env-evaluation\.md' "template-sync 纳入 tech-env-evaluation Prompt"
require_contains "ai/document-lifecycle-rules.md" 'tech-env-evaluation' "document-lifecycle 引用技术环境评估"
require_contains "ai/implementation-lifecycle-rules.md" '真实运行依赖' "implementation-lifecycle 对真实运行依赖设门禁"
require_contains "ai/prompts/setup/13-collect-env.md" '不替代技术路线' "collect-env Prompt 区分采集与评估"
require_contains "docs/05-tech-spec.md" '技术环境评估结论' "05 技术方案包含技术环境评估结论"
require_contains "docs/09-verification.md" '技术环境评估验证' "09 验证计划包含技术环境评估验证"
require_contains "template-docs/scenario-guides.md" 'A8\.5 技术路线与环境支撑评估' "scenario-guides 路由技术环境评估"
require_contains "ai/global-rules.md" 'ai/commands/README\.md' "global-rules 指向快捷命令路由"
require_contains "ai/global-rules.md" 'ai/session-rules\.md' "global-rules 指向会话续接规则"
require_contains "ai/global-rules.md" 'ai/implementation-lifecycle-rules\.md' "global-rules 指向实现生命周期规则"
require_file "ai/implementation-lifecycle-rules.md"
require_contains "ai/implementation-lifecycle-rules.md" 'REQ → Phase → Sprint / Task → Test Case → Commit / PR' "implementation-lifecycle 定义实现追溯链"
require_contains "ai/implementation-lifecycle-rules.md" '测试与验证分层' "implementation-lifecycle 定义测试与验证分层"
require_contains "ai/implementation-lifecycle-rules.md" '代码事实反向同步' "implementation-lifecycle 定义代码事实反向同步"
require_contains "ai/project-rules.md" '预计文件' "project-rules 写入前确认要求列预计文件"
require_contains "ai/project-rules.md" '模板只能约束 AI 行为和项目期望' "project-rules 说明无法替代 CLI 权限模型"
require_contains "ai/implementation-lifecycle-rules.md" 'git status --short --branch' "implementation-lifecycle 要求 Git 状态审计"
require_contains "template-docs/ai-cli-setup.md" '写入前确认与权限模式' "AI CLI setup 含写入前确认与权限模式"
require_contains "template-docs/ai-cli-setup.md" '项目规则' "AI CLI setup 说明项目规则防线"
require_contains "template-docs/ai-cli-setup.md" '工具配置' "AI CLI setup 说明工具配置防线"
require_contains "template-docs/ai-cli-setup.md" 'Git 审计' "AI CLI setup 说明 Git 审计防线"
require_contains "ai/prompts/dev/02-run-task.md" '预计文件' "run-task Prompt 写入前列预计文件"
require_contains "ai/prompts/dev/05-fix-bug.md" '变更摘要' "fix-bug Prompt 写入前列变更摘要"
require_contains "ai/prompts/docs/04-edit-single-doc.md" '等待确认后再修改' "edit-single-doc Prompt 等待确认后再修改"
require_contains "ai/prompts/planning/19-plan-phases-and-sprints.md" 'Phase / Sprint / Task / 验证闭环' "A9 规划 Prompt 覆盖阶段任务验证闭环"
require_contains "ai/prompts/planning/19-plan-phases-and-sprints.md" 'docs/08-dev-plan\.md' "A9 规划 Prompt 输出 08 草稿"
require_contains "ai/prompts/planning/19-plan-phases-and-sprints.md" 'docs/09-verification\.md' "A9 规划 Prompt 输出 09 草稿"
require_contains "ai/session-rules.md" '\.ai/session-handoff\.md' "session-rules 定义新续接文件"
require_contains "ai/session-rules.md" 'NEXT-STEPS\.md' "session-rules 兼容 NEXT-STEPS"
require_contains ".gitignore" '\.ai/session-handoff\.md' ".gitignore 排除新续接文件"
require_contains ".gitignore" 'NEXT-STEPS\.md' ".gitignore 排除旧续接文件"
require_contains "ai/commands/README.md" '/run sync-methodology' "commands README 包含同步方法论命令"
require_contains "ai/commands/README.md" '/run docs-system-audit' "commands README 包含文档体系审核命令"
require_contains "ai/commands/sync-methodology.md" 'ai/prompts/maintainers/12-sync-template\.md' "sync-methodology 路由到同步 Prompt"
require_contains "ai/commands/docs-system-audit.md" 'ai/prompts/review/16-docs-system-audit\.md' "docs-system-audit 路由到 16 审计 Prompt"
require_contains "ai/commands/template-proposal-summary.md" 'ai/prompts/maintainers/11-template-proposal-summary\.md' "template-proposal-summary 路由到提案汇总 Prompt"
require_contains "ai/commands/template-proposal-summary.md" 'TEMPLATE-UPGRADE:' "template-proposal-summary 覆盖标题型 issue 提案"
require_contains "ai/commands/template-proposal-summary.md" 'proposal.*/ feedback|proposal.*feedback|feedback.*proposal' "template-proposal-summary 覆盖 proposal / feedback issue 标签"
require_contains "template-docs/scenario-guides.md" '处理 issue 提案' "scenario C1 包含 issue 提案入口"
require_contains "template-docs/scenario-guides.md" 'TEMPLATE-UPGRADE:' "scenario C1 覆盖标题型 issue 提案"
require_contains "CONTRIBUTING.md" 'submit-proposal.*/ submit-feedback|submit-proposal.*submit-feedback|submit-feedback.*submit-proposal' "CONTRIBUTING 说明 issue 回流入口"
require_contains "_proposals/README.md" 'GitHub issue' "_proposals README 说明 issue 收件箱"
require_contains "ai/prompts/dev/02-run-task.md" '/run run-dev-task' "run-task Prompt 标注快捷命令"
require_contains "ai/prompts/maintainers/12-sync-template.md" '/run sync-methodology' "同步 Prompt 标注快捷命令"
require_contains "SOP.md" '快捷命令' "SOP 场景索引包含快捷命令列"
require_contains "SOP.md" '/run sync-methodology' "SOP 包含同步方法论快捷命令"
require_contains "INIT-PROMPT.md" 'ai/commands/README\.md' "INIT-PROMPT 指向快捷命令索引"
require_contains "MAINTAINERS.md" 'ai/commands/' "MAINTAINERS 要求维护快捷命令入口"
require_contains "CONTRIBUTING.md" '\.ai/session-handoff\.md' "CONTRIBUTING 说明续接文件不提交"
require_contains "template-docs/session-handoff.example.md" 'AI Session Handoff Example' "会话续接样例标题正确"
require_contains "template-docs/derived-sync-report-template.md" '派生项目模板同步运行记录' "派生同步运行记录模板标题正确"
require_contains "ai/commands/sync-methodology.md" 'derived-sync-report-template' "sync-methodology 命令指向同步运行记录模板"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'derived-sync-report-template' "同步 Prompt 指向同步运行记录模板"
require_contains "ai/prompts/maintainers/12-sync-template.md" '同步运行记录' "同步 Prompt 要求生成同步运行记录"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '同步运行记录' "同步后整理 Prompt 读取同步运行记录"
require_contains "SOP.md" '派生同步运行记录' "SOP 包含派生同步运行记录场景"
require_contains "SOP.md" 'derived-sync-report-template' "SOP 常用命令提示派生同步运行记录模板"
require_contains "MAINTAINERS.md" 'derived-sync-report-template' "MAINTAINERS 要求真实同步沉淀运行记录"
require_contains "CONTRIBUTING.md" 'derived-sync-report-template' "CONTRIBUTING 说明同步运行记录与去项目化回流"

# 场景引导编排层（scenario-guides）：让「说一个场景 → 给引导计划」成为标准交互。
require_file "template-docs/scenario-guides.md"
require_contains "template-docs/scenario-guides.md" '场景路由入口' "scenario-guides 含场景路由入口"
require_contains "template-docs/scenario-guides.md" '引导计划输出契约' "scenario-guides 含引导计划契约"
require_contains "template-docs/scenario-guides.md" 'A0 冷启动' "scenario-guides 含冷启动场景"
require_contains "template-docs/scenario-guides.md" 'M0 帮助 / 能力索引 / 角色选择' "scenario-guides 含 M0 HELP 场景"
require_contains "template-docs/scenario-guides.md" 'ai/prompts/planning/19-plan-phases-and-sprints\.md' "scenario-guides A9 指向阶段 Sprint 规划 Prompt"
require_contains "template-docs/scenario-guides.md" '派生同步验收（跨仓）' "scenario-guides 澄清 C6 跨仓验收"
require_contains "template-docs/scenario-guides.md" '模板能力设计流程' "scenario-guides 澄清 C7 模板能力设计流程"
require_contains "template-docs/scenario-guides.md" 'C8 批量同步所有派生项目' "scenario-guides 含 C8 批量同步场景"
require_contains "ai/prompts/dev/02-run-task.md" 'ai/implementation-lifecycle-rules\.md' "run-task Prompt 读取实现生命周期规则"
require_contains "ai/prompts/dev/02-run-task.md" 'Test Case' "run-task Prompt 要求关联 Test Case"
require_contains "ai/prompts/dev/09-sprint-summary.md" 'Sprint 验收包' "sprint-summary Prompt 输出 Sprint 验收包"
require_contains "template-docs/beginner-guide.md" 'ai/implementation-lifecycle-rules\.md' "beginner-guide 指向实现生命周期规则"
require_contains "SOP.md" 'sync-all-derived' "SOP 含批量同步脚本入口"
require_contains "MAINTAINERS.md" 'sync-all-derived' "MAINTAINERS 含批量同步脚本说明"
require_contains "MAINTAINERS.md" 'e2e-sync-check' "MAINTAINERS 含 L3 端到端回归入口"
require_contains "template-docs/e2e-regression-checklist.md" 'R6' "e2e 回归清单含 R6 PowerShell fallback 项"
require_contains "template-docs/scenario-guides.md" 'mermaid' "scenario-guides 含图表格式默认"
require_contains "template-docs/scenario-guides.md" '当前 `gh` 登录账户' "scenario-guides 账户约定用当前 gh 登录账户（去账户化）"
# 去账户化：scenario-guides 账户约定用「当前 gh 登录账户」（见上条正向断言）。
# 模板仓库地址 emily8421/ai-project-template 是模板自己的家，不属于用户账户默认化，允许出现。
require_file "ai/commands/scenario.md"
require_contains "ai/commands/scenario.md" 'template-docs/scenario-guides\.md' "scenario 命令路由到 scenario-guides"
require_contains "ai/commands/scenario.md" '/run scenario' "scenario 命令含 /run scenario"
require_contains "ai/commands/README.md" '/run scenario' "commands README 含 scenario 元命令"
require_contains "ai/commands/README.md" 'submit-proposal' "commands README 含 submit-proposal 回流命令"
require_contains "template-sync.json" '"template-docs/scenario-guides\.md"' "template-sync 同步 scenario-guides"
require_contains "template-sync.json" '"ai/commands/scenario\.md"' "template-sync 同步 scenario 命令"
require_contains "ai/document-lifecycle-rules.md" '设计文档图表规范' "document-lifecycle 含图表规范"
require_contains "ai/document-lifecycle-rules.md" 'mermaid' "document-lifecycle 图表规范默认 mermaid"
require_contains "ai/project-rules.md" '图表格式偏好' "project-rules 含图表格式偏好填项"
# 防漂移：README/beginner-guide/ai-cli-setup 三处新手话术已收敛到 scenario-guides，不再逐字重复。
require_contains "README.md" 'template-docs/scenario-guides\.md' "README 推荐路径指向 scenario-guides"
require_contains "template-docs/beginner-guide.md" 'template-docs/scenario-guides\.md' "BEGINNER-GUIDE 路径 A 指向 scenario-guides"
require_contains "template-docs/ai-cli-setup.md" 'template-docs/scenario-guides\.md' "AI-CLI-SETUP 指向 scenario-guides"
require_absent_contains "README.md" '按新手 AI CLI 引导路径带我完成' "README 不再保留全量新手话术（已收敛）"
require_absent_contains "template-docs/beginner-guide.md" '按新手 AI CLI 引导路径带我完成' "BEGINNER-GUIDE 不再保留全量新手话术"
require_absent_contains "template-docs/ai-cli-setup.md" '按新手 AI CLI 引导路径带我完成' "AI-CLI-SETUP 不再保留全量新手话术"

# 防文档滞后：根目录人读操作文档必须引用 doc-standards / 16 号审计闭环。
# 避免「脚本层（sync-template / check-template）已自洽、人读文档却滞后」再现
# （v1.17/v1.18 引入 _scaffold/16 时 git-guide §5 漏更即此问题，PR #37 事后补齐；v1.20 起主路径为 ai/doc-standards）。
require_contains "git-guide.md" 'ai/doc-standards' "git-guide §5 说明 doc-standards 规范镜像（防文档滞后）"
require_contains "git-guide.md" '16-docs-system-audit' "git-guide §5 接 16 号审计闭环（防文档滞后）"
require_contains "SOP.md" '16-docs-system-audit' "SOP 场景索引含 16 号审计（防文档滞后）"
require_contains "MAINTAINERS.md" 'require_doc_standards_mirror' "MAINTAINERS 自检说明含 doc-standards 镜像自检（防文档滞后）"
require_contains "MAINTAINERS.md" '防文档滞后断言' "MAINTAINERS 沉淀关键机制防滞后断言规则"
require_contains "MAINTAINERS.md" '不放具体维护者账号' "MAINTAINERS 说明个人账号信息不进入同步文档"
require_contains "SOP.md" '### 派生项目使用者' "SOP 常用命令区分派生项目使用者"
require_contains "SOP.md" '### 模板维护者' "SOP 常用命令区分模板维护者"
require_contains "SOP.md" 'Windows 脚本入口选择' "SOP 包含 Windows 脚本入口矩阵"
require_contains "scripts/new-project.sh" 'ai/project-rules\.md.*首次必填 checklist' "new-project 生成 project-rules 首次必填 checklist"
require_contains "SOP.md" '新建派生项目' "SOP 索引包含新建派生项目场景"
require_contains "SOP.md" '第一次准备开发环境' "SOP 索引包含环境准备场景"
require_contains "SOP.md" '运行新手烟测' "SOP 索引包含新手烟测场景"
require_contains "SOP.md" '记录新手烟测结果' "SOP 索引包含烟测记录场景"
require_contains "SOP.md" '安装 AI CLI 工具' "SOP 索引包含 AI CLI 安装场景"
require_contains "SOP.md" '根 `README\.md` 不参与下行同步' "SOP 说明 README 不同步"
require_contains "SOP.md" '派生项目同步模板' "SOP 索引包含派生项目同步模板场景"
require_contains "SOP.md" '不跑模板自检' "SOP 说明派生同步不跑模板自检"
require_contains "SOP.md" '同步后项目整理' "SOP 索引包含同步后项目整理场景"
require_contains "SOP.md" 'ai/prompts/maintainers/15-post-sync-cleanup\.md' "SOP 指向同步后整理 Prompt"
require_contains "SOP.md" '采集本机环境' "SOP 索引包含环境采集场景"
require_contains "SOP.md" '模板优化提案汇总' "SOP 索引包含模板回流场景"
require_contains "git-guide.md" '新建派生项目的\*\*操作 SOP 权威文档' "git-guide 标明新建项目 SOP 权威"
require_contains "git-guide.md" 'bash scripts/new-project\.sh <项目名>' "git-guide 推荐 new-project 脚本"
require_contains "git-guide.md" '不推荐手工复制整个模板文件夹' "git-guide 禁止手工复制模板作为标准流程"
require_contains "git-guide.md" '操作 SOP 权威文档' "git-guide 标明下行同步 SOP 权威"
require_contains "git-guide.md" 'template-sync\.json' "git-guide 同步流程引用 template-sync.json"
require_contains "git-guide.md" '根 `README\.md` 是项目件' "git-guide 说明 README 不同步"
require_contains "git-guide.md" '低于 `v1\.6\.8`' "git-guide 区分旧派生项目首次同步路径"
require_contains "git-guide.md" 'v1\.6\.8\+ 后续同步' "git-guide 区分新版派生项目后续同步路径"
require_contains "git-guide.md" 'check-template\.sh` / `scripts/check-template\.ps1` 都是\*\*模板仓库完整性自检' "git-guide 禁止用模板自检验收派生同步"
require_contains "git-guide.md" 'check-derived-sync\.ps1' "git-guide 使用派生同步边界检查"
require_contains "git-guide.md" '同步后进入标准闭环' "git-guide 说明同步后标准闭环"
require_contains "git-guide.md" 'sync-records/template-sync/YYYY-MM-DD-sync-template-vX\.Y\.Z\.md' "git-guide 统一同步报告推荐路径"
require_contains "git-guide.md" 'project-check\.yml' "git-guide 说明派生项目 workflow"
require_contains "git-guide.md" '普通 PR 不应使用该 workflow' "git-guide 禁止派生普通 PR 继承模板 workflow"
require_contains "CONTRIBUTING.md" 'git-guide\.md.*§5' "CONTRIBUTING 指向 git-guide 下行同步 SOP"
require_contains "git-guide.md" 'chore/sync-template-vX\.Y\.Z' "git-guide 使用三段式同步分支"
require_contains "git-guide.md" 'bootstrap latest sync script' "git-guide 包含同步脚本 bootstrap 步骤"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'bootstrap 最新同步脚本' "同步 Prompt 包含 bootstrap 步骤"
require_contains "ai/prompts/maintainers/12-sync-template.md" '标准 SOP Prompt' "同步 Prompt 包含派生项目同步 SOP Prompt"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'git show FETCH_HEAD:VERSION' "同步 Prompt 从 VERSION 读取目标版本"
require_contains "ai/prompts/maintainers/12-sync-template.md" '不要使用本 Prompt 文本中的示例版本号' "同步 Prompt 禁止固定版本号"
require_contains "ai/prompts/maintainers/12-sync-template.md" '低于 `v1\.6\.8`' "同步 Prompt 区分旧派生项目首次同步路径"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'check-derived-sync\.ps1' "同步 Prompt 使用派生同步边界检查"
require_contains "ai/prompts/maintainers/12-sync-template.md" '不要运行 `scripts/check-template\.sh` 或 `scripts/check-template\.ps1`' "同步 Prompt 禁止用模板自检验收派生同步"
require_contains "ai/prompts/maintainers/12-sync-template.md" '标准闭环计划' "同步 Prompt 先输出标准闭环计划"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'docs-system-audit` 的同步后审计模式' "同步 Prompt 串联同步后文档审计"
require_contains "ai/prompts/maintainers/12-sync-template.md" '普通 PR 不应运行 `scripts/check-template\.sh`' "同步 Prompt 检查派生 workflow 不跑模板自检"
require_contains "ai/prompts/maintainers/12-sync-template.md" '是否需要人工迁移 project-rules' "同步 Prompt 提醒项目规则人工迁移"
require_contains "ai/prompts/maintainers/12-sync-template.md" 'collect-env' "同步 Prompt 提醒环境采集"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '同步到 v1\.7\.0\+' "同步后整理 Prompt 提醒 v1.7+ 交付物审计"
require_contains "ai/prompts/setup/14-new-project.md" '从模板新建派生项目' "新建项目 Prompt 标题正确"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '同步后项目整理' "同步后整理 Prompt 标题正确"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '同步报告回写建议' "同步后整理 Prompt 输出同步报告回写建议"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" 'project-check\.yml' "同步后整理 Prompt 提醒迁移派生 workflow"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" 'docs/env/local-env\.md' "同步后整理 Prompt 检查 local-env"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '§2\.5「运行环境与资源约束」' "同步后整理 Prompt 检查 project-rules §2.5"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '部署 / 运行拓扑约束' "同步后整理 Prompt 检查 04 运行拓扑"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '运行环境与资源评估' "同步后整理 Prompt 检查 05 资源评估"
require_contains "ai/prompts/maintainers/15-post-sync-cleanup.md" '本机资源验证' "同步后整理 Prompt 检查 09 本机资源验证"
require_contains "ai/prompts/review/16-docs-system-audit.md" '同步后审计模式' "文档审计 Prompt 支持同步后审计模式"
require_contains "template-docs/scenario-guides.md" '项目验证建议 · 已形成或更新同步报告' "A13 完成判据包含验证建议和同步报告"
require_contains "template-docs/derived-sync-report-template.md" '同步后整理摘要' "同步报告模板包含整理摘要"
require_contains "template-docs/derived-sync-report-template.md" '文档体系审计摘要' "同步报告模板包含文档审计摘要"
require_contains "template-docs/derived-sync-report-template.md" '项目验证建议' "同步报告模板包含项目验证建议"
require_contains "scripts/new-project.sh" 'project-check\.yml' "new-project 生成派生项目 workflow"
require_contains "scripts/new-project.sh" 'Not a template sync commit; skip derived sync boundary check' "派生 workflow 普通 PR 跳过同步边界检查"
require_contains "scripts/new-project.sh" 'bash scripts/check-derived-sync\.sh HEAD' "派生 workflow 同步提交运行边界检查"
require_contains "scripts/new-project.sh" 'rm -f "\$TARGET/\.github/workflows/template-check\.yml"' "new-project 移除模板仓 workflow"
require_contains "scripts/sync-template.sh" 'Detected|检测到 \.github/workflows/template-check\.yml' "sync-template 提醒旧派生 workflow 迁移"
require_contains "scripts/sync-template.ps1" 'Detected \.github/workflows/template-check\.yml' "sync-template.ps1 提醒旧派生 workflow 迁移"
require_contains ".github/workflows/template-check.yml" 'Template repository workflow only' "模板 workflow 标明仅模板仓使用"
require_contains "ai/prompts/setup/14-new-project.md" '不要先手工复制模板文件夹再运行 new-project\.sh' "新建项目 Prompt 禁止错误流程"
require_contains "ai/prompts/setup/14-new-project.md" '默认远端：bash scripts/new-project\.sh <项目名>' "新建项目 Prompt 使用默认远端命令"
require_contains "ai/prompts/setup/14-new-project.md" '--account <账号>' "新建项目 Prompt 支持显式指定账号"
require_contains ".github/pull_request_template.md" '提案检查' "PR 模板包含提案检查"
require_contains ".github/pull_request_template.md" 'VERSION' "PR 模板检查 VERSION"
require_contains ".github/ISSUE_TEMPLATE/template-change.md" 'vMAJOR\.MINOR\.PATCH' "Issue 模板说明三段式版本"
check_project_bootstrap_scripts
require_contains "scripts/sync-template.sh" '"VERSION"' "sync-template 同步 VERSION"
require_contains "scripts/sync-template.sh" 'REF:VERSION' "sync-template 从 VERSION 解析版本"
require_contains "scripts/sync-template.sh" 'REMOTE_SCRIPT_HASH' "sync-template 检查远端脚本 hash"
require_contains "scripts/sync-template.sh" 'bootstrap latest sync script' "sync-template 提示 bootstrap 同步脚本"
require_contains "scripts/sync-template.sh" 'remote_file_matches_local' "sync-template dry-run 使用 hash 判断差异"
require_contains "scripts/sync-template.sh" 'show_local_to_template_stat' "sync-template dry-run 按本地到模板方向统计"
require_contains "scripts/sync-template.sh" '本地当前文件 -> 模板' "sync-template dry-run 明确统计方向"
require_sync_notice
require_sync_dry_run_direction
require_new_project_local_smoke
require_doc_standards_mirror

echo
echo "==> 检查同步清单一致性"
while IFS= read -r sync_file; do
  [[ -n "$sync_file" ]] || continue
  require_file "$sync_file"
  require_contains "template-sync.json" "$(printf '%s' "$sync_file" | sed 's/[.[\*^$()+?{}|\\]/\\&/g')" "template-sync.json 包含 $sync_file"
done < <(extract_sync_files)

echo
echo "==> 检查参考样例完整性"
require_file "_examples/README.md"
require_contains "_examples/README.md" 'vision-to-product/' "示例导航包含 vision-to-product"
require_contains "_examples/README.md" 'quick-script/' "示例导航包含 quick-script"
require_contains "_examples/README.md" 'todo-api/' "示例导航包含 todo-api"

require_absent_dir "_examples/text-cleaner-cli"
require_absent_dir "_examples/text-normalizer-lib"
require_absent_dir "_examples/md-notes-frontend"

require_example_common "_examples/vision-to-product"
require_contains "_examples/vision-to-product/OVERVIEW.md" 'ai/prompts/docs/00-generate-or-complete-docs\.md' "_examples/vision-to-product 指向文档生成 Prompt"
require_example_docs "_examples/vision-to-product" \
  00-scenario.md \
  01-user-requirements.md \
  02-srs.md \
  03-prd.md \
  04-architecture.md \
  05-tech-spec.md \
  06-db-design.md \
  07-api-spec.md \
  08-dev-plan.md \
  09-verification.md
require_example_deliverable_shape "_examples/vision-to-product"

require_example_common "_examples/quick-script"
require_example_docs "_examples/quick-script" \
  00-scenario.md \
  01-user-requirements.md \
  02-srs.md \
  03-prd.md \
  04-architecture.md \
  05-tech-spec.md \
  08-dev-plan.md \
  09-verification.md
require_example_deliverable_shape "_examples/quick-script"
require_absent_file "_examples/quick-script/docs/06-db-design.md"
require_absent_file "_examples/quick-script/docs/07-api-spec.md"

require_example_common "_examples/todo-api"
require_example_docs "_examples/todo-api" \
  00-scenario.md \
  01-user-requirements.md \
  02-srs.md \
  03-prd.md \
  04-architecture.md \
  05-tech-spec.md \
  06-db-design.md \
  07-api-spec.md \
  08-dev-plan.md \
  09-verification.md
require_example_deliverable_shape "_examples/todo-api"

echo
if [[ "$FAILURES" -eq 0 ]]; then
  echo "✅ 模板自检通过"
else
  echo "❌ 模板自检失败：$FAILURES 项" >&2
  exit 1
fi
