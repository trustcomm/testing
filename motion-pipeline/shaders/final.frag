// radial chromatic aberration (uCA px at the corners), vignette, then luminance-weighted animated grain seeded by uFrame.
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uCA, uVig, uGrain, uFrame;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float rnd(uvec2 p, uint seed) { return float(pcg(p.x + pcg(p.y + pcg(seed)))) / 4294967295.0; }
void main() {
  vec2 dp = (vUv - 0.5) * uRes;
  float rn = length(dp) / (0.5 * length(uRes));              // 0 at the centre, 1 at the corners
  vec2 off = normalize(dp + vec2(1e-5)) * rn * uCA / uRes;
  vec3 c = vec3(texture(uSrc, vUv + off).r, texture(uSrc, vUv).g, texture(uSrc, vUv - off).b);
  c *= 1.0 - uVig * rn * rn;
  float l = luma(c);
  float w = smoothstep(0.0, 0.2, l) * (1.0 - 0.6 * smoothstep(0.5, 1.0, l));   // none in pure black, tapering in the highs
  uvec2 px = uvec2(gl_FragCoord.xy);
  uint f = uint(uFrame);
  float n = rnd(px, f * 2u + 1u) + rnd(px, f * 2u + 2u) - 1.0;                  // triangular noise, -1..1
  fragColor = vec4(c + n * uGrain * w, 1.0);
}
