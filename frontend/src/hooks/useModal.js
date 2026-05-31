import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal/dialog open state.
 */
export function useModal(initialState = false) {
  const [open, setOpen] = useState(initialState);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  return { open, handleOpen, handleClose, toggle };
}

/**
 * Custom hook for debouncing a value.
 */
export function useDebounce(fn, delay = 300) {
  const [timer, setTimer] = useState(null);

  const debouncedFn = useCallback(
    (...args) => {
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => fn(...args), delay);
      setTimer(newTimer);
    },
    [fn, delay, timer]
  );

  return debouncedFn;
}
