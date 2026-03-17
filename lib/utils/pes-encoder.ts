/**
 * PES/PEC binary encoder for Brother embroidery machines.
 * Implements PES version 1 (#PES0001), the most widely compatible format.
 *
 * Reference: https://edutechwiki.unige.ch/en/Embroidery_format_PES
 *            https://edutechwiki.unige.ch/en/Embroidery_format_PEC
 */

export interface PecThread {
  index: number;
  name: string;
  r: number;
  g: number;
  b: number;
}

export const PEC_THREAD_PALETTE: PecThread[] = [
  { index: 1, name: "Prussian Blue", r: 0x1a, g: 0x0a, b: 0x94 },
  { index: 2, name: "Blue", r: 0x0f, g: 0x75, b: 0xff },
  { index: 3, name: "Teal Green", r: 0x00, g: 0x93, b: 0x4c },
  { index: 4, name: "Corn Flower Blue", r: 0xba, g: 0xbd, b: 0xfe },
  { index: 5, name: "Red", r: 0xec, g: 0x00, b: 0x00 },
  { index: 6, name: "Reddish Brown", r: 0xe4, g: 0x99, b: 0x5a },
  { index: 7, name: "Magenta", r: 0xcc, g: 0x48, b: 0xab },
  { index: 8, name: "Light Lilac", r: 0xfd, g: 0xc4, b: 0xfa },
  { index: 9, name: "Lilac", r: 0xdd, g: 0x84, b: 0xcd },
  { index: 10, name: "Mint Green", r: 0x6b, g: 0xd3, b: 0x8a },
  { index: 11, name: "Deep Gold", r: 0xe4, g: 0xa9, b: 0x45 },
  { index: 12, name: "Orange", r: 0xff, g: 0xbd, b: 0x42 },
  { index: 13, name: "Yellow", r: 0xff, g: 0xe6, b: 0x00 },
  { index: 14, name: "Lime Green", r: 0x6c, g: 0xd9, b: 0x00 },
  { index: 15, name: "Brass", r: 0xc1, g: 0xa9, b: 0x41 },
  { index: 16, name: "Silver", r: 0xb5, g: 0xad, b: 0x97 },
  { index: 17, name: "Russet Brown", r: 0xba, g: 0x9c, b: 0x5f },
  { index: 18, name: "Cream Brown", r: 0xfa, g: 0xf5, b: 0x9e },
  { index: 19, name: "Pewter", r: 0x80, g: 0x80, b: 0x80 },
  { index: 20, name: "Black", r: 0x00, g: 0x00, b: 0x00 },
  { index: 21, name: "Ultramarine", r: 0x00, g: 0x1c, b: 0xdf },
  { index: 22, name: "Royal Purple", r: 0xdf, g: 0x00, b: 0xb8 },
  { index: 23, name: "Dark Gray", r: 0x62, g: 0x62, b: 0x62 },
  { index: 24, name: "Dark Brown", r: 0x69, g: 0x26, b: 0x0d },
  { index: 25, name: "Deep Rose", r: 0xff, g: 0x00, b: 0x60 },
  { index: 26, name: "Light Brown", r: 0xbf, g: 0x82, b: 0x00 },
  { index: 27, name: "Salmon Pink", r: 0xf3, g: 0x91, b: 0x78 },
  { index: 28, name: "Vermilion", r: 0xff, g: 0x68, b: 0x05 },
  { index: 29, name: "White", r: 0xf0, g: 0xf0, b: 0xf0 },
  { index: 30, name: "Violet", r: 0xc8, g: 0x32, b: 0xcd },
  { index: 31, name: "Seacrest", r: 0xb0, g: 0xbf, b: 0x9b },
  { index: 32, name: "Sky Blue", r: 0x65, g: 0xbf, b: 0xeb },
  { index: 33, name: "Pumpkin", r: 0xff, g: 0xba, b: 0x04 },
  { index: 34, name: "Cream Yellow", r: 0xff, g: 0xf0, b: 0x6c },
  { index: 35, name: "Khaki", r: 0xfe, g: 0xca, b: 0x15 },
  { index: 36, name: "Clay Brown", r: 0xf3, g: 0x81, b: 0x01 },
  { index: 37, name: "Leaf Green", r: 0x37, g: 0xa9, b: 0x23 },
  { index: 38, name: "Peacock Blue", r: 0x23, g: 0x46, b: 0x5f },
  { index: 39, name: "Gray", r: 0xa6, g: 0xa6, b: 0x95 },
  { index: 40, name: "Warm Gray", r: 0xce, g: 0xbf, b: 0xa6 },
  { index: 41, name: "Dark Olive", r: 0x96, g: 0xaa, b: 0x02 },
  { index: 42, name: "Linen", r: 0xff, g: 0xe3, b: 0xc6 },
  { index: 43, name: "Pink", r: 0xff, g: 0x99, b: 0xd7 },
  { index: 44, name: "Deep Green", r: 0x00, g: 0x70, b: 0x04 },
  { index: 45, name: "Lavender", r: 0xed, g: 0xcc, b: 0xfb },
  { index: 46, name: "Wisteria Violet", r: 0xc0, g: 0x89, b: 0xd8 },
  { index: 47, name: "Beige", r: 0xe7, g: 0xd9, b: 0xb4 },
  { index: 48, name: "Carmine", r: 0xe9, g: 0x0e, b: 0x86 },
  { index: 49, name: "Amber Red", r: 0xcf, g: 0x68, b: 0x29 },
  { index: 50, name: "Olive Green", r: 0x40, g: 0x86, b: 0x15 },
  { index: 51, name: "Dark Fuchsia", r: 0xdb, g: 0x17, b: 0x97 },
  { index: 52, name: "Tangerine", r: 0xff, g: 0xa7, b: 0x04 },
  { index: 53, name: "Light Blue", r: 0xb9, g: 0xff, b: 0xff },
  { index: 54, name: "Emerald Green", r: 0x22, g: 0x89, b: 0x27 },
  { index: 55, name: "Purple", r: 0xb6, g: 0x12, b: 0xcd },
  { index: 56, name: "Moss Green", r: 0x00, g: 0xaa, b: 0x00 },
  { index: 57, name: "Flesh Pink", r: 0xfe, g: 0xa9, b: 0xdc },
  { index: 58, name: "Harvest Gold", r: 0xfe, g: 0xd5, b: 0x10 },
  { index: 59, name: "Electric Blue", r: 0x00, g: 0x97, b: 0xdf },
  { index: 60, name: "Lemon Yellow", r: 0xff, g: 0xff, b: 0x84 },
  { index: 61, name: "Fresh Green", r: 0xcf, g: 0xe7, b: 0x74 },
  { index: 62, name: "Applique Material", r: 0xff, g: 0xc8, b: 0x64 },
  { index: 63, name: "Applique Position", r: 0xff, g: 0xc8, b: 0xc8 },
  { index: 64, name: "Applique", r: 0xff, g: 0xc8, b: 0xc8 },
];

