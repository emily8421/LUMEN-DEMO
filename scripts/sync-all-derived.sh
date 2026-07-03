#!/usr/bin/env bash
# sync-all-derived.sh — 批量同步父目录下所有派生项目到最新模板方法论（维护者用）
#
# 用法:
#   bash scripts/sync-all-derived.sh [父目录] [--dry-run|--commit] [--template <url>]
#
# 默认父目录为当前目录；默认 --dry-run（只预览，不写）。
# 用途: 维护者发新模板版本后，一条指令批量更新父目录下的多个派生项目，
#       不用逐个进派生项目终端。
#
# 每个派生项目是独立 git 仓；本脚本逐个进入、跑该项目的
# scripts/sync-template.sh + scripts/check-derived-sync.sh，再汇总。
# 随模板下行同步（在 template-sync.json）；维护者批量同步工具，类似 check-template。
#
# 派生项目判据: 子目录含 VERSION + scripts/sync-template.sh + docs/，
#               且不含 _examples/（模板本体标识）。
# 工作区有未提交跟踪改动 / 非派生项目 / 同步失败 的项目会被跳过并在汇总里标注，
# 绝不强行写入（未跟踪的项目内容如 docs/inputs 不阻塞）。
#
# 注意: --commit 会在每个派生项目的「当前分支」上提交 sync commit；
#       若要 PR-per-project 的可审计流程，改用 /run sync-methodology（A13）逐个走。
set -uo pipefail

PARENT_DIR="."
MODE="--dry-run"
TEMPLATE_URL="https://github.com/emily8421/ai-project-template.git"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) MODE="--dry-run"; shift;;
    --commit) MODE="--commit"; shift;;
    --template) TEMPLATE_URL="$2"; shift 2;;
    -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    -*) echo "未知选项: $1" >&2; exit 2;;
    *) PARENT_DIR="$1"; shift;;
  esac
done

echo "==> 批量同步派生项目"
echo "    父目录: $PARENT_DIR"
echo "    模板远端: $TEMPLATE_URL"
echo "    模式: $MODE"

# 读取模板目标版本（汇总标题用；失败不阻断）
TARGET_VERSION=""
TMPV="$(mktemp -d)"
if git clone --depth=1 --no-checkout "$TEMPLATE_URL" "$TMPV/repo" >/dev/null 2>&1; then
  TARGET_VERSION="$(git -C "$TMPV/repo" show HEAD:VERSION 2>/dev/null | tr -d '\r\n[:space:]' || true)"
fi
rm -rf "$TMPV"
if [[ -n "$TARGET_VERSION" ]]; then
  echo "    目标模板版本: $TARGET_VERSION"
fi
echo

OK=()
SKIP=()
FAIL=()
TOTAL=0

shopt -s nullglob
for sub in "$PARENT_DIR"/*/; do
  sub="${sub%/}"
  [[ -d "$sub" ]] || continue
  name="$(basename "$sub")"

  # 派生项目判据
  if [[ ! -f "$sub/VERSION" || ! -f "$sub/scripts/sync-template.sh" || ! -d "$sub/docs" ]]; then
    SKIP+=("$name（非派生项目）")
    continue
  fi
  if [[ -d "$sub/_examples" ]]; then
    SKIP+=("$name（疑似模板本体，含 _examples/）")
    continue
  fi

  TOTAL=$((TOTAL+1))
  echo "── [$name] ──"

  # 必须是 git 仓
  if ! (cd "$sub" && git rev-parse --is-inside-work-tree >/dev/null 2>&1); then
    SKIP+=("$name（非 git 仓）")
    continue
  fi

  # 已跟踪改动必须干净（未跟踪项目内容不阻塞）
  if ! (cd "$sub" && git diff --quiet HEAD 2>/dev/null); then
    SKIP+=("$name（有未提交跟踪改动，跳过）")
    echo "    ⚠ 有未提交跟踪改动，跳过"
    continue
  fi

  # 跑该派生项目的 sync-template
  if (cd "$sub" && TEMPLATE_REMOTE="$TEMPLATE_URL" bash scripts/sync-template.sh "$MODE" >/dev/null 2>&1); then
    echo "    ✓ sync-template $MODE 成功"
  else
    FAIL+=("$name（sync-template 失败）")
    echo "    ✗ sync-template 失败"
    continue
  fi

  # commit 模式下跑 check-derived-sync
  if [[ "$MODE" == "--commit" && -f "$sub/scripts/check-derived-sync.sh" ]]; then
    if (cd "$sub" && bash scripts/check-derived-sync.sh >/dev/null 2>&1); then
      echo "    ✓ check-derived-sync 通过"
    else
      FAIL+=("$name（check-derived-sync 失败，需人工）")
      echo "    ⚠ check-derived-sync 失败"
      continue
    fi
  fi

  OK+=("$name")
done

echo
echo "==> 汇总（识别 $TOTAL 个派生项目）"
echo "    成功: ${#OK[@]}${OK[*]:+ → }${OK[*]}"
if [[ ${#SKIP[@]} -gt 0 ]]; then
  echo "    跳过: ${#SKIP[@]}"
  for s in "${SKIP[@]}"; do echo "      - $s"; done
fi
if [[ ${#FAIL[@]} -gt 0 ]]; then
  echo "    失败: ${#FAIL[@]}"
  for f in "${FAIL[@]}"; do echo "      - $f"; done
fi
echo

if [[ ${#FAIL[@]} -eq 0 ]]; then
  echo "✅ 处理完毕（${#OK[@]} 成功，${#SKIP[@]} 跳过）"
  exit 0
else
  echo "❌ ${#FAIL[@]} 个项目失败，需人工处理"
  exit 1
fi
