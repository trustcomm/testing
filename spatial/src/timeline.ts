// SPATIAL: the single source of truth. Every scene, every sound object, every sound event and every Lottie placement of the piece is
// defined here, once. The picture (Remotion) imports this file; the audio engine (audio/build_mix.py) reads the JSON that
// scripts/export_timeline.ts writes from it. Move a number here and picture and sound move together.
//
// Frames are 60 fps (frame = seconds x 60; the piece is 2880 frames = 48.000 s).
// Positions live in "listener space": the head is at the origin, +x right, +y up, -z in front, metres.
import { ease, EaseName, smoothstep } from "./easing";

export const FPS = 60;
export const DURATION = 2880;
export const BPM = 96;
export const BEAT = 60 / BPM;                 // 0.625 s
export const GRID0 = 0.125;                   // beat-grid anchor (s): puts 22.00 s, where the rain is cut, exactly on a beat
export const fr = (s: number) => Math.round(s * FPS);
/** time (s) of the i-th 1/sub beat on the grid */
export const gridT = (i: number, sub = 1) => GRID0 + (i * BEAT) / sub;
/** index of a time on the 1/sub-beat grid (fractional if it is off the grid) */
export const gridIndex = (s: number, sub = 1) => ((s - GRID0) * sub) / BEAT;

export type Vec3 = [number, number, number];
export type SceneId = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";
export interface Scene { id: SceneId; name: string; start: number; end: number }

const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
/** azimuth (0 = front, +90 = right), elevation, distance -> listener-space position */
export const sph = (az: number, el: number, r: number): Vec3 => [r * Math.cos(rad(el)) * Math.sin(rad(az)), r * Math.sin(rad(el)), -r * Math.cos(rad(el)) * Math.cos(rad(az))];
export const toSph = (p: Vec3) => { const r = Math.hypot(...p); return { az: deg(Math.atan2(p[0], -p[2])), el: r ? deg(Math.asin(p[1] / r)) : 0, r }; };
const lerp3 = (a: Vec3, b: Vec3, u: number): Vec3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

export interface Key { f: number; p: Vec3; e?: EaseName }   // e eases the segment that starts at this key
const keysAt = (keys: Key[], f: number): Vec3 => {
  if (f <= keys[0].f) return keys[0].p;
  for (let i = 0; i < keys.length - 1; i++) if (f < keys[i + 1].f) return lerp3(keys[i].p, keys[i + 1].p, ease(keys[i].e, (f - keys[i].f) / (keys[i + 1].f - keys[i].f)));
  return keys[keys.length - 1].p;
};

// ----------------------------------------------------------------------------------------------------------------- scenes
export const SCENES: Scene[] = [
  { id: "S0", name: "HEADPHONES ON", start: fr(0), end: fr(3) },
  { id: "S1", name: "THE DROP", start: fr(3), end: fr(8) },
  { id: "S2", name: "THE OBJECT", start: fr(8), end: fr(16) },
  { id: "S3", name: "ABOVE", start: fr(16), end: fr(22) },
  { id: "S4", name: "ALIVE", start: fr(22), end: fr(29) },
  { id: "S5", name: "PRECISION", start: fr(29), end: fr(36) },
  { id: "S6", name: "CONVERGE", start: fr(36), end: fr(41.5) },
  { id: "S7", name: "TITLE", start: fr(41.5), end: fr(48) },
];
export const sceneOf = (f: number): SceneId => (SCENES.find((s) => f >= s.start && f < s.end) ?? SCENES[SCENES.length - 1]).id;

