import React from "react";
import { C, FONT } from "../theme";
import { CUE } from "../cues";
import { frameOf } from "../anchors";
import { At, Enter, clamp01, easeOutCubic, lerp, useSpring } from "../motion";
import { ClockProvider, useFrame, useT } from "../clock";
import { Glass, squircle } from "../components/glass";
import { Background } from "../components/Background";
import { Stage12 } from "./Stage12";
import { Person } from "./icons";

const COMMAND = 'claude "make a keynote-style reel: designer vs prompt"';
const TERM = { w: 940, h: 620 }, TERM_AT = { y: 820 }, TERM_PULLED = { y: 1074, s: 0.62 };
const PIP = { w: 315, h: 560, y: 560, bezel: 10 };

const PipScreen: React.FC = () => {
  // a copy of scene 1 of THIS video, on its own clock that starts at 0 the moment the frame pulls back (a render preview, so it runs 2.2x)
  const frame = useFrame();
  const inner = { w: PIP.w - 2 * PIP.bezel, h: PIP.h - 2 * PIP.bezel }, k = inner.w / 1080;
  return (
    <ClockProvider frame={Math.round((frame - frameOf(CUE.s5.pullBack)) * 2.2)}>
      <div style={{ width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: "top left", position: "relative" }}>
        <Background dark={0} />
        <Stage12 />
      </div>
    </ClockProvider>
  );
};

/** 5. A macOS-style terminal types the prompt, strikes "Designer", renders to 100 %, then the frame pulls back to show it is rendering this very video. */
export const Terminal: React.FC = () => {
  const frame = useFrame(), t = useT(), c = CUE.s5;
  const open = useSpring(c.yeh);
  const typed = Math.floor(COMMAND.length * clamp01((t - c.typing[0]) / (c.typing[1] - c.typing[0])));
  const typing = t >= c.typing[0] && typed < COMMAND.length;
  const caret = typing || Math.floor(t * 2.5) % 2 === 0;
  const render = clamp01((t - c.render[0]) / (c.render[1] - c.render[0]));
  const pct = Math.round(100 * render);
  const pull = easeOutCubic(clamp01(useSpring(c.pullBack)));   // the camera pulls back
  const strike = easeOutCubic(clamp01((t - c.nahi) / 0.4));
  const sc = lerp(0.84 + 0.16 * Math.min(1, open), TERM_PULLED.s, pull);
  const cy = lerp(TERM_AT.y, TERM_PULLED.y, pull);
    const cmdQuote = COMMAND.indexOf('"');
  return (
    <>
      {/* the chip: "Designer" appears, then is struck out on "nahi banaya" */}
      <At x={540} y={400} style={{ opacity: 1 - clamp01(pull * 2.5), filter: pull > 0 ? `blur(${pull * 8}px)` : undefined }}>
        <Enter at={c.designer}>
          <div style={{ position: "relative", opacity: 1 - 0.4 * strike }}>
            <Glass w={300} h={92} r={46} dark>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: FONT.ui, fontWeight: 600, fontSize: 40, color: "#fff" }}>
                <Person size={36} color="rgba(255,255,255,0.8)" />Designer
              </div>
            </Glass>
            <div style={{ position: "absolute", left: 22, top: 44, width: 256 * strike, height: 6, borderRadius: 3, background: C.warn, boxShadow: `0 0 14px ${C.warn}99` }} />
          </div>
        </Enter>
      </At>

      {/* the terminal's own light on the black */}
      <At x={540} y={cy} style={{ width: 1500, height: 1100, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(0,113,227,${0.20 * clamp01(open)}) 0%, rgba(0,113,227,0) 62%)`, transform: `translate(-50%, -50%) scale(${sc})` }} />
      {/* the terminal */}
      <At x={540} y={cy} style={{ transform: `translate(-50%, -50%) scale(${sc})`, opacity: clamp01(open * 1.3), filter: open < 0.99 ? `blur(${(1 - open) * 10}px)` : undefined }}>
        <Glass w={TERM.w} h={TERM.h} r={40} dark>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 68, background: "rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", padding: "0 28px" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => <div key={col} style={{ width: 20, height: 20, borderRadius: "50%", background: col, marginRight: 12 }} />)}
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: FONT.ui, fontWeight: 600, fontSize: 26, color: "rgba(255,255,255,0.72)" }}>claude</div>
          </div>
          <div style={{ position: "absolute", left: 36, right: 36, top: 100, fontFamily: FONT.mono, fontWeight: 500, fontSize: 30, lineHeight: 1.5, color: "#fff" }}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>% </span>
              <span style={{ fontWeight: 700 }}>{COMMAND.slice(0, Math.min(typed, cmdQuote))}</span>
              <span style={{ color: "#64D2FF" }}>{typed > cmdQuote ? COMMAND.slice(cmdQuote, typed) : ""}</span>
              <span style={{ display: "inline-block", width: 16, height: 32, marginLeft: 3, verticalAlign: "-6px", background: C.accent, opacity: caret ? 1 : 0 }} />
            </div>
            <Enter at={c.kisi} dy={10} blur={4}><div style={{ marginTop: 14, color: "rgba(255,255,255,0.5)" }}>› composing 7 scenes…</div></Enter>
            {t >= c.render[0] && (
              <div style={{ marginTop: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#fff" }}><span>Rendering reel.mp4</span><span style={{ color: pct === 100 ? C.ok : "#64D2FF", fontVariantNumeric: "tabular-nums" }}>{pct}%</span></div>
                <div style={{ marginTop: 12, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 11, background: `linear-gradient(90deg, ${C.accent}, ${pct === 100 ? C.ok : "#64B5FF"})` }} />
                </div>
              </div>
            )}
            <Enter at={c.done} dy={10} blur={4}><div style={{ marginTop: 26, color: C.ok, fontWeight: 700 }}>✓ Rendered reel.mp4 <span style={{ fontWeight: 500, color: "rgba(255,255,255,0.45)" }}> 1080×1920 · 30 fps</span></div></Enter>
          </div>
        </Glass>
      </At>

      {/* the pull-back: a window above the terminal plays scene 1 of this video */}
      <At x={540} y={PIP.y}>
        <Enter at={c.pullBack} i={1} dy={40} blur={10}>
          <div style={{ position: "relative", width: PIP.w, height: PIP.h }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 52, background: "#0B0B0D", boxShadow: "0 0 0 2px rgba(255,255,255,0.16), 0 30px 80px rgba(0,113,227,0.28)" }} />
            <div style={{ position: "absolute", left: PIP.bezel, top: PIP.bezel, width: PIP.w - 2 * PIP.bezel, height: PIP.h - 2 * PIP.bezel, clipPath: `path('${squircle(PIP.w - 2 * PIP.bezel, PIP.h - 2 * PIP.bezel, 42)}')`, overflow: "hidden" }}><PipScreen /></div>
          </div>
        </Enter>
      </At>
      <At x={540} y={PIP.y + PIP.h / 2 + 8}>
        <Enter at={c.prompt} dy={10} blur={4}>
          <div style={{ padding: "8px 22px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontFamily: FONT.mono, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>● reel.mp4</div>
        </Enter>
      </At>
    </>
  );
};
