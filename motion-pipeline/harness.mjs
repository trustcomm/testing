import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer";

const ROOT = process.cwd();
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };

// One static server and one browser; open() gives a fresh page, so state never leaks between pages.
export async function start() {
  const server = http.createServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent(req.url.split("?")[0]));
      const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
      if (!file.startsWith(ROOT)) throw new Error("outside root");
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  }).listen(8080);
  // CHROME_PATH points at a specific Chrome/Chromium; unset, puppeteer uses its own.
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: process.getuid?.() === 0 ? ["--no-sandbox"] : [],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  async function open() {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("page error:", e.message));
    await page.goto("http://localhost:8080/index.html?render");
    await page.waitForFunction("window.READY === true", { timeout: 15000 });
    const { fps, duration } = await page.evaluate(() => ({ fps: window.FPS, duration: window.DURATION }));
    // frame i is drawn at t = i / fps: the harness never adds up deltas
    const png = async (i) => {
      const url = await page.evaluate((t) => { window.renderFrame(t); return document.getElementById("c").toDataURL("image/png"); }, i / fps);
      return Buffer.from(url.split(",")[1], "base64");
    };
    return { fps, duration, frames: Math.round(duration * fps), png };
  }
  return { open, close: async () => { await browser.close(); server.close(); } };
}