// ----------------------------------------------------------------------------------------------------------------- the S2 orbit
// Two full orbits of the head at 1.6 m, the second 1.5x faster, with a smooth speed change between them. The angular speed profile is
// integrated numerically; (omega1, length of the slow cruise) are solved so the object is at 360 deg in the middle of the speed change and
// at exactly 720 deg when it stops.
const ORBIT = { start: 552, length: 384, rampIn: 30, change: 30, rampOut: 36, ratio: 1.5, radius: 1.6, breathe: 0.1 };
const orbitSolve = () => {
  const { length: L, rampIn: a, change: m, rampOut: o, ratio: rho } = ORBIT, STEP = 0.25;
  const profile = (Ta: number) => {
    const Tb = L - a - Ta - m - o;
    return (u: number) => u < a ? smoothstep(u / a) : u < a + Ta ? 1 : u < a + Ta + m ? 1 + (rho - 1) * smoothstep((u - a - Ta) / m) : u < a + Ta + m + Tb ? rho : rho * (1 - smoothstep((u - a - Ta - m - Tb) / o));
  };
  const integrate = (Ta: number) => { const w = profile(Ta); const th = new Float64Array(Math.round(L / STEP) + 1); for (let i = 1; i < th.length; i++) th[i] = th[i - 1] + 0.5 * (w((i - 1) * STEP) + w(i * STEP)) * STEP; return th; };
  let lo = 0, hi = L - a - m - o;
  for (let i = 0; i < 60; i++) {
    const Ta = (lo + hi) / 2, th = integrate(Ta), centre = th[Math.round((a + Ta + m / 2) / STEP)];
    if (centre / th[th.length - 1] > 0.5) hi = Ta; else lo = Ta;   // too much angle before the change: shorten the slow cruise
  }
  const Ta = (lo + hi) / 2, th = integrate(Ta), k = 720 / th[th.length - 1];
  return { Ta, omega1: k, centre: ORBIT.start + a + Ta + m / 2, theta: (f: number) => { const u = Math.min(L, Math.max(0, f - ORBIT.start)) / STEP, i = Math.min(th.length - 2, Math.floor(u)); return k * (th[i] + (th[i + 1] - th[i]) * (u - i)); } };
};
export const ORB = orbitSolve();
export const orbTheta = ORB.theta;                                           // degrees, 0 -> 720
/** the orbit radius breathes +-0.10 m (twice per orbit): a circle about the head has no radial speed, so without it there is no Doppler to hear */
const orbRadius = (th: number) => ORBIT.radius + ORBIT.breathe * Math.sin(rad(2 * th));
const ORB_FRONT = sph(0, 0, ORBIT.radius);
const ORB_TOP = sph(0, 60, ORBIT.radius);
const SPLASH: Vec3 = [0, -1.4, -3.0];                                       // where the drop lands on the floor plane
const orbPos = (f: number): Vec3 => {
  if (f < 480) return SPLASH;
  if (f < 540) return keysAt([{ f: 480, p: SPLASH, e: "settle" }, { f: 540, p: ORB_FRONT }], f);
  if (f < ORBIT.start + ORBIT.length) { if (f < ORBIT.start) return ORB_FRONT; const th = orbTheta(f); return sph(th % 360, 0, orbRadius(th)); }
  if (f < 972) return ORB_FRONT;
  if (f < 1068) return sph(0, 60 * ease("settle", (f - 972) / 96), ORBIT.radius);
  return ORB_TOP;
};

// ----------------------------------------------------------------------------------------------------------------- sound objects
export interface SoundObject {
  id: string; kind: "point" | "diffuse" | "bed"; scene: SceneId; start: number; end: number; note: string;
  pos?: (f: number) => Vec3; sources?: Vec3[]; dopplerScale?: number; width?: (f: number) => number;
}
const stat = (p: Vec3) => () => p;
const GRID_R = 3.0;
/** the S5 grid: 16 columns (azimuth, 22.5 deg apart) x 8 rows (elevation, 15 deg apart) on a 3 m shell round the head */
export const GRID: Vec3[] = Array.from({ length: 128 }, (_, i) => sph(-168.75 + 22.5 * (i % 16), -52.5 + 15 * Math.floor(i / 16), GRID_R));
const DOME: Vec3[] = Array.from({ length: 12 }, (_, i) => sph(-165 + 30 * i, 38 + 28 * ((i * 5) % 3) / 2, 6));   // the rain's dome of sources
const BIRDS = {
  A: { start: 1380, end: 1590, rate: 1.0, keys: [{ f: 1380, p: [-6, 0.8, -3.6] as Vec3 }, { f: 1590, p: [6, 1.2, -3.6] as Vec3 }] },
  B: { start: 1440, end: 1680, rate: 0.75, keys: [{ f: 1440, p: [10, 2.4, -15] as Vec3 }, { f: 1680, p: [-10, 2.8, -15] as Vec3 }] },
  C: { start: 1500, end: 1620, rate: 1.25, keys: [{ f: 1500, p: [2.4, 1.5, 6.0] as Vec3 }, { f: 1560, p: [0.2, 2.8, 0.0] as Vec3 }, { f: 1620, p: [-2.2, 3.4, -9.0] as Vec3 }] },
};
const LEAF = { start: 1500, end: 1728 };
const leafPos = (f: number): Vec3 => { const t = f - LEAF.start, u = t / (LEAF.end - LEAF.start); return [0.35 * Math.cos((2 * Math.PI * t) / 60), 1.2 - 2.2 * u, -2.5 + 0.25 * Math.sin((2 * Math.PI * t) / 60)]; };
const RISER = { start: 2160, end: 2454 };
const riserPos = (f: number): Vec3 => {
  const u = (f - RISER.start) / (RISER.end - RISER.start), T = (RISER.end - RISER.start) / FPS, k = 3.0 / 0.4;
  const revs = (T * 0.4 * (Math.pow(k, u) - 1)) / Math.log(k);           // the rotation speed ramps 0.4 -> 3.0 rev/s exponentially; this is its integral
  return sph((360 * revs) % 360, 20 * Math.sin(2 * Math.PI * u * 1.5), 3.0 - 1.9 * smoothstep(u));
};
const RING_BIRTH = [262, 272, 284, 298, 314], RING_LIFE = 150;   // the first ring waits 10 frames after the plink: the hold after a big hit

