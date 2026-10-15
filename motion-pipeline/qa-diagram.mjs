// QA for the diagram: the still at scene time 4 s, and a 200 % zoom of one prop (a crop upscaled 2x on a canvas).
// usage: node qa-diagram.mjs [x y w h]   (default: the laptop)  ->  qa/diagram_t4.png, qa/diagram_zoom.png
import { mkdir, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";
import diagram from "./scenes/s03_diagram.js";

const [x, y, w, h] = process.argv.length >= 6 ? process.argv.slice(2, 6).map(Number) : [760, 330, 400, 340];
const { open, browser, close } = await start();
try {
  const v = await open();
  await mkdir("qa", { recursive: true });
  const png = await v.png(Math.round((diagram.start + 4) * v.fps));
  await writeFile("qa/diagram_t4.png", png);
  const page = await browser.newPage();
  const zoom = await page.evaluate(async (url, x, y, w, h) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
    g.drawImage(img, x, y, w, h, 0, 0, w * 2, h * 2);
    return c.toDataURL("image/png");
  }, "data:image/png;base64," + png.toString("base64"), x, y, w, h);
  await writeFile("qa/diagram_zoom.png", Buffer.from(zoom.split(",")[1], "base64"));
  console.log(`wrote qa/diagram_t4.png and qa/diagram_zoom.png (crop ${x},${y} ${w}x${h} at 200%)`);
} finally { await close(); }
