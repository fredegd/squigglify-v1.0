/**
 * Converts Squigglify vertex/path data into stitch coordinates
 * suitable for PES embroidery file encoding.
 */

import type {
  ColorGroup,
  ImageData,
  Settings,
  CurveControlSettings,
  PathPoint,
  EmbroiderySettings,
} from "../types";
import { calculateDistance } from "./math-utils";
import {
  type StitchColorBlock,
  findNearestPecThread,
  hexToRgb,
} from "./pes-encoder";

type Vertex = { x: number; y: number };

// Re-create vertex functions locally to avoid circular imports.
// These mirror createTileVertices / createZigZagTileVertices in svg-utils.ts
// but are kept self-contained so the PES pipeline has no DOM dependency.

function createTileVertices(
  x: number, y: number, width: number, height: number,
  density: number, direction: number,
  curveControls?: CurveControlSettings,
  pathPoint?: PathPoint,
  totalColumns?: number, totalRows?: number
): Vertex[] {
  if (density <= 0) return [];
  const vertices: Vertex[] = [];
  const step = width / density;
  const lowerXShift = curveControls?.lowerKnotXShift || 0;
  const upperShiftFactor = curveControls?.upperKnotShiftFactor || 0;
  const disorganizeFactor = curveControls?.disorganizeFactor || 0;
  const rowWaveShift = curveControls?.rowWaveShift || 0;
  const columnWaveShift = curveControls?.columnWaveShift || 0;
  const waveShiftFrequency = curveControls?.waveShiftFrequency || 2.0;

  let rowWaveOffset = 0;
  let columnWaveOffset = 0;

  if (pathPoint && totalColumns && totalRows) {
    const row = pathPoint.row;
    const column = pathPoint.column ?? Math.floor(pathPoint.x / width);
    const normalizedColumn = (1.0 * column + 1) / totalColumns || 1.0;
    const isEvenRow = row % 2 === 0;
    const rowWaveValue = (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) * rowWaveShift * height) / 2;
    rowWaveOffset = isEvenRow ? rowWaveValue : -rowWaveValue;
    columnWaveOffset = (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) * columnWaveShift * height) / 2;
  }

  const applyDisorganization = (cx: number, cy: number): Vertex => {
    if (disorganizeFactor > 0) {
      const maxShift = Math.min(width, height) * 0.25;
      return {
        x: cx + (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor,
        y: cy + (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor,
      };
    }
    return { x: cx, y: cy };
  };

  const randomUpperXShift = (pathPoint?.randomUpperKnotShiftX || 0) * upperShiftFactor;
  const randomUpperYShift = (pathPoint?.randomUpperKnotShiftY || 0) * upperShiftFactor;

  const getUpperWaveShiftY = () =>
    pathPoint && totalRows && pathPoint.row === 0 ? 0 : rowWaveOffset + columnWaveOffset;
  const getLowerWaveShiftY = () =>
    pathPoint && totalRows && pathPoint.row === totalRows - 1 ? 0 : -rowWaveOffset + columnWaveOffset;

  vertices.push(applyDisorganization(
    x + randomUpperXShift,
    y + randomUpperYShift + getUpperWaveShiftY()
  ));

  for (let i = 0; i < density; i++) {
    const currentLoopX = x + i * step * direction;
    const nextLoopX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      vertices.push(applyDisorganization(
        currentLoopX + lowerXShift,
        y + height + getLowerWaveShiftY()
      ));
      if (i < density - 1) {
        vertices.push(applyDisorganization(
          nextLoopX + lowerXShift,
          y + height + getLowerWaveShiftY()
        ));
      } else if (density % 2 === 1) {
        vertices.push(applyDisorganization(
          nextLoopX + lowerXShift,
          y + height + getLowerWaveShiftY()
        ));
      }
    } else {
      vertices.push(applyDisorganization(
        currentLoopX + randomUpperXShift,
        y + randomUpperYShift + getUpperWaveShiftY()
      ));
      if (i < density - 1) {
        vertices.push(applyDisorganization(
          nextLoopX + randomUpperXShift,
          y + randomUpperYShift + getUpperWaveShiftY()
        ));
      } else if (density % 2 === 0) {
        vertices.push(applyDisorganization(
          nextLoopX + randomUpperXShift,
          y + randomUpperYShift + getUpperWaveShiftY()
        ));
      }
    }
  }

  return vertices;
}

