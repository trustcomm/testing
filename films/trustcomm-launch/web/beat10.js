// Beat 10 — "Then they choose." (BRIEF §4; F7; compliance §2.1)
// The phone with the ticked chips (carry in) → the screen divides into two paths of exactly equal size, colour,
// brightness and pulse: "Post on Google" and "Tell the owner privately". The customer's thumb hovers between them
// and does not choose. Mirror symmetry is checked numerically (state()).
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { mentionsPage, phone, rrect, screenRect, txt } from "./ui.js";

const B = 60 / 124;
const q = (s) => Math.round(s * 30) / 30;
const DUR = 3.8; // Beat 10's length (beats.json); the thumb's sway is fitted to the hover window
export const T = { split: q(B), splitEnd: q(B + 0.64), fade: 0.2, content: q(0.95), thumbIn: q(0.95), thumbSet: q(1.6) };
// Heartbeat-like pulse every 2 beats from beat 3 (a double thump). The music will carry this; until then a
// code-synthesised placeholder thump is mixed for the style frame.
export const BEATS = [3, 5, 7].map((k) => q(k * B));
const PS = 1.16;
const SC = screenRect(960, 540, PS);
const CARD = { w: 520, h: 600, gap: 120, y: 220, r: 48 };
const LBL = [["Post on", "Google"], ["Tell the owner", "privately"]];

const ease = (lt) => snap(prog(lt, T.split, T.splitEnd));
function rects(lt) {
  const p = ease(lt);
  const L0 = { x: SC.x, y: SC.y, w: SC.w / 2, h: SC.h, r: SC.r }, R0 = { x: SC.x + SC.w / 2, y: SC.y, w: SC.w / 2, h: SC.h, r: SC.r };
  const L1 = { x: 960 - CARD.gap / 2 - CARD.w, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r }, R1 = { x: 960 + CARD.gap / 2, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r };
  const mid = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], p)]));
  return { L: mid(L0, L1), R: mid(R0, R1), p };
}
export function pulse(lt) {
  let v = 0;
  for (const t of BEATS) for (const [dt, a] of [[0, 1], [q(0.17), 0.6]]) if (lt >= t + dt) v += a * Math.exp(-(lt - t - dt) * 9);
  return v;
}
const thumb = (lt) => {
  const p = snap(prog(lt, T.thumbIn, T.thumbSet));
  // exactly one full sway (left and right equally) across the hover, so the thumb favours neither path
  const sway = lt > T.thumbSet ? Math.sin((2 * Math.PI * (lt - T.thumbSet)) / (DUR - T.thumbSet)) : 0;
  return { x: 960 + 24 * sway, y: lerp(1360, 900, p), rot: 0.05 * sway };
};

function icon(ctx, kind, cx, cy, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = col("blue");
  ctx.fillStyle = col("blue");
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === 0) {
    // a draft review card with a pencil: written and posted by the customer, in their own name (F7)
    rrect(ctx, cx - 74, cy - 84, 148, 168, 22);
    ctx.stroke();
    for (const [y, w] of [[-38, 84], [-6, 84], [26, 52]]) { ctx.beginPath(); ctx.moveTo(cx - 42, cy + y); ctx.lineTo(cx - 42 + w, cy + y); ctx.stroke(); }
    ctx.save();
    ctx.translate(cx + 66, cy + 58);
    ctx.rotate(-Math.PI / 4);
    rrect(ctx, -14, -62, 28, 96, 8);
    ctx.fillStyle = col("white");
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, 34); ctx.lineTo(0, 56); ctx.lineTo(14, 34); ctx.stroke();
    ctx.restore();
  } else {
    // a private message to the owner: an envelope with a small lock
    rrect(ctx, cx - 92, cy - 62, 184, 124, 20);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 82, cy - 50); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx + 82, cy - 50); ctx.stroke();
    ctx.fillStyle = col("white");
    rrect(ctx, cx + 46, cy + 22, 64, 54, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 78, cy + 22, 18, Math.PI, 0); ctx.stroke();
  }
  ctx.restore();
}

function card(ctx, r, side, lt, p) {
  const pu = pulse(lt);
  const s = 1 + 0.02 * pu;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  if (pu > 0.01 && p >= 1) {
    const g = 10 + 22 * clamp(pu);
    ctx.strokeStyle = rgba("blue", 0.22 * clamp(pu));
    ctx.lineWidth = 14;
    rrect(ctx, r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, r.r + g);
    ctx.stroke();
  }
  ctx.fillStyle = col("white");
  rrect(ctx, r.x, r.y, r.w, r.h, r.r);
  ctx.fill();
  if (p > 0) {
    ctx.strokeStyle = col("blue");
    ctx.lineWidth = 6 * p;
    ctx.stroke();
  }
  const a = prog(lt, T.content, T.content + 0.3);
  if (a > 0) {
    icon(ctx, side, cx, r.y + 210, a);
    LBL[side].forEach((l, i) => txt(ctx, l, cx, r.y + 410 + i * 60, { size: 46, weight: 700, fill: "ink", alpha: a }));
  }
  ctx.restore();
}

function drawThumb(ctx, lt) {
  const t = thumb(lt);
  if (t.y >= 1300) return;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.rot);
  ctx.fillStyle = rgba("ink", 0.1);
  rrect(ctx, -58, 24, 136, 420, 68);
  ctx.fill();
  ctx.fillStyle = col("skin");
  rrect(ctx, -68, 0, 136, 420, 68);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  rrect(ctx, -40, 18, 80, 92, 34);
  ctx.fill();
  ctx.restore();
}

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    const { L, R, p } = rects(lt);
    const body = 1 - prog(lt, T.split, T.split + T.fade);
    if (body > 0) phone(ctx, 960, 540, (c, sr) => mentionsPage(c, sr, { alpha: 1 - prog(lt, T.split, T.split + 0.1) }), { alpha: body, s: PS });
    if (lt >= T.split) {
      card(ctx, L, 0, lt, p);
      card(ctx, R, 1, lt, p);
    }
    drawThumb(ctx, lt);
  },
  /** Carry in: the phone screen with the ticked chips. Carry out: both paths, equal. */
  carry(lt) {
    if (lt <= T.split) return { kind: "screen", ...SC, colour: "white" };
    const { L, R } = rects(lt);
    return { kind: "paths", x: L.x, y: L.y, w: R.x + R.w - L.x, h: L.h, r: L.r, colour: "white" };
  },
  track(lt) {
    const { L, R } = rects(lt), t = thumb(lt);
    return [[L.x, L.y], [L.x + L.w, L.y + L.h], [R.x, R.y], [R.x + R.w, R.y + R.h], [t.x, t.y]];
  },
  /** Numbers for the equal-split compliance check. */
  state(lt) {
    const { L, R } = rects(lt);
    return { L, R, pulseL: pulse(lt), pulseR: pulse(lt), thumbX: thumb(lt).x };
  },
  events() {
    return [
      { t: T.split, sfx: "SFX04", gain: -12, what: "the screen splits into two paths" },
      { t: T.thumbIn, sfx: "SFX04", gain: -22, what: "thumb rises into frame", rate: 0.85 },
      ...BEATS.flatMap((t) => [{ t, sfx: "HEART", gain: -10, what: "pulse (music stand-in)" }, { t: q(t + 0.17), sfx: "HEART", gain: -14, what: "pulse, second thump" }]),
    ];
  },
};
