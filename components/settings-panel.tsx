"use client"

import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider-w-buttons"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info, ChevronDown, Play, Square } from "lucide-react"
import type { Settings, CurveControlSettings, ImageData as ProcessedDataType } from "@/lib/types"
import { DEFAULT_CURVE_CONTROLS } from "@/lib/types"
import { useMemo, useEffect } from "react"

import ProcessingModeSettings from "./settings/processing-mode-settings"
import ImageTilingSettings from "./settings/image-tiling-settings"
import PathDensitySettings from "./settings/path-density-settings"
import VectorGenerationSettings from "./settings/vector-generation-settings"
import CurveStyleSettings from "./settings/curve-style-settings"
import PathVisibilitySettings from "./settings/path-visibility-settings"

interface SettingsPanelProps {
  settings: Settings
  onSettingsChange: (newSettings: Partial<Settings>) => void
  disabled: boolean
  curveControls: CurveControlSettings
  onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
  processedData: ProcessedDataType | null
  onResetSettings?: () => void
  onPlayAnimation?: () => void
  onStopAnimation?: () => void
  animationSpeed?: number
  onAnimationSpeedChange?: (speed: number) => void
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  disabled,
  curveControls,
  onCurveControlsChange,
  processedData,
  onResetSettings,
  onPlayAnimation,
  onStopAnimation,
  animationSpeed = 1.0,
  onAnimationSpeedChange
}: SettingsPanelProps) {
  const calculatedDensity = useMemo(() => {
    const MAX_DIMENSION = 560;
    let outputWidth = MAX_DIMENSION;
    let tileWidth = Math.floor(outputWidth / settings.columnsCount);
    tileWidth = tileWidth % 2 === 0 ? tileWidth : tileWidth - 1;
    return tileWidth * 3; // Assuming density amount is calculated as tile width * 3
  }, [settings.columnsCount]);

  useEffect(() => {
    if (settings.maxDensity > calculatedDensity) {
      onSettingsChange({ maxDensity: calculatedDensity });
    }
    if (settings.minDensity > calculatedDensity) {
      onSettingsChange({ minDensity: calculatedDensity });
    }
  }, [calculatedDensity, settings.maxDensity, settings.minDensity, onSettingsChange]);

  const resetAdvancedCurveControlsToDefaults = () => {
    onCurveControlsChange(DEFAULT_CURVE_CONTROLS);
  };

  return (
    <div className="space-y-6 px-4 py-2 ">


      <ImageTilingSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

      <Separator className="bg-gray-700" />

      <PathDensitySettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
        calculatedDensity={calculatedDensity}
      />

      <Separator className="bg-gray-700" />

      <VectorGenerationSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

      <Separator className="bg-gray-700" />

      <CurveStyleSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        curveControls={curveControls}
        onCurveControlsChange={onCurveControlsChange}
        disabled={disabled}
      />

      <>
        <Separator className="bg-gray-700" />
        <details className="group" >
          <summary className="cursor-pointer text-md font-bold  my-6 flex items-center justify-between ">
            <h3 className="flex items-center gap-2">Advanced Shape Controls</h3>
            <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
            {settings.curvedPaths && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="junctionContinuityFactor-panel">
                    Curve Smoothness: {curveControls.junctionContinuityFactor.toFixed(2)}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Controls how smooth the curves are between points (higher values create smoother curves)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  id="junctionContinuityFactor-panel"
                  min={0.01}
                  max={0.50}
                  step={0.01}
                  value={[curveControls.junctionContinuityFactor]}
                  onValueChange={(value) => onCurveControlsChange({ junctionContinuityFactor: value[0] })}
                  disabled={disabled}
                />
              </div>
            )}

            {/* {settings.curvedPaths && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="handleRotationAngle-panel">
                    Handle Rotation: {curveControls.handleRotationAngle?.toFixed(0)}°
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Adjusts the rotation of control point handles at each vertex (in degrees).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  id="handleRotationAngle-panel"
                  min={-90}
                  max={90}
                  step={1}
                  value={[curveControls.handleRotationAngle || 0]}
                  onValueChange={(value) => onCurveControlsChange({ handleRotationAngle: value[0] })}
                  disabled={disabled}
                />
              </div>
            )} */}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="lowerKnotXShift-panel">
                  Lower Knot X Shift: {curveControls.lowerKnotXShift?.toFixed(2)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Shifts the X-coordinate of the lower knot points in each tile. Min/Max is based on tile width.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="lowerKnotXShift-panel"
                min={-(processedData?.tileWidth ?? 0) / 2}
                max={(processedData?.tileWidth ?? 0) / 2}
                step={0.1}
                value={[curveControls.lowerKnotXShift || 0]}
                onValueChange={(value) => onCurveControlsChange({ lowerKnotXShift: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="upperKnotShiftFactor-panel">
                  Upper Knot Explode: {((curveControls.upperKnotShiftFactor || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Adjusts the magnitude of random displacement for upper knot points. 0% means no shift, 100% applies the full pre-calculated random shift.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="upperKnotShiftFactor-panel"
                min={0}
                max={1}
                step={0.01}
                value={[curveControls.upperKnotShiftFactor || 0]}
                onValueChange={(value) => onCurveControlsChange({ upperKnotShiftFactor: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="disorganizeFactor-panel">
                  Disorganize: {((curveControls.disorganizeFactor || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Adjusts the magnitude of random displacement for each point in a path. 0% means no shift, 100% applies a full random shift.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="disorganizeFactor-panel"
                min={0}
                max={1}
                step={0.01}
                value={[curveControls.disorganizeFactor || 0.0]}
                onValueChange={(value) => onCurveControlsChange({ disorganizeFactor: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="rowWaveShift-panel">
                  Row wave height: {((curveControls.rowWaveShift || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Creates a wave pattern across rows. Upper and lower knots in each row get offset based on sin(column/total_columns). Even and odd rows have opposite wave directions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="rowWaveShift-panel"
                min={-1}
                max={1}
                step={0.01}
                value={[curveControls.rowWaveShift || 0.0]}
                onValueChange={(value) => onCurveControlsChange({ rowWaveShift: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="columnWaveShift-panel">
                  Column Wave Shift: {((curveControls.columnWaveShift || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Creates a wave pattern across columns. Whole columns get shifted vertically based on cos(row/total_rows).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="columnWaveShift-panel"
                min={-1}
                max={1}
                step={0.01}
                value={[curveControls.columnWaveShift || 0.0]}
                onValueChange={(value) => onCurveControlsChange({ columnWaveShift: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="waveShiftFrequency-panel">
                  Wave Frequency: {(curveControls.waveShiftFrequency || 2.0).toFixed(1)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Controls the frequency of both row and column wave patterns. Higher values create more waves, lower values create fewer, broader waves.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="waveShiftFrequency-panel"
                min={0.5}
                // max value should be the same as the columnsCount
                max={Math.max(settings.columnsCount * 0.1, 10)}
                step={0.1}
                value={[curveControls.waveShiftFrequency || 2.0]}
                onValueChange={(value) => onCurveControlsChange({ waveShiftFrequency: value[0] })}
                disabled={disabled}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAdvancedCurveControlsToDefaults}
                disabled={disabled}
                className="text-xs h-7"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </details>
      </>

      <Separator className="bg-gray-700" />

      {processedData?.colorGroups && Object.keys(processedData.colorGroups).length > 0 && settings.processingMode !== "monochrome" && (
        <>
          <PathVisibilitySettings
            colorGroups={processedData.colorGroups}
            visiblePaths={settings.visiblePaths}
            onSettingsChange={onSettingsChange}
            disabled={disabled}
            processingMode={settings.processingMode}
            settings={settings}
          />
          <Separator className="bg-gray-700" />
        </>
      )}


      <ProcessingModeSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

      <Separator className="bg-gray-700" />

      {/* Animation Controls */}
      {onPlayAnimation && (
        <>
          <details className="group" open>
            <summary className="cursor-pointer text-md font-bold  my-6 flex items-center justify-between ">
              <h3 className="flex items-center gap-2">Animation Controls</h3>
              <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="flex flex-col gap-4 mt-4 text-gray-300 lg:px-4 px-8">
              {/* Play and Stop Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlayAnimation}
                  disabled={disabled}
                  className="bg-transparent hover:bg-blue-700 text-white border-blue-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
                {onStopAnimation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onStopAnimation}
                    disabled={disabled}
                    className="bg-transparent hover:bg-red-700 text-white border-red-600"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {/* Speed Slider */}
              {onAnimationSpeedChange && (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="animation-speed" className="text-sm text-gray-300">
                      Speed: {animationSpeed.toFixed(1)}x
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-300" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Controls the speed of the drawing animation (higher values = faster animation)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    id="animation-speed"
                    min={0.1}
                    max={8.0}
                    step={0.1}
                    value={[animationSpeed]}
                    onValueChange={(value) => onAnimationSpeedChange(value[0])}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          </details>
        </>
      )}

      {onResetSettings && (
        <>
          <Separator className="bg-gray-700" />
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onResetSettings();
                // Reset animation speed to default
                if (onAnimationSpeedChange) {
                  onAnimationSpeedChange(1.0);
                }
              }}
              disabled={disabled}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </>
      )}

    </div>
  )
}
