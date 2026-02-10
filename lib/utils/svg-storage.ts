const CACHE_NAME = "squigglify-svg-cache";
const CACHE_KEY = "/cached-svg-output";
const PROCESSED_DATA_CACHE_KEY = "/cached-processed-data";

import type { ImageData } from "../types";

/**
 * Saves the generated SVG string to the Cache API.
 * The Cache API stores Request/Response pairs, so we wrap the SVG in a synthetic Response.
 */
export async function saveSvgToStorage(svgContent: string): Promise<void> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(svgContent, {
            headers: {
                "Content-Type": "image/svg+xml",
                "X-Cached-At": Date.now().toString(),
            },
        });
        await cache.put(CACHE_KEY, response);
        console.log(
            `SVG saved to cache (${(svgContent.length / 1024).toFixed(1)}KB)`
        );
    } catch (error) {
        console.error("Failed to save SVG to cache:", error);
    }
}

/**
 * Retrieves the stored SVG string from the Cache API.
 * Returns null if no cached SVG is found.
 */
export async function getStoredSvg(): Promise<string | null> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(CACHE_KEY);
        if (!response) {
            console.log("No cached SVG found");
            return null;
        }

        const svgContent = await response.text();
        const cachedAt = response.headers.get("X-Cached-At");
        console.log(
            `Restored SVG from cache (${(svgContent.length / 1024).toFixed(1)}KB, cached ${cachedAt ? new Date(parseInt(cachedAt)).toLocaleTimeString() : "unknown"})`
        );
        return svgContent;
    } catch (error) {
        console.error("Failed to retrieve SVG from cache:", error);
        return null;
    }
}

/**
 * Clears the stored SVG from the Cache API.
 */
export async function clearStoredSvg(): Promise<void> {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(CACHE_KEY);
        console.log("Cleared SVG from cache");
    } catch (error) {
        console.error("Failed to clear SVG from cache:", error);
    }
}


/**
 * Saves the processed image data (stripped of heavy pixel data) to the Cache API.
 * This preserves color groups and other metadata needed for regeneration/settings.
 */
export async function saveProcessedDataToStorage(data: ImageData): Promise<void> {
    try {
        // Create a lightweight copy without the heavy pixels array
        // We need colorGroups (for paths/colors) but not the raw pixel grid
        const { pixels, ...lightweightData } = data;

        const jsonString = JSON.stringify(lightweightData);
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(jsonString, {
            headers: {
                "Content-Type": "application/json",
                "X-Cached-At": Date.now().toString(),
            },
        });
        await cache.put(PROCESSED_DATA_CACHE_KEY, response);
        console.log(
            `Processed data saved to cache (${(jsonString.length / 1024).toFixed(1)}KB)`
        );
    } catch (error) {
        console.error("Failed to save processed data to cache:", error);
    }
}

/**
 * Retrieves the stored processed image data from the Cache API.
 */
export async function getStoredProcessedData(): Promise<ImageData | null> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(PROCESSED_DATA_CACHE_KEY);
        if (!response) {
            return null;
        }

        const data = await response.json() as ImageData;
        console.log("Restored processed data from cache");
        return data; // Note: pixels array will be undefined/empty
    } catch (error) {
        console.error("Failed to retrieve processed data from cache:", error);
        return null;
    }
}

/**
 * Clears the stored processed data.
 */
export async function clearStoredProcessedData(): Promise<void> {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(PROCESSED_DATA_CACHE_KEY);
        console.log("Cleared processed data from cache");
    } catch (error) {
        console.error("Failed to clear processed data from cache:", error);
    }
}
