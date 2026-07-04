-- Sprint-2 schema: document version history.
-- Source: docs/06-db-design.md and docs/08-dev-plan.md Sprint-2.

CREATE TABLE IF NOT EXISTS lumen_document_versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    content_md TEXT NOT NULL,
    editor_id BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_lumen_document_versions_document
    ON lumen_document_versions (document_id, version_no);
