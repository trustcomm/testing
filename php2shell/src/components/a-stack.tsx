// The stack diagram of S3 (and, unchanged, the start of S4): Website (the window, lifted away) -> WordPress (pill) -> PHP (a glass panel with a big mono PHP),
// the two red bugs that crawl out of the panel's lower corners with their CVE labels, the "2016 -> 2026" counter with its dust trail, and a faint cobweb.
// Every element is a pure function of the ABSOLUTE frame, so S4 can draw exactly what S3 ended with (and add the magnifying glass on top).
import React, { useId, useLayoutEffect, useMemo, useRef } from "react";
import { C, FONT, H, W } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeInOutCubic, easeOutCubic, lerp, rand, springAt } from "../motion";
import { Canvas, Stroke, line, poly, quad, rrect } from "./draw";
import { BrowserWindow, PILL_BOTTOM, WordPressPill } from "./a-browser";
import { Bug, bugState, type BugDef } from "./a-bug";
import { CVE_TEXT, TYPE_CPS } from "../cues/s03";

export const PANEL = { x: 200, y: 790, w: 680, h: 300, r: 28 } as const;
export const PHP_Y = 885;
export const COUNTER_Y = 1006;
export const BUG_ROW_Y = 1170;
export const LABELS = [{ x: 92, y: BUG_ROW_Y - 26, w: 292 }, { x: 696, y: BUG_ROW_Y - 26, w: 292 }] as const;
export const LABEL_PAD = 21;
const CONN = { x: 540, y0: PILL_BOTTOM + 8, y1: PANEL.y - 8 };

export const bugDefs = (): [BugDef, BugDef] => {
  const c = CUES.S3.cue;
  return [
    { p0: [PANEL.x + 16, PANEL.y + PANEL.h - 10], pc: [465, PANEL.y + PANEL.h - 4], p1: [485, BUG_ROW_Y], t0: c.bug1, t1: c.bug1End, seed: 1 },
    { p0: [PANEL.x + PANEL.w - 16, PANEL.y + PANEL.h - 10], pc: [615, PANEL.y + PANEL.h - 4], p1: [595, BUG_ROW_Y], t0: c.bug2, t1: c.bug2End, seed: 2 },
  ];
};

const popAt = (f: number, at: number) => { const t = (f - at) / 9; return t >= 0 && t <= 1 ? 0.08 * Math.sin(Math.PI * t) : 0; };

// ---- the counter geometry (54 px mono) ----
export const CNT = { size: 54, adv: 54 * 0.6 + 0.54, xL: 343, xA0: 500, xA1: 580, xR: 607 };
/** the odometer: the right-hand number 2016 -> 2026 as continuous digit columns */
const odo = (f: number) => {
  const c = CUES.S3.cue, e = easeOutCubic((f - c.roll) / (c.rollEnd - c.roll)), t = 16 + 10 * e;
  const ones = t % 10, oi = Math.floor(ones + 1e-9), tens = Math.floor(t / 10 + 1e-9) + (ones >= 9 ? ones - 9 : 0);
  return { ones, oi, tensC: tens, e };
};

const Digit: React.FC<{ x: number; y: number; v: number; color?: string }> = ({ x, y, v, color = C.text }) => {
  // a rolling digit: shows floor(v) and the next one sliding in, clipped to its cell
  const id = useId().replace(/:/g, ""), lh = 64, base = Math.floor(v + 1e-9), fr = v - base;
  const cell = CNT.adv;
  return (
    <g>
      <clipPath id={id}><rect x={x - cell / 2} y={y - lh / 2} width={cell} height={lh} /></clipPath>
      <g clipPath={`url(#${id})`}>
        {[0, 1].map((k) => <text key={k} x={x} y={y + (k - fr) * lh} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={500} fontSize={CNT.size} fill={color}>{(base + k) % 10}</text>)}
      </g>
    </g>
  );
};

