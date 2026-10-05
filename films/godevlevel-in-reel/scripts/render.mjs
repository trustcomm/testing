/**
 * render.mjs <lang: en|hi> [--font Archivo|"Inter Tight"]
 *   → out/reel-<lang>.mp4 (1080×1920, 30 fps, H.264 + AAC)
 *     music: canva/music/reel.wav from timeline.music.trackOffset, stopped dead at the logo cut,
 *     loudnorm to −14 LUFS / −1.5 dBTP (two-pass). No track yet → silent AAC track (PROVISIONAL).
 *   → out/contact-<lang>-4fps.png, out/stills/<lang>-card{03,05,22,24}.png (+ card03/05/22 punch frames)
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openEngine, pngOf } from "../../godevlevel-launch/engine/scripts/engine.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lang = process.argv[2] ?? "en";
const font = process.argv.includes("--font") ? process.argv[process.argv.indexOf("--font") + 1] : "Archivo";
const tl = JSON.parse(readFileSync(path.join(HERE, "timeline.json"), "utf8"));
const OUT = path.join(HERE, "out");
mkdirSync(path.join(OUT, "stills"), { recursive: true });

export const openReel = (lang, font = "Archivo") =>
  openEngine({ page: `godevlevel-in-reel/web/index.html?lang=${lang}&font=${encodeURIComponent(font)}`, viewport: { width: 1080, height: 1920 } });

async function main() {
  const { page, errors, close } = await openReel(lang, font);
  const silent = path.join(OUT, `reel-${lang}.video.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(tl.fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", String(tl.fps), silent], { stdio: ["pipe", "inherit", "inherit"] });
  let blurred = 0;
  for (let f = 0; f < tl.frames; f++) {
    const { png, info } = await page.evaluate((f) => window.GDL.frame(f), f);
    if (info.samples > 1) blurred++;
    if (!ff.stdin.write(pngOf(png))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));

  // Stills: cards 3, 5, 22, 24 at mid-card, plus the punch frame (first frame) of the emphasis cards.
  const stills = [];
  for (const n of [3, 5, 22, 24]) {
    const b = tl.beats.find((x) => x.card === n);
    const frames = [["", Math.floor((b.startFrame + b.endFrame) / 2)]];
    if (b.emphasis) frames.push(["-punch", b.startFrame]);
    for (const [tag, f] of frames) {
      const { png } = await page.evaluate((f) => window.GDL.frame(f), f);
      const file = path.join(OUT, "stills", `${lang}-card${String(n).padStart(2, "0")}${tag}.png`);
      writeFileSync(file, pngOf(png));
      stills.push(path.relative(HERE, file));
    }
  }
  // Smear frames (first two frames of each smear card) for review.
  for (const b of tl.beats.filter((x) => x.smear)) {
    for (const k of [0, 1]) {
      const { png } = await page.evaluate((f) => window.GDL.frame(f), b.startFrame + k);
      writeFileSync(path.join(OUT, "stills", `${lang}-card${String(b.card).padStart(2, "0")}-smear${k}.png`), pngOf(png));
    }
  }
  const layouts = await page.evaluate(() => window.GDL.layouts());
  writeFileSync(path.join(OUT, `layouts-${lang}.json`), JSON.stringify(layouts, null, 1));
  if (errors.length) console.log("page errors:", errors);
  await close();

  // Audio.
  const out = path.join(OUT, `reel-${lang}.mp4`);
  const T = tl.frames / tl.fps;
  const music = tl.music.file && existsSync(path.join(HERE, tl.music.file)) ? path.join(HERE, tl.music.file) : null;
  let audioNote;
  if (music) {
    const stop = tl.music.stopAt;
    const pre = `[1:a]atrim=start=${tl.music.trackOffset}:duration=${stop},asetpts=N/SR/TB,aresample=48000,apad,atrim=0:${T.toFixed(4)}`;
    const meas = execFileSync("ffmpeg", ["-hide_banner", "-i", silent, "-i", music, "-filter_complex", `${pre},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[a]`, "-map", "[a]", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).toString();
    const err = meas || "";
    const js = JSON.parse(err.slice(err.lastIndexOf("{"), err.lastIndexOf("}") + 1));
    const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
    // Music stops dead at the logo cut: hard trim, then silence (no fade).
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", music, "-filter_complex", `[1:a]atrim=start=${tl.music.trackOffset}:duration=${stop},asetpts=N/SR/TB,${ln},aresample=48000,apad,atrim=0:${T.toFixed(4)}[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ac", "2", "-movflags", "+faststart", out]);
    audioNote = `music from ${tl.music.file} @ ${tl.music.trackOffset} s, stops at ${stop} s`;
  } else {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-f", "lavfi", "-t", T.toFixed(4), "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out]);
    audioNote = "SILENT (no Canva track yet)";
  }
  rmSync(silent);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", out, "-vf", "fps=4,scale=216:-1,tile=8x6:padding=4:color=0x1b1d22", "-frames:v", "1", path.join(OUT, `contact-${lang}-4fps.png`)]);
  console.log(`reel-${lang}.mp4 · ${tl.frames} frames (${T.toFixed(3)} s) · ${blurred} blurred frames · font ${font} · audio: ${audioNote} · stills: ${stills.join(", ")}`);
}
if (process.argv[1] && process.argv[1].endsWith("render.mjs")) await main();
