import { describe, expect, it } from 'vitest';

import { buildInvertedIndex, searchIndex, tokenize, type LocalVaultDoc } from './local-vault-index';

function makeDoc(name: string, title: string, text: string): LocalVaultDoc {
  return { path: name, name, title, text, handle: {} as FileSystemFileHandle };
}

describe('local-vault-index', () => {
  it('normalizes and filters short tokens', () => {
    expect(tokenize('Alpha，Beta a 中')).toEqual(['alpha', 'beta']);
  });

  it('deduplicates a document token in the inverted index', () => {
    const index = buildInvertedIndex([makeDoc('note.md', 'Alpha', 'alpha alpha')]);

    expect(index.inverted.get('alpha')).toEqual(new Set([0]));
  });

  it('returns no matches for an empty query', () => {
    const index = buildInvertedIndex([makeDoc('note.md', 'Alpha', 'knowledge')]);

    expect(searchIndex(index, '   ')).toEqual([]);
  });

  it('supports a one-character Chinese query', () => {
    const index = buildInvertedIndex([makeDoc('knowledge.md', '知识库', '团队知识')]);

    expect(searchIndex(index, '知')).toMatchObject([{ doc: { name: 'knowledge.md' } }]);
  });

  it('sorts higher-scoring documents first and honors the result limit', () => {
    const index = buildInvertedIndex([
      makeDoc('first.md', 'Knowledge alpha', 'notes'),
      makeDoc('second.md', 'Knowledge', 'notes'),
      makeDoc('third.md', 'Knowledge', 'notes'),
    ]);

    const hits = searchIndex(index, 'knowledge alpha', 2);

    expect(hits.map((hit) => hit.doc.name)).toEqual(['first.md', 'second.md']);
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
  });
});
