/**
 * Vertex builder for WebGL rendering.
 *
 * Extracts vertex computation logic (zigzag geometry + curve tessellation)
 * from svg-utils.ts into a format suitable for WebGL vertex buffers.
 *
 * Produces Float32Array of (x, y) pairs for GL_LINES / LINE_STRIP rendering.
 */

import type {
  ColorGroup,
  Settings,
  CurveControlSettings,
  PathPoint,
} from "../types";
import { calculateDistance } from "../utils/math-utils";

// ─── Shared tile-vertex computation (mirrors svg-utils.ts createTileVertices) ──

export interface Vertex {
  x: number;
  y: number;
}

/**
 * Build zigzag vertices for a single tile.
 * This is a direct port of svg-utils.ts `createTileVertices`.
 */
export function createTileVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  curveControls?: CurveControlSettings,
  pathPoint?: PathPoint,
  totalColumns?: number,
  totalRows?: number
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

  // Wave shift calculations
  let rowWaveOffset = 0;
  let columnWaveOffset = 0;

  if (pathPoint && totalColumns && totalRows) {
    const row = pathPoint.row;
    const column = pathPoint.column ?? Math.floor(pathPoint.x / width);
    const normalizedColumn = (1.0 * column + 1) / totalColumns || 1.0;
    const isEvenRow = row % 2 === 0;

    const rowWaveValue =
      (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) *
        rowWaveShift *
        height) /
      2;

    rowWaveOffset = isEvenRow ? rowWaveValue : -rowWaveValue;

    columnWaveOffset =
      (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) *
        columnWaveShift *
        height) /
      2;
  }

  const applyDisorganization = (coordX: number, coordY: number): Vertex => {
    if (disorganizeFactor > 0) {
      const maxShift = Math.min(width, height) * 0.25;
      const shiftX = (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor;
      const shiftY = (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor;
      return { x: coordX + shiftX, y: coordY + shiftY };
    }
    return { x: coordX, y: coordY };
  };

  const randomUpperXShift =
    (pathPoint?.randomUpperKnotShiftX || 0) * upperShiftFactor;
  const randomUpperYShift =
    (pathPoint?.randomUpperKnotShiftY || 0) * upperShiftFactor;

  const getUpperWaveShiftY = () => {
    return pathPoint && totalRows && pathPoint.row === 0
      ? 0
      : rowWaveOffset + columnWaveOffset;
  };

  const getLowerWaveShiftY = () => {
    return pathPoint && totalRows && pathPoint.row === totalRows - 1
      ? 0
      : -rowWaveOffset + columnWaveOffset;
  };

  const upperWaveShiftX = 0;

  let currentPoint = {
    x: x + randomUpperXShift + upperWaveShiftX,
    y: y + randomUpperYShift + getUpperWaveShiftY(),
  };
  vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));

  for (let i = 0; i < density; i++) {
    const currentLoopX = x + i * step * direction;
    const nextLoopX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      const lowerWaveShiftX = 0;

      currentPoint = {
        x: currentLoopX + lowerXShift + lowerWaveShiftX,
        y: y + height + getLowerWaveShiftY(),
      };
      vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));

      if (i < density - 1) {
        currentPoint = {
          x: nextLoopX + lowerXShift + lowerWaveShiftX,
          y: y + height + getLowerWaveShiftY(),
        };
        vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));
      } else if (density % 2 === 1) {
        currentPoint = {
          x: nextLoopX + lowerXShift + lowerWaveShiftX,
          y: y + height + getLowerWaveShiftY(),
        };
        vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));
      }
    } else {
      currentPoint = {
        x: currentLoopX + randomUpperXShift + upperWaveShiftX,
        y: y + randomUpperYShift + getUpperWaveShiftY(),
      };
      vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));

      if (i < density - 1) {
        currentPoint = {
          x: nextLoopX + randomUpperXShift + upperWaveShiftX,
          y: y + randomUpperYShift + getUpperWaveShiftY(),
        };
        vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));
      } else if (density % 2 === 0) {
        currentPoint = {
          x: nextLoopX + randomUpperXShift + upperWaveShiftX,
          y: y + randomUpperYShift + getUpperWaveShiftY(),
        };
        vertices.push(applyDisorganization(currentPoint.x, currentPoint.y));
      }
    }
  }

  return vertices;
}

/**
 * Build sawtooth (zig-zag) vertices for a single tile.
 * Unlike createTileVertices which produces a square wave (with horizontal segments),
 * this produces diagonal lines directly from peak to trough — a sawtooth wave.
 */
