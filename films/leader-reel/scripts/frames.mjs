#!/usr/bin/env node
// Dev harness: render chosen times straight from the engine (no HyperFrames runtime) and save PNGs + a contact sheet.
// Usage: node scripts/frames.mjs --at 0.2,0.6,1.2 [--out build/frames/name] [--cols 3] [--scale 0.25]
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { join, dirname, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const times = (args.at || "0").split(",").map(Number);
const out = resolve(ROOT, args.out || "build/frames/latest");
mkdirSync(out, { recursive: true });

function findPuppeteer() {
  const c = [join(ROOT, "node_modules")];
  const npx = join(homedir(), ".npm/_npx");
  if (existsSync(npx)) for (const d of readdirSync(npx)) c.push(join(npx, d, "node_modules"));
  for (const nm of c) if (existsSync(join(nm, "puppeteer-core/package.json"))) return createRequire(join(nm, "x.js"))("puppeteer-core");
  throw new Error("puppeteer-core not found");
}
const puppeteer = findPuppeteer();
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".wav": "audio/wav", ".png": "image/png" };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;
const browser = await puppeteer.launch({
  executablePath: process.env.PRODUCER_HEADLESS_SHELL_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  protocolTimeout: 900000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text()); });
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "domcontentloaded" });
for (let i = 0; ; i++) {
  if (await page.evaluate(() => !!window.__reel)) break;
  if (i > 600) { console.error("build never finished:", errors.join("\n")); process.exit(2); }
  await new Promise((r) => setTimeout(r, 200));
}
console.log(`build ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const files = [];
for (const t of times) {
  const ms = await page.evaluate((t) => {
    const s = performance.now();
    window.__reel.renderAt(t);
    const gl = window.__reel.E.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return performance.now() - s;
  }, t);
  const f = join(out, `t${t.toFixed(3)}.png`);
  await page.screenshot({ path: f });
  files.push(f);
  console.log(`t=${t.toFixed(3)}  ${ms.toFixed(0)} ms`);
}
if (errors.length) console.log("page messages:\n" + [...new Set(errors)].slice(0, 20).join("\n"));
await browser.close();
server.close();
// contact sheet
const cols = Number(args.cols || 3), scale = Number(args.scale || 0.3);
execFileSync("python3", ["-I", join(ROOT, "scripts/sheet.py"), join(out, "sheet.jpg"), String(cols), String(scale), ...files], { stdio: "inherit" });
