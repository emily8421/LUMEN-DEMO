import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { loadSectionHeight, persistSectionHeight } from './pane-section-height-store';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 760;

function clamp(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, value));
}

/**
 * 左栏上下分区拖拽调高（仿 useLocalMountHeight 垂直版，storageKey 参数化）：
 * 分隔条跟随光标：拖下 / ↓ → 分隔条下移 → 下分区变矮；拖上 / ↑ → 分隔条上移 → 下分区变高。
 * clamp 后持久化 localStorage；↑/↓ 键盘 20px 步进；双击复位默认。
 */
export function usePaneSectionHeight(storageKey: string, fallback: number) {
  const [height, setHeight] = useState<number>(() => loadSectionHeight(storageKey, fallback));
  const [resizing, setResizing] = useState(false);
  const heightRef = useRef(height);
  const dragRef = useRef<{ clientY: number; height: number } | null>(null);

  const updateHeight = useCallback(
    (next: number) => {
      const clamped = clamp(next, fallback);
      heightRef.current = clamped;
      setHeight(clamped);
    },
    [fallback],
  );

  const persist = useCallback(() => {
    persistSectionHeight(storageKey, heightRef.current);
  }, [storageKey]);

  const startResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { clientY: event.clientY, height: heightRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }, []);

  const moveResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const delta = event.clientY - drag.clientY; // 拖下 delta>0 → 分隔条下移 → 下分区变矮
      updateHeight(drag.height - delta);
    },
    [updateHeight],
  );

  const endResize = useCallback(() => {
    dragRef.current = null;
    setResizing(false);
    persist();
  }, [persist]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        updateHeight(heightRef.current - 20);
        persist();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        updateHeight(heightRef.current + 20);
        persist();
      }
    },
    [updateHeight, persist],
  );

  const resetHeight = useCallback(() => {
    updateHeight(fallback);
    persist();
  }, [fallback, persist, updateHeight]);

  return { height, resizing, startResize, moveResize, endResize, handleKeyDown, resetHeight };
}
