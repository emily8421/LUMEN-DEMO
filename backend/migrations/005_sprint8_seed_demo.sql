-- Sprint-8 demo seed: mirrors DemoRepository.__init__ seed (task-008 T5).
-- Source: backend/service/demo_repository.py (3 users / 2 spaces / 4 members /
-- 2 documents / 2 versions / 1 global term). Seed docs have no chunks, matching
-- the in-memory repository (chunks are created on demand via sync_document_chunks).
--
-- Runs via db.init_db after migrations 001-004 (schema). Idempotent:
--   * ON CONFLICT DO NOTHING — re-running never duplicates rows.
--   * setval — runtime BIGSERIAL inserts (PgRepository.create_document, etc.)
--     continue past the fixed demo IDs instead of colliding with them.
-- Explicit IDs match the demo contract (alice=1, nova-internal=10,
-- brightlite-team=20, ...) relied on by the demo token / login flow and by
-- tests/backend/test_api_routes.py (current_space_id=10).

INSERT INTO lumen_users (id, external_id, name) VALUES
    (1, 'alice', 'Alice'),
    (2, 'kira', 'Kira'),
    (3, 'brightlite-member', 'BrightLite Member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lumen_spaces (id, code, name) VALUES
    (10, 'nova-internal', 'Nova Internal'),
    (20, 'brightlite-team', 'BrightLite Team')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lumen_space_members (user_id, space_id, role) VALUES
    (1, 10, 'admin'),
    (1, 20, 'admin'),
    (2, 10, 'member'),
    (3, 20, 'member')
ON CONFLICT (user_id, space_id) DO NOTHING;

INSERT INTO lumen_documents (id, space_id, title, content_md, owner_id, permission, type, current_version) VALUES
    (100, 10, 'Nova Sprint Notes', '# Nova

Initial sprint note.', 1, 'team', 'markdown', 1),
    (200, 20, 'BrightLite Private Brief', '# BrightLite

Private context.', 3, 'private', 'markdown', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lumen_document_versions (id, document_id, version_no, content_md, editor_id) VALUES
    (1, 100, 1, '# Nova

Initial sprint note.', 1),
    (2, 200, 1, '# BrightLite

Private context.', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lumen_terms (id, space_id, term, definition, aliases, owner_id, status) VALUES
    (1, NULL, '触发延迟', '从触发条件满足到指令发出。', '["开关延迟"]'::jsonb, 1, 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences so runtime inserts never collide with the fixed demo IDs.
-- GREATEST(..., 1) guards the empty-table case; setval defaults is_called=true
-- so the next nextval returns MAX(id)+1.
SELECT setval(pg_get_serial_sequence('lumen_users', 'id'),            GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_users), 1));
SELECT setval(pg_get_serial_sequence('lumen_spaces', 'id'),           GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_spaces), 1));
SELECT setval(pg_get_serial_sequence('lumen_documents', 'id'),        GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_documents), 1));
SELECT setval(pg_get_serial_sequence('lumen_document_versions', 'id'),GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_document_versions), 1));
SELECT setval(pg_get_serial_sequence('lumen_chunks', 'id'),           GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_chunks), 1));
SELECT setval(pg_get_serial_sequence('lumen_imports', 'id'),          GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_imports), 1));
SELECT setval(pg_get_serial_sequence('lumen_terms', 'id'),            GREATEST((SELECT COALESCE(MAX(id), 1) FROM lumen_terms), 1));
