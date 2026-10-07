// Claude — Motion Reel. One take, 900 frames; every element's pose is a pure function of t.
// The GSAP timeline is the clock (one linear proxy tween calls renderAt); the hf-seek event drives the same renderAt,
// so the WebGL and canvas layers render the exact seeked frame. Timing comes from window.CUES (src/cues.json).
(function () {
  "use strict";
  const { clamp, sat, lerp, seg, smooth, TAU, rng, hash, ease, springEase, springAt, mixHex, rgba, frameOf } = window.L;
  const CUES = window.CUES, V = CUES.visual, WAVE = window.WAVE;
  const P = {
    paper: "#F2EDE3", paper2: "#E7DFD1", ink: "#1B1714", ink2: "#27211C", clay: "#D2643A",
    clayLight: "#EFA27F", clayDeep: "#9C4122", mutedInk: "#5E554C", mutedPaper: "#B7AC9F",
  };
  const F = 1 / 60;
  const e = (n, u) => ease(n)(u);
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const el = (tag, cls, parent, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const setS = (n, o) => {
    for (const k in o) k.startsWith("--") ? n.style.setProperty(k, o[k]) : (n.style[k] = o[k]);
    return n;
  };
  const show = (n, on) => {
    const d = on ? "block" : "none";
    if (n.style.display !== d) n.style.display = d;
  };
  const attr = (n, o) => {
    for (const k in o) n.setAttribute(k, o[k]);
  };
  const r2 = (x) => Math.round(x * 100) / 100;

  const CH = CUES.chapters;
  const chap = (id) => CH.find((c) => c.id === id);
  const T = {
    c1: chap("c1").start, c2: chap("c2").start, c3: chap("c3").start, c4: chap("c4").start,
    c5: chap("c5").start, c6: chap("c6").start, c7: chap("c7").start, end: CUES.duration,
  };
  const SP085 = springEase({ response: 0.42, dampingFraction: 0.85 });
  const SP055 = springEase({ response: 0.34, dampingFraction: 0.55 });
  const SP060 = springEase({ response: 0.3, dampingFraction: 0.6 });
  function pulseEnv(tau) {
    if (tau < 0) return 0;
    if (tau < 0.08) return e("power2.out", tau / 0.08);
    if (tau < 0.38) return 1 - e("power2.inOut", (tau - 0.08) / 0.3);
    return 0;
  }
  // A contact lands on one exact frame: weight 1 on the contact frame, 0.45 on the next, 0 otherwise.
  function contactW(t, c) {
    const k = frameOf(t) - Math.round(c * 60);
    if (k > -1e-3 && k < 1 - 1e-3) return 1;
    if (k >= 1 - 1e-3 && k < 2 - 1e-3) return 0.45;
    return 0;
  }

  // ================================================================== 00–01 · the ball
  const FLOOR = V.c0.floorY, R = V.c0.r, B0 = V.c0.ball, ZE = V.c0.zoomEnd;
  const C1 = V.c1.contacts, XS = V.c1.xs, APEX = V.c1.apex, LAUNCH = V.c1.launch, LAND = V.c1.land, RBIG = V.c1.rBig;
  const HOLD = 2 * F;
  const BZ = [[XS[3], FLOOR - R], [1300, -45], LAND];

  // Centre path (unsquashed), velocity and radius: the physics that the ball and all of its working draw from.
  function ballPath(t) {
    if (t < ZE) {
      const u = seg(t, 0, ZE);
      return { x: B0[0], y: lerp(B0[1] + 4, B0[1] - 12, e("sine.inOut", u)), vx: 0, vy: (-8 * Math.PI * Math.sin(Math.PI * u)) / ZE, r: R };
    }
    if (t < C1[0]) {
      const top = B0[1] - 12, d = FLOOR - R - top, u = (t - ZE) / (C1[0] - ZE);
      return { x: B0[0], y: top + d * u * u, vx: 0, vy: (2 * d * u) / (C1[0] - ZE), r: R };
    }
    for (let i = 0; i < 3; i++) {
      if (t < C1[i + 1]) {
        const t0 = C1[i] + HOLD, t1 = C1[i + 1];
        if (t < t0) return { x: XS[i], y: FLOOR - R, vx: 0, vy: 0, r: R };
        const D = t1 - t0, u = (t - t0) / D;
        return { x: lerp(XS[i], XS[i + 1], u), y: FLOOR - R - 4 * APEX * u * (1 - u), vx: (XS[i + 1] - XS[i]) / D, vy: (-4 * APEX * (1 - 2 * u)) / D, r: R };
      }
    }
    const t0 = LAUNCH + HOLD;
    if (t < t0) return { x: XS[3], y: FLOOR - R, vx: 0, vy: 0, r: R };
    const D = T.c2 - t0, u = Math.min(1, (t - t0) / D);
    const [p0, p1, p2] = BZ;
    const q = (a, b, c) => (1 - u) * (1 - u) * a + 2 * u * (1 - u) * b + u * u * c;
    const dq = (a, b, c) => (2 * (1 - u) * (b - a) + 2 * u * (c - b)) / D;
    return { x: q(p0[0], p1[0], p2[0]), y: q(p0[1], p1[1], p2[1]), vx: dq(p0[0], p1[0], p2[0]), vy: dq(p0[1], p1[1], p2[1]), r: 1 / ((1 - u) / R + u / RBIG) };
  }
  // Pose: squash on contact frames, otherwise a volume-preserving stretch rotated onto the velocity.
  function ballPose(t) {
    for (let i = 0; i < C1.length; i++) {
      const w = contactW(t, C1[i]);
      if (w) {
        const sy = 1 - 0.34 * w, sx = 1 + 0.42 * w;
        return { x: XS[i], y: FLOOR - R * sy, r: R, sx, sy, rot: 0, sp: 2300 };
      }
    }
    const p = ballPath(t);
    const sp = Math.hypot(p.vx, p.vy);
    const s = 1 + 0.27 * smooth(300, 2200, sp);
    return { x: p.x, y: p.y, r: p.r, sx: s, sy: 1 / Math.sqrt(s), rot: sp > 1 ? (Math.atan2(p.vy, p.vx) * 180) / Math.PI : 0, sp };
  }
  const poseT = (p) => `translate(${r2(p.x)} ${r2(p.y)}) rotate(${r2(p.rot)}) scale(${r2(p.sx * 1000) / 1000} ${r2(p.sy * 1000) / 1000})`;

  // ================================================================== 02 · liquid (SDF metaballs, rendered in gl.js)
  function gooState(t) {
    const c = V.c2, cx = LAND[0], cy = LAND[1];
    const uj = seg(t, c.land, c.land + 0.5);
    const wob = uj < 1 ? 1 - e("elastic.out(1, 0.3)", uj) : 0;
    const us = e("expo.out", seg(t, c.split, c.split + 0.4));
    const um = e("power3.in", seg(t, c.merge, c.stretch));
    const pul = 1 + 0.18 * pulseEnv(t - c.pulse);
    const coreR = lerp(lerp(RBIG, 150, us), 222, um) * pul;
    const orbit = (140 * e("sine.inOut", seg(t, c.split, c.merge)) * Math.PI) / 180;
    const breathe = t > c.split ? 0.06 * Math.sin((TAU * (t - c.split)) / 1.0) : 0;
    const rho = 320 * us * (1 + breathe) * (1 - um);
    const kr = t >= c.split && t < c.stretch ? 95 * us * (1 - 0.3 * um) * pul : 0;
    const kids = [0, 1, 2].map((i) => {
      const a = -Math.PI / 2 + (i * TAU) / 3 + orbit;
      return { x: cx + rho * Math.cos(a), y: cy + rho * Math.sin(a), r: kr };
    });
    let box = null;
    if (t >= c.stretch) {
      const ub = e("expo.out", seg(t, c.stretch, T.c3));
      const [bx, by, bw, bh] = c.bar;
      box = { cx: lerp(cx, bx + bw / 2, ub), cy: lerp(cy, by, ub), hx: lerp(222, bw / 2, ub), hy: lerp(222, bh / 2, ub) };
    }
    const rings = [];
    [c.land, c.split, c.pulse].forEach((rt) => {
      const tau = t - rt;
      if (tau >= 0 && tau < 0.7) {
        const u = tau / 0.7;
        rings.push({ radius: 200 + 600 * e("expo.out", u), width: 3 - 1.5 * u, alpha: 0.5 * (1 - u) * (1 - u) });
      }
    });
    const tm = t - c.merge;
    if (tm >= 0 && tm < c.stretch - c.merge) {
      const u = tm / (c.stretch - c.merge);
      rings.push({ radius: lerp(780, 230, e("power3.in", u)), width: 2.5, alpha: 0.42 * Math.sin(Math.PI * u) });
    }
    return { core: { x: cx, y: cy, r: coreR, sx: 1 + 0.18 * wob, sy: 1 - 0.18 * wob }, kids, box, rings, center: [cx, cy] };
  }

  // ================================================================== 03 · kinetic type
  const C3 = { X0: 150, BASE: 752, MASK: 757, SIZE: 320 };
  const WORDS = [
    { text: "Timing.", t0: 5.0, A: { wght: 560, soft: 0, wonk: 0 } },
    { text: "Spacing.", t0: 5.5, A: { wght: 560, soft: 0, wonk: 0 } },
    { text: "Weight.", t0: 6.0, A: { wght: 100, soft: 0, wonk: 0 }, B: { wght: 900, soft: 0, wonk: 0 } },
    { text: "Feel.", t0: 6.5, A: { wght: 560, soft: 0, wonk: 0 }, B: { wght: 560, soft: 100, wonk: 1 } },
  ];
  // The full stop is the dot. Fraunces' period (opsz 144): ink diameter and centre height in em, by weight.
  function periodGeom(w) {
    const pts = [[100, 0.048, 0.023], [560, 0.14, 0.0625], [900, 0.206, 0.094]];
    const i = w <= 560 ? 0 : 1;
    const u = sat((w - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
    return { d: lerp(pts[i][1], pts[i + 1][1], u), cy: lerp(pts[i][2], pts[i + 1][2], u) };
  }

  // ================================================================== 05–06 · particles → chart
  const COLX = [300, 690, 1080, 1470], BASEY = 780, PITCH = 10, DOTR = 3.5;
  const COUNTS = V.c6.counts, NCOL = [900, 30, 7];
  const DOT6 = { x: COLX[3] + 20, y: BASEY - 20, r: 20 };
  const chartDots = [];
  for (let j = 0; j < 900; j++) chartDots.push({ x: COLX[0] + 5 + PITCH * (j % 30), y: BASEY - 5 - PITCH * Math.floor(j / 30), col: 0, j });
  for (let j = 0; j < 30; j++) chartDots.push({ x: COLX[1] + 5 + PITCH * j, y: BASEY - 5, col: 1, j });
  for (let j = 0; j < 7; j++) chartDots.push({ x: COLX[2] + 5 + PITCH * j, y: BASEY - 5, col: 2, j });
  chartDots.forEach((d) => {
    const N = NCOL[d.col], c0 = COUNTS[d.col];
    d.tLit = c0 + 0.45 * (1 - Math.pow(1 - (d.j + 1) / N, 1 / 3)); // inverse of power3.out: the dots ARE the count
  });
  const NP = 1400;
  let parts = [];
  function galaxy(p, t) {
    const tau = Math.max(0, t - V.c5.burst);
    const burst = 1 - Math.exp(-tau / 0.16);
    const ring = 1 + 0.1 * Math.exp(-tau / 0.35) * Math.sin(tau * 11);
    const puls = 1 + 0.06 * (pulseEnv(t - V.c5.pulses[0]) + pulseEnv(t - V.c5.pulses[1]));
    const r = p.R * burst * ring * puls;
    const th = p.th0 + p.om * tau;
    const tilt = galaxyTilt(t);
    return { x: 960 + r * Math.cos(th), y: 540 + r * Math.sin(th) * tilt + p.zj * burst * (1 - tilt), depth: Math.sin(th) * (1 - tilt) };
  }
  // The burst is a sphere seen face-on; it settles into a disc tilted away from camera.
  const galaxyTilt = (t) => lerp(1, 0.5, e("power2.inOut", seg(t, V.c5.burst, V.c5.burst + 0.9)));
  // Particle position including the stream into its chart slot (a bent path, power3.inOut, staggered left → right).
  function partPos(p, t) {
    const g = galaxy(p, t);
    const a = e("power3.inOut", seg(t, p.s0, p.s0 + 0.45));
    if (a <= 0) return g;
    const dx = p.tx - g.x, dy = p.ty - g.y, len = Math.hypot(dx, dy) || 1;
    const b = p.bend * Math.sin(Math.PI * a);
    return { x: lerp(g.x, p.tx, a) + (-dy / len) * b, y: lerp(g.y, p.ty, a) + (dx / len) * b, depth: g.depth * (1 - a) };
  }
  function buildParticles() {
    const pr = rng(1400);
    const cols = [P.clay, P.clayLight, P.paper];
    for (let i = 0; i < NP; i++) {
      const c = pr(), arm = pr() < 0.8 ? Math.floor(pr() * 3) : -1;
      const Rr = arm >= 0 ? 70 + 430 * Math.pow(pr(), 0.85) : 120 + 520 * pr();
      parts.push({
        col: c < 0.6 ? 0 : c < 0.85 ? 1 : 2,
        r: 1.3 + 2.4 * pr() * pr(),
        R: Rr,
        th0: arm >= 0 ? (arm * TAU) / 3 + pr.gauss() * 0.12 + Rr * 0.0045 : TAU * pr(),
        om: 2.0 * Math.pow(Rr / 300, -0.5),
        zj: pr.gauss() * 14,
        tw: 3 + 5 * pr(),
        ph: TAU * pr(),
        bend: (pr() < 0.5 ? -1 : 1) * (40 + 100 * pr()),
      });
    }
    // Targets: every chart dot once, the zero's disc, then second particles for some dots. Pair by x so streams flow.
    const disc = [];
    for (let j = 0; j < 40; j++) {
      const a = j * 2.39996, rr = 17 * Math.sqrt((j + 0.5) / 40);
      disc.push({ x: DOT6.x + rr * Math.cos(a), y: DOT6.y + rr * Math.sin(a), disc: true });
    }
    const slots = chartDots.map((d) => ({ x: d.x, y: d.y, dot: d, primary: true })).concat(disc);
    const pick = rng(77);
    while (slots.length < NP) {
      const d = chartDots[Math.floor(pick() * chartDots.length)];
      slots.push({ x: d.x, y: d.y, dot: d, primary: false });
    }
    const at = parts.map((p, i) => ({ i, x: galaxy(p, V.c5.assemble).x }));
    at.sort((a, b) => a.x - b.x || a.i - b.i);
    const so = slots.map((s, k) => ({ s, k })).sort((a, b) => a.s.x - b.s.x || a.s.y - b.s.y || a.k - b.k);
    at.forEach((a, n) => {
      const p = parts[a.i], s = so[n].s;
      p.tx = s.x;
      p.ty = s.y;
      p.slot = s;
      p.s0 = V.c5.assemble + 0.2 * sat((s.x - COLX[0]) / (DOT6.x + 20 - COLX[0]));
    });
  }

  // ================================================================== 07 · identity + the tool
  const C7 = { X0: 150, BASE: 600, SIZE: 300, MASK: 606 };
  const PULL = V.c7.pullback;
  const AB = { x: 384, y: 92, s: 0.6 }; // where the artboard sits inside the tool
  const KEYS = [0.62, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 4.85, 5.0, 5.375, 5.5, 6.0, 6.5, 6.75, 7.0, 7.5, 8.0, 8.5, 8.75, 9.0, 10.25, 10.9, 12.5, 12.75, 13.0, 13.5];
  const TLX0 = 300, TLX1 = 1880, PXS = (TLX1 - TLX0) / CUES.duration;
  function closeCam(t) {
    const u = e("expo.inOut", seg(t, PULL[0], PULL[1]));
    const s = lerp(1, AB.s, u);
    const k = (1 - s) / (1 - AB.s); // fixed-point zoom: the artboard's corner travels linearly in scale
    const tx = AB.x * k, ty = AB.y * k;
    const ts = s / AB.s; // tool space → screen
    return { u, s, tx, ty, ts, ttx: tx - ts * AB.x, tty: ty - ts * AB.y };
  }

  // ================================================================== HUD: the eases the picture is actually using
  const gravity = (u) => {
    const v = Math.min(2.9999, u * 3) % 1;
    return 4 * v * (1 - v);
  };
  const SEGS = [
    [0, 0.62, "expo.out"], [0.62, 1.0, "power2.in"], [1.0, 2.5, "gravity", gravity], [2.5, 3.0, "power2.inOut"],
    [3.0, 3.5, "elastic.out(1, 0.3)"], [3.5, 4.5, "sine.inOut"], [4.5, 5.0, "power3.in"],
    [5.0, 5.5, "steps(7)"], [5.5, 6.0, "power2.inOut"], [6.0, 6.5, "power4.in"], [6.5, 7.0, "spring ζ 0.55", SP055.ease],
    [7.0, 7.8, "expo.out"], [7.8, 9.0, "sine.inOut"], [9.0, 10.25, "expo.out"], [10.25, 11.0, "power3.inOut"],
    [11.0, 13.0, "power3.out"], [13.0, 13.6, "spring ζ 0.85", SP085.ease], [13.6, 15.0, "expo.inOut"],
  ].map(([t0, t1, name, fn]) => ({ t0, t1, name, fn: fn || ease(name) }));
  const CV = { x0: 12, x1: 288, y0: 10, y1: 140, vmin: -0.3, vmax: 1.4 };
  const cvx = (u) => CV.x0 + (CV.x1 - CV.x0) * u;
  const cvy = (v) => CV.y1 - ((clamp(v, CV.vmin, CV.vmax) - CV.vmin) / (CV.vmax - CV.vmin)) * (CV.y1 - CV.y0);

  // ================================================================== DOM handles (filled in build)
  const D = {};
  let gl = null;
  const ROOT = $("root");
  const scaleOf = () => ROOT.getBoundingClientRect().width / ROOT.offsetWidth || 1;
  const frStyle = (size, a, italic) => ({
    fontSize: size + "px", fontStyle: italic ? "italic" : "normal",
    "--wght": a.wght, "--soft": a.soft || 0, "--wonk": a.wonk || 0, "--opsz": 144,
  });
  function measureGlyphs(text, style, cls) {
    const s = setS(el("span", "measure " + (cls || "fr"), ROOT, text), style);
    const k = scaleOf();
    const b = s.getBoundingClientRect();
    const rg = document.createRange();
    const xs = [];
    for (let i = 0; i < text.length; i++) {
      rg.setStart(s.firstChild, i);
      rg.setEnd(s.firstChild, i + 1);
      const r = rg.getBoundingClientRect();
      xs.push({ x: (r.left - b.left) / k, w: r.width / k });
    }
    s.remove();
    return { xs, width: b.width / k };
  }
  function baselineOff(style, cls) {
    const w = setS(el("div", "measure " + (cls || "fr"), ROOT), style);
    w.innerHTML = 'H<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
    const k = scaleOf();
    const off = (w.lastChild.getBoundingClientRect().top - w.getBoundingClientRect().top) / k;
    w.remove();
    return off;
  }

  // ------------------------------------------------------------------ build: grid, ball, type, chart, lockup, tool, HUD
  function buildGrid() {
    const g = svg("g", { id: "gridg" }, $("grid"));
    D.grid = g;
    for (let k = -2; k <= 33; k++) svg("line", { x1: k * 64, x2: k * 64, y1: -192, y2: 1272, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, g);
    for (let k = -3; k <= 19; k++) svg("line", { x1: -192, x2: 2304, y1: k * 64, y2: k * 64, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, g);
  }
  function buildBall() {
    const c1 = $("c1");
    D.floor = svg("line", { y1: FLOOR, y2: FLOOR, stroke: P.ink, "stroke-width": 2.5, "stroke-linecap": "round" }, c1);
    D.arc = svg("path", { fill: "none", stroke: P.ink, "stroke-opacity": 0.3, "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": "0.1 13" }, c1);
    D.shadow = svg("ellipse", { fill: P.ink }, c1);
    D.diamonds = C1.map(() => svg("rect", { x: -8, y: -8, width: 16, height: 16, fill: P.clayDeep }, c1));
    D.skins = [1, 2, 3, 4, 5, 6, 7].map(() => svg("ellipse", { fill: "none", stroke: P.ink, "stroke-width": 2, "vector-effect": "non-scaling-stroke" }, c1));
    D.blurs = [1, 2, 3].map(() => svg("ellipse", { fill: P.clay }, c1));
    D.ball = svg("ellipse", { fill: P.clay }, c1);
  }
  function buildType() {
    const c3 = $("c3");
    D.rule = $("c3rule");
    const mask = setS(el("div", "mask", c3), { height: C3.MASK + "px" });
    const dots = svg("svg", { width: 1920, height: C3.MASK, viewBox: `0 0 1920 ${C3.MASK}`, style: "position:absolute;left:0;top:0;overflow:visible" }, mask);
    D.words = WORDS.map((w) => {
      const A = measureGlyphs(w.text, frStyle(C3.SIZE, w.A));
      const B = w.B ? measureGlyphs(w.text, frStyle(C3.SIZE, w.B)) : A;
      const off = baselineOff(frStyle(C3.SIZE, w.A));
      const box = setS(el("div", "fr", mask), Object.assign({ position: "absolute", left: "0", top: "0", color: P.ink }, frStyle(C3.SIZE, w.A)));
      const glyphs = [];
      for (let i = 0; i < w.text.length - 1; i++) {
        const g = setS(el("span", "g", box, w.text[i]), { left: "0", top: C3.BASE - off + "px", transformOrigin: `${r2(A.xs[i].w / 2)}px ${r2(off)}px` });
        glyphs.push(g);
      }
      const dot = svg("circle", { fill: P.clay }, dots);
      return Object.assign({}, w, { mA: A, mB: B, off, box, glyphs, dot, last: w.text.length - 1 });
    });
  }
  function buildChart() {
    const c6 = $("c6");
    const numStyle = frStyle(150, { wght: 600, soft: 0, wonk: 0 });
    const off = baselineOff(numStyle);
    const dw = 0.66 * 150;
    const tops = [452, 742, 742, 712];
    D.nums = COLX.map((x, c) => {
      const n = setS(el("div", "num fr", c6), Object.assign({ left: x + "px", top: tops[c] - off + "px", transformOrigin: `0px ${r2(off)}px` }, numStyle));
      const digits = [0, 1, 2].map(() => setS(el("span", "d", n, ""), { width: dw + "px" }));
      return { n, digits };
    });
    D.labels = ["FRAMES", "BEATS", "DISCIPLINES", "CUTS"].map((s, c) => {
      const lab = el("div", "lab mono", c6, s);
      const loff = baselineOff({ fontSize: "18px" }, "mono");
      return setS(lab, { left: COLX[c] + "px", top: 812 - loff + "px" });
    });
    const tStyle = frStyle(64, { wght: 500, soft: 20, wonk: 0 });
    const toff = baselineOff(tStyle);
    const tmask = setS(el("div", "mask", c6), { height: "268px" });
    D.title = setS(el("div", "g fr", tmask, "This reel, in numbers."), Object.assign({ left: COLX[0] + "px", top: 250 - toff + "px", color: P.paper }, tStyle));
  }
  function buildLockup() {
    const c7 = $("c7");
    const A = { wght: 560, soft: 40, wonk: 0 };
    const m = measureGlyphs("Claude.", frStyle(C7.SIZE, A));
    const off = baselineOff(frStyle(C7.SIZE, A));
    const mask = setS(el("div", "mask", c7), { height: C7.MASK + "px" });
    const box = setS(el("div", "fr", mask), Object.assign({ position: "absolute", left: "0", top: "0", color: P.ink }, frStyle(C7.SIZE, A)));
    D.name = "Claude".split("").map((ch, i) =>
      setS(el("span", "g", box, ch), { left: C7.X0 + m.xs[i].x + "px", top: C7.BASE - off + "px" }),
    );
    const pg = periodGeom(A.wght);
    D.period = { x: C7.X0 + m.xs[6].x + m.xs[6].w / 2, y: C7.BASE - pg.cy * C7.SIZE, r: (pg.d * C7.SIZE) / 2 };
    const soff = baselineOff({ fontSize: "30px" }, "mono");
    const sub = setS(el("div", "mono", c7), { position: "absolute", left: "0", top: "0" });
    sub.id = "c7sub";
    const subText = "MOTION DESIGNER";
    const sm = measureGlyphs(subText, { fontSize: "30px", letterSpacing: "0.3em" }, "mono");
    D.sub = subText.split("").map((ch, i) => setS(el("span", "g", sub, ch), { left: C7.X0 + 4 + sm.xs[i].x + "px", top: 676 - soff + "px" }));
    D.subX = sm.xs.map((g) => C7.X0 + 4 + g.x).concat([C7.X0 + 4 + sm.width]);
    D.cursor = setS(el("div", "", c7), { position: "absolute", left: "0", top: 676 - 26 + "px" });
    D.cursor.id = "c7cursor";
    const tagOff = baselineOff({ fontSize: "40px", fontStyle: "italic", fontVariationSettings: '"opsz" 144, "wght" 400, "SOFT" 50, "WONK" 0' }, "");
    D.tag = setS(el("div", "", c7, "Motion design, written in code."), { left: C7.X0 + 2 + "px", top: 744 - tagOff + "px" });
    D.tag.id = "c7tag";
  }
  function buildCovers() {
    const cv = $("covers");
    D.swallow = svg("circle", { fill: P.clay }, cv);
    D.iris = svg("circle", { fill: P.paper }, cv);
    D.dot6 = svg("ellipse", { fill: P.clay }, cv);
    D.sel = svg("g", {}, cv);
    D.selBox = svg("rect", { fill: "none", stroke: P.clay, "stroke-width": 2.5 }, D.sel);
    D.selHandles = [0, 1, 2, 3].map(() => svg("rect", { width: 11, height: 11, fill: P.paper, stroke: P.clay, "stroke-width": 2.5 }, D.sel));
    const mk = $("marks");
    D.marks = [[40, 40, 1, 1], [1880, 40, -1, 1], [40, 1040, 1, -1], [1880, 1040, -1, -1]].map(([x, y, sx, sy]) =>
      svg("path", { d: `M${x + 28 * sx} ${y} H${x} V${y + 28 * sy}`, fill: "none", "stroke-width": 2, "stroke-linecap": "square" }, mk),
    );
  }
  function buildHUD() {
    const bl = $("hud-bl");
    D.chaps = CH.map((c) => {
      const box = el("div", "chap", bl);
      el("div", "idx", box, `${c.n} / 07`);
      el("div", "ttl", box, c.title);
      return box;
    });
    const cs = $("hud-curve");
    D.axes = svg("path", { d: `M${CV.x0} ${CV.y0} V${cvy(0)} H${CV.x1}`, fill: "none", "stroke-width": 1.5, "stroke-opacity": 0.45 }, cs);
    D.one = svg("path", { d: `M${CV.x0} ${cvy(1)} H${CV.x1}`, fill: "none", "stroke-width": 1, "stroke-dasharray": "3 5", "stroke-opacity": 0.45 }, cs);
    D.vline = svg("line", { y1: CV.y0, y2: CV.y1, "stroke-width": 1, "stroke-opacity": 0.3 }, cs);
    D.segPaths = SEGS.map((s) => {
      let d = "";
      for (let k = 0; k <= 160; k++) {
        const u = k / 160;
        d += (k ? "L" : "M") + r2(cvx(u)) + " " + r2(cvy(s.fn(u)));
      }
      const p = svg("path", { d, fill: "none", "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }, cs);
      const L = p.getTotalLength();
      attr(p, { "stroke-dasharray": `${r2(L)} ${r2(L)}` });
      return { p, L };
    });
    D.head = svg("circle", { r: 6, fill: P.clay }, cs);
    D.ease = $("hud-ease");
    D.tc = $("hud-tc");
    D.sqs = Array.from(document.querySelectorAll("#hud .sq"));
    D.tl = $("hud-tl");
    D.tr = $("hud-tr");
    D.bl = bl;
    D.br = $("hud-br");
    D.bpm = $("hud-bpm");
    D.curve = cs;
    D.hudSub = $("hud-reel");
  }
  function buildTool() {
    const tool = $("tool"), bgL = $("toolbg");
    // canvas area: dotted workspace + the artboard's shadow and label (behind the artboard)
    setS(el("div", "", bgL), {
      position: "absolute", left: "300px", top: "52px", width: "1320px", height: "728px",
      backgroundImage: "radial-gradient(rgba(242,237,227,0.09) 1.4px, transparent 1.6px)", backgroundSize: "24px 24px",
    });
    setS(el("div", "", bgL), { position: "absolute", left: AB.x + "px", top: AB.y + "px", width: 1920 * AB.s + "px", height: 1080 * AB.s + "px", boxShadow: "0 22px 60px rgba(27,23,20,0.6)" });
    setS(el("div", "t18 muted mono", bgL, "ARTBOARD · 1920 × 1080 · index.html"), { position: "absolute", left: AB.x + "px", top: AB.y - 32 + "px" });
    const hair = "1px solid rgba(242,237,227,0.09)";
    // top bar
    const top = setS(el("div", "panel", tool), { left: "0", top: "0", width: "1920px", height: "52px", borderBottom: hair });
    const brand = svg("svg", { width: 18, height: 18, viewBox: "0 0 18 18", style: "position:absolute;left:24px;top:17px" }, top);
    svg("circle", { cx: 9, cy: 9, r: 7, fill: P.clay }, brand);
    setS(el("div", "", top, "Claude"), { position: "absolute", left: "52px", top: "10px", fontFamily: "Fraunces, serif", fontSize: "24px", lineHeight: "32px", fontVariationSettings: '"opsz" 144, "wght" 600, "SOFT" 30, "WONK" 0' });
    setS(el("div", "t18 muted mono", top, "— MOTION REEL — 2026"), { position: "absolute", left: "142px", top: "13px" });
    setS(el("div", "t18 mono", top, "index.html"), { position: "absolute", left: "906px", top: "13px" });
    setS(el("div", "", top), { position: "absolute", left: "906px", top: "49px", width: "108px", height: "3px", background: P.clay });
    setS(el("div", "t18 muted mono", top, "1920 × 1080 · 60 FPS · 120 BPM"), { position: "absolute", right: "222px", top: "13px" });
    D.tcSlot = { x: 1920 - 24 - D.tc.getBoundingClientRect().width / scaleOf(), y: 9 }; // the HUD timecode lands here
    // layers
    const lay = setS(el("div", "panel", tool), { left: "0", top: "52px", width: "300px", height: "728px", borderRight: hair });
    setS(el("div", "t18 muted mono", lay, "LAYERS"), { position: "absolute", left: "24px", top: "18px" });
    const icons = {
      dot: (s) => svg("circle", { cx: 9, cy: 9, r: 6, fill: P.clay }, s),
      shadow: (s) => svg("ellipse", { cx: 9, cy: 12, rx: 7, ry: 3, fill: P.mutedPaper }, s),
      goo: (s) => { svg("circle", { cx: 6, cy: 10, r: 5, fill: P.mutedPaper }, s); svg("circle", { cx: 12, cy: 7, r: 4, fill: P.mutedPaper }, s); },
      type: (s) => svg("path", { d: "M3 4H15M9 4V16", stroke: P.mutedPaper, "stroke-width": 2.4, fill: "none" }, s),
      sphere: (s) => { svg("circle", { cx: 9, cy: 9, r: 7, fill: "none", stroke: P.mutedPaper, "stroke-width": 2 }, s); svg("ellipse", { cx: 9, cy: 9, rx: 7, ry: 2.5, fill: "none", stroke: P.mutedPaper, "stroke-width": 1.4 }, s); },
      particles: (s) => [[4, 5], [12, 4], [8, 10], [14, 13], [4, 14]].forEach(([x, y]) => svg("circle", { cx: x, cy: y, r: 1.8, fill: P.mutedPaper }, s)),
      chart: (s) => [[2, 4, 12], [8, 9, 7], [14, 13, 3]].forEach(([x, y, h]) => svg("rect", { x, y, width: 3, height: h, fill: P.mutedPaper }, s)),
      name: (s) => svg("path", { d: "M2 15L7 3L12 15M4 11H10M14 9V15", stroke: P.mutedPaper, "stroke-width": 2, fill: "none" }, s),
      hud: (s) => svg("path", { d: "M2 6V2H6M12 2H16V6M16 12V16H12M6 16H2V12", stroke: P.mutedPaper, "stroke-width": 2, fill: "none" }, s),
    };
    ["dot", "shadow", "goo", "type", "sphere", "particles", "chart", "name", "hud"].forEach((name, i) => {
      const row = setS(el("div", "row" + (i === 0 ? " sel" : ""), lay), { top: 56 + i * 40 + "px" });
      icons[name](svg("svg", { width: 18, height: 18, viewBox: "0 0 18 18" }, row));
      setS(el("span", "t18 mono", row, name), { color: i === 0 ? P.paper : "rgba(242,237,227,0.78)" });
    });
    // inspector
    const ins = setS(el("div", "panel", tool), { left: "1620px", top: "52px", width: "300px", height: "728px", borderLeft: hair });
    setS(el("div", "t18 muted mono", ins, "INSPECTOR"), { position: "absolute", left: "24px", top: "18px" });
    setS(el("div", "", ins, "dot"), { position: "absolute", left: "24px", top: "50px", fontFamily: "Fraunces, serif", fontSize: "30px", lineHeight: "36px", fontVariationSettings: '"opsz" 144, "wght" 600, "SOFT" 30, "WONK" 0' });
    const prop = (y, k, v) => {
      setS(el("div", "t18 muted mono", ins, k), { position: "absolute", left: "24px", top: y + "px" });
      return setS(el("div", "t18 mono", ins, v), { position: "absolute", left: "24px", top: y + 26 + "px" });
    };
    D.insXY = prop(104, "POSITION", "");
    D.insSize = prop(164, "SIZE", "");
    const fill = setS(prop(224, "FILL", "#D2643A"), { paddingLeft: "30px" });
    setS(el("div", "", fill), { position: "absolute", left: "0", top: "4px", width: "18px", height: "18px", borderRadius: "50%", background: P.clay });
    prop(284, "EASE", "expo.inOut");
    D.curveSlot = { x: 1620 + 20, y: 52 + 346, s: 260 / 300 };
    prop(500, "KEYS", `${KEYS.length} on the timeline`);
    prop(560, "DURATION", "15.00 s · 900 frames");
    // timeline
    const tlp = setS(el("div", "panel", tool), { left: "0", top: "780px", width: "1920px", height: "300px", borderTop: hair });
    setS(el("div", "t18 muted mono", tlp, "TIMELINE"), { position: "absolute", left: "24px", top: "14px" });
    const tr = svg("svg", { width: 120, height: 26, viewBox: "0 0 120 26", style: "position:absolute;left:236px;top:14px" }, tlp);
    svg("path", { d: "M2 6V20M16 6L6 13L16 20Z", fill: P.mutedPaper, stroke: P.mutedPaper, "stroke-width": 2, "stroke-linejoin": "round" }, tr);
    svg("path", { d: "M46 5L60 13L46 21Z", fill: P.paper }, tr);
    svg("path", { d: "M82 6L92 13L82 20ZM104 6V20", fill: P.mutedPaper, stroke: P.mutedPaper, "stroke-width": 2, "stroke-linejoin": "round" }, tr);
    setS(el("div", "t18 muted mono", tlp, "00:00:15:00"), { position: "absolute", right: "24px", top: "14px" });
    const lane = (y, name) => setS(el("div", "t18 muted mono", tlp, name), { position: "absolute", left: "24px", top: y + "px" });
    lane(96, "CHAPTERS");
    lane(146, "DOT");
    lane(214, "AUDIO");
    const ts = svg("svg", { width: 1920, height: 300, viewBox: "0 0 1920 300", style: "position:absolute;left:0;top:0;overflow:visible" }, tlp);
    for (let b = 0; b <= 30; b++) {
      const x = TLX0 + b * 0.5 * PXS, sec = b % 2 === 0, bar = b >= 2 && (b - 2) % 4 === 0;
      svg("line", { x1: x, x2: x, y1: bar ? 62 : sec ? 68 : 74, y2: 82, stroke: P.mutedPaper, "stroke-opacity": bar ? 0.9 : 0.5, "stroke-width": bar ? 2 : 1.2 }, ts);
    }
    for (let s = 0; s <= 15; s++) {
      const last = s === 15;
      const lab = svg("text", { x: TLX0 + s * PXS + (last ? -5 : 5), y: 64, fill: P.mutedPaper, "font-family": "JetBrains Mono", "font-size": 18, "text-anchor": last ? "end" : "start" }, ts);
      lab.textContent = String(s);
    }
    svg("line", { x1: TLX0, x2: TLX1, y1: 82.5, y2: 82.5, stroke: P.paper, "stroke-opacity": 0.12 }, ts);
    const short = { c0: "Open", c1: "Squash–Stretch" }; // clip labels must fit their clips (1 s = 105 px)
    CH.forEach((c) => {
      const inkWorld = c.start >= T.c4 && c.start < T.c7;
      setS(el("div", "clipbox mono", tlp, `${c.n} ${short[c.id] || c.title}`), {
        left: TLX0 + c.start * PXS + 2 + "px", top: "90px", width: (c.end - c.start) * PXS - 4 + "px",
        background: inkWorld ? P.mutedInk : P.paper2, color: inkWorld ? P.paper : P.ink,
        border: c.id === "c7" ? `2px solid ${P.clay}` : "2px solid transparent",
      });
    });
    let keyLine = "";
    KEYS.forEach((k, i) => {
      if (i) keyLine += `M${r2(TLX0 + KEYS[i - 1] * PXS)} 161H${r2(TLX0 + k * PXS)}`;
    });
    svg("path", { d: keyLine, stroke: P.clay, "stroke-opacity": 0.35, "stroke-width": 2 }, ts);
    KEYS.forEach((k) => svg("rect", { x: -6, y: -6, width: 12, height: 12, fill: P.clay, transform: `translate(${r2(TLX0 + k * PXS)} 161) rotate(45)` }, ts));
    let wd = "";
    const n = WAVE.peaks.length, mid = 236, amp = 40;
    WAVE.peaks.forEach((v, i) => (wd += (i ? "L" : "M") + r2(TLX0 + (i / (n - 1)) * (TLX1 - TLX0)) + " " + r2(mid - Math.max(0.6, v * amp))));
    for (let i = n - 1; i >= 0; i--) wd += "L" + r2(TLX0 + (i / (n - 1)) * (TLX1 - TLX0)) + " " + r2(mid + Math.max(0.6, WAVE.peaks[i] * amp));
    wd += "Z";
    svg("path", { d: wd, fill: P.mutedPaper, "fill-opacity": 0.42 }, ts);
    const clip = svg("clipPath", { id: "played" }, svg("defs", {}, ts));
    D.playedRect = svg("rect", { x: TLX0, y: 180, width: 0, height: 120 }, clip);
    svg("path", { d: wd, fill: P.clayLight, "fill-opacity": 0.9, "clip-path": "url(#played)" }, ts);
    D.playhead = svg("g", {}, ts);
    svg("line", { x1: 0, x2: 0, y1: 50, y2: 292, stroke: P.clay, "stroke-width": 2 }, D.playhead);
    svg("path", { d: "M-8 44H8V56L0 64L-8 56Z", fill: P.clay }, D.playhead);
  }
  function buildGrain() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    const im = x.createImageData(256, 256);
    const pr = rng(4242);
    for (let i = 0; i < 256 * 256; i++) {
      const v = pr(), g = v < 0.5 ? 0 : 255;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g;
      im.data[i * 4 + 3] = Math.round(Math.abs(v - 0.5) * 2 * 255);
    }
    x.putImageData(im, 0, 0);
    $("grain").style.backgroundImage = `url(${c.toDataURL()})`;
  }

  // ================================================================== render
  const irisR = (t) => 20 + 1700 * e("expo.in", seg(t, V.c6.drop, T.c7));
  // Is the background ink at (x, y)? The ink world runs 7–13 s; the paper iris eats it from the dot outward.
  function inkAt(t, x, y) {
    if (t < T.c4 || t >= T.c7) return false;
    if (t >= V.c6.drop) return Math.hypot(x - DOT6.x, y - DOT6.y) > irisR(t);
    return true;
  }

  function renderWorld(t) {
    const ink = t >= T.c4 && t < T.c7;
    D.bg.style.background = ink ? P.ink : P.paper;
    // Grid: world space, drifting one cell per chapter (seamless), fading back in after each world change.
    const fadeIn = t >= T.c7 ? seg(t, T.c7, T.c7 + 0.4) : t >= T.c5 ? seg(t, T.c5, T.c5 + 0.3) : 1;
    attr(D.grid, { transform: `translate(${r2(-((32 * t) % 64))} 0)`, stroke: ink ? P.paper : P.ink, "stroke-opacity": r2((ink ? 0.05 : 0.06) * fadeIn * 1000) / 1000 });
    // Camera: the cold open pulls out of the dot (log-space, so the zoom reads evenly); at 6.75 it dives into
    // Feel.'s full stop the same way, mirrored. Between them, one impact shake on "Weight."
    let S = 1, cx = 0, cy = 0;
    if (t < ZE) {
      S = Math.pow(60, 1 - e("power2.out", seg(t, 0, ZE)));
      cx = B0[0];
      cy = B0[1];
    } else if (t >= V.c3.swallow && t < T.c4 && D.words) {
      const w = D.words[3], d = wordDot(w, wordState(w, 3, t));
      S = Math.pow(3200 / d.r, e("power2.in", seg(t, V.c3.swallow, T.c4)));
      cx = d.x;
      cy = d.y;
    }
    const tau = t - 6.0;
    const shake = tau >= 0 && tau < 0.35 ? 9 * Math.exp(-tau / 0.05) * Math.cos((TAU * tau) / 0.075) : 0;
    D.cam.style.transform = `matrix(${S},0,0,${S},${r2(cx * (1 - S))},${r2(cy * (1 - S) + shake)})`;
    // registration marks invert with the world
    D.marks.forEach((m, i) => {
      const x = i % 2 ? 1866 : 54, y = i < 2 ? 54 : 1026;
      attr(m, { stroke: inkAt(t, x, y) ? P.paper : P.ink, "stroke-opacity": 0.55 });
    });
  }

  function renderBall(t) {
    const on = t < T.c2;
    show(D.c1, on);
    if (!on) return;
    const p = ballPose(t);
    attr(D.ball, { rx: r2(p.r), ry: r2(p.r), transform: poseT(p) });
    // sub-frame motion blur: three earlier samples inside this frame's shutter
    const blurAmt = t >= ZE ? smooth(900, 2400, p.sp) : 0;
    D.blurs.forEach((b, k) => {
      const q = ballPose(t - ((k + 1) * F) / 3);
      attr(b, { rx: r2(q.r), ry: r2(q.r), transform: poseT(q), "fill-opacity": r2([0.32, 0.2, 0.1][k] * blurAmt * 100) / 100 });
    });
    const working = 1 - e("power2.in", seg(t, LAUNCH, 2.9));
    // onion skins: seven earlier poses, four frames apart
    const sk = e("power2.out", seg(t, C1[0], C1[0] + 0.2)) * working;
    D.skins.forEach((s, k) => {
      const tk = t - 4 * (k + 1) * F;
      const vis = tk >= ZE && sk > 0;
      attr(s, { visibility: vis ? "visible" : "hidden" });
      if (!vis) return;
      const q = ballPose(tk);
      attr(s, { rx: r2(q.r), ry: r2(q.r), transform: poseT(q), "stroke-opacity": r2((0.42 - 0.06 * k) * sk * 100) / 100 });
    });
    // the dotted arc of the centre path, drawn behind the ball
    if (t >= C1[0] && working > 0) {
      let d = "";
      const tEnd = Math.min(t, T.c2);
      for (let tt = C1[0], k = 0; tt <= tEnd + 1e-9; tt += 1 / 120, k++) {
        const q = ballPath(tt);
        d += (k ? "L" : "M") + r2(q.x) + " " + r2(q.y);
      }
      attr(D.arc, { d, visibility: "visible", "stroke-opacity": r2(0.3 * working * 100) / 100 });
    } else attr(D.arc, { visibility: "hidden" });
    // floor line draws out from the first contact; keyframe diamonds pop on each contact
    if (t >= C1[0]) {
      const u = e("power3.out", seg(t, C1[0], C1[0] + 0.5));
      attr(D.floor, { x1: r2(B0[0] - (B0[0] - 96) * u), x2: r2(B0[0] + (1824 - B0[0]) * u), visibility: "visible", "stroke-opacity": r2(working * 100) / 100 });
    } else attr(D.floor, { visibility: "hidden" });
    D.diamonds.forEach((dm, i) => {
      const s = springAt(SP060, t - C1[i]);
      attr(dm, { transform: `translate(${XS[i]} ${FLOOR}) rotate(45) scale(${r2(s * 1000) / 1000})`, "fill-opacity": r2(working * 100) / 100, visibility: s > 0 ? "visible" : "hidden" });
    });
    // contact shadow: tighter and darker as the ball nears the floor; leaves with the launch
    const bp = ballPath(t);
    const hn = clamp((FLOOR - R - bp.y) / 380, 0, 1);
    const sh = seg(t, 0.35, ZE) * (1 - e("power2.in", seg(t, LAUNCH + 0.03, 2.85)));
    attr(D.shadow, { cx: r2(bp.x), cy: FLOOR + 3, rx: r2(R * (1.1 - 0.5 * hn)), ry: r2(10 * (1 - 0.45 * hn)), "fill-opacity": r2(0.2 * (1 - 0.75 * hn) * sh * 1000) / 1000 });
  }

  function renderGL(t) {
    const gooOn = t >= T.c2 && t < T.c3;
    const depthOn = t >= T.c4 && t < T.c5;
    show(D.gl, gooOn || depthOn);
    if (gooOn) gl.goo(gooState(t));
    else if (depthOn) gl.depth(t);
  }

  function wordState(w, k, t) {
    // returns per-glyph {x, dy, rot, sx, sy} plus font axes and the period dot
    const n = w.text.length;
    const HIDE = 380;
    const out = { glyphs: [], wght: w.A.wght, soft: w.A.soft || 0, wonk: w.A.wonk || 0, p: 0, track: 0, vis: false };
    if (k === 0) {
      out.vis = t >= w.t0 && t < w.t0 + 0.5;
      const ex = 340 * e("power3.in", seg(t, w.t0 + 0.4, w.t0 + 0.5));
      for (let i = 0; i < n; i++) {
        const fi = frameOf(t) - Math.round((w.t0 + i * 0.0625) * 60); // one glyph per 32nd note, a 2-frame snap
        const dy = fi < -1e-3 ? HIDE : fi < 1 - 1e-3 ? 130 : fi < 2 - 1e-3 ? -10 : 0;
        out.glyphs.push({ dy: dy + ex, rot: 0, sx: 1, sy: 1 });
      }
    } else if (k === 1) {
      out.vis = t >= w.t0 && t < w.t0 + 0.5;
      out.track = t < 5.74 ? lerp(-0.28, 0.14, e("power2.inOut", seg(t, w.t0, 5.74))) : lerp(0.14, -0.02, e("power2.out", seg(t, 5.74, 5.9)));
      const rise = HIDE * (1 - e("expo.out", seg(t, w.t0, w.t0 + 0.12)));
      const ex = 340 * e("power3.in", seg(t, w.t0 + 0.4, w.t0 + 0.5));
      for (let i = 0; i < n; i++) out.glyphs.push({ dy: rise + ex, rot: 0, sx: 1, sy: 1 });
    } else if (k === 2) {
      out.vis = t >= 5.78 && t < w.t0 + 0.5;
      out.wght = t < w.t0 ? 100 : lerp(100, 900, e("expo.out", seg(t, w.t0, w.t0 + 0.1)));
      out.p = (out.wght - 100) / 800;
      const drop = -300 * (1 - e("power4.in", seg(t, 5.78, w.t0)));
      const q = t >= w.t0 ? 1 - springAt(SP085, t - w.t0) : 0;
      const ex = 340 * e("power3.in", seg(t, w.t0 + 0.4, w.t0 + 0.5));
      for (let i = 0; i < n; i++) out.glyphs.push({ dy: drop + ex, rot: 0, sx: 1 + 0.07 * q, sy: 1 - 0.14 * q });
    } else {
      out.vis = t >= w.t0;
      out.p = e("power2.out", seg(t, w.t0, w.t0 + 0.22));
      out.soft = 100 * out.p;
      out.wonk = out.p;
      for (let i = 0; i < n; i++) {
        const si = w.t0 + 0.03 * i;
        const v = springAt(SP055, t - si);
        out.glyphs.push({ dy: t < si ? HIDE : HIDE * (1 - v), rot: (i % 2 ? -9 : 9) * (1 - v), sx: 1, sy: 1 });
      }
    }
    return out;
  }
  function wordX(w, s, i) {
    const a = w.mA.xs[i], b = w.mB.xs[i];
    return C3.X0 + lerp(a.x, b.x, s.p) + i * s.track * C3.SIZE;
  }
  function wordDot(w, s) {
    const i = w.last, g = s.glyphs[i];
    const a = w.mA.xs[i], b = w.mB.xs[i];
    const pg = periodGeom(s.wght);
    return { x: C3.X0 + lerp(a.x + a.w / 2, b.x + b.w / 2, s.p) + i * s.track * C3.SIZE, y: C3.BASE - pg.cy * C3.SIZE + g.dy, r: (pg.d * C3.SIZE) / 2, rot: g.rot };
  }
  function renderType(t) {
    const on = t >= T.c3 && t < T.c4;
    show(D.c3, on);
    if (!on) return;
    // the liquid bar becomes the baseline rule
    const u1 = e("power2.out", seg(t, T.c3, T.c3 + 0.15)), u2 = e("expo.out", seg(t, T.c3, T.c3 + 0.3));
    const [bx, by, bw, bh] = V.c2.bar;
    const h = lerp(bh, 6, u1), w = lerp(bw, 1620, u2);
    setS(D.rule, { display: "block", left: bx + "px", top: r2(by - h / 2) + "px", width: r2(w) + "px", height: r2(h) + "px", background: mixHex(P.clay, P.ink, u1) });
    D.words.forEach((wd, k) => {
      const s = wordState(wd, k, t);
      show(wd.box, s.vis);
      attr(wd.dot, { visibility: s.vis ? "visible" : "hidden" });
      if (!s.vis) return;
      setS(wd.box, { "--wght": r2(s.wght), "--soft": r2(s.soft), "--wonk": r2(s.wonk) });
      wd.glyphs.forEach((g, i) => {
        const st = s.glyphs[i];
        g.style.transform = `translate(${r2(wordX(wd, s, i))}px, ${r2(st.dy)}px) rotate(${r2(st.rot)}deg) scale(${r2(st.sx * 1000) / 1000}, ${r2(st.sy * 1000) / 1000})`;
      });
      const d = wordDot(wd, s);
      attr(wd.dot, { cx: r2(d.x), cy: r2(d.y), r: r2(d.r * (s.glyphs[wd.last].sy || 1)) });
    });
  }

  function renderField(t) {
    const on = t >= T.c5 && t < T.c7;
    show(D.field, on);
    if (!on) return;
    const x = D.ctx;
    x.clearRect(0, 0, 1920, 1080);
    const lock = V.c5.lock;
    if (t < lock) {
      const tau = t - V.c5.burst;
      const asm = e("power2.in", seg(t, V.c5.assemble, lock));
      const tilt = galaxyTilt(t);
      x.globalCompositeOperation = "lighter";
      // white-hot core with a clay halo, flattened with the disc; flares on the beat pulses, empties as it assembles
      const glow = (Math.exp(-tau / 0.2) + 0.3 + 0.3 * (pulseEnv(t - V.c5.pulses[0]) + pulseEnv(t - V.c5.pulses[1]))) * (1 - asm);
      if (glow > 0.003) {
        const g = x.createRadialGradient(960, 540, 0, 960, 540, 230);
        g.addColorStop(0, rgba(P.paper, r2(Math.min(1, 0.95 * glow) * 1000) / 1000));
        g.addColorStop(0.08, rgba(P.clayLight, r2(Math.min(1, 0.75 * glow) * 1000) / 1000));
        g.addColorStop(0.35, rgba(P.clay, r2(0.28 * glow * 1000) / 1000));
        g.addColorStop(1, rgba(P.clay, 0));
        x.save();
        x.translate(960, 540);
        x.scale(1, tilt);
        x.translate(-960, -540);
        x.fillStyle = g;
        x.fillRect(730, 310, 460, 460);
        x.restore();
      }
      [[V.c5.burst, 820, 0.6], [V.c5.pulses[0], 520, 0.3], [V.c5.pulses[1], 560, 0.3]].forEach(([t0, rad, a0]) => {
        const u = seg(t, t0, t0 + 0.5);
        if (t < t0 || u >= 1) return;
        x.strokeStyle = rgba(P.clayLight, a0 * Math.pow(1 - u, 1.5));
        x.lineWidth = 3 - 2 * u;
        x.beginPath();
        x.ellipse(960, 540, rad * e("expo.out", u), rad * e("expo.out", u) * tilt, 0, 0, TAU);
        x.stroke();
      });
      // particles as light trails (where each was 2 frames ago → where it is): a starburst, then swirling arms
      const cols = [P.clay, P.clayLight, P.paper];
      x.lineCap = "round";
      for (let c = 0; c < 3; c++) {
        x.strokeStyle = cols[c];
        for (const p of parts) {
          if (p.col !== c) continue;
          const a = e("power3.inOut", seg(t, p.s0, p.s0 + 0.45));
          if (a >= 1) continue;
          const q = partPos(p, t), q0 = partPos(p, t - 0.035);
          const twk = 0.72 + 0.28 * Math.sin(p.tw * tau + p.ph);
          const alpha = (1 - a) * twk * (0.78 + 0.22 * q.depth) * Math.min(1, tau / 0.03 + 0.15);
          if (alpha < 0.004) continue;
          x.globalAlpha = Math.min(1, alpha);
          x.lineWidth = Math.max(1.2, 2 * lerp(p.r * (1 + 0.3 * q.depth), DOTR, a));
          x.beginPath();
          x.moveTo(q0.x, q0.y);
          x.lineTo(q.x + 0.01, q.y);
          x.stroke();
        }
      }
      // ...and solid dots as they land in the chart
      x.globalCompositeOperation = "source-over";
      x.fillStyle = P.mutedPaper;
      for (const p of parts) {
        if (!p.slot.primary) continue;
        const a = e("power3.inOut", seg(t, p.s0, p.s0 + 0.45));
        if (a <= 0) continue;
        const q = partPos(p, t);
        x.globalAlpha = 0.3 * a;
        x.beginPath();
        x.arc(q.x, q.y, lerp(p.r, DOTR, a), 0, TAU);
        x.fill();
      }
      x.globalAlpha = 1;
      return;
    }
    // ---- the chart (dots are the count)
    const flash = Math.exp(-Math.max(0, t - lock) / 0.05) * (t >= lock ? 1 : 0);
    const axis = e("power3.out", seg(t, lock, lock + 0.35));
    const fall = (c) => e("power3.in", seg(t, V.c6.drop + 0.03 * c, T.c7));
    x.strokeStyle = rgba(P.paper, 0.35 * (1 - fall(0)));
    x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(COLX[0], BASEY + 0.75);
    x.lineTo(COLX[0] + (COLX[3] + 300 - COLX[0]) * axis, BASEY + 0.75);
    x.stroke();
    for (const d of chartDots) {
      const c0 = COUNTS[d.col];
      const settle = t < c0 + 0.45 ? 1 + 0.04 * e("power2.out", seg(t, c0, c0 + 0.45)) : 1 + 0.04 * (1 - springAt(SP085, t - c0 - 0.45));
      const y = BASEY - (BASEY - d.y) * settle + 420 * fall(d.col);
      if (y > BASEY + 2) continue;
      const lit = t >= d.tLit;
      const pop = lit ? 1 + 0.5 * Math.exp(-(t - d.tLit) / 0.06) : 1;
      x.fillStyle = lit ? P.paper : P.mutedPaper;
      x.globalAlpha = lit ? 1 : Math.min(1, 0.3 + 0.7 * flash);
      x.beginPath();
      x.arc(d.x, y, DOTR * pop, 0, TAU);
      x.fill();
    }
    x.globalAlpha = 1;
  }

  function renderChart(t) {
    const on = t >= V.c5.lock && t < T.c7;
    show(D.c6, on);
    if (!on) return;
    const out = e("power3.in", seg(t, V.c6.drop, V.c6.drop + 0.2));
    // title rises at 11.0
    const ut = e("expo.out", seg(t, T.c6, T.c6 + 0.4));
    D.title.style.transform = `translate(0px, ${r2(90 * (1 - ut) + 60 * out)}px)`;
    D.title.style.opacity = t >= T.c6 ? r2(1 - out) : 0;
    D.labels.forEach((l, c) => {
      const u = e("power2.out", seg(t, T.c6 + 0.05 * c, T.c6 + 0.05 * c + 0.3));
      setS(l, { opacity: r2(u * (1 - out)), transform: `translate(0px, ${r2(8 * (1 - u))}px)` });
    });
    D.nums.forEach((nm, c) => {
      const c0 = COUNTS[c];
      if (t < c0) {
        nm.n.style.opacity = 0;
        return;
      }
      let txt, sc;
      if (c < 3) {
        const u = e("power3.out", seg(t, c0, c0 + 0.45));
        txt = String(Math.round(NCOL[c] * u));
        sc = 0.82 + 0.18 * u;
      } else {
        txt = "0";
        sc = lerp(1.6, 1, e("power4.out", seg(t, c0, c0 + 0.2)));
      }
      nm.digits.forEach((dg, i) => {
        const ch = txt[i] || "";
        if (dg.textContent !== ch) dg.textContent = ch;
      });
      setS(nm.n, { opacity: r2(1 - out), transform: `translate(0px, ${r2(40 * out)}px) scale(${r2(sc * 1000) / 1000})` });
    });
  }

  // The protagonist dot from 10.9 s: the zero's full stop, the iris centre, then the full stop of "Claude."
  function dotPose(t) {
    const pd = D.period;
    if (t < T.c7) {
      const u = seg(t, V.c6.counts[3], V.c6.drop);
      const hop = 18 * 4 * u * (1 - u);
      const w = contactW(t, V.c6.drop);
      const sy = 1 - 0.25 * w, sx = 1 + 0.3 * w;
      return { x: DOT6.x, y: w ? BASEY - DOT6.r * sy : DOT6.y - hop, r: DOT6.r, sx, sy, rot: 0, a: e("power2.out", seg(t, V.c5.lock, V.c5.lock + 0.1)) };
    }
    const t1 = V.c7.period;
    const w = contactW(t, t1);
    if (w) {
      const sy = 1 - 0.3 * w, sx = 1 + 0.36 * w;
      return { x: pd.x, y: pd.y + pd.r - pd.r * sy, r: pd.r, sx, sy, rot: 0, a: 1 };
    }
    if (t < t1) {
      const u = seg(t, T.c7, t1), H = 300, Dt = t1 - T.c7;
      const vx = (pd.x - DOT6.x) / Dt, vy = (pd.y - DOT6.y - 4 * H * (1 - 2 * u)) / Dt;
      const sp = Math.hypot(vx, vy), s = 1 + 0.22 * smooth(300, 2000, sp);
      return { x: lerp(DOT6.x, pd.x, u), y: lerp(DOT6.y, pd.y, u) - 4 * H * u * (1 - u), r: lerp(DOT6.r, pd.r, u), sx: s, sy: 1 / Math.sqrt(s), rot: (Math.atan2(vy, vx) * 180) / Math.PI, a: 1 };
    }
    const q = 1 - springAt(SP085, t - t1 - HOLD);
    return { x: pd.x, y: pd.y + pd.r * 0.1 * q, r: pd.r, sx: 1 + 0.08 * q, sy: 1 - 0.1 * q, rot: 0, a: 1 };
  }

  function renderCovers(t) {
    // Inside Feel.'s full stop (the camera dived into it): flat clay that thins away as the sphere's close-up resolves
    const sOn = t >= T.c4 && t < T.c4 + 0.12;
    attr(D.swallow, { visibility: sOn ? "visible" : "hidden", cx: 960, cy: 540, r: 1200, "fill-opacity": r2(1 - e("power1.out", seg(t, T.c4, T.c4 + 0.12))) });
    // paper iris opens from the zero's dot (12.75–13.0)
    const iOn = t >= V.c6.drop && t < T.c7;
    attr(D.iris, { visibility: iOn ? "visible" : "hidden", cx: DOT6.x, cy: DOT6.y, r: r2(irisR(t)) });
    const dOn = t >= V.c5.lock;
    attr(D.dot6, { visibility: dOn ? "visible" : "hidden" });
    if (dOn) {
      const p = dotPose(t);
      attr(D.dot6, { rx: r2(p.r), ry: r2(p.r), transform: poseT(p), "fill-opacity": r2(p.a) });
    }
    // selection box: the tool has the dot selected
    const sel = e("power3.out", seg(t, 14.15, 14.4));
    attr(D.sel, { visibility: sel > 0 ? "visible" : "hidden" });
    if (sel > 0) {
      const pd = D.period, hs = (pd.r + 14) * lerp(1.25, 1, sel);
      attr(D.selBox, { x: r2(pd.x - hs), y: r2(pd.y - hs), width: r2(2 * hs), height: r2(2 * hs), "stroke-opacity": r2(sel) });
      D.selHandles.forEach((hd, i) => attr(hd, { x: r2(pd.x + (i % 2 ? hs : -hs) - 5.5), y: r2(pd.y + (i < 2 ? -hs : hs) - 5.5), opacity: r2(sel) }));
    }
  }

  function renderLockup(t) {
    const on = t >= T.c7;
    show(D.c7, on);
    if (!on) return;
    D.name.forEach((g, i) => {
      const v = springAt(SP085, t - (T.c7 + 0.04 * i));
      g.style.transform = `translate(0px, ${r2(330 * (1 - v))}px)`;
    });
    const t0 = V.c7.subtitle, per = 0.018;
    D.sub.forEach((g, i) => (g.style.visibility = t >= t0 + per * i ? "visible" : "hidden"));
    const typed = clamp(Math.floor((t - t0) / per) + 1, 0, D.sub.length);
    const blink = t < t0 + per * D.sub.length || Math.floor((t - t0) / 0.2) % 2 === 0;
    setS(D.cursor, { left: r2(D.subX[typed] + 2) + "px", visibility: t >= t0 && t < PULL[0] + 0.3 && blink ? "visible" : "hidden" });
    const ut = e("power2.out", seg(t, V.c7.tagline, V.c7.tagline + 0.4));
    setS(D.tag, { opacity: r2(ut), transform: `translate(0px, ${r2(14 * (1 - ut))}px)` });
    D.insXY.textContent = `X ${Math.round(D.period.x)}   Y ${Math.round(D.period.y)}`;
  }

  function renderClose(t) {
    const on = t >= PULL[0];
    show(D.tool, on);
    show(D.toolbg, on);
    const c = closeCam(t);
    D.artboard.style.transform = on ? `matrix(${r2(c.s * 10000) / 10000},0,0,${r2(c.s * 10000) / 10000},${r2(c.tx)},${r2(c.ty)})` : "none";
    if (!on) return;
    const m = `matrix(${r2(c.ts * 10000) / 10000},0,0,${r2(c.ts * 10000) / 10000},${r2(c.ttx)},${r2(c.tty)})`;
    D.tool.style.transform = m;
    D.toolbg.style.transform = m;
    const x = TLX0 + t * PXS;
    attr(D.playhead, { transform: `translate(${r2(x)} 0)` });
    attr(D.playedRect, { width: r2(x - TLX0) });
  }

  function renderHUD(t) {
    const fgAt = (x, y) => (inkAt(t, x, y) ? P.paper : P.ink);
    const muAt = (x, y) => (inkAt(t, x, y) ? P.mutedPaper : P.mutedInk);
    const close = closeCam(t);
    const fade = 1 - e("power2.out", seg(t, PULL[0], PULL[0] + 0.2));
    // TL: name + reel
    setS(D.tl, { color: fgAt(180, 90), opacity: r2(fade) });
    D.hudSub.style.color = muAt(180, 110);
    // TR: timecode (flies into the tool's timeline header), beat squares
    const f = Math.min(899, Math.floor(frameOf(t) + 1e-6));
    const tc = `00:00:${String(Math.floor(f / 60)).padStart(2, "0")}:${String(f % 60).padStart(2, "0")}`;
    if (D.tc.textContent !== tc) D.tc.textContent = tc;
    const trCol = fgAt(1740, 70);
    D.tr.style.color = trCol;
    D.bpm.style.color = muAt(1700, 110);
    D.bpm.style.opacity = r2(fade);
    const b = Math.floor(t / 0.5 + 1e-6), lit = (((b - 2) % 4) + 4) % 4, since = t - b * 0.5;
    D.sqs.forEach((q, i) => {
      const on = i === lit;
      const a = on ? 0.35 + 0.65 * Math.exp(-since / 0.12) : 0;
      setS(q, { background: on ? rgba(P.clay, r2(a)) : "transparent", border: `1.5px solid ${on ? P.clay : trCol}`, opacity: r2((on ? 1 : 0.45) * fade) });
    });
    if (close.u > 0) {
      // fly toward the slot as it zooms in with the tool, but never past the frame edge (no crossing the artboard)
      const tx = close.ttx + close.ts * D.tcSlot.x, ty = close.tty + close.ts * D.tcSlot.y;
      const fx = Math.min(lerp(D.tcHome.x, tx, close.u), D.tcSlot.x), fy = Math.max(lerp(D.tcHome.y, ty, close.u), D.tcSlot.y);
      D.tc.style.transform = `translate(${r2(fx - D.tcHome.x)}px, ${r2(fy - D.tcHome.y)}px)`;
      D.tc.style.color = mixHex(P.ink, P.paper, close.u);
    } else {
      D.tc.style.transform = "none";
      D.tc.style.color = ""; // inherit the HUD colour again (every property set in one branch is reset in the other)
    }
    // BL: chapter index + title, rolling on each chapter boundary
    setS(D.bl, { color: fgAt(300, 990), opacity: r2(fade) });
    CH.forEach((c, i) => {
      const box = D.chaps[i];
      const inn = i === 0 ? 1 : e("power3.out", seg(t, c.start, c.start + 0.22));
      const outp = i === CH.length - 1 ? 0 : e("power2.in", seg(t, c.end - 0.12, c.end));
      const vis = t >= (i === 0 ? -1 : c.start) && t < c.end + (i === CH.length - 1 ? 1 : 0);
      box.style.visibility = vis ? "visible" : "hidden";
      if (vis) setS(box, { opacity: r2(inn * (1 - outp)), transform: `translate(0px, ${r2(30 * (1 - inn) - 24 * outp)}px)` });
    });
    // BR: the live ease curve with its playhead; flies into the inspector at the close
    const brCol = fgAt(1706, 950);
    D.br.style.color = brCol;
    D.ease.style.opacity = r2(fade);
    let cur = SEGS.findIndex((s) => t >= s.t0 && t < s.t1);
    if (cur < 0) cur = SEGS.length - 1;
    const sgm = SEGS[cur];
    const label = `ease · ${sgm.name}`;
    if (D.ease.textContent !== label) D.ease.textContent = label;
    D.ease.style.color = muAt(1706, 850);
    const stroke = close.u > 0 ? mixHex(P.ink, P.paper, close.u) : brCol;
    attr(D.axes, { stroke });
    attr(D.one, { stroke });
    attr(D.vline, { stroke });
    D.segPaths.forEach((sp, i) => {
      const s = SEGS[i];
      let a = 0, draw = 1;
      if (i === cur) {
        draw = i === 0 ? 1 : e("power2.out", seg(t, s.t0, s.t0 + 0.22));
        a = 1;
      } else if (i === cur - 1) a = 1 - seg(t, s.t1, s.t1 + 0.1);
      attr(sp.p, { visibility: a > 0 ? "visible" : "hidden", stroke, "stroke-opacity": r2(a), "stroke-dashoffset": r2(sp.L * (1 - draw)) });
    });
    const u = seg(t, sgm.t0, sgm.t1);
    const hx = cvx(u), hy = cvy(sgm.fn(u));
    attr(D.head, { cx: r2(hx), cy: r2(hy) });
    attr(D.vline, { x1: r2(hx), x2: r2(hx) });
    if (close.u > 0) {
      const sl = D.curveSlot;
      const tx = close.ttx + close.ts * sl.x, ty = close.tty + close.ts * sl.y;
      const sc = lerp(1, sl.s * close.ts, close.u);
      const fx = Math.min(lerp(D.curveHome.x, tx, close.u), 1900 - 300 * sc), fy = clamp(lerp(D.curveHome.y, ty, close.u), 60, 1060 - 150 * sc);
      D.curve.style.transform = `translate(${r2(fx - D.curveHome.x)}px, ${r2(fy - D.curveHome.y)}px) scale(${r2(sc * 1000) / 1000})`;
    } else D.curve.style.transform = "none";
  }

  function renderGrain(t) {
    // grain stepped "on threes" (a new offset every 3rd frame, 20 Hz): reads as film, costs a third of the bits
    const h = hash(Math.floor(frameOf(t) / 3 + 1e-6) + 17);
    D.grain.style.backgroundPosition = `${h % 512}px ${(h >>> 9) % 512}px`;
  }

  let lastT = -1;
  function renderAt(t) {
    t = clamp(+t || 0, 0, CUES.duration);
    if (t === lastT || !gl) return;
    lastT = t;
    renderWorld(t);
    renderBall(t);
    renderGL(t);
    renderType(t);
    renderField(t);
    renderChart(t);
    renderCovers(t);
    renderLockup(t);
    renderClose(t);
    renderHUD(t);
    renderGrain(t);
  }

  // ================================================================== build + register
  const stage = (s) => window.__REEL_DEBUG && console.log("reel:", s);
  async function build() {
    stage("fonts");
    await Promise.all([
      document.fonts.load('320px "Fraunces"'),
      document.fonts.load('italic 40px "Fraunces"'),
      document.fonts.load('18px "JetBrains Mono"'),
      document.fonts.load('bold 18px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
    stage("three");
    const THREE = await window.__THREE;
    stage("dom");
    Object.assign(D, {
      bg: $("bg"), cam: $("cam"), c1: $("c1"), c3: $("c3"), c6: $("c6"), c7: $("c7"), gl: $("gl"), field: $("field"),
      tool: $("tool"), toolbg: $("toolbg"), artboard: $("artboard"), grain: $("grain"),
    });
    D.ctx = D.field.getContext("2d");
    buildGrid();
    buildBall();
    buildType();
    buildParticles();
    buildChart();
    buildLockup();
    buildCovers();
    buildHUD();
    buildTool();
    buildGrain();
    // HUD flight homes (layout positions, unscaled)
    const k = scaleOf(), rr = ROOT.getBoundingClientRect();
    const home = (n) => {
      const b = n.getBoundingClientRect();
      return { x: (b.left - rr.left) / k, y: (b.top - rr.top) / k };
    };
    D.tcHome = home(D.tc);
    D.curveHome = home(D.curve);
    D.insSize.textContent = `${Math.round(D.period.r * 2)} × ${Math.round(D.period.r * 2)} px`;
    stage("gl");
    gl = window.GLReel(THREE, D.gl, Object.assign({}, P, {
      depth: { start: T.c4, contacts: V.c4.contacts, dollyEnd: V.c4.dollyEnd, orbitEnd: 8.8, implode: V.c4.implode, end: T.c5 },
    }));
    stage("timeline");
    const tl = gsap.timeline({ paused: true });
    const clock = { t: 0 };
    tl.fromTo(clock, { t: 0 }, { t: CUES.duration, duration: CUES.duration, ease: "none", onUpdate: () => renderAt(clock.t) }, 0);
    renderAt(0);
    window.__reel = { renderAt, D, ballPose, gooState, dotPose };
    return { tl }; // wrapped: a GSAP timeline is a thenable, and an async function would wait for it to finish playing
  }
  window.addEventListener("hf-seek", (ev) => renderAt(ev.detail.time));
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__reelBuild = build; // index.html awaits it and registers the timeline
})();