export const OBJECTS: SoundObject[] = [
  { id: "room", kind: "diffuse", scene: "S0", start: 0, end: 480, note: "room tone, -50 dB, fades out as the object is born" },
  { id: "air", kind: "diffuse", scene: "S0", start: 138, end: 180, note: "breath-like air swell" },
  { id: "headphones", kind: "point", scene: "S0", start: 72, end: 90, note: "the centre tick", pos: stat([0, 0, -1.0]) },
  { id: "drop", kind: "point", scene: "S1", start: 204, end: 252, note: "falls from the top centre to the floor; gravity ease", pos: (f) => keysAt([{ f: 204, p: [0, 2.2, -3.0], e: "fall" }, { f: 252, p: SPLASH }], f) },
  { id: "splash", kind: "point", scene: "S1", start: 252, end: 480, note: "plink and ripple pings at the landing point", pos: stat(SPLASH) },
  ...RING_BIRTH.map((b, k): SoundObject => ({ id: `ring${k}`, kind: "point", scene: "S1", start: b, end: b + RING_LIFE, note: "ripple ring: stereo width = ring radius / max radius", pos: stat(SPLASH), width: (f) => Math.min(1, Math.max(0, (f - b) / RING_LIFE)) })),
  { id: "orb", kind: "point", scene: "S2", start: 480, end: 1344, note: "the sound object: born at the splash, orbits the head twice (1.6 m, second orbit 1.5x faster), rises to EL +60 deg", pos: orbPos, dopplerScale: 5 },
  { id: "rain", kind: "bed", scene: "S3", start: 1020, end: 1320, note: "rain bed: a dome of 12 sources above and around", sources: DOME },
  { id: "rumble", kind: "point", scene: "S3", start: 1110, end: 1290, note: "slow overhead rumble drifting across the sky", pos: (f) => keysAt([{ f: 1110, p: [-2, 6, -3], e: "breathe" }, { f: 1290, p: [2, 6, -3] }], f) },
  { id: "birdA", kind: "point", scene: "S4", start: BIRDS.A.start, end: BIRDS.A.end, note: "near bird, left to right", pos: (f) => keysAt(BIRDS.A.keys, f) },
  { id: "birdB", kind: "point", scene: "S4", start: BIRDS.B.start, end: BIRDS.B.end, note: "far bird, right to left", pos: (f) => keysAt(BIRDS.B.keys, f) },
  { id: "birdC", kind: "point", scene: "S4", start: BIRDS.C.start, end: BIRDS.C.end, note: "diagonal bird, back to front over the camera at 26.0 s", pos: (f) => keysAt(BIRDS.C.keys, f), dopplerScale: 1 },
  { id: "leaf", kind: "point", scene: "S4", start: LEAF.start, end: LEAF.end, note: "the leaf spirals down the centre; every flip is a rustle", pos: leafPos },
  { id: "grid", kind: "diffuse", scene: "S5", start: 1740, end: 2160, note: "128 points, 16 x 8, on a 3 m shell", sources: GRID },
  { id: "riser", kind: "point", scene: "S6", start: RISER.start, end: RISER.end, note: "riser rotating round the head, speeding up and tightening", pos: riserPos },
  { id: "impact", kind: "point", scene: "S6", start: 2472, end: 2880, note: "breath and impact at the centre", pos: stat([0, 0, -0.5]) },
  { id: "title", kind: "point", scene: "S7", start: 2538, end: 2880, note: "title tones, centred (the same mix serves the 9:16 and 16:9 layouts)", pos: stat([0, 0, -2.0]) },
];
const OBJ = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));
const posOf = (id: string, f: number): Vec3 => { const o = OBJ[id]; return o.pos ? o.pos(f) : [0, 0, -1]; };

