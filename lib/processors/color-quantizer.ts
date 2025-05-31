import type { ImageData, PixelData, ColorGroup } from "../types";
import { kMeansClustering, findNearestCentroid } from "../utils/math-utils";

export class ColorQuantizer {
  private centroids: [number, number, number][] = [];
  private originalImageHash: string = "";
  private currentColorsAmt: number = 0;
  private originalImageColors: [number, number, number][] = [];
  private originalPixels: PixelData[] = [];

  constructor(imageData: ImageData, colorsAmt: number) {
    this.originalPixels = [...imageData.pixels];
    this.extractOriginalColors(imageData);
    this.calculateQuantization(colorsAmt);
  }

  private extractOriginalColors(imageData: ImageData): void {
    const uniqueColors: [number, number, number][] = [];
    const seenColors = new Set<string>();

    imageData.pixels.forEach((pixel) => {
      const colorKey = `${pixel.r},${pixel.g},${pixel.b}`;
      if (!seenColors.has(colorKey)) {
        uniqueColors.push([pixel.r, pixel.g, pixel.b]);
        seenColors.add(colorKey);
      }
    });

    this.originalImageColors = uniqueColors;
    this.originalImageHash = this.calculateHash(imageData);
  }

  private calculateHash(imageData: ImageData): string {
    // Hash basierend auf den ersten 1000 Pixeln
    return imageData.pixels
      .slice(0, 1000)
      .map((p) => `${p.r},${p.g},${p.b}`)
      .join("|");
  }

  private calculateQuantization(colorsAmt: number): void {
    this.centroids = kMeansClustering(this.originalImageColors, colorsAmt);
    this.currentColorsAmt = colorsAmt;
  }

  public getQuantizedColors(): [number, number, number][] {
    return this.centroids;
  }

  public findNearestQuantizedColor(
    color: [number, number, number]
  ): [number, number, number] {
    return findNearestCentroid(color, this.centroids);
  }

  public shouldRecalculate(imageData: ImageData, colorsAmt: number): boolean {
    // Nur neu berechnen, wenn sich das Originalbild oder die Farbanzahl ändert
    return (
      this.originalImageHash !== this.calculateHash(imageData) ||
      this.currentColorsAmt !== colorsAmt
    );
  }

  public updateSettings(imageData: ImageData, colorsAmt: number): void {
    if (this.shouldRecalculate(imageData, colorsAmt)) {
      if (this.originalImageHash !== this.calculateHash(imageData)) {
        // Nur wenn sich das Originalbild geändert hat
        this.extractOriginalColors(imageData);
      }
      this.calculateQuantization(colorsAmt);
    }
  }

  public getOriginalPixels(): PixelData[] {
    return this.originalPixels;
  }

  // Aktualisiert die quantisierten Farben und behält benutzerdefinierte Farben bei
  public static updateQuantizedColors(
    existingColorGroups: Record<string, ColorGroup>,
    newQuantizedColors: Record<string, ColorGroup>
  ): Record<string, ColorGroup> {
    const updatedColors = { ...newQuantizedColors };

    // Durchlaufe die existierenden Farbgruppen
    Object.entries(existingColorGroups).forEach(([key, group]) => {
      if (group.isCustomColor && updatedColors[key]) {
        // Behalte die benutzerdefinierte Farbe bei
        updatedColors[key] = {
          ...updatedColors[key],
          color: group.color,
          isCustomColor: true,
        };
      }
    });

    return updatedColors;
  }
}
