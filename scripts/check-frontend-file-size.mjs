// CQ-P1-008 前端文件膨胀 ratchet：拦「新增超限文件」+「既有超限文件继续膨胀」。
// 棘轮只进不退：新 PR 不得引入 >250 行的文件，也不得让已超限文件再变长。
// 用法：node scripts/check-frontend-file-size.mjs（脚本用自身路径定位仓库根，cwd 无关）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const THRESHOLD = 250;
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(repoRoot, 'frontend', 'src');
const baselinePath = join(repoRoot, 'frontend', '.file-size-baseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

function collectTsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsFiles(full, out);
    } else if (/\.(ts|tsx|css)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const failures = [];
for (const file of collectTsFiles(srcDir)) {
  // 与 `wc -l` 口径一致：统计换行符数量（split 法对末尾换行会多算 1）。
  const lines = readFileSync(file, 'utf8').match(/\n/g)?.length ?? 0;
  const key = relative(srcDir, file).replace(/\\/g, '/');
  if (lines <= THRESHOLD) continue;
  if (!(key in baseline)) {
    failures.push(`新增超限文件 ${key}（${lines} 行 > ${THRESHOLD}）：需拆分或登记基线`);
  } else if (lines > baseline[key]) {
    failures.push(`超限文件膨胀 ${key}：${baseline[key]} → ${lines} 行（ratchet 只进不退）`);
  }
}

if (failures.length > 0) {
  console.error('前端文件膨胀 ratchet 失败：');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`OK：frontend/src 无新增超限、无超限膨胀（阈值 ${THRESHOLD} 行，超限基线 ${Object.keys(baseline).length} 个文件）`);
