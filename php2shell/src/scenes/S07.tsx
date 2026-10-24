import React from "react";
import { C } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, Pop, clamp01, easeInOutCubic, easeOutCubic, lerp, rand, springAt } from "../motion";
import { Pill } from "../components/pill";
import { KWord } from "../components/kinetic";
import { Canvas } from "../components/draw";
import { toScreen } from "../components/b-geom";
import { BUS_Y, BWorld, Envelope, RX, camAt, envXf } from "../components/b-world";
import { HALL } from "../components/rack";

const c = CUES.S7.cue;

/** an arrow for the mapping pills (the mono "→" glyph is tiny): 3 px stroke like the rest of the line art */
const Arrow: React.FC = () => (
  <svg width="38" height="18" viewBox="0 0 38 18" style={{ margin: "0 -2px", flex: "none" }}>
    <path d="M3 9H33M25 2L33 9L25 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** where the leaking envelope is (x on the request line): rack 2, then along the line to the middle */
const e2x = (f: number) => lerp(RX[1], 540, easeInOutCubic((f - c.leave) / (c.arrive - c.leave)));

// the red leftover bits in rack 2's memory slot (slot 3 of 6): two rows of small squares above and below the LED / vent line
const SLOT_Y = HALL.top + HALL.h / 6 * 2;
const BITS = Array.from({ length: 10 }, (_, i) => ({ x: RX[1] - 34 + (i % 5) * 17, y: SLOT_Y + (i < 5 ? 24 : 76), d: i }));

const Bits: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  return (
    <Canvas>
      {BITS.map((b, i) => {
        const born = springAt(f, c.leftover + i * 2), pulse = f >= c.kwData && f < c.kwData + 12 ? 1 + 0.25 * Math.sin((Math.PI * (f - c.kwData)) / 12) : 1;
        if (born <= 0) return null;
        // "agle": the bits rise out of the rack into the request envelope above it (they chase it once it leaves)
        const u = easeInOutCubic((f - c.leak - i * 1.2) / 16);
        const [tx, ty] = [e2x(f), BUS_Y - 14];
        const x = lerp(b.x, tx, u), y = lerp(b.y, ty, u), s = (1 - clamp01((u - 0.8) / 0.2)) * born * pulse;
        if (s <= 0.02) return null;
        const [X, Y] = toScreen(cam, x, y), z = 6.5 * s * cam.s;
        return <rect key={i} x={X - z / 2} y={Y - z / 2} width={z} height={z} rx={1} fill={C.alarm} opacity={0.95 * (1 - clamp01((f - c.fadeOut) / c.fadeFrames))} style={{ filter: "drop-shadow(0 0 4px rgba(255,59,48,0.8))" }} />;
      })}
    </Canvas>
  );
};

/** the faint red trail of leaked bits behind the envelope while it travels along the request line */
const Trail: React.FC<{ f: number }> = ({ f }) => {
  if (f < c.leave || f > c.arrive + 30) return null;
  const cam = camAt(f), N = 22;
  return (
    <Canvas>
      {Array.from({ length: N }, (_, j) => {
        const born = f - 2 * j;
        if (born < c.leave) return null;
        const x = e2x(born) - 10 - j * 2, y = BUS_Y - 16 + (rand(j, 4) - 0.5) * (8 + j * 1.4) - (f - born) * 0.14, fade = (1 - j / N) * clamp01(1 - (f - c.arrive - 4) / 22) * (1 - clamp01((f - c.fadeOut) / c.fadeFrames));
        if (fade <= 0.01) return null;
        const [X, Y] = toScreen(cam, x, y), z = (4.5 + rand(j, 6) * 4) * cam.s, rot = rand(j, 7) * 90;
        return <rect key={j} x={-z / 2} y={-z / 2} width={z} height={z} fill={C.alarm} opacity={0.85 * fade} style={{ filter: "drop-shadow(0 0 4px rgba(255,59,48,0.7))" }} transform={`translate(${X} ${Y}) rotate(${rot})`} />;
      })}
    </Canvas>
  );
};

