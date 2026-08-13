import type { CSSProperties, RefObject } from 'react';

interface MenuPos {
  x: number;
  y: number;
}

/**
 * 本地挂载目录右键菜单（Slice E 从 LocalMountTreeView 抽出，纯展示）。
 * 状态（dirMenuPath/dirMenuPos/dirMenuRef）由 TreeView 持有，菜单关闭回调由各 item 触发。
 */
interface DirContextMenuProps {
  menuRef: RefObject<HTMLDivElement>;
  name: string;
  pos: MenuPos;
  importDisabled: boolean;
  onNewFile: () => void;
  onImportDir: () => void;
  onImportAll: () => void;
}

export function DirContextMenu({
  menuRef,
  name,
  pos,
  importDisabled,
  onNewFile,
  onImportDir,
  onImportAll,
}: DirContextMenuProps) {
  return (
    <div
      ref={menuRef}
      className="local-mount-menu"
      style={{ left: pos.x, top: pos.y } as CSSProperties}
      role="menu"
      aria-label={`${name} 操作`}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" role="menuitem" onClick={onNewFile}>
        <span aria-hidden="true">＋</span> 新建文件
      </button>
      <button type="button" role="menuitem" onClick={onImportDir} disabled={importDisabled}>
        <span aria-hidden="true">⤓</span> 导入此文件夹
      </button>
      <button type="button" role="menuitem" onClick={onImportAll} disabled={importDisabled}>
        <span aria-hidden="true">⤓</span> 导入全部挂载
      </button>
    </div>
  );
}

/**
 * 本地挂载文件右键菜单（Slice E 从 LocalMountTreeView 抽出，纯展示）。
 * 状态（menuPath/menuPos/menuRef）由 TreeView 持有。
 */
interface FileContextMenuProps {
  menuRef: RefObject<HTMLDivElement>;
  name: string;
  pos: MenuPos;
  importDisabled: boolean;
  onImportFile: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileContextMenu({
  menuRef,
  name,
  pos,
  importDisabled,
  onImportFile,
  onRename,
  onDelete,
}: FileContextMenuProps) {
  return (
    <div
      ref={menuRef}
      className="local-mount-menu"
      style={{ left: pos.x, top: pos.y } as CSSProperties}
      role="menu"
      aria-label={`${name} 操作`}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" role="menuitem" onClick={onImportFile} disabled={importDisabled}>
        <span aria-hidden="true">⤓</span> 导入此篇
      </button>
      <button type="button" role="menuitem" onClick={onRename}>
        <span aria-hidden="true">✎</span> 重命名
      </button>
      <button type="button" role="menuitem" className="danger" onClick={onDelete}>
        <span aria-hidden="true">×</span> 删除
      </button>
    </div>
  );
}
