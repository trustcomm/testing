#!/usr/bin/env node
// Writes build/events.json from src/timeline.js: the exact frame of every visual event, which the sound engine renders
// one-for-one (scripts/audio.py). Picture and sound read the same list, so they cannot drift apart.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TL = createRequire(import.meta.url)(path.join(ROOT, "src", "timeline.js"));
const out = path.join(ROOT, "build", "events.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
const data = { fps: TL.FPS, bpm: TL.BPM, total_frames: TL.TOTAL, scenes: TL.SCENES, chords: TL.CHORDS, events: TL.EVENTS };
fs.writeFileSync(out, JSON.stringify(data, null, 1) + "\n");
const types = {};
for (const e of TL.EVENTS) types[e.type] = (types[e.type] || 0) + 1;
console.log(`${TL.EVENTS.length} events → ${path.relative(ROOT, out)}`, types);
