/**
 * Median Cut Color Quantization Algorithm
 * 
 * Recursively divides color space into boxes, splitting the box with the highest range
 * along its longest color axis until the desired number of colors is reached.
 */

// Define a box in RGB space containing a set of colors
export interface ColorBox {
    colors: [number, number, number][];
    rRange: number;
    gRange: number;
    bRange: number;
    volume: number;
    maxRangeIndex: number; // 0 for R, 1 for G, 2 for B
}

export function medianCutClustering(
    colors: [number, number, number][],
    k: number
): [number, number, number][] {
    if (colors.length === 0) return [];
    if (k <= 0) return [];
    if (colors.length <= k || k === 1) {
        if (colors.length <= k) return colors;
        // return average if k = 1
        return [averageColor(colors)];
    }

    // Create initial box containing all colors
    const initialBox = createColorBox(colors);

    if (!initialBox) return [];

    let boxes: ColorBox[] = [initialBox];

    // Continue to split until we have k boxes or we can't split anymore
    while (boxes.length < k) {
        // Find the best box to split.
        // We choose the one with the maximum range along any axis.
        let targetIndex = -1;
        let maxRangeFound = -1;

        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            if (box.colors.length >= 2) {
                // Can be split
                const maxRangeInBox = Math.max(box.rRange, box.gRange, box.bRange);
                if (maxRangeInBox > maxRangeFound) {
                    maxRangeFound = maxRangeInBox;
                    targetIndex = i;
                }
            }
        }

        // If no box can be split, we're done early
        if (targetIndex === -1) {
            break;
        }

        // Remove the target box from the list
        const boxToSplit = boxes[targetIndex];
        boxes.splice(targetIndex, 1);

        // Split it
        const axis = boxToSplit.maxRangeIndex;

        // Sort colors along the longest axis
        boxToSplit.colors.sort((a, b) => a[axis] - b[axis]);

        // Find the median
        const medianIndex = Math.floor(boxToSplit.colors.length / 2);

        // Split into two new boxes
        const lowerColors = boxToSplit.colors.slice(0, medianIndex);
        const upperColors = boxToSplit.colors.slice(medianIndex);

        const lowerBox = createColorBox(lowerColors);
        const upperBox = createColorBox(upperColors);

        if (lowerBox) boxes.push(lowerBox);
        if (upperBox) boxes.push(upperBox);
    }

    // The centroid of each box is our quantized color
    return boxes.map(box => {
        return [Math.round(averageColor(box.colors)[0]), Math.round(averageColor(box.colors)[1]), Math.round(averageColor(box.colors)[2])] as [number, number, number];
    });
}

function createColorBox(colors: [number, number, number][]): ColorBox | null {
    if (colors.length === 0) return null;

    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (const c of colors) {
        if (c[0] < minR) minR = c[0];
        if (c[0] > maxR) maxR = c[0];

        if (c[1] < minG) minG = c[1];
        if (c[1] > maxG) maxG = c[1];

        if (c[2] < minB) minB = c[2];
        if (c[2] > maxB) maxB = c[2];
    }

    const rRange = maxR - minR;
    const gRange = maxG - minG;
    const bRange = maxB - minB;

    // Which axis has the largest range?
    let maxRangeIndex = 0; // default R
    let maxRange = rRange;

    if (gRange > maxRange) {
        maxRange = gRange;
        maxRangeIndex = 1;
    }

    if (bRange > maxRange) {
        maxRange = bRange;
        maxRangeIndex = 2;
    }

    return {
        colors,
        rRange,
        gRange,
        bRange,
        volume: rRange * gRange * bRange,
        maxRangeIndex
    };
}

// Calculate the average color of a cluster (duplicated partially from math-utils to avoid circular deps if needed, 
// though importing it might be better. Assuming isolated logic here or we can import it).
function averageColor(
    colors: [number, number, number][]
): [number, number, number] {
    const sum = [0, 0, 0];
    colors.forEach((color) => {
        sum[0] += color[0];
        sum[1] += color[1];
        sum[2] += color[2];
    });
    return [
        sum[0] / colors.length,
        sum[1] / colors.length,
        sum[2] / colors.length,
    ] as [number, number, number];
}
