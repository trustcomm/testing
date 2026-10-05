/**
 * render.mjs
 *   stills              exemplar stills (entrance / hold / exit per built beat, both 4→5 boundary frames,
 *                       plus one fast-move frame per beat to show motion blur) → out/stills/*.png
 *   video <beats> <out> render a beat range to MP4 with the VO lines laid in, e.g. `video b04-b05 out/b04-b05.mp4`
 */
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { openEngine, pngOf, ROOT } from "./engine.mjs";

const tl = JSON.parse(readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const beat = (id) => tl.beats.find((b) => b.id === id);
const fr = (t) => Math.round(t * tl.fps);
const [cmd, ...args] = process.argv.slice(2);

export function exemplarPlan() {
  const b1 = beat("b01"), b4 = beat("b04"), b5 = beat("b05"), b8 = beat("b08");
  return [
    ["b01-1-entrance", b1.startFrame],
    ["b01-2-motion", fr(1.42)],
    ["b01-3-hold", fr(1.75)],
    ["b01-4-exit", b1.endFrame - 1],
    ["b04-1-entrance", b4.startFrame + 3],
    ["b04-2-hold", fr(7.9)],
    ["b04-3-exit", b4.endFrame - 1],
    ["b05-1-entrance", b5.startFrame],
    ["b05-2-motion", b5.startFrame + 4],
    ["b05-3-typing", fr(9.9)],
    ["b05-4-hold", fr(11.0)],
    ["b05-5-exit", b5.endFrame - 1],
    ["b08-1-entrance", b8.startFrame],
    ["b08-2-motion", fr(19.2)],
    ["b08-3-hold", fr(20.05)],
    ["b08-4-exit", b8.endFrame - 1],
  ];
}

async function stills() {
  const dir = path.join(ROOT, "out", "stills");
  mkdirSync(dir, { recursive: true });
  const { page, errors, close } = await openEngine();
  const log = [];
  for (const [name, f] of exemplarPlan()) {
    const { png, info } = await page.evaluate((f) => window.GDL.frame(f), f);
    writeFileSync(path.join(dir, `${name}.png`), pngOf(png));
    log.push({ name, ...info });
    console.log(`${name.padEnd(16)} frame ${String(f).padStart(3)}  t=${info.t.toFixed(3)} s  ${info.beat}  speed ${info.speed.toFixed(1)} px/f  blur samples ${info.samples}`);
  }
  // 4→5 boundary pair.
  const b5 = beat("b05");
  for (const [name, f] of [["boundary-b04-last", b5.startFrame - 1], ["boundary-b05-first", b5.startFrame]]) {
    const { png, info } = await page.evaluate((f) => window.GDL.frame(f), f);
    writeFileSync(path.join(dir, `${name}.png`), pngOf(png));
    log.push({ name, ...info });
    console.log(`${name.padEnd(19)} frame ${f}  t=${info.t.toFixed(3)} s  ${info.beat}`);
  }
  writeFileSync(path.join(dir, "stills.json"), JSON.stringify(log, null, 2));
  if (errors.length) console.log("page errors:", errors);
  await close();
}

async function video(range, out) {
  const [a, b] = range.split("-").map(beat);
  const f0 = a.startFrame, f1 = (b ?? a).endFrame;
  const { page, errors, close } = await openEngine();
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const silent = path.resolve(out).replace(/\.mp4$/, ".video.mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(tl.fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", silent], { stdio: ["pipe", "inherit", "inherit"] });
  let blurred = 0;
  for (let f = f0; f < f1; f++) {
    const { png, info } = await page.evaluate((f) => window.GDL.frame(f), f);
    if (info.samples > 1) blurred++;
    if (!ff.stdin.write(pngOf(png))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  // Lay the VO lines for these beats at their timeline positions (relative to the range start).
  const t0 = f0 / tl.fps;
  const lines = tl.beats.filter((x) => x.startFrame >= f0 && x.startFrame < f1).map((x) => x.vo);
  const vo = path.resolve(ROOT, "..", tl.vo.file);
  const inputs = lines.flatMap((l) => ["-ss", String(l.src[0]), "-to", String(l.src[1]), "-i", vo]);
  const parts = lines.map((l, i) => `[${i + 1}:a]adelay=${Math.round((l.start - t0) * 1000)}:all=1[a${i}]`);
  const graph = `${parts.join(";")};${lines.map((_, i) => `[a${i}]`).join("")}amix=inputs=${lines.length}:normalize=0,apad,atrim=0:${((f1 - f0) / tl.fps).toFixed(4)}[a]`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, ...inputs, "-filter_complex", graph, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", path.resolve(out)]);
  execFileSync("rm", ["-f", silent]);
  console.log(`video ${range}: frames ${f0}–${f1 - 1} (${((f1 - f0) / tl.fps).toFixed(3)} s), ${blurred} motion-blurred frames → ${out}`);
  if (errors.length) console.log("page errors:", errors);
  await close();
}

if (cmd === "stills") await stills();
else if (cmd === "video") await video(args[0], args[1]);
else if (cmd) {
  console.error("usage: render.mjs stills | video <bXX[-bYY]> <out.mp4>");
  process.exit(1);
}
