import { ColorGroup } from "../types";

// Convert RGB to hex color
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// Convert a single color component to hex
export function componentToHex(c: number): string {
  const hex = Math.round(c).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

// Convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

// Calculate hue for sorting
export function calculateHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;

  if (max === min) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / (max - min)) * 60;
  } else if (max === g) {
    hue = ((b - r) / (max - min)) * 60 + 120;
  } else {
    hue = ((r - g) / (max - min)) * 60 + 240;
  }

  return (hue + 360) % 360;
}

// Calculate brightness for sorting
export function calculateBrightness(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Calculate hue and brightness for color groups
export function calculateHueAndBrightness(
  colorGroups: Record<string, ColorGroup>
): Record<string, ColorGroup> {
  return Object.fromEntries(
    Object.entries(colorGroups).map(([key, group]) => {
      const { r, g, b } = hexToRgb(group.color);
      const hue = calculateHue(r, g, b);
      const brightness = calculateBrightness(r, g, b);
      return [key, { ...group, hue, brightness }];
    })
  );
}
