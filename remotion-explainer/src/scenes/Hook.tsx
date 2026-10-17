import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, SPRING_DAMPING } from "../theme";
import { CUE } from "../cues";
import { At, Pop, clamp01, useT } from "../components/motion";

const VIEWS = 9848;

/** 1. HOOK: 0 -> 9,848 VIEWS, snaps small, a tiny 44 PROFILE VISITS in the warning colour with a screen shake, then a ?. */
export const Hook: React.FC<{ end: number }> = ({ end }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = useT(); const c = CUE.hook;
  const p = clamp01((t - c.counter[0]) / (c.counter[1] - c.counter[0]));
  const value = Math.round(VIEWS * (1 - (1 - p) ** 4));
  const snapFrame = Math.round(c.snap * fps);
  const s = frame >= snapFrame ? spring({ frame: frame - snapFrame, fps, config: { damping: SPRING_DAMPING } }) : 0;
  const scale = interpolate(s, [0, 1], [1, 0.36]), lift = interpolate(s, [0, 1], [0, -350]);
  // screen shake on the 44: decaying, deterministic
  const sf = frame - Math.round(c.visits * fps), decay = sf >= 0 && sf < 18 ? 1 - sf / 18 : 0;
  const shake = { x: Math.sin(sf * 2.9) * 20 * decay, y: Math.cos(sf * 3.7) * 14 * decay, r: Math.sin(sf * 2.1) * 1.6 * decay };
  const warnGlow = clamp01((t - c.snap) / 0.4);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg)` }}>
      <div style={{ position: "absolute", left: 540 - 520, top: 770 - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, ${C.warn}55 0%, ${C.warn}1c 40%, transparent 68%)`, opacity: warnGlow }} />
      <At x={540} y={770} style={{ transform: `translate(-50%, -50%) translateY(${lift}px) scale(${scale})` }}>
        <Pop at={0.05} until={end} from={0.7}>
          <div style={{ textAlign: "center", fontFamily: FONT }}>
            <div style={{ fontWeight: 900, fontSize: 300, lineHeight: 1, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", color: s > 0.5 ? C.dim : C.text }}>{value.toLocaleString("en-US")}</div>
            <Pop at={c.viewsLabel} until={end} from={0.6}>
              <div style={{ fontWeight: 800, fontSize: 70 + 110 * clamp01(s), letterSpacing: "0.3em", color: C.accent, marginTop: 6 - 6 * clamp01(s), paddingLeft: "0.3em" }}>VIEWS</div>
            </Pop>
          </div>
        </Pop>
      </At>
      <At x={450} y={770}>
        <Pop at={c.visits} until={end} from={0.3}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 400, lineHeight: 0.9, letterSpacing: "-0.04em", color: C.warn, textShadow: `0 0 80px ${C.warn}88`, transform: `translate(${shake.x * 0.8}px, ${shake.y * 0.8}px)` }}>44</div>
        </Pop>
      </At>
      <At x={450} y={1030}>
        <Pop at={c.visitsLabel} until={end} from={0.6}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: "0.2em", color: C.warn, paddingLeft: "0.2em", whiteSpace: "nowrap" }}>PROFILE VISITS</div>
        </Pop>
      </At>
      <At x={850} y={740}>
        <Pop at={c.question} until={end} from={0.2}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 380, lineHeight: 1, color: C.accent, textShadow: `0 0 70px ${C.accent}99`, transform: `rotate(${8 + 5 * Math.sin(t * 5)}deg)` }}>?</div>
        </Pop>
      </At>
    </div>
  );
};