export function findNearestPecThread(r: number, g: number, b: number): PecThread {
  let best = PEC_THREAD_PALETTE[0];
  let bestDist = Infinity;
  for (const thread of PEC_THREAD_PALETTE) {
    const dr = thread.r - r;
    const dg = thread.g - g;
    const db = thread.b - b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = thread;
    }
  }
  return best;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export interface StitchCommand {
  type: "stitch" | "jump" | "trim" | "color_change" | "end";
  x?: number;
  y?: number;
  colorIndex?: number;
}

export interface StitchColorBlock {
  pecColorIndex: number;
  hexColor: string;
  threadName: string;
  stitches: { x: number; y: number }[];
  // Indices in `stitches` where a disconnected segment starts.
  // Encoder emits trim+jump for these boundaries.
  segmentBreaks?: number[];
}

// 48x38 blank thumbnail (6 bytes width * 38 rows = 228 bytes)
const BLANK_THUMBNAIL: number[] = [
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x10,
  0x04, 0x00, 0x00, 0x00, 0x00, 0x20,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
  0x04, 0x00, 0x00, 0x00, 0x00, 0x20,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x10,
  0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f,
];

class BinaryWriter {
  private chunks: Uint8Array[] = [];
  private currentChunk: Uint8Array;
  private pos = 0;

  constructor(initialSize = 4096) {
    this.currentChunk = new Uint8Array(initialSize);
  }

  private ensureCapacity(bytes: number) {
    if (this.pos + bytes > this.currentChunk.length) {
      this.chunks.push(this.currentChunk.slice(0, this.pos));
      const newSize = Math.max(this.currentChunk.length * 2, bytes + 1024);
      this.currentChunk = new Uint8Array(newSize);
      this.pos = 0;
    }
  }

  writeUint8(value: number) {
    this.ensureCapacity(1);
    this.currentChunk[this.pos++] = value & 0xff;
  }

  writeInt16LE(value: number) {
    this.ensureCapacity(2);
    const v = value & 0xffff;
    this.currentChunk[this.pos++] = v & 0xff;
    this.currentChunk[this.pos++] = (v >> 8) & 0xff;
  }