const Counter: React.FC = () => {
  const f = useFrame(), c = CUES.S3.cue;
  const rise = easeOutCubic((f - c.cntIn) / 12);
  if (rise <= 0) return null;
  const o = odo(f), pop = popAt(f, c.rollEnd), y = COUNTER_Y;
  const cx = (i: number) => CNT.xR + CNT.adv * (i + 0.5);
  return (
    <g opacity={rise} transform={`translate(0 ${(1 - rise) * 16})`} style={{ filter: rise < 1 ? `blur(${(1 - rise) * 6}px)` : undefined }}>
      <text x={CNT.xL} y={y} dominantBaseline="central" fontFamily={FONT.mono} fontWeight={500} fontSize={CNT.size} fill={C.secondary} style={{ letterSpacing: "0.01em" }}>2016</text>
      <Stroke d={line(CNT.xA0, y, CNT.xA1, y)} at={c.cntIn + 2} frames={8} w={3} />
      <Stroke d={poly([[CNT.xA1 - 16, y - 14], [CNT.xA1, y], [CNT.xA1 - 16, y + 14]])} at={c.cntIn + 8} frames={6} w={3} />
      <g transform={`translate(${CNT.xR + 2 * CNT.adv} ${y}) scale(${1 + pop}) translate(${-(CNT.xR + 2 * CNT.adv)} ${-y})`}>
        <text x={cx(0)} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={500} fontSize={CNT.size} fill={C.text}>2</text>
        <text x={cx(1)} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={500} fontSize={CNT.size} fill={C.text}>0</text>
        <Digit x={cx(2)} y={y} v={o.tensC} />
        <Digit x={cx(3)} y={y} v={o.ones} />
      </g>
    </g>
  );
};

