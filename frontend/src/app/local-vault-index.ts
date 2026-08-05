// 本地 Vault 倒排索引与搜索（vanilla，零第三方依赖）
// 移植自 RG-009 PoC：docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html §4-5
// 仅本地内存索引，不上传服务端（TC-P2-VAULT-001 ⑥ 隐私红线）。
// 硬天花板：本地挂载内容无法进服务端 RAG / 全文搜索；本模块只做本地浏览 / 搜索。

/** 本地 vault 内一篇可索引文档（正文本地读取，不上传）。 */
export interface LocalVaultDoc {
  /** 相对 vault 根的路径，如 "领域0/主题1/note.md" */
  path: string;
  /** 文件名，如 "note.md" */
  name: string;
  /** 标题：正文首个 `# 标题`，否则文件名去扩展名 */
  title: string;
  /** 正文（本地读取） */
  text: string;
  /** 原始文件句柄（按需导入到 LUMEN 时 getFile() 取 File，走 API-029）。 */
  handle: FileSystemFileHandle;
}

/** 本地倒排索引：docs 下标数组 + token → 命中下标集合。 */
export interface LocalVaultIndex {
  docs: LocalVaultDoc[];
  inverted: Map<string, Set<number>>;
}

/** 搜索命中。 */
export interface LocalVaultSearchHit {
  doc: LocalVaultDoc;
  score: number;
}

// 分词：中英文标点 / 空白拆分，过滤长度 ≤1 的碎片（与 PoC tokenize 一致）。
const TOKEN_SPLIT = /[\s,，。.;；:：!！?？()（）\[\]]+/;

/** 分词为小写 token 数组。 */
export function tokenize(s: string): string[] {
  return (s || '').toLowerCase().split(TOKEN_SPLIT).filter(t => t.length > 1);
}

/** 由文档数组构建倒排索引（文件名 + 标题 + 正文，去重 token）。 */
export function buildInvertedIndex(docs: LocalVaultDoc[]): LocalVaultIndex {
  const inverted = new Map<string, Set<number>>();
  docs.forEach((doc, i) => {
    const tokens = new Set(tokenize(`${doc.name} ${doc.title} ${doc.text}`));
    tokens.forEach(t => {
      const set = inverted.get(t);
      if (set) set.add(i);
      else inverted.set(t, new Set([i]));
    });
  });
  return { docs, inverted };
}

/**
 * 本地搜索：token 子串匹配（token 包含任一 term 即计分），按 score 降序，默认上限 50。
 * 空查询返回 []。与 PoC search 行为一致。
 */
export function searchIndex(index: LocalVaultIndex, query: string, limit = 50): LocalVaultSearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const score = new Map<number, number>();
  index.inverted.forEach((set, token) => {
    if (terms.some(term => token.includes(term))) {
      set.forEach(i => score.set(i, (score.get(i) || 0) + 1));
    }
  });
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([i, s]) => ({ doc: index.docs[i], score: s }));
}
