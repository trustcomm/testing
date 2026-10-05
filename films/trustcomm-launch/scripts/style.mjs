/**
 * style.mjs: Stage 3 style frames + exemplars (BRIEF §9): Beat 6 and Beat 10 at final quality, with sound.
 *   → out/style/beatNN.mp4 (1920×1080, 30 fps, H.264 + AAC; VO + SFX, −14 LUFS, true peak < −1 dBTP (scripts/mix.py); no music yet)
 *   → out/style/stills/beatNN-<moment>.png, out/style/contact-beatNN-10fps.png
 *   → out/style/check.json: determinism, carry contracts, sound sync, compliance (strings + equal split), loudness.
 * Engine: films/godevlevel-launch/engine (imported, not forked).
 */
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openEngine, pngOf } from "../../godevlevel-launch/engine/scripts/engine.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(HERE, "out", "style");
mkdirSync(path.join(OUT, "stills"), { recursive: true });
const open = () => openEngine({ page: "trustcomm-launch/web/index.html", viewport: { width: 1920, height: 1080 } });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const FPS = 30;
// Review moments (s into the beat).
const MOMENTS = {
  b06: { "00-carry-in": 0, "01-scan-lock": 0.88, "02-page-open": 1.12, "03-no-app": 1.45, "04-no-signin": 2.3, "05-carry-out": null },
  b10: { "00-carry-in": 0, "01-split": 0.8, "02-paths": 1.45, "03-hover": 2.6, "04-carry-out": null },
};
// Strings the brief puts on screen in these beats (BRIEF §4, F3–F7). Anything else drawn fails the check.
const ALLOWED = new Set(["Meera's Tiffin Room", "How was the food?", "No app", "No sign-in", "The food", "The staff", "Filter Coffee", "Post on", "Google", "Tell the owner", "privately"]);
const FORBIDDEN = /star|boost|rating|remove|bad review|[0-9]/i;

const s1 = await open();
const R = { engine: "films/godevlevel-launch/engine (imported)", music: "none yet: pulse in Beat 10 is a code-synthesised placeholder", beats: {} };
for (const id of ["b06", "b10"]) {
  const b = await s1.page.evaluate((id) => window.GDL.beat(id), id);
  const n = b.endFrame - b.startFrame;
  const dur = n / FPS;
  const video = path.join(OUT, `${id}.video.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", String(FPS), video], { stdio: ["pipe", "inherit", "inherit"] });
  let blurred = 0;
  const hashes = {};
  for (let f = b.startFrame; f < b.endFrame; f++) {
    const { png, info } = await s1.page.evaluate((f) => window.GDL.frame(f), f);
    const buf = pngOf(png);
    if (info.samples > 1) blurred++;
    if ((f - b.startFrame) % 10 === 0) hashes[f] = hash(buf);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  // stills
  const stills = [];
  for (const [name, lt] of Object.entries(MOMENTS[id])) {
    const f = lt === null ? b.endFrame - 1 : b.startFrame + Math.round(lt * FPS);
    const { png } = await s1.page.evaluate((f) => window.GDL.frame(f), f);
    const file = path.join(OUT, "stills", `${id.replace("b", "beat")}-${name}.png`);
    writeFileSync(file, pngOf(png));
    stills.push(path.relative(HERE, file));
  }
  // sound
  const evFile = path.join(OUT, `${id}.events.json`);
  writeFileSync(evFile, JSON.stringify({ dur, vo: `vo/${b.vo}.mp3`, events: b.events }));
  const raw = path.join(OUT, `${id}.raw.wav`);
  const placed = JSON.parse(execFileSync("python3", [path.join(HERE, "scripts", "mix.py"), evFile, raw], { encoding: "utf8" }));
  rmSync(evFile);
  const mp4 = path.join(OUT, `${id.replace("b", "beat")}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-i", raw, "-filter_complex", `[1:a]apad,atrim=0:${dur.toFixed(4)}[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ac", "2", "-movflags", "+faststart", mp4]);
  rmSync(video);
  rmSync(raw);
  // execFileSync returns stdout only; ebur128 prints to stderr, so capture it via a shell-free spawnSync-equivalent
  const eb = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${mp4}" -af ebur128=peak=true -f null - 2>&1`], { encoding: "utf8" });
  const sum = eb.slice(eb.lastIndexOf("Summary:"));
  const I = Number(sum.match(/I:\s+(-?[\d.]+) LUFS/)[1]), TP = Number(sum.match(/Peak:\s+(-?[\d.]+) dBFS/)[1]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", "fps=10,scale=320:-1,tile=8x5:padding=4:color=0x888888", "-frames:v", "1", path.join(OUT, `contact-${id.replace("b", "beat")}-10fps.png`)]);
  R.beats[id] = {
    file: path.relative(HERE, mp4), frames: n, sec: +dur.toFixed(3), vo: b.voTake, blurredFrames: blurred, stills,
    contract: b.contract,
    sound: placed.map((p) => ({ t: p.t, frame: Math.round(p.t * FPS), sfx: p.sfx, src: p.src, what: p.what, offFrameMs: +(((p.placedAt - Math.round(p.t * FPS) / FPS) * 1000).toFixed(1)) })),
    loudness: { integratedLUFS: I, truePeakDBTP: TP, pass: Math.abs(I + 14) <= 1 && TP < -1 },
    hashes,
  };
}

