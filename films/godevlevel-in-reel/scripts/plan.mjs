/**
 * plan.mjs: build timeline.json for the godevlevel.in kinetic-type reel.
 *
 * Cards come from the copy table (target lengths in frames at 30 fps). Every cut is snapped to the
 * music grid (beats, half and quarter beats) while keeping the accelerating shape: card lengths may
 * only stay the same or shrink through Parts A and B. The cut to the logo (card 23 → 24) sits
 * exactly on a downbeat; the music stops there.
 *
 * PROVISIONAL: 128 BPM grid (no track yet). When canva/music/reel.mp4 arrives, run
 *   python3 ../godevlevel-launch/engine/scripts/tempo.py canva/music/reel.wav --json canva/music/reel.tempo.json
 * and this script uses the measured BPM and downbeats instead (see MUSIC below).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;

// [id, target frames, english, hinglish, emphasis, part]
const COPY = [
  [1, 22, "websites", "website", false, "A"],
  [2, 20, "are not", "kaafi", false, "A"],
  [3, 18, "enough.", "nahi.", true, "A"],
  [4, 16, "you need", "aapko chahiye", false, "A"],
  [5, 16, "customers.", "customers.", true, "A"],
  [6, 15, "leads", null, false, "B"],
  [7, 14, "calls", null, false, "B"],
  [8, 13, "site visits", null, false, "B"],
  [9, 12, "walk-ins", null, false, "B"],
  [10, 12, "reviews", null, false, "B"],
  [11, 11, "offers", null, false, "B"],
  [12, 11, "reels", null, false, "B"],
  [13, 10, "launches", null, false, "B"],
  [14, 10, "trust", null, false, "B"],
  [15, 9, "speed", null, false, "B"],
  [16, 9, "sales", null, false, "B"],
  [17, 8, "growth", null, false, "B"],
  [18, 8, "more", null, false, "B"],
  [19, 7, "more", null, false, "B"],
  [20, 7, "more", null, false, "B"],
  [21, 14, "we build", "hum banate hain", false, "C"],
  [22, 16, "all of it.", "sab kuch.", true, "C"],
  [23, 30, "godevlevel.in", null, false, "C"],
  [24, 45, null, null, false, "C"],
];
// Three Part B cuts enter with a 2-frame horizontal smear instead of a clean cut (spread through the run).
const SMEAR = new Set([8, 12, 16]);
const SMEAR_FRAMES = 2;

// ---- music grid ----
const tempoFile = path.join(HERE, "canva", "music", "reel.tempo.json");
const MUSIC = existsSync(tempoFile) ? JSON.parse(readFileSync(tempoFile, "utf8")) : null;
const BPM = MUSIC ? MUSIC.bpm : 128;
const BEAT = 60 / BPM;
// Snap grid. Cuts prefer beats / half / quarter beats; eighth beats are allowed only at a cost, because
// at 128 BPM a quarter beat is 3.5 frames and quarter-only snapping turns the one-frame-per-card
// acceleration into a staircase (six equal cards in a row). SUBDIV=4 forces quarter-only.
const SUBDIV = Number(process.env.SUBDIV ?? 8);
const Q = BEAT / SUBDIV;
const OFF_QUARTER_COST = 3; // per cut that is on an eighth but not a quarter beat

const targets = COPY.map((c) => c[1]);
const cum = (i) => targets.slice(0, i).reduce((a, b) => a + b, 0); // frames before card i (0-based)
const LOGO = 23; // 0-based index of card 24
const logoTarget = cum(LOGO) / FPS;

// Grid phase: put a downbeat exactly on the logo cut. With a real track the film start maps to
// trackOffset in the track, chosen so a measured downbeat lands there (and Part B sits on the busiest bars).
let phase, trackOffset = null, downbeatUsed = null;
if (MUSIC) {
  // Choose the measured downbeat d (≥ logoTarget into the track) that maximises busyness under Part B.
  const busy = (t) => {
    const i = MUSIC.beats.findIndex((b) => b > t);
    return i < 0 ? 0 : MUSIC.busyPerBeat[Math.max(0, i - 1)];
  };
  let best = null;
  for (const d of MUSIC.downbeats) {
    const off = d - logoTarget;
    if (off < 0) continue;
    let s = 0;
    for (let f = cum(5); f < cum(20); f++) s += busy(off + f / FPS);
    if (!best || s > best.s) best = { d, off, s };
  }
  trackOffset = best.off;
  downbeatUsed = best.d;
  phase = (((MUSIC.firstBeat - trackOffset) % Q) + Q) % Q;
} else {
  phase = logoTarget % (4 * BEAT); // PROVISIONAL: a downbeat exactly at the logo cut (also a grid point)
}
const gridFrames = (lo, hi) => {
  const out = [];
  for (let j = Math.ceil((lo / FPS - phase) / Q); phase + j * Q <= hi / FPS; j++) out.push((phase + j * Q) * FPS);
  return out;
};

// ---- snap boundaries (cuts 1..22 between cards; cut 23 fixed on the downbeat) ----
// Candidate frames per cut: integer frames nearest to grid points within ±12 frames of the target.
const N = COPY.length;
const cuts = []; // cuts[i] = start frame of card i+1 (i = 1..N-1); cut before card 0 is 0
for (let i = 1; i < N; i++) {
  const t = cum(i);
  if (i === LOGO) {
    cuts.push([{ f: Math.round(logoTarget * FPS), grid: logoTarget * FPS }]);
    continue;
  }
  const c = gridFrames(t - 12, t + 12).map((g) => {
    const units = Math.round(((g / FPS - phase) / Q) * 1e6) / 1e6;
    return { f: Math.round(g), grid: g, quarter: (units * 4) % SUBDIV === 0 };
  });
  cuts.push(c.length ? c : [{ f: t, grid: t }]);
}
// DP over cuts with state = (previous cut frame, previous card length); minimise squared timing error
// subject to: card length ≥ 5, and non-increasing lengths inside Parts A and B.
const part = (i) => COPY[i][5];
let layer = new Map([[`0|${Infinity}`, { cost: 0, path: [], prev: 0, len: Infinity }]]);
for (let i = 1; i < N; i++) {
  const next = new Map();
  for (const st of layer.values())
    for (const c of cuts[i - 1]) {
      const len = c.f - st.prev; // length of card i-1
      if (len < 5) continue;
      const shaped = part(i - 1) !== "C" && (i - 1 === 0 || part(i - 2) === part(i - 1));
      if (shaped && len > st.len) continue;
      // Shape first: each card's length vs its target; then grid preference; cumulative drift barely counts
      // (the end is pinned to the downbeat anyway).
      const cost = st.cost + (len - targets[i - 1]) ** 2 + (c.quarter === false ? OFF_QUARTER_COST : 0) + 0.05 * (c.f - cum(i)) ** 2;
      const key = `${c.f}|${len}`;
      if (!next.has(key) || next.get(key).cost > cost) next.set(key, { cost, path: [...st.path, c], prev: c.f, len: part(i - 1) === part(i) ? len : Infinity });
    }
  layer = next;
}
const best = [...layer.values()].sort((a, b) => a.cost - b.cost)[0];
if (!best) throw new Error("no snapping keeps the accelerating shape; widen the candidate window");
const starts = [0, ...best.path.map((c) => c.f)];
const total = starts[LOGO] + targets[LOGO];

const beats = COPY.map(([id, tgt, en, hi, emph, p], i) => {
  const startFrame = starts[i];
  const endFrame = i < N - 1 ? starts[i + 1] : total;
  const kind = id === 23 ? "type" : id === 24 ? "logo" : "word";
  return {
    id: `c${String(id).padStart(2, "0")}`,
    card: id,
    part: p,
    kind,
    text: { en, hi: hi ?? en },
    emphasis: emph,
    // Every cut inverts: odd cards charcoal ground + orange type, even cards orange ground + charcoal type.
    // Exception (brief): the logo card is on charcoal, so 23 → 24 does not invert.
    ground: id === 24 ? "charcoal" : id % 2 ? "charcoal" : "orange",
    smear: SMEAR.has(id),
    preroll: SMEAR.has(id) ? SMEAR_FRAMES / FPS : 0,
    targetFrames: tgt,
    frames: endFrame - startFrame,
    startFrame,
    endFrame,
    start: +(startFrame / FPS).toFixed(4),
    end: +(endFrame / FPS).toFixed(4),
    dur: +((endFrame - startFrame) / FPS).toFixed(4),
    snapErrorMs: i === 0 ? 0 : +(((startFrame - best.path[i - 1].grid) / FPS) * 1000).toFixed(1),
    snappedTo: i === 0 ? "film start" : best.path[i - 1].quarter === false ? "eighth beat" : "quarter-beat grid",
    cut: "hard",
    carry: null,
    handoffIn: null,
    handoffOut: null,
  };
});

const tl = {
  film: "godevlevel-in-reel",
  provisional: !MUSIC,
  note: MUSIC ? `Snapped to the measured track (${BPM} BPM).` : "PROVISIONAL: 128 BPM grid; re-run after canva/music/reel.mp4 is measured.",
  bpm: BPM,
  snapGrid: SUBDIV === 4 ? "quarter beats" : "quarter beats preferred, eighth beats allowed",
  beat: BEAT,
  fps: FPS,
  width: 1080,
  height: 1920,
  duration: total / FPS,
  frames: total,
  music: MUSIC
    ? { file: "canva/music/reel.wav", trackOffset: +trackOffset.toFixed(4), stopAt: +(starts[LOGO] / FPS).toFixed(4), downbeat: downbeatUsed }
    : { file: null, stopAt: +(starts[LOGO] / FPS).toFixed(4), gridPhase: +phase.toFixed(4) },
  camera: [
    { t: 0, x: 540, y: 960, z: 1 },
    { t: total / FPS, x: 540, y: 960, z: 1 },
  ],
  beats,
};
writeFileSync(path.join(HERE, "timeline.json"), JSON.stringify(tl, null, 2));

console.log(`timeline.json · ${tl.provisional ? "PROVISIONAL " : ""}${BPM} BPM · ${total} frames (${(total / FPS).toFixed(3)} s) · logo cut at frame ${starts[LOGO]} = ${(starts[LOGO] / FPS).toFixed(4)} s (downbeat)`);
console.log(beats.map((b) => `${b.card}:${b.targetFrames}→${b.frames}`).join("  "));
