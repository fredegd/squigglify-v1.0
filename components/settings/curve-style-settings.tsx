"use client"

import { Slider } from "@/components/ui/slider-w-buttons"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { Settings, CurveControlSettings, CurveMode } from "@/lib/types"
import { calculateMaxStrokeWidth } from "@/lib/utils/dimension-utils"
import Image from "next/image"

interface CurveStyleSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    curveControls: CurveControlSettings
    onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
    disabled: boolean
}

import { useMemo, useEffect, useState } from "react"

export default function CurveStyleSettings({
    settings,
    onSettingsChange,
    curveControls,
    onCurveControlsChange,
    disabled,
}: CurveStyleSettingsProps) {
    const [tileHeightScale, setTileHeightScale] = useState(curveControls.tileHeightScale)
    const [strokeWidth, setStrokeWidth] = useState(curveControls.strokeWidth)
    const [matchDensityMultiplier, setMatchDensityMultiplier] = useState(curveControls.matchDensityMultiplier ?? 0.5)

    const calculatedMaxStrokeWidth = useMemo(() => {
        const MAX_DIMENSION = 560;
        let outputWidth = MAX_DIMENSION;
        let tileWidth = Math.floor(outputWidth / settings.columnsCount);
        tileWidth = tileWidth % 2 === 0 ? tileWidth : tileWidth - 1;
        return calculateMaxStrokeWidth(tileWidth);
    }, [settings.columnsCount]);

    useEffect(() => {
        if (curveControls.strokeWidth > calculatedMaxStrokeWidth) {
            onCurveControlsChange({ strokeWidth: calculatedMaxStrokeWidth });
        }
    }, [calculatedMaxStrokeWidth, curveControls.strokeWidth, onCurveControlsChange]);

    // Sync local state
    useEffect(() => {
        setTileHeightScale(curveControls.tileHeightScale)
    }, [curveControls.tileHeightScale])

    useEffect(() => {
        setStrokeWidth(curveControls.strokeWidth)
    }, [curveControls.strokeWidth])

    useEffect(() => {
        setMatchDensityMultiplier(curveControls.matchDensityMultiplier ?? 0.5)
    }, [curveControls.matchDensityMultiplier])

    return (
        <TooltipProvider>
            <details className="group" >
                <summary className="cursor-pointer text-lg font-bold mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-gradient">
                        {{ curved: "Curved", squared: "Square", zigzag: "Zig-Zag" }[settings.curveMode]} Paths
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-300" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    Select the path style: smooth curves, sharp square waves, or diagonal zig-zag sawtooth waves.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
                    <div className="flex w-full justify-between text-gray-300 ">
                        <h3 className="text-sm font-medium mb-3">Matrix: </h3>
                        <div className="flex items-center gap-1 mb-4">
                            {([
                                { mode: "squared" as CurveMode, src: "/squared-paths.svg", alt: "Squared paths" },
                                { mode: "zigzag" as CurveMode, src: "/ziz-zag-paths.svg", alt: "Zig-Zag paths" },
                                { mode: "curved" as CurveMode, src: "/curved-paths.svg", alt: "Curved paths" },
                            ]).map(({ mode, src, alt }) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => onSettingsChange({ curveMode: mode })}
                                    disabled={disabled}
                                    className={`p-1.5 rounded transition-all duration-200 ${settings.curveMode === mode
                                        ? 'bg-white/10 ring-1 ring-white/20'
                                        : 'hover:bg-white/5'
                                    }`}
                                >
                                    <Image
                                        src={src}
                                        alt={alt}
                                        width={24}
                                        height={24}
                                        className={`w-6 h-6 transition-all duration-200 ${settings.curveMode === mode
                                            ? 'opacity-100 [filter:invert(1)_brightness(1)_sepia(1)_saturate(5)_hue-rotate(170deg)]'
                                            : 'opacity-50 [filter:invert(1)_brightness(0.8)] hover:opacity-100'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Label htmlFor="tileHeightScale-setting">
                                Rows Height: {(tileHeightScale * 100).toFixed(0)}%
                            </Label>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-gray-300" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        Adjusts the vertical height of pattern tiles (lower values create flatter patterns)
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Slider
                            id="tileHeightScale-setting"
                            min={0.1}
                            max={1.0}
                            step={0.01}
                            value={[tileHeightScale]}
                            onValueChange={(value) => setTileHeightScale(value[0])}
                            onValueCommit={(value) => onCurveControlsChange({ tileHeightScale: value[0] })}
                            disabled={disabled}
                        />
                    </div>
                    {/* TODO: Add a slider for the stroke width */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Label htmlFor="strokeWidth-setting">Stroke Width: {strokeWidth}</Label>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-gray-300" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        Adjusts the width of the strokes in the output SVG.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Slider
                            id="strokeWidth-setting"
                            min={0.1}
                            max={calculatedMaxStrokeWidth}
                            step={0.1}
                            value={[Math.min(strokeWidth, calculatedMaxStrokeWidth)]}
                            onValueChange={(value) => setStrokeWidth(value[0])}
                            onValueCommit={(value) => onCurveControlsChange({ strokeWidth: value[0] })}
                            disabled={disabled}
                        />
                    </div>

                    <Separator className="bg-gray-700/50" />

                    <div className="space-y-6 pb-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="matchDensity-toggle" className="flex items-center gap-2 cursor-pointer">
                                Tile height: Match Density
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-300" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Scales the height of each tile based on its density. Tiles with minimum density will be shorter, and tiles with maximum density will be at full height.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <Switch
                                id="matchDensity-toggle"
                                checked={curveControls.matchDensity || false}
                                onCheckedChange={(checked) => onCurveControlsChange({ matchDensity: checked })}
                                disabled={disabled}
                            />
                        </div>

                        {curveControls.matchDensity && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex justify-between">
                                    <Label htmlFor="matchDensityMultiplier-setting">
                                        Effect Strength: {(matchDensityMultiplier * 100).toFixed(0)}%
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-gray-300" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">
                                                Controls how much the density influences the tile height. 0% means all tiles stay at full height. 100% means tile height fully follows the density (low density = very short tiles).
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Slider
                                    id="matchDensityMultiplier-setting"
                                    min={0}
                                    max={1.0}
                                    step={0.01}
                                    value={[matchDensityMultiplier]}
                                    onValueChange={(value) => setMatchDensityMultiplier(value[0])}
                                    onValueCommit={(value) => onCurveControlsChange({ matchDensityMultiplier: value[0] })}
                                    disabled={disabled}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </details>
        </TooltipProvider>
    )
} 