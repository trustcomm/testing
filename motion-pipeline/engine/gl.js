// The WebGL2 layer. Per frame: the 2D layer is uploaded, the background shader and the layer are composited in linear
// light, and the post chain runs: bloom (threshold, 5 levels of 13-tap downsample, tent upsample), exposure, ACES,
// grade, radial chromatic aberration, vignette, grain. Everything between the passes is RGBA16F.
import { tokens as T } from "../tokens.js";
import { glParticles } from "./particles.js";

// every fragment shader starts with this: the version, the fullscreen triangle's varying, and the colour maths
const HEAD = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
vec3 toLinear(vec3 c) { return mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, step(c, vec3(0.04045))); }
vec3 toSrgb(vec3 c) { c = max(c, 0.0); return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, c * 12.92, step(c, vec3(0.0031308))); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;
// a fullscreen triangle from gl_VertexID alone: no buffers, no attributes
const VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
// how much of the bg -> dim -> accent ramp shows through (linear mix): 0.1 was loud enough to fight the type
const BG_INTENSITY = 0.04;
const SHADERS = ["bg", "comp", "down", "up", "tone", "final", "plain"];

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log}\n${src.split("\n").map((l, i) => `${String(i + 1).padStart(3)}  ${l}`).join("\n")}`);
  }
  return sh;
}

// Compiles and links a fragment shader against the fullscreen-triangle vertex shader (or a complete vertex shader of your
// own); throws with the info log on failure.
export function program(gl, fs, vs = VS) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, HEAD + fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`program link failed: ${gl.getProgramInfoLog(p)}`);
  const u = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const a = gl.getActiveUniform(p, i);
    u[a.name] = { loc: gl.getUniformLocation(p, a.name), type: a.type };
  }
  return { p, u };
}

// A texture to render into: RGBA16F with a framebuffer.
export function target(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`RGBA16F framebuffer ${w}x${h} is incomplete (status 0x${status.toString(16)})`);
  return { tex, fbo, w, h };
}

const lin = (hex) => [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });

// Creates the context and everything it draws with. Async only because the shaders are fetched, once, at load.
export async function createGL(canvas) {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error("WebGL2 is not available on this canvas (headless Chrome needs --ignore-gpu-blocklist, and --enable-unsafe-swiftshader where there is no GPU)");
  if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("EXT_color_buffer_float is missing: this machine cannot render to RGBA16F, and the post chain needs it");
  const load = async (file) => {
    const r = await fetch(`shaders/${file}`);
    if (!r.ok) throw new Error(`shaders/${file}: HTTP ${r.status}`);
    return r.text();
  };
  const src = Object.fromEntries(await Promise.all(SHADERS.map(async (n) => [n, await load(`${n}.frag`)])));
  const P = Object.fromEntries(SHADERS.map((n) => [n, program(gl, src[n])]));
  const W = canvas.width, H = canvas.height;
  gl.bindVertexArray(gl.createVertexArray());                 // the empty VAO a vertex-less draw needs

  const bgT = target(gl, W >> 2, H >> 2), hdr = target(gl, W, H), ldr = target(gl, W, H);
  const down = [1, 2, 3, 4, 5].map((l) => target(gl, Math.max(1, W >> l), Math.max(1, H >> l)));   // 5 downsample levels
  const ups = down.slice(0, 4).map((d) => target(gl, d.w, d.h));
  const none = target(gl, 1, 1);                              // a black texel, for when bloom is off

  // the 2D layer: premultiplied alpha, flipped so (0, 0) is the bottom left
  const layerTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, layerTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const upload = (layer) => {
    gl.bindTexture(gl.TEXTURE_2D, layerTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, layer);
  };

  const setUniforms = (prog, vals) => {
    for (const [k, v] of Object.entries(vals)) {
      const a = prog.u[k];
      if (!a) continue;                                       // a uniform the compiler optimised out
      if (a.type === gl.FLOAT) gl.uniform1f(a.loc, v);
      else if (a.type === gl.FLOAT_VEC2) gl.uniform2fv(a.loc, v);
      else if (a.type === gl.FLOAT_VEC3) gl.uniform3fv(a.loc, v);
      else gl.uniform1i(a.loc, v);                            // samplers and ints
    }
  };
  // one fullscreen draw of `prog` into `to` (null = the canvas), with textures by uniform name
  const pass = (prog, to, tex = {}, u = {}) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fbo : null);
    gl.viewport(0, 0, to ? to.w : W, to ? to.h : H);
    gl.useProgram(prog.p);
    const samplers = {};
    Object.entries(tex).forEach(([name, t], unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.tex ?? t); samplers[name] = unit; });
    setUniforms(prog, { ...samplers, ...u });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const [bg, dim, accent] = [T.color.bg, T.color.dim, T.color.accent].map(lin);

  // One frame. `post` is window.POST: { on, bloom, thresh, ca, grain, vig, exposure }; `particles` is window.PARTICLES:
  // { n, density, size, intensity, drift, seed, cam: { dx, dy, z } }, the GPU point field of engine/particles.js (n 0 = none).
  function frame({ t, frame: n, layer, post, particles }) {
    upload(layer);
    pass(P.bg, bgT, {}, { uTime: t, uRes: [bgT.w, bgT.h], uFrame: n, uOne: 1, uIntensity: BG_INTENSITY, uBg: bg, uDim: dim, uAccent: accent });
    pass(P.comp, hdr, { uBg: bgT, uLayer: layerTex });
    if (particles && particles.n > 0) {                       // the GPU point field, added to the HDR buffer before bloom
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fbo);
      gl.viewport(0, 0, W, H);
      glParticles(gl, t, particles);
    }
    if (!post.on) { pass(P.plain, null, { uSrc: hdr }); return; }

    let low = none;                                           // bloom at 0 skips the chain: a scene can opt out of its cost
    if (post.bloom > 0) {
      pass(P.down, down[0], { uSrc: hdr }, { uTexel: [1 / W, 1 / H], uThresh: post.thresh, uPre: 1 });
      for (let i = 1; i < 5; i++) pass(P.down, down[i], { uSrc: down[i - 1] }, { uTexel: [1 / down[i - 1].w, 1 / down[i - 1].h], uThresh: 0, uPre: 0 });
      low = down[4];
      for (let i = 3; i >= 0; i--) { pass(P.up, ups[i], { uLow: low, uHigh: down[i] }, { uTexel: [1 / low.w, 1 / low.h] }); low = ups[i]; }
    }
    pass(P.tone, ldr, { uHdr: hdr, uBloom: low }, { uBloomAmt: post.bloom, uExposure: post.exposure });
    pass(P.final, null, { uSrc: ldr }, { uRes: [W, H], uCA: post.ca, uVig: post.vig, uGrain: post.grain, uFrame: n });
  }
  return { gl, frame };
}
