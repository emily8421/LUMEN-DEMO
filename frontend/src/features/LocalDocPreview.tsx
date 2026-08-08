// 主区本地文档预览（REQ-018 模式 B / REQ-049 本地可编辑）
// 本地挂载文件在主区只读渲染（markdown），替代 DB DocumentsFeature；标注「本地·未入库·不上传」。
// 正文本地读取，不进服务端 RAG（硬天花板）；「导入到 LUMEN」走左栏 LocalMountPane / API-029。
// ④：复用 MarkdownBlock（showToc）获得长文档目录导航，与 DB 文档阅读态体验一致。
// REQ-049：主区可切换「编辑」——textarea 编辑 → 保存写回本地文件系统（仅本地，不进服务端 / RAG）。

import { MarkdownBlock } from '../components/MarkdownBlock';
import type { LocalVaultDoc } from '../app/local-vault-index';

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
          <label className="editor-field">
            Markdown 内容（本地保存，不上传服务端）
            <textarea value={editingText} onChange={(event) => onEditingTextChange(event.target.value)} rows={18} />
          </label>
        </div>
      ) : (
        <div className="local-doc-preview-body">
          <MarkdownBlock content={doc.text} showToc />
        </div>
      )}
    </section>
  );
}
