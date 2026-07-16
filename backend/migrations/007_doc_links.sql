-- Phase2A schema: internal links / backlinks (REQ-026).
-- Source: docs/06-db-design.md lumen_doc_links, docs/07-api-spec.md API-018.
-- wikilink 自动登记：文档保存时解析正文 [[target]]，按标题匹配当前空间文档，
-- resolved（命中）/ unresolved（未命中）。查询时再按读者权限把 resolved 折算为
-- no_access（不泄露目标标题 / 摘要）。

CREATE TABLE IF NOT EXISTS lumen_doc_links (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    source_document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    target_document_id BIGINT REFERENCES lumen_documents(id) ON DELETE SET NULL,
    target_title TEXT NOT NULL,
    link_text TEXT NOT NULL,
    link_type TEXT NOT NULL DEFAULT 'wikilink',
    status TEXT NOT NULL DEFAULT 'unresolved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_doc_links_link_type_check CHECK (link_type IN ('wikilink', 'manual')),
    CONSTRAINT lumen_doc_links_status_check CHECK (status IN ('resolved', 'unresolved', 'no_access')),
    CONSTRAINT lumen_doc_links_no_self_link_check CHECK (source_document_id IS DISTINCT FROM target_document_id)
);

CREATE INDEX IF NOT EXISTS idx_lumen_doc_links_source
    ON lumen_doc_links (space_id, source_document_id);
CREATE INDEX IF NOT EXISTS idx_lumen_doc_links_target
    ON lumen_doc_links (space_id, target_document_id);
CREATE INDEX IF NOT EXISTS idx_lumen_doc_links_target_title
    ON lumen_doc_links (space_id, target_title);
