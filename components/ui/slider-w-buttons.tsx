"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Button } from "./button"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState<number[]>(value || [min])

  const currentValue = value || internalValue
  const handleValueChange = onValueChange || setInternalValue

  const handleDecrement = () => {
    const newValue = Math.max(min, currentValue[0] - step)
    handleValueChange([newValue])
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, currentValue[0] + step)
    handleValueChange([newValue])
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={currentValue[0] <= min}
        className="h-6 w-6 p-0 shrink-0 rounded-full hover:bg-gray-300/50"
      >
        -
      </Button>

      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={currentValue}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={currentValue[0] >= max}
        className="h-6 w-6 p-0 shrink-0 rounded-full hover:bg-gray-300/50"
      >
        +
      </Button>
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
