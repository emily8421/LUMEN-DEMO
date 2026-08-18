-- Wave 3 / TC-P2-VAULT-004 跨设备 vault 挂载元数据（REQ-018 模式 B 增强，OI-109）
-- lumen_vault_mounts 新表：仅挂载点元数据（用户/设备/来源类型/授权状态），不含
-- directory handle、绝对路径、文件正文（这些留客户端 IndexedDB，RG-009 隐私天花板）。
-- 契约：docs/06-db-design.md §2（字段已细化）+ docs/07-api-spec.md API-059；
-- 编号 015 由 accounts-auth.md §13 预留（014 已被 Sprint-26 lumen_sessions 占用）。

CREATE TABLE IF NOT EXISTS lumen_vault_mounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES lumen_users(id) ON DELETE CASCADE,
  -- 设备标识：客户端自生 device token（localStorage UUID，06 §2 给定两选项中取 token，
  -- 浏览器 UA 在同配置设备间会重复，token 不会）
  device_id VARCHAR(128) NOT NULL,
  mount_name VARCHAR(255) NOT NULL,
  source_type VARCHAR(32) NOT NULL,               -- obsidian | markdown_folder
  auth_status VARCHAR(20) NOT NULL DEFAULT 'granted',  -- granted | revoked（软撤销，仿 lumen_sessions.revoked_at）
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 重复挂载 upsert 锚点（06 §2 未明写 UNIQUE；防同用户同设备同名重复刷行，
-- POST 时 ON CONFLICT 刷新 last_synced_at / auth_status）
CREATE UNIQUE INDEX IF NOT EXISTS idx_lumen_vault_mounts_unique
  ON lumen_vault_mounts(user_id, device_id, mount_name);

-- 跨设备列表查询（设备 B 登录拉取该用户全部设备的挂载清单）
CREATE INDEX IF NOT EXISTS idx_lumen_vault_mounts_user
  ON lumen_vault_mounts(user_id);
