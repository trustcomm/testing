import { readdir, unlink, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";

for (const f of await readdir("frames")) if (/^f\d{5}\.png$/.test(f)) await unlink(`frames/${f}`);
const { open, close } = await start();
try {
  const v = await open();
  for (let i = 0; i < v.frames; i++) await writeFile(`frames/f${String(i).padStart(5, "0")}.png`, await v.png(i));
  console.log(`wrote ${v.frames} frames (${v.duration} s at ${v.fps} fps)`);
} finally { await close(); }
