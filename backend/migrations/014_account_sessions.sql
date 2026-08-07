-- Sprint-26 / Phase2D 账号体系基础（REQ-040/041/042，task-038）
-- lumen_users 扩列 + lumen_sessions 新表（不透明 token session，token 只存 SHA-256 hash）。
-- 契约：docs/design/accounts-auth.md §8；正式回写 docs/06 随编码 Sprint-26。

-- 8.1 lumen_users 扩列
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);   -- bcrypt $2b$12$...；seed 用户已设 demo 密码（见 8.3）
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);           -- 登录标识（C-AUTH-002：email，小写归一化由应用层保证）
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';  -- active / disabled / pending
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0;
ALTER TABLE lumen_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lumen_users_email ON lumen_users(email) WHERE email IS NOT NULL;

-- 8.2 lumen_sessions 新表
CREATE TABLE IF NOT EXISTS lumen_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES lumen_users(id) ON DELETE CASCADE,
  current_space_id BIGINT REFERENCES lumen_spaces(id) ON DELETE SET NULL,  -- 实现偏差：设计 §5 载荷需承载 current_space_id，§8.2 表缺列，编码补入
  token_hash VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256(token) hex；明文 token 仅返回客户端一次
  expires_at TIMESTAMPTZ NOT NULL,          -- TTL 8h（沿用现有），滑动续期
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,                   -- NULL = 活跃；撤销 = 置位保留审计行
  last_used_at TIMESTAMPTZ,
  client_ua TEXT,                           -- 审计 / 多设备识别
  client_ip VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_lumen_sessions_user ON lumen_sessions(user_id) WHERE revoked_at IS NULL;


-- 8.3 seed 用户设 demo 密码 + email（PG 强制真实认证：seed 用户也需凭证登录；
-- 密码 demo-pass-1234；demo 内存模式仍保留无密码快捷登录路径）。
-- 实现偏差：accounts-auth §7 原设计 seed password_hash=NULL（demo-only），
-- 但 PG 集成测试/真实路径需凭证，故统一设 demo 密码，NULL 语义仅保留在内存仓储。
UPDATE lumen_users SET password_hash = '$2b$12$l.fW5bd9.WFvI9MXi03n6eaUsl.eivhgjmNYBi8hSbDlAEF5C4wPS', email = 'alice@example.com' WHERE external_id = 'alice' AND password_hash IS NULL;
UPDATE lumen_users SET password_hash = '$2b$12$rbqB5LJpBnlALPIRaqde1eVlYC6RZnO4YJbw4vMO3YWNbSJFcpdT.', email = 'kira@example.com' WHERE external_id = 'kira' AND password_hash IS NULL;
UPDATE lumen_users SET password_hash = '$2b$12$p0UrDGWULBx3KlkqjJw87.jT9XnQgsNRtov9J9W6wFXBkvF8hHs6O', email = 'brightlite-member@example.com' WHERE external_id = 'brightlite-member' AND password_hash IS NULL;
