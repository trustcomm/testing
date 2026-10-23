// S11: the chat with the host (kicker, host header, the left-aligned bubble that types the question) and the "safe versions" panel.
// Both are pure functions of the absolute frame, so S11 and S12 can draw the SAME picture across the scene boundary (the panel is held for 2.5 s).
import React from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { Pop, Rise, clamp01, easeInOutCubic, easeOutCubic, springAt } from "../motion";
import { Canvas, Stroke, check, circle, line, rrect } from "./draw";
import { KWord } from "./kinetic";
import { Pill } from "./pill";
import { bubble } from "./d-icons";
import { QUESTION, TYPE_FRAMES } from "../cues/s11";

export const CHAT = { centreDrop: 200, x: 84, kicker: 318, headerY: 410, bubbleY: 470, bubbleW: 752, bubbleH: 122 };
export const PANEL = { x: 90, y: 668, w: 900, h: 596 };
export const VERSIONS = ["PHP 8.5.12+", "PHP 8.4.27+", "PHP 8.3.36+", "PHP 8.2.35+"] as const;
export const OLD_LINE = "PHP 8.1 or older → upgrade required";

/** the leave: blur + fade over `frames` from `start`; returns the style for the wrapper (or null when gone) */
export const leave = (f: number, start: number, frames = 8): React.CSSProperties | null => {
  const o = clamp01((f - start) / frames);
  if (o >= 1) return null;
  if (o <= 0) return {};
  return { opacity: 1 - o, transform: `translateY(${-14 * o}px) scale(${1 - 0.012 * o})`, filter: `blur(${8 * o}px)`, transformOrigin: "50% 50%" };
};

/** how many characters of the question are typed on frame f */
const typedCount = (f: number) => TYPE_FRAMES.filter((t) => f >= t).length;

