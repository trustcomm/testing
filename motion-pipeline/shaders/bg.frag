// Slow domain-warped fbm, mapped through bg -> dim -> accent (the token colours, in linear light) at low intensity.
// Rendered at a fraction of the frame size: it is low-frequency, and the final pass upsamples it.
uniform float uTime, uFrame, uOne, uIntensity;
uniform vec2 uRes;
uniform vec3 uBg, uDim, uAccent;

uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float hash2(ivec2 p) { return float(pcg(uint(p.x + 4096) + pcg(uint(p.y + 4096)))) / 4294967295.0; }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  ivec2 q = ivec2(i);
  return mix(mix(hash2(q), hash2(q + ivec2(1, 0)), u.x), mix(hash2(q + ivec2(0, 1)), hash2(q + ivec2(1, 1)), u.x), u.y);
}
// the octave count is a runtime bound (4 * uOne), so the compiler cannot unroll three nested fbm calls
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  int n = 4 * int(uOne);
  for (int i = 0; i < n; i++) { v += a * vnoise(p); p = p * 2.02 + vec2(17.3, 9.1); a *= 0.5; }
  return v / 0.9375;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  float t = uTime;
  vec2 q = vec2(fbm(p + 0.05 * t), fbm(p + vec2(5.2, 1.3) - 0.04 * t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.06 * t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.05 * t));
  float f = smoothstep(0.25, 0.85, fbm(p + 3.0 * r));
  vec3 ramp = f < 0.6 ? mix(uBg, uDim, f / 0.6) : mix(uDim, uAccent, (f - 0.6) / 0.4);
  vec3 col = mix(uBg, ramp, uIntensity);
  // a whisker of triangular dither, seeded by the frame, so the dark ramp does not band
  uvec2 px = uvec2(gl_FragCoord.xy);
  float d = float(pcg(px.x + pcg(px.y + pcg(uint(uFrame))))) / 4294967295.0 + float(pcg(px.y + pcg(px.x + 7u + pcg(uint(uFrame))))) / 4294967295.0 - 1.0;
  fragColor = vec4(max(col + d * 0.0004, 0.0), 1.0);
}
