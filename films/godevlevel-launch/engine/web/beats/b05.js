// Beat 5: "GoDevLevel builds launch films — in code."
// The underline lifts, wiping the headline away as it passes, and collapses into the caret,
// which types the code line. On "in code." the editor window opens around it.
// In: Beat 4's underline. Out: the code editor window (exactly handoffOut).
import { alpha, FONT } from "../core/brand.js";
import { corners, drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { easeInOutCubic, easeOutCubic, lerp, prog, snap } from "../core/ease.js";
import { text } from "../core/text.js";
import { getLayout } from "./b04.js";
import { drawHeadline, wordTimes } from "./shared/headline.js";

export const CODE = [
  ["film", "ink"],
  [".", "dim"],
  ["launch", "ink"],
  ["({ ", "dim"],
  ["brand", "ink"],
  [": ", "dim"],
  ['"yours"', "orange"],
  [" })", "dim"],
];
const SRC = CODE.map((c) => c[0]).join("");
const SIZE = 64;
const BASE = 400; // code baseline (world y)
const CARET = { y: 338, w: 14, h: 80 };
const WIPE_Y = 330; // above the headline's cap height for any fitted size ≤ 140 px

const times = (e) => {
  const b = e.beat;
  const w = e.vo.words; // GoDevLevel | builds launch films | in code.
  const local = (i) => w[i].t - e.t0;
  const inCode = local(w.findIndex((x) => x.w === "in"));
  return {
    wipe: [0, 0.55 * b],
    collapse: [0.55 * b, b],
    type: [local(1), inCode - 0.08],
    window: [inCode, inCode + 0.45],
    dots: [inCode + 0.2, inCode + 0.5],
  };
};

let charW = null;
const metrics = (ctx) => {
  if (charW === null) {
    ctx.save();
    ctx.font = `500 ${SIZE}px ${FONT.mono}`;
    charW = ctx.measureText(SRC).width / SRC.length;
    ctx.restore();
  }
  const width = charW * SRC.length;
  return { charW, x0: 960 - width / 2, width };
};

const caretAt = (m, n) => ({ kind: "caret", x: m.x0 + n * m.charW - CARET.w - 4 + (n > 0 ? CARET.w + 8 : 0), y: CARET.y, w: CARET.w, h: CARET.h, r: 2, colour: "orange" });
const codeBox = (m) => ({ kind: "window", x: m.x0 - 24, y: CARET.y - 18, w: m.width + 48, h: CARET.h + 36, r: 12, stroke: 2, colour: "ink" });

// Default metrics before the first render (JetBrains Mono advance = 0.6 em); replaced by measurement.
const M = (ctx) => (ctx ? metrics(ctx) : charW ? metrics(null) : { charW: 0.6 * SIZE, x0: 960 - (0.6 * SIZE * SRC.length) / 2, width: 0.6 * SIZE * SRC.length });

function state(lt, e, m) {
  const T = times(e);
  if (lt < T.wipe[1]) {
    const p = easeInOutCubic(prog(lt, ...T.wipe));
    return { ...e.hin, y: lerp(e.hin.y, WIPE_Y, p) };
  }
  const caret0 = caretAt(m, 0);
  if (lt < T.collapse[1]) {
    const p = snap(prog(lt, ...T.collapse));
    const s = lerpCarry({ ...e.hin, y: WIPE_Y }, caret0, p);
    delete s.fill;
    return s;
  }
  const n = Math.floor(SRC.length * prog(lt, ...T.type));
  if (lt < T.window[0]) return caretAt(m, n);
  const p = easeOutCubic(prog(lt, ...T.window));
  if (p >= 1) return { ...e.hout };
  const s = lerpCarry(codeBox(m), e.hout, p);
  delete s.fill;
  return s;
}

export default {
  id: "b05",
  carry: (lt, e) => state(lt, e, M(null)),
  track(lt, e) {
    const m = M(null);
    const T = times(e);
    // The typed caret steps one character at a time: a discrete jump, not motion, so it is not tracked.
    if (lt >= T.collapse[1] && lt < T.window[0]) return [];
    return corners(state(lt, e, m));
  },
  render(ctx, lt, e) {
    const m = metrics(ctx);
    const T = times(e);
    const s = state(lt, e, m);

    // The headline from Beat 4, wiped from below by the lifting line.
    if (lt < T.wipe[1] + 0.05) {
      const L = getLayout(ctx, e.prev ? { hout: e.hin } : e);
      const prevVo = e.film.tl.beats.find((b) => b.id === "b04").vo;
      const clip = lt < T.wipe[1] ? s.y : WIPE_Y;
      drawHeadline(ctx, L, wordTimes(prevVo), Infinity, clip, e.zoom);
    }

    // Window panel and title-bar dots.
    if (lt >= T.window[0]) {
      const p = easeOutCubic(prog(lt, ...T.window));
      drawCarry(ctx, s, { panel: p });
      const d = prog(lt, ...T.dots);
      if (d > 0) {
        ctx.save();
        ctx.fillStyle = alpha("ink", 0.3 * d);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(e.hout.x + 32 + i * 26, e.hout.y + 28, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Typed code.
    const n = lt < T.type[0] ? 0 : Math.floor(SRC.length * prog(lt, ...T.type));
    let i = 0;
    for (const [tok, role] of CODE) {
      const show = Math.max(0, Math.min(tok.length, n - i));
      if (show > 0) {
        const fill = role === "dim" ? alpha("ink", 0.6) : role;
        text(ctx, tok.slice(0, show), m.x0 + i * m.charW, BASE, { family: FONT.mono, weight: 500, size: SIZE, fill, zoom: e.zoom });
      }
      i += tok.length;
    }

    // The carry: line → caret (blinking once typing stops), or the caret beside the open window.
    if (lt < T.collapse[1]) {
      drawCarry(ctx, s);
      return;
    }
    const typing = lt < T.type[1];
    const blinkOn = typing || lt < T.type[0] || Math.floor((lt - T.type[1]) / (e.beat / 2)) % 2 === 0;
    const caret = lt < T.window[0] ? s : caretAt(m, SRC.length);
    if (blinkOn) drawCarry(ctx, caret);
  },
};

/** The finished code line (for Beat 6 to carry off), with opacity a and vertical offset dy. */
export function drawCodeLine(ctx, zoom, a = 1, dy = 0) {
  const m = metrics(ctx);
  let i = 0;
  for (const [tok, role] of CODE) {
    const fill = role === "dim" ? alpha("ink", 0.6) : role;
    text(ctx, tok, m.x0 + i * m.charW, BASE + dy, { family: FONT.mono, weight: 500, size: SIZE, fill, zoom, alpha: a });
    i += tok.length;
  }
  return { caret: caretAt(m, SRC.length) };
}
