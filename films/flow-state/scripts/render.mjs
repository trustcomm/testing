#!/usr/bin/env node
// Flow State — capture. Serves the project locally, drives headless Chromium workers and pipes frames into ffmpeg.
// Every frame is window.renderFrame(f): a pure function of the frame number, so workers can render in any order.
//
//   node scripts/render.mjs frames 0,66,144,... [--out build/frames]          PNG stills (contact sheets)
//   node scripts/render.mjs video [--workers 3] [--crf 16] [--preset slow]     H.264 picture (no sound) → build/picture.mp4
//   node scripts/render.mjs textcheck                                          how long each text line is fully legible
//                                 [--from 0] [--to 1824] [--out build/picture.mp4]
//
// Needs puppeteer-core (local node_modules, $PUPPETEER_CORE, or the npx cache) and a Chromium headless shell ($CHROME_PATH
// or /opt/pw-browsers/chromium_headless_shell-*).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

function findPuppeteer() {
  if (process.env.PUPPETEER_CORE) return process.env.PUPPETEER_CORE;
  const local = path.join(ROOT, "node_modules", "puppeteer-core");
  if (fs.existsSync(local)) return local;
  const npx = path.join(os.homedir(), ".npm", "_npx");
  for (const d of fs.existsSync(npx) ? fs.readdirSync(npx) : []) {
    const p = path.join(npx, d, "node_modules", "puppeteer-core");
    if (fs.existsSync(p)) return p;
  }
  throw new Error("puppeteer-core not found: npm i puppeteer-core, or set PUPPETEER_CORE");
}
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = "/opt/pw-browsers";
  for (const d of fs.existsSync(base) ? fs.readdirSync(base).sort().reverse() : []) {
    const p = path.join(base, d, "chrome-linux", "headless_shell");
    if (d.startsWith("chromium_headless_shell") && fs.existsSync(p)) return p;
  }
  throw new Error("Chromium headless shell not found: set CHROME_PATH");
}

const argv = process.argv.slice(2);
const mode = argv[0];
const opt = (name, def) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 ? argv[i + 1] : def;
};
if (mode !== "frames" && mode !== "video" && mode !== "textcheck") {
  console.error("usage: render.mjs frames <f,f,...> [--out dir] | video [--workers n] [--crf q] [--preset p] [--from f] [--to f] [--out file]");
  process.exit(2);
}

const puppeteer = require(findPuppeteer());
const CHROME = findChrome();

// ---- static server (project root only)
const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const p = path.normalize(path.join(ROOT, u === "/" ? "index.html" : u));
  if (!p.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(p, (e, b) => {
    if (e) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(b);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const PAGE_URL = `http://127.0.0.1:${server.address().port}/index.html`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openWorker() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "shell",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none", "--mute-audio"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warn") console.error("[page]", m.text());
  });
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(PAGE_URL, { waitUntil: "load" });
  // poll (not requestAnimationFrame) for readiness: rAF can stall in a headless page
  for (let i = 0; ; i++) {
    const s = await page.evaluate(() => (window.READY ? "ok" : window.READY_ERROR || ""));
    if (s === "ok") break;
    if (s) throw new Error("page failed to initialise: " + s);
    if (i > 600) throw new Error("page did not become ready");
    await sleep(100);
  }
  return { browser, page };
}
async function frame(page, f) {
  await page.evaluate((n) => {
    window.renderFrame(n);
  }, f);
  return page.screenshot({ type: "png", optimizeForSpeed: true });
}

const t0 = Date.now();
if (mode === "textcheck") {
  // a line is legible while every one of its glyphs is at ≥ 90 % opacity
  const w = await openWorker();
  const rows = await w.page.evaluate(() => {
    const out = {};
    for (let f = 0; f < window.FILM.TL.TOTAL; f++) {
      const a = window.FILM.textAlpha(f);
      for (const id in a) (out[id] = out[id] || []).push([f, a[id]]);
    }
    return out;
  });
  await w.browser.close();
  const res = Object.entries(rows).map(([id, v]) => {
    const ok = v.filter(([, a]) => a >= 0.9).map(([f]) => f);
    return { id, legible_from: ok[0], legible_to: ok[ok.length - 1], legible_s: +((ok.length / 60).toFixed(2)) };
  });
  fs.writeFileSync(path.join(ROOT, "build", "text_check.json"), JSON.stringify(res, null, 1));
  for (const r of res) console.log(`${r.id}: legible ${r.legible_s} s (frames ${r.legible_from}–${r.legible_to})`);
  console.log(`shortest: ${Math.min(...res.map((r) => r.legible_s))} s`);
} else if (mode === "frames") {
  const list = (argv[1] || "")
    .split(",")
    .filter(Boolean)
    .map((s) => parseInt(s, 10));
  const outDir = path.resolve(ROOT, opt("out", "build/frames"));
  fs.mkdirSync(outDir, { recursive: true });
  const nw = Math.max(1, Math.min(parseInt(opt("workers", "3"), 10), list.length));
  const workers = await Promise.all(Array.from({ length: nw }, openWorker));
  let k = 0;
  await Promise.all(
    workers.map(async (w) => {
      while (k < list.length) {
        const f = list[k++];
        const ts = Date.now();
        const buf = await frame(w.page, f);
        fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4, "0")}.png`), buf);
        if (argv.includes("--timing")) console.log(`f${f}: ${Date.now() - ts} ms`);
      }
    }),
  );
  await Promise.all(workers.map((w) => w.browser.close()));
  console.log(`${list.length} frames → ${path.relative(ROOT, outDir)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
} else {
  const TL = require(path.join(ROOT, "src", "timeline.js"));
  const FROM = parseInt(opt("from", "0"), 10), TO = parseInt(opt("to", String(TL.TOTAL)), 10);
  const out = path.resolve(ROOT, opt("out", "build/picture.mp4"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "image2pipe", "-framerate", "60", "-c:v", "png", "-i", "-",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p",
      "-c:v", "libx264", "-preset", opt("preset", "slow"), "-crf", opt("crf", "16"),
      "-profile:v", "high", "-level:v", "4.2", "-g", "120", "-x264-params", "aq-mode=3:aq-strength=0.85",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      "-movflags", "+faststart", out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))));
  const nw = Math.max(1, parseInt(opt("workers", "3"), 10));
  const workers = await Promise.all(Array.from({ length: nw }, openWorker));
  // frames come back out of order; a small reorder buffer feeds ffmpeg strictly in sequence
  const pending = new Map();
  let next = FROM, written = FROM, flushing = false;
  async function flush() {
    if (flushing) return;
    flushing = true;
    while (pending.has(written)) {
      const b = pending.get(written);
      pending.delete(written);
      written++;
      if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once("drain", r));
      if (written % 120 === 0 || written === TO) {
        const s = (Date.now() - t0) / 1000;
        console.log(`frame ${written}/${TO}  ${(((written - FROM) / s) || 0).toFixed(2)} fps  ${s.toFixed(0)} s`);
      }
    }
    flushing = false;
  }
  await Promise.all(
    workers.map(async (w) => {
      while (next < TO) {
        while (pending.size > 24) await sleep(20);
        const f = next++;
        pending.set(f, await frame(w.page, f));
        await flush();
      }
    }),
  );
  await flush();
  ff.stdin.end();
  await ffDone;
  await Promise.all(workers.map((w) => w.browser.close()));
  console.log(`${TO - FROM} frames → ${path.relative(ROOT, out)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
server.close();
