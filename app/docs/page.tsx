import Link from "next/link"
import NextImage from "next/image"
import { ChevronRight, Settings, Image, Download, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero Section */}
                <div className="mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Documentation
                    </h1>
                    <p className="text-xl text-gray-300">
                        Everything you need to know to get started with Squigglify
                    </p>
                </div>

                {/* Quick Start */}
                <section className="mb-12 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-8 border border-purple-700">
                    <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                        <ChevronRight className="mr-2" />
                        Quick Start Guide
                    </h2>
                    <ol className="space-y-4 text-gray-300">
                        <li className="flex items-start">
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">1</span>
                            <div>
                                <strong className="text-white">Navigate to the Generator</strong>
                                <p className="text-sm">Click the "Generator" link in the navigation or on the home page</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">2</span>
                            <div>
                                <strong className="text-white">Upload or Select an Image</strong>
                                <p className="text-sm">Either upload an image or use the random image loader to pick one from Wikimedia Commons</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">3</span>
                            <div>
                                <strong className="text-white">Adjust Settings</strong>
                                <p className="text-sm">Choose a processing mode and adjust parameters like density, tiling, and curve controls</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">4</span>
                            <div>
                                <strong className="text-white">Download the SVG</strong>
                                <p className="text-sm">Export in SVG, PNG, or PDF format for use in plotting software or design applications</p>
                            </div>
                        </li>
                    </ol>
                </section>

                {/* Processing Modes */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                        <Palette className="mr-2" />
                        Processing Modes
                    </h2>

                    <div className="space-y-6">
                        {/* Monochrome */}
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold text-white mb-3">Monochrome Mode</h3>
                            <p className="text-gray-300 mb-4">
                                Converts an image to a single color with wave paths of varying density based on brightness.
                                Perfect for simple, one-color pen plots. Paths are optimized for less pen lifts and more efficient plotting.
                            </p>
                            <NextImage src="/monochrome.png" alt="Monochrome mode example" width={800} height={600} className="mt-4 rounded-lg border border-gray-600" />
                            <div className="bg-gray-800 rounded p-4 border border-gray-600">
                                <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-200">Best For:</strong></p>
                                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                                    <li>• Single-pen plotter drawings</li>
                                    <li>• Clean, minimalist artwork</li>
                                    <li>• Quick test plots</li>
                                </ul>
                            </div>
                        </div>

                        {/* Grayscale */}
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold text-white mb-3">Grayscale Mode</h3>
                            <p className="text-gray-300 mb-4">
                                Creates multiple layers of wave paths with different densities to represent different brightness
                                levels, resulting in more detailed representations with depth.
                            </p>
                            <NextImage src="/grayscale.png" alt="Grayscale mode example" width={800} height={600} className="mt-4 rounded-lg border border-gray-600" />
                            <div className="bg-gray-800 rounded p-4 border border-gray-600">
                                <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-200">Best For:</strong></p>
                                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                                    <li>• Multi-layer pen plots</li>
                                    <li>• Detailed portraits and landscapes</li>
                                    <li>• Gradual tonal transitions</li>
                                </ul>
                            </div>
                        </div>

                        {/* Posterize */}
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold text-white mb-3">Posterize Mode</h3>
                            <p className="text-gray-300 mb-4">
                                Reduces the image to a limited color palette using K-means clustering, creating separate path-groups for each color. Ideal for stylized but coloured, graphic representations. The output is optimized for less pen lifts and more efficient plotting.
                            </p>
                            <NextImage src="/posterize.png" alt="Posterize mode example" width={800} height={600} className="mt-4 rounded-lg border border-gray-600" />
                            <div className="bg-gray-800 rounded p-4 border border-gray-600">
                                <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-200">Best For:</strong></p>
                                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                                    <li>• Minimal multi-color pen plots (max 16 colors)</li>
                                    <li>• Pop art style artwork</li>
                                    <li>• Colorful, designs</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Guide */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                        <Settings className="mr-2" />
                        Settings Guide
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">Tiling (Columns & Rows)</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Controls the grid resolution. Higher values = more detail but slower processing.
                            </p>
                            <p className="text-purple-400 text-sm">💡 Tip: Start with 40x40, increase for more detail</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">Density (Min/Max)</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Controls how many zigzag lines are drawn per tile. Higher max density = darker areas with more lines.
                            </p>
                            <p className="text-purple-400 text-sm">💡 Tip: Min 1-2, Max 4-8 for balanced results</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">Continuous Paths</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                When enabled, connects paths of the same color to minimize pen lifts during plotting.
                            </p>
                            <p className="text-purple-400 text-sm">💡 Tip: Enable for pen plotters to improve efficiency</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">Curved Paths</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Converts straight zigzag lines into smooth curves using Bézier curves. Adjust smoothness and rotation for organic effects.
                            </p>
                            <p className="text-purple-400 text-sm">💡 Tip: Toggle on for more hand-drawn, natural appearance</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">Color Amount (Posterize Mode)</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Number of colors to reduce the image to. Uses K-means clustering algorithm.
                            </p>
                            <p className="text-purple-400 text-sm">💡 Tip: 5-10 colors for balanced results, higher for more detail</p>
                        </div>
                    </div>
                </section>

                {/* Export Options */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                        <Download className="mr-2" />
                        Export Options
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">SVG Format</h3>
                            <p className="text-gray-300 text-sm mb-3">Vector format, scales infinitely without quality loss</p>
                            <p className="text-xs text-purple-400">✓ Pen plotters<br />✓ Laser cutters<br />✓ Design software</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">PNG Format</h3>
                            <p className="text-gray-300 text-sm mb-3">Raster format for preview and sharing</p>
                            <p className="text-xs text-purple-400">✓ Social media<br />✓ Quick previews<br />✓ Print (at resolution)</p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="font-semibold text-white mb-2">PDF Format</h3>
                            <p className="text-gray-300 text-sm mb-3">Document format preserving vector quality</p>
                            <p className="text-xs text-purple-400">✓ Print publishing<br />✓ Archiving<br />✓ Professional use</p>
                        </div>
                    </div>
                </section>

                {/* Pen Plotter Guide */}
                <section className="mb-12 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-8 border border-purple-700">
                

                    <h3 className="text-lg font-semibold text-white mb-3">Software Compatibility</h3>
                    <p className="text-gray-300 text-sm">
                        The generated SVG files are compatible for use with popular vector graphics software including:
                    </p>
                    <ul className="mt-2 space-y-1 text-gray-300 text-sm ml-4">
                        <li>• Inkscape </li>
                        <li>• Adobe Illustrator</li>
                        <li>• Affinity Designer</li>
                        <li>• vpype </li>
                    </ul>
                </section>

                {/* CTA */}
                <div className="text-center">
                    <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                        <Link href="/generator">
                            Generate Squiggly Art
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
