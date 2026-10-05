/**
 * check.mjs <lang>: rhythm, stillness, type size, determinism and loudness for the reel.
 * Writes out/check-<lang>.json and prints a summary. Uses the engine's shared rules (rhythm.mjs).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { equalTriples, isNearStill, NEAR_STILL } from "../../godevlevel-launch/engine/scripts/rhythm.mjs";
import { openReel } from "./render.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lang = process.argv[2] ?? "en";
const tl = JSON.parse(readFileSync(path.join(HERE, "timeline.json"), "utf8"));
const fps = tl.fps;
const B = tl.beats;
const R = { lang, provisional: tl.provisional, bpm: tl.bpm, frames: tl.frames, duration: +tl.duration.toFixed(3) };
const PASS = (x) => (x ? "PASS" : "FAIL");

// ---------- rhythm ----------
{
  const len = B.map((b) => b.frames);
  const eq = equalTriples(len);
  const part = (p) => B.filter((b) => b.part === p);
  const cuts = B.length - 1;
  const partB = part("B");
  const bFrames = partB.reduce((a, b) => a + b.frames, 0);
  const shapeOK = ["A", "B"].every((p) => part(p).every((b, i, a) => i === 0 || b.frames <= a[i - 1].frames));
  R.rhythm = {
    cards: B.map((b) => ({ card: b.card, part: b.part, target: b.targetFrames, frames: b.frames, sec: b.dur, cut: b.cut, snappedTo: b.snappedTo, snapErrorMs: b.snapErrorMs })),
    allHardCuts: B.every((b) => b.cut === "hard"),
    cutsPerMinute: +((cuts / tl.duration) * 60).toFixed(1),
    cutsPerMinuteBeforeLogo: +((cuts / (B.at(-1).startFrame / fps)) * 60).toFixed(1),
    partBCutsPerMinute: +((partB.length / (bFrames / fps)) * 60).toFixed(1),
    intervalCurve: {
      first: { card: 1, sec: B[0].dur },
      partBFirst: { card: partB[0].card, sec: partB[0].dur },
      partBLast: { card: partB.at(-1).card, sec: partB.at(-1).dur },
      acceleration: +(B[0].dur / partB.at(-1).dur).toFixed(2),
      seconds: B.map((b) => b.dur),
    },
    acceleratingShapeKept: shapeOK,
    acceleratingRuns: eq.runs.map(([a, b]) => [B[a].card, B[b].card]),
    equalTriplesAllowed: eq.allowed.map((t) => t.map((i) => B[i].card)),
    equalTriplesFailing: eq.failing.map((t) => t.map((i) => B[i].card)),
    logoCutOnDownbeat: { frame: B.at(-1).startFrame, sec: B.at(-1).start, musicStopsAt: tl.music.stopAt },
    maxSnapErrorMs: Math.max(...B.map((b) => Math.abs(b.snapErrorMs))),
  };
}

// ---------- render-based checks ----------
const s1 = await openReel(lang);
const rgba = async (pg, f, o = {}) => {
  const r = await pg.evaluate((f, o) => window.GDL.rgba(f, o), f, o);
  return { ...r, data: Buffer.from(r.b64, "base64") };
};
const hash = (b) => createHash("sha256").update(b).digest("hex");

// Type sizes (smallest word ~120 px; emphasis ~2.2× regular).
{
  const L = await s1.page.evaluate(() => window.GDL.layouts());
  const sizes = L.map((x) => ({ ...x, emphasis: B.find((b) => b.card === x.card).emphasis }));
  const regular = sizes.filter((x) => !x.emphasis).map((x) => x.size);
  const base = Math.max(...regular);
  R.type = {
    minSizePx: Math.min(...sizes.map((x) => x.size)),
    regularPx: [Math.min(...regular), base],
    emphasis: sizes.filter((x) => x.emphasis).map((x) => ({ card: x.card, text: x.text, size: x.size, lines: x.lines.length, ratio: +(x.size / base).toFixed(2) })),
    twoLineCards: sizes.filter((x) => x.lines.length > 1).map((x) => ({ card: x.card, lines: x.lines })),
    pass: Math.min(...sizes.map((x) => x.size)) >= 120 - 1e-6,
  };
}

// Measured near-stillness over the whole reel (0.25× scale, engine motion blur included).
{
  let prev = null, still = 0, n = 0;
  const per = Object.fromEntries(["A", "B", "C"].map((p) => [p, { still: 0, n: 0 }]));
  for (let f = 0; f < tl.frames; f++) {
    const r = await rgba(s1.page, f, { scale: 0.25 });
    if (prev) {
      const st = isNearStill(prev, r.data);
      const p = B.find((b) => f >= b.startFrame && f < b.endFrame).part;
      per[p].n++;
      n++;
      if (st) { still++; per[p].still++; }
    }
    prev = r.data;
  }
  R.stillness = {
    method: `frame-to-frame at 0.25×; near-still = <${NEAR_STILL.area * 100}% of pixels change by >${NEAR_STILL.level} levels`,
    nearStillPct: +((100 * still) / n).toFixed(1),
    byPart: Object.fromEntries(Object.entries(per).map(([p, v]) => [p, +((100 * v.still) / v.n).toFixed(1)])),
    target: "~70% (brief, from the reference)",
  };
}

// Determinism: every card's middle frame, every smear frame, every punch frame; same session + fresh browser.
{
  const frames = [...new Set([
    ...B.map((b) => Math.floor((b.startFrame + b.endFrame) / 2)),
    ...B.filter((b) => b.smear).flatMap((b) => [b.startFrame, b.startFrame + 1]),
    ...B.filter((b) => b.emphasis).map((b) => b.startFrame),
  ])].sort((a, b) => a - b);
  const first = {};
  for (const f of frames) first[f] = hash((await rgba(s1.page, f)).data);
  const again = [];
  for (const f of frames) again.push(hash((await rgba(s1.page, f)).data) === first[f]);
  await s1.close();
  const s2 = await openReel(lang);
  const fresh = [];
  for (const f of [...frames].reverse()) fresh.push(hash((await rgba(s2.page, f)).data) === first[f]);
  if (s1.errors.length || s2.errors.length) R.pageErrors = [...s1.errors, ...s2.errors];
  await s2.close();
  R.determinism = { frames: frames.length, sameSession: again.every(Boolean), freshBrowser: fresh.every(Boolean), pass: again.every(Boolean) && fresh.every(Boolean) };
}

// Loudness of the delivered MP4.
{
  const mp4 = path.join(HERE, "out", `reel-${lang}.mp4`);
  if (!existsSync(mp4)) R.loudness = { status: "no render yet" };
  else if (!tl.music.file) R.loudness = { status: "not measurable: no music yet (silent provisional render)", target: { I: -14, TP: -1 } };
  else {
    const e = execFileSync("ffmpeg", ["-hide_banner", "-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const out = e.toString();
    const sum = out.slice(out.lastIndexOf("Summary:"));
    const I = Number(sum.match(/I:\s+(-?[\d.]+) LUFS/)[1]), TP = Number(sum.match(/Peak:\s+(-?[\d.]+) dBFS/)[1]);
    R.loudness = { integratedLUFS: I, truePeakDBTP: TP, pass: Math.abs(I + 14) <= 1 && TP < -1 };
  }
}

// Reference comparison.
const refJson = path.join(HERE, "refs", "reference.measure.json");
R.reference = existsSync(refJson) ? JSON.parse(readFileSync(refJson, "utf8")) : { status: "no reference film in refs/ yet: comparison pending" };

writeFileSync(path.join(HERE, "out", `check-${lang}.json`), JSON.stringify(R, null, 2));
const Y = R.rhythm;
console.log(`CHECK reel-${lang} (${tl.provisional ? "PROVISIONAL " : ""}${tl.bpm} BPM, ${R.duration} s, ${R.frames} frames)`);
console.log(`cuts       ${Y.cutsPerMinute}/min overall · ${Y.cutsPerMinuteBeforeLogo}/min before the logo · Part B ${Y.partBCutsPerMinute}/min · all hard cuts ${PASS(Y.allHardCuts)}`);
console.log(`curve      card 1 ${Y.intervalCurve.first.sec} s → Part B ${Y.intervalCurve.partBFirst.sec} s → ${Y.intervalCurve.partBLast.sec} s (${Y.intervalCurve.acceleration}× faster) · shape kept ${PASS(Y.acceleratingShapeKept)}`);
console.log(`           lengths ${Y.cards.map((c) => c.frames).join(",")} (targets ${Y.cards.map((c) => c.target).join(",")})`);
console.log(`equal-3    allowed inside accelerating run ${JSON.stringify(Y.equalTriplesAllowed)} · failing ${JSON.stringify(Y.equalTriplesFailing)} ${PASS(!Y.equalTriplesFailing.length)}`);
console.log(`snap       max ${Y.maxSnapErrorMs} ms off grid · logo cut frame ${Y.logoCutOnDownbeat.frame} (${Y.logoCutOnDownbeat.sec} s) on a downbeat, music stops there`);
console.log(`type       min ${R.type.minSizePx} px ${PASS(R.type.pass)} · regular ${R.type.regularPx.join("–")} px · emphasis ${R.type.emphasis.map((e) => `${e.card} "${e.text}" ${e.size}px ×${e.ratio}`).join(" · ")}`);
console.log(`stillness  ${R.stillness.nearStillPct}% near-still (A ${R.stillness.byPart.A}%, B ${R.stillness.byPart.B}%, C ${R.stillness.byPart.C}%) · target ~70%`);
console.log(`determinism ${R.determinism.frames} frames · same session ${R.determinism.sameSession} · fresh browser ${R.determinism.freshBrowser} ${PASS(R.determinism.pass)}`);
console.log(`loudness   ${R.loudness.status ?? `${R.loudness.integratedLUFS} LUFS · TP ${R.loudness.truePeakDBTP} dBTP ${PASS(R.loudness.pass)}`}`);
console.log(`reference  ${R.reference.status ?? "see check json"}`);
if (R.pageErrors) console.log("page errors:", R.pageErrors);
