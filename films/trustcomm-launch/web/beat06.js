// Beat 6 — "Customers scan. No app. No sign-in." (BRIEF §4; F4)
// Rebuilt 2026-10-05 on the real /r/demo rating screen (ui/demo-1).
// The counter stand's QR (carry in) → a phone slides in, its viewfinder corners snap onto the code (scan lock),
// the screen opens the rating page at once; "No app" / "No sign-in" stamp as chips on the spoken words;
// the camera pushes into the phone screen (carry out).
import { clamp, lerp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { chip, phone, qr, ratingPage, rrect, screenRect, txt } from "./ui.js";

const B = 60 / 124;
const F = 1 / 30;
// VO6 word onsets (vo/VO6.mp3 = VO6_t1, measured): "No app." 1.216 s, "No sign-in." 1.750 s. Picture leads by 1 frame.
const q = (s) => Math.round(s * 30) / 30; // event times sit on frames, so picture and sound share a frame
export const T = { enter: q(0.04), settle: q(0.62), lock: q(0.86), open: q(2 * B), pop: q(1.1), app: q(1.216) - F, signin: q(1.75) - F, push: q(5 * B) };
const STAND = { w: 460, h: 630, head: 132, y: 560 };
const QS = 320;
const PS = 1.16; // phone scale (873 px tall)
const PH = { x0: 1600, y0: 1560, x1: 1170, y1: 548 };
const CHIPS = { x: 1630, y1: 430, y2: 566, size: 46 };

const standX = (lt) => lerp(960, 560, snap(prog(lt, 0.08, T.settle)));
const phoneAt = (lt) => {
  const p = snap(prog(lt, T.enter, T.settle));
  return { x: lerp(PH.x0, PH.x1, p), y: lerp(PH.y0, PH.y1, p), rot: 0.16 * (1 - p) };
};
const qrRect = (sx) => ({ x: sx - QS / 2, y: STAND.y - STAND.h / 2 + STAND.head + 52, w: QS, h: QS });

function stand(ctx, sx) {
  const x = sx - STAND.w / 2, y = STAND.y - STAND.h / 2;
  ctx.fillStyle = rgba("ink", 0.1);
  rrect(ctx, x + 12, y + 20, STAND.w, STAND.h, 36);
  ctx.fill();
  ctx.fillStyle = col("white");
  rrect(ctx, x, y, STAND.w, STAND.h, 36);
  ctx.fill();
  ctx.save();
  rrect(ctx, x, y, STAND.w, STAND.h, 36);
  ctx.clip();
  ctx.fillStyle = col("shop");
  ctx.fillRect(x, y, STAND.w, STAND.head);
  ctx.restore();
  txt(ctx, "Meera's Tiffin Room", sx, y + 82, { size: 36, weight: 700, fill: "ink" });
  const q = qrRect(sx);
  qr(ctx, q.x, q.y, QS);
  // foot of the counter stand
  ctx.fillStyle = col("sand");
  rrect(ctx, sx - STAND.w * 0.42, y + STAND.h - 6, STAND.w * 0.84, 34, 17);
  ctx.fill();
}

function viewfinder(ctx, sr, lt) {
  ctx.fillStyle = col("ink");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  const cx = sr.x + sr.w / 2, cy = sr.y + sr.h / 2 - 20;
  const q = 210;
  // live camera image of the code: slight drift that settles as it locks
  const drift = 10 * (1 - prog(lt, T.settle, T.lock));
  ctx.fillStyle = col("white");
  rrect(ctx, cx - q / 2 - 18 + drift, cy - q / 2 - 18, q + 36, q + 36, 18);
  ctx.fill();
  qr(ctx, cx - q / 2 + drift, cy - q / 2, q);
  // corner brackets snap in onto the code
  const k = snap(prog(lt, T.settle, T.lock));
  const m = lerp(70, 0, k) + 30;
  const L = 34, half = q / 2 + m;
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
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    stand(ctx, standX(lt));
    const p = phoneAt(lt);
    phone(ctx, p.x, p.y, screen(lt), { rot: p.rot, s: PS });
    stamp(ctx, "No app", CHIPS.x, CHIPS.y1, T.app, lt);
    stamp(ctx, "No sign-in", CHIPS.x, CHIPS.y2, T.signin, lt);
  },
  /** Carry in: the stand's QR code. Carry out: the phone screen (Beat 7 opens on it). */
  carry(lt, e) {
    if (lt <= 0) return { kind: "qr", ...qrRect(standX(0)), colour: "ink" };
    const p = phoneAt(lt);
    return { kind: "screen", ...screenRect(p.x, p.y, PS), colour: "white" };
  },
  track(lt) {
    const p = phoneAt(lt), c = Math.cos(p.rot), s = Math.sin(p.rot);
    const hw = 180 * PS, hh = 370 * PS;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [p.x + a * hw * c - b * hh * s, p.y + a * hw * s + b * hh * c]);
    pts.push([standX(lt), STAND.y]);
    return pts;
  },
  /** Sounds, tight to the frames that cause them (s into the beat). gain in dB below the VO. */
  events() {
    return [
      { t: T.enter, sfx: "SFX04", gain: -14, what: "phone slides in" },
      { t: T.settle, sfx: "SFX02", gain: -10, what: "viewfinder corners snap on (scan lock)" },
      { t: T.open, sfx: "SFX01", gain: -12, what: "rating page opens" },
      { t: T.app, sfx: "SFX03", gain: -9, what: "'No app' stamp" },
      { t: T.signin, sfx: "SFX03", gain: -9, what: "'No sign-in' stamp", rate: 1.06 },
      { t: T.push, sfx: "SFX04", gain: -20, what: "camera pushes into the screen" },
    ];
  },
};
