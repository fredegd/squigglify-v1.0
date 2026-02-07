# Squigglify

![Squigglify](./public/favicon-32x32.png)

A powerful web-based tool to convert images into SVG vector graphics with customizable wave paths, perfect for pen plotters and digital art.

## Live Demo

Visit the live application at: [https://squigglify.vercel.app/](https://squigglify.vercel.app/)

## Overview

this App transforms regular images into path-based SVG graphics using wave-like patterns. The application creates visually distinctive vector drawings that are optimized for pen plotters, CNC machines, and laser cutters, while also providing beautiful artistic renderings for digital and print media.

### Key Features

- **Image to SVG Conversion**: Transform any image into a vector SVG using wave-like paths
- **Curved Path Optimization**: Generate smooth, curved paths that optimize pen plotter efficiency and speed. Customize curvature for a more organic, hand-drawn appeal.
- **Random Image Starter**: Quickly begin with a random image sourced from Wikimedia Commons.
- **Multiple Processing Modes**:
  - **Monochrome**: Single-color paths with density based on brightness
  - **Grayscale**: Multiple levels of gray for more detailed gradation
  - **Posterize**: Reduced color palette for stylized results

## Use Cases

### Pen Plotting

The primary use case for Squigglify is generating SVG files, very useful for pen plotters. The curved path technology significantly improves plotting efficiency by:

- Reducing the number of pen lifts required
- Creating smoother, more continuous motion
- Optimizing travel paths between sections
- Supporting multi-color plotting through Posterization

### Other Applications

of course once one have a Svalable Vector Graphics, it can be used for many other purposes:

- **CNC Routing**: Produce toolpaths for custom machining
- **Digital Art**: Create unique artistic interpretations of photographs
- **Print Media**: Design distinctive line art illustrations
- **Laser Cutting/Engraving**: Generate patterns for material etching

## How to Use

1. **Upload an Image or Use a Random Starter**: Select any image file from your device, or use the random image loader to pick an random image from Wikimedia Commons.
2. **Configure Settings**:
   - Choose a processing mode (Monochrome, Grayscale, or Posterize)
   - Adjust grid density, curve parameters (for organic appeal), and other settings
   - Adjust grid Tiling (columns and rows)
   - Toggle continuous paths and curved paths options
3. **Preview & Refine**: See a real-time preview of your vector output
4. **Download**: Export the final SVG for use in plotting software or graphic design applications
5. **Download**: It support also PNG and PDF formats.

**coming soon:** 

export to even bigger formats, like A3, A4, A2, A1, A0.

## Processing Modes

### Monochrome

Converts your image to a single color with wave paths of varying density based on the brightness of the original image. Perfect for simple, one-color pen plots.

### Grayscale

Creates multiple layers of wave paths with different densities to represent different brightness levels in your image, resulting in a more detailed representation with depth.

### Posterize

Reduces your image to a limited color palette, creating separate path groups for each color level. Ideal for stylized, graphic representations.

## Advanced Options

- **Curved Paths & Organic Styling**: Toggle between angular zigzags and smooth curved paths. Fine-tune curve parameters to achieve a more organic, hand-drawn look, potentially including shifted path effects.
- **Path Density**: Control the density of wave paths for each brightness level
- **Grid Size**: Adjust the number of rows and columns in the grid
- **Continuous Paths**: Generate unbroken, connected paths for more efficient plotting

## Technical Details

The application processes images in several steps:

1. **Image Analysis**: Breaks down the image into a grid of pixels
2. **Path Generation**: Creates wave paths based on pixel brightness/color
3. **Path Optimization**: Connects paths for continuous plotting when possible
4. **SVG Rendering**: Exports paths as standard SVG for maximum compatibility

## Development

This application is built with:

- Next.js for the React framework
- TypeScript for type safety
- Tailwind CSS for styling
- HTML Canvas API for image processing

## Local Development.

To run the application locally:

1. Clone the repository:

   ```bash
   git clone git@github.com:fredegd/squigglify-v1.0.git
    cd squigglify-v1.0
   ```

2. Install dependencies:
   ```bash
   bun install
   ```
3. Start the development server:

   ```bash
   bun dev
   ```

4. Open your browser and navigate to `http://localhost:3000`
5. Make changes and see them reflected in real-time!

## Contributing

We welcome contributions! If you have ideas for improvements, bug fixes, or new features, please open an issue or submit a pull request.

## License

MIT License - Feel free to use, modify, and distribute this tool for personal or commercial projects.

## Credits

Created with ❤️ by [fedegd](https://github.com/fredegd/)

Feedback, suggestions, and contributions welcome!
