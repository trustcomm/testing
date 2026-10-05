/**
 * animatic.mjs [en|hi]: Stage 4 — the full hero film at draft quality, with VO, SFX and the placeholder pulse bed.
 *   → out/animatic/animatic-<lang>.mp4 (1920×1080, 30 fps, H.264 + AAC, −14 LUFS / TP < −1 dBTP)
 *   → out/animatic/contact-<lang>-1fps.png (+ per-beat mid stills in out/animatic/stills/)
 *   → out/animatic/check-<lang>.json: carries, rhythm (shots, spread, accelerating runs, stillness), compliance
 *     (on-screen strings vs the approved copy; equal split), sound sync, VO fit, loudness, determinism.
 * Engine: films/godevlevel-launch/engine (imported, not forked).
 */
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openEngine, pngOf } from "../../godevlevel-launch/engine/scripts/engine.mjs";
import { equalTriples, isNearStill, NEAR_STILL } from "../../godevlevel-launch/engine/scripts/rhythm.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lang = process.argv[2] === "hi" ? "hi" : "en";
const OUT = path.join(HERE, "out", "animatic");
mkdirSync(path.join(OUT, "stills"), { recursive: true });
const open = () => openEngine({ page: `trustcomm-launch/web/index.html?lang=${lang}`, viewport: { width: 1920, height: 1080 } });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const P = (x) => (x ? "PASS" : "FAIL");

const s1 = await open();
const meta = await s1.page.evaluate(() => window.GDL.ready);
const FPS = meta.fps, N = meta.frames, DUR = N / FPS;
const beats = await s1.page.evaluate(() => window.GDL.beats());
const R = { lang, frames: N, seconds: +DUR.toFixed(3), engine: "films/godevlevel-launch/engine (imported)", music: "PLACEHOLDER: code-synthesised pulse bed on the 124 BPM grid" };

// ---------- render ----------
const video = path.join(OUT, `animatic-${lang}.video.mp4`);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", String(FPS), video], { stdio: ["pipe", "inherit", "inherit"] });
let blurred = 0;
const hashes = {};
const mids = new Set(beats.map((b) => Math.floor((b.startFrame + b.endFrame) / 2)));
for (let f = 0; f < N; f++) {
  const { png, info } = await s1.page.evaluate((f) => window.GDL.frame(f), f);
  const buf = pngOf(png);
  if (info.samples > 1) blurred++;
  if (mids.has(f)) {
    hashes[f] = hash(buf);
    const b = beats.find((x) => f >= x.startFrame && f < x.endFrame);
    writeFileSync(path.join(OUT, "stills", `${lang}-${b.id}-mid.png`), buf);
  }
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));

// ---------- sound ----------
const t0 = (b) => b.startFrame / FPS;
const events = beats.flatMap((b) => b.events.map((e) => ({ ...e, t: +(t0(b) + e.t).toFixed(5), beat: b.id })));
const at = (n) => t0(beats[n - 1]);
const end = DUR;
const hit = events.find((e) => e.beat === "b16" && e.sfx === "SFX10").t;
const pulse = [
  { t0: 0, t1: at(3), style: "sparse" }, { t0: at(3), t1: at(4), style: "low" }, { t0: at(4), t1: at(10), style: "full" },
  { t0: at(10), t1: at(13), style: "lift" }, { t0: at(13), t1: at(14), style: "thin" }, { t0: at(14), t1: at(16), style: "peak" },
  { t0: at(16), t1: end, style: "full", stop: hit },
];
const evFile = path.join(OUT, `${lang}.events.json`);
writeFileSync(evFile, JSON.stringify({ dur: DUR, vos: beats.map((b) => ({ file: `vo/${b.vo}.mp3`, t: b.voIn })), events, pulse }));
const raw = path.join(OUT, `${lang}.raw.wav`);
const placed = JSON.parse(execFileSync("python3", [path.join(HERE, "scripts", "mix.py"), evFile, raw], { encoding: "utf8", maxBuffer: 1 << 26 }));
rmSync(evFile);
const mp4 = path.join(OUT, `animatic-${lang}.mp4`);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-i", raw, "-filter_complex", `[1:a]apad,atrim=0:${DUR.toFixed(4)}[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ac", "2", "-movflags", "+faststart", mp4]);
rmSync(video);
rmSync(raw);
const eb = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${mp4}" -af ebur128=peak=true -f null - 2>&1`], { encoding: "utf8", maxBuffer: 1 << 26 });
const sum = eb.slice(eb.lastIndexOf("Summary:"));
const I = Number(sum.match(/I:\s+(-?[\d.]+) LUFS/)[1]), TP = Number(sum.match(/Peak:\s+(-?[\d.]+) dBFS/)[1]);
R.loudness = { integratedLUFS: I, truePeakDBTP: TP, pass: Math.abs(I + 14) <= 1 && TP < -1 };
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", "fps=1,scale=320:-1,tile=8x8:padding=4:color=0x888888", "-frames:v", "1", path.join(OUT, `contact-${lang}-1fps.png`)]);
R.sync = {
  events: placed.length,
  maxOffFrameMs: Math.max(...placed.map((p) => Math.abs(p.placedAt - Math.round(p.t * FPS) / FPS) * 1000)),
  list: placed.map((p) => ({ beat: p.beat, t: p.t, frame: Math.round(p.t * FPS), sfx: p.sfx, src: p.src, what: p.what })),
};
R.sync.pass = R.sync.maxOffFrameMs <= 1000 / FPS + 1e-6;