/** the dust trail behind the rolling counter: seeded 2-3 px white dots shed along the arrow and the number, drifting and fading */
export const Trail: React.FC = () => {
  const f = useFrame(), c = CUES.S3.cue, ref = useRef<HTMLCanvasElement>(null);
  const N = 260, t0 = c.roll - 3, t1 = c.rollEnd + 8;
  const ps = useMemo(() => Array.from({ length: N }, (_, i) => {
    const k = i / N, born = t0 + k * (t1 - t0), digit = rand(i, 58) < 0.45;      // half of the dust is shed along the arrow, half from the rolling digits
    const x = digit ? CNT.xR + 2.5 * CNT.adv + rand(i, 51) * CNT.adv * 1.4 : lerp(CNT.xA0 - 6, CNT.xA1 + 8, easeInOutCubic(k)) + (rand(i, 51) - 0.5) * 14;
    return { born, x, y: COUNTER_Y + (digit ? (rand(i, 52) - 0.4) * 56 : 6 + rand(i, 52) * 28), vx: digit ? -0.55 + rand(i, 53) * 0.5 : 0.1 + rand(i, 53) * 0.9, vy: digit ? -0.2 + rand(i, 54) * 0.7 : -0.05 + rand(i, 54) * 0.55, life: 30 + rand(i, 55) * 44, sz: 1.6 + rand(i, 56) * 1.6, w: rand(i, 57) * 6 };
  }), [t0, t1]);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const g = cv.getContext("2d")!; g.clearRect(0, 0, W, H); g.fillStyle = C.text;
    if (f < t0 || f > t1 + 76) return;
    for (const p of ps) {
      const a = f - p.born; if (a < 0 || a > p.life) continue;
      const u = a / p.life;
      g.globalAlpha = 0.85 * (1 - u) ** 1.3 * clamp01(a / 3);
      g.beginPath(); g.arc(p.x + p.vx * a + Math.sin(a * 0.2 + p.w) * 3, p.y + p.vy * a + 0.012 * a * a, p.sz * 0.5 + 0.4, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />;
};

// ---- the cobweb: radials then three sagging arcs, creeping out of the panel's top-left corner ----
export const WEB = (() => {
  const O = { x: PANEL.x + 3, y: PANEL.y + 3 }, th = [6, 28, 50, 72, 88].map((a) => (a * Math.PI) / 180), rs = [64, 118, 176], L = 206;
  const radials = th.map((a) => line(O.x, O.y, O.x + L * Math.cos(a), O.y + L * Math.sin(a)));
  const arcs = rs.map((r) => th.slice(0, -1).map((a, j) => {
    const b = th[j + 1], m = (a + b) / 2;
    return quad(O.x + r * Math.cos(a), O.y + r * Math.sin(a), O.x + r * 0.84 * Math.cos(m), O.y + r * 0.84 * Math.sin(m), O.x + r * Math.cos(b), O.y + r * Math.sin(b));
  }));
  return { radials, arcs };
})();
const Cobweb: React.FC<{ clip: string }> = ({ clip }) => {
  const c = CUES.S3.cue, span = c.webEnd - c.web, radialEnd = c.web + 0.3 * span;
  return (
    <g clipPath={`url(#${clip})`} opacity={0.32}>
      {WEB.radials.map((d, i) => <Stroke key={i} d={d} at={c.web + i * 2} frames={Math.round(0.22 * span)} w={2} />)}
      {WEB.arcs.map((ring, k) => ring.map((d, j) => <Stroke key={`${k}-${j}`} d={d} at={radialEnd + k * 0.23 * span + j * 2} frames={Math.round(0.2 * span)} w={2} />))}
    </g>
  );
};

// ---- the glass panel with the big PHP, the red glow of what is about to crawl out, the counter, the cobweb ----
export const PanelArt: React.FC = () => {
  const f = useFrame(), c = CUES.S3.cue, id = useId().replace(/:/g, "");
  const scan = easeInOutCubic((f - c.scanStart) / (c.liftEnd + 4 - c.scanStart));
  if (scan <= 0) return null;
  const full = scan >= 1, y1 = PANEL.y + scan * PANEL.h;
  const php = easeOutCubic((f - (c.php0 - 4)) / 12), sc = 1 + popAt(f, c.php0) + popAt(f, c.php1);
  const glowIn = clamp01((f - c.glowStart) / (c.glowPeak - c.glowStart)), glowOut = clamp01((f - (c.bug2End + 4)) / 30), glow = glowIn * (1 - 0.8 * glowOut);
  const ring = (at: number, k: number) => { const e = easeOutCubic((f - at) / 16); return e > 0 && e < 1 ? <path d={rrect(PANEL.x - 16 * e, PANEL.y - 16 * e, PANEL.w + 32 * e, PANEL.h + 32 * e, PANEL.r + 16 * e)} fill="none" stroke={C.text} strokeWidth={2} opacity={k * (1 - e)} /> : null; };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={0.1} /><stop offset="1" stopColor="#fff" stopOpacity={0.03} /></linearGradient>
        <radialGradient id={`${id}r`}><stop offset="0" stopColor={C.alarm} stopOpacity={0.3} /><stop offset="1" stopColor={C.alarm} stopOpacity={0} /></radialGradient>
        <clipPath id={`${id}c`}><rect x={PANEL.x - 4} y={PANEL.y - 4} width={PANEL.w + 8} height={full ? PANEL.h + 8 : scan * PANEL.h + 4} /></clipPath>
        <clipPath id={`${id}p`}><path d={rrect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r)} /></clipPath>
      </defs>
      {glow > 0.01 && [PANEL.x + 10, PANEL.x + PANEL.w - 10].map((x, i) => <circle key={i} cx={x} cy={PANEL.y + PANEL.h} r={135} fill={`url(#${id}r)`} opacity={glow} />)}
      <g clipPath={full ? undefined : `url(#${id}c)`}>
        <path d={rrect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r)} fill={`url(#${id}g)`} stroke="rgba(245,245,247,0.34)" strokeWidth={1.6} />
        <path d={line(PANEL.x + 34, PANEL.y + 1.5, PANEL.x + PANEL.w - 34, PANEL.y + 1.5)} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} strokeLinecap="round" />
        <Cobweb clip={`${id}p`} />
        {php > 0 && (
          <g transform={`translate(540 ${PHP_Y + (1 - php) * 22}) scale(${sc})`} opacity={php} style={{ filter: php < 1 ? `blur(${(1 - php) * 8}px)` : undefined }}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={700} fontSize={150} fill={C.text} style={{ letterSpacing: "-0.02em" }}>PHP</text>
          </g>
        )}
        <Counter />
      </g>
      {ring(c.php0, 0.35)}{ring(c.php1, 0.5)}
      {!full && scan > 0 && <g opacity={1 - clamp01((scan - 0.85) / 0.15)}>
        <defs><linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.95} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient></defs>
        <rect x={PANEL.x - 30} y={y1 - 1.5} width={PANEL.w + 60} height={3} fill={`url(#${id}s)`} style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))" }} />
      </g>}
    </g>
  );
};

