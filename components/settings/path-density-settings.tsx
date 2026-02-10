"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider-w-buttons"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown, Link2, Unlink2 } from "lucide-react"
import type { Settings } from "@/lib/types"

interface PathDensitySettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
    calculatedDensity: number // Add this prop
}

export default function PathDensitySettings({ settings, onSettingsChange, disabled, calculatedDensity }: PathDensitySettingsProps) {
    const [isValueLinked, setIsValueLinked] = useState(false)
    const [minDensity, setMinDensity] = useState(settings.minDensity)
    const [maxDensity, setMaxDensity] = useState(settings.maxDensity)

    // Sync local state
    useEffect(() => {
        setMinDensity(settings.minDensity)
    }, [settings.minDensity])

    useEffect(() => {
        setMaxDensity(settings.maxDensity)
    }, [settings.maxDensity])

    const handleMinDensityChange = (value: number) => {
        setMinDensity(value)
        if (isValueLinked) {
            setMaxDensity(value)
        }
    }

    const commitMinDensityChange = (value: number) => {
        if (isValueLinked) {
            // When linked, both min and max density should be the same
            onSettingsChange({ minDensity: value, maxDensity: value })
        } else {
            onSettingsChange({ minDensity: value })
        }
    }

    const handleMaxDensityChange = (value: number) => {
        setMaxDensity(value)
        if (isValueLinked) {
            setMinDensity(value)
        }
    }

    const commitMaxDensityChange = (value: number) => {
        if (isValueLinked) {
            // When linked, both min and max density should be the same
            onSettingsChange({ minDensity: value, maxDensity: value })
        } else {
            // When unlinked, ensure min density doesn't exceed max density
            const newMinDensity = Math.min(settings.minDensity, value)
            onSettingsChange({ minDensity: newMinDensity, maxDensity: value })
        }
    }

    const toggleLinkState = () => {
        setIsValueLinked(!isValueLinked)
    }
    return (
        <TooltipProvider>
            <details className="group" >
                <summary className="cursor-pointer my-6 text-lg font-bold flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-gradient">
                        Path Density
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-300" />
                            </TooltipTrigger>
                            *
                            <TooltipContent>
                                <p className="max-w-xs">
                                    <span>
                                        Density controls how how often the serpentine path repeats for each tile.
                                    </span>
                                    <br />

                                    <span>
                                        Darker pixels have more zigzags, creating a denser pattern.
                                    </span>
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="minDensity-setting">Min Density: {minDensity}</Label>
                        </div>
                        <Slider
                            id="minDensity-setting"
                            min={0}
                            max={calculatedDensity} // Use calculatedDensity here
                            step={1}
                            value={[minDensity]}
                            onValueChange={(value) => handleMinDensityChange(value[0])}
                            onValueCommit={(value) => commitMinDensityChange(value[0])}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="maxDensity-setting">Max Density: {maxDensity}</Label>
                        </div>
                        <Slider
                            id="maxDensity-setting"
                            min={0}
                            max={calculatedDensity} // Use calculatedDensity here
                            step={1}
                            value={[maxDensity]}
                            onValueChange={(value) => handleMaxDensityChange(value[0])}
                            onValueCommit={(value) => commitMaxDensityChange(value[0])}
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={toggleLinkState}
                            disabled={disabled}
                            className="group/link p-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isValueLinked ? "Unlink density values" : "Link density values"}
                        >
                            {isValueLinked ? (
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-300 opacity-0 group-hover/link:opacity-100 transition-opacity">Unlink</p>
                                    <Link2 className="h-5 w-5 text-gray-300" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-300 opacity-0 group-hover/link:opacity-100 transition-opacity">Link</p>
                                    <Unlink2 className="h-5 w-5 text-gray-300" />
                                </div>
                            )}
                        </button>
                    </div>

                    <p className="text-xs pl-4">
                        * auto-adjusted to tile width: {calculatedDensity / 3}px
                    </p>
                </div>
            </details>
        </TooltipProvider>
    )
} 