// ---------- carries ----------
R.carries = beats.slice(0, -1).map((b, i) => ({ boundary: `${b.id}→${beats[i + 1].id}`, carry: b.carryOut.kind, out: b.contract.out, in: beats[i + 1].contract.in }));
R.carriesPass = R.carries.every((c) => !c.out.length && !c.in.length);

// ---------- rhythm ----------
{
  const cutTimes = [...new Set([...beats.slice(1).map((b) => t0(b)), ...beats.flatMap((b) => b.cuts.map((c) => t0(b) + c))])].sort((a, b) => a - b);
  const edges = [0, ...cutTimes, DUR];
  const shots = edges.slice(1).map((t, i) => +(t - edges[i]).toFixed(3));
  const montage = (id) => { const b = beats.find((x) => x.id === id); return b.cuts.map((c, k) => +(c - (k ? b.cuts[k - 1] : 0)).toFixed(3)); };
  const eq = equalTriples(shots.map((s) => Math.round(s * FPS)));
  R.rhythm = {
    shots: shots.length, shortest: Math.min(...shots), longest: Math.max(...shots), spread: +(Math.max(...shots) / Math.min(...shots)).toFixed(1),
    cutsPerMinute: +((cutTimes.length / DUR) * 60).toFixed(1),
    beat8FlipGaps: montage("b08").slice(1), beat14Intervals: montage("b14"),
    equalTriplesFailing: eq.failing.length,
    target: "BRIEF §3: shortest ~0.24 s, longest ~3.9 s, spread ≥ 8×; Beats 8 and 14 accelerate ~0.97 → 0.24 s",
  };
  R.rhythm.spreadPass = R.rhythm.spread >= 8;
}
// stillness at 0.25×
{
  let prev = null, still = 0;
  const per = {};
  for (let f = 0; f < N; f++) {
    const r = await s1.page.evaluate((f) => window.GDL.rgba(f, { scale: 0.25 }), f);
    const d = Buffer.from(r.b64, "base64");
    if (prev) {
      const st = isNearStill(prev, d);
      const b = beats.find((x) => f >= x.startFrame && f < x.endFrame).id;
      per[b] = per[b] ?? [0, 0];
      per[b][1]++;
      if (st) { still++; per[b][0]++; }
    }
    prev = d;
  }
  R.stillness = {
    method: `frame-to-frame at 0.25×; near-still = <${NEAR_STILL.area * 100}% of pixels change by >${NEAR_STILL.level} levels`,
    pct: +((100 * still) / (N - 1)).toFixed(1), target: "~15% (BRIEF §3), pockets in Beats 3 and 13",
    byBeat: Object.fromEntries(Object.entries(per).map(([k, [s, n]]) => [k, +((100 * s) / n).toFixed(0)])),
  };
}

