-- Phase2B schema: document folder tree (REQ-039, folder-tree 第三 slice 候选).
-- Source: docs/06-db-design.md lumen_folders + lumen_documents.folder_id,
--         docs/07-api-spec.md API-034..037, docs/09-verification.md TC-P2-FOLDER-001,
--         docs/design/folder-tree.md (FT-C-001..013 已确认 2026-08-02).
-- 嵌套文件夹（邻接表 parent_id 自引用）；folder 不独立设权限（FT-C-003），
-- 文档可见性仍看 lumen_documents.permission。
-- order：folder 手动排序；FT-C-009 文档首版不加 order，folder 内按 title 排序。
-- FT-C-010：folder 只 active 无 archived；删 folder 必须先移空（service 层删非空→4090）。
-- 现有文档 folder_id=null（空间根，FT-C-006 向后兼容）。
-- 注意：PG 的 UNIQUE 约束对 parent_id=NULL 不去重（NULL != NULL），根层重名
-- 由 service 层 find_folder_by_name 兜底；UNIQUE 作为 parent_id 非空时的并发兜底。

CREATE TABLE IF NOT EXISTS lumen_folders (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES lumen_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_folders_unique_name UNIQUE (space_id, parent_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lumen_folders_parent
    ON lumen_folders (space_id, parent_id);

-- lumen_documents 加 folder_id（空=空间根）。ON DELETE SET NULL：folder 被删时
-- 其下文档回到空间根（service 层已禁止删非空，此处为兜底安全）。
ALTER TABLE lumen_documents ADD COLUMN IF NOT EXISTS folder_id BIGINT REFERENCES lumen_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lumen_documents_folder
    ON lumen_documents (folder_id);
