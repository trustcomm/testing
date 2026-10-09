// Flow State — the picture. Canvas 2D, deterministic: renderFrame(f) draws frame f from nothing but f.
//
// Layers per frame:
//   far light  — every element floating above the water; mirrored in the water about the horizon
//   text       — thin sans + italic-serif keyword lines, and the end card (also mirrored)
//   near light — things on or over the foreground water (the drop, its splash, the glitter pillar); they draw their own reflections
// Composite: background → water reflection strips → light → bloom (three blurred mip levels) → text → vignette → grain.
(function () {
  "use strict";
  const { TAU, clamp, lerp, inv, E, spring, rng, gauss, hash, noise1, rgba, mixc } = window.L;
  const TL = window.TL;
  const { W, H, HORIZON, FPS } = TL;
  const CX = 540, CY = 820, WATER = 1290, RD = 700, GOLD = 2.399963229728653, SH = 0.5; // SH: shutter (frames)
  const C = { aqua: "#8FF4E8", aquaS: "#4FD1C5", lilac: "#B8A6FF", pearl: "#F6E7C8", moon: "#EEF6F4", mist: "#8FA3A6", white: "#FFFFFF" };

  // ---------------------------------------------------------------- canvases
  const mk = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const out = document.getElementById("film");
  const O = out.getContext("2d", { alpha: false });
  const lightC = mk(W, H), LX = lightC.getContext("2d");
  const textC = mk(W, H), TX = textC.getContext("2d");
  const reflS = mk(W / 2, RD / 2), RS = reflS.getContext("2d");
  const reflB = mk(W / 2, RD / 2), RB = reflB.getContext("2d");
  const b1 = mk(540, 960), B1 = b1.getContext("2d");
  const b1b = mk(540, 960), B1B = b1b.getContext("2d");
  const b2 = mk(270, 480), B2 = b2.getContext("2d");
  const b2b = mk(270, 480), B2B = b2b.getContext("2d");
  const b3 = mk(135, 240), B3 = b3.getContext("2d");
  const b3b = mk(135, 240), B3B = b3b.getContext("2d");
  const scr = mk(W, 320), SX = scr.getContext("2d");
  for (const c of [O, LX, TX, RS, RB, B1, B1B, B2, B2B, B3, B3B, SX]) {
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
  }

  // ---------------------------------------------------------------- sprites, batches, helpers
  function glowSprite(col, size = 128, k = 4.2) {
    const c = mk(size, size), g = c.getContext("2d"), h = size / 2;
    const gr = g.createRadialGradient(h, h, 0, h, h, h);
    for (let i = 0; i <= 20; i++) {
      const r = i / 20;
      gr.addColorStop(r, rgba(col, Math.exp(-k * r * r) * (1 - r * r)));
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const SPR = { white: glowSprite(C.white), aqua: glowSprite(C.aqua), aquaS: glowSprite(C.aquaS), lilac: glowSprite(C.lilac), pearl: glowSprite(C.pearl) };
  function glow(ctx, spr, x, y, r, a, sy = 1) {
    if (!(a > 0.003) || !(r > 0.3)) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(spr, x - r, y - r * sy, 2 * r, 2 * r * sy);
    ctx.globalAlpha = 1;
  }
  // a line from tail (x0,y0) to head (x1,y1), transparent at the tail
  function comet(ctx, x0, y0, x1, y1, w, col, a) {
    if (!(a > 0.003)) return;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(1, rgba(col, a));
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 + (x1 === x0 && y1 === y0 ? 0.01 : 0), y1);
    ctx.stroke();
  }
  // a line that fades out at both ends
  function beam(ctx, x0, y0, x1, y1, w, col, a, mid = 0.5) {
    if (!(a > 0.003)) return;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(mid, rgba(col, a));
    g.addColorStop(1, rgba(col, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  function ring(ctx, x, y, r, sy, a0, a1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, sy);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.01, r), a0, a1);
    ctx.restore();
  }

  // Many small round-capped segments, grouped by colour / width / alpha bucket so a frame is a few dozen stroke() calls.
  // A streak's alpha is scaled by w/(w+len): motion blur spreads the same light over a longer path.
  class Batch {
    constructor() {
      this.m = new Map();
    }
    seg(x0, y0, x1, y1, w, a, col, norm = true) {
      if (!(a > 0.003) || !(w > 0.05)) return;
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 0.05) x1 = x0 + 0.05;
      else if (norm) a *= w / (w + len * 0.8);
      const ai = Math.round(clamp(a) * 48);
      if (ai < 1) return;
      const wi = Math.max(1, Math.round(w * 4));
      const key = col + "|" + wi + "|" + ai;
      let arr = this.m.get(key);
      if (!arr) this.m.set(key, (arr = []));
      arr.push(x0, y0, x1, y1);
    }
    flush(ctx) {
      ctx.lineCap = "round";
      for (const [key, arr] of this.m) {
        const [col, wi, ai] = key.split("|");
        ctx.strokeStyle = col;
        ctx.lineWidth = +wi / 4;
        ctx.globalAlpha = +ai / 48;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 4) {
          ctx.moveTo(arr[i], arr[i + 1]);
          ctx.lineTo(arr[i + 2], arr[i + 3]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      this.m.clear();
    }
  }
  const BAT = new Batch();
  const hexs = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const RAMP = (a, b, n = 8) => Array.from({ length: n }, (_, i) => hexs(mixc(a, b, i / (n - 1))));
  const AQ2LI = RAMP(C.aqua, C.lilac);
  const AQ2WH = RAMP(C.aqua, C.white);
  const ramp = (r, t) => r[Math.round(clamp(t) * (r.length - 1))];

  // Glow list: extra light drawn only into the bloom input (half-res), never into the crisp layers.
  const GL = [];

  // ---------------------------------------------------------------- background
  const bgStatic = mk(W, H);
  {
    const g = bgStatic.getContext("2d");
    let gr = g.createLinearGradient(0, 0, 0, HORIZON);
    gr.addColorStop(0, "#020406");
    gr.addColorStop(0.5, "#03080b");
    gr.addColorStop(0.86, "#061115");
    gr.addColorStop(1, "#0b1c20");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, HORIZON);
    gr = g.createLinearGradient(0, HORIZON, 0, H);
    gr.addColorStop(0, "#081619");
    gr.addColorStop(0.18, "#050d10");
    gr.addColorStop(1, "#020405");
    g.fillStyle = gr;
    g.fillRect(0, HORIZON, W, H - HORIZON);
  }
  const vig = mk(W, H);
  {
    const g = vig.getContext("2d");
    const gr = g.createRadialGradient(CX, 900, 360, CX, 900, 1280);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(0.55, "rgba(0,0,0,0.16)");
    gr.addColorStop(1, "rgba(0,0,0,0.62)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  const HAZE = [
    [0, C.aquaS], [700, C.aquaS], [800, C.lilac], [932, C.lilac], [1004, C.aquaS], [1326, C.aquaS], [1350, C.pearl], [1824, C.pearl],
  ];
  function hazeCol(f) {
    for (let i = 1; i < HAZE.length; i++) {
      if (f <= HAZE[i][0]) {
        const [f0, c0] = HAZE[i - 1], [f1, c1] = HAZE[i];
        return mixc(c0, c1, E.inOutSine(inv(f0, f1, f)));
      }
    }
    return mixc(C.pearl, C.pearl, 0);
  }
  const ignite = (df) => 1 - Math.exp(-(df + 0.5) / 1.1); // ≈ 36 % → 74 % → 90 % over the first frames
  const pulse = (f, at, tau, amp) => (f >= at ? amp * ignite(f - at) * Math.exp(-(f - at) / tau) : 0);
  function hazeLvl(f) {
    let k = 0.85 * E.inOutSine(inv(0, 70, f));
    k += pulse(f, TL.DROP.impact, 22, 1.3);
    k += 0.25 * inv(768, 860, f) * (1 - inv(930, 1000, f));
    k += 0.3 * E.inExpo(inv(1296, 1344, f)) * (f < 1344 ? 1 : 0);
    k += pulse(f, TL.SHINE.flare, 16, 1.8) + (f >= 1344 ? 0.9 * (1 - 0.6 * E.inOutSine(inv(1470, 1560, f))) : 0);
    k += pulse(f, TL.END.name, 30, 0.35) + pulse(f, TL.END.splash, 24, 0.45);
    return k;
  }

  const SHIM = (() => {
    const r = rng(23), rows = [];
    for (let i = 0; i < 70; i++) {
      const z = (i + 0.5) / 70;
      const dashes = [];
      const n = 3 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) dashes.push({ x: r(), sp: (r() - 0.5) * 0.01, len: r(), ph: r() * 50 });
      rows.push({ y: HORIZON + 5 + 735 * Math.pow(z, 1.6), z, dashes });
    }
    return rows;
  })();

  function drawBG(f) {
    const t = f / FPS;
    O.globalCompositeOperation = "source-over";
    O.globalAlpha = 1;
    O.drawImage(bgStatic, 0, 0);
    const col = hazeCol(f), k = hazeLvl(f);
    O.globalCompositeOperation = "lighter";
    let g = O.createRadialGradient(CX, CY, 0, CX, CY, 840);
    g.addColorStop(0, rgba(col, 0.046 * k));
    g.addColorStop(0.4, rgba(col, 0.019 * k));
    g.addColorStop(1, rgba(col, 0));
    O.fillStyle = g;
    O.fillRect(0, 0, W, HORIZON);
    g = O.createRadialGradient(CX, 2 * HORIZON - CY, 0, CX, 2 * HORIZON - CY, 720);
    g.addColorStop(0, rgba(col, 0.03 * k));
    g.addColorStop(1, rgba(col, 0));
    O.fillStyle = g;
    O.fillRect(0, HORIZON, W, H - HORIZON);
    O.save();
    O.translate(CX, HORIZON);
    O.scale(1, 0.12);
    g = O.createRadialGradient(0, 0, 0, 0, 0, 800);
    g.addColorStop(0, rgba(col, 0.19 * k));
    g.addColorStop(0.45, rgba(col, 0.055 * k));
    g.addColorStop(1, rgba(col, 0));
    O.fillStyle = g;
    O.fillRect(-800, -800, 1600, 1600);
    O.restore();
    // water shimmer: faint skylight caught by the swell
    const sc = hexs(mixc(col, C.moon, 0.4));
    const kk = 0.6 + 0.4 * Math.min(2.2, k);
    for (const row of SHIM) {
      const h = 0.7 + 1.7 * row.z;
      for (const d of row.dashes) {
        const x = ((((d.x + d.sp * t) % 1) + 1) % 1) * (W + 320) - 160;
        const len = (20 + 150 * row.z) * (0.45 + d.len);
        const a = (0.018 + 0.045 * (1 - row.z)) * (0.5 + 0.5 * noise1(t * 0.7 + d.ph, 5)) * kk * (0.5 + 0.9 * Math.exp(-(((x - CX) / 380) ** 2)));
        BAT.seg(x - len / 2, row.y, x + len / 2, row.y, h, a, sc, false);
      }
    }
    BAT.flush(O);
  }

  // ---------------------------------------------------------------- ambient motes (far)
  const MOTES = (() => {
    const r = rng(11);
    return Array.from({ length: 96 }, (_, i) => ({
      x: r() * 1200 - 60, y: 40 + r() * 1140, vx: (r() - 0.5) * 9, vy: -(2.5 + r() * 8), s: 0.9 + r() * r() * 2.2, a: 0.05 + r() * 0.2,
      tw: 0.25 + r() * 0.9, ph: r() * 100, bokeh: i < 18, br: 6 + r() * 9,
    }));
  })();
  function motePos(m, t) {
    let x = m.x + m.vx * t + 18 * noise1(t * 0.13 + m.ph, 3);
    let y = m.y + m.vy * t + 6 * noise1(t * 0.11 + m.ph, 4);
    x = ((((x + 60) % 1200) + 1200) % 1200) - 60;
    y = ((((y - 40) % 1140) + 1140) % 1140) + 40;
    return [x, y];
  }
  function drawMotes(ctx, f) {
    const t = f / FPS;
    const k = E.inOutSine(inv(0, 90, f)) * (1 + 0.7 * (f >= 1344 ? Math.exp(-(f - 1344) / 90) : 0));
    for (const m of MOTES) {
      const [x, y] = motePos(m, t);
      const [x0, y0] = motePos(m, t - SH / FPS);
      const edge = Math.min(inv(40, 140, y), inv(1180, 1080, y), inv(-60, 20, x), inv(1140, 1060, x));
      const tw = 0.6 + 0.4 * Math.sin(TAU * m.tw * t + m.ph);
      const a = m.a * tw * edge * k;
      if (m.bokeh) glow(ctx, SPR.aquaS, x, y, m.br, a * 0.32);
      else BAT.seg(x0, y0, x, y, m.s, a, m.s > 2 ? C.aqua : C.moon);
    }
    BAT.flush(ctx);
  }

  // ---------------------------------------------------------------- 01 the drop (near)
  const DR = TL.DROP;
  const GLX = CX, GLY = 690;
  const fallY = (f) => {
    const tau = Math.max(0, f - DR.fall) / FPS;
    return GLY + 3750 * tau * tau; // g = 7500 px/s²: lands on the water (y 1290) exactly at the impact frame
  };
  const CONV = (() => {
    const r = rng(31);
    return Array.from({ length: 16 }, () => ({ a0: r() * TAU, r0: 140 + r() * 190, d: Math.floor(r() * 16), sw: 1.1 + r() * 1.5, w: 1.1 + r() * 1.1 }));
  })();
  function convPos(m, f) {
    const p = E.inOutCubic(inv(20 + m.d, 66, f));
    const r = m.r0 * (1 - p), a = m.a0 + m.sw * p;
    return [GLX + r * Math.cos(a), GLY + r * 0.78 * Math.sin(a), p];
  }
  const GD = 4000; // droplet gravity
  const CROWN = (() => {
    const r = rng(41), land = [150, 156, 160, 166, 171, 178], c = [];
    land.forEach((L, i) => c.push({ th: (i / 6) * TAU + 0.5 + r() * 0.5, vr: 60 + r() * 90, T: (L - DR.impact) / FPS, w: 2.4 + r() * 1.0, big: true }));
    for (let i = 0; i < 12; i++) c.push({ th: r() * TAU, vr: 130 + r() * 170, T: (3 + r() * 8) / FPS, w: 1.3 + r() * 0.7, big: false });
    return c;
  })();
  function crownPos(c, tau) {
    const vUp = (GD * c.T) / 2;
    const tt = Math.min(tau, c.T);
    const h = Math.max(0, vUp * tt - (GD * tt * tt) / 2);
    const rr = c.vr * tt;
    return [CX + rr * Math.cos(c.th), WATER + 0.18 * rr * Math.sin(c.th), h];
  }
  function jetH(f) {
    if (f < 146 || f > 178) return 0;
    if (f < 161) return 150 * Math.pow(Math.sin((Math.PI / 2) * inv(146, 161, f)), 0.8);
    return 150 * (1 - E.inCubic(inv(161, 178, f)));
  }
  const jetTip = (f) => {
    const tau = (f - 161) / FPS;
    return 150 + 473 * tau - 2000 * tau * tau; // detaches at 161, lands at 186
  };
  // ripple rings on the foreground water for small landings
  function waterRing(ctx, x, y, r, a, lw = 1.2, col = C.aqua) {
    if (a < 0.004) return;
    ring(ctx, x, y, r, 0.18, 0, TAU);
    ctx.lineWidth = lw;
    ctx.strokeStyle = rgba(col, a);
    ctx.stroke();
  }

  function drawDrop(ctx, f) {
    // light gathers into a point
    if (f >= 20 && f <= 68) {
      for (const m of CONV) {
        const [x, y, p] = convPos(m, f);
        const [x0, y0] = convPos(m, f - 1.5);
        const a = 0.75 * Math.pow(Math.sin(Math.PI * p), 0.6) * inv(20 + m.d, 30 + m.d, f);
        BAT.seg(x0, y0, x, y, m.w, a, C.aqua, false);
      }
      BAT.flush(ctx);
    }
    // the hanging drop, then the fall
    if (f >= 64 && f < DR.impact) {
      const s = Math.max(0, spring((f - 66) / FPS, 2.4, 0.5));
      const sw = inv(66, 120, f);
      const r = (2.4 + 1.5 * sw) * Math.min(1.25, s);
      if (f < DR.fall) {
        const st = 1 + 0.75 * E.inQuad(inv(96, 120, f));
        glow(ctx, SPR.aqua, GLX, GLY, (38 + 10 * sw) * s, 0.55);
        glow(ctx, SPR.white, GLX, GLY, 13 * s, 0.75);
        const fl = Math.min(1, s) * (1 - inv(106, 120, f));
        beam(ctx, GLX - 190 * fl, GLY, GLX + 190 * fl, GLY, 1.3, C.aqua, 0.42 * fl);
        beam(ctx, GLX, GLY - 34 * fl, GLX, GLY + 34 * fl, 1.0, C.aqua, 0.3 * fl);
        ctx.fillStyle = rgba(C.white, 0.96);
        ctx.beginPath();
        ctx.ellipse(GLX, GLY + r * (st - 1) * 0.7, r, r * st, 0, 0, TAU);
        ctx.fill();
        GL.push((g) => glow(g, SPR.aqua, GLX, GLY, 30 * s, 0.5));
      } else {
        const y = fallY(f), y0 = fallY(Math.max(DR.fall, f - 1));
        glow(ctx, SPR.aqua, GLX, y, 26, 0.5);
        comet(ctx, GLX, y0 - 4, GLX, y, r * 1.7, C.white, 0.95);
        glow(ctx, SPR.white, GLX, y, 9, 0.8);
        // its reflection rises to meet it (mirrored about the impact point)
        const yr = 2 * WATER - y, yr0 = 2 * WATER - y0;
        const ra = 0.42 * Math.pow(clamp(1 - (yr - WATER) / 520), 1.4);
        comet(ctx, GLX, yr0 + 4, GLX, yr, r * 1.7, C.aqua, ra);
        glow(ctx, SPR.aqua, GLX, yr, 16, ra * 0.8);
      }
    }
    if (f < DR.impact) return;
    const tau = (f - DR.impact) / FPS;
    // impact flash
    if (tau < 1.6) {
      const k = ignite(tau * FPS) * Math.exp(-tau / 0.1);
      glow(ctx, SPR.white, CX, WATER, 60 + 150 * (1 - Math.exp(-tau / 0.05)), 0.95 * k, 0.2);
      glow(ctx, SPR.aqua, CX, WATER, 60 + 320 * (1 - Math.exp(-tau / 0.12)), 0.55 * Math.exp(-tau / 0.3), 0.18);
      comet(ctx, CX, WATER, CX, WATER - 280 * k, 2.2, C.white, 0.7 * k);
      comet(ctx, CX, WATER, CX, WATER + 200 * k, 2.0, C.aqua, 0.35 * k);
      beam(ctx, CX - 420 * (1 - k * 0.5), WATER, CX + 420 * (1 - k * 0.5), WATER, 1.4, C.aqua, 0.5 * Math.exp(-tau / 0.22));
    }
    // crown droplets
    if (tau < 1.4) {
      for (const c of CROWN) {
        if (tau < c.T) {
          const [x, yw, h] = crownPos(c, tau);
          const [x0, yw0, h0] = crownPos(c, Math.max(0, tau - SH / FPS));
          BAT.seg(x0, yw0 - h0, x, yw - h, c.w, 0.95, C.white);
          BAT.seg(x0, yw0 + h0, x, yw + h, c.w, 0.3, C.aqua);
        } else {
          const [x, yw] = crownPos(c, c.T);
          const age = tau - c.T;
          waterRing(ctx, x, yw, 2 + (c.big ? 30 : 14) * (1 - Math.exp(-age / 0.22)), (c.big ? 0.55 : 0.3) * Math.exp(-age / 0.3));
        }
      }
      BAT.flush(ctx);
    }
    // Worthington jet and its tip droplet
    const h = jetH(f);
    if (h > 0.5) {
      comet(ctx, CX, WATER + 2, CX, WATER - h, 6, C.aqua, 0.35);
      comet(ctx, CX, WATER + 2, CX, WATER - h, 2.4, C.white, 0.9);
      comet(ctx, CX, WATER - 2, CX, WATER + h * 0.9, 2.4, C.aqua, 0.28);
      if (f < 161) glow(ctx, SPR.white, CX, WATER - h, 9, 0.6);
    }
    if (f >= 161 && f < 186) {
      const y = WATER - jetTip(f), y0 = WATER - jetTip(Math.max(161, f - SH));
      BAT.seg(CX, y0, CX, y, 3.2, 1, C.white);
      BAT.seg(CX, 2 * WATER - y0, CX, 2 * WATER - y, 3.2, 0.32, C.aqua);
      BAT.flush(ctx);
      glow(ctx, SPR.white, CX, y, 8, 0.55);
    }
    if (f >= 186 && f < 260) {
      const age = (f - 186) / FPS;
      waterRing(ctx, CX, WATER, 3 + 46 * (1 - Math.exp(-age / 0.25)), 0.6 * Math.exp(-age / 0.32));
      glow(ctx, SPR.white, CX, WATER, 40, 0.5 * Math.exp(-age / 0.06), 0.25);
    }
  }

  // ---------------------------------------------------------------- 02 ripples → standing rings (far)
  const RR = [330, 285, 240, 195, 150, 105, 60];
  const PHV = Math.asin(0.18);
  function ringR(k, f) {
    const age = (f - TL.RINGS[k]) / FPS;
    return age <= 0 ? 0 : RR[k] * (1 - Math.exp(-age / 0.55));
  }
  const ringU = (k, f) => E.inOutCubic(inv(TL.TILT[0] + 3 * k, TL.TILT[0] + 3 * k + 78, f));
  const ringHi = (k, t) => k * 1.7 + (k % 2 ? -1 : 1) * (0.75 + 0.12 * k) * t;
  const ringRot = (k, t) => (k % 2 ? 1 : -1) * 0.1 * t;
  function drawRings(ctx, f) {
    const K = f >= TL.TILT[0] && f <= TL.TILT[1] + 2 ? 4 : 1;
    for (let i = 0; i < K; i++) drawRingsAt(ctx, f - (K > 1 ? (SH * i) / (K - 1) : 0), 1 / K);
  }
  function drawRingsAt(ctx, f, am) {
    if (f < TL.RINGS[0] || f > 388) return;
    const t = f / FPS, dotting = E.inOutSine(inv(356, 384, f));
    for (let k = 0; k < 7; k++) {
      const r = ringR(k, f);
      if (r < 0.5) continue;
      const u = ringU(k, f);
      const cy = lerp(WATER, CY, u), sy = Math.sin(PHV + (Math.PI / 2 - PHV) * u);
      const birth = inv(TL.RINGS[k], TL.RINGS[k] + 5, f);
      const a = lerp(0.85 * (1 - 0.42 * (r / RR[k])), 0.62, u) * birth * (1 - dotting) * am;
      if (a < 0.004) continue;
      ring(ctx, CX, cy, r, sy, 0, TAU);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(C.aqua, a);
      ctx.stroke();
      const hi = ringHi(k, t);
      for (const [span, al, lw] of [[0.6, 0.3, 2.0], [0.32, 0.5, 2.3], [0.13, 0.9, 2.7]]) {
        ring(ctx, CX, cy, r, sy, hi - span, hi + span);
        ctx.lineWidth = lw;
        ctx.strokeStyle = rgba(C.white, al * a);
        ctx.stroke();
      }
    }
  }

  // ---------------------------------------------------------------- 02–05 the particle river (far)
  // One set of particles carries the film from the rings to the flower: rings → noise → calm lines → ribbon → bud → petals → tips.
  const PT = [];
  RR.forEach((R, k) => {
    const n = Math.round(R * 0.55);
    for (let j = 0; j < n; j++) PT.push({ k, a: (TAU * j) / n + k * 0.37 });
  });
  const NP = PT.length;
  const DRIFT = 140, T_REF = 522 / FPS, T_A = 640 / FPS, T_B = 700 / FPS;
  function drift(t) {
    if (t <= T_A) return DRIFT * (t - T_REF);
    const base = DRIFT * (T_A - T_REF), span = T_B - T_A;
    if (t >= T_B) return base + DRIFT * span * 0.5;
    const u = (t - T_A) / span;
    return base + DRIFT * span * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
  }
  function ribbonY(j, x, t, f) {
    const sp = lerp(40, 7, E.inOutCubic(inv(576, 660, f)));
    const A = 78 * E.inOutSine(inv(576, 652, f));
    const kx = TAU / 820, w = TAU * 0.42;
    return CY + (j - 4) * sp + A * Math.sin(kx * x - w * t + j * 0.16) + A * 0.28 * Math.sin(2.3 * kx * x - 1.6 * w * t + j * 0.3 + 1.1);
  }
  const wrapX = (x) => ((((x + 100) % 1280) + 1280) % 1280) - 100;
  function flowerAngle(t) {
    const T0 = 768 / FPS, w0 = 0.55, w1 = 0.05, td = 0.6;
    if (t <= T0) return w0 * t;
    const d = t - T0;
    return w0 * T0 + w1 * d + (w0 - w1) * td * (1 - Math.exp(-d / td));
  }
  const BUDC = 3.1;
  function budXY(n, t) {
    const a = n * GOLD + flowerAngle(t), r = BUDC * Math.sqrt(n + 0.5);
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }
  // petals: 0..7 outer, 8..15 inner
  const PETAL_N = [];
  function petalGeomRaw(p, f) {
    const outer = p < 8, i = p % 8;
    const F0 = outer ? TL.PETALS_OUT[i] : TL.PETALS_IN[i];
    const tau = (f - F0) / FPS;
    const o = spring(tau, outer ? 1.45 : 1.7, 0.6);
    const w = Math.max(0, spring(tau - 0.06, 1.3, 0.7));
    const ang = -Math.PI / 2 + (i * Math.PI) / 4 + (outer ? 0 : Math.PI / 8) + flowerAngle(f / FPS);
    return { L: (outer ? 300 : 192) * Math.max(0, o), HW: (outer ? 60 : 40) * w, ang, o, outer, F0, c: Math.cos(ang), s: Math.sin(ang) };
  }
  const PGC = new Map();
  function PG(p, f) {
    const key = p * 100000 + Math.round(f * 100);
    let g = PGC.get(key);
    if (!g) PGC.set(key, (g = petalGeomRaw(p, f)));
    return g;
  }
  function petalPoint(g, q) {
    const side = q < 0.5 ? 1 : -1, s = q < 0.5 ? q * 2 : 2 - q * 2;
    const along = s * g.L, across = side * g.HW * Math.pow(Math.sin(Math.PI * s), 0.85) * (1 - 0.28 * s);
    return [CX + along * g.c - across * g.s, CY + along * g.s + across * g.c];
  }
  const petalTip = (g) => [CX + g.L * g.c, CY + g.L * g.s];

  function initParticles() {
    const r = rng(53);
    for (const p of PT) {
      const u = Math.sqrt(r()), th = r() * TAU;
      p.sx = CX + 430 * u * Math.cos(th);
      p.sy = CY + 250 * u * Math.sin(th);
      p.ph = r() * 1000;
    }
    // calm lines: nine rows by height, ordered by x inside each row
    const byY = PT.slice().sort((a, b) => a.sy - b.sy);
    const per = Math.ceil(NP / 9);
    for (let j = 0; j < 9; j++) {
      const grp = byY.slice(j * per, (j + 1) * per).sort((a, b) => a.sx - b.sx);
      grp.forEach((p, m) => {
        p.line = j;
        p.slot = -100 + ((m + 0.5) / grp.length) * 1280;
      });
    }
    // bud: phyllotaxis index by distance from the ribbon centre once the drift has stopped
    const ranked = PT.map((p) => ({ p, d: Math.abs(wrapX(p.slot + drift(T_B)) - CX) + Math.abs(p.line - 4) * 6 })).sort((a, b) => a.d - b.d);
    ranked.forEach((e, n) => {
      e.p.n = n;
      e.p.dn = n / NP;
    });
    // petals: consecutive runs around the bud's angle, sized to each petal's outline length
    const order = [];
    for (let i = 0; i < 8; i++) {
      order.push({ p: i, a: -Math.PI / 2 + (i * Math.PI) / 4 });
      order.push({ p: 8 + i, a: -Math.PI / 2 + (i * Math.PI) / 4 + Math.PI / 8 });
    }
    const quota = order.map((o) => (o.p < 8 ? 59 : 37));
    const qs = quota.reduce((a, b) => a + b, 0);
    const scale = (NP - 2) / qs;
    let acc = 0;
    const runs = quota.map((q) => {
      const s0 = Math.round(acc);
      acc += q * scale;
      return [s0, Math.round(acc)];
    });
    const a0 = order[0].a - Math.PI / 8 - 0.0001; // start the sweep half a sector before petal 0
    const byA = PT.map((p) => {
      let a = (p.n * GOLD) % TAU;
      let d = (((a - a0) % TAU) + TAU) % TAU;
      return { p, d };
    }).sort((x, y) => x.d - y.d);
    PT.forEach((p) => (p.pet = -1));
    order.forEach((o, oi) => {
      const [s0, s1] = runs[oi];
      const grp = byA.slice(s0, s1).map((e) => e.p).sort((x, y) => x.n - y.n);
      const half = Math.ceil(grp.length / 2);
      grp.forEach((p, m) => {
        p.pet = o.p;
        const side = m % 2, rank = Math.floor(m / 2);
        const s = (rank + 0.5) / half;
        p.q = side ? 1 - s / 2 : s / 2;
        p.ps = s; // 0 at the petal base, 1 at the tip
      });
      PETAL_N[o.p] = grp.length;
    });
  }

  const PP = [0, 0];
  function pPos(p, f, o) {
    const t = f / FPS;
    const rr = ringR(p.k, f), ang = p.a + ringRot(p.k, t);
    let x = CX + rr * Math.cos(ang), y = CY + rr * Math.sin(ang);
    if (f > 384) {
      const sc = E.inOutCubic(inv(384, 444, f));
      const A = 13 * inv(384, 408, f) * (1 - E.inOutSine(inv(478, 552, f)));
      x = lerp(x, p.sx, sc) + A * noise1(f * 0.11 + p.ph, 1);
      y = lerp(y, p.sy, sc) + A * noise1(f * 0.12 + p.ph, 2);
      const sl = E.inOutCubic(inv(480, 564, f));
      if (sl > 0) {
        let xl = p.slot + drift(t);
        if (sl >= 1) xl = wrapX(xl);
        const yl = ribbonY(p.line, xl, t, f);
        x = lerp(x, xl, sl);
        y = lerp(y, yl, sl);
      }
    }
    if (f > 700) {
      const s = E.inOutCubic(inv(700 + 24 * (1 - p.dn), 768, f));
      if (s > 0) {
        const [bx, by] = budXY(p.n, t);
        let xx = lerp(x, bx, s) - CX, yy = lerp(y, by, s) - CY;
        const sw = 1.6 * Math.sin(Math.PI * s) * (120 / (120 + Math.hypot(xx, yy)));
        const cs = Math.cos(sw), sn = Math.sin(sw);
        x = CX + xx * cs - yy * sn;
        y = CY + xx * sn + yy * cs;
      }
    }
    if (f > 768 && p.pet >= 0) {
      const g = PG(p.pet, f);
      const s = E.inOutCubic(inv(g.F0 - 6, g.F0 + 22, f));
      if (s > 0) {
        const [qx, qy] = petalPoint(g, p.q);
        x = lerp(x, qx, s);
        y = lerp(y, qy, s);
      }
      const st = E.inOutCubic(inv(904 + (p.pet % 8) * 2, 940, f));
      if (st > 0) {
        const [tx, ty] = petalTip(g);
        x = lerp(x, tx, st);
        y = lerp(y, ty, st);
      }
    }
    o[0] = x;
    o[1] = y;
  }

  const sweepAt = (x, f) => {
    let b = 0;
    for (const F of TL.SWEEPS) {
      if (f < F - 2 || f > F + 46) continue;
      const xg = -160 + ((f - F) / 42) * 1400;
      b += Math.exp(-(((x - xg) / 75) ** 2));
    }
    return b;
  };

  function drawParticles(ctx, f) {
    if (f < 356 || f > 966) return;
    const t = f / FPS;
    const vis = E.inOutSine(inv(356, 384, f)) * (1 - E.inOutSine(inv(938, 964, f)));
    const P0 = [0, 0];
    const chaos = inv(384, 408, f) * (1 - E.inOutSine(inv(478, 552, f)));
    const thread = inv(520, 600, f) * (1 - inv(700, 726, f));
    const rows = thread > 0 ? Array.from({ length: 9 }, () => []) : null;
    for (let i = 0; i < NP; i++) {
      const p = PT[i];
      pPos(p, f, PP);
      pPos(p, f - SH, P0);
      const x = PP[0], y = PP[1];
      let a = 0.8, w = 2.0, col = C.aqua;
      if (f < 400) {
        const ang = p.a + ringRot(p.k, t);
        const hi = Math.cos(ang - ringHi(p.k, t));
        a *= 0.6 + 0.4 * Math.pow(Math.max(0, hi), 6) * (1 - inv(384, 400, f));
      }
      if (f > 384 && f < 700) {
        a = 0.92;
        w = 2.2;
      }
      if (chaos > 0) a *= 1 - 0.45 * chaos * hash(i, Math.floor(f / 3), 9);
      if (f > 600 && f < 724) {
        const b = sweepAt(x, f);
        if (b > 0.01) {
          a = Math.min(1, a + 0.5 * b);
          w += 1.3 * b;
          col = ramp(AQ2WH, b);
        }
      }
      if (f > 768 && p.pet >= 0) {
        const g = PG(p.pet, f);
        const s = E.inOutCubic(inv(g.F0 - 6, g.F0 + 22, f));
        col = ramp(AQ2LI, s * (0.25 + 0.75 * p.ps));
        w = 1.9;
        const st = inv(904, 944, f);
        if (st > 0) {
          col = ramp(AQ2WH, st);
          a = Math.min(1, a + 0.2 * st);
        }
      } else if (f > 700) w = lerp(2.0, 2.3, inv(700, 768, f));
      if (p.pet < 0 && f > 768) a *= 1 - inv(768, 800, f);
      BAT.seg(P0[0], P0[1], x, y, w, a * vis, col);
      if (rows) rows[p.line].push(x, y);
    }
    BAT.flush(ctx);
    if (rows) {
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = rgba(C.aqua, 0.24 * thread * vis);
      ctx.beginPath();
      for (const r of rows) {
        const idx = [];
        for (let i = 0; i < r.length; i += 2) idx.push(i);
        idx.sort((u, v) => r[u] - r[v]);
        for (let m = 1; m < idx.length; m++) {
          const i0 = idx[m - 1], i1 = idx[m];
          if (r[i1] - r[i0] > 46) continue;
          ctx.moveTo(r[i0], r[i0 + 1]);
          ctx.lineTo(r[i1], r[i1 + 1]);
        }
      }
      ctx.stroke();
    }
    // the ribbon's glint sweeps
    for (const F of TL.SWEEPS) {
      if (f < F || f > F + 44) continue;
      const xg = -160 + ((f - F) / 42) * 1400;
      const yg = ribbonY(4, wrapX(xg), t, f);
      glow(ctx, SPR.aqua, xg, yg, 110, 0.22);
      glow(ctx, SPR.white, xg, yg, 26, 0.35);
    }
  }

  // bud heart, pistil and petal glass
  function drawFlower(ctx, f) {
    if (f < 704 || f > 980) return;
    const t = f / FPS;
    const bud = E.inOutSine(inv(712, 768, f));
    const tipsFade = 1 - E.inOutSine(inv(916, 958, f));
    glow(ctx, SPR.aqua, CX, CY, 70 + 60 * inv(768, 860, f), 0.42 * bud * tipsFade);
    glow(ctx, SPR.white, CX, CY, 18 + 8 * Math.sin(TAU * 0.8 * t), 0.5 * bud * tipsFade);
    if (f >= 768) {
      const open = inv(780, 870, f);
      glow(ctx, SPR.lilac, CX, CY, 330, 0.16 * E.inOutSine(open) * tipsFade);
      for (let p = 0; p < 16; p++) {
        const g = PG(p, f);
        if (g.L < 2) continue;
        const vis = clamp(g.o) * tipsFade;
        ctx.beginPath();
        for (let i = 0; i <= 44; i++) {
          const [x, y] = petalPoint(g, (i / 44) * 0.9999);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.closePath();
        const [tx, ty] = petalTip(g);
        const gr = ctx.createLinearGradient(CX, CY, tx, ty);
        gr.addColorStop(0, rgba(C.aqua, 0));
        gr.addColorStop(0.4, rgba(C.aqua, 0.045 * vis));
        gr.addColorStop(1, rgba(C.lilac, (g.outer ? 0.13 : 0.1) * vis));
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = rgba(hexs(mixc(C.aqua, C.lilac, 0.55)), 0.2 * vis);
        ctx.stroke();
        beam(ctx, CX, CY, lerp(CX, tx, 0.9), lerp(CY, ty, 0.9), 0.9, hexs(mixc(C.aqua, C.lilac, 0.4)), 0.16 * vis, 0.35);
      }
      // pollen orbiting the pistil
      for (let i = 0; i < 26; i++) {
        const rr = 12 + 34 * hash(i, 3, 61), sp = (0.4 + 0.9 * hash(i, 4, 61)) * (i % 2 ? 1 : -1);
        const a = hash(i, 5, 61) * TAU + sp * t;
        const x = CX + rr * Math.cos(a), y = CY + rr * Math.sin(a);
        const x0 = CX + rr * Math.cos(a - (sp * SH) / FPS), y0 = CY + rr * Math.sin(a - (sp * SH) / FPS);
        BAT.seg(x0, y0, x, y, 1.6, 0.7 * inv(776, 800, f) * tipsFade, C.pearl);
      }
      BAT.flush(ctx);
    }
  }

  // ---------------------------------------------------------------- 06 constellation (far)
  const NODES = [], EDG = [];
  function initNodes() {
    // 26 constellation positions (seeded, well spaced)
    const r = rng(71), pts = [];
    let guard = 0;
    while (pts.length < 26 && guard++ < 20000) {
      const x = 170 + r() * 740, y = 590 + r() * 460;
      if (pts.every((q) => Math.hypot(q[0] - x, q[1] - y) > 92)) pts.push([x, y]);
    }
    // the 15 most central form the connected figure; the others are background stars
    const byC = pts.map((p, i) => ({ i, d: Math.hypot(p[0] - CX, (p[1] - CY) * 1.3) })).sort((a, b) => a.d - b.d);
    const core = byC.slice(0, 15).map((e) => e.i);
    // Prim's tree from the most central point; edge order = growth order
    const inT = new Set([core[0]]);
    while (inT.size < core.length) {
      let best = null;
      for (const a of inT) {
        for (const b of core) {
          if (inT.has(b)) continue;
          const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
          if (!best || d < best.d) best = { a, b, d };
        }
      }
      inT.add(best.b);
      EDG.push({ a: best.a, b: best.b });
    }
    EDG.forEach((e, k) => (e.f1 = TL.EDGES[k]));
    // the 16 petal tips fly to the nearest free positions; ten new stars fade in at the rest
    const tips = [];
    for (let p = 0; p < 16; p++) tips.push(petalTip(petalGeomRaw(p, 960)));
    const pairs = [];
    tips.forEach((tp, ti) => pts.forEach((q, qi) => pairs.push({ ti, qi, d: Math.hypot(tp[0] - q[0], tp[1] - q[1]) + (core.includes(qi) ? 0 : 160) })));
    pairs.sort((a, b) => a.d - b.d);
    const usedT = new Set(), usedQ = new Set(), tipOf = new Map();
    for (const pr of pairs) {
      if (usedT.has(pr.ti) || usedQ.has(pr.qi)) continue;
      usedT.add(pr.ti);
      usedQ.add(pr.qi);
      tipOf.set(pr.qi, pr.ti);
    }
    const rr = rng(73);
    pts.forEach((q, i) => {
      NODES.push({ tx: q[0], ty: q[1], tip: tipOf.has(i) ? tipOf.get(i) : -1, core: core.includes(i), ph: rr() * 100, dl: Math.floor(rr() * 9), dg: Math.floor(rr() * 5), conn: 1e9 });
    });
    EDG.forEach((e) => {
      NODES[e.a].conn = Math.min(NODES[e.a].conn, e.f1 - 7);
      NODES[e.b].conn = Math.min(NODES[e.b].conn, e.f1);
    });
  }
  const NXY = [0, 0];
  function nodeXY(nd, f, o) {
    const t = f / FPS;
    let x, y;
    if (nd.tip >= 0) [x, y] = petalTip(PG(nd.tip, Math.min(f, 960)));
    else {
      x = nd.tx;
      y = nd.ty;
    }
    const m = E.inOutCubic(inv(960 + nd.dl, 1002 + nd.dl, f));
    const fx = nd.tx + 5 * noise1(t * 0.4 + nd.ph, 8), fy = nd.ty + 5 * noise1(t * 0.37 + nd.ph, 9);
    x = lerp(x, fx, m);
    y = lerp(y, fy, m);
    const g = E.inOutCubic(inv(1104 + nd.dg, 1146 + nd.dg, f));
    if (g > 0) {
      globeXY(nd.sph, f, GXY);
      x = lerp(x, GXY[0], g);
      y = lerp(y, GXY[1], g);
    }
    o[0] = x;
    o[1] = y;
  }
  function drawConstellation(ctx, f) {
    if (f < 912 || f > 1156) return;
    const t = f / FPS;
    const fade = 1 - E.inOutSine(inv(1104, 1134, f));
    // edges
    const A = [0, 0], B = [0, 0];
    for (const e of EDG) {
      const p = E.outCubic(inv(e.f1 - 7, e.f1, f));
      if (p <= 0) continue;
      nodeXY(NODES[e.a], f, A);
      nodeXY(NODES[e.b], f, B);
      const ex = lerp(A[0], B[0], p), ey = lerp(A[1], B[1], p);
      const flash = f >= e.f1 ? Math.exp(-(f - e.f1) / 8) : 0;
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = rgba(ramp(AQ2WH, flash), (0.4 + 0.45 * flash) * fade);
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if (p < 1) glow(ctx, SPR.white, ex, ey, 16, 0.9 * fade);
    }
    // nodes
    for (const nd of NODES) {
      nodeXY(nd, f, NXY);
      const [x, y] = NXY;
      let a;
      if (nd.tip >= 0) a = inv(912, 944, f);
      else a = inv(968 + nd.dl, 1004 + nd.dl, f) * (nd.core ? 1 : 0.55);
      a *= 0.75 + 0.25 * Math.sin(TAU * 0.5 * t + nd.ph);
      const pl = f >= nd.conn ? Math.exp(-(f - nd.conn) / 10) : 0;
      const tipFlash = nd.tip >= 0 ? pulse(f, TL.TIPS, 12, 1) : 0;
      const sz = (nd.core || nd.tip >= 0 ? 2.8 : 2.0) + 1.6 * pl;
      BAT.seg(x, y, x, y, sz, Math.min(1, a + pl), C.white);
      glow(ctx, SPR.aqua, x, y, 22 + 14 * pl + 18 * tipFlash, (0.32 + 0.5 * pl + 0.5 * tipFlash) * a);
    }
    BAT.flush(ctx);
  }

  // ---------------------------------------------------------------- 07 the globe (far)
  const GR = 250, PITCH = 0.36, SPH = [], GEDGE = [], GAPP = new Float64Array(120);
  for (let i = 0; i < 120; i++) {
    const y = 1 - (2 * (i + 0.5)) / 120, r = Math.sqrt(1 - y * y), ph = i * GOLD;
    SPH.push([r * Math.cos(ph), y, r * Math.sin(ph)]);
  }
  const globeCollapse = (f) => E.inExpo(inv(TL.COLLAPSE[0], TL.COLLAPSE[1], f));
  function globeYaw(f) {
    const t = f / FPS, c = inv(TL.COLLAPSE[0], TL.COLLAPSE[1], f);
    return 0.9 + 0.3 * (t - 1104 / FPS) + 2.4 * c * c * c;
  }
  const GXY = [0, 0, 0];
  function globeXY(i, f, o) {
    const v = SPH[i], yaw = globeYaw(f), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1];
    const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
    const R = GR * (1 - globeCollapse(f));
    const s = 1300 / (1300 + z2 * R);
    o[0] = CX + x * R * s;
    o[1] = CY + y2 * R * s;
    o[2] = z2;
  }
  function initGlobe() {
    for (let i = 0; i < 120; i++) {
      const d = [];
      for (let j = 0; j < 120; j++) if (j !== i) d.push([j, (SPH[i][0] - SPH[j][0]) ** 2 + (SPH[i][1] - SPH[j][1]) ** 2 + (SPH[i][2] - SPH[j][2]) ** 2]);
      d.sort((a, b) => a[1] - b[1]);
      for (let m = 0; m < 3; m++) {
        const a = Math.min(i, d[m][0]), b = Math.max(i, d[m][0]);
        if (!GEDGE.some((e) => e[0] === a && e[1] === b)) GEDGE.push([a, b]);
      }
    }
    // constellation nodes land on front-facing sphere points nearest to them
    const front = [];
    for (let i = 0; i < 120; i++) {
      globeXY(i, 1150, GXY);
      if (GXY[2] < -0.12) front.push({ i, x: GXY[0], y: GXY[1] });
    }
    const pairs = [];
    NODES.forEach((nd, ni) => front.forEach((fp) => pairs.push({ ni, i: fp.i, d: Math.hypot(nd.tx - fp.x, nd.ty - fp.y) })));
    pairs.sort((a, b) => a.d - b.d);
    const usedN = new Set(), usedI = new Set();
    for (const p of pairs) {
      if (usedN.has(p.ni) || usedI.has(p.i)) continue;
      usedN.add(p.ni);
      usedI.add(p.i);
      NODES[p.ni].sph = p.i;
    }
    // everything else builds up in nine layers, bottom first
    const rest = [];
    for (let i = 0; i < 120; i++) {
      if (usedI.has(i)) {
        GAPP[i] = 1150;
        continue;
      }
      globeXY(i, 1164, GXY);
      rest.push({ i, y: GXY[1] });
    }
    rest.sort((a, b) => b.y - a.y);
    const per = rest.length / 9;
    rest.forEach((e, m) => (GAPP[e.i] = TL.GLOBE[Math.min(8, Math.floor(m / per))]));
  }
  const ORB = [
    { inc: 1.12, yaw0: 0.4, spd: 0.5, sat: 0.9, at: 1188 },
    { inc: -0.92, yaw0: 2.2, spd: -0.38, sat: 2.7, at: 1212 },
  ];
  function orbXY(o, a, f, out) {
    let x = Math.cos(a), y = 0, z = Math.sin(a);
    const ci = Math.cos(o.inc), si = Math.sin(o.inc);
    [y, z] = [y * ci - z * si, y * si + z * ci];
    const yw = o.yaw0 + globeYaw(f) * 0.55, cy = Math.cos(yw), sy = Math.sin(yw);
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
    const R = GR * 1.42 * (1 - globeCollapse(f));
    const s = 1300 / (1300 + z2 * R);
    out[0] = CX + x * R * s;
    out[1] = CY + y2 * R * s;
    out[2] = z2;
  }
  function drawGlobe(ctx, f) {
    if (f < 1104 || f >= TL.SHINE.flare) return;
    const t = f / FPS, c = globeCollapse(f);
    const P = new Array(120);
    for (let i = 0; i < 120; i++) {
      const o = [0, 0, 0];
      globeXY(i, f, o);
      P[i] = o;
    }
    const vis = (i) => {
      if (GAPP[i] === 1150) return inv(1110, 1150, f);
      return Math.max(0, spring((f - GAPP[i]) / FPS, 2.6, 0.45));
    };
    const depth = (z) => 0.28 + 0.36 * (1 - z);
    // edges
    ctx.lineWidth = 0.9;
    for (const [a, b] of GEDGE) {
      const fa = GAPP[a] === 1150 ? 1146 : GAPP[a], fb = GAPP[b] === 1150 ? 1146 : GAPP[b];
      const fe = Math.max(fa, fb) + 2;
      const p = E.outCubic(inv(fe, fe + 9, f));
      if (p <= 0) continue;
      const [s, e] = fa <= fb ? [P[a], P[b]] : [P[b], P[a]];
      const al = 0.26 * Math.min(depth(P[a][2]), depth(P[b][2])) * (1 + 0.8 * (1 - c) * pulse(f, fe + 9, 10, 1));
      ctx.strokeStyle = rgba(C.aqua, al);
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(lerp(s[0], e[0], p), lerp(s[1], e[1], p));
      ctx.stroke();
    }
    // points (streaked while collapsing)
    const Q = [0, 0, 0];
    for (let i = 0; i < 120; i++) {
      const v = vis(i);
      if (v <= 0.01) continue;
      if (GAPP[i] === 1150 && f < 1150) continue; // the constellation nodes draw themselves until they land
      globeXY(i, f - SH, Q);
      const pop = GAPP[i] !== 1150 ? pulse(f, GAPP[i], 9, 1) : 0;
      const d = depth(P[i][2]);
      BAT.seg(Q[0], Q[1], P[i][0], P[i][1], (1.6 + 1.3 * d) * Math.min(1.3, v), Math.min(1, (0.55 + 0.6 * d) * Math.min(1, v) + pop), C.white);
      if (pop > 0.02) glow(ctx, SPR.aqua, P[i][0], P[i][1], 26, 0.6 * pop);
    }
    BAT.flush(ctx);
    // orbits and satellites
    const Oo = [0, 0, 0], O0 = [0, 0, 0];
    for (const o of ORB) {
      const dr = E.inOutCubic(inv(o.at, o.at + 54, f));
      if (dr <= 0) continue;
      const n = 120, end = dr * TAU;
      let prev = null;
      for (let m = 0; m <= n; m++) {
        const a = o.sat - 0.6 + (m / n) * end;
        orbXY(o, a, f, Oo);
        if (prev) BAT.seg(prev[0], prev[1], Oo[0], Oo[1], 1.1, 0.34 * depth(Oo[2]) * (1 - 0.6 * c), C.aqua, false);
        prev = [Oo[0], Oo[1]];
      }
      const sa = o.sat + o.spd * TAU * (t - o.at / FPS) * 0.35 + end - 0.6;
      orbXY(o, sa, f, Oo);
      orbXY(o, sa - o.spd * 0.02, f - SH, O0);
      BAT.seg(O0[0], O0[1], Oo[0], Oo[1], 3.2, 0.95 * dr, C.white);
      glow(ctx, SPR.aqua, Oo[0], Oo[1], 22, 0.45 * dr);
    }
    BAT.flush(ctx);
    // heart of the globe, gathering everything at the collapse
    glow(ctx, SPR.aquaS, CX, CY, 120 + 60 * c, (0.12 + 0.35 * c) * inv(1120, 1180, f));
    glow(ctx, SPR.white, CX, CY, 14 + 70 * c, 0.15 + 0.85 * c);
  }

  // ---------------------------------------------------------------- 08 shine (far) + glitter pillar (near)
  const RAYS = Array.from({ length: 16 }, (_, r) => ({ a: (r / 16) * TAU + 0.18 * hash(r, 5, 81), L: 160 + 220 * hash(r, 3, 81), w: r % 2 ? 1.8 : 3.0 }));
  function drawShine(ctx, f) {
    if (f < 1344 || f > 1560) return;
    const tau = (f - TL.SHINE.flare) / FPS;
    const th = E.inOutCubic(inv(TL.SHINE.line[0], TL.SHINE.line[1], f));
    const I = 1 + 1.25 * ignite(tau * FPS) * Math.exp(-tau / 0.12);
    const corefade = 1 - E.inOutSine(inv(1500, 1548, f));
    // ignition: starts as the collapsed core (r 84) and tightens into a star while the halos expand outward
    const ign = E.outExpo(clamp(tau / 0.3));
    const ig = ignite(tau * FPS);
    glow(ctx, SPR.lilac, CX, CY, 560 * (0.3 + 0.7 * ign) * (1 - 0.5 * th), 0.085 * I * ig * (1 - th));
    glow(ctx, SPR.aquaS, CX, CY, 300 * (0.4 + 0.6 * ign) * (1 - 0.5 * th), 0.2 * I * ig * (1 - 0.85 * th));
    glow(ctx, SPR.pearl, CX, CY, (60 + 50 * ign) * Math.sqrt(I) * (1 - 0.55 * th), 0.45 * corefade);
    glow(ctx, SPR.white, CX, CY, lerp(84, 28, E.outCubic(clamp(tau / 0.22))), corefade);
    // shockwave
    if (tau < 1.4) {
      const r = 660 * E.outCubic(tau / 1.4);
      ring(ctx, CX, CY, r, 1, 0, TAU);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = rgba(C.pearl, 0.45 * (1 - tau / 1.4) ** 2);
      ctx.stroke();
    }
    // rays
    const grow = E.outExpo(clamp(tau / 0.45));
    for (let r = 0; r < RAYS.length; r++) {
      const R = RAYS[r];
      const L = R.L * grow * (1 - th) * (0.86 + 0.14 * noise1(tau * 1.3 + r * 7, 4));
      if (L < 2) continue;
      const a = R.a + 0.07 * tau;
      const ex = CX + L * Math.cos(a), ey = CY + L * Math.sin(a);
      const g = ctx.createLinearGradient(CX, CY, ex, ey);
      g.addColorStop(0, rgba(C.pearl, 0.55));
      g.addColorStop(0.35, rgba(C.pearl, 0.2));
      g.addColorStop(1, rgba(C.pearl, 0));
      const nx = -Math.sin(a) * R.w, ny = Math.cos(a) * R.w;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(CX + nx, CY + ny);
      ctx.lineTo(ex, ey);
      ctx.lineTo(CX - nx, CY - ny);
      ctx.closePath();
      ctx.fill();
    }
    // anamorphic streak
    const sw = 560 * E.outExpo(clamp(tau / 0.35)) * (1 - th);
    beam(ctx, CX - sw, CY, CX + sw, CY, 2.2, hexs(mixc(C.aqua, C.white, 0.5)), (0.22 + 0.4 * (I - 1) / 1.25) * (1 - th));
    // sparkles drifting out
    for (let i = 0; i < 64; i++) {
      const st = 0.12 + 0.6 * hash(i, 1, 83);
      const tt = tau - st;
      if (tt <= 0) continue;
      const a = hash(i, 2, 83) * TAU, v = 50 + 120 * hash(i, 3, 83);
      const r = 30 + v * tt;
      const x = CX + r * Math.cos(a), y = CY + r * Math.sin(a) * 0.9 - 8 * tt;
      const al = Math.sin(Math.PI * clamp(tt / 2.2)) * (0.5 + 0.5 * Math.sin(TAU * (1.3 + hash(i, 4, 83)) * tt)) * (1 - th);
      BAT.seg(x, y, x, y, 1.6 + 1.2 * hash(i, 5, 83), al, i % 3 ? C.pearl : C.aqua);
    }
    BAT.flush(ctx);
    // the light thins into a vertical line (it becomes the end card's divider)
    if (f >= TL.SHINE.line[0]) {
      const hl = 260 * E.inOutCubic(inv(TL.SHINE.line[0], 1530, f));
      if (f < 1536) {
        beam(ctx, CX, CY - hl, CX, CY + hl, 1.8, C.white, 0.95);
        beam(ctx, CX, CY - hl, CX, CY + hl, 7, C.aqua, 0.18);
      }
    }
  }
  const GLIT = (() => {
    const r = rng(91);
    return Array.from({ length: 170 }, () => ({ z: Math.pow(r(), 0.85), rate: 0.6 + r() * 1.7, ph: r(), len: r() }));
  })();
  function drawPillar(ctx, f) {
    if (f < 1344 || f > 1560) return;
    const t = f / FPS;
    const k = (1 + 1.4 * Math.exp(-(f - 1344) / 10)) * inv(1344, 1350, f) * (1 - E.inOutSine(inv(1488, 1540, f)));
    GLIT.forEach((g, i) => {
      const cyc = t * g.rate + g.ph, n = Math.floor(cyc), fr = cyc - n;
      const a = Math.pow(Math.sin(Math.PI * fr), 2) * k * (0.22 + 0.6 * (1 - g.z));
      const y = HORIZON + 6 + 640 * Math.pow(g.z, 1.25);
      const gx = (hash(i, n, 1) + hash(i, n, 2) + hash(i, n, 3) - 1.5) * 1.6;
      const x = CX + gx * (10 + 120 * g.z);
      const len = 4 + 34 * g.z * (0.5 + g.len);
      BAT.seg(x - len / 2, y, x + len / 2, y, 1 + 1.3 * g.z, a, i % 4 ? C.pearl : C.white, false);
    });
    BAT.flush(ctx);
  }

  // ---------------------------------------------------------------- 09 end card
  const EN = TL.END;
  function divider(f) {
    const s = spring((f - EN.rotate[0]) / FPS, 1.35, 0.62);
    const m = E.inOutCubic(inv(EN.rotate[0], EN.rotate[1] + 4, f));
    return { cy: lerp(CY, 876, m), ang: (Math.PI / 2) * (1 - s), hl: lerp(260, 230, m) };
  }
  function drawDivider(ctx, f) {
    if (f < EN.rotate[0]) return;
    const K = f < EN.rotate[1] + 24 ? 6 : 1;
    for (let i = 0; i < K; i++) {
      const d = divider(f - (K > 1 ? (SH * i) / (K - 1) : 0));
      const c = Math.cos(d.ang) * d.hl, s = Math.sin(d.ang) * d.hl;
      beam(ctx, CX - c, d.cy - s, CX + c, d.cy + s, 1.6, C.white, 0.92 / K);
      beam(ctx, CX - c, d.cy - s, CX + c, d.cy + s, 6, C.aqua, 0.14 / K);
    }
    const d = divider(f);
    glow(ctx, SPR.white, CX, d.cy, 30, 0.6 * (1 - E.inOutSine(inv(1536, 1600, f))));
    // a slow glint travelling the divider
    const gp = ((f - 1590) / 120) % 1;
    if (f > 1590 && gp < 0.6) {
      const x = CX - d.hl + (gp / 0.6) * 2 * d.hl;
      glow(ctx, SPR.white, x, d.cy, 18, 0.55 * Math.sin((Math.PI * gp) / 0.6));
    }
  }
  const FS = (px, w = 200) => `${w} ${px}px Outfit`;
  const FK = (px, w = 500) => `italic ${w} ${px}px "Cormorant Garamond"`;
  let NAME = null, LOGO = null;
  const NAME_PX = 196, NAME_Y = 806;
  function dotState(f) {
    // the full stop of "Baqur.ai": an aqua drop of light
    const tau = (f - EN.name) / FPS - 0.03 * NAME.dotIdx;
    const s = spring(tau, 1.3, 0.78);
    const d = divider(f);
    return { x: NAME.dx, y: NAME.dy + 150 * (1 - s), r: NAME.dr, a: clamp(tau / 0.3), clipY: d.cy - 2.5 };
  }
  function drawEndFar(ctx, f) {
    if (f < EN.name) return;
    const ds = dotState(f);
    if (ds.y < ds.clipY) {
      glow(ctx, SPR.aqua, ds.x, ds.y, 44, 0.65 * ds.a);
      // a new drop forms under the dot, swells, then falls
      if (f >= EN.drip && f < EN.fall) {
        const g = E.inOutSine(inv(EN.drip, EN.fall, f));
        const r = 2 + 4.2 * g;
        const y = ds.y + ds.r + r * (0.6 + 0.9 * g);
        ctx.fillStyle = rgba(C.aqua, 0.95);
        ctx.beginPath();
        ctx.ellipse(ds.x, y, r * 0.86, r * (1 + 0.35 * g), 0, 0, TAU);
        ctx.fill();
        glow(ctx, SPR.white, ds.x, y, 10 + 8 * g, 0.5 * g);
      }
    }
  }
  const endFallY = (f) => {
    const tau = (f - EN.fall) / FPS;
    const y0 = NAME.dy + NAME.dr + 2 + 4.2 * 1.5;
    return y0 + ((WATER - y0) * (tau * tau)) / ((EN.splash - EN.fall) / FPS) ** 2;
  };
  function drawEndNear(ctx, f) {
    if (f < EN.fall) return;
    const x = NAME.dx;
    if (f < EN.splash) {
      const y = endFallY(f), y0 = endFallY(Math.max(EN.fall, f - 1));
      comet(ctx, x, y0 - 3, x, y, 6.5, C.white, 0.95);
      glow(ctx, SPR.aqua, x, y, 22, 0.5);
      const yr = 2 * WATER - y, yr0 = 2 * WATER - y0;
      const ra = 0.42 * Math.pow(clamp(1 - (yr - WATER) / 520), 1.4);
      comet(ctx, x, yr0 + 3, x, yr, 6.5, C.aqua, ra);
      return;
    }
    const tau = (f - EN.splash) / FPS;
    const k = ignite(tau * FPS) * Math.exp(-tau / 0.1);
    glow(ctx, SPR.white, x, WATER, 50 + 110 * (1 - Math.exp(-tau / 0.05)), 0.85 * k, 0.2);
    glow(ctx, SPR.aqua, x, WATER, 50 + 240 * (1 - Math.exp(-tau / 0.12)), 0.45 * Math.exp(-tau / 0.3), 0.18);
    comet(ctx, x, WATER, x, WATER - 200 * k, 2, C.white, 0.6 * k);
    [[0, 230], [12, 160], [24, 100]].forEach(([d, R]) => {
      const age = (f - EN.splash - d) / FPS;
      if (age <= 0) return;
      const r = R * (1 - Math.exp(-age / 0.6));
      waterRing(ctx, x, WATER, r, 0.75 * inv(0, 0.08, age) * (1 - 0.5 * (r / R)) * Math.exp(-age / 1.6), 1.4);
      ring(ctx, x, WATER, r, 0.18, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = rgba(C.white, 0.5 * Math.exp(-age / 1.2) * inv(0, 0.08, age));
      ctx.stroke();
    });
    for (let i = 0; i < 9; i++) {
      const c = { th: hash(i, 1, 97) * TAU, vr: 90 + 120 * hash(i, 2, 97), T: (5 + 12 * hash(i, 3, 97)) / FPS, w: 1.6 + hash(i, 4, 97) };
      if (tau >= c.T) continue;
      const pos = (tt) => {
        const vUp = (GD * c.T) / 2, h = Math.max(0, vUp * tt - (GD * tt * tt) / 2), rr = c.vr * tt;
        return [x + rr * Math.cos(c.th), WATER + 0.18 * rr * Math.sin(c.th) - h];
      };
      const [px, py] = pos(tau), [qx, qy] = pos(Math.max(0, tau - SH / FPS));
      BAT.seg(qx, qy, px, py, c.w, 0.9, C.white);
    }
    BAT.flush(ctx);
  }

  // ---------------------------------------------------------------- text
  const SANS_PX = 62, KEY_PX = 112, KGAP = 14;
  const KCOL = { glow: "#E2FBF7", drop: "#D3FAF4", ripple: "#CDF8F2", noise: "#DDEFF0", flow: "#C8F7EF", bloom: "#E7DFFF", dots: "#D9F6F2", silence: "#E4EDEE", shine: "#FBF1DC" };
  let LINES = [];
  function layoutLines() {
    LINES = TL.TEXT.map((cue) => {
      const sText = cue.parts[0][1], kText = cue.parts[1][1];
      TX.letterSpacing = "0px";
      TX.font = FS(SANS_PX);
      const wS = TX.measureText(sText).width;
      TX.font = FK(KEY_PX);
      const glyphs = [];
      for (let i = 0; i < kText.length; i++) glyphs.push({ ch: kText[i], x: TX.measureText(kText.slice(0, i)).width, w: TX.measureText(kText[i]).width });
      const wK = TX.measureText(kText).width;
      const x0 = Math.round(CX - (wS + KGAP + wK) / 2);
      return Object.assign({}, cue, { sText, kText, wS, wK, xS: x0, xK: x0 + wS + KGAP, glyphs });
    });
  }
  function gdraw(ctx, s) {
    if (!(s.a > 0.004)) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.a);
    ctx.font = s.font;
    ctx.fillStyle = s.col;
    ctx.letterSpacing = s.ls || "0px";
    if (s.blur > 0.35) ctx.filter = `blur(${s.blur.toFixed(2)}px)`;
    const px = s.px || 0, py = s.py || 0;
    ctx.translate(s.x + px, s.y + py);
    if (s.rot) ctx.rotate(s.rot);
    if (s.sc !== undefined && s.sc !== 1) ctx.scale(s.sc, s.sc);
    ctx.fillText(s.text, -px, -py);
    ctx.restore();
  }
  function kw(L, i, tk, f, n, c, trk) {
    let dx = 0, dy = 0, a = 0, blur = 0, rot = 0, sc = 1;
    switch (L.fx) {
      case "glow": {
        const p = E.outCubic(clamp((tk - 0.06 * i) / 0.6));
        a = p; blur = 9 * (1 - p); dy = 14 * (1 - p);
        break;
      }
      case "drop": {
        const tau = tk - 0.075 * i - (L.kText[i] === "." ? 0.12 : 0);
        a = clamp(tau / 0.12); dy = -54 * (1 - spring(tau, 1.9, 0.48)); blur = 3.5 * (1 - clamp(tau / 0.35));
        break;
      }
      case "ripple": {
        const d = 0.045 * i, p = E.outCubic(clamp((tk - d) / 0.5));
        a = p; blur = 7 * (1 - p);
        dy = 14 * (1 - p) + 9 * Math.sin(TAU * (1.15 * tk - 0.14 * i)) * Math.exp(-1.6 * Math.max(0, tk - d)) * clamp((tk - d) / 0.1);
        break;
      }
      case "noise": {
        const A = Math.exp(-2.3 * Math.max(0, tk - 0.15));
        a = clamp((tk - 0.025 * i) / 0.25) * (1 - 0.55 * A * hash(i, Math.floor(f / 2), 77));
        dx = 9 * A * noise1(f * 0.42 + 11 * i, 21); dy = 8 * A * noise1(f * 0.47 + 5 * i, 22); rot = 0.16 * A * noise1(f * 0.33 + 3 * i, 23); blur = 2.5 * A;
        break;
      }
      case "flow": {
        const p = E.outCubic(clamp((tk - 0.07 * i) / 0.75));
        a = p; blur = 6 * (1 - p); dx = -64 * (1 - p);
        dy = 18 * Math.sin(TAU * (0.55 * tk - 0.16 * i)) * (1 - p) + 2.6 * Math.sin(TAU * (0.3 * tk - 0.12 * i));
        break;
      }
      case "bloom": {
        const tau = tk - 0.075 * Math.abs(i - c);
        sc = Math.max(0, spring(tau, 2.1, 0.42)); a = clamp(tau / 0.16); rot = (i - c) * 0.07 * (1 - clamp(sc)); blur = 5 * (1 - clamp(tau / 0.3));
        break;
      }
      case "silence": {
        const p = E.outCubic(clamp((tk - 0.055 * i) / 0.7));
        a = E.inOutSine(clamp((tk - 0.055 * i) / 0.7)); blur = 10 * (1 - p);
        dx = i * trk;
        break;
      }
      default: {
        const p = E.outCubic(clamp((tk - 0.05 * i) / 0.5));
        a = p; blur = 7 * (1 - p); dy = 12 * (1 - p);
      }
    }
    return { dx, dy, a, blur, rot, sc };
  }
  function drawLines(ctx, f) {
    for (const L of LINES) {
      if (f < L.f0 || f > L.f1) continue;
      const tin = (f - L.f0) / FPS, tout = (L.f1 - f) / FPS;
      const outP = E.inOutSine(clamp(1 - tout / 0.38));
      const pS = E.outCubic(clamp(tin / 0.55));
      const tk0 = tin - 0.12;
      const trk = L.fx === "silence" ? lerp(-1, 6, E.inOutSine(clamp(tk0 / 2.4))) : 0;
      const shift = (-(L.glyphs.length - 1) * trk) / 2;
      const sans = { text: L.sText, x: L.xS + shift, y: L.y + 22 * (1 - pS) - 12 * outP, font: FS(SANS_PX), col: C.moon, a: 0.9 * pS * (1 - outP), blur: 9 * (1 - pS) + 6 * outP };
      gdraw(ctx, sans);
      GL.push([sans, 0.22]);
      const tk = tin - 0.12, n = L.glyphs.length, c = (n - 1) / 2;
      const kcol = KCOL[L.fx] || C.moon;
      let gboost = 0.5;
      if (L.fx === "glow") gboost += 1.3 * Math.exp(-(((tk - 0.65) / 0.35) ** 2));
      for (let i = 0; i < n; i++) {
        const g = L.glyphs[i];
        const s = kw(L, i, tk, f, n, c, trk);
        const st = {
          text: g.ch, x: L.xK + g.x + s.dx + shift, y: L.y + s.dy - 12 * outP, font: FK(KEY_PX), col: kcol, a: s.a * (1 - outP), blur: s.blur + 6 * outP,
          rot: s.rot, sc: s.sc, px: g.w / 2, py: -KEY_PX * 0.22,
        };
        gdraw(ctx, st);
        GL.push([st, gboost]);
      }
      const last = L.glyphs[n - 1];
      const dotX = L.xK + last.x + last.w * 0.42, dotY = L.y - 7;
      if (L.fx === "drop") {
        // the full stop lands like a droplet
        const tl = tk - 0.075 * (n - 1) - 0.12 - 0.2;
        if (tl > 0 && tl < 1.2) {
          const r = 4 + 30 * (1 - Math.exp(-tl / 0.22));
          ring(ctx, dotX, L.y + 4, r, 0.22, 0, TAU);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = rgba(C.aqua, 0.6 * Math.exp(-tl / 0.3) * (1 - outP));
          ctx.stroke();
        }
      }
      if (L.fx === "dots") {
        let pl = 0;
        for (const F of TL.EDGES) pl += pulse(f, F, 9, 1);
        const a = clamp(tk / 0.5) * (1 - outP);
        GL.push((g) => glow(g, SPR.aqua, dotX, dotY, 26 + 14 * Math.min(1, pl), (0.5 + 0.6 * Math.min(1, pl)) * a));
        ctx.save();
        ctx.globalAlpha = 0.85 * a * (0.35 + 0.65 * Math.min(1, pl));
        ctx.drawImage(SPR.aqua, dotX - 18, dotY - 18, 36, 36);
        ctx.restore();
      }
      if (L.fx === "shine") shineSweep(ctx, L, tk, outP);
    }
  }
  function shineSweep(ctx, L, tk, outP) {
    const g = clamp((tk - 0.55) / 0.85);
    if (g > 0 && g < 1) {
      SX.setTransform(1, 0, 0, 1, 0, 0);
      SX.globalCompositeOperation = "source-over";
      SX.clearRect(0, 0, W, 320);
      SX.font = FK(KEY_PX);
      SX.fillStyle = "#ffffff";
      for (const gl of L.glyphs) SX.fillText(gl.ch, L.xK + gl.x, 220);
      SX.globalCompositeOperation = "source-in";
      const bx = L.xK - 70 + g * (L.wK + 140);
      const gr = SX.createLinearGradient(bx - 46, 220 - 10, bx + 46, 220 + 10);
      gr.addColorStop(0, "rgba(255,248,232,0)");
      gr.addColorStop(0.5, "rgba(255,248,232,1)");
      gr.addColorStop(1, "rgba(255,248,232,0)");
      SX.fillStyle = gr;
      SX.fillRect(0, 0, W, 320);
      SX.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.9 * (1 - outP);
      ctx.drawImage(scr, 0, L.y - 220);
      ctx.restore();
      const y0 = L.y - 220;
      GL.push((gg) => {
        gg.globalAlpha = 0.9;
        gg.drawImage(scr, 0, y0);
        gg.globalAlpha = 1;
      });
    }
    // a twinkle where the sweep leaves the word
    const tw = Math.exp(-(((tk - 1.45) / 0.18) ** 2)) * (1 - outP);
    if (tw > 0.01) {
      const x = L.xK + L.wK + 6, y = L.y - 62;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      beam(ctx, x - 26 * tw, y, x + 26 * tw, y, 1.4, C.pearl, 0.9 * tw);
      beam(ctx, x, y - 26 * tw, x, y + 26 * tw, 1.4, C.pearl, 0.9 * tw);
      glow(ctx, SPR.pearl, x, y, 14, 0.8 * tw);
      ctx.restore();
    }
  }
  function layoutEnd(logo) {
    LOGO = logo;
    TX.letterSpacing = "0px";
    TX.font = FK(NAME_PX);
    const name = "Baqur.ai";
    const glyphs = [];
    for (let i = 0; i < name.length; i++) glyphs.push({ ch: name[i], x: TX.measureText(name.slice(0, i)).width, w: TX.measureText(name[i]).width });
    const w = TX.measureText(name).width;
    const x0 = Math.round(CX - w / 2);
    const dotIdx = name.indexOf(".");
    const m = TX.measureText(".");
    const gx = x0 + glyphs[dotIdx].x;
    const dx = gx + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
    const dy = NAME_Y - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    const dr = Math.max(6, (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) / 2);
    NAME = { glyphs, x0, w, dotIdx, dx, dy, dr, y: NAME_Y };
  }
  function centeredLS(ctx, text, font, lsPx) {
    ctx.font = font;
    ctx.letterSpacing = lsPx + "px";
    const w = ctx.measureText(text).width - lsPx;
    return CX - w / 2;
  }
  function drawEndText(ctx, f) {
    if (f < EN.name) return;
    const d = divider(f);
    // name, rising out of the divider
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, d.cy - 2.5);
    ctx.clip();
    NAME.glyphs.forEach((g, i) => {
      if (i === NAME.dotIdx) return;
      const tau = (f - EN.name) / FPS - 0.03 * i;
      const s = spring(tau, 1.3, 0.78);
      const st = { text: g.ch, x: NAME.x0 + g.x, y: NAME.y + 150 * (1 - s), font: FK(NAME_PX), col: "#F3F7F5", a: clamp(tau / 0.3), blur: 6 * (1 - clamp(tau / 0.4)) };
      gdraw(ctx, st);
      GL.push([st, 0.45]);
    });
    const ds = dotState(f);
    if (ds.a > 0) {
      const gr = ctx.createRadialGradient(ds.x - ds.r * 0.25, ds.y - ds.r * 0.25, 0, ds.x, ds.y, ds.r);
      gr.addColorStop(0, rgba(C.white, ds.a));
      gr.addColorStop(0.55, rgba("#C9FBF4", ds.a));
      gr.addColorStop(1, rgba(C.aqua, ds.a));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(ds.x, ds.y, ds.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // follow for more
    {
      const tau = (f - EN.follow) / FPS;
      if (tau > 0) {
        const p = E.outCubic(clamp(tau / 0.7));
        const ls = 46 * lerp(0.34, 0.2, E.inOutSine(clamp(tau / 1.3)));
        const x = centeredLS(ctx, "Follow for more", FS(46), ls);
        const st = { text: "Follow for more", x, y: 624 + 16 * (1 - p), font: FS(46), col: C.moon, a: 0.92 * p, blur: 8 * (1 - p), ls: ls + "px" };
        gdraw(ctx, st);
        GL.push([st, 0.3]);
      }
    }
    // credit: Dev by · logo · url
    const cred = (F, dur = 0.6) => {
      const tau = (f - F) / FPS;
      return tau <= 0 ? 0 : E.outCubic(clamp(tau / dur));
    };
    let p = cred(EN.devby);
    if (p > 0) {
      const ls = 26 * 0.42;
      gdraw(ctx, { text: "DEV BY", x: centeredLS(ctx, "DEV BY", FS(26, 300), ls), y: 948 + 12 * (1 - p), font: FS(26, 300), col: C.mist, a: 0.95 * p, blur: 6 * (1 - p), ls: ls + "px" });
    }
    p = cred(EN.logo, 0.7);
    if (p > 0 && LOGO) {
      const lw = 400, lh = (lw * LOGO.naturalHeight) / LOGO.naturalWidth;
      ctx.save();
      ctx.globalAlpha = p;
      if (p < 0.99) ctx.filter = `blur(${(6 * (1 - p)).toFixed(2)}px)`;
      ctx.drawImage(LOGO, CX - lw / 2, 976 + 12 * (1 - p), lw, lh);
      ctx.restore();
    }
    p = cred(EN.url);
    if (p > 0) {
      const ls = 32 * 0.08;
      gdraw(ctx, { text: "godevlevel.in", x: centeredLS(ctx, "godevlevel.in", FS(32), ls), y: 1094 + 12 * (1 - p), font: FS(32), col: C.mist, a: 0.95 * p, blur: 6 * (1 - p), ls: ls + "px" });
    }
  }

  // ---------------------------------------------------------------- reflection, bloom, grain
  const impactsE = [[TL.DROP.impact, 1.0], [TL.DROP.jetLand, 0.35], [TL.END.splash, 0.9]];
  function drawReflection(f) {
    RS.setTransform(1, 0, 0, 1, 0, 0);
    RS.clearRect(0, 0, W / 2, RD / 2);
    RS.setTransform(0.5, 0, 0, -0.5, 0, HORIZON / 2);
    RS.drawImage(lightC, 0, HORIZON - RD, W, RD, 0, HORIZON - RD, W, RD);
    RS.drawImage(textC, 0, HORIZON - RD, W, RD, 0, HORIZON - RD, W, RD);
    RS.setTransform(1, 0, 0, 1, 0, 0);
    RB.clearRect(0, 0, W / 2, RD / 2);
    RB.filter = "blur(2.6px)";
    RB.drawImage(reflS, 0, 0);
    RB.filter = "none";
    const t = f / FPS;
    let er = 0, wave = 0;
    for (const [F, g] of impactsE) {
      if (f < F) continue;
      const e = g * Math.exp(-(f - F) / 55);
      er += e;
      wave += e * (f - F);
    }
    O.globalCompositeOperation = "lighter";
    for (let d = 0; d < RD; d += 4) {
      const z = d / RD;
      const a = 0.5 * Math.pow(1 - z, 1.3);
      if (a < 0.004) continue;
      const amp = (0.5 + 3.4 * z) * (1 + 2.2 * er);
      const dx = amp * (Math.sin(d * 0.043 + t * 1.9) + 0.6 * Math.sin(d * 0.117 - t * 2.7 + 1.3)) + er * 6 * Math.sin(d * 0.07 - (er > 0 ? wave / er : 0) * 0.35);
      const sy = d / 2;
      const m = Math.min(1, z * 1.6);
      O.globalAlpha = a * (1 - m);
      if (O.globalAlpha > 0.003) O.drawImage(reflS, 0, sy, W / 2, 2, dx, HORIZON + d, W, 4);
      O.globalAlpha = a * m;
      if (O.globalAlpha > 0.003) O.drawImage(reflB, 0, sy, W / 2, 2, dx, HORIZON + d, W, 4);
    }
    O.globalAlpha = 1;
  }
  function bloom() {
    B1.setTransform(1, 0, 0, 1, 0, 0);
    B1.globalCompositeOperation = "source-over";
    B1.clearRect(0, 0, 540, 960);
    B1.drawImage(lightC, 0, 0, 540, 960);
    B1.globalCompositeOperation = "lighter";
    B1.globalAlpha = 0.35;
    B1.drawImage(textC, 0, 0, 540, 960);
    B1.globalAlpha = 1;
    B1.setTransform(0.5, 0, 0, 0.5, 0, 0);
    for (const g of GL) {
      if (typeof g === "function") g(B1);
      else gdraw(B1, Object.assign({}, g[0], { a: g[0].a * g[1], blur: (g[0].blur || 0) + 2 }));
    }
    B1.setTransform(1, 0, 0, 1, 0, 0);
    B1.globalCompositeOperation = "source-over";
    const lv = (src, dst, ctx, w, h, blur) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.filter = "none";
    };
    lv(b1, b1b, B1B, 540, 960, 3);
    B2.clearRect(0, 0, 270, 480);
    B2.drawImage(b1b, 0, 0, 270, 480);
    lv(b2, b2b, B2B, 270, 480, 4);
    B3.clearRect(0, 0, 135, 240);
    B3.drawImage(b2b, 0, 0, 135, 240);
    lv(b3, b3b, B3B, 135, 240, 6);
    O.globalCompositeOperation = "lighter";
    O.globalAlpha = 0.5;
    O.drawImage(b1b, 0, 0, W, H);
    O.globalAlpha = 0.5;
    O.drawImage(b2b, 0, 0, W, H);
    O.globalAlpha = 0.6;
    O.drawImage(b3b, 0, 0, W, H);
    O.globalAlpha = 1;
  }
  let GRAIN = [];
  function makeGrain() {
    GRAIN = [0, 1, 2, 3].map((s) => {
      const c = mk(256, 256), g = c.getContext("2d"), im = g.createImageData(256, 256), r = rng(500 + s);
      for (let i = 0; i < 256 * 256; i++) {
        const v = clamp(128 + 46 * gauss(r), 0, 255);
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
        im.data[i * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      return O.createPattern(c, "repeat");
    });
  }
  function grain(f) {
    const step = Math.floor(f / 2), r = rng(1000 + step);
    const pat = GRAIN[step % 4], ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
    O.save();
    O.translate(-ox, -oy);
    O.fillStyle = pat;
    O.globalCompositeOperation = "overlay";
    O.globalAlpha = 0.055;
    O.fillRect(ox, oy, W, H);
    O.globalCompositeOperation = "source-over";
    O.globalAlpha = 0.02;
    O.fillRect(ox, oy, W, H);
    O.restore();
  }

  // ---------------------------------------------------------------- frame
  function renderFrame(f) {
    GL.length = 0;
    PGC.clear();
    LX.setTransform(1, 0, 0, 1, 0, 0);
    LX.globalCompositeOperation = "source-over";
    LX.globalAlpha = 1;
    LX.clearRect(0, 0, W, H);
    LX.globalCompositeOperation = "lighter";
    drawMotes(LX, f);
    drawRings(LX, f);
    drawFlower(LX, f);
    drawParticles(LX, f);
    drawConstellation(LX, f);
    drawGlobe(LX, f);
    drawShine(LX, f);
    drawDivider(LX, f);
    drawEndFar(LX, f);
    TX.setTransform(1, 0, 0, 1, 0, 0);
    TX.globalCompositeOperation = "source-over";
    TX.globalAlpha = 1;
    TX.clearRect(0, 0, W, H);
    drawLines(TX, f);
    drawEndText(TX, f);
    // the water mirrors the far layer and the text (its source is read before the near layer is drawn)
    drawBG(f);
    drawReflection(f);
    LX.globalCompositeOperation = "lighter";
    drawHorizon(LX, f);
    drawDrop(LX, f);
    drawPillar(LX, f);
    drawEndNear(LX, f);
    O.globalCompositeOperation = "lighter";
    O.drawImage(lightC, 0, 0);
    bloom();
    O.globalCompositeOperation = "source-over";
    O.drawImage(textC, 0, 0);
    O.drawImage(vig, 0, 0);
    grain(f);
    if (f < 30) {
      O.globalCompositeOperation = "source-over";
      O.fillStyle = `rgba(0,0,0,${1 - E.inOutSine(f / 30)})`;
      O.fillRect(0, 0, W, H);
    }
  }
  function drawHorizon(ctx, f) {
    const p = E.inOutCubic(inv(6, 60, f));
    if (p <= 0) return;
    const col = hexs(mixc(hazeCol(f), C.moon, 0.5)), k = 0.55 + 0.45 * Math.min(1.8, hazeLvl(f));
    const hw = 560 * p;
    beam(ctx, CX - hw, HORIZON, CX + hw, HORIZON, 1.2, col, 0.38 * k);
  }

  function init(opts) {
    layoutLines();
    layoutEnd(opts && opts.logo);
    initParticles();
    initNodes();
    initGlobe();
    makeGrain();
  }
  // QA hook: the lowest glyph opacity of each text line at frame f (a line is readable while every glyph is ≥ 0.9)
  function textAlpha(f) {
    const out = {};
    for (const L of LINES) {
      if (f < L.f0 || f > L.f1) continue;
      const tin = (f - L.f0) / FPS, tout = (L.f1 - f) / FPS;
      const outP = E.inOutSine(clamp(1 - tout / 0.38));
      let m = 0.9 * E.outCubic(clamp(tin / 0.55)) * (1 - outP) / 0.9;
      const tk = tin - 0.12, n = L.glyphs.length, c = (n - 1) / 2;
      const trk = L.fx === "silence" ? lerp(-1, 6, E.inOutSine(clamp(tk / 2.4))) : 0;
      for (let i = 0; i < n; i++) m = Math.min(m, kw(L, i, tk, f, n, c, trk).a * (1 - outP));
      out[L.id] = m;
    }
    return out;
  }
  window.FILM = { init, renderFrame, TL, textAlpha };
  window.renderFrame = renderFrame;
})();