// ----------------------------------------------------------------------------------------------------------------- sound events
export interface SfxEvent {
  id: string; scene: SceneId; frame: number; t: number;            // t: exact seconds (frame may be the rounded frame of a fractional-frame beat)
  audible: boolean; transient: boolean;                            // transient: the QA detects its onset and compares it with `frame`
  kind: string; label: string; object: string; pos: Vec3; gainDb: number; dur: number;
  visual: string; marker?: { lottie: string; name: string; src: number }; params?: Record<string, number | string>; group?: string;
}
const EV: SfxEvent[] = [];
const sec = (f: number) => f / FPS;
const add = (e: Partial<SfxEvent> & { id: string; frame?: number; t?: number; kind: string; label: string; visual: string }) => {
  const t = e.t ?? sec(e.frame as number), frame = e.frame ?? fr(t);
  const obj = e.object ?? "none";
  const ev: SfxEvent = { scene: sceneOf(frame), audible: true, transient: false, object: obj, pos: e.pos ?? (obj !== "none" ? posOf(obj, t * FPS) : [0, 0, -1]), gainDb: 0, dur: 0.3, ...e, frame, t } as SfxEvent;
  ev.pos = ev.pos.map((x) => Math.round(x * 1e4) / 1e4) as Vec3;
  EV.push(ev);
  return ev;
};
const seeded = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// S0 HEADPHONES ON
add({ id: "s0.room", frame: 0, kind: "room_tone", label: "room tone, -50 dB", object: "room", gainDb: -50, dur: 8, visual: "pure black" });
add({ id: "s0.draw", frame: 30, kind: "visual", audible: false, label: "headphones line starts to draw (1 px, ice white)", visual: "headphones Lottie, rate 60/42 so its `drawn` marker lands on the tick", marker: { lottie: "headphones", name: "start", src: 0 } });
add({ id: "s0.tick", frame: 72, kind: "tick", label: "soft centre tick", object: "headphones", gainDb: -18, dur: 0.15, transient: true, visual: "headphones fully drawn (Lottie marker `drawn`); text \"Headphones on.\" fades up", marker: { lottie: "headphones", name: "drawn", src: 60 } });
add({ id: "s0.dim", frame: 144, kind: "visual", audible: false, label: "everything dims to 20 %", visual: "dim to 20 %" });
add({ id: "s0.air", frame: 138, kind: "air_swell", label: "breath-like air swell 2.30-3.00 s", object: "air", gainDb: -26, dur: 0.7, visual: "the dim; the swell peaks as S1 begins" });

// S1 THE DROP
add({ id: "s1.form", frame: 180, kind: "visual", audible: false, label: "a bead forms at the top centre", visual: "bead swells (code-built), anticipation stretch from 3.30 s" });
add({ id: "s1.release", frame: 204, kind: "release", label: "the drop lets go", object: "drop", gainDb: -34, dur: 0.12, transient: true, visual: "drop Lottie starts (stretch, then fall)", marker: { lottie: "drop", name: "start", src: 0 } });
add({ id: "s1.whistle", frame: 222, kind: "whistle", label: "falling whistle, pitch rising 3.70-4.20 s", object: "drop", gainDb: -22, dur: 0.5, params: { hz0: 1200, hz1: 3400 }, visual: "the fall at full speed" });
add({ id: "s1.plink", frame: 252, kind: "plink", label: "crisp plink + long reverb tail", object: "splash", gainDb: 0, dur: 2.5, transient: true, params: { hz: 1760, reverbSend: 0.55 }, visual: "IMPACT: splash Lottie key pose, 2-frame white bloom", marker: { lottie: "drop", name: "impact", src: 48 } });
add({ id: "s1.bloom", frame: 252, kind: "visual", audible: false, label: "2-frame white bloom (frames 252-253)", visual: "white bloom" });
const RING_HZ = [440, 587.33, 698.46, 880, 1046.5];
RING_BIRTH.forEach((b, k) => add({ id: `s1.ring${k}`, frame: b, kind: "ring_ping", label: `ripple ring ${k + 1}: soft ping, mono -> full width as the ring grows`, object: `ring${k}`, gainDb: -14 - 2 * k, dur: 2.5, transient: true, params: { hz: RING_HZ[k], life: RING_LIFE / FPS }, visual: `ring ${k + 1} is born on the perspective floor plane` }));
add({ id: "s1.collapse", frame: 438, kind: "collapse", label: "inward suction as the splash collapses into the sphere", object: "splash", gainDb: -20, dur: 0.7, visual: "the splash collapses into a glowing sphere (438-480)" });

