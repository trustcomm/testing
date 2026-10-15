#version 300 es
// Thousands of particles with nothing uploaded: every attribute is a hash of gl_VertexID, every position a formula of uTime.
// age = mod(...) keeps it looping, and alpha = sin(pi * age / life) is 0 at birth and at death, so nothing pops.
// (The sin-based hash is fine for particles; it would show patterns as grain at 4K.)
uniform float uTime, uDensity, uSize, uIntensity;
uniform vec2 uRes, uCam;
uniform vec3 uInk, uAccent, uIce;
out float vA;
out vec3 vC;
float h(float n) { return fract(sin(n) * 43758.5453); }
float sm(float a, float b, float x) { float u = clamp((x - a) / (b - a), 0.0, 1.0); return u * u * (3.0 - 2.0 * u); }
void main() {
  float i = float(gl_VertexID);
  float life = 2.0 + 3.0 * h(i * 1.7);
  float age = mod(uTime - h(i * 3.1) * 6.0, life);
  float depth = 0.25 + 0.75 * h(i * 11.3);                       // far .. near
  // each particle drifts up from its own height, so the field fills the frame instead of piling up along the bottom edge
  vec2 p = vec2(h(i * 5.3) * uRes.x, h(i * 8.3) * (uRes.y + 80.0) - age * (60.0 + 120.0 * h(i * 7.9)) * depth);
  p.x += sin(uTime * (0.3 + h(i * 2.9)) + h(i * 4.7) * 6.28318) * 40.0 * depth;
  p -= uCam * depth;                                             // follow the camera at a depth-scaled rate
  p = vec2(mod(p.x, uRes.x), mod(p.y + 40.0, uRes.y + 80.0) - 40.0);
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  gl_PointSize = max(1.5, uSize * (1.0 + 3.0 * h(i * 9.1)) * (0.5 + 0.5 * depth));
  // density is a dial: each particle has a threshold and fades in as the dial passes it, so turning it never pops one
  float dial = clamp((uDensity - 0.9 * h(i * 13.7)) / 0.1, 0.0, 1.0);
  // where the camera wraps the field, the particle is already faded out
  float edge = sm(0.0, 60.0, p.x) * sm(0.0, 60.0, uRes.x - p.x) * sm(-40.0, 20.0, p.y) * (1.0 - sm(uRes.y - 20.0, uRes.y + 40.0, p.y));
  vA = sin(3.14159265 * age / life) * (0.3 + 0.7 * h(i * 6.1)) * dial * edge;
  vC = mix(mix(uInk, uAccent, step(0.85, h(i * 17.1))), uIce, step(0.93, h(i * 19.7)));
}
