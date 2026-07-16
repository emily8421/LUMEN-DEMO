-- Phase2A schema: flat tags + document-tag links (REQ-012).
-- Source: docs/06-db-design.md lumen_tags / lumen_tag_links, docs/07-api-spec.md API-014/027/031/032.
-- 扁平标签（无层级）；空间隔离；UNIQUE(space_id, normalized_name) 防同空间重名。
-- 最小版仅写入 link_source='manual'（quick_entry/import/ai_suggested 由后续 slice 写入）。
-- 文档可见性仍由 lumen_documents.permission + space_id 在 service 层过滤（不在本表）。

CREATE TABLE IF NOT EXISTS lumen_tags (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    color TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_tags_status_check CHECK (status IN ('active', 'archived')),
    CONSTRAINT lumen_tags_name_not_empty_check CHECK (btrim(name) <> ''),
    CONSTRAINT lumen_tags_unique_name UNIQUE (space_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_lumen_tags_space_status
    ON lumen_tags (space_id, status);

CREATE TABLE IF NOT EXISTS lumen_tag_links (
    tag_id BIGINT NOT NULL REFERENCES lumen_tags(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    link_source TEXT NOT NULL DEFAULT 'manual',
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_tag_links_pk PRIMARY KEY (tag_id, document_id),
    CONSTRAINT lumen_tag_links_link_source_check CHECK (link_source IN ('manual', 'quick_entry', 'import', 'ai_suggested'))
);

CREATE INDEX IF NOT EXISTS idx_lumen_tag_links_document
    ON lumen_tag_links (document_id);
