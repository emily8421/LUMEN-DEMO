-- Sprint-1 schema: spaces, members, users, and document permission foundation.
-- Source: docs/06-db-design.md and docs/design/permissions.md.

CREATE TABLE IF NOT EXISTS lumen_users (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lumen_spaces (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lumen_space_members (
    user_id BIGINT NOT NULL REFERENCES lumen_users(id) ON DELETE CASCADE,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'member')),
    PRIMARY KEY (user_id, space_id)
);

CREATE TABLE IF NOT EXISTS lumen_documents (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    content_md TEXT NOT NULL DEFAULT '',
    owner_id BIGINT NOT NULL REFERENCES lumen_users(id),
    permission VARCHAR NOT NULL CHECK (permission IN ('private', 'team', 'external')),
    type VARCHAR NOT NULL DEFAULT 'markdown',
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lumen_documents_space_permission
    ON lumen_documents (space_id, permission);

CREATE INDEX IF NOT EXISTS idx_lumen_documents_space_owner
    ON lumen_documents (space_id, owner_id);