// ---------- compliance ----------
{
  const drawn = await s1.page.evaluate(() => window.GDL.drawn());
  // approved copy: BRIEF §4 film copy, the product's own screens (ui/demo-*), F8/F9, the shop types, the URL,
  // and the draft language-flip translations (flagged for client confirmation)
  const APPROVED = [
    "Meera's Tiffin Room", "No app", "No sign-in", "English", "Hinglish", "हिंदी", "ಕನ್ನಡ", "தமிழ்", "తెలుగు",
    "How was the food?", "Khana kaisa tha?", "खाना कैसा था?", "ಊಟ ಹೇಗಿತ್ತು?", "சாப்பாடு எப்படி இருந்தது?", "భోజనం ఎలా ఉంది?",
    "How was the service?", "Excellent", "What should the review mention?", "Pick only what you want mentioned. Nothing is ticked for you.",
    "The food", "How long it took", "The price", "How clean it was", "The staff", "The portions", "What did you have?", "Masala Dosa", "Filter Coffee", "Idli Vada", "Continue",
    "Where should your words go?", "You can do both, if you like.", "Straight to the owner", "On Google", "No, I'm done", "Privacy",
    "Only Meera's Tiffin Room reads it. Not posted anywhere.", "Anyone looking up Meera's Tiffin Room sees it.",
    "Here's a draft", "Filter coffee at Meera's Tiffin Room was absolutely wonderful and served steaming hot. The food tasted brilliant, and the staff brought everything to the table amazingly fast. Wonderful service made the whole meal even better.",
    "Filter coffee at Meera's Tiffin Room was wonderful and served steaming hot. The food tasted brilliant, and the staff brought everything to the table amazingly fast. Wonderful service made the whole meal even better.",
    "Change anything that doesn't sound like you. It goes out in your name.", "Try another", "Took a photo? Add it on Google — photos say a lot.", "Copy my words",
    "Your message to Meera's Tiffin Room", "The owner reads this personally. It isn't posted publicly.", "Send to owner",
    "The table by the door gets cold in the evening",
    "Tiffin room", "Salon", "Mobile shop", "Café", "Clinic", "Sweet shop",
    "14-day free trial", "No card needed", "₹699/month after", "trustcomm.app",
  ].join(" | ");
  // the Beat 11 word edit: every backspace state of the product's demo draft (the customer edits a word, F7)
  const DRAFT = "Filter coffee at Meera's Tiffin Room was absolutely wonderful and served steaming hot. The food tasted brilliant, and the staff brought everything to the table amazingly fast. Wonderful service made the whole meal even better.";
  const i0 = DRAFT.indexOf("absolutely ");
  const EDITS = Array.from({ length: 12 }, (_, k) => DRAFT.slice(0, i0) + "absolutely".slice(0, Math.max(0, 10 - k)) + (k >= 11 ? "" : " ") + DRAFT.slice(i0 + 11)).join(" | ");
  const clean = (s) => s.replace(/^✓ /, "");
  const notApproved = drawn.filter((s) => !APPROVED.includes(clean(s)) && !EDITS.includes(s));
  const forbidden = drawn.filter((s) => /star|boost|rating|remove|bad review|5-star|five star/i.test(s));
  const numbers = drawn.filter((s) => /[0-9]/.test(s) && !["14-day free trial", "₹699/month after"].includes(s));
  R.compliance = {
    strings: drawn.length, notApproved, forbidden, numbersOutsideLedger: numbers,
    googleAssets: "none: 'Google' appears only as plain text from the product's own copy; no Google logo, UI clone, font (Google Sans) or colour sequence",
    gating: "Beat 10 shows both paths equal; Beat 11 follows the Google path and Beat 12 the private path, one beat each; 'You can do both, if you like.' stays on screen through the split",
    reviewTexts: "only the product's own demo draft and the site's own private-note example are shown as words; every other review is placeholder lines (client approves review texts, BRIEF §10)",
  };
  R.compliance.pass = !notApproved.length && !forbidden.length && !numbers.length;
  // equal split (Beat 10)
  const b10 = beats.find((b) => b.id === "b10");
  let worst = 0, pulseDiff = 0;
  const xs = [];
  for (let f = 0; f < b10.endFrame - b10.startFrame; f++) {
    const s = await s1.page.evaluate((lt) => window.GDL.state10(lt), f / FPS);
    worst = Math.max(worst, Math.abs(s.L.w - s.R.w), Math.abs(s.L.h - s.R.h), Math.abs(s.L.r - s.R.r));
    if (s.landed) worst = Math.max(worst, Math.abs(s.L.x + s.L.w - (1920 - s.R.x)), Math.abs(s.L.y - s.R.y));
    pulseDiff = Math.max(pulseDiff, Math.abs(s.pulseL - s.pulseR));
    if (f / FPS >= 1.8 - 1e-9) xs.push(s.thumbX);
  }
  const mean = xs.reduce((a, x) => a + x, 0) / xs.length;
  R.equalSplit = { geometryMaxDiffPx: worst, pulseMaxDiff: pulseDiff, thumbMeanX: +mean.toFixed(2), pass: worst < 1e-6 && pulseDiff < 1e-9 && Math.abs(mean - 960) < 1 };
}
R.vo = beats.map((b) => ({ beat: b.id, take: b.voTake, fits: b.voFits, voIn: b.voIn, voOut: b.voOut }));
R.voPass = R.vo.every((v) => v.fits);
R.blurredFrames = blurred;
if (s1.errors.length) R.pageErrors = s1.errors;
await s1.close();

