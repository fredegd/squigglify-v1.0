// lib/workers/image-processing.worker.ts
/// <reference lib="webworker" />

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
