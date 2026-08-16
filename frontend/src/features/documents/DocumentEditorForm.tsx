import type { FormEvent } from 'react';
import type { DocumentPermission, DocLinkView } from '../../api';
import type { Draft } from '../../app/types';
import { permissionLabels } from '../../app/constants';
import { useTextareaSelection } from '../../app/useTextareaSelection';
import type { useAiPolish } from '../../app/useAiPolish';
import { MarkdownEditorBody } from '../shared/MarkdownEditorBody';

/**
 * 文档编辑表单（Slice E 从 DocumentsFeature 抽出）。
 * 编辑体（工具栏 / 撤销 / split）复用 shared/MarkdownEditorBody（2026-08-14 与本地挂载统一）；
 * 本表单保留 DB 专属：标题 / 权限 / 保存提交 / AI 润色选区。
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
  // AI 选区：textarea 非空选区回调（DB 专属能力；编辑体内部 ref 透传）。
  const { onSelect: handleTextareaSelect } = useTextareaSelection(aiPolish.changeSelection);

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
      <MarkdownEditorBody
        draft={draft}
        onDraftChange={onDraftChange}
        effectiveMode={effectiveMode}
        aiPolishSelection={handleTextareaSelect}
        outboundLinks={outboundLinks}
        onOpenDocument={onOpenDocument}
        fieldLabel="Markdown 内容"
      />
    </form>
  );
}
