import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type {
  DocLinkView,
  DocumentPermission,
  DocumentTagView,
  DocumentVersion,
  KnowledgeDocument,
  TagView,
} from '../api';
import type { Draft } from '../app/types';
import { permissionLabels } from '../app/constants';
import { MarkdownBlock } from '../components/MarkdownBlock';
import { DocumentEmptyState } from './DocumentEmptyState';
import { DocumentInspectorFeature } from './DocumentInspectorFeature';
import { useTextareaSelection } from '../app/useTextareaSelection';
import type { useAiPolish } from '../app/useAiPolish';
import { applyMarkdownAction, type MarkdownToolbarAction } from '../app/markdown-editor-actions';
import { clampSplitRatio, DEFAULT_SPLIT_RATIO, loadSplitRatio, persistSplitRatio } from '../app/split-layout-store';
import { usePaneWidth } from '../app/usePaneWidth';

type DocumentMode = 'read' | 'edit' | 'split';

type DocumentsFeatureProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  isBusy: boolean;
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  versions: DocumentVersion[];
  /** 当前文档出链（outbound），供编辑预览把 [[wikilink]] 渲染成带状态可点击链接。 */
  outboundLinks: DocLinkView[];
  /** 当前文档反向链接（backlink），即引用本文的文档列表。 */
  backlinks: DocLinkView[];
  /** 当前空间可见文档，用于把反链 source_document_id 解析成可读标题。 */
  documents: KnowledgeDocument[];
  onOpenDocument: (documentId: number, title: string) => void;
  onCreateDocument: () => void;
  /** 保存成功次数（useDocuments 自增），用于保存后自动回到阅读态。 */
  savedRevision: number;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onRestore: (versionNo: number) => void;
  onDownloadMarkdown: () => void;
  onExportPdf: () => void;
  onOpenImport: () => void;
  /** 当前文档已打标签。 */
  documentTags: DocumentTagView[];
  /** 当前空间可见标签（打标签下拉用）。 */
  availableTags: TagView[];
  /** 打标签下拉当前选中。 */
  addTagSelection: number | null;
  onAddTagSelectionChange: (tagId: number | null) => void;
  onAddTag: (tagId: number | null) => void;
  onCreateAndTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
  /** REQ-014 AI 润色侧边栏状态 + handler（useAiPolish 返回）。 */
  aiPolish: ReturnType<typeof useAiPolish>;
  /** 右栏（Inspector）可见性（Doc-First §9.5，Sprint-21）。 */
  rightPaneOpen: boolean;
  /** 收起右栏（批1，点1），透传给 DocumentInspectorFeature 边缘按钮。 */
  onToggleRightPane: () => void;
  /** 展开左目录（空态引导按钮，Doc-First §9.5，Sprint-21 slice 3c）。 */
  onExpandLeftPane: () => void;
  /** 返回引导卡（退出新建态 / 取消选中，Doc-First §9.5.7 F-impl-10）。 */
  onExitToEmpty: () => void;
};

const DOCUMENT_MODES: Array<{ value: DocumentMode; label: string }> = [
  { value: 'read', label: '阅读' },
  { value: 'edit', label: '编辑' },
  { value: 'split', label: '并排' },
];

