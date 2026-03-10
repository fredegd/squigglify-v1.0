"use client"

import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Layers, FileImage, FileText, ArrowDownToLine, Route, LoaderCircle } from "lucide-react"
import type { ColorGroup, ImageData, Settings } from "@/lib/types"
import { generateSVG, extractColorGroupSVG, extractAllColorGroups } from "@/lib/image-processor"

// For PNG Conversion
import { svg2png, initialize as initializeSvg2pngWasm } from 'svg2png-wasm';

// For PDF Conversion
import { pdf, Document, Page, View, Text as PdfText, Svg, Path, Rect, G } from '@react-pdf/renderer';

// Add this at the top level of the module, outside the component
if (typeof window !== 'undefined') {
    // Initialize the global flag if it doesn't exist
    (window as any).__SVG2PNG_WASM_INITIALIZED__ = (window as any).__SVG2PNG_WASM_INITIALIZED__ || false;
}

interface SvgDownloadOptionsProps {
    processedData: ImageData
    settings: Settings
    colorGroups?: Record<string, ColorGroup>
    isProcessing: boolean
}

export default function SvgDownloadOptions({
    processedData,
    settings,
    colorGroups,
    isProcessing
}: SvgDownloadOptionsProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [isWasmInitialized, setIsWasmInitialized] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Dynamically calculate scale factor for high resolution (min 4000px longest edge)
    const getDynamicScaleFactor = (baseWidth: number, baseHeight: number) => {
        const longestEdge = Math.max(baseWidth, baseHeight);
        if (longestEdge === 0) return 4;
        // e.g. if an image is 256x256, scale factor will be ceil(4000/256) = 16
        // This ensures the resulting PNG is at least ~4000px
        return Math.max(4, Math.ceil(4000 / longestEdge));
    };

    useEffect(() => {
        const initWasm = async () => {
            if (typeof window !== "undefined") {
                if (!(window as any).__SVG2PNG_WASM_INITIALIZED__) {
                    console.log("Attempting to initialize svg2png-wasm globally...");
                    try {
                        await initializeSvg2pngWasm(fetch('/svg2png_wasm_bg.wasm'));
                        (window as any).__SVG2PNG_WASM_INITIALIZED__ = true;
                        setIsWasmInitialized(true);
                        console.log("svg2png-wasm initialized successfully globally.");
                    } catch (error) {
                        console.error("Failed to initialize svg2png-wasm globally:", error);
                        if (!(window as any).__SVG2PNG_WASM_INITIALIZED__) {
                            alert("Failed to initialize PNG conversion module. PNG downloads may not work.");
                        }
                        setIsWasmInitialized(false);
                    }
                } else {
                    if (!isWasmInitialized) {
                        setIsWasmInitialized(true);
                        console.log("svg2png-wasm was already initialized. Synced local state.");
                    }
                }
            }
        };
        initWasm();
    }, []);

    // Generate SVG on demand from processedData + current settings
    const generateSvgOnDemand = (): string => {
        return generateSVG(processedData, settings);
    };

    // Generic file download helper
    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handler for downloading the complete SVG
    const handleDownloadFull = () => {
        setIsGenerating(true);
        try {
            const svgContent = generateSvgOnDemand();
            const blob = new Blob([svgContent], { type: "image/svg+xml" });
            downloadFile(blob, "squigglify_output.svg");
        } finally {
            setIsGenerating(false);
        }
    }

    // Handler for downloading a specific color group
    const handleDownloadColorGroup = (colorKey: string, displayName: string) => {
        setIsDownloading(true)
        try {
            const svgContent = generateSvgOnDemand();
            const extractedSvg = extractColorGroupSVG(svgContent, colorKey)
            if (extractedSvg) {
                const filename = `squigglify_output-${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`
                const blob = new Blob([extractedSvg], { type: "image/svg+xml" });
                downloadFile(blob, filename);
            }
        } catch (error) {
            console.error("Error downloading color group:", error)
        } finally {
            setIsDownloading(false)
        }
    }

    // Handler for downloading the SVG as PNG
    const handleDownloadPng = async () => {
        if (!isWasmInitialized) {
            alert("PNG conversion module not ready. Please wait a moment and try again.");
            return;
        }
        setIsDownloading(true);
        setIsGenerating(true);
        try {
            const svgContent = generateSvgOnDemand();

            let baseSvgWidth: number | undefined;
            let baseSvgHeight: number | undefined;

            const viewBoxMatch = svgContent.match(/viewBox=["']\s*([+-]?[\d\.]+)\s+([+-]?[\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s*["']/);
            if (viewBoxMatch && viewBoxMatch[3] && viewBoxMatch[4]) {
                baseSvgWidth = parseFloat(viewBoxMatch[3]);
                baseSvgHeight = parseFloat(viewBoxMatch[4]);
            } else {
                const widthMatch = svgContent.match(/width=["']([^px"\s]+)\s*(px)?["']/);
                if (widthMatch && widthMatch[1]) baseSvgWidth = parseInt(widthMatch[1], 10);
                const heightMatch = svgContent.match(/height=["']([^px"\s]+)\s*(px)?["']/);
                if (heightMatch && heightMatch[1]) baseSvgHeight = parseInt(heightMatch[1], 10);
            }

            let targetPngWidth: number | undefined;
            let targetPngHeight: number | undefined;

            if (baseSvgWidth && baseSvgHeight && baseSvgWidth > 0 && baseSvgHeight > 0) {
                const scale = getDynamicScaleFactor(baseSvgWidth, baseSvgHeight);
                targetPngWidth = baseSvgWidth * scale;
                targetPngHeight = baseSvgHeight * scale;
            }

            const pngUint8Array = await svg2png(svgContent, {
                width: targetPngWidth,
                height: targetPngHeight,
            });
            const blob = new Blob([new Uint8Array(pngUint8Array)], { type: "image/png" });
            downloadFile(blob, "squigglify_output.png");
        } catch (error) {
            console.error("Error downloading PNG:", error);
            alert(`Failed to download PNG: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsDownloading(false);
            setIsGenerating(false);
        }
    };

    // Function to parse SVG and convert to react-pdf SVG components
    const parseSvgToPdfComponents = (svgString: string) => {
        try {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
            const svgElement = svgDoc.documentElement;

            const viewBox = svgElement.getAttribute("viewBox") || "";
            const width = svgElement.getAttribute("width") || "100%";
            const height = svgElement.getAttribute("height") || "100%";

            const convertElement = (element: Element): any => {
                const tagName = element.tagName.toLowerCase();
                const attributes: any = {};

                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    attributes[attr.name] = attr.value;
                }

                const children: any[] = [];
                for (let i = 0; i < element.children.length; i++) {
                    children.push(convertElement(element.children[i]));
                }

                switch (tagName) {
                    case 'path':
                        return <Path key={`path-${Math.random()}`} {...attributes} />;
                    case 'rect':
                        return <Rect key={`rect-${Math.random()}`} {...attributes} />;
                    case 'g':
                        return <G key={`g-${Math.random()}`} {...attributes}>{children}</G>;
                    default:
                        return null;
                }
            };

            const svgChildren: any[] = [];
            for (let i = 0; i < svgElement.children.length; i++) {
                const converted = convertElement(svgElement.children[i]);
                if (converted) svgChildren.push(converted);
            }

            return { viewBox, width, height, children: svgChildren };
        } catch (error) {
            console.error("Error parsing SVG:", error);
            return null;
        }
    };

    const MyPdfDocument = ({ svgString, svgWidth, svgHeight }: { svgString: string, svgWidth: number, svgHeight: number }) => {
        const parsedSvg = parseSvgToPdfComponents(svgString);

        if (!parsedSvg) {
            return (
                <Document>
                    <Page size={[svgWidth, svgHeight]} style={{ padding: 20 }}>
                        <View>
                            <PdfText>Error: Could not parse SVG content.</PdfText>
                        </View>
                    </Page>
                </Document>
            );
        }

        return (
            <Document>
                <Page size={[svgWidth, svgHeight]} style={{ padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                        width: svgWidth * 0.9,
                        height: svgHeight * 0.9,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Svg
                            width={parsedSvg.width}
                            height={parsedSvg.height}
                            viewBox={parsedSvg.viewBox}
                            style={{ width: '100%', height: '100%' }}
                        >
                            {parsedSvg.children}
                        </Svg>
                    </View>
                </Page>
            </Document>
        );
    };

    // Handler for downloading the SVG as PDF
    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        setIsGenerating(true);
        try {
            const svgContent = generateSvgOnDemand();

            let basePageWidth = 595;
            let basePageHeight = 842;

            const viewBoxMatch = svgContent.match(/viewBox=["']\s*([+-]?[\d\.]+)\s+([+-]?[\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s*["']/);
            if (viewBoxMatch && viewBoxMatch[3] && viewBoxMatch[4]) {
                basePageWidth = parseFloat(viewBoxMatch[3]);
                basePageHeight = parseFloat(viewBoxMatch[4]);
            } else {
                const widthMatch = svgContent.match(/width=["']([^px"\s]+)\s*(px)?["']/);
                if (widthMatch && widthMatch[1]) basePageWidth = parseInt(widthMatch[1], 10);
                const heightMatch = svgContent.match(/height=["']([^px"\s]+)\s*(px)?["']/);
                if (heightMatch && heightMatch[1]) basePageHeight = parseInt(heightMatch[1], 10);
            }

            if (!basePageWidth || basePageWidth === 0 || !basePageHeight || basePageHeight === 0) {
                basePageWidth = 595;
                basePageHeight = 842;
            }

            const scale = getDynamicScaleFactor(basePageWidth, basePageHeight);
            const finalPdfPageWidth = basePageWidth * scale;
            const finalPdfPageHeight = basePageHeight * scale;

            const doc = <MyPdfDocument svgString={svgContent} svgWidth={finalPdfPageWidth} svgHeight={finalPdfPageHeight} />;
            const pdfBlob = await pdf(doc).toBlob();
            downloadFile(pdfBlob, "squigglify_output-svg.pdf");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert(`Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsDownloading(false);
            setIsGenerating(false);
        }
    };

    // Handler for downloading all color groups as a ZIP file
    const handleDownloadAllSeparately = async () => {
        if (!colorGroups) return

        setIsDownloading(true)
        setIsGenerating(true)

        try {
            const svgContent = generateSvgOnDemand();
            const JSZip = (await import('jszip')).default
            const zip = new JSZip()

            const extractedGroups = extractAllColorGroups(svgContent)

            Object.entries(extractedGroups).forEach(([colorKey, groupSvg]) => {
                const displayName = colorGroups[colorKey]?.displayName || colorKey
                const filename = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`
                zip.file(filename, groupSvg)
            })

            const content = await zip.generateAsync({ type: "blob" })
            downloadFile(content, "squigglify_output-layers.zip");
        } catch (error) {
            console.error("Error creating ZIP file:", error)
            alert("Failed to create ZIP file. Please try again.")
        } finally {
            setIsDownloading(false)
            setIsGenerating(false)
        }
    }

    const isBusy = isProcessing || isDownloading || isGenerating;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-200 bg-gray-900/70 text-white hover:bg-gray-900/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isBusy}
                >
                    {isGenerating ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowDownToLine className="h-4 w-4" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleDownloadFull} disabled={isBusy}>
                    <Route className="mr-2 h-4 w-4" />
                    Download Complete SVG
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleDownloadPng} disabled={!isWasmInitialized || isBusy}>
                    <FileImage className="mr-2 h-4 w-4" />
                    Download as PNG
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleDownloadPdf} disabled={isBusy}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download as PDF
                </DropdownMenuItem>

                {colorGroups && Object.keys(colorGroups).length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Individual Color Groups</DropdownMenuLabel>

                        <DropdownMenuItem onClick={handleDownloadAllSeparately} disabled={isBusy}>
                            <Layers className="mr-2 h-4 w-4" />
                            All Groups as ZIP (SVG)
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {Object.entries(colorGroups).map(([colorKey, group]) => (
                            <DropdownMenuItem
                                key={colorKey}
                                onClick={() => handleDownloadColorGroup(colorKey, group.displayName)}
                                disabled={isBusy}
                            >
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: group.color }} />
                                {group.displayName} (SVG)
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}