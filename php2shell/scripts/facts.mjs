// The facts the brief says must be on screen EXACTLY, and the things that must not be there. Greps the scene sources (the strings are literals there).
import { readFileSync, readdirSync } from "node:fs";
const dirs = ["src/scenes", "src/components", "src/cues"];
const files = dirs.flatMap((d) => readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`));
const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
const MUST = ["CVE-2026-109618", "CVE-2026-109619", "Wiz", "Calif", "OpenAI", "9.2", "/10", "CRITICAL", "FIX: 21 OCT", "8.5.12", "8.4.27", "8.3.36", "8.2.35", "PHP 8.1 or older → upgrade required", "No confirmed major breach (as of 21 Oct)", "Some services offline as a precaution", "Fix available",
  "OCTOBER 2026", "aapki-website.com", "WordPress", "Found by researchers", "DABBAWALA", "PICHHLE GHAR KI CHAABI", "TIFFIN → REQUEST", "BACHA HUA DATA → MEMORY", "PASSWORD", "TOKEN", "API KEY", "USERNAME", "Kya PHP update ho gaya?", "Plugin update", "PHP update + server restart", "Comment PHP", "@baqur.ai", "Sources: PHP advisory · The Hacker News · watchTowr · Qualys", "Sach."];
let bad = 0;
for (const m of MUST) { const ok = src.includes(m); if (!ok) bad++; console.log(`${ok ? "PASS" : "FAIL"}  on screen: ${m}`); }
for (const [re, what] of [[/<img|<Img|\.svg|\.png|logo/i, "no logos / images (grain.png is the only file)"], [/Math\.random|Date\.now|new Date/, "no unseeded randomness or clocks"], [/fetch\(|https?:\/\/(?!www\.w3\.org)/, "no network"]]) {
  const hits = files.flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })).filter((x) => re.test(x.l) && !/^\s*(\/\/|\*)/.test(x.l) && !x.l.includes("grain.png") && !x.l.includes("staticFile(\"grain")));
  if (hits.length) { bad++; console.log(`FAIL  ${what}: ${hits.slice(0, 5).map((h) => `${h.f}:${h.i}`).join(" ")}`); } else console.log(`PASS  ${what}`);
}
console.log(bad ? `FAIL: ${bad}` : "PASS");
process.exit(bad ? 1 : 0);
