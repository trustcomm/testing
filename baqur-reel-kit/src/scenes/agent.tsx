// Reusable scene components for reel #2 ("AI ne jhooth bola") and any reel about agents / monitoring.
// Same rules as the core: only EASE.* and SPRING presets, entrances >= 8 frames, transforms only (no layout animation).
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, F, T, SAFE, arcColor} from '../core/tokens';
import {EASE, enter, ramp, springAt} from '../core/motion';
import {CamState, Shot, cameraAt, useCam} from '../core/camera';
import type {TL} from '../core/timeline';
import {Draw, Glass, ICON} from './primitives';

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// ── Eye ───────────────────────────────────────────────────────
export type EyeState = 'watch' | 'silenced' | 'erased' | 'open-green';

/**
 * The monitor, drawn as an eye: two lid arcs, an iris ring and a filled pupil. 420 px wide at size=420.
 * watch       pupil drifts (noise, +-10 px), blinks every ~150 frames (lids close over 6 frames, open over 10), a soft 35 degree scan beam sweeps +-25 degrees on a 90 frame loop
 * silenced    the eye stays, a "muted bell" badge appears and the beam becomes dotted grey
 * erased      the strokes un-draw in reverse order over 18 frames (launch easing), a red hairline X scratches across, the beam flickers for 2 frames and is gone
 * open-green  strokes draw on in green with a soft bloom and one blink at `blinkAt`
 * `state` is the state from `at`; from `changeAt` it becomes `changeTo`.
 */
