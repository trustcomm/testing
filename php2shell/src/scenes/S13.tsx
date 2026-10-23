import React from "react";
import { C, FONT } from "../theme";
import { CUES, cameraAt } from "../timeline";
import { useFrame } from "../clock";
import { Pop, Rise, clamp01, easeInOutCubic, easeOutCubic, springAt } from "../motion";
import { Canvas, Stroke, circle, pointAt, quad, rrect } from "../components/draw";
import { KWord } from "../components/kinetic";
import { Pill } from "../components/pill";
import { browserWindow, envelope, paperPlane, person } from "../components/d-icons";

// S13 "Apni website check karne ka simple tareeka chahiye? Comment karo PHP, main bhej dunga. Aur yeh video us dost ko bhejo... jiski website hai."
const PILL = { cx: 540, cy: 572, w: 780, h: 196 };
const LABEL_Y = 366;
const FRIEND = { x: 700, y: 1040, head: 46 };
const WIN = { x: 524, y: 736, w: 352, h: 192 };
const ROUTE = quad(352, 686, 214, 1030, 636, 1112);             // the plane's flight: out of the pill's lower left, down and round, to the friend's shoulder
const HANDLE_Y = 1296, SOURCES_Y = 1456;
const LABEL = ["Website", "check", "karne", "ka", "tareeka"];

