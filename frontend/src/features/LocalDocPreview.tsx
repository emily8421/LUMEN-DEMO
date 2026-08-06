// 主区本地文档预览（REQ-018 模式 B）
// 本地挂载文件在主区只读渲染（markdown），替代 DB DocumentsFeature；标注「本地·未入库·不上传」。
// 正文本地读取，不进服务端 RAG（硬天花板）；「导入到 LUMEN」走左栏 LocalMountPane / API-029。

import ReactMarkdown from 'react-markdown';
import type { LocalVaultDoc } from '../app/local-vault-index';

type LocalDocPreviewProps = {
  doc: LocalVaultDoc;
  onClose: () => void;
};

export function LocalDocPreview({ doc, onClose }: LocalDocPreviewProps) {
  return (
    <section className="local-doc-preview workspace-main workspace">
      <header className="local-doc-preview-header">
        <div className="local-doc-preview-title">
          <h2>{doc.title || doc.name}</h2>
          <p className="local-doc-preview-meta">{doc.path} · 本地·未入库·不上传服务端（不进 RAG）</p>
        </div>
        <button type="button" className="local-doc-preview-close" onClick={onClose}>
          关闭预览
        </button>
      </header>
      <article className="local-doc-preview-body markdown-preview">
        <ReactMarkdown>{doc.text}</ReactMarkdown>
      </article>
    </section>
  );
}
