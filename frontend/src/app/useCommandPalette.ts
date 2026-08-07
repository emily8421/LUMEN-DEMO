import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { SearchResponse } from '../api';
import { searchDocuments } from '../api';
import type { ActiveView } from './WorkspaceViewNav';

/**
 * 命令面板项（批2a，点2）：扁平列表，统一键盘导航。
 * - document：搜索命中的文档，回车直开
 * - navigate：跳转视图（空 query 时出现）
 * - action：执行命令（新建 / 导入）
 * - ai：用输入问 AI（批2a 跳 query 视图；批3 改跳 AI 抽屉）
 */
export type PaletteItem =
  | { kind: 'document'; id: number; title: string; snippet: string }
  | { kind: 'navigate'; view: ActiveView; label: string; hint: string }
  | { kind: 'action'; label: string; hint: string; run: () => void }
  | { kind: 'ai'; label: string; query: string; hint: string };

type UseCommandPaletteArgs = {
  token: string | undefined;
  onOpenDocument: (documentId: number, title: string) => void;
  onNavigate: (view: ActiveView) => void;
  onCreateDocument: () => void;
  onOpenImport: () => void;
  /** 批2a：带 query 跳现有问答视图；批3 改为打开 AI 抽屉。 */
  onAskAi: (query: string) => void;
};

const NAV_ITEMS: Array<{ view: ActiveView; label: string; hint: string }> = [
  { view: 'home', label: '首页', hint: '跳转' },
  { view: 'documents', label: '文档', hint: '跳转' },
  { view: 'tags', label: '标签', hint: '跳转' },
  { view: 'timeline', label: '时间线', hint: '跳转' },
  { view: 'terms', label: '术语', hint: '跳转' },
];

const DEBOUNCE_MS = 200;
const MAX_DOCS = 8;

export function useCommandPalette({
  token,
  onOpenDocument,
  onNavigate,
  onCreateDocument,
  onOpenImport,
  onAskAi,
}: UseCommandPaletteArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const seqRef = useRef(0);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSearching(false);
    setActiveIndex(0);
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((current) => {
      if (current) {
        setQuery('');
        setResults(null);
        setActiveIndex(0);
      }
      return !current;
    });
  }, []);

  // ⌘K / Ctrl+K 全局唤起切换（输入框聚焦也允许：⌘K 本就是全局搜索快捷键）。
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  // 面板开 + query 变化 → debounce 即时搜（不走全局 runAction，避免 isBusy 干扰）。
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const trimmed = query.trim();
    if (!trimmed || !token) {
      setResults(null);
      setSearching(false);
      return;
    }
    const seq = (seqRef.current += 1);
    setSearching(true);
    const timer = setTimeout(() => {
      searchDocuments(token, trimmed)
        .then((response) => {
          if (seq === seqRef.current) {
            setResults(response);
          }
        })
        .catch(() => {
          if (seq === seqRef.current) {
            setResults(null);
          }
        })
        .finally(() => {
          if (seq === seqRef.current) {
            setSearching(false);
          }
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isOpen, query, token]);

  // 构建扁平项（顺序即分组顺序：AI → 文档 → 跳转 → 操作）。
  const trimmed = query.trim();
  const items: PaletteItem[] = [];
  if (trimmed) {
    items.push({ kind: 'ai', label: `问 AI：${trimmed}`, query: trimmed, hint: '⌘↵' });
  }
  const docItems = results?.items.slice(0, MAX_DOCS) ?? [];
  for (const item of docItems) {
    items.push({ kind: 'document', id: item.doc_id, title: item.title, snippet: item.snippet });
  }
  if (!trimmed) {
    for (const item of NAV_ITEMS) {
      items.push({ kind: 'navigate', view: item.view, label: item.label, hint: item.hint });
    }
  }
  items.push({ kind: 'action', label: '新建文档', hint: '操作', run: onCreateDocument });
  if (!trimmed) {
    items.push({ kind: 'action', label: '导入文档', hint: '操作', run: onOpenImport });
  }

  // query 变化 → 重置高亮；列表变短 → clamp。
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  const execute = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) {
        return;
      }
      if (item.kind === 'document') {
        onOpenDocument(item.id, item.title);
      } else if (item.kind === 'navigate') {
        onNavigate(item.view);
      } else if (item.kind === 'action') {
        item.run();
      } else if (item.kind === 'ai') {
        onAskAi(item.query);
      }
      close();
    },
    [onOpenDocument, onNavigate, onAskAi, close],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, items.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        execute(items[activeIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    },
    [items, activeIndex, execute, close],
  );

  return {
    isOpen,
    open,
    close,
    query,
    setQuery,
    searching,
    items,
    activeIndex,
    setActiveIndex,
    onKeyDown,
    execute,
  };
}
