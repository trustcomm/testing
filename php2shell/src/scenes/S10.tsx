import React, { useMemo } from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, clamp01, easeInOutCubic, easeOutCubic, smooth, springAt } from "../motion";
import { Stroke, arc, check, circle, line } from "../components/draw";
import { Dust, textPoints } from "../components/dust";
import { Glass } from "../components/glass";
import { KWord, headline } from "../components/kinetic";
import { SHIELD_PATH } from "../components/c-shield";

const HEAD = { x: 540, y: 454, size: 250 };
const CARD = { x: 100, w: 880, h: 168, tops: [664, 860, 1056] };
const KW: React.CSSProperties = { margin: "0 0.07em" };       // room for the 1.08 pop between its neighbours

/** card icons, drawn in a 84 px box (centre 0, 0) */
const IconShield: React.FC<{ at: number }> = ({ at }) => <g transform="scale(0.46)"><Stroke d={SHIELD_PATH} at={at} frames={16} w={6.5} /></g>;
const IconPower: React.FC<{ at: number }> = ({ at }) => <g><Stroke d={arc(0, 3, 22, 305, 595)} at={at} frames={16} /><Stroke d={line(0, -26, 0, -2)} at={at + 4} frames={10} /></g>;
const IconFix: React.FC<{ at: number; checkAt: number; glow: number }> = ({ at, checkAt, glow }) => (
  <g style={{ filter: `drop-shadow(0 0 ${6 + 8 * glow}px rgba(52,199,89,${0.35 + 0.4 * glow}))` }}>
    <Stroke d={circle(0, 0, 31)} at={at} frames={16} color={C.trust} />
    <Stroke d={check(0, 1, 40)} at={checkAt} frames={12} color={C.trust} w={4} />
  </g>
);

const FactCard: React.FC<{ i: number; at: number; end: number; children: React.ReactNode; icon: React.ReactNode }> = ({ i, at, end, children, icon }) => {
  const f = useFrame(), s = springAt(f, at - 2);
  if (s <= 0) return null;
  const active = clamp01((f - at) / 8) * (i === 2 ? 1 : 1 - clamp01((f - end) / 24) * 0.75);
  return (
    <div style={{ position: "absolute", left: CARD.x, top: CARD.tops[i], opacity: clamp01(s * 1.7), transform: `translateY(${(1 - s) * 70}px) scale(${0.94 + 0.06 * s})`, transformOrigin: "50% 100%", filter: s < 0.98 ? `blur(${(1 - s) * 12}px)` : undefined }}>
      <Glass w={CARD.w} h={CARD.h} tint={`rgba(255,255,255,${0.06 + 0.02 * active})`} stroke={`rgba(52,199,89,${0.12 + 0.5 * active})`} style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 44px", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 ${34 * active}px rgba(52,199,89,${0.1 * active})` }}>
        <svg width={84} height={84} viewBox="-42 -42 84 84" style={{ flex: "none", overflow: "visible" }}>{icon}</svg>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 48, lineHeight: 1.14, letterSpacing: "-0.015em", color: C.text, textWrap: "balance" as React.CSSProperties["textWrap"] }}>{children}</div>
      </Glass>
    </div>
  );
};

export const S10: React.FC = () => {
  const f = useFrame(), c = CUES.S10.cue;
  const pts = useMemo(() => textPoints("Sach.", { font: `700 ${HEAD.size}px "Inter Display"`, x: HEAD.x + 6, y: HEAD.y + 15, step: 4 }), []);   // (+6, +15: the canvas text box sits a hair differently from the DOM one)
  const gather = 1 - easeInOutCubic((f - c.gather) / (c.sach - c.gather));            // dust: 1 (scattered) -> 0 (assembled exactly on "sach")
  const textIn = easeOutCubic((f - (c.sach - 3)) / 6), bloom = f < c.sach ? 0 : Math.exp(-(f - c.sach) / 12);
  const u = easeOutCubic((f - c.underline) / c.underlineFrames), drift = smooth(c.exit, c.exit + 14, f);
  const fixT = f - c.fix, fl = fixT < 0 ? 0 : Math.exp(-fixT / 26) * 0.6 + 0.4;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - 0.0 * drift, transform: `translateY(${-22 * drift}px)` }}>
      {f >= c.gather - 2 && f < c.sach + 2 && <Dust points={pts} p={gather} seed={10} size={3} drift={520} dir={Math.PI * 0.5} spread={2.6} stagger={0.25} />}
      {textIn > 0 && (
        <At x={HEAD.x} y={HEAD.y}>
          <KWord at={c.sach} pop style={{ ...headline(HEAD.size), lineHeight: 1, opacity: textIn, textShadow: `0 0 ${60 * bloom}px rgba(255,255,255,${0.4 * bloom})` }}>
            Sach.
            <span style={{ position: "absolute", left: "3%", bottom: "-0.02em", height: 12, width: `${u * 94}%`, borderRadius: 6, background: C.trust, boxShadow: `0 0 22px rgba(52,199,89,0.55)` }} />
          </KWord>
        </At>
      )}
      <FactCard i={0} at={c.cards[0]} end={c.cards[1]} icon={<IconShield at={c.cards[0] + 4} />}>
        No <KWord at={c.keys[0]} underline="trust" style={KW}>confirmed</KWord> major breach <span style={{ display: "block", fontSize: 36, fontWeight: 500, color: C.secondary, marginTop: 4 }}>(as of 21 Oct)</span>
      </FactCard>
      <FactCard i={1} at={c.cards[1]} end={c.cards[2]} icon={<IconPower at={c.cards[1] + 4} />}>
        Some services offline as a <KWord at={c.keys[1]} underline="trust" style={KW}>precaution</KWord>
      </FactCard>
      <FactCard i={2} at={c.cards[2]} end={Infinity} icon={<IconFix at={c.cards[2] + 4} checkAt={c.fix} glow={fl} />}>
        <KWord at={c.keys[2]} underline="trust" style={KW}>Fix</KWord> available
      </FactCard>
    </div>
  );
};
