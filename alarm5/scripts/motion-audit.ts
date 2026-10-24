// Motion audit of the virtual camera, on the real track (no rendering). Per travelling move: frames, peak speed, ease shape, whether motion blur is on for its fast frames;
// over the whole film: the largest frame-to-frame jumps in velocity and the share of blurred frames. Source rules: nothing animates in or out in fewer frames than the brief allows.
import { readFileSync, readdirSync } from "node:fs";
import { BLUR, CAMERA, PUNCH_FRAMES, TOTAL } from "../src/timeline";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const FPS = 60;
const st = Array.from({ length: TOTAL + 2 }, (_, f) => CAMERA.at(f));
const speed = (f: number) => CAMERA.speed(f);
const blurred = (f: number) => speed(f) > 400 || BLUR.some(([a, b]) => f >= a && f <= b);

console.log("move             from   to   frames   peak px/s   mean px/s  peak/mean  fast frames  blurred of those  zoom x");
let travelOk = true;
for (const t of CAMERA.travels) {
  const k = CAMERA.keys.find((x) => x.f === t.to)!;
  let peak = 0, sum = 0, fast = 0, fastBlur = 0;
  for (let f = t.from; f <= t.to; f++) { const v = speed(f); peak = Math.max(peak, v); sum += v; if (v > 400) { fast++; if (blurred(f)) fastBlur++; } }
  const mean = sum / (t.to - t.from + 1), shape = peak / mean, zoom = st[t.to].s / st[t.from].s;
  console.log(`${k.move.padEnd(15)} ${String(t.from).padStart(5)} ${String(t.to).padStart(5)} ${String(t.to - t.from).padStart(6)}   ${peak.toFixed(0).padStart(9)}   ${mean.toFixed(0).padStart(9)}   ${shape.toFixed(2).padStart(7)}   ${String(fast).padStart(9)}   ${String(fastBlur).padStart(14)}   ${zoom.toFixed(2).padStart(6)}`);
  if (t.to - t.from < 8 || shape < 1.25 || fast !== fastBlur) travelOk = false;
}
ok(travelOk, `camera: ${CAMERA.travels.length} travelling moves, each >= 8 frames, eased (peak speed >= 1.25 x mean: no linear moves), blur on every fast frame`);

// frame-to-frame continuity: the camera velocity (screen px/frame: pan, zoom measured at 700 px, roll at 700 px) never jumps by more than a third of the move's peak from one frame to the next
// (an eased move ramps its speed over many frames; a pop is a one-frame jump). The punches' spring rise is checked separately: it is meant to be fast.
const vel = (f: number) => { const a = st[f - 1], b = st[f]; return [(b.x - a.x) * b.s, (b.y - a.y) * b.s, Math.log(b.s / a.s) * 700, (b.r - a.r) * (Math.PI / 180) * 700]; };
const sp = (v: number[]) => Math.hypot(...v);
const near = (f: number) => PUNCH_FRAMES.some((p) => f >= p - 2 && f <= p + 14);
let worst = { f: 0, ratio: 0, dv: 0 };
for (const t of CAMERA.travels) {
  let peak = 0; for (let f = t.from + 1; f <= t.to; f++) peak = Math.max(peak, sp(vel(f)));
  for (let f = t.from + 2; f <= t.to + 20; f++) { const d = Math.hypot(...vel(f).map((x, i) => x - vel(f - 1)[i])); const r = d / peak; if (r > worst.ratio && !near(f)) worst = { f, ratio: r, dv: d }; }
}
ok(worst.ratio < 0.34, "camera: no pop in any travelling move (largest one-frame velocity change <= 1/3 of the move's peak speed)", `largest ${(100 * worst.ratio).toFixed(0)} % at frame ${worst.f} (${worst.dv.toFixed(1)} px/frame)`);
const idle: { f: number; d: number }[] = [];
for (let f = 2; f < TOTAL; f++) { if (near(f) || CAMERA.travels.some((t) => f >= t.from && f <= t.to + 20)) continue; idle.push({ f, d: Math.hypot(...vel(f).map((x, i) => x - vel(f - 1)[i])) }); }
idle.sort((a, b) => b.d - a.d);
ok(idle[0].d < 3, "camera: outside the moves and punches the pose changes smoothly (sentence pushes, drift, pull-in: velocity change < 3 px/frame)", `max ${idle[0].d.toFixed(2)} px/frame at frame ${idle[0].f}`);
const nb = Array.from({ length: TOTAL }, (_, f) => blurred(f)).filter(Boolean).length;
console.log(`motion blur on ${nb} of ${TOTAL} frames (${(100 * nb / TOTAL).toFixed(1)} %), 8 samples, shutter 180 deg`);
console.log(`punches at ${PUNCH_FRAMES.join(", ")}`);

// source rules: no CSS/linear tweens, nothing animates in under 8 frames or out under 6
const files = ["src/scenes", "src/components"].flatMap((d) => readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`));
const lin = files.flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })).filter((x) => /\blinear\b|transition:\s*["'`]|animation:|ease-in-out|\beaseInOut\b/.test(x.l) && !/^\s*(\/\/|\*|\/\*)/.test(x.l)));
ok(lin.length === 0, "source: no CSS transitions / linear tweens (every move uses the easing library or a spring)", lin.slice(0, 5).map((x) => `${x.f}:${x.i}`).join(" "));
const quick = files.flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })).filter((x) => { const m = [...x.l.matchAll(/\b(?:frames|dur)=\{(\d+)\}/g)].map((q) => +q[1]); return m.some((n) => n < 6) && !/at=\{0\}/.test(x.l) && !/^\s*(\/\/|\*|\/\*)/.test(x.l); }));
ok(quick.length === 0, "source: no entrance / exit under 6 frames", quick.slice(0, 8).map((x) => `${x.f}:${x.i}`).join(" "));
const ins = files.flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l, ms: [...l.matchAll(/\b(?:frames)=\{(\d+)\}/g)].map((q) => +q[1]) })).filter((x) => x.ms.some((n) => n < 8) && /<(Rise|Pop)\b/.test(x.l) && !/out=/.test(x.l)));
ok(ins.length === 0, "source: every entrance (Rise / Pop) takes >= 8 frames", ins.slice(0, 8).map((x) => `${x.f}:${x.i} (${x.ms})`).join(" "));
console.log(failed ? `\nFAIL: ${failed} check(s)` : "\nPASS");
process.exit(failed ? 1 : 0);