export function createZigZagTileVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  curveControls?: CurveControlSettings,
  pathPoint?: PathPoint,
  totalColumns?: number,
  totalRows?: number
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

    const rowWaveValue =
      (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) *
        rowWaveShift *
        height) /
      2;

    rowWaveOffset = isEvenRow ? rowWaveValue : -rowWaveValue;

    columnWaveOffset =
      (Math.cos(normalizedColumn * Math.PI * waveShiftFrequency) *
        columnWaveShift *
        height) /
      2;
  }

  const applyDisorganization = (coordX: number, coordY: number): Vertex => {
    if (disorganizeFactor > 0) {
      const maxShift = Math.min(width, height) * 0.25;
      const shiftX = (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor;
      const shiftY = (Math.random() - 0.5) * 2 * maxShift * disorganizeFactor;
      return { x: coordX + shiftX, y: coordY + shiftY };
    }
    return { x: coordX, y: coordY };
  };

  const randomUpperXShift =
    (pathPoint?.randomUpperKnotShiftX || 0) * upperShiftFactor;
  const randomUpperYShift =
    (pathPoint?.randomUpperKnotShiftY || 0) * upperShiftFactor;

  const getUpperWaveShiftY = () => {
    return pathPoint && totalRows && pathPoint.row === 0
      ? 0
      : rowWaveOffset + columnWaveOffset;
  };

  const getLowerWaveShiftY = () => {
    return pathPoint && totalRows && pathPoint.row === totalRows - 1
      ? 0
      : -rowWaveOffset + columnWaveOffset;
  };

  // Start with the first upper point
  vertices.push(
    applyDisorganization(
      x + randomUpperXShift,
      y + randomUpperYShift + getUpperWaveShiftY()
    )
  );

  // Alternate diagonally between lower and upper points (no horizontal segments)
  for (let i = 0; i < density; i++) {
    const nextLoopX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      vertices.push(
        applyDisorganization(
          nextLoopX + lowerXShift,
          y + height + getLowerWaveShiftY()
        )
      );
    } else {
      vertices.push(
        applyDisorganization(
          nextLoopX + randomUpperXShift,
          y + randomUpperYShift + getUpperWaveShiftY()
        )
      );
    }
  }

  return vertices;
}

// ─── Bézier curve tessellation ─────────────────────────────────────────────────

/**
 * Tessellate a cubic Bézier curve into line segments.
 */
function tessellatedCubicBezier(
  p0: Vertex,
  cp1: Vertex,
  cp2: Vertex,
  p1: Vertex,
  segments: number = 12
): Vertex[] {
  const result: Vertex[] = [];
  for (let t = 0; t <= segments; t++) {
    const u = t / segments;
    const u2 = u * u;
    const u3 = u2 * u;
    const inv = 1 - u;
    const inv2 = inv * inv;
    const inv3 = inv2 * inv;

    result.push({
      x: inv3 * p0.x + 3 * inv2 * u * cp1.x + 3 * inv * u2 * cp2.x + u3 * p1.x,
      y: inv3 * p0.y + 3 * inv2 * u * cp1.y + 3 * inv * u2 * cp2.y + u3 * p1.y,
    });
  }
  return result;
}

/**
 * Convert an array of vertices into a tessellated curve (same algorithm as
 * svg-utils.ts `convertToCurvePath`, but produces Vertex[] instead of SVG path string).
 */
function tessellateVerticesAsCurve(
  points: Vertex[],
  smoothness: number = 0.1,
  handleRotationAngle: number = 0,
  segmentsPerCurve: number = 12
): Vertex[] {
  if (points.length < 2) return points.slice();

  const rotationRad = (handleRotationAngle * Math.PI) / 180;
  const cosA = Math.cos(rotationRad);
  const sinA = Math.sin(rotationRad);

  const result: Vertex[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const previous = i > 0 ? points[i - 1] : current;
    const nextNext = i < points.length - 2 ? points[i + 2] : next;

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

    let handleVec1_x = (v1.x / len1) * distance1;
    let handleVec1_y = (v1.y / len1) * distance1;
    let handleVec2_x = -(v2.x / len2) * distance2;
    let handleVec2_y = -(v2.y / len2) * distance2;

    if (handleRotationAngle !== 0) {
      const rot1_x = handleVec1_x * cosA - handleVec1_y * sinA;
      const rot1_y = handleVec1_x * sinA + handleVec1_y * cosA;
      handleVec1_x = rot1_x;
      handleVec1_y = rot1_y;

      const rot2_x = handleVec2_x * cosA - handleVec2_y * sinA;
      const rot2_y = handleVec2_x * sinA + handleVec2_y * cosA;
      handleVec2_x = rot2_x;
      handleVec2_y = rot2_y;
    }

    const cp1 = {
      x: current.x + handleVec1_x,
      y: current.y + handleVec1_y,
    };
    const cp2 = {
      x: next.x + handleVec2_x,
      y: next.y + handleVec2_y,
    };

    // Tessellate this Bézier segment (skip first point since it's already in result)
    const tessellated = tessellatedCubicBezier(current, cp1, cp2, next, segmentsPerCurve);
    for (let j = 1; j < tessellated.length; j++) {
      result.push(tessellated[j]);
    }
  }

  return result;
}