// ---------- determinism ----------
{
  const s2 = await open();
  let same = 0;
  for (const [f, h] of Object.entries(hashes)) {
    const { png } = await s2.page.evaluate((f) => window.GDL.frame(f), Number(f));
    if (hash(pngOf(png)) === h) same++;
  }
  await s2.close();
  R.determinism = { frames: Object.keys(hashes).length, identicalInFreshBrowser: same, pass: same === Object.keys(hashes).length };
}

writeFileSync(path.join(OUT, `check-${lang}.json`), JSON.stringify(R, null, 1));
const Y = R.rhythm;
console.log(`animatic-${lang}.mp4 · ${N} frames (${R.seconds} s) · ${blurred} blurred frames`);
console.log(`carries     ${R.carries.length} boundaries ${P(R.carriesPass)}`);
console.log(`rhythm      ${Y.shots} shots · shortest ${Y.shortest} s · longest ${Y.longest} s · spread ${Y.spread}× ${P(Y.spreadPass)} · ${Y.cutsPerMinute} cuts/min · equal triples failing ${Y.equalTriplesFailing}`);
console.log(`            Beat 8 flip gaps ${JSON.stringify(Y.beat8FlipGaps)} · Beat 14 intervals ${JSON.stringify(Y.beat14Intervals)}`);
console.log(`stillness   ${R.stillness.pct}% (target ~15%) · by beat ${JSON.stringify(R.stillness.byBeat)}`);
console.log(`compliance  ${R.compliance.strings} strings ${P(R.compliance.pass)}${R.compliance.notApproved.length ? " · NOT APPROVED: " + R.compliance.notApproved.join(" | ") : ""}${R.compliance.numbersOutsideLedger.length ? " · NUMBERS: " + R.compliance.numbersOutsideLedger.join(" | ") : ""}`);
console.log(`equal split ${P(R.equalSplit.pass)} · geometry Δ ${R.equalSplit.geometryMaxDiffPx} · pulse Δ ${R.equalSplit.pulseMaxDiff} · thumb mean x ${R.equalSplit.thumbMeanX}`);
console.log(`sound       ${R.sync.events} events · max ${R.sync.maxOffFrameMs.toFixed(1)} ms off frame ${P(R.sync.pass)}`);
console.log(`VO          ${R.vo.filter((v) => v.fits).length}/16 fit their beats ${P(R.voPass)}`);
console.log(`loudness    ${I} LUFS · TP ${TP} dBTP ${P(R.loudness.pass)}`);
console.log(`determinism ${R.determinism.identicalInFreshBrowser}/${R.determinism.frames} ${P(R.determinism.pass)}`);
if (R.pageErrors) console.log("page errors:", R.pageErrors);
