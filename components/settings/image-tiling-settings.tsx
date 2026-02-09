"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider-w-buttons"
import { Label } from "@/components/ui/label"
import { ChevronDown, Link, Link2, Unlink2 } from "lucide-react"
import type { Settings } from "@/lib/types"

interface ImageTilingSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
}

export default function ImageTilingSettings({ settings, onSettingsChange, disabled }: ImageTilingSettingsProps) {
    const [isValueLinked, setIsValueLinked] = useState(false)

    const handleColumnsChange = (value: number) => {
        if (isValueLinked) {
            onSettingsChange({ columnsCount: value, rowsCount: value })
        } else {
            onSettingsChange({ columnsCount: value })
        }
    }

    const handleRowsChange = (value: number) => {
        if (isValueLinked) {
            onSettingsChange({ columnsCount: value, rowsCount: value })
        } else {
            onSettingsChange({ rowsCount: value })
        }
    }

    const toggleLinkState = () => {
        setIsValueLinked(!isValueLinked)
    }
    return (
        <details className="group" >
            <summary className="cursor-pointer text-lg font-bold  my-6 flex items-center justify-between ">
                <h3 className="flex items-center gap-2 text-gradient">Image Tiling</h3>
                <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="columnsCount-setting">Columns: {settings.columnsCount}</Label>
                    </div>
                    <Slider
                        id="columnsCount-setting"
                        min={1}
                        max={128}
                        step={1}
                        value={[settings.columnsCount]}
                        onValueChange={(value) => handleColumnsChange(value[0])}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-300">Number of horizontal tiles</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="rowsCount-setting">Rows: {settings.rowsCount}</Label>
                    </div>
                    <Slider
                        id="rowsCount-setting"
                        min={1}
                        max={128}
                        step={1}
                        value={[settings.rowsCount]}
                        onValueChange={(value) => handleRowsChange(value[0])}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-300">Number of vertical tiles</p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={toggleLinkState}
                        disabled={disabled}
                        className="group/link p-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isValueLinked ? "Unlink values" : "Link values"}
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
            </div>
        </details>
    )
} 