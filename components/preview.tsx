"use client"

import { useEffect, useRef, memo, useState, useCallback } from "react"
import { ArrowUpToLine, ArrowUpRight, Maximize2, LoaderCircle, X, ChevronDown, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SvgDownloadOptions from "@/components/svg-download-options"
import type { ImageData, Settings } from "@/lib/types"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PreviewProps {
  originalImage: string
  svgContent: string | null
  isProcessing: boolean
  processedData: ImageData | null
  onNewImageUpload: () => void
  settings: Settings
  animationSpeed?: number
  animationTrigger?: number
  stopTrigger?: number
}

// Use memo to prevent unnecessary re-renders
const Preview = memo(function Preview({
  svgContent,
  isProcessing,
  processedData,
  settings,
  animationSpeed = 1.0,
  animationTrigger = 0,
  stopTrigger = 0,
}: PreviewProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const currentSvgElementRef = useRef<SVGElement | null>(null)

  // Animation function separated from SVG rendering
  const animateSVGPaths = useCallback(() => {
    const svgElement = currentSvgElementRef.current;
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll("path");

    paths.forEach((path, index) => {
      // Reset any existing animation
      path.style.animation = 'none';
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
      path.style.visibility = "visible";

      // Force reflow to reset styles
      void path.getBoundingClientRect();

      try {
        const length = path.getTotalLength();
        const delayPerPath = Math.max(1.0 / length, 1.0) / animationSpeed; // delay between paths in seconds
        const duration = Math.min(Math.max(0.5, 2 / Math.pow(length, 0.05)), 10) / animationSpeed; // duration per path in seconds, adjusted by speed

        // Set up the stroke dash animation
        path.style.strokeDasharray = length.toString();
        path.style.strokeDashoffset = length.toString();
        path.style.animation = `draw-svg ${duration}s ease-in-out forwards`;
        path.style.animationDelay = `${index * delayPerPath}s`;

      } catch (e) {
        console.warn("Error animating path", index, e);
        // Fallback: just show the path without animation
        path.style.visibility = "visible";
      }
    });
  }, [animationSpeed]);

  // Stop animation function
  const stopSVGAnimation = useCallback(() => {
    const svgElement = currentSvgElementRef.current;
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll("path");
    paths.forEach((path) => {
      // Stop any running animation
      path.style.animation = 'none';
      // Reset stroke properties to show full path
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
      path.style.visibility = "visible";
    });
  }, []);

  // Trigger animation when shouldAnimate changes or animationTrigger prop changes
  useEffect(() => {
    if (shouldAnimate || (animationTrigger > 0)) {
      animateSVGPaths();
      setShouldAnimate(false); // Reset the trigger
    }
  }, [shouldAnimate, animationTrigger, animateSVGPaths]);

  // Stop animation when stopTrigger prop changes
  useEffect(() => {
    if (stopTrigger > 0) {
      stopSVGAnimation();
    }
  }, [stopTrigger, stopSVGAnimation]);

  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      let processedSvg = svgContent;

      // Remove or fix problematic width/height with mm units (fixed regex)
      processedSvg = processedSvg.replace(/(width|height)="[^"]*\s*mm"/g, '');

      // Also handle cases where there might be other problematic units
      processedSvg = processedSvg.replace(/(width|height)="[^"]*\s*(cm|in|pt|pc)"/g, '');

      // Extract original SVG dimensions for proper scaling
      const widthMatch = processedSvg.match(/width="([^"]+)"/);
      const heightMatch = processedSvg.match(/height="([^"]+)"/);
      const viewBoxMatch = processedSvg.match(/viewBox="([^"]+)"/);

      let svgWidth = widthMatch ? parseFloat(widthMatch[1]) : null;
      let svgHeight = heightMatch ? parseFloat(heightMatch[1]) : null;

      // If dimensions are not found in attributes, try to extract from viewBox
      if ((!svgWidth || !svgHeight) && viewBoxMatch) {
        const viewBoxValues = viewBoxMatch[1].split(/\s+/);
        if (viewBoxValues.length >= 4) {
          svgWidth = parseFloat(viewBoxValues[2]);
          svgHeight = parseFloat(viewBoxValues[3]);
        }
      }

      const updateSVGSize = () => {
        if (!svgContainerRef.current) return;

        // Create a wrapper div for better SVG control
        const svgWrapper = document.createElement('div');
        svgWrapper.style.cssText = `
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        `;

        // Add styling to ensure SVGs are properly scaled while maintaining aspect ratio and fitting container
        let enhancedSvgContent = processedSvg.replace('<svg ', '<svg style="shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;" ');

        // If we have dimensions, calculate the optimal display size
        if (svgWidth && svgHeight) {
          const containerWidth = svgContainerRef.current.clientWidth - 16; // Account for padding
          const containerHeight = svgContainerRef.current.clientHeight - 16;

          // Ensure minimum container dimensions
          const effectiveContainerWidth = Math.max(containerWidth, 200);
          const effectiveContainerHeight = Math.max(containerHeight, 200);

          const aspectRatio = svgWidth / svgHeight;
          let displayWidth = effectiveContainerWidth;
          let displayHeight = effectiveContainerWidth / aspectRatio;

          if (displayHeight > effectiveContainerHeight) {
            displayHeight = effectiveContainerHeight;
            displayWidth = effectiveContainerHeight * aspectRatio;
          }

          // Ensure we don't exceed the original SVG size unnecessarily
          if (displayWidth > svgWidth && displayHeight > svgHeight) {
            displayWidth = svgWidth;
            displayHeight = svgHeight;
          }

          // Apply calculated dimensions
          enhancedSvgContent = enhancedSvgContent.replace(
            'style="shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;"',
            `style="shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; width: ${Math.round(displayWidth)}px; height: ${Math.round(displayHeight)}px; display: block;"`
          );
        }

        svgWrapper.innerHTML = enhancedSvgContent;
        svgContainerRef.current.innerHTML = '';
        svgContainerRef.current.appendChild(svgWrapper);

        // Store reference to the SVG element for animation
        const svgElement = svgWrapper.querySelector('svg');
        if (svgElement) {
          currentSvgElementRef.current = svgElement;

          // Ensure all paths are visible initially (no animation on render)
          const paths = svgElement.querySelectorAll("path");
          paths.forEach((path) => {
            path.style.visibility = "visible";
            path.style.strokeDasharray = '';
            path.style.strokeDashoffset = '';
            path.style.animation = 'none';
          });
        }
      };
      // Initial render
      updateSVGSize();


      // Setup resize observer for responsive behavior
      const resizeObserver = new ResizeObserver(() => {
        updateSVGSize();
      });

      if (svgContainerRef.current) {
        resizeObserver.observe(svgContainerRef.current);
      }

      // Cleanup
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [svgContent])


  return (
    <>
      <div className="relative h-full">
        <div className="space-y-4 sticky top-0 max-h-screen  flex flex-col ">
          <div className="flex-1 lg:w-full  border border-gray-700 rounded-2xl overflow-hidden p-2 relative">
            <h3 className="text-lg font-medium  text-center mb-2">Output</h3>
            <div className=" absolute lg:top-auto bottom-2 lg:right-2 right-4  ">
              {svgContent && (
                <SvgDownloadOptions
                  svgContent={svgContent}
                  colorGroups={processedData?.colorGroups}
                  isProcessing={isProcessing}
                />
              )}
            </div>

            <div className="flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <LoaderCircle className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-gray-300">Processing image...</p>
                </div>
              ) : svgContent ? (
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={8}
                >
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "75vh", backgroundColor: '#f1f1f1', borderRadius: '12px' }}
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <div ref={svgContainerRef} className="w-full h-full flex items-center justify-center bg-[#f1f1f1] rounded-xl p-1" style={{ minHeight: '200px' }}>
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <p className="text-gray-300">Vector preview will appear here</p>
              )}
            </div>
            {processedData && (
              <p className="mt-1 text-center text-xs text-gray-300">
                {processedData.columnsCount} × {processedData.rowsCount} tiles

              </p>
            )}
            {/* display density information */}
            <p className="mt-1 text-center text-xs text-gray-300">
              Density: {settings.minDensity} - {settings.maxDensity}
            </p>

            {/* display current processing mode */}
            <p className="mt-1 text-center text-xs text-gray-300">
              Processing Mode: {settings.processingMode}
            </p>
          </div>
        </div>
      </div>
    </>
  )
})

