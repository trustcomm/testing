// Sound-effects mixer (no music): place every cue on the picture timeline, mix and master in one ffmpeg pass.
//   node sfx_mix.mjs cues.json out.wav
// cues.json: { "duration": 12, "lufs": -16, "cues": [ { "t": 1.20, "file": "sfx/pop_soft_1.wav", "gain_db": -8,
//              "peak_s": 0.03, "pitch": 1, "pan": 0, "fade_out": 0 } ] }
//   t       = the picture time the sound's PEAK must land on (seconds)
//   peak_s  = where the peak sits inside the file (from sfx.json / style.json); the file starts at t - peak_s
//   pitch   = playback rate (0.94..1.06 for natural variation between repeats)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [cueFile, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(cueFile, 'utf8'));
const base = path.dirname(path.resolve(cueFile));
const cues = spec.cues.filter(c => c.file);
if (!cues.length) throw new Error('no cues');

const inputs = [], chains = [];
cues.forEach((c, i) => {
  const file = path.isAbsolute(c.file) ? c.file : path.join(base, c.file);
  if (!fs.existsSync(file)) throw new Error('missing sound: ' + file);
  inputs.push('-i', file);
  const start = Math.max(0, (c.t - (c.peak_s || 0)));
  const ms = Math.round(start * 1000);
  const f = [`aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo`];
  if (c.pitch && c.pitch !== 1) f.push(`asetrate=${Math.round(48000 * c.pitch)}`, 'aresample=48000');
  if (c.trim) f.push(`atrim=0:${c.trim}`);
  if (c.fade_out) f.push(`afade=t=out:st=${Math.max(0, (c.trim || 30) - c.fade_out)}:d=${c.fade_out}`);
  f.push(`volume=${(c.gain_db || 0).toFixed(1)}dB`);
  if (c.pan) { const l = Math.min(1, 1 - c.pan), r = Math.min(1, 1 + c.pan); f.push(`pan=stereo|c0=${l.toFixed(2)}*c0|c1=${r.toFixed(2)}*c1`); }
  f.push(`adelay=${ms}|${ms}`);
  chains.push(`[${i}:a]${f.join(',')}[a${i}]`);
});
const dur = spec.duration || Math.max(...cues.map(c => c.t)) + 2;
const lufs = spec.lufs ?? -16;
const graph = chains.join(';') + ';' + cues.map((_, i) => `[a${i}]`).join('') +
  `amix=inputs=${cues.length}:normalize=0:dropout_transition=0,apad,atrim=0:${dur},` +
  // loudnorm alone can overshoot its TP target on short dense hits; the limiter holds about -1.5 dB true peak
  `loudnorm=I=${lufs}:TP=-1.5:LRA=11,aresample=192000,alimiter=limit=0.7:level=0:attack=1:release=40,aresample=48000[out]`;
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-c:a', 'pcm_s24le', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log(`mixed ${cues.length} cues -> ${out} (${dur}s, ${lufs} LUFS)`);
