// Leader markings over every frame: the discipline label (top-left) with a mechanical scramble on each bar change,
// the count (top-right), corner registration ticks. Drawn only when something changes (upload is skipped otherwise).
window.Overlay = function (E) {
  const { THREE } = E;
  const { U } = window;
  const C = window.CUES;
  const W = 1920, H = 1080;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+-=";
  let lastKey = "";

  function barAt(t) {
    let b = 0;
    for (let i = 0; i < C.bars.length; i++) if (t >= C.bars[i].t0 - 1e-6) b = i;
    return b;
  }
  function scramble(text, t, t0, frame) {
    const dur = 0.16;
    const k = (t - t0) / dur;
    if (k >= 1) return text;
    const r = U.rng(frame * 31 + 7);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === " " || ch === "&" || ch === "·") { out += ch; continue; }
      out += i / text.length < k ? ch : GLYPHS[Math.floor(r() * GLYPHS.length)];
    }
    return out;
  }

  function draw(t, info) {
    const frame = Math.round(t * C.fps);
    const b = barAt(t);
    const bar = C.bars[b];
    // fade the markings under white-outs and for the lockup (it carries its own type)
    const white = (info && info.exposure ? U.clamp((info.exposure - 1) / 1.2) : 0);
    const lockFade = t >= 13.125 ? 1 : 0;
    const alpha = (1 - white) * (1 - lockFade) * U.seg(t, 0.12, 0.35);
    const label = (bar.n ? bar.n.padStart(2, "0") + "  —  " : "") + bar.name;
    const shown = scramble(label, t, bar.t0, frame);
    const count = bar.n ? "0" + bar.n : "--";
    const key = shown + "|" + count + "|" + alpha.toFixed(2);
    if (key === lastKey) return tex;
    lastKey = key;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    if (alpha <= 0.005) { tex.needsUpdate = true; return tex; }
    g.globalAlpha = alpha;
    g.fillStyle = "rgba(237,230,218,0.82)";
    g.font = "500 22px 'Geist Mono'";
    g.letterSpacing = "3px";
    g.textBaseline = "top";
    g.fillText(shown, 96, 72);
    g.textAlign = "right";
    g.fillText("SHOWREEL 2026", W - 96, 72);
    g.textAlign = "left";
    // the count, bottom-right, with its leader dots (one per remaining numeral)
    g.font = "500 22px 'Geist Mono'";
    g.textAlign = "right";
    g.fillText(count, W - 96, H - 94);
    g.textAlign = "left";
    const remaining = bar.n ? Number(bar.n) - 1 : 0;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc(96 + i * 22, H - 83, 4, 0, Math.PI * 2);
      g.fillStyle = i < 7 - remaining ? "rgba(255,74,36,0.95)" : "rgba(237,230,218,0.35)";
      g.fill();
    }
    // corner registration ticks
    g.strokeStyle = "rgba(237,230,218,0.5)";
    g.lineWidth = 2;
    const tk = (x, y, sx, sy) => { g.beginPath(); g.moveTo(x + sx * 26, y); g.lineTo(x, y); g.lineTo(x, y + sy * 26); g.stroke(); };
    tk(48, 48, 1, 1); tk(W - 48, 48, -1, 1); tk(48, H - 48, 1, -1); tk(W - 48, H - 48, -1, -1);
    g.globalAlpha = 1;
    g.letterSpacing = "0px";
    tex.needsUpdate = true;
    return tex;
  }
  return { draw };
};
