// CSS 纪律检查（2026-08-16 主题试点 + 设计系统步骤 6 扩展）：
// frontend/src/styles/ 除 tokens.css 外——
// ① 零字面色值（#hex / rgb / rgba）
// ② 字号/字重/圆角只准 token 引用或设计系统豁免值（frontend-design-system.md §1.4/1.5/1.7 边界表）
// 规则来源：ai/project-rules.md §5.1 CSS 纪律 + docs/design/frontend-design-system.md。
// 注释行豁免。用法：node scripts/check-frontend-css.mjs（脚本用自身路径定位仓库根，cwd 无关）。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesDir = join(
  fileURLToPath(new URL('..', import.meta.url)),
  'frontend',
  'src',
  'styles',
);

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

// 字号豁免（design-system §1.4 边界表：display/图标/相对缩放语义特例）
const FONT_SIZE_ALLOWED = new Set([
  '26px', // welcome h1 hero 标题
  '22px', // welcome-card-icon emoji 图标
  '1.25rem', // term-reader-name 术语标题
  '20px', // ai-assistant-fab 图标
  '0.92em', // markdown 行内代码相对缩放
]);
// 圆角豁免（§1.7：pill / 圆 / 无圆角）
const RADIUS_ALLOWED = new Set(['999px', '9999px', '50%', '0']);
// 字重豁免：无（全部走 --weight-*）

const failures = [];
for (const entry of readdirSync(stylesDir)) {
  if (!entry.endsWith('.css')) continue;
  // tokens.css 是唯一定义点，豁免；其余文件受检
  if (entry === 'tokens.css') continue;
  const lines = readFileSync(join(stylesDir, entry), 'utf8').split('\n');
  lines.forEach((line, index) => {
    // 豁免注释：行注释、CSS 块注释整行或续行（以 * 或 /* 开头，去除缩进后）
    const trimmed = line.trim();
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (COLOR_LITERAL.test(line)) {
      failures.push(`${entry}:${index + 1}  字面色值  ${trimmed}`);
    }
    // 字号：只准 var(--font-*) 或豁免表
    const fsMatch = line.match(/font-size:\s*([^;]+);/);
    if (fsMatch) {
      const value = fsMatch[1].trim();
      if (!value.startsWith('var(--font-') && !FONT_SIZE_ALLOWED.has(value)) {
        failures.push(`${entry}:${index + 1}  字号未走字阶 token/豁免表  ${trimmed}`);
      }
    }
    // 字重：只准 var(--weight-*)
    const fwMatch = line.match(/font-weight:\s*([^;]+);/);
    if (fwMatch) {
      const value = fwMatch[1].trim();
      if (!value.startsWith('var(--weight-')) {
        failures.push(`${entry}:${index + 1}  字重未走 --weight-*  ${trimmed}`);
      }
    }
    // 圆角：只准 var(--radius-*) 或 pill/圆/0 豁免
    const brMatch = line.match(/border-radius:\s*([^;]+);/);
    if (brMatch) {
      const value = brMatch[1].trim();
      if (!value.startsWith('var(--radius-') && !RADIUS_ALLOWED.has(value)) {
        failures.push(`${entry}:${index + 1}  圆角未走 4 档 token/豁免  ${trimmed}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`FAIL check-frontend-css: ${failures.length} 处违规（规则见 docs/design/frontend-design-system.md §1 与 ai/project-rules.md §5.1）`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log('PASS check-frontend-css: 零字面色值 + 字阶/字重/圆角全走 token 或登记豁免（唯一定义点 tokens.css）');