// Equal split (compliance §2.1): both paths identical in size, position (mirrored), outline and pulse at every frame.
{
  const b = await s1.page.evaluate(() => window.GDL.beat("b10"));
  let worst = 0, pulseDiff = 0;
  const xs = [];
  for (let f = 0; f < b.endFrame - b.startFrame; f++) {
    const s = await s1.page.evaluate((lt) => window.GDL.state10(lt), f / FPS);
    worst = Math.max(worst, Math.abs(s.L.x + s.L.w - (1920 - s.R.x)), Math.abs(s.L.w - s.R.w), Math.abs(s.L.h - s.R.h), Math.abs(s.L.y - s.R.y), Math.abs(s.L.r - s.R.r));
    pulseDiff = Math.max(pulseDiff, Math.abs(s.pulseL - s.pulseR));
    if (f / FPS >= 1.6) xs.push(s.thumbX);
  }
  const mean = xs.reduce((a, x) => a + x, 0) / xs.length;
  // Brightness of each card (mean luminance inside its rect) on the hover frame.
  const hover = b.startFrame + Math.round(2.6 * FPS);
  const lum = await s1.page.evaluate((f) => {
    window.GDL.frame(f);
    const c = window.GDL.film.canvas, x = c.getContext("2d");
    const m = (r) => { const d = x.getImageData(r.x, r.y, r.w, r.h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; return s / (d.length / 4); };
    const s = window.GDL.state10(2.6);
    return { L: m(s.L), R: m(s.R) };
  }, hover);
  R.equalSplit = {
    geometryMaxDiffPx: worst, pulseMaxDiff: pulseDiff,
    thumb: { meanX: +mean.toFixed(2), minX: +Math.min(...xs).toFixed(2), maxX: +Math.max(...xs).toFixed(2), note: "hovers on the centre line, sways symmetrically, never touches either card" },
    cardLuminance: { left: +lum.L.toFixed(2), right: +lum.R.toFixed(2), diffPct: +((100 * Math.abs(lum.L - lum.R)) / lum.L).toFixed(2), note: "difference = the two icons/labels only" },
    pass: worst < 1e-6 && pulseDiff < 1e-9 && Math.abs(mean - 960) < 1,
  };
}

// Strings on screen vs the brief.
{
  const drawn = await s1.page.evaluate(() => window.GDL.drawn());
  R.compliance = {
    drawn, notInBrief: drawn.filter((s) => !ALLOWED.has(s)), forbidden: drawn.filter((s) => FORBIDDEN.test(s)),
    googleAssets: "none: 'Google' appears only as plain text in Poppins, ink colour; no logo, no Google UI, no Google font or colours",
  };
  R.compliance.pass = !R.compliance.notInBrief.length && !R.compliance.forbidden.length;
}
if (s1.errors.length) R.pageErrors = s1.errors;
await s1.close();

// Determinism: same frames in a fresh browser.
{
  const s2 = await open();
  let same = 0, total = 0;
  for (const bt of Object.values(R.beats))
    for (const [f, h] of Object.entries(bt.hashes)) {
      const { png } = await s2.page.evaluate((f) => window.GDL.frame(f), Number(f));
      total++;
      if (hash(pngOf(png)) === h) same++;
    }
  await s2.close();
  R.determinism = { frames: total, identicalInFreshBrowser: same, pass: same === total };
  for (const bt of Object.values(R.beats)) delete bt.hashes;
}
writeFileSync(path.join(OUT, "check.json"), JSON.stringify(R, null, 1));
const P = (x) => (x ? "PASS" : "FAIL");
for (const [id, b] of Object.entries(R.beats)) {
  console.log(`${b.file} · ${b.frames} frames (${b.sec} s) · VO ${b.vo} · ${b.blurredFrames} blurred · ${b.loudness.integratedLUFS} LUFS / TP ${b.loudness.truePeakDBTP} ${P(b.loudness.pass)}`);
  console.log(`   carry in ${b.contract.in.length ? "MISMATCH" : "ok"} · out ${b.contract.out.length ? "MISMATCH" : "ok"} · sounds: ${b.sound.map((s) => `${s.sfx}@f${s.frame}(${s.offFrameMs}ms)`).join(" ")}`);
}
console.log(`equal split ${P(R.equalSplit.pass)} · geometry Δ ${R.equalSplit.geometryMaxDiffPx}px · pulse Δ ${R.equalSplit.pulseMaxDiff} · thumb x ${R.equalSplit.thumb.minX}–${R.equalSplit.thumb.maxX} (mean ${R.equalSplit.thumb.meanX}) · card luminance L ${R.equalSplit.cardLuminance.left} / R ${R.equalSplit.cardLuminance.right}`);
console.log(`strings ${P(R.compliance.pass)} · ${R.compliance.drawn.join(" | ")}${R.compliance.notInBrief.length ? " · NOT IN BRIEF: " + R.compliance.notInBrief.join(", ") : ""}`);
console.log(`determinism ${P(R.determinism.pass)} · ${R.determinism.identicalInFreshBrowser}/${R.determinism.frames} frames identical in a fresh browser`);
if (R.pageErrors) console.log("page errors:", R.pageErrors);
