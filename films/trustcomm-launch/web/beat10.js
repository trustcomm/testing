// Beat 10 — "Then they choose." (BRIEF §4; F7; compliance §2.1), rebuilt on the real /r/demo screens.
// Carry in: the phone on the mention chips (ui/demo-1, two ticked by the customer). Continue → the real
// "Where should your words go?" screen (ui/demo-2). Its two cards lift out of the phone and settle side by side,
// exactly equal in size, colour, brightness and pulse — "Straight to the owner" and "On Google" with the product's
// own copy, "You can do both, if you like." above them. The thumb hovers on the centre line and does not choose.
// Mirror symmetry is checked numerically (state()).
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { choiceCard, chooseLayout, choosePage, phone, ratingPage, rrect, screenRect, TICKED, txt, wrap } from "./ui.js";

const B = 60 / 124;
const q = (s) => Math.round(s * 30) / 30;
const DUR = 3.8; // Beat 10's length (beats.json); the thumb's sway is fitted to the hover window
export const T = { press: q(0.2), slide: q(0.3), slideEnd: q(0.62), lift: q(2 * B), liftEnd: q(2 * B + 0.6), head: q(1.25), thumbIn: q(1.2), thumbSet: q(1.8) };
// Heartbeat-like pulse every 2 beats from beat 4 (a double thump). The music will carry this; until then a
// code-synthesised placeholder thump is mixed for the style frame.
export const BEATS = [4, 6].map((k) => q(k * B)).concat([q(7.5 * B)]);
const PS = 1.16, PX = 960, PY = 540;
const SC = screenRect(PX, PY, PS);
// Phone-screen units → world: world = SC.{x,y} + (unit - local origin) * PS. Local origin is the screen's top-left.
const LOCAL = { x: -(SC.w / PS) / 2, y: -(SC.h / PS) / 2, w: SC.w / PS, h: SC.h / PS };
const toWorld = (r) => ({ x: SC.x + (r.x - LOCAL.x) * PS, y: SC.y + (r.y - LOCAL.y) * PS, w: r.w * PS, h: r.h * PS, r: r.r * PS });
const IN = chooseLayout({ x: LOCAL.x, y: LOCAL.y, w: LOCAL.w, h: LOCAL.h }).cards.map(toWorld);
const CARD = { w: 560, h: 300, gap: 120, y: 360, r: 34 };
const OUT = [{ x: 960 - CARD.gap / 2 - CARD.w, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r }, { x: 960 + CARD.gap / 2, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r }];
const BIG = 2.6; // type scale of the lifted cards

// Owner card (stacked first in the product) goes left, the Google card right: both travel the same distance profile.
function rects(lt) {
  const p = snap(prog(lt, T.lift, T.liftEnd));
  const mid = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], p)]));
  // Before the lift, both cards are where the product draws them (stacked); the comparison uses the target size.
  return { L: mid(IN[0], OUT[0]), R: mid(IN[1], OUT[1]), p };
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
  return { x: 960 + 24 * sway, y: lerp(1360, 880, p), rot: 0.05 * sway };
};

function screen(lt) {
  return (ctx, sr) => {
    // Continue pressed on the mention screen, then the choose screen slides in from the right (as the product pages).
    const s = snap(prog(lt, T.slide, T.slideEnd));
    if (s < 1) {
      ctx.save();
      ctx.translate(-s * sr.w, 0);
      ratingPage(ctx, sr, { rated: { food: 5, service: 5 }, ticked: TICKED, scroll: 238, press: clamp(1 - Math.abs(lt - T.press - 0.05) / 0.1) });
      ctx.restore();
    }
    if (s > 0) {
      ctx.save();
      ctx.translate((1 - s) * sr.w, 0);
      // the two cards leave the page when they lift; the page text fades with the phone
      choosePage(ctx, sr, { cardsAlpha: lt < T.lift ? 1 : 0 });
      ctx.restore();
    }
  };
}

function bigCard(ctx, r, side, lt, p) {
  const pu = pulse(lt);
  const s = 1 + 0.02 * pu;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  if (pu > 0.01 && p >= 1) {
    const g = 10 + 22 * clamp(pu);
    ctx.strokeStyle = rgba("blue", 0.2 * clamp(pu));
    ctx.lineWidth = 14;
    rrect(ctx, r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, r.r + g);
    ctx.stroke();
  }
  // Product card styling (white, hairline edge); the edge turns brand blue on both cards equally once they land.
  const small = prog(lt, T.lift, T.lift + 0.12), big = prog(lt, T.liftEnd - 0.1, T.liftEnd + 0.25);
  choiceCard(ctx, r, side, { big: lerp(PS, BIG, p), textAlpha: lt < T.lift ? 1 : Math.max(1 - small, big), stroke: p >= 1 ? "blue" : "edge", strokeW: lerp(1.2, 4, p) });
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
    const body = 1 - prog(lt, T.lift, T.lift + 0.3);
    if (body > 0) phone(ctx, PX, PY, screen(lt), { alpha: body, s: PS * lerp(1, 0.92, prog(lt, T.lift, T.lift + 0.3)) });
    if (lt >= T.lift) {
      bigCard(ctx, L, 0, lt, p);
      bigCard(ctx, R, 1, lt, p);
      // the product's own heading and reassurance, above the two equal paths
      const a = prog(lt, T.head, T.head + 0.3);
      if (a > 0) {
        txt(ctx, "Where should your words go?", 960, 210, { size: 58, weight: 700, fill: "ink", alpha: a });
        txt(ctx, "You can do both, if you like.", 960, 272, { size: 30, weight: 500, fill: "grey", alpha: a });
      }
    }
    drawThumb(ctx, lt);
  },
  /** Carry in: the phone screen on the mention chips. Carry out: both paths, equal. */
  carry(lt) {
    if (lt < T.lift) return { kind: "screen", ...SC, colour: "paper" };
    const { L, R } = rects(lt);
    return { kind: "paths", x: L.x, y: L.y, w: R.x + R.w - L.x, h: L.h, r: L.r, colour: "white" };
  },
  track(lt) {
    const { L, R } = rects(lt), t = thumb(lt);
    return [[L.x, L.y], [L.x + L.w, L.y + L.h], [R.x, R.y], [R.x + R.w, R.y + R.h], [t.x, t.y]];
  },
  /** Numbers for the equal-split compliance check (from the moment the cards land). */
  state(lt) {
    const { L, R, p } = rects(lt);
    return { L, R, landed: p >= 1, pulseL: pulse(lt), pulseR: pulse(lt), thumbX: thumb(lt).x };
  },
  events() {
    return [
      { t: T.press, sfx: "SFX01", gain: -12, what: "Continue tapped" },
      { t: T.slide, sfx: "SFX04", gain: -20, what: "page slides to 'Where should your words go?'" },
      { t: T.lift, sfx: "SFX04", gain: -12, what: "the two cards lift out of the phone" },
      { t: T.thumbIn, sfx: "SFX04", gain: -22, what: "thumb rises into frame", rate: 0.85 },
      ...BEATS.flatMap((t) => [{ t, sfx: "HEART", gain: -10, what: "pulse (music stand-in)" }, { t: q(t + 0.17), sfx: "HEART", gain: -14, what: "pulse, second thump" }]),
    ];
  },
};
