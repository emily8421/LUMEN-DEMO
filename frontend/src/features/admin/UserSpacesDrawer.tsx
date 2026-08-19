import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminUserSpaceAvailable, AdminUserSpaceView, SpaceMemberRole } from '../../api';
import { useModalFocus } from '../shared/useModalFocus';

type UserSpacesDrawerProps = {
  open: boolean;
  targetName: string;
  joined: AdminUserSpaceView[];
  available: AdminUserSpaceAvailable[];
  busy: boolean;
  notice: string;
  onChangeRole: (spaceId: number, role: SpaceMemberRole) => void;
  onRemove: (spaceId: number) => void;
  onAdd: (spaceId: number, role: SpaceMemberRole) => void;
  onClose: () => void;
};

const ROLE_OPTIONS: SpaceMemberRole[] = ['member', 'admin'];
const ROLE_LABEL: Record<SpaceMemberRole, string> = { admin: '空间管理员', member: '成员' };

/**
 * 用户可访问空间抽屉（REQ-050，维护态批5）：admin 在用户管理页点用户行打开。
 * 已加入空间列表（就地改角色 / 移除）+ 底部「添加到空间」——即时操作，复用 space 域成员 API。
 */
export function UserSpacesDrawer({
  open,
  targetName,
  joined,
  available,
  busy,
  notice,
  onChangeRole,
  onRemove,
  onAdd,
  onClose,
}: UserSpacesDrawerProps) {
  const [addSpaceId, setAddSpaceId] = useState<number | null>(null);
  const [addRole, setAddRole] = useState<SpaceMemberRole>('member');
  const drawerRef = useRef<HTMLElement>(null);
  const { handleKeyDown: handleFocusKeyDown } = useModalFocus({ isOpen: open, containerRef: drawerRef });

  if (!open) {
    return null;
  }

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addSpaceId === null) {
      return;
    }
    onAdd(addSpaceId, addRole);
    setAddSpaceId(null);
    setAddRole('member');
  };

  return (
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <aside
        ref={drawerRef}
        className="user-spaces-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${targetName} 可访问空间`}
        onKeyDown={handleFocusKeyDown}
      >
        <div className="drawer-header workspace-toolbar">
          <div className="view-title">
            <h2>可访问空间</h2>
            {targetName ? <span className="view-subtitle">{targetName}</span> : null}
          </div>
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
            关闭
          </button>
        </div>

        <div className="drawer-body">
          {notice ? <p className="drawer-notice">{notice}</p> : null}

          {joined.length === 0 ? (
            <div className="empty-state">
              <p>该用户尚未加入任何空间。</p>
            </div>
          ) : (
            <table className="members-table">
              <thead>
                <tr>
                  <th>空间</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {joined.map((space) => (
                  <tr key={space.space_id}>
                    <td>
                      <strong>{space.space_name}</strong>
                      <small>{space.space_code}</small>
                    </td>
                    <td>
                      <select
                        value={space.role}
                        disabled={busy}
                        onChange={(event) => onChangeRole(space.space_id, event.target.value as SpaceMemberRole)}
                        aria-label={`${space.space_name} 空间角色`}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary danger"
                        disabled={busy}
                        onClick={() => onRemove(space.space_id)}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {available.length > 0 ? (
            <form className="member-add-form" onSubmit={handleAdd}>
              <select
                value={addSpaceId ?? ''}
                disabled={busy}
                onChange={(event) => setAddSpaceId(event.target.value === '' ? null : Number(event.target.value))}
                aria-label="选择空间"
              >
                <option value="">选择空间…</option>
                {available.map((space) => (
                  <option key={space.space_id} value={space.space_id}>
                    {space.space_name}
                  </option>
                ))}
              </select>
              <select
                value={addRole}
                disabled={busy}
                onChange={(event) => setAddRole(event.target.value as SpaceMemberRole)}
                aria-label="空间角色"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
              <button type="submit" className="secondary" disabled={busy || addSpaceId === null}>
                添加到空间
              </button>
            </form>
          ) : (
            <p className="empty-state">已加入全部空间，无可添加空间。</p>
          )}
        </div>
      </aside>
    </div>
  );
}
