"use client"

import { useState, useEffect, useRef } from "react"
import ImageUploader from "@/components/image-uploader"
import RandomImageLoader from "@/components/random-image-loader"
import { LoadingAnimation } from "@/components/loading-animation"
import Preview, { ImageThumbnail } from "@/components/preview"
import SettingsPanel from "@/components/settings-panel"
import { useSettings } from "@/hooks/use-settings"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ProcessImageOptions } from "@/lib/image-processor"
import { Button } from "@/components/ui/button"
import type { ImageData, Settings } from "@/lib/types"
import { processImageWithProgress } from "@/lib/image-processor-with-progress"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Settings as SettingsIcon, X } from "lucide-react"
import {
  getStoredImage,
  saveImageToStorage,
  clearStoredImage
} from "@/lib/utils/image-storage"
import {
  saveProcessedDataToStorage,
  getStoredProcessedData,
  clearStoredProcessedData
} from "@/lib/utils/svg-storage"
import "@/lib/utils/settings-debug" // Load debug utilities
import { enablePerformanceDebugging } from "@/lib/utils/performance-profiler"

// Enable performance debugging in console on load (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  enablePerformanceDebugging();
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedData, setProcessedData] = useState<ImageData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { settings, updateSettings, updateCurveControls, resetSettings, isSettingsLoaded } = useSettings()
  const [showRandomImageLoader, setShowRandomImageLoader] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const dataRestoredRef = useRef(false) // Track if data was restored from cache
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [showProgress, setShowProgress] = useState(false)
  const [isWaitingToProcess, setIsWaitingToProcess] = useState(false)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()



  // Check localStorage on mount and load stored image or fallback to default
  useEffect(() => {
    const loadInitialImage = async () => {
      try {
        const storedImage = getStoredImage();

        if (storedImage) {
          // Try to restore cached processed data to avoid re-processing
          const cachedProcessedData = await getStoredProcessedData();

          if (cachedProcessedData) {
            dataRestoredRef.current = true;
            setProcessedData(cachedProcessedData);
            console.log('Processed data restored from cache — skipping re-processing');
          } else {
            console.log('Cache miss — will reprocess');
          }

          console.log(`Loading stored image: ${storedImage.fileName} (${(storedImage.compressedSize / 1024 / 1024).toFixed(2)}MB)`);
          setOriginalImage(storedImage.dataUrl);
          setCurrentFileName(storedImage.fileName);
          setShowRandomImageLoader(false);
        } else {
          // Fallback to default image if no stored image
          console.log('No stored image found, loading default image');
          const defaultImageUrl = "https://upload.wikimedia.org/wikipedia/commons/b/bd/La_Gioconda%2C_Leonardo_Da_Vinci.jpg";
          setOriginalImage(defaultImageUrl);
          setCurrentFileName("La_Gioconda_Leonardo_Da_Vinci.jpg");
          setShowRandomImageLoader(false);

          // Save the default image to localStorage for next time
          saveImageToStorage(defaultImageUrl, "La_Gioconda_Leonardo_Da_Vinci.jpg").catch(error => {
            console.log('Could not save default image to localStorage:', error);
          });
        }
      } catch (error) {
        console.error('Error loading initial image:', error);
        setShowRandomImageLoader(true);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadInitialImage();
  }, []);

  // Process the initial image once it's loaded and settings are loaded
  useEffect(() => {
    if (originalImage && !isInitialLoad && !processedData && isSettingsLoaded) {
      const { curveControls, visiblePaths, ...processingSettingsForEffect } = settings;
      handleProcessImage(processingSettingsForEffect as Settings);
    }
  }, [originalImage, isInitialLoad, processedData, settings, isSettingsLoaded]);

  // Process image when processing-related settings change — debounced to avoid
  // reprocessing on every slider tick during rapid dragging.
  useEffect(() => {
    if (!originalImage || !settings || isInitialLoad || !isSettingsLoaded || !processedData) return

    // Immediately show feedback that we're waiting for changes to settle if processing image on settings change
    if (!dataRestoredRef.current) {
        setIsWaitingToProcess(true)
    }

    const timerId = setTimeout(() => {
      setIsWaitingToProcess(false)
      const { curveControls, visiblePaths, ...processingSettingsForEffect } = settings;
      handleProcessImage(processingSettingsForEffect as Settings)
    }, 300) // 300ms debounce — waits until user stops dragging

    return () => {
      clearTimeout(timerId)
      setIsWaitingToProcess(false)
    }
  }, [
    originalImage,
    settings.brightnessThreshold,
    settings.minDensity,
    settings.maxDensity,
    settings.rowsCount,
    settings.columnsCount,
    settings.continuousPaths,
    settings.pathDistanceThreshold,
    settings.processingMode,
    settings.quantizationMethod,
    settings.colorsAmt,
    settings.monochromeColor,
    isInitialLoad,
    isSettingsLoaded,
    // NOTE: curveControls, visiblePaths, curvedPaths are NOT here.
    // They only affect rendering, which the WebGL renderer handles directly.
  ])

  // Save processed data when it changes
  useEffect(() => {
    if (processedData && !isProcessing) {
      saveProcessedDataToStorage(processedData);
    }
  }, [processedData, isProcessing]);

  const handleManualImageUpload = async (imageDataUrl: string, fileName: string) => {
    try {
      await saveImageToStorage(imageDataUrl, fileName);
      console.log(`Saved image to localStorage: ${fileName}`);

      setOriginalImage(imageDataUrl)
      setCurrentFileName(fileName)
      setShowRandomImageLoader(false)
    } catch (error) {
      console.error('Failed to save image to localStorage:', error);
      setOriginalImage(imageDataUrl)
      setCurrentFileName(fileName)
      setShowRandomImageLoader(false)
    }
  }

  const handleImageSelectedFromRandomLoader = async (imageUrl: string, fileName?: string) => {
    try {
      const finalFileName = fileName || new URL(imageUrl).pathname.split('/').pop() || 'random_image.jpg';
      await saveImageToStorage(imageUrl, finalFileName);
      console.log(`Saved random image to localStorage: ${finalFileName}`);

      setOriginalImage(imageUrl)
      setCurrentFileName(finalFileName)
      setShowRandomImageLoader(false)
    } catch (error) {
      console.error('Failed to save random image to localStorage:', error);
      setOriginalImage(imageUrl)
      setCurrentFileName(fileName)
      setShowRandomImageLoader(false)
    }
  }

  const handleCancelRandomImageLoad = () => {
    setShowRandomImageLoader(false)
  }

  const handleNewImageUpload = () => {
    setIsSettingsPanelVisible(false)
    setProcessedData(null)
    setShowRandomImageLoader(true)

    // Clear the stored image and cached data since user is explicitly uploading a new one
    clearStoredImage()
    clearStoredProcessedData()
    console.log('Cleared stored image and cached data for new upload')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (!file.type.match("image.*")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          try {
            await saveImageToStorage(e.target.result, file.name);
            console.log(`Saved uploaded file to localStorage: ${file.name}`);
          } catch (error) {
            console.error('Failed to save uploaded file to localStorage:', error);
          }

          handleProcessImage({
            imageDataUrl: e.target.result,
            fileName: file.name
          } as ProcessImageOptions)

          setOriginalImage(e.target.result)
          setCurrentFileName(file.name)

          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProcessImage = async (input: ProcessImageOptions | Settings) => {
    if (!originalImage) return

    // Skip processing if we already have cached data from a previous session
    if (dataRestoredRef.current) {
      dataRestoredRef.current = false;
      console.log('Skipping processing — using cached data');
      setIsProcessing(false);
      setShowProgress(false);
      return;
    }

    isCancelledRef.current = false;

    // Stash previous valid state for fallback on cancellation
    const previousProcessedData = processedData;

    setIsProcessing(true)
    setShowProgress(true)
    setProcessingProgress(0)
    setProcessingStatus("Initializing...")

    try {
      const imageOptions: ProcessImageOptions = 'imageDataUrl' in input
        ? input
        : {
          imageDataUrl: originalImage,
          fileName: currentFileName,
          ...(originalImage.includes('wikimedia.org') && {
            fileName: currentFileName || new URL(originalImage).pathname.split('/').pop(),
            sourceUrl: originalImage
          })
        };

      const processingSettings = 'imageDataUrl' in input ? settings : input as Settings;

      // Process with progress updates (0-100% — no SVG generation step now!)
      const imageData = await processImageWithProgress(
        imageOptions,
        processingSettings,
        (progress, status) => {
          if (isCancelledRef.current) return true;
          setProcessingProgress(progress)
          setProcessingStatus(status)
          return false
        }
      )

      // Initialize visibility for all color groups
      if (imageData.colorGroups) {
        const newVisiblePaths: Record<string, boolean> = {}
        Object.keys(imageData.colorGroups).forEach((colorKey) => {
          newVisiblePaths[colorKey] =
            settings.visiblePaths[colorKey] !== undefined ? settings.visiblePaths[colorKey] : true
        })

        if (JSON.stringify(newVisiblePaths) !== JSON.stringify(settings.visiblePaths)) {
          updateSettings({ visiblePaths: newVisiblePaths })
        }
      }

      setProcessedData(imageData)
      setProcessingProgress(100)
      setProcessingStatus("Complete!")
    } catch (error) {
      if (error instanceof Error && error.message === "Processing cancelled") {
        console.log("Processing was cancelled. Falling back to previous state.");
        setProcessedData(previousProcessedData);
        return;
      }
      console.error("Error processing image:", error)
    } finally {
      setIsProcessing(false)
      setShowProgress(false)
    }
  }

  const handleCancelProcessing = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setShowProgress(false);
  }

  const handleClearCache = () => {
    resetSettings()
    clearStoredProcessedData()
    setProcessedData(null)
    dataRestoredRef.current = false
    console.log('Cleared cache data (kept original image)')
  }

  const handleSettingsChange = (newSettingsPatch: Partial<Settings>) => {
    updateSettings(newSettingsPatch);

    // If colorGroups were part of the update patch, update processedData directly
    if (newSettingsPatch.colorGroups) {
      setProcessedData(prevProcessedData => {
        if (!prevProcessedData) {
          console.warn("Attempted to update colorGroups on null processedData.");
          return prevProcessedData;
        }
        return {
          ...prevProcessedData,
          colorGroups: newSettingsPatch.colorGroups,
        };
      });
    }
  }

  const handleCurveControlsChange = (newCurveControls: Partial<typeof settings.curveControls>) => {
    updateCurveControls(newCurveControls)
  }

  const toggleSettingsPanel = () => {
    setIsSettingsPanelVisible(prev => !prev)
  }

  return (
    <main className="min-h-screen bg-gray-800 text-gray-100 no-scrollbar">
      <div className="max-w-7xl mx-auto py-8 px-3 md:px-4">
        {/* Mobile settings menu button */}
        {originalImage && !showRandomImageLoader && !isSettingsPanelVisible && (
          <div className="fixed top-4 right-4 z-50 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSettingsPanel}
              aria-label="Toggle settings panel"
              className="backdrop-blur hover:text-purple-400 "
            >
              <SettingsIcon className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Hidden file input for new image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Overlay for mobile when settings panel is open */}
        {originalImage && isSettingsPanelVisible && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSettingsPanel}
            aria-hidden="true"
          />
        )}

        <div className={`grid grid-cols-1 ${(originalImage && !showRandomImageLoader) ? 'lg:grid-cols-4' : ''} gap-6 relative `}>
          <div className={`${(originalImage && !showRandomImageLoader) ? 'lg:col-span-3' : 'col-span-1'}`}>
            {showRandomImageLoader && (
              <div className={`flex flex-col w-full  gap-8 ${originalImage ? 'lg:flex-col' : 'lg:flex-row'} justify-center items-center mb-12`}>


                <ImageUploader onImageUpload={handleManualImageUpload} />
                <div className="w-full text-center lg:hidden">
                  <p className="text-gray-300 text-sm mb-2">Otherwhise</p>
                </div>
                <RandomImageLoader
                  onImageSelected={handleImageSelectedFromRandomLoader}
                  onCancel={handleCancelRandomImageLoad}
                />

              </div>
            )}

            {!showRandomImageLoader && !originalImage && (
              isInitialLoad ? (
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-xl border-gray-700 bg-gray-900/50">
                  <LoadingAnimation className="w-full max-w-md h-auto px-8" />
                </div>
              ) : (
                <ImageUploader onImageUpload={handleManualImageUpload} />
              )
            )}

            {!showRandomImageLoader && originalImage && (
              <div className="sticky top-16 z-10 overflow-hidden">
                <Preview
                  originalImage={originalImage!}
                  processedData={processedData}
                  isProcessing={isProcessing || isWaitingToProcess}
                  processingProgress={isWaitingToProcess ? 0 : processingProgress}
                  processingStatus={isWaitingToProcess ? "Pending changes..." : processingStatus}
                  onNewImageUpload={handleNewImageUpload}
                  onRemoveImage={handleNewImageUpload}
                  settings={settings}
                />
              </div>
            )}
          </div>

          {/* Settings panel and its associated close button */}
          {!showRandomImageLoader && originalImage && (<>
            <div className={`
              ${isSettingsPanelVisible ? 'block' : 'hidden lg:block'}
              ${isSettingsPanelVisible
                ? 'fixed inset-0 z-50 overflow-y-auto bg-gray-900/98 backdrop-blur-xl'
                : 'lg:bg-gray-800/40 lg:backdrop-blur-md lg:border lg:border-gray-700 lg:rounded-2xl lg:shadow-2xl lg:ring-1 lg:ring-white/5 lg:px-2'
              }
              lg:static lg:z-auto lg:overflow-visible lg:w-auto no-scrollbar
            `}
            >

              <div className="space-y-6 mb-20  lg:mt-0 ">
                {/* Add image thumbnail preview above settings panel */}
                <ImageThumbnail
                  originalImage={originalImage}
                  processedData={processedData}
                  onNewImageUpload={handleNewImageUpload}
                  onRemoveImage={handleNewImageUpload}
                  toggleSettingsPanel={toggleSettingsPanel}
                  settings={settings}
                />
                <TooltipProvider>
                  <SettingsPanel
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    disabled={isProcessing}
                    curveControls={settings.curveControls}
                    onCurveControlsChange={handleCurveControlsChange}
                    processedData={processedData}
                    onResetSettings={resetSettings}
                    onClearCache={handleClearCache}
                  />
                </TooltipProvider>
              </div>
            </div>
            {/* Close button - only visible on mobile */}
            {isSettingsPanelVisible && (
              <div className="fixed top-4 right-4 z-50 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSettingsPanel}
                  aria-label="Close settings panel"
                  className="p-2 backdrop-blur hover:text-red-400"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            )}
          </>)}
        </div>
      </div>
    </main>
  )
}
