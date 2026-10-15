// post off: the composite, display-encoded, nothing else.
uniform sampler2D uSrc;
void main() { fragColor = vec4(toSrgb(texture(uSrc, vUv).rgb), 1.0); }
