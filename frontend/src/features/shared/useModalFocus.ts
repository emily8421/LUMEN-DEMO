import { useEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

type UseModalFocusOptions = {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  );
}

/** Keeps a blocking dialog's keyboard focus inside it and restores its trigger on close. */
export function useModalFocus({ isOpen, containerRef, initialFocusRef }: UseModalFocusOptions) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const initialFocus = initialFocusRef?.current ?? getFocusableElements(container)[0];
      initialFocus?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [containerRef, initialFocusRef, isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { handleKeyDown };
}
