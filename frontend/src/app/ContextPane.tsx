import type { DragEvent, FormEvent } from 'react';
import type { DocumentPermission, ImportBatchItem, KnowledgeDocument, Space, Term } from '../api';
import type { ImportDraft, ImportFileSelection } from './types';
import type { ActiveView } from './WorkspaceViewNav';
import { permissionLabels } from './constants';

type ContextPaneProps = {
  activeView: ActiveView;
  currentSpace: Space | null;
  documents: KnowledgeDocument[];
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  onCreateDocument: () => void;
  onSelectDocument: (documentId: number) => void;
  importDraft: ImportDraft;
  onImportDraftChange: (draft: ImportDraft) => void;
  importFiles: ImportFileSelection[];
  onImportFilesChange: (files: ImportFileSelection[]) => void;
  importInputKey: number;
  lastImportSummary: string;
  lastImportItems: ImportBatchItem[];
  onImport: (event: FormEvent<HTMLFormElement>) => void;
  terms: Term[];
  selectedTermId: number | null;
  onSelectTerm: (term: Term) => void;
  onNewTerm: () => void;
};

export function ContextPane({
  activeView,
  currentSpace,
  documents,
  selectedId,
  isCreating,
  isBusy,
  onCreateDocument,
  onSelectDocument,
  importDraft,
  onImportDraftChange,
  importFiles,
  onImportFilesChange,
  importInputKey,
  lastImportSummary,
  lastImportItems,
  onImport,
  terms,
  selectedTermId,
  onSelectTerm,
  onNewTerm,
}: ContextPaneProps) {
  function selectFiles(fileList: FileList | null) {
    if (!fileList) {
      onImportFilesChange([]);
      return;
    }

    onImportFilesChange(Array.from(fileList).map(fileToSelection));
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const droppedFiles = await collectDroppedFiles(event.dataTransfer);
    onImportFilesChange(droppedFiles);
  }

  const selectedFileLabel = importFiles.length === 0
    ? '尚未选择文件'
    : importFiles.length === 1
      ? importFiles[0].relativePath
      : `已选择 ${importFiles.length} 个文件`;

  return (
    <aside className={`sidebar context-pane context-${activeView}`.trim()}>
      {activeView === 'documents' ? (
        <>
          <section className="context-header section-title">
            <div>
              <h2>文档</h2>
              <p className="empty-state">当前空间 {documents.length} 篇</p>
            </div>
            <button type="button" onClick={onCreateDocument} disabled={isBusy}>新建</button>
          </section>
          {documents.length === 0 ? (
            <p className="empty-state context-empty">当前空间暂无可见文档。</p>
          ) : (
            <ul className="document-list context-list">
              {documents.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    className={document.id === selectedId && !isCreating ? 'active' : ''}
                    onClick={() => onSelectDocument(document.id)}
                  >
                    <span>{document.title}</span>
                    <small>{permissionLabels[document.permission]} · v{document.current_version}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <section className="import-panel context-footer">
            <div className="subsection-heading">
              <strong>批量导入文本</strong>
              <span>仅 .txt / .md；文件夹路径会变成标题前缀</span>
            </div>
            <form className="compact-form" onSubmit={onImport}>
              <label
                className="drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <strong>拖拽文件或文件夹到这里</strong>
                <span>{selectedFileLabel}</span>
                <input
                  key={importInputKey}
                  type="file"
                  accept=".md,.txt,text/markdown,text/plain"
                  multiple
                  onChange={(event) => selectFiles(event.target.files)}
                />
              </label>
              <label className="folder-picker">
                选择文件夹
                <input
                  key={`folder-${importInputKey}`}
                  type="file"
                  multiple
                  accept=".md,.txt,text/markdown,text/plain"
                  ref={(input) => {
                    input?.setAttribute('webkitdirectory', '');
                    input?.setAttribute('directory', '');
                  }}
                  onChange={(event) => selectFiles(event.target.files)}
                />
              </label>
              <label>
                权限
                <select
                  value={importDraft.permission}
                  onChange={(event) => onImportDraftChange({ ...importDraft, permission: event.target.value as DocumentPermission })}
                >
                  {Object.entries(permissionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              {importFiles.length > 0 ? (
                <ul className="import-file-list">
                  {importFiles.slice(0, 4).map((item) => (
                    <li key={`${item.relativePath}-${item.file.size}`}>{item.relativePath}</li>
                  ))}
                  {importFiles.length > 4 ? <li>还有 {importFiles.length - 4} 个文件…</li> : null}
                </ul>
              ) : null}
              <button type="submit" disabled={isBusy || importFiles.length === 0}>批量导入</button>
            </form>
            {lastImportSummary ? <p className="import-summary">{lastImportSummary}</p> : null}
            {lastImportItems.length > 0 ? (
              <ul className="import-result-list">
                {lastImportItems.map((item) => (
                  <li key={`${item.relative_path}-${item.status}-${item.parsed_doc_id ?? item.error ?? ''}`} className={`import-result-${item.status}`}>
                    <strong>{item.title}</strong>
                    <span>{item.status === 'done' ? `成功 · ${item.chunk_count} chunks` : `${item.status === 'skipped' ? '跳过' : '失败'} · ${item.error ?? '未知原因'}`}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </>
      ) : null}

      {activeView === 'search' ? (
        <>
          <section className="context-header">
            <div className="section-title stacked">
              <h2>搜索上下文</h2>
              <p className="empty-state">筛选与最近任务，不挤占结果区。</p>
            </div>
          </section>
          <div className="context-list info-list">
            <article className="info-row active">
              <strong>全部可见文档</strong>
              <span>权限过滤以后端返回为准。</span>
            </article>
            <article className="info-row">
              <strong>Hybrid Search</strong>
              <span>关键词 + ts_vector + pgvector 语义召回。</span>
            </article>
            <article className="info-row">
              <strong>最近查询</strong>
              <span>触发延迟 / RAG 来源 / 权限过滤</span>
            </article>
          </div>
        </>
      ) : null}

      {activeView === 'query' ? (
        <>
          <section className="context-header">
            <div className="section-title stacked">
              <h2>问答上下文</h2>
              <p className="empty-state">当前空间：{currentSpace?.name ?? '未知空间'}</p>
            </div>
          </section>
          <div className="context-list info-list">
            <article className="info-row active">
              <strong>回答红线</strong>
              <span>库外问题必须返回“未找到”，不编造。</span>
            </article>
            <article className="info-row">
              <strong>来源要求</strong>
              <span>答案必须附文档或术语来源。</span>
            </article>
            <article className="info-row">
              <strong>术语注入</strong>
              <span>空间术语优先于全局同名术语。</span>
            </article>
          </div>
        </>
      ) : null}

      {activeView === 'terms' ? (
        <>
          <section className="context-header section-title">
            <div>
              <h2>术语</h2>
              <p className="empty-state">当前空间 {terms.length} 条</p>
            </div>
            <button
              type="button"
              onClick={onNewTerm}
              disabled={isBusy}
            >
              新建
            </button>
          </section>
          {terms.length === 0 ? (
            <p className="empty-state context-empty">当前空间暂无术语。</p>
          ) : (
            <ul className="term-list context-list">
              {terms.map((term) => (
                <li key={term.id}>
                  <button
                    type="button"
                    className={term.id === selectedTermId ? 'active' : ''}
                    onClick={() => onSelectTerm(term)}
                  >
                    <strong>{term.term}</strong>
                    <small>{term.space_id ? '当前空间' : '全局'} · {term.status === 'confirmed' ? '已确认' : '待确认'}</small>
                    <span>{term.definition}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </aside>
  );
}

type FileWithRelativePath = File & { webkitRelativePath?: string };

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath?: string;
  file?: (successCallback: (file: File) => void, errorCallback?: () => void) => void;
  createReader?: () => {
    readEntries: (
      successCallback: (entries: FileSystemEntryLike[]) => void,
      errorCallback?: () => void,
    ) => void;
  };
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function fileToSelection(file: File): ImportFileSelection {
  const relativePath = (file as FileWithRelativePath).webkitRelativePath || file.name;
  return { file, relativePath: normalizeImportPath(relativePath) };
}

async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<ImportFileSelection[]> {
  const entries: FileSystemEntryLike[] = [];
  Array.from(dataTransfer.items).forEach((item) => {
    const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.() as FileSystemEntryLike | null | undefined;
    if (entry) {
      entries.push(entry);
    }
  });

  if (entries.length === 0) {
    return Array.from(dataTransfer.files).map(fileToSelection);
  }

  const nestedFiles = await Promise.all(entries.map(readEntryFiles));
  return nestedFiles.flat();
}

async function readEntryFiles(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  if (entry.isFile) {
    return readFileEntry(entry);
  }
  if (entry.isDirectory) {
    return readDirectoryEntry(entry);
  }
  return [];
}

function readFileEntry(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  return new Promise((resolve) => {
    if (!entry.file) {
      resolve([]);
      return;
    }

    entry.file(
      (file) => resolve([{ file, relativePath: normalizeImportPath(entry.fullPath || file.name) }]),
      () => resolve([]),
    );
  });
}

function readDirectoryEntry(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  const reader = entry.createReader?.();
  if (!reader) {
    return Promise.resolve([]);
  }

  const entries: FileSystemEntryLike[] = [];
  return new Promise((resolve) => {
    const readBatch = () => {
      reader.readEntries(
        async (batch) => {
          if (batch.length === 0) {
            const nestedFiles = await Promise.all(entries.map(readEntryFiles));
            resolve(nestedFiles.flat());
            return;
          }
          entries.push(...batch);
          readBatch();
        },
        () => resolve([]),
      );
    };

    readBatch();
  });
}

function normalizeImportPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
}
