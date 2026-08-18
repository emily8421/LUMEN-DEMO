#!/usr/bin/env node
/**
 * extract-diagrams.mjs — 图表生成式镜像抽取脚本（模板样例）
 *
 * 用途：从 docs/00-09 与 docs/design/* 的正文（唯一权威源）抽取 mermaid / plantuml
 *       fenced 图块与指定章节的核心表格，生成 docs/diagrams/ 与 docs/tables/ 镜像
 *       目录 + 双 INDEX（图按 PLM 阶段分组，表按文档分组）。
 *
 * 定位：这是**样例脚本**——展示生成式镜像机制的最小实现（manifest 驱动 + --check
 *       CI 校验 + 孤儿文件检测）。派生项目按自己的文档结构改写 manifest
 *       （DIAGRAMS / TABLES / TABLES_INPLACE 三个清单），或换成其他语言实现；
 *       机制说明见 `ai/document-lifecycle-rules.md` §13「图表生成式镜像」。
 *
 * 用法：
 *   node scripts/extract-diagrams.mjs           # 生成 / 刷新镜像（写文件）
 *   node scripts/extract-diagrams.mjs --check   # CI 校验模式：不写文件，
 *                                               # 镜像与源不一致时退出码 1
 *
 * manifest：图清单 DIAGRAMS / 表清单 TABLES 在本文件内维护——新增图 / 表时先在
 *           源文档落图，再在 manifest 登记（源锚点 + 输出名 + 阶段 / 类型元数据）。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* ---------- 工具 ---------- */

function readDoc(rel) {
  return readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}

/** 按「fenced 块序号」（文件内第 N 个 mermaid/plantuml 块，1 起）抽取图块。 */
function extractBlock(rel, blockNo) {
  const text = readDoc(rel);
  const lines = text.split('\n');
  let n = 0;
  let inBlock = false;
  let lang = '';
  const buf = [];
  for (const line of lines) {
    const open = line.match(/^```(mermaid|plantuml)$/);
    if (!inBlock && open) {
      n += 1;
      if (n === blockNo) {
        inBlock = true;
        lang = open[1];
        continue;
      }
    } else if (inBlock && line.trim() === '```') {
      break;
    } else if (inBlock) {
      buf.push(line);
    }
  }
  if (!inBlock) {
    throw new Error(`block #${blockNo} not found in ${rel}`);
  }
  return { lang, body: buf.join('\n').replace(/\s+$/, '') };
}

