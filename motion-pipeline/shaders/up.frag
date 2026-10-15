// Tent upsample of the smaller level, added to this level.
uniform sampler2D uLow, uHigh;
uniform vec2 uTexel;   // one texel of uLow
void main() {
  vec2 t = uTexel, uv = vUv;
  vec3 s = texture(uLow, uv + t * vec2(-1, 1)).rgb + 2.0 * texture(uLow, uv + t * vec2(0, 1)).rgb + texture(uLow, uv + t * vec2(1, 1)).rgb
         + 2.0 * texture(uLow, uv + t * vec2(-1, 0)).rgb + 4.0 * texture(uLow, uv).rgb + 2.0 * texture(uLow, uv + t * vec2(1, 0)).rgb
         + texture(uLow, uv + t * vec2(-1, -1)).rgb + 2.0 * texture(uLow, uv + t * vec2(0, -1)).rgb + texture(uLow, uv + t * vec2(1, -1)).rgb;
  fragColor = vec4(texture(uHigh, uv).rgb + s / 16.0, 1.0);
}
