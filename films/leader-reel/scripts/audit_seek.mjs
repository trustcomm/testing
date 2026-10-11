#!/usr/bin/env node
// Seek-determinism audit: every sampled frame must be pixel-identical whether the reel is rendered forward, backward or in
// random order (the fluid re-simulates on backward seeks; everything else is a pure function of t).
// Usage: node scripts/audit_seek.mjs  → build/audit-seek.json, exit 1 on mismatch
import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { join, dirname, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function findPuppeteer() {
  const c = [join(ROOT, "node_modules")];
  const npx = join(homedir(), ".npm/_npx");
  if (existsSync(npx)) for (const d of readdirSync(npx)) c.push(join(npx, d, "node_modules"));
  for (const nm of c) if (existsSync(join(nm, "puppeteer-core/package.json"))) return createRequire(join(nm, "x.js"))("puppeteer-core");
  throw new Error("puppeteer-core not found");
}
const puppeteer = findPuppeteer();
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".wav": "audio/wav", ".jpg": "image/jpeg", ".png": "image/png" };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(0);
const browser = await puppeteer.launch({ executablePath: process.env.PRODUCER_HEADLESS_SHELL_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", args: ["--no-sandbox", "--enable-unsafe-swiftshader"], protocolTimeout: 1800000 });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
for (let i = 0; !(await page.evaluate(() => !!window.__reel)); i++) { if (i > 600) throw new Error("no build"); await new Promise((r) => setTimeout(r, 200)); }
// frame-exact sample times (60 fps), several per world incl. both sides of every hand-off
const F = [0, 7, 30, 61, 105, 112, 113, 140, 190, 197, 225, 260, 300, 337, 338, 380, 430, 435, 436, 470, 520, 562, 563, 600, 640, 660, 661, 700, 760, 787, 788, 820, 870, 899];
const times = F.map((f) => f / 60);
async function hashAt(t) {
  return page.evaluate((t) => {
    window.__reel.renderAt(t);
    const gl = window.__reel.E.renderer.getContext();
    const px = new Uint8Array(1920 * 1080 * 4);
    gl.readPixels(0, 0, 1920, 1080, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // FNV-1a over a strided sample + full sum (cheap, order-sensitive)
    let h = 2166136261 >>> 0, sum = 0;
    for (let i = 0; i < px.length; i += 7) { h ^= px[i]; h = Math.imul(h, 16777619) >>> 0; sum += px[i]; }
    return h.toString(16) + ":" + sum;
  }, t);
}
const orders = { forward: [...times], backward: [...times].reverse(), random: [...times].map((t, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, t]).sort((a, b) => a[0] - b[0]).map((x) => x[1]) };
const res = {};
const t0 = Date.now();
for (const [name, list] of Object.entries(orders)) { res[name] = {}; for (const t of list) res[name][t.toFixed(4)] = await hashAt(t); console.log(name, "done", ((Date.now() - t0) / 1000).toFixed(0) + " s"); }
const bad = [];
for (const t of times) { const k = t.toFixed(4); const a = res.forward[k], b = res.backward[k], c = res.random[k]; if (a !== b || a !== c) bad.push({ t: k, forward: a, backward: b, random: c }); }
mkdirSync(join(ROOT, "build"), { recursive: true });
writeFileSync(join(ROOT, "build/audit-seek.json"), JSON.stringify({ frames: times.length, orders: Object.keys(orders), mismatches: bad }, null, 1));
console.log(`${times.length} frames × 3 orders: ${bad.length ? bad.length + " MISMATCH(ES)" : "all identical"}`);
if (bad.length) console.log(JSON.stringify(bad.slice(0, 8), null, 1));
await browser.close(); server.close();
process.exit(bad.length ? 1 : 0);
