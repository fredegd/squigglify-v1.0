/**
 * URL Config Utilities
 * 
 * Utilities for serializing/deserializing Squigglify settings to/from URL query parameters.
 * Enables sharing configurations via URLs for testing and quick recall.
 */

import type { Settings, CurveControlSettings, ProcessingMode } from "@/lib/types";
import { DEFAULT_CURVE_CONTROLS } from "@/lib/types";

// Parameter name mappings (abbreviated for shorter URLs)
const PARAM_MAP = {
    mode: "processingMode",
    rows: "rowsCount",
    cols: "columnsCount",
    bright: "brightnessThreshold",
    minD: "minDensity",
    maxD: "maxDensity",
    cont: "continuousPaths",
    curved: "curvedPaths",
    dist: "pathDistanceThreshold",
    colors: "colorsAmt",
    monoColor: "monochromeColor",
    curve: "curveControls",
} as const;

// Reverse mapping for serialization
const REVERSE_PARAM_MAP = Object.fromEntries(
    Object.entries(PARAM_MAP).map(([short, full]) => [full, short])
) as Record<string, string>;

// Valid processing modes
const VALID_MODES: ProcessingMode[] = ["grayscale", "posterize", "monochrome"];

// Curve control parameter mappings (abbreviated)
const CURVE_PARAM_MAP = {
    jcf: "junctionContinuityFactor",
    ths: "tileHeightScale",
    sw: "strokeWidth",
    hra: "handleRotationAngle",
    lkxs: "lowerKnotXShift",
    uksf: "upperKnotShiftFactor",
    df: "disorganizeFactor",
    rws: "rowWaveShift",
    cws: "columnWaveShift",
    wsf: "waveShiftFrequency",
} as const;

const REVERSE_CURVE_MAP = Object.fromEntries(
    Object.entries(CURVE_PARAM_MAP).map(([short, full]) => [full, short])
) as Record<string, string>;

/**
 * Serialize curve controls to compact string
 */
function serializeCurveControls(curveControls: CurveControlSettings): string {
    const abbreviated: Record<string, number> = {};

    for (const [fullKey, value] of Object.entries(curveControls)) {
        const shortKey = REVERSE_CURVE_MAP[fullKey];
        if (shortKey && value !== undefined && value !== DEFAULT_CURVE_CONTROLS[fullKey as keyof CurveControlSettings]) {
            abbreviated[shortKey] = value;
        }
    }

    // Only return if there are non-default values
    if (Object.keys(abbreviated).length === 0) return "";

    return JSON.stringify(abbreviated);
}

/**
 * Deserialize curve controls from compact string
 */
function deserializeCurveControls(encoded: string): Partial<CurveControlSettings> | null {
    try {
        const abbreviated = JSON.parse(encoded) as Record<string, number>;
        const curveControls: Partial<CurveControlSettings> = {};

        for (const [shortKey, value] of Object.entries(abbreviated)) {
            const fullKey = CURVE_PARAM_MAP[shortKey as keyof typeof CURVE_PARAM_MAP];
            if (fullKey && typeof value === "number") {
                (curveControls as Record<string, number>)[fullKey] = value;
            }
        }

        return curveControls;
    } catch {
        return null;
    }
}

/**
 * Validate and clamp numeric values to reasonable bounds
 */
function validateNumericBounds(key: string, value: number): number {
    const bounds: Record<string, { min: number; max: number }> = {
        rowsCount: { min: 4, max: 200 },
        columnsCount: { min: 4, max: 200 },
        brightnessThreshold: { min: 0, max: 255 },
        minDensity: { min: 1, max: 20 },
        maxDensity: { min: 1, max: 20 },
        pathDistanceThreshold: { min: 1, max: 100 },
        colorsAmt: { min: 2, max: 16 },
    };

    const bound = bounds[key];
    if (bound) {
        return Math.max(bound.min, Math.min(bound.max, value));
    }
    return value;
}

/**
 * Serialize settings to URL query string
 */
export function serializeSettingsToUrl(settings: Partial<Settings>): string {
    const params = new URLSearchParams();

    // Serialize main settings
    for (const [fullKey, value] of Object.entries(settings)) {
        const shortKey = REVERSE_PARAM_MAP[fullKey];

        if (!shortKey || value === undefined) continue;

        // Skip complex objects that need special handling
        if (fullKey === "curveControls") {
            const curveStr = serializeCurveControls(value as CurveControlSettings);
            if (curveStr) {
                params.set(shortKey, curveStr);
            }
            continue;
        }

        // Skip visiblePaths and colorGroups (too complex for URL, and session-dependent)
        if (fullKey === "visiblePaths" || fullKey === "colorGroups") {
            continue;
        }

        // Handle different types
        if (typeof value === "boolean") {
            params.set(shortKey, value ? "1" : "0");
        } else if (typeof value === "number") {
            params.set(shortKey, String(value));
        } else if (typeof value === "string") {
            // For colors, remove # prefix
            if (fullKey === "monochromeColor" && value.startsWith("#")) {
                params.set(shortKey, value.slice(1));
            } else {
                params.set(shortKey, value);
            }
        }
    }

    return params.toString();
}

/**
 * Deserialize settings from URL search params
 */
export function deserializeSettingsFromUrl(searchParams: URLSearchParams): Partial<Settings> | null {
    if (searchParams.toString() === "") return null;

    const settings: Partial<Settings> = {};
    let hasValidParams = false;

    for (const [shortKey, value] of searchParams.entries()) {
        const fullKey = PARAM_MAP[shortKey as keyof typeof PARAM_MAP];
        if (!fullKey) continue;

        hasValidParams = true;

        // Handle curve controls
        if (fullKey === "curveControls") {
            const curveControls = deserializeCurveControls(value);
            if (curveControls) {
                settings.curveControls = {
                    ...DEFAULT_CURVE_CONTROLS,
                    ...curveControls,
                };
            }
            continue;
        }

        // Handle processing mode
        if (fullKey === "processingMode") {
            if (VALID_MODES.includes(value as ProcessingMode)) {
                settings.processingMode = value as ProcessingMode;
            }
            continue;
        }

        // Handle booleans
        if (fullKey === "continuousPaths" || fullKey === "curvedPaths") {
            settings[fullKey] = value === "1" || value === "true";
            continue;
        }

        // Handle color
        if (fullKey === "monochromeColor") {
            // Add # prefix if missing
            settings.monochromeColor = value.startsWith("#") ? value : `#${value}`;
            continue;
        }

        // Handle numeric values
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const validated = validateNumericBounds(fullKey, numValue);
            (settings as Record<string, number>)[fullKey] = validated;
        }
    }

    return hasValidParams ? settings : null;
}

/**
 * Generate a complete shareable URL with settings
 */
export function generateConfigUrl(settings: Settings, baseUrl?: string): string {
    const queryString = serializeSettingsToUrl(settings);
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin + "/generator" : "/generator");

    return queryString ? `${base}?${queryString}` : base;
}

/**
 * Copy config URL to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyConfigUrlToClipboard(settings: Settings): Promise<boolean> {
    try {
        const url = generateConfigUrl(settings);
        await navigator.clipboard.writeText(url);
        return true;
    } catch (error) {
        console.error("Failed to copy URL to clipboard:", error);
        return false;
    }
}

/**
 * Parse URL config from current browser location
 */
export function getUrlSettings(): Partial<Settings> | null {
    if (typeof window === "undefined") return null;

    const searchParams = new URLSearchParams(window.location.search);
    return deserializeSettingsFromUrl(searchParams);
}
