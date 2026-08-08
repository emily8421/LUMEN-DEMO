-- Sprint-30 / 维护态批5 忘记密码（REQ-051，task / Sprint-30）
-- lumen_users 加 reset token 3 列：一次性、TTL 30min、DB 只存 SHA-256 摘要（明文仅进后端日志，demo 降级无 SMTP）。
-- 契约：docs/design/accounts-auth.md §19；正式回写 docs/06 随编码 Sprint-30。

ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64);   -- sha256_hex(token)；NULL = 无进行中重置
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;   -- 签发时刻 +30min
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS reset_used_at TIMESTAMPTZ;      -- NULL = 未使用；重置成功 / 作废置位，留审计

-- 稀疏索引：仅索引「仍有效」的 reset token（未使用），支撑 find_user_by_reset_token_hash 快速查找。
-- 不加 UNIQUE：同一用户可多次 request（后者覆盖前者），已用 token 不删行、只置 used_at 保留审计。
CREATE INDEX IF NOT EXISTS idx_lumen_users_reset_token
  ON lumen_users(reset_token_hash)
  WHERE reset_used_at IS NULL AND reset_token_hash IS NOT NULL;
