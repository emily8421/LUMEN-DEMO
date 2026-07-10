-- Optional Chinese full-text search config for REQ-007.
--
-- Current local image (pgvector/pgvector:pg16) does not ship zhparser. This
-- migration therefore keeps zhparser optional: when the extension is available,
-- create a Chinese parser config; otherwise keep using PostgreSQL's simple
-- config so DB init remains portable.

CREATE OR REPLACE FUNCTION lumen_search_regconfig() RETURNS regconfig AS $$
    SELECT COALESCE(
        (SELECT oid::regconfig FROM pg_ts_config WHERE cfgname = 'lumen_zh' LIMIT 1),
        'pg_catalog.simple'::regconfig
    );
$$ LANGUAGE sql STABLE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'zhparser') THEN
        CREATE EXTENSION IF NOT EXISTS zhparser;

        IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'lumen_zh') THEN
            CREATE TEXT SEARCH CONFIGURATION lumen_zh (PARSER = zhparser);
        END IF;

        ALTER TEXT SEARCH CONFIGURATION lumen_zh DROP MAPPING IF EXISTS FOR n,v,a,i,e,l;
        ALTER TEXT SEARCH CONFIGURATION lumen_zh ADD MAPPING FOR n,v,a,i,e,l WITH simple;

        CREATE OR REPLACE FUNCTION lumen_chunks_ts_vector_update() RETURNS trigger AS $fn$
        BEGIN
            NEW.ts_vector := to_tsvector(lumen_search_regconfig(), NEW.text);
            RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
    ELSE
        CREATE OR REPLACE FUNCTION lumen_chunks_ts_vector_update() RETURNS trigger AS $fn$
        BEGIN
            NEW.ts_vector := to_tsvector(lumen_search_regconfig(), NEW.text);
            RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
    END IF;
END;
$$;

-- Backfill existing chunks after switching from literal 'simple' to the runtime
-- config. This is safe to repeat and keeps old imported/created docs searchable.
UPDATE lumen_chunks
SET ts_vector = to_tsvector(lumen_search_regconfig(), text);