// ⑤：md 编辑工具栏（快捷插入语法；维护态优化——分组渲染 + 分隔线，去边框紧凑）。
// group: 'fmt' 格式 / 'struct' 结构 / 'insert' 插入；组间渲染 .editor-md-toolbar-sep。
type MdToolbarGroup = 'fmt' | 'struct' | 'insert';
const MD_TOOLBAR_ITEMS: Array<{ action: MarkdownToolbarAction; label: string; title: string; group: MdToolbarGroup }> = [
  { action: 'bold', label: 'B', title: '加粗', group: 'fmt' },
  { action: 'italic', label: 'I', title: '斜体', group: 'fmt' },
  { action: 'code', label: '`代码`', title: '行内代码', group: 'fmt' },
  { action: 'heading1', label: 'H1', title: '一级标题', group: 'struct' },
  { action: 'heading2', label: 'H2', title: '二级标题', group: 'struct' },
  { action: 'heading3', label: 'H3', title: '三级标题', group: 'struct' },
  { action: 'unordered-list', label: '• 列表', title: '无序列表', group: 'struct' },
  { action: 'ordered-list', label: '1. 列表', title: '有序列表', group: 'struct' },
  { action: 'quote', label: '❝ 引用', title: '引用', group: 'struct' },
  { action: 'divider', label: '— 分割线', title: '分割线', group: 'struct' },
  { action: 'code-block', label: '代码块', title: '代码块', group: 'insert' },
  { action: 'link', label: '🔗 链接', title: '链接', group: 'insert' },
  { action: 'image', label: '🖼 图片', title: '图片', group: 'insert' },
];

const MD_TOOLBAR_GROUP_LABEL: Record<MdToolbarGroup, string> = {
  fmt: '格式',
  struct: '结构',
  insert: '插入',
};

