"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider-w-buttons"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Download } from "lucide-react"
import type { EmbroiderySettings, ColorGroup } from "@/lib/types"
import { HOOP_PRESETS, DEFAULT_EMBROIDERY_SETTINGS } from "@/lib/types"
import { findNearestPecThread, hexToRgb } from "@/lib/utils/pes-encoder"

interface EmbroiderySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (settings: EmbroiderySettings) => void
  colorGroups?: Record<string, ColorGroup>
}

export default function EmbroiderySettingsDialog({
  open,
  onOpenChange,
  onConfirm,
  colorGroups,
}: EmbroiderySettingsDialogProps) {
  const [settings, setSettings] = useState<EmbroiderySettings>(DEFAULT_EMBROIDERY_SETTINGS)
  const [hoopPresetIndex, setHoopPresetIndex] = useState("0")

  const colorMapping = useMemo(() => {
    if (!colorGroups) return []
    return Object.entries(colorGroups).map(([, group]) => {
      const rgb = hexToRgb(group.color)
      const thread = findNearestPecThread(rgb.r, rgb.g, rgb.b)
      return {
        originalColor: group.color,
        displayName: group.displayName,
        threadName: thread.name,
        threadColor: `rgb(${thread.r}, ${thread.g}, ${thread.b})`,
      }
    })
  }, [colorGroups])

  const handleHoopChange = (value: string) => {
    setHoopPresetIndex(value)
    if (value !== "custom") {
      const preset = HOOP_PRESETS[parseInt(value)]
      setSettings(prev => ({
        ...prev,
        hoopWidth: preset.widthMm,
        hoopHeight: preset.heightMm,
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-gray-100">
        <TooltipProvider>
        <DialogHeader>
          <DialogTitle className="text-white">PES Embroidery Export</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure settings for your Brother embroidery machine.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Hoop Size */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Hoop Size</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Select the hoop size matching your embroidery machine. The design will be scaled to fit.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={hoopPresetIndex} onValueChange={handleHoopChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {HOOP_PRESETS.map((preset, idx) => (
                  <SelectItem key={idx} value={String(idx)} className="text-gray-200">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Design area: {settings.hoopWidth} x {settings.hoopHeight} mm
            </p>
          </div>

          {/* Jump Threshold */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>
                Jump Threshold: {settings.jumpThreshold.toFixed(1)} mm
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Distance beyond which the machine will perform a jump stitch instead of a regular stitch when moving between path segments.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              min={1.0}
              max={10.0}
              step={0.5}
              value={[settings.jumpThreshold]}
              onValueChange={(v) => setSettings(prev => ({ ...prev, jumpThreshold: v[0] }))}
            />
          </div>

          {/* Thread Color Mapping */}
          {colorMapping.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Thread Color Mapping</Label>
              <div className="max-h-32 overflow-y-auto rounded border border-gray-700 bg-gray-800/50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="px-2 py-1 text-left">Design</th>
                      <th className="px-2 py-1 text-left">PEC Thread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colorMapping.map((mapping, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="px-2 py-1 flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-gray-600"
                            style={{ backgroundColor: mapping.originalColor }}
                          />
                          <span className="text-gray-300 truncate">{mapping.displayName}</span>
                        </td>
                        <td className="px-2 py-1">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3 rounded-sm border border-gray-600"
                              style={{ backgroundColor: mapping.threadColor }}
                            />
                            <span className="text-gray-300">{mapping.threadName}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                Colors are auto-matched to the nearest Brother PEC thread.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(settings)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export PES
          </Button>
        </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
