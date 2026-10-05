// Beat 6 — "Customers scan. No app. No sign-in." (BRIEF §4; F4), on the real /r/demo rating screen (ui/demo-1).
// The counter stand's QR (carry in) → a phone slides in, its viewfinder corners snap onto the code (scan lock),
// the screen opens the rating page at once; "No app" / "No sign-in" stamp as chips on the spoken words;
// the view pushes into the phone screen (carry out: the screen, centred, for Beat 7). The camera is static; the
// push is this module's own view transform.
import { clamp, lerp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { B, F, P_BIG, q, qrRect, stand } from "./kit.js";
import { chip, phone, qr, ratingPage, rrect, screenRect } from "./ui.js";

// VO6 word onsets (vo/VO6.mp3 = VO6_t1, measured): "No app." 1.216 s, "No sign-in." 1.750 s. Picture leads by 1 frame.
export const T = { enter: q(0.04), settle: q(0.62), lock: q(0.86), open: q(2 * B), pop: q(1.1), app: q(1.216) - F, signin: q(1.75) - F, push: q(5 * B) };
const PS = 1.16; // phone scale before the push
const PH = { x0: 1600, y0: 1560, x1: 1170, y1: 548 };
const CHIPS = { x: 1630, y1: 430, y2: 566, size: 46 };
const DUR = 3.9;

const standX = (lt) => lerp(960, 560, snap(prog(lt, 0.08, T.settle)));
const phoneAt = (lt) => {
  const p = snap(prog(lt, T.enter, T.settle));
  return { x: lerp(PH.x0, PH.x1, p), y: lerp(PH.y0, PH.y1, p), rot: 0.16 * (1 - p) };
};
// The push: zoom about the phone so it ends centred at P_BIG (scale PS × 1.18).
const view = (lt) => {
  const p = snap(prog(lt, T.push, DUR));
  return { z: lerp(1, P_BIG.s / PS, p), cx: lerp(960, PH.x1, p), cy: lerp(540, PH.y1, p) };
};
const applyView = (ctx, v) => { ctx.translate(960, 540); ctx.scale(v.z, v.z); ctx.translate(-v.cx, -v.cy); };
const toScreen = (v, [x, y]) => [960 + (x - v.cx) * v.z, 540 + (y - v.cy) * v.z];

function viewfinder(ctx, sr, lt) {
  ctx.fillStyle = col("ink");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  const cx = sr.x + sr.w / 2, cy = sr.y + sr.h / 2 - 20;
  const qs = 210;
  const drift = 10 * (1 - prog(lt, T.settle, T.lock));
  ctx.fillStyle = col("white");
  rrect(ctx, cx - qs / 2 - 18 + drift, cy - qs / 2 - 18, qs + 36, qs + 36, 18);
  ctx.fill();
  qr(ctx, cx - qs / 2 + drift, cy - qs / 2, qs);
  const k = snap(prog(lt, T.settle, T.lock));
  const m = lerp(70, 0, k) + 30;
  const L = 34, half = qs / 2 + m;
  const locked = lt >= T.lock;
  ctx.strokeStyle = locked ? col("blue") : col("white");
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * half, y = cy + sy * half;
    ctx.beginPath();
    ctx.moveTo(x, y - sy * L);
    ctx.lineTo(x, y);
    ctx.lineTo(x - sx * L, y);
    ctx.stroke();
  }
  if (locked) {
    const a = 1 - prog(lt, T.lock, T.lock + 0.3);
    if (a > 0) {
      ctx.strokeStyle = rgba("blue", 0.6 * a);
      ctx.lineWidth = 4;
      rrect(ctx, cx - half - 14 * (1 - a) - 8, cy - half - 14 * (1 - a) - 8, 2 * half + 28 * (1 - a) + 16, 2 * half + 28 * (1 - a) + 16, 22);
      ctx.stroke();
    }
  }
}

function screen(lt) {
  return (ctx, sr) => {
    viewfinder(ctx, sr, lt);
    const w = snap(prog(lt, T.open, T.open + 0.3));
    if (w <= 0) return;
    const cx = sr.x + sr.w / 2, cy = sr.y + sr.h / 2 - 20;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, w * Math.hypot(sr.w, sr.h), 0, Math.PI * 2);
    ctx.clip();
    ratingPage(ctx, sr, { pop: prog(lt, T.pop, T.pop + 0.5) });
    ctx.restore();
  };
}

function stamp(ctx, label, x, y, t0, lt) {
  if (lt < t0) return;
  const d = lt - t0;
  chip(ctx, label, x, y, { size: CHIPS.size, fill: "blue", ink: "white", s: 1.55 - 0.55 * spring(d, 4.2, 0.5), alpha: clamp((d + F) / (2 * F)), rot: lerp(-0.16, -0.05, clamp(d / 0.2)) });
}

export default {
  T,
  render(ctx, lt) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    ctx.save();
    applyView(ctx, view(lt));
    stand(ctx, standX(lt));
    const p = phoneAt(lt);
    phone(ctx, p.x, p.y, screen(lt), { rot: p.rot, s: PS });
    stamp(ctx, "No app", CHIPS.x, CHIPS.y1, T.app, lt);
    stamp(ctx, "No sign-in", CHIPS.x, CHIPS.y2, T.signin, lt);
    ctx.restore();
  },
  /** Carry in: the stand's QR code. Carry out: the phone screen, centred and pushed in (Beat 7 opens on it). */
  carry(lt, e) {
    if (lt <= 0) return { kind: "qr", ...qrRect(standX(0)), colour: "ink" };
    if (lt >= e.dur - 1e-9) return { kind: "screen", ...screenRect(P_BIG.x, P_BIG.y, P_BIG.s), colour: "paper" };
    const p = phoneAt(lt), v = view(lt), r = screenRect(p.x, p.y, PS);
    const [x, y] = toScreen(v, [r.x, r.y]);
    return { kind: "screen", x, y, w: r.w * v.z, h: r.h * v.z, r: r.r * v.z, colour: "paper" };
  },
  track(lt) {
    const p = phoneAt(lt), c = Math.cos(p.rot), s = Math.sin(p.rot), v = view(lt);
    const hw = 180 * PS, hh = 370 * PS;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [p.x + a * hw * c - b * hh * s, p.y + a * hw * s + b * hh * c]);
    pts.push([standX(lt), 560]);
    return pts.map((pt) => toScreen(v, pt));
  },
  events() {
    return [
      { t: T.enter, sfx: "SFX04", gain: -14, what: "phone slides in" },
      { t: T.settle, sfx: "SFX02", gain: -10, what: "viewfinder corners snap on (scan lock)" },
      { t: T.open, sfx: "SFX01", gain: -12, what: "rating page opens" },
      { t: T.app, sfx: "SFX03", gain: -9, what: "'No app' stamp" },
      { t: T.signin, sfx: "SFX03", gain: -9, what: "'No sign-in' stamp", rate: 1.06 },
      { t: T.push, sfx: "SFX04", gain: -20, what: "push into the screen" },
    ];
  },
};
