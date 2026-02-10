"use client"

import { useState, useEffect, useRef } from "react"
import ImageUploader from "@/components/image-uploader"
import RandomImageLoader from "@/components/random-image-loader"
import Preview, { ImageThumbnail } from "@/components/preview"
import SettingsPanel from "@/components/settings-panel"
import { useSettings } from "@/hooks/use-settings"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ProcessImageOptions } from "@/lib/image-processor"
import { Button } from "@/components/ui/button"
import { generateSVG, generateSVGProgressively, type SVGChunk } from "@/lib/image-processor"
import { processImageWithProgress } from "@/lib/image-processor-with-progress"
import type { ImageData, Settings } from "@/lib/types"
import ProcessingProgress from "@/components/processing-progress"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Settings as SettingsIcon, X } from "lucide-react"
import {
  getStoredImage,
  saveImageToStorage,
  clearStoredImage
} from "@/lib/utils/image-storage"
import {
  saveSvgToStorage,
  getStoredSvg,
  clearStoredSvg,
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
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { settings, updateSettings, updateCurveControls, resetSettings, isSettingsLoaded } = useSettings()
  const [showRandomImageLoader, setShowRandomImageLoader] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [animationSpeed, setAnimationSpeed] = useState(1.0)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const svgRestoredRef = useRef(false) // Track if SVG was restored from cache
  const [stopTrigger, setStopTrigger] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [showProgress, setShowProgress] = useState(false)
  const isMobile = useIsMobile()



  // Check localStorage on mount and load stored image or fallback to default
  useEffect(() => {
    const loadInitialImage = async () => {
      try {
        const storedImage = getStoredImage();

        if (storedImage) {
          // Try to restore cached SVG and processed data to avoid re-generation
          const [cachedSvg, cachedProcessedData] = await Promise.all([
            getStoredSvg(),
            getStoredProcessedData()
          ]);

          if (cachedSvg && cachedProcessedData) {
            svgRestoredRef.current = true;
            setSvgContent(cachedSvg);
            setProcessedData(cachedProcessedData);
            console.log('SVG and Processed Data restored from cache — skipping re-generation');
          } else {
            console.log('Cache miss or incomplete data — will regenerate');
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

          // Save the default image to localStorage for next time (now with proper URL to data URL conversion)
          saveImageToStorage(defaultImageUrl, "La_Gioconda_Leonardo_Da_Vinci.jpg").catch(error => {
            console.log('Could not save default image to localStorage:', error);
          });
        }
      } catch (error) {
        console.error('Error loading initial image:', error);
        // Fallback to showing the random image loader
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

  // Process image when it's uploaded or settings change (excluding curveControls and visiblePaths)
  useEffect(() => {
    if (originalImage && settings && !isInitialLoad && isSettingsLoaded && processedData) {
      const { curveControls, visiblePaths, ...processingSettingsForEffect } = settings;
      // console.log("Processing image due to settings change (excluding curves/visibility):");
      handleProcessImage(processingSettingsForEffect as Settings) // Cast as Settings, though it's partial
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
    settings.colorsAmt,
    settings.monochromeColor,
    isInitialLoad,
    isSettingsLoaded,
    // curveControls and visiblePaths are intentionally excluded here to prevent re-processing
    // Their changes are handled by the other useEffect hooks that only regenerate SVG
  ])

  // Handle visibility changes separately (SVG regeneration only)
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      // console.log("Regenerating SVG due to visiblePaths change");
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
      saveSvgToStorage(svg)
    }
  }, [settings.visiblePaths, processedData, originalImage, isProcessing])

  // Handle curve control changes and curvedPaths toggle separately (SVG regeneration only)
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
      saveSvgToStorage(svg)
    }
  }, [
    settings.curveControls,
    settings.curvedPaths,
    processedData,
    originalImage,
    isProcessing
  ])

  // Save processed data when it changes
  useEffect(() => {
    if (processedData && !isProcessing) {
      saveProcessedDataToStorage(processedData);
    }
  }, [processedData, isProcessing]);

  const handleManualImageUpload = async (imageDataUrl: string, fileName: string) => {
    try {
      // Save the new image to localStorage
      await saveImageToStorage(imageDataUrl, fileName);
      console.log(`Saved image to localStorage: ${fileName}`);

      setOriginalImage(imageDataUrl)
      setCurrentFileName(fileName) // Store the fileName
      setShowRandomImageLoader(false)
    } catch (error) {
      console.error('Failed to save image to localStorage:', error);
      // Still proceed with setting the image even if saving fails
      setOriginalImage(imageDataUrl)
      setCurrentFileName(fileName)
      setShowRandomImageLoader(false)
    }
  }

  const handleImageSelectedFromRandomLoader = async (imageUrl: string, fileName?: string) => {
    try {
      // Save the selected random image to localStorage
      const finalFileName = fileName || new URL(imageUrl).pathname.split('/').pop() || 'random_image.jpg';
      await saveImageToStorage(imageUrl, finalFileName);
      console.log(`Saved random image to localStorage: ${finalFileName}`);

      setOriginalImage(imageUrl)
      setCurrentFileName(finalFileName)
      setShowRandomImageLoader(false)
    } catch (error) {
      console.error('Failed to save random image to localStorage:', error);
      // Still proceed with setting the image even if saving fails
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
    setSvgContent(null)
    setShowRandomImageLoader(true)

    // Clear the stored image and cached SVG since user is explicitly uploading a new one
    clearStoredImage()
    clearStoredSvg()
    clearStoredProcessedData()
    console.log('Cleared stored image and cached data for new upload')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check if file is an image
      if (!file.type.match("image.*")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          try {
            // Save the image to localStorage
            await saveImageToStorage(e.target.result, file.name);
            console.log(`Saved uploaded file to localStorage: ${file.name}`);
          } catch (error) {
            console.error('Failed to save uploaded file to localStorage:', error);
          }

          // Set the original image and pass the file name to handleProcessImage
          handleProcessImage({
            imageDataUrl: e.target.result,
            fileName: file.name // Pass fileName here
          } as ProcessImageOptions)

          setOriginalImage(e.target.result)
          setCurrentFileName(file.name) // Update currentFileName state

          // Clear the input value so the same file can be selected again
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

    // Skip all processing if we already have a cached SVG and data from a previous session
    if (svgRestoredRef.current) {
      svgRestoredRef.current = false;
      console.log('Skipping processing and SVG generation — using cached data');
      return;
    }

    setIsProcessing(true)
    setShowProgress(true)
    setProcessingProgress(0)
    setProcessingStatus("Initializing...")

    try {
      // Determine if we're dealing with ProcessImageOptions or Settings
      const imageOptions: ProcessImageOptions = 'imageDataUrl' in input
        ? input
        : {
          imageDataUrl: originalImage,
          fileName: currentFileName, // Use currentFileName from state
          ...(originalImage.includes('wikimedia.org') && {
            fileName: currentFileName || new URL(originalImage).pathname.split('/').pop(),
            sourceUrl: originalImage
          })
        };

      // Use the appropriate settings
      const processingSettings = 'imageDataUrl' in input ? settings : input as Settings;

      // Process with progress updates (0-70% for image processing)
      const imageData = await processImageWithProgress(
        imageOptions,
        processingSettings,
        (progress, status) => {
          // Scale image processing to 0-70%
          setProcessingProgress(progress * 0.7)
          setProcessingStatus(status)
          return false // Don't cancel
        }
      )

      // Initialize visibility for all color groups
      if (imageData.colorGroups) {
        const newVisiblePaths: Record<string, boolean> = {}
        Object.keys(imageData.colorGroups).forEach((colorKey) => {
          newVisiblePaths[colorKey] =
            settings.visiblePaths[colorKey] !== undefined ? settings.visiblePaths[colorKey] : true
        })

        // Only update settings if the visible paths have changed
        if (JSON.stringify(newVisiblePaths) !== JSON.stringify(settings.visiblePaths)) {
          updateSettings({ visiblePaths: newVisiblePaths })
        }
      }

      setProcessedData(imageData)

      // Progressive SVG generation (70-100%)
      setProcessingStatus("Generating SVG paths...")
      setProcessingProgress(70)

      let lastSvg = '';
      await generateSVGProgressively(
        imageData,
        { ...processingSettings, visiblePaths: settings.visiblePaths },
        (chunk: SVGChunk, partialSvg: string) => {
          // Update SVG in real-time to show partial results
          setSvgContent(partialSvg)
          lastSvg = partialSvg;

          // Scale SVG progress from 70-100%
          const svgProgress = 70 + (chunk.progress * 0.3)
          setProcessingProgress(svgProgress)

          // Show which color is being processed
          if (chunk.type === 'colorGroup' && chunk.colorName) {
            setProcessingStatus(`Generating SVG: ${chunk.colorName} (${chunk.currentGroup}/${chunk.totalGroups})`)
          } else if (chunk.type === 'header') {
            setProcessingStatus("Generating SVG: Starting...")
          } else if (chunk.type === 'footer') {
            setProcessingStatus("Generating SVG: Finalizing...")
          }
        },
        16 // Small delay between chunks to allow UI updates
      )

      setProcessingProgress(100)
      setProcessingStatus("Complete!")

      // Save the final SVG to cache for persistence across refreshes
      if (lastSvg) {
        saveSvgToStorage(lastSvg);
      }
    } catch (error) {
      console.error("Error processing image:", error)
      // Handle error state here
    } finally {
      setIsProcessing(false)
      setShowProgress(false)
    }
  }

  const handleSettingsChange = (newSettingsPatch: Partial<Settings>) => {
    // Use the unified settings update function
    updateSettings(newSettingsPatch);

    // If colorGroups were part of the update patch, update processedData directly
    // This ensures that changes from PathVisibilitySettings' color picker are reflected.
    if (newSettingsPatch.colorGroups) {
      setProcessedData(prevProcessedData => {
        if (!prevProcessedData) {
          // This shouldn't ideally occur if colorGroups are being changed,
          // as processedData should exist. Log a warning if it does.
          console.warn("Attempted to update colorGroups on null processedData in handleSettingsChange.");
          return prevProcessedData; // or null
        }
        return {
          ...prevProcessedData,
          colorGroups: newSettingsPatch.colorGroups, // Apply the updated color groups
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

  const handlePlayAnimation = () => {
    setAnimationTrigger(prev => prev + 1) // Increment to trigger animation

    // Close settings panel on mobile when animation plays
    if (isMobile) {
      setIsSettingsPanelVisible(false)
    }
  }

  const handleStopAnimation = () => {
    setStopTrigger(prev => prev + 1) // Increment to trigger stop
  }

  const handleAnimationSpeedChange = (speed: number) => {
    setAnimationSpeed(speed)
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
              <ImageUploader onImageUpload={handleManualImageUpload} />
            )}

            {!showRandomImageLoader && originalImage && (
              <div className="sticky top-16 z-10 overflow-hidden">
                <Preview
                  originalImage={originalImage!}
                  svgContent={svgContent}
                  isProcessing={isProcessing}
                  processedData={processedData}
                  onNewImageUpload={handleNewImageUpload}
                  settings={settings}
                  animationSpeed={animationSpeed}
                  animationTrigger={animationTrigger}
                  stopTrigger={stopTrigger}
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
                  svgContentPreview={svgContent}
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
                    onPlayAnimation={handlePlayAnimation}
                    onStopAnimation={handleStopAnimation}
                    animationSpeed={animationSpeed}
                    onAnimationSpeedChange={handleAnimationSpeedChange}
                  />
                </TooltipProvider>
              </div>
            </div>
            {/* Close button - only visible on mobile, moved outside panel scroll for correct fixed behavior */}
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

      {/* Processing Progress Overlay */}
      {showProgress && (
        <ProcessingProgress
          progress={processingProgress}
          status={processingStatus}
        />
      )}
    </main>
  )
}
