#!/usr/bin/env bash
# check-template.sh — 检查 ai-project-template 的关键入口、文档骨架与同步清单是否自洽
#
# 用法:
#   bash scripts/check-template.sh
#
# 说明: 本脚本只读取文件并输出检查结果，不修改工作区。
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

extract_index_rules() {
  grep -E '^- ai/.+\.md$' ai/index.md | sed 's/^- //'
}

extract_sync_files_from_script() {
  awk '
    /^SYNC_FILES=\(/ { in_list=1; next }
    in_list && /^\)/ { in_list=0; next }
    in_list {
      gsub(/["[:space:]]/, "")
      if (length($0) > 0) print $0
    }
  ' scripts/sync-template.sh
}

require_example_common() {
  local example_dir="$1"
  require_dir "$example_dir"
  require_file "$example_dir/OVERVIEW.md"
  require_file "$example_dir/ai/project-rules.md"
  require_contains "$example_dir/ai/project-rules.md" '初始化必填检查' "$example_dir project-rules 含初始化必填检查"
  require_contains "$example_dir/ai/project-rules.md" 'AI修改确认规则' "$example_dir project-rules 含 AI 修改确认规则"
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
    cp "$ROOT/scripts/check-template.sh" scripts/check-template.sh
    cp "$ROOT/scripts/collect-env.ps1" scripts/collect-env.ps1
    printf 'v9.9.9\n' > VERSION
    printf '# index\n' > ai/index.md
    printf '# global\n' > ai/global-rules.md
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
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
    printf 'agent\n' > AGENTS.md
    printf 'claude\n' > CLAUDE.md
    printf 'cursor\n' > .cursor/rules/project-rules.mdc
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
require_file "docs/env/README.md"
require_contains "docs/env/README.md" 'collect-env\.ps1' "docs/env README 说明环境采集脚本"
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
require_contains "VERSION" '^v[0-9]+\.[0-9]+\.[0-9]+$' "VERSION 使用三段式模板版本号"
require_contains "ai/global-rules.md" '全局规则版本：v[0-9]+\.[0-9]+' "global-rules 含全局规则版本号"
require_file "README.md"
require_file "CONTRIBUTING.md"
require_file "INIT-PROMPT.md"
require_file "git-guide.md"
require_file ".github/pull_request_template.md"
require_file ".github/ISSUE_TEMPLATE/template-change.md"
require_file "scripts/new-project.sh"
require_file "scripts/sync-template.sh"
require_file "scripts/check-template.sh"
require_file "scripts/collect-env.ps1"
require_file "_proposals/README.md"
require_file "_archive/proposals/README.md"
require_contains "_proposals/README.md" '模板优化提案收件箱' "_proposals README 标明提案收件箱"
require_contains "_proposals/README.md" 'TEMPLATE-UPGRADE-vX\.Y\.Z' "_proposals README 说明三段式提案命名"
require_contains "_proposals/README.md" '任何需要修改项目模板' "_proposals README 说明提案先行"
require_contains "_archive/proposals/README.md" 'VERSION' "归档 README 以 VERSION 为事实来源"
require_contains "CONTRIBUTING.md" '提案 → 分支 → PR → 评审 → 合并 → 归档' "CONTRIBUTING 含提案先行流程"
require_contains "CONTRIBUTING.md" 'vMAJOR\.MINOR\.PATCH' "CONTRIBUTING 含三段式版本规则"
require_contains "README.md" 'v1\.6\.3' "README 版本记录包含 v1.6.3"
require_contains "git-guide.md" '新建派生项目的\*\*操作 SOP 权威文档' "git-guide 标明新建项目 SOP 权威"
require_contains "git-guide.md" 'bash scripts/new-project\.sh <项目名>' "git-guide 推荐 new-project 脚本"
require_contains "git-guide.md" '不推荐手工复制整个模板文件夹' "git-guide 禁止手工复制模板作为标准流程"
require_contains "git-guide.md" '操作 SOP 权威文档' "git-guide 标明下行同步 SOP 权威"
require_contains "CONTRIBUTING.md" 'git-guide\.md.*§5' "CONTRIBUTING 指向 git-guide 下行同步 SOP"
require_contains "git-guide.md" 'chore/sync-template-vX\.Y\.Z' "git-guide 使用三段式同步分支"
require_contains "git-guide.md" 'bootstrap latest sync script' "git-guide 包含同步脚本 bootstrap 步骤"
require_contains "INIT-PROMPT.md" 'bootstrap 最新同步脚本' "INIT-PROMPT 同步流程包含 bootstrap 步骤"
require_contains "INIT-PROMPT.md" '标准 SOP Prompt' "INIT-PROMPT 包含派生项目同步 SOP Prompt"
require_contains "INIT-PROMPT.md" 'git show FETCH_HEAD:VERSION' "INIT-PROMPT SOP Prompt 从 VERSION 读取目标版本"
require_contains "INIT-PROMPT.md" '不要使用本 Prompt 文本中的示例版本号' "INIT-PROMPT SOP Prompt 禁止固定版本号"
require_contains "INIT-PROMPT.md" '是否需要人工迁移 project-rules' "INIT-PROMPT SOP Prompt 提醒项目规则人工迁移"
require_contains "INIT-PROMPT.md" 'collect-env' "INIT-PROMPT SOP Prompt 提醒环境采集"
require_contains "INIT-PROMPT.md" '从模板新建派生项目' "INIT-PROMPT 包含新建项目 SOP Prompt"
require_contains "INIT-PROMPT.md" '不要先手工复制模板文件夹再运行 new-project\.sh' "INIT-PROMPT 新建项目 Prompt 禁止错误流程"
require_contains "INIT-PROMPT.md" 'bash scripts/new-project\.sh <项目名>' "INIT-PROMPT 新建项目 Prompt 使用 new-project 脚本"
require_contains ".github/pull_request_template.md" '提案检查' "PR 模板包含提案检查"
require_contains ".github/pull_request_template.md" 'VERSION' "PR 模板检查 VERSION"
require_contains ".github/ISSUE_TEMPLATE/template-change.md" 'vMAJOR\.MINOR\.PATCH' "Issue 模板说明三段式版本"
require_contains "scripts/new-project.sh" 'rm -rf "\$TARGET/_proposals"' "new-project 清理模板提案收件箱内容"
require_contains "scripts/new-project.sh" 'mkdir -p "\$TARGET/_proposals"' "new-project 创建派生提案起草区"
require_contains "scripts/new-project.sh" 'cat > "\$TARGET/README.md"' "new-project 项目化 README"
require_contains "scripts/new-project.sh" '--no-remote' "new-project 支持本地-only 烟测"
require_contains "scripts/new-project.sh" 'collect-env\.ps1' "new-project README 提醒采集本机环境"
require_contains "scripts/collect-env.ps1" 'docs/env/local-env\.md' "collect-env 默认生成 local-env.md"
require_contains "scripts/collect-env.ps1" '人工确认项' "collect-env 保留人工确认项"
require_contains "scripts/collect-env.ps1" '服务器资源预案' "collect-env 保留服务器资源预案"
require_contains "scripts/sync-template.sh" '"VERSION"' "sync-template 同步 VERSION"
require_contains "scripts/sync-template.sh" 'REF:VERSION' "sync-template 从 VERSION 解析版本"
require_contains "scripts/sync-template.sh" 'REMOTE_SCRIPT_HASH' "sync-template 检查远端脚本 hash"
require_contains "scripts/sync-template.sh" 'bootstrap latest sync script' "sync-template 提示 bootstrap 同步脚本"
require_contains "scripts/sync-template.sh" 'remote_file_matches_local' "sync-template dry-run 使用 hash 判断差异"
require_contains "scripts/sync-template.sh" 'show_local_to_template_stat' "sync-template dry-run 按本地到模板方向统计"
require_contains "scripts/sync-template.sh" '本地当前文件 -> 模板' "sync-template dry-run 明确统计方向"
require_sync_dry_run_direction

echo
echo "==> 检查同步清单一致性"
while IFS= read -r sync_file; do
  [[ -n "$sync_file" ]] || continue
  require_file "$sync_file"
  require_contains "README.md" "$(printf '%s' "$sync_file" | sed 's/[.[\*^$()+?{}|\\]/\\&/g')" "README 同步清单包含 $sync_file"
done < <(extract_sync_files_from_script)

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

echo
if [[ "$FAILURES" -eq 0 ]]; then
  echo "✅ 模板自检通过"
else
  echo "❌ 模板自检失败：$FAILURES 项" >&2
  exit 1
fi
