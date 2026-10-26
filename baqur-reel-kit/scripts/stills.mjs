// usage: node scripts/stills.mjs <CompositionId> <outDir> <frame|cueId> [...]   (a cue id needs --reel <reel>)
// Renders stills in one bundle (much faster than one `remotion still` per frame). Chromium path: set BROWSER or it uses the pre-installed one when present.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const ri = args.indexOf('--reel'); let reel = null; if (ri >= 0) { reel = args[ri + 1]; args.splice(ri, 2); }
const scale = (() => { const i = args.indexOf('--scale'); if (i < 0) return 1; const v = +args[i + 1]; args.splice(i, 2); return v; })();
const [id, outDir, ...items] = args;
const browserExecutable = process.env.BROWSER || (existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
const tl = reel ? JSON.parse(await readFile(`src/reels/${reel}/timeline.json`, 'utf8')) : null;
const frames = items.map((x) => (/^-?\d+$/.test(x) ? +x : Math.round(tl.cues[x.split('+')[0]].t * 60) + (x.includes('+') ? +x.split('+')[1] : 0)));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
await mkdir(outDir, {recursive: true});
const t0 = Date.now();
for (const fr of frames) await renderStill({composition, serveUrl, frame: Math.min(fr, composition.durationInFrames - 1), browserExecutable, output: path.join(outDir, `f${String(fr).padStart(5, '0')}.png`), imageFormat: 'png', scale});
console.log(`rendered ${frames.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)} s (${composition.durationInFrames} frames)`);
