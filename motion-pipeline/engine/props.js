// Props for diagrams: each is drawThing(ctx, t, { x, y, s, rot, seed }), centred on (x, y), at scale s, lit from the top left,
// with a contact shadow, a rim light and a boiled outline. Colours, stroke widths and radii come from tokens.js.
// `drawThing.foot` is where it meets the floor (local px) and `drawThing.w` its width, for the floor light under it.
import { tokens as T } from "../tokens.js";
import { shade, rgba, lightness, litFill, boilPath, contactShadow } from "./draw.js";
import { lerp, clamp01 } from "./ease.js";

const R = T.radius, RIM = 0.7, GLASS = 0.06, GLOW = T.shadowAlpha / 3;
// the outline colour on a segment, by how lit it is (0 shaded .. 1 lit); dark parts get a light edge, light parts a dark one
const edgeOf = (base, lit) => (lightness(base) < 0.25 ? shade(base, 0.08 + 0.12 * lit) : shade(base, -0.42 + 0.3 * lit));

// A rounded rectangle as a closed ring of points, clockwise from the top-left arc. `extra` points are spliced into the
// bottom edge (right to left), which is how the chat bubble gets its tail.
function rrPts(x, y, w, h, r, extra = []) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [], arc = (cx, cy, a0) => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(x + r, y + r, Math.PI); arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0);
  pts.push(...extra);
  arc(x + r, y + h - r, Math.PI / 2);
  return pts;
}

// Sets up the transform and returns the lit-part builder. Stroke widths are the token widths on screen at any scale.
function stage(ctx, t, o) {
  const s = o.s ?? 1, seed = o.seed ?? 0, out = T.stroke.outline / s, det = T.stroke.detail / s;
  ctx.save();
  ctx.translate(o.x, o.y); ctx.rotate(o.rot ?? 0); ctx.scale(s, s);
  ctx.lineJoin = ctx.lineCap = "round";
  const line = (pts, color, width, k, closed = false, extra = {}) => { ctx.strokeStyle = color; ctx.lineWidth = width; boilPath(ctx, pts, t, { seed: seed * 31 + k, closed, step: 3, ...extra }); };
  // a lit part: top-left gradient fill, an outline that is thin and light on the lit edges and heavy and dark on the
  // shaded ones, a rim light along the lit edges and a bounce of shadow inside the others
  function part(x, y, w, h, base, { r = R, k = 0, extra = [], tail, rim = true, lw = out } = {}) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = litFill(ctx, x, y, w, h, base); ctx.fill();
    if (tail) { ctx.beginPath(); tail.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill(); }
    const cx = x + w / 2, cy = y + h / 2;
    const litAt = (mx, my) => { const d = Math.hypot(mx - cx, my - cy) || 1; return clamp01(0.5 - ((mx - cx) / d + (my - cy) / d) * 0.35); };
    line(rrPts(x, y, w, h, r, extra), edgeOf(base, 0), lw, k, true, {
      weight: (mx, my) => lerp(lw, Math.min(lw, det), litAt(mx, my)) / lw,
      color: (mx, my) => edgeOf(base, litAt(mx, my)),
    });
    const d = (lw + det) / 2;
    if (rim) {
      const g = ctx.createLinearGradient(x, y, x + w * 0.7, y + h * 0.7);
      g.addColorStop(0, rgba(T.color.ink, RIM)); g.addColorStop(1, rgba(T.color.ink, 0));
      ctx.strokeStyle = g; ctx.lineWidth = det;
      ctx.beginPath(); ctx.roundRect(x + d, y + d, w - 2 * d, h - 2 * d, Math.max(r - d, 0)); ctx.stroke();
    }
    if (lw > det && w > 60 && h > 40) {                                                     // bounce shadow, inside the shaded edges
      const g = ctx.createLinearGradient(x + w * 0.35, y + h * 0.35, x + w, y + h);
      g.addColorStop(0, rgba(shade(T.color.bg, -1), 0)); g.addColorStop(1, rgba(shade(T.color.bg, -1), T.shadowAlpha));
      ctx.strokeStyle = g; ctx.lineWidth = det * 1.5;
      ctx.beginPath(); ctx.roundRect(x + d + det, y + d + det, w - 2 * (d + det), h - 2 * (d + det), Math.max(r - d - det, 0)); ctx.stroke();
    }
  }
  const bar = (x, y, w, h, color, a = 1) => { ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, R); ctx.fill(); ctx.globalAlpha = 1; };
  const dot = (x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  return { part, line, bar, dot, det, out, done: () => ctx.restore() };
}

