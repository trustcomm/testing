/**
 * mix <slug> [--draft]
 *
 * 1. concat scene videos (-c copy) → build/video[-draft].mp4
 * 2. each scene's voice: lead silence + voice, padded to EXACTLY frames × (48000/fps) samples
 * 3. each scene's SFX (onWord / at), same exact length
 * 4. concat voice + sfx stems; music bed looped, ducked under the VOICE with sidechaincompress
 * 5. loudnorm I=-14 TP=-1.5 (two-pass), mux → build/film[-draft].mp4
 * 6. report.json: planned vs real length (FAIL if > 0.1 s apart), LUFS, true peak, per-scene data
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fingerprint } from "../src/engine/fingerprint";
import { findWordIndices } from "../src/engine/pace";
import { buildDir, ffmpeg, filmDir, loadVideo, probeDuration, ROOT, slugArg, type Timeline } from "./lib";

const slug = slugArg();
const DRAFT = process.argv.includes("--draft");
const video = loadVideo(slug);
const F = filmDir(slug);
const B = buildDir(slug);
const tl: Timeline = JSON.parse(readFileSync(path.join(B, "timeline.json"), "utf8"));
const SR = 48000;
const spf = SR / tl.fps; // samples per frame (1600 @ 30 fps)
const A = path.join(B, "audio");
mkdirSync(A, { recursive: true });
const suffix = DRAFT ? "-draft" : "";
const remotionVersion = JSON.parse(readFileSync(path.join(ROOT, "node_modules/remotion/package.json"), "utf8")).version;
const meta = { width: video.meta.width, height: video.meta.height, fps: video.meta.fps, captions: video.meta.captions, channelName: video.meta.channelName };
const sceneById = Object.fromEntries(video.scenes.map((s) => [s.id, s]));

// 1. video concat
const sceneDir = path.join(B, DRAFT ? "scenes-draft" : "scenes");
const vlist = tl.scenes.map((ts) => {
  const fp = fingerprint(ROOT, { scene: sceneById[ts.id], frames: ts.frames, words: ts.words, prevTheme: ts.prevTheme, meta, variant: DRAFT ? "draft" : "final", remotionVersion }).hash;
  const f = path.join(sceneDir, `${ts.id}.${fp}.mp4`);
  if (!existsSync(f)) throw new Error(`missing render for ${ts.id} (${path.basename(f)}) — run render${DRAFT ? " --draft" : ""} first`);
  return f;
});
writeFileSync(path.join(B, "concat-video.txt"), vlist.map((f) => `file '${f}'`).join("\n"));
const videoOut = path.join(B, `video${suffix}.mp4`);
ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", path.join(B, "concat-video.txt"), "-c", "copy", videoOut]);
console.log(`mix: video concat ${tl.scenes.length} scenes -c copy → ${path.relative(F, videoOut)}`);

// 2–3. per-scene voice + sfx, exact length
const sfxFile = (n: string) => {
  const p = path.join(ROOT, "public", "sfx", `${n}.wav`);
  if (!existsSync(p)) throw new Error(`missing sfx ${p}`);
  return p;
};
const sfxLog: string[] = [];
const voiceList: string[] = [];
const sfxList: string[] = [];
for (const ts of tl.scenes) {
  const n = ts.frames * spf;
  const leadMs = Math.round(ts.lead * 1000);
  const vOut = path.join(A, `${ts.id}.voice.wav`);
  ffmpeg(["-y", "-i", path.join(F, ts.audio), "-af", `aresample=${SR},adelay=${leadMs}:all=1,apad,atrim=end_sample=${n}`, "-ac", "1", "-c:a", "pcm_s24le", vOut]);
  voiceList.push(vOut);

  const s = sceneById[ts.id];
  const scriptWords = (s.captions ?? s.narration).split(/\s+/).filter(Boolean);
  const inputs: string[] = ["-f", "lavfi", "-t", String(n / SR), "-i", `anullsrc=r=${SR}:cl=mono`];
  const parts: string[] = [];
  (s.sfx ?? []).forEach((fx, k) => {
    let at = fx.at ?? 0;
    if (fx.onWord) {
      const [i] = findWordIndices(scriptWords, [fx.onWord]);
      at = ts.words[i].start;
    }
    inputs.push("-i", sfxFile(fx.name));
    parts.push(`[${k + 1}:a]aresample=${SR},aformat=channel_layouts=mono,volume=${fx.gain},adelay=${Math.round(at * 1000)}:all=1[f${k}]`);
    sfxLog.push(`${ts.id} ${fx.name} @ ${at.toFixed(3)} s (scene) / ${(ts.start + at).toFixed(3)} s (film) gain ${fx.gain}`);
  });
  const sOut = path.join(A, `${ts.id}.sfx.wav`);
  const mixIn = ["[0:a]", ...parts.map((_, k) => `[f${k}]`)].join("");
  const graph = [...parts, `${mixIn}amix=inputs=${parts.length + 1}:normalize=0:duration=first,apad,atrim=end_sample=${n}[o]`].join(";");
  ffmpeg(["-y", ...inputs, "-filter_complex", graph, "-map", "[o]", "-ac", "1", "-c:a", "pcm_s24le", sOut]);
  sfxList.push(sOut);
}
const concatAudio = (list: string[], out: string) => {
  writeFileSync(out + ".txt", list.map((f) => `file '${f}'`).join("\n"));
  ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", out + ".txt", "-c", "copy", out]);
};
const voiceAll = path.join(A, "voice.wav");
const sfxAll = path.join(A, "sfx.wav");
concatAudio(voiceList, voiceAll);
concatAudio(sfxList, sfxAll);
const totalSamples = tl.totalFrames * spf;
const vSamples = Math.round(probeDuration(voiceAll) * SR);
console.log(`mix: scene audio padded to frame length · voice ${vSamples} samples (planned ${totalSamples}) · ${sfxLog.length} sfx cues`);
for (const l of sfxLog) console.log(`  sfx ${l}`);

// 4–5. music ducked under voice, loudnorm two-pass, mux
const musicPath = path.join(ROOT, "public", video.meta.music?.file ?? "music/bed.wav");
const musicGain = video.meta.music?.gainDb ?? -24;
const T = (tl.totalFrames / tl.fps).toFixed(4);
const pre =
  `[0:a]aformat=channel_layouts=mono,asplit=2[v][key];` +
  `[2:a]aresample=${SR},aformat=channel_layouts=mono,atrim=0:${T},volume=${musicGain}dB[m];` +
  `[m][key]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=350:makeup=1[duck];` +
  `[v][1:a][duck]amix=inputs=3:normalize=0:duration=first[mx]`;
const ins = ["-i", voiceAll, "-i", sfxAll, "-stream_loop", "-1", "-i", musicPath];
const measure = ffmpeg(["-y", ...ins, "-filter_complex", `${pre};[mx]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]`, "-map", "[o]", "-f", "null", "-"]);
const js = JSON.parse(measure.slice(measure.lastIndexOf("{"), measure.lastIndexOf("}") + 1));
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
const master = path.join(A, `master${suffix}.wav`);
ffmpeg(["-y", ...ins, "-filter_complex", `${pre};[mx]${ln},aresample=${SR},atrim=end_sample=${totalSamples}[o]`, "-map", "[o]", "-ac", "2", "-c:a", "pcm_s24le", master]);
const filmOut = path.join(B, `film${suffix}.mp4`);
ffmpeg(["-y", "-i", videoOut, "-i", master, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", filmOut]);

// 6. report
const probe = (file: string, sel: string) =>
  Number(
    JSON.parse(
      execFileSync("ffprobe", ["-v", "error", "-select_streams", sel, "-show_entries", "stream=duration", "-of", "json", file], { encoding: "utf8" }),
    ).streams[0].duration,
  );
const vDur = probe(filmOut, "v:0");
const aDur = probe(filmOut, "a:0");
const planned = tl.totalFrames / tl.fps;
const ebu = ffmpeg(["-i", filmOut, "-af", "ebur128=peak=true", "-f", "null", "-"]);
const sum = ebu.slice(ebu.lastIndexOf("Summary:"));
const lufs = Number(sum.match(/I:\s+(-?[\d.]+) LUFS/)![1]);
const lra = Number(sum.match(/LRA:\s+(-?[\d.]+) LU/)![1]);
const tp = Number(sum.match(/Peak:\s+(-?[\d.]+) dBFS/)![1]);
const dv = Math.abs(vDur - planned);
const da = Math.abs(aDur - planned);
const pass = dv <= 0.1 && da <= 0.1;
const report = {
  slug,
  variant: DRAFT ? "draft" : "final",
  output: path.relative(F, filmOut),
  length: { plannedSec: +planned.toFixed(4), plannedFrames: tl.totalFrames, videoSec: +vDur.toFixed(4), audioSec: +aDur.toFixed(4), deltaVideoSec: +dv.toFixed(4), deltaAudioSec: +da.toFixed(4), toleranceSec: 0.1, pass },
  loudness: { integratedLUFS: lufs, truePeakDBFS: tp, LRA: lra, target: { I: -14, TP: -1.5 } },
  scenes: tl.scenes.map((s) => ({ id: s.id, type: s.type, start: s.start, frames: s.frames, voiceDur: s.voiceDur, tail: s.tail, tailExtended: s.tailExtended, align: s.alignMethod })),
  sfx: sfxLog,
  music: { file: path.relative(ROOT, musicPath), gainDb: musicGain, ducking: "sidechaincompress threshold=0.015 ratio=8 attack=15ms release=350ms (key = voice)", placeholder: true },
  alignment: [...new Set(tl.scenes.map((s) => s.alignMethod))],
};
writeFileSync(path.join(B, `report${suffix}.json`), JSON.stringify(report, null, 2));
console.log(
  `mix ${slug}${DRAFT ? " --draft" : ""}: ${pass ? "PASS" : "FAIL"} · planned ${planned.toFixed(3)} s · video ${vDur.toFixed(3)} s (Δ ${dv.toFixed(3)}) · audio ${aDur.toFixed(3)} s (Δ ${da.toFixed(3)}) · ${lufs} LUFS · TP ${tp} dBFS → ${path.relative(F, filmOut)}`,
);
process.exit(pass ? 0 : 1);
