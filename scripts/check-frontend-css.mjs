// CSS 纪律检查（2026-08-16 主题试点）：frontend/src/styles/ 除 tokens.css 外零字面色值。
// 规则来源：ai/project-rules.md §5.1 CSS 纪律（色值/间距/圆角只准 var(--xxx)，唯一定义点 tokens.css）。
// 检出对象：#hex（3-8 位）、rgb()/rgba() 字面量；注释行豁免（含块注释续行）。
// 用法：node scripts/check-frontend-css.mjs（脚本用自身路径定位仓库根，cwd 无关）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(
  fileURLToPath(new URL('..', import.meta.url)),
  'frontend',
  'src',
  'styles',
);

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

const failures = [];
for (const entry of readdirSync(stylesDir)) {
  if (!entry.endsWith('.css')) continue;
  // tokens.css 是唯一定义点，豁免；其余文件零字面色值
  if (entry === 'tokens.css') continue;
  const lines = readFileSync(join(stylesDir, entry), 'utf8').split('\n');
  lines.forEach((line, index) => {
    // 豁免注释：行注释、CSS 块注释整行或续行（以 * 或 /* 开头，去除缩进后）
    const trimmed = line.trim();
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (COLOR_LITERAL.test(line)) {
      failures.push(`${entry}:${index + 1}  ${trimmed}`);
    }
  });
}

if (failures.length > 0) {
  console.error(`FAIL check-frontend-css: ${failures.length} 处字面色值（styles/ 除 tokens.css 外应为零，见 ai/project-rules.md §5.1）`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log('PASS check-frontend-css: styles/ 组件文件零字面色值（唯一定义点 tokens.css）');
