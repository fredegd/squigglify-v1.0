"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Layers, FileImage, FileText, ArrowDownToLine, Route } from "lucide-react"
import type { ColorGroup } from "@/lib/types"
import { extractColorGroupSVG, extractAllColorGroups } from "@/lib/image-processor"

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
    svgContent: string | null
    colorGroups?: Record<string, ColorGroup>
    isProcessing: boolean
}

export default function SvgDownloadOptions({
    svgContent,
    colorGroups,
    isProcessing
}: SvgDownloadOptionsProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [isWasmInitialized, setIsWasmInitialized] = useState(false);

    // Define the common scale factor here
    // TODO: Make this a prop
    // TODO: build a input or a slider somewhere for this prop
    const exportScaleFactor = 4;

    useEffect(() => {
        const initWasm = async () => {
            if (typeof window !== "undefined") { // Ensure running in browser
                if (!(window as any).__SVG2PNG_WASM_INITIALIZED__) {
                    console.log("Attempting to initialize svg2png-wasm globally...");
                    try {
                        await initializeSvg2pngWasm(fetch('/svg2png_wasm_bg.wasm'));
                        (window as any).__SVG2PNG_WASM_INITIALIZED__ = true; // Set global flag on success
                        setIsWasmInitialized(true); // Set local component state
                        console.log("svg2png-wasm initialized successfully globally.");
                    } catch (error) {
                        console.error("Failed to initialize svg2png-wasm globally:", error);
                        // Only show alert if it truly failed for the first time
                        if (!(window as any).__SVG2PNG_WASM_INITIALIZED__) {
                            alert("Failed to initialize PNG conversion module. PNG downloads may not work.");
                        }
                        setIsWasmInitialized(false); // Reflect failure in local state
                    }
                } else {
                    // WASM already globally initialized, just sync local state
                    if (!isWasmInitialized) { // Avoid unnecessary state update if already true
                        setIsWasmInitialized(true);
                        console.log("svg2png-wasm was already initialized. Synced local state.");
                    }
                }
            }
        };
        initWasm();
    }, []); // Empty dependency array: runs once on mount, or if global flag syncs local state

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
        if (!svgContent) return
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        downloadFile(blob, "squigglify_output.svg");
    }

    // Handler for downloading a specific color group
    const handleDownloadColorGroup = (colorKey: string, displayName: string) => {
        if (!svgContent) return

        setIsDownloading(true)
        try {
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
    const handleDownloadPng = async (svgInput: string, baseFilename: string) => {
        if (!svgInput) {
            alert("No SVG content to download.");
            return;
        }
        if (!isWasmInitialized) {
            alert("PNG conversion module not ready. Please wait a moment and try again.");
            console.error("WASM not initialized for PNG conversion.");
            return;
        }
        setIsDownloading(true);
        try {
            let baseSvgWidth: number | undefined;
            let baseSvgHeight: number | undefined;

            // Prioritize viewBox for dimensions
            const viewBoxMatch = svgInput.match(/viewBox=[\"']\s*([+-]?[\d\.]+)\s+([+-]?[\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s*[\"']/);
            if (viewBoxMatch && viewBoxMatch[3] && viewBoxMatch[4]) {
                baseSvgWidth = parseFloat(viewBoxMatch[3]);
                baseSvgHeight = parseFloat(viewBoxMatch[4]);
                console.log(`PNG: Base dimensions from viewBox: ${baseSvgWidth}x${baseSvgHeight}`);
            } else {
                // Fallback to width/height attributes (less reliable for non-px units)
                const widthMatch = svgInput.match(/width=[\"']([^px\"\s]+)\s*(px)?[\"']/);
                if (widthMatch && widthMatch[1]) {
                    baseSvgWidth = parseInt(widthMatch[1], 10);
                }
                const heightMatch = svgInput.match(/height=[\"']([^px\"\s]+)\s*(px)?[\"']/);
                if (heightMatch && heightMatch[1]) {
                    baseSvgHeight = parseInt(heightMatch[1], 10);
                }
                console.log(`PNG: Base dimensions from attributes (fallback): ${baseSvgWidth}x${baseSvgHeight}`);
            }

            let targetPngWidth: number | undefined = undefined;
            let targetPngHeight: number | undefined = undefined;

            if (baseSvgWidth && baseSvgHeight && baseSvgWidth > 0 && baseSvgHeight > 0) {
                targetPngWidth = baseSvgWidth * exportScaleFactor;
                targetPngHeight = baseSvgHeight * exportScaleFactor;
                console.log(`PNG: Target dimensions for output: ${targetPngWidth}x${targetPngHeight}`);
            } else {
                console.warn(`PNG: SVG base dimensions not found or zero. svg2png will use its defaults and apply scale factor.`);
                // If base dimensions are not found, svg2png will use its internal logic, and exportScaleFactor will apply to that.
            }

            const pngUint8Array = await svg2png(svgInput, {
                width: targetPngWidth,
                height: targetPngHeight,
                // scale: exportScaleFactor, // Let width/height define the final size explicitly based on scaled viewBox
            });
            const blob = new Blob([new Uint8Array(pngUint8Array)], { type: "image/png" });
            downloadFile(blob, `${baseFilename}.png`);
        } catch (error) {
            console.error("Error downloading PNG:", error);
            alert(`Failed to download PNG: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsDownloading(false);
        }
    };

    // Function to parse SVG and convert to react-pdf SVG components
    const parseSvgToPdfComponents = (svgString: string) => {
        try {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
            const svgElement = svgDoc.documentElement;

            // Extract SVG attributes
            const viewBox = svgElement.getAttribute("viewBox") || "";
            const width = svgElement.getAttribute("width") || "100%";
            const height = svgElement.getAttribute("height") || "100%";

            // Function to convert DOM elements to react-pdf components
            const convertElement = (element: Element): any => {
                const tagName = element.tagName.toLowerCase();
                const attributes: any = {};

                // Copy all attributes
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    attributes[attr.name] = attr.value;
                }

                // Convert children
                const children: any[] = [];
                for (let i = 0; i < element.children.length; i++) {
                    children.push(convertElement(element.children[i]));
                }

                // Return appropriate react-pdf component based on tag name
                switch (tagName) {
                    case 'path':
                        return <Path key={`path-${Math.random()}`} {...attributes} />;
                    case 'rect':
                        return <Rect key={`rect-${Math.random()}`} {...attributes} />;
                    case 'g':
                        return <G key={`g-${Math.random()}`} {...attributes}>{children}</G>;
                    // Add more SVG elements as needed (circle, line, polygon, etc.)
                    default:
                        console.warn(`Unsupported SVG element: ${tagName}`);
                        return null;
                }
            };

            // Convert all children of the SVG element
            const svgChildren: any[] = [];
            for (let i = 0; i < svgElement.children.length; i++) {
                const converted = convertElement(svgElement.children[i]);
                if (converted) {
                    svgChildren.push(converted);
                }
            }

            return {
                viewBox,
                width,
                height,
                children: svgChildren
            };
        } catch (error) {
            console.error("Error parsing SVG:", error);
            return null;
        }
    };

    // PDF Document Component with native SVG support
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
                            style={{
                                width: '100%',
                                height: '100%'
                            }}
                        >
                            {parsedSvg.children}
                        </Svg>
                    </View>
                </Page>
            </Document>
        );
    };

    // Handler for downloading the SVG as PDF
    const handleDownloadPdf = async (svgInput: string, baseFilename: string) => {
        if (!svgInput) {
            alert("No SVG content to download.");
            return;
        }

        setIsDownloading(true);
        try {
            // Determine base dimensions for the PDF page
            let basePageWidth = 595; // Default A4 width in points if no viewBox
            let basePageHeight = 842; // Default A4 height in points if no viewBox

            const viewBoxMatch = svgInput.match(/viewBox=[\"']\s*([+-]?[\d\.]+)\s+([+-]?[\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s*[\"']/);
            if (viewBoxMatch && viewBoxMatch[3] && viewBoxMatch[4]) {
                basePageWidth = parseFloat(viewBoxMatch[3]);
                basePageHeight = parseFloat(viewBoxMatch[4]);
                console.log(`PDF: Base dimensions from viewBox: ${basePageWidth}x${basePageHeight}`);
            } else {
                const widthMatch = svgInput.match(/width=[\"']([^px\"\s]+)\s*(px)?[\"']/);
                if (widthMatch && widthMatch[1]) {
                    basePageWidth = parseInt(widthMatch[1], 10);
                }
                const heightMatch = svgInput.match(/height=[\"']([^px\"\s]+)\s*(px)?[\"']/);
                if (heightMatch && heightMatch[1]) {
                    basePageHeight = parseInt(heightMatch[1], 10);
                }
                console.log(`PDF: Base dimensions from attributes: ${basePageWidth}x${basePageHeight}`);
            }

            if (!basePageWidth || basePageWidth === 0 || !basePageHeight || basePageHeight === 0) {
                console.warn(`PDF: SVG base dimensions not found or zero. Using default A4 size.`);
                basePageWidth = 595;
                basePageHeight = 842;
            }

            // Calculate scaled PDF page dimensions
            const finalPdfPageWidth = basePageWidth * exportScaleFactor;
            const finalPdfPageHeight = basePageHeight * exportScaleFactor;
            console.log(`PDF: Scaled page dimensions: ${finalPdfPageWidth}x${finalPdfPageHeight}`);

            const doc = <MyPdfDocument svgString={svgInput} svgWidth={finalPdfPageWidth} svgHeight={finalPdfPageHeight} />;
            const pdfBlob = await pdf(doc).toBlob();
            downloadFile(pdfBlob, `${baseFilename}-svg.pdf`);

        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert(`Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsDownloading(false);
        }
    };

    // Handler for downloading all color groups as a ZIP file
    const handleDownloadAllSeparately = async () => {
        if (!svgContent || !colorGroups) return

        setIsDownloading(true)

        try {
            // Dynamic import of JSZip
            const JSZip = (await import('jszip')).default
            const zip = new JSZip()

            // Extract all color groups
            const extractedGroups = extractAllColorGroups(svgContent)

            // Add each SVG to the ZIP file
            Object.entries(extractedGroups).forEach(([colorKey, groupSvg]) => {
                const displayName = colorGroups[colorKey]?.displayName || colorKey
                const filename = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`
                zip.file(filename, groupSvg)
            })

            // Generate the ZIP file
            const content = await zip.generateAsync({ type: "blob" })

            // Download the ZIP file
            const url = URL.createObjectURL(content)
            const a = document.createElement("a")
            a.href = url
            a.download = "squigglify_output-layers.zip"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error creating ZIP file:", error)
            alert("Failed to create ZIP file. Please try again.")
        } finally {
            setIsDownloading(false)
        }
    }

    // Don't show anything if there's no SVG content
    if (!svgContent) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className=" text-lg h-8 w-8 p-0 rounded-full !bg-transparent hover:text-red-400" disabled={isProcessing || isDownloading} >
                    <ArrowDownToLine className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleDownloadFull}>
                    <Route className="mr-2 h-4 w-4" />
                    Download Complete SVG
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => svgContent && handleDownloadPng(svgContent, "squigglify_output")} disabled={!isWasmInitialized || isDownloading}>
                    <FileImage className="mr-2 h-4 w-4" />
                    Download as PNG
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => svgContent && handleDownloadPdf(svgContent, "squigglify_output")} disabled={isDownloading}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download as PDF
                </DropdownMenuItem>

                {colorGroups && Object.keys(colorGroups).length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Individual Color Groups</DropdownMenuLabel>

                        <DropdownMenuItem onClick={handleDownloadAllSeparately} disabled={isDownloading}>
                            <Layers className="mr-2 h-4 w-4" />
                            All Groups as ZIP (SVG)
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {Object.entries(colorGroups).map(([colorKey, group]) => (
                            <DropdownMenuItem
                                key={colorKey}
                                onClick={() => handleDownloadColorGroup(colorKey, group.displayName)}
                                disabled={isDownloading}
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