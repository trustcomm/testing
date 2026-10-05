// Shared: static server + headless Chromium page with the film loaded.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILM = path.resolve(ROOT, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
const CHROME = process.env.GDL_CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

function serve() {
  const srv = createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    // /engine/... → engine dir; /canva/... → film's canva dir (stills, when they land).
    const file = url.startsWith("/canva/") ? path.join(FILM, url) : path.join(ROOT, url);
    if (!file.startsWith(FILM)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

export async function openEngine() {
  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--disable-gpu", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text", "--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`http://127.0.0.1:${srv.address().port}/web/index.html`);
  const meta = await page.evaluate(() => window.GDL.ready);
  const close = async () => {
    await browser.close();
    srv.close();
  };
  return { page, meta, errors, close };
}

export const pngOf = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
