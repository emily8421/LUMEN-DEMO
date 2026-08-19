// 主区本地文档预览（REQ-018 模式 B / REQ-049 本地可编辑）
// 本地挂载文件在主区渲染（markdown）；标注「本地·未入库·不上传」。
// 正文本地读取，不进服务端 RAG（硬天花板）；「导入到 LUMEN」走左栏 LocalMountPane / API-029。
// 阅读态直接复用 DocumentPreviewPane（read 模式）——滚动容器 / TOC / 限宽与 DB 文档同构。
// REQ-049：主区可切换「编辑 / 并排」——编辑体复用 shared/MarkdownEditorBody（2026-08-14 统一，
// 工具栏 / 撤销 / split 与 DB 文档一致；AI 润色不出现——服务端依赖，硬天花板）。
// 保存写回本地文件系统（仅本地，不进服务端 / RAG）。

import { useState } from 'react';
import { DocumentPreviewPane } from './documents/DocumentPreviewPane';
import { MarkdownEditorBody } from './shared/MarkdownEditorBody';
import type { Draft } from '../app/types';
import type { LocalVaultDoc } from './local-mount/local-vault-index';

type LocalEditMode = 'edit' | 'split';

const LOCAL_EDIT_MODES: Array<{ value: LocalEditMode; label: string }> = [
  { value: 'edit', label: '编辑' },
  { value: 'split', label: '并排' },
];

type LocalDocPreviewProps = {
  doc: LocalVaultDoc;
  onClose: () => void;
  /** REQ-049：编辑态当前路径（非空 = 正在编辑本文）。 */
  editingPath: string | null;
  editingText: string;
  onBeginEdit: (path: string) => void;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

export function LocalDocPreview({
  doc,
  onClose,
  editingPath,
  editingText,
  onBeginEdit,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
}: LocalDocPreviewProps) {
  const isEditing = editingPath === doc.path;
  // 编辑/并排局部态（不入持久层——单篇本地文档的临时预览形态）。
  const [editMode, setEditMode] = useState<LocalEditMode>('edit');
  // 共享编辑体契约是 Draft；本地文档标题即文件名（不可编辑），仅正文可变。
  // 阅读态读 doc.text（挂载缓存）；编辑态才读 editingText（仅编辑本文时有值）。
  const localDraft: Draft = {
    title: doc.title || doc.name,
    content_md: isEditing ? editingText : doc.text,
    permission: 'private',
  };

  return (
    <section className="local-doc-preview workspace-main workspace">
      <header className="local-doc-preview-header">
        <div className="local-doc-preview-title">
          <h2>{doc.title || doc.name}</h2>
          <p className="local-doc-preview-meta">{doc.path} · 本地·未入库·不上传服务端（不进 RAG）</p>
        </div>
        <div className="local-doc-preview-actions">
          {isEditing ? (
            <>
              <div className="document-mode-switch" role="group" aria-label="本地编辑模式">
                {LOCAL_EDIT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    className={editMode === mode.value ? 'active' : ''}
                    onClick={() => setEditMode(mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <button type="button" className="secondary" onClick={onSaveEdit}>保存</button>
              <button type="button" className="secondary" onClick={onCancelEdit}>取消</button>
            </>
          ) : (
            <button type="button" className="secondary" onClick={() => onBeginEdit(doc.path)}>编辑</button>
          )}
          <button type="button" className="local-doc-preview-close" onClick={onClose}>
            关闭预览
          </button>
        </div>
      </header>
      {isEditing ? (
        <div className="local-doc-preview-body local-doc-preview-edit">
          <MarkdownEditorBody
            draft={localDraft}
            onDraftChange={(next) => onEditingTextChange(next.content_md)}
            effectiveMode={editMode}
            fieldLabel="Markdown 内容（本地保存，不上传服务端）"
          />
        </div>
      ) : (
        /* 阅读态直接复用 DB 文档预览容器（.markdown-preview.document-reading-preview）：
           滚动 / TOC sticky / 840px 限宽与知识库同构（此前自建容器高度链断裂致
           scrollIntoView 滚掉 overflow:hidden 祖先、TOC 与正文滚丢回不来，2026-08-16）。 */
        <DocumentPreviewPane
          draft={localDraft}
          outboundLinks={[]}
          onOpenDocument={() => undefined}
          effectiveMode="read"
        />
      )}
    </section>
  );
}
