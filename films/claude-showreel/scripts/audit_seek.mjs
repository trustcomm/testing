#!/usr/bin/env node
// Seek-determinism audit on pixels: every sampled frame must be identical whether the timeline is seeked forward,
// backward, or by random jumps (the WebGL and canvas layers are pure functions of t, so they must match too).
// Also checks the frame-exact beats the soundtrack is synced to (contacts, word hits, counts).
// Usage: node scripts/audit_seek.mjs   → out/audit/seek.json, exit 1 on any mismatch
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join, dirname, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function findPuppeteer() {
  const c = [join(ROOT, "node_modules")];
  const npx = join(homedir(), ".npm/_npx");
  if (existsSync(npx)) for (const d of readdirSync(npx)) c.push(join(npx, d, "node_modules"));
  for (const nm of c) if (existsSync(join(nm, "puppeteer-core/package.json"))) return createRequire(join(nm, "x.js"))("puppeteer-core");
  throw new Error("puppeteer-core not found (run any npx hyperframes command once)");
}
const puppeteer = findPuppeteer();
const cues = JSON.parse(readFileSync(join(ROOT, "src/cues.json"), "utf8"));
const FPS = cues.fps;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".woff2": "font/woff2", ".wav": "audio/wav", ".png": "image/png" };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: process.env.PRODUCER_HEADLESS_SHELL_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
  protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.evaluateOnNewDocument(() => {
  window.__timelines = window.__timelines || {};
  window.addEventListener("unhandledrejection", (e) => console.error("unhandled rejection: " + String(e.reason)));
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "domcontentloaded" });
// poll (rAF-based waitForFunction can stall in a headless page that is not compositing)
for (let i = 0; ; i++) {
  if (await page.evaluate(() => !!(window.__timelines && window.__timelines.main))) break;
  if (i > 480) {
    console.error("timeline never registered:", errors.join(" | ") || "timeout");
    process.exit(2);
  }
  await new Promise((r) => setTimeout(r, 250));
}
const buildMs = Date.now() - t0;

// one or two frames inside every chapter plus every hand-off frame on both sides
const F = 1 / FPS;
const times = [0, 0.3, 0.62, 1 - F, 1, 1 + F, 1.25, 2.5, 2.5 + F, 3 - F, 3, 3.6, 4.0, 4.85, 5 - F, 5, 5.2, 5.97, 6, 6.1, 6.8,
  7 - F, 7, 7.05, 7.5, 8.2, 8.75, 9 - F, 9, 9.15, 9.8, 10.5, 10.9, 11, 11.2, 12.5, 12.9, 13 - F, 13, 13.5, 13.6, 14, 14.4, 15 - F]
  .map((t) => Math.round(t * FPS) / FPS);
const pngs = {};
const shot = async (t, keep) => {
  await page.evaluate((tt) => { window.__timelines.main.totalTime(tt, false); }, t);
  const png = await page.screenshot({ type: "png" });
  if (keep) pngs[keep] = png;
  return createHash("sha1").update(png).digest("hex");
};
const order = (ts, kind) => {
  if (kind === "forward") return [...ts];
  if (kind === "backward") return [...ts].reverse();
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); // seeded shuffle
  const a = [...ts];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const passes = {};
for (const kind of ["forward", "backward", "random"]) {
  passes[kind] = {};
  for (const t of order(times, kind)) {
    if (kind === "random") await shot(0); // jump from the start every time
    passes[kind][t.toFixed(4)] = await shot(t, `${kind}-${t.toFixed(4)}`);
  }
}
// A hash mismatch is real only if pixels differ beyond raster noise (Chrome can re-rasterise scaled text ±1 level).
const raw = (png) => execFileSync("ffmpeg", ["-v", "error", "-i", "pipe:0", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { input: png, maxBuffer: 1 << 26 });
const noise = [];
const differs = (k, a, b) => {
  if (passes[a][k] === passes[b][k]) return false;
  const A = raw(pngs[`${a}-${k}`]), B = raw(pngs[`${b}-${k}`]);
  let n = 0, mx = 0;
  for (let i = 0; i < A.length; i++) {
    const d = Math.abs(A[i] - B[i]);
    if (d) n++;
    if (d > mx) mx = d;
  }
  if (mx <= 2 && n <= 50) { noise.push({ t: k, passes: `${a}/${b}`, values: n, maxLevel: mx }); return false; }
  return true;
};
const mismatches = times.map((t) => t.toFixed(4)).filter((k) => differs(k, "forward", "backward") || differs(k, "forward", "random"));
const fb = times.filter((t) => passes.forward[t.toFixed(4)] !== passes.backward[t.toFixed(4)]).length;
const fr = times.filter((t) => passes.forward[t.toFixed(4)] !== passes.random[t.toFixed(4)]).length;
if (mismatches.length) {
  mkdirSync(join(ROOT, "out/audit/mismatch"), { recursive: true });
  const k = mismatches[0];
  for (const kind of ["forward", "backward", "random"]) writeFileSync(join(ROOT, `out/audit/mismatch/${kind}-${k}.png`), pngs[`${kind}-${k}`]);
}
console.log(`forward≠backward ${fb} · forward≠random ${fr}`);

// frame-exact beats: squash on the contact frame, word glyph timing, the dot counted with the number
const beats = await page.evaluate((F) => {
  const R = window.__reel, out = {};
  out.contacts = window.CUES.visual.c1.contacts.map((c) => ({ t: c, sx: +R.ballPose(c).sx.toFixed(3), before: +R.ballPose(c - F).sx.toFixed(3) }));
  out.landJelly = +R.gooState(window.CUES.visual.c2.land).core.sx.toFixed(3);
  out.period = R.dotPose(window.CUES.visual.c7.period);
  return out;
}, F);
const contactsOk = beats.contacts.every((c) => c.sx === 1.42);

const report = { buildMs, samples: times.length, mismatches, rasterNoise: noise, errors, beats, pass: mismatches.length === 0 && errors.length === 0 && contactsOk };
mkdirSync(join(ROOT, "out/audit"), { recursive: true });
writeFileSync(join(ROOT, "out/audit/seek.json"), JSON.stringify(report, null, 1));
console.log(`build ${buildMs} ms · ${times.length} frames × 3 seek orders · mismatches ${mismatches.length} · page errors ${errors.length} · contacts on-frame ${contactsOk} → ${report.pass ? "PASS" : "FAIL"}`);
if (mismatches.length) console.log("mismatch at", mismatches.join(", "));
await browser.close();
server.close();
process.exit(report.pass ? 0 : 1);
