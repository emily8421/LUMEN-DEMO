import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { clampPaneWidth, DEFAULT_PANE_WIDTHS, loadPaneWidths, persistPaneWidths } from './pane-width-store';
import type { PaneSide } from './pane-width-store';

/**
 * 侧栏宽度拖拽（仿并排分隔条）：left=拖右变宽 / right=拖左变宽，
 * 宽度 clamp 后持久化 localStorage；双击复位默认。
 */
export function usePaneWidth(side: PaneSide) {
  const [width, setWidth] = useState<number>(() => loadPaneWidths()[side]);
  const [resizing, setResizing] = useState(false);
  const widthRef = useRef(width);
  const dragRef = useRef<{ clientX: number; width: number } | null>(null);

  const updateWidth = useCallback((next: number) => {
    const clamped = clampPaneWidth(side, next);
    widthRef.current = clamped;
    setWidth(clamped);
  }, [side]);

  const persist = useCallback(() => {
    persistPaneWidths({ ...loadPaneWidths(), [side]: widthRef.current });
  }, [side]);

  const startResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { clientX: event.clientX, width: widthRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }, []);

  const moveResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const delta = event.clientX - drag.clientX;
    updateWidth(side === 'left' ? drag.width + delta : drag.width - delta);
  }, [side, updateWidth]);

  const endResize = useCallback(() => {
    dragRef.current = null;
    setResizing(false);
    persist();
  }, [persist]);

  const adjustBy = useCallback((delta: number) => {
    updateWidth(widthRef.current + delta);
    persist();
  }, [updateWidth, persist]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      adjustBy(side === 'left' ? -10 : 10);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      adjustBy(side === 'left' ? 10 : -10);
    }
  }, [side, adjustBy]);

  const resetWidth = useCallback(() => {
    updateWidth(DEFAULT_PANE_WIDTHS[side]);
    persist();
  }, [side, updateWidth, persist]);

  return { width, resizing, startResize, moveResize, endResize, handleKeyDown, resetWidth };
}
