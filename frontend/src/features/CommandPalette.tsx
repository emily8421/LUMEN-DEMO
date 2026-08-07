import { Fragment, useEffect, useRef } from 'react';
import type { PaletteItem } from '../app/useCommandPalette';

type CommandPaletteProps = {
  isOpen: boolean;
  query: string;
  searching: boolean;
  items: PaletteItem[];
  activeIndex: number;
  onQueryChange: (value: string) => void;
  onActiveIndexChange: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onExecute: (item: PaletteItem) => void;
  onClose: () => void;
};

function groupLabel(item: PaletteItem): string {
  switch (item.kind) {
    case 'ai':
      return 'AI';
    case 'document':
      return '文档';
    case 'navigate':
      return '跳转';
    case 'action':
      return '操作';
  }
}

function itemIcon(item: PaletteItem): string {
  switch (item.kind) {
    case 'ai':
      return '✨';
    case 'document':
      return '📄';
    case 'navigate':
      return '→';
    case 'action':
      return '＋';
  }
}

function itemLabel(item: PaletteItem): string {
  if (item.kind === 'document') {
    return item.title;
  }
  return item.label;
}

function itemHint(item: PaletteItem): string | null {
  if (item.kind === 'document') {
    return null;
  }
  return item.hint;
}

/**
 * 命令面板浮层（批2a，点2）：⌘K 唤起的全局搜索 / 命令面板。
 * items 已是扁平有序列表，渲染时按 kind 变化插入分组标题；activeIndex 全局导航。
 */
export function CommandPalette({
  isOpen,
  query,
  searching,
  items,
  activeIndex,
  onQueryChange,
  onActiveIndexChange,
  onKeyDown,
  onExecute,
  onClose,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  let lastGroup = '';

  return (
    <div className="cmdk-overlay" role="dialog" aria-modal="true" aria-label="快速搜索" onMouseDown={onClose}>
      <div className="cmdk-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            ref={inputRef}
            className="cmdk-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜索文档，或输入问题问 AI…  （Esc 关闭）"
            aria-label="搜索输入"
            spellCheck={false}
          />
          {searching ? <span className="cmdk-spinner">搜索中…</span> : null}
        </div>
        <div className="cmdk-list">
          {items.length === 0 ? (
            <p className="cmdk-empty">
              {query.trim() ? '未找到匹配文档，按 Enter 问 AI。' : '输入关键词搜索文档。'}
            </p>
          ) : (
            items.map((item, index) => {
              const group = groupLabel(item);
              const showHeader = group !== lastGroup;
              lastGroup = group;
              const hint = itemHint(item);
              return (
                <Fragment key={`${item.kind}-${index}`}>
                  {showHeader ? <div className="cmdk-group">{group}</div> : null}
                  <button
                    type="button"
                    className={index === activeIndex ? 'cmdk-item active' : 'cmdk-item'}
                    onClick={() => onExecute(item)}
                    onMouseEnter={() => onActiveIndexChange(index)}
                  >
                    <span className="cmdk-item-icon" aria-hidden="true">{itemIcon(item)}</span>
                    <span className="cmdk-item-label">{itemLabel(item)}</span>
                    {hint ? <span className="cmdk-item-hint">{hint}</span> : null}
                  </button>
                </Fragment>
              );
            })
          )}
        </div>
        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span><kbd>Enter</kbd> 执行</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}
