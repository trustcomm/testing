// The event table: every sound hit and the frame it lands on. Prints a grouped view and writes the full list to EVENTS.md.
import { writeFileSync } from "node:fs";
import { EVENTS, FPS, SCENES, SfxEvent, toSph } from "../src/timeline";

const mmss = (t: number) => `${t.toFixed(3).padStart(7)} s`;
const where = (e: SfxEvent) => { if (!e.audible || e.object === "none" || e.kind === "visual") return "—"; if (["rain_bed", "room_tone", "air_swell", "grid_in", "charge", "crane"].includes(e.kind)) return "surround"; const s = toSph(e.pos); return e.object === "grid" && e.kind === "chord" ? "all 128 points" : s.r < 0.01 ? "—" : `az ${s.az >= 0 ? "+" : "−"}${Math.abs(Math.round(s.az))}° el ${s.el >= 0 ? "+" : "−"}${Math.abs(Math.round(s.el))}° ${s.r.toFixed(1)} m`; };
const row = (e: SfxEvent) => `| ${String(e.frame).padStart(4)} | ${mmss(e.t)} | ${e.audible ? e.kind : "(visual)"} | ${e.label} | ${where(e)} | ${e.transient ? "hit" : e.audible ? "sustain" : ""} |`;

const out: string[] = ["# SPATIAL — event table", "", `Generated from src/timeline.ts. 60 fps, 48.000 s = 2880 frames; frame = seconds × 60. Positions are listener space (az 0 = front, +90 = right).`, "", `${EVENTS.length} events, ${EVENTS.filter((e) => e.audible).length} of them audible, ${EVENTS.filter((e) => e.transient).length} are transient hits that the QA checks to ±1 frame.`, ""];
const summary: string[] = [];
for (const sc of SCENES) {
  const ev = EVENTS.filter((e) => e.scene === sc.id);
  const head = `## ${sc.id} ${sc.name} — frames ${sc.start}–${sc.end} (${(sc.start / FPS).toFixed(2)}–${(sc.end / FPS).toFixed(2)} s)`;
  out.push(head, "", "| frame | time | sound | what | position | |", "|---:|---:|---|---|---|---|", ...ev.map(row), "");
  // grouped view: collapse repeating groups
  summary.push("", head);
  const seen = new Set<string>();
  for (const e of ev) {
    if (e.group) { if (seen.has(e.group)) continue; seen.add(e.group); const g = ev.filter((x) => x.group === e.group); summary.push(`  ${String(g[0].frame).padStart(4)}…${String(g[g.length - 1].frame).padEnd(4)} ${mmss(g[0].t)}  ×${String(g.length).padEnd(3)} ${g[0].kind.padEnd(11)} ${g[0].label.replace(/ \d+ of \d+/, "")}`); continue; }
    summary.push(`  ${String(e.frame).padStart(4)}      ${mmss(e.t)}       ${(e.audible ? e.kind : "(visual)").padEnd(11)} ${e.label}   ${where(e) === "—" ? "" : "@ " + where(e)}`);
  }
}
writeFileSync("EVENTS.md", out.join("\n") + "\n");
console.log(summary.join("\n"));
console.log(`\n${EVENTS.length} events -> EVENTS.md`);
