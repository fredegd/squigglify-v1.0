/**
 * Performance Profiling Utilities
 * 
 * Provides Performance API helpers for measuring and logging
 * execution times of critical image processing operations.
 */

// Store performance entries for aggregation
const performanceLog: Map<string, number[]> = new Map();

/**
 * Start a performance measurement
 */
export function perfStart(name: string): void {
    if (typeof performance !== 'undefined') {
        performance.mark(`${name}-start`);
    }
}

/**
 * End a performance measurement and log the result
 */
export function perfEnd(name: string, log = false): number {
    if (typeof performance === 'undefined') return 0;

    performance.mark(`${name}-end`);

    try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const entries = performance.getEntriesByName(name);
        const lastEntry = entries[entries.length - 1];
        const duration = lastEntry?.duration ?? 0;

        // Store for aggregation
        const existing = performanceLog.get(name) || [];
        existing.push(duration);
        performanceLog.set(name, existing);

        // Clean up marks and measures to prevent memory leaks
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);

        if (log) {
            console.log(`⏱️ [PERF] ${name}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    } catch {
        return 0;
    }
}

/**
 * Measure an async function
 */
export async function perfMeasure<T>(
    name: string,
    fn: () => Promise<T>,
    log = true
): Promise<{ result: T; duration: number }> {
    perfStart(name);
    const result = await fn();
    const duration = perfEnd(name, log);
    return { result, duration };
}

/**
 * Measure a sync function
 */
export function perfMeasureSync<T>(
    name: string,
    fn: () => T,
    log = true
): { result: T; duration: number } {
    perfStart(name);
    const result = fn();
    const duration = perfEnd(name, log);
    return { result, duration };
}

/**
 * Get aggregated performance stats
 */
export function getPerformanceStats(): Record<string, {
    count: number;
    total: number;
    avg: number;
    min: number;
    max: number;
}> {
    const stats: Record<string, {
        count: number;
        total: number;
        avg: number;
        min: number;
        max: number;
    }> = {};

    for (const [name, durations] of performanceLog.entries()) {
        const total = durations.reduce((a, b) => a + b, 0);
        stats[name] = {
            count: durations.length,
            total,
            avg: total / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
        };
    }

    return stats;
}

/**
 * Print a summary of all performance measurements
 */
export function printPerformanceSummary(): void {
    const stats = getPerformanceStats();

    console.log('\n📊 Performance Summary');
    console.log('═'.repeat(60));

    const entries = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);

    for (const [name, data] of entries) {
        console.log(
            `${name.padEnd(30)} | ` +
            `Total: ${data.total.toFixed(1)}ms | ` +
            `Avg: ${data.avg.toFixed(1)}ms | ` +
            `Count: ${data.count}`
        );
    }

    console.log('═'.repeat(60));
}

/**
 * Clear all performance logs
 */
export function clearPerformanceLog(): void {
    performanceLog.clear();
}

/**
 * Enable verbose performance logging in console
 * Adds a global function to print stats
 */
export function enablePerformanceDebugging(): void {
    if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).perfStats = () => {
            printPerformanceSummary();
            return getPerformanceStats();
        };
        (window as unknown as Record<string, unknown>).perfClear = clearPerformanceLog;
        console.log('🔧 Performance debugging enabled. Use perfStats() and perfClear() in console.');
    }
}
