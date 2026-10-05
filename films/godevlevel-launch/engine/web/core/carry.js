// The carry object: the one shape that crosses every boundary.
// State = { kind, x, y, w, h, r, stroke?, colour, text? } in world space.
//   caret / line : filled rect          outline / frame : stroked rounded rect (x,y,w,h = outer edge)
//   window       : ink-stroked panel    dot             : filled circle
import { alpha, colour, mix } from "./brand.js";
import { lerp } from "./ease.js";

export const CONTRACT_KEYS = ["kind", "x", "y", "w", "h", "r", "stroke", "colour", "text"];

/** True when state `a` matches contract `c` on every key the contract declares (|Δ| ≤ eps). */
export function matches(a, c, eps = 1e-6) {
  const diffs = [];
  for (const k of CONTRACT_KEYS) {
    if (!(k in c)) continue;
    const va = a[k], vc = c[k];
    if (typeof vc === "number" ? !(typeof va === "number" && Math.abs(va - vc) <= eps) : va !== vc) diffs.push({ key: k, got: va, want: vc });
  }
  return diffs;
}

/** Interpolate two carry states. Kind and colour switch to b's once t passes 0.5 (colour blends). */
export function lerpCarry(a, b, t) {
  const o = { kind: t < 0.5 ? a.kind : b.kind, colour: t < 0.5 ? a.colour : b.colour };
  for (const k of ["x", "y", "w", "h", "r", "stroke"]) {
    const va = a[k] ?? b[k], vb = b[k] ?? a[k];
    if (va !== undefined) o[k] = lerp(va, vb, t);
  }
  o.fill = a.colour === b.colour ? colour(a.colour) : mix(a.colour, b.colour, t);
  return o;
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Polyline of a rounded rect's centreline, starting at top-centre, clockwise. */
export function rrectPoints(x, y, w, h, r, seg = 24) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const pts = [[x + w / 2, y]];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  pts.push([x + w - r, y]);
  corner(x + w - r, y + r, -Math.PI / 2);
  pts.push([x + w, y + h - r]);
  corner(x + w - r, y + h - r, 0);
  pts.push([x + r, y + h]);
  corner(x + r, y + h - r, Math.PI / 2);
  pts.push([x, y + r]);
  corner(x + r, y + r, Math.PI);
  pts.push([x + w / 2, y]);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len.at(-1) };
}

/** Point at arc length s along a polyline from rrectPoints. */
export function pointAt(poly, s) {
  const { pts, len } = poly;
  if (s <= 0) return pts[0];
  if (s >= poly.total) return pts.at(-1);
  let i = 1;
  while (len[i] < s) i++;
  const u = (s - len[i - 1]) / (len[i] - len[i - 1]);
  return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
}

/** Stroke the first s pixels of a polyline. */
export function strokeTrim(ctx, poly, s) {
  const { pts, len } = poly;
  if (s <= 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let i = 1;
  for (; i < pts.length && len[i] <= s; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (i < pts.length) {
    const p = pointAt(poly, s);
    ctx.lineTo(p[0], p[1]);
  } else ctx.closePath();
  ctx.stroke();
}

/** Draw a carry state. `opts.trim` (0–1) draws only that share of an outline, from top-centre. */
export function drawCarry(ctx, s, opts = {}) {
  const fill = s.fill ?? colour(s.colour);
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  switch (s.kind) {
    case "caret":
    case "line":
      ctx.fillStyle = fill;
      rrect(ctx, s.x, s.y, s.w, s.h, s.r ?? 0);
      ctx.fill();
      break;
    case "outline":
    case "frame": {
      const k = s.stroke ?? 6;
      ctx.strokeStyle = fill;
      ctx.lineWidth = k;
      ctx.lineJoin = "round";
      const x = s.x + k / 2, y = s.y + k / 2, w = s.w - k, h = s.h - k, r = Math.max(0, (s.r ?? 0) - k / 2);
      if (opts.trim !== undefined && opts.trim < 1) {
        ctx.lineCap = "butt";
        strokeTrim(ctx, rrectPoints(x, y, w, h, r), opts.trim * rrectPoints(x, y, w, h, r).total);
      } else {
        rrect(ctx, x, y, w, h, r);
        ctx.stroke();
      }
      break;
    }
    case "window": {
      const k = s.stroke ?? 2;
      rrect(ctx, s.x, s.y, s.w, s.h, s.r ?? 0);
      ctx.fillStyle = alpha("ink", 0.04 * (opts.panel ?? 1));
      ctx.fill();
      ctx.lineWidth = k;
      ctx.strokeStyle = alpha("ink", 0.35 * (opts.panel ?? 1));
      ctx.stroke();
      break;
    }
    case "dot":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

/** Corners of a state's box, for motion-blur speed tracking. */
export const corners = (s) => [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h]];
