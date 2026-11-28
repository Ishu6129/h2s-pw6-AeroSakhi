import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '@/lib/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function after the specified delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('a');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('does not call the function before the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
  });

  it('resets the timer on rapid successive calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 150);

    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(100);
    debounced('third');
    vi.advanceTimersByTime(150);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('calls the function only once when invoked rapidly then left idle', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < 10; i++) {
      debounced(i);
      vi.advanceTimersByTime(50);
    }

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows independent debounced instances to fire independently', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const d1 = debounce(fn1, 100);
    const d2 = debounce(fn2, 200);

    d1('x');
    d2('y');

    vi.advanceTimersByTime(100);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('passes multiple arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced('city', 42, true);
    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith('city', 42, true);
  });

  it('handles a delay of 0 ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 0);

    debounced('immediate');
    vi.advanceTimersByTime(0);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('immediate');
  });

  it('allows the function to be called again after the delay fires', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });
});