export function DocumentsFeature({
  isCreating,
  selectedDocument,
  isBusy,
  draft,
  onDraftChange,
  versions,
  outboundLinks,
  backlinks,
  documents,
  onOpenDocument,
  onCreateDocument,
  savedRevision,
  onSave,
  onRestore,
  onDownloadMarkdown,
  onExportPdf,
  onOpenImport,
  documentTags,
  availableTags,
  addTagSelection,
  onAddTagSelectionChange,
  onAddTag,
  onCreateAndTag,
  onRemoveTag,
  aiPolish,
  rightPaneOpen,
  onToggleRightPane,
  onExpandLeftPane,
  onExitToEmpty,
}: DocumentsFeatureProps) {
  const rightPaneWidth = usePaneWidth('right');
  const [documentMode, setDocumentMode] = useState<DocumentMode>('read');
  const { ref: textareaRef, onSelect: handleTextareaSelect } = useTextareaSelection(
    aiPolish.changeSelection,
  );

  const [splitRatio, setSplitRatio] = useState<number>(() => loadSplitRatio());
  const [splitResizing, setSplitResizing] = useState(false);
  const splitRatioRef = useRef(splitRatio);
  const splitGridRef = useRef<HTMLDivElement | null>(null);
  const splitDragRef = useRef<{ containerLeft: number; containerWidth: number } | null>(null);

  // 编辑撤销栈（维护态修复：受控 textarea 使浏览器原生 Ctrl+Z 失效，需自建）。
  // 每次输入 / 工具插入前把「当前内容 + 光标」压栈；Ctrl+Z 出栈恢复。
  // 上限 50 步，超出丢弃最旧。
  const undoStackRef = useRef<Array<{ text: string; start: number; end: number }>>([]);
  const UNDO_MAX = 50;

  /** 记录一次可撤销快照（工具插入 / 手动输入前调用）。 */
  const pushUndoSnapshot = () => {
    const textarea = textareaRef.current;
    const text = textarea?.value ?? draft.content_md;
    const { selectionStart = 0, selectionEnd = 0 } = textarea ?? {};
    const stack = undoStackRef.current;
    // 连续相同内容不重复入栈（避免同一次输入多次 onChange 堆栈）。
    const last = stack[stack.length - 1];
    if (last && last.text === text) {
      return;
    }
    stack.push({ text, start: selectionStart, end: selectionEnd });
    if (stack.length > UNDO_MAX) {
      stack.shift();
    }
  };

  /** Ctrl+Z：出栈恢复上一步内容与光标。 */
  const handleUndo = () => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) {
      return;
    }
    onDraftChange({ ...draft, content_md: snapshot.text });
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(snapshot.start, snapshot.end);
    });
  };

  // 切换文档 / 新建 / 保存后重置撤销栈（编辑会话结束）。
  useEffect(() => {
    undoStackRef.current = [];
  }, [isCreating, selectedDocument?.id, savedRevision]);

  const updateSplitRatio = (ratio: number) => {
    const clamped = clampSplitRatio(ratio);
    splitRatioRef.current = clamped;
    setSplitRatio(clamped);
  };

  const handleSplitPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const grid = splitGridRef.current;
    if (!grid) {
      return;
    }
    event.preventDefault();
    const rect = grid.getBoundingClientRect();
    splitDragRef.current = { containerLeft: rect.left, containerWidth: rect.width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSplitResizing(true);
  };

  const handleSplitPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = splitDragRef.current;
    if (!drag || drag.containerWidth <= 0) {
      return;
    }
    const minEditorPx = 200;
    const minPreviewPx = 220;
    const minRatio = Math.min(0.7, minEditorPx / drag.containerWidth);
    const maxRatio = Math.max(0.3, (drag.containerWidth - minPreviewPx) / drag.containerWidth);
    const pointerRatio = (event.clientX - drag.containerLeft) / drag.containerWidth;
    updateSplitRatio(Math.min(maxRatio, Math.max(minRatio, pointerRatio)));
  };

  const handleSplitPointerEnd = () => {
    splitDragRef.current = null;
    setSplitResizing(false);
    persistSplitRatio(splitRatioRef.current);
  };

  const handleSplitKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      updateSplitRatio(splitRatioRef.current - 0.02);
      persistSplitRatio(splitRatioRef.current);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      updateSplitRatio(splitRatioRef.current + 0.02);
      persistSplitRatio(splitRatioRef.current);
    }
  };

  const resetSplitRatio = () => {
    updateSplitRatio(DEFAULT_SPLIT_RATIO);
    persistSplitRatio(DEFAULT_SPLIT_RATIO);
  };

  // ⑤：md 工具栏插入——在光标处应用语法，更新草稿后恢复光标到插入内容之后。
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

  useEffect(() => {
    if (isCreating) {
      setDocumentMode('edit');
      return;
    }
    if (selectedDocument) {
      setDocumentMode('read');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 selectedDocument.id 变化（切换文档）；selectedDocument 整对象不列入，避免同文档刷新触发多余 mode 重置
  }, [isCreating, selectedDocument?.id]);

  // 并排模式：自动收起右栏（Inspector 与编辑/预览抢横向空间），把宽度留给两侧，避免挤压变形。
  // 切回阅读/编辑态不影响右栏偏好（可手动 Ctrl+R 或点边缘按钮再展开）。
  useEffect(() => {
    if (documentMode === 'split' && rightPaneOpen) {
      onToggleRightPane();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentMode]);

  // 保存成功后回到阅读态（编辑/并排保存同一文档时 id 不变，需显式信号）。
  useEffect(() => {
    if (savedRevision > 0 && !isCreating) {
      setDocumentMode('read');
    }
  }, [savedRevision, isCreating]);

  const canShowModes = Boolean(selectedDocument || isCreating);
  const effectiveMode = isCreating && documentMode === 'read' ? 'edit' : documentMode;

  const previewPane = (
    <section
      className={effectiveMode === 'read' ? 'markdown-preview document-reading-preview' : 'markdown-preview'}
      aria-label={effectiveMode === 'read' ? '文档阅读' : 'Markdown 预览'}
    >
      {effectiveMode !== 'read' ? (
        <div className="subsection-heading">
          <strong>预览</strong>
          <span>保存前检查标题、列表、强调与段落</span>
        </div>
      ) : null}
      <MarkdownBlock
        content={draft.content_md}
        emptyText="暂无可预览内容。"
        docLinks={outboundLinks}
        onOpenDocument={onOpenDocument}
        showToc={effectiveMode === 'read'}
      />
    </section>
  );

  return (
    <section className="documents-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>{isCreating ? '新建文档' : selectedDocument?.title ?? '选择文档'}</h2>
        </div>
        <div className="toolbar-actions">
          {canShowModes ? (
            <div className="document-mode-switch" role="group" aria-label="文档模式">
              {DOCUMENT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={effectiveMode === mode.value ? 'active' : ''}
                  onClick={() => setDocumentMode(mode.value)}
                  disabled={isBusy || (isCreating && mode.value === 'read')}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          ) : null}
          {selectedDocument || isCreating ? (
            <button type="button" className="secondary" onClick={onExitToEmpty} disabled={isBusy}>返回</button>
          ) : null}
          <button type="button" className="secondary" onClick={onOpenImport} disabled={isBusy}>导入</button>
          <button type="button" className="secondary" onClick={onCreateDocument} disabled={isBusy}>新建</button>
          {selectedDocument && !isCreating ? (
            <>
              <button type="button" className="secondary" onClick={onDownloadMarkdown} disabled={isBusy}>下载 .md</button>
              <button type="button" className="secondary" onClick={onExportPdf} disabled={isBusy}>导出 PDF</button>
            </>
          ) : null}
        </div>
      </div>
      <div
        className={`workspace-body document-view-grid${rightPaneOpen ? '' : ' pane-right-collapsed'}`}
        style={{ '--right-pane-width': `${rightPaneWidth.width}px` } as CSSProperties}
      >
        <section className="editor-panel editor-pane">
          {!selectedDocument && !isCreating ? (
            <DocumentEmptyState
              isBusy={isBusy}
              onCreateDocument={onCreateDocument}
              onExpandLeftPane={onExpandLeftPane}
            />
          ) : effectiveMode === 'read' ? (
            previewPane
          ) : (
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
                <div className="editor-md-toolbar" role="toolbar" aria-label="Markdown 工具栏">
                  {(['fmt', 'struct', 'insert'] as MdToolbarGroup[]).map((group, groupIndex) => (
                    <span key={group} className="editor-md-toolbar-group" role="group" aria-label={MD_TOOLBAR_GROUP_LABEL[group]}>
                      {groupIndex > 0 ? <span className="editor-md-toolbar-sep" aria-hidden="true" /> : null}
                      {MD_TOOLBAR_ITEMS.filter((item) => item.group === group).map((item) => (
                        <button
                          key={item.action}
                          type="button"
                          className="editor-md-toolbar-btn"
                          onClick={() => handleMdAction(item.action)}
                          title={item.title}
                          aria-label={item.title}
                        >
                          {item.label}
                        </button>
                      ))}
                    </span>
                  ))}
                </div>
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
                {effectiveMode === 'split' ? previewPane : null}
              </div>
            </form>
          )}
        </section>

        {rightPaneOpen ? (
          <div
            className={rightPaneWidth.resizing ? 'pane-resizer pane-resizer-right resizing' : 'pane-resizer pane-resizer-right'}
            role="separator"
            aria-orientation="vertical"
            aria-label="调整右侧栏宽度"
            tabIndex={0}
            onPointerDown={rightPaneWidth.startResize}
            onPointerMove={rightPaneWidth.moveResize}
            onPointerUp={rightPaneWidth.endResize}
            onPointerCancel={rightPaneWidth.endResize}
            onDoubleClick={rightPaneWidth.resetWidth}
            onKeyDown={rightPaneWidth.handleKeyDown}
          />
        ) : null}

        <DocumentInspectorFeature
          isCreating={isCreating}
          selectedDocument={selectedDocument}
          isBusy={isBusy}
          versions={versions}
          backlinks={backlinks}
          documents={documents}
          onOpenDocument={onOpenDocument}
          onRestore={onRestore}
          documentTags={documentTags}
          availableTags={availableTags}
          addTagSelection={addTagSelection}
          onAddTagSelectionChange={onAddTagSelectionChange}
          onAddTag={onAddTag}
          onCreateAndTag={onCreateAndTag}
          onToggleRightPane={onToggleRightPane}
          onRemoveTag={onRemoveTag}
          aiPolish={aiPolish}
        />
      </div>
    </section>
  );
}
