-- Phase2A schema: quick entry index items (REQ-025).
-- Source: docs/06-db-design.md lumen_quick_entries, docs/07-api-spec.md API-017, docs/09-verification.md TC-P2-QUICK-001.
-- 快速录入轻量条目：30s 录标题 / 来源 / 摘要；无原文也能沉淀。
-- status: draft（保留草稿）/ converted（已转新文档或追加到已有文档）/ discarded（已丢弃）。
-- draft 默认仅 owner 可见；转文档后继承目标文档权限（由 service 层 + lumen_documents.permission 过滤）。
-- target_document_id（append 目标）与 created_document_id（create_document 新建）互斥，均允许 NULL。

CREATE TABLE IF NOT EXISTS lumen_quick_entries (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES lumen_users(id),
    title TEXT NOT NULL,
    content_md TEXT NOT NULL DEFAULT '',
    source TEXT,
    target_document_id BIGINT REFERENCES lumen_documents(id) ON DELETE SET NULL,
    created_document_id BIGINT REFERENCES lumen_documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_quick_entries_status_check CHECK (status IN ('draft', 'converted', 'discarded')),
    CONSTRAINT lumen_quick_entries_title_not_empty_check CHECK (btrim(title) <> '')
);

CREATE INDEX IF NOT EXISTS idx_lumen_quick_entries_owner_status
    ON lumen_quick_entries (space_id, owner_id, status, updated_at);
