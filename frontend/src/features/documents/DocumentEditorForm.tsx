import type { FormEvent } from 'react';
import type { DocumentPermission, DocLinkView } from '../../api';
import type { Draft } from '../../app/types';
import { permissionLabels } from '../../app/constants';
import { useTextareaSelection } from '../../app/useTextareaSelection';
import type { useAiPolish } from '../../app/useAiPolish';
import { applyMarkdownAction, type MarkdownToolbarAction } from '../../app/markdown-editor-actions';
import { useSplitDragController } from './useSplitDragController';
import { useEditorUndoStack } from './useEditorUndoStack';
import { MarkdownToolbar } from './MarkdownToolbar';
import { DocumentPreviewPane } from './DocumentPreviewPane';

/**
 * 文档编辑表单（Slice E 从 DocumentsFeature 抽出）。
 * textareaRef 在本组件内部创建并内聚三处共享：撤销栈 / AI 选区 / MD 工具栏插入。
 * split 模式由内置 useSplitDragController 管理分隔条；并排预览用 DocumentPreviewPane。
 */
interface DocumentEditorFormProps {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  isBusy: boolean;
  effectiveMode: 'edit' | 'split';
  aiPolish: ReturnType<typeof useAiPolish>;
  /** 并排态预览出链（[[wikilink]] 渲染为可点击链接）。 */
  outboundLinks: DocLinkView[];
  onOpenDocument: (documentId: number, title: string) => void;
}

export function DocumentEditorForm({
  draft,
  onDraftChange,
  onSave,
  isBusy,
  effectiveMode,
  aiPolish,
  outboundLinks,
  onOpenDocument,
}: DocumentEditorFormProps) {
  // textareaRef 三方共享：AI 选区（useTextareaSelection）+ 撤销栈 + MD 插入。
  const { ref: textareaRef, onSelect: handleTextareaSelect } = useTextareaSelection(aiPolish.changeSelection);
  const { pushUndoSnapshot, handleUndo } = useEditorUndoStack(draft, onDraftChange, textareaRef);
  const {
    splitRatio,
    splitResizing,
    splitGridRef,
    handleSplitPointerDown,
    handleSplitPointerMove,
    handleSplitPointerEnd,
    handleSplitKeyDown,
    resetSplitRatio,
  } = useSplitDragController();

  // md 工具栏插入——在光标处应用语法，更新草稿后恢复光标到插入内容之后。
  const handleMdAction = (action: MarkdownToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    pushUndoSnapshot();
    const result = applyMarkdownAction(action, draft.content_md, selectionStart, selectionEnd);
    onDraftChange({ ...draft, content_md: result.value });
    // 受控组件更新后光标会被重置；下一帧恢复选区。
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.start, result.end);
    });
  };

  return (
    <form className="editor-form" onSubmit={onSave}>
      <div className="editor-toolbar">
        <input
          className="editor-title-input"
          value={draft.title}
          onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          placeholder="输入 Markdown 文档标题"
          aria-label="文档标题"
        />
        <select
          className="editor-permission-select"
          value={draft.permission}
          onChange={(event) => onDraftChange({ ...draft, permission: event.target.value as DocumentPermission })}
          aria-label="文档权限"
        >
          {Object.entries(permissionLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="editor-toolbar-actions">
          <button type="submit" disabled={isBusy || draft.title.trim().length === 0}>保存</button>
        </div>
      </div>
      <div
        ref={splitGridRef}
        className={effectiveMode === 'split' ? `editor-content-grid split-mode${splitResizing ? ' resizing' : ''}` : 'editor-content-grid single-column'}
        style={effectiveMode === 'split' ? { gridTemplateColumns: `minmax(0, ${splitRatio * 100}%) 6px minmax(160px, ${(1 - splitRatio) * 100}%)` } : undefined}
      >
        <MarkdownToolbar onAction={handleMdAction} />
        <label className="editor-field">
          Markdown 内容
          <textarea
            ref={textareaRef}
            value={draft.content_md}
            onChange={(event) => {
              // 更新前记录当前快照（浏览器原生 undo 被受控组件破坏，自建栈）。
              pushUndoSnapshot();
              onDraftChange({ ...draft, content_md: event.target.value });
            }}
            onKeyDown={(event) => {
              // Ctrl+Z / Ctrl+Shift+Z 撤销；Ctrl+Y 重做暂不做（栈仅保存 undo）。
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                handleUndo();
              }
            }}
            onSelect={handleTextareaSelect}
            placeholder="输入或编辑 Markdown 内容"
            rows={14}
          />
        </label>
        {effectiveMode === 'split' ? (
          <div
            className={splitResizing ? 'split-resizer resizing' : 'split-resizer'}
            role="separator"
            aria-orientation="vertical"
            aria-label="调整编辑与预览宽度"
            aria-valuemin={30}
            aria-valuemax={70}
            aria-valuenow={Math.round(splitRatio * 100)}
            tabIndex={0}
            onPointerDown={handleSplitPointerDown}
            onPointerMove={handleSplitPointerMove}
            onPointerUp={handleSplitPointerEnd}
            onPointerCancel={handleSplitPointerEnd}
            onDoubleClick={resetSplitRatio}
            onKeyDown={handleSplitKeyDown}
          />
        ) : null}
        {effectiveMode === 'split' ? (
          <DocumentPreviewPane draft={draft} outboundLinks={outboundLinks} onOpenDocument={onOpenDocument} effectiveMode={effectiveMode} />
        ) : null}
      </div>
    </form>
  );
}
