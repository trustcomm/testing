// src/timeline.ts -> audio/timeline.json (for the Python audio engine) and public/timeline.json (for Remotion's staticFile / the QA).
import { mkdirSync, writeFileSync } from "node:fs";
import { BIRD_INFO, BPM, DUCKS, DURATION, EVENTS, FPS, GRID0, LOTTIES, OBJECTS, ORBIT_INFO, RING_INFO, SCENES, SEGMENTS, sampleObject } from "../src/timeline";

const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const json = {
  meta: { name: "SPATIAL", fps: FPS, durationFrames: DURATION, durationSeconds: DURATION / FPS, sampleRate: 48000, bpm: BPM, beatGridAnchorSeconds: GRID0, units: "metres", space: "listener space: head at the origin, +x right, +y up, -z in front; azimuth 0 = front, +90 = right" },
  scenes: SCENES,
  objects: OBJECTS.map((o) => ({ id: o.id, kind: o.kind, scene: o.scene, start: o.start, end: o.end, note: o.note, dopplerScale: o.dopplerScale ?? 1, sources: o.sources?.map((p) => p.map(r4)), samples: sampleObject(o), width: o.width ? Array.from({ length: o.end - o.start + 1 }, (_, i) => r4(o.width!(o.start + i))) : undefined })),
  events: EVENTS,
  lotties: LOTTIES,
  segments: SEGMENTS,
  ducks: DUCKS,
  orbit: { ...ORBIT_INFO }, rings: RING_INFO, birds: BIRD_INFO,
};
mkdirSync("audio", { recursive: true }); mkdirSync("public", { recursive: true });
const text = JSON.stringify(json);
writeFileSync("audio/timeline.json", text); writeFileSync("public/timeline.json", text);
console.log(`timeline.json: ${(text.length / 1024).toFixed(0)} KB, ${json.scenes.length} scenes, ${json.objects.length} objects, ${json.events.length} events (${json.events.filter((e) => e.audible).length} audible), ${json.lotties.length} lottie placements`);
