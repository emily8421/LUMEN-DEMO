// R1 后端文件膨胀 ratchet（2026-08-19，FG-C2 扩容）：仿前端版 check-frontend-file-size.mjs。
// 拦「新增超限文件」+「既有超限文件继续膨胀」，棘轮只进不退。
// 阈值对齐 docs/05-tech-spec.md §4.1.2（症状信号，约定值）：service 250 / repository 不设行数门
// （protocol 拆域接口属 R2 技术债，行数门会与 101 方法 god object 冲突）/ api 250 / model 250
// （schemas.py 490 承载全部 API DTO，未到必须拆域程度——登记基线而非强拆）/ migrations 不查
// （一文件一主题的 SQL 迁移脚本）/ main.py 等装配文件 300（同主应用入口档）。
// 用法：node scripts/check-backend-file-size.mjs（脚本用自身路径定位仓库根，cwd 无关）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 按文件路径返回阈值（docs/05 §4.1.2）；返回 null = 不查。 */
function thresholdFor(relPath) {
  if (relPath.startsWith('service/')) return 250;
  if (relPath.startsWith('api/')) return 250;
  if (relPath.startsWith('model/')) return 250;
  if (relPath === 'main.py' || relPath === 'config.py') return 300;
  return null; // repository/ migrations/ __init__.py 等：不设行数门（理由见文件头注释）
}

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const backendDir = join(repoRoot, 'backend');
const baselinePath = join(repoRoot, 'backend', '.file-size-baseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

function collectPyFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '__pycache__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectPyFiles(full, out);
    } else if (entry.endsWith('.py')) {
      out.push(full);
    }
  }
  return out;
}

const failures = [];
let checked = 0;
for (const file of collectPyFiles(backendDir)) {
  const key = relative(backendDir, file).replace(/\\/g, '/');
  const threshold = thresholdFor(key);
  if (threshold === null) continue;
  checked += 1;
  // 与 `wc -l` 口径一致：统计换行符数量。
  const lines = readFileSync(file, 'utf8').match(/\n/g)?.length ?? 0;
  if (lines <= threshold) continue;
  if (!(key in baseline)) {
    failures.push(`新增超限文件 ${key}（${lines} 行 > ${threshold}）：按 05 §4.1.1 职责表拆分，或登记基线`);
  } else if (lines > baseline[key]) {
    failures.push(`超限文件膨胀 ${key}：${baseline[key]} → ${lines} 行（ratchet 只进不退；处置入口 = 05 §4.1.1 职责表）`);
  }
}

if (failures.length > 0) {
  console.error('后端文件膨胀 ratchet 失败：');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`OK：backend 无新增超限、无超限膨胀（service/api/model 250 / main·config 300；已查 ${checked} 文件，超限基线 ${Object.keys(baseline).length} 个）`);
