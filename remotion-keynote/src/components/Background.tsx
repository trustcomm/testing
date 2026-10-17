import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { useT } from "../clock";

const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",")})`;
};

/** #F5F5F7, a very faint 48 px grid (#000 at 3 %), a slow-drifting soft white radial highlight. `dark` 0..1 eases it to pure black. */
export const Background: React.FC<{ dark?: boolean | number }> = ({ dark = 0 }) => {
  const t = useT(), d = Number(dark);
  const x = 540 + 300 * Math.sin(t * 0.21), y = 760 + 260 * Math.cos(t * 0.17);
  return (
    <AbsoluteFill style={{ background: mix(C.canvas, C.black, d) }}>
      <AbsoluteFill style={{ opacity: 1 - d, backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div style={{ position: "absolute", left: x - 700, top: y - 700, width: 1400, height: 1400, borderRadius: "50%", opacity: 1 - d, background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 38%, rgba(255,255,255,0) 68%)" }} />
    </AbsoluteFill>
  );
};
