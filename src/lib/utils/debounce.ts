/**
 * PosalPro MVP2 - Debounce Utilities
 * Centralized debouncing logic to prevent excessive function calls and performance issues
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let maxTimeoutId: NodeJS.Timeout | undefined;
  let result: ReturnType<T> | undefined;
  let timerId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args) as ReturnType<T>;
    return result;
  }

  function startTimer(pendingFunc: () => void, wait: number): NodeJS.Timeout {
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id: NodeJS.Timeout | undefined): void {
    if (id) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);
    return leading ? invokeFunc(time) : result!;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): ReturnType<T> | void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<T> {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result!;
  }

  function cancel(): void {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    if (maxTimeoutId !== undefined) {
      cancelTimer(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = maxTimeoutId = undefined;
  }

  function flush(): ReturnType<T> {
    return timerId === undefined ? result! : trailingEdge(Date.now());
  }

  function pending(): boolean {
    return timerId !== undefined;
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timerId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }
    return result!;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as unknown as T & { cancel: () => void; flush: () => ReturnType<T> };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  const { leading = true, trailing = true } = options;
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  });
}

/**
 * Performance-optimized debounce for form validation
 */
export const debounceFormValidation = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 300
) => debounce(func, delay, { leading: false, trailing: true });

/**
 * Performance-optimized throttle for analytics
 */
export const throttleAnalytics = <T extends (...args: unknown[]) => unknown>(
  func: T,
  interval: number = 2000
) => throttle(func, interval, { leading: true, trailing: false });

/**
 * Performance-optimized debounce for API calls
 */
export const debounceApiCalls = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 500
) => debounce(func, delay, { leading: false, trailing: true });
