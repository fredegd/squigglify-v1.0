/**
 * GLSL shader sources for the WebGL squiggle renderer.
 *
 * Vertex shader: transforms 2D positions from pixel-space into clip-space.
 * Fragment shader: outputs a flat color per draw call (set via uniform).
 */

export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

// Per-vertex attributes
layout(location = 0) in vec2 a_position; // position in pixel-space

// Uniforms
uniform vec2 u_resolution; // canvas width/height in pixels
uniform vec2 u_offset;     // pan offset in pixels
uniform float u_scale;     // zoom scale

void main() {
  // Apply pan + zoom, then map pixel coords → clip-space [-1, 1]
  vec2 scaled = (a_position - u_offset) * u_scale;
  // Convert from pixel-space to normalised [0,1], then to clip-space [-1,1]
  vec2 clipSpace = (scaled / u_resolution) * 2.0 - 1.0;
  // Flip Y because WebGL's Y axis points up, but our coords have Y pointing down
  gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform vec4 u_color; // RGBA color for this draw call
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
