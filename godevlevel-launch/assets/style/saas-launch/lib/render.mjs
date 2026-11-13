// Frame-exact renderer for compositions built with this style (follows motion-video-director's render CLI contract).
//   node render.mjs <composition.js> --from 0 --to 12 --fps 30 --scale 1 --out renders/final [--jpg] [--blur 6] [--shutter 0.5] [--audio mix.wav]
// The composition is an ES module exporting: { width, height, duration, setup?(ctx, assetsBase), draw(ctx, t) }.
// Import this lib from the composition with RELATIVE paths ('../lib/core.js'); absolute '/D:/…' imports fail to load.
// It is drawn in headless Chromium at each frame time; with --blur N each output frame averages N sub-frames
// spread over the shutter (fraction of a frame), which gives real motion blur on fast moves.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), comp = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const fps = +opt('fps', 30), scale = +opt('scale', 1), from = +opt('from', 0), blur = +opt('blur', 1), shutter = +opt('shutter', 0.5);
const outDir = path.resolve(opt('out', 'renders')), jpg = !!opt('jpg', false), audio = opt('audio', null);
const name = opt('name', path.basename(comp, '.js'));

// Serve the whole filesystem by absolute path (/C:/… on Windows, /home/… elsewhere) so a composition can import
// this lib and its assets from any drive with plain ES module imports.
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = /^\/[A-Za-z]:\//.test(p) ? p.slice(1) : p;
  if (p === '/__player') { res.setHeader('content-type', 'text/html'); return res.end(PLAYER); }
  fs.readFile(f, (e, b) => {
    if (e) { console.error('not found:', f); res.statusCode = 404; return res.end(); }
    const ext = path.extname(f).toLowerCase();
    res.setHeader('content-type', { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
      '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webp': 'image/webp' }[ext] || 'application/octet-stream');
    res.end(b);
  });
});
const toUrl = f => '/' + f.split(path.sep).join('/').replace(/^\//, '');
const PLAYER = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c"></canvas><script type="module">
  const m = await import(new URLSearchParams(location.search).get('comp'));
  const C = m.default || m, s = +new URLSearchParams(location.search).get('scale');
  const cv = document.getElementById('c'); cv.width = Math.round(C.width * s); cv.height = Math.round(C.height * s);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const acc = document.createElement('canvas'); acc.width = cv.width; acc.height = cv.height; const actx = acc.getContext('2d');
  if (C.setup) await C.setup(ctx, new URL('.', new URL(new URLSearchParams(location.search).get('comp'), location.href)).href);
  await document.fonts.ready;
  window.__meta = { width: C.width, height: C.height, duration: C.duration };
  window.__frame = async (t, n, span) => {
    // n sub-frames over [t - span/2, t + span/2], averaged with 'lighter' at equal weight
    if (n <= 1) { ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clearRect(0, 0, C.width, C.height); await C.draw(ctx, t); return; }
    const sum = new Float32Array(cv.width * cv.height * 4);
    for (let k = 0; k < n; k++) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(s, 0, 0, s, 0, 0);
      await C.draw(ctx, t + span * ((k + 0.5) / n - 0.5));
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; for (let i = 0; i < d.length; i++) sum[i] += d[i];
    }
    const out = ctx.createImageData(cv.width, cv.height); for (let i = 0; i < sum.length; i++) out.data[i] = sum[i] / n;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.putImageData(out, 0, 0);
  };
  window.__ready = true;
</script></body></html>`;

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch(process.env.MG_BROWSER_CHANNEL ? { channel: process.env.MG_BROWSER_CHANNEL } : {});
const page = await browser.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${port}/__player?scale=${scale}&comp=${encodeURIComponent(toUrl(comp))}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const meta = await page.evaluate(() => window.__meta);
const to = +opt('to', meta.duration);
const W = Math.round(meta.width * scale), H = Math.round(meta.height * scale);
await page.setViewportSize({ width: W, height: H });

fs.mkdirSync(outDir, { recursive: true });
const frames = Math.round((to - from) * fps);
const canvas = await page.$('#c');
let ff;
if (!jpg) {
  const outFile = path.join(outDir, `${name}.mp4`);
  const a = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) a.push('-ss', String(from), '-i', path.resolve(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest');
  a.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-movflags', '+faststart', outFile);
  ff = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
}
for (let f = 0; f < frames; f++) {
  const t = from + f / fps;
  await page.evaluate(([t, n, span]) => window.__frame(t, n, span), [t, blur, shutter / fps]);
  const buf = await canvas.screenshot({ type: 'jpeg', quality: 95 });
  if (jpg) fs.writeFileSync(path.join(outDir, `${String(f).padStart(5, '0')}_${t.toFixed(3)}.jpg`), buf);
  else if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % Math.max(1, Math.round(fps / 2)) === 0) process.stdout.write(`${Math.round(100 * f / frames)}%\n`);
}
if (ff) { ff.stdin.end(); await new Promise((ok, no) => ff.on('close', c => c ? no(new Error('ffmpeg ' + c)) : ok())); }
await browser.close(); server.close();
console.log('100% done:', jpg ? outDir : path.join(outDir, `${name}.mp4`));
