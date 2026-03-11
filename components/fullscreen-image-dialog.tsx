import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { ImageData } from "@/lib/types"

interface FullscreenImageDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  originalImage: string | null
  processedData?: ImageData | null
}

export function FullscreenImageDialog({
  isOpen,
  onOpenChange,
  originalImage,
  processedData
}: FullscreenImageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 bg-black/95">
        <div className="relative w-full h-full flex items-center justify-center">
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
  )
}
