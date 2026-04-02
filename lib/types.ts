export type ProcessingMode = "grayscale" | "posterize" | "monochrome";

export type CurveMode = "curved" | "squared" | "zigzag";

export interface CurveControlSettings {
  // Simplified curve control parameters for the new implementation
  junctionContinuityFactor: number; // Controls the smoothness of curves (used as smoothness param)
  tileHeightScale: number; // Scale factor for tile height (0-1)
  strokeWidth: number; // Add strokeWidth property
  handleRotationAngle?: number; // Optional: Default handle rotation angle in degrees
  lowerKnotXShift?: number; // Optional: Shifts the X coordinate of lower knot points
  upperKnotShiftFactor?: number; // Optional: Factor to apply random X/Y shift to upper knot points (0-1)
  disorganizeFactor?: number; // Optional: Factor to apply random X/Y shift to each point in a path (0-1)
  rowWaveShift?: number; // Optional: Factor for row-based wave shift (-1 to 1)
  columnWaveShift?: number; // Optional: Factor for column wave shift (-1 to 1)
  waveShiftFrequency?: number; // Optional: Frequency multiplier for wave calculations (0.5 to 5.0)
  matchDensity?: boolean; // Optional: If true, tile height is multiplied by a factor based on density
  matchDensityMultiplier?: number; // Optional: Multiplier for tile height based on density (0-1)
}

export interface Settings {
  brightnessThreshold: number;
  minDensity: number;
  maxDensity: number;
  rowsCount: number;
  columnsCount: number;
  continuousPaths: boolean;
  curveMode: CurveMode;
  pathDistanceThreshold: number;
  processingMode: ProcessingMode;
  quantizationMethod: "kmeans" | "median-cut";
  colorsAmt: number;
  monochromeColor: string;
  visiblePaths: Record<string, boolean>;
  curveControls: CurveControlSettings;
  colorGroups?: Record<string, ColorGroup>;
}

// Default values for the curve controls
export const DEFAULT_CURVE_CONTROLS: CurveControlSettings = {
  junctionContinuityFactor: 0.15, // Default smoothness factor for curves
  tileHeightScale: 0.9, // Default tile height scale (1.0 = 100% of original height)
  strokeWidth: 1.5, // Default stroke width
  handleRotationAngle: 0, // Default handle rotation angle in degrees
  lowerKnotXShift: 0, // Default X shift for lower knot points
  upperKnotShiftFactor: 0.0, // Default factor for upper knot random shift
  disorganizeFactor: 0.0, // Default factor for the new disorganize effect
  rowWaveShift: 0.0, // Default factor for row wave shift
  columnWaveShift: 0.0, // Default factor for column wave shift
  waveShiftFrequency: 2.0, // Default frequency multiplier for wave calculations
  matchDensity: false, // Default: do not match density
  matchDensityMultiplier: 0.5, // Default multiplier 0.5 (50% height at min density)
};

export interface HoopPreset {
  label: string;
  widthMm: number;
  heightMm: number;
}

export const HOOP_PRESETS: HoopPreset[] = [
  { label: '4×4" (100×100mm)', widthMm: 100, heightMm: 100 },
  { label: '5×7" (130×180mm)', widthMm: 130, heightMm: 180 },
  { label: '6×10" (160×260mm)', widthMm: 160, heightMm: 260 },
  { label: '8×8" (200×200mm)', widthMm: 200, heightMm: 200 },
];

export interface EmbroiderySettings {
  hoopWidth: number;   // mm
  hoopHeight: number;  // mm
  stitchLength: number; // mm (max distance between stitch points)
  jumpThreshold: number; // mm (distance triggering a jump stitch)
  fitToHoop: boolean;
}

export const DEFAULT_EMBROIDERY_SETTINGS: EmbroiderySettings = {
  hoopWidth: 100,
  hoopHeight: 100,
  stitchLength: 2.5,
  jumpThreshold: 3.0,
  fitToHoop: true,
};

export interface PixelData {
  x: number;
  y: number;
  brightness: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ImageData {
  width: number;
  height: number;
  pixels: PixelData[];
  originalWidth: number;
  originalHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  outputWidth: number;
  outputHeight: number;
  columnsCount: number;
  rowsCount: number;
  tileWidth: number;
  tileHeight: number;
  colorGroups?: Record<string, ColorGroup>;
  fileName?: string; // Name of the uploaded file
  sourceUrl?: string; // URL to source (for Wiki Commons images)
}

export interface PathPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  row: number;
  column?: number; // Add column information for wave calculations
  direction: number;
  randomUpperKnotShiftX?: number; // Pre-calculated random X shift for upper knots
  randomUpperKnotShiftY?: number; // Pre-calculated random Y shift for upper knots
}

export interface ColorGroup {
  color: string;
  displayName: string;
  points: PathPoint[];
  pathData?: string;
  hue: number; // Farbton für die Sortierung im "posterize"-Modus
  brightness: number; // Helligkeit für die Sortierung im "grayscale"-Modus
  isCustomColor?: boolean; // Flag für benutzerdefinierte Farben
}
