// World "7 · Light & 3D" → "6 · Particles" (one Three.js scene, one continuous camera).
// A bevelled black-chrome 7 is backlit by the vortex core (god rays), orbited, then dissolves from its edges into
// sparks. The sparks swirl into a spiral galaxy, snap into a 6, shimmer, and implode to a single point at the 6's counter.
// The dissolve threshold and every spark's spawn time come from the same integer-hash noise on CPU and GPU.
window.WorldForge = function (E) {
  const { THREE, renderer } = E;
  const { U } = window;
  const GG = window.GL_GLYPH;
  const T0 = 1.875, T_DIS = 3.28125, T_DIS1 = 3.86, T_SIX = 4.6875, T_IMP = 5.15625, T1 = 5.625;

  // ---------------------------------------------------------------- integer-hash value noise (CPU == GPU)
  function ihash(x, y, z) {
    let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(z | 0, 83492791)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  }
  function inoise(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    const L = (a, b, t) => a + (b - a) * t;
    const n = (a, b, c) => ihash(ix + a, iy + b, iz + c);
    return L(L(L(n(0, 0, 0), n(1, 0, 0), ux), L(n(0, 1, 0), n(1, 1, 0), ux), uy), L(L(n(0, 0, 1), n(1, 0, 1), ux), L(n(0, 1, 1), n(1, 1, 1), ux), uy), uz);
  }
  const GLSL_NOISE = `
    float ihash(ivec3 p){
      uint h = (uint(p.x) * 73856093u) ^ (uint(p.y) * 19349663u) ^ (uint(p.z) * 83492791u);
      h = (h ^ (h >> 13u)) * 1274126177u;
      h = h ^ (h >> 16u);
      return float(h) / 4294967296.;
    }
    float inoise(vec3 p){
      vec3 i = floor(p), f = p - i; vec3 u = f * f * (3. - 2. * f); ivec3 b = ivec3(i);
      float a0 = mix(ihash(b), ihash(b + ivec3(1,0,0)), u.x), a1 = mix(ihash(b + ivec3(0,1,0)), ihash(b + ivec3(1,1,0)), u.x);
      float a2 = mix(ihash(b + ivec3(0,0,1)), ihash(b + ivec3(1,0,1)), u.x), a3 = mix(ihash(b + ivec3(0,1,1)), ihash(b + ivec3(1,1,1)), u.x);
      return mix(mix(a0, a1, u.y), mix(a2, a3, u.y), u.z);
    }`;
  const NS = 1 / 150; // noise lattice scale (world units → lattice)
  const MAXR = 470;   // radius used to bias the dissolve toward the 7's extremities
  const dissolveKey = (x, y, z) => 0.62 * inoise(x * NS, y * NS, z * NS) + 0.38 * U.clamp(1 - Math.hypot(x, y) / MAXR);

  // ---------------------------------------------------------------- targets
  const W = 1920, H = 1080;
  const rtMain = E.rt(W, H, { depth: true, samples: 4 });
  const rtOcc = E.rt(W >> 1, H >> 1, { depth: true });
  const rtRays = E.rt(W >> 1, H >> 1);

  // ---------------------------------------------------------------- environment (studio of light strips → PMREM)
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x020306);
  const strip = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(...look);
    envScene.add(m);
  };
  strip(9, 2.6, 0xede6da, 4.2, [0, 6, 2], [0, 0, 0]);       // overhead softbox
  strip(1.1, 9, 0x8fd8ff, 5.5, [-6.5, 0.5, 1.5], [0, 0, 0]); // ice strip, left
  strip(1.1, 9, 0xff4a24, 6.0, [6.5, 0.5, -1], [0, 0, 0]);   // infra strip, right
  strip(7, 0.5, 0xede6da, 1.6, [0, -3, 5], [0, 0, 0]);       // low front kicker
  strip(3, 3, 0xffb37a, 2.2, [0, 1, -7], [0, 0, 0]);         // back panel (the backlight's reflection)
  strip(14, 5, 0xede6da, 0.42, [0, 3.5, 8], [0, 0, 0]);       // dim panel behind camera: front-face gradient
  strip(14, 3, 0x8fd8ff, 0.12, [0, -3.5, 8], [0, 0, 0]);      // cool floor bounce for the lower faces
  strip(0.5, 7, 0xede6da, 1.4, [-4, 0, 6], [0, 0, 0]);        // front-left vertical
  strip(0.5, 7, 0x8fd8ff, 1.1, [4.5, 0, 6], [0, 0, 0]);       // front-right vertical (ice)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(envScene, 0.015).texture;

  // ---------------------------------------------------------------- the 7
  const DEPTH = 150;
  const geo7 = new THREE.ExtrudeGeometry(GG.shapes(THREE, "7"), {
    depth: DEPTH, bevelEnabled: true, bevelThickness: 42, bevelSize: 24, bevelOffset: 0, bevelSegments: 10, curveSegments: 14,
  });
  geo7.computeBoundingBox();
  const c7 = new THREE.Vector3();
  geo7.boundingBox.getCenter(c7);
  geo7.translate(-c7.x, -c7.y, -c7.z);
  geo7.computeVertexNormals();

  const dissolveU = { uDissolve: { value: -1 }, uEdge: { value: 0.045 }, uHeat: { value: 1 } };
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0x1b1e26, metalness: 1.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.04,
    envMap: envTex, envMapIntensity: 1.9,
  });
  chrome.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, dissolveU);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nuniform float uDissolve, uEdge, uHeat;\n" + GLSL_NOISE + `
        float dkey(vec3 p){ return .62 * inoise(p * ${NS.toFixed(8)}) + .38 * clamp(1. - length(p.xy) / ${MAXR}., 0., 1.); }`)
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nfloat dk = dkey(vObjPos);\nif (dk < uDissolve) discard;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float eb = smoothstep(uDissolve + uEdge, uDissolve, dk) * step(-0.5, uDissolve);
        totalEmissiveRadiance += mix(vec3(1., .07, .018), vec3(1., .45, .19), eb) * eb * 9. * uHeat;`);
  };
  const mesh7 = new THREE.Mesh(geo7, chrome);
  const scene = new THREE.Scene();
  scene.background = null;
  scene.add(mesh7);

  // lights: two sweeping points for highlights racing along the bevels + a soft fill
  const keyIce = new THREE.PointLight(0x8fd8ff, 0, 0, 2);
  const keyInfra = new THREE.PointLight(0xff4a24, 0, 0, 2);
  const keyBone = new THREE.PointLight(0xede6da, 0, 0, 2);
  scene.add(keyIce, keyInfra, keyBone);
  scene.add(new THREE.HemisphereLight(0x223040, 0x080402, 0.35));

  // the leader ring, made of light, behind the 7
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fd8ff).multiplyScalar(2.2), transparent: true, opacity: 0.0, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(520, 1.6, 8, 256), ringMat);
  ring.position.z = -260;
  scene.add(ring);

  // occlusion scene for god rays: bright backlight disc, then the 7 in black
  const occScene = new THREE.Scene();
  const lightPos = new THREE.Vector3(30, 40, -900);
  const discMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb37a).multiplyScalar(3), depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(105, 64), discMat);
  disc.position.copy(lightPos);
  occScene.add(disc);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(520, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uI: { value: 1 } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: "varying vec2 vP; uniform float uI; void main(){ float r = length(vP) / 520.; gl_FragColor = vec4(vec3(1., .45, .2) * exp(-r * r * 6.) * uI, 1.); }",
  }));
  halo.position.copy(lightPos).add(new THREE.Vector3(0, 0, 1));
  occScene.add(halo);
  const occBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const occ7 = new THREE.Mesh(geo7, occBlack);
  occBlack.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, dissolveU);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nuniform float uDissolve;\n" + GLSL_NOISE + `
        float dkey(vec3 p){ return .62 * inoise(p * ${NS.toFixed(8)}) + .38 * clamp(1. - length(p.xy) / ${MAXR}., 0., 1.); }`)
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (dkey(vObjPos) < uDissolve) discard;");
  };
  occScene.add(occ7);

  // ---------------------------------------------------------------- sparks (12k), positions are pure functions of t
  const N = 12000;
  const rnd = U.rng(7007);
  const b7 = GG.glyph("7").bbox, b6 = GG.glyph("6").bbox;
  const g7c = [(b7[0] + b7[2]) / 2, (b7[1] + b7[3]) / 2], g6c = [(b6[0] + b6[2]) / 2, (b6[1] + b6[3]) / 2];
  const unit = { s: 1, ox: 0, oy: 0 };
  const in7 = GG.sampleInterior("7", N, unit, 77);
  const in6 = GG.sampleInterior("6", N, unit, 66);
  // the 6's counter (implosion point + spiral centre), from its outline
  const six = (() => {
    const cs = [];
    let cur = null;
    for (const c of GG.glyph("6").cmds) {
      if (c[0] === "M") { cur = []; cs.push(cur); }
      for (let i = 1; i + 1 < c.length; i += 2) cur.push([c[i], c[i + 1]]);
    }
    const bb = cs.map((p) => ({ x0: Math.min(...p.map((q) => q[0])), x1: Math.max(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), y1: Math.max(...p.map((q) => q[1])) }));
    bb.sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
    const h = bb[1];
    return { x: (h.x0 + h.x1) / 2 - g6c[0], y: -(((h.y0 + h.y1) / 2) - g6c[1]) };
  })();
  const S0 = new Float32Array(N * 3), V0 = new Float32Array(N * 3), TGT = new Float32Array(N * 3), TS = new Float32Array(N);
  const SPA = new Float32Array(N * 4); // spiral: angle0, radius0, omega, z
  const ORD = new Float32Array(N);     // snap order along the 6's spiral (0 tail … 1 core)
  const COL = new Float32Array(N * 3), SIZE = new Float32Array(N), SEED = new Float32Array(N);
  const ice = U.lin("#8FD8FF"), infra = U.lin("#FF4A24"), ember = U.lin("#FFB37A"), bone = U.lin("#EDE6DA");
  for (let i = 0; i < N; i++) {
    const x = in7[i * 2] - g7c[0], y = -(in7[i * 2 + 1] - g7c[1]), z = (rnd() - 0.5) * (DEPTH + 30);
    S0[i * 3] = x; S0[i * 3 + 1] = y; S0[i * 3 + 2] = z;
    const key = dissolveKey(x, y, z);
    const u = U.clamp(key / 1.06);
    TS[i] = T_DIS + Math.sqrt(u) * (T_DIS1 - T_DIS);
    const ang = Math.atan2(y, x) + (rnd() - 0.5) * 1.2;
    const sp = 260 + rnd() * 780;
    V0[i * 3] = Math.cos(ang) * sp; V0[i * 3 + 1] = Math.sin(ang) * sp + 120; V0[i * 3 + 2] = (rnd() - 0.35) * 900;
    const tx = in6[i * 2] - g6c[0], ty = -(in6[i * 2 + 1] - g6c[1]);
    TGT[i * 3] = tx; TGT[i * 3 + 1] = ty; TGT[i * 3 + 2] = (rnd() - 0.5) * 70;
    // three logarithmic spiral arms, differential rotation (faster inside)
    const arm = i % 3;
    const r0 = 110 + Math.pow(rnd(), 0.62) * 860;
    const gauss = (rnd() + rnd() + rnd() - 1.5) * 0.8;
    SPA[i * 4] = arm * (Math.PI * 2 / 3) + 2.35 * Math.log(r0 / 110) + gauss * (0.18 + 0.25 * (1 - r0 / 970));
    SPA[i * 4 + 1] = r0;
    SPA[i * 4 + 2] = 2.1 * Math.pow(300 / r0, 0.55);
    SPA[i * 4 + 3] = (rnd() + rnd() - 1) * 90 * (1.2 - r0 / 970);
    // snap order: by angle around the counter, starting at the tail (top right of the 6)
    const a6 = Math.atan2(ty - six.y, tx - six.x);
    const tailTop = ty > six.y + 120 ? 1 : 0;
    ORD[i] = tailTop ? 0.35 * U.clamp((ty - six.y - 120) / 260) : 0.35 + 0.65 * ((a6 + Math.PI) / (Math.PI * 2));
    const pick = rnd();
    const c = pick < 0.58 ? ember : pick < 0.78 ? bone : pick < 0.9 ? ice : infra;
    const k = 0.75 + rnd() * 0.7;
    COL[i * 3] = c[0] * k; COL[i * 3 + 1] = c[1] * k; COL[i * 3 + 2] = c[2] * k;
    SIZE[i] = 2.2 + Math.pow(rnd(), 3) * 7;
    SEED[i] = rnd() * 100;
  }
  const pGeo = new THREE.BufferGeometry();
  const POS = new Float32Array(N * 3), ALPHA = new Float32Array(N);
  pGeo.setAttribute("position", new THREE.BufferAttribute(POS, 3));
  pGeo.setAttribute("alpha", new THREE.BufferAttribute(ALPHA, 1));
  pGeo.setAttribute("color", new THREE.BufferAttribute(COL, 3));
  pGeo.setAttribute("size", new THREE.BufferAttribute(SIZE, 1));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { uFocus: { value: 1900 }, uCoc: { value: 0.006 }, uGain: { value: 1 }, uPx: { value: 1080 / (2 * Math.tan((30 * Math.PI) / 360)) } },
    vertexShader: `
      attribute float alpha; attribute vec3 color; attribute float size;
      uniform float uFocus, uCoc, uPx; varying vec3 vC; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        float d = -mv.z;
        float s = size * uPx / max(d, 1.) * 0.55;
        float coc = abs(d - uFocus) * uCoc * uPx / max(d, 1.);
        float ps = s + coc;
        gl_PointSize = clamp(ps, 1., 90.);
        vA = alpha * (s * s) / (ps * ps) * min(1., ps / 1.5);
        vC = color;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA; uniform float uGain;
      void main(){ vec2 q = gl_PointCoord - .5; float r = length(q) * 2.; float a = smoothstep(1., .55, r) * vA; if (a < .002) discard; gl_FragColor = vec4(vC * a * uGain * 2.2, 0.); }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  // dust motes in the beams
  const DN = 700;
  const dGeo = new THREE.BufferGeometry();
  const DP = new Float32Array(DN * 3), DA = new Float32Array(DN), DC = new Float32Array(DN * 3), DS = new Float32Array(DN);
  const dr = U.rng(4242);
  const DBASE = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) {
    DBASE[i * 3] = (dr() - 0.5) * 2600; DBASE[i * 3 + 1] = (dr() - 0.5) * 1500; DBASE[i * 3 + 2] = -900 + dr() * 2300;
    const c = dr() < 0.7 ? ember : bone;
    DC[i * 3] = c[0] * 0.35; DC[i * 3 + 1] = c[1] * 0.35; DC[i * 3 + 2] = c[2] * 0.35;
    DS[i] = 1.6 + dr() * 3.5;
  }
  dGeo.setAttribute("position", new THREE.BufferAttribute(DP, 3));
  dGeo.setAttribute("alpha", new THREE.BufferAttribute(DA, 1));
  dGeo.setAttribute("color", new THREE.BufferAttribute(DC, 3));
  dGeo.setAttribute("size", new THREE.BufferAttribute(DS, 1));
  dGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const dust = new THREE.Points(dGeo, pMat.clone());
  dust.frustumCulled = false;
  scene.add(dust);

  // ---------------------------------------------------------------- god-ray + composite passes
  const matRays = E.material(`
    uniform sampler2D uOcc; uniform vec2 uLight; uniform float uDensity, uDecay, uWeight, uSeed;
    void main(){
      vec2 uv = vUv; vec2 dlt = (uv - uLight) * uDensity / 72.;
      float j = hash12(gl_FragCoord.xy + uSeed);
      uv -= dlt * j;
      vec3 acc = vec3(0.); float illum = 1.;
      for (int i = 0; i < 72; i++){ uv -= dlt; acc += texture(uOcc, uv).rgb * illum * uWeight; illum *= uDecay; }
      fragColor = vec4(acc, 1.);
    }`, { uOcc: { value: null }, uLight: { value: new THREE.Vector2(0.5, 0.5) }, uDensity: { value: 0.92 }, uDecay: { value: 0.962 }, uWeight: { value: 0.016 }, uSeed: { value: 0 } });
  const matOut = E.material(`
    uniform sampler2D uMain, uRays; uniform float uRayI, uBg; uniform vec2 uLight;
    void main(){
      vec4 m = texture(uMain, vUv);
      vec3 bg = C_VOID;
      vec2 q = vUv - uLight; q.x *= 1.777;
      bg += C_DEEP * 1.3 * exp(-dot(q, q) * 3.5) * uBg + C_INFRA * .03 * exp(-dot(q, q) * 16.) * uBg;
      vec3 col = bg * (1. - clamp(m.a, 0., 1.)) + m.rgb;   // mesh is opaque (a=1), sparks are additive (a=0)
      col += texture(uRays, vUv).rgb * uRayI;
      fragColor = vec4(col, 1.);
    }`, { uMain: { value: null }, uRays: { value: null }, uRayI: { value: 1 }, uBg: { value: 1 }, uLight: { value: new THREE.Vector2(0.5, 0.5) } });

  const cam = new THREE.PerspectiveCamera(30, W / H, 5, 20000);
  const tmpV = new THREE.Vector3();

  // ---------------------------------------------------------------- choreography
  function cameraAt(t) {
    // orbit the 7, push through the dissolve, frame the 6, push into the implosion point
    const a = U.mix(U.mix(36, -14, U.seg(t, T0, T_DIS, U.E.p2io)), 0, U.seg(t, T_DIS, 3.9, U.E.p2io)) + Math.sin(U.seg(t, 4.2, T_IMP) * Math.PI) * 7;
    const el = U.mix(U.mix(-9, 4, U.seg(t, T0, T_DIS, U.E.p2io)), 0, U.seg(t, T_DIS, 3.9));
    let dist = U.mix(1260, 2150, U.seg(t, T0, T_DIS, U.E.p3out));
    dist = U.mix(dist, 1650, U.seg(t, T_DIS, 3.95, U.E.p2io));
    dist = U.mix(dist, 2050, U.seg(t, 3.95, 4.9, U.E.p2io));
    dist = U.mix(dist, 1150, U.seg(t, T_IMP, T1, U.E.p3in));
    const target = new THREE.Vector3(0, 0, 0);
    target.x = U.mix(0, six.x, U.seg(t, 4.8, T1, U.E.p2io));
    target.y = U.mix(0, six.y, U.seg(t, 4.8, T1, U.E.p2io));
    const ar = (a * Math.PI) / 180, er = (el * Math.PI) / 180;
    cam.position.set(target.x + Math.sin(ar) * Math.cos(er) * dist, target.y + Math.sin(er) * dist, Math.cos(ar) * Math.cos(er) * dist);
    cam.up.set(Math.sin(U.seg(t, 3.75, 4.69, U.E.sineIo) * 0.12), 1, 0).normalize();
    cam.lookAt(target);
    cam.updateMatrixWorld();
    return dist;
  }

  function sparks(t) {
    const pS = U.seg(t, 3.55, 4.2, U.E.p2io);                    // join the spiral
    const tSp = t - 3.75;
    const pImp = U.seg(t, T_IMP, T1 - 0.05, U.E.p3in);
    const tw = U.seg(t, 4.9, T_IMP + 0.1);
    let visible = 0;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const ts = TS[i];
      if (t < ts) { ALPHA[i] = 0; POS[i3] = S0[i3]; POS[i3 + 1] = S0[i3 + 1]; POS[i3 + 2] = S0[i3 + 2]; continue; }
      const tau = t - ts;
      const k = 2.4, f = (1 - Math.exp(-k * tau)) / k;
      // burst + drift + a little curl
      let x = S0[i3] + V0[i3] * f, y = S0[i3 + 1] + V0[i3 + 1] * f - 60 * tau * tau, z = S0[i3 + 2] + V0[i3 + 2] * f;
      const sd = SEED[i];
      x += Math.sin(tau * 3.1 + sd) * 40 * Math.min(1, tau * 2);
      y += Math.cos(tau * 2.7 + sd * 1.3) * 40 * Math.min(1, tau * 2);
      // spiral galaxy around the 6's counter
      if (pS > 0) {
        const ang = SPA[i * 4] + SPA[i * 4 + 2] * Math.max(0, tSp + 0.4);
        const rr = SPA[i * 4 + 1] * (1 - 0.32 * U.seg(t, 3.75, 4.7, U.E.p2io));
        const sx = six.x + Math.cos(ang) * rr, sy = six.y + Math.sin(ang) * rr * 0.92, sz = SPA[i * 4 + 3] * (1 - 0.5 * pS);
        x = U.mix(x, sx, pS); y = U.mix(y, sy, pS); z = U.mix(z, sz, pS);
      }
      // snap into the 6 (staggered from the tail inward)
      const st = T_SIX - 0.06 + ORD[i] * 0.2;
      const e = U.E.backOut(U.seg(t, st, st + 0.24), 1.3);
      if (t > st) {
        const jx = Math.sin(t * 9 + sd) * 2.5 * tw, jy = Math.cos(t * 11 + sd) * 2.5 * tw;
        x = U.mix(x, TGT[i3] + jx, e); y = U.mix(y, TGT[i3 + 1] + jy, e); z = U.mix(z, TGT[i3 + 2], e);
      }
      // implode to the counter, twisting
      if (pImp > 0) {
        const dx = x - six.x, dy = y - six.y;
        const rot = pImp * pImp * 2.4;
        const c = Math.cos(rot), s = Math.sin(rot);
        const rx = dx * c - dy * s, ry = dx * s + dy * c;
        const sh = 1 - pImp;
        x = six.x + rx * sh; y = six.y + ry * sh; z = z * sh;
      }
      POS[i3] = x; POS[i3 + 1] = y; POS[i3 + 2] = z;
      // brightness: hot at spawn, cooler in flight, bright again when the 6 locks, twinkle, flare in the implosion
      const hot = Math.exp(-tau * 3.2);
      const lock = U.seg(t, st + 0.05, st + 0.2) * (1 - pImp * 0.2);
      const tws = 0.75 + 0.25 * Math.sin(t * 23 + sd * 7);
      ALPHA[i] = ((0.55 + 1.6 * hot) * (1 - 0.35 * pS) * (1 - lock) + lock * 1.25 * U.mix(1, tws, tw)) * (1 - 0.92 * pImp * pImp) + pImp * 0.35;
      visible++;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.alpha.needsUpdate = true;
    return visible;
  }

  function dustAt(t) {
    const show = U.seg(t, T0, 2.2) * (1 - U.seg(t, 3.6, 4.2));
    for (let i = 0; i < DN; i++) {
      const i3 = i * 3;
      DP[i3] = DBASE[i3] + Math.sin(t * 0.4 + i) * 30 + t * 18;
      DP[i3 + 1] = DBASE[i3 + 1] + Math.cos(t * 0.33 + i * 1.7) * 26 + t * 10;
      DP[i3 + 2] = DBASE[i3 + 2];
      DA[i] = show * (0.5 + 0.5 * Math.sin(t * 2 + i * 3.1));
    }
    dGeo.attributes.position.needsUpdate = true;
    dGeo.attributes.alpha.needsUpdate = true;
  }

  function render(t, target) {
    const dist = cameraAt(t);
    // the 7: assemble (its strokes are already there — the light reveals it), sweep highlights, then dissolve
    const dis = U.seg(t, T_DIS, T_DIS1, U.E.p2in) * 1.06;
    dissolveU.uDissolve.value = t < T_DIS ? -1 : dis;
    dissolveU.uHeat.value = 1;
    mesh7.visible = occ7.visible = dis < 1.05;
    mesh7.rotation.y = U.mix(0.0, -0.5, U.seg(t, T_DIS - 0.1, T_DIS1, U.E.p2in));
    mesh7.rotation.x = Math.sin(t * 1.3) * 0.03;
    occ7.rotation.copy(mesh7.rotation);
    // key-light sweeps on beats 2 and 3 of the bar (highlights race along the bevels)
    const s0 = U.seg(t, T0 + 0.02, 2.30, U.E.p2io), s1 = U.seg(t, 2.30, 2.75, U.E.p2io), s2 = U.seg(t, 2.78, 3.25, U.E.p2io);
    keyBone.position.set(U.mix(-900, 1000, s0), U.mix(-500, 600, s0), 520);
    keyBone.intensity = Math.sin(s0 * Math.PI) * 1.4e7;
    keyIce.position.set(U.mix(-1100, 1100, s1), U.mix(500, -200, s1), 700);
    keyIce.intensity = Math.sin(s1 * Math.PI) * 1.6e7;
    keyInfra.position.set(U.mix(1100, -1000, s2), U.mix(-400, 450, s2), 650);
    keyInfra.intensity = Math.sin(s2 * Math.PI) * 1.6e7;
    chrome.envMapIntensity = 1.1 + 0.4 * Math.sin(U.seg(t, T0, T_DIS) * Math.PI);
    ring.rotation.z = t * 0.2;
    ringMat.opacity = U.seg(t, 1.95, 2.3) * (1 - U.seg(t, 3.3, 3.7)) * 0.9;
    ring.scale.setScalar(1 + 0.02 * Math.sin(t * 3));
    // focus follows the subject
    pMat.uniforms.uFocus.value = dist;
    pMat.uniforms.uCoc.value = U.mix(0.004, 0.0085, U.seg(t, 3.7, 4.4)) * (1 - U.seg(t, T_IMP, T_IMP + 0.25));
    dust.material.uniforms.uFocus.value = dist;
    dust.material.uniforms.uCoc.value = 0.012;
    sparks(t);
    dustAt(t);
    points.visible = t >= T_DIS;

    // backlight: whiteout handoff at T0, settles, pulses on beat 3, fades as the 7 burns away
    const flare = Math.exp(-(t - T0) * 15) * 7;
    const lightI = (1.0 + flare + 1.2 * Math.exp(-Math.max(0, t - 2.8125) * 7) * (t > 2.8125 ? 1 : 0)) * (1 - U.seg(t, 3.4, 4.0) * 0.85) * (1 - U.seg(t, 4.1, 4.7));
    discMat.color.setRGB(1, 0.45, 0.19).multiplyScalar(2.3 * lightI);
    halo.material.uniforms.uI.value = 0.22 * lightI;

    // main pass (MSAA)
    renderer.setRenderTarget(rtMain);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, false);
    renderer.render(scene, cam);
    // occlusion pass → god rays
    renderer.setRenderTarget(rtOcc);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, true, false);
    renderer.render(occScene, cam);
    tmpV.copy(lightPos).project(cam);
    const lx = tmpV.x * 0.5 + 0.5, ly = tmpV.y * 0.5 + 0.5;
    matRays.uniforms.uOcc.value = rtOcc.texture;
    matRays.uniforms.uLight.value.set(lx, ly);
    matRays.uniforms.uSeed.value = Math.floor(t * 60);
    E.pass(matRays, rtRays);
    matOut.uniforms.uMain.value = rtMain.texture;
    matOut.uniforms.uRays.value = rtRays.texture;
    matOut.uniforms.uRayI.value = 1.35 + flare * 0.9;
    matOut.uniforms.uBg.value = lightI * 0.45;
    matOut.uniforms.uLight.value.set(lx, ly);
    E.pass(matOut, target);
    const push = U.seg(t, T_IMP, T1, U.E.p3in);
    return {
      exposure: 1 + Math.exp(-(t - T0) * 16) * 2.6,
      bloom: 0.5,
      bloomThreshold: 0.85,
      speed: push * 0.7 + U.seg(t, T_DIS, 3.9) * (1 - U.seg(t, 3.9, 4.2)) * 0.25,
      zoomBlur: push * 0.18,
      zoomCenter: [0.5, 0.5],
    };
  }

  return { id: "forge", render, six };
};
