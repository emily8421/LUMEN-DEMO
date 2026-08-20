import { describe, expect, it } from 'vitest';

import { emptyDraft, normalizeDraft } from './drafts';

describe('drafts', () => {
  it('provides a blank team-visible draft', () => {
    expect(emptyDraft).toEqual({ title: '', content_md: '', permission: 'team' });
  });

  it('trims only the title while preserving content and permission', () => {
    expect(normalizeDraft({ title: '  Note  ', content_md: '  body  ', permission: 'private' })).toEqual({
      title: 'Note',
      content_md: '  body  ',
      permission: 'private',
    });
  });

  it('keeps an explicit folder id but omits an undefined one', () => {
    expect(normalizeDraft({ title: 'Root', content_md: '', permission: 'team', folder_id: null })).toHaveProperty('folder_id', null);
    expect(normalizeDraft({ title: 'Edit', content_md: '', permission: 'team' })).not.toHaveProperty('folder_id');
  });
});
