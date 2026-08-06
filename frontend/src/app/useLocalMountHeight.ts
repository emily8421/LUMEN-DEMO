import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  clampLocalMountHeight,
  DEFAULT_LOCAL_MOUNT_HEIGHT,
  loadLocalMountHeight,
  persistLocalMountHeight,
} from './local-mount-height-store';

/**
 * 本地挂载分区上下拖拽调高（仿 usePaneWidth 垂直版）：
 * 拖下变高 / 拖上变矮，clamp 后持久化 localStorage；↑/↓ 键盘 20px 步进；双击复位默认。
 */
export function useLocalMountHeight() {
  const [height, setHeight] = useState<number>(() => loadLocalMountHeight());
  const [resizing, setResizing] = useState(false);
  const heightRef = useRef(height);
  const dragRef = useRef<{ clientY: number; height: number } | null>(null);

  const updateHeight = useCallback((next: number) => {
    const clamped = clampLocalMountHeight(next);
    heightRef.current = clamped;
    setHeight(clamped);
  }, []);

  const persist = useCallback(() => {
    persistLocalMountHeight(heightRef.current);
  }, []);

  const startResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { clientY: event.clientY, height: heightRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }, []);

  const moveResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const delta = event.clientY - drag.clientY; // 拖下 delta>0 → 高度增加
    updateHeight(drag.height + delta);
  }, [updateHeight]);

  const endResize = useCallback(() => {
    dragRef.current = null;
    setResizing(false);
    persist();
  }, [persist]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        updateHeight(heightRef.current + 20);
        persist();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        updateHeight(heightRef.current - 20);
        persist();
      }
    },
    [updateHeight, persist]
  );

  const resetHeight = useCallback(() => {
    updateHeight(DEFAULT_LOCAL_MOUNT_HEIGHT);
    persist();
  }, [updateHeight, persist]);

  return { height, resizing, startResize, moveResize, endResize, handleKeyDown, resetHeight };
}
