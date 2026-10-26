#!/usr/bin/env node
// Pre-render QA: retention rules + fact rules. Usage: node scripts/qa.mjs paste-leak
import fs from 'node:fs';
import path from 'node:path';
const reel = process.argv[2] || 'paste-leak';
const dir = path.resolve('src/reels', reel);
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const tsx = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const facts = fs.existsSync(path.join(dir, 'facts.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'facts.json'), 'utf8')) : {required: [], banned: []};
let fail = 0, warn = 0;
const ok = (m) => console.log('  ✓', m);
const w = (m) => { warn++; console.log('  ⚠️ ', m); };
const x = (m) => { fail++; console.log('  ✗', m); };

console.log(`\nQA · ${reel} · timings: ${tl.source} · ${tl.duration.toFixed(1)}s`);
if (tl.source === 'estimated') w('timings are ESTIMATED. Add timings.json from your real VO, then rebuild.');

console.log('\nRetention rules');
const s1 = tl.segments[0];
const firstCue = Object.values(tl.cues).filter((c) => c.seg === 'S1').sort((a, b) => a.t - b.t);
s1.end <= 6.5 ? ok(`payoff sentence ends at ${s1.end.toFixed(1)}s (≤ 6.5s)`) : w(`S1 ends at ${s1.end.toFixed(1)}s. Payoff should land in the first ~5s.`);
const times = Object.values(tl.cues).map((c) => c.t).sort((a, b) => a - b);
const gaps = [];
for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] > 3.0) gaps.push([times[i - 1], times[i]]);
gaps.length ? gaps.forEach(([a, b]) => w(`no visual change for ${(b - a).toFixed(1)}s (${a.toFixed(1)}s → ${b.toFixed(1)}s). Add a cue.`)) : ok('a visual change at least every 3s');
tl.duration <= 90 ? ok('duration ≤ 90s') : w(`duration ${tl.duration.toFixed(0)}s > 90s. Tighten the VO.`);
const heavy = Object.entries(tl.cues).filter(([, c]) => c.sfx.some((s) => ['hit', 'sub'].includes(s)));
for (let i = 1; i < heavy.length; i++) if (heavy[i][1].t - heavy[i - 1][1].t < 1.2) w(`heavy hits ${heavy[i - 1][0]} and ${heavy[i][0]} are < 1.2s apart (they'll mush)`);
const lastSeg = tl.segments[tl.segments.length - 1];
/comment/i.test(lastSeg.text) ? ok('CTA in final segment') : w('final segment has no comment CTA');

console.log('\nFact rules');
const flat = tsx.replace(/,/g, '');
for (const r of facts.required) (tsx.includes(r) || flat.includes(r.replace(/,/g, ''))) ? ok(`on screen: "${r}"`) : x(`missing on-screen fact: "${r}"`);
for (const b of facts.banned) (new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(tsx) ? x(`banned claim present: "${b}"`) : null);
if (facts.banned.length) ok(`none of ${facts.banned.length} banned claims present`.replace(/^/, fail ? '' : ''));

console.log(`\n${fail ? '✗ FAIL' : '✓ PASS'} · ${fail} errors · ${warn} warnings\n`);
process.exit(fail ? 1 : 0);
