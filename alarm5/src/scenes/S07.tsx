import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, rand, smooth, springAt, Rise } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, line, rrect, cross } from "../components/draw";
import { Abs, Panel, T, WPill } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { ART } from "../timeline";
import { cue } from "../cues/s07";

export const GROUND = 210;
export const BUILD = [{ x: -380, w: 130, h: 280 }, { x: -190, w: 150, h: 400 }, { x: 0, w: 160, h: 340 }, { x: 190, w: 140, h: 460 }, { x: 380, w: 130, h: 300 }];
const rows = (h: number) => Math.floor((h - 70) / 52);

/** the skyline of server-rack "buildings": outlines, rack slots, lit windows that switch off row by row */
export const City: React.FC<{ at: number; lit: boolean }> = ({ at, lit }) => {
  const f = useFrame();
  const span = cue.windowsEnd - cue.windows;
  return (
    <>
      <Stroke d={line(-480, GROUND, 480, GROUND)} at={at} frames={44} color={C.secondary} />
      {BUILD.map((b, bi) => {
        const top = GROUND - b.h, r = rows(b.h);
        return (
          <g key={bi}>
            <Stroke d={rrect(b.x - b.w / 2, top, b.w, b.h, 10)} at={at + bi * 5} frames={36} />
            <Stroke d={line(b.x - b.w / 2, top + 24, b.x + b.w / 2, top + 24)} at={at + 10 + bi * 5} frames={22} color={C.secondary} />
            {Array.from({ length: r * 3 }, (_, k) => {
              const row = Math.floor(k / 3), col = k % 3, x = b.x + (col - 1) * 38, y = top + 48 + row * 52;
              const t0 = lit ? cue.windows + (row / 8) * span + (bi % 2) * 4 : 0;       // row by row from the top: the whole row goes dark together
              const on = lit ? 1 - smooth(t0, t0 + 10, f) : 1;
              const appear = smooth(at + 24 + bi * 5 + row * 2, at + 40 + bi * 5 + row * 2, f);
              return <rect key={k} x={x - 13} y={y - 11} width={26} height={22} rx={5} fill={C.text} opacity={appear * (0.1 + 0.8 * on)} stroke="none" />;
            })}
          </g>
        );
      })}
    </>
  );
};

const Stamp: React.FC<{ x: number; at: number; label: string }> = ({ x, at, label }) => {
  const f = useFrame();
  if (f < at - 10) return null;
  const chip = settle(clamp01((f - (at - 10)) / 16)), hit = clamp01((f - at) / 8), k = lerp(1.7, 1, settle(hit)), ring = clamp01((f - at) / 18);
  return (
    <div style={{ position: "absolute", left: x - 92, top: 320 - 50, width: 184, height: 100, opacity: chip }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: C.glass, border: `1px solid ${C.glassStroke}`, backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center" }}><T size={50} mono color={C.text}>{label}</T></div>
      {f >= at && (
        <div style={{ position: "absolute", inset: -6, opacity: hit, transform: `rotate(-8deg) scale(${k})` }}>
          <svg width={196} height={112} viewBox="-98 -56 196 112" style={{ overflow: "visible" }}>
            <rect x={-92} y={-50} width={184} height={100} rx={22} fill="rgba(255,59,48,0.12)" stroke={C.alarm} strokeWidth={5} />
            <Stroke d={cross(0, 0, 70)} at={at} frames={8} color={C.alarm} w={7} />
          </svg>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 120 + ring * 200, height: 70 + ring * 140, transform: "translate(-50%,-50%)", borderRadius: 40, border: `2px solid ${C.alarm}`, opacity: 0.5 * (1 - ring) }} />
        </div>
      )}
    </div>
  );
};

