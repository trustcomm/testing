// World "3 · Kinetic type": the zoomed stripe rows from the 4's counter (same strings, same scroll) bend into ten
// ribbon lanes that follow the two bowls of a 3. Lanes flow at different speeds, step through Archivo's width axis on
// 8ths, flash key words infra on beats, tighten on beat 3, then converge into one bright line that straightens into a
// radius — the leader's sweep hand (hand-off to the flight world).
window.WorldType = function (E) {
  const { THREE } = E;
  const { U } = window;
  const SH = window.SHARED;
  const GG = window.GL_GLYPH;
  const T0 = 9.375, T_BEND0 = 9.40, T_BEND1 = 9.82, T_TIGHT = 10.3125, T_UNSPOOL = 10.78125, T1 = 11.015625;
  const B = 0.46875, E8 = B / 2;
  const BONE = "#EDE6DA", INFRA = "#FF4A24", ICE = "#8FD8FF", VOID = "#06070B";

  const cv = document.createElement("canvas");
  cv.width = 1920;
  cv.height = 1080;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  // half-res canvas for the blurred depth layers (ghost words behind, big words in front)
  const cvB = document.createElement("canvas");
  cvB.width = 960;
  cvB.height = 540;
  const gb = cvB.getContext("2d", { willReadFrequently: true });
  const texB = new THREE.CanvasTexture(cvB);
  texB.colorSpace = THREE.NoColorSpace;
  texB.generateMipmaps = false;
  texB.minFilter = THREE.LinearFilter;

  // --- the 3's centreline: two elliptical bowls (font units → screen via the shared placement)
  const p3 = SH.place("3");
  const S = p3.s;
  const toScr = (x, y) => [x * S + p3.ox, y * S + p3.oy];
  const BOWLS = [
    { c: toScr(400, -500), rx: 232 * S, ry: 132 * S, th0: (176 * Math.PI) / 180, th1: (452 * Math.PI) / 180 },
    { c: toScr(400, -200), rx: 254 * S, ry: 143 * S, th0: (264 * Math.PI) / 180, th1: (540 * Math.PI) / 180 },
  ];
  const LANES_PER = 5, LANE_W0 = 49, FONT_L = 38;
  const lanes = [];
  for (let b = 0; b < 2; b++) {
    for (let j = 0; j < LANES_PER; j++) {
      const off = (j - (LANES_PER - 1) / 2);
      const row = b === 0 ? SH.K0 - LANES_PER + j : SH.K0 + j;
      // arc-length table
      const bw = BOWLS[b];
      const N = 360;
      lanes.push({ bowl: b, j, off, row, N, dir: (row % 2 ? -1 : 1), speed: 70 + ((row * 53) % 60), table: null });
    }
  }
  function laneTable(L, laneW) {
    const bw = BOWLS[L.bowl];
    const d = L.off * laneW;
    const rx = bw.rx + d, ry = bw.ry + d;
    const N = L.N;
    const th = new Float32Array(N + 1), len = new Float32Array(N + 1);
    let acc = 0, px = 0, py = 0;
    for (let i = 0; i <= N; i++) {
      const a = bw.th0 + ((bw.th1 - bw.th0) * i) / N;
      const x = bw.c[0] + Math.cos(a) * rx, y = bw.c[1] + Math.sin(a) * ry;
      if (i) acc += Math.hypot(x - px, y - py);
      th[i] = a; len[i] = acc; px = x; py = y;
    }
    return { th, len, total: acc, rx, ry, c: bw.c };
  }
  function at(tab, s) {
    // point + tangent angle at arc length s
    const L = tab.len;
    let lo = 0, hi = L.length - 1;
    s = U.clamp(s, 0, tab.total);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
    const f = (s - L[lo]) / Math.max(1e-6, L[hi] - L[lo]);
    const a = U.mix(tab.th[lo], tab.th[hi], f);
    const x = tab.c[0] + Math.cos(a) * tab.rx, y = tab.c[1] + Math.sin(a) * tab.ry;
    const tx = -Math.sin(a) * tab.rx, ty = Math.cos(a) * tab.ry;
    return [x, y, Math.atan2(ty, tx)];
  }

  // advance cache per (font string, char)
  const adv = new Map();
  function advOf(font, stretch, ch) {
    const k = font + "|" + stretch + "|" + ch;
    let v = adv.get(k);
    if (v == null) {
      const f0 = g.font, s0 = g.fontStretch;
      g.font = font; g.fontStretch = stretch;
      v = g.measureText(ch).width;
      g.font = f0; g.fontStretch = s0;
      adv.set(k, v);
    }
    return v;
  }
  const STRETCH = ["condensed", "normal", "expanded"];
  function fontFor(px, stretchIdx) {
    return { font: `600 ${px.toFixed(2)}px Archivo`, stretch: STRETCH[stretchIdx] };
  }
  const KEY = new Set(["MOTION", "TIMING", "LIGHT", "RHYTHM"]);

  // the converged single line, sampled along both bowls (for the straighten morph)
  const LINE_N = 120;
  function centreline(i, laneW) {
    const u = i / (LINE_N - 1);
    const t0 = laneTable(lanes[2], 0), t1 = laneTable(lanes[7], 0);
    const tot = t0.total + t1.total;
    const s = u * tot;
    return s < t0.total ? at(t0, s) : at(t1, s - t0.total);
  }
  const LINE_PTS = Array.from({ length: LINE_N }, (_, i) => centreline(i, 0));

  function drawLanes(t, m, laneW, alpha, tight) {
    const z0 = SH.ZOOM_END;
    const fRow = SH.FONT_PX * z0;
    const n8 = Math.floor((t - 9.84375) / E8);
    for (const L of lanes) {
      const tab = laneTable(L, laneW);
      // row geometry at the hand-off (zoomed stripes), in screen px
      const rowY = 540 + (SH.rowY(L.row) - SH.focus[1]) * z0;
      const rowX0 = 960 + (SH.rowX(L.row, t) - SH.focus[0]) * z0;
      const px = U.mix(fRow, FONT_L, m);
      const stretchIdx = m < 0.98 ? 1 : (n8 < 0 ? 1 : (n8 + L.row) % 3);
      const F = fontFor(px, stretchIdx);
      g.font = F.font;
      g.fontStretch = F.stretch;
      const text = SH.rowText(L.row);
      // walk the row's glyphs; each glyph i has row-x (screen) and maps to arc length s
      let x = rowX0;
      let wi = 0, word = "";
      const zs = fRow / FONT_L;   // how much the type shrinks from row to lane
      const flowShift = U.seg(t, T_BEND0, T1, U.E.linear) * L.speed * L.dir * 1.8 + U.E.p3in(U.seg(t, T_UNSPOOL, T1)) * 900;
      for (let ci = 0; ci < text.length; ci++) {
        const ch = text[ci];
        if (ch === " " || ch === "·") { word = ""; } else if (!word) { let e = ci; while (e < text.length && text[e] !== " ") e++; word = text.slice(ci, e); }
        const aRow = advOf(`600 ${fRow.toFixed(2)}px Archivo`, "normal", ch);
        const aLane = advOf(F.font, F.stretch, ch) * (1 - tight * 0.06);
        const cxRow = x + aRow / 2;
        x += aRow;
        // row position (m = 0)
        if (cxRow < -400 || cxRow > 2320) { if (m < 0.02) continue; }
        const s = (cxRow - 960) / zs * (1 - tight * 0.06) + tab.total * 0.5 + flowShift;
        const visArc = s > 0 && s < tab.total ? 1 : 0;
        const fadeEdge = U.clamp(Math.min(s, tab.total - s) / 40);
        const a = (1 - m) * (cxRow > -200 && cxRow < 2120 ? 1 : 0) + m * visArc * fadeEdge;
        if (a <= 0.01) continue;
        const [ax, ay, ang] = at(tab, s);
        const X = U.mix(cxRow, ax, m), Y = U.mix(rowY, ay, m), R = U.mix(0, ang, m);
        const flash = KEY.has(word) && ((t > 9.84375 && t < 9.84375 + 0.18) || (t > T_TIGHT && t < T_TIGHT + 0.2)) && m > 0.9;
        g.save();
        g.translate(X, Y);
        g.rotate(R);
        g.globalAlpha = a * alpha;
        g.fillStyle = flash ? INFRA : BONE;
        g.fillText(ch, -aLane / 2, 0);
        g.restore();
      }
    }
  }

  function render(t, target) {
    const m = U.E.expoIo(U.seg(t, T_BEND0, T_BEND1));
    const tight = U.seg(t, T_TIGHT, T_TIGHT + 0.22, U.E.backOut);
    const conv = U.E.p3in(U.seg(t, T_UNSPOOL, T_UNSPOOL + 0.16));
    const straight = U.E.expoIo(U.seg(t, 10.90, T1));
    const laneW = U.mix(LANE_W0, 34, tight) * (1 - conv);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.lineCap = "butt";
    g.fillStyle = VOID;
    g.fillRect(0, 0, 1920, 1080);
    g.textBaseline = "middle";
    // camera: a slow rotation + push once the 3 has formed
    const rot = U.mix(0, -0.035, U.seg(t, T_BEND1, T1, U.E.sineIo));
    const sc = U.mix(1, 1.05, U.seg(t, T_BEND1, T1, U.E.sineIo));
    g.translate(960, 540);
    g.rotate(rot);
    g.scale(sc, sc);
    g.translate(-960, -540);
    if (conv < 1) drawLanes(t, m, laneW, 1 - conv, tight);
    // the converged line → straightened radius (the leader's sweep hand)
    if (conv > 0) {
      g.strokeStyle = BONE;
      g.lineCap = "round";
      g.lineWidth = U.mix(14, 6, straight);
      g.globalAlpha = 1;
      g.beginPath();
      for (let i = 0; i < LINE_N; i++) {
        const u = i / (LINE_N - 1);
        const P = LINE_PTS[i];
        // straight radius: centre → right, length 430
        const sx = 960 + u * 430, sy = 540;
        const vis = U.clamp((conv - (1 - u) * 0.7) / 0.3);
        if (vis <= 0) continue;
        const X = U.mix(P[0], sx, straight), Y = U.mix(P[1], sy, straight);
        i === 0 ? g.moveTo(X, Y) : g.lineTo(X, Y);
      }
      g.stroke();
    }
    // depth layers at half res: ghost words behind (big, outlined), foreground words in front (blurred)
    gb.setTransform(1, 0, 0, 1, 0, 0);
    gb.clearRect(0, 0, 960, 540);
    const showD = U.seg(t, 9.6, 9.9) * (1 - U.seg(t, T_UNSPOOL, T_UNSPOOL + 0.15));
    if (showD > 0) {
      gb.filter = "blur(3px)";
      gb.font = "900 190px Archivo";
      gb.fontStretch = "expanded";
      gb.textBaseline = "middle";
      gb.strokeStyle = `rgba(143,216,255,${0.12 * showD})`;
      gb.lineWidth = 1.6;
      gb.strokeText("MOTION", -120 + (t - 9.6) * 60, 120);
      gb.strokeText("RHYTHM", 360 - (t - 9.6) * 50, 440);
      // a giant ghost 3 behind the ribbons (the numeral's own outline, slowly turning)
      gb.save();
      gb.filter = "blur(2px)";
      gb.translate(480, 270);
      gb.rotate(0.05 - (t - 9.6) * 0.04);
      gb.scale(1.25 + (t - 9.6) * 0.06, 1.25 + (t - 9.6) * 0.06);
      gb.translate(-480, -270);
      gb.setTransform(gb.getTransform().multiply(new DOMMatrix([p3.s * 0.5, 0, 0, p3.s * 0.5, p3.ox * 0.5, p3.oy * 0.5])));
      gb.strokeStyle = `rgba(143,216,255,${0.16 * showD})`;
      gb.lineWidth = 2.2 / (p3.s * 0.5);
      gb.stroke(GG.path2d("3"));
      gb.restore();
      gb.filter = "none";
    }
    tex.needsUpdate = true;
    texB.needsUpdate = true;
    matShow.uniforms.uTex.value = tex;
    matShow.uniforms.uTexB.value = texB;
    E.pass(matShow, target);
    // the geometry zoom lands at rest on these rows, so the type world starts sharp (no carried-over zoom blur)
    return { bloom: 0.32, bloomThreshold: 1.05, speed: U.seg(t, T_BEND0, T_BEND1) * (1 - U.seg(t, 9.7, T_BEND1)) * 0.3 };
  }

  const matShow = E.material(`
    uniform sampler2D uTex, uTexB;
    void main(){
      vec3 a = srgbToLin(texture(uTex, vUv).rgb) * .9;
      vec4 b = texture(uTexB, vUv);
      vec3 lb = srgbToLin(b.rgb);
      vec3 col = C_VOID + lb * b.a * 1.2;
      col = max(col, a);
      float sat = max(a.r, max(a.g, a.b)) - min(a.r, min(a.g, a.b));
      col += a * sat * .4;
      fragColor = vec4(col, 1.);
    }`, { uTex: { value: null }, uTexB: { value: null } });

  return { id: "type", render };
};
