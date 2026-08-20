import { describe, expect, it } from 'vitest';

import { buildDocumentMoveTargets, buildMoveTargets, parentKey } from './folder-utils';
import type { FolderView } from '../api';

function makeFolder(id: number, name: string, parentId: number | null): FolderView {
  return {
    id,
    name,
    parent_id: parentId,
    order: 0,
    document_count: 0,
    child_folder_count: 0,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-20T00:00:00Z',
  };
}

const folders: FolderView[] = [
  makeFolder(1, 'Projects', null),
  makeFolder(2, 'LUMEN', 1),
  makeFolder(3, 'Notes', 2),
  makeFolder(4, 'Archive', null),
];

describe('folder-utils', () => {
  it('uses the root key for null parents', () => {
    expect(parentKey(null)).toBe('root');
  });

  it('uses the folder id as the non-root parent key', () => {
    expect(parentKey(42)).toBe('42');
  });

  it('excludes a folder and its descendants from folder move targets', () => {
    expect(buildMoveTargets(folders, 1)).toEqual([
      { id: null, label: '根目录' },
      { id: 4, label: 'Archive' },
    ]);
  });

  it('keeps folders with an unknown parent as safe move targets', () => {
    const targets = buildMoveTargets([...folders, makeFolder(5, 'Orphan', 99)], 1);

    expect(targets).toContainEqual({ id: 5, label: 'Orphan' });
  });

  it('allows document moves to every known folder and root', () => {
    expect(buildDocumentMoveTargets(folders)).toHaveLength(5);
    expect(buildDocumentMoveTargets(folders)).toContainEqual({ id: 3, label: 'Notes' });
  });
});
