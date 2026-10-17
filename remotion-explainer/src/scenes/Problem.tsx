import React from "react";
import { C, FONT, FPS, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, Headline, Pill, Pop, clamp01, smooth, useT } from "../components/motion";
import { Person } from "../components/icons";
import { Phone, ReelScreen } from "../components/Phone";

const AVATARS = 16, STREAM_STEP = 3 / FPS, HUES = [C.accent, "#9B82FF", "#5B8CFF", "#C06BFF"];

const WarnCard: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 30px 20px 22px", borderRadius: 28, background: C.card, border: `3px solid ${C.warn}`, boxShadow: `0 0 50px ${C.warn}55, 0 20px 40px rgba(0,0,0,0.5)`, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.text, whiteSpace: "nowrap" }}>
    <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.warn, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 32 }}>!</div>
    {text}
  </div>
);

/** 2. PROBLEM: a phone with a reel playing, avatar dots scroll past and drift out, warning cards pop onto it. */
export const Problem: React.FC<{ end: number }> = ({ end }) => {
  const t = useT(); const c = CUE.problem;
  const [leaveStart, leaveEnd] = c.leave;
  return (
    <>
      <Pill num="01" label="PROBLEM" at={c.pill} until={end} color={C.warn} />
      <Headline size={104} top={342} until={end} lines={[
        [{ text: "VIEWS", at: c.views }, { text: "≠", at: c.neq }],
        [{ text: "FOLLOWERS", at: c.followers, hl: c.followers + STAGGER / FPS }],
      ]} />
      <At x={540} y={925}>
        <Pop at={c.phone} until={end} from={0.7} dy={60}><Phone><ReelScreen /></Phone></Pop>
      </At>
      {/* the stream: avatars rise beside the phone while "scroll karte hain", then drift out of the frame on "nikal jaate hain" */}
      {Array.from({ length: AVATARS }, (_, j) => {
        const spawn = c.stream[0] + j * STREAM_STEP;
        if (t < spawn || t > leaveEnd) return null;
        const side = j % 2 ? 1 : -1, lane = 255 + (j % 4) * 34, q = Math.max(0, t - leaveStart);
        const x = 540 + side * lane + side * 540 * q * q;
        const y = 1170 - (t - spawn) * (260 + (j % 3) * 60);
        const a = smooth(1200, 1120, y) * smooth(560, 650, y);
        return (
          <At key={j} x={x} y={y} style={{ opacity: a }}>
            <Pop at={spawn} until={leaveEnd} from={0.3}><Person size={58 + (j % 3) * 10} bg={HUES[j % HUES.length]} /></Pop>
          </At>
        );
      })}
      <At x={330} y={880} style={{ transform: "translate(-50%, -50%) rotate(-4deg)" }}><Pop at={c.who} until={end} from={0.4}><WarnCard text="Who is this?" /></Pop></At>
      <At x={760} y={1075} style={{ transform: "translate(-50%, -50%) rotate(3deg)" }}><Pop at={c.why} until={end} from={0.4}><WarnCard text="Why follow?" /></Pop></At>
    </>
  );
};
