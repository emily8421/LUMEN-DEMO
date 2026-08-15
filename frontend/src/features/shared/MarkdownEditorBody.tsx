import { useRef } from 'react';
import { useEditorUndoStack } from '../documents/useEditorUndoStack';
import { useSplitDragController } from '../documents/useSplitDragController';
import { MarkdownToolbar } from '../documents/MarkdownToolbar';
import { DocumentPreviewPane } from '../documents/DocumentPreviewPane';
import { applyMarkdownAction, type MarkdownToolbarAction } from '../../app/markdown-editor-actions';
import type { DocLinkView } from '../../api';
import type { Draft } from '../../app/types';

/**
 * Markdown 编辑体（2026-08-14 从 DocumentEditorForm 抽出，统一 DB 文档 / 本地挂载编辑体验）：
 * 工具栏（13 动作）+ 受控 textarea（自建撤销栈 Ctrl+Z）+ split 并排预览（可拖分隔条）。
 * 纯前端能力，不含任何服务端依赖；DB 侧专属能力（AI 润色选区 / 权限 / 标题）由宿主自持。
 *
 * textareaRef 由本组件创建并内聚三处共享：撤销栈 / AI 选区（宿主注入 onSelect）/ MD 工具栏插入。
 */
interface MarkdownEditorBodyProps {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  /** 'edit' 单列；'split' 并排预览。 */
  effectiveMode: 'edit' | 'split';
  /** 宿主的 AI 选区回调（仅 DB 侧传入；本地挂载不传 = 无 AI 选区能力，天花板约束）。 */
  aiPolishSelection?: (text: string, start: number, end: number) => void;
  /** 并排态预览出链（DB 侧传入；本地挂载不传则 wikilink 渲染为纯文本）。 */
  outboundLinks?: DocLinkView[];
  onOpenDocument?: (documentId: number, title: string) => void;
  /** textarea 附属属性（placeholder / rows 等，两侧可各自定制）。 */
  textareaPlaceholder?: string;
  textareaRows?: number;
  /** 字段标签（DB「Markdown 内容」/ 本地「Markdown 内容（本地保存，不上传服务端）」）。 */
  fieldLabel: string;
}

export function MarkdownEditorBody({
  draft,
  onDraftChange,
  effectiveMode,
  aiPolishSelection,
  outboundLinks,
  onOpenDocument,
  textareaPlaceholder = '输入或编辑 Markdown 内容',
  textareaRows = 14,
  fieldLabel,
}: MarkdownEditorBodyProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    <div
      ref={splitGridRef}
      className={effectiveMode === 'split' ? `editor-content-grid split-mode${splitResizing ? ' resizing' : ''}` : 'editor-content-grid single-column'}
      style={effectiveMode === 'split' ? { gridTemplateColumns: `minmax(0, ${splitRatio * 100}%) 6px minmax(160px, ${(1 - splitRatio) * 100}%)` } : undefined}
    >
      <MarkdownToolbar onAction={handleMdAction} />
      <label className="editor-field">
        {fieldLabel}
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
          onSelect={aiPolishSelection ? () => {
            const textarea = textareaRef.current;
            if (!textarea) {
              return;
            }
            const { selectionStart, selectionEnd, value } = textarea;
            if (selectionStart !== selectionEnd) {
              aiPolishSelection(value.slice(selectionStart, selectionEnd), selectionStart, selectionEnd);
            }
          } : undefined}
          placeholder={textareaPlaceholder}
          rows={textareaRows}
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
        <DocumentPreviewPane
          draft={draft}
          outboundLinks={outboundLinks ?? []}
          onOpenDocument={onOpenDocument ?? (() => {})}
          effectiveMode={effectiveMode}
        />
      ) : null}
    </div>
  );
}