// ─── Segment merging (greedy all-pairs — matches svg-utils.ts algorithm) ────────

function mergeNearbySegments(
  segments: Vertex[][],
  threshold: number
): Vertex[][] {
  if (segments.length <= 1) return segments;

  const thresholdSq = threshold * threshold;

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

      let bestJ = -1;
      let bestDistSq = Infinity;
      let bestConn: Connection = "end-start";

      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const segB = result[j];
        if (segB.length === 0) continue;

        const bStart = segB[0];
        const bEnd = segB[segB.length - 1];

        const d1 = (aEnd.x - bStart.x) ** 2 + (aEnd.y - bStart.y) ** 2;
        if (d1 <= thresholdSq && d1 < bestDistSq) {
          bestDistSq = d1; bestJ = j; bestConn = "end-start";
        }

        const d2 = (aEnd.x - bEnd.x) ** 2 + (aEnd.y - bEnd.y) ** 2;
        if (d2 <= thresholdSq && d2 < bestDistSq) {
          bestDistSq = d2; bestJ = j; bestConn = "end-end";
        }

        const d3 = (aStart.x - bStart.x) ** 2 + (aStart.y - bStart.y) ** 2;
        if (d3 <= thresholdSq && d3 < bestDistSq) {
          bestDistSq = d3; bestJ = j; bestConn = "start-start";
        }

        const d4 = (aStart.x - bEnd.x) ** 2 + (aStart.y - bEnd.y) ** 2;
        if (d4 <= thresholdSq && d4 < bestDistSq) {
          bestDistSq = d4; bestJ = j; bestConn = "start-end";
        }
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

    if (changed) {
      result = result.filter(s => s.length > 0);
    }
  }

  return result;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Result of building vertices for a color group.
 * `lineVertices` is a flat Float32Array of (x, y) pairs for GL_LINES rendering.
 * Each consecutive pair of floats forms a vertex; each consecutive pair of vertices forms a line segment.
 */
export interface ColorGroupVertices {
  color: [number, number, number, number]; // RGBA normalised
  vertexCount: number;
  lineVertices: Float32Array;
}

/**
 * Parse a CSS color string into normalised RGBA [0-1].
 */
function parseColor(color: string): [number, number, number, number] {
  // Handle #RRGGBB
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b, 1.0];
  }
  // Handle rgb(r, g, b)
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255,
      1.0,
    ];
  }
  // Fallback: black
  return [0, 0, 0, 1];
}

/**
 * Convert Vertex[] polyline into GL_LINES format: each segment is (A, B) pair.
 * For a polyline with N vertices, produces (N-1) * 2 vertices = (N-1) * 4 floats.
 */
function polylineToLineSegments(polyline: Vertex[]): Float32Array {
  if (polyline.length < 2) return new Float32Array(0);

  const segmentCount = polyline.length - 1;
  const result = new Float32Array(segmentCount * 4); // 2 vertices * 2 floats each

  for (let i = 0; i < segmentCount; i++) {
    const offset = i * 4;
    result[offset] = polyline[i].x;
    result[offset + 1] = polyline[i].y;
    result[offset + 2] = polyline[i + 1].x;
    result[offset + 3] = polyline[i + 1].y;
  }

  return result;
}

/**
 * Build individual polylines for a color group (non-continuous mode).
 */
