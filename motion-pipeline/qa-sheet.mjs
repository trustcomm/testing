// QA contact sheet for a scene with `statements`: one still at the middle of every entrance and of every hold, drawn onto
// one canvas (in the headless browser). Full-size stills go to frames/qa/.
// usage: node qa-sheet.mjs <scene module> <out png>   e.g. node qa-sheet.mjs ./scenes/s02_type_demo.js qa/type_sheet.png
import { mkdir, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";
const [, , scenePath = "./scenes/s02_type_demo.js", outPath = "qa/type_sheet.png"] = process.argv;
const demo = (await import(scenePath)).default;

const TW = 640, TH = 360, CAP = 30, COLS = 4;
const picks = demo.statements.flatMap((s) => [
  { id: s.id, what: "entrance", t: demo.start + (s.inStart + s.inDone) / 2 },
  { id: s.id, what: "hold", t: demo.start + (s.inDone + s.outStart) / 2 },
]);
const { open, browser, close } = await start();
try {
  const v = await open();
  await mkdir("frames/qa", { recursive: true }); await mkdir("qa", { recursive: true });
  const urls = [];
  for (const p of picks) {
    const png = await v.png(Math.round(p.t * v.fps));
    await writeFile(`frames/qa/${p.id}-${p.what}.png`, png);
    urls.push("data:image/png;base64," + png.toString("base64"));
  }
  const page = await browser.newPage();
  const sheet = await page.evaluate(async (urls, picks, TW, TH, CAP, COLS) => {
    const rows = Math.ceil(urls.length / COLS), c = document.createElement("canvas");
    c.width = COLS * TW; c.height = rows * (TH + CAP);
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high";
    for (let i = 0; i < urls.length; i++) {
      const img = new Image(); img.src = urls[i]; await img.decode();
      const x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + CAP);
      g.drawImage(img, x, y + CAP, TW, TH);
      g.fillStyle = "#e8e6e0"; g.font = "18px monospace"; g.textBaseline = "middle";
      g.fillText(`${picks[i].id}  ${picks[i].what}  t=${picks[i].t.toFixed(2)} s`, x + 10, y + CAP / 2);
      g.strokeStyle = "#333"; g.strokeRect(x + 0.5, y + 0.5, TW - 1, TH + CAP - 1);
    }
    return c.toDataURL("image/png");
  }, urls, picks, TW, TH, CAP, COLS);
  await writeFile(outPath, Buffer.from(sheet.split(",")[1], "base64"));
  console.log(`wrote ${outPath} (${picks.length} stills)`);
} finally { await close(); }