// S2 THE OBJECT
add({ id: "s2.orb_on", frame: 480, kind: "orb_on", label: "the sound object is born: warm sub + tone", object: "orb", gainDb: -10, dur: 1.2, transient: true, visual: "glowing sphere appears; camera starts the tilt to 3/4 top-down" });
add({ id: "s2.arrive", frame: 540, kind: "tick", label: "object settles at the orbit entry (front, 1.6 m)", object: "orb", gainDb: -20, dur: 0.15, transient: true, visual: "camera tilt done; head-silhouette ring and HUD up; 12-frame hold" });
add({ id: "s2.orbit", frame: ORBIT.start, kind: "visual", audible: false, label: "orbit 1 starts (AZ 000)", visual: "orbit trail starts to draw" });
add({ id: "s2.speedup", frame: Math.round(ORB.centre), kind: "visual", audible: false, label: "orbit 2 begins: 1.5x faster (AZ 360)", visual: "speed change, gentle Doppler" });
const orbitEnd = ORBIT.start + ORBIT.length;
for (let j = 0, n = 0; ; j++) {
  const t = gridT(j, 4); if (t < sec(ORBIT.start) + 0.1) continue; if (t > sec(orbitEnd) - 0.1) break;
  add({ id: `s2.pulse${String(n).padStart(2, "0")}`, t, kind: "pulse", label: "warm tonal pulse, every 1/4 beat at 96 BPM", object: "orb", gainDb: -16, dur: 0.35, transient: true, group: "s2.pulse", params: { hz: [146.83, 174.61, 220, 261.63, 293.66, 261.63, 220, 174.61][n % 8] }, visual: "the sphere pulses", pos: orbPos(t * FPS) });
  n++;
}
add({ id: "s2.rest", frame: orbitEnd, kind: "tick", label: "orbit ends: the object rests in front", object: "orb", gainDb: -20, dur: 0.15, transient: true, visual: "orbit trail fades; the object is at AZ 000 again" });

// S3 ABOVE
add({ id: "s3.crane", frame: 960, kind: "crane", label: "camera crane down: soft low air", object: "none", gainDb: -28, dur: 1.2, visual: "camera cranes down and looks up (960-1032)" });
[16.0625, 16.375, 16.6875, 17.0, 17.3125, 17.625].forEach((t, i) => add({ id: `s3.rise${i}`, t, kind: "pulse", label: "the object pulses on the 1/2 beat while it rises (elevation cue: brighter top end, 7-9 kHz notch moving)", object: "orb", gainDb: -16, dur: 0.35, transient: true, group: "s3.rise", params: { hz: [293.66, 349.23, 440, 523.25, 587.33, 698.46][i], elevation: 1 }, visual: "the object rises (EL 0 -> +60 deg, 972-1068)", pos: orbPos(t * FPS) }));
add({ id: "s3.rain_in", frame: 1020, kind: "rain_bed", label: "rain bed fades in all round and above (17.00-17.80)", object: "rain", gainDb: -24, dur: 5.0, visual: "rain Lottie layers at 3 depths + code particles begin from above" });
const rnd = seeded(7);
const dropFrames: number[] = [];
for (let i = 0; i < 40; i++) dropFrames.push(Math.round(1062 + 246 * Math.pow((i + 0.2 + 0.6 * rnd()) / 40, 0.85)));
for (let i = 1; i < dropFrames.length; i++) if (dropFrames[i] < dropFrames[i - 1] + 4) dropFrames[i] = dropFrames[i - 1] + 4;
dropFrames.forEach((f, i) => { const az = (rnd() * 2 - 1) * 21, d = 2.6 + rnd() * 3.4; add({ id: `s3.drop${String(i + 1).padStart(2, "0")}`, frame: f, kind: "drop_click", label: `drop ${i + 1} of 40 hits the floor: its own click at its own position`, object: "rain", pos: [d * Math.sin(rad(az)), -1.4, -d * Math.cos(rad(az))], gainDb: -20 + 3 * rnd(), dur: 0.2, transient: true, group: "s3.drop", params: { hz: 1800 + 2400 * rnd() }, visual: "a tiny splash on the floor plane" }); });
[18.25, 18.875, 19.5, 20.125, 20.75, 21.375].forEach((t, i) => add({ id: `s3.beat${i}`, t, kind: "pulse", label: "the object pulses on the beat, high above", object: "orb", gainDb: -18, dur: 0.4, transient: true, group: "s3.beat", params: { hz: [293.66, 349.23, 440, 349.23, 293.66, 220][i], elevation: 1 }, visual: "the sphere pulses at EL +60", pos: ORB_TOP }));
add({ id: "s3.rumble", frame: 1110, kind: "rumble", label: "slow overhead rumble 18.50-21.50 s", object: "rumble", gainDb: -20, dur: 3.0, visual: "the sky darkens a touch; the flash follows at 19.80" });
add({ id: "s3.flash", frame: 1188, kind: "sky_flash", label: "one soft white sky flash (no bolts): a soft low thump", object: "rumble", pos: [0, 6, -3], gainDb: -16, dur: 0.6, transient: true, visual: "soft white flash over the whole sky" });

