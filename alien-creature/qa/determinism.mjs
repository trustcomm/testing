// Render frames cold, in order, and in reverse; every pass must give identical SHA-256.
//   node qa/determinism.mjs [frames=0,180,359] [--ss 1]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const frames = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '0,180,359').split(',').map(Number);
const ss = process.argv.includes('--ss') ? process.argv[process.argv.indexOf('--ss') + 1] : '1';
const FPS = 30;
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);

function pass(order) {
  const ts = order.map((i) => (i / FPS).toFixed(4));
  for (const t of ts) fs.rmSync(path.join(ROOT, 'qa', `still_${Number(t).toFixed(2)}_ss${ss}.png`), { force: true });
  execFileSync('node', ['render.mjs', 'stills', ts.join(','), '--ss', ss], { cwd: ROOT, stdio: 'ignore' });
  return Object.fromEntries(order.map((i) => [i, sha(path.join(ROOT, 'qa', `still_${(i / FPS).toFixed(2)}_ss${ss}.png`))]));
}

const runs = { cold: Object.fromEntries(frames.map((i) => [i, pass([i])[i]])), inOrder: pass(frames), reverse: pass([...frames].reverse()) };
let ok = true;
for (const i of frames) {
  const hs = [runs.cold[i], runs.inOrder[i], runs.reverse[i]];
  const same = hs.every((h) => h === hs[0]);
  ok &&= same;
  console.log(`${same ? 'ok  ' : 'FAIL'} frame ${i}  ${hs.join(' ')}`);
}
process.exit(ok ? 0 : 1);
