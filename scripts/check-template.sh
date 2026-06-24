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

require_example_common() {
  local example_dir="$1"
  require_dir "$example_dir"
  require_file "$example_dir/OVERVIEW.md"
  require_file "$example_dir/ai/project-rules.md"
  require_contains "$example_dir/ai/project-rules.md" '初始化必填检查' "$example_dir project-rules 含初始化必填检查"
  require_contains "$example_dir/ai/project-rules.md" 'AI修改确认规则' "$example_dir project-rules 含 AI 修改确认规则"
  require_contains "$example_dir/ai/project-rules.md" 'docs/README\.md' "$example_dir project-rules 含 docs 分区规则检查"
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
  require_contains "$project_dir/README.md" 'docs/vision/product-vision\.md' "new-project 烟测 README 从产品愿景起步"
  require_contains "$project_dir/README.md" 'docs/env/local-env\.md' "new-project 烟测 README 提醒环境采集"
  require_contains "$project_dir/README.md" 'INIT-PROMPT\.md` §0' "new-project 烟测 README 指向愿景 Prompt"
  require_file "$project_dir/_proposals/README.md"
  require_file "$project_dir/scripts/collect-env.ps1"
  require_absent_dir "$project_dir/_examples"
  require_absent_dir "$project_dir/_archive"

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
require_dir "docs/design"
require_dir "docs/decisions"
require_dir "docs/research"
require_dir "docs/meetings"
require_dir "docs/archive"
require_file "docs/README.md"
require_file "docs/env/README.md"
require_contains "docs/README.md" '根目录只放核心文档' "docs README 约束根目录只放核心文档"
require_contains "docs/README.md" 'docs/design/' "docs README 说明详细设计目录"
require_contains "docs/README.md" 'AI 新增文档规则' "docs README 说明 AI 新增文档规则"
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
require_file "CHANGELOG.md"
require_file "MAINTAINERS.md"
require_file "template-sync.json"
require_contains "VERSION" '^v[0-9]+\.[0-9]+\.[0-9]+$' "VERSION 使用三段式模板版本号"
require_contains "CHANGELOG.md" 'v1\.6\.9' "CHANGELOG 包含当前版本 v1.6.9"
require_contains "MAINTAINERS.md" '发布 Checklist' "MAINTAINERS 包含发布 checklist"
require_contains "MAINTAINERS.md" 'template-sync\.json' "MAINTAINERS 说明同步清单维护"
require_contains "MAINTAINERS.md" 'README\.md.*轻量' "MAINTAINERS 约束 README 保持轻量"
require_contains "MAINTAINERS.md" 'Sync notice' "MAINTAINERS 说明同步文档提示块"
require_contains "MAINTAINERS.md" '根 `README\.md` 是项目专属文档' "MAINTAINERS 说明派生 README 不同步"
require_contains "template-sync.json" '"files"' "template-sync.json 包含同步文件清单"
require_contains "template-sync.json" '"CHANGELOG\.md"' "template-sync 同步 CHANGELOG"
require_contains "template-sync.json" '"MAINTAINERS\.md"' "template-sync 同步 MAINTAINERS"
require_contains "template-sync.json" '"docs/README\.md"' "template-sync 同步 docs README"
require_contains "template-sync.json" '"scripts/check-derived-sync\.sh"' "template-sync 同步派生边界检查 Bash 入口"
require_contains "template-sync.json" '"scripts/check-derived-sync\.ps1"' "template-sync 同步派生边界检查 PowerShell 入口"
require_contains "ai/global-rules.md" '全局规则版本：v[0-9]+\.[0-9]+' "global-rules 含全局规则版本号"
require_file "README.md"
require_file "CONTRIBUTING.md"
require_file "SOP.md"
require_file "INIT-PROMPT.md"
require_file "git-guide.md"
require_file ".github/workflows/template-check.yml"
require_file ".github/pull_request_template.md"
require_file ".github/ISSUE_TEMPLATE/template-change.md"
require_file "scripts/new-project.sh"
require_file "scripts/sync-template.sh"
require_file "scripts/sync-template.ps1"
require_file "scripts/check-template.sh"
require_file "scripts/check-template.ps1"
require_file "scripts/check-derived-sync.sh"
require_file "scripts/check-derived-sync.ps1"
require_file "scripts/collect-env.ps1"
require_file "_proposals/README.md"
require_file "_archive/proposals/README.md"
require_contains "_proposals/README.md" '模板优化提案收件箱' "_proposals README 标明提案收件箱"
require_contains "_proposals/README.md" 'TEMPLATE-UPGRADE-vX\.Y\.Z' "_proposals README 说明三段式提案命名"
require_contains "_proposals/README.md" '任何需要修改项目模板' "_proposals README 说明提案先行"
require_contains "_archive/proposals/README.md" 'VERSION' "归档 README 以 VERSION 为事实来源"
require_contains "CONTRIBUTING.md" '提案 → 分支 → PR → 评审 → 合并 → 归档' "CONTRIBUTING 含提案先行流程"
require_contains "CONTRIBUTING.md" 'vMAJOR\.MINOR\.PATCH' "CONTRIBUTING 含三段式版本规则"
require_contains "README.md" 'SOP\.md' "README 包含 SOP 索引入口"
require_contains "README.md" '5 分钟最小路径' "README 包含 5 分钟最小路径"
require_contains "README.md" 'docs/vision/product-vision\.md' "README 最小路径从产品愿景起步"
require_contains "README.md" 'docs/env/local-env\.md' "README 最小路径先采集本机环境"
require_contains "README.md" '本机 Demo 可行性' "README 最小路径要求确认本机 Demo 可行性"
require_contains "README.md" 'MAINTAINERS\.md' "README 指向 MAINTAINERS"
require_contains "README.md" 'CHANGELOG\.md' "README 指向 CHANGELOG"
require_contains "README.md" 'docs/README\.md' "README 指向 docs 分区规则"
require_contains "README.md" 'check-template\.ps1' "README 说明 PowerShell 自检入口"
require_contains "README.md" 'v1\.6\.9' "README 最近版本摘要包含 v1.6.9"
require_contains "CHANGELOG.md" 'docs/design/' "CHANGELOG 记录 docs/design 分区变更"
require_contains "ai/global-rules.md" 'docs/README\.md' "global-rules 引用 docs 分区规则"
require_contains "ai/global-rules.md" 'docs/design/<子系统>\.md' "global-rules 使用 docs/design 子系统设计路径"
require_contains "INIT-PROMPT.md" 'docs/design/\*' "INIT-PROMPT 使用 docs/design 详细设计路径"
require_contains "ai/project-rules.md" 'docs/README\.md' "project-rules 初始化检查引用 docs 分区规则"
require_contains ".github/workflows/template-check.yml" 'scripts/check-template\.sh' "GitHub Actions 运行模板自检"
require_contains ".github/workflows/template-check.yml" 'git diff --check' "GitHub Actions 运行 diff 空白检查"
require_contains ".github/workflows/template-check.yml" 'git diff-tree --check' "GitHub Actions 处理新分支 push 空白检查"
require_contains "scripts/sync-template.sh" 'template-sync\.json' "sync-template 从 template-sync.json 读取同步清单"
require_contains "scripts/sync-template.ps1" 'sync-template\.sh' "sync-template PowerShell 入口调用 Bash 脚本"
require_contains "scripts/check-template.ps1" 'check-template\.sh' "check-template PowerShell 入口调用 Bash 脚本"
require_contains "scripts/check-derived-sync.ps1" 'check-derived-sync\.sh' "check-derived-sync PowerShell 入口调用 Bash 脚本"
require_contains "scripts/check-derived-sync.sh" '同步清单外变更' "check-derived-sync 检查同步清单外变更"
require_contains "scripts/check-derived-sync.sh" 'README\.md\|ai/project-rules\.md\|docs/0\[0-9\]-\*' "check-derived-sync 保护项目专属文件"
require_contains "scripts/check-derived-sync.sh" 'git show --name-only --stat' "check-derived-sync 输出最近同步提交文件"
require_contains "SOP.md" '新建派生项目' "SOP 索引包含新建派生项目场景"
require_contains "SOP.md" '根 `README\.md` 不参与下行同步' "SOP 说明 README 不同步"
require_contains "SOP.md" '派生项目同步模板' "SOP 索引包含派生项目同步模板场景"
require_contains "SOP.md" '不跑模板自检' "SOP 说明派生同步不跑模板自检"
require_contains "SOP.md" '同步后项目整理' "SOP 索引包含同步后项目整理场景"
require_contains "SOP.md" 'INIT-PROMPT\.md` §15' "SOP 指向同步后整理 Prompt"
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
require_contains "CONTRIBUTING.md" 'git-guide\.md.*§5' "CONTRIBUTING 指向 git-guide 下行同步 SOP"
require_contains "git-guide.md" 'chore/sync-template-vX\.Y\.Z' "git-guide 使用三段式同步分支"
require_contains "git-guide.md" 'bootstrap latest sync script' "git-guide 包含同步脚本 bootstrap 步骤"
require_contains "INIT-PROMPT.md" 'bootstrap 最新同步脚本' "INIT-PROMPT 同步流程包含 bootstrap 步骤"
require_contains "INIT-PROMPT.md" '标准 SOP Prompt' "INIT-PROMPT 包含派生项目同步 SOP Prompt"
require_contains "INIT-PROMPT.md" 'git show FETCH_HEAD:VERSION' "INIT-PROMPT SOP Prompt 从 VERSION 读取目标版本"
require_contains "INIT-PROMPT.md" '不要使用本 Prompt 文本中的示例版本号' "INIT-PROMPT SOP Prompt 禁止固定版本号"
require_contains "INIT-PROMPT.md" '低于 `v1\.6\.8`' "INIT-PROMPT 区分旧派生项目首次同步路径"
require_contains "INIT-PROMPT.md" 'check-derived-sync\.ps1' "INIT-PROMPT 使用派生同步边界检查"
require_contains "INIT-PROMPT.md" '不要运行 `scripts/check-template\.sh` 或 `scripts/check-template\.ps1`' "INIT-PROMPT 禁止用模板自检验收派生同步"
require_contains "INIT-PROMPT.md" '是否需要人工迁移 project-rules' "INIT-PROMPT SOP Prompt 提醒项目规则人工迁移"
require_contains "INIT-PROMPT.md" 'collect-env' "INIT-PROMPT SOP Prompt 提醒环境采集"
require_contains "INIT-PROMPT.md" '从模板新建派生项目' "INIT-PROMPT 包含新建项目 SOP Prompt"
require_contains "INIT-PROMPT.md" '同步后项目整理' "INIT-PROMPT 包含同步后项目整理 Prompt"
require_contains "INIT-PROMPT.md" 'docs/env/local-env\.md' "同步后整理 Prompt 检查 local-env"
require_contains "INIT-PROMPT.md" '§2\.5「运行环境与资源约束」' "同步后整理 Prompt 检查 project-rules §2.5"
require_contains "INIT-PROMPT.md" '部署 / 运行拓扑约束' "同步后整理 Prompt 检查 04 运行拓扑"
require_contains "INIT-PROMPT.md" '运行环境与资源评估' "同步后整理 Prompt 检查 05 资源评估"
require_contains "INIT-PROMPT.md" '本机资源验证' "同步后整理 Prompt 检查 09 本机资源验证"
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
require_contains "scripts/new-project.sh" 'docs/vision/product-vision\.md' "new-project README 从产品愿景起步"
require_contains "scripts/new-project.sh" '§0 给 AI' "new-project README 使用愿景生成完整文档体系 Prompt"
require_contains "scripts/new-project.sh" 'docs/README\.md' "new-project README 指向文档分区规则"
require_contains "scripts/new-project.sh" 'docs/design/' "new-project README 使用 docs/design 详细设计目录"
require_contains "scripts/new-project.sh" '## 当前阶段' "new-project README 包含当前阶段版块"
require_contains "scripts/new-project.sh" '## 运行环境' "new-project README 包含运行环境版块"
require_contains "scripts/new-project.sh" '## 开发计划' "new-project README 包含开发计划版块"
require_contains "scripts/new-project.sh" '## 验证方式' "new-project README 包含验证方式版块"
require_contains "scripts/new-project.sh" '根 \\`README\.md\\` 是项目专属文档，不参与模板下行同步' "new-project README 说明根 README 不同步"
require_contains "scripts/new-project.sh" 'template-sync\.json' "new-project README 说明模板同步清单"
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
require_sync_notice
require_sync_dry_run_direction
require_new_project_local_smoke

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
