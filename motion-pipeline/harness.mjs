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
  // WebGL2 needs a GPU path in headless Chrome: --ignore-gpu-blocklist everywhere, ANGLE on Metal on macOS, and SwiftShader
  // (software) as the fallback on Linux, where a render box often has no GPU.
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: [
      "--ignore-gpu-blocklist",
      ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
      ...(process.platform === "linux" ? ["--enable-unsafe-swiftshader"] : []),
      ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []),
    ],
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
    // bounding box of the bright pixels (the ink and the accent, not the dim label) of the design layer in frame i
    const bright = (i) => page.evaluate((t) => {
      window.renderLayer(t);
      const { data, width, height } = window.LAYER.getContext("2d").getImageData(0, 0, 1920, 1080);   // the design layer, before post
      let x0 = width, y0 = height, x1 = -1, y1 = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        if (data[o] * 0.3 + data[o + 1] * 0.59 + data[o + 2] * 0.11 > 150) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      return x1 < 0 ? null : { x0, y0, x1, y1 };
    }, i / fps);
    // draw frame i without exporting it (the GL work is queued); layer(i) draws only the 2D design layer
    const draw = (i) => page.evaluate((t) => window.renderFrame(t), i / fps);
    const layerDraw = (i) => page.evaluate((t) => window.renderLayer(t), i / fps);
    // SHA-256 of the design layer's pixels at frame i
    const layerHash = (i) => page.evaluate(async (t) => {
      window.renderLayer(t);
      const { data } = window.LAYER.getContext("2d").getImageData(0, 0, 1920, 1080);
      return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map((b) => b.toString(16).padStart(2, "0")).join("");
    }, i / fps);
    const setPost = (o) => page.evaluate((o) => Object.assign(window.POST, o), o);
    return { fps, duration, frames: Math.round(duration * fps), png, bright, page, setPost, draw, layerDraw, layerHash };
  }
  return { open, browser, close: async () => { await browser.close(); server.close(); } };
}
