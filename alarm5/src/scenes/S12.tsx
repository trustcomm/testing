import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, springAt } from "../motion";
import { glide, settle } from "../easing";
import { Local, Stroke, circle, line, poly, rrect } from "../components/draw";
import { Abs, Panel, T, WPill } from "../components/art";
import { Obj, useCam } from "../world";
import { stationAt } from "../components/map";
import { ART, START } from "../timeline";
import { cue } from "../cues/s12";
import { cue as c13 } from "../cues/s13";
import { Site, GY } from "./S11";

/** S12: back at station level: the websites dim; the green PHP-update card with the four safe versions; the reel thumbnail card with a play icon and a Watch arrow */
export const S12World: React.FC = () => {
  const f = useFrame(), cam = useCam();
  const [a, b] = ART.window[1];
  if (f < cue.outStart || f > b + 40) return null;
  const shell = 1 - smooth(1.7, 5.0, cam.s);
  const dim = 1 - 0.7 * smooth(cue.card, cue.card + 24, f);
  const rp = settle(clamp01((f - cue.reelIn) / 24)), bounce = Math.sin((f - cue.reel) / 7) * 8;
  const tapped = f >= cue.tap ? 1 + 0.12 * Math.sin(clamp01((f - cue.tap) / 14) * Math.PI) : 1;
  return (
    <Obj at={stationAt(1)} r={760} art z={3}>
      <div style={{ opacity: shell }}>
        <div style={{ opacity: dim }}><Local>{[-330, -110, 110, 330].map((x) => <Site key={x} x={x} at={0} />)}<Stroke d={line(-480, GY, 480, GY)} p={1} /></Local></div>
        <Panel x={0} y={350} w={940} h={300} at={cue.card} tone="trust">
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <T size={72} display>PHP update <span style={{ color: C.trust }}>karo</span></T>
            <div style={{ display: "flex", gap: 26, alignItems: "baseline" }}>
              {["8.5.12", "8.4.27", "8.3.36", "8.2.35+"].map((v, i) => <T key={v} size={42} mono color={C.text} style={{ opacity: smooth(cue.versions + i * 6, cue.versions + 14 + i * 6, f), transform: `translateY(${(1 - smooth(cue.versions + i * 6, cue.versions + 14 + i * 6, f)) * 10}px)` }}>{v}</T>)}
            </div>
          </div>
        </Panel>
        {/* the reel thumbnail */}
        {f >= cue.reel && (
          <div style={{ position: "absolute", left: -330 + 0, top: -400 + (1 - rp) * 90, width: 660, height: 380, opacity: rp, transform: `scale(${tapped})`, transformOrigin: "50% 50%" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#0d0e12", border: `2px solid ${C.glassStroke}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} />
            <svg width={660} height={380} viewBox="-330 -190 660 380" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <Stroke d={circle(0, -22, 62)} at={cue.reelIn + 4} frames={26} />
              <Stroke d="M-18 -50L36 -22L-18 6Z" at={cue.reelIn + 12} frames={20} fill={C.text} />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center" }}><T size={44} display>PHP2Shell explained</T></div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 322, textAlign: "center" }}><T size={24} mono color={C.secondary}>REEL</T></div>
          </div>
        )}
        {f >= cue.watch - 6 && (
          <div style={{ position: "absolute", left: 360, top: -250, opacity: smooth(cue.watch - 6, cue.watch + 14, f), transform: `translateX(${bounce}px)` }}>
            <svg width={160} height={60} viewBox="-20 -30 160 60" style={{ overflow: "visible" }}><Stroke d="M0 0H92M72 -20L96 0L72 20" at={cue.watch - 6} frames={24} /></svg>
          </div>
        )}
      </div>
      {f >= cue.watch - 6 && <WPill x={470} y={-250} at={cue.watch} size={26}>WATCH</WPill>}
    </Obj>
  );
};
