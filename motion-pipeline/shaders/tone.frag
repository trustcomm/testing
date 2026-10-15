// bloom added, exposure, ACES (Hill's fit), the sRGB curve, then the grade: an S-curve and a tint that is warm in the
// highs and cool in the lows by at most 6 %. The output is display-encoded.
uniform sampler2D uHdr, uBloom;
uniform float uBloomAmt, uExposure;
const mat3 ACES_IN = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
const mat3 ACES_OUT = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
vec3 aces(vec3 c) {
  c = ACES_IN * (c / 0.6);                                   // the fit expects scene light pre-scaled by 1/0.6
  vec3 a = c * (c + 0.0245786) - 0.000090537, b = c * (0.983729 * c + 0.4329510) + 0.238081;
  return clamp(ACES_OUT * (a / b), 0.0, 1.0);
}
vec3 grade(vec3 c) {
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.4);                  // S-curve
  float l = luma(c);
  c *= mix(vec3(1.0), vec3(1.06, 1.0, 0.94), smoothstep(0.5, 1.0, l));         // warm highs, at most 6 %
  c *= mix(vec3(1.0), vec3(0.94, 1.0, 1.06), 1.0 - smoothstep(0.0, 0.5, l));   // cool lows, at most 6 %
  return clamp(c, 0.0, 1.0);
}
void main() {
  vec3 c = texture(uHdr, vUv).rgb + texture(uBloom, vUv).rgb * uBloomAmt;
  fragColor = vec4(grade(toSrgb(aces(c * uExposure))), 1.0);
}
