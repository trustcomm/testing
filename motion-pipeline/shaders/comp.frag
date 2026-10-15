// The 2D layer (premultiplied alpha, sRGB-encoded) over the background, in linear light.
uniform sampler2D uBg, uLayer;
void main() {
  vec3 bg = texture(uBg, vUv).rgb;
  vec4 L = texture(uLayer, vUv);
  vec3 lin = toLinear(L.a > 0.0 ? L.rgb / L.a : vec3(0.0)) * L.a;
  fragColor = vec4(lin + bg * (1.0 - L.a), 1.0);
}
