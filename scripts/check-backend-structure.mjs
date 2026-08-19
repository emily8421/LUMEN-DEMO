// FG-C2 后端结构检查（2026-08-19）：按内容拦分层违规，不看行数。
// 依据 docs/05-tech-spec.md §4.1.1 文件职责表 + §4.2 分层与装配基线：
//   R1: backend/service/ 不得 import fastapi（豁免清单登记，唯一既存 = auth_context.py）
//   R2: backend/api/     不得 import sqlalchemy / backend.model.orm（ORM/SQL 属 repository 层；
//                        读路径直连 repository 合法〔05 §4.2〕，故只查 ORM import 不查 repository 调用）
//   R3: backend/repository/ 与 backend/model/ 不得 import fastapi（防传输层反向渗入，现状 0 违规防回归）
// 用法：node scripts/check-backend-structure.mjs（脚本用自身路径定位仓库根，cwd 无关）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const backendDir = join(repoRoot, 'backend');

// service 层 fastapi 豁免清单：文件相对 backend/ 的路径 → 豁免理由（须与 05 §4.2 登记一致）。
const SERVICE_FASTAPI_EXEMPTIONS = new Map([
  ['service/auth_context.py', '唯一登记豁免：fastapi Depends 鉴权依赖项，供 router 共用 get_current_user（05 §4.2 / project-rules §5.2）'],
]);

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

const files = collectPyFiles(backendDir);
const failures = [];

for (const file of files) {
  const rel = relative(backendDir, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  const fastapiImport = /(?:^|\n)\s*(?:from fastapi import|import fastapi)/.test(text);
  const ormImport =
    /(?:^|\n)\s*from sqlalchemy import/.test(text) ||
    /(?:^|\n)\s*from sqlalchemy\.orm import/.test(text) ||
    /(?:^|\n)\s*from backend\.model\.orm import/.test(text) ||
    /(?:^|\n)\s*import sqlalchemy/.test(text);

  if (rel.startsWith('service/') && fastapiImport && !SERVICE_FASTAPI_EXEMPTIONS.has(rel)) {
    failures.push(`R1 service 层 import fastapi：${rel}（业务层不得依赖 web 框架；豁免须登记 05 §4.2 并加入本脚本清单）`);
  }
  if (rel.startsWith('api/') && ormImport) {
    failures.push(`R2 api 层 import ORM/SQL：${rel}（持久化细节属 repository 层；api 只做参数解析→调 service/repository 读→转 envelope）`);
  }
  if ((rel.startsWith('repository/') || rel.startsWith('model/')) && fastapiImport) {
    failures.push(`R3 ${rel.startsWith('repository/') ? 'repository' : 'model'} 层 import fastapi：${rel}（传输层依赖不得反向渗入）`);
  }
}

// 豁免存在性校验：登记的豁免文件若已不存在 / 已删除 fastapi import，提示清理清单防僵尸豁免。
for (const [rel, reason] of SERVICE_FASTAPI_EXEMPTIONS) {
  const full = join(backendDir, rel);
  let exists = false;
  let stillImports = false;
  try {
    stillImports = /(?:^|\n)\s*(?:from fastapi import|import fastapi)/.test(readFileSync(full, 'utf8'));
    exists = true;
  } catch {
    exists = false;
  }
  if (!exists) failures.push(`豁免清单失效：${rel} 不存在（${reason}）——请从 SERVICE_FASTAPI_EXEMPTIONS 移除`);
  else if (!stillImports) failures.push(`豁免可回收：${rel} 已不再 import fastapi——请从 SERVICE_FASTAPI_EXEMPTIONS 移除并收紧`);
}

if (failures.length > 0) {
  console.error('后端结构检查失败（docs/05 §4.1.1 职责表 / §4.2 分层基线）：');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`OK：backend 结构检查通过（R1 service 无 fastapi〔豁免 ${SERVICE_FASTAPI_EXEMPTIONS.size}〕/ R2 api 无 ORM / R3 repository·model 无 fastapi）`);
