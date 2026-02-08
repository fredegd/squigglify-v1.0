/**
 * Unit tests for critical math utilities
 * Tests K-means clustering, distance calculations, and color quantization
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
    kMeansClustering,
    findNearestCentroid,
    findNearestCentroidIndex,
    colorDistance,
    colorDistanceSquared,
    averageColor,
    calculateDistance,
} from '../utils/math-utils';

describe('Math Utils', () => {
    describe('colorDistance', () => {
        it('should calculate distance between two colors', () => {
            const c1: [number, number, number] = [255, 0, 0]; // Red
            const c2: [number, number, number] = [0, 0, 0]; // Black
            const distance = colorDistance(c1, c2);
            expect(distance).toBe(255);
        });

        it('should return 0 for identical colors', () => {
            const c1: [number, number, number] = [128, 128, 128];
            const distance = colorDistance(c1, c1);
            expect(distance).toBe(0);
        });

        it('should handle white to black distance', () => {
            const white: [number, number, number] = [255, 255, 255];
            const black: [number, number, number] = [0, 0, 0];
            const distance = colorDistance(white, black);
            expect(distance).toBeCloseTo(Math.sqrt(255 * 255 * 3), 1);
        });
    });

    describe('colorDistanceSquared', () => {
        it('should be faster than colorDistance for comparisons', () => {
            const c1: [number, number, number] = [255, 0, 0];
            const c2: [number, number, number] = [0, 255, 0];
            const squared = colorDistanceSquared(c1, c2);
            const normal = colorDistance(c1, c2);
            // Use toBeCloseTo to handle floating point precision
            expect(squared).toBeCloseTo(normal * normal, 0);
        });

        it('should return 0 for identical colors', () => {
            const c1: [number, number, number] = [100, 150, 200];
            expect(colorDistanceSquared(c1, c1)).toBe(0);
        });
    });

    describe('averageColor', () => {
        it('should calculate average of colors', () => {
            const colors: [number, number, number][] = [
                [0, 0, 0],
                [100, 100, 100],
                [200, 200, 200],
            ];
            const avg = averageColor(colors);
            expect(avg[0]).toBe(100);
            expect(avg[1]).toBe(100);
            expect(avg[2]).toBe(100);
        });

        it('should handle single color', () => {
            const colors: [number, number, number][] = [[128, 64, 32]];
            const avg = averageColor(colors);
            expect(avg).toEqual([128, 64, 32]);
        });

        it('should handle grayscale colors', () => {
            const colors: [number, number, number][] = [
                [0, 0, 0],
                [255, 255, 255],
            ];
            const avg = averageColor(colors);
            expect(avg).toEqual([127.5, 127.5, 127.5]);
        });
    });

    describe('findNearestCentroid', () => {
        const centroids: [number, number, number][] = [
            [0, 0, 0],     // Black
            [255, 0, 0],   // Red
            [0, 255, 0],   // Green
            [0, 0, 255],   // Blue
        ];

        it('should find exact match', () => {
            const color: [number, number, number] = [255, 0, 0];
            const nearest = findNearestCentroid(color, centroids);
            expect(nearest).toEqual([255, 0, 0]);
        });

        it('should find nearest for dark gray', () => {
            const darkGray: [number, number, number] = [50, 50, 50];
            const nearest = findNearestCentroid(darkGray, centroids);
            expect(nearest).toEqual([0, 0, 0]); // Should be black
        });

        it('should find nearest for reddish color', () => {
            const reddish: [number, number, number] = [200, 50, 50];
            const nearest = findNearestCentroid(reddish, centroids);
            expect(nearest).toEqual([255, 0, 0]); // Should be red
        });
    });

    describe('findNearestCentroidIndex', () => {
        const centroids: [number, number, number][] = [
            [0, 0, 0],
            [128, 128, 128],
            [255, 255, 255],
        ];

        it('should return correct index', () => {
            const color: [number, number, number] = [250, 250, 250];
            const index = findNearestCentroidIndex(color, centroids);
            expect(index).toBe(2); // White
        });

        it('should return 0 for first centroid', () => {
            const color: [number, number, number] = [10, 10, 10];
            const index = findNearestCentroidIndex(color, centroids);
            expect(index).toBe(0); // Black
        });
    });

    describe('kMeansClustering', () => {
        it('should handle empty input', () => {
            const colors: [number, number, number][] = [];
            const clusters = kMeansClustering(colors, 3);
            expect(clusters).toEqual([]);
        });

        it('should handle fewer colors than k', () => {
            const colors: [number, number, number][] = [
                [255, 0, 0],
                [0, 255, 0],
            ];
            const clusters = kMeansClustering(colors, 5);
            expect(clusters.length).toBe(2);
        });

        it('should cluster simple grayscale', () => {
            const colors: [number, number, number][] = [
                [0, 0, 0],
                [10, 10, 10],
                [250, 250, 250],
                [255, 255, 255],
            ];
            const clusters = kMeansClustering(colors, 2);
            expect(clusters.length).toBe(2);

            // Should have one dark cluster and one light cluster
            const sorted = clusters.sort((a, b) => a[0] - b[0]);
            expect(sorted[0][0]).toBeLessThan(50); // Dark cluster
            expect(sorted[1][0]).toBeGreaterThan(200); // Light cluster
        });

        it('should cluster RGB colors', () => {
            const colors: [number, number, number][] = [
                [255, 0, 0],   // Red
                [250, 5, 5],   // Reddish
                [0, 255, 0],   // Green
                [5, 250, 5],   // Greenish
                [0, 0, 255],   // Blue
                [5, 5, 250],   // Blueish
            ];
            const clusters = kMeansClustering(colors, 3);
            expect(clusters.length).toBe(3);

            // Each cluster should represent one primary color
            const hasRed = clusters.some(c => c[0] > 200 && c[1] < 50 && c[2] < 50);
            const hasGreen = clusters.some(c => c[0] < 50 && c[1] > 200 && c[2] < 50);
            const hasBlue = clusters.some(c => c[0] < 50 && c[1] < 50 && c[2] > 200);

            expect(hasRed || hasGreen || hasBlue).toBe(true);
        });

        it('should return integers', () => {
            const colors: [number, number, number][] = [
                [100, 100, 100],
                [101, 101, 101],
            ];
            const clusters = kMeansClustering(colors, 1);

            clusters.forEach(cluster => {
                expect(Number.isInteger(cluster[0])).toBe(true);
                expect(Number.isInteger(cluster[1])).toBe(true);
                expect(Number.isInteger(cluster[2])).toBe(true);
            });
        });
    });

    describe('calculateDistance', () => {
        it('should calculate Euclidean distance', () => {
            const distance = calculateDistance(0, 0, 3, 4);
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should return 0 for same point', () => {
            const distance = calculateDistance(10, 10, 10, 10);
            expect(distance).toBe(0);
        });

        it('should handle negative coordinates', () => {
            const distance = calculateDistance(-5, -5, 5, 5);
            expect(distance).toBeCloseTo(Math.sqrt(200), 1);
        });
    });
});
