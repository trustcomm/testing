// Frame harness: static server + headless Chromium (Playwright) + PNG per frame.
//   node render.mjs stills 1,3.5,7 [--ss 2] [--guides]
//   node render.mjs preview --every 3
//   node render.mjs video [from] [to] [--ss 2] [--workers 2]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const flag = (name, dflt) => { const i = argv.indexOf(`--${name}`); return i < 0 ? dflt : argv[i + 1]; };
const has = (name) => argv.includes(`--${name}`);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--guides'].includes(argv[i - 1])));
const mode = pos[0] || 'stills';
const SS = Number(flag('ss', 1));
const WORKERS = Number(flag('workers', 1));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = flag('url', `http://127.0.0.1:${server.address().port}/index.html`);

async function open() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=1', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('pageerror:', e.message); process.exit(1); });
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  const qs = `?render&ss=${SS}${has('guides') ? '&guides' : ''}`;
  await page.goto(BASE + qs);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const info = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS, POINTS: window.POINTS }));
  return { browser, page, info };
}

async function grab(page, t) {
  const url = await page.evaluate(async (t) => {
    await window.renderFrame(t);
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  return Buffer.from(url.split(',')[1], 'base64');
}

function writeAtomic(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', buf);
  fs.renameSync(file + '.tmp', file);
}

async function renderFrames(list, fileFor, label) {
  let ctx = await open();
  const times = [];
  const sizes = [];
  for (let n = 0; n < list.length; n++) {
    const { i, t } = list[n];
    const file = fileFor(i, t);
    if (fs.existsSync(file)) continue;                       // resume
    if (n > 0 && n % 60 === 0) { await ctx.browser.close(); ctx = await open(); }
    const t0 = Date.now();
    const med = times.length ? [...times].sort((a, b) => a - b)[times.length >> 1] : 0;
    const limit = med ? Math.max(8 * med, 20000) : 300000;
    const buf = await Promise.race([
      grab(ctx.page, t),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`watchdog: frame ${i} > ${limit}ms`)), limit)),
    ]);
    writeAtomic(file, buf);
    times.push(Date.now() - t0);
    sizes.push(buf.length);
    const run = sizes.slice(-5);
    if (run.length === 5 && run.every((s) => s === run[0])) console.warn(`warn: 5 identical frame sizes ending at ${i}`);
    if (n % 10 === 0 || n === list.length - 1) console.log(`${label} ${n + 1}/${list.length}  ${times.at(-1)}ms`);
  }
  await ctx.browser.close();
  return times;
}

const probe = await open();
const { DURATION, FPS, POINTS } = probe.info;
await probe.browser.close();
const total = Math.round(DURATION * FPS);
console.log(`points ${POINTS}  duration ${DURATION}s  fps ${FPS}  ss ${SS}`);

if (mode === 'stills') {
  const ts = (pos[1] || '0').split(',').map(Number);
  const list = ts.map((t) => ({ i: Math.round(t * FPS), t }));
  await renderFrames(list, (i, t) => path.join(ROOT, 'qa', `still_${t.toFixed(2)}_ss${SS}${has('guides') ? '_guides' : ''}.png`), 'still');
} else {
  const every = mode === 'preview' ? Number(flag('every', 3)) : 1;
  const from = mode === 'video' && pos[1] ? Number(pos[1]) : 0;
  const to = mode === 'video' && pos[2] ? Number(pos[2]) : total;
  const dir = path.join(ROOT, mode === 'preview' ? 'frames_preview' : (SS > 1 ? `frames_ss${SS}` : 'frames'));
  const all = [];
  for (let i = from; i < to; i += every) all.push({ i, t: i / FPS });
  const fileFor = (i) => path.join(dir, `f${String(mode === 'preview' ? i / every : i).padStart(5, '0')}.png`);
  const chunks = Array.from({ length: WORKERS }, (_, w) => all.filter((_, k) => k % WORKERS === w));
  const t0 = Date.now();
  await Promise.all(chunks.map((c, w) => renderFrames(c, fileFor, `w${w}`)));
  console.log(`done ${all.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${dir}`);
}
server.closeAllConnections();
server.close();
process.exit(0);
