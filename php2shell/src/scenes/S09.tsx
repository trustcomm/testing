import React from "react";
import { C } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, Pop, clamp01, easeInOutCubic, easeOutCubic, smooth } from "../motion";
import { Canvas } from "../components/draw";
import { Pill } from "../components/pill";
import { headline } from "../components/kinetic";
import { Gauge, GAUGE } from "../components/c-gauge";
import { ShieldGlyph } from "../components/c-shield";
import { TARGET, needleAt } from "../cues/s09";

// the shield (top-left of the gauge) and the four attacks that bounce off it
const SH = { x: 214, y: 486 };
const SOURCES: { x: number; y: number }[] = [{ x: 66, y: 470 }, { x: 116, y: 300 }, { x: 380, y: 284 }, { x: 960, y: 346 }];
const impactPoint = (s: { x: number; y: number }) => { const dx = s.x - SH.x, dy = s.y - SH.y, l = Math.hypot(dx, dy); return { x: SH.x + (dx / l) * 56, y: SH.y + (dy / l) * 60, nx: dx / l, ny: dy / l }; };

const Arrow: React.FC<{ k: number; hitFrame: number; flight: number }> = ({ k, hitFrame, flight }) => {
  const f = useFrame(), s = SOURCES[k], im = impactPoint(s);
  const t = f - (hitFrame - flight), u = f - hitFrame;
  if (t < 0 || u > 13) return null;
  const dx = im.x - s.x, dy = im.y - s.y, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
  let x: number, y: number, ang: number, a: number;
  if (u < 0) { const e = (t / flight) ** 1.7; x = s.x + dx * e; y = s.y + dy * e; ang = Math.atan2(uy, ux); a = clamp01(t / 3); }
  else {
    const dot = ux * im.nx + uy * im.ny, rx = ux - 2 * dot * im.nx, ry = uy - 2 * dot * im.ny, e = 1 - (1 - u / 13) ** 2;       // the reflection
    x = im.x + rx * 74 * e; y = im.y + ry * 74 * e; ang = Math.atan2(ry, rx) + (k % 2 ? 1 : -1) * 0.5 * e; a = 1 - u / 13;
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`} opacity={0.78 * a} style={{ filter: "drop-shadow(0 0 6px rgba(255,59,48,0.5))" }}>
      <line x1={-96} y1={0} x2={0} y2={0} stroke={C.alarm} strokeWidth={4} strokeLinecap="round" />
      <path d="M-20 -13L0 0L-20 13" fill="none" stroke={C.alarm} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

const Spark: React.FC<{ k: number; hitFrame: number }> = ({ k, hitFrame }) => {
  const f = useFrame(), im = impactPoint(SOURCES[k]), u = f - hitFrame;
  if (u < 0 || u > 9) return null;
  const e = easeOutCubic(u / 9), ang = Math.atan2(im.ny, im.nx);
  return (
    <g opacity={1 - e}>
      <circle cx={im.x} cy={im.y} r={6 + 22 * e} fill="none" stroke={C.text} strokeWidth={2} />
      {[-0.7, 0, 0.7].map((o) => <line key={o} x1={im.x + Math.cos(ang + o) * (12 + 10 * e)} y1={im.y + Math.sin(ang + o) * (12 + 10 * e)} x2={im.x + Math.cos(ang + o) * (26 + 22 * e)} y2={im.y + Math.sin(ang + o) * (26 + 22 * e)} stroke={C.text} strokeWidth={3} strokeLinecap="round" />)}
    </g>
  );
};

export const S9: React.FC = () => {
  const f = useFrame(), c = CUES.S9.cue;
  const v = needleAt(f), shown = Math.min(v, TARGET), since = f - c.hit, glowK = since < 0 ? 0 : Math.exp(-since / 16);
  const desat = smooth(0, 10, f - c.desat);
  // the big number: counts up with the needle (never shows the overshoot), pops on the slam
  const readoutIn = easeOutCubic((f - (c.swing - 6)) / 10), pt = since / 10, pop = since >= 0 && pt <= 1 ? 1 + 0.07 * Math.sin(Math.PI * pt) : 1;
  // the shield: written on at "21", blinks once, fills with light and writes its check on "fix"
  const sIn = (f - c.shieldIn) / 14, blink = f - c.shieldIn > 14 && f - c.shieldIn < 18 ? 0.4 : 1;
  const fixT = f - c.fix, fl = fixT < 0 ? 0 : Math.exp(-fixT / 14), recoil = c.arrows.reduce((m, h) => { const u = f - h; return u >= 0 && u < 9 ? m * (1 - 0.07 * Math.exp(-u / 3) * Math.abs(Math.cos(u * 0.9))) : m; }, 1);
  const shieldScale = (f >= c.shieldIn ? 0.9 + 0.1 * easeOutCubic(sIn) : 0.9) * (fixT >= 0 && fixT < 12 ? 1 + 0.1 * Math.sin((Math.PI * fixT) / 12) : 1) * recoil;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - 0.3 * desat, filter: desat > 0 ? `saturate(${1 - desat}) brightness(${1 - 0.2 * desat})` : undefined }}>
      {since >= 0 && <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: `radial-gradient(circle 600px at ${GAUGE.cx}px ${GAUGE.cy}px, rgba(255,59,48,${0.18 * glowK}) 0%, rgba(255,59,48,0) 100%)` }} />}
      <Gauge at={c.gaugeIn} frames={c.arcFrames} v={v} swing={c.swing} f10={c.f10} hit={c.hit} glow={glowK} />
      {/* the big number: Inter Display, with a small /10 */}
      {readoutIn > 0 && (
        <At x={540} y={1112}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, opacity: readoutIn, transform: `translateY(${(1 - readoutIn) * 16}px) scale(${pop})`, transformOrigin: "50% 60%" }}>
            <div style={{ ...headline(272), fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"', textShadow: `0 0 ${46 * glowK}px rgba(255,59,48,${0.55 * glowK})` }}>{shown.toFixed(1)}</div>
            <div style={{ ...headline(80), color: C.secondary }}>/10</div>
          </div>
        </At>
      )}
      <At x={540} y={1282}><Pop at={c.critical - 4}><Pill tone="danger" size={42} style={{ padding: "17px 44px", borderWidth: 2, background: "rgba(255,59,48,0.08)" }}>CRITICAL</Pill></Pop></At>
      {/* the first hint of green: the fix */}
      <Canvas>
        {f >= c.shieldIn && (
          <g transform={`translate(${SH.x} ${SH.y}) scale(${shieldScale})`} opacity={blink}>
            <ShieldGlyph p={easeInOutCubic(sIn)} pc={easeInOutCubic(fixT / 12)} color={C.trust} fill={`rgba(52,199,89,${0.2 * fl})`} glow={fl > 0.05 ? `rgba(52,199,89,${0.4 + 0.5 * fl})` : "rgba(52,199,89,0.25)"} />
          </g>
        )}
        {fixT >= 0 && fixT < 20 && <circle cx={SH.x} cy={SH.y} r={50 + 70 * easeOutCubic(fixT / 20)} fill="none" stroke={C.trust} strokeWidth={3} opacity={0.8 * (1 - fixT / 20)} />}
        {c.arrows.map((h, k) => <Arrow key={k} k={k} hitFrame={h} flight={c.flight} />)}
        {c.arrows.map((h, k) => <Spark key={`s${k}`} k={k} hitFrame={h} />)}
      </Canvas>
      <At x={SH.x} y={604}><Pop at={c.chipIn}><Pill size={28} style={{ border: `2px solid ${C.trust}`, color: C.text, padding: "13px 26px", background: "rgba(52,199,89,0.07)" }}>FIX: 21 OCT</Pill></Pop></At>
    </div>
  );
};