const WordRise: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useFrame(), p = easeOutCubic((f - at) / 11);
  return <span style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 16}px)`, filter: p < 1 ? `blur(${(1 - p) * 7}px)` : undefined }}>{children}</span>;
};

export const S13: React.FC = () => {
  const f = useFrame(), c = CUES.S13.cue;
  const cam = cameraAt(f);

  // ---- the pill: outline writes on while the question is asked; on "Comment" it fills white and pops; then it pulses gently ----
  const fill = clamp01((f - (c.pillIn - 6)) / 6), pop = springAt(f, c.pillIn - 4);
  const pul = f >= c.pulse ? (f - c.pulse) / 56 : -1;
  const pulse = pul >= 0 ? 1 + 0.02 * Math.sin(2 * Math.PI * pul) : 1;
  const dip = f >= c.flightStart - 2 && f < c.flightStart + 8 ? 1 - 0.035 * Math.sin((Math.PI * (f - (c.flightStart - 2))) / 10) : 1;   // it dips as the plane leaves
  const ringT = pul >= 0 ? pul % 1 : -1;
  const phpP = springAt(f, c.php - 3);

  // ---- the paper plane ----
  const lx = (f - c.flightStart) / (c.land - c.flightStart), fl = 0.55 * easeOutCubic(lx) + 0.45 * easeInOutCubic(lx), landed = f - c.land;   // quick launch, a soft landing
  const pos = pointAt(ROUTE, fl);
  const planeS = Math.min(0.55 + 0.45 * easeOutCubic((f - c.flightStart) / 6), 1) * (landed > 0 ? 1 - easeInOutCubic(landed / 9) : 1);
  const trailA = f < c.land ? 0.6 : 0.3 + 0.3 * (1 - clamp01((f - c.land) / 18));   // the dotted route stays, fainter, as the memory of the send
  const ripple = clamp01(landed / 16), bounce = landed >= 0 && landed < 14 ? Math.sin((Math.PI * landed) / 14) : 0;
  const fr = person(FRIEND.x, FRIEND.y, FRIEND.head);
  const win = browserWindow(WIN.x, WIN.y, WIN.w, WIN.h);
  const hop = f >= c.bhej && f < c.bhej + 14 ? Math.sin((Math.PI * (f - c.bhej)) / 14) : 0;
  const chimeGlow = f >= c.chime ? Math.exp(-(f - c.chime) / 22) : 0;

  return (
    <>
      <Canvas>
        {/* the pill outline (empty, waiting) */}
        <Stroke d={rrect(PILL.cx - PILL.w / 2, PILL.cy - PILL.h / 2, PILL.w, PILL.h, PILL.h / 2)} at={c.pillOutline} frames={26} color="rgba(245,245,247,0.42)" opacity={1 - fill} />
        {/* the gentle pulse ring */}
        {ringT >= 0 && <rect x={PILL.cx - PILL.w / 2 - 40 * ringT} y={PILL.cy - PILL.h / 2 - 40 * ringT} width={PILL.w + 80 * ringT} height={PILL.h + 80 * ringT} rx={(PILL.h + 80 * ringT) / 2} fill="none" stroke={C.text} strokeWidth={3} opacity={0.32 * (1 - ringT) ** 1.5} />}
        {/* the plane's route (dotted trail) and the landing ripple */}
        <Stroke d={ROUTE} p={f < c.flightStart ? 0 : fl} dotted={16} opacity={trailA} />
        {landed >= 0 && ripple < 1 && <circle cx={636} cy={1112} r={12 + 64 * easeOutCubic(ripple)} fill="none" stroke={C.text} strokeWidth={3} opacity={0.7 * (1 - ripple)} />}
        {/* the friend */}
        <g transform={`translate(0 ${-9 * bounce})`}>
          <Stroke d={fr.head} at={c.avatarIn} frames={14} />
          <Stroke d={fr.shoulders} at={c.avatarIn + 5} frames={14} />
        </g>
        {/* his browser window, floating above his head on a thought-bubble tether */}
        <Stroke d={circle(FRIEND.x, FRIEND.y - 70, 7)} at={c.windowIn - 4} frames={6} />
        <Stroke d={circle(FRIEND.x, FRIEND.y - 96, 11)} at={c.windowIn - 1} frames={6} />
        <Stroke d={win.frame} at={c.windowIn} frames={16} />
        <Stroke d={win.bar} at={c.windowIn + 6} frames={8} />
        {win.dots.map((d, i) => <Stroke key={i} d={d} at={c.windowIn + 8 + i * 2} frames={5} />)}
        <Stroke d={win.address} at={c.windowIn + 9} frames={10} />
        <Stroke d={`M${WIN.x + 32} ${WIN.y + 100}H${WIN.x + WIN.w - 96}M${WIN.x + 32} ${WIN.y + 134}H${WIN.x + WIN.w - 176}`} at={c.windowIn + 12} frames={12} opacity={0.5} />
        {/* the paper plane */}
        {f >= c.flightStart && planeS > 0 && <path d={paperPlane(pos.x, pos.y, 112 * planeS, pos.angle)} fill={C.black} stroke={C.text} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
      </Canvas>

      {/* the line above the pill: "Website check karne ka tareeka" + a line envelope */}
      <div style={{ position: "absolute", left: 0, right: 0, top: LABEL_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", gap: "0 0.3em", fontFamily: FONT.body, fontWeight: 600, fontSize: 46, letterSpacing: "-0.015em", color: C.text, whiteSpace: "nowrap" }}>
          {LABEL.map((wd, i) => <WordRise key={wd} at={c.labelWords[i] - 2}>{wd === "tareeka" ? <KWord at={c.tareeka + 2} underline="trust">{wd}</KWord> : wd}</WordRise>)}
        </div>
        <svg width={100} height={70} viewBox="0 0 100 70" style={{ overflow: "visible", transform: `translateY(${-16 * hop}px) scale(${1 + 0.18 * hop})` }}>
          <Stroke d={envelope(50, 35, 88, 60)} at={c.envelope} frames={18} />
        </svg>
      </div>

      {/* the pill: white fill, black text */}
      {f >= c.pillIn - 6 && (
        <div style={{ position: "absolute", left: PILL.cx - PILL.w / 2, top: PILL.cy - PILL.h / 2, width: PILL.w, height: PILL.h, borderRadius: PILL.h / 2, background: C.text, opacity: fill, transform: `scale(${(0.88 + 0.12 * pop) * pulse * dip})`, boxShadow: `0 0 ${34 + 14 * Math.sin(2 * Math.PI * Math.max(0, pul))}px rgba(245,245,247,${pul >= 0 ? 0.18 : 0.1})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <Rise at={c.pillIn - 3} frames={9} dy={14} blur={6}><span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 98, letterSpacing: "-0.03em", color: C.black }}>Comment</span></Rise>
          <span style={{ display: "inline-block", fontFamily: FONT.display, fontWeight: 700, fontSize: 98, letterSpacing: "-0.03em", color: C.black, opacity: clamp01(phpP * 1.6), transform: `scale(${0.7 + 0.3 * phpP})` }}>PHP</span>
        </div>
      )}

      {/* the friend's label */}
      <div style={{ position: "absolute", left: FRIEND.x, top: 1198, transform: "translate(-50%,-50%)" }}><Pop at={c.dost - 2}><Pill>Dost</Pill></Pop></div>
      {/* the address in the window */}
      {f >= c.windowHit - 2 && <div style={{ position: "absolute", left: WIN.x + 108 + (WIN.w - 108 - 18) / 2, top: WIN.y + 26, transform: `translate(-50%,-50%) scale(${1 + 0.1 * Math.sin(Math.PI * clamp01((f - c.windowHit) / 9))})`, fontFamily: FONT.mono, fontSize: 26, color: C.secondary, whiteSpace: "nowrap", opacity: easeOutCubic((f - c.windowHit + 2) / 6) }}>website.com</div>}

      {/* end card */}
      <div style={{ position: "absolute", left: 0, right: 0, top: HANDLE_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
        <Rise at={c.handle} frames={12}><div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 72, letterSpacing: "-0.01em", color: C.text, textShadow: chimeGlow > 0 ? `0 0 ${34 * chimeGlow}px rgba(245,245,247,${0.55 * chimeGlow})` : undefined }}>@baqur.ai</div></Rise>
      </div>
      {/* the sources line is pinned to the SCREEN (the camera's push is undone) so it never creeps into the bottom 440 px */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "540px 960px", transform: `scale(${1 / cam})`, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: SOURCES_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
          <Rise at={c.sources} frames={12} dy={10} blur={5}><div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 26, color: C.secondary, whiteSpace: "nowrap" }}>Sources: PHP advisory · The Hacker News · watchTowr · Qualys</div></Rise>
        </div>
      </div>
    </>
  );
};
