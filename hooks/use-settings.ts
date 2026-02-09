import { useState, useEffect, useCallback } from "react";
import type { Settings, CurveControlSettings } from "@/lib/types";
import { DEFAULT_CURVE_CONTROLS } from "@/lib/types";
import { getUrlSettings } from "@/lib/utils/url-config";

// Default settings values
const DEFAULT_SETTINGS: Settings = {
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
};

const SETTINGS_STORAGE_KEY = "settings";

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateCurveControls: (
    newCurveControls: Partial<CurveControlSettings>
  ) => void;
  resetSettings: () => void;
  isSettingsLoaded: boolean;
  settingsSource: "default" | "localStorage" | "url";
}

/**
 * Unified settings management hook with localStorage persistence
 * Handles all app settings including curve controls with automatic save/load
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [settingsSource, setSettingsSource] = useState<"default" | "localStorage" | "url">("default");

  // Load settings on mount: URL params > localStorage > defaults
  useEffect(() => {
    try {
      // Start with defaults
      let mergedSettings: Settings = { ...DEFAULT_SETTINGS };
      let source: "default" | "localStorage" | "url" = "default";

      // Layer 1: Load from localStorage
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Settings;
        mergedSettings = {
          ...mergedSettings,
          ...parsedSettings,
          curveControls: {
            ...DEFAULT_CURVE_CONTROLS,
            ...parsedSettings.curveControls,
          },
        };
        source = "localStorage";
      }

      // Layer 2: URL params override everything (highest priority)
      const urlSettings = getUrlSettings();
      if (urlSettings) {
        mergedSettings = {
          ...mergedSettings,
          ...urlSettings,
          curveControls: {
            ...mergedSettings.curveControls,
            ...urlSettings.curveControls,
          },
        };
        source = "url";
        console.log("Settings loaded from URL:", urlSettings);
      }

      setSettings(mergedSettings);
      setSettingsSource(source);
      console.log(`Settings loaded from ${source}:`, mergedSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsSettingsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((settingsToSave: Settings) => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settingsToSave)
      );
      // console.log('Settings saved to localStorage')
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }, []);

  // Update settings function
  const updateSettings = useCallback(
    (newSettings: Partial<Settings>) => {
      setSettings((prevSettings) => {
        let updatedSettings = { ...prevSettings, ...newSettings };

        // If processing mode changes, reset visiblePaths
        if (
          newSettings.processingMode &&
          newSettings.processingMode !== prevSettings.processingMode
        ) {
          updatedSettings = { ...updatedSettings, visiblePaths: {} };
        }

        // Save to localStorage
        saveSettings(updatedSettings);

        return updatedSettings;
      });
    },
    [saveSettings]
  );

  // Update curve controls function
  const updateCurveControls = useCallback(
    (newCurveControls: Partial<CurveControlSettings>) => {
      setSettings((prevSettings) => {
        const updatedSettings = {
          ...prevSettings,
          curveControls: {
            ...prevSettings.curveControls,
            ...newCurveControls,
          },
        };

        // Save to localStorage
        saveSettings(updatedSettings);

        return updatedSettings;
      });
    },
    [saveSettings]
  );

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      console.log("Settings reset to defaults and cleared from localStorage");
    } catch (error) {
      console.error("Failed to clear settings from localStorage:", error);
    }
  }, []);

  return {
    settings,
    updateSettings,
    updateCurveControls,
    resetSettings,
    isSettingsLoaded,
    settingsSource,
  };
}
