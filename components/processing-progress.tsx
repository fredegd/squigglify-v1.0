import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

interface ProcessingProgressProps {
    progress: number
    status: string
    onCancel?: () => void
}

export default function ProcessingProgress({ progress, status, onCancel }: ProcessingProgressProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                        <h3 className="text-lg font-semibold text-white">Processing Image</h3>
                    </div>
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="hover:bg-gray-800"
                            aria-label="Cancel"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    <Progress value={progress} className="h-2" />

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{status}</span>
                        <span className="text-purple-400 font-medium">{Math.round(progress)}%</span>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center">
                    This may take a moment for large images or complex settings
                </p>
            </div>
        </div>
    )
}