  writeUint16LE(value: number) {
    this.ensureCapacity(2);
    this.currentChunk[this.pos++] = value & 0xff;
    this.currentChunk[this.pos++] = (value >> 8) & 0xff;
  }

  writeUint32LE(value: number) {
    this.ensureCapacity(4);
    this.currentChunk[this.pos++] = value & 0xff;
    this.currentChunk[this.pos++] = (value >> 8) & 0xff;
    this.currentChunk[this.pos++] = (value >> 16) & 0xff;
    this.currentChunk[this.pos++] = (value >> 24) & 0xff;
  }

  writeString(str: string) {
    this.ensureCapacity(str.length);
    for (let i = 0; i < str.length; i++) {
      this.currentChunk[this.pos++] = str.charCodeAt(i);
    }
  }

  writeBytes(bytes: number[]) {
    this.ensureCapacity(bytes.length);
    for (const b of bytes) {
      this.currentChunk[this.pos++] = b & 0xff;
    }
  }

  writeUint8Array(arr: Uint8Array) {
    this.ensureCapacity(arr.length);
    this.currentChunk.set(arr, this.pos);
    this.pos += arr.length;
  }

  fill(value: number, count: number) {
    this.ensureCapacity(count);
    for (let i = 0; i < count; i++) {
      this.currentChunk[this.pos++] = value & 0xff;
    }
  }

  get length(): number {
    let total = 0;
    for (const chunk of this.chunks) {
      total += chunk.length;
    }
    return total + this.pos;
  }

  toUint8Array(): Uint8Array {
    const totalLength = this.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    result.set(this.currentChunk.slice(0, this.pos), offset);
    return result;
  }
}

/**
 * Encode a single PEC coordinate delta (dx or dy).
 * Short form (1 byte): for values in [-63, 63]
 * Long form (2 bytes): for values in [-2048, 2047], with optional jump/trim flags
 */
const PEC_FLAG_NONE = 0x00;
const PEC_FLAG_JUMP = 0x10;
const PEC_FLAG_TRIM = 0x20;

function encodePecCoordinate(
  writer: BinaryWriter,
  value: number,
  flags: number // 0x00 = normal, 0x10 = jump, 0x20 = trim
) {
  if (flags === PEC_FLAG_NONE && value >= -63 && value <= 63) {
    writer.writeUint8(value & 0x7f);
  } else {
    const clamped = Math.max(-2048, Math.min(2047, Math.round(value)));
    const encoded = ((clamped & 0x0fff) | 0x8000 | (flags << 8));
    writer.writeUint8((encoded >> 8) & 0xff);
    writer.writeUint8(encoded & 0xff);
  }
}

function encodePecStitches(
  writer: BinaryWriter,
  colorBlocks: StitchColorBlock[]
) {
  let prevX = 0;
  let prevY = 0;

  for (let blockIdx = 0; blockIdx < colorBlocks.length; blockIdx++) {
    const block = colorBlocks[blockIdx];
    const segmentBreaks = new Set(block.segmentBreaks ?? []);

    if (blockIdx > 0) {
      // Color change command
      writer.writeUint8(0xfe);
      writer.writeUint8(0xb0);
      writer.writeUint8(blockIdx % 2 === 1 ? 2 : 1);
    }

    for (let i = 0; i < block.stitches.length; i++) {
      const stitch = block.stitches[i];
      const dx = Math.round(stitch.x) - prevX;
      const dy = Math.round(stitch.y) - prevY;

      if (i === 0 && blockIdx > 0) {
        // First stitch after color change: trim in place, then jump to start.
        encodePecCoordinate(writer, 0, PEC_FLAG_TRIM);
        encodePecCoordinate(writer, 0, PEC_FLAG_TRIM);
        encodePecCoordinate(writer, dx, PEC_FLAG_JUMP);
        encodePecCoordinate(writer, dy, PEC_FLAG_JUMP);
      } else if (i === 0 && blockIdx === 0) {
        // Very first stitch: jump to start position
        encodePecCoordinate(writer, dx, PEC_FLAG_JUMP);
        encodePecCoordinate(writer, dy, PEC_FLAG_JUMP);
      } else if (segmentBreaks.has(i)) {
        // Explicit path boundary from converter: force trim+jump to next path.
        encodePecCoordinate(writer, 0, PEC_FLAG_TRIM);
        encodePecCoordinate(writer, 0, PEC_FLAG_TRIM);
        encodePecCoordinate(writer, dx, PEC_FLAG_JUMP);
        encodePecCoordinate(writer, dy, PEC_FLAG_JUMP);
      } else {
        encodePecCoordinate(writer, dx, PEC_FLAG_NONE);
        encodePecCoordinate(writer, dy, PEC_FLAG_NONE);
      }

      prevX = Math.round(stitch.x);
      prevY = Math.round(stitch.y);
    }
  }

  // End command
  writer.writeUint8(0xff);
}

