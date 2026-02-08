// lib/workers/image-processing.worker.ts
/// <reference lib="webworker" />

/*
 * TODO: WEB WORKER IMPLEMENTATION CURRENTLY DISABLED
 * 
 * This Web Worker has multiple critical issues that prevent it from functioning:
 * 
 * 1. DOM API INCOMPATIBILITY (Runtime crash):
 *    - The imported processImageCore uses DOM APIs (new Image(), document.createElement('canvas'))
 *    - These APIs are NOT available in Web Workers and will crash at runtime
 *    - Web Workers run in a separate thread without access to the DOM
 * 
 * 2. TYPE ERRORS:
 *    - ProcessImageOptions is imported from ../types but doesn't exist there
 *    - Should import from ../image-processor-core or create shared type
 * 
 * 3. FUNCTION SIGNATURE MISMATCH:
 *    - processImageCore is called with 3 arguments (options, settings, callback)
 *    - But processImageCore only accepts 2 arguments (options, settings)
 *    - The progress callback parameter doesn't exist in the current implementation
 * 
 * TO FIX THIS WEB WORKER, YOU MUST:
 * 
 * A. Refactor image processing to use Worker-compatible APIs:
 *    - Replace new Image() with fetch() + createImageBitmap()
 *    - Replace document.createElement('canvas') with OffscreenCanvas
 *    - Replace canvas.getContext('2d') with offscreenCanvas.getContext('2d')
 * 
 * B. Add progress callback support to processImageCore:
 *    - Modify the function signature to accept an optional progress callback
 *    - Call the callback at various stages of processing
 *    - Return early if callback returns true (cancellation)
 * 
 * C. Fix type imports:
 *    - Import ProcessImageOptions from the correct module
 *    - Or define it in a shared types file
 * 
 * ALTERNATIVES:
 * - Keep using the main-thread implementation in lib/image-processor-with-progress.ts
 * - It already provides progress updates without the complexity of Web Workers
 * - Consider Web Workers only if processing times become a real UX issue
 * 
 * For reference, here's the commented-out implementation:
 */

/*
import type { Settings, ImageData, ProcessImageOptions } from "../types";
import { processImage as processImageCore } from "../image-processor-core";

interface WorkerMessage {
    type: "process" | "cancel";
    payload?: {
        options: ProcessImageOptions;
        settings: Settings;
    };
}

interface WorkerResponse {
    type: "progress" | "complete" | "error";
    payload?: {
        progress?: number;
        status?: string;
        imageData?: ImageData;
        error?: string;
    };
}

let currentProcessing = false;
let shouldCancel = false;

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
    const { type, payload } = event.data;

    if (type === "cancel") {
        shouldCancel = true;
        return;
    }

    if (type === "process" && payload) {
        currentProcessing = true;
        shouldCancel = false;

        try {
            // Report starting
            const progressResponse: WorkerResponse = {
                type: "progress",
                payload: { progress: 0, status: "Starting image processing..." },
            };
            self.postMessage(progressResponse);

            // Check for cancellation
            if (shouldCancel) {
                return;
            }

            // Loading image
            const progressResponse2: WorkerResponse = {
                type: "progress",
                payload: { progress: 10, status: "Loading image..." },
            };
            self.postMessage(progressResponse2);

            // Process the image with the refactored core function
            const imageData = await processImageCore(
                payload.options,
                payload.settings,
                (progress: number, status: string) => {
                    if (!shouldCancel) {
                        const progressUpdate: WorkerResponse = {
                            type: "progress",
                            payload: { progress, status },
                        };
                        self.postMessage(progressUpdate);
                    }
                    return shouldCancel;
                }
            );

            if (shouldCancel) {
                return;
            }

            // Send the result back to the main thread
            const completeResponse: WorkerResponse = {
                type: "complete",
                payload: { imageData },
            };
            self.postMessage(completeResponse);
        } catch (error) {
            const errorResponse: WorkerResponse = {
                type: "error",
                payload: { error: error instanceof Error ? error.message : "Unknown error" },
            };
            self.postMessage(errorResponse);
        } finally {
            currentProcessing = false;
            shouldCancel = false;
        }
    }
});

export { };
*/

