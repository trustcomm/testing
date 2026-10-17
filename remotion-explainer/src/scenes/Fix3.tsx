import React from "react";
import { C, FONT, FPS, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, Headline, Pill, Pop, clamp01, lerp, outCubic, useT } from "../components/motion";
import { Bubble, Heart, LinkIcon, Send } from "../components/icons";

const COMPETING = [
  { label: "Like", Icon: Heart, x: 290, y: 705 },
  { label: "Share", Icon: Send, x: 790, y: 705 },
  { label: "Link", Icon: LinkIcon, x: 290, y: 1125 },
  { label: "Comment", Icon: Bubble, x: 790, y: 1125 },
];
const FADE = 0.28;   // seconds a competing button takes to shrink away
const CX = 540, CY = 915;

/** 5. FIX 3: "ONE CTA ONLY": a big Follow button that pulses while the other buttons fade and shrink away. */
export const Fix3: React.FC<{ end: number }> = ({ end }) => {
  const t = useT(); const c = CUE.fix3, st = STAGGER / FPS;
  const grow = outCubic(clamp01((t - c.follow) / 0.3));
  const pulse = t >= c.buttons ? 1 + 0.045 * Math.sin((t - c.buttons) * 8) : 1;
  const rings = t >= c.follow ? [0, 1, 2].map((k) => ((t - c.follow - k * 0.45) % 1.35 + 1.35) % 1.35 / 1.35).filter((_, k) => t - c.follow - k * 0.45 >= 0) : [];
  return (
    <>
      <Pill num="04" label="FIX" at={c.pill} until={end} />
      <Headline size={116} top={342} until={end} lines={[
        [{ text: "ONE", at: c.headline }, { text: "CTA", at: c.headline + st }],
        [{ text: "ONLY", at: c.headline + 2 * st, hl: c.hl }],
      ]} />
      {COMPETING.map(({ label, Icon, x, y }, i) => {
        const p = outCubic(clamp01((t - (c.fade + (i * 3) / FPS)) / FADE));
        return (
          <At key={label} x={lerp(x, CX, 0.35 * p)} y={lerp(y, CY, 0.35 * p)} style={{ opacity: 1 - p, transform: `translate(-50%, -50%) scale(${1 - 0.65 * p})` }}>
            <Pop at={c.buttons + (i + 1) * st} until={end} from={0.4}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "22px 34px", borderRadius: 999, background: C.card, border: `3px solid ${C.faint}`, fontFamily: FONT, fontWeight: 800, fontSize: 42, color: C.text }}>
                <Icon size={44} color="#fff" />{label}
              </div>
            </Pop>
          </At>
        );
      })}
      {rings.map((r, k) => (
        <At key={k} x={CX} y={CY} style={{ width: 520 + r * 520, height: 160 + r * 520, borderRadius: 999, border: `4px solid ${C.accent}`, opacity: 0.7 * (1 - r) }} />
      ))}
      <At x={CX} y={CY}>
        <Pop at={c.buttons} until={end} from={0.4}>
          <div style={{ transform: `scale(${pulse * (1 + 0.16 * grow)})` }}>
            <div style={{ width: 520, height: 150, borderRadius: 999, background: C.accent, boxShadow: `0 0 ${60 + 50 * grow}px ${C.accent}, 0 20px 50px rgba(0,0,0,0.5)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: "0.02em" }}>Follow</div>
          </div>
        </Pop>
      </At>
    </>
  );
};
