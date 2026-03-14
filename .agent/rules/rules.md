---
trigger: always_on
---

use bun as package and script manager

## Architecture

### Rendering pipeline

- **Preview** is rendered on a **WebGL2 canvas** (`lib/webgl/`), NOT via SVG DOM.
- **SVG is only generated for export/download** (`lib/utils/svg-utils.ts`).
- The two pipelines share tile-vertex geometry logic but run independently:
  - `lib/webgl/vertex-builder.ts` — builds `Float32Array` vertex buffers for `GL_LINES`
  - `lib/utils/svg-utils.ts` — builds SVG `<path>` strings
- **Both pipelines must stay in sync**: any algorithm change in one (e.g. path merging, tile vertices, curve tessellation) must be mirrored in the other.

### Processing modes

- **Monochrome** (`lib/processors/monochrome-processor.ts`) — single color group, density from brightness
- **Grayscale** (`lib/processors/grayscale-processor.ts`) — multiple gray-level groups
- **Posterize** (`lib/processors/posterize-processor.ts`) — K-means / median-cut color quantization

### Path connection

- When `continuousPaths` is enabled, tile-paths are connected using a two-phase algorithm:
  1. **Phase 1**: serpentine row-order traversal; split into segments when consecutive tile distance exceeds `pathDistanceThreshold`.
  2. **Phase 2**: greedy all-pairs merge — iteratively find the closest pair of segment endpoints (all 4 orientations: end-start, end-end, start-start, start-end) within `pathDistanceThreshold` and merge them, until no more merges are possible.
