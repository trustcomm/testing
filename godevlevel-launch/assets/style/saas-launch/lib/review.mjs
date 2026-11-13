// Self-review sheets: one labelled frame per named beat (or every N seconds), and a scrub strip for one move.
//   node review.mjs beats  video.mp4 timeline.json out.jpg        one tile per beat, labelled "name  t"
//   node review.mjs every  video.mp4 0.5 out.jpg                  one tile every 0.5 s
//   node review.mjs scrub  video.mp4 3.2 3.9 12 out.jpg           12 frames across a move, labelled +ms
// Look at the sheet after every render and check it against review.md before calling anything done.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const [mode, video, ...rest] = process.argv.slice(2);
const font = process.platform === 'win32' ? "C\\:/Windows/Fonts/arial.ttf" : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
let times = [], labels = [], out;
if (mode === 'beats') {
  const tl = JSON.parse(fs.readFileSync(rest[0], 'utf8')); out = rest[1];
  const beats = tl.beats || tl;
  for (const [k, v] of Object.entries(beats)) if (typeof v === 'number') { times.push(v); labels.push(`${k} ${v.toFixed(2)}s`); }
} else if (mode === 'every') {
  const step = +rest[0]; out = rest[1];
  const d = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).stdout.toString();
  for (let t = 0; t < d; t += step) { times.push(t); labels.push(t.toFixed(2) + 's'); }
} else if (mode === 'scrub') {
  const [a, b, n] = rest.slice(0, 3).map(Number); out = rest[3];
  for (let i = 0; i < n; i++) { const t = a + (b - a) * i / (n - 1); times.push(t); labels.push(`+${Math.round((t - a) * 1000)}ms`); }
} else throw new Error('mode: beats | every | scrub');

const tmp = fs.mkdtempSync('review-');
times.forEach((t, i) => spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf',
  `scale=360:-2,drawtext=fontfile='${font}':text='${labels[i].replace(/:/g, '\\:')}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6`,
  `${tmp}/${String(i).padStart(3, '0')}.png`]));
const cols = Math.min(6, times.length), rows = Math.ceil(times.length / cols);
spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', `${tmp}/%03d.png`, '-vf', `tile=${cols}x${rows}:padding=4:color=0x222222`, '-frames:v', '1', out], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
console.log('sheet:', out, times.length, 'frames');
