// The facts the brief says must be on screen EXACTLY, and the things that must not be there. Greps the scene sources (the strings are literals there).
import { readFileSync, readdirSync } from "node:fs";
const dirs = ["src/scenes", "src/components"];
const files = dirs.flatMap((d) => readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`));
const all = ["src/cues", ...dirs].flatMap((d) => readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`));
const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
const MUST = [
  "JPMorgan · Citi · Schwab block", "Bank of America limits (Oct 13–16)",                // S3: the banks
  "LiteLLM 1.107.0",                                                                      // S5: the poisoned version (also a pill)
  "{val}M+", "CLOSING", "DEC 2026",                                                       // S7: Zeabur, 3.2M+ records, closing Dec 2026 ({val} counts 0.0 -> 3.2)
  "Signal call bug · CVE-2026-113380", "Fix aa gaya", "No known exploitation",            // S9/S10: Signal
  "CVE-2026-109618", "CVE-2026-109619", "PHP2Shell",                                      // S11: PHP2Shell
  "8.5.12", "8.4.27", "8.3.36", "8.2.35+", "PHP update",                                  // S12: the safe versions
  "AI AGENT = KHATRA", "AI TOOL = TARGET", "AI-ERA RESEARCH = CHOWKIDAAR",                // S13
];
let bad = 0;
for (const m of MUST) { const ok = src.includes(m); if (!ok) bad++; console.log(`${ok ? "PASS" : "FAIL"}  on screen: ${m}`); }
// the counter reaches exactly 3.2: (cp * 3.2).toFixed(1) with cp = 1 at the end
const ctr = /\(cp \* 3\.2\)\.toFixed\(1\)/.test(src); if (!ctr) bad++; console.log(`${ctr ? "PASS" : "FAIL"}  counter ends on 3.2 (M+)`);
// the sources line of S15 and the LiteLLM pill spelled exactly
for (const [re, what] of [[/<img|<Img|\.svg|\.png|logo/i, "no logos / images (grain.png is the only file)"], [/Math\.random|Date\.now|new Date/, "no unseeded randomness or clocks"], [/fetch\(|https?:\/\/(?!www\.w3\.org)/, "no network"]]) {
  const hits = all.flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })).filter((x) => re.test(x.l) && !/^\s*(\/\/|\*|\/\*)/.test(x.l) && !x.l.includes("grain.png") && !x.l.includes("staticFile(\"grain")));
  if (hits.length) { bad++; console.log(`FAIL  ${what}: ${hits.slice(0, 5).map((h) => `${h.f}:${h.i}`).join(" ")}`); } else console.log(`PASS  ${what}`);
}
console.log(bad ? `FAIL: ${bad}` : "PASS");
process.exit(bad ? 1 : 0);
