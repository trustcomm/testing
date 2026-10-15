// QA contact sheet for engine/particles.js: stills of the particles scene at the moments that matter (the dust alone,
// the burst as it goes off and as it falls, the confetti going up and coming down, the end), then the two looks the scene
// does not use: the GPU field (forced on over the scene's frames) and sparksFromGlyphs (drawn on a 2D canvas in the page).
// usage: node qa-particles.mjs [out png]
import { mkdir, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";
import s04 from "./scenes/s04_particles.js";
const outPath = process.argv[2] ?? "qa/particles_sheet.png";

const TW = 640, TH = 360, CAP = 30, COLS = 4;
const at = (u) => s04.start + u;
const picks = [
  { label: "motes alone  t=0.9", t: at(0.9) },
  { label: "odometer rolling  t=1.75", t: at(1.75) },
  { label: "burst  t=2.12", t: at(2.12) },
  { label: "burst  t=2.45", t: at(2.45) },
  { label: "burst fading  t=3.0", t: at(3.0) },
  { label: "confetti  t=3.55", t: at(3.55) },
  { label: "confetti  t=4.2", t: at(4.2) },
  { label: "confetti  t=5.0", t: at(5.0) },
  { label: "glParticles 40,000  t=1.0 (forced)", t: at(1.0), force: { n: 40000 } },
  { label: "glParticles, camera dx 400 z 0.3", t: at(1.0), force: { n: 40000, cam: { dx: 400, dy: 0, z: 0.3 } } },
  { label: "sparksFromGlyphs  t=0.62 (2D)", glyphs: 0.62 },
  { label: "sparksFromGlyphs  t=0.95 (2D)", glyphs: 0.95 },
];
const { open, browser, close } = await start();
try {
  const v = await open();
  await mkdir("frames/qa", { recursive: true }); await mkdir("qa", { recursive: true });
  const urls = [];
  for (const [n, p] of picks.entries()) {
    let png;
    if (p.glyphs !== undefined) {
      // the type module's scramble, and the sparks that leave each glyph as it locks, on a plain background
      const url = await v.page.evaluate(async (t) => {
        const [tk, ty, pa, lay] = await Promise.all(["/tokens.js", "/engine/type.js", "/engine/particles.js", "/engine/layout.js"].map((m) => import(m)));
        const T = tk.tokens, c = document.createElement("canvas"); c.width = T.W; c.height = T.H;
        const g = c.getContext("2d"); g.fillStyle = T.color.bg; g.fillRect(0, 0, T.W, T.H);
        const o = { t0: 0.5, dur: 0.6, text: "LOCKED", x: lay.grid.l, y: 640, role: "label", size: 120 };
        const { glyphs } = ty.layoutGlyphs(g, o.text, o.x, o.y, lay.fontFor("label", o.size), T.track.label * o.size);
        ty.scramble(g, t, o);
        pa.sparksFromGlyphs(g, t, glyphs, ty.lockTimes(glyphs.length, o), { lift: 45, n: 18 });
        return c.toDataURL("image/png");
      }, p.glyphs);
      png = Buffer.from(url.split(",")[1], "base64");
    } else {
      await v.page.evaluate((f) => { window.PARTICLES.force = f ?? {}; }, p.force);
      png = await v.png(Math.round(p.t * v.fps));
    }
    await writeFile(`frames/qa/particles-${n}.png`, png);
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
      g.fillText(picks[i].label, x + 10, y + CAP / 2);
      g.strokeStyle = "#333"; g.strokeRect(x + 0.5, y + 0.5, TW - 1, TH + CAP - 1);
    }
    return c.toDataURL("image/png");
  }, urls, picks, TW, TH, CAP, COLS);
  await writeFile(outPath, Buffer.from(sheet.split(",")[1], "base64"));
  console.log(`wrote ${outPath} (${picks.length} stills)`);
} finally { await close(); }
