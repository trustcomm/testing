/**
 * render <slug> [--draft] [--stills] [--only s030] [--workers 2]
 *
 * One MP4 per scene: build/scenes[-draft]/<id>.<fingerprint>.mp4. If the file exists it is skipped
 * (cache). Each render writes <id>.<fp>.tmp.mp4 and is renamed on success. --draft renders at half
 * size (960×540). --stills writes a contact sheet of each scene's mid-voice frame instead.
 * All scenes share one encoder config so `concat -c copy` is safe.
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fingerprint } from "../src/engine/fingerprint";
import { buildDir, loadVideo, ROOT, slugArg, type Timeline } from "./lib";

const slug = slugArg();
const argv = process.argv;
const DRAFT = argv.includes("--draft");
const STILLS = argv.includes("--stills");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const WORKERS = argv.includes("--workers") ? Number(argv[argv.indexOf("--workers") + 1]) : 2;
const variant = DRAFT ? "draft" : "final";
const browserExecutable = process.env.REMOTION_BROWSER || null;

const video = loadVideo(slug);
const B = buildDir(slug);
const tl: Timeline = JSON.parse(readFileSync(path.join(B, "timeline.json"), "utf8"));
const remotionVersion = JSON.parse(readFileSync(path.join(ROOT, "node_modules/remotion/package.json"), "utf8")).version;
const outDir = path.join(B, DRAFT ? "scenes-draft" : "scenes");
mkdirSync(outDir, { recursive: true });

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const sceneById = Object.fromEntries(video.scenes.map((s) => [s.id, s]));
const meta = { width: video.meta.width, height: video.meta.height, fps: video.meta.fps, captions: video.meta.captions, channelName: video.meta.channelName };

const jobs = tl.scenes
  .filter((ts) => !ONLY || ts.id === ONLY)
  .map((ts) => {
    const scene = sceneById[ts.id];
    const fp = fingerprint(ROOT, { scene, frames: ts.frames, words: ts.words, prevTheme: ts.prevTheme, meta, variant, remotionVersion });
    const inputProps = { scene, words: ts.words, durationInFrames: ts.frames, prevTheme: ts.prevTheme, channelName: video.meta.channelName, showCaptions: video.meta.captions };
    return { ts, fp: fp.hash, file: path.join(outDir, `${ts.id}.${fp.hash}.mp4`), inputProps };
  });

if (STILLS) {
  const files: string[] = [];
  for (const j of jobs) {
    const composition = await selectComposition({ serveUrl, id: "Scene", inputProps: j.inputProps, browserExecutable });
    const w = j.ts.words;
    const frame = Math.min(j.ts.frames - 8, Math.round(((w[0].start + w[w.length - 1].end) / 2) * tl.fps));
    const file = path.join(B, "stills", `${j.ts.id}.png`);
    mkdirSync(path.dirname(file), { recursive: true });
    await renderStill({ composition, serveUrl, output: file, frame, inputProps: j.inputProps, browserExecutable, imageFormat: "png", scale: DRAFT ? 0.5 : 1 });
    files.push(file);
    console.log(`still ${j.ts.id} frame ${frame}`);
  }
  execFileSync("python3", [path.join(ROOT, "scripts/contact-sheet.py"), path.join(B, "stills", "contact.png"), ...files], { stdio: "inherit" });
  process.exit(0);
}

let rendered = 0;
let skipped = 0;
const queue = [...jobs];
const worker = async () => {
  for (let j = queue.shift(); j; j = queue.shift()) {
    if (existsSync(j.file)) {
      skipped++;
      console.log(`skip   ${j.ts.id} ${j.fp} (cached)`);
      continue;
    }
    // remove stale renders of this scene (older fingerprints)
    for (const f of readdirSync(outDir)) if (f.startsWith(`${j.ts.id}.`) && f !== path.basename(j.file)) rmSync(path.join(outDir, f));
    const tmp = j.file.replace(/\.mp4$/, ".tmp.mp4");
    const t = Date.now();
    const composition = await selectComposition({ serveUrl, id: "Scene", inputProps: j.inputProps, browserExecutable });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: tmp,
      inputProps: j.inputProps,
      browserExecutable,
      scale: DRAFT ? 0.5 : 1,
      crf: DRAFT ? 23 : 17,
      pixelFormat: "yuv420p",
      x264Preset: DRAFT ? "veryfast" : "medium",
      muted: true,
      enforceAudioTrack: false,
      concurrency: 2,
      imageFormat: "jpeg",
      jpegQuality: DRAFT ? 85 : 95,
      logLevel: "error",
    });
    renameSync(tmp, j.file);
    rendered++;
    console.log(`render ${j.ts.id} ${j.fp} · ${j.ts.frames} f · ${((Date.now() - t) / 1000).toFixed(1)} s`);
  }
};
await Promise.all(Array.from({ length: Math.max(1, WORKERS) }, worker));
console.log(`render ${slug}${DRAFT ? " --draft" : ""}: ${jobs.length} scenes · ${rendered} rendered · ${skipped} cached · ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(ROOT, outDir)}`);
