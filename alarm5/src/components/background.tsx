import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { C } from "../theme";
import { rand } from "../motion";
import { useFrame } from "../clock";

/** Pure black, a soft radial lift (#0B0C0F), a gentle vignette, ultra-subtle seeded film grain (2 %). Screen space: never blurred, never moved by the camera. */
export const Background: React.FC = () => {
  const f = useFrame();
  const gx = Math.floor(rand(f, 11) * 512), gy = Math.floor(rand(f, 12) * 512);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 820px 980px at 50% 46%, ${C.lift} 0%, rgba(0,0,0,0) 100%)` }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${gx}px ${gy}px`, opacity: 0.02, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
export const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />;
