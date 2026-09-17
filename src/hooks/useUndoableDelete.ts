import { useCallback, useEffect, useRef, useState } from 'react';

const UNDO_WINDOW_MS = 5000;

/**
 * Removes an item from the UI immediately, then actually deletes it from the
 * server only after a 5s grace period — giving the user a chance to undo an
 * accidental deletion of health data before it's gone for good.
 */
export function useUndoableDelete<T>(deleteFn: (item: T) => Promise<void>) {
  const [pending, setPending] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleDelete = useCallback(
    (item: T) => {
      setPending(item);
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        setPending(null);
        await deleteFn(item);
      }, UNDO_WINDOW_MS);
    },
    [deleteFn]
  );

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending(null);
  }, []);

  return { pending, scheduleDelete, undo };
}
