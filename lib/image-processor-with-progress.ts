import type { Settings, ImageData } from "./types";
import { processImage as processImageSync, generateSVG, type ProcessImageOptions } from "./image-processor";

/**
 * Progress callback function
 * @param progress - Progress percentage (0-100)
 * @param status - Current status message
 * @returns boolean - true if processing should be cancelled
 */
export type ProgressCallback = (progress: number, status: string) => boolean;

/**
 * Process image with progress updates
 * This version provides progress feedback to improve UX
 */
export async function processImageWithProgress(
    options: ProcessImageOptions,
    settings: Settings,
    onProgress?: ProgressCallback
): Promise<ImageData> {
    try {
        // Report initial progress and yield thread for UI paint
        if (onProgress && onProgress(5, "Loading image...")) {
            throw new Error("Processing cancelled");
        }
        await new Promise(resolve => setTimeout(resolve, 30));

        if (onProgress && onProgress(15, "Analyzing image data...")) {
            throw new Error("Processing cancelled");
        }
        await new Promise(resolve => setTimeout(resolve, 30));

        // Start actual processing
        const imageData = await processImageSync(options, settings, onProgress);

        if (onProgress && onProgress(85, "Finalizing...")) {
            throw new Error("Processing cancelled");
        }
        await new Promise(resolve => setTimeout(resolve, 10));

        if (onProgress && onProgress(100, "Complete!")) {
            throw new Error("Processing cancelled");
        }

        return imageData;
    } catch (error) {
        if (error instanceof Error && error.message === "Processing cancelled") {
            throw error;
        }
        throw new Error(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// Re-export for convenience
export { generateSVG, type ProcessImageOptions };
