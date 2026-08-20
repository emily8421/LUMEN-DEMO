import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { TaggedDocumentItem, TagView } from '../api';
import {
  addDocumentTag,
  archiveTag,
  createTag,
  listDocumentsByTag,
  listTags,
  removeDocumentTag,
  updateTag,
} from '../api';
import { createResponseOwnership } from './response-ownership';
import { useDocumentTags } from './useDocumentTags';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseTagsArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  selectedDocumentId: number | null;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * REQ-012 标签 state + handler（Phase2A 最小版）。
 *
 * 抽成独立 hook，让标签这个新功能不堆进 App()，给主组件减压（APP-SIZE-C-011）。
 * 自洽监听 token / currentSpaceId / selectedDocumentId：
 * - token 或空间变化 → 重载空间标签列表；
 * - 选中文档变化 → 重载该文档标签；
 * - 点标签 / 打标签 / 移除标签 由暴露的 handler 处理。
 *
 * 写操作经 App 传入的 runAction 包装，错误处理（含登录失效）与全局 isBusy / notice 一致。
 */
export function useTags({ token, currentSpaceId, selectedDocumentId, runAction, setNotice }: UseTagsArgs) {
  const [tags, setTags] = useState<TagView[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tagDocuments, setTagDocuments] = useState<TaggedDocumentItem[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [addTagSelection, setAddTagSelection] = useState<number | null>(null);

  // 标签 CRUD（批2b 步2，兑现已批准 API-027 契约）：编辑态 draft + 编辑中 id
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string; color: string }>({
    name: '',
    description: '',
    color: '',
  });
  const tagsResponseOwnership = useRef(createResponseOwnership());
  const tagDocumentsResponseOwnership = useRef(createResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  tagsResponseOwnership.current.setScope(scope);
  tagDocumentsResponseOwnership.current.setScope(scope);

  const { documentTags, reloadDocumentTags } = useDocumentTags({ token, currentSpaceId, selectedDocumentId });

  // 空间切换 / 登录 → 重载标签列表，清空已选标签与其文档
  useEffect(() => {
    if (!token) {
      setTags([]);
      return;
    }
    if (!tagsResponseOwnership.current.isCurrentScope(scope)) {
      return;
    }
    const ticket = tagsResponseOwnership.current.begin();
    void listTags(token)
      .then((result) => {
        if (tagsResponseOwnership.current.owns(ticket)) {
          setTags(result.items);
        }
      })
      .catch(() => {
        // 标签列表加载失败不阻塞主流程；登录失效由写操作路径处理
      });
    setSelectedTagId(null);
    setTagDocuments([]);
  }, [token, currentSpaceId, scope]);

  const loadTagDocuments = useCallback(
    async (tagId: number | null) => {
      if (!token || tagId == null) {
        setTagDocuments([]);
        return;
      }
      if (!tagDocumentsResponseOwnership.current.isCurrentScope(scope)) {
        return;
      }
      const ticket = tagDocumentsResponseOwnership.current.begin();
      try {
        const rows = await listDocumentsByTag(token, tagId);
        if (tagDocumentsResponseOwnership.current.owns(ticket)) {
          setTagDocuments(rows);
        }
      } catch {
        if (tagDocumentsResponseOwnership.current.owns(ticket)) {
          setTagDocuments([]);
        }
      }
    },
    [token, scope],
  );

  const handleSelectTag = useCallback(
    (tagId: number | null) => {
      setSelectedTagId(tagId);
      void loadTagDocuments(tagId);
    },
    [loadTagDocuments],
  );

  const handleCreateTag = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    const name = newTagName.trim();
    if (!name) {
      return;
    }
    void runAction('正在创建标签...', async () => {
      const created = await createTag(token, { name });
      setTags((current) => [...current, created]);
      setNewTagName('');
      setNotice(`已创建标签：${created.name}`);
    });
  };

  const beginEditTag = (tag: TagView) => {
    setEditingTagId(tag.id);
    setEditDraft({ name: tag.name, description: tag.description ?? '', color: tag.color ?? '' });
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
  };

  const handleUpdateTag = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || editingTagId == null) {
      return;
    }
    const name = editDraft.name.trim();
    if (!name) {
      return;
    }
    void runAction('正在更新标签...', async () => {
      const updated = await updateTag(token, editingTagId, {
        name,
        description: editDraft.description.trim() || undefined,
        color: editDraft.color.trim() || undefined,
      });
      setTags((current) => current.map((tag) => (tag.id === updated.id ? { ...tag, ...updated } : tag)));
      setEditingTagId(null);
      setNotice(`已更新标签：${updated.name}`);
    });
  };

  const handleArchiveTag = (tag: TagView) => {
    if (!token) {
      return;
    }
    if (!window.confirm(`确认归档标签「${tag.name}」？归档后不再出现在标签列表，关联文档保留。`)) {
      return;
    }
    void runAction('正在归档标签...', async () => {
      await archiveTag(token, tag.id);
      setTags((current) => current.filter((item) => item.id !== tag.id));
      if (selectedTagId === tag.id) {
        setSelectedTagId(null);
        setTagDocuments([]);
      }
      setNotice(`已归档标签：${tag.name}`);
    });
  };

  const handleCreateAndTag = (name: string) => {
    if (!token || selectedDocumentId == null) {
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    void runAction('正在新建标签并打标签...', async () => {
      const created = await createTag(token, { name: trimmedName });
      await addDocumentTag(token, selectedDocumentId, created.id);
      setTags((current) => [...current, created]);
      await reloadDocumentTags(token, selectedDocumentId);
      setNotice(`已新建标签并打给本文：${created.name}`);
    });
  };

  const handleAddDocumentTag = (tagId: number | null) => {
    if (!token || selectedDocumentId == null || tagId == null) {
      return;
    }
    void runAction('正在打标签...', async () => {
      await addDocumentTag(token, selectedDocumentId, tagId);
      await reloadDocumentTags(token, selectedDocumentId);
      setTags((current) =>
        current.map((tag) => (tag.id === tagId ? { ...tag, document_count: tag.document_count + 1 } : tag)),
      );
      setAddTagSelection(null);
      setNotice('已打标签。');
    });
  };

  const handleRemoveDocumentTag = (tagId: number) => {
    if (!token || selectedDocumentId == null) {
      return;
    }
    void runAction('正在移除标签...', async () => {
      await removeDocumentTag(token, selectedDocumentId, tagId);
      await reloadDocumentTags(token, selectedDocumentId);
      setTags((current) =>
        current.map((tag) =>
          tag.id === tagId ? { ...tag, document_count: Math.max(0, tag.document_count - 1) } : tag,
        ),
      );
      setNotice('已移除标签。');
    });
  };

  return {
    tags,
    documentTags,
    selectedTagId,
    tagDocuments,
    newTagName,
    addTagSelection,
    editingTagId,
    editDraft,
    setEditDraft,
    setNewTagName,
    setAddTagSelection,
    handleSelectTag,
    handleCreateTag,
    handleCreateAndTag,
    handleAddDocumentTag,
    handleRemoveDocumentTag,
    beginEditTag,
    cancelEditTag,
    handleUpdateTag,
    handleArchiveTag,
  };
}
