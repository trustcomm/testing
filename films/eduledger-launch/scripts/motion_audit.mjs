#!/usr/bin/env node
// MOTION_PHILOSOPHY §4 / §5 audit of web/index.html, measured in the browser (the parts a render can't show).
// Usage: node scripts/motion_audit.mjs            → out/audit/motion.json, exit 1 on a failed item
// Pairs with VERIFY.md, which adds what only the render shows (cut detection, contact sheet, loudness).
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, ".kit/package.json"));
const puppeteer = require("puppeteer-core");
const WEB = join(ROOT, "web");
const tl = JSON.parse(readFileSync(join(ROOT, "timeline.json"), "utf8"));
const FPS = tl.fps, END = tl.length_s;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".otf": "font/otf", ".woff2": "font/woff2", ".wav": "audio/wav", ".json": "application/json" };
const server = createServer((req, res) => {
  const p = join(WEB, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(WEB) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: process.env.PRODUCER_HEADLESS_SHELL_PATH || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

// deliberate holds: the brief's rest beats (Stage C: S07, S18, S22) and the CTA hold (S27)
const HOLDS = ["S07", "S18", "S22", "S27"];
const r = await page.evaluate(({ FPS, shots, holdShots }) => {
  const out = {};
  const main = window.__timelines.main;
  const root = document.querySelector("[data-composition-id]");
  out.timeline = { duration: +main.duration().toFixed(4), rootDuration: +root.getAttribute("data-duration") };
  // tween boundaries on the frame grid
  const f = 1 / FPS, off = (t) => Math.abs(t / f - Math.round(t / f)) * f * 1000;
  const tw = main.getChildren(false, true, false);
  const bad = tw.filter((t) => off(t.startTime()) > 0.5 || off(t.startTime() + t.duration()) > 0.5);
  out.frames = { tweens: tw.length, offFrame: bad.length };
  // reveal cadence: starts of discrete tweens (continuous drifts, twinkles and the stage layers excluded)
  // (a staggered tween reveals one element per stagger step, so each step counts)
  const starts = [];
  tw.filter((t) => t.duration() < 1.5 && !(t.repeat && t.repeat() !== 0)).forEach((t) => {
    const st = t.vars.stagger, n = t.targets().length;
    const each = st == null ? 0 : typeof st === "number" ? st : st.each ?? (st.amount ?? 0) / Math.max(1, n - 1);
    for (let i = 0; i < (st == null ? 1 : n); i++) starts.push(t.startTime() + i * each);
  });
  starts.sort((a, b) => a - b);
  const holds = Object.fromEntries(holdShots.map((id) => [id, [shots[id].start, shots[id].end]]));
  const inHold = (a, b) => Object.entries(holds).find(([, [h0, h1]]) => a >= h0 - 0.5 && b <= h1 + 0.05)?.[0];
  const gaps = [], held = [];
  for (let i = 1; i < starts.length; i++) {
    const a = starts[i - 1], b = starts[i];
    if (b - a > 1.0) (inHold(a, b) ? held : gaps).push([+a.toFixed(2), +b.toFixed(2), inHold(a, b) || ""]);
  }
  out.cadence = { discreteStarts: starts.length, gapsOver1s: gaps, inDeliberateHolds: held };
  // every text block: chrome gradient + halo, except text inside app/UI frames, cards and placeholder labels
  const UI = ".uiframe, #s20-card, #s22-card, .ph, .ph-ui, .demo-tag, #s20-cardnote, #s20-chip, #s27-btn, #s16-live, .chip";
  const texts = [];
  document.querySelectorAll("section.shot *").forEach((el) => {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!own) return;
    const shot = el.closest("section.shot").id;
    const ui = !!el.closest(UI);
    const cs = getComputedStyle(el);
    const chrome = /\btext\b/.test(cs.backgroundClip) || /\btext\b/.test(cs.webkitBackgroundClip);
    let halo = false;
    for (let a = el; a && a !== document.body; a = a.parentElement) if (/drop-shadow/.test(getComputedStyle(a).filter)) { halo = true; break; }
    texts.push({ shot, text: own.slice(0, 40), ui, chrome, halo });
  });
  out.text = { total: texts.length, ui: texts.filter((t) => t.ui).length,
    flat: texts.filter((t) => !t.ui && !(t.chrome && t.halo)) };
  // global texture layers present
  out.layers = Object.fromEntries(["grid-floor", "crosshairs", "grain", "vignette", "corners"].map((k) => {
    const sel = { "grid-floor": ".floor", crosshairs: ".cross", grain: "#grain", vignette: "#vignette", corners: "#corners" }[k];
    return [k, document.querySelectorAll(sel).length];
  }));
  return out;
}, { FPS, shots: Object.fromEntries(tl.shots.map((s) => [s.id, s])), holdShots: HOLDS });

// transitions: every cut has a motion transition (film.js TR map), none is a plain cut or fade
const film = readFileSync(join(WEB, "src/film.js"), "utf8");
const trBlock = film.slice(film.indexOf("const TR = {"), film.indexOf("};", film.indexOf("const TR = {")));
const TR = Object.fromEntries([...trBlock.matchAll(/(S\d+b?):\s*"(\w+)"/g)].map((m) => [m[1], m[2]]));
const cuts = tl.shots.slice(1).map((s) => s.id);
r.transitions = { cuts: cuts.length, withMotion: cuts.filter((c) => TR[c] && !/^(cut|fade)$/.test(TR[c])).length,
  kinds: [...new Set(Object.values(TR))] };
r.antipatterns = { mathRandom: /Math\.random\(/.test(film), dateNow: /Date\.now\(/.test(film),
  registryBlocks: /data-block|hyperframes add/.test(readFileSync(join(WEB, "index.html"), "utf8")) };
// pacing from the timeline
const dur = tl.shots.map((s) => s.dur);
const mid = tl.shots.filter((s) => s.start >= tl.music.landmarks.drop && s.start < tl.music.landmarks.break).map((s) => s.dur);
r.pacing = { shots: dur.length, avg: +(dur.reduce((a, b) => a + b) / dur.length).toFixed(2),
  midAvg: +(mid.reduce((a, b) => a + b) / mid.length).toFixed(2), outroHold: tl.shots.at(-1).dur,
  logoHold: tl.shots.find((s) => s.id === "S08").dur };

const items = [
  ["Avg scene length ≤ 2 s in the mid-section", r.pacing.midAvg <= 2, `${r.pacing.midAvg} s (drop → break), film avg ${r.pacing.avg} s`],
  ["No dead air > 1 s outside deliberate holds", r.cadence.gapsOver1s.length === 0,
    (r.cadence.gapsOver1s.length ? "gaps " + JSON.stringify(r.cadence.gapsOver1s) : `${r.cadence.discreteStarts} reveals, no gap > 1 s`) +
    `; inside holds (${HOLDS.join(", ")}): ` + JSON.stringify(r.cadence.inDeliberateHolds)],
  ["Every transition uses motion", r.transitions.withMotion === r.transitions.cuts, `${r.transitions.withMotion}/${r.transitions.cuts} cuts: ${r.transitions.kinds.join(", ")}`],
  ["Every text block: chrome gradient + halo", r.text.flat.length === 0, `${r.text.total - r.text.ui - r.text.flat.length}/${r.text.total - r.text.ui} kinetic/support blocks; ${r.text.ui} UI-frame texts exempt` + (r.text.flat.length ? `; flat: ${r.text.flat.map((t) => t.shot + " " + t.text).join(" | ")}` : "")],
  ["Grid + crosshairs, vignette + grain on every scene", Object.values(r.layers).every((n) => n > 0), JSON.stringify(r.layers) + " (global layers, above/below every shot)"],
  ["Outro holds 4+ s", r.pacing.outroHold >= 4, `CTA ${r.pacing.outroHold} s; logo S08 ${r.pacing.logoHold} s`],
  ["Timeline fills its slot (Law 11)", r.timeline.duration >= r.timeline.rootDuration - 1e-3, `main ${r.timeline.duration} s vs root data-duration ${r.timeline.rootDuration} s`],
  ["Tween ends snap to 1/60 s", r.frames.offFrame === 0, `${r.frames.tweens - r.frames.offFrame}/${r.frames.tweens} on frame boundaries`],
  ["§5 no Math.random / Date.now / registry blocks", !r.antipatterns.mathRandom && !r.antipatterns.dateNow && !r.antipatterns.registryBlocks, JSON.stringify(r.antipatterns)],
];
mkdirSync(join(ROOT, "out/audit"), { recursive: true });
writeFileSync(join(ROOT, "out/audit/motion.json"), JSON.stringify({ items: items.map(([k, ok, d]) => ({ item: k, ok, detail: d })), raw: r }, null, 1));
for (const [k, ok, d] of items) console.log(`${ok ? "✓" : "✗"} ${k} — ${d}`);
await browser.close();
server.close();
process.exit(items.every((i) => i[1]) ? 0 : 1);
