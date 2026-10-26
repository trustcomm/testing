// Reusable building blocks. Every reel uses these; only content changes.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, T, SAFE, arcColor} from '../core/tokens';
import {EASE, enter, ramp, springAt} from '../core/motion';
import {useCam} from '../core/camera';
import type {TL} from '../core/timeline';

// ── Glass panel ────────────────────────────────────────────────
export const Glass: React.FC<{
  w: number;
  h?: number;
  pad?: number;
  radius?: number;
  tint?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({w, h, pad = 48, radius = 44, tint, style, children}) => (
  <div
    style={{
      width: w,
      height: h,
      padding: pad,
      boxSizing: 'border-box',
      borderRadius: radius,
      background: `linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), ${C.glass}`,
      border: `1.5px solid ${tint ?? C.glassEdge}`,
      boxShadow: `0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)${tint ? `, 0 0 80px ${tint}33` : ''}`,
      backdropFilter: 'blur(30px)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Entrance wrapper (fade + rise + de-blur) ──────────────────
export const In: React.FC<{at: number; dur?: number; rise?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  at,
  dur = 18,
  rise = 40,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  return <div style={{...enter(frame, at, dur, rise), ...style}}>{children}</div>;
};

// ── Pop wrapper (spring scale for chips/hits) ──────────────────
export const Pop: React.FC<{at: number; from?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  at,
  from = 0.6,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = springAt(frame, fps, at, 'pop');
  const o = ramp(frame, at, 8, EASE.glide);
  return (
    <div style={{transform: `scale(${from + (1 - from) * s})`, opacity: o, ...style}}>{children}</div>
  );
};

// ── Line-art drawing: strokes draw on with progress 0→1 ────────
export const Draw: React.FC<{
  at: number;
  dur?: number;
  size: number;
  vb?: number;
  color?: string;
  stroke?: number;
  paths: string[];
  fill?: string;
}> = ({at, dur = 36, size, vb = 100, color = C.ink, stroke = 2.4, paths, fill}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} style={{overflow: 'visible'}}>
      {paths.map((d, i) => {
        const p = ramp(frame, at + i * 5, dur, EASE.settle);
        return (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill={fill && p > 0.98 ? fill : 'none'}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
            opacity={p > 0 ? 1 : 0}
          />
        );
      })}
    </svg>
  );
};

// Icon paths (100×100 viewBox, line art).
export const ICON = {
  file: ['M28 12 H60 L76 28 V88 H28 Z', 'M60 12 V28 H76', 'M38 46 H66', 'M38 58 H66', 'M38 70 H56'],
  sheet: ['M18 20 H82 V80 H18 Z', 'M18 36 H82', 'M18 52 H82', 'M18 66 H82', 'M40 20 V80', 'M61 20 V80'],
  hospital: [
    'M14 88 H86',
    'M22 88 V34 H78 V88',
    'M38 34 V18 H62 V34',
    'M50 21 V31 M45 26 H55',
    'M32 46 H42 M58 46 H68 M32 60 H42 M58 60 H68',
    'M44 88 V72 H56 V88',
  ],
  person: ['M50 18 A13 13 0 1 1 49.9 18 Z', 'M24 86 C24 62 36 54 50 54 C64 54 76 62 76 86'],
  envelope: ['M14 28 H86 V76 H14 Z', 'M14 28 L50 56 L86 28'],
  chat: ['M14 20 H86 V66 H44 L28 80 V66 H14 Z', 'M28 36 H72', 'M28 50 H58'],
  lock: ['M28 46 H72 V86 H28 Z', 'M36 46 V32 A14 14 0 0 1 64 32 V46', 'M50 60 V72'],
  laptop: ['M22 24 H78 V66 H22 Z', 'M10 76 H90 L84 84 H16 Z'],
  check: ['M24 52 L42 70 L76 32'],
  cross: ['M30 30 L70 70', 'M70 30 L30 70'],
  shield: ['M50 12 L82 24 V48 C82 70 66 82 50 90 C34 82 18 70 18 48 V24 Z', 'M36 50 L46 60 L66 40'],
  comment: ['M16 22 H84 V68 H48 L30 84 V68 H16 Z'],
  share: ['M20 50 L82 20 L66 84 L50 58 Z', 'M50 58 L82 20'],
};

// ── Number counter (amber numerals, rolls with settle easing) ──
export const Counter: React.FC<{
  from: number;
  to: number;
  at: number;
  dur: number;
  size?: number;
  color?: string;
}> = ({from, to, at, dur, size = 260, color = C.amber}) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, at, dur, EASE.settle);
  const v = Math.round(interpolate(k, [0, 1], [from, to]));
  const str = v.toLocaleString('en-US');
  const glow = ramp(frame, at + dur - 6, 20, EASE.glide);
  return (
    <div
      style={{
        fontFamily: F.display,
        ...T.hero,
        fontSize: size,
        color,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 ${40 + glow * 60}px ${color}${glow > 0 ? '66' : '22'}`,
      }}
    >
      {str}
    </div>
  );
};

// ── Chip (pill with dot) ──────────────────────────────────────
export const Chip: React.FC<{label: string; at: number; color?: string; alarm?: number}> = ({
  label,
  at,
  color = C.ink,
  alarm = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = springAt(frame, fps, at, 'pop');
  const o = ramp(frame, at, 8, EASE.glide);
  const edge = alarm > 0 ? C.red : C.glassEdge;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 18,
        padding: '22px 34px',
        borderRadius: 999,
        background: alarm > 0 ? `rgba(255,59,48,${0.12 * alarm})` : C.glass,
        border: `2px solid ${edge}`,
        boxShadow: alarm > 0 ? `0 0 ${50 * alarm}px rgba(255,59,48,${0.45 * alarm})` : '0 20px 60px rgba(0,0,0,0.5)',
        fontFamily: F.display,
        ...T.body,
        fontWeight: 600,
        color,
        opacity: o,
        transform: `scale(${0.55 + 0.45 * s}) translateY(${(1 - s) * 30}px)`,
      }}
    >
      <span style={{width: 16, height: 16, borderRadius: 99, background: alarm > 0 ? C.red : C.ink2}} />
      {label}
    </div>
  );
};

// ── Mark (drawn ✓ / ✕ in a circle, no emoji fonts needed) ─────
export const Mark: React.FC<{kind: 'check' | 'cross'; at: number; size?: number}> = ({kind, at, size = 64}) => {
  const frame = useCurrentFrame();
  const col = kind === 'check' ? C.green : C.red;
  const ring = ramp(frame, at, 14, EASE.settle);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: `3px solid ${col}`,
        display: 'grid',
        placeItems: 'center',
        transform: `scale(${0.6 + 0.4 * ring})`,
        opacity: ring,
        background: `${col}1f`,
        flex: 'none',
      }}
    >
      <Draw at={at + 4} dur={14} size={size * 0.62} color={col} stroke={9} paths={ICON[kind]} />
    </div>
  );
};

// ── Numbered list row (screenshot-able list) ──────────────────
export const ListRow: React.FC<{n: number; text: string; at: number; kind: 'check' | 'cross'; active?: boolean}> = ({
  n,
  text,
  at,
  kind,
  active,
}) => {
  const frame = useCurrentFrame();
  const col = kind === 'check' ? C.green : C.red;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 30, ...enter(frame, at, 16, 30)}}>
      <Mark kind={kind} at={at + 2} />
      <div style={{fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: C.amber, width: 44}}>{n}</div>
      <div
        style={{
          fontFamily: F.display,
          ...T.body,
          fontSize: 48,
          fontWeight: 600,
          color: active ? C.ink : C.ink2,
          textShadow: active ? `0 0 30px ${col}44` : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ── Kicker (small label above headlines) ──────────────────────
export const Kicker: React.FC<{text: string; color?: string}> = ({text, color = C.ink2}) => (
  <div style={{fontFamily: F.display, ...T.label, color, textTransform: 'uppercase'}}>{text}</div>
);

// ── Headline with an Instrument Serif italic accent word ──────
export const Headline: React.FC<{pre?: string; accent?: string; post?: string; size?: number; accentColor?: string}> = ({
  pre,
  accent,
  post,
  size = 96,
  accentColor = C.ink,
}) => (
  <div style={{fontFamily: F.display, ...T.h1, fontSize: size, color: C.ink}}>
    {pre}
    {accent ? (
      <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.01em', color: accentColor}}>
        {' '}
        {accent}{' '}
      </span>
    ) : null}
    {post}
  </div>
);

// ── Backdrop: deep black, faint dot grid with parallax, vignette ─
export const Backdrop: React.FC<{arc: number}> = ({arc}) => {
  const cam = useCam();
  const gx = (-cam.x * cam.zoom * 0.35) % 60;
  const gy = (-cam.y * cam.zoom * 0.35) % 60;
  const col = arcColor(arc);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(245,245,247,0.09) 1.4px, transparent 1.6px)',
          backgroundSize: '60px 60px',
          backgroundPosition: `${gx}px ${gy}px`,
          opacity: 0.8,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 46%, ${col}1a, transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.85))'}} />
    </AbsoluteFill>
  );
};

// ── Hit flash (screen-space bloom ring on impact cues) ────────
export const HitFlash: React.FC<{frames: number[]; color?: string}> = ({frames, color = C.ink}) => {
  const frame = useCurrentFrame();
  let a = 0;
  let r = 0;
  for (const f of frames) {
    const d = frame - f;
    if (d >= 0 && d < 24) {
      const k = d / 24;
      a = Math.max(a, (1 - EASE.settle(k)) * 0.22);
      r = 20 + EASE.settle(k) * 80;
    }
  }
  if (a <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 45%, ${color} 0%, transparent ${r}%)`,
        opacity: a,
        mixBlendMode: 'screen',
      }}
    />
  );
};

