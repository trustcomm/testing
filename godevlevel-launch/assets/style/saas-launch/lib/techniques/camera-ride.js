// camera-ride: all scenes of a chapter live on one big canvas; the camera pans/pushes between subjects and rests on each.
// cameraAt(t, frames) -> { x, y, z, rot }    frames: [[time, [x, y, z, rotDeg], easeToken?], ...] (world coords of frame centre)
// applyCamera(ctx, cam, W, H)                 sets the world transform; draw the world after it (inside save/restore).
// Numbers: pan 900 ms 'camera_s' with roll ~-1.4 deg (r04); whip 433 ms 'whip', 92% by 130 ms (r11); reading-hold push
// 1.00 -> 1.21 over 2.5 s (r10). Render with --blur 6. Source: techniques/camera-ride.md
import { keys } from '../core.js';
import { ez } from './tokens.js';

export function cameraAt(t, frames) {
  const [x, y, z, rot = 0] = keys(t, frames.map(([tt, v, e]) => [tt, v, ez(e || 'camera_s')]));
  return { x, y, z, rot };
}

export function applyCamera(ctx, { x, y, z, rot = 0 }, W, H) {
  ctx.translate(W / 2, H / 2); ctx.rotate(rot * Math.PI / 180); ctx.scale(z, z); ctx.translate(-x, -y);
}
