// pull-back-to-device: a full-frame scene pulls back fast until it is the screen of a device/card in a bigger scene
// (or the reverse: push through a screen until it fills the frame).
// pullBack(ctx, t, { W, H, t0, dur = 1.0, ease = 'out_front', zFrom = 1, zTo = 0.42, cx = W/2, cy = H/2, bezel = 0.025,
//   radius = 0.03, deviceColor, drawScreen, drawRoom }) -> z
//   drawScreen(ctx) draws the inner scene at full frame size (W x H); drawRoom(ctx, z) draws what surrounds the device.
//   At z = 1 the screen exactly fills the frame, so the move starts without a cut.
// Numbers: r09 0.99 -> 0.24 in 1000 ms; r05 0.98 -> 0.30 in 800 ms; 'out_front' easing (half the move in the first 10%);
// keep the screen >= 50% of frame width after the move if it must stay readable. Source: techniques/pull-back-to-device.md
import { seg, lerp } from '../core.js';
import { rrect } from '../draw.js';
import { ez } from './tokens.js';

let buf = null;
export function pullBack(ctx, t, { W, H, t0, dur = 1.0, ease = 'out_front', zFrom = 1, zTo = 0.42, cx = W / 2, cy = H / 2, bezel = 0.025, radius = 0.03, deviceColor = '#111', drawScreen, drawRoom }) {
  const p = seg(t, t0, dur, ez(ease)), z = lerp(zFrom, zTo, p);
  const x = lerp(W / 2, cx, p), y = lerp(H / 2, cy, p);   // screen centre travels to its resting place
  if (drawRoom) drawRoom(ctx, z);
  const sw = W * z, sh = H * z, bz = W * bezel * z;
  ctx.save(); ctx.fillStyle = deviceColor; rrect(ctx, x - sw / 2 - bz, y - sh / 2 - bz, sw + 2 * bz, sh + 2 * bz, W * radius * z + bz); ctx.fill();
  // inner scene: draw at full size into an offscreen buffer, then place it scaled (keeps text crisp-ish and registered)
  if (!buf || buf.width !== W || buf.height !== H) buf = new OffscreenCanvas(W, H);
  const b = buf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); drawScreen(b);
  rrect(ctx, x - sw / 2, y - sh / 2, sw, sh, W * radius * z); ctx.clip(); ctx.drawImage(buf, x - sw / 2, y - sh / 2, sw, sh);
  ctx.restore();
  return z;
}
