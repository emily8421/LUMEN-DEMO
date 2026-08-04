-- Sprint-18 / REQ-027: single-document PDF export task records.
CREATE TABLE IF NOT EXISTS lumen_doc_exports (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    requested_by BIGINT NOT NULL REFERENCES lumen_users(id),
    format TEXT NOT NULL DEFAULT 'pdf',
    status TEXT NOT NULL DEFAULT 'queued',
    version_no INTEGER NOT NULL,
    artifact_path TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT lumen_doc_exports_format_pdf CHECK (format = 'pdf'),
    CONSTRAINT lumen_doc_exports_status_check CHECK (status IN ('queued', 'running', 'done', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_lumen_doc_exports_doc
    ON lumen_doc_exports (space_id, document_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lumen_doc_exports_status
    ON lumen_doc_exports (status, created_at);
