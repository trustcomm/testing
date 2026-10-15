// A soft round point, added to the HDR buffer (ONE, ONE) so bloom can pick up the bright ones.
uniform float uIntensity;
in float vA;
in vec3 vC;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, r);
  fragColor = vec4(vC * a * a * vA * uIntensity, 1.0);
}
