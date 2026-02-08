/**
 * Error handling utilities for Squigglify
 * Provides consistent error handling and user-friendly error messages
 */

export class SquigglifyError extends Error {
    constructor(
        message: string,
        public code: string,
        public userMessage: string,
        public recoverable: boolean = true
    ) {
        super(message);
        this.name = 'SquigglifyError';
    }
}

export class ImageProcessingError extends SquigglifyError {
    constructor(message: string, userMessage?: string) {
        super(
            message,
            'IMAGE_PROCESSING_ERROR',
            userMessage || 'Failed to process image. Please try a different image or settings.',
            true
        );
        this.name = 'ImageProcessingError';
    }
}

export class ImageLoadError extends SquigglifyError {
    constructor(message: string, userMessage?: string) {
        super(
            message,
            'IMAGE_LOAD_ERROR',
            userMessage || 'Failed to load image. Please check the file and try again.',
            true
        );
        this.name = 'ImageLoadError';
    }
}

export class SVGGenerationError extends SquigglifyError {
    constructor(message: string, userMessage?: string) {
        super(
            message,
            'SVG_GENERATION_ERROR',
            userMessage || 'Failed to generate SVG. Please try different settings.',
            true
        );
        this.name = 'SVGGenerationError';
    }
}

export class QuotaExceededError extends SquigglifyError {
    constructor(message: string) {
        super(
            message,
            'QUOTA_EXCEEDED',
            'Storage quota exceeded. Please clear some space or use a smaller image.',
            true
        );
        this.name = 'QuotaExceededError';
    }
}

/**
 * Error handler that provides user-friendly messages and logging
 */
export class ErrorHandler {
    private static logError(error: Error, context?: Record<string, any>): void {
        console.error('[Squigglify Error]', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
        });
    }

    static handle(error: unknown, context?: Record<string, any>): SquigglifyError {
        this.logError(error as Error, context);

        // Handle known error types
        if (error instanceof SquigglifyError) {
            return error;
        }

        // Handle DOMException (QuotaExceededError)
        if (error instanceof DOMException) {
            if (error.name === 'QuotaExceededError') {
                return new QuotaExceededError(error.message);
            }
        }

        // Handle generic errors
        if (error instanceof Error) {
            // Check for specific error patterns
            if (error.message.includes('canvas') || error.message.includes('context')) {
                return new ImageProcessingError(
                    error.message,
                    'Canvas error occurred. Your browser may not support this operation.'
                );
            }

            if (error.message.includes('load') || error.message.includes('fetch')) {
                return new ImageLoadError(error.message);
            }

            if (error.message.includes('SVG') || error.message.includes('path')) {
                return new SVGGenerationError(error.message);
            }

            // Generic error
            return new SquigglifyError(
                error.message,
                'UNKNOWN_ERROR',
                'An unexpected error occurred. Please try again.',
                true
            );
        }

        // Unknown error type
        return new SquigglifyError(
            String(error),
            'UNKNOWN_ERROR',
            'An unexpected error occurred. Please try again.',
            true
        );
    }

    static getUserMessage(error: unknown): string {
        const handled = this.handle(error);
        return handled.userMessage;
    }

    static isRecoverable(error: unknown): boolean {
        const handled = this.handle(error);
        return handled.recoverable;
    }
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: Record<string, any>
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw ErrorHandler.handle(error, { ...context, args });
        }
    }) as T;
}

/**
 * Retry logic for transient failures
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        delay?: number;
        backoff?: boolean;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        delay = 1000,
        backoff = true,
        onRetry = () => { },
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries - 1) {
                onRetry(attempt + 1, lastError);
                const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError!;
}

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            error: 'Please select a valid image file.',
        };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Image is too large. Please use an image smaller than 10MB.',
        };
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        return {
            valid: false,
            error: 'Unsupported file format. Please use JPG, PNG, GIF, WebP, or BMP.',
        };
    }

    return { valid: true };
}

/**
 * Validate settings before processing
 */
export function validateSettings(settings: any): { valid: boolean; error?: string } {
    // Check columns and rows
    if (settings.columnsCount < 10 || settings.columnsCount > 200) {
        return {
            valid: false,
            error: 'Columns must be between 10 and 200.',
        };
    }

    if (settings.rowsCount < 10 || settings.rowsCount > 200) {
        return {
            valid: false,
            error: 'Rows must be between 10 and 200.',
        };
    }

    // Check density
    if (settings.minDensity < 0 || settings.minDensity > settings.maxDensity) {
        return {
            valid: false,
            error: 'Invalid density range. Min must be less than max.',
        };
    }

    if (settings.maxDensity < 1 || settings.maxDensity > 20) {
        return {
            valid: false,
            error: 'Max density must be between 1 and 20.',
        };
    }

    // Check color amount (for posterize mode)
    if (settings.processingMode === 'posterize') {
        if (settings.colorsAmt < 2 || settings.colorsAmt > 16) {
            return {
                valid: false,
                error: 'Color amount must be between 2 and 16.',
            };
        }
    }

    return { valid: true };
}