// ---- the bugs (frozen from the moment S4's lens catches them) ----
export const BugsArt: React.FC = () => {
  const f = useFrame(), caught = CUES.S4.cue.caught, defs = bugDefs();
  const st = defs.map((d) => bugState(d, f, caught));
  return (
    <g>
      {st.map((b, i) => <Bug key={i} s={b} />)}
    </g>
  );
};

// ---- the CVE labels: a red capsule writes on, then the text types in (mono 26 px) ----
const Capsule: React.FC<{ i: 0 | 1 }> = ({ i }) => {
  const f = useFrame(), c = CUES.S3.cue, at = i === 0 ? c.label1 : c.label2, tAt = i === 0 ? c.type1 : c.type2, L = LABELS[i], text = CVE_TEXT[i];
  if (f < at) return null;
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - tAt) / 30) * TYPE_CPS)));
  const adv = 26 * 0.6 + 1.04;
  return (
    <g>
      <path d={rrect(L.x, L.y, L.w, 52, 26)} fill="rgba(255,59,48,0.07)" opacity={clamp01((f - at) / 8)} />
      <Stroke d={rrect(L.x, L.y, L.w, 52, 26)} at={at} frames={9} color={C.alarm} w={2} />
      <text x={L.x + LABEL_PAD} y={L.y + 27} dominantBaseline="central" fontFamily={FONT.mono} fontWeight={500} fontSize={26} fill={C.alarm} style={{ letterSpacing: "0.04em" }}>{text.slice(0, n)}</text>
      {f >= tAt && n < text.length && <rect x={L.x + LABEL_PAD + n * adv} y={L.y + 13} width={3} height={26} rx={1.5} fill={C.alarm} opacity={Math.floor(f / 4) % 2 ? 0.4 : 1} />}
    </g>
  );
};

const Connector: React.FC<{ out: number }> = ({ out }) => {
  const f = useFrame(), c = CUES.S3.cue;
  if (f < c.connect || out >= 1) return null;
  const { x, y0, y1 } = CONN;
  return (
    <g opacity={1 - out}>
      <Stroke d={line(x, y0, x, y1 - 14)} at={c.connect} frames={c.connectEnd - c.connect - 3} w={3} />
      <Stroke d={poly([[x - 15, y1 - 17], [x, y1], [x + 15, y1 - 17]])} at={c.connectEnd - 5} frames={6} w={3} />
      <circle cx={x} cy={y0} r={5} fill={C.text} opacity={clamp01((f - c.connect) / 4)} />
    </g>
  );
};

/** where the lens is (S4) */
export interface LensGeo { x: number; y: number; r: number; k: number }

/** the whole S3 stack. S4 passes `lens` (the panel and the bugs are then masked out inside it and drawn magnified in it) and `tierOut` (the window / pill / connector leave). */
export const Stack: React.FC<{ lens?: LensGeo | null; tierOut?: number }> = ({ lens = null, tierOut = 0 }) => {
  const mid = useId().replace(/:/g, "");
  const art = (<><PanelArt /><BugsArt /></>);
  return (
    <>
      <Canvas>
        {lens ? (
          <>
            <defs>
              <mask id={`${mid}m`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}><rect x={0} y={0} width={W} height={H} fill="#fff" /><circle cx={lens.x} cy={lens.y} r={lens.r} fill="#000" /></mask>
              <clipPath id={`${mid}c`}><circle cx={lens.x} cy={lens.y} r={lens.r - 1.5} /></clipPath>
            </defs>
            <g mask={`url(#${mid}m)`}>{art}</g>
            <g clipPath={`url(#${mid}c)`}><g transform={`translate(${lens.x} ${lens.y}) scale(${lens.k}) translate(${-lens.x} ${-lens.y})`}>{art}</g></g>
          </>
        ) : art}
        <Connector out={tierOut} />
        <Capsule i={0} /><Capsule i={1} />
      </Canvas>
      <Trail />
      <BrowserWindow out={tierOut} />
      <WordPressPill out={tierOut} />
    </>
  );
};
