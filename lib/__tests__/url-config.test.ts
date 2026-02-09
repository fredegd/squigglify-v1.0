import { describe, expect, it } from "bun:test";
import {
    serializeSettingsToUrl,
    deserializeSettingsFromUrl,
    generateConfigUrl,
} from "../utils/url-config";
import type { Settings } from "../types";
import { DEFAULT_CURVE_CONTROLS } from "../types";

// Minimal test settings
const createTestSettings = (overrides: Partial<Settings> = {}): Settings => ({
    brightnessThreshold: 255,
    minDensity: 2,
    maxDensity: 5,
    rowsCount: 36,
    columnsCount: 24,
    continuousPaths: true,
    curvedPaths: true,
    pathDistanceThreshold: 25,
    processingMode: "posterize",
    colorsAmt: 5,
    monochromeColor: "#000000",
    visiblePaths: {},
    curveControls: DEFAULT_CURVE_CONTROLS,
    ...overrides,
});

describe("URL Config Utilities", () => {
    describe("serializeSettingsToUrl", () => {
        it("should serialize basic settings to query string", () => {
            const settings = createTestSettings({
                processingMode: "grayscale",
                rowsCount: 48,
                columnsCount: 32,
            });

            const queryString = serializeSettingsToUrl(settings);

            expect(queryString).toContain("mode=grayscale");
            expect(queryString).toContain("rows=48");
            expect(queryString).toContain("cols=32");
        });

        it("should handle boolean values", () => {
            const settings = createTestSettings({
                continuousPaths: false,
                curvedPaths: true,
            });

            const queryString = serializeSettingsToUrl(settings);

            expect(queryString).toContain("cont=0");
            expect(queryString).toContain("curved=1");
        });

        it("should encode monochrome color without # prefix", () => {
            const settings = createTestSettings({
                monochromeColor: "#FF5500",
            });

            const queryString = serializeSettingsToUrl(settings);

            expect(queryString).toContain("monoColor=FF5500");
            expect(queryString).not.toContain("#");
        });

        it("should serialize non-default curve controls", () => {
            const settings = createTestSettings({
                curveControls: {
                    ...DEFAULT_CURVE_CONTROLS,
                    junctionContinuityFactor: 0.35,
                    strokeWidth: 2.5,
                },
            });

            const queryString = serializeSettingsToUrl(settings);

            expect(queryString).toContain("curve=");
            // The curve parameter should contain JSON with abbreviated keys
            const params = new URLSearchParams(queryString);
            const curveParam = params.get("curve");
            expect(curveParam).toBeTruthy();
            const parsed = JSON.parse(curveParam!);
            expect(parsed.jcf).toBe(0.35);
            expect(parsed.sw).toBe(2.5);
        });

        it("should not include default curve controls", () => {
            const settings = createTestSettings(); // Uses DEFAULT_CURVE_CONTROLS

            const queryString = serializeSettingsToUrl(settings);

            // curve param should be absent or empty when all values are defaults
            expect(queryString).not.toContain("curve=");
        });
    });

    describe("deserializeSettingsFromUrl", () => {
        it("should parse basic settings from query string", () => {
            const params = new URLSearchParams("mode=monochrome&rows=60&cols=40");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings).not.toBeNull();
            expect(settings?.processingMode).toBe("monochrome");
            expect(settings?.rowsCount).toBe(60);
            expect(settings?.columnsCount).toBe(40);
        });

        it("should handle boolean values as 1/0", () => {
            const params = new URLSearchParams("cont=0&curved=1");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings?.continuousPaths).toBe(false);
            expect(settings?.curvedPaths).toBe(true);
        });

        it("should handle boolean values as true/false", () => {
            const params = new URLSearchParams("cont=false&curved=true");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings?.continuousPaths).toBe(false);
            expect(settings?.curvedPaths).toBe(true);
        });

        it("should add # prefix to monochrome color", () => {
            const params = new URLSearchParams("monoColor=FF5500");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings?.monochromeColor).toBe("#FF5500");
        });

        it("should validate numeric bounds", () => {
            const params = new URLSearchParams("rows=500&cols=-10");

            const settings = deserializeSettingsFromUrl(params);

            // Values should be clamped to valid bounds
            expect(settings?.rowsCount).toBe(200); // max is 200
            expect(settings?.columnsCount).toBe(4); // min is 4
        });

        it("should ignore invalid processing mode", () => {
            const params = new URLSearchParams("mode=invalid&rows=50");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings?.processingMode).toBeUndefined();
            expect(settings?.rowsCount).toBe(50);
        });

        it("should return null for empty params", () => {
            const params = new URLSearchParams("");

            const settings = deserializeSettingsFromUrl(params);

            expect(settings).toBeNull();
        });

        it("should parse curve controls from JSON", () => {
            const curveJson = JSON.stringify({ jcf: 0.3, sw: 2.0 });
            const params = new URLSearchParams(`curve=${encodeURIComponent(curveJson)}`);

            const settings = deserializeSettingsFromUrl(params);

            expect(settings?.curveControls?.junctionContinuityFactor).toBe(0.3);
            expect(settings?.curveControls?.strokeWidth).toBe(2.0);
        });
    });

    describe("round-trip serialization", () => {
        it("should preserve settings through serialize/deserialize", () => {
            const original = createTestSettings({
                processingMode: "grayscale",
                rowsCount: 50,
                columnsCount: 35,
                minDensity: 3,
                maxDensity: 8,
                continuousPaths: false,
                curvedPaths: true,
                monochromeColor: "#123456",
            });

            const queryString = serializeSettingsToUrl(original);
            const params = new URLSearchParams(queryString);
            const restored = deserializeSettingsFromUrl(params);

            expect(restored?.processingMode).toBe(original.processingMode);
            expect(restored?.rowsCount).toBe(original.rowsCount);
            expect(restored?.columnsCount).toBe(original.columnsCount);
            expect(restored?.minDensity).toBe(original.minDensity);
            expect(restored?.maxDensity).toBe(original.maxDensity);
            expect(restored?.continuousPaths).toBe(original.continuousPaths);
            expect(restored?.curvedPaths).toBe(original.curvedPaths);
            expect(restored?.monochromeColor).toBe(original.monochromeColor);
        });
    });

    describe("generateConfigUrl", () => {
        it("should generate a complete URL with settings", () => {
            const settings = createTestSettings({ processingMode: "posterize", rowsCount: 40 });

            const url = generateConfigUrl(settings, "https://example.com/generator");

            expect(url).toContain("https://example.com/generator?");
            expect(url).toContain("mode=posterize");
            expect(url).toContain("rows=40");
        });

        it("should return base URL when no settings differ", () => {
            const settings = createTestSettings();

            // All default settings still serialize to something, so this should have params
            const url = generateConfigUrl(settings, "https://example.com/generator");

            expect(url).toContain("https://example.com/generator");
        });
    });
});
