import { Github, Book, Zap, Palette, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        About Squigglify
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Transform your images into beautiful SVG art, optimized for pen plotters and digital design
                    </p>
                </div>

                {/* Project Overview */}
                <section className="mb-12 bg-gray-900/50 rounded-lg p-8 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-white">What is Squigglify?</h2>
                    <p className="text-gray-300 mb-4">
                        Squigglify is a powerful web-based tool that converts regular images into path-based SVG graphics using
                        wave-like patterns. The application creates visually distinctive vector drawings that are optimized for
                        pen plotters, CNC machines, and laser cutters, while also providing beautiful artistic renderings for
                        digital and print media.
                    </p>
                    <p className="text-gray-300">
                        Born from a passion for generative art and pen plotting, Squigglify bridges the gap between digital
                        images and physical drawings, making it easy for artists and makers to create plotter-ready artwork.
                    </p>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-white">How It Works</h2>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4 bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">Image Analysis</h3>
                                <p className="text-gray-300">
                                    Your image is analyzed and broken down into a grid of pixels, extracting color and brightness information
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">Color Grouping</h3>
                                <p className="text-gray-300">
                                    Pixels are grouped by color or brightness level based on your selected processing mode
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">Path Generation</h3>
                                <p className="text-gray-300">
                                    Wave-like paths are created with density based on brightness, darker areas get more lines
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                4
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">SVG Export</h3>
                                <p className="text-gray-300">
                                    Paths are optimized and exported as standard SVG format, ready for plotting or further editing
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-white">Use Cases</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <Zap className="h-8 w-8 text-purple-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Pen Plotting</h3>
                            <p className="text-gray-300 text-sm">
                                Optimize your artwork for AxiDraw, Cricut, and other pen plotters with continuous path generation
                            </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <Palette className="h-8 w-8 text-purple-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Digital Art</h3>
                            <p className="text-gray-300 text-sm">
                                Create unique artistic interpretations of photographs with customizable wave patterns
                            </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <Download className="h-8 w-8 text-purple-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Print Design</h3>
                            <p className="text-gray-300 text-sm">
                                Generate distinctive line art illustrations perfect for posters, books, and merchandise
                            </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                            <Book className="h-8 w-8 text-purple-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">CNC & Laser</h3>
                            <p className="text-gray-300 text-sm">
                                Create toolpaths for CNC routing and pattern designs for laser cutting/engraving
                            </p>
                        </div>
                    </div>
                </section>

                {/* Technology Stack */}
                <section className="mb-12 bg-gray-900/50 rounded-lg p-8 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-white">Technology Stack</h2>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                            <strong className="mr-2">Next.js 14</strong> - React framework with App Router
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                            <strong className="mr-2">TypeScript</strong> - Type-safe development
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                            <strong className="mr-2">Tailwind CSS</strong> - Styling and design
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                            <strong className="mr-2">Canvas API</strong> - Image processing
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                            <strong className="mr-2">K-means Clustering</strong> - Color quantization
                        </li>
                    </ul>
                </section>

                {/* Open Source & Contributing */}
                <section className="mb-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 border border-purple-700">
                    <h2 className="text-2xl font-bold mb-4 text-white">Open Source & Contributing</h2>
                    <p className="text-gray-200 mb-6">
                        Squigglify is open source and released under the MIT License. We welcome contributions, bug reports,
                        and feature requests from the community!
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button asChild variant="default" className="bg-purple-600 hover:bg-purple-700">
                            <a
                                href="https://github.com/fredegd/squigglify-v1.0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                            >
                                <Github className="mr-2 h-4 w-4" />
                                View on GitHub
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-900">
                            <a
                                href="https://github.com/fredegd/squigglify-v1.0/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Report Issue
                            </a>
                        </Button>
                    </div>
                </section>

                {/* Credits */}
                <section className="text-center">
                    <p className="text-gray-400">
                        Created with ❤️ by{" "}
                        <a
                            href="https://github.com/fredegd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            fredegd
                        </a>
                    </p>
                </section>
            </div>
        </div>
    )
}
