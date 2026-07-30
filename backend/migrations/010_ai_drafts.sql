-- Phase2B schema: AI polish / writing-citation drafts (REQ-014).
-- Source: docs/06-db-design.md lumen_ai_drafts, docs/07-api-spec.md API-028, docs/09-verification.md TC-P2-AI-001, docs/design/ai-polish.md.
-- AI 润色 / 写作引用草稿：polish（改写选区）/ citation（带来源引用）。
-- 数据外发护栏（RG-008，风险已接受 2026-07-30）：只存 input_excerpt_hash（选区哈希）+ prompt_summary（摘要），
--   不存完整敏感原文 / 完整 prompt；不存 API key；越权 chunk 不进入 prompt（service 层过滤）。
-- mode: polish / citation。
-- status: generated（已生成草稿）/ applied（已写回正文 + 版本）/ discarded（已丢弃）/ failed（生成失败 / 降级未落 generated）。
-- cited_chunk_ids：citation 模式召回的可见 chunk id 数组（JSONB），仅来自当前用户可见 chunk。

CREATE TABLE IF NOT EXISTS lumen_ai_drafts (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES lumen_documents(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES lumen_users(id),
    mode TEXT NOT NULL,
    input_excerpt_hash TEXT,
    prompt_summary TEXT NOT NULL DEFAULT '',
    output_md TEXT NOT NULL DEFAULT '',
    cited_chunk_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'generated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_ai_drafts_mode_check CHECK (mode IN ('polish', 'citation')),
    CONSTRAINT lumen_ai_drafts_status_check CHECK (status IN ('generated', 'applied', 'discarded', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_lumen_ai_drafts_doc
    ON lumen_ai_drafts (space_id, document_id, created_at);