function createZigZagTileVertices(
  x: number, y: number, width: number, height: number,
  density: number, direction: number,
  curveControls?: CurveControlSettings,
  pathPoint?: PathPoint,
  totalColumns?: number, totalRows?: number
): Vertex[] {
  if (density <= 0) return [];
  const vertices: Vertex[] = [];
  const step = width / density;
  const lowerXShift = curveControls?.lowerKnotXShift || 0;
  const upperShiftFactor = curveControls?.upperKnotShiftFactor || 0;
  const disorganizeFactor = curveControls?.disorganizeFactor || 0;
  const rowWaveShift = curveControls?.rowWaveShift || 0;
  const columnWaveShift = curveControls?.columnWaveShift || 0;
  const waveShiftFrequency = curveControls?.waveShiftFrequency || 2.0;

  let rowWaveOffset = 0;
  let columnWaveOffset = 0;

  if (pathPoint && totalColumns && totalRows) {
    const row = pathPoint.row;
    const column = pathPoint.column ?? Math.floor(pathPoint.x / width);
    const normalizedColumn = (1.0 * column + 1) / totalColumns || 1.0;
    const isEvenRow = row % 2 === 0;
    const rowWaveValue = (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) * rowWaveShift * height) / 2;
    rowWaveOffset = isEvenRow ? rowWaveValue : -rowWaveValue;
    columnWaveOffset = (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) * columnWaveShift * height) / 2;
  }

  const applyDisorganization = (cx: number, cy: number): Vertex => {
    if (disorganizeFactor > 0) {
      const maxShift = Math.min(width, height) * 0.25;
      return {
        x: cx + (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor,
        y: cy + (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor,
      };
    }
    return { x: cx, y: cy };
  };

  const randomUpperXShift = (pathPoint?.randomUpperKnotShiftX || 0) * upperShiftFactor;
  const randomUpperYShift = (pathPoint?.randomUpperKnotShiftY || 0) * upperShiftFactor;

  const getUpperWaveShiftY = () =>
    pathPoint && totalRows && pathPoint.row === 0 ? 0 : rowWaveOffset + columnWaveOffset;
  const getLowerWaveShiftY = () =>
    pathPoint && totalRows && pathPoint.row === totalRows - 1 ? 0 : -rowWaveOffset + columnWaveOffset;

  vertices.push(applyDisorganization(
    x + randomUpperXShift,
    y + randomUpperYShift + getUpperWaveShiftY()
  ));

  for (let i = 0; i < density; i++) {
    const nextLoopX = x + (i + 1) * step * direction;
    if (i % 2 === 0) {
      vertices.push(applyDisorganization(
        nextLoopX + lowerXShift,
        y + height + getLowerWaveShiftY()
      ));
    } else {
      vertices.push(applyDisorganization(
        nextLoopX + randomUpperXShift,
        y + randomUpperYShift + getUpperWaveShiftY()
      ));
    }
  }

  return vertices;
}

/**
 * Subdivide a polyline so no segment exceeds maxLength.
 * Inserts intermediate points along long segments.
 */
function subdivideSegments(vertices: Vertex[], maxLength: number): Vertex[] {
  if (vertices.length < 2) return vertices;
  const result: Vertex[] = [vertices[0]];

  for (let i = 1; i < vertices.length; i++) {
    const prev = result[result.length - 1];
    const curr = vertices[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxLength) {
      const subdivisions = Math.ceil(dist / maxLength);
      for (let s = 1; s <= subdivisions; s++) {
        const t = s / subdivisions;
        result.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t,
        });
      }
    } else {
      result.push(curr);
    }
  }

  return result;
}

/**
 * Sample a cubic Bezier curve into line segments.
 */
