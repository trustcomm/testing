// Camera audit on the real shot list (no rendering). usage: npx esbuild scripts/camera-audit.ts --bundle --platform=node --loader:.css=empty --outfile=out/camera-audit.cjs && node out/camera-audit.cjs
// Per move: frames, peak screen speed, and the largest one-frame velocity change (a pop). Also: nothing new for 30 frames after "Nahi" (s6_no).
import {SHOTS} from '../src/reels/agent-lied/AgentLied';
import timeline from '../src/reels/agent-lied/timeline.json';
import {cameraAt} from '../src/core/camera';

const N = Math.round(timeline.duration * 60);
const st = Array.from({length: N + 2}, (_, f) => cameraAt(SHOTS, f, true));
const vel = (f: number) => {
  const a = st[f - 1], b = st[f];
  return [(b.x - a.x) * b.zoom, (b.y - a.y) * b.zoom, Math.log(b.zoom / a.zoom) * 700, ((b.rot - a.rot) * Math.PI) / 180 * 700];
};
const sp = (v: number[]) => Math.hypot(...v);
let fail = 0;
console.log('shot            at    dur   peak px/frame  max accel');
const sorted = [...SHOTS].sort((a, b) => a.at - b.at);
for (let i = 0; i < sorted.length; i++) {
  const s = sorted[i];
  if (s.move === 'CUT') continue;
  const dur = s.dur ?? ({PUSH: 90, 'FLY-TO': 54, PUNCH: 14, PULL: 60, 'DOLLY-THROUGH': 36, CUT: 1} as Record<string, number>)[s.move];
  const lo = Math.max(2, s.at), hi = Math.min(N, s.at + dur + 12);
  let peak = 0, acc = 0;
  const punches = sorted.filter((q) => q.move === 'PUNCH').map((q) => q.at);
  const inPunch = (f: number) => s.move !== 'PUNCH' && punches.some((q) => f >= q - 1 && f <= q + 16); // a punch's own jolt is the punch's, not the move's
  for (let f = lo; f <= hi; f++) { if (inPunch(f)) continue; peak = Math.max(peak, sp(vel(f))); if (f > lo && !inPunch(f - 1)) acc = Math.max(acc, Math.hypot(...vel(f).map((x, k) => x - vel(f - 1)[k]))); }
  const ratio = peak ? acc / peak : 0;
  console.log(`${s.move.padEnd(8)} ${String(s.at).padStart(7)} ${String(dur).padStart(5)}   ${peak.toFixed(1).padStart(8)}      ${acc.toFixed(2).padStart(6)}  (${(ratio * 100).toFixed(0)}% of peak)${s.move === 'PUNCH' || s.move === 'PULL' ? '  (settle ease: fast-in by design)' : ratio > 0.34 ? '  <-- POP' : ''}`);
  if ((s.move === 'PUSH' || s.move === 'FLY-TO') && ratio > 0.34) fail++;
}
// outside the moves: the pose changes smoothly (drift + sentence-free); report the largest idle acceleration
let idle = 0, idleF = 0;
for (let f = 3; f < N; f++) {
  const inMove = sorted.some((s) => s.move !== 'CUT' && f >= s.at - 1 && f <= s.at + (s.dur ?? 60) + 12);
  if (inMove) continue;
  const a = Math.hypot(...vel(f).map((x, k) => x - vel(f - 1)[k]));
  if (a > idle) { idle = a; idleF = f; }
}
console.log(`largest acceleration outside the moves: ${idle.toFixed(3)} px/frame^2 at frame ${idleF}`);
const no = Math.round(timeline.cues.s6_no.t * 60);
const after = Object.entries(timeline.cues).filter(([k, c]) => k !== 's6_no' && Math.round(c.t * 60) > no && Math.round(c.t * 60) < no + 30);
console.log(after.length ? `FAIL: new cues within 30 frames after "Nahi": ${after.map(([k]) => k).join(', ')}` : 'PASS: nothing new for 30 frames after "Nahi" (s6_no)');
if (after.length) fail++;
console.log(fail ? `FAIL: ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
