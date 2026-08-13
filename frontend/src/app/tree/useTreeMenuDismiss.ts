import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * 树右键菜单关闭逻辑（共享）：点击菜单外部 / 按 Esc / 窗口 resize / scroll 时关闭。
 * FolderTree（FolderNode / DocumentRow）与 TermCategoryTree（CategoryNode）此前各自
 * 复制了一份逐字相同的 useEffect，E4 Slice D 抽为共享 hook（消除 ~3×28 行重复）。
 *
 * @param isMenuOpen 当前菜单是否打开（关闭时跳过监听）
 * @param onCloseMenu 关闭回调
 * @param menuRef 菜单弹层 DOM ref（点击外部判断依据）
 */
export function useTreeMenuDismiss(
  isMenuOpen: boolean,
  onCloseMenu: () => void,
  menuRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onCloseMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMenu();
      }
    }

    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onCloseMenu);
    window.addEventListener('scroll', onCloseMenu, true);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onCloseMenu);
      window.removeEventListener('scroll', onCloseMenu, true);
    };
  }, [isMenuOpen, menuRef, onCloseMenu]);
}
