-- Sprint-28 角色分层 + 用户管理 + 团队空间加入（REQ-045/046/047，task-040）
-- lumen_users 全局角色 role（C-ROLE-001：单列 admin/member，默认 member + CHECK）+ seed 对齐（C-ROLE-004）；
-- lumen_space_members.created_at 支撑 API-046 成员列表 joined_at 契约（accounts-auth §18.4）。
-- 契约：docs/design/accounts-auth.md §18；正式回写 docs/06 随编码 Sprint-28。

ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_lumen_users_role') THEN
        ALTER TABLE lumen_users ADD CONSTRAINT chk_lumen_users_role CHECK (role IN ('admin', 'member'));
    END IF;
END
$$;

-- seed 对齐：alice=admin；kira / brightlite-member 保持默认 member
UPDATE lumen_users SET role = 'admin' WHERE external_id = 'alice';

-- API-046 成员列表 joined_at：成员加入时间（不删除用户 / 不迁移文档）
ALTER TABLE lumen_space_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
