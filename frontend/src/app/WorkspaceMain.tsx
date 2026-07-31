import { DocumentsFeature } from '../features/DocumentsFeature';
import { SearchFeature } from '../features/SearchFeature';
import { QueryFeature } from '../features/QueryFeature';
import { TermsFeature } from '../features/TermsFeature';
import { TagsFeature } from '../features/TagsFeature';
import { useDocuments } from './useDocuments';
import { useSearch } from './useSearch';
import { useQuery } from './useQuery';
import { useTerms } from './useTerms';
import { useTags } from './useTags';
import type { useAiPolish } from './useAiPolish';

interface WorkspaceMainProps {
  activeView: string;
  isBusy: boolean;
  /** 右栏（Inspector）可见性，透传给 DocumentsFeature（Doc-First §9.5，Sprint-21）。 */
  rightPaneOpen: boolean;
  documents: ReturnType<typeof useDocuments>;
  search: ReturnType<typeof useSearch>;
  query: ReturnType<typeof useQuery>;
  terms: ReturnType<typeof useTerms>;
  tags: ReturnType<typeof useTags>;
  aiPolish: ReturnType<typeof useAiPolish>;
  onQuickEntryOpen: () => void;
}

export function WorkspaceMain({
  activeView,
  isBusy,
  rightPaneOpen,
  documents,
  search,
  query,
  terms,
  tags,
  aiPolish,
  onQuickEntryOpen,
}: WorkspaceMainProps) {
  return (
    <section className="workspace-main workspace">
      <div className="workspace-action-bar">
        <button type="button" className="quick-entry-trigger" onClick={onQuickEntryOpen} disabled={isBusy}>
          ＋ 快速录入
        </button>
      </div>
      {activeView === 'documents' ? (
        <DocumentsFeature
          isCreating={documents.isCreating}
          selectedDocument={documents.selectedDocument}
          isBusy={isBusy}
          rightPaneOpen={rightPaneOpen}
          draft={documents.draft}
          onDraftChange={documents.setDraft}
          versions={documents.versions}
          outboundLinks={documents.outboundLinks}
          backlinks={documents.backlinks}
          documents={documents.documents}
          onOpenDocument={documents.handleOpenDocument}
          onCreateDocument={documents.handleCreateDocument}
          onDelete={documents.handleDelete}
          onSave={documents.handleSave}
          onRestore={documents.handleRestore}
          onDownloadMarkdown={documents.handleDownloadMarkdown}
          documentTags={tags.documentTags}
          availableTags={tags.tags}
          addTagSelection={tags.addTagSelection}
          onAddTagSelectionChange={tags.setAddTagSelection}
          onAddTag={tags.handleAddDocumentTag}
          onRemoveTag={tags.handleRemoveDocumentTag}
          aiPolish={aiPolish}
        />
      ) : null}

      {activeView === 'search' ? (
        <SearchFeature
          searchQuery={search.searchQuery}
          onSearchQueryChange={search.setSearchQuery}
          searchResult={search.searchResult}
          isBusy={isBusy}
          onSearch={search.handleSearch}
          onOpenDocument={documents.handleOpenDocument}
        />
      ) : null}

      {activeView === 'query' ? (
        <QueryFeature
          question={query.question}
          onQuestionChange={query.setQuestion}
          queryResult={query.queryResult}
          isBusy={isBusy}
          onQuery={query.handleQuery}
          onOpenDocument={documents.handleOpenDocument}
        />
      ) : null}

      {activeView === 'terms' ? (
        <TermsFeature
          selectedTermId={terms.selectedTermId}
          isBusy={isBusy}
          termDraft={terms.termDraft}
          onTermDraftChange={terms.setTermDraft}
          onSaveTerm={terms.handleSaveTerm}
          onDeleteTerm={terms.handleDeleteTerm}
          onNewTerm={terms.newTerm}
        />
      ) : null}

      {activeView === 'tags' ? (
        <TagsFeature
          isBusy={isBusy}
          tags={tags.tags}
          selectedTagId={tags.selectedTagId}
          tagDocuments={tags.tagDocuments}
          newTagName={tags.newTagName}
          onNewTagNameChange={tags.setNewTagName}
          onSelectTag={tags.handleSelectTag}
          onCreateTag={tags.handleCreateTag}
          onOpenDocument={documents.handleOpenDocument}
        />
      ) : null}
    </section>
  );
}
