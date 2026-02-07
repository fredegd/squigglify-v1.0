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
import { generateSVG } from "@/lib/image-processor"
import { processImageWithProgress } from "@/lib/image-processor-with-progress"
import type { ImageData, Settings } from "@/lib/types"
import ProcessingProgress from "@/components/processing-progress"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Settings as SettingsIcon, X } from "lucide-react"
import {
  getStoredImage,
  saveImageToStorage,
  clearStoredImage,
  hasStoredImage
} from "@/lib/utils/image-storage"
import "@/lib/utils/settings-debug" // Load debug utilities

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
  const [stopTrigger, setStopTrigger] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [showProgress, setShowProgress] = useState(false)
  const [maxPreviewHeight, setMaxPreviewHeight] = useState<number | undefined>(undefined)
  const isMobile = useIsMobile()

  // Track max preview height based on footer position
  useEffect(() => {
    const calculateMaxHeight = () => {
      const footer = document.querySelector('footer');
      const navbarHeight = 64; // Height of the fixed navigation
      const padding = 32; // Extra padding from bottom

      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // If footer is in view
        if (footerRect.top < viewportHeight) {
          const availableSpace = footerRect.top - navbarHeight - padding;
          setMaxPreviewHeight(Math.max(availableSpace, 240)); // Ensure a minimum height
        } else {
          setMaxPreviewHeight(undefined); // Reset to default (75vh) when footer is not in view
        }
      }
    };

    window.addEventListener('scroll', calculateMaxHeight);
    window.addEventListener('resize', calculateMaxHeight);

    // Initial calculation
    calculateMaxHeight();

    return () => {
      window.removeEventListener('scroll', calculateMaxHeight);
      window.removeEventListener('resize', calculateMaxHeight);
    };
  }, []);

  // Check localStorage on mount and load stored image or fallback to default
  useEffect(() => {
    const loadInitialImage = async () => {
      try {
        const storedImage = getStoredImage();

        if (storedImage) {
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
    if (originalImage && settings && !isInitialLoad && isSettingsLoaded) {
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
    }
  }, [settings.visiblePaths, processedData, originalImage, isProcessing])

  // Handle curve control changes and curvedPaths toggle separately (SVG regeneration only)
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
    }
  }, [
    settings.curveControls,
    settings.curvedPaths,
    processedData,
    originalImage,
    isProcessing
  ])

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

    // Clear the stored image since user is explicitly uploading a new one
    clearStoredImage()
    console.log('Cleared stored image for new upload')
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

      // Process with progress updates
      const imageData = await processImageWithProgress(
        imageOptions,
        processingSettings,
        (progress, status) => {
          setProcessingProgress(progress)
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

      // Generate SVG from the processed data
      const svg = generateSVG(imageData, { ...processingSettings, visiblePaths: settings.visiblePaths })
      setSvgContent(svg)
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
      <div className="max-w-7xl mx-auto py-8">
        {/* Mobile settings menu button */}
        {originalImage && !showRandomImageLoader && !isSettingsPanelVisible && (
          <div className="fixed top-16 z-40 lg:hidden w-full mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSettingsPanel}
              aria-label="Toggle settings panel"
              className="p-2 bg-gray-900/80 backdrop-blur hover:text-purple-400 w-full"
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
              <div
                className="sticky top-16 z-10 overflow-hidden"
                style={maxPreviewHeight ? { maxHeight: `${maxPreviewHeight}px` } : {}}
              >
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
                  maxHeight={maxPreviewHeight}
                />
              </div>
            )}
          </div>

          {/* Settings panel and its associated close button */}
          {!showRandomImageLoader && originalImage && (<>
            <div className={`
              ${isSettingsPanelVisible ? 'block' : 'hidden lg:block'}
              ${isSettingsPanelVisible ? 'fixed right-0 top-0 bottom-0 w-full  z-50  overflow-y-auto md:p-4 p-0 transition-all duration-300 ease-in-out     bg-gray-800/60 backdrop-blur rounded-lg' : ''}
              lg:static lg:z-auto lg:overflow-visible lg:p-0 lg:space-y-6 lg:w-auto lg:shadow-none no-scrollbar
            `}
            >

              <div className="space-y-6 mb-20  lg:mt-0 ">
                {/* Add image thumbnail preview above settings panel */}
                {originalImage && (
                  <ImageThumbnail
                    originalImage={originalImage}
                    processedData={processedData}
                    onNewImageUpload={handleNewImageUpload}
                    svgContentPreview={svgContent}
                    toggleSettingsPanel={toggleSettingsPanel}
                    settings={settings}
                  />
                )}
                <TooltipProvider>
                  <SettingsPanel
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    disabled={!originalImage || isProcessing}
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
              <div className="fixed top-16 w-full z-[50] lg:hidden">
                <Button
                  // variant="ghost"
                  size="icon"
                  onClick={toggleSettingsPanel}
                  aria-label="Close settings panel"
                  className="p-2 bg-gray-900/80 backdrop-blur text-gray-100  hover:text-red-400 w-full hover:!bg-transparent "

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
