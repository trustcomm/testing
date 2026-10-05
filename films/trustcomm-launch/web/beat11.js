// Beat 11 — "Post on Google, in their own name…" (F7) Path 1. The customer taps "On Google"; the card opens into
// the real draft screen (ui/demo-4, the product's own demo draft); they edit a word; "Copy my words"; a generic
// review card posts — no Google UI, logo or colours. Carry in: both paths, equal. Carry out: the review card.
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { B, CARRY, lerpRect, q, reviewCard, touch, breathe } from "./kit.js";
import { choiceCard, DRAFT, draftPage, phone, rrect, screenRect, txt } from "./ui.js";

export const T = { tap: q(1 * B), open: q(1 * B + 0.12), openEnd: q(1 * B + 0.7), edit: q(1.35), editEnd: q(2.0), copy: q(2.35), post: q(2.55), postEnd: q(3.2), out: q(3.2) };
const CARD = { w: 560, h: 300, gap: 120, y: 360, r: 34 };
const LEFT = { x: 960 - CARD.gap / 2 - CARD.w, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r };
const RIGHT = { x: 960 + CARD.gap / 2, y: CARD.y, w: CARD.w, h: CARD.h, r: CARD.r };
const PHONE_AT = { x: 700, y: 540, s: 1.16 };
const SR = screenRect(PHONE_AT.x, PHONE_AT.y, PHONE_AT.s);
const CUT = "absolutely ";
/** Backspace from the end of "absolutely" (caret before its space), then the spare space: k = 0…11 keys pressed. */
export const editState = (k) => {
  const i = DRAFT.indexOf(CUT);
  return DRAFT.slice(0, i) + "absolutely".slice(0, Math.max(0, 10 - k)) + (k >= 11 ? "" : " ") + DRAFT.slice(i + CUT.length);
};
const edited = (lt) => editState(Math.round(11 * prog(lt, T.edit, T.editEnd)));
const thumbAt = (lt) => ({ x: lerp(960, RIGHT.x + RIGHT.w / 2, snap(prog(lt, 0, T.tap))), y: lerp(880, RIGHT.y + RIGHT.h - 40, snap(prog(lt, 0, T.tap))), out: snap(prog(lt, T.tap + 0.1, T.tap + 0.5)) });

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.015); // no dead holds: a slow drift that is zero at both boundaries
    const o = snap(prog(lt, T.open, T.openEnd));
    // heading + owner card leave together (the owner path gets its own beat next)
    const ha = 1 - prog(lt, T.open, T.open + 0.25);
    if (ha > 0) {
      txt(ctx, "Where should your words go?", 960, 210, { size: 58, weight: 700, fill: "ink", alpha: ha });
      txt(ctx, "You can do both, if you like.", 960, 272, { size: 30, weight: 500, fill: "grey", alpha: ha });
      ctx.save(); ctx.globalAlpha = ha; choiceCard(ctx, LEFT, 0, { big: 2.6, stroke: "blue", strokeW: 4 }); ctx.restore();
    }
    // the Google card becomes the phone screen with the draft
    const ph = lt >= T.out ? snap(prog(lt, T.out, 3.75)) : 0;
    if (o < 1) {
      const r = lerpRect(RIGHT, { ...SR, r: SR.r }, o);
      choiceCard(ctx, r, 1, { big: lerp(2.6, 1.16, o), stroke: "blue", strokeW: 4 + (lt >= T.tap ? 2 * Math.max(0, 1 - (lt - T.tap) / 0.2) : 0), textAlpha: 1 - o });
    } else {
      phone(ctx, PHONE_AT.x - 900 * ph, PHONE_AT.y, (c, sr) => draftPage(c, sr, { text: edited(lt), caret: lt >= T.edit - 0.3 && lt < T.copy ? Math.floor(lt * 4) : -1, press: Math.max(0, 1 - Math.abs(lt - T.copy) / 0.1) }), { s: PHONE_AT.s });
    }
    // thumb taps "On Google"
    const th = thumbAt(lt);
    if (th.out < 1) {
      ctx.save(); ctx.globalAlpha = 1 - th.out; ctx.fillStyle = col("skin");
      rrect(ctx, th.x - 68, th.y + 300 * th.out, 136, 420, 68); ctx.fill(); ctx.restore();
    }
    touch(ctx, RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.h - 40, lt - T.tap);
    touch(ctx, PHONE_AT.x, SR.y + SR.h - 33 * PHONE_AT.s, lt - T.copy);
    // the review posts: out of the phone, to the right, in their own name
    const pp = snap(prog(lt, T.post, T.postEnd));
    if (lt >= T.post) {
      const from = { x: SR.x + 20, y: SR.y + 120, w: SR.w - 40, h: 200, r: 18 };
      const r = lerpRect(from, CARRY.b11_12, pp);
      reviewCard(ctx, r, { stars: 5, text: ["Filter coffee at Meera's Tiffin Room was", "wonderful and served steaming hot."], scale: r.w / CARRY.b11_12.w, alpha: clamp(pp * 3) });
    }
  },
  carry(lt, e) {
    if (lt <= 0) return { kind: "paths", x: LEFT.x, y: LEFT.y, w: RIGHT.x + RIGHT.w - LEFT.x, h: LEFT.h, r: LEFT.r, colour: "white" };
    if (lt >= e.dur - 1e-9) return CARRY.b11_12;
    return { kind: "google-path" };
  },
  track(lt) {
    const o = snap(prog(lt, T.open, T.openEnd)), r = lerpRect(RIGHT, SR, o), pp = snap(prog(lt, T.post, T.postEnd));
    const c = lerpRect({ x: SR.x + 20, y: SR.y + 120, w: SR.w - 40, h: 200 }, CARRY.b11_12, pp);
    return [[r.x, r.y], [r.x + r.w, r.y + r.h], [c.x, c.y], [c.x + c.w, c.y + c.h]];
  },
  events() {
    return [
      { t: T.tap, sfx: "SFX01", gain: -8, what: "tap: On Google" },
      { t: T.open, sfx: "SFX04", gain: -18, what: "the card opens into the draft" },
      ...[0, 1, 2].map((k) => ({ t: q(T.edit + k * 0.2), sfx: "SFX01", gain: -20, what: `typing tick ${k + 1}/3 (editing a word)`, rate: 1.3 })),
      { t: T.copy, sfx: "SFX01", gain: -8, what: "tap: Copy my words" },
      { t: T.post, sfx: "SFX04", gain: -10, what: "send whoosh: the review posts" },
    ];
  },
};
