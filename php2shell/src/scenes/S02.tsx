import React, { useMemo } from "react";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, smooth } from "../motion";
import { Globe, SERVERS } from "../components/globe";
import { BrowserWindow, WordPressPill } from "../components/a-browser";

/**
 * S2: S1's globe exactly as S1 leaves it (all servers red, the red radial glow decaying from S1's hit, globeRot(frame)), then it zooms past the camera (dolly through:
 * scaled up around its centre, the servers rushing past, alpha out) into ONE browser window that writes on. On the second "aapki" the window slides close to the
 * camera and one soft red outline pulses around it (BrowserWindow). The window / pill pose is a function of the frame (a-browser.tsx), shared with S3.
 */
export const S2: React.FC = () => {
  const f = useFrame(), c = CUES.S2.cue;
  const lit = useMemo(() => SERVERS.map(() => 1), []);
  const glowK = Math.exp(-(f - c.s1Hit) / 14);                       // the boundary contract: alarmGlow = exp(-(f - hit) / 14)
  const t = clamp01((f - c.dollyStart) / (c.dollyEnd - c.dollyStart));
  const scale = 1 + 7 * t ** 2.6, alpha = 1 - smooth(0.35, 1, t);
  const flash = 0.07 * Math.exp(-(((f - c.whoosh) / 3.5) ** 2));      // a faint bloom as the globe passes through the lens
  return (
    <>
      {alpha > 0 && <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: alpha, background: `radial-gradient(circle ${560 * scale}px at 540px 800px, rgba(255,59,48,${0.16 * glowK}) 0%, rgba(255,59,48,0) 100%)` }} />}
      {alpha > 0 && <Globe frame={f} lit={lit} alarm={1} alarmGlow={glowK} scale={scale} alpha={alpha} serverAlpha={alpha} />}
      {flash > 0.002 && <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: `radial-gradient(circle 520px at 540px 800px, rgba(245,245,247,${flash}) 0%, rgba(245,245,247,0) 100%)` }} />}
      <BrowserWindow />
      <WordPressPill />
    </>
  );
};
