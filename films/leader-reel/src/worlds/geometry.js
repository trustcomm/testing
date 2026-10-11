// World "4 · Geometry & masks": the frozen 5 cracks along straight lines into its parts — top bar, stem, bowl —
// which fly (bbox morphs with a mid-flight swap) into the 4's crossbar and stem while the bowl rolls out into the
// leader circle. An infra diagonal stamps in, the 4's open counter fills with stripes of tiny type through a mask, a
// pie-wedge sweep reveals a dot grid behind, dots pulse on 16ths. On beat 4 the camera zooms into the stripes.
window.WorldGeometry = function (E) {
  const { THREE } = E;
  const { U } = window;
  const GG = window.GL_GLYPH;
  const SH = window.SHARED;
  const T0 = 7.265625, T_CLACK = 7.5, T_LOCK = 8.4375, T_ZOOM = 8.90625, T1 = 9.375;
  const B = 0.46875, E8 = B / 2, E16 = B / 4;
  const BONE = "#EDE6DA", INFRA = "#FF4A24", ICE = "#8FD8FF", VOID = "#06070B", SLATE = "#1B2230";

  const cv = document.createElement("canvas");
  cv.width = 1920;
  cv.height = 1080;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  const p5 = SH.place("5"), p4 = SH.place("4");
  const path5 = GG.path2d("5"), path4 = GG.path2d("4");
  // piece regions in font units (clip paths)
  const rect = (x0, y0, x1, y1) => { const p = new Path2D(); p.rect(x0, y0, x1 - x0, y1 - y0); return p; };
  const poly = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) p.lineTo(q[0], q[1]); p.closePath(); return p; };
  const R5 = {
    bar: rect(300, -720, 780, -515),
    stem: rect(20, -720, 300, -300),
    bowl: (() => { const p = new Path2D(); p.rect(-50, -760, 900, 800); p.rect(300, -720, 480, 205); p.rect(20, -720, 280, 420); return p; })(),
  };
  const R4 = {
    diag: poly([[0, -286], [215, -286], [530, -712], [240, -712], [0, -300]]),
    bar: rect(0, -292, 820, -137),
    stem: poly([[438, 2], [438, -430], [564, -642], [682, -642], [682, 2]]),
  };
  // screen-space bboxes of each piece (font bbox ∩ region, measured once by rasterizing)
  function measure(path, region, pl, evenodd) {
    const c = document.createElement("canvas");
    c.width = 1920; c.height = 1080;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.setTransform(pl.s, 0, 0, pl.s, pl.ox, pl.oy);
    x.clip(region, evenodd ? "evenodd" : "nonzero");
    x.fillStyle = "#fff";
    x.fill(path);
    const d = x.getImageData(0, 0, 1920, 1080).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let yy = 0; yy < 1080; yy += 2) for (let xx = 0; xx < 1920; xx += 2) if (d[(yy * 1920 + xx) * 4 + 3] > 128) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    return [x0, y0, x1 + 2, y1 + 2];
  }
  const BB = {
    bar5: measure(path5, R5.bar, p5), stem5: measure(path5, R5.stem, p5), bowl5: measure(path5, R5.bowl, p5, true),
    diag4: measure(path4, R4.diag, p4), bar4: measure(path4, R4.bar, p4), stem4: measure(path4, R4.stem, p4),
  };
  const CIRC = { x: 960, y: 540, r: 452 };
  const lerpBox = (a, b, k) => a.map((v, i) => U.mix(v, b[i], k));

  // draw `path` clipped to `region` (font units, placement pl) so that its bbox `from` lands on box `to`
  function drawPiece(path, region, pl, from, to, fill, alpha, evenodd) {
    if (alpha <= 0.002) return;
    const sx = (to[2] - to[0]) / (from[2] - from[0]), sy = (to[3] - to[1]) / (from[3] - from[1]);
    g.save();
    g.globalAlpha = alpha;
    g.transform(sx, 0, 0, sy, to[0] - from[0] * sx, to[1] - from[1] * sy);
    g.transform(pl.s, 0, 0, pl.s, pl.ox, pl.oy);
    g.clip(region, evenodd ? "evenodd" : "nonzero");
    g.fillStyle = fill;
    g.fill(path);
    g.restore();
  }
  // morph piece A (5) → piece B (4) by interpolating boxes with a mid-flight swap
  function morph(k, a, b, colA, colB) {
    const box = lerpBox(a.box, b.box, k);
    const sw = U.sstep(0.38, 0.62, k);
    drawPiece(a.path, a.region, a.pl, a.box, box, colA, 1 - sw, a.evenodd);
    drawPiece(b.path, b.region, b.pl, b.box, box, colB, sw, b.evenodd);
  }

  function stripes(t, zoom) {
    // rows of tiny type clipped to the 4's counter; drawn in screen space under the camera transform
    g.save();
    g.beginPath();
    SH.counterPoly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.clip();
    const reveal = U.seg(t, 7.96875, 8.30, U.E.p3out);
    g.fillStyle = "rgba(237,230,218,0.92)";
    g.font = `600 ${SH.FONT_PX}px Archivo`;
    g.textBaseline = "middle";
    for (let k = 0; k < SH.ROWS; k++) {
      const y = SH.rowY(k);
      const wipe = U.clamp(reveal * 1.6 - (k / SH.ROWS) * 0.6);
      if (wipe <= 0) continue;
      g.save();
      g.beginPath();
      g.rect(0, y - SH.ROW_PX / 2, 1920 * wipe, SH.ROW_PX);
      g.clip();
      g.fillText(SH.rowText(k), SH.rowX(k, t), y);
      g.restore();
    }
    g.restore();
  }

  function render(t, target) {
    // camera: slight push, then the zoom into the counter stripes
    const zk = U.seg(t, T_ZOOM, T1, U.E.expoIn);
    const zoom = U.mix(1.0, 1.035, U.seg(t, T0, T_ZOOM, U.E.sineIo)) * Math.exp(Math.log(SH.ZOOM_END / 1.035) * zk);
    const f = SH.focus;
    const fx = U.mix(960, f[0], U.seg(t, T_ZOOM - 0.1, T1, U.E.p2io)), fy = U.mix(540, f[1], U.seg(t, T_ZOOM - 0.1, T1, U.E.p2io));
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = VOID;
    g.fillRect(0, 0, 1920, 1080);
    // zoom about the focus, keeping it at screen centre as it locks
    const cx = U.mix(960, 960, zk), cy = 540;
    g.setTransform(zoom, 0, 0, zoom, cx - fx * zoom, cy - fy * zoom);

    // --- dot grid behind, revealed by the pie-wedge sweep (16th-note pulse)
    const sweep = U.seg(t, 8.203125, T_ZOOM + 0.3, U.E.p2io) * Math.PI * 2;
    if (sweep > 0.001) {
      g.save();
      g.beginPath();
      g.moveTo(CIRC.x, CIRC.y);
      g.arc(CIRC.x, CIRC.y, CIRC.r - 6, -Math.PI / 2, -Math.PI / 2 + sweep);
      g.closePath();
      g.clip();
      g.fillStyle = "rgba(143,216,255,0.10)";
      g.fillRect(CIRC.x - CIRC.r, CIRC.y - CIRC.r, CIRC.r * 2, CIRC.r * 2);
      const n16 = Math.floor((t - 8.203125) / E16);
      for (let yy = -12; yy <= 12; yy++) for (let xx = -12; xx <= 12; xx++) {
        const px = CIRC.x + xx * 36, py = CIRC.y + yy * 36;
        const wave = ((xx + yy + 48 - n16 * 3) % 8 + 8) % 8 === 0 ? 1 : 0;
        g.fillStyle = wave ? "rgba(143,216,255,0.95)" : "rgba(237,230,218,0.32)";
        g.beginPath();
        g.arc(px, py, wave ? 4.2 : 2.4, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      // the sweep's leading edge (the leader's hand)
      const a = -Math.PI / 2 + sweep;
      g.strokeStyle = ICE;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(CIRC.x, CIRC.y);
      g.lineTo(CIRC.x + Math.cos(a) * (CIRC.r - 6), CIRC.y + Math.sin(a) * (CIRC.r - 6));
      g.stroke();
    }

    // --- pieces
    const kClack = U.E.backOut(U.seg(t, T_CLACK, T_CLACK + 0.16), 2.2);
    const crack = U.seg(t, 7.40, T_CLACK);
    const kBar = U.E.p3io(U.seg(t, 7.53, 7.80));
    const kStem = U.E.p3io(U.seg(t, 7.62, 7.92));
    const kBowl = U.E.p3io(U.seg(t, 7.55, 7.97));
    const kDiag = U.E.backOut(U.seg(t, 7.734375, 7.96875), 1.4);
    const lock = U.seg(t, T_LOCK, T_LOCK + 0.12);
    const pulse = 1 + 0.025 * Math.sin(U.seg(t, T_LOCK, T_LOCK + 0.18) * Math.PI);
    // clack offsets: pieces jump apart a little, then fly
    const jump = (box, dx, dy, k) => [box[0] + dx * k, box[1] + dy * k, box[2] + dx * k, box[3] + dy * k];
    const bar5 = jump(BB.bar5, 26, -22, kClack * (1 - kBar));
    const stem5 = jump(BB.stem5, -30, -6, kClack * (1 - kStem));
    const bowl5 = jump(BB.bowl5, 10, 28, kClack * (1 - kBowl));

    // leader circle (the bowl's destination): ring stroke grows as the bowl arrives
    const ringA = U.seg(t, 7.8, 7.97);
    if (ringA > 0) {
      g.strokeStyle = `rgba(143,216,255,${0.9 * ringA})`;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(CIRC.x, CIRC.y, CIRC.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.seg(t, 7.8, 8.05, U.E.p2out));
      g.stroke();
      // registration ticks at the quadrants (pop on the 8th)
      const tk = U.E.backOut(U.seg(t, 8.203125, 8.33), 2);
      g.fillStyle = BONE;
      for (let q = 0; q < 4; q++) {
        const a = (q * Math.PI) / 2;
        const x = CIRC.x + Math.cos(a) * (CIRC.r + 26), y = CIRC.y + Math.sin(a) * (CIRC.r + 26);
        g.save();
        g.translate(x, y);
        g.rotate(a);
        g.fillRect(-2, -14 * tk, 4, 28 * tk);
        g.restore();
      }
    }

    // bowl → circle: the bowl rolls out, scales up and becomes the ring's disc, then fades into the ring
    if (kBowl < 1) {
      const target = [CIRC.x - CIRC.r, CIRC.y - CIRC.r, CIRC.x + CIRC.r, CIRC.y + CIRC.r];
      const box = lerpBox(bowl5, target, kBowl);
      const alpha = 1 - U.seg(kBowl, 0.55, 1.0);
      const col = kBowl < 0.5 ? BONE : SLATE;
      g.save();
      const cxb = (box[0] + box[2]) / 2, cyb = (box[1] + box[3]) / 2;
      g.translate(cxb, cyb);
      g.rotate(kBowl * Math.PI * 1.5);
      g.translate(-cxb, -cyb);
      drawPiece(path5, R5.bowl, p5, BB.bowl5, box, col, alpha, true);
      g.restore();
    }
    // the diagonal stamps in from the top-left along its own axis
    if (kDiag > 0) {
      const off = (1 - kDiag) * 520;
      const dbox = [BB.diag4[0] - off * 0.6, BB.diag4[1] - off, BB.diag4[2] - off * 0.6, BB.diag4[3] - off];
      drawPiece(path4, R4.diag, p4, BB.diag4, scaleBox(dbox, pulse), INFRA, U.seg(t, 7.734375, 7.80));
    }
    // top bar → crossbar, stem → stem
    morph(kBar, { path: path5, region: R5.bar, pl: p5, box: bar5 }, { path: path4, region: R4.bar, pl: p4, box: scaleBox(BB.bar4, pulse) }, BONE, BONE);
    morph(kStem, { path: path5, region: R5.stem, pl: p5, box: stem5 }, { path: path4, region: R4.stem, pl: p4, box: scaleBox(BB.stem4, pulse) }, BONE, BONE);
    // crack lines (anticipation before the clack)
    if (crack > 0 && kClack < 0.15) {
      g.save();
      g.setTransform(zoom * p5.s, 0, 0, zoom * p5.s, cx - fx * zoom + p5.ox * zoom, cy - fy * zoom + p5.oy * zoom);
      g.strokeStyle = VOID;
      g.lineWidth = 9;
      g.beginPath();
      const L = crack;
      g.moveTo(300, -720); g.lineTo(300, -720 + 420 * L);
      g.moveTo(300, -515); g.lineTo(300 + 480 * L, -515);
      g.moveTo(20, -300); g.lineTo(20 + 280 * L, -300);
      g.stroke();
      g.restore();
    }
    // the counter: stripes of type through the mask
    stripes(t, zoom);
    // lock flash: a thin ice outline traces the finished 4 once
    if (lock > 0 && lock < 1) {
      g.save();
      g.transform(p4.s, 0, 0, p4.s, p4.ox, p4.oy);
      g.strokeStyle = `rgba(143,216,255,${(1 - lock) * 0.9})`;
      g.lineWidth = 3 / p4.s;
      g.stroke(path4);
      g.restore();
    }
    tex.needsUpdate = true;
    matShow.uniforms.uTex.value = tex;
    matShow.uniforms.uZoomBlur.value = zk;
    E.pass(matShow, target);
    return { bloom: 0.3, bloomThreshold: 1.1, speed: zk * 0.6, zoomBlur: zk * 0.25, zoomCenter: [0.5, 0.5], grain: 0.03 };
  }
  function scaleBox(b, s) {
    if (s === 1) return b;
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    return [cx + (b[0] - cx) * s, cy + (b[1] - cy) * s, cx + (b[2] - cx) * s, cy + (b[3] - cy) * s];
  }

  const matShow = E.material(`
    uniform sampler2D uTex; uniform float uZoomBlur;
    void main(){
      vec3 c = texture(uTex, vUv).rgb;
      vec3 lin = srgbToLin(c);
      // bone sits at 0.9× (matches the frozen glass 5); ice/infra elements get a touch of glow
      float sat = max(lin.r, max(lin.g, lin.b)) - min(lin.r, min(lin.g, lin.b));
      lin *= .9 + .35 * sat;
      fragColor = vec4(lin, 1.);
    }`, { uTex: { value: null }, uZoomBlur: { value: 0 } });

  return { id: "geometry", render };
};
