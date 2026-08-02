import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { DocumentTagView, KnowledgeDocument, TagView } from '../api';
import {
  addDocumentTag,
  createTag,
  listDocumentTags,
  listDocumentsByTag,
  listTags,
  removeDocumentTag,
} from '../api';

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
  const [documentTags, setDocumentTags] = useState<DocumentTagView[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tagDocuments, setTagDocuments] = useState<KnowledgeDocument[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [addTagSelection, setAddTagSelection] = useState<number | null>(null);

  // 空间切换 / 登录 → 重载标签列表，清空已选标签与其文档
  useEffect(() => {
    if (!token) {
      setTags([]);
      return;
    }
    void listTags(token)
      .then((result) => setTags(result.items))
      .catch(() => {
        // 标签列表加载失败不阻塞主流程；登录失效由写操作路径处理
      });
    setSelectedTagId(null);
    setTagDocuments([]);
  }, [token, currentSpaceId]);

  // 选中文档变化 → 重载该文档标签
  useEffect(() => {
    if (!token || selectedDocumentId == null) {
      setDocumentTags([]);
      return;
    }
    void listDocumentTags(token, selectedDocumentId)
      .then(setDocumentTags)
      .catch(() => {
        // 文档标签加载失败不阻塞编辑
      });
  }, [token, selectedDocumentId]);

  const loadTagDocuments = useCallback(
    async (tagId: number | null) => {
      if (!token || tagId == null) {
        setTagDocuments([]);
        return;
      }
      try {
        setTagDocuments(await listDocumentsByTag(token, tagId));
      } catch {
        setTagDocuments([]);
      }
    },
    [token],
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
      setDocumentTags(await listDocumentTags(token, selectedDocumentId));
      setNotice(`已新建标签并打给本文：${created.name}`);
    });
  };

  const handleAddDocumentTag = (tagId: number | null) => {
    if (!token || selectedDocumentId == null || tagId == null) {
      return;
    }
    void runAction('正在打标签...', async () => {
      await addDocumentTag(token, selectedDocumentId, tagId);
      setDocumentTags(await listDocumentTags(token, selectedDocumentId));
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
      setDocumentTags(await listDocumentTags(token, selectedDocumentId));
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
    setNewTagName,
    setAddTagSelection,
    handleSelectTag,
    handleCreateTag,
    handleCreateAndTag,
    handleAddDocumentTag,
    handleRemoveDocumentTag,
  };
}
