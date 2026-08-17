#!/usr/bin/env node
/**
 * extract-diagrams.mjs — 图表生成式镜像抽取脚本
 *
 * 用途：从 docs/00-09 与 docs/design/* 的正文（唯一权威源）抽取 mermaid / plantuml
 *       fenced 图块与指定章节的核心表格，生成 docs/diagrams/ 与 docs/tables/ 镜像
 *       目录 + 双 INDEX（图按 OO 五阶段分组，表按文档分组）。
 *
 * 定位：镜像目录是「产物」（generated），不是第二权威源——不手改；文档改图后
 *       重跑本脚本再生成。CI（project-check.yml docs-mirror job）以
 *       `node scripts/extract-diagrams.mjs --check` 校验镜像未过期。
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

/** 按「 fenced 块序号」（文件内第 N 个 mermaid/plantuml 块，1 起）抽取图块。 */
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

/* ---------- manifest：图（每图一条） ----------
 * rel: 源文件；block: 文件内第 N 个 fenced 图块（1 起）
 * id: 镜像文件名（.md）；title / phase / type / render 进 INDEX 元数据
 */
const DIAGRAMS = [
  // —— 需求获取 / 需求分析 ——
  { rel: 'docs/00-scenario.md', block: 1, id: 'DIAG-UC-01', title: '用例全景图（域入口视图）', phase: '需求分析', type: '用例图', render: 'plantuml（需本机预览）', trace: '全量 REQ（01 §6 / 00 §3.3）' },
  { rel: 'docs/06-db-design.md', block: 1, id: 'DIAG-DOM-01', title: '领域模型（分析类图 / 概念 ERD）', phase: '需求分析', type: '类图（概念）', render: 'GitHub 原生', trace: '06 §6 REQ→表' },
  // —— 概要设计（04）——
  { rel: 'docs/04-architecture.md', block: 1, id: 'DIAG-ARCH-01', title: '整体架构图', phase: '概要设计', type: '架构图', render: 'GitHub 原生', trace: 'REQ / MOD' },
  { rel: 'docs/04-architecture.md', block: 2, id: 'DIAG-ARCH-01a', title: '系统上下文图（信任边界）', phase: '概要设计', type: '上下文图', render: 'GitHub 原生', trace: '04 §1.1 外部系统状态' },
  { rel: 'docs/04-architecture.md', block: 3, id: 'DIAG-ARCH-01b', title: '分层架构视图', phase: '概要设计', type: '分层图', render: 'GitHub 原生', trace: 'project-rules §5.1 四层' },
  { rel: 'docs/04-architecture.md', block: 4, id: 'DIAG-CLS-PRELIM-01', title: '概设类图（后端四层关键类）', phase: '概要设计', type: '类图（概设）', render: 'GitHub 原生', trace: '→ 详细类图 DIAG-CLS-*' },
  { rel: 'docs/04-architecture.md', block: 5, id: 'DIAG-ARCH-02', title: '生产部署拓扑图（⑪ 方案 A）', phase: '概要设计', type: '部署图', render: 'GitHub 原生', trace: '04 §4 运行形态' },
  { rel: 'docs/04-architecture.md', block: 6, id: 'DIAG-SEQ-FLOW001', title: 'Flow-001 登录与空间切换（概要流程）', phase: '概要设计', type: '顺序图（流程）', render: 'GitHub 原生', trace: 'API-001..003 / TC-P1-001/002' },
  { rel: 'docs/04-architecture.md', block: 7, id: 'DIAG-FLOW-002', title: 'Flow-002 统一过滤（概要流程）', phase: '概要设计', type: '流程图', render: 'GitHub 原生', trace: 'API-004..010 / TC-P1-003..008' },
  { rel: 'docs/04-architecture.md', block: 8, id: 'DIAG-ARCH-SEQ-01', title: 'SEQ-01 文档访问 / 搜索 / RAG 统一过滤', phase: '概要设计', type: '顺序图', render: 'GitHub 原生', trace: 'Flow-002' },
  { rel: 'docs/04-architecture.md', block: 9, id: 'DIAG-ARCH-SEQ-02', title: 'SEQ-02 Phase2D 认证升级', phase: '概要设计', type: '顺序图', render: 'GitHub 原生', trace: 'REQ-040..042' },
  { rel: 'docs/04-architecture.md', block: 10, id: 'DIAG-ARCH-SEQ-03', title: 'SEQ-03 AI 润色 / 写作引用', phase: '概要设计', type: '顺序图', render: 'GitHub 原生', trace: 'Flow-005 / RG-008' },
  { rel: 'docs/04-architecture.md', block: 11, id: 'DIAG-ARCH-SEQ-04', title: 'SEQ-04 批量 / 文件夹导入', phase: '概要设计', type: '顺序图', render: 'GitHub 原生', trace: 'Flow-006 / EX-006' },
  // —— 详细设计：类图 ——
  { rel: 'docs/design/accounts-auth.md', block: 1, id: 'DIAG-CLS-AUTH-01', title: '详细类图 · 账户与认证', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-040..047/050/051' },
  { rel: 'docs/design/ingestion.md', block: 1, id: 'DIAG-CLS-INGEST-01', title: '详细类图 · 内容导入', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-009/010/037' },
  { rel: 'docs/design/rag-retrieval.md', block: 1, id: 'DIAG-CLS-RAG-01', title: '详细类图 · 检索问答', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-007/008' },
  { rel: 'docs/design/permissions.md', block: 1, id: 'DIAG-CLS-PERM-01', title: '详细类图 · 空间与权限', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-001/002/003' },
  { rel: 'docs/design/term-management.md', block: 1, id: 'DIAG-CLS-TERM-01', title: '详细类图 · 术语管理', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-036/048' },
  { rel: 'docs/design/folder-tree.md', block: 1, id: 'DIAG-CLS-FOLDER-01', title: '详细类图 · 文档目录树', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-039/037' },
  { rel: 'docs/design/export-delivery.md', block: 1, id: 'DIAG-CLS-EXPORT-01', title: '详细类图 · 导出交付', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-038/027' },
  { rel: 'docs/design/ai-polish.md', block: 1, id: 'DIAG-CLS-POLISH-01', title: '详细类图 · AI 润色 / 写作引用', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-014' },
  { rel: 'docs/design/ai-assistant.md', block: 1, id: 'DIAG-CLS-AI-01', title: '详细类图 · AI 助手', phase: '详细设计', type: '类图（详细）', render: 'GitHub 原生', trace: 'REQ-008' },
  // —— 详细设计：ER / 状态机 / 流程 ——
  { rel: 'docs/06-db-design.md', block: 2, id: 'DIAG-DB-ER-01', title: '物理 ERD（表间关系）', phase: '详细设计', type: 'ER 图', render: 'GitHub 原生', trace: '06 §1/§6' },
  { rel: 'docs/design/ingestion.md', block: 4, id: 'DIAG-STATE-IMPORT-01', title: '导入任务状态机（单文件任务态）', phase: '详细设计', type: '状态图', render: 'GitHub 原生', trace: 'REQ-009/037 · EX-003/006' },
  { rel: 'docs/design/ingestion.md', block: 5, id: 'DIAG-STATE-IMPORT-01b', title: '批量导入逐文件结果态（响应级）', phase: '详细设计', type: '状态图', render: 'GitHub 原生', trace: 'Flow-006 items[]' },
  { rel: 'docs/design/ingestion.md', block: 2, id: 'DIAG-FLOW-INGEST-SINGLE', title: 'Flow-D-001 单文件导入流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-009' },
  { rel: 'docs/design/ingestion.md', block: 3, id: 'DIAG-FLOW-INGEST-BATCH', title: 'Flow-006 批量导入流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-037' },
  { rel: 'docs/design/ingestion.md', block: 6, id: 'DIAG-FLOW-VAULT-DUAL', title: 'Flow-D-014 Vault 双模式流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-018（已设计未实现）' },
  { rel: 'docs/design/export-delivery.md', block: 2, id: 'DIAG-FLOW-EXPORT-MDZIP', title: 'Flow-007 .md / ZIP 导出流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-038' },
  { rel: 'docs/design/export-delivery.md', block: 3, id: 'DIAG-STATE-EXPORT-01', title: 'PDF 导出任务状态机', phase: '详细设计', type: '状态图', render: 'GitHub 原生', trace: 'REQ-027 · EX-008' },
  { rel: 'docs/design/ai-polish.md', block: 2, id: 'DIAG-STATE-DRAFT-01', title: 'AI 草稿生命周期状态机', phase: '详细设计', type: '状态图', render: 'GitHub 原生', trace: 'REQ-014' },
  { rel: 'docs/design/accounts-auth.md', block: 2, id: 'DIAG-FLOW-AUTH', title: '认证流程（注册 / 登录 / 登出）', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-040..042' },
  { rel: 'docs/design/accounts-auth.md', block: 3, id: 'DIAG-STATE-SESSION-01', title: '会话生命周期状态机', phase: '详细设计', type: '状态图', render: 'GitHub 原生', trace: 'REQ-041/042' },
  { rel: 'docs/design/permissions.md', block: 2, id: 'DIAG-FLOW-PERM-FILTER', title: '权限过滤决策流', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'Flow-D-002' },
  { rel: 'docs/design/rag-retrieval.md', block: 2, id: 'DIAG-FLOW-RAG', title: 'RAG 检索问答流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'Flow-D-004' },
  { rel: 'docs/design/term-management.md', block: 2, id: 'DIAG-FLOW-TERM', title: '术语维护与口径对齐流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'Flow-D-005..007' },
  { rel: 'docs/design/folder-tree.md', block: 2, id: 'DIAG-FLOW-FOLDER-IMPORT', title: '导入保留目录结构流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'Flow-D-012' },
  { rel: 'docs/design/timeline.md', block: 1, id: 'DIAG-TL-FLOW-01', title: '主题时间线装配流程', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'REQ-013a/024' },
  { rel: 'docs/design/ai-assistant.md', block: 2, id: 'DIAG-FLOW-ASSIST', title: 'AI 助手多轮对话交互流', phase: '详细设计', type: '流程图', render: 'GitHub 原生', trace: 'Flow-D-ASSIST-01' },
  { rel: 'docs/design/frontend-interaction.md', block: 1, id: 'DIAG-FLOW-FE-IA', title: 'P1 页面信息架构', phase: '详细设计', type: '流程图（前端）', render: 'GitHub 原生', trace: 'REQ-011 页面清单' },
  { rel: 'docs/design/frontend-interaction.md', block: 2, id: 'DIAG-SEQ-FE-UF001', title: 'UF-001 登录与空间切换（前端时序）', phase: '详细设计', type: '顺序图（前端）', render: 'GitHub 原生', trace: 'UF-001' },
  { rel: 'docs/design/intelligence-analysis.md', block: 1, id: 'DIAG-FLOW-INTEL', title: '情报分析功能骨架（愿景）', phase: '详细设计（愿景）', type: '流程图', render: 'GitHub 原生', trace: 'REQ-029..034 骨架' },
  // —— 实现（技术栈）——
  { rel: 'docs/05-tech-spec.md', block: 1, id: 'DIAG-TECH-STACK-01', title: '技术栈分层图', phase: '实现', type: '分层图', render: 'GitHub 原生', trace: '05 §1 COMP' },
  { rel: 'docs/07-api-spec.md', block: 1, id: 'DIAG-API-SEQ-01', title: 'P1 交互时序图（API 视角）', phase: '详细设计', type: '顺序图', render: 'GitHub 原生', trace: '07 §3.8 API-ID' },
];

/* ---------- manifest：核心表（镜像抽取档） ---------- */
const TABLES = [
  { rel: 'docs/00-scenario.md', anchor: /^## 2\. /, id: '00-roles', title: '目标用户（R-001..003）' },
  { rel: 'docs/00-scenario.md', anchor: /^## 3\. /, id: '00-scenarios', title: '典型场景（SC-001..009）' },
  { rel: 'docs/00-scenario.md', anchor: /^## 3\.3 /, id: '00-sc-downstream', title: '场景 → U/REQ/TC 下游映射' },
  { rel: 'docs/01-user-requirements.md', anchor: /^## 1\. /, id: '01-user-reqs', title: '用户需求总览（U-ID）' },
  { rel: 'docs/01-user-requirements.md', anchor: /^## 6\. /, id: '01-trace', title: '追溯矩阵（U → REQ）' },
  { rel: 'docs/02-srs.md', anchor: /^## 1\. /, id: '02-req-main', title: 'REQ 主表（可验证口径）' },
  { rel: 'docs/02-srs.md', anchor: /^### 0\.1\.1/, id: '02-nfr', title: '非功能需求（NFR）' },
  { rel: 'docs/03-prd.md', anchor: /^## 3\. /, id: '03-roadmap', title: '阶段路线图（双维度总览）' },
  { rel: 'docs/03-prd.md', anchor: /^## 4\. /, id: '03-req-coverage', title: 'REQ 覆盖矩阵（REQ-001..051）' },
  { rel: 'docs/04-architecture.md', anchor: /^### 1\.2 /, id: '04-comp', title: '容器 / 组件视图（COMP）' },
  { rel: 'docs/04-architecture.md', anchor: /^## 2\. /, id: '04-mod', title: '模块清单（MOD · 含详细设计列）' },
  { rel: 'docs/04-architecture.md', anchor: /^## 5\. .*Flow|^## 5\. /, id: '04-flows', title: '关键流程（Flow）与追溯' },
  { rel: 'docs/04-architecture.md', anchor: /^### 5\.5 /, id: '04-error-design', title: '出错处理与权限拒绝设计' },
  { rel: 'docs/05-tech-spec.md', anchor: /^### 2\.1|^## 2\. /, id: '05-deps', title: '依赖与配置矩阵' },
  { rel: 'docs/05-tech-spec.md', anchor: /^### 5\.1|^## 5\. /, id: '05-rg', title: 'Readiness Gate（RG）' },
  { rel: 'docs/06-db-design.md', anchor: /^## 1\. /, id: '06-tables', title: '表清单（完整 · 含状态列）' },
  { rel: 'docs/06-db-design.md', anchor: /^## 6\. /, id: '06-req-table-trace', title: 'REQ → 表 / TC / Sprint 追溯' },
  { rel: 'docs/07-api-spec.md', anchor: /^## 2\. /, id: '07-api-list', title: '接口清单（API-ID）' },
  { rel: 'docs/07-api-spec.md', anchor: /^## 5\. /, id: '07-cross-trace', title: 'API ↔ DB / Service / Test 交叉追溯' },
  { rel: 'docs/09-verification.md', anchor: /^## 2\. /, id: '09-req-tc', title: 'REQ → 用例追溯矩阵（TC）' },
];

/* ---------- 原位登记档（日志型，不抽镜像，仅索引链接） ---------- */
const TABLES_INPLACE = [
  { rel: 'docs/08-dev-plan.md', anchor: 'Sprint 完成包与进度记录', note: '增量日志（随验收更新）' },
  { rel: 'docs/09-verification.md', anchor: '§5 验收记录', note: '增量日志（随验收更新）' },
];

/* ---------- 生成 ---------- */

const PHASE_ORDER = ['需求分析', '概要设计', '详细设计', '详细设计（愿景）', '实现'];

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
  const rows = DIAGRAMS.map((d) =>
    `| ${d.id} | ${d.title} | ${d.type} | \`${d.rel}\` | ${d.trace} | ${d.render} |`,
  );
  const byPhase = PHASE_ORDER.map((p) => {
    const list = DIAGRAMS.filter((d) => d.phase === p);
    if (!list.length) return '';
    return `\n### ${p}（${list.length}）\n\n| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |\n|---|---|---|---|---|---|\n${list
      .map((d) => `| [${d.id}](${d.id}.md) | ${d.title} | ${d.type} | \`${d.rel}\` | ${d.trace} | ${d.render} |`)
      .join('\n')}`;
  }).filter(Boolean).join('\n');
  return `# 图索引（docs/diagrams/）

> **生成式镜像索引**（\`scripts/extract-diagrams.mjs\` 产物，不手改）。审核主入口：按 OO 方法五阶段分组；每图一文件（图块 + 源锚点 + 追溯）。
> 文档内图是唯一权威源，本目录是抽取镜像——改图请改源文档后重跑脚本；CI（docs-mirror job）校验同步。
> 共 ${DIAGRAMS.length} 张。方案：\`docs/research/2026-08-17-oo-coverage-evaluation-and-diagram-mirror-plan.md\`。
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
outputs.set('docs/diagrams/INDEX.md', buildDiagramIndex());
outputs.set('docs/tables/INDEX.md', buildTableIndex());

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
  console.log(`\nDone: ${written} files written (${DIAGRAMS.length} diagrams + ${TABLES.length} tables + 2 INDEX).`);
}