// S4 ALIVE
add({ id: "s4.cut", frame: 1320, kind: "rain_cut", label: "rain stops ON A BEAT (the beat grid has a downbeat here): cut to dry + a soft thump", object: "none", pos: [0, 0, -1], gainDb: -14, dur: 0.4, transient: true, visual: "rain cut to dry (Lottie layers and particles stop on this frame)" });
add({ id: "s4.orb_off", frame: 1320, kind: "orb_off", label: "the object dissolves into the sky", object: "orb", pos: ORB_TOP, gainDb: -18, dur: 0.8, visual: "the sphere dissolves (1320-1344)" });
const wingDown = (id: "A" | "B" | "C", n0 = 0) => {
  const b = BIRDS[id], period = 30 / b.rate, off = 15 / b.rate, out: number[] = [];
  for (let n = n0; ; n++) { const f = b.start + off + period * n; if (f > b.end) break; out.push(f); }
  return out;
};
const FLAP_HZ = { A: 380, B: 300, C: 460 }, GAIN = { A: -18, B: -26, C: -20 };
(["A", "B", "C"] as const).forEach((id) => wingDown(id).forEach((f, i) => add({ id: `s4.bird${id}.flap${i}`, frame: f, kind: "flap", label: `bird ${id}: wing-down = a soft flap`, object: `bird${id}`, gainDb: GAIN[id], dur: 0.25, transient: true, group: `s4.bird${id}.flap`, params: { hz: FLAP_HZ[id] }, visual: `bird ${id} Lottie marker wing_down`, marker: { lottie: `bird${id}`, name: "wing_down", src: 15 + 30 * i } })));
[[1410, "A"], [1500, "A"], [1520, "B"], [1620, "B"], [1548, "C"], [1596, "C"]].forEach(([f, id], i) => add({ id: `s4.bird${id}.chirp${i}`, frame: f as number, kind: "chirp", label: `bird ${id}: FM chirp panned to its exact x/z`, object: `bird${id}`, gainDb: GAIN[id as "A"] + 2, dur: 0.18, transient: true, group: `s4.bird${id}.chirp`, params: { hz: 3200 + 400 * (i % 3) }, visual: `bird ${id} chirps` }));
add({ id: "s4.flyby", frame: 1560, kind: "flyby", label: "bird C passes over the camera: a soft whoosh with Doppler (and its wing-down flap on the same frame)", object: "birdC", gainDb: -22, dur: 0.6, visual: "the diagonal bird crosses over the camera" });
for (let k = 0; k < 8; k++) add({ id: `s4.leaf${k}`, frame: LEAF.start + 15 + 30 * k, kind: "rustle", label: `leaf flip ${k + 1} of 8: a rustle swish panned with the sway`, object: "leaf", gainDb: -24, dur: 0.3, transient: true, group: "s4.leaf", params: { panFrom: k % 2 === 0 ? 0.35 : -0.35, panTo: k % 2 === 0 ? -0.35 : 0.35 }, visual: "leaf Lottie marker flip", marker: { lottie: "leaf", name: "flip", src: 15 + 30 * k } });

// S5 PRECISION
add({ id: "s5.grid_in", frame: 1740, kind: "grid_in", label: "a wide shimmer as the 128-point grid fades in (1740-1770)", object: "grid", gainDb: -24, dur: 0.5, visual: "fade to the 3D grid, 8 rows x 16 columns" });
const F0 = 1770, order = (k: number) => (k * 37 + 11) % 128;     // 37 is coprime to 128: the points are visited all round the head
let clickN = 0;
const click = (f: number, voice: string) => { const idx = order(clickN); add({ id: `s5.pt${String(clickN + 1).padStart(3, "0")}`, frame: f, kind: "grid_click", label: `point ${idx} lights: a click at its position`, object: "grid", pos: GRID[idx], gainDb: -18, dur: 0.12, transient: true, group: "s5.click", params: { point: idx, voice, hz: voice === "a" ? 1400 : voice === "b" ? 2100 : 1700 }, visual: "the point lights" }); clickN++; };
// 4 per second -> 16 per second over 2.5 s: the rate is 4 + 12 s(t / 2.5) with s a smoothstep, so it starts at exactly 4/s (15 frames apart) and arrives at exactly 16/s with no kink
const cum = (t: number) => { const x = t / 2.5; return 4 * t + 12 * 2.5 * (x ** 3 - x ** 4 / 2); };            // events fired by time t (s)
const solveN = (k: number) => { let lo = 0, hi = 2.5; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (cum(m) < k) lo = m; else hi = m; } return (lo + hi) / 2; };
for (let k = 0; k <= 24; k++) click(F0 + Math.round(60 * solveN(k)), "single");
for (let j = 0; j < 16; j++) click(F0 + 150 + Math.round(3.75 * j), "single");                                    // 16 per second
for (let c = 0; c < 8; c++) { const b = F0 + 210 + 12 * c; for (const o of [0, 3, 4, 6, 8, 9]) { if (o === 0) { click(b, "a"); click(b, "b"); } else click(b + o, o % 4 === 0 ? "a" : "b"); } }   // 3:4 polyrhythm: A every 4 frames, B every 3
add({ id: "s5.build", frame: 2076, kind: "charge", label: "the last 31 points charge: a rising shimmer, no clicks (counter rolls 097 -> 128)", object: "grid", gainDb: -22, dur: 16 / FPS, visual: "the counter rolls to 128; the unlit points charge" });
add({ id: "s5.hold", frame: 2092, kind: "visual", audible: false, label: "8-frame anticipation hold, everything held", visual: "stillness" });
add({ id: "s5.allfire", frame: 2100, kind: "chord", label: "ALL 128 FIRE TOGETHER: one wide shimmering chord", object: "grid", pos: [0, 0, -1], gainDb: -6, dur: 3.0, transient: true, params: { voices: 24, chord: "Dm9" }, visual: "every point flashes; OBJECTS 128" });

