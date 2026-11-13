// prompt-macro-type: prompt bar pops in, camera punches in ~2x and follows the caret while the prompt types, pulls back,
// cursor glides to send with 4% overshoot, presses (button -20%), and an accent ripple grows past the frame.
// promptTimes(o) -> { tType, tTypeEnd, tGlide, tClick, tEnd, keys: [char times] }   (pure, for cue sheets)
// promptMacro(ctx, t, { W, H, box: {x,y,w,h}, t0, text, rate = 0.05, zoom = 2, pop = true, accent, surface, line, textColor,
//   muted, placeholder = 'Ask anything', size = 0.42*box.h, bar = true })
//   bar: false draws only the send ripple (hand the bar over to the next technique while the ripple finishes). -> times
// Numbers: zoom ~2x (r13); punch-in settle 500 ms 'out_snap' (r10); type ~15-100 ms/char; cursor glide 533 ms
// cubic-bezier(0.13,0.26,0,1.16) (r12); send ripple ~533 ms, largest at +200-350 ms (r13). Source: techniques/prompt-macro-type.md
import { seg, clamp, lerp } from '../core.js';
import { rrect } from '../draw.js';
import { ez } from './tokens.js';
import { typeOn } from './type-on.js';

const GLIDE = [0.13, 0.26, 0, 1.16];
export function promptTimes({ t0, text, rate = 0.05 }) {
  const tType = t0 + 0.5, tTypeEnd = tType + [...text].length * rate, tGlide = tTypeEnd + 0.25, tClick = tGlide + 0.533;
  return { tType, tTypeEnd, tGlide, tClick, tEnd: tClick + 0.55, keys: [...text].map((c, i) => c === ' ' ? null : tType + i * rate).filter(v => v != null) };
}

export function promptMacro(ctx, t, o) {
  const { W, H, box, t0, text, rate = 0.05, zoom = 2, pop = true, accent, surface, line, textColor, muted, placeholder = 'Ask anything' } = o;
  const T = promptTimes(o), size = o.size ?? box.h * 0.42, font = `500 ${size.toFixed(1)}px "Inter"`;
  const tx = box.x + box.h * 0.45, ty = box.y + box.h / 2 + size * 0.36;
  ctx.font = font; const fullW = ctx.measureText(text).width;
  // camera: punch in on the caret, follow it continuously, ease back out before the glide
  const zin = seg(t, T.tType - 0.07, 0.5, ez('out_snap')), zout = seg(t, T.tGlide - 0.1, 0.6, ez('camera_s'));
  const z = 1 + (zoom - 1) * zin * (1 - zout);
  const caretX = tx + fullW * clamp((t - T.tType) / (T.tTypeEnd - T.tType));
  const fx = lerp(box.x + box.w / 2, caretX - 0.1 * W / zoom, zin * (1 - zout)), fy = box.y + box.h / 2;
  const sp = pop ? seg(t, t0, 0.433, ez('pop_soft')) : 1;
  if (sp <= 0) return T;
  const bR = box.h * 0.36, bx = box.x + box.w - box.h * 0.5;
  if (o.bar !== false) {
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-lerp(W / 2, fx, (z - 1) / (zoom - 1) || 0), -lerp(H / 2, fy, (z - 1) / (zoom - 1) || 0));
  ctx.translate(box.x + box.w / 2, fy); ctx.scale(sp, sp); ctx.translate(-(box.x + box.w / 2), -fy);
  ctx.fillStyle = surface; rrect(ctx, box.x, box.y, box.w, box.h, box.h / 2); ctx.fill();
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke(); }
  if (t < T.tType) { ctx.save(); ctx.font = font; ctx.fillStyle = muted; ctx.globalAlpha *= 0.8; ctx.fillText(placeholder, tx, ty); ctx.restore(); }
  typeOn(ctx, t, text, { x: tx, y: ty, font, color: textColor, t0: T.tType, rate, glow: accent, glowDecay: 0.5, caret: t > T.tType - 0.3 && t < T.tGlide + 0.3, caretColor: accent });
  // send button with press
  const press = 1 - 0.2 * Math.sin(Math.PI * clamp((t - T.tClick) / 0.18));
  ctx.save(); ctx.translate(bx, fy); ctx.scale(press, press);
  ctx.fillStyle = t >= T.tTypeEnd ? accent : line || muted; ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = surface; ctx.lineWidth = bR * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, bR * 0.45); ctx.lineTo(0, -bR * 0.45); ctx.moveTo(-bR * 0.38, -bR * 0.07); ctx.lineTo(0, -bR * 0.45); ctx.lineTo(bR * 0.38, -bR * 0.07); ctx.stroke();
  ctx.restore();
  // cursor glide in from below-left, lands on the button at tClick
  if (t >= T.tGlide - 0.05 && t < T.tEnd + 0.4) {
    const g = seg(t, T.tGlide, 0.533, GLIDE), cx = lerp(bx - box.w * 0.25, bx + bR * 0.15, g), cy = lerp(fy + box.h * 1.6, fy + bR * 0.2, g);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(box.h / 90, box.h / 90);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 39); ctx.lineTo(21, 36); ctx.lineTo(15, 24); ctx.lineTo(26, 24); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  }
  // send ripple (screen space; camera is back at 1 by now)
  const ru = (t - T.tClick) / 0.533;
  if (ru > 0 && ru < 1) {
    const R = Math.hypot(W, H) * seg(t, T.tClick, 0.35, ez('iris')) + bR, a = 1 - seg(t, T.tClick + 0.2, 0.3, 'linear');
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = accent; ctx.lineWidth = 18 * (1 - ru) + 2; ctx.beginPath(); ctx.arc(bx, fy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  return T;
}
