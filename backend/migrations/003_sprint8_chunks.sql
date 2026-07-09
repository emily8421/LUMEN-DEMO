-- Sprint-8 schema: document chunks with pgvector embedding + full-text vector.
-- REQ-007 (full-text search) / REQ-008 (RAG vector recall).
-- Source: docs/06-db-design.md (lumen_chunks); docs/05-tech-spec.md §2 (hnsw m=16 / ef_construction=64).

-- pgvector extension (idempotent; T1 init_db also creates it).
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS lumen_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    ordinal INTEGER NOT NULL,
    text TEXT NOT NULL,
    embedding vector(512),
    ts_vector tsvector
);

-- Full-text vector auto-maintenance. Config 'simple' does not tokenize CJK;
-- Chinese tokenization (e.g. zhparser) is deferred to T6 — vector recall is
-- the primary retrieval path, full-text is the secondary fallback.
CREATE OR REPLACE FUNCTION lumen_chunks_ts_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.ts_vector := to_tsvector('simple', NEW.text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lumen_chunks_ts_vector ON lumen_chunks;
CREATE TRIGGER trg_lumen_chunks_ts_vector
    BEFORE INSERT OR UPDATE OF text ON lumen_chunks
    FOR EACH ROW EXECUTE FUNCTION lumen_chunks_ts_vector_update();

-- GIN index for full-text recall (secondary path).
CREATE INDEX IF NOT EXISTS idx_lumen_chunks_ts_vector
    ON lumen_chunks USING GIN (ts_vector);

-- HNSW vector index (cosine; bge-small-zh 512-dim, params per 05 §2).
CREATE INDEX IF NOT EXISTS idx_lumen_chunks_embedding_hnsw
    ON lumen_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
