/**
 * @module debounce
 * @description Debounce utility for rate-controlling high-frequency function
 * invocations (e.g. search inputs, resize handlers, chat submission guards).
 */

/**
 * Returns a debounced version of `fn` that delays its invocation until after
 * `delayMs` milliseconds have elapsed since the last call.  Any pending
 * invocation is cancelled when the returned function is called again before
 * the delay expires.
 *
 * @typeParam T - A function type whose parameters are forwarded verbatim.
 * @param fn      - The function to debounce.
 * @param delayMs - Delay in milliseconds (must be ≥ 0).
 * @returns A debounced wrapper that shares the same parameter signature as `fn`.
 *
 * @example
 * const debouncedSearch = debounce((query: string) => fetchResults(query), 300);
 * inputElement.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delayMs);
  };
}

/**
 * Cancels a pending debounced invocation by clearing the internal timer.
 * Useful for cleanup in React `useEffect` teardown functions.
 *
 * @param fn - The debounced function returned by {@link debounce}.
 */
export function cancelDebounce(
  fn: ((...args: unknown[]) => void) & { _timer?: ReturnType<typeof setTimeout> },
): void {
  if (fn._timer !== undefined) {
    clearTimeout(fn._timer);
  }
}