function sampleCubicBezier(
  p0: Vertex, cp1: Vertex, cp2: Vertex, p3: Vertex,
  maxLength: number
): Vertex[] {
  const chord = Math.sqrt((p3.x - p0.x) ** 2 + (p3.y - p0.y) ** 2);
  const numSamples = Math.max(2, Math.ceil(chord / maxLength));
  const points: Vertex[] = [];

  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples;
    const mt = 1 - t;
    points.push({
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * p3.y,
    });
  }

  return points;
}

/**
 * Convert curved vertices into line segments by computing Bezier control
 * points (same algorithm as convertToCurvePath in svg-utils.ts) and sampling.
 */
function linearizeCurvedPath(
  vertices: Vertex[],
  smoothness: number,
  handleRotationAngle: number,
  maxLength: number
): Vertex[] {
  if (vertices.length < 2) return vertices;

  const rotationRad = (handleRotationAngle * Math.PI) / 180;
  const cosA = Math.cos(rotationRad);
  const sinA = Math.sin(rotationRad);

  const result: Vertex[] = [vertices[0]];

  for (let i = 0; i < vertices.length - 1; i++) {
    const current = vertices[i];
    const next = vertices[i + 1];
    const previous = i > 0 ? vertices[i - 1] : current;
    const nextNext = i < vertices.length - 2 ? vertices[i + 2] : next;

    const v1 = { x: next.x - previous.x, y: next.y - previous.y };
    const v2 = { x: nextNext.x - current.x, y: nextNext.y - current.y };

    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (len1 === 0 || len2 === 0) {
      result.push(next);
      continue;
    }

    const distance1 = Math.min(len1 * smoothness, len1 / 2);
    const distance2 = Math.min(len2 * smoothness, len2 / 2);

    let hx1 = (v1.x / len1) * distance1;
    let hy1 = (v1.y / len1) * distance1;
    let hx2 = -(v2.x / len2) * distance2;
    let hy2 = -(v2.y / len2) * distance2;

    if (handleRotationAngle !== 0) {
      const r1x = hx1 * cosA - hy1 * sinA;
      const r1y = hx1 * sinA + hy1 * cosA;
      hx1 = r1x; hy1 = r1y;
      const r2x = hx2 * cosA - hy2 * sinA;
      const r2y = hx2 * sinA + hy2 * cosA;
      hx2 = r2x; hy2 = r2y;
    }

    const cp1 = { x: current.x + hx1, y: current.y + hy1 };
    const cp2 = { x: next.x + hx2, y: next.y + hy2 };

    const sampledPoints = sampleCubicBezier(current, cp1, cp2, next, maxLength);
    result.push(...sampledPoints);
  }

  return result;
}

/**
 * Merge nearby segments (same algorithm as svg-utils.ts mergeNearbySegments).
 */
function mergeNearbySegments(
  segments: Vertex[][],
  threshold: number
): Vertex[][] {
  if (segments.length <= 1) return segments;

  type Connection = "end-start" | "end-end" | "start-start" | "start-end";
  let result = segments.map(s => s.slice());
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const segA = result[i];
      if (segA.length === 0) continue;
      const aStart = segA[0];
      const aEnd = segA[segA.length - 1];
      let bestJ = -1, bestDist = Infinity;
      let bestConn: Connection = "end-start";

      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const segB = result[j];
        if (segB.length === 0) continue;
        const bStart = segB[0];
        const bEnd = segB[segB.length - 1];

        const d1 = calculateDistance(aEnd.x, aEnd.y, bStart.x, bStart.y);
        if (d1 <= threshold && d1 < bestDist) { bestDist = d1; bestJ = j; bestConn = "end-start"; }
        const d2 = calculateDistance(aEnd.x, aEnd.y, bEnd.x, bEnd.y);
        if (d2 <= threshold && d2 < bestDist) { bestDist = d2; bestJ = j; bestConn = "end-end"; }
        const d3 = calculateDistance(aStart.x, aStart.y, bStart.x, bStart.y);
        if (d3 <= threshold && d3 < bestDist) { bestDist = d3; bestJ = j; bestConn = "start-start"; }
        const d4 = calculateDistance(aStart.x, aStart.y, bEnd.x, bEnd.y);
        if (d4 <= threshold && d4 < bestDist) { bestDist = d4; bestJ = j; bestConn = "start-end"; }
      }

      if (bestJ < 0) continue;
      const segB = result[bestJ];
      switch (bestConn) {
        case "end-start": result[i] = [...segA, ...segB]; break;
        case "end-end": result[i] = [...segA, ...segB.slice().reverse()]; break;
        case "start-start": result[i] = [...segA.slice().reverse(), ...segB]; break;
        case "start-end": result[i] = [...segB, ...segA]; break;
      }
      result[bestJ] = [];
      changed = true;
      break;
    }
    if (changed) result = result.filter(s => s.length > 0);
  }

  return result;
}

