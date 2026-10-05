/**
 * plan.mjs: build timeline.json audio-first on a beat grid.
 *
 * PROVISIONAL: grid = 128 BPM (BRIEF §3 assumption), first downbeat at 0.
 * When canva/music/track.wav arrives, set BPM/DOWNBEAT to the measured
 * tempo and first downbeat and re-run; nothing else changes.
 *
 * VO source: one take, vo/vo-master.mp3, split into V1–V11 at pauses (Stage 1).
 * Phrase splits inside lines come from silencedetect (n=-30dB, d=0.05).
 * Word onsets are ESTIMATED: syllable-proportional inside each phrase.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "timeline.json");

const BPM = 128;
const DOWNBEAT = 0; // seconds of the first downbeat in film time
const FPS = 30;
const W = 1920;
const H = 1080;
const BEAT = 60 / BPM;

// V1–V11 spans in vo-master.mp3 (Stage 1) and phrase splits (line-relative seconds).
const VO = {
  V1: { src: [0.0, 1.1], text: "New phone in store.", phrases: [[0, 1.1, "New phone in store."]] },
  V2: { src: [1.23, 2.46], text: "New tower on sale.", phrases: [[0, 1.23, "New tower on sale."]] },
  V3: { src: [2.64, 4.12], text: "New offer every week.", phrases: [[0, 1.48, "New offer every week."]] },
  V4: {
    src: [4.41, 7.09],
    text: "Your launches move fast. Your videos should too.",
    phrases: [
      [0, 1.31, "Your launches move fast."],
      [1.5, 2.68, "Your videos should too."],
    ],
  },
  V5: {
    src: [7.42, 10.11],
    text: "GoDevLevel builds launch films — in code.",
    phrases: [
      [0, 0.79, "GoDevLevel"],
      [0.86, 1.91, "builds launch films —"],
      [2.13, 2.69, "in code."],
    ],
  },
  V6: { src: [10.41, 14.0], text: "Your colours. Your words. Your product. Exactly.", phrases: [[0, 3.59, "Your colours. Your words. Your product. Exactly."]] },
  V7: { src: [14.34, 16.87], text: "Change the price? One line. Re-render.", phrases: [[0, 2.53, "Change the price? One line. Re-render."]] },
  V8: {
    src: [17.18, 20.26],
    text: "Wide for YouTube. Tall for Reels. Same film.",
    phrases: [
      [0, 0.9, "Wide for YouTube."],
      [1.13, 2.0, "Tall for Reels."],
      [2.26, 3.08, "Same film."],
    ],
  },
  V9: { src: [20.62, 24.06], text: "Mobile shops. Real estate. Brands. Anyone launching.", phrases: [[0, 3.44, "Mobile shops. Real estate. Brands. Anyone launching."]] },
  V10: { src: [24.4, 25.26], text: "GoDevLevel.", phrases: [[0, 0.86, "GoDevLevel."]] },
  V11: { src: [25.46, 26.61], text: "Build your launch.", phrases: [[0, 1.15, "Build your launch."]] },
};

// Handoff contracts in world space (1920×1080). Each beat starts from the previous one's handoffOut.
const orange = "orange";
const START = { kind: "caret", x: 953, y: 492, w: 14, h: 96, r: 2, colour: orange };
const HANDOFF = {
  b01: { kind: "outline", x: 782, y: 180, w: 356, h: 720, r: 52, stroke: 10, colour: orange },
  b02: { kind: "outline", x: 810, y: 60, w: 300, h: 960, r: 8, stroke: 10, colour: orange },
  b03: { kind: "line", x: 660, y: 780, w: 600, h: 10, r: 0, colour: orange },
  b04: { kind: "line", x: 180, y: 650, w: 1560, h: 10, r: 0, colour: orange },
  b05: { kind: "window", x: 300, y: 238, w: 1320, h: 228, r: 24, stroke: 2, colour: "ink" },
  b06: { kind: "frame", x: 360, y: 202.5, w: 1200, h: 675, r: 20, stroke: 6, colour: orange },
  b07: { kind: "frame", x: 360, y: 202.5, w: 1200, h: 675, r: 20, stroke: 6, colour: orange },
  b08: { kind: "frame", x: 746.25, y: 160, w: 427.5, h: 760, r: 20, stroke: 6, colour: orange },
  b09: { kind: "dot", x: 950, y: 530, w: 20, h: 20, r: 10, colour: orange },
  // Reversed logo (assets/logo-reversed.png, 1565×194) at 960 px wide, centred.
  b10: { kind: "wordmark", x: 480, y: 480.5, w: 960, h: 119, r: 0, colour: "ink" },
  b11: null,
};

// Beats: grid length in beats, VO placement, carry name. `still` = planned near-still seconds (local).
const SPEC = [
  { id: "b01", n: 4, voice: "V1", voAt: { beats: 1 }, carry: "Phone outline", built: true },
  { id: "b02", n: 2, voice: "V2", voAt: { sec: -0.1 }, carry: "Tower outline", built: true },
  { id: "b03", n: 4, voice: "V3", voAt: { sec: 0.26 }, carry: "Tag's bottom edge", built: true },
  { id: "b04", n: 8, voice: "V4", voAt: { beats: 1 }, carry: "Underline", built: true, still: [[0.47, 3.75]] },
  { id: "b05", n: 6, voice: "V5", voAt: { beats: 0 }, carry: "Code editor window", built: true },
  { id: "b06", n: 8, voice: "V6", voAt: { beats: 0 }, carry: "Product frame", built: true },
  { id: "b07", n: 6, voice: "V7", voAt: { beats: 0 }, carry: "Product frame", built: true },
  { id: "b08", n: 8, voice: "V8", voAt: { beats: 0 }, carry: "9:16 frame", built: true },
  { id: "b09", n: 8, voice: "V9", voAt: { beats: 0 }, carry: "Orange dot", built: true },
  { id: "b10", n: 7, voice: "V10", voAt: { beats: 2 }, carry: "Wordmark", built: true, still: [[0, 0.9375], [2.15, 3.28]] },
  { id: "b11", n: 6, voice: "V11", voAt: { beats: 0 }, carry: null, built: true, still: [[1.7, 2.36]] },
];

// Global camera keys (film time). PROVISIONAL; interpolated by a monotone cubic Hermite in web/core/camera.js.
const CAMERA = [
  { t: 0, x: 960, y: 540, z: 1.0 },
  { t: 0.9375, x: 960, y: 540, z: 1.0 },
  { t: 1.875, x: 960, y: 540, z: 1.06 }, // b01 push on the phone
  { t: 2.8125, x: 960, y: 530, z: 1.0 }, // b02 whip: tower fits
  { t: 3.75, x: 960, y: 600, z: 1.04 }, // b03 push on the tag
  { t: 4.6875, x: 960, y: 540, z: 1.0 },
  { t: 8.4375, x: 968, y: 540, z: 1.015 }, // b04 tiny drift
  { t: 9.6, x: 960, y: 420, z: 1.1 }, // b05 re-centre on the code line
  { t: 11.25, x: 960, y: 400, z: 1.12 },
  { t: 12.0, x: 960, y: 540, z: 1.0 }, // b06 frame opens
  { t: 15.0, x: 960, y: 540, z: 1.0 },
  { t: 15.6, x: 1000, y: 800, z: 1.35 }, // b07 close-up on the code line + price
  { t: 16.9, x: 1000, y: 800, z: 1.38 },
  { t: 17.6, x: 960, y: 540, z: 1.0 }, // pull back for the split; settled before the cut so the frame is at rest across it
  { t: 17.8125, x: 960, y: 540, z: 1.0 },
  { t: 21.5625, x: 960, y: 530, z: 1.03 },
  { t: 23.4, x: 960, y: 540, z: 1.06 }, // b09 energy push
  { t: 25.3125, x: 960, y: 540, z: 1.0 },
  { t: 26.25, x: 960, y: 540, z: 1.0 }, // b10 dot dead still
  { t: 28.59375, x: 960, y: 540, z: 1.0 },
  { t: 30.0, x: 960, y: 530, z: 1.02 }, // b11 settle
  { t: 31.40625, x: 960, y: 530, z: 1.02 },
];

const syllables = (w) => {
  const s = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return 0;
  if (s === "godevlevel") return 4;
  if (s === "youtube") return 2;
  const groups = s.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
};

const words = (line, at) =>
  line.phrases.flatMap(([a, b, txt]) => {
    const ws = txt.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
    const syl = ws.map(syllables);
    const total = syl.reduce((p, c) => p + c, 0);
    let acc = 0;
    return ws.map((w, i) => {
      const t = at + a + ((b - a) * acc) / total;
      acc += syl[i];
      return { w, t: +t.toFixed(3), est: true };
    });
  });

let k = 0;
const beats = SPEC.map((s, i) => {
  const start = DOWNBEAT + k * BEAT;
  k += s.n;
  const end = DOWNBEAT + k * BEAT;
  const line = VO[s.voice];
  const at = start + (s.voAt.beats !== undefined ? s.voAt.beats * BEAT : s.voAt.sec);
  const len = line.src[1] - line.src[0];
  return {
    id: s.id,
    beats: s.n,
    start: +start.toFixed(5),
    end: +end.toFixed(5),
    dur: +(end - start).toFixed(5),
    startFrame: Math.round(start * FPS),
    endFrame: Math.round(end * FPS),
    built: !!s.built,
    carry: s.carry,
    cut: s.carry ? "carry" : "end",
    handoffIn: i === 0 ? START : HANDOFF[SPEC[i - 1].id],
    handoffOut: HANDOFF[s.id],
    still: s.still ?? [],
    vo: {
      line: s.voice,
      text: line.text,
      src: line.src,
      start: +at.toFixed(3),
      end: +(at + len).toFixed(3),
      words: words(line, at),
    },
  };
});

const lens = beats.map((b) => b.dur);
const total = beats.at(-1).end;
const stillSec = beats.reduce((p, b) => p + b.still.reduce((q, [a, c]) => q + (c - a), 0), 0);

const tl = {
  provisional: true,
  note: "PROVISIONAL: 128 BPM assumed grid. Re-grid to the measured tempo/downbeats of canva/music/track.wav when it arrives.",
  bpm: BPM,
  downbeat: DOWNBEAT,
  beat: BEAT,
  fps: FPS,
  width: W,
  height: H,
  duration: total,
  frames: Math.round(total * FPS),
  vo: { file: "vo/vo-master.mp3", note: "Single take; V1–V11 spans from Stage 1. Word onsets estimated (syllable-proportional)." },
  camera: CAMERA,
  beats,
  planned: {
    spread: +(Math.max(...lens) / Math.min(...lens)).toFixed(3),
    stillSec: +stillSec.toFixed(3),
    stillPct: +((100 * stillSec) / total).toFixed(1),
  },
};
writeFileSync(OUT, JSON.stringify(tl, null, 2));

const f = (x) => x.toFixed(3).padStart(6);
console.log(`timeline.json (PROVISIONAL ${BPM} BPM, beat ${BEAT.toFixed(5)} s) · ${total.toFixed(3)} s · ${tl.frames} frames @ ${FPS}`);
for (const b of beats)
  console.log(
    `${b.id} ${f(b.start)}–${f(b.end)} ${String(b.beats).padStart(2)} beats ${f(b.dur)} s | ${b.vo.line.padEnd(3)} ${f(b.vo.start)}–${f(b.vo.end)}${b.vo.start < b.start || b.vo.end > b.end ? " (spills)" : ""} | carries: ${b.carry ?? "— end"}`,
  );
console.log(`spread ${tl.planned.spread}× · planned near-still ${tl.planned.stillSec} s (${tl.planned.stillPct}%)`);
