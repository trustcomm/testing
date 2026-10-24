// The virtual canvas. ALL scenes live on one WORLD (5400 x 9600 px); a single camera (src/camera.ts, driven by the keys of every cue module) looks at it.
// An <Obj> places its children at a WORLD point on a depth layer (0.6 background ... 1.0 subject ... 1.3 foreground): its offset follows cameraOffset * depth and its
// scale is s^depth, so a zoom reveals layered depth like a real lens. Rack focus: layers behind the subject blur while the camera is close, sharpen on the pull-back.
import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { CamState } from "./camera";
import { useFrame, ClockProvider } from "./clock";
import { W, H, WORLD } from "./theme";
import { ScaleCtx } from "./components/draw";
import { CAMERA } from "./timeline";
import { smooth } from "./motion";

export const C0 = { x: WORLD.w / 2, y: WORLD.h / 2 };
const CamCtx = createContext<(CamState & { sx: number; sy: number }) | null>(null);
export const useCam = () => { const c = useContext(CamCtx); if (!c) throw new Error("useCam outside <World>"); return c; };

export const project = (cam: CamState, wx: number, wy: number, depth: number) => {
  const cx = C0.x + (cam.x - C0.x) * depth, cy = C0.y + (cam.y - C0.y) * depth, k = Math.pow(cam.s, depth);
  return { sx: W / 2 + (wx - cx) * k, sy: H / 2 + (wy - cy) * k, k };
};
/** rack focus: how many px of blur a layer of this depth gets at camera scale s (0 for the subject layer and in front) */
export const rackBlur = (s: number, depth: number) => (depth >= 1 ? 0 : smooth(1.35, 3.2, s) * 10 * ((1 - depth) / 0.4));

/** The camera-framed world: rotates about the screen centre by the camera's roll; applies the 2-frame shake (screen px). */
export const World: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useFrame(), cam = CAMERA.at(f);
  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{ transform: `translate(${cam.sx}px, ${cam.sy}px) rotate(${cam.r}deg)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
    </CamCtx.Provider>
  );
};

/** An object on the world: children are authored in local px (origin = the world point). `r` = a bounding radius (world px) used to cull it off-screen. */
export const Obj: React.FC<{ at: [number, number]; depth?: number; r?: number; blur?: boolean; art?: boolean; z?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, depth = 1, r = 700, blur = true, art = false, z, style, children }) => {
  const cam = useCam();
  const { sx, sy, k } = project(cam, at[0], at[1], depth);
  const m = r * k;
  if (sx + m < -80 || sx - m > W + 80 || sy + m < -80 || sy - m > H + 80) return null;
  const b = blur ? rackBlur(cam.s, depth) : 0;
  // detailed station art gives way to the map icons when the camera is far out
  const artA = art ? smooth(0.25, 0.5, cam.s) : 1;
  if (artA < 0.01) return null;
  return (
    <ScaleCtx.Provider value={k}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${sx}px, ${sy}px) scale(${k})`, transformOrigin: "0 0", filter: b > 0.25 ? `blur(${b}px)` : undefined, opacity: artA < 1 ? artA : undefined, zIndex: z, ...style }}>{children}</div>
    </ScaleCtx.Provider>
  );
};

/** camera-scale convenience for level-of-detail decisions inside scene art */
export const useLod = () => { const c = useCam(); return { s: c.s, far: c.s < 0.5, mid: c.s < 1.0 }; };

/**
 * Real motion blur: while the camera moves faster than 400 px/s (or a cue declares a fast element move) the world is rendered 8 times across a 180-degree shutter
 * (half a frame) and averaged; when it is static it is rendered once, so text stays crisp.
 */
export const MotionBlur: React.FC<{ extra?: [number, number][]; children: React.ReactNode }> = ({ extra = [], children }) => {
  const f = useFrame();
  const fast = CAMERA.speed(f) > 400 || extra.some(([a, b]) => f >= a && f <= b);
  if (!fast) return <>{children}</>;
  const N = 8, shutter = 0.5;
  return (
    <AbsoluteFill>
      {Array.from({ length: N }, (_, i) => {
        const o = (i / (N - 1) - 0.5) * shutter;
        // a running average with plain "normal" blending: sample i goes over the stack at 1 / (i + 1), which makes the stack the mean of the samples (mix-blend-mode: plus-lighter adds the page background again)
        return <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1) }}><ClockProvider frame={f + o}>{children}</ClockProvider></AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};
