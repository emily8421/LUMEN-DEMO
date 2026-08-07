-- 术语管理增强（REQ-036 领域树，migration 017）。
-- Source: docs/research/2026-08-07-term-domain-tree-analysis.md（AI 评估 · 待人工确认，
--         TM-C-001..007 用户 2026-08-07 按推荐确认后开始步 A 编码）。
-- 领域树（lumen_term_categories）：嵌套邻接表 parent_id 自引用，仿 lumen_folders（011）。
--   - 空间隔离：每个空间一棵树；领域树不独立设权限（复用 folder 口径）。
--   - 重名：UNIQUE(space_id, parent_id, name)；根层 parent_id=NULL 由 PG UNIQUE 不去重
--     （NULL != NULL），由 service 层 find_term_category_by_name 兜底（同 folder 011 注释）。
--   - order_idx：同层手动排序（folders 表用 "order" 保留字，这里用 order_idx 避开）。
--   - 删除非空：service 层禁止（有子领域或术语挂在领域下→4090），无 archived 状态。
-- lumen_terms 扩字段（全部可空、向后兼容）：
--   - category_id：术语挂在哪个领域叶子（可空=未分类）。
--   - category：内容分类（14 类候选，自由输入，非枚举）。
--   - source：术语来源（行业标准 / 公司内部 / 外部文献 / 项目背景）。

CREATE TABLE IF NOT EXISTS lumen_term_categories (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES lumen_spaces(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES lumen_term_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_idx INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES lumen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lumen_term_categories_unique_name UNIQUE (space_id, parent_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lumen_term_categories_parent
    ON lumen_term_categories (space_id, parent_id);

ALTER TABLE lumen_terms ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES lumen_term_categories(id) ON DELETE SET NULL;
ALTER TABLE lumen_terms ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE lumen_terms ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_lumen_terms_category
    ON lumen_terms (category_id);