/** a thin red ring that leaves the envelope on every chip: the "burst" */
const BurstRing: React.FC<{ at: number; x: number; y: number; alive: number }> = ({ at, x, y, alive }) => {
  const f = useFrame(), a = (f - at) / 14;
  if (a < 0 || a >= 1) return null;
  const e = easeOutCubic(a);
  return <Canvas><circle cx={x} cy={y} r={lerp(14, 84, e)} fill="none" stroke={C.alarm} strokeWidth={3} opacity={0.75 * (1 - a) * alive} /></Canvas>;
};

/** a red mono chip bursting out of the envelope, with a tiny glitch flicker on landing */
const Chip: React.FC<{ label: string; at: number; from: [number, number]; to: [number, number]; seed: number; alive: number }> = ({ label, at, from, to, seed, alive }) => {
  const f = useFrame(), age = f - at;
  if (age < 0) return null;
  const e = easeOutCubic(age / 12), s = springAt(f, at), x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e);
  const glitch = age < 10 && rand(age, seed) > 0.28, dx = (rand(age, seed + 9) - 0.5) * 22, sc = 0.35 + 0.65 * s;
  const chip = <Pill tone="danger" size={32} style={{ background: "rgba(255,59,48,0.12)", boxShadow: "0 0 26px rgba(255,59,48,0.35)", fontWeight: 700 }}>{label}</Pill>;
  return (
    <At x={x} y={y} style={{ opacity: clamp01(0.55 + age / 3) * alive, transform: `translate(-50%, -50%) scale(${sc})` }}>
      {glitch ? (
        <div style={{ position: "relative" }}>
          <div style={{ clipPath: "inset(0 0 52% 0)", transform: `translateX(${dx}px)` }}>{chip}</div>
          <div style={{ position: "absolute", left: 0, top: 0, clipPath: "inset(48% 0 0 0)", transform: `translateX(${-dx * 0.8}px)`, opacity: 0.9 }}>{chip}</div>
        </div>
      ) : chip}
    </At>
  );
};

/**
 * S7 "PHP server bhi kuch aisa hi karta hai. Har request ek tiffin hai. Aur yeh bug, pichhli request ka bacha hua data... agle ke haath mein de sakta hai. Password. Token. API keys."
 * MATCH CUT (b-world.tsx): the houses grow into the six racks, the arcs flatten into the request line, the tiffins turn into envelopes. This file adds the two mapping
 * pills, the red leftover bits in rack 2's memory, the envelope that leaves carrying a red trail, and the three red chips. At the end only the six racks are left.
 */
export const S7: React.FC = () => {
  const f = useFrame(), cam = camAt(f), alive = 1 - clamp01((f - c.fadeOut) / c.fadeFrames);
  const env = envXf(cam, e2x(f), BUS_Y);
  const [ex, ey] = toScreen(cam, e2x(f), BUS_Y - 14);
  return (
    <>
      <BWorld />
      {/* the leaking envelope (rack 2's request) takes over from the world's copy when the bits lift off */}
      {f >= c.leak && alive > 0 && <Canvas><Envelope xf={env} opacity={alive} glow="rgba(255,59,48,0.9)" /></Canvas>}
      <Bits f={f} />
      <Trail f={f} />
      {/* the mapping pills, stacked below the racks */}
      <At x={540} y={1165}><Pop at={c.pill1} out={c.fadeOut}><Pill size={30}><KWord at={c.kwTiffin}>TIFFIN</KWord><Arrow /><KWord at={c.pill1}>REQUEST</KWord></Pill></Pop></At>
      <At x={540} y={1245}><Pop at={c.pill2} out={c.fadeOut}><Pill size={30}><KWord at={c.pill2}>BACHA</KWord><KWord at={c.kwHua}>HUA</KWord><KWord at={c.kwData} underline="danger">DATA</KWord><Arrow /><span>MEMORY</span></Pill></Pop></At>
      {/* PASSWORD, TOKEN, API KEY burst out of the envelope, each exactly on its word */}
      {[c.chip1, c.chip2, c.chip3].map((at) => <BurstRing key={at} at={at} x={ex} y={ey} alive={alive} />)}
      <Chip label="PASSWORD" at={c.chip1} from={[ex, ey]} to={[320, 372]} seed={1} alive={alive} />
      <Chip label="TOKEN" at={c.chip2} from={[ex, ey]} to={[540, 340]} seed={2} alive={alive} />
      <Chip label="API KEY" at={c.chip3} from={[ex, ey]} to={[760, 372]} seed={3} alive={alive} />
    </>
  );
};
