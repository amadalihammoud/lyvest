// src/hooks/__tests__/useDebounce.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('useDebounce', () => {
        it('returns initial value immediately', () => {
            const { result } = renderHook(() => useDebounce('initial', 500));
            expect(result.current).toBe('initial');
        });

        it('debounces value changes', async () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebounce(value, 500),
                { initialProps: { value: 'initial' } }
            );

            expect(result.current).toBe('initial');

            rerender({ value: 'updated' });
            expect(result.current).toBe('initial'); // Still old value

            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(result.current).toBe('updated');
        });

        it('resets timer on rapid changes', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebounce(value, 500),
                { initialProps: { value: 'a' } }
            );

            rerender({ value: 'b' });
            act(() => vi.advanceTimersByTime(300));

            rerender({ value: 'c' });
            act(() => vi.advanceTimersByTime(300));

            // Not enough time passed, should still be 'a'
            expect(result.current).toBe('a');

            act(() => vi.advanceTimersByTime(200));
            expect(result.current).toBe('c');
        });
    });

    describe('useDebouncedCallback', () => {
        it('debounces callback execution', () => {
            const callback = vi.fn();
            const { result } = renderHook(() => useDebouncedCallback(callback, 500));

            act(() => {
                result.current('arg1');
                result.current('arg2');
                result.current('arg3');
            });

            expect(callback).not.toHaveBeenCalled();

            act(() => vi.advanceTimersByTime(500));

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('arg3');
        });

        it('allows immediate execution option', () => {
            const callback = vi.fn();
            const { result } = renderHook(() =>
                useDebouncedCallback(callback, 500, { leading: true })
            );

            act(() => {
                result.current('first');
            });

            // Leading edge - should be called immediately
            expect(callback).toHaveBeenCalledWith('first');
        });
    });
});







