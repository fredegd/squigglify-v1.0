/**
 * Utility functions for debugging settings in localStorage
 */

const SETTINGS_STORAGE_KEY = "settings";

/**
 * Logs the current settings stored in localStorage
 */
export function logStoredSettings(): void {
  try {
    const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settings) {
      console.log("Current stored settings:", JSON.parse(settings));
    } else {
      console.log("No settings found in localStorage");
    }
  } catch (error) {
    console.error("Error reading settings from localStorage:", error);
  }
}

/**
 * Clears all settings from localStorage (for debugging purposes)
 */
export function clearStoredSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    console.log("Settings cleared from localStorage");
  } catch (error) {
    console.error("Error clearing settings from localStorage:", error);
  }
}

/**
 * Checks if settings exist in localStorage
 */
export function hasStoredSettings(): boolean {
  try {
    return localStorage.getItem(SETTINGS_STORAGE_KEY) !== null;
  } catch (error) {
    console.error("Error checking for stored settings:", error);
    return false;
  }
}

// Make functions available globally for browser console debugging
if (typeof window !== "undefined") {
  (window as any).settingsDebug = {
    log: logStoredSettings,
    clear: clearStoredSettings,
    has: hasStoredSettings,
  };
}
