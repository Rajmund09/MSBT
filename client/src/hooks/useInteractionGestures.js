import { useCallback, useRef } from "react";

/**
 * useLongPress — fires onLongPress after `delay` ms of sustained press.
 * On desktop (mouse), also fires onContextMenu equivalent.
 * Returns spread-able event props for any element.
 */
export function useLongPress(onLongPress, { delay = 500, onClick } = {}) {
  const timerRef = useRef(null);
  const isLong   = useRef(false);

  const start = useCallback((e) => {
    isLong.current = false;
    timerRef.current = setTimeout(() => {
      isLong.current = true;
      onLongPress?.(e);
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback((e) => {
    if (!isLong.current) {
      onClick?.(e);
    }
    isLong.current = false;
  }, [onClick]);

  return {
    onMouseDown:  start,
    onMouseUp:    cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd:   cancel,
    onTouchMove:  cancel,
    onClick:      handleClick,
  };
}

/**
 * useSwipe — detect swipe gestures on an element.
 * Returns ref to attach to the element.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = {}) {
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < threshold) return;

    if (absDx > absDy) {
      if (dx > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    } else {
      if (dy > 0) onSwipeDown?.();
      else onSwipeUp?.();
    }

    startX.current = null;
    startY.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return { onTouchStart, onTouchEnd };
}
