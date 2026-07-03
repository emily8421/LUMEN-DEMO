#!/usr/bin/env bash
# e2e-sync-check.sh — L3 端到端回归发布门（可自动化部分）
#
# 用法:
#   bash scripts/e2e-sync-check.sh
#
# 聚合 L3 可自动化回归：check-template（含同步链路 doc-standards 镜像自检 + 新项目烟测）
# + sync-all-derived 批量烟测。不重复 check-template 内部测试，只做发布门聚合 + 批量烟测。
# 不可自动化项（场景引导路由 / 文档生成 / PowerShell fallback）见
# template-docs/e2e-regression-checklist.md，人工跑并记到 e2e-report-template.md。
# 随模板下行同步（在 template-sync.json）；不改真实项目。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAILURES=0

echo "==> L3 端到端回归发布门（可自动化部分）"
echo

echo "── [1/2] check-template（同步链路 + doc-standards 镜像 + 新项目烟测 + 同步清单一致性）──"
if bash scripts/check-template.sh >/dev/null 2>&1; then
  echo "✓ check-template 通过"
else
  echo "✗ check-template 失败（详跑 bash scripts/check-template.sh）" >&2
  FAILURES=$((FAILURES+1))
fi
echo

echo "── [2/2] sync-all-derived 批量烟测（造 2 假派生 + 1 非派生）──"
TMP="$(mktemp -d)"
for d in e2e-d1 e2e-d2; do
  mkdir -p "$TMP/$d/docs" "$TMP/$d/scripts"
  printf 'v0.0.1\n' > "$TMP/$d/VERSION"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$TMP/$d/scripts/sync-template.sh"
  (cd "$TMP/$d" && git init -q && git add -A && git -c user.name=t -c user.email=t@t commit -qm init) >/dev/null 2>&1
done
mkdir -p "$TMP/notderived"
if bash scripts/sync-all-derived.sh "$TMP" --dry-run >/dev/null 2>&1; then
  echo "✓ sync-all-derived 批量 dry-run 通过"
else
  echo "✗ sync-all-derived 批量 dry-run 失败" >&2
  FAILURES=$((FAILURES+1))
fi
rm -rf "$TMP"
echo

echo "⚠ 人工项（R4 场景引导路由 / R5 文档生成 / R6 PowerShell fallback）见"
echo "   template-docs/e2e-regression-checklist.md，按表跑并记到 e2e-report-template.md"
echo

if [[ $FAILURES -eq 0 ]]; then
  echo "✅ L3 可自动化回归通过（人工项见 checklist）"
  exit 0
else
  echo "❌ L3 回归失败：$FAILURES 项"
  exit 1
fi
