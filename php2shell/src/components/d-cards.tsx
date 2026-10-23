// S12: the two verdict cards. Left: "Plugin update" (a puzzle piece) gets a red X. Right: "PHP update + server restart" (a restart arrow round "PHP") gets a green check.
import React from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeInOutCubic, springAt } from "../motion";
import { Canvas, Stroke, check, line } from "./draw";
import { KWord } from "./kinetic";
import { puzzle, restartArrow } from "./d-icons";

export const CARD = { w: 404, h: 620, top: 490, xL: 298, xR: 782, icon: { x: 202, y: 208 }, title: 382, sub: 436, badge: { x: 202, y: 532, r: 48 } };

const Frame: React.FC<{ x: number; style: React.CSSProperties; border?: string; glow?: string; children: React.ReactNode }> = ({ x, style, border, glow, children }) => (
  <div style={{ position: "absolute", left: x - CARD.w / 2, top: CARD.top, width: CARD.w, height: CARD.h, ...style }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: C.glass, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${border ?? C.glassStroke}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)${glow ? `, ${glow}` : ""}`, boxSizing: "border-box" }} />
    {children}
  </div>
);
const Title: React.FC<{ y: number; size: number; color?: string; weight?: number; display?: boolean; children: React.ReactNode }> = ({ y, size, color = C.text, weight = 700, display, children }) => (
  <div style={{ position: "absolute", left: 0, width: CARD.w, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: display ? FONT.display : FONT.body, fontWeight: weight, fontSize: size, letterSpacing: display ? "-0.03em" : "-0.01em", color, whiteSpace: "nowrap", lineHeight: 1.05 }}>{children}</div>
);
const enter = (f: number, at: number): React.CSSProperties => { const s = springAt(f, at); return { opacity: clamp01(s * 1.8), transform: `translateY(${(1 - s) * 40}px) scale(${0.93 + 0.07 * s})` }; };

export const PluginCard: React.FC = () => {
  const f = useFrame(), c = CUES.S12.cue;
  if (f < c.leftCard - 2) return null;
  const dim = 1 - 0.62 * easeInOutCubic((f - (c.scaleUp - 2)) / 12);
  const { badge, icon } = CARD;
  const ring = springAt(f, c.xRing), hit = f - c.xHit, glow = hit < 0 ? 0 : Math.exp(-hit / 12);
  const p1 = clamp01((f - (c.xHit - 6)) / 3), p2 = clamp01((f - (c.xHit - 3)) / 3), d = 19;
  const e = enter(f, c.leftCard - 2);
  return (
    <Frame x={CARD.xL} style={{ ...e, opacity: (e.opacity as number) * dim }}>
      <Canvas>
        <Stroke d={puzzle(icon.x, icon.y, 206)} at={c.leftCard + 2} frames={20} />
        <circle cx={badge.x} cy={badge.y} r={badge.r} fill="none" stroke={C.hair} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={1 - clamp01(ring * 1.2)} />
        {ring > 0 && <circle cx={badge.x} cy={badge.y} r={badge.r} fill={`rgba(255,59,48,${0.14 * clamp01(ring)})`} stroke={C.alarm} strokeWidth={3} opacity={clamp01(ring * 1.6)} transform={`translate(${badge.x} ${badge.y}) scale(${0.55 + 0.45 * ring}) translate(${-badge.x} ${-badge.y})`} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${16 * glow}px ${C.alarm})` : undefined }} />}
        <g style={{ filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px ${C.alarm})` : undefined }}>
          <Stroke d={line(badge.x - d, badge.y - d, badge.x + d, badge.y + d)} p={p1} color={C.alarm} w={7} />
          <Stroke d={line(badge.x + d, badge.y - d, badge.x - d, badge.y + d)} p={p2} color={C.alarm} w={7} />
        </g>
      </Canvas>
      <Title y={CARD.title} size={48} display>Plugin update</Title>
      <Title y={CARD.sub} size={30} color={C.secondary} weight={500}>plugin files only</Title>
    </Frame>
  );
};

export const PhpCard: React.FC = () => {
  const f = useFrame(), c = CUES.S12.cue;
  if (f < c.rightCard - 2) return null;
  const { badge, icon } = CARD;
  const e = enter(f, c.rightCard - 2);
  const up = springAt(f, c.scaleUp - 2), ring = springAt(f, c.checkHit - 3), hit = f - c.checkHit, glow = hit < 0 ? 0 : Math.exp(-hit / 14);
  const spin = 360 * easeInOutCubic((f - c.checkHit) / (c.spinEnd - c.checkHit));
  const sel = clamp01(up);
  return (
    <Frame x={CARD.xR} style={{ ...e, transform: `${e.transform} scale(${1 + 0.08 * up})` }} border={sel > 0 ? `rgba(52,199,89,${0.12 + 0.5 * sel})` : undefined} glow={sel > 0 ? `0 0 ${46 * sel}px rgba(52,199,89,${0.16 * sel})` : undefined}>
      <Canvas>
        <g transform={`rotate(${spin} ${icon.x} ${icon.y})`}><Stroke d={restartArrow(icon.x, icon.y, 90)} at={c.rightCard + 2} frames={22} /></g>
        <circle cx={badge.x} cy={badge.y} r={badge.r} fill="none" stroke={C.hair} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={1 - clamp01(ring * 1.2)} />
        {ring > 0 && <circle cx={badge.x} cy={badge.y} r={badge.r} fill={`rgba(52,199,89,${0.16 * clamp01(ring)})`} stroke={C.trust} strokeWidth={3} opacity={clamp01(ring * 1.6)} transform={`translate(${badge.x} ${badge.y}) scale(${0.55 + 0.45 * ring}) translate(${-badge.x} ${-badge.y})`} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${16 * glow}px ${C.trust})` : undefined }} />}
        <g style={{ filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px ${C.trust})` : undefined }}>
          <Stroke d={check(badge.x, badge.y + 1, 56)} at={c.checkHit - 2} frames={8} color={C.trust} w={7} />
        </g>
      </Canvas>
      <div style={{ position: "absolute", left: icon.x, top: icon.y, transform: "translate(-50%,-50%)", fontFamily: FONT.mono, fontWeight: 700, fontSize: 58, letterSpacing: "0.02em", color: C.text, opacity: clamp01((f - c.rightCard - 6) / 10) }}>PHP</div>
      <Title y={CARD.title} size={48} display><KWord at={c.checkHit} style={{ marginRight: "0.2em" }}>PHP</KWord><KWord at={c.update2} underline="trust">update</KWord></Title>
      <Title y={CARD.sub} size={30} color={sel > 0 ? C.text : C.secondary} weight={500}>+ server restart</Title>
    </Frame>
  );
};