export const S7World: React.FC = () => {
  const f = useFrame();
  const [a, b] = ART.window[3];
  if (f < a - 30 || f > b + 40) return null;
  // the counter
  const cp = glide(clamp01((f - cue.counterStart) / (cue.counterEnd - cue.counterStart)));
  const val = (cp * 3.2).toFixed(1), pop = f >= cue.lakh && f < cue.lakh + 16 ? 1 + 0.08 * Math.sin(((f - cue.lakh) / 16) * Math.PI) : 1;
  const cOut = smooth(cue.windows - 10, cue.windows + 14, f);
  // the sign
  const st = (f - cue.sign) / 60, swingA = f < cue.sign ? 0 : 24 * Math.exp(-st / 0.55) * Math.cos((2 * Math.PI * st) / 0.95);
  const sIn = settle(clamp01((f - (cue.sign - 14)) / 26));
  return (
    <Obj at={stationAt(3)} r={760} art z={2}>
      <Local>
        <City at={cue.city} lit />
        {/* sparks streaming out of the buildings */}
        {f >= cue.sparks && Array.from({ length: 150 }, (_, i) => {
          const t0 = cue.sparks + rand(i, 1) * (cue.sparksEnd - cue.sparks), age = (f - t0) / 60;
          if (age < 0 || age > 1.3) return null;
          const bi = Math.floor(rand(i, 2) * 5), bd = BUILD[bi], sx = bd.x + (rand(i, 3) - 0.5) * bd.w, sy = GROUND - bd.h + rand(i, 4) * 60;
          const vx = (rand(i, 5) - 0.5) * 420, vy = -(160 + rand(i, 6) * 360);
          return <circle key={i} cx={sx + vx * age} cy={sy + vy * age + 420 * age * age} r={2 + rand(i, 7) * 2.4} fill={rand(i, 8) > 0.35 ? C.alarm : C.text} opacity={(1 - age / 1.3) * 0.9} />;
        })}
      </Local>
      <WPill x={0} y={-300} at={cue.zeabur} size={32}>ZEABUR</WPill>
      <div style={{ opacity: 1 - smooth(cue.pullEnd - 44, cue.pullEnd - 8, f) }}>
        <Abs x={0} y={222}><Rise at={cue.hosting} frames={22}><T size={24} mono color={C.secondary}>HOSTING PLATFORM</T></Rise></Abs>
        <Stamp x={-140} at={cue.aug} label="AUG" /><Stamp x={140} at={cue.oct} label="OCT" />
      </div>
      {/* the counter */}
      {f >= cue.counterStart - 12 && f < cue.windows + 30 && (
        <Panel x={0} y={-40} w={620} h={250} at={cue.counterStart - 12} out={cue.windows - 4} tone="danger" style={{ transform: undefined }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>
            <T size={150} mono color={C.alarm} style={{ fontWeight: 500, textShadow: "0 0 40px rgba(255,59,48,0.45)" }}>{val}M+</T>
            <T size={38} mono color={C.secondary} style={{ marginTop: 6 }}>RECORDS</T>
          </div>
        </Panel>
      )}
      {/* the CLOSING sign */}
      {f >= cue.sign - 14 && (
        <div style={{ position: "absolute", left: 0, top: -170, opacity: sIn }}>
          <svg width={1} height={1} style={{ position: "absolute", overflow: "visible" }}><Stroke d={line(-200, 0, 200, 0)} p={1} color={C.secondary} /></svg>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${swingA}deg)`, transformOrigin: "0 0" }}>
            <svg width={1} height={1} style={{ position: "absolute", overflow: "visible" }}><Stroke d={line(-150, 0, -150, 40)} p={1} color={C.secondary} /><Stroke d={line(150, 0, 150, 40)} p={1} color={C.secondary} /></svg>
            <div style={{ position: "absolute", left: -190, top: 40, width: 380, height: 150, borderRadius: 24, background: "rgba(10,10,12,0.92)", border: `3px solid ${C.alarm}`, boxShadow: "0 0 40px rgba(255,59,48,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <T size={60} display color={C.alarm}>CLOSING</T><T size={32} mono color={C.text}>· DEC 2026</T>
            </div>
          </div>
        </div>
      )}
    </Obj>
  );
};