function buildConnectedStitches(
  segments: Vertex[][],
  connectThreshold: number
): { stitches: Vertex[]; segmentBreaks: number[] } {
  const remaining = segments
    .filter(segment => segment.length > 0)
    .map(segment => segment.slice());
  if (remaining.length === 0) {
    return { stitches: [], segmentBreaks: [] };
  }

  const stitches: Vertex[] = [...remaining.shift()!];
  const segmentBreaks: number[] = [];

  while (remaining.length > 0) {
    const last = stitches[stitches.length - 1];

    // Default behavior: follow UI segment order.
    let nextIndex = 0;
    let nextSegment = remaining[nextIndex];
    let nextStart = nextSegment[0];
    let distance = calculateDistance(last.x, last.y, nextStart.x, nextStart.y);

    if (distance > connectThreshold) {
      // For jump/cut transitions only, pick nearest remaining path start.
      let bestIndex = 0;
      let bestDistance = distance;
      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        const candidateStart = candidate[0];
        const d = calculateDistance(last.x, last.y, candidateStart.x, candidateStart.y);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = i;
        }
      }

      nextIndex = bestIndex;
      nextSegment = remaining[nextIndex];
      nextStart = nextSegment[0];
      distance = bestDistance;

      // Hard segment boundary so encoder emits trim+jump.
      segmentBreaks.push(stitches.length);
    }

    remaining.splice(nextIndex, 1);

    if (distance === 0) {
      // Avoid duplicate zero-length stitch when already touching.
      stitches.push(...nextSegment.slice(1));
      continue;
    }

    // Connected segment: stitch directly to next segment start.
    stitches.push(...nextSegment);
  }

  return { stitches, segmentBreaks };
}

/**
 * Extract raw vertex segments for a single color group, matching the
 * logic in svg-utils.ts (continuous or individual mode).
 */
function extractVertexSegments(
  colorGroup: ColorGroup,
  settings: Settings
): Vertex[][] {
  const { points } = colorGroup;
  const { curveMode, curveControls, continuousPaths, pathDistanceThreshold } = settings;
  const vertexFn = curveMode === "zigzag" ? createZigZagTileVertices : createTileVertices;

  if (continuousPaths) {
    // Serpentine row-order, then merge
    const sortedPoints = [...points].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.row % 2 === 0 ? a.x - b.x : b.x - a.x;
    });

    const segments: Vertex[][] = [];
    let pathVertices: Vertex[] = [];

    for (const point of sortedPoints) {
      if (point.density <= 0) continue;

      const lastPoint = pathVertices.length > 0 ? pathVertices[pathVertices.length - 1] : null;
      const needNewPath = lastPoint &&
        calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y) > pathDistanceThreshold;

      if (needNewPath && pathVertices.length > 0) {
        segments.push(pathVertices);
        pathVertices = [];
      }

      const tileVertices = vertexFn(
        point.x, point.y, point.width,
        point.height * (curveControls?.tileHeightScale || 1.0),
        point.density, point.direction,
        curveControls, point,
        settings.columnsCount, settings.rowsCount
      );

      if (pathVertices.length > 0 && !needNewPath && curveMode !== "zigzag") {
        pathVertices.pop();
      }

      pathVertices.push(...tileVertices);
    }

    if (pathVertices.length > 0) {
      segments.push(pathVertices);
    }

    return mergeNearbySegments(segments, pathDistanceThreshold);
  } else {
    // Individual tiles as separate segments
    const sortedPoints = [...points].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.row % 2 === 0 ? a.x - b.x : b.x - a.x;
    });

    const segments: Vertex[][] = [];
    for (const point of sortedPoints) {
      if (point.density <= 0) continue;
      const tileVertices = vertexFn(
        point.x, point.y, point.width,
        point.height * (curveControls?.tileHeightScale || 1.0),
        point.density, point.direction,
        curveControls, point,
        settings.columnsCount, settings.rowsCount
      );
      if (tileVertices.length > 0) {
        segments.push(tileVertices);
      }
    }
    return segments;
  }
}

