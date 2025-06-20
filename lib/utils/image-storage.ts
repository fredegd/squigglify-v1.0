interface StoredImageData {
  dataUrl: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
}

// Maximum size for localStorage in bytes (2MB limit to be safe)
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB
const STORAGE_KEY = "input_image";

/**
 * Converts a URL to a data URL by loading the image and drawing it to canvas
 */
function urlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      } catch (error) {
        reject(new Error("Could not convert image to data URL: " + error));
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image from URL"));
    };

    img.src = url;
  });
}

/**
 * Compresses an image by reducing quality and/or dimensions
 */
function compressImage(
  imageDataUrl: string,
  maxSizeBytes: number = MAX_STORAGE_SIZE,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels until we get under the size limit
      let currentQuality = quality;
      let compressedDataUrl = canvas.toDataURL("image/jpeg", currentQuality);

      // Calculate approximate size (base64 encoding adds ~33% overhead)
      let approximateSize = (compressedDataUrl.length * 3) / 4;

      while (approximateSize > maxSizeBytes && currentQuality > 0.1) {
        currentQuality -= 0.1;
        compressedDataUrl = canvas.toDataURL("image/jpeg", currentQuality);
        approximateSize = (compressedDataUrl.length * 3) / 4;
      }

      if (approximateSize > maxSizeBytes) {
        // If still too large, try reducing dimensions further
        const scaleFactor = Math.sqrt(maxSizeBytes / approximateSize);
        canvas.width = Math.floor(width * scaleFactor);
        canvas.height = Math.floor(height * scaleFactor);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      }

      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    img.src = imageDataUrl;
  });
}

/**
 * Saves an image to localStorage with compression if needed
 * Handles both data URLs and regular URLs
 */
export async function saveImageToStorage(
  imageDataUrl: string,
  fileName: string
): Promise<void> {
  try {
    console.log("Attempting to save image to localStorage:", {
      fileName,
      isDataUrl: imageDataUrl.startsWith("data:"),
    });

    let finalDataUrl = imageDataUrl;

    // If it's a regular URL, convert it to data URL first
    if (!imageDataUrl.startsWith("data:")) {
      console.log("Converting URL to data URL...");
      finalDataUrl = await urlToDataUrl(imageDataUrl);
      console.log("Successfully converted URL to data URL");
    }

    // Calculate original size
    const originalSize = (finalDataUrl.length * 3) / 4;
    console.log(
      `Original image size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`
    );

    let compressedSize = originalSize;

    // Compress if the image is too large
    if (originalSize > MAX_STORAGE_SIZE) {
      console.log(
        `Image too large (${(originalSize / 1024 / 1024).toFixed(
          2
        )}MB), compressing...`
      );
      finalDataUrl = await compressImage(finalDataUrl, MAX_STORAGE_SIZE);
      compressedSize = (finalDataUrl.length * 3) / 4;
      console.log(
        `Compressed to ${(compressedSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const imageData: StoredImageData = {
      dataUrl: finalDataUrl,
      fileName,
      originalSize,
      compressedSize,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(imageData));
    console.log("Successfully saved image to localStorage");
  } catch (error) {
    console.error("Failed to save image to localStorage:", error);
    throw error;
  }
}

/**
 * Retrieves the stored image from localStorage
 */
export function getStoredImage(): StoredImageData | null {
  try {
    console.log("Checking localStorage for stored image...");
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log("No stored image found in localStorage");
      return null;
    }

    const imageData: StoredImageData = JSON.parse(stored);
    console.log("Found stored image:", {
      fileName: imageData.fileName,
      size: `${(imageData.compressedSize / 1024 / 1024).toFixed(2)}MB`,
    });

    // Check if the stored image is older than 7 days (optional cleanup)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (imageData.timestamp < weekAgo) {
      console.log("Stored image is older than 7 days, removing...");
      clearStoredImage();
      return null;
    }

    return imageData;
  } catch (error) {
    console.error("Failed to retrieve stored image:", error);
    return null;
  }
}

/**
 * Clears the stored image from localStorage
 */
export function clearStoredImage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Cleared stored image from localStorage");
  } catch (error) {
    console.error("Failed to clear stored image:", error);
  }
}

/**
 * Checks if there's a stored image available
 */
export function hasStoredImage(): boolean {
  return getStoredImage() !== null;
}

/**
 * Gets the size of the stored image in bytes
 */
export function getStoredImageSize(): number {
  const imageData = getStoredImage();
  return imageData ? imageData.compressedSize : 0;
}
