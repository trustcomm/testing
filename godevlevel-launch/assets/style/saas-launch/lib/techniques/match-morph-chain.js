// match-morph-chain: one hero shape morphs from state to state (box, corner radius, colour) instead of cutting scenes.
// morphChain(ctx, t, states, { dur = 0.467, ease = 'morph', blur = 4, draw = true }) -> { box, color, i, u, p }
//   states: [{ t, box: {x,y,w,h,r}, color, dur?, ease? }]; the morph INTO state i starts at states[i].t.
//   Returns the current box so the caller can draw scene content inside it (fade content in at u ~ 0.66, r08).
// Numbers: 250-480 ms morphs, 'morph' easing (r09 card-to-dot 633 ms), directional blur peaking at ~1/3 (r08).
// Source: techniques/match-morph-chain.md
import { clamp } from '../core.js';
import { morphBox, rrect } from '../draw.js';
import { ezf, mixColor } from './tokens.js';

export function morphState(t, states, { dur = 0.467, ease = 'morph' } = {}) {
  let i = 0; while (i + 1 < states.length && t >= states[i + 1].t) i++;
  const a = states[i], prev = states[i - 1];
  const d = a.dur ?? dur, u = prev ? clamp((t - a.t) / d) : 1;
  if (!prev || u >= 1) return { box: a.box, color: a.color, i, u: 1, p: 1 };
  const p = ezf(a.ease ?? ease)(u);
  return { box: morphBox(prev.box, a.box, p), color: mixColor(prev.color, a.color, clamp(p)), i, u, p };
}

export function morphChain(ctx, t, states, o = {}) {
  const s = morphState(t, states, o);
  if (o.draw !== false) {
    const b = s.box, bl = (o.blur ?? 4) * Math.sin(Math.PI * Math.min(1, s.u * 1.5));   // blur peaks near 1/3 of the move
    ctx.save(); if (bl > 0.3 && s.u < 1) ctx.filter = `blur(${bl.toFixed(2)}px)`;
    ctx.fillStyle = s.color; rrect(ctx, b.x, b.y, Math.max(0, b.w), Math.max(0, b.h), b.r); ctx.fill(); ctx.restore();
  }
  return s;
}
