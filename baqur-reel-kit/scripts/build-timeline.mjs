#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Single source of truth builder.
//   script.json  (what is said)
// + timings.json (when each word is said: from Whisper / ElevenLabs Scribe)  [optional]
// + cues.json    (which moments matter + their sounds)
// → timeline.json   (segments, words, cue times) — imported by the video
// → sfx-events.json (sound events) — read by scripts/make_sfx.py
//
// Usage: node scripts/build-timeline.mjs paste-leak
// Without timings.json it estimates timings so you can design before the VO exists.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

const reel = process.argv[2] || 'paste-leak';
const dir = path.resolve('src/reels', reel);
const script = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
const cues = JSON.parse(fs.readFileSync(path.join(dir, 'cues.json'), 'utf8')).cues;
const timingsPath = path.join(dir, 'timings.json');

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');

// Script words with segment ids and pause hints.
const sw = [];
for (const seg of script.segments) {
  const toks = seg.text.split(/\s+/).filter(Boolean);
  toks.forEach((raw, i) => {
    const pause = /\.\.\.$|…$/.test(raw) ? 0.5 : /[.?!]$/.test(raw) ? 0.32 : /,$/.test(raw) ? 0.14 : 0;
    sw.push({seg: seg.id, raw, n: norm(raw), pause, last: i === toks.length - 1});
  });
}

// ── 1) Get times for every script word ──────────────────────
let source = 'estimated';
if (fs.existsSync(timingsPath)) {
  source = 'aligned';
  const tj = JSON.parse(fs.readFileSync(timingsPath, 'utf8'));
  // Accept: Whisper JSON (segments[].words[]), ElevenLabs Scribe (words[] with text/start/end), or plain [{word,start,end}]
  let tw = [];
  if (Array.isArray(tj)) tw = tj;
  else if (tj.segments) tw = tj.segments.flatMap((s) => s.words || []);
  else if (tj.words) tw = tj.words.filter((w) => (w.type ?? 'word') === 'word');
  tw = tw
    .map((w) => ({n: norm(w.word ?? w.text ?? ''), start: +w.start, end: +w.end}))
    .filter((w) => w.n && Number.isFinite(w.start));

  // Needleman–Wunsch alignment with fuzzy similarity (Hinglish spellings vary).
  const sim = (a, b) => {
    if (a === b) return 1;
    const m = a.length, n = b.length;
    if (!m || !n) return 0;
    const d = Array.from({length: m + 1}, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return 1 - d[m][n] / Math.max(m, n);
  };
  const A = sw.length, B = tw.length, GAP = -0.4;
  const S = Array.from({length: A + 1}, () => new Float64Array(B + 1));
  const P = Array.from({length: A + 1}, () => new Uint8Array(B + 1));
  for (let i = 1; i <= A; i++) { S[i][0] = i * GAP; P[i][0] = 1; }
  for (let j = 1; j <= B; j++) { S[0][j] = j * GAP; P[0][j] = 2; }
  for (let i = 1; i <= A; i++)
    for (let j = 1; j <= B; j++) {
      const m = S[i - 1][j - 1] + (sim(sw[i - 1].n, tw[j - 1].n) * 2 - 0.8);
      const u = S[i - 1][j] + GAP;
      const l = S[i][j - 1] + GAP;
      if (m >= u && m >= l) { S[i][j] = m; P[i][j] = 0; }
      else if (u >= l) { S[i][j] = u; P[i][j] = 1; }
      else { S[i][j] = l; P[i][j] = 2; }
    }
  let i = A, j = B, matched = 0;
  while (i > 0 && j > 0) {
    if (P[i][j] === 0) {
      if (sim(sw[i - 1].n, tw[j - 1].n) >= 0.45) {
        sw[i - 1].start = tw[j - 1].start; sw[i - 1].end = tw[j - 1].end; matched++;
      }
      i--; j--;
    } else if (P[i][j] === 1) i--; else j--;
  }
  // Interpolate unmatched words between their matched neighbours (by character weight).
  const total = tw.length ? tw[tw.length - 1].end : 0;
  let k = 0;
  while (k < sw.length) {
    if (sw[k].start !== undefined) { k++; continue; }
    let e = k;
    while (e < sw.length && sw[e].start === undefined) e++;
    const t0 = k > 0 ? sw[k - 1].end : 0;
    const t1 = e < sw.length ? sw[e].start : total;
    const w = sw.slice(k, e).map((x) => Math.max(2, x.n.length));
    const sum = w.reduce((a, b) => a + b, 0);
    let acc = t0;
    for (let q = k; q < e; q++) {
      const d = ((t1 - t0) * w[q - k]) / sum;
      sw[q].start = acc; sw[q].end = acc + d * 0.92; acc += d;
    }
    k = e;
  }
  console.log(`aligned ${matched}/${sw.length} script words to ${tw.length} transcript words`);
  if (matched / sw.length < 0.6) console.warn('⚠️  Low match rate. Check timings.json is for THIS voiceover (try --language en in Whisper).');
} else {
  // Estimated: ~3 words/sec Hinglish narration + punctuation pauses + 0.35s between segments.
  let t = 0.25;
  for (let q = 0; q < sw.length; q++) {
    const d = 0.1 + 0.042 * Math.max(2, sw[q].n.length);
    sw[q].start = t; sw[q].end = t + d;
    t += d + 0.03 + sw[q].pause + (sw[q].last ? 0.3 : 0);
  }
  console.log('no timings.json → estimated timings (design mode). Drop in real timings before final render.');
}

// ── 2) Segments ─────────────────────────────────────────────
const segments = script.segments.map((s) => {
  const ws = sw.filter((w) => w.seg === s.id);
  return {
    id: s.id,
    text: s.text,
    start: +ws[0].start.toFixed(3),
    end: +ws[ws.length - 1].end.toFixed(3),
    words: ws.map((w) => ({w: w.raw, start: +w.start.toFixed(3), end: +w.end.toFixed(3)})),
  };
});

// ── 3) Cues ─────────────────────────────────────────────────
const resolved = {};
const errors = [];
for (const c of cues) {
  const seg = segments.find((s) => s.id === c.seg);
  if (!seg) { errors.push(`cue ${c.id}: unknown segment ${c.seg}`); continue; }
  let t = c.end ? seg.end : seg.start;
  if (c.word) {
    const target = norm(c.word);
    const hits = seg.words.filter((w) => norm(w.w) === target || norm(w.w).startsWith(target));
    const hit = hits[(c.nth ?? 1) - 1];
    if (!hit) errors.push(`cue ${c.id}: word "${c.word}" not found in ${c.seg}`);
    else t = hit.start;
  }
  t += c.offset ?? 0;
  resolved[c.id] = {t: +t.toFixed(3), seg: c.seg, sfx: c.sfx ?? [], pan: c.pan ?? 0, gain: c.gain ?? 1};
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const duration = Math.max(segments[segments.length - 1].end + 2.0, resolved.end?.t ?? 0);
const timeline = {reel, source, duration: +duration.toFixed(3), segments, cues: resolved};
fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(timeline, null, 1));

const events = Object.entries(resolved).flatMap(([id, c]) =>
  c.sfx.map((type) => ({cue: id, type, t: c.t, pan: c.pan, gain: c.gain})),
);
fs.writeFileSync(path.join(dir, 'sfx-events.json'), JSON.stringify({reel, duration: timeline.duration, events}, null, 1));
console.log(`✓ timeline.json  (${segments.length} segments, ${Object.keys(resolved).length} cues, ${duration.toFixed(1)}s)`);
console.log(`✓ sfx-events.json (${events.length} sound events)`);