// ── Word-level captions (active word coloured along the story arc) ─
export const Captions: React.FC<{tl: TL; arcAt: (frame: number) => number; hideIn?: string[]}> = ({
  tl,
  arcAt,
  hideIn = [],
}) => {
  const frame = useCurrentFrame();
  // Group words into short lines of ≤ 3 words, split on punctuation.
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
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        right: SAFE.side,
        bottom: SAFE.bottom + 20,
        textAlign: 'center',
        fontFamily: F.display,
        fontSize: 58,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        opacity: lineIn,
        transform: `translateY(${(1 - lineIn) * 12}px)`,
      }}
    >
      {line.map((w, i) => {
        const on = frame >= w.from && frame < w.to + 6;
        const said = frame >= w.from;
        return (
          <span
            key={i}
            style={{
              color: on ? col : said ? C.ink : C.ink3,
              textShadow: on ? `0 0 26px ${col}88` : '0 4px 20px rgba(0,0,0,0.8)',
              marginRight: 16,
              display: 'inline-block',
              transform: `scale(${on ? 1.06 : 1})`,
            }}
          >
            {w.w.replace(/\.\.\.$/, '…')}
          </span>
        );
      })}
    </div>
  );
};

// ── Source line (small, credible) ─────────────────────────────
export const SourceLine: React.FC<{text: string; show: boolean}> = ({text, show}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        right: SAFE.side,
        top: SAFE.top - 10,
        textAlign: 'center',
        fontFamily: F.mono,
        fontSize: 22,
        color: C.ink3,
        letterSpacing: '0.02em',
        opacity: show ? 1 : 0,
      }}
    >
      {text}
    </div>
  );
};

// ── Progress rail (thin bar at top; red → green across the reel) ─
export const ProgressRail: React.FC<{total: number; arcAt: (f: number) => number}> = ({total, arcAt}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, height: 6, width: `${(frame / total) * 100}%`, background: arcColor(arcAt(frame)), opacity: 0.8}} />
  );
};
