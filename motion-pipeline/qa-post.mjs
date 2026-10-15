// A/B of the post chain: stills at t = 1 and t = 3 with post off and on -> qa/post_ab.png (2 x 2), a 2x crop of the
// headline's last word -> qa/post_zoom.png, and numbers for whether bloom washes out the text.
// "post off" is the composite alone (the 2D layer over the background shader). usage: node qa-post.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { start } from "./harness.mjs";

const TIMES = [1, 3], TW = 960, TH = 540, CAP = 30;
const { open, browser, close } = await start();
try {
  const v = await open();
  await mkdir("qa", { recursive: true });
  const shots = {};
  for (const t of TIMES) for (const on of [false, true]) {
    await v.setPost({ on });
    shots[`${t}-${on ? "on" : "off"}`] = "data:image/png;base64," + (await v.png(Math.round(t * v.fps))).toString("base64");
  }
  await v.setPost({ on: true });
  const box = await v.bright(Math.round(3 * v.fps));               // the headline, from the design layer
  console.log("headline bbox (design layer, t = 3):", JSON.stringify(box));

  // does bloom wash out the text? measured on the final frame, around the headline's text pixels
  const m = await v.page.evaluate((t) => {
    const lum = (d, o) => (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255;
    const grab = (on) => {
      window.POST.on = on; window.renderFrame(t);
      const tmp = document.createElement("canvas"); tmp.width = 1920; tmp.height = 1080;
      const g = tmp.getContext("2d", { willReadFrequently: true }); g.drawImage(document.getElementById("c"), 0, 0);
      return g.getImageData(0, 0, 1920, 1080).data;
    };
    const off = grab(false), on = grab(true);
    const L = window.LAYER.getContext("2d").getImageData(0, 0, 1920, 1080).data;       // the layer of the last renderFrame
    const text = new Uint8Array(1920 * 1080);
    let x0 = 1920, y0 = 1080, x1 = 0, y1 = 0;
    for (let y = 0; y < 1080; y++) for (let x = 0; x < 1920; x++) {
      const o = (y * 1920 + x) * 4;
      if (L[o + 3] > 250 && lum(L, o) > 0.55) { text[y * 1920 + x] = 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    // pixels within 8 px of text are "text edge"; the near background is what is within 60 px of the box but not that
    const R = 8, near = new Uint8Array(1920 * 1080), tmp = new Uint8Array(1920 * 1080);
    for (let y = y0 - R; y <= y1 + R; y++) for (let x = x0 - R; x <= x1 + R; x++) { let hit = 0; for (let dx = -R; dx <= R && !hit; dx++) hit = text[y * 1920 + x + dx]; tmp[y * 1920 + x] = hit; }
    for (let y = y0 - R; y <= y1 + R; y++) for (let x = x0 - R; x <= x1 + R; x++) { let hit = 0; for (let dy = -R; dy <= R && !hit; dy++) hit = tmp[(y + dy) * 1920 + x]; near[y * 1920 + x] = hit; }
    const stat = (d) => {
      let tS = 0, tN = 0, hS = 0, hN = 0, fS = 0, fN = 0;
      for (let y = y0 - 60; y <= y1 + 60; y++) for (let x = x0 - 60; x <= x1 + 60; x++) {
        const i = y * 1920 + x, o = i * 4;
        if (text[i]) { tS += lum(d, o); tN++; } else if (!near[i]) { hS += lum(d, o); hN++; }
      }
      for (let y = 20; y < 90; y++) for (let x = 0; x < 1920; x++) { fS += lum(d, (y * 1920 + x) * 4); fN++; }
      return { text: tS / tN, nearBackground: hS / hN, farBackground: fS / fN };
    };
    const a = stat(off), b = stat(on);
    return { off: a, on: b, bbox: [x0, y0, x1, y1],
      spill: (b.nearBackground - a.nearBackground) - (b.farBackground - a.farBackground),   // light bloom adds near the text, beyond what the grade does everywhere
      contrastOff: a.text / a.nearBackground, contrastOn: b.text / b.nearBackground };
  }, 3);
  console.log(JSON.stringify(m, (k, x) => (typeof x === "number" ? +x.toFixed(4) : x)));

  // the sheets, drawn onto canvases in the page
  const page = await browser.newPage();
  const sheets = await page.evaluate(async (shots, TIMES, TW, TH, CAP, box) => {
    const load = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
    const label = (g, s, x, y) => { g.fillStyle = "#e8e6e0"; g.font = "18px monospace"; g.textBaseline = "middle"; g.fillText(s, x + 10, y + 15); };
    const ab = document.createElement("canvas"); ab.width = 2 * TW; ab.height = TIMES.length * (TH + CAP);
    let g = ab.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, ab.width, ab.height); g.imageSmoothingQuality = "high";
    for (const [r, t] of TIMES.entries()) for (const [c, k] of ["off", "on"].entries()) {
      g.drawImage(await load(shots[`${t}-${k}`]), c * TW, r * (TH + CAP) + CAP, TW, TH);
      label(g, `t = ${t} s   post ${k}`, c * TW, r * (TH + CAP));
    }
    const x = Math.max(0, box.x1 - 700), y = Math.max(0, box.y0 - 70), w = 760, h = box.y1 - box.y0 + 140;
    const zm = document.createElement("canvas"); zm.width = w * 2; zm.height = 2 * (h * 2 + CAP);
    g = zm.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, zm.width, zm.height); g.imageSmoothingQuality = "high";
    for (const [r, k] of ["off", "on"].entries()) {
      g.drawImage(await load(shots[`3-${k}`]), x, y, w, h, 0, r * (h * 2 + CAP) + CAP, w * 2, h * 2);
      label(g, `t = 3 s   post ${k}   (2x crop)`, 0, r * (h * 2 + CAP));
    }
    return [ab.toDataURL("image/png"), zm.toDataURL("image/png")];
  }, shots, TIMES, TW, TH, CAP, box);
  await writeFile("qa/post_ab.png", Buffer.from(sheets[0].split(",")[1], "base64"));
  await writeFile("qa/post_zoom.png", Buffer.from(sheets[1].split(",")[1], "base64"));
  console.log("wrote qa/post_ab.png and qa/post_zoom.png");
} finally { await close(); }
