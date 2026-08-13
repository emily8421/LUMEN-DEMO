import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { clampSplitRatio, DEFAULT_SPLIT_RATIO, loadSplitRatio, persistSplitRatio } from '../../app/split-layout-store';

/**
 * 并排模式编辑/预览分隔条拖拽控制器（Slice E 从 DocumentsFeature 抽出）。
 * 维护 splitRatio / 拖拽态 / 几何缓存，并把比例持久化到 localStorage（split-layout-store）。
 */
export interface SplitDragController {
  splitRatio: number;
  splitResizing: boolean;
  splitGridRef: RefObject<HTMLDivElement>;
  handleSplitPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSplitPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleSplitPointerEnd: () => void;
  handleSplitKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  resetSplitRatio: () => void;
}

export function useSplitDragController(): SplitDragController {
  const [splitRatio, setSplitRatio] = useState<number>(() => loadSplitRatio());
  const [splitResizing, setSplitResizing] = useState(false);
  const splitRatioRef = useRef(splitRatio);
  const splitGridRef = useRef<HTMLDivElement>(null);
  const splitDragRef = useRef<{ containerLeft: number; containerWidth: number } | null>(null);

  const updateSplitRatio = (ratio: number) => {
    const clamped = clampSplitRatio(ratio);
    splitRatioRef.current = clamped;
    setSplitRatio(clamped);
  };

  const handleSplitPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const grid = splitGridRef.current;
    if (!grid) {
      return;
    }
    event.preventDefault();
    const rect = grid.getBoundingClientRect();
    splitDragRef.current = { containerLeft: rect.left, containerWidth: rect.width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSplitResizing(true);
  };

  const handleSplitPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = splitDragRef.current;
    if (!drag || drag.containerWidth <= 0) {
      return;
    }
    const minEditorPx = 200;
    const minPreviewPx = 220;
    const minRatio = Math.min(0.7, minEditorPx / drag.containerWidth);
    const maxRatio = Math.max(0.3, (drag.containerWidth - minPreviewPx) / drag.containerWidth);
    const pointerRatio = (event.clientX - drag.containerLeft) / drag.containerWidth;
    updateSplitRatio(Math.min(maxRatio, Math.max(minRatio, pointerRatio)));
  };

  const handleSplitPointerEnd = () => {
    splitDragRef.current = null;
    setSplitResizing(false);
    persistSplitRatio(splitRatioRef.current);
  };

  const handleSplitKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      updateSplitRatio(splitRatioRef.current - 0.02);
      persistSplitRatio(splitRatioRef.current);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      updateSplitRatio(splitRatioRef.current + 0.02);
      persistSplitRatio(splitRatioRef.current);
    }
  };

  const resetSplitRatio = () => {
    updateSplitRatio(DEFAULT_SPLIT_RATIO);
    persistSplitRatio(DEFAULT_SPLIT_RATIO);
  };

  return {
    splitRatio,
    splitResizing,
    splitGridRef,
    handleSplitPointerDown,
    handleSplitPointerMove,
    handleSplitPointerEnd,
    handleSplitKeyDown,
    resetSplitRatio,
  };
}
