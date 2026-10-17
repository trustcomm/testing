import React from "react";
import { C, FONT, FPS, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, Headline, Pill, Pop, clamp01, lerp, smooth, useT } from "../components/motion";
import { Spark } from "../components/icons";

const BAR_W = 840, BAR_H = 120, REEL_SECONDS = 15, HOOK_SECONDS = 3;
const HOOK_W = (BAR_W * HOOK_SECONDS) / REEL_SECONDS;

/** 3. FIX 1: "HOOK = WHO IT'S FOR": a reel timeline whose first 3 seconds glow, and the card that goes there. */
export const Fix1: React.FC<{ end: number }> = ({ end }) => {
  const t = useT(); const c = CUE.fix1, st = STAGGER / FPS;
  const [ph0, ph1] = c.playhead;
  const play = clamp01((t - ph0) / (ph1 - ph0));       // the playhead crosses the first 3 seconds exactly while "pehle teen second" is said
  const glow = smooth(ph0, ph0 + 0.25, t), pulse = 0.5 + 0.5 * Math.sin((t - ph0) * 9);
  return (
    <>
      <Pill num="02" label="FIX" at={c.pill} until={end} />
      <Headline size={100} top={342} until={end} lines={[
        [{ text: "HOOK", at: c.headline }, { text: "=", at: c.headline + st }],
        [{ text: "WHO IT’S FOR", at: c.headline + 2 * st, hl: c.hl }],
      ]} />
      <At x={540} y={790}>
        <Pop at={c.timeline} until={end} from={0.8} dy={40}>
          <div style={{ position: "relative", width: BAR_W, height: BAR_H + 70 }}>
            <div style={{ position: "relative", width: BAR_W, height: BAR_H, borderRadius: 22, background: C.card, border: `3px solid ${C.faint}`, overflow: "hidden", display: "flex" }}>
              {Array.from({ length: 15 }, (_, k) => <div key={k} style={{ width: BAR_W / 15, height: "100%", background: `linear-gradient(160deg, hsl(${252 + k * 5} 55% ${24 + (k % 4) * 4}%), hsl(${262 + k * 4} 50% 14%))`, borderRight: "2px solid #0B0B10" }} />)}
            </div>
            {/* the first 3 seconds, glowing */}
            <div style={{ position: "absolute", left: 0, top: 0, width: HOOK_W, height: BAR_H, borderRadius: 22, border: `5px solid ${C.accent}`, background: `${C.accent}33`, boxShadow: `0 0 ${22 + 22 * pulse}px ${C.accent}, inset 0 0 40px ${C.accent}66`, opacity: glow }} />
            <div style={{ position: "absolute", left: lerp(0, HOOK_W, play) - 3, top: -14, width: 6, height: BAR_H + 28, borderRadius: 3, background: "#fff", boxShadow: "0 0 18px #fff", opacity: glow }} />
            {[["0s", 0], ["3s", HOOK_W], ["15s", BAR_W]].map(([l, x]) => (
              <div key={l as string} style={{ position: "absolute", top: BAR_H + 16, left: (x as number) - (x === BAR_W ? 52 : x === 0 ? 0 : 20), fontFamily: FONT, fontWeight: 700, fontSize: 34, color: x === HOOK_W ? C.accent : C.dim }}>{l}</div>
            ))}
          </div>
        </Pop>
      </At>
      <At x={540} y={1070}>
        <Pop at={c.card} until={end} from={0.5} dy={50}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "26px 40px 26px 30px", borderRadius: 32, background: C.card, border: `3px solid ${C.accent}`, boxShadow: `0 0 60px ${C.accent}55, 0 24px 50px rgba(0,0,0,0.5)` }}>
            <div style={{ width: 70, height: 70, borderRadius: 20, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Spark size={40} color="#fff" /></div>
            <div style={{ fontFamily: FONT }}>
              <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "0.2em", color: C.accent }}>HOOK · 0–3s</div>
              <div style={{ fontWeight: 800, fontSize: 50, color: C.text, whiteSpace: "nowrap" }}>AI motion for founders</div>
            </div>
          </div>
        </Pop>
      </At>
    </>
  );
};
