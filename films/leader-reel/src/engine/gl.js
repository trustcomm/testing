// GPU core: one THREE.WebGLRenderer, full-screen passes, render targets, shared GLSL, and the post chain.
// Every pass is a RawShaderMaterial (GLSL3) so colour handling is explicit: worlds render linear HDR radiance,
// the composite pass tone-maps, grades, adds grain and writes sRGB to the canvas.
window.createEngine = function (THREE, canvas) {
  const W = 1920, H = 1080;
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: false, depth: true, stencil: false,
    preserveDrawingBuffer: true, powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // the composite shader encodes sRGB itself
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;

  const quadGeo = new THREE.BufferGeometry();
  quadGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const quadMesh = new THREE.Mesh(quadGeo);
  quadMesh.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quadMesh);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const CHUNK = /* glsl */ `
    precision highp float;
    precision highp int;
    #define PI 3.141592653589793
    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
    float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
      return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
    float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.-2.*f);
      float a = mix(mix(hash13(i), hash13(i+vec3(1,0,0)), u.x), mix(hash13(i+vec3(0,1,0)), hash13(i+vec3(1,1,0)), u.x), u.y);
      float b = mix(mix(hash13(i+vec3(0,0,1)), hash13(i+vec3(1,0,1)), u.x), mix(hash13(i+vec3(0,1,1)), hash13(i+vec3(1,1,1)), u.x), u.y);
      return mix(a, b, u.z); }
    float fbm(vec2 p){ float s = 0., a = .5; for(int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
    float fbm3(vec3 p){ float s = 0., a = .5; for(int i = 0; i < 4; i++){ s += a * vnoise3(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
    mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
    float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
    vec3 srgbToLin(vec3 c){ return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
    vec3 linToSrgb(vec3 c){ c = max(c, 0.); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
    // palette (linear)
    const vec3 C_VOID  = vec3(0.00182, 0.00212, 0.00335);
    const vec3 C_BONE  = vec3(0.8469, 0.7912, 0.7011);
    const vec3 C_INFRA = vec3(1.0, 0.0685, 0.0176);
    const vec3 C_ICE   = vec3(0.2747, 0.6795, 1.0);
    const vec3 C_EMBER = vec3(1.0, 0.4508, 0.1946);
    const vec3 C_DEEP  = vec3(0.0423, 0.0037, 0.0012);
    const vec3 C_SLATE = vec3(0.0110, 0.0160, 0.0296);
  `;
  const VS = /* glsl */ `
    in vec3 position;
    out vec2 vUv;
    void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }
  `;

  function material(fs, uniforms, opts) {
    return new THREE.RawShaderMaterial(Object.assign({
      glslVersion: THREE.GLSL3,
      vertexShader: VS,
      fragmentShader: CHUNK + "\nin vec2 vUv;\nout vec4 fragColor;\n" + fs,
      uniforms: uniforms || {},
      depthTest: false, depthWrite: false,
    }, opts || {}));
  }

  function rt(w, h, o) {
    o = o || {};
    const t = new THREE.WebGLRenderTarget(w, h, {
      type: o.type || THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: o.nearest ? THREE.NearestFilter : THREE.LinearFilter,
      magFilter: o.nearest ? THREE.NearestFilter : THREE.LinearFilter,
      depthBuffer: !!o.depth,
      stencilBuffer: false,
      samples: o.samples || 0,
      wrapS: o.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
      wrapT: o.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
    });
    t.texture.generateMipmaps = false;
    return t;
  }

  function pass(mat, target, clear) {
    quadMesh.material = mat;
    renderer.setRenderTarget(target || null);
    if (clear) renderer.clear(true, false, false);
    renderer.render(quadScene, quadCam);
  }
  function clearTarget(target, r, g, b, a) {
    renderer.setRenderTarget(target || null);
    renderer.setClearColor(new THREE.Color(r || 0, g || 0, b || 0), a == null ? 1 : a);
    renderer.clear(true, true, false);
  }

  // ------------------------------------------------------------------ bloom (mip chain)
  const LEVELS = 6;
  const bloomRT = [];
  { let w = W >> 1, h = H >> 1; for (let i = 0; i < LEVELS; i++) { bloomRT.push(rt(Math.max(w, 2), Math.max(h, 2))); w >>= 1; h >>= 1; } }
  const bloomUp = bloomRT.map((r) => rt(r.width, r.height));
  const matPrefilter = material(`
    uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uThreshold, uKnee;
    vec3 tap(vec2 o){ return texture(uSrc, vUv + o * uTexel).rgb; }
    void main(){
      vec3 c = (tap(vec2(-1,-1)) + tap(vec2(1,-1)) + tap(vec2(-1,1)) + tap(vec2(1,1))) * .25;
      c = min(c, vec3(64.));
      float br = max(c.r, max(c.g, c.b));
      float soft = clamp(br - uThreshold + uKnee, 0., 2. * uKnee);
      soft = soft * soft / (4. * uKnee + 1e-4);
      float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
      fragColor = vec4(c * contrib, 1.);
    }`, { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 }, uKnee: { value: 0.5 } });
  const matDown = material(`
    uniform sampler2D uSrc; uniform vec2 uTexel;
    void main(){
      vec3 c = texture(uSrc, vUv).rgb * 4.;
      c += texture(uSrc, vUv + vec2(-1,-1) * uTexel).rgb;
      c += texture(uSrc, vUv + vec2( 1,-1) * uTexel).rgb;
      c += texture(uSrc, vUv + vec2(-1, 1) * uTexel).rgb;
      c += texture(uSrc, vUv + vec2( 1, 1) * uTexel).rgb;
      fragColor = vec4(c / 8., 1.);
    }`, { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
  const matUp = material(`
    uniform sampler2D uSrc, uAdd; uniform vec2 uTexel; uniform float uRadius;
    void main(){
      vec2 d = uTexel * uRadius;
      vec3 c = texture(uSrc, vUv).rgb * 4.;
      c += (texture(uSrc, vUv + vec2(-d.x, 0)).rgb + texture(uSrc, vUv + vec2(d.x, 0)).rgb + texture(uSrc, vUv + vec2(0, -d.y)).rgb + texture(uSrc, vUv + vec2(0, d.y)).rgb) * 2.;
      c += texture(uSrc, vUv + vec2(-d.x, -d.y)).rgb + texture(uSrc, vUv + vec2(d.x, -d.y)).rgb + texture(uSrc, vUv + vec2(-d.x, d.y)).rgb + texture(uSrc, vUv + vec2(d.x, d.y)).rgb;
      fragColor = vec4(c / 16. + texture(uAdd, vUv).rgb, 1.);
    }`, { uSrc: { value: null }, uAdd: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1.0 } });

  function bloom(srcTex, threshold, knee) {
    matPrefilter.uniforms.uSrc.value = srcTex;
    matPrefilter.uniforms.uTexel.value.set(1 / W, 1 / H);
    matPrefilter.uniforms.uThreshold.value = threshold;
    matPrefilter.uniforms.uKnee.value = knee;
    pass(matPrefilter, bloomRT[0]);
    for (let i = 1; i < LEVELS; i++) {
      matDown.uniforms.uSrc.value = bloomRT[i - 1].texture;
      matDown.uniforms.uTexel.value.set(1 / bloomRT[i - 1].width, 1 / bloomRT[i - 1].height);
      pass(matDown, bloomRT[i]);
    }
    // upsample: up[L-1] = down[L-1]; up[i] = tent(up[i+1]) + down[i]
    let prev = bloomRT[LEVELS - 1];
    for (let i = LEVELS - 2; i >= 0; i--) {
      matUp.uniforms.uSrc.value = prev.texture;
      matUp.uniforms.uAdd.value = bloomRT[i].texture;
      matUp.uniforms.uTexel.value.set(1 / prev.width, 1 / prev.height);
      pass(matUp, bloomUp[i]);
      prev = bloomUp[i];
    }
    return bloomUp[0].texture;
  }

  // ------------------------------------------------------------------ zoom / radial blur
  const zoomRT = rt(W, H);
  const matZoom = material(`
    uniform sampler2D uSrc; uniform vec2 uCenter; uniform float uStrength; uniform float uSeed;
    void main(){
      vec2 dir = vUv - uCenter;
      float j = hash12(gl_FragCoord.xy + uSeed);
      vec3 acc = vec3(0.); float wsum = 0.;
      for (int i = 0; i < 20; i++){
        float k = (float(i) + j) / 20.;
        float w = 1. - k * .6;
        acc += texture(uSrc, uCenter + dir * (1. - uStrength * k)).rgb * w;
        wsum += w;
      }
      fragColor = vec4(acc / wsum, 1.);
    }`, { uSrc: { value: null }, uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uStrength: { value: 0 }, uSeed: { value: 0 } });
  function zoomBlur(srcTex, cx, cy, strength, seed) {
    matZoom.uniforms.uSrc.value = srcTex;
    matZoom.uniforms.uCenter.value.set(cx, cy);
    matZoom.uniforms.uStrength.value = strength;
    matZoom.uniforms.uSeed.value = seed || 0;
    pass(matZoom, zoomRT);
    return zoomRT.texture;
  }

  // ------------------------------------------------------------------ composite (to canvas)
  const matComposite = material(`
    uniform sampler2D uScene, uBloom, uOverlay;
    uniform float uExposure, uBloomStrength, uCA, uVignette, uGrain, uFrame, uOverlayAlpha, uFlicker, uContrast, uSat;
    uniform vec2 uWeave; uniform float uPunch;
    vec3 aces(vec3 x){ const float a = 2.51, b = .03, c = 2.43, d = .59, e = .14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0., 1.); }
    vec3 sampleScene(vec2 uv){
      if (uCA <= 0.0001) return texture(uScene, uv).rgb + texture(uBloom, uv).rgb * uBloomStrength;
      vec2 d = (uv - .5) * uCA;
      vec3 c;
      c.r = texture(uScene, uv - d).r + texture(uBloom, uv - d).r * uBloomStrength;
      c.g = texture(uScene, uv).g + texture(uBloom, uv).g * uBloomStrength;
      c.b = texture(uScene, uv + d).b + texture(uBloom, uv + d).b * uBloomStrength;
      return c;
    }
    void main(){
      vec2 uv = .5 + (vUv - .5) / (1. + uPunch) + uWeave;
      vec3 c = sampleScene(uv) * uExposure * uFlicker;
      c = aces(c);
      // grade: warm the top end toward bone, keep the floor at void
      float l = luma(c);
      c = mix(c, c * vec3(1.0, .935, .83), smoothstep(.45, 1., l));
      c = mix(vec3(l), c, uSat);
      c = (c - .5) * uContrast + .5;
      c = max(c, C_VOID * .6);
      // vignette
      vec2 q = vUv - .5; q.x *= 1.777;
      c *= mix(1., smoothstep(1.25, .25, length(q)), uVignette);
      vec3 s = linToSrgb(c);
      // film grain (seeded by frame), strongest in the mid-tones
      float n = hash12(gl_FragCoord.xy + uFrame * 17.31) + hash12(gl_FragCoord.xy * 1.37 + uFrame * 3.17) - 1.;
      float midw = 4. * l * (1. - l) + .25;
      s += n * uGrain * midw;
      // overlay (labels, leader marks) in display space
      vec4 o = texture(uOverlay, vUv);
      s = mix(s, o.rgb, o.a * uOverlayAlpha);
      s += (hash12(gl_FragCoord.xy + 91.7 + uFrame) - .5) / 255.;
      fragColor = vec4(clamp(s, 0., 1.), 1.);
    }`, {
      uScene: { value: null }, uBloom: { value: null }, uOverlay: { value: null },
      uExposure: { value: 1 }, uBloomStrength: { value: 0.6 }, uCA: { value: 0 }, uVignette: { value: 0.55 },
      uGrain: { value: 0.035 }, uFrame: { value: 0 }, uOverlayAlpha: { value: 1 }, uFlicker: { value: 1 },
      uContrast: { value: 1.04 }, uSat: { value: 1.0 }, uWeave: { value: new THREE.Vector2() }, uPunch: { value: 0 },
    });

  function composite(sceneTex, bloomTex, overlayTex, p) {
    const u = matComposite.uniforms;
    u.uScene.value = sceneTex;
    u.uBloom.value = bloomTex;
    u.uOverlay.value = overlayTex;
    u.uExposure.value = p.exposure;
    u.uBloomStrength.value = p.bloom;
    u.uCA.value = p.ca;
    u.uVignette.value = p.vignette;
    u.uGrain.value = p.grain;
    u.uFrame.value = p.frame;
    u.uOverlayAlpha.value = p.overlayAlpha;
    u.uFlicker.value = p.flicker;
    u.uContrast.value = p.contrast;
    u.uSat.value = p.sat;
    u.uWeave.value.set(p.weaveX || 0, p.weaveY || 0);
    u.uPunch.value = p.punch || 0;
    pass(matComposite, null);
  }

  return { THREE, renderer, W, H, CHUNK, VS, material, rt, pass, clearTarget, bloom, zoomBlur, composite, quadScene, quadCam, quadMesh };
};
