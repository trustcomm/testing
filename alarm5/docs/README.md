# Iss hafte 5 alarm: 9:16 Hinglish countdown reel

Remotion + TypeScript, 1080x1920, 60 fps, 88.367 s (voice-over 87.562 s + 0.4 s in front + 0.4 s after). The whole film is one virtual camera moving over a 5400 x 9600 world with five stations
(#5 bank, #4 package, #3 server city, #2 phone, #1 PHP core); a beacon on each goes red -> green.

## Layout

| Path | What |
|---|---|
| `scripts/script.py`, `align.py`, `pron.py`, `timings.py` | the narration (the single source), forced alignment against `public/vo.mp3` (Whisper / ElevenLabs were not reachable from the build machine), refinement -> `src/timings.json` (284 words) |
| `src/anchors.ts` | time comes from words: `fw(w("S5", "chor"))` is the frame a word starts on |
| `src/cues/s01.ts` ... `s15.ts` | per scene: anchor frames, camera keys, punches, sound events, QA anchors, hero frame |
| `src/timeline.ts` | the single source of truth: aggregates the cue modules (scenes, camera, sfx, beacons, music) |
| `src/camera.ts`, `camlib.ts`, `world.tsx` | the virtual camera (log-space scale, FLY-TO / PULL / DOLLY-THROUGH / REVERSE-DOLLY / ORBIT, sentence PUSH, PUNCH, seeded DRIFT), parallax, rack focus, 8-sample 180 degree motion blur |
| `src/scenes/S01.tsx` ... `S15.tsx`, `src/components/` | the art |
| `scripts/make_sfx.py`, `make_music.py`, `build_mix.py` | 57 layered sounds (transient + body + tail), the 96 BPM bed, the mixer (ducking, voice priority, limiter) |
| `scripts/qa.sh` | the whole check: sync, motion audit, facts, layout (safe zones), colour story, audio event table, stills |
| `scripts/render.sh` | the final render (H.264 CRF 14, AAC 320k) |
| `docs/TIMING.md`, `docs/SFX_EVENT_TABLE.md` | scene timing, every sound event against its visual hit |

## Run

```sh
npm i                      # (node_modules)
python3 scripts/make_sfx.py && python3 scripts/make_music.py   # public/sfx/*.wav, public/music_*.wav
npx tsx scripts/export_timeline.ts && python3 scripts/build_mix.py   # public/mix.wav
sh scripts/qa.sh
sh scripts/render.sh       # out/alarm5.mp4
```
