-- Sprint-8 schema: import jobs (REQ-009/010) and space-level terms (REQ-036).
-- Source: docs/06-db-design.md (lumen_imports / lumen_terms).
-- lumen_imports merges 06 design with runtime fields (created_by / chunk_count / error)
-- required by the import state machine (create → complete / fail); see
-- docs/research/2026-07-09-pgvector-impact-assessment.md §2/§7.8.

CREATE TABLE IF NOT EXISTS lumen_imports (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    source_filename VARCHAR NOT NULL,
    mime VARCHAR,                                  -- docx / pdf / image / txt / md (target; nullable until real multi-format import)
    status VARCHAR NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'done', 'failed')),
    parsed_doc_id BIGINT REFERENCES lumen_documents(id),
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    chunk_count INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lumen_imports_space
    ON lumen_imports (space_id);

CREATE TABLE IF NOT EXISTS lumen_terms (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT REFERENCES lumen_spaces(id) ON DELETE CASCADE,   -- nullable: global term
    term VARCHAR NOT NULL,
    definition TEXT NOT NULL,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner_id BIGINT NOT NULL REFERENCES lumen_users(id),
    status VARCHAR NOT NULL DEFAULT 'pending'
        CHECK (status IN ('confirmed', 'pending')),
    source_document_id BIGINT REFERENCES lumen_documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Global terms (space_id NULL) must also be unique; PG15+ NULLS NOT DISTINCT.
    UNIQUE NULLS NOT DISTINCT (space_id, term)
);

CREATE INDEX IF NOT EXISTS idx_lumen_terms_space
    ON lumen_terms (space_id);
