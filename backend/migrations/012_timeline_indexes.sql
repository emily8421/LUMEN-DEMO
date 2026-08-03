-- Phase2B schema support: topic timeline query indexes (REQ-013a / REQ-024).
-- Candidate A does not create a timeline event table; API-033 aggregates
-- documents, tags, links and chunks at read time.

CREATE INDEX IF NOT EXISTS idx_lumen_documents_space_created_at
    ON lumen_documents (space_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lumen_documents_space_updated_at
    ON lumen_documents (space_id, updated_at);
