// Safe zones on pixels. usage: node scripts/layout.mjs <Composition> <reel> [cueId ...]   (default: every cue, 12 frames after)
// Renders each frame three times (backdrop only, stations without captions/overlays, full) and diffs them:
//   content = nocap vs bg, captions = full vs nocap. Flags: content (>400 px) in the top 240 px or the bottom 440 px, within 24 px of a side, or overlapping the captions.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, readFile, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
const [id, reel, ...want] = process.argv.slice(2);
const tl = JSON.parse(await readFile(`src/reels/${reel}/timeline.json`, 'utf8'));
const ids = want.length ? want : Object.keys(tl.cues).filter((k) => !['end'].includes(k));
const frames = ids.map((k) => (/^\d+$/.test(k) ? +k : Math.round(tl.cues[k].t * 60) + 12)).sort((a, b) => a - b);
const W = 1080, H = 1920, TOP = 240, BOTTOM = H - 440, MARGIN = 24, THR = 48, MIN = 400;
const browserExecutable = process.env.BROWSER || (existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const props = {bg: {stations: false, captions: false, chrome: false}, nocap: {captions: false, chrome: false}, full: {chrome: false}};
const comps = Object.fromEntries(await Promise.all(Object.entries(props).map(async ([k, inputProps]) => [k, await selectComposition({serveUrl, id, inputProps, browserExecutable})])));
const dir = 'out/layout'; await mkdir(dir, {recursive: true});
const dec = async (f) => PNG.sync.read(await readFile(f));
const mask = (a, b, thr) => { const m = new Uint8Array(W * H); for (let i = 0, o = 0; i < W * H; i++, o += 4) if (Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]), Math.abs(a.data[o + 2] - b.data[o + 2])) > thr) m[i] = 1; return m; };
const box = (m, x0 = 0, y0 = 0, x1 = W, y1 = H) => { let a = W, b = H, c = -1, d = -1, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m[y * W + x]) { n++; if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return n ? {x0: a, y0: b, x1: c, y1: d, n} : null; };
// By-design exceptions (frame -> {re, why}); a frame listed here is still reported, marked "by design".
const ALLOW = {
  691: {re: /right 24/, why: 'S2: the locked "4 rules" card peeks in from the right edge, partly off-frame on purpose'},
  2555: {re: /top 240/, why: 'S6 -> S7: the vertical PUSH down to the quote; "Nahi." leaves through the top while the camera travels'},
};
let bad = 0;
for (const f of frames) {
  const p = {};
  for (const k of Object.keys(props)) { p[k] = `${dir}/${k}-${String(f).padStart(5, '0')}.png`; await renderStill({composition: comps[k], serveUrl, inputProps: props[k], frame: f, browserExecutable, output: p[k], imageFormat: 'png'}); }
  const [bg, nocap, full] = await Promise.all([dec(p.bg), dec(p.nocap), dec(p.full)]);
  const content = mask(bg, nocap, THR), capm = mask(nocap, full, 40), notes = [];
  const caps = box(capm), all = box(content);
  for (const [name, z] of [[`top ${TOP} px`, box(content, 0, 0, W, TOP)], ['bottom 440 px', box(content, 0, BOTTOM, W, H)], [`left ${MARGIN} px`, box(content, 0, 0, MARGIN, H)], [`right ${MARGIN} px`, box(content, W - MARGIN, 0, W, H)]]) if (z && z.n > MIN) notes.push(`content in the ${name} (${z.n} px at x ${z.x0}..${z.x1} y ${z.y0}..${z.y1})`);
  if (caps) { const ov = box(content, Math.max(0, caps.x0 - 10), Math.max(0, caps.y0 - 10), Math.min(W, caps.x1 + 11), Math.min(H, caps.y1 + 11)); if (ov && ov.n > 60) notes.push(`content overlaps the captions (${ov.n} px at x ${ov.x0}..${ov.x1} y ${ov.y0}..${ov.y1})`); }
  const allowed = notes.filter((n) => ALLOW[f]?.re.test(n)), real = notes.filter((n) => !allowed.includes(n));
  if (real.length) bad++; else for (const k of Object.keys(props)) await rm(p[k]);
  console.log(`${real.length ? 'FLAG' : 'ok  '}  frame ${String(f).padStart(4)}  content ${all ? `x ${all.x0}..${all.x1} y ${all.y0}..${all.y1}` : '-'}  captions ${caps ? `y ${caps.y0}..${caps.y1}` : '-'}  ${real.join('; ')}${allowed.length ? `  [by design: ${ALLOW[f].why}]` : ''}`);
}
console.log(bad ? `FAIL: ${bad} of ${frames.length} frames flagged` : `PASS: ${frames.length} frames`);
process.exit(bad ? 1 : 0);
