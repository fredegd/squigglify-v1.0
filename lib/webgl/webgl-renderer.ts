/**
 * WebGL Renderer for Squigglify preview.
 *
 * Renders squiggly vector art on a <canvas> using WebGL2,
 * replacing the SVG-string-based preview for real-time, non-blocking updates.
 *
 * Usage:
 *   const renderer = new WebGLRenderer(canvas);
 *   renderer.updateData(processedData, settings);  // when image/processing changes
 *   renderer.render(settings);                     // when rendering settings change
 *   renderer.dispose();                            // cleanup
 */

import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from "./shaders";
import {
  buildVerticesForAllGroups,
  type ColorGroupVertices,
} from "./vertex-builder";
import type { ImageData, Settings } from "../types";

interface GroupBufferInfo {
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  vertexCount: number;
  color: [number, number, number, number];
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private canvas: HTMLCanvasElement | null = null;

  // Uniform locations
  private uResolution: WebGLUniformLocation | null = null;
  private uOffset: WebGLUniformLocation | null = null;
  private uScale: WebGLUniformLocation | null = null;
  private uColor: WebGLUniformLocation | null = null;

  // Per-group GPU buffers
  private groupBuffers: GroupBufferInfo[] = [];

  // Viewport info (used for coordinate mapping)
  private outputWidth: number = 0;
  private outputHeight: number = 0;

  // Current canvas display size
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  
  // Current zoom scale (from CSS transform)
  private zoomScale: number = 1;

  public setZoomScale(scale: number): void {
    this.zoomScale = scale;
  }

  /**
   * Initialise the renderer on a canvas element.
   * Returns false if WebGL2 is not supported.
   */
  init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error("WebGL2 not supported");
      return false;
    }

    this.gl = gl;

    // Compile shaders and link program
    const program = this.createProgram(
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE
    );
    if (!program) return false;
    this.program = program;

    // Cache uniform locations
    this.uResolution = gl.getUniformLocation(program, "u_resolution");
    this.uOffset = gl.getUniformLocation(program, "u_offset");
    this.uScale = gl.getUniformLocation(program, "u_scale");
    this.uColor = gl.getUniformLocation(program, "u_color");

    // Default GL state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  /**
   * Update the data to render (called when processedData changes).
   * Rebuilds vertex buffers from scratch.
   */
  updateData(processedData: ImageData, settings: Settings): void {
    if (!this.gl || !this.program) return;

    this.outputWidth = processedData.outputWidth;
    this.outputHeight = processedData.outputHeight;

    // Clean up old buffers
    this.disposeBuffers();

    if (!processedData.colorGroups) return;

    // Build vertex data for all visible groups
    const groupsVertices = buildVerticesForAllGroups(
      processedData.colorGroups,
      settings
    );

    // Upload to GPU
    this.uploadGroupBuffers(groupsVertices);
  }

  /**
   * Re-render with new settings (called when rendering settings change).
   * Rebuilds vertex buffers since curve controls affect geometry.
   *
   * This is still very fast because we skip image processing entirely —
   * only vertex computation + GPU upload + draw call.
   */
  renderWithNewSettings(processedData: ImageData, settings: Settings): void {
    if (!this.gl || !this.program) return;

    this.outputWidth = processedData.outputWidth;
    this.outputHeight = processedData.outputHeight;

    // Dispose old
    this.disposeBuffers();

    if (!processedData.colorGroups) return;

    // Rebuild vertices with new settings
    const groupsVertices = buildVerticesForAllGroups(
      processedData.colorGroups,
      settings
    );

    this.uploadGroupBuffers(groupsVertices);
    this.render(settings);
  }

  /**
   * Draw the current vertex buffers to the canvas.
   */
  render(settings: Settings): void {
    const gl = this.gl;
    if (!gl || !this.program || this.groupBuffers.length === 0) return;

    // Resize canvas to match its display size (handle DPR)
    this.resizeCanvasToDisplaySize();

    // Clear
    gl.clearColor(241 / 255, 241 / 255, 241 / 255, 1.0); // #f1f1f1 background
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Calculate fit-to-canvas transform (centre the artwork)
    const canvasW = gl.canvas.width;
    const canvasH = gl.canvas.height;

    // Scale to fit, maintaining aspect ratio
    const scaleX = canvasW / this.outputWidth;
    const scaleY = canvasH / this.outputHeight;
    const fitScale = Math.min(scaleX, scaleY);

    // Centre offset
    const offsetX = -(canvasW / fitScale - this.outputWidth) / 2;
    const offsetY = -(canvasH / fitScale - this.outputHeight) / 2;

    // Set uniforms
    gl.uniform2f(this.uResolution, canvasW, canvasH);
    gl.uniform2f(this.uOffset, offsetX, offsetY);
    gl.uniform1f(this.uScale, fitScale);

    // Set line width (may be clamped by driver)
    const strokeWidth = settings.curveControls?.strokeWidth || 1.5;
    const scaledStrokeWidth = strokeWidth * fitScale * (window.devicePixelRatio || 1);
    const clampedWidth = Math.max(1, Math.min(scaledStrokeWidth, gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)[1]));
    gl.lineWidth(clampedWidth);

    // Draw each color group
    for (const group of this.groupBuffers) {
      gl.uniform4f(
        this.uColor,
        group.color[0],
        group.color[1],
        group.color[2],
        group.color[3]
      );

      gl.bindVertexArray(group.vao);
      gl.drawArrays(gl.LINES, 0, group.vertexCount);
    }

    gl.bindVertexArray(null);
  }

  /**
   * Dispose all WebGL resources.
   */
  dispose(): void {
    this.disposeBuffers();
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    this.gl = null;
    this.canvas = null;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private uploadGroupBuffers(groups: ColorGroupVertices[]): void {
    const gl = this.gl!;

    for (const group of groups) {
      if (group.vertexCount === 0) continue;

      const vao = gl.createVertexArray()!;
      const vbo = gl.createBuffer()!;

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, group.lineVertices, gl.STATIC_DRAW);

      // a_position at location 0, 2 floats per vertex
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);

      this.groupBuffers.push({
        vao,
        vbo,
        vertexCount: group.vertexCount,
        color: group.color,
      });
    }
  }

  private disposeBuffers(): void {
    if (!this.gl) return;
    for (const info of this.groupBuffers) {
      this.gl.deleteBuffer(info.vbo);
      this.gl.deleteVertexArray(info.vao);
    }
    this.groupBuffers = [];
  }

  private resizeCanvasToDisplaySize(): void {
    const canvas = this.canvas!;
    const dpr = window.devicePixelRatio || 1;
    // Cap effective zoom to prevent allocating excessively large textures that could crash WebGL
    const effectiveZoom = Math.min(this.zoomScale, 12);
    const displayWidth = Math.floor(canvas.clientWidth * dpr * effectiveZoom);
    const displayHeight = Math.floor(canvas.clientHeight * dpr * effectiveZoom);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      this.displayWidth = displayWidth;
      this.displayHeight = displayHeight;
      this.gl!.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  private createProgram(
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
    const gl = this.gl!;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    // Shaders can be deleted after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        `Shader compile error (${type === gl.VERTEX_SHADER ? "vertex" : "fragment"}):`,
        gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}
