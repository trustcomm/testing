// Film runtime: timeline → beat → camera → frame, with sub-frame motion blur on fast moves.
import { C } from "./brand.js";
import { applyCamera, makeCamera, toScreen } from "./camera.js";
import { drawCarry, matches } from "./carry.js";
import { FONT } from "./brand.js";

const BLUR_MIN_SPEED = 6; // screen px per frame before blur starts
const BLUR_SAMPLE_SPACING = 8; // max px between sub-frame samples (thinner than a caret, so trails stay continuous)
const BLUR_MAX_SAMPLES = 48;
const SHUTTER = 0.5; // fraction of a frame the virtual shutter is open (trailing)

export class Film {
  constructor(tl, modules, canvas) {
    this.tl = tl;
    this.fps = tl.fps;
    this.W = tl.width;
    this.H = tl.height;
    this.cam = makeCamera(tl.camera);
    this.mods = modules;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.off = document.createElement("canvas");
    this.offCtx = this.off.getContext("2d", { willReadFrequently: true });
  }

  beatAtFrame(f) {
    const bs = this.tl.beats;
    for (let i = bs.length - 1; i >= 0; i--) if (f >= bs[i].startFrame) return bs[i];
    return bs[0];
  }

  env(b) {
    const i = this.tl.beats.indexOf(b);
    return {
      beat: this.tl.beat,
      fps: this.fps,
      W: this.W,
      H: this.H,
      t0: b.startFrame / this.fps,
      dur: (b.endFrame - b.startFrame) / this.fps,
      hin: b.handoffIn,
      hout: b.handoffOut,
      vo: b.vo,
      prev: i > 0 ? this.tl.beats[i - 1] : null,
      cam: this.cam,
      mods: this.mods,
      film: this,
    };
  }

  module(b) {
    return this.mods[b.id] ?? this.mods.stub;
  }

  /** Carry state of beat `id` at local time lt (for contract checks). */
  carry(id, lt) {
    const b = this.tl.beats.find((x) => x.id === id);
    return this.module(b).carry(lt, this.env(b));
  }

  contract(id) {
    const b = this.tl.beats.find((x) => x.id === id);
    const e = this.env(b);
    const m = this.module(b);
    return {
      id,
      built: !!this.mods[id],
      in: matches(m.carry(0, e), b.handoffIn),
      out: b.handoffOut ? matches(m.carry(e.dur, e), b.handoffOut) : [],
    };
  }

  /** Max screen speed (px/frame) of the beat's tracked points at film time t, camera motion included. */
  speed(b, t) {
    const e = this.env(b);
    const m = this.module(b);
    const dt = 1 / this.fps;
    const lt = t - e.t0;
    if (lt - dt < -1e-9) return 0; // tolerance: lt - dt on the 2nd frame of a beat can be -1e-17
    const now = m.track(lt, e);
    const before = m.track(lt - dt, e);
    const c1 = this.cam(t), c0 = this.cam(t - dt);
    // Points are matched by index; a different count means the beat changed phase (a cut in what
    // is tracked, not motion), so that frame gets no blur.
    if (now.length !== before.length) return 0;
    let v = 0;
    for (let i = 0; i < now.length; i++) {
      const [x1, y1] = toScreen(c1, this.W, this.H, now[i]);
      const [x0, y0] = toScreen(c0, this.W, this.H, before[i]);
      v = Math.max(v, Math.hypot(x1 - x0, y1 - y0));
    }
    return v;
  }

  drawAt(ctx, b, t, scale) {
    const e = this.env(b);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.charcoal;
    ctx.fillRect(0, 0, this.W, this.H);
    const cam = this.cam(t);
    applyCamera(ctx, cam, this.W, this.H);
    e.zoom = cam.z;
    this.module(b).render(ctx, t - e.t0, e);
  }

  /** Render frame f onto the main canvas. Returns what happened, for logs and checks. */
  render(f, { scale = 1, blur = true } = {}) {
    const W = Math.round(this.W * scale), H = Math.round(this.H * scale);
    if (this.canvas.width !== W) { this.canvas.width = W; this.canvas.height = H; }
    const b = this.beatAtFrame(f);
    const t = f / this.fps;
    const t0 = b.startFrame / this.fps;
    const v = blur ? this.speed(b, t) : 0;
    const n = v < BLUR_MIN_SPEED ? 1 : Math.min(BLUR_MAX_SAMPLES, Math.max(2, Math.ceil((v * SHUTTER) / BLUR_SAMPLE_SPACING) + 1));
    if (n === 1) {
      this.drawAt(this.ctx, b, t, scale);
      return { frame: f, beat: b.id, t, speed: v, samples: 1 };
    }
    // Average n renders spread over the trailing shutter, never reaching back past this beat's first frame.
    if (this.off.width !== W) { this.off.width = W; this.off.height = H; }
    const acc = new Uint32Array(W * H * 4);
    for (let i = 0; i < n; i++) {
      const ts = Math.max(t0, t - (SHUTTER / this.fps) * (i / (n - 1)));
      this.drawAt(this.offCtx, b, ts, scale);
      const d = this.offCtx.getImageData(0, 0, W, H).data;
      for (let k = 0; k < d.length; k++) acc[k] += d[k];
    }
    const img = this.ctx.createImageData(W, H);
    const half = n >> 1;
    for (let k = 0; k < acc.length; k++) img.data[k] = ((acc[k] + half) / n) | 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.putImageData(img, 0, 0);
    return { frame: f, beat: b.id, t, speed: v, samples: n };
  }
}

/** Stand-in for beats not built yet: their incoming carry, held, plus a label. Never shipped. */
export const stub = {
  render(ctx, lt, e) {
    drawCarry(ctx, e.hin);
    ctx.save();
    ctx.font = `500 28px ${FONT.mono}`;
    ctx.fillStyle = "rgba(245,243,239,0.5)";
    ctx.textAlign = "center";
    ctx.fillText("not built yet", e.W / 2, e.H - 80);
    ctx.restore();
  },
  carry: (lt, e) => e.hin,
  track: () => [],
};
