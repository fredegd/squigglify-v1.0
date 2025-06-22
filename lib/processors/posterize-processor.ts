import type { ColorGroup, ImageData, Settings, PathPoint } from "../types";
import {
  calculateHueAndBrightness as calculateHueAndBrightnessForGroup,
  rgbToHex,
} from "../converters/color-converters";

export class PosterizeProcessor {
  // constructor(imageData: ImageData, settings: Settings) {
  //   // Color quantization has already been performed in the image-processor
  //   // Here we only use the already calculated colors
  // }

  public static process(
    imageData: ImageData,
    settings: Settings
  ): Record<string, ColorGroup> {
    const {
      width,
      height,
      pixels,
      tileWidth: gridSizeX,
      tileHeight: gridSizeY,
    } = imageData;

    const colorGroups: Record<string, ColorGroup> = {};

    // Collect the quantized colors from the pixels
    const uniqueColors = new Set<string>();
    pixels.forEach((pixel) => {
      const colorKey = `${pixel.r},${pixel.g},${pixel.b}`;
      if (!uniqueColors.has(colorKey)) {
        uniqueColors.add(colorKey);
        const hexColor = rgbToHex(pixel.r, pixel.g, pixel.b);

        // Calculate hue and brightness for the color
        const tempGroupForHueCalc: Record<string, ColorGroup> = {
          [hexColor]: {
            color: hexColor,
            displayName: "",
            points: [],
            hue: 0,
            brightness: 0,
          },
        };
        const calculatedGroup =
          calculateHueAndBrightnessForGroup(tempGroupForHueCalc);
        const { hue, brightness } = calculatedGroup[hexColor];

        colorGroups[hexColor] = {
          color: hexColor,
          displayName: `Color ${uniqueColors.size}`,
          points: [],
          hue,
          brightness,
        };
      }
    });

    // Create points for each pixel
    pixels.forEach((pixel) => {
      const hexColor = rgbToHex(pixel.r, pixel.g, pixel.b);
      const normalizedBrightness = pixel.brightness / 255;
      let density = Math.round(
        settings.minDensity +
          (1 - normalizedBrightness) *
            (settings.maxDensity - settings.minDensity)
      );
      density = Math.max(0, Math.min(settings.maxDensity, density));

      if (density === 0) return;

      const pathPointX =
        pixel.y % 2 === 0
          ? pixel.x * gridSizeX
          : pixel.x * gridSizeX + gridSizeX;

      const pathPoint: PathPoint = {
        x: pathPointX,
        y: pixel.y * gridSizeY,
        width: gridSizeX,
        height: gridSizeY,
        density,
        row: pixel.y,
        column: pixel.x, // Add column information for wave calculations
        direction: pixel.y % 2 === 0 ? 1 : -1,
        randomUpperKnotShiftX: (Math.random() - 0.5) * (gridSizeX + gridSizeY),
        randomUpperKnotShiftY: (Math.random() - 0.5) * (gridSizeX + gridSizeY),
      };

      if (colorGroups[hexColor]) {
        colorGroups[hexColor].points.push(pathPoint);
      }
    });

    return colorGroups;
  }
}

// Export the wrapper function for compatibility with the existing code
// export function processPosterize(
//   imageData: ImageData,
//   settings: Settings
// ): Record<string, ColorGroup> {
//   const processor = new PosterizeProcessor(imageData, settings);
//   return processor.process(imageData, settings);
// }
