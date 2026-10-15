import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer";

const ROOT = process.cwd();
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };

const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split("?")[0]));
    const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
    if (!file.startsWith(ROOT)) throw new Error("outside root");
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(8080);

// CHROME_PATH points at a specific Chrome/Chromium; unset, puppeteer uses its own.
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: process.getuid?.() === 0 ? ["--no-sandbox"] : [],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:8080/index.html");
  await page.waitForFunction("window.READY === true");
  const url = await page.evaluate(() => { window.renderFrame(0); return document.getElementById("c").toDataURL("image/png"); });
  await writeFile("frames/f00000.png", Buffer.from(url.split(",")[1], "base64"));
  console.log("wrote frames/f00000.png");
} finally {
  await browser.close();
  server.close();
}
