/**
 * check.mjs: continuity and rhythm checks. Writes out/check.json and prints a summary.
 *
 *  1. Timeline: beat-length spread (≥4×), no three equal beats in a row, planned stillness (~20%),
 *     every boundary has a named carry (or is marked "cut": "hard"), VO lines vs beat windows.
 *  2. Handoff contracts: each built beat's carry state at local 0 equals handoffIn, and at its end
 *     equals handoffOut (numeric, |Δ| ≤ 1e-6).
 *  3. Camera: one camera over film time; per-frame screen motion at every boundary vs its neighbours.
 *  4. Carry score per boundary with both sides built: last frame of A vs first frame of B, inside the
 *     handoff region: pixel similarity and carry-colour mask IoU.
 *  5. Determinism: frames rendered twice (same session and a fresh browser) hash identically.
 *  6. Measured near-stillness and motion-blur use over the built beats.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { openEngine, ROOT } from "./engine.mjs";
import { exemplarPlan } from "./render.mjs";
import { equalTriples } from "./rhythm.mjs";

const tl = JSON.parse(readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const report = { provisional: tl.provisional, bpm: tl.bpm, fps: tl.fps, duration: tl.duration };
const PASS = (b) => (b ? "PASS" : "FAIL");

// ---------- 1. timeline ----------
{
  const lens = tl.beats.map((b) => b.dur);
  const spread = Math.max(...lens) / Math.min(...lens);
  // Equal triples fail unless they sit inside an accelerating run (shared rule, scripts/rhythm.mjs).
  const eq = equalTriples(lens);
  const triples = eq.failing.map((tr) => tr.map((i) => tl.beats[i].id));
  const boundaries = tl.beats.slice(0, -1).map((b, i) => ({ from: b.id, to: tl.beats[i + 1].id, carry: b.carry, cut: b.cut }));
  const unnamed = boundaries.filter((x) => !x.carry && x.cut !== "hard");
  const spills = tl.beats.filter((b) => b.vo.start < b.start - 1e-9 || b.vo.end > b.end + 1e-9).map((b) => ({ beat: b.id, line: b.vo.line, vo: [b.vo.start, b.vo.end], beatWindow: [b.start, b.end] }));
  report.timeline = {
    lengths: Object.fromEntries(tl.beats.map((b) => [b.id, b.dur])),
    spread: +spread.toFixed(3),
    spreadPass: spread >= 4 - 1e-9,
    threeEqualInARow: triples,
    plannedStillSec: tl.planned.stillSec,
    plannedStillPct: tl.planned.stillPct,
    boundaries,
    unnamedBoundaries: unnamed,
    voSpills: spills,
  };
}

// ---------- open engine ----------
const s1 = await openEngine();
const { page } = s1;
const rgba = async (pg, f, opts = {}) => {
  const r = await pg.evaluate((f, o) => window.GDL.rgba(f, o), f, opts);
  return { ...r, data: Buffer.from(r.b64, "base64") };
};
const hash = (buf) => createHash("sha256").update(buf).digest("hex");

// ---------- 2. contracts ----------
report.contracts = (await page.evaluate(() => window.GDL.contracts())).map((c) => ({
  ...c,
  pass: c.built ? c.in.length === 0 && c.out.length === 0 : null,
}));

// ---------- 3. camera ----------
{
  const N = tl.frames;
  const cams = await page.evaluate((n, fps) => Array.from({ length: n + 1 }, (_, f) => window.GDL.camera(f / fps)), N, tl.fps);
  // Screen-space shift of a frame corner between consecutive frames (pan × zoom + zoom about centre).
  const d = (a, b) => Math.hypot((b.x - a.x) * b.z, (b.y - a.y) * b.z) + Math.abs(b.z - a.z) * Math.hypot(960, 540);
  const per = cams.slice(1).map((c, i) => d(cams[i], c)); // per[f-1] = motion from f-1 → f
  const atBoundary = tl.beats.slice(1).map((b) => {
    const f = b.startFrame;
    const here = per[f - 1];
    const around = Math.max(per[f - 2] ?? 0, per[f] ?? 0);
    return { boundary: `${tl.beats.find((x) => x.endFrame === f)?.id ?? "?"}→${b.id}`, frame: f, shiftPx: +here.toFixed(3), neighboursPx: +around.toFixed(3), jump: here > 1.5 * around + 0.5 };
  });
  report.camera = { maxShiftPxPerFrame: +Math.max(...per).toFixed(3), boundaries: atBoundary, pass: atBoundary.every((x) => !x.jump) };
}

// ---------- 4. carry scores ----------
const built = new Set(report.contracts.filter((c) => c.built).map((c) => c.id));
const ORANGE = [0xfd, 0x4b, 0x25], INK = [0xf5, 0xf3, 0xef];
report.carry = [];
for (let i = 0; i < tl.beats.length - 1; i++) {
  const A = tl.beats[i], B = tl.beats[i + 1];
  const row = { boundary: `${A.id}→${B.id}`, carry: A.carry, lastFrameA: B.startFrame - 1, firstFrameB: B.startFrame };
  if (!built.has(A.id) || !built.has(B.id)) {
    report.carry.push({ ...row, status: `pending (${[A, B].filter((x) => !built.has(x.id)).map((x) => x.id).join(", ")} not built)` });
    continue;
  }
  const fa = await rgba(page, B.startFrame - 1);
  const fb = await rgba(page, B.startFrame);
  const W = fa.w, H = fa.h;
  // Handoff region on screen (camera at B's first frame), padded.
  const cam = await page.evaluate((t) => window.GDL.camera(t), B.startFrame / tl.fps);
  const o = A.handoffOut, pad = 16;
  const sx = (x) => (x - cam.x) * cam.z + W / 2, sy = (y) => (y - cam.y) * cam.z + H / 2;
  const x0 = Math.max(0, Math.floor(sx(o.x) - pad)), x1 = Math.min(W, Math.ceil(sx(o.x + o.w) + pad));
  const y0 = Math.max(0, Math.floor(sy(o.y) - pad)), y1 = Math.min(H, Math.ceil(sy(o.y + o.h) + pad));
  const target = o.colour === "ink" ? INK : ORANGE;
  let diff = 0, n = 0, inter = 0, uni = 0, ma = 0, mb = 0;
  const near = (d, k) => Math.hypot(d[k] - target[0], d[k + 1] - target[1], d[k + 2] - target[2]) < 60;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const k = (y * W + x) * 4;
      diff += Math.abs(fa.data[k] - fb.data[k]) + Math.abs(fa.data[k + 1] - fb.data[k + 1]) + Math.abs(fa.data[k + 2] - fb.data[k + 2]);
      n += 3;
      const a = near(fa.data, k), b = near(fb.data, k);
      if (a) ma++;
      if (b) mb++;
      if (a && b) inter++;
      if (a || b) uni++;
    }
  let whole = 0;
  for (let k = 0; k < fa.data.length; k += 4) whole += Math.abs(fa.data[k] - fb.data[k]) + Math.abs(fa.data[k + 1] - fb.data[k + 1]) + Math.abs(fa.data[k + 2] - fb.data[k + 2]);
  const pixel = 1 - diff / n / 255;
  const iou = uni ? inter / uni : 1;
  report.carry.push({
    ...row,
    region: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    pixelScore: +pixel.toFixed(5),
    maskIoU: +iou.toFixed(5),
    maskPixels: [ma, mb],
    wholeFrameScore: +(1 - whole / (W * H * 3) / 255).toFixed(5),
    pass: pixel >= 0.98 && iou >= 0.95,
  });
}

// ---------- 5. determinism ----------
{
  const frames = [...new Set([...exemplarPlan().map(([, f]) => f), ...tl.beats.filter((b) => built.has(b.id)).map((b) => b.startFrame)])].sort((a, b) => a - b);
  const first = {};
  for (const f of frames) first[f] = hash((await rgba(page, f)).data);
  const sameSession = [];
  for (const f of frames) sameSession.push(hash((await rgba(page, f)).data) === first[f]);
  const s2 = await openEngine();
  const fresh = [];
  for (const f of [...frames].reverse()) fresh.push({ f, ok: hash((await rgba(s2.page, f)).data) === first[f] });
  await s2.close();
  report.determinism = {
    frames,
    sameSessionIdentical: sameSession.every(Boolean),
    freshBrowserIdentical: fresh.every((x) => x.ok),
    mismatches: fresh.filter((x) => !x.ok).map((x) => x.f),
    pass: sameSession.every(Boolean) && fresh.every((x) => x.ok),
  };
}

// ---------- 6. measured stillness + blur over built beats ----------
{
  const SCALE = 0.25, LEVEL = 8, AREA = 0.003; // near-still: < 0.3% of pixels change by more than 8 levels
  const per = [];
  for (const b of tl.beats.filter((x) => built.has(x.id))) {
    let prev = null, still = 0, frames = 0, blurred = 0, maxSpeed = 0;
    for (let f = b.startFrame; f < b.endFrame; f++) {
      const r = await rgba(page, f, { scale: SCALE });
      if (r.info.samples > 1) blurred++;
      maxSpeed = Math.max(maxSpeed, r.info.speed);
      if (prev) {
        let changed = 0;
        for (let k = 0; k < r.data.length; k += 4) if (Math.max(Math.abs(r.data[k] - prev[k]), Math.abs(r.data[k + 1] - prev[k + 1]), Math.abs(r.data[k + 2] - prev[k + 2])) > LEVEL) changed++;
        if (changed / (r.data.length / 4) < AREA) still++;
        frames++;
      }
      prev = r.data;
    }
    per.push({ beat: b.id, frames: frames + 1, nearStillPct: +((100 * still) / frames).toFixed(1), nearStillSec: +(still / tl.fps).toFixed(3), blurredFrames: blurred, maxSpeedPxPerFrame: +maxSpeed.toFixed(1) });
  }
  report.measured = { method: `frame-to-frame at ${SCALE}× scale; near-still = <${AREA * 100}% of pixels change by >${LEVEL} levels`, beats: per };
}

if (s1.errors.length) report.pageErrors = s1.errors;
await s1.close();
mkdirSync(path.join(ROOT, "out"), { recursive: true });
writeFileSync(path.join(ROOT, "out", "check.json"), JSON.stringify(report, null, 2));

// ---------- summary ----------
const T = report.timeline;
console.log(`CHECK (${tl.provisional ? "PROVISIONAL " : ""}${tl.bpm} BPM, ${tl.duration.toFixed(3)} s)`);
console.log(`timeline   spread ${T.spread}× ${PASS(T.spreadPass)} · three-equal-in-a-row ${T.threeEqualInARow.length ? JSON.stringify(T.threeEqualInARow) + " FAIL" : "none PASS"} · planned stillness ${T.plannedStillPct}% · unnamed boundaries ${T.unnamedBoundaries.length} ${PASS(!T.unnamedBoundaries.length)}`);
for (const s of T.voSpills) console.log(`           VO spill: ${s.line} ${s.vo.join("–")} vs ${s.beat} ${s.beatWindow.join("–")}`);
for (const c of report.contracts.filter((c) => c.built)) console.log(`contract   ${c.id} in ${c.in.length ? JSON.stringify(c.in) : "exact"} · out ${c.out.length ? JSON.stringify(c.out) : "exact"} ${PASS(c.pass)}`);
console.log(`camera     max ${report.camera.maxShiftPxPerFrame} px/frame · boundary jumps ${report.camera.boundaries.filter((x) => x.jump).length} ${PASS(report.camera.pass)}`);
for (const c of report.carry) console.log(`carry      ${c.boundary.padEnd(9)} ${c.status ?? `pixel ${c.pixelScore} · mask IoU ${c.maskIoU} · whole frame ${c.wholeFrameScore} ${PASS(c.pass)}`}`);
const D = report.determinism;
console.log(`determinism ${D.frames.length} frames · same session ${D.sameSessionIdentical} · fresh browser ${D.freshBrowserIdentical} ${PASS(D.pass)}`);
for (const m of report.measured.beats) console.log(`measured   ${m.beat} near-still ${m.nearStillPct}% (${m.nearStillSec} s) · blurred frames ${m.blurredFrames}/${m.frames} · max ${m.maxSpeedPxPerFrame} px/frame`);
if (report.pageErrors) console.log("page errors:", report.pageErrors);
