// usage: node scripts/words.mjs S3 [S4 ...]   -> every word of the scene with the composition frame it starts on (voice time + 0.4 s, 30 fps), the end frame and the bare spelling to look it up with
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("src/timings.json", "utf8")), LEAD = 0.4, F = (s) => Math.round((s + LEAD) * 30);
for (const sc of process.argv.slice(2)) {
  console.log(`--- ${sc}`); let ph = -1, line = "";
  for (const w of d.words.filter((x) => x.scene === sc)) { if (w.phrase !== ph) { if (line) console.log(line); ph = w.phrase; line = `phrase ${ph}: `; } line += `${w.text}[${w.bare}] f${F(w.start)}-${F(w.end)}  `; }
  console.log(line);
}
