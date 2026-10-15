// usage: node render.mjs            every frame (clears frames/ first)
//        node render.mjs 570 750    frames 570..749 only (the others in frames/ are kept, so a changed scene re-renders alone)
// Frame files beyond the end of the timeline are removed either way.
import { readdir, unlink, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";

const [, , a, b] = process.argv;
const { open, close } = await start();
try {
  const v = await open();
  const from = a ? +a : 0, to = b ? Math.min(+b, v.frames) : v.frames;
  for (const f of await readdir("frames")) {
    const m = /^f(\d{5})\.png$/.exec(f);
    if (m && (!a || +m[1] >= v.frames)) await unlink(`frames/${f}`);
  }
  for (let i = from; i < to; i++) await writeFile(`frames/f${String(i).padStart(5, "0")}.png`, await v.png(i));
  console.log(`wrote ${to - from} frames (${from}..${to - 1} of ${v.frames}; ${v.duration} s at ${v.fps} fps)`);
} finally { await close(); }
