/**
 * Unit tests for performance utilities
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
    MemoCache,
    memoize,
    debounce,
    throttle,
    measurePerformance,
} from '../utils/performance-utils';

describe('Performance Utils', () => {
    describe('MemoCache', () => {
        let cache: MemoCache<string, number>;

        beforeEach(() => {
            cache = new MemoCache<string, number>(1000, 5);
        });

        it('should store and retrieve values', () => {
            cache.set('key1', 100);
            expect(cache.get('key1')).toBe(100);
        });

        it('should return undefined for missing keys', () => {
            expect(cache.get('nonexistent')).toBeUndefined();
        });

        it('should respect max size with LRU eviction', () => {
            for (let i = 0; i < 6; i++) {
                cache.set(`key${i}`, i);
            }

            // First key should be evicted
            expect(cache.get('key0')).toBeUndefined();
            expect(cache.get('key5')).toBe(5);
            expect(cache.size()).toBe(5);
        });

        it('should expire old entries', async () => {
            const shortCache = new MemoCache<string, number>(100, 10);
            shortCache.set('temp', 42);

            expect(shortCache.get('temp')).toBe(42);

            // Wait for expiry
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(shortCache.get('temp')).toBeUndefined();
        });

        it('should clear all entries', () => {
            cache.set('key1', 1);
            cache.set('key2', 2);
            cache.clear();
            expect(cache.size()).toBe(0);
            expect(cache.get('key1')).toBeUndefined();
        });
    });

    describe('memoize', () => {
        it('should cache function results', () => {
            let callCount = 0;
            const fn = memoize((x: number) => {
                callCount++;
                return x * 2;
            });

            expect(fn(5)).toBe(10);
            expect(fn(5)).toBe(10);
            expect(callCount).toBe(1); // Should only be called once
        });

        it('should handle different arguments', () => {
            const fn = memoize((x: number, y: number) => x + y);

            expect(fn(1, 2)).toBe(3);
            expect(fn(2, 3)).toBe(5);
            expect(fn(1, 2)).toBe(3); // Cached
        });

        it('should cache complex return values', () => {
            let callCount = 0;
            const fn = memoize((id: number) => {
                callCount++;
                return { id, data: `value-${id}` };
            });

            const result1 = fn(1);
            const result2 = fn(1);

            expect(result1).toEqual(result2);
            expect(callCount).toBe(1);
        });
    });

    describe('debounce', () => {
        it('should delay function execution', async () => {
            let counter = 0;
            const fn = debounce(() => counter++, 100);

            fn();
            fn();
            fn();

            expect(counter).toBe(0);

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(counter).toBe(1); // Should only execute once
        });

        it('should cancel previous calls', async () => {
            let lastValue = 0;
            const fn = debounce((x: number) => { lastValue = x; }, 50);

            fn(1);
            await new Promise(resolve => setTimeout(resolve, 30));
            fn(2);
            await new Promise(resolve => setTimeout(resolve, 30));
            fn(3);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(lastValue).toBe(3); // Only last call should execute
        });
    });

    describe('throttle', () => {
        it('should limit execution rate', async () => {
            let counter = 0;
            const fn = throttle(() => counter++, 100);

            fn();
            fn();
            fn();

            expect(counter).toBe(1); // First call executes immediately

            await new Promise(resolve => setTimeout(resolve, 150));

            fn();
            expect(counter).toBe(2); // Second call after throttle period
        });

        it('should allow execution after cooldown', async () => {
            let value = 0;
            const fn = throttle((x: number) => { value = x; }, 50);

            fn(1);
            expect(value).toBe(1);

            fn(2); // Throttled
            expect(value).toBe(1);

            await new Promise(resolve => setTimeout(resolve, 60));

            fn(3); // Should execute
            expect(value).toBe(3);
        });
    });

    describe('measurePerformance', () => {
        it('should measure execution time', () => {
            const { result, duration } = measurePerformance('test', () => {
                let sum = 0;
                for (let i = 0; i < 1000; i++) {
                    sum += i;
                }
                return sum;
            });

            expect(result).toBe(499500);
            expect(duration).toBeGreaterThan(0);
            expect(duration).toBeLessThan(100);
        });

        it('should return correct result', () => {
            const { result } = measurePerformance('test', () => {
                return 'hello world';
            });

            expect(result).toBe('hello world');
        });
    });
});