// S6 CONVERGE
add({ id: "s6.riser", frame: RISER.start, kind: "riser", label: "riser: reverse cymbal + Shepard rise + tightening tremolo, rotating round the head (36.00-40.90)", object: "riser", gainDb: -12, dur: (RISER.end - RISER.start) / FPS, visual: "everything implodes: grid points, rain feather, bird silhouettes, leaf stream into a 6k-particle sphere" });
add({ id: "s6.silence", frame: 2454, kind: "visual", audible: false, label: "TOTAL SILENCE 40.90-41.40 (everything muted, tails included); near-black frame", visual: "near-black" });
add({ id: "s6.breath", frame: 2472, kind: "breath", label: "a single tiny breath (41.20)", object: "impact", pos: [-0.05, -0.12, -0.25], gainDb: -30, dur: 0.4, visual: "one barely visible flicker" });
add({ id: "s6.impact", frame: 2484, kind: "impact", label: "IMPACT: sub drop 35 Hz with pitch fall + hard transient + wide burst", object: "impact", gainDb: 0, dur: 4.0, transient: true, params: { sub: 35 }, visual: "2-frame white flash, shockwave ring, burst Lottie key pose, 3-cycle camera shake, particles explode in slow motion", marker: { lottie: "burst", name: "impact", src: 0 } });

// S7 TITLE
add({ id: "s7.amber", frame: 2490, kind: "visual", audible: false, label: "amber accent appears for the first time", visual: "debris settles in slow motion" });
["HEAR", "EVERY", "DIRECTION."].forEach((w, i) => add({ id: `s7.title${i}`, frame: 2538 + 24 * i, kind: "title_tone", label: `title word "${w}" assembles from the particles`, object: "title", gainDb: -20, dur: 1.6, transient: true, params: { hz: [293.66, 440, 587.33][i] }, visual: `"${w}" lands` }));
add({ id: "s7.sub", frame: 2628, kind: "ui_tick", label: "subline \"Spatial sound — a motion study\" (43.80)", object: "title", gainDb: -30, dur: 0.12, transient: true, visual: "subline fades up" });
add({ id: "s7.handle", frame: 2712, kind: "ui_tick", label: "\"@baqur.ai\" in mono (45.20)", object: "title", gainDb: -32, dur: 0.12, transient: true, visual: "handle fades up" });
add({ id: "s7.legal", frame: 2784, kind: "ui_tick", label: "legal line (46.40)", object: "title", gainDb: -36, dur: 0.12, transient: true, visual: "\"Concept piece. Not affiliated with any audio brand.\"" });
add({ id: "s7.tail", frame: 2832, kind: "visual", audible: false, label: "reverb tail has decayed to silence (47.20); the last frame holds to 48.00", visual: "hold" });

export const EVENTS: SfxEvent[] = EV.sort((a, b) => a.frame - b.frame || a.t - b.t);