/**
 * Convert image data + settings into PES-ready stitch color blocks.
 *
 * Coordinates are output in PES units (1 unit = 0.1mm).
 * The design is scaled to fit within the specified hoop dimensions.
 */
export function convertToStitchBlocks(
  imageData: ImageData,
  settings: Settings,
  embroiderySettings: EmbroiderySettings
): StitchColorBlock[] {
  const { colorGroups, outputWidth, outputHeight } = imageData;
  if (!colorGroups) return [];

  const { hoopWidth, hoopHeight, stitchLength, jumpThreshold, fitToHoop } = embroiderySettings;
  const { curveMode, curveControls, visiblePaths } = settings;

  // Convert hoop size from mm to PES units (0.1mm)
  const hoopWidthPes = hoopWidth * 10;
  const hoopHeightPes = hoopHeight * 10;

  // Calculate scale: SVG pixels -> PES units
  let scale: number;
  if (fitToHoop) {
    const scaleX = hoopWidthPes / outputWidth;
    const scaleY = hoopHeightPes / outputHeight;
    scale = Math.min(scaleX, scaleY);
  } else {
    // 1 SVG pixel ~= 1 PES unit (0.1mm) — use the existing mm data attribute ratio
    // outputWidth / 3.759 gives mm, * 10 gives PES units
    scale = 10 / 3.759;
  }

  // Stitch length in PES units
  const maxStitchLenPes = stitchLength * 10;
  const jumpThresholdPes = jumpThreshold * 10;
  const smoothness = curveControls?.junctionContinuityFactor || 0.15;
  const handleRotation = curveControls?.handleRotationAngle || 0;

  const blocks: StitchColorBlock[] = [];

  for (const [colorKey, group] of Object.entries(colorGroups)) {
    if (visiblePaths[colorKey] === false) continue;

    // Use exactly the same segment construction/order as UI rendering.
    const segments = extractVertexSegments(group, settings);
    if (segments.length === 0) continue;

    const rgb = hexToRgb(group.color);
    const thread = findNearestPecThread(rgb.r, rgb.g, rgb.b);

    // Process each segment and keep segment boundaries for explicit jump logic.
    const processedSegments: Vertex[][] = [];

    for (const rawSegment of segments) {
      let processedVertices: Vertex[];

      if (curveMode === "curved") {
        processedVertices = linearizeCurvedPath(
          rawSegment, smoothness, handleRotation, maxStitchLenPes / scale
        );
        // Keep curved paths smooth but bounded for embroidery stitch size.
        processedVertices = subdivideSegments(processedVertices, maxStitchLenPes / scale);
      } else {
        // In zigzag mode, source vertices already represent stitch points.
        processedVertices = rawSegment;
      }

      // Scale to PES units
      const scaledVertices = processedVertices.map(v => ({
        x: v.x * scale,
        y: v.y * scale,
      }));

      if (scaledVertices.length > 0) {
        processedSegments.push(scaledVertices);
      }
    }

    const { stitches, segmentBreaks } = buildConnectedStitches(
      processedSegments,
      jumpThresholdPes
    );

    if (stitches.length > 0) {
      blocks.push({
        pecColorIndex: thread.index,
        hexColor: group.color,
        threadName: thread.name,
        stitches,
        segmentBreaks,
      });
    }
  }

  return blocks;
}