export const Eye: React.FC<{
  at: number;
  state?: EyeState;
  changeAt?: number;
  changeTo?: EyeState;
  size?: number;
  blinkAt?: number;
  beam?: boolean;
  beamLength?: number;
}> = ({at, state = 'watch', changeAt, changeTo, size = 420, blinkAt, beam = true, beamLength: beamLen}) => {
  const beamLength = beamLen ?? size * 2.6;
  const frame = useCurrentFrame();
  const k = size / 420;
  const eff: EyeState = changeAt !== undefined && changeTo && frame >= changeAt ? changeTo : state;
  const green = eff === 'open-green' || state === 'open-green';
  const col = green ? C.green : C.ink;

  // draw-on (strokes in order: upper lid, lower lid, iris, pupil)
  const drawP = [0, 4, 10, 18].map((d) => ramp(frame, at + d, 24, EASE.settle));
  // erase (reverse order: pupil, iris, lower, upper), each gets a window of the 18 frames
  const q = changeTo === 'erased' && changeAt !== undefined ? ramp(frame, changeAt, 18, EASE.launch) : 0;
  const eraseP = [0, 1, 2, 3].map((i) => 1 - clamp01((q - i * 0.2) / 0.4)); // index i = pupil, iris, lower, upper (the last one finishes exactly at q = 1)
  const prog = (idx: number) => {
    // idx 0 upper, 1 lower, 2 iris, 3 pupil
    const draw = drawP[idx];
    if (changeTo !== 'erased' || changeAt === undefined || frame < changeAt) return draw;
    const e = eraseP[3 - idx];
    return Math.min(draw, e);
  };

  // pupil drift and blink
  const dx = noise2D('eye-x', frame / 90, 1) * 10;
  const dy = noise2D('eye-y', frame / 110, 4) * 6;
  const blinkFrames = blinkAt !== undefined ? [blinkAt] : [];
  let lid = 1;
  if (eff === 'watch' || eff === 'silenced') {
    const ph = (frame - at + 60) % 150;
    if (frame - at > 60 && ph < 16) lid = ph < 6 ? 1 - 0.94 * EASE.glide(ph / 6) : 0.06 + 0.94 * EASE.settle((ph - 6) / 10);
  }
  for (const b of blinkFrames) {
    const ph = frame - b;
    if (ph >= 0 && ph < 16) lid = Math.min(lid, ph < 6 ? 1 - 0.94 * EASE.glide(ph / 6) : 0.06 + 0.94 * EASE.settle((ph - 6) / 10));
  }

  // beam
  const sweep = Math.sin(((frame - at) / 90) * Math.PI * 2) * 25;
  const erasedFor = changeTo === 'erased' && changeAt !== undefined ? frame - changeAt : -1;
  const flicker = erasedFor >= 0 && erasedFor < 4 ? (Math.floor(erasedFor / 2) % 2 === 0 ? 0.3 : 1) : 1;
  const beamOn = beam && eff !== 'open-green' && !(eff === 'erased' && erasedFor >= 4);
  const beamA = (eff === 'silenced' ? 0 : 1) * flicker * ramp(frame, at + 6, 16, EASE.glide);
  const half = Math.tan((17.5 * Math.PI) / 180) * beamLength;
  const gradId = `beam-${at}-${size}`;

  // silenced badge
  const badge = changeTo === 'silenced' && changeAt !== undefined ? ramp(frame, changeAt, 12, EASE.settle) : state === 'silenced' ? ramp(frame, at + 10, 12, EASE.settle) : 0;
  // red X
  const xP = changeTo === 'erased' && changeAt !== undefined ? ramp(frame, changeAt + 3, 8, EASE.launch) : 0;
  const xO = changeTo === 'erased' && changeAt !== undefined ? 1 - ramp(frame, changeAt + 14, 16, EASE.glide) : 0;
  // green bloom
  const bloom = green ? ramp(frame, at + 16, 30, EASE.settle) : 0;

  const stroke = {fill: 'none', stroke: col, strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const};
  const dash = (p: number) => ({pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p, opacity: p > 0.001 ? 1 : 0});
  return (
    <div style={{width: size, height: size * (220 / 420), position: 'relative'}}>
      <svg width={size} height={size * (220 / 420)} viewBox="-210 -110 420 220" style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F5F5F7" stopOpacity="0.16" />
            <stop offset="1" stopColor="#F5F5F7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${gradId}-bloom`}>
            <stop offset="0" stopColor={C.green} stopOpacity="0.38" />
            <stop offset="1" stopColor={C.green} stopOpacity="0" />
          </radialGradient>
        </defs>
        {bloom > 0 && <circle r={300} fill={`url(#${gradId}-bloom)`} opacity={bloom} />}
        {beamOn && beamA > 0.01 && (
          <g transform={`rotate(${sweep})`} opacity={beamA}>
            <polygon points={`0,0 ${-half},${beamLength} ${half},${beamLength}`} fill={`url(#${gradId})`} />
          </g>
        )}
        {eff === 'silenced' && beam && (
          <g transform={`rotate(${sweep})`} opacity={ramp(frame, changeAt ?? at, 12, EASE.glide) * 0.9}>
            <line x1={0} y1={0} x2={-half} y2={beamLength} stroke={C.ink3} strokeWidth={2} strokeDasharray="4 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={0} x2={half} y2={beamLength} stroke={C.ink3} strokeWidth={2} strokeDasharray="4 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        )}
        <g transform={`scale(1 ${lid})`}>
          <path d="M -200 0 C -120 -120, 120 -120, 200 0" {...stroke} {...dash(prog(0))} />
          <path d="M -200 0 C -120 120, 120 120, 200 0" {...stroke} {...dash(prog(1))} />
          <circle r={64} cx={dx * 0.6} cy={dy * 0.6} {...stroke} {...dash(prog(2))} />
          <circle r={26} cx={dx} cy={dy} fill={col} opacity={prog(3) * (changeTo === 'erased' ? 1 : 1)} style={{filter: green ? `drop-shadow(0 0 14px ${C.green})` : undefined}} />
        </g>
        {xO > 0.01 && (
          <g opacity={xO} stroke={C.red} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke">
            <line x1={-170} y1={-90} x2={-170 + 340 * xP} y2={-90 + 180 * xP} vectorEffect="non-scaling-stroke" />
            <line x1={170} y1={-90} x2={170 - 340 * xP} y2={-90 + 180 * xP} vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>
      {badge > 0.01 && (
        <div style={{position: 'absolute', right: -size * 0.04, bottom: -size * 0.1, transform: `scale(${(0.6 + 0.4 * badge) * k * 1.1})`, opacity: badge, transformOrigin: '100% 0'}}>
          <svg width={84} height={84} viewBox="-42 -42 84 84">
            <circle r={40} fill="rgba(28,28,30,0.85)" stroke={C.ink3} strokeWidth={2} />
            <path d="M -12 8 C -12 -14, 12 -14, 12 8 L 17 16 H -17 Z" fill="none" stroke={C.ink2} strokeWidth={3} strokeLinejoin="round" />
            <circle cx={0} cy={22} r={3.2} fill={C.ink2} />
            <line x1={-22} y1={-22} x2={22} y2={22} stroke={C.red} strokeWidth={4} strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ── Terminal ──────────────────────────────────────────────────
export type TermLine = {
  at: number;
  text: string;
  color?: 'ink' | 'ink2' | 'ink3' | 'red' | 'green' | 'amber';
  size?: number;
  swapAt?: number; // from this frame the line shows swapText in swapColor (instantly, with a tiny glitch)
  swapText?: string;
  swapColor?: TermLine['color'];
  swapSize?: number;
  prefix?: string; // '-' (deletion, red) or '+' (addition, green) drawn in the gutter
};
const TERM_COL: Record<NonNullable<TermLine['color']>, string> = {ink: C.ink, ink2: C.ink2, ink3: C.ink3, red: C.red, green: C.green, amber: C.amber};

/** Glass terminal window: grey traffic dots, mono title, lines typing at 2 characters per frame with a blinking block caret. */
export const Terminal: React.FC<{
  at: number;
  title: string;
  w: number;
  h?: number;
  lines: TermLine[];
  titleColor?: string;
  fontSize?: number;
  tint?: string;
  children?: React.ReactNode; // extra absolutely positioned content inside the window (below the title bar)
  from?: 'left' | 'right' | 'up' | 'none';
}> = ({at, title, w, h, lines, titleColor = C.ink2, fontSize = 26, tint, children, from = 'up'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = springAt(frame, fps, at, 'soft');
  const o = ramp(frame, at, 10, EASE.glide);
  const dx = from === 'left' ? -260 * (1 - s) : from === 'right' ? 260 * (1 - s) : 0;
  const dy = from === 'up' ? 50 * (1 - s) : 0;
  // which line is the caret on: the last line that has started
  let active = -1;
  lines.forEach((l, i) => {
    if (frame >= l.at) active = i;
  });
  const caretOn = Math.floor(frame / 30) % 2 === 0;
  return (
    <div style={{transform: `translate3d(${dx}px, ${dy}px, 0)`, opacity: o}}>
      <Glass w={w} h={h} pad={0} radius={30} tint={tint}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '20px 26px', borderBottom: `1px solid ${C.hair}`}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 14, height: 14, borderRadius: 99, background: 'rgba(245,245,247,0.22)'}} />
          ))}
          <div style={{fontFamily: F.mono, fontSize: 22, color: titleColor, marginLeft: 14, letterSpacing: '0.01em'}}>{title}</div>
        </div>
        <div style={{position: 'relative', padding: '22px 28px', fontFamily: F.mono, fontSize, lineHeight: 1.5, minHeight: h ? h - 70 : undefined}}>
          {lines.map((l, i) => {
            const swapped = l.swapAt !== undefined && frame >= l.swapAt;
            const text = swapped ? l.swapText ?? l.text : l.text;
            const colName = swapped ? l.swapColor ?? l.color ?? 'ink' : l.color ?? 'ink';
            const chars = swapped ? text.length : Math.max(0, Math.floor((frame - l.at) * 2));
            if (frame < l.at) return null;
            const shown = text.slice(0, chars);
            const glitch = swapped && frame - (l.swapAt as number) < 3 ? (frame % 2 === 0 ? 3 : -3) : 0;
            return (
              <div key={i} style={{display: 'flex', gap: 14, fontSize: swapped ? l.swapSize ?? l.size ?? fontSize : l.size ?? fontSize, color: TERM_COL[colName], whiteSpace: 'pre', transform: `translateX(${glitch}px)`}}>
                {l.prefix ? <span style={{width: 18, color: l.prefix === '-' ? C.red : C.green}}>{l.prefix}</span> : null}
                <span>
                  {shown}
                  {i === active && (chars < text.length || caretOn) ? <span style={{display: 'inline-block', width: '0.55em', height: '1.05em', background: C.ink, verticalAlign: '-0.15em', opacity: 0.85, marginLeft: 2}} /> : null}
                </span>
              </div>
            );
          })}
          {children}
        </div>
      </Glass>
    </div>
  );
};

// ── ChatBubble ────────────────────────────────────────────────
/** User bubbles: right, solid #F5F5F7 with black text. Agent bubbles: left, glass. `typingUntil`: three bouncing dots (staggered springs) until that frame, then the text resolves. */
export const ChatBubble: React.FC<{
  side: 'user' | 'agent';
  at: number;
  text: React.ReactNode;
  typingUntil?: number;
  maxW?: number;
  fontSize?: number;
  weight?: number;
  tint?: string;
  sub?: string;
}> = ({side, at, text, typingUntil, maxW = 760, fontSize = 40, weight = 600, tint, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const isUser = side === 'user';
  const typing = typingUntil !== undefined && frame < typingUntil;
  const resolve = typingUntil !== undefined ? ramp(frame, typingUntil, 10, EASE.settle) : 1;
  const e = enter(frame, at, 18, 46);
  const dot = (i: number) => {
    const s = springAt(frame, fps, at + 8 + i * 4 + Math.floor((frame - at) / 18) * 0, 'snappy');
    const bounce = Math.sin(((frame - at) / 14 - i * 0.35) * Math.PI) * 8;
    return {opacity: s, transform: `translateY(${-Math.abs(bounce)}px)`};
  };
  return (
    <div style={{display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%', ...e}}>
      <div
        style={{
          maxWidth: maxW,
          borderRadius: 38,
          borderBottomRightRadius: isUser ? 10 : 38,
          borderBottomLeftRadius: isUser ? 38 : 10,
          padding: typing ? '28px 38px' : '24px 38px',
          background: isUser ? C.ink : `linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), ${C.glass}`,
          border: isUser ? 'none' : `1.5px solid ${tint ?? C.glassEdge}`,
          boxShadow: isUser ? '0 20px 60px rgba(0,0,0,0.5)' : `0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)${tint ? `, 0 0 70px ${tint}44` : ''}`,
          color: isUser ? '#000' : C.ink,
          fontFamily: F.display,
          fontSize,
          fontWeight: weight,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          backdropFilter: isUser ? undefined : 'blur(24px)',
        }}
      >
        {typing ? (
          <div style={{display: 'flex', gap: 12, height: 30, alignItems: 'center'}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 16, height: 16, borderRadius: 99, background: C.ink2, ...dot(i)}} />
            ))}
          </div>
        ) : (
          <div style={{opacity: resolve, transform: `translateY(${(1 - resolve) * 8}px)`}}>
            {text}
            {sub ? <div style={{fontFamily: F.mono, fontSize: 24, fontWeight: 500, color: isUser ? 'rgba(0,0,0,0.45)' : C.ink3, marginTop: 8}}>{sub}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
};

/** 3-frame horizontal RGB split on a bubble's text (offset copies at +-4 px, red and cyan at 0.5 alpha). */
export const RGBSplit: React.FC<{at: number; frames?: number; children: React.ReactNode}> = ({at, frames = 3, children}) => {
  const frame = useCurrentFrame();
  const on = frame >= at && frame < at + frames;
  if (!on) return <>{children}</>;
  const j = (frame - at) % 2 === 0 ? 4 : -4;
  const layer = (c: string, dx: number): React.CSSProperties => ({position: 'absolute', inset: 0, color: c, opacity: 0.5, transform: `translateX(${dx}px)`, mixBlendMode: 'screen'});
  return (
    <div style={{position: 'relative'}}>
      <div style={layer('#FF3B30', j)}>{children}</div>
      <div style={layer('#00E5FF', -j)}>{children}</div>
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

// ── LogStream ─────────────────────────────────────────────────
/** Small mono lines "finding #n · flagged" scrolling upward in a glass card, one every 10 frames. */
export const LogStream: React.FC<{at: number; until: number; w?: number; h?: number; max?: number}> = ({at, until, w = 440, h = 250, max = 12}) => {
  const frame = useCurrentFrame();
  const e = enter(frame, at, 16, 30);
  const n = Math.min(max, Math.max(0, Math.floor((Math.min(frame, until) - at) / 10) + 1));
  const rows = Array.from({length: n}, (_, i) => i + 1);
  const offset = (((Math.min(frame, until) - at) % 10) / 10) * 40;
  const fadeOut = 1 - ramp(frame, until, 12, EASE.glide) * 0.5;
  return (
    <div style={{...e, opacity: (e.opacity as number) * fadeOut}}>
      <Glass w={w} h={h} pad={0} radius={26}>
        <div style={{padding: '16px 22px', fontFamily: F.mono, fontSize: 20, color: C.ink3, borderBottom: `1px solid ${C.hair}`, letterSpacing: '0.04em'}}>MONITOR LOG</div>
        <div style={{position: 'relative', height: h - 56, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 22, right: 22, bottom: 14, transform: `translateY(${-0}px)`}}>
            {rows.slice(-5).map((r, i, arr) => {
              const age = arr.length - 1 - i;
              const isNew = r === n;
              const p = isNew ? ramp(frame, at + (r - 1) * 10, 8, EASE.settle) : 1;
              return (
                <div key={r} style={{display: 'flex', alignItems: 'center', gap: 12, height: 40, fontFamily: F.mono, fontSize: 21, color: age === 0 ? C.ink : C.ink2, opacity: (1 - age * 0.16) * p, transform: `translateY(${(1 - p) * 20 + 0 * offset}px)`}}>
                  <svg width={22} height={22} viewBox="0 0 24 24" style={{flex: 'none'}}>
                    <path d="M12 3 L22 20 H2 Z" fill="none" stroke={C.red} strokeWidth={2.2} strokeLinejoin="round" />
                    <line x1={12} y1={10} x2={12} y2={14.5} stroke={C.red} strokeWidth={2.2} strokeLinecap="round" />
                    <circle cx={12} cy={17.2} r={1.2} fill={C.red} />
                  </svg>
                  <span>
                    finding #{r} · flagged
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Glass>
    </div>
  );
};

// ── AlertWire ─────────────────────────────────────────────────
type P = {x: number; y: number};
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return {x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y};
};
const polyD = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/**
 * A wire from the monitor to a person. A dash pulse travels along it; at `brokenAt` the line snaps, both ends recoil (spring), and packets pile up at the break and fade.
 * Coordinates are in the parent's pixels (an absolutely positioned layer the size of its station).
 */
export const AlertWire: React.FC<{from: P; to: P; at: number; brokenAt: number; breakAt?: number; w?: number; h?: number}> = ({from, to, at, brokenAt, breakAt = 0.55, w = 1080, h = 1920}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c1 = {x: from.x + (to.x - from.x) * 0.1 - 90, y: from.y + (to.y - from.y) * 0.35};
  const c2 = {x: from.x + (to.x - from.x) * 0.9 + 90, y: from.y + (to.y - from.y) * 0.65};
  const pt = (t: number) => bez(from, c1, c2, to, t);
  const sample = (t0: number, t1: number, n = 28) => Array.from({length: n + 1}, (_, i) => pt(t0 + ((t1 - t0) * i) / n));
  const draw = ramp(frame, at, 26, EASE.settle);
  const broken = frame >= brokenAt;
  const rec = broken ? springAt(frame, fps, brokenAt, 'pop') : 0;
  const recoil = broken ? Math.min(1, rec) * 26 : 0;
  const bp0 = pt(breakAt);
  // travelling pulse before the break
  const loop = 44;
  const pulseT = ((frame - at) % loop) / loop;
  const pulseA = !broken ? draw : 0;
  const pulsePts = sample(Math.max(0, pulseT * breakAt - 0.06), Math.min(breakAt, pulseT * breakAt), 8);
  const packets = broken ? Array.from({length: Math.min(14, Math.floor((frame - brokenAt) / 5) + 1)}, (_, i) => i) : [];
  const upper = sample(0, breakAt - 0.0, 28);
  const lower = sample(breakAt, 1, 28);
  const sh = (p: P, d: number, sign: number) => ({x: p.x + sign * d * 0.2, y: p.y + sign * d}); // recoil along the wire direction
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {!broken && <path d={polyD(sample(0, 1))} fill="none" stroke={C.ink3} strokeWidth={3} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - draw} strokeLinecap="round" />}
      {!broken && pulseA > 0.2 && <path d={polyD(pulsePts)} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.9} style={{filter: 'drop-shadow(0 0 8px rgba(245,245,247,0.8))'}} />}
      {broken && (
        <>
          <path d={polyD(upper.map((p) => sh(p, -recoil, 1)))} fill="none" stroke={C.ink3} strokeWidth={3} strokeLinecap="round" />
          <path d={polyD(lower.map((p) => sh(p, recoil, 1)))} fill="none" stroke={C.ink3} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 12" opacity={0.7} />
          <circle cx={bp0.x} cy={bp0.y - recoil} r={9 + 14 * (1 - clamp01((frame - brokenAt) / 10))} fill="none" stroke={C.red} strokeWidth={3} opacity={1 - clamp01((frame - brokenAt) / 14)} />
          {packets.map((i) => {
            const born = brokenAt + i * 5;
            const age = frame - born;
            const r1 = random(`pk-x-${i}`), r2 = random(`pk-y-${i}`);
            const px = bp0.x - 20 - r1 * 26 + (i % 3) * 6;
            const py = bp0.y - recoil - 4 - r2 * 22 - (i % 4) * 7;
            const fall = clamp01(age / 12);
            const fade = 1 - clamp01((age - 40) / 24);
            return <rect key={i} x={px - 7} y={py - 7 + (1 - EASE.settle(fall)) * -34} width={14} height={14} rx={3} fill={C.red} opacity={0.85 * fade * ramp(frame, born, 8, EASE.glide)} />;
          })}
        </>
      )}
    </svg>
  );
};

// ── QuoteCard ─────────────────────────────────────────────────
/** Big Instrument Serif italic quote: the words reveal one by one (2 frames apart, enter rise 12), then the attribution in mono. */
export const QuoteCard: React.FC<{at: number; quote: string; attribution: string; size?: number; mark?: string}> = ({at, quote, attribution, size = 64, mark}) => {
  const frame = useCurrentFrame();
  const words = quote.split(' ');
  const last = at + words.length * 2 + 8;
  return (
    <div style={{textAlign: 'center'}}>
      {mark ? <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: size * 1.8, lineHeight: 0.5, color: C.ink3, ...enter(frame, at - 6, 14, 12)}}>{mark}</div> : null}
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, fontSize: size, lineHeight: 1.16, letterSpacing: '-0.005em', color: C.ink}}>
        {words.map((w, i) => (
          <span key={i} style={{display: 'inline-block', marginRight: '0.28em', ...enter(frame, at + i * 2, 12, 12)}}>
            {w}
          </span>
        ))}
      </div>
      <div style={{fontFamily: F.mono, fontSize: 26, color: C.ink3, marginTop: 34, letterSpacing: '0.02em', ...enter(frame, last, 14, 10)}}>{attribution}</div>
    </div>
  );
};

// ── ToolPill ──────────────────────────────────────────────────
/** A glass pill with text only (no logos). Pops in with the `pop` spring. */
export const ToolPill: React.FC<{label: string; at: number; size?: number; color?: string}> = ({label, at, size = 44, color = C.ink}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = springAt(frame, fps, at, 'pop');
  const o = ramp(frame, at, 8, EASE.glide);
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '20px 40px',
        borderRadius: 999,
        background: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), ${C.glass}`,
        border: `1.5px solid ${C.glassEdge}`,
        boxShadow: '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
        backdropFilter: 'blur(24px)',
        fontFamily: F.display,
        fontSize: size,
        fontWeight: 650,
        letterSpacing: '-0.02em',
        color,
        opacity: o,
        transform: `scale(${0.5 + 0.5 * s}) translateY(${(1 - s) * 26}px)`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
};

// ── RuleRow ───────────────────────────────────────────────────
/** Like ListRow, with a slot for a mini illustration on the right. active = full white with a green glow, past = ink2. */
export const RuleRow: React.FC<{n: number; title: string; sub: string; at: number; active: boolean; slotW?: number; children?: React.ReactNode}> = ({n, title, sub, at, active, slotW = 190, children}) => {
  const frame = useCurrentFrame();
  const g = ramp(frame, at, 14, EASE.settle);
  const hot = active ? 1 : 0;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, height: 176, ...enter(frame, at, 16, 30)}}>
      <div
        style={{
          width: 60,
          height: 60,
          flex: 'none',
          borderRadius: 999,
          border: `3px solid ${C.green}`,
          background: `${C.green}1f`,
          display: 'grid',
          placeItems: 'center',
          transform: `scale(${0.6 + 0.4 * g})`,
        }}
      >
        <Draw at={at + 4} dur={14} size={38} color={C.green} stroke={9} paths={ICON.check} />
      </div>
      <div style={{fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: C.amber, width: 34, flex: 'none'}}>{n}</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: F.display, fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: hot ? C.ink : C.ink2, textShadow: hot ? `0 0 34px ${C.green}55` : undefined}}>{title}</div>
        <div style={{fontFamily: F.display, fontSize: 31, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 6, color: hot ? C.ink2 : C.ink3}}>{sub}</div>
      </div>
      <div style={{width: slotW, height: 120, flex: 'none', display: 'grid', placeItems: 'center', position: 'relative'}}>{children}</div>
    </div>
  );
};

// ── Captions with a special word ──────────────────────────────
/** The kit's Captions, plus: the active word `bigWord` is drawn 1.15x (S6: "Nahi"). */
export const AgentCaptions: React.FC<{tl: TL; arcAt: (frame: number) => number; hideIn?: string[]; bigWord?: string}> = ({tl, arcAt, hideIn = [], bigWord}) => {
  const frame = useCurrentFrame();
  const lines: (typeof tl.words)[] = [];
  let cur: typeof tl.words = [];
  for (const w of tl.words) {
    cur.push(w);
    if (cur.length >= 3 || /[.,?!…]$/.test(w.w)) {
      lines.push(cur);
      cur = [];
    }
  }
  if (cur.length) lines.push(cur);
  const line = lines.find((l) => frame >= l[0].from - 4 && frame < l[l.length - 1].to + 10);
  if (!line || hideIn.includes(line[0].seg)) return null;
  const lineIn = ramp(frame, line[0].from - 4, 8, EASE.glide);
  const col = arcColor(arcAt(frame));
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 20, textAlign: 'center', fontFamily: F.display, fontSize: 58, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, opacity: lineIn, transform: `translateY(${(1 - lineIn) * 12}px)`}}>
      {line.map((w, i) => {
        const on = frame >= w.from && frame < w.to + 6;
        const said = frame >= w.from;
        const big = on && bigWord && w.w.toLowerCase().replace(/[^a-z]/g, '') === bigWord.toLowerCase();
        return (
          <span key={i} style={{color: on ? col : said ? C.ink : C.ink3, textShadow: on ? `0 0 26px ${col}88` : '0 4px 20px rgba(0,0,0,0.8)', marginRight: 16, display: 'inline-block', transform: `scale(${big ? 1.15 : on ? 1.06 : 1})`}}>
            {w.w.replace(/\.\.\.$/, '…')}
          </span>
        );
      })}
    </div>
  );
};

// ── Backdrop whose grid can hold still (S6 tension) ───────────
export const AgentBackdrop: React.FC<{arc: number; shots: Shot[]; freeze?: {from: number; to: number}}> = ({arc, shots, freeze}) => {
  const frame = useCurrentFrame();
  const live = useCam();
  let cam: CamState = live;
  if (freeze) {
    const k = ramp(frame, freeze.from, 20, EASE.glide) * (1 - ramp(frame, freeze.to, 12, EASE.glide));
    if (k > 0) {
      const fz = cameraAt(shots, freeze.from, false);
      cam = {...live, x: live.x + (fz.x - live.x) * k, y: live.y + (fz.y - live.y) * k, zoom: live.zoom + (fz.zoom - live.zoom) * k};
    }
  }
  const gx = (-cam.x * cam.zoom * 0.35) % 60;
  const gy = (-cam.y * cam.zoom * 0.35) % 60;
  const col = arcColor(arc);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(245,245,247,0.09) 1.4px, transparent 1.6px)', backgroundSize: '60px 60px', backgroundPosition: `${gx}px ${gy}px`, opacity: 0.8}} />
      <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 46%, ${col}1a, transparent 70%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.85))'}} />
    </AbsoluteFill>
  );
};

/** A screen-space dim (S6): black at `amount` alpha, ramped in over 20 frames at `from` and out over 12 at `to`. */
export const Dim: React.FC<{from: number; to: number; amount?: number}> = ({from, to, amount = 0.2}) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, from, 20, EASE.glide) * (1 - ramp(frame, to, 12, EASE.glide));
  if (k <= 0.001) return null;
  return <AbsoluteFill style={{background: '#000', opacity: amount * k, pointerEvents: 'none'}} />;
};

export {T};