function buildIndividualPolylines(
  colorGroup: ColorGroup,
  settings: Settings
): Vertex[][] {
  const { curveControls, curveMode } = settings;
  const smoothness = curveControls?.junctionContinuityFactor || 0.1;
  const handleRotation = curveControls?.handleRotationAngle || 0;
  const vertexFn = curveMode === "zigzag" ? createZigZagTileVertices : createTileVertices;

  const polylines: Vertex[][] = [];

  for (const point of colorGroup.points) {
    if (point.density <= 0) continue;

    const tileVerts = vertexFn(
      point.x,
      point.y,
      point.width,
      point.height * (curveControls?.tileHeightScale || 1.0),
      point.density,
      point.direction,
      curveControls,
      point,
      settings.columnsCount,
      settings.rowsCount
    );

    if (tileVerts.length < 2) continue;

    const finalVerts = curveMode === "curved"
      ? tessellateVerticesAsCurve(tileVerts, smoothness, handleRotation)
      : tileVerts;

    polylines.push(finalVerts);
  }

  return polylines;
}

/**
 * Build continuous polylines for a color group (continuous mode).
 * Mirrors svg-utils.ts `generateContinuousPath`.
 */
function buildContinuousPolylines(
  colorGroup: ColorGroup,
  settings: Settings
): Vertex[][] {
  const { curveControls, curveMode, pathDistanceThreshold } = settings;
  const smoothness = curveControls?.junctionContinuityFactor || 0.1;
  const handleRotation = curveControls?.handleRotationAngle || 0;
  const vertexFn = curveMode === "zigzag" ? createZigZagTileVertices : createTileVertices;

  const points = [...colorGroup.points];

  // Serpentine row-order sort
  points.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.row % 2 === 0 ? a.x - b.x : b.x - a.x;
  });

  // Phase 1: serpentine row-order path segments
  const segments: Vertex[][] = [];
  let pathVertices: Vertex[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point.density <= 0) continue;

    const lastPoint =
      pathVertices.length > 0 ? pathVertices[pathVertices.length - 1] : null;
    const needNewPath =
      lastPoint &&
      calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y) >
        pathDistanceThreshold;

    if (needNewPath && pathVertices.length > 0) {
      segments.push(pathVertices);
      pathVertices = [];
    }

    const tileVertices = vertexFn(
      point.x,
      point.y,
      point.width,
      point.height * (curveControls?.tileHeightScale || 1.0),
      point.density,
      point.direction,
      curveControls,
      point,
      settings.columnsCount,
      settings.rowsCount
    );

    if (pathVertices.length > 0 && !needNewPath) {
      pathVertices.pop();
    }

    for (let j = 0; j < tileVertices.length; j++) {
      pathVertices.push(tileVertices[j]);
    }
  }

  if (pathVertices.length > 0) {
    segments.push(pathVertices);
  }

  // Phase 2: merge nearby segments
  const merged = mergeNearbySegments(segments, pathDistanceThreshold);

  // Apply curve tessellation if needed
  const polylines: Vertex[][] = [];
  for (const seg of merged) {
    if (seg.length < 2) continue;
    const finalVerts = curveMode === "curved"
      ? tessellateVerticesAsCurve(seg, smoothness, handleRotation)
      : seg;
    polylines.push(finalVerts);
  }

  return polylines;
}

/**
 * Build GL_LINES vertex data for all visible color groups.
 *
 * @returns Array of ColorGroupVertices, one per visible color group.
 */
export function buildVerticesForAllGroups(
  colorGroups: Record<string, ColorGroup>,
  settings: Settings
): ColorGroupVertices[] {
  const result: ColorGroupVertices[] = [];
  const { continuousPaths, visiblePaths } = settings;

  for (const [colorKey, group] of Object.entries(colorGroups)) {
    // Skip hidden groups
    if (visiblePaths[colorKey] === false) continue;

    const polylines = continuousPaths
      ? buildContinuousPolylines(group, settings)
      : buildIndividualPolylines(group, settings);

    // Concatenate all polylines into a single GL_LINES buffer
    const allSegments: Float32Array[] = [];
    let totalVertices = 0;

    for (const polyline of polylines) {
      const segments = polylineToLineSegments(polyline);
      allSegments.push(segments);
      totalVertices += segments.length / 2; // 2 floats per vertex
    }

    // Merge into one Float32Array
    const totalFloats = allSegments.reduce((sum, s) => sum + s.length, 0);
    const lineVertices = new Float32Array(totalFloats);
    let offset = 0;
    for (const seg of allSegments) {
      lineVertices.set(seg, offset);
      offset += seg.length;
    }

    result.push({
      color: parseColor(group.color),
      vertexCount: totalVertices,
      lineVertices,
    });
  }

  return result;
}
