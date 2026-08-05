// 本地 Vault 索引纯逻辑 smoke（零依赖；Node 22 type-strip 直接 import TS 纯函数）
// 验证 tokenize / buildInvertedIndex / searchIndex 的算法契约，不依赖浏览器。
// 跑：volta run --node 22.17.1 node --experimental-strip-types scripts/smoke-local-vault-index.mjs
import { tokenize, buildInvertedIndex, searchIndex } from '../frontend/src/app/local-vault-index.ts';

const docs = [
  { path: 'a/量子计算.md', name: '量子计算.md', title: '量子计算基础', text: '利用叠加与纠缠进行高速并行计算' },
  { path: 'b/经典计算.md', name: '经典计算.md', title: '经典计算', text: '比特只有 0 或 1' },
  { path: 'c/量子通信.md', name: '量子通信.md', title: '量子通信', text: '量子纠缠用于通信' },
];

let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); failures++; }
  else console.log('  ok:', msg);
};

// tokenize
assert(tokenize('量子 计算,测试。').includes('量子'), 'tokenize 中文分词保留「量子」');
assert(tokenize('Hello World')[0] === 'hello', 'tokenize 转小写');
assert(tokenize('a.b').length === 0, 'tokenize 过滤长度≤1 短 token');

// search
const index = buildInvertedIndex(docs);
const hits1 = searchIndex(index, '量子');
assert(hits1.length === 2, `search「量子」命中 2 篇（got ${hits1.length}）`);
const hits2 = searchIndex(index, '叠加 高速');
assert(hits2.length === 1 && hits2[0].doc.path === 'a/量子计算.md', 'search 多词同篇 score 排序');
assert(searchIndex(index, '').length === 0, 'search 空查询返回空');
assert(searchIndex(index, '完全不存在的词xyzqqq').length === 0, 'search 无命中返回空');

if (failures === 0) console.log('LOCAL_VAULT_INDEX_SMOKE ok');
else { console.error(`LOCAL_VAULT_INDEX_SMOKE FAIL (${failures})`); process.exitCode = 1; }
