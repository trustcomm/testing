import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, FPS, SPRING_DAMPING, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, Headline, Pop, clamp01, lerp, smooth, useT } from "../components/motion";
import { ProfileScreen } from "../components/Phone";
import { Sparkles } from "../components/Sparkles";
import { BIO } from "./Fix2";

const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const COMMAND = 'claude "make this video"';
const PHONE = { w: 330, h: 650, r: 54, border: 8 }, TERM = { w: 900, h: 540, r: 28, border: 3 };

/** 6. REVEAL: the phone turns into a terminal, types the command, a progress bar fills to 100 %, sparkles on MADE BY CLAUDE CODE. */
export const Reveal: React.FC<{ end: number }> = ({ end }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = useT(); const c = CUE.reveal, st = STAGGER / FPS;
  const flipFrame = Math.round(c.flip * fps);
  const m = frame >= flipFrame ? Math.min(1.12, spring({ frame: frame - flipFrame, fps, config: { damping: SPRING_DAMPING, stiffness: 120 } })) : 0;
  const mc = clamp01(m);
  const w = lerp(PHONE.w, TERM.w, m), h = lerp(PHONE.h, TERM.h, m), r = lerp(PHONE.r, TERM.r, mc), border = lerp(PHONE.border, TERM.border, mc);
  const typed = Math.floor(COMMAND.length * clamp01((t - c.typing[0]) / (c.typing[1] - c.typing[0])));
  const prog = clamp01((t - c.progress[0]) / (c.progress[1] - c.progress[0]));
  const pct = Math.round(100 * prog);
  const caret = (t >= c.typing[0] && typed < COMMAND.length) || Math.floor(t * 3) % 2 === 0;
  return (
    <>
      <Sparkles at={c.done} x={540} y={500} />
      <Headline size={100} top={342} until={end} lines={[
        [{ text: "MADE BY", at: c.madeBy }],
        [{ text: "CLAUDE CODE", at: c.claude, hl: c.claude }],
      ]} />
      <At x={540} y={925}>
        <Pop at={c.phone} until={end} from={0.7} dy={60}>
          <div style={{ position: "relative", width: w, height: h, borderRadius: r, background: m > 0.5 ? "#0A0A10" : "#05050A", border: `${border}px solid ${mc > 0.5 ? "#2E2E3C" : "#272734"}`, boxShadow: `0 0 ${90 * (1 - mc) + 40 * mc}px ${C.accent}55, 0 30px 80px rgba(0,0,0,0.6)`, overflow: "hidden" }}>
            {/* the phone's screen fades out as the window opens */}
            <div style={{ position: "absolute", left: "50%", top: 0, width: PHONE.w - 16, height: PHONE.h - 16, transform: "translateX(-50%)", opacity: 1 - smooth(0, 0.45, mc) }}>
              <ProfileScreen bio={BIO} typed={BIO.length} caret={false} />
            </div>
            {/* the terminal */}
            <div style={{ position: "absolute", inset: 0, opacity: smooth(0.55, 1, mc), fontFamily: MONO, color: C.text }}>
              <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", background: "#15151E", borderBottom: `2px solid ${C.faint}` }}>
                {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => <div key={col} style={{ width: 16, height: 16, borderRadius: "50%", background: col }} />)}
                <div style={{ marginLeft: 16, fontSize: 22, fontWeight: 600, color: C.dim }}>claude — ~/video</div>
              </div>
              <div style={{ padding: "30px 34px", fontSize: 38, fontWeight: 600, lineHeight: 1.45 }}>
                <div><span style={{ color: C.ok }}>$ </span>{COMMAND.slice(0, typed)}<span style={{ display: "inline-block", width: 18, height: 38, marginLeft: 3, verticalAlign: "-6px", background: C.accent, opacity: caret ? 1 : 0 }} /></div>
                <Pop at={c.lines} until={end} from={0.9} style={{ fontSize: 30, color: C.dim }}>› building 7 scenes</Pop>
                <Pop at={c.lines + st} until={end} from={0.9} style={{ fontSize: 30, color: C.dim }}>› syncing to the voice</Pop>
                {t >= c.progress[0] && (
                  <div style={{ marginTop: 26 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 10 }}><span>rendering</span><span style={{ color: pct === 100 ? C.ok : C.accent, fontVariantNumeric: "tabular-nums" }}>{pct}%</span></div>
                    <div style={{ height: 30, borderRadius: 15, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 15, background: `linear-gradient(90deg, ${C.accent}, ${pct === 100 ? C.ok : "#B7A4FF"})` }} />
                    </div>
                  </div>
                )}
                <Pop at={c.done} until={end} from={0.5} style={{ marginTop: 18, fontSize: 34, fontWeight: 800, color: C.ok }}>✓ done</Pop>
              </div>
            </div>
          </div>
        </Pop>
      </At>
    </>
  );
};
