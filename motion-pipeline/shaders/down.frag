// 13-tap downsample. The first level also applies the bloom threshold, tap by tap, to the brightest channel.
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThresh, uPre;
vec3 tap(vec2 uv) {
  vec3 c = texture(uSrc, uv).rgb;
  if (uPre > 0.5) { float br = max(c.r, max(c.g, c.b)); c *= max(br - uThresh, 0.0) / max(br, 1e-4); }
  return c;
}
void main() {
  vec2 t = uTexel, uv = vUv;
  vec3 a = tap(uv + t * vec2(-2, 2)), b = tap(uv + t * vec2(0, 2)), c = tap(uv + t * vec2(2, 2));
  vec3 d = tap(uv + t * vec2(-2, 0)), e = tap(uv), f = tap(uv + t * vec2(2, 0));
  vec3 g = tap(uv + t * vec2(-2, -2)), h = tap(uv + t * vec2(0, -2)), i = tap(uv + t * vec2(2, -2));
  vec3 j = tap(uv + t * vec2(-1, 1)), k = tap(uv + t * vec2(1, 1)), l = tap(uv + t * vec2(-1, -1)), m = tap(uv + t * vec2(1, -1));
  fragColor = vec4(e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125, 1.0);
}
