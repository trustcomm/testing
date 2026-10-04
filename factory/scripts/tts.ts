/**
 * tts <slug>: one WAV per scene via ElevenLabs (only when meta.voice.engine = "elevenlabs").
 * Cache key = sha256(voiceId + settings + spoken text); spoken text = narration with meta.pronounce
 * respellings applied (voice only — captions keep the script words). Key from .env.
 * Provided audio always wins: with voice.engine = "manual" this step does nothing.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ffmpeg, filmDir, loadVideo, ROOT, slugArg } from "./lib";

const slug = slugArg();
const video = loadVideo(slug);
if (video.meta.voice.engine !== "elevenlabs") {
  console.log(`tts ${slug}: skipped (voice.engine = ${video.meta.voice.engine}; provided audio is used)`);
  process.exit(0);
}
const env = existsSync(path.join(ROOT, ".env")) ? readFileSync(path.join(ROOT, ".env"), "utf8") : "";
const key = process.env.ELEVENLABS_API_KEY ?? env.match(/^ELEVENLABS_API_KEY=(.*)$/m)?.[1]?.trim();
const voiceId = video.meta.voice.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? env.match(/^ELEVENLABS_VOICE_ID=(.*)$/m)?.[1]?.trim();
if (!key || !voiceId) throw new Error("ELEVENLABS_API_KEY and a voice id are required");
const settings = video.meta.voice.settings ?? {};
const cacheDir = path.join(filmDir(slug), "build", "tts-cache");
mkdirSync(cacheDir, { recursive: true });
mkdirSync(path.join(filmDir(slug), "audio"), { recursive: true });
let hit = 0, made = 0;
for (const s of video.scenes) {
  let spoken = s.narration;
  for (const [w, r] of Object.entries(video.meta.pronounce)) spoken = spoken.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), r);
  const h = createHash("sha256").update(JSON.stringify({ voiceId, settings, spoken })).digest("hex").slice(0, 16);
  const mp3 = path.join(cacheDir, `${h}.mp3`);
  if (existsSync(mp3)) hit++;
  else {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: spoken, model_id: (settings as any).model_id ?? "eleven_multilingual_v2", voice_settings: settings }),
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    made++;
  }
  ffmpeg(["-y", "-i", mp3, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s24le", path.join(filmDir(slug), "audio", `${s.id}.wav`)]);
}
console.log(`tts ${slug}: ${video.scenes.length} scenes · ${made} generated · ${hit} cached`);
