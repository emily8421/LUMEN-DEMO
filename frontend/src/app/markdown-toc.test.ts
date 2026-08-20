import { describe, expect, it } from 'vitest';

import { extractToc, slugify, tocDepth } from './markdown-toc';

describe('markdown-toc', () => {
  it('normalizes whitespace, punctuation, and casing in slugs', () => {
    expect(slugify('  Hello, LUMEN!  ')).toBe('hello-lumen');
  });

  it('keeps Chinese heading characters in slugs', () => {
    expect(slugify('知识库 / 目录')).toBe('知识库-目录');
  });

  it('falls back when a heading has no slug characters', () => {
    expect(slugify('***')).toBe('section');
  });

  it('extracts only ATX headings and strips formatting markers', () => {
    expect(extractToc('Title\n# *Overview*\n## `Details`')).toEqual([
      { id: 'overview', level: 1, text: 'Overview' },
      { id: 'details', level: 2, text: 'Details' },
    ]);
  });

  it('assigns unique ids to repeated headings and finds the shallowest level', () => {
    const items = extractToc('### Notes\n# Notes\n#### Later');

    expect(items.map((item) => item.id)).toEqual(['notes', 'notes-2', 'later']);
    expect(tocDepth(items)).toBe(1);
  });

  it('returns zero depth for content without headings', () => {
    expect(tocDepth([])).toBe(0);
  });
});
