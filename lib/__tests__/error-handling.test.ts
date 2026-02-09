/**
 * Unit tests for error handling utilities
 */

import { describe, it, expect } from 'bun:test';
import {
    ErrorHandler,
    ImageProcessingError,
    ImageLoadError,
    validateImageFile,
    validateSettings,
    retry,
} from '../utils/error-handling';

describe('Error Handling', () => {
    describe('ErrorHandler', () => {
        it('should handle ImageProcessingError', () => {
            const error = new ImageProcessingError('Canvas error');
            const handled = ErrorHandler.handle(error);

            expect(handled).toBeInstanceOf(ImageProcessingError);
            expect(handled.code).toBe('IMAGE_PROCESSING_ERROR');
            expect(handled.recoverable).toBe(true);
        });

        it('should convert generic errors to SquigglifyError', () => {
            const error = new Error('Something went wrong');
            const handled = ErrorHandler.handle(error);

            expect(handled.code).toBe('UNKNOWN_ERROR');
            expect(handled.userMessage).toContain('unexpected error');
        });

        it('should detect canvas errors', () => {
            const error = new Error('Failed to get canvas context');
            const handled = ErrorHandler.handle(error);

            expect(handled.userMessage).toContain('Canvas');
        });

        it('should get user-friendly message', () => {
            const error = new ImageLoadError('Network error');
            const message = ErrorHandler.getUserMessage(error);

            expect(message).toContain('Failed to load image');
        });

        it('should determine if error is recoverable', () => {
            const error = new ImageProcessingError('Test error');
            expect(ErrorHandler.isRecoverable(error)).toBe(true);
        });
    });

    describe('validateImageFile', () => {
        it('should accept valid image files', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            const result = validateImageFile(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject non-image files', () => {
            const file = new File([''], 'test.txt', { type: 'text/plain' });
            const result = validateImageFile(file);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('valid image');
        });

        it('should reject files that are too large', () => {
            const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
                type: 'image/jpeg',
            });
            const result = validateImageFile(largeFile);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('too large');
        });

        it('should reject unsupported extensions', () => {
            const file = new File([''], 'test.tiff', { type: 'image/tiff' });
            const result = validateImageFile(file);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unsupported');
        });

        it('should accept various image formats', () => {
            const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

            formats.forEach(format => {
                const file = new File([''], `test.${format}`, { type: `image/${format}` });
                const result = validateImageFile(file);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('validateSettings', () => {
        const validSettings = {
            columnsCount: 50,
            rowsCount: 50,
            minDensity: 2,
            maxDensity: 8,
            processingMode: 'grayscale',
            colorsAmt: 6,
        };

        it('should accept valid settings', () => {
            const result = validateSettings(validSettings);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid column count', () => {
            const invalid = { ...validSettings, columnsCount: 5 };
            const result = validateSettings(invalid);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Columns');
        });

        it('should reject invalid row count', () => {
            const invalid = { ...validSettings, rowsCount: 250 };
            const result = validateSettings(invalid);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Rows');
        });

        it('should reject invalid density range', () => {
            const invalid = { ...validSettings, minDensity: 10, maxDensity: 5 };
            const result = validateSettings(invalid);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('density');
        });

        it('should validate color amount for posterize mode', () => {
            const invalid = {
                ...validSettings,
                processingMode: 'posterize',
                colorsAmt: 20,
            };
            const result = validateSettings(invalid);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Color amount');
        });
    });

    describe('retry', () => {
        it('should retry on failure', async () => {
            let attempts = 0;

            const fn = async () => {
                attempts++;
                if (attempts < 3) throw new Error('Fail');
                return 'success';
            };

            const result = await retry(fn, { maxRetries: 3, delay: 10 });

            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        it('should throw after max retries', async () => {
            const fn = async () => {
                throw new Error('Always fail');
            };

            await expect(
                retry(fn, { maxRetries: 2, delay: 10 })
            ).rejects.toThrow('Always fail');
        });

        it('should call onRetry callback', async () => {
            const retries: number[] = [];
            let attempts = 0;

            const fn = async () => {
                attempts++;
                if (attempts < 2) throw new Error('Fail');
                return 'done';
            };

            await retry(fn, {
                maxRetries: 3,
                delay: 10,
                onRetry: (attempt) => retries.push(attempt),
            });

            expect(retries).toEqual([1]);
        });
    });
});
