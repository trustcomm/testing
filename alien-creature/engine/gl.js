// WebGL2 plumbing: programs, HDR targets and the post chain
// bloom → exposure → ACES fitted → grade → radial chromatic aberration → vignette → grain.

export function createGL(canvas) {
  const gl = canvas.getContext('webgl2', {
    preserveDrawingBuffer: true, antialias: false, alpha: false, premultipliedAlpha: false,
  });
  if (!gl) throw new Error('WebGL2 unavailable');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float missing');
  return gl;
}

export function program(gl, vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

export function target(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('RGBA16F target incomplete');
  return { tex, fb, w, h };
}

const FULL = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const BRIGHT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc; uniform float uThresh; uniform vec2 uTexel;
void main() {
  // four bilinear taps = exact 4x4 box, so single-pixel dots can't alias in and out
  vec3 c = vec3(0);
  for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++)
    c += texture(uSrc, vUv + (vec2(x, y) * 2.0 - 1.0) * uTexel).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(uThresh, uThresh * 2.0 + 0.001, l), 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc; uniform vec2 uDir;
void main() {
  float w[5] = float[](0.227, 0.1946, 0.1216, 0.054, 0.0162);
  vec3 c = texture(uSrc, vUv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    c += texture(uSrc, vUv + uDir * float(i)).rgb * w[i];
    c += texture(uSrc, vUv - uDir * float(i)).rgb * w[i];
  }
  o = vec4(c, 1.0);
}`;

const FINAL = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uScene, uBloomA, uBloomB;
uniform vec3 uBg, uBg2;
uniform float uBloom, uExposure, uCA, uVignette, uGrain, uFrame, uAspect;
uniform vec2 uRes;
vec3 aces(vec3 x) {
  const mat3 i = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 o = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  vec3 v = i * x;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(o * (a / b), 0.0, 1.0);
}
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
void main() {
  vec2 d = vUv - 0.5;
  vec2 off = d * uCA / uRes;
  vec3 s;
  s.r = texture(uScene, vUv + off).r;
  s.g = texture(uScene, vUv).g;
  s.b = texture(uScene, vUv - off).b;
  vec3 bloom = texture(uBloomA, vUv).rgb * 0.6 + texture(uBloomB, vUv).rgb * 0.8;
  // ground: one base colour lit from the top-left, never a flat fill
  float g = clamp(1.0 - length((vUv - vec2(0.15, 0.95)) * vec2(1.0, 1.0 / uAspect) * 0.9), 0.0, 1.0);
  vec3 bg = mix(lin(uBg), lin(uBg2), g * g);
  vec3 c = (bg + s + bloom * uBloom) * uExposure;
  c = aces(c);
  c = pow(c, vec3(1.0 / 2.2));
  c *= vec3(0.985, 1.0, 1.02);                       // cool grade, under 6%
  float vig = 1.0 - uVignette * smoothstep(0.25, 0.85, length(d * vec2(1.0, 1.0 / uAspect) * 1.2));
  c *= vig;
  float n = hash(gl_FragCoord.xy + uFrame * 17.0) - 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c += n * uGrain * (0.35 + 0.65 * (1.0 - l));       // grain weighted toward shadows
  o = vec4(c, 1.0);
}`;

export function createPost(gl, W, H) {
  const P = {
    bright: program(gl, FULL, BRIGHT),
    blur: program(gl, FULL, BLUR),
    final: program(gl, FULL, FINAL),
    scene: target(gl, W, H),
    a1: target(gl, W >> 2, H >> 2), a2: target(gl, W >> 2, H >> 2),
    b1: target(gl, W >> 4, H >> 4), b2: target(gl, W >> 4, H >> 4),
    vao: gl.createVertexArray(),
  };
  return P;
}

function pass(gl, P, prog, dst, setup) {
  gl.useProgram(prog.p);
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
  gl.viewport(0, 0, dst ? dst.w : gl.drawingBufferWidth, dst ? dst.h : gl.drawingBufferHeight);
  setup(prog.u);
  gl.bindVertexArray(P.vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function bindTex(gl, unit, tex, loc) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc, unit);
}

function blurChain(gl, P, src, t1, t2, radius, thresh) {
  pass(gl, P, P.bright, t1, (u) => {
    bindTex(gl, 0, src.tex, u.uSrc);
    gl.uniform1f(u.uThresh, thresh);
    gl.uniform2f(u.uTexel, 1 / src.w, 1 / src.h);
  });
  for (let k = 0; k < 2; k++) {
    pass(gl, P, P.blur, t2, (u) => { bindTex(gl, 0, t1.tex, u.uSrc); gl.uniform2f(u.uDir, radius / t1.w, 0); });
    pass(gl, P, P.blur, t1, (u) => { bindTex(gl, 0, t2.tex, u.uSrc); gl.uniform2f(u.uDir, 0, radius / t1.h); });
  }
}

export function runPost(gl, P, opt) {
  gl.disable(gl.BLEND);
  blurChain(gl, P, P.scene, P.a1, P.a2, 1.0, opt.thresh);
  blurChain(gl, P, P.a1, P.b1, P.b2, 1.0, 0.0);
  pass(gl, P, P.final, null, (u) => {
    bindTex(gl, 0, P.scene.tex, u.uScene);
    bindTex(gl, 1, P.a1.tex, u.uBloomA);
    bindTex(gl, 2, P.b1.tex, u.uBloomB);
    gl.uniform3fv(u.uBg, opt.bg);
    gl.uniform3fv(u.uBg2, opt.bg2);
    gl.uniform1f(u.uBloom, opt.bloom);
    gl.uniform1f(u.uExposure, opt.exposure);
    gl.uniform1f(u.uCA, opt.ca * opt.ss);
    gl.uniform1f(u.uVignette, opt.vignette);
    gl.uniform1f(u.uGrain, opt.grain);
    gl.uniform1f(u.uFrame, opt.frame);
    gl.uniform1f(u.uAspect, opt.aspect);
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
  });
}
