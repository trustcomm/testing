// One camera over film time. Keys are interpolated per channel with a monotone cubic
// Hermite spline (Fritsch–Carlson tangents): position and velocity are continuous
// everywhere, so the camera cannot jump at a beat boundary, and it never overshoots a key.
function monotone(ts, vs) {
  const n = ts.length;
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (t) => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0;
    while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

export function makeCamera(keys) {
  const ts = keys.map((k) => k.t);
  const fx = monotone(ts, keys.map((k) => k.x));
  const fy = monotone(ts, keys.map((k) => k.y));
  const fz = monotone(ts, keys.map((k) => k.z));
  return (t) => ({ x: fx(t), y: fy(t), z: fz(t) });
}
/** Apply camera: world point (cam.x, cam.y) lands at screen centre, scaled by cam.z. */
export function applyCamera(ctx, cam, W, H) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
}
export const toScreen = (cam, W, H, [x, y]) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
