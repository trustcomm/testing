// World "8 · Fluid": a stable-fluids simulation (semi-Lagrangian advection, vorticity confinement, Jacobi pressure
// projection) whose dye is held to the shape of an 8 by its signed-distance field. Two counter-rotating vortices sit in
// the 8's counters so their flows agree where the bowls meet: a figure-of-eight circulation.
// Seek-safe: the sim steps at a fixed 1/60 s; seeking backwards re-simulates from t = 0 (deterministic).
window.WorldFluid = function (E) {
  const { THREE } = E;
  const { U } = window;
  const SW = 320, SH = 180;          // velocity / pressure grid
  const DW = 960, DH = 540;          // dye grid
  const DT = 1 / 60;
  const PX = new THREE.Vector2(1920, 1080);

  // --- glyph geometry: the 8, its SDF and its two counters
  const GH = 780, GCX = 960, GCY = 540;
  const sdf = window.GL_GLYPH.glyphSDFTexture(THREE, "8", { cx: GCX, cy: GCY, height: GH, res: 0.25 });
  const counters = (() => {
    // split the outline into contours; the two smaller ones are the counters
    const g = window.GL_GLYPH.glyph("8");
    const cs = [];
    let cur = null;
    for (const c of g.cmds) {
      if (c[0] === "M") { cur = []; cs.push(cur); }
      for (let i = 1; i + 1 < c.length; i += 2) cur.push([c[i], c[i + 1]]);
    }
    const boxes = cs.map((pts) => {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    }).map((b) => Object.assign(b, { area: (b.x1 - b.x0) * (b.y1 - b.y0) }));
    boxes.sort((a, b) => b.area - a.area);
    const outer = boxes[0];
    const holes = boxes.slice(1, 3).sort((a, b) => a.y0 - b.y0); // top first (y-down)
    const pl = sdf.place;
    const toScr = (x, y) => [x * pl.s + pl.ox, y * pl.s + pl.oy];
    const strokeW = ((outer.x1 - outer.x0) - (holes[1].x1 - holes[1].x0)) / 2;
    return holes.map((h) => {
      const [cx, cy] = toScr((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2);
      return { cx, cy, rx: ((h.x1 - h.x0) / 2 + strokeW / 2) * pl.s, ry: ((h.y1 - h.y0) / 2 + strokeW / 2) * pl.s };
    });
  })();
  const cTop = counters[0], cBot = counters[1];

  // --- targets
  const dbl = (w, h, type) => {
    const o = { a: E.rt(w, h, { type }), b: E.rt(w, h, { type }) };
    o.read = o.a; o.write = o.b;
    o.swap = () => { const t = o.read; o.read = o.write; o.write = t; };
    return o;
  };
  const vel = dbl(SW, SH, THREE.FloatType);
  const prs = dbl(SW, SH, THREE.FloatType);
  const dye = dbl(DW, DH, THREE.HalfFloatType);
  const curlRT = E.rt(SW, SH, { type: THREE.FloatType });
  const divRT = E.rt(SW, SH, { type: THREE.FloatType });
  const texel = new THREE.Vector2(1 / SW, 1 / SH);

  // screen-space helpers inside shaders: uv (0..1, y up) ↔ px (y down)
  const COMMON = `
    uniform vec2 uPx;
    vec2 uvToPx(vec2 uv){ return vec2(uv.x * uPx.x, (1. - uv.y) * uPx.y); }
    vec2 pxToUv(vec2 p){ return vec2(p.x / uPx.x, 1. - p.y / uPx.y); }
  `;

  // forces: relaxation toward a figure-of-eight target field + impact burst + turbulence + end-of-bar suction
  const matForce = E.material(COMMON + `
    uniform sampler2D uVel; uniform float uT, uStrength, uBurst, uSpin, uSuck, uTurb;
    uniform vec4 uTop, uBot; // cx, cy, rx, ry (px, y-down)
    vec2 vortex(vec2 p, vec4 c, float spin){
      vec2 r = (p - c.xy) / vec2(c.z, c.w);            // normalized to the bowl's centerline ellipse
      float rl = length(r);
      float prof = rl * exp(1. - rl * rl);              // peaks (=1) on the centerline
      vec2 tang = vec2(-r.y, r.x) / max(rl, 1e-3);       // CCW in y-down px coords → visually CW
      return tang * prof * spin;
    }
    void main(){
      vec2 v = texture(uVel, vUv).xy;
      vec2 p = uvToPx(vUv);
      // y-down px: tangent (-r.y, r.x) is clockwise on screen; top bowl CW, bottom bowl CCW
      vec2 target = (vortex(p, uTop, 1.) + vortex(p, uBot, -1.)) * 520. * uSpin;
      vec2 force = (target - v) * uStrength;
      // impact burst from centre
      vec2 d = p - vec2(960., 540.);
      float rr = length(d);
      force += normalize(d + 1e-3) * exp(-rr * rr / (180. * 180.)) * uBurst;
      // turbulence: curl of fbm
      vec2 q = p / 260.;
      float e = .05;
      float n1 = fbm(q + vec2(0., e) + uT * .35), n2 = fbm(q - vec2(0., e) + uT * .35);
      float n3 = fbm(q + vec2(e, 0.) + uT * .35), n4 = fbm(q - vec2(e, 0.) + uT * .35);
      force += vec2(n1 - n2, -(n3 - n4)) / (2. * e) * uTurb;
      // suction into the lower counter
      vec2 ds = vec2(uBot.x, uBot.y) - p;
      float dl = length(ds);
      force += ds / max(dl, 1.) * uSuck * smoothstep(900., 60., dl) * 1.0;
      v += force * ${DT.toFixed(6)};
      // y-down px velocity; store as is
      fragColor = vec4(v, 0., 1.);
    }`, {
    uVel: { value: null }, uPx: { value: PX }, uT: { value: 0 }, uStrength: { value: 0 }, uBurst: { value: 0 },
    uSpin: { value: 0 }, uSuck: { value: 0 }, uTurb: { value: 0 },
    uTop: { value: new THREE.Vector4(cTop.cx, cTop.cy, cTop.rx, cTop.ry) },
    uBot: { value: new THREE.Vector4(cBot.cx, cBot.cy, cBot.rx, cBot.ry) },
  });

  const matCurl = E.material(`
    uniform sampler2D uVel; uniform vec2 uTexel;
    void main(){
      float L = texture(uVel, vUv - vec2(uTexel.x, 0.)).y, R = texture(uVel, vUv + vec2(uTexel.x, 0.)).y;
      float T = texture(uVel, vUv + vec2(0., uTexel.y)).x, B = texture(uVel, vUv - vec2(0., uTexel.y)).x;
      // y-down velocity, uv y-up: dvy/dx - dvx/dy(screen) where screen y = -uv y
      fragColor = vec4((R - L) + (T - B), 0., 0., 1.);
    }`, { uVel: { value: null }, uTexel: { value: texel } });

  const matVort = E.material(`
    uniform sampler2D uVel, uCurl; uniform vec2 uTexel; uniform float uEps;
    void main(){
      float L = texture(uCurl, vUv - vec2(uTexel.x, 0.)).x, R = texture(uCurl, vUv + vec2(uTexel.x, 0.)).x;
      float T = texture(uCurl, vUv + vec2(0., uTexel.y)).x, B = texture(uCurl, vUv - vec2(0., uTexel.y)).x;
      float C = texture(uCurl, vUv).x;
      vec2 f = vec2(abs(T) - abs(B), abs(R) - abs(L));
      f /= length(f) + 1e-4;
      f *= -uEps * C;   // C is screen-space (y-down) curl; the minus keeps confinement amplifying vortices
      vec2 v = texture(uVel, vUv).xy + vec2(f.x, f.y) * ${DT.toFixed(6)};
      fragColor = vec4(v, 0., 1.);
    }`, { uVel: { value: null }, uCurl: { value: null }, uTexel: { value: texel }, uEps: { value: 30 } });

  const matDiv = E.material(`
    uniform sampler2D uVel; uniform vec2 uTexel;
    void main(){
      float L = texture(uVel, vUv - vec2(uTexel.x, 0.)).x, R = texture(uVel, vUv + vec2(uTexel.x, 0.)).x;
      float T = texture(uVel, vUv + vec2(0., uTexel.y)).y, B = texture(uVel, vUv - vec2(0., uTexel.y)).y;
      // screen y-down: dvy/dy_screen = (B - T) in uv terms
      fragColor = vec4(.5 * ((R - L) + (B - T)), 0., 0., 1.);
    }`, { uVel: { value: null }, uTexel: { value: texel } });

  const matPrs = E.material(`
    uniform sampler2D uPrs, uDiv; uniform vec2 uTexel;
    void main(){
      float L = texture(uPrs, vUv - vec2(uTexel.x, 0.)).x, R = texture(uPrs, vUv + vec2(uTexel.x, 0.)).x;
      float T = texture(uPrs, vUv + vec2(0., uTexel.y)).x, B = texture(uPrs, vUv - vec2(0., uTexel.y)).x;
      float d = texture(uDiv, vUv).x;
      fragColor = vec4((L + R + B + T - d) * .25, 0., 0., 1.);
    }`, { uPrs: { value: null }, uDiv: { value: null }, uTexel: { value: texel } });

  const matGrad = E.material(`
    uniform sampler2D uPrs, uVel; uniform vec2 uTexel;
    void main(){
      float L = texture(uPrs, vUv - vec2(uTexel.x, 0.)).x, R = texture(uPrs, vUv + vec2(uTexel.x, 0.)).x;
      float T = texture(uPrs, vUv + vec2(0., uTexel.y)).x, B = texture(uPrs, vUv - vec2(0., uTexel.y)).x;
      vec2 v = texture(uVel, vUv).xy - .5 * vec2(R - L, B - T);
      fragColor = vec4(v, 0., 1.);
    }`, { uPrs: { value: null }, uVel: { value: null }, uTexel: { value: texel } });

  const matScale = E.material(`
    uniform sampler2D uSrc; uniform float uK;
    void main(){ fragColor = vec4(texture(uSrc, vUv).xyz * uK, 1.); }`, { uSrc: { value: null }, uK: { value: 0.8 } });

  // advection: velocity is in px/s (y-down) → uv displacement = (vx/W, -vy/H) * dt
  const matAdvVel = E.material(COMMON + `
    uniform sampler2D uVel; uniform float uDiss;
    void main(){
      vec2 v = texture(uVel, vUv).xy;
      vec2 back = vUv - vec2(v.x / uPx.x, -v.y / uPx.y) * ${DT.toFixed(6)};
      fragColor = vec4(texture(uVel, back).xy * uDiss, 0., 1.);
    }`, { uVel: { value: null }, uPx: { value: PX }, uDiss: { value: 0.998 } });

  const matAdvDye = E.material(COMMON + `
    uniform sampler2D uVel, uDye, uSDF; uniform float uT, uAttract, uKeepIn, uKeepOut, uPulse, uRing, uRingR, uFlow;
    uniform vec4 uTop, uBot;
    uniform vec3 uEm[8]; // emitter px.x, px.y, strength
    uniform vec4 uDisp;  // dye-only displacement: centre px (xy), radial px/s (z, + = outward), swirl px/s (w)
    uniform float uDispFall;
    void main(){
      vec2 v = texture(uVel, vUv).xy;
      vec2 p = uvToPx(vUv);
      // the projection removes divergent flow, so splash + suction move the dye directly
      vec2 rel = p - uDisp.xy; float rl = max(length(rel), 1.);
      vec2 rd = rel / rl;
      float prof = exp(-rl / uDispFall) * smoothstep(0., 40., rl);
      v += (rd * uDisp.z + vec2(-rd.y, rd.x) * uDisp.w) * prof;
      vec2 back = vUv - vec2(v.x / uPx.x, -v.y / uPx.y) * ${DT.toFixed(6)};
      vec4 d = texture(uDye, back);
      float sd = texture(uSDF, vUv).x;                 // screen px, negative inside the 8
      float inside = smoothstep(14., -18., sd);
      // keep dye inside the glyph; outside it thins fast (wispy edges)
      float keep = mix(uKeepOut, uKeepIn, inside);
      d.rgb *= keep;
      d.b *= .965;                                      // heat cools
      // emitters riding the figure of eight
      for (int i = 0; i < 8; i++){
        vec2 e = uEm[i].xy - p;
        float g = exp(-dot(e, e) / (19. * 19.)) * uEm[i].z * uFlow;
        if (i == 1 || i == 5) { d.g += g * .22; }
        else { d.r += g * .16; d.b += g * .30; }
      }
      // ice counter-flow inside the counters
      vec2 qt = (p - uTop.xy) / uTop.zw, qb = (p - uBot.xy) / uBot.zw;
      float ring = exp(-pow((length(qt) - .45) / .18, 2.)) + exp(-pow((length(qb) - .45) / .18, 2.));
      float sw = .5 + .5 * sin(atan(qt.y, qt.x) * 3. - uT * 7.) * sin(atan(qb.y, qb.x) * 3. + uT * 7.);
      d.g += ring * sw * .006 * uFlow;
      // shape attractor: the 8 condenses out of the turbulence
      float tgt = inside * .30 * (.35 + .65 * fbm(p / 70. + vec2(uT * .6, -uT * .4)));
      d.r += (tgt - d.r) * uAttract * ${DT.toFixed(6)};
      // impact ring (ice + infra) seeds the leader ring
      float rr = length(p - vec2(960., 540.));
      float rg = exp(-pow((rr - uRingR) / 13., 2.)) * uRing;
      d.g += rg * .55; d.r += rg * .3; d.b += rg * .2;
      // beat pulse: fresh heat along the stroke
      d.b += uPulse * inside * .012;
      d = clamp(d, 0., 2.);
      fragColor = d;
    }`, {
    uVel: { value: null }, uDye: { value: null }, uSDF: { value: sdf.tex }, uPx: { value: PX }, uT: { value: 0 },
    uAttract: { value: 0 }, uKeepIn: { value: 0.995 }, uKeepOut: { value: 0.93 }, uPulse: { value: 0 }, uRing: { value: 0 },
    uRingR: { value: 0 }, uFlow: { value: 1 },
    uTop: { value: new THREE.Vector4(cTop.cx, cTop.cy, cTop.rx, cTop.ry) },
    uBot: { value: new THREE.Vector4(cBot.cx, cBot.cy, cBot.rx, cBot.ry) },
    uEm: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) },
    uDisp: { value: new THREE.Vector4() }, uDispFall: { value: 600 },
  });

  // render: dye → HDR radiance, with liquid sheen, leader ring and crosshair
  const matShow = E.material(COMMON + `
    uniform sampler2D uDye, uSDF; uniform float uT, uZoom, uRingR, uRingA, uMarks, uCore, uExposure;
    uniform vec2 uFocus; // px, zoom centre
    uniform vec4 uBot;
    vec4 dyeAt(vec2 uv){ return texture(uDye, uv); }
    void main(){
      vec2 p = uvToPx(vUv);
      // camera: zoom about uFocus (px)
      vec2 sp = uFocus + (p - uFocus) / uZoom;
      vec2 uv = pxToUv(sp);
      vec4 d = dyeAt(uv);
      vec2 tx = vec2(1. / ${DW}., 1. / ${DH}.);
      float gx = dyeAt(uv + vec2(tx.x, 0.)).r - dyeAt(uv - vec2(tx.x, 0.)).r;
      float gy = dyeAt(uv + vec2(0., tx.y)).r - dyeAt(uv - vec2(0., tx.y)).r;
      vec3 n = normalize(vec3(-gx * 6., -gy * 6., 1.));
      float dens = d.r;
      vec3 col = C_VOID;
      // radial glow behind the 8
      vec2 q = (sp - vec2(960., 540.)) / 1080.;
      col += C_DEEP * .25 * exp(-dot(q, q) * 6.);
      // infra ink ramp: deep → infra → ember → bone
      vec3 ink = C_DEEP * 2.2 * smoothstep(0., .12, dens);
      ink += C_INFRA * smoothstep(.06, .75, dens) * .95;
      ink += C_EMBER * smoothstep(.45, 1.2, dens) * .35;
      ink += C_EMBER * smoothstep(.22, 1.1, d.b) * 1.5;
      ink += C_BONE * smoothstep(.85, 1.7, d.b) * 1.6;
      col += ink;
      // ice counter-flow
      col += C_ICE * smoothstep(.015, .55, d.g) * 1.15;
      // liquid sheen from the density gradient
      vec3 L = normalize(vec3(-.45, .55, .7));
      float spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 28.);
      col += C_BONE * spec * smoothstep(.08, .5, dens) * .55;
      // vortex core flare (end of bar)
      float dc = length(sp - uBot.xy);
      col += mix(C_EMBER, C_BONE, .6) * uCore * (exp(-dc * dc / (34. * 34.)) * 7. + exp(-dc * dc / (170. * 170.)) * .9);
      // leader ring + crosshair (made of light)
      float rr = length(sp - vec2(960., 540.));
      float ring = exp(-pow((rr - uRingR) / 2.2, 2.)) * uRingA;
      float rest = exp(-pow((rr - 470.) / 1.4, 2.)) * .05 * uMarks;
      vec2 a = abs(sp - vec2(960., 540.));
      float cross = (exp(-a.x * a.x / 1.2) + exp(-a.y * a.y / 1.2)) * .028 * uMarks * smoothstep(1100., 120., length(sp - vec2(960., 540.)));
      col += C_ICE * (ring * 3. + rest + cross);
      fragColor = vec4(col * uExposure, 1.);
    }`, {
    uDye: { value: null }, uSDF: { value: sdf.tex }, uPx: { value: PX }, uT: { value: 0 }, uZoom: { value: 1 },
    uRingR: { value: 0 }, uRingA: { value: 0 }, uMarks: { value: 0 }, uCore: { value: 0 }, uExposure: { value: 1 },
    uFocus: { value: new THREE.Vector2(960, 540) },
    uBot: { value: new THREE.Vector4(cBot.cx, cBot.cy, cBot.rx, cBot.ry) },
  });

  // figure-of-eight emitter path: top bowl clockwise, bottom bowl anticlockwise, crossing at the waist
  function eightPoint(s) {
    // s ∈ [0,1): first half traces the top ellipse, second half the bottom one, both starting at the waist
    const u = ((s % 1) + 1) % 1;
    if (u < 0.5) {
      const a = Math.PI / 2 + (u / 0.5) * Math.PI * 2;   // start at bottom of top bowl (y-down: +π/2 is down)
      return [cTop.cx + Math.cos(a) * cTop.rx, cTop.cy + Math.sin(a) * cTop.ry];
    }
    const a = -Math.PI / 2 - ((u - 0.5) / 0.5) * Math.PI * 2; // start at top of bottom bowl, go the other way
    return [cBot.cx + Math.cos(a) * cBot.rx, cBot.cy + Math.sin(a) * cBot.ry];
  }

  let simStep = -1;
  function reset() {
    for (const t of [vel.a, vel.b, prs.a, prs.b, dye.a, dye.b, curlRT, divRT]) E.clearTarget(t, 0, 0, 0, 0);
    simStep = 0;
  }

  // per-step schedule (pure function of the step's time)
  function params(t) {
    const beat = window.CUES.beat;
    const pulse = [beat, 2 * beat, 3 * beat].reduce((s, b) => s + (t >= b ? Math.exp(-(t - b) * 9) : 0), 0);
    return {
      strength: U.mix(0.6, 5.5, U.seg(t, 0.05, 0.5, U.E.p2out)) + U.seg(t, 1.40625, 1.85, U.E.p2in) * 6,
      spin: U.mix(0.25, 1.0, U.seg(t, 0.02, 0.45, U.E.p2out)) * (1 + U.seg(t, 1.40625, 1.85, U.E.p3in) * 2.8) * (1 + 0.25 * pulse),
      burst: t < 0.14 ? 26000 * (1 - t / 0.14) : 0,
      turb: U.mix(900, 260, U.seg(t, 0, 0.7)),
      suck: U.seg(t, 1.5, 1.86, U.E.p2in) * 5200,
      attract: U.seg(t, 0.15, 0.6, U.E.p2io) * 3.2 * (1 - U.seg(t, 1.5, 1.8)),
      keepOut: U.mix(U.mix(0.985, 0.88, U.seg(t, 0.15, 0.55)), 0.996, U.seg(t, 1.36, 1.5)),
      pulse,
      ring: t < 0.017 ? 1.6 : 0,
      ringR: 46,
      flow: 1 + 1.6 * pulse - U.seg(t, 1.55, 1.85) * 0.8,
      disp: t < 0.6
        ? [960, 540, 1500 * Math.exp(-t * 7), 0, 520]
        : [cBot.cx, cBot.cy, -1900 * U.seg(t, 1.42, 1.8, U.E.p2in), 2400 * U.seg(t, 1.38, 1.8, U.E.p2in), 520],
    };
  }

  function step() {
    const t = simStep * DT;
    const P = params(t);
    const R = E.renderer;
    // forces
    matForce.uniforms.uVel.value = vel.read.texture;
    matForce.uniforms.uT.value = t;
    matForce.uniforms.uStrength.value = P.strength;
    matForce.uniforms.uBurst.value = P.burst;
    matForce.uniforms.uSpin.value = P.spin;
    matForce.uniforms.uSuck.value = P.suck;
    matForce.uniforms.uTurb.value = P.turb;
    E.pass(matForce, vel.write); vel.swap();
    // vorticity confinement
    matCurl.uniforms.uVel.value = vel.read.texture;
    E.pass(matCurl, curlRT);
    matVort.uniforms.uVel.value = vel.read.texture;
    matVort.uniforms.uCurl.value = curlRT.texture;
    E.pass(matVort, vel.write); vel.swap();
    // projection
    matDiv.uniforms.uVel.value = vel.read.texture;
    E.pass(matDiv, divRT);
    matScale.uniforms.uSrc.value = prs.read.texture;
    matScale.uniforms.uK.value = 0.8;
    E.pass(matScale, prs.write); prs.swap();
    matPrs.uniforms.uDiv.value = divRT.texture;
    for (let i = 0; i < 22; i++) {
      matPrs.uniforms.uPrs.value = prs.read.texture;
      E.pass(matPrs, prs.write); prs.swap();
    }
    matGrad.uniforms.uPrs.value = prs.read.texture;
    matGrad.uniforms.uVel.value = vel.read.texture;
    E.pass(matGrad, vel.write); vel.swap();
    // advect velocity
    matAdvVel.uniforms.uVel.value = vel.read.texture;
    E.pass(matAdvVel, vel.write); vel.swap();
    // dye
    const em = matAdvDye.uniforms.uEm.value;
    const speed = 0.62; // loops per second
    for (let i = 0; i < 8; i++) {
      const s = i / 8 + t * speed;
      const [x, y] = eightPoint(s);
      const st = U.seg(t, 0.04, 0.3) * (0.7 + 0.3 * Math.sin(i * 2.1 + t * 5));
      em[i].set(x, y, st);
    }
    const a = matAdvDye.uniforms;
    a.uVel.value = vel.read.texture;
    a.uDye.value = dye.read.texture;
    a.uT.value = t;
    a.uAttract.value = P.attract;
    a.uKeepOut.value = P.keepOut;
    a.uPulse.value = P.pulse;
    a.uRing.value = P.ring;
    a.uRingR.value = P.ringR;
    a.uFlow.value = P.flow;
    a.uDisp.value.set(P.disp[0], P.disp[1], P.disp[2], P.disp[3]);
    a.uDispFall.value = P.disp[4];
    E.pass(matAdvDye, dye.write); dye.swap();
    simStep++;
  }

  function simulateTo(t) {
    const target = Math.max(0, Math.round(t / DT));
    if (simStep < 0 || target < simStep) reset();
    while (simStep < target) step();
  }

  // camera + look for time t (local == global here, the world starts at 0)
  function look(t) {
    const push = U.mix(1.0, 1.045, U.seg(t, 0, 1.6, U.E.sineIo));
    const dive = U.seg(t, 1.64, 1.875, U.E.expoIn);
    return {
      zoom: push * U.mix(1, 7.5, dive),
      focus: [U.mix(960, cBot.cx, U.seg(t, 1.5, 1.8, U.E.p2io)), U.mix(540, cBot.cy, U.seg(t, 1.5, 1.8, U.E.p2io))],
      core: U.seg(t, 1.6, 1.875, U.E.p2in) * 3.0,
      exposure: 1 + U.seg(t, 1.76, 1.875, U.E.p3in) * 3.8,
      ringR: 470 * U.E.expoOut(U.clamp(t / 0.42)),
      ringA: t < 0.6 ? Math.exp(-t * 4.5) : 0,
      marks: U.seg(t, 0.1, 0.5) * (1 - U.seg(t, 1.5, 1.7)),
      zoomBlur: dive * 0.55,
    };
  }

  function render(t, target) {
    simulateTo(t);
    const L = look(t);
    const u = matShow.uniforms;
    u.uDye.value = dye.read.texture;
    u.uT.value = t;
    u.uZoom.value = L.zoom;
    u.uFocus.value.set(L.focus[0], L.focus[1]);
    u.uRingR.value = L.ringR;
    u.uRingA.value = L.ringA;
    u.uMarks.value = L.marks;
    u.uCore.value = L.core;
    u.uExposure.value = L.exposure;
    E.pass(matShow, target);
    return { zoomBlur: L.zoomBlur, zoomCenter: [L.focus[0] / 1920, 1 - L.focus[1] / 1080], speed: U.seg(t, 1.64, 1.875, U.E.expoIn) };
  }

  return { id: "fluid", render, simulateTo, counters, sdf };
};