// Export the thumbnail component for use in page.tsx
export const ImageThumbnail = memo(function ImageThumbnail({
  originalImage,
  processedData,
  onNewImageUpload,
  svgContentPreview,
  toggleSettingsPanel,
  settings
}: {
  originalImage: string
  processedData: ImageData | null
  onNewImageUpload: () => void
  svgContentPreview?: string | null
  toggleSettingsPanel: () => void
  settings: Settings
}) {
  const svgPreviewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  useEffect(() => {
    if (svgContentPreview && svgPreviewContainerRef.current) {
      // Basic styling for the mini SVG preview (fixed regex)
      let processedMiniSvg = svgContentPreview.replace(/(width|height)="[^"]*\s*mm"/g, '');

      // Also handle cases where there might be other problematic units
      processedMiniSvg = processedMiniSvg.replace(/(width|height)="[^"]*\s*(cm|in|pt|pc)"/g, '');

      processedMiniSvg = processedMiniSvg.replace(
        '<svg ',
        '<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto; shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round;" '
      );
      svgPreviewContainerRef.current.innerHTML = processedMiniSvg;
    }
  }, [svgContentPreview]);

  return (
    <div className=" bg-gray-800/80 backdrop-blur-md rounded-lg   sticky top-0 z-[45]  pt-12 lg:pt-0 px-4">
      {/* we should include this following div in a details/summary section */}
      <details className="" open>
        <summary className="cursor-pointer text-md font-bold  my-6 flex items-center justify-between ">
          <h3 className="flex items-center gap-2">Image Details</h3>
          <ChevronDown className="h-4 w-4 transform transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-row gap-4 items-start p-4 pt-0 h-full">
          {/* Original Image Section */}
          <div className="flex-1 lg:w-full  border border-gray-700 rounded-2xl overflow-hidden p-2 relative">
            <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Input</h3>
            <div className="  absolute top-2 right-2  ">
              <Button
                onClick={onNewImageUpload}
                className="h-7 w-7 md:h-8 md:w-8 p-0 !bg-transparent hover:text-red-500"
                size="sm"
                title="Upload new image"
              >
                <ArrowUpToLine className="h-3.5 md:h-4 w-3.5 md:w-4" />
              </Button>
            </div>
            <div className="flex flex-col lg:w-full  max-h-40 items-center justify-center aspect-square bg-[#f1f1f1] rounded-xl mx-auto relative cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsFullscreenOpen(true)}>
              <img
                src={originalImage || "/placeholder.svg"}
                alt="Original"
                className="max-w-full max-h-full object-contain p-1"
              />
            </div>
            {processedData && (
              <div className="flex flex-col  gap-1 mx-auto">
                {processedData.fileName && (
                  <div className="text-center text-xs text-gray-300">
                    {processedData.fileName}
                  </div>
                )}
                <div className="text-center text-xs text-gray-300">
                  {"Size: "}
                  {processedData.originalWidth} × {processedData.originalHeight} px
                  {"  •  Ratio: "}
                  {(processedData.originalWidth / processedData.originalHeight).toFixed(2)}:1
                </div>
                {processedData.sourceUrl && (
                  <div className="text-center text-xs">
                    <a
                      href={processedData.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Source
                      <ArrowUpRight className="inline h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Mini SVG Preview Section (only on mobile/when svgContentPreview is present) */}
          {svgContentPreview && (
            <div className="flex-1  lg:hidden border border-gray-700 rounded-2xl overflow-hidden p-2 relative  h-full" >
              <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Preview</h3>
              <Maximize2 className="absolute top-2 right-2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-300" onClick={toggleSettingsPanel} />
              <div ref={svgPreviewContainerRef} className="aspect-square bg-[#f1f1f1] rounded-lg overflow-hidden flex items-center justify-center max-h-40  mx-auto p-1" onClick={toggleSettingsPanel}>
                {/* Mini SVG will be injected here */}
              </div>
              {/* Optional: Add tile info for preview if needed */}
              {processedData && (
                <p className="mt-1 text-center text-xs text-gray-300">
                  {processedData.columnsCount} × {processedData.rowsCount} tiles
                </p>
              )}
              {/* display density information */}
              <p className="mt-1 text-center text-xs text-gray-300">
                Density: {settings.minDensity} - {settings.maxDensity}
              </p>
              {/* display current processing mode */}
              <p className="mt-1 text-center text-xs text-gray-300">
                Processing Mode: {settings.processingMode}
              </p>
            </div>
          )}
        </div>
      </details>

      {/* Fullscreen Image Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-4 right-4 z-50  h-8 w-8 p-0 hover:!text-red-500 !bg-transparent"
              title="Close Fullscreen"
              size="sm"

            >
              <X className="h-5 w-5 text-white" />
            </Button>

            {/* Fullscreen image */}
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original - Fullscreen"
              className="max-w-full max-h-full object-contain p-4"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100vw',
                maxHeight: '100vh'
              }}
            />

            {/* Optional: Image info overlay */}
            {processedData && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="text-sm">
                  {processedData.fileName && (
                    <div className="font-medium">{processedData.fileName}</div>
                  )}
                  <div className="text-gray-300">
                    {processedData.originalWidth} × {processedData.originalHeight} px
                    {" • "}
                    {(processedData.originalWidth / processedData.originalHeight).toFixed(2)}:1
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
})

export default Preview
