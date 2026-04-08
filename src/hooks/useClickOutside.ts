import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref(s)
 * @param refs - Ref object(s) pointing to element(s) to ignore
 * @param handler - Function to call on click outside
 * @param active - Whether the listener is active
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  active: boolean = true
) {
  const handlerCallback = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!active) return;

      const refList = Array.isArray(refs) ? refs : [refs];
      
      const isOutside = refList.every((ref) => {
        return ref.current && !ref.current.contains(event.target as Node);
      });

      if (isOutside) {
        handler(event);
      }
    },
    [refs, handler, active]
  );

  useEffect(() => {
    if (!active) return;

    // Use mousedown/touchstart for better responsiveness and to preempt other events
    document.addEventListener('mousedown', handlerCallback);
    document.addEventListener('touchstart', handlerCallback);

    return () => {
      document.removeEventListener('mousedown', handlerCallback);
      document.removeEventListener('touchstart', handlerCallback);
    };
  }, [handlerCallback, active]);
}
