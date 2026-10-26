// ─────────────────────────────────────────────────────────────
// Virtual camera over one big WORLD canvas.
// Moves: PUSH · FLY-TO · PUNCH · PULL · DOLLY-THROUGH · DRIFT
// Zoom interpolates in log space (feels constant-speed to the eye).
// Rack focus: stations away from the lens centre blur automatically.
// Speed blur: the world blurs a little in proportion to camera speed.
// ─────────────────────────────────────────────────────────────
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {EASE} from './motion';
import {VIDEO} from './tokens';

export type Move = 'PUSH' | 'FLY-TO' | 'PUNCH' | 'PULL' | 'DOLLY-THROUGH' | 'CUT';

export type Shot = {
  at: number; // frame the move starts (use tl.f('cue') - preroll)
  x: number; // world point to centre on
  y: number;
  zoom: number; // 1 = world pixels map 1:1 to screen
  move: Move;
  dur?: number; // frames
  rot?: number; // degrees, subtle (≤ 3)
};

export type CamState = {x: number; y: number; zoom: number; rot: number; speed: number};

const DEFAULT_DUR: Record<Move, number> = {
  PUSH: 90,
  'FLY-TO': 54,
  PUNCH: 14,
  PULL: 60,
  'DOLLY-THROUGH': 36,
  CUT: 1,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

const easeFor = (m: Move) =>
  m === 'FLY-TO' ? EASE.swing : m === 'DOLLY-THROUGH' ? EASE.launch : m === 'PUSH' ? EASE.glide : EASE.settle;

/** Pure function: camera state at a frame. Also used by QA and by the SFX panner. */
export const cameraAt = (shots: Shot[], frame: number, drift = true): CamState => {
  const sorted = [...shots].sort((a, b) => a.at - b.at);
  let prev: Omit<CamState, 'speed'> = {x: sorted[0].x, y: sorted[0].y, zoom: sorted[0].zoom, rot: sorted[0].rot ?? 0};
  let cur = prev;
  let punch = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (frame < s.at) break;
    const dur = s.dur ?? DEFAULT_DUR[s.move];
    const t = clamp01((frame - s.at) / dur);

    if (s.move === 'PUNCH') {
      // PUNCH is additive: quick 7% zoom kick, then settles back. Does not move the base.
      const up = clamp01(t / 0.35);
      const down = clamp01((t - 0.35) / 0.65);
      punch += 0.07 * EASE.settle(up) * (1 - EASE.glide(down));
      continue;
    }

    const e = easeFor(s.move)(t);
    const target = {x: s.x, y: s.y, zoom: s.zoom, rot: s.rot ?? 0};
    let zoom = logLerp(prev.zoom, target.zoom, e);
    if (s.move === 'FLY-TO') {
      // Arc: pull back mid-flight (like a drone hopping between stations).
      const dist = Math.hypot(target.x - prev.x, target.y - prev.y);
      const dip = Math.min(0.45, dist / 9000);
      zoom *= 1 - dip * Math.sin(Math.PI * e);
    }
    cur = {
      x: lerp(prev.x, target.x, e),
      y: lerp(prev.y, target.y, e),
      zoom,
      rot: lerp(prev.rot, target.rot, e),
    };
    prev = t >= 1 ? target : cur;
    if (t >= 1) cur = target;
  }

  // DRIFT: always-on handheld breathing, tiny and smooth.
  const dx = drift ? noise2D('dx', frame / 240, 0) * 14 : 0;
  const dy = drift ? noise2D('dy', frame / 260, 3) * 18 : 0;
  const dr = drift ? noise2D('dr', frame / 300, 7) * 0.25 : 0;

  return {
    x: cur.x + dx / cur.zoom,
    y: cur.y + dy / cur.zoom,
    zoom: cur.zoom * (1 + punch),
    rot: cur.rot + dr,
    speed: 0,
  };
};

export const cameraWithSpeed = (shots: Shot[], frame: number): CamState => {
  const a = cameraAt(shots, frame - 1, false);
  const b = cameraAt(shots, frame, true);
  const screenSpeed = Math.hypot((b.x - a.x) * b.zoom, (b.y - a.y) * b.zoom) + Math.abs(Math.log(b.zoom / a.zoom)) * 900;
  return {...b, speed: screenSpeed};
};

const CamCtx = createContext<CamState>({x: 0, y: 0, zoom: 1, rot: 0, speed: 0});
export const useCam = () => useContext(CamCtx);

/** Converts a world point to screen coordinates (for HUD/captions/SFX pan). */
export const worldToScreen = (cam: CamState, x: number, y: number) => ({
  x: VIDEO.width / 2 + (x - cam.x) * cam.zoom,
  y: VIDEO.height / 2 + (y - cam.y) * cam.zoom,
});

export const World: React.FC<{
  shots: Shot[];
  width: number;
  height: number;
  children: React.ReactNode;
  background?: React.ReactNode;
}> = ({shots, width, height, children, background}) => {
  const frame = useCurrentFrame();
  const cam = cameraWithSpeed(shots, frame);
  const tx = VIDEO.width / 2 - cam.x * cam.zoom;
  const ty = VIDEO.height / 2 - cam.y * cam.zoom;
  // Speed blur: subtle, capped. Gives fast moves a filmic smear without CameraMotionBlur cost.
  const speedBlur = Math.min(6, Math.max(0, (cam.speed - 18) / 22));

  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {background}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
            transformOrigin: '0 0',
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${cam.zoom}) rotate(${cam.rot}deg)`,
            filter: speedBlur > 0.2 ? `blur(${speedBlur.toFixed(2)}px)` : undefined,
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </CamCtx.Provider>
  );
};

/**
 * A place in the world. Content is centred on (x, y).
 * Rack focus: blurs and dims when it is far from the lens centre.
 */
export const Station: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  focus?: boolean; // set false to disable rack focus
  children: React.ReactNode;
}> = ({x, y, w = 1080, h = 1920, focus = true, children}) => {
  const cam = useCam();
  const d = Math.hypot((x - cam.x) * cam.zoom, (y - cam.y) * cam.zoom);
  const k = focus ? clamp01((d - 500) / 1400) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        filter: k > 0.02 ? `blur(${(k * 10).toFixed(2)}px)` : undefined,
        opacity: 1 - k * 0.55,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Screen-space layer that moves at a fraction of the camera (depth parallax).
 * factor 0 = fixed to screen, 1 = moves with world, 0.2 = far background.
 */
export const Parallax: React.FC<{factor: number; children: React.ReactNode}> = ({factor, children}) => {
  const cam = useCam();
  const z = Math.pow(cam.zoom, factor);
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${-cam.x * factor * 0.25}px, ${-cam.y * factor * 0.25}px, 0) scale(${z})`,
        transformOrigin: '50% 50%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