// ----------------------------------------------------------------------------------------------------------------- lotties, mix segments
export interface LottiePlacement { id: string; asset: string; start: number; end: number; rate: number; role: string; markers: Record<string, number> }   // markers: timeline frame of each key pose
const at = (start: number, rate: number, src: number) => start + src / rate;
export const LOTTIES: LottiePlacement[] = [
  { id: "headphones", asset: "headphones", start: 30, end: 144, rate: 60 / 42, role: "line-draw 0.50-1.20 s; `drawn` (source 60) lands on the centre tick", markers: { drawn: at(30, 60 / 42, 60) } },
  { id: "drop", asset: "drop", start: 204, end: 354, rate: 1, role: "the fall and the splash key pose", markers: { impact: at(204, 1, 48) } },
  { id: "rainNear", asset: "rain", start: 1020, end: 1320, rate: 1.25, role: "rain, near layer (seamless 120-frame loop)", markers: {} },
  { id: "rainMid", asset: "rain", start: 1020, end: 1320, rate: 1.0, role: "rain, middle layer", markers: {} },
  { id: "rainFar", asset: "rain", start: 1020, end: 1320, rate: 0.8, role: "rain, far layer", markers: {} },
  ...(["A", "B", "C"] as const).map((id): LottiePlacement => ({ id: `bird${id}`, asset: "bird", start: BIRDS[id].start, end: BIRDS[id].end, rate: BIRDS[id].rate, role: `bird ${id}`, markers: Object.fromEntries(wingDown(id).map((f, i) => [`wing_down${i}`, f])) })),
  { id: "leaf", asset: "leaf", start: LEAF.start, end: LEAF.end, rate: 1, role: "the leaf: source frames 0-228 of 240", markers: Object.fromEntries(Array.from({ length: 8 }, (_, k) => [`flip${k}`, LEAF.start + 15 + 30 * k])) },
  { id: "burst", asset: "burst", start: 2484, end: 2574, rate: 1, role: "the impact burst", markers: { impact: 2484 } },
];

export interface MixSegment { id: string; kind: "room" | "bed" | "mute"; start: number; end: number; gainDb: number; fadeIn: number; fadeOut: number; note: string }
export const SEGMENTS: MixSegment[] = [
  { id: "room", kind: "room", start: 0, end: 480, gainDb: -50, fadeIn: 30, fadeOut: 120, note: "room tone" },
  { id: "bed1", kind: "bed", start: 252, end: 2454, gainDb: -22, fadeIn: 228, fadeOut: 6, note: "low D-minor pad at 96 BPM, breathing; in under the plink's tail, out for the S6 silence" },
  { id: "mute", kind: "mute", start: 2454, end: 2484, gainDb: -120, fadeIn: 3, fadeOut: 0, note: "TOTAL SILENCE: all buses muted, reverb tails included" },
  { id: "bed2", kind: "bed", start: 2520, end: 2832, gainDb: -24, fadeIn: 90, fadeOut: 120, note: "pad returns after the impact and decays to silence by 47.20 s" },
];
export const DUCKS = [{ frame: 252, depthDb: -8, hold: 24, release: 60 }, { frame: 1188, depthDb: -6, hold: 20, release: 60 }, { frame: 2100, depthDb: -10, hold: 60, release: 90 }, { frame: 2484, depthDb: -30, hold: 12, release: 120 }];

// ----------------------------------------------------------------------------------------------------------------- HUD (read by the picture)
/** AZ / EL / DIST / OBJECTS at frame f. OBJECTS counts the sound objects alive at that moment. */
export const hudAt = (f: number) => {
  const o = posOf("orb", f), s = toSph(o);
  const az = (s.az + 360) % 360;
  let objects = 0;
  if (f >= 480 && f < 1344) objects = 1;
  else if (f >= 1380 && f < 1740) objects = (["A", "B", "C"] as const).filter((id) => f >= BIRDS[id].start && f < BIRDS[id].end).length + (f >= LEAF.start && f < LEAF.end ? 1 : 0);
  else if (f >= 1770 && f < 2100) objects = Math.min(128, EVENTS.filter((e) => e.kind === "grid_click" && e.frame <= f).length) + (f >= 2076 ? Math.round(31 * smoothstep((f - 2076) / 16)) : 0);
  else if (f >= 2100 && f < 2160) objects = 128;
  return { az: Math.round(az), el: Math.round(s.el), dist: Math.round(s.r * 100) / 100, objects };
};

// ----------------------------------------------------------------------------------------------------------------- export helpers
/** per-frame positions of a moving object (what the audio engine interpolates) */
export const sampleObject = (o: SoundObject): Vec3[] | undefined => {
  if (!o.pos) return undefined;
  const out: Vec3[] = [];
  for (let f = o.start; f <= o.end; f++) out.push(o.pos(f).map((x) => Math.round(x * 1e4) / 1e4) as Vec3);
  return out;
};
export const ORBIT_INFO = { ...ORBIT, omega1DegPerFrame: ORB.omega1, speedChangeCentreFrame: ORB.centre };
export const RING_INFO = { birth: RING_BIRTH, life: RING_LIFE };
export const BIRD_INFO = BIRDS;
