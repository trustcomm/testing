// Frame-by-frame capture: serves this folder over http, drives window.renderFrame(t) in
// headless Chrome, and writes frames/f%05d.png. `--stills` writes one PNG per card to stills/.
import http from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const STILLS = process.argv.includes("--stills");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".woff2": "font/woff2" };

const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

// Uses puppeteer's own Chrome unless CHROME_PATH points at another build.
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--no-sandbox", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
await page.waitForFunction("window.READY === true", { timeout: 30000 });

const { duration, fps, stills } = await page.evaluate(() => ({
  duration: window.DURATION, fps: window.FPS, stills: window.CARD_STILLS,
}));

const grab = (t) =>
  page.evaluate((t) => {
    window.renderFrame(t);
    return document.getElementById("c").toDataURL("image/png");
  }, t);
const save = (file, dataUrl) => writeFile(file, Buffer.from(dataUrl.split(",")[1], "base64"));

if (STILLS) {
  await mkdir(join(ROOT, "stills"), { recursive: true });
  for (const [i, t] of stills.entries()) {
    await save(join(ROOT, "stills", `card_${i + 1}.png`), await grab(t));
    console.log(`still card_${i + 1}.png @ ${t.toFixed(2)}s`);
  }
} else {
  await rm(join(ROOT, "frames"), { recursive: true, force: true });
  await mkdir(join(ROOT, "frames"), { recursive: true });
  const total = Math.round(duration * fps);
  for (let i = 0; i < total; i++) {
    await save(join(ROOT, "frames", `f${String(i).padStart(5, "0")}.png`), await grab(i / fps));
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  console.log(`done: ${total} frames, ${duration.toFixed(2)} s`);
}

await browser.close();
server.close();
