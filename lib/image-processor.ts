import type { Settings, ImageData } from "./types";

import { processGrayscale } from "./processors/grayscale-processor";
import { processPosterize } from "./processors/posterize-processor";
import { processCMYK } from "./processors/cmyk-processor";
import { processMonochrome } from "./processors/monochrome-processor";
import {
  calculateResizeDimensions,
  calculateOptimalDimensions,
} from "./utils/dimension-utils";
import {
  generateSVG as generateSvgFromImageData,
  extractColorGroupSVG,
  extractAllColorGroups,
} from "./utils/svg-utils";
import { calculateHueAndBrightness } from "./converters/color-converters";
import { ColorQuantizer } from "./processors/color-quantizer";

// Cache für die Farbquantisierung
let colorQuantizerCache: {
  imageHash: string;
  quantizer: ColorQuantizer | null;
  lastColorsAmt: number;
} = {
  imageHash: "",
  quantizer: null,
  lastColorsAmt: 0,
};

// Berechne Hash für das Originalbild
function calculateImageHash(imageData: Uint8ClampedArray): string {
  // Samplen der ersten 1000 Pixel für den Hash
  const sampleSize = Math.min(1000, imageData.length / 4);
  let hash = "";
  for (let i = 0; i < sampleSize; i++) {
    const idx = i * 4;
    hash += `${imageData[idx]},${imageData[idx + 1]},${imageData[idx + 2]}|`;
  }
  return hash;
}

