// Leader — the cue sheet. Single source of truth for picture AND sound.
// scripts/score.py parses the JSON between the CUES-JSON markers, so keep it strict JSON (no comments inside).
/* CUES-JSON-BEGIN */
window.CUES = {
  "bpm": 128,
  "beat": 0.46875,
  "bar": 1.875,
  "fps": 60,
  "duration": 15.0,
  "bars": [
    { "n": "8", "name": "FLUID SIMULATION", "t0": 0.0 },
    { "n": "7", "name": "LIGHT & 3D", "t0": 1.875 },
    { "n": "6", "name": "PARTICLES", "t0": 3.75 },
    { "n": "5", "name": "REFRACTION", "t0": 5.625 },
    { "n": "4", "name": "GEOMETRY & MASKS", "t0": 7.5 },
    { "n": "3", "name": "KINETIC TYPE", "t0": 9.375 },
    { "n": "2", "name": "CAMERA", "t0": 11.25 },
    { "n": "", "name": "SHOWREEL 2026", "t0": 13.125 }
  ],
  "worlds": [
    { "id": "fluid", "t0": 0.0, "t1": 1.875 },
    { "id": "forge", "t0": 1.875, "t1": 5.625 },
    { "id": "glass", "t0": 5.625, "t1": 7.2656 },
    { "id": "geometry", "t0": 7.2656, "t1": 9.375 },
    { "id": "type", "t0": 9.375, "t1": 11.0156 },
    { "id": "flight", "t0": 11.0156, "t1": 13.125 },
    { "id": "lockup", "t0": 13.125, "t1": 15.0 }
  ],
  "events": [
    { "t": 0.0, "id": "impact", "kind": "splash" },
    { "t": 0.46875, "id": "fluid-pulse-1", "kind": "pulse" },
    { "t": 0.9375, "id": "fluid-pulse-2", "kind": "pulse" },
    { "t": 1.40625, "id": "vortex-spinup", "kind": "riser" },
    { "t": 1.640625, "id": "dive", "kind": "whoosh" },
    { "t": 1.875, "id": "forge-hit", "kind": "hit" },
    { "t": 2.34375, "id": "sweep-ice", "kind": "shing" },
    { "t": 2.8125, "id": "sweep-infra", "kind": "shing" },
    { "t": 3.28125, "id": "dissolve", "kind": "sizzle" },
    { "t": 3.75, "id": "spark-burst", "kind": "burst" },
    { "t": 4.21875, "id": "spiral-swell", "kind": "swell" },
    { "t": 4.6875, "id": "snap-six", "kind": "snap" },
    { "t": 5.15625, "id": "implode", "kind": "implode" },
    { "t": 5.625, "id": "glass-bloom", "kind": "glass" },
    { "t": 6.5625, "id": "lens-push", "kind": "swell" },
    { "t": 7.03125, "id": "freeze", "kind": "freeze" },
    { "t": 7.5, "id": "clack", "kind": "clack" },
    { "t": 7.734375, "id": "snap-a", "kind": "click" },
    { "t": 7.96875, "id": "snap-b", "kind": "click" },
    { "t": 8.203125, "id": "snap-c", "kind": "click" },
    { "t": 8.4375, "id": "four-lock", "kind": "lock" },
    { "t": 8.90625, "id": "stripe-zoom", "kind": "whoosh" },
    { "t": 9.375, "id": "type-swoop", "kind": "swoop" },
    { "t": 9.84375, "id": "word-hit-1", "kind": "word" },
    { "t": 10.3125, "id": "tighten", "kind": "word" },
    { "t": 10.78125, "id": "unspool", "kind": "unspool" },
    { "t": 11.015625, "id": "sweep-hand", "kind": "whip" },
    { "t": 11.25, "id": "two-pop", "kind": "pop" },
    { "t": 11.71875, "id": "flight-dive", "kind": "whoosh" },
    { "t": 12.65625, "id": "exit-glow", "kind": "riser" },
    { "t": 13.125, "id": "drop", "kind": "drop" },
    { "t": 13.59375, "id": "fill-cascade", "kind": "cascade" },
    { "t": 14.0625, "id": "type-on", "kind": "type" },
    { "t": 14.53125, "id": "glint", "kind": "glint" }
  ]
};
/* CUES-JSON-END */
