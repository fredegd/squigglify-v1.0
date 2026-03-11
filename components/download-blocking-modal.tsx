import { Loader2 } from "lucide-react"

interface DownloadBlockingModalProps {
    progress: number
    status: string
    title?: string
}

export default function DownloadBlockingModal({ progress, status, title = "Preparing Download" }: DownloadBlockingModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        <div className="absolute inset-0 blur-sm bg-purple-500/20 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                </div>

                <div className="space-y-4">
                    <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-medium">{status}</span>
                        <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-8 text-center italic">
                    Great things take time. Your download will be ready in just a moment.
                </p>
            </div>
        </div>
    )
}