/** 抽取「以标题行起始、到下一个同级或更高级标题前」的章节内表格行。 */
function extractTablesUnderHeading(rel, headingRe) {
  const lines = readDoc(rel).split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) throw new Error(`heading ${headingRe} not found in ${rel}`);
  const level = (lines[start].match(/^#+/) || ['#'])[0].length;
  const out = [];
  const re = new RegExp(`^#{1,${level}}\\s`);
  for (let i = start + 1; i < lines.length; i++) {
    if (re.test(lines[i])) break;
    if (/^\|/.test(lines[i]) || /^>.*\|/.test(lines[i]) || /^#{2,}\s/.test(lines[i])) out.push(lines[i]);
  }
  // 只保留连续表格段（含表头分隔行），剥掉散入的标题 / 引用行
  const tableLines = [];
  let inTable = false;
  for (const l of out) {
    if (/^\|/.test(l)) { inTable = true; tableLines.push(l); }
    else if (inTable && /^\s*\|/.test(l)) tableLines.push(l);
    else inTable = false;
  }
  if (!tableLines.length) throw new Error(`no table under ${headingRe} in ${rel}`);
  return tableLines.join('\n');
}

/** 正则源字符串转可读锚点描述（用于镜像页头部说明）。 */
function anchorLabel(re) {
  return re.source.replace(/[\\^$()?\[\]]/g, '').replace(/\.\*/g, '').trim();
}

/* ---------- manifest：图（每图一条；示例条目，派生项目按实际文档登记） ----------
 * rel: 源文件；block: 文件内第 N 个 fenced 图块（1 起）
 * id: 镜像文件名（.md，与源图 ID 同名）；title / phase / type / render 进 INDEX 元数据
 * phase 取值与 PLM 阶段链路对齐：需求 / 总体设计 / 详细设计 / 实现
 */
const DIAGRAMS = [
  // 示例：
  // { rel: 'docs/04-architecture.md', block: 1, id: 'DIAG-ARCH-01', title: '整体架构图', phase: '总体设计', type: '架构图', render: 'GitHub 原生', trace: 'REQ / MOD' },
  // { rel: 'docs/06-db-design.md', block: 1, id: 'DIAG-DB-ER-01', title: '物理 ERD（表间关系）', phase: '详细设计', type: 'ER 图', render: 'GitHub 原生', trace: '06 表清单' },
];

/* ---------- manifest：核心表（镜像抽取档；示例条目） ---------- */
const TABLES = [
  // 示例：
  // { rel: 'docs/02-srs.md', anchor: /^## 1\. /, id: '02-req-main', title: 'REQ 主表（可验证口径）' },
  // { rel: 'docs/07-api-spec.md', anchor: /^## 2\. /, id: '07-api-list', title: '接口清单（API-ID）' },
];

/* ---------- 原位登记档（日志型，不抽镜像，仅索引链接） ---------- */
const TABLES_INPLACE = [
  // 示例：
  // { rel: 'docs/08-dev-plan.md', anchor: 'Sprint 完成包与进度记录', note: '增量日志（随验收更新）' },
  // { rel: 'docs/09-verification.md', anchor: '§5 验收记录', note: '增量日志（随验收更新）' },
];

/* ---------- 生成 ---------- */

const PHASE_ORDER = ['需求', '总体设计', '详细设计', '实现'];

function diagramPage(d, block) {
  return [
    `# ${d.id} · ${d.title}`,
    '',
    `> **生成式镜像**（\`scripts/extract-diagrams.mjs\` 产物，不手改）。`,
    `> 唯一权威源：\`${d.rel}\`（本图所在块）。阶段：${d.phase}；类型：${d.type}；追溯：${d.trace}；渲染：${d.render}。`,
    '',
    '```' + block.lang,
    block.body,
    '```',
    '',
  ].join('\n');
}

function tablePage(t, body) {
  return [
    `# ${t.id} · ${t.title}`,
    '',
    `> **生成式镜像**（\`scripts/extract-diagrams.mjs\` 产物，不手改）。`,
    `> 唯一权威源：\`${t.rel}\`（${anchorLabel(t.anchor)} 起的章节）。表格内容以源文档为准。`,
    '',
    body,
    '',
  ].join('\n');
}

function buildDiagramIndex() {
  const byPhase = PHASE_ORDER.map((p) => {
    const list = DIAGRAMS.filter((d) => d.phase === p);
    if (!list.length) return '';
    return `\n### ${p}（${list.length}）\n\n| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |\n|---|---|---|---|---|---|\n${list
      .map((d) => `| [${d.id}](${d.id}.md) | ${d.title} | ${d.type} | \`${d.rel}\` | ${d.trace} | ${d.render} |`)
      .join('\n')}`;
  }).filter(Boolean).join('\n');
  return `# 图索引（docs/diagrams/）

> **生成式镜像索引**（\`scripts/extract-diagrams.mjs\` 产物，不手改）。审核主入口：按 PLM 阶段分组；每图一文件（图块 + 源锚点 + 追溯）。
> 文档内图是唯一权威源，本目录是抽取镜像——改图请改源文档后重跑脚本；CI 以 \`--check\` 模式校验镜像未过期。
> 共 ${DIAGRAMS.length} 张。
${byPhase}

## 按文档反查

| 源文档 | 图 |
|---|---|
${[...new Set(DIAGRAMS.map((d) => d.rel))].map((r) =>
    `| \`${r}\` | ${DIAGRAMS.filter((d) => d.rel === r).map((d) => `[${d.id}](${d.id}.md)`).join(' · ')} |`,
  ).join('\n')}
`;
}

function buildTableIndex() {
  const byDoc = [...new Set(TABLES.map((t) => t.rel))].map((r) => {
    const list = TABLES.filter((t) => t.rel === r);
    return `| \`${r}\` | ${list.map((t) => `[${t.id}](${t.id}.md)（${t.title}）`).join('<br>') } |`;
  }).join('\n');
  const inplace = TABLES_INPLACE.map((t) =>
    `| \`${t.rel}\` | ${t.anchor} | ${t.note} |`).join('\n');
  return `# 核心表索引（docs/tables/）

> **生成式镜像索引**（\`scripts/extract-diagrams.mjs\` 产物，不手改）。表分两档：
> **镜像抽取**（核心矩阵，脚本复制成单文件，共 ${TABLES.length} 张）＋ **原位登记**（增量日志，只挂锚点链接不抽镜像——每次验收都更新，抽了必过期）。
> 表格内容以源文档为唯一权威源；表索引不新增 TBL-ID 命名空间，用「文档 + 章节锚点」定位。

## 镜像抽取（核心矩阵）

| 源文档 | 镜像表 |
|---|---|
${byDoc}

## 原位登记（日志型 · 不抽镜像）

| 源文档 | 锚点 | 说明 |
|---|---|---|
${inplace}
`;
}

/* ---------- 主流程：生成或校验 ---------- */

const outputs = new Map(); // relPath -> content

for (const d of DIAGRAMS) {
  const block = extractBlock(d.rel, d.block);
  outputs.set(`docs/diagrams/${d.id}.md`, diagramPage(d, block));
}
for (const t of TABLES) {
  const body = extractTablesUnderHeading(t.rel, t.anchor);
  outputs.set(`docs/tables/${t.id}.md`, tablePage(t, body));
}
outputs.set('docs/diagrams/00-index.md', buildDiagramIndex());
outputs.set('docs/tables/00-index.md', buildTableIndex());

let mismatch = 0;
let written = 0;
for (const [rel, content] of outputs) {
  const abs = join(ROOT, rel);
  const existed = existsSync(abs);
  const same = existed && readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') === content;
  if (CHECK) {
    if (!same) { mismatch += 1; console.error(`MISMATCH: ${rel}${existed ? '' : ' (missing)'}`); }
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content.replace(/\n/g, '\r\n'), 'utf8');
    written += 1;
    console.log(`${existed ? 'refresh' : 'create '} ${rel}`);
  }
}

if (CHECK) {
  // 镜像目录中存在但 manifest 未登记 / 已更名的孤立文件
  for (const dir of ['docs/diagrams', 'docs/tables']) {
    if (!existsSync(join(ROOT, dir))) continue;
    for (const f of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${f}`;
      if (!outputs.has(rel)) { mismatch += 1; console.error(`ORPHAN: ${rel}`); }
    }
  }
  if (mismatch) { console.error(`docs-mirror check FAILED: ${mismatch} mismatch(es)`); process.exit(1); }
  console.log(`docs-mirror check PASS: ${outputs.size} files in sync`);
} else {
  console.log(`\nDone: ${written} files written (${DIAGRAMS.length} diagrams + ${TABLES.length} tables + 2 00-index).`);
}
