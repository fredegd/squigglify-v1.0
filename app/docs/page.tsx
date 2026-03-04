"use client"

import Link from "next/link"
import NextImage from "next/image"
import { ChevronRight, Settings, Image, Download, Palette, Sliders, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

const SECTIONS = [
    { id: "quick-start", label: "Quick Start" },
    { id: "processing-modes", label: "Processing Modes" },
    { id: "settings-guide", label: "Settings Guide" },
    { id: "advanced-shape-controls", label: "Advanced Shape Controls" },
    { id: "export-options", label: "Export Options" },
    { id: "compatibility", label: "Compatibility" },
]

function Sidebar({ activeSection }: { activeSection: string }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden fixed top-20 left-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Toggle navigation"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Backdrop for mobile */}
            {mobileOpen && (
                <div
                    className="xl:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav
                className={cn(
                    "fixed z-40 top-16 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 p-6 transition-transform duration-300",
                    "xl:sticky xl:top-24 xl:h-fit xl:bg-transparent xl:border-r-0 xl:border-gray-700 xl:p-0 xl:translate-x-0 xl:z-auto",
                    "h-[calc(100vh-4rem)] w-64 xl:w-48 xl:h-auto",
                    mobileOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
                )}
            >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">On this page</p>
                <ul className="space-y-1">
                    {SECTIONS.map((section) => (
                        <li key={section.id}>
                            <a
                                href={`#${section.id}`}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "block text-sm py-1.5 px-3 rounded-md transition-colors border-l-2",
                                    activeSection === section.id
                                        ? "text-purple-400 border-purple-400 bg-purple-900/20"
                                        : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600"
                                )}
                            >
                                {section.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    )
}

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("quick-start")

    useEffect(() => {
        const observers: IntersectionObserver[] = []

        SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id)
            if (!el) return

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveSection(id)
                        }
                    })
                },
                { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
            )
            observer.observe(el)
            observers.push(observer)
        })

        return () => observers.forEach((o) => o.disconnect())
    }, [])

    return (
        <div className="min-h-screen bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex gap-10">
                {/* Sidebar */}
                <div className="hidden xl:block shrink-0 w-48">
                    <div className="sticky top-24">
                        <Sidebar activeSection={activeSection} />
                    </div>
                </div>
                {/* Mobile sidebar (rendered outside the hidden container) */}
                <div className="xl:hidden">
                    <Sidebar activeSection={activeSection} />
                </div>

                {/* Main content */}
                <div className="max-w-4xl flex-1 min-w-0">
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
                    <section id="quick-start" className="mb-12 scroll-mt-24 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-8 border border-purple-700">
                        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                            <ChevronRight className="mr-2" />
                            Quick Start Guide
                        </h2>
                        <ol className="space-y-4 text-gray-300">
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">1</span>
                                <div>
                                    <strong className="text-white">Navigate to the Generator</strong>
                                    <p className="text-sm">Click the &quot;Generator&quot; link in the navigation or on the home page</p>
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
                    <section id="processing-modes" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                            <Palette className="mr-2" />
                            Processing Modes
                        </h2>

                        <div className="space-y-6">
                            {/* Monochrome */}
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 flex flex-col gap-4">
                                <h3 className="text-xl font-semibold text-white mb-3">Monochrome Mode</h3>
                                <p className="text-gray-300 mb-4">
                                    Converts an image to a single color with wave paths of varying density based on brightness.
                                    Perfect for simple, one-color pen plots. Paths are optimized for less pen lifts and more efficient plotting.
                                </p>
                                <NextImage src="/monochrome.png" alt="Monochrome mode example" width={800} height={600} className="w-full rounded-lg border border-gray-600" />
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
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 flex flex-col gap-4">
                                <h3 className="text-xl font-semibold text-white mb-3">Grayscale Mode</h3>
                                <p className="text-gray-300 mb-4">
                                    Creates multiple layers of wave paths with different densities to represent different brightness
                                    levels, resulting in more detailed representations with depth.
                                </p>
                                <NextImage src="/grayscale.png" alt="Grayscale mode example" width={800} height={600} className="w-full rounded-lg border border-gray-600" />
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
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 flex flex-col gap-4">
                                <h3 className="text-xl font-semibold text-white mb-3">Posterize Mode</h3>
                                <p className="text-gray-300 mb-4">
                                    Reduces the image to a limited color palette using K-means clustering, creating separate path-groups for each color. Ideal for stylized but coloured, graphic representations. The output is optimized for less pen lifts and more efficient plotting.
                                </p>
                                <NextImage src="/posterize.png" alt="Posterize mode example" width={800} height={600} className="w-full rounded-lg border border-gray-600" />
                                <div className="bg-gray-800 rounded p-4 border border-gray-600">
                                    <p className="text-sm text-gray-400 mb-2"><strong className="text-gray-200">Best For:</strong></p>
                                    <ul className="text-sm text-gray-300 space-y-1 ml-4">
                                        <li>• Minimal multi-color pen plots (up to 16 colors)</li>
                                        <li>• Pop art style artwork</li>
                                        <li>• Colorful, designs</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Settings Guide */}
                    <section id="settings-guide" className="mb-12 scroll-mt-24">
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
                                <p className="text-purple-400 text-sm">💡 Tip: higher values = more detail but slower processing.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Density (Min/Max)</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Controls how many zigzag lines are drawn per tile. Higher max density = darker areas with more lines.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: the higher the difference between min and max density, the more detailed the output will be.</p>
                                <p className="text-purple-400 text-sm pl-4"> when using Monochrome Processing mode, min and max density shouldn&apos;t be the same.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Brightness Threshold</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                   only pixel areas darker than this threshold are considered for path generation. 
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: Lower the threshold to remove light areas from the output.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Continuous Paths</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    When enabled, connects paths of the same color to minimize pen lifts during plotting.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: use the Path Connection Threshold setting to control the distance between paths.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Curved / Square Paths</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Toggle between edged corner and smooth curves using Bézier curves. Adjust smoothness and rotation for organic effects.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: Toggle on for more hand-drawn, natural appearance</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Rows height</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Adjust the relative height of the rows (based on the square paths). curved paths results in taller rows because of beziers depending on the curve smoothness.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: Lower the row height when using pen or tool a wide stroke width.</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Stroke Width</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Adjust the width of the paths.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: you can simulate a wider stroke width by increasing this value.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Color Amount (only available in Posterize and Grayscale Mode)</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Number of colors to reduce the image to. Uses K-means clustering algorithm.
                                </p>
                                <p className="text-purple-400 text-sm">💡 Tip: use  5-12 colors for balanced results</p>
                            </div>
                        </div>
                    </section>

                    {/* Advanced Shape Controls */}
                    <section id="advanced-shape-controls" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                            <Sliders className="mr-2" />
                            Advanced Shape Controls
                        </h2>
                        <p className="text-gray-300 mb-6">
                            These controls allow fine-tuning of the generated vector shapes. They modify how individual knot points and path segments are positioned, displaced, and shaped. All controls can be reset to defaults via the Reset button in the settings panel.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Curve Smoothness</h3>
                                <p className="text-xs text-gray-500 mb-2 font-mono">only available when Curved Paths is enabled</p>
                                <p className="text-gray-300 text-sm mb-2">
                                    Controls how smooth the Bézier curves are between points. Higher values create smoother, more flowing curves while lower values create tighter, more angular transitions between segments.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> 0.01 – 0.50 &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0.15</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: low values (0.01–0.05) give a pointy, aggressive look. Values around 0.15–0.25 are natural and balanced.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Lower Knot X Shift</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Shifts the horizontal (X) position of the lower knot points in each tile. The range is based on half the tile width in each direction. This effectively tilts or skews the zigzag pattern left or right.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> –(tileWidth/2) to +(tileWidth/2) &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: use small values for a subtle italic-like slant; extreme values produce dramatic diagonal patterns.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Upper Knot Explode</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Controls the magnitude of random displacement applied to upper knot points. At 0%, the upper knots stay in their default positions. At 100%, a pre-calculated random shift is fully applied, making the peaks of the zigzag pattern irregular and organic.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> 0% – 100% &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0%</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: subtle values (10–30%) add a hand-drawn feel. Higher values create chaotic, abstract textures.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Disorganize</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Applies random displacement to every point in each path — both upper and lower knots. At 0%, paths remain perfectly structured. Increasing the value progressively scatters all points, creating an increasingly chaotic and hand-drawn aesthetic.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> 0% – 100% &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0%</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: combine with Curve Smoothness for organic, sketchy styles. Values above 50% can significantly distort the image.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Row Wave Height</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    modulates the row height based on a sinusoidal wave pattern.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> –100% to +100% &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0%</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: negative values invert the wave direction. Works best combined with Column Wave Shift and Wave Frequency.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Column Wave Shift</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                 shift vertically paths according to a sinusoidal wave pattern. Entire columns are shifted vertically based on a cosine function of the row position, producing vertical undulations through the artwork.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> –100% to +100% &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 0%</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: combine with Row Wave Height and adjust Wave Frequency to create complex interference patterns like moiré effects.</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">Wave Frequency</h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Controls the frequency of both Row Wave Height and Column Wave Shift patterns. Higher values create more wave cycles across the grid (tighter waves), while lower values produce fewer, broader waves.
                                </p>
                                <div className="bg-gray-800 rounded p-3 border border-gray-600 mt-3">
                                    <p className="text-xs text-gray-400"><strong className="text-gray-300">Range:</strong> 0.5 – dynamic (based on column count) &nbsp;|&nbsp; <strong className="text-gray-300">Default:</strong> 2.0</p>
                                </div>
                                <p className="text-purple-400 text-sm mt-2">💡 Tip: this control has no visible effect unless Row Wave Height or Column Wave Shift is non-zero.</p>
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <section id="export-options" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                            <Download className="mr-2" />
                            Export Options
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">SVG </h3>
                                <p className="text-gray-300 text-sm mb-3">Vector format, scales infinitely without quality loss</p>
                                <p className="text-xs text-purple-400">✓ Pen plotters<br />✓ Laser cutters<br />✓ Design software</p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">PDF </h3>
                                <p className="text-gray-300 text-sm mb-3">Document format preserving vector quality</p>
                                <p className="text-xs text-purple-400">✓ Print publishing<br />✓ Archiving<br />✓ Professional use</p>
                            </div>
                           
                            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="font-semibold text-white mb-2">PNG </h3>
                                <p className="text-gray-300 text-sm mb-3">Raster format for preview and sharing</p>
                                <p className="text-xs text-purple-400">✓ Social media<br />✓ Quick previews<br />✓ Print</p>
                            </div>

                        </div>
                    </section>

                    {/* Software Compatibility */}
                    <section id="compatibility" className="mb-12 scroll-mt-24 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-8 border border-purple-700">
                        <h3 className="text-lg font-semibold text-white mb-3">Software Compatibility</h3>
                        <p className="text-gray-300 text-sm">
                            The generated SVG files are compatible for use with popular vector graphics software like:
                        </p>
                        <ul className="mt-2 space-y-1 text-gray-300 text-sm ml-4">
                            <li>• Inkscape </li>
                            <li>• Adobe Illustrator</li>
                            <li>• Affinity Designer</li>
                            <li>• and many more...</li>
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
        </div>
    )
}
