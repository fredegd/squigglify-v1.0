"use client"

import { useEffect, useRef, memo, useState, useCallback } from "react"

import { ArrowUpToLine, ArrowUpRight, Maximize2, LoaderCircle, X, ChevronDown, Play, Square, Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { FullscreenImageDialog } from "@/components/fullscreen-image-dialog"
import SvgDownloadOptions from "@/components/svg-download-options"
import type { ImageData, Settings } from "@/lib/types"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { WebGLRenderer } from "@/lib/webgl"

interface PreviewProps {
  originalImage: string
  processedData: ImageData | null
  isProcessing: boolean
  processingProgress: number
  processingStatus: string
  onNewImageUpload: () => void
  settings: Settings
}

// Use memo to prevent unnecessary re-renders
const Preview = memo(function Preview({
  processedData,
  isProcessing,
  processingProgress,
  processingStatus,
  onNewImageUpload,
  settings,
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const [isPanEnabled, setIsPanEnabled] = useState(true)
  const [isZoomEnabled, setIsZoomEnabled] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(1)

  const isCanvasVisible = !!processedData?.colorGroups;

  // Initialize WebGL renderer when canvas becomes available
  useEffect(() => {
    if (!isCanvasVisible || !canvasRef.current) return

    const renderer = new WebGLRenderer()
    const success = renderer.init(canvasRef.current)
    if (!success) {
      console.error("Failed to initialize WebGL renderer")
      return
    }
    rendererRef.current = renderer

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [isCanvasVisible])

  // Re-render when processedData or settings change — debounced to avoid
  // rebuilding vertex buffers on every slider tick during rapid dragging.
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer || !processedData?.colorGroups) return

    const timerId = setTimeout(() => {
      // Show overlay and yield to let React paint
      setIsRendering(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          renderer.renderWithNewSettings(processedData, settings)
          setIsRendering(false)
        })
      })
    }, 60) // 60ms debounce — fast enough to feel responsive, avoids stacking work

    return () => clearTimeout(timerId)
  }, [processedData, settings])

  // Handle canvas resize — just re-draw existing buffers, no vertex rebuild
  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      const renderer = rendererRef.current
      if (renderer) {
        renderer.render(settings)
      }
    })

    resizeObserver.observe(canvasRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [settings])


  return (
    <>
      <div className="relative h-full flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col ">
          <div className="flex-1 lg:w-full  border border-gray-700 rounded-2xl overflow-hidden p-2 relative flex flex-col">
            <h3 className="text-lg font-bold text-center mb-2 text-gradient self-start">Output</h3>
            <div className=" absolute lg:top-auto bottom-4 lg:right-6 right-6  ">
              {processedData?.colorGroups && (
                <SvgDownloadOptions
                  processedData={processedData}
                  settings={settings}
                  colorGroups={processedData.colorGroups}
                  isProcessing={isProcessing}
                />
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0 relative">
              {/* Show WebGL canvas when we have processed data */}
              {processedData?.colorGroups ? (
                <>
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={3.0}
                    panning={{ disabled: !isPanEnabled }}
                    wheel={{ disabled: !isZoomEnabled }}
                    pinch={{ disabled: !isZoomEnabled }}
                    doubleClick={{ disabled: !isZoomEnabled }}
                    onTransformed={(ref) => {
                      const scale = ref.state.scale;
                      setCurrentZoom(scale);
                      if (rendererRef.current) {
                        rendererRef.current.setZoomScale(scale);
                        rendererRef.current.render(settings);
                      }
                    }}
                  >
                    {({ resetTransform, zoomIn, zoomOut }) => (
                      <>
                        <TransformComponent
                          wrapperStyle={{
                            width: "100%",
                            height: "75vh",
                            backgroundColor: '#f1f1f1',
                            borderRadius: '12px'
                          }}
                          contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <canvas
                            ref={canvasRef}
                            className="w-full h-full rounded-xl"
                            style={{ minHeight: '100px' }}
                          />
                        </TransformComponent>

                        {/* Pan & Zoom toggle buttons — desktop only */}
                        <div className="absolute bottom-16 right-4 hidden lg:flex flex-col gap-2 z-10">
                          <button
                            onClick={() => setIsPanEnabled(prev => !prev)}
                            title={isPanEnabled ? 'Disable panning' : 'Enable panning'}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 ${isPanEnabled
                              ? 'bg-gray-900/70 text-white hover:bg-gray-900/90'
                              : 'bg-gray-900/40 text-gray-500 hover:bg-gray-900/60'
                              }`}
                          >
                            <Move className="h-4 w-4" />
                            {!isPanEnabled && (
                              <span className="absolute w-5 h-0.5 bg-red-400/80 rotate-45 rounded-full" />
                            )}
                          </button>

                          <button
                            onClick={() => setIsZoomEnabled(prev => !prev)}
                            title={isZoomEnabled ? 'Disable zooming' : 'Enable zooming'}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 ${isZoomEnabled
                              ? 'bg-gray-900/70 text-white hover:bg-gray-900/90'
                              : 'bg-gray-900/40 text-gray-500 hover:bg-gray-900/60'
                              }`}
                          >
                            <ZoomIn className="h-4 w-4" />
                            {!isZoomEnabled && (
                              <span className="absolute w-5 h-0.5 bg-red-400/80 rotate-45 rounded-full" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              zoomIn();
                            }}
                            disabled={!isZoomEnabled || currentZoom >= 3.0}
                            title="Zoom In"
                            className={`w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 mt-2 ${!isZoomEnabled || currentZoom >= 3.0
                              ? 'bg-gray-900/40 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-900/70 text-white hover:bg-gray-900/90'
                              }`}
                          >
                            <span className="text-lg leading-none">+</span>
                          </button>

                          <button
                            onClick={() => {
                              zoomOut();
                            }}
                            disabled={!isZoomEnabled || currentZoom <= 0.5}
                            title="Zoom Out"
                            className={`w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 ${!isZoomEnabled || currentZoom <= 0.5
                              ? 'bg-gray-900/40 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-900/70 text-white hover:bg-gray-900/90'
                              }`}
                          >
                            <span className="text-lg leading-none">-</span>
                          </button>
                        </div>

                        {/* Reset view button — visible on all screens */}
                        <div className="absolute bottom-4 right-4 flex z-10">
                          <button
                            onClick={() => {
                              resetTransform();
                              setCurrentZoom(1);
                              if (rendererRef.current) {
                                rendererRef.current.setZoomScale(1);
                                rendererRef.current.render(settings);
                              }
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Reset view"
                            className="w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 bg-gray-900/70 text-white hover:bg-gray-900/90"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </TransformWrapper>
                </>
              ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <LoaderCircle className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-gray-300">Processing image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-0 animate-in fade-in duration-500 delay-500 fill-mode-forwards">
                  <p className="text-gray-300">Vector preview will appear here</p>
                </div>
              )}

              {/* Processing progress overlay - shown over canvas during reprocessing or rendering */}
              {(isProcessing || isRendering) && processedData?.colorGroups && (
                <div className="absolute inset-x-0 bottom-0 rounded-b-lg overflow-hidden pointer-events-none z-50">
                  <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2">
                    <div className="flex items-center gap-3 mb-1.5">
                      <LoaderCircle className="h-4 w-4 text-purple-400 animate-spin flex-shrink-0" />
                      <span className="text-xs text-gray-300 truncate">
                        {isProcessing ? (processingStatus || 'Processing...') : 'Building vectors...'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {isProcessing ? Math.round(processingProgress) : 100}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-200 ease-out"
                        style={{ width: `${isProcessing ? Math.min(100, Math.max(0, processingProgress)) : 100}%` }}
                      />
                    </div>
                  </div>
                </div>
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
// NOTE: The thumbnail still uses a small WebGL canvas for its mini preview
export const ImageThumbnail = memo(function ImageThumbnail({
  originalImage,
  processedData,
  onNewImageUpload,
  toggleSettingsPanel,
  settings
}: {
  originalImage: string
  processedData: ImageData | null
  onNewImageUpload: () => void
  toggleSettingsPanel: () => void
  settings: Settings
}) {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniRendererRef = useRef<WebGLRenderer | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const isCanvasVisible = !!processedData?.colorGroups;

  // Initialize mini WebGL renderer
  useEffect(() => {
    if (!isCanvasVisible || !miniCanvasRef.current) return

    const renderer = new WebGLRenderer()
    const success = renderer.init(miniCanvasRef.current)
    if (!success) {
      console.error("Failed to initialize mini WebGL renderer")
      return
    }
    miniRendererRef.current = renderer

    return () => {
      renderer.dispose()
      miniRendererRef.current = null
    }
  }, [isCanvasVisible])

  // Re-render mini preview when data/settings change — debounced
  useEffect(() => {
    const renderer = miniRendererRef.current
    if (!renderer || !processedData?.colorGroups) return

    const timerId = setTimeout(() => {
      renderer.renderWithNewSettings(processedData, settings)
    }, 100)

    return () => clearTimeout(timerId)
  }, [processedData, settings])

  return (
    <div className="bg-gray-800/95 backdrop-blur-md rounded-b-lg sticky top-0 lg:top-16 z-[45] pt-12 lg:pt-0 px-7 lg:px-0  shadow-xl">
      {/* we should include this following div in a details/summary section */}
      <details className="" open>
        <summary className="cursor-pointer text-lg font-bold  mb-6 mt-4 flex items-center justify-between ">
          <h3 className="flex items-center gap-2 text-gradient">Image Details</h3>
          <ChevronDown className="h-4 w-4 transform transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="flex flex-row gap-4 items-start  p-0 h-full">
          {/* Mini WebGL Preview Section (only on mobile) */}
          {processedData?.colorGroups && (
            <div className="flex-1  lg:hidden border border-gray-700 rounded-2xl overflow-hidden p-2 relative  h-full" >
              <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-gradient">Preview</h3>
              <Maximize2 className="absolute top-2 right-2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-300" onClick={toggleSettingsPanel} />
              <div className="aspect-square bg-[#f1f1f1] rounded-lg overflow-hidden flex items-center justify-center max-h-40  mx-auto p-1" onClick={toggleSettingsPanel}>
                <canvas
                  ref={miniCanvasRef}
                  className="w-full h-full"
                />
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

          {/* Original Image Section */}
          <div className="flex-1 lg:w-full flex-1 border border-gray-700 rounded-2xl overflow-hidden p-2 relative  h-full">
            <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-gradient">Input</h3>
            <div className="  absolute top-2 right-2 flex gap-1 ">
              <Button
                variant="ghost"
                onClick={onNewImageUpload}
                className="h-7 w-7 md:h-8 md:w-8 p-0 hover:text-purple-500"
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

        </div>
      </details>

      <FullscreenImageDialog
        isOpen={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        originalImage={originalImage}
        processedData={processedData}
      />


    </div>
  )
})

export default Preview