export function laptop(ctx, t, o) {
  const L = stage(ctx, t, o), dim = T.color.dim;
  contactShadow(ctx, 0, 72, 340);
  L.part(-150, 42, 300, 28, shade(dim, -0.06), { k: 1 });                         // the base's front face
  L.part(-146, 34, 292, 14, shade(dim, 0.2), { k: 2, rim: false, lw: L.det });    // its top plane, lighter
  L.bar(-36, 37, 72, 7, shade(dim, -0.3));                                        // the finger notch
  L.part(-128, -122, 256, 166, shade(dim, 0.04), { k: 3 });                       // the lid
  L.part(-112, -106, 224, 134, T.color.bg, { k: 4, rim: false, lw: L.det });      // the screen
  const g = ctx.createRadialGradient(0, -40, 0, 0, -40, 150);                     // it lights itself
  g.addColorStop(0, rgba(T.color.accent, GLOW)); g.addColorStop(1, rgba(T.color.accent, 0));
  ctx.save(); ctx.beginPath(); ctx.roundRect(-112, -106, 224, 134, R); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(-112, -106, 224, 134);
  ctx.fillStyle = T.color.ink;                                                    // and the glass catches the room
  ctx.globalAlpha = GLASS; ctx.beginPath(); ctx.moveTo(-112, -106); ctx.lineTo(-24, -106); ctx.lineTo(-112, 20); ctx.fill();
  ctx.globalAlpha = GLASS / 2; ctx.beginPath(); ctx.moveTo(-6, -106); ctx.lineTo(24, -106); ctx.lineTo(-112, 84); ctx.lineTo(-112, 52); ctx.fill();
  ctx.restore();
  L.dot(-96, -88, 5, T.color.dim); L.dot(-80, -88, 5, T.color.dim); L.dot(-64, -88, 5, T.color.dim);
  L.bar(-96, -62, 84, 12, T.color.ink, 0.5); L.bar(-4, -62, 70, 12, T.color.accent);                      // one accent line
  L.bar(-80, -40, 132, 12, T.color.ink, 0.3);
  L.bar(-80, -18, 64, 12, T.color.ink, 0.5); L.bar(-8, -18, 96, 12, T.color.ink, 0.3);
  L.bar(-96, 4, 36, 12, T.color.ink, 0.5); ctx.save(); ctx.shadowColor = T.color.accent; ctx.shadowBlur = 12; L.bar(-52, 4, 12, 12, T.color.accent); ctx.restore();   // a cursor
  L.done();
}
laptop.foot = 70; laptop.w = 300;

export function chatBubble(ctx, t, o) {
  const L = stage(ctx, t, o);
  contactShadow(ctx, 0, 108, 300);
  L.part(-125, -85, 250, 155, T.color.ice, { k: 1, tail: [[-58, 66], [-112, 108], [-96, 66]], extra: [[-58, 70], [-112, 108], [-96, 70]] });
  const dark = shade(T.color.ice, -0.3);
  L.bar(-95, -56, 150, 12, dark); L.bar(-95, -34, 100, 12, dark);
  for (let i = 0; i < 3; i++) L.dot(-45 + i * 45, 28 - 9 * Math.max(0, Math.sin(t * 7 - i * 0.9)), 13, T.color.ink);   // typing
  L.done();
}
chatBubble.foot = 108; chatBubble.w = 250;

export function chartCard(ctx, t, o) {
  const L = stage(ctx, t, o);
  contactShadow(ctx, 0, 100, 300);
  L.part(-130, -98, 260, 196, T.color.ink, { k: 1 });
  L.bar(-108, -74, 80, 12, T.color.dim, 0.9); L.dot(100, -68, 8, T.color.accent);
  for (const y of [-34, 14]) L.line([[-112, y], [112, y]], rgba(T.color.dim, 0.35), L.det, 9);
  const hue = [T.color.ice, T.color.coral, T.color.violet, T.color.accent], height = [58, 96, 76, 124];
  hue.forEach((c, i) => L.part(-100 + i * 52, 62 - height[i], 38, height[i], c, { k: 4 + i, lw: L.det }));
  L.line([[-112, 62], [112, 62]], T.color.dim, L.det, 8);
  L.done();
}
chartCard.foot = 100; chartCard.w = 260;

export function folder(ctx, t, o) {
  const L = stage(ctx, t, o);
  const back = shade(T.color.coral, -0.14);
  contactShadow(ctx, 0, 92, 320);
  L.part(-136, -104, 112, 44, back, { k: 1 });                                   // tab
  L.part(-136, -82, 272, 168, back, { k: 2 });                                   // back panel
  for (const [rot, base, k] of [[-0.05, shade(T.color.ink, -0.08), 3], [0.035, T.color.ink, 4]]) {
    ctx.save(); ctx.translate(0, -10); ctx.rotate(rot);
    L.part(-108, -76, 216, 122, base, { k, lw: L.det });                           // papers
    if (k === 4) { L.bar(-86, -52, 120, 11, T.color.dim, 0.8); L.bar(-86, -30, 160, 11, T.color.dim, 0.8); L.bar(-86, -8, 90, 11, T.color.dim, 0.8); }
    ctx.restore();
  }
  L.part(-136, -34, 272, 124, T.color.coral, { k: 5 });                          // front
  L.bar(-110, 58, 56, 12, shade(T.color.coral, 0.2));
  L.done();
}
folder.foot = 92; folder.w = 272;
