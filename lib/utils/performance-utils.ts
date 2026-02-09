// Performance optimization utilities for Squigglify
// Memoization and caching helpers

/**
 * Simple memoization cache for expensive calculations
 */
export class MemoCache<K, V> {
    private cache: Map<string, { value: V; timestamp: number }> = new Map();
    private maxAge: number;
    private maxSize: number;

    constructor(maxAge = 30000, maxSize = 100) {
        this.maxAge = maxAge; // Cache expiry in ms
        this.maxSize = maxSize; // Max cache entries
    }

    private getKey(key: K): string {
        return typeof key === 'object' ? JSON.stringify(key) : String(key);
    }

    get(key: K): V | undefined {
        const keyStr = this.getKey(key);
        const cached = this.cache.get(keyStr);

        if (!cached) return undefined;

        // Check if expired
        if (Date.now() - cached.timestamp > this.maxAge) {
            this.cache.delete(keyStr);
            return undefined;
        }

        return cached.value;
    }

    set(key: K, value: V): void {
        const keyStr = this.getKey(key);

        // Implement FIFO (oldest-first) eviction if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(keyStr)) {
            const firstKey = this.cache.keys().next().value as string | undefined;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(keyStr, { value, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * Debounce function calls to reduce computation
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls to limit execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Measure execution time of a function
 */
export function measurePerformance<T>(
    name: string,
    fn: () => T
): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
}

/**
 * Create a memoized version of an expensive function
 */
export function memoize<Args extends any[], Return>(
    fn: (...args: Args) => Return,
    options?: { maxAge?: number; maxSize?: number }
): (...args: Args) => Return {
    const cache = new MemoCache<string, Return>(
        options?.maxAge || 30000,
        options?.maxSize || 100
    );

    return function memoized(...args: Args): Return {
        const key = JSON.stringify(args);
        const cached = cache.get(key);

        if (cached !== undefined) {
            return cached;
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Batch multiple async operations for better performance
 */
export async function batchAsync<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }

    return results;
}

/**
 * Request idle callback wrapper for non-critical work
 */
export function runWhenIdle(callback: () => void): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(callback);
    } else {
        // Fallback for non-browser environments or browsers without requestIdleCallback
        setTimeout(callback, 1);
    }
}
