import Link from "next/link"
import { Github, Twitter, Heart } from "lucide-react"

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                            Squigglify
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Transform images into squiggly SVG art, optimized for pen plotters and digital design.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://github.com/fredegd/squigglify-v1.0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-3">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/generator" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                    Generator
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                    Documentation
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-semibold mb-3">Resources</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://github.com/fredegd/squigglify-v1.0"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                                >
                                    GitHub Repository
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/fredegd/squigglify-v1.0/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                                >
                                    Report Issues
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/fredegd/squigglify-v1.0/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                                >
                                    License (MIT)
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm mb-4 sm:mb-0">
                        © {currentYear} Squigglify. All rights reserved.
                    </p>
                    <p className="text-gray-400 text-sm flex items-center">
                        Created with <Heart className="h-4 w-4 mx-1 text-red-500" /> by{" "}
                        <a
                            href="https://github.com/fredegd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            fredegd
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
}