function writePecHeader(
  writer: BinaryWriter,
  label: string,
  colorBlocks: StitchColorBlock[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
) {
  // "LA:" prefix + label (truncated/padded to 16 chars) + CR = 20 bytes
  const paddedLabel = label.substring(0, 16).padEnd(16, " ");
  writer.writeString("LA:");
  writer.writeString(paddedLabel);
  writer.writeUint8(0x0d); // carriage return

  // Unknown block (12 bytes)
  writer.writeBytes([0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20]);
  writer.writeUint8(0xff);
  // 2 unknown bytes
  writer.writeUint8(0x00);
  writer.writeUint8(0x06);
  // Thumbnail dimensions
  writer.writeUint8(0x26); // thumbnail width in bytes (38 pixels / 8 = ~6 but spec says 0x26)

  // 12 unknown bytes
  writer.writeBytes([0x20, 0x20, 0x20, 0x20, 0x64, 0x20, 0x00, 0x20, 0x00, 0x20, 0x20, 0x20]);

  // Number of colors minus one
  const numColors = colorBlocks.length;
  writer.writeUint8(numColors - 1);

  // Color palette indices (PEC indices are 1-based)
  for (const block of colorBlocks) {
    writer.writeUint8(block.pecColorIndex - 1);
  }

  // Pad to 463 bytes from start of color section
  const colorPadding = 463 - numColors;
  writer.fill(0x20, colorPadding);

  // === Second PEC section ===
  // 2 unknown bytes
  writer.writeUint16LE(0x0000);

  // Offset to thumbnail image - will be filled after stitch encoding
  // For now, write placeholder. We'll calculate this below.
  const thumbnailOffsetPos = writer.length;
  writer.writeUint16LE(0x0000); // placeholder

  // Unknown values
  writer.writeUint16LE(0x3100);
  writer.writeUint16LE(0xf0ff);

  // Design dimensions
  const width = Math.round(bounds.maxX - bounds.minX);
  const height = Math.round(bounds.maxY - bounds.minY);
  writer.writeInt16LE(width);
  writer.writeInt16LE(height);

  // Unknown values
  writer.writeUint16LE(0x01e0);
  writer.writeUint16LE(0x01b0);

  // 4 unknown bytes encoding start position
  const startX = Math.round(0x9000 - bounds.minX);
  const startY = Math.round(0x9000 - bounds.minY);
  writer.writeUint16LE(startX & 0xffff);
  writer.writeUint16LE(startY & 0xffff);

  return thumbnailOffsetPos;
}

function writePecGraphics(writer: BinaryWriter, numColors: number) {
  // (numColors + 1) blank thumbnails
  for (let i = 0; i < numColors + 1; i++) {
    writer.writeBytes(BLANK_THUMBNAIL);
  }
}

function computeBounds(colorBlocks: StitchColorBlock[]): {
  minX: number; minY: number; maxX: number; maxY: number;
} {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const block of colorBlocks) {
    for (const s of block.stitches) {
      if (s.x < minX) minX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.x > maxX) maxX = s.x;
      if (s.y > maxY) maxY = s.y;
    }
  }
  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Encode the complete PES file from stitch color blocks.
 * Coordinates are in PES units (1 unit = 0.1mm, so 10 units = 1mm).
 */
