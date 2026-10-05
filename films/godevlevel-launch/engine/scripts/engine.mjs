// Shared: static server + headless Chromium page with the film loaded.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILM = path.resolve(ROOT, "..");
// The server is rooted at films/ so other films can import this engine by URL (no copies).
export const FILMS = path.resolve(FILM, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
const CHROME = process.env.GDL_CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

function serve() {
  const srv = createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.join(FILMS, url);
    if (!file.startsWith(FILMS + path.sep)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/**
 * Open a film page in headless Chromium.
 * page: path under films/ (default: this launch film). viewport: page size (canvas size is set by the film).
 */
export async function openEngine({ page: pagePath = "godevlevel-launch/engine/web/index.html", viewport = { width: 1920, height: 1080 } } = {}) {
  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--disable-gpu", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text", "--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`http://127.0.0.1:${srv.address().port}/${pagePath}`);
  const meta = await page.evaluate(() => window.GDL.ready);
  const close = async () => {
    await browser.close();
    srv.close();
  };
  return { page, meta, errors, close };
}

export const pngOf = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
