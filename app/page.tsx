import Link from "next/link"
import { ArrowRight, Zap, Palette, Download, Github, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center mt-16 flex flex-col items-center justify-center gap-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-900/50 border border-purple-700 text-purple-300 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Transform Images into SVG Art
              </div>
            </div>

            <h1 className=" p-4 text-5xl sm:text-6xl lg:text-7xl font-bold  bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Squigglify
            </h1>

            <p className="text-2xl sm:text-3xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Turn any image into squiggly vector art
            </p>

            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Optimized for pen plotters, CNC machines, and laser cutters.
              Create beautiful, continuous-path SVG graphics with customizable wave patterns.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8">
                <Link href="/generator">
                  Try Generator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-purple-400 text-purple-400 hover:bg-purple-900 text-lg px-8">
                <Link href="/docs">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Powerful Features for Artists & Makers
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create professional-quality vector art from your images
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Pen Plotter Optimized</h3>
              <p className="text-gray-400">
                Generate continuous paths that minimize pen lifts, optimizing plotting speed and efficiency.
                Perfect for AxiDraw, Cricut, and other pen plotters.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700 hover:border-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Multiple Processing Modes</h3>
              <p className="text-gray-400">
                Choose from Monochrome, Grayscale, or Posterize modes. Each offers unique artistic styles
                and is perfect for different applications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Flexible Export Options</h3>
              <p className="text-gray-400">
                Export in SVG for pen plotting and design, PNG for sharing and previews,
                or PDF for professional print applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Processing Modes Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Three Unique Processing Modes
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Each mode offers a distinct artistic style for your vector art
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Monochrome</h3>
                <p className="text-purple-400 text-sm mb-4">Single color, varying density</p>
              </div>
              <p className="text-gray-400 mb-4">
                Perfect for clean, minimalist artwork with a single pen or color.
                Density varies based on brightness for beautiful tonal rendering.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>✓ Simple one-color plots</li>
                <li>✓ Quick test drawings</li>
                <li>✓ Minimalist aesthetic</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Grayscale</h3>
                <p className="text-purple-400 text-sm mb-4">Multiple gray levels, detailed</p>
              </div>
              <p className="text-gray-400 mb-4">
                Creates layers of different gray levels for detailed representations
                with depth. Ideal for portraits and landscapes.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>✓ Multi-layer plots</li>
                <li>✓ Smooth gradients</li>
                <li>✓ Detailed artwork</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Posterize</h3>
                <p className="text-purple-400 text-sm mb-4">Limited color palette, vibrant</p>
              </div>
              <p className="text-gray-400 mb-4">
                Reduces images to a custom color palette using K-means clustering.
                Perfect for colorful, graphic-style artwork.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>✓ Multi-color plots</li>
                <li>✓ Pop art style</li>
                <li>✓ Vibrant designs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Perfect For
            </h2>
            <p className="text-xl text-gray-400">
              From pen plotting to digital art, Squigglify has you covered
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700 text-center">
              <div className="text-4xl mb-3">🖊️</div>
              <h3 className="font-semibold text-white mb-2">Pen Plotters</h3>
              <p className="text-gray-400 text-sm">AxiDraw, Cricut & more</p>
            </div>

            <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700 text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-semibold text-white mb-2">Digital Art</h3>
              <p className="text-gray-400 text-sm">Unique artistic interpretations</p>
            </div>

            <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700 text-center">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="font-semibold text-white mb-2">CNC & Laser</h3>
              <p className="text-gray-400 text-sm">Toolpaths & engraving</p>
            </div>

            <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700 text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-semibold text-white mb-2">Print Design</h3>
              <p className="text-gray-400 text-sm">Posters & illustrations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-pink-900/30"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Create?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your images into squiggly SVG art in just a few clicks.
            Free, open source, and runs entirely in your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8">
              <Link href="/generator">
                Launch Generator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="border-purple-400 text-purple-400 hover:bg-purple-900 text-lg px-8">
              <a
                href="https://github.com/fredegd/squigglify-v1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