export const HostChat: React.FC = () => {
  const f = useFrame(), c = CUES.S11.cue;
  const out = leave(f, c.exitStart, c.exitEnd - c.exitStart);
  if (!out) return null;
  const { x, bubbleY, bubbleW, bubbleH } = CHAT;
  const n = typedCount(f), sent = f >= c.sent, since = f - c.sent;
  // the bubble outline writes on across "ek sawaal"; the text sits inside
  const bw = clamp01((f - c.bubble) / 20);
  const fillA = clamp01((f - c.bubble - 8) / 12) * 0.06;
  // the sent bump: the bubble lifts 3 % and settles
  const bump = sent ? 1 + 0.035 * Math.sin(Math.PI * clamp01(since / 10)) : 1;
  const caretOn = !sent && f >= c.caret && (n > 0 || Math.floor((f - c.caret) / 8) % 2 === 0);
  const ticks = springAt(f, c.sent + 4);
  const dim = 1 - 0.38 * clamp01((f - c.panelIn) / 14);          // the question steps back when the answer arrives
  const lift = easeInOutCubic((f - (c.sent - 6)) / 14), dy = CHAT.centreDrop * (1 - lift);   // the chat starts mid-screen and moves up to make room for the panel
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...out }}>
      <div style={{ opacity: dim, transform: `translateY(${dy}px)` }}>
        {/* kicker */}
        <div style={{ position: "absolute", left: x, top: CHAT.kicker, transform: "translateY(-50%)" }}>
          <Pop at={c.kicker} from={0.7} style={{ transformOrigin: "0% 50%" }}><Pill tone="trust">Aaj hi</Pill></Pop>
        </div>
        {/* the host: avatar ring + name */}
        <Canvas>
          <Stroke d={circle(x + 32, CHAT.headerY, 32)} at={c.header - 6} frames={14} />
          <Stroke d={`${rrect(x + 20, CHAT.headerY - 15, 24, 11, 3)}${rrect(x + 20, CHAT.headerY + 4, 24, 11, 3)}`} at={c.header + 4} frames={10} />
        </Canvas>
        <div style={{ position: "absolute", left: x + 86, top: CHAT.headerY - 29, display: "flex", flexDirection: "column", gap: 6 }}>
          <Rise at={c.header} frames={12} dy={14} blur={6}><div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: C.text, letterSpacing: "-0.01em", lineHeight: "40px" }}><KWord at={c.header}>Hosting</KWord> support</div></Rise>
          <Rise at={c.header + 6} frames={10} dy={8} blur={4}><div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.secondary, lineHeight: "30px", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 12, height: 12, borderRadius: 6, background: C.trust, display: "inline-block" }} />online</div></Rise>
        </div>
        {/* the bubble */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${x}px ${bubbleY + bubbleH}px`, transform: `scale(${bump})` }}>
          <Canvas>
            {bw > 0 && <path d={bubble(x, bubbleY, bubbleW, bubbleH)} fill={`rgba(255,255,255,${fillA})`} stroke="none" />}
            <Stroke d={bubble(x, bubbleY, bubbleW, bubbleH)} at={c.bubble} frames={20} />
          </Canvas>
          <div style={{ position: "absolute", left: x + 40, top: bubbleY + bubbleH / 2, transform: "translateY(-50%)", fontFamily: FONT.body, fontWeight: 600, fontSize: 50, letterSpacing: "-0.015em", color: C.text, whiteSpace: "pre", height: 60, lineHeight: "60px", display: "flex", alignItems: "center" }}>
            <span>{QUESTION.slice(0, n)}</span>
            {caretOn && <span style={{ display: "inline-block", width: 4, height: 46, borderRadius: 2, background: C.text, marginLeft: 3, opacity: n > 0 ? 1 : 0.9 }} />}
          </div>
        </div>
        {/* sent: a double check under the bubble */}
        {sent && (
          <Canvas style={{ opacity: clamp01(ticks * 1.5) }}>
            <Stroke d={check(x + bubbleW - 84, bubbleY + bubbleH + 38, 30)} p={clamp01((since - 4) / 6)} color={C.trust} w={4} />
            <Stroke d={check(x + bubbleW - 62, bubbleY + bubbleH + 38, 30)} p={clamp01((since - 7) / 6)} color={C.trust} w={4} />
          </Canvas>
        )}
      </div>
    </div>
  );
};

/** The glass panel with the safe versions: slides up, four lines tick in with a green check, a grey line, then it holds. */
export const VersionsPanel: React.FC = () => {
  const f = useFrame(), c = CUES.S11.cue;
  const out = leave(f, c.exitStart, c.exitEnd - c.exitStart);
  if (!out || f < c.panelIn) return null;
  const rise = easeOutCubic((f - c.panelIn) / 14), ticks = [c.tick1, c.tick2, c.tick3, c.tick4];
  const flash = f >= c.shutter && f < c.shutter + 10 ? Math.sin((Math.PI * (f - c.shutter)) / 10) : 0;
  const rowY = (i: number) => 142 + i * 92;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...out }}>
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, opacity: clamp01(rise * 1.4), transform: `translateY(${(1 - rise) * 100}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: C.glass, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${flash > 0 ? `rgba(255,255,255,${0.12 + 0.7 * flash})` : C.glassStroke}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)${flash > 0 ? `, 0 0 ${40 * flash}px rgba(255,255,255,${0.16 * flash})` : ""}`, boxSizing: "border-box" }} />
        <div style={{ position: "absolute", left: 52, top: 50, transform: "translateY(-50%)" }}><Pill tone="trust">Safe versions</Pill></div>
        {VERSIONS.map((v, i) => {
          const t = ticks[i], k = clamp01((f - (t - 1)) / 8), ring = springAt(f, t - 2);
          return (
            <div key={v}>
              <Canvas>
                {f >= t - 2 && <g transform={`translate(52 ${rowY(i)})`}>
                  <circle cx={30} cy={0} r={30} fill={`rgba(52,199,89,${0.14 * clamp01(ring)})`} stroke={C.trust} strokeWidth={3} transform={`translate(30 0) scale(${0.5 + 0.5 * ring}) translate(-30 0)`} opacity={clamp01(ring * 1.5)} />
                  <Stroke d={check(30, 1, 36)} at={t - 1} frames={6} color={C.trust} w={5} />
                </g>}
              </Canvas>
              {k > 0 && <div style={{ position: "absolute", left: 140, top: rowY(i), transform: `translateY(calc(-50% + ${(1 - easeOutCubic(k)) * 16}px))`, opacity: easeOutCubic(k), filter: k < 1 ? `blur(${(1 - k) * 6}px)` : undefined, fontFamily: FONT.mono, fontWeight: 500, fontSize: 84, letterSpacing: "-0.01em", color: C.text, whiteSpace: "nowrap", lineHeight: 1 }}>{v}</div>}
            </div>
          );
        })}
        <Canvas><Stroke d={line(52, 504, PANEL.w - 52, 504)} at={c.tick4 - 4} frames={14} color={C.hair} w={2} /></Canvas>
        <Rise at={c.tick4 - 2} frames={12} dy={10} blur={5} style={{ position: "absolute", left: 52, top: 552, transform: "translateY(-50%)" }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 30, color: C.secondary, whiteSpace: "nowrap" }}>{OLD_LINE}</div>
        </Rise>
      </div>
    </div>
  );
};

/** the whole hold: the chat and the panel */
export const Hold: React.FC = () => (<><HostChat /><VersionsPanel /></>);
