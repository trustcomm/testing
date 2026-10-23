import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { C } from "../theme";
import { rand } from "../motion";
import { useFrame } from "../clock";

const mix = (a: string, b: string, k: number) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",")})`; };

/** Pure black, a barely-there radial lift (#0B0C0F at the centre; it warms to #0F1110 as the story turns to trust: `trust` 0..1), ultra-subtle seeded film grain (2 %). */
export const Background: React.FC<{ trust?: number }> = ({ trust = 0 }) => {
  const f = useFrame();
  const lift = mix(C.lift, C.liftTrust, trust);
  const gx = Math.floor(rand(f, 11) * 512), gy = Math.floor(rand(f, 12) * 512);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 760px 900px at 50% 44%, ${lift} 0%, rgba(0,0,0,0) 100%)` }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${gx}px ${gy}px`, opacity: 0.02, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
