// Flow State — the timeline. One source of truth for picture and sound.
// 60 fps, 75 BPM: a 16th note is exactly 12 frames, a beat 48, a bar 192 (3.2 s). Every visual event below is on
// that grid (or a frame of it), and scripts/export_events.mjs writes this exact list for the audio engine.
(function (root) {
  const FPS = 60, BPM = 75, F16 = 12, BEAT = 48, BAR = 192;
  const W = 1080, H = 1920, HORIZON = 1180;
  const TOTAL = 9.5 * BAR; // 1824 frames = 30.4 s

  // Key: D-flat major. SFX use the major pentatonic (Db Eb F Ab Bb); the pad may use full chord tones.
  const PENTA = [0, 2, 4, 7, 9];
  const deg = (d) => 61 + PENTA[((d % 5) + 5) % 5] + 12 * Math.floor(d / 5); // degree 0 = Db4 (MIDI 61)

  const SCENES = [
    { id: "drop", f0: 0, f1: BAR },
    { id: "ripple", f0: BAR, f1: 2 * BAR },
    { id: "noise", f0: 2 * BAR, f1: 3 * BAR },
    { id: "flow", f0: 3 * BAR, f1: 4 * BAR },
    { id: "bloom", f0: 4 * BAR, f1: 5 * BAR },
    { id: "connect", f0: 5 * BAR, f1: 6 * BAR },
    { id: "build", f0: 6 * BAR, f1: 7 * BAR },
    { id: "shine", f0: 7 * BAR, f1: 8 * BAR },
    { id: "end", f0: 8 * BAR, f1: TOTAL },
  ];

  // Pad chords change on the big transitions (scene starts). MIDI notes; bass is the soft sine bass root.
  const CHORDS = [
    { f: 0, name: "Dbadd9", notes: [61, 65, 68, 75], bass: null },
    { f: 144, name: "Dbmaj9", notes: [61, 65, 68, 72, 75], bass: 37 },
    { f: 2 * BAR, name: "Bbm9", notes: [58, 61, 65, 68, 72], bass: 34 },
    { f: 3 * BAR, name: "Gbmaj9", notes: [54, 58, 61, 65, 68], bass: 30 },
    { f: 4 * BAR, name: "Absus2", notes: [56, 58, 63, 68, 70], bass: 32 },
    { f: 5 * BAR, name: "Bbm7", notes: [58, 61, 65, 68, 73], bass: 34 },
    { f: 6 * BAR, name: "Gbmaj7#11", notes: [54, 58, 61, 65, 72], bass: 30 },
    { f: 7 * BAR, name: "Dbmaj9", notes: [61, 65, 68, 72, 75, 80], bass: 25 },
    { f: 8 * BAR, name: "Gbadd9/Db", notes: [61, 66, 70, 73, 80], bass: 37 },
    { f: 8 * BAR + BAR / 2 + BEAT, name: "Dbmaj9", notes: [61, 65, 72, 75, 80], bass: 37 },
  ];

  // Text: thin sans with one italic-serif keyword per line. f0/f1 = in/out frames (every line holds ≥ 0.8 s).
  const TEXT = [
    { id: "t1a", f0: 21, f1: 168, y: 366, parts: [["s", "Every "], ["k", "idea"]], fx: "glow" },
    { id: "t1b", f0: 45, f1: 174, y: 484, parts: [["s", "starts as a "], ["k", "drop."]], fx: "drop" },
    { id: "t2", f0: 204, f1: 352, y: 430, parts: [["s", "Let it "], ["k", "ripple."]], fx: "ripple" },
    { id: "t3", f0: 396, f1: 548, y: 430, parts: [["s", "Quiet the "], ["k", "noise."]], fx: "noise" },
    { id: "t4", f0: 588, f1: 736, y: 430, parts: [["s", "Find your "], ["k", "flow."]], fx: "flow" },
    { id: "t5", f0: 792, f1: 932, y: 430, parts: [["s", "Let it "], ["k", "bloom."]], fx: "bloom" },
    { id: "t6", f0: 972, f1: 1124, y: 430, parts: [["s", "Connect the "], ["k", "dots."]], fx: "dots" },
    { id: "t7", f0: 1164, f1: 1316, y: 430, parts: [["s", "Build in "], ["k", "silence."]], fx: "silence" },
    { id: "t8", f0: 1368, f1: 1500, y: 430, parts: [["s", "Then let it "], ["k", "shine."]], fx: "shine" },
  ];

  // ---- visual event grids (the picture reads these too)
  const DROP = { glint: 66, fall: 120, impact: 144, jet: 176, jetLand: 186 };
  const RINGS = [144, 168, 192, 216, 240, 264, 288];
  const TILT = [264, 360];
  const NOISE = { start: 384, calm: 480, aligned: 564 };
  const SWEEPS = [612, 672];
  const COIL = [700, 768];
  const PETALS_OUT = [780, 792, 804, 816, 828, 840, 852, 864];
  const PETALS_IN = [840, 852, 864, 876, 888, 900, 912, 924];
  const TIPS = 936;
  const EDGES = Array.from({ length: 14 }, (_, k) => 984 + 12 * k);
  const GLOBE = Array.from({ length: 9 }, (_, k) => 1164 + 12 * k);
  const COLLAPSE = [1296, 1344];
  const SHINE = { flare: 1344, line: [1488, 1536] };
  const END = { rotate: [1536, 1572], name: 1572, follow: 1584, devby: 1644, logo: 1656, url: 1668, drip: 1704, fall: 1740, splash: 1764 };

  // ---- the event list (frame-exact): the audio engine renders one sound per entry
  const EV = [];
  const ev = (f, type, p) => EV.push(Object.assign({ f: Math.round(f), type }, p || {}));
  // 01 drop
  ev(0, "air", { dur: 3.0 });
  ev(20, "sparkle", { dur: 0.77, density: 22, gain: 0.32 }); // light gathers into the first drop
  ev(DROP.glint, "bell", { deg: 12, gain: 0.32, pan: 0 });
  ev(DROP.impact, "swell", { dur: 1.0, deg: 5 });
  ev(DROP.impact, "drop", { deg: 10, gain: 1.0, pan: 0 });
  ev(DROP.impact, "sub", { gain: 0.55 });
  [150, 156, 160, 166, 171, 178].forEach((f, i) => ev(f, "drip", { deg: 12 + ((i * 3) % 5), gain: 0.22, pan: -0.5 + 0.2 * i }));
  ev(DROP.jetLand, "drip", { deg: 13, gain: 0.32, pan: 0.1 });
  // 02 ripple: one kalimba note per ring, rising; the rings stand up and lock with a bell
  RINGS.forEach((f, i) => ev(f, "kalimba", { deg: 5 + i, pan: (i % 2 ? 0.25 : -0.25) * (i / 6), gain: 0.75 }));
  ev(TILT[0], "whoosh", { dur: 1.4, pan0: 0, pan1: 0, rise: true, gain: 0.45 });
  ev(TILT[1], "bell", { deg: 15, gain: 0.5, pan: 0 });
  // 03 noise: glass static, then the breath that calms it
  ev(NOISE.start, "sparkle", { dur: 1.55, density: 26, gain: 0.5 });
  ev(NOISE.start, "chord");
  ev(NOISE.calm, "breath", { dur: 1.6, gain: 0.55 });
  ev(NOISE.aligned, "harp", { deg: 7, gain: 0.5, pan: 0 });
  // 04 flow: the ribbon's two sweeps, then a rising gliss as it coils into a bud
  SWEEPS.forEach((f, i) => ev(f, "whoosh", { dur: 0.9, pan0: -0.8, pan1: 0.8, gain: 0.6 }));
  for (let k = 0; k < 6; k++) ev(COIL[0] + 12 * k, "harp", { deg: 5 + k, gain: 0.42, pan: -0.4 + 0.16 * k });
  // 05 bloom: reverse swell into the bud opening, one harp note per petal
  ev(PETALS_OUT[0], "swell", { dur: 0.8, deg: 7 });
  PETALS_OUT.forEach((f, i) => ev(f, "harp", { deg: 7 + [0, 2, 1, 3, 2, 4, 3, 5][i], gain: 0.5, pan: Math.sin((i / 8) * 6.283) * 0.6 }));
  PETALS_IN.forEach((f, i) => ev(f, "kalimba", { deg: 12 + [0, 1, 2, 1, 3, 2, 4, 5][i], gain: 0.32, pan: Math.cos((i / 8) * 6.283) * 0.5 }));
  ev(TIPS, "bell", { deg: 14, gain: 0.45, pan: 0 });
  // 06 connect: a glass bell per connection
  EDGES.forEach((f, i) => ev(f, "bell", { deg: 10 + [0, 2, 4, 1, 3, 5, 2, 4, 6, 3, 5, 7, 4, 6][i], gain: 0.42, pan: ((i * 37) % 11) / 5.5 - 1 }));
  ev(1104, "whoosh", { dur: 0.9, pan0: -0.35, pan1: 0.35, gain: 0.3 }); // the constellation folds onto the sphere
  // 07 build: the globe assembles (plucked strings), then folds into its core
  GLOBE.forEach((f, i) => ev(f, "pluck", { deg: 5 + [0, 2, 4, 2, 5, 4, 7, 5, 9][i], gain: 0.42, pan: ((i * 29) % 9) / 4.5 - 1 }));
  ev(COLLAPSE[0], "whoosh", { dur: 0.8, pan0: 0, pan1: 0, rise: true, gain: 0.5 }); // the globe implodes
  ev(COLLAPSE[1], "swell", { dur: 0.8, deg: 10 });
  // 08 shine: the big one
  ev(SHINE.flare, "sub", { gain: 0.8 });
  ev(SHINE.flare, "chime", { degs: [10, 12, 14, 17], gain: 0.75 });
  ev(SHINE.flare + 24, "sparkle", { dur: 1.2, density: 14, gain: 0.35 });
  ev(SHINE.line[0], "whoosh", { dur: 0.8, pan0: 0, pan1: 0, gain: 0.35 });
  // 09 end card
  ev(END.rotate[0], "swell", { dur: 0.6, deg: 12 });
  ev(END.name, "chime", { degs: [5, 9, 12, 15], gain: 0.7 });
  ev(END.name, "sub", { gain: 0.45 });
  ev(END.follow, "kalimba", { deg: 12, gain: 0.45, pan: -0.15 });
  ev(END.devby, "kalimba", { deg: 14, gain: 0.35, pan: 0.15 });
  ev(END.logo, "bell", { deg: 17, gain: 0.35, pan: 0 });
  ev(END.url, "kalimba", { deg: 15, gain: 0.3, pan: 0.2 });
  ev(END.drip, "bell", { deg: 19, gain: 0.18, pan: 0.25 });
  ev(END.fall, "whoosh", { dur: 0.42, pan0: 0.2, pan1: 0.2, gain: 0.18, fall: true });
  ev(END.splash, "drop", { deg: 12, gain: 0.85, pan: 0.2 });
  // text: a soft air shimmer when a line arrives, a tiny kalimba tick on its keyword
  TEXT.forEach((tx, i) => {
    ev(tx.f0, "text", { gain: 0.35, pan: 0 });
    ev(tx.f0 + 8, "kalimba", { deg: 15 + (i % 3), gain: 0.18, pan: 0.3 });
  });
  CHORDS.forEach((c) => ev(c.f, "pad", { name: c.name, notes: c.notes, bass: c.bass }));
  EV.sort((a, b) => a.f - b.f || a.type.localeCompare(b.type));

  const TL = { FPS, BPM, F16, BEAT, BAR, W, H, HORIZON, TOTAL, PENTA, deg, SCENES, CHORDS, TEXT, DROP, RINGS, TILT, NOISE, SWEEPS, COIL,
    PETALS_OUT, PETALS_IN, TIPS, EDGES, GLOBE, COLLAPSE, SHINE, END, EVENTS: EV };
  if (typeof module !== "undefined" && module.exports) module.exports = TL;
  else root.TL = TL;
})(typeof window !== "undefined" ? window : globalThis);