export function encodePesFile(
  colorBlocks: StitchColorBlock[],
  label: string = "squigglify"
): Uint8Array {
  if (colorBlocks.length === 0) {
    throw new Error("No stitch data to encode");
  }

  const bounds = computeBounds(colorBlocks);

  // Shift all coordinates so the design is centered around origin
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const shiftedBlocks: StitchColorBlock[] = colorBlocks.map(block => ({
    ...block,
    stitches: block.stitches.map(s => ({
      x: s.x - centerX,
      y: s.y - centerY,
    })),
  }));

  const shiftedBounds = {
    minX: bounds.minX - centerX,
    minY: bounds.minY - centerY,
    maxX: bounds.maxX - centerX,
    maxY: bounds.maxY - centerY,
  };

  // === Build PES section ===
  const pesWriter = new BinaryWriter();

  // Magic string: #PES0001
  pesWriter.writeString("#PES0001");

  // PEC seek value placeholder (4 bytes) - will be patched
  const pecSeekPos = 8;
  pesWriter.writeUint32LE(0x00000000);

  // PES header fields
  pesWriter.writeInt16LE(0x01); // design page size indicator
  pesWriter.writeInt16LE(0x01);
  pesWriter.writeInt16LE(0x01);
  pesWriter.writeInt16LE(0xffff); // -1
  pesWriter.writeInt16LE(0x0000);

  // CEmbOne class reference
  const cembOneName = "CEmbOne";
  pesWriter.writeUint16LE(cembOneName.length);
  pesWriter.writeString(cembOneName);

  // CEmbOne section (66 bytes of metadata)
  // Offsets: origin, dimensions, etc.
  const designWidth = Math.round(shiftedBounds.maxX - shiftedBounds.minX);
  const designHeight = Math.round(shiftedBounds.maxY - shiftedBounds.minY);

  // Write 22 fields of CEmbOne (most unknown, fill with sensible defaults)
  pesWriter.writeInt16LE(0x0000); // 1
  pesWriter.writeInt16LE(0x0000); // 2
  pesWriter.writeInt16LE(0x0000); // 3
  pesWriter.writeInt16LE(0x0000); // 4
  pesWriter.writeInt16LE(0x0000); // 5
  pesWriter.writeInt16LE(0x0000); // 6
  pesWriter.writeInt16LE(0x0000); // 7
  pesWriter.writeInt16LE(0x0000); // 8
  pesWriter.writeInt16LE(0x0000); // 9
  pesWriter.writeInt16LE(0x0000); // 10
  pesWriter.writeInt16LE(0x0000); // 11
  pesWriter.writeInt16LE(0x0000); // 12
  pesWriter.writeInt16LE(0x0000); // 13
  pesWriter.writeInt16LE(0x0000); // 14
  pesWriter.writeInt16LE(0x0000); // 15
  pesWriter.writeInt16LE(0x0000); // 16
  pesWriter.writeInt16LE(0x0000); // 17
  pesWriter.writeInt16LE(0x0000); // 18
  pesWriter.writeInt16LE(0x0000); // 19
  pesWriter.writeInt16LE(0x0000); // 20
  pesWriter.writeInt16LE(0x0000); // 21
  pesWriter.writeInt16LE(Math.round(shiftedBounds.minX)); // 22: X offset
  pesWriter.writeInt16LE(Math.round(shiftedBounds.minY)); // 23: Y offset
  pesWriter.writeInt16LE(designWidth);  // 24: width
  pesWriter.writeInt16LE(designHeight); // 25: height
  pesWriter.writeInt16LE(0x0000); // 26
  pesWriter.writeInt16LE(0x0000); // 27
  pesWriter.writeInt16LE(0x0000); // 28

  // Trailing fields matching PES header end
  pesWriter.writeInt16LE(0x0001);
  pesWriter.writeInt16LE(0x0001);
  pesWriter.writeInt16LE(0xffff); // -1
  pesWriter.writeInt16LE(0x0000);

  // CSewSeg class reference
  const csewSegName = "CSewSeg";
  pesWriter.writeUint16LE(csewSegName.length);
  pesWriter.writeString(csewSegName);

  // CSewSeg: write stitch blocks
  let totalStitchBlocks = 0;
  for (const block of shiftedBlocks) {
    if (block.stitches.length > 0) {
      // Block header: color start indicator, color index, stitch count
      pesWriter.writeInt16LE(0x8003); // color start indicator
      pesWriter.writeInt16LE(block.pecColorIndex);
      pesWriter.writeInt16LE(block.stitches.length);

      // Write stitch coordinates as absolute 16-bit signed integers
      for (const stitch of block.stitches) {
        pesWriter.writeInt16LE(Math.round(stitch.x));
        pesWriter.writeInt16LE(Math.round(stitch.y));
      }

      totalStitchBlocks++;
    }
  }

  // Block separator at end: 0x8003 with 0x0000 indicating end
  pesWriter.writeUint16LE(0x8003);

  // Color table
  for (let i = 0; i < shiftedBlocks.length; i++) {
    pesWriter.writeInt16LE(shiftedBlocks[i].pecColorIndex);
    pesWriter.writeInt16LE(i === shiftedBlocks.length - 1 ? 0 : 1);
  }
  pesWriter.writeUint16LE(0x0000);

  // Mark position for PEC section start
  const pecStartOffset = pesWriter.length;

  // === Build PEC section ===
  writePecHeader(pesWriter, label, shiftedBlocks, shiftedBounds);
  encodePecStitches(pesWriter, shiftedBlocks);
  writePecGraphics(pesWriter, shiftedBlocks.length);

  // === Patch the PEC seek value ===
  const result = pesWriter.toUint8Array();
  const view = new DataView(result.buffer);
  view.setUint32(pecSeekPos, pecStartOffset, true);

  return result;
}