// Process image to extract pixel data
export async function processImage(
  imageDataUrl: string,
  settings: Settings
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Berechne optimale Bildgröße
        const { width: optimalWidth, height: optimalHeight } =
          calculateOptimalDimensions(img.width, img.height);

        // Erstelle Canvas für das optimierte Originalbild
        const originalCanvas = document.createElement("canvas");
        const originalCtx = originalCanvas.getContext("2d");
        if (!originalCtx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Setze Canvas auf optimale Größe
        originalCanvas.width = optimalWidth;
        originalCanvas.height = optimalHeight;

        // Zeichne Bild in optimierter Größe
        originalCtx.drawImage(img, 0, 0, optimalWidth, optimalHeight);
        const originalImageData = originalCtx.getImageData(
          0,
          0,
          optimalWidth,
          optimalHeight
        );

        // Berechne Hash für das Originalbild
        const currentImageHash = calculateImageHash(originalImageData.data);

        // Prüfe ob wir einen neuen ColorQuantizer erstellen oder aktualisieren müssen
        if (
          colorQuantizerCache.imageHash !== currentImageHash ||
          !colorQuantizerCache.quantizer ||
          colorQuantizerCache.lastColorsAmt !== settings.colorsAmt
        ) {
          // Wenn das Bild neu ist, erstelle einen neuen Quantizer
          if (
            colorQuantizerCache.imageHash !== currentImageHash ||
            !colorQuantizerCache.quantizer
          ) {
            // Erstelle Pixel-Array für das Originalbild
            const originalPixels = [];
            for (let y = 0; y < optimalHeight; y++) {
              for (let x = 0; x < optimalWidth; x++) {
                const i = (y * optimalWidth + x) * 4;
                const r = originalImageData.data[i];
                const g = originalImageData.data[i + 1];
                const b = originalImageData.data[i + 2];
                const a = originalImageData.data[i + 3];

                if (a === 0) continue;

                const brightness = Math.round(
                  (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255)
                );
                originalPixels.push({ x, y, r, g, b, a, brightness });
              }
            }

            // Erstelle und cache neuen ColorQuantizer
            colorQuantizerCache = {
              imageHash: currentImageHash,
              quantizer: new ColorQuantizer(
                {
                  width: optimalWidth,
                  height: optimalHeight,
                  pixels: originalPixels,
                  originalWidth: optimalWidth, // Use optimized dimensions
                  originalHeight: optimalHeight,
                  resizedWidth: optimalWidth,
                  resizedHeight: optimalHeight,
                  outputWidth: optimalWidth,
                  outputHeight: optimalHeight,
                  columnsCount: optimalWidth,
                  rowsCount: optimalHeight,
                  tileWidth: 1,
                  tileHeight: 1,
                },
                settings.colorsAmt
              ),
              lastColorsAmt: settings.colorsAmt,
            };
          }
          // Wenn nur die Farbanzahl anders ist, aktualisiere den existierenden Quantizer
          else if (colorQuantizerCache.lastColorsAmt !== settings.colorsAmt) {
            colorQuantizerCache.quantizer.updateSettings(
              {
                width: optimalWidth,
                height: optimalHeight,
                pixels: colorQuantizerCache.quantizer.getOriginalPixels(),
                originalWidth: optimalWidth,
                originalHeight: optimalHeight,
                resizedWidth: optimalWidth,
                resizedHeight: optimalHeight,
                outputWidth: optimalWidth,
                outputHeight: optimalHeight,
                columnsCount: optimalWidth,
                rowsCount: optimalHeight,
                tileWidth: 1,
                tileHeight: 1,
              },
              settings.colorsAmt
            );
            colorQuantizerCache.lastColorsAmt = settings.colorsAmt;
          }
        }

        // Calculate resize dimensions based on optimized size
        const {
          resizedWidth,
          resizedHeight,
          columnsCount,
          rowsCount,
          gridSizeX,
          gridSizeY,
          outputWidth,
          outputHeight,
        } = calculateResizeDimensions(
          optimalWidth,
          optimalHeight,
          settings.columnsCount,
          settings.rowsCount
        );

        // Update the settings with the calculated grid sizes
        settings.gridSizeX = gridSizeX;
        settings.gridSizeY = gridSizeY;

        // Create canvas to resize and extract pixel data
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas to the resized dimensions
        canvas.width = resizedWidth;
        canvas.height = resizedHeight;

        // Draw image to canvas at resized dimensions
        ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight);
        //maintaint the stroke width
        ctx.lineWidth = 1;

        // Calculate grid dimensions using the columnsCount and rowsCount
        const gridWidth = columnsCount;
        const gridHeight = rowsCount;

        // Create a second canvas for the grid-based sampling
        const gridCanvas = document.createElement("canvas");
        const gridCtx = gridCanvas.getContext("2d");

        if (!gridCtx) {
          reject(new Error("Could not get grid canvas context"));
          return;
        }

        gridCanvas.width = gridWidth;
        gridCanvas.height = gridHeight;

        // Draw resized image to grid canvas
        gridCtx.drawImage(canvas, 0, 0, gridWidth, gridHeight);

        // Get pixel data
        const imageData = gridCtx.getImageData(0, 0, gridWidth, gridHeight);
        const pixels = [];

        // Process each pixel using cached quantizer colors
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const i = (y * gridWidth + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const aVal = imageData.data[i + 3];

            if (aVal === 0) continue;

            const alphaNormalized = aVal / 255.0;
            const brightness = Math.round(
              (r * 0.299 + g * 0.587 + b * 0.114) * alphaNormalized
            );

            if (
              settings.processingMode === "cmyk" ||
              brightness <= settings.brightnessThreshold
            ) {
              // Bei Posterize-Modus: Verwende die gecachten quantisierten Farben
              if (
                settings.processingMode === "posterize" &&
                colorQuantizerCache.quantizer
              ) {
                const nearestColor =
                  colorQuantizerCache.quantizer.findNearestQuantizedColor([
                    r,
                    g,
                    b,
                  ]);
                pixels.push({
                  x,
                  y,
                  brightness,
                  r: nearestColor[0],
                  g: nearestColor[1],
                  b: nearestColor[2],
                  a: aVal,
                });
              } else {
                pixels.push({
                  x,
                  y,
                  brightness,
                  r,
                  g,
                  b,
                  a: aVal,
                });
              }
            }
          }
        }

        // Create the base image data
        const processedImageData: ImageData = {
          width: gridWidth,
          height: gridHeight,
          pixels,
          originalWidth: img.width,
          originalHeight: img.height,
          resizedWidth,
          resizedHeight,
          outputWidth,
          outputHeight,
          columnsCount,
          rowsCount,
          tileWidth: outputWidth / columnsCount,
          tileHeight: outputHeight / rowsCount,
          colorGroups: {},
        };

        // Process the image according to the selected mode
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          try {
            switch (settings.processingMode) {
              case "grayscale":
                processedImageData.colorGroups = processGrayscale(
                  processedImageData,
                  settings
                );
                break;
              case "posterize":
                processedImageData.colorGroups = processPosterize(
                  processedImageData,
                  settings
                );
                break;
              case "cmyk":
                processedImageData.colorGroups = processCMYK(
                  processedImageData,
                  settings
                );
                break;
              case "monochrome":
                processedImageData.colorGroups = processMonochrome(
                  processedImageData,
                  settings
                );
                break;
            }
            resolve(processedImageData);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageDataUrl;
  });
}

// Export the generateSVG function
export const generateSVG = generateSvgFromImageData;

// Re-export wichtiger Funktionen für externe Nutzung
export {
  extractColorGroupSVG,
  extractAllColorGroups,
  processGrayscale,
  processPosterize,
  processCMYK,
  processMonochrome,
  calculateHueAndBrightness,
};
