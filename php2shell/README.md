# PHP2Shell: 9:16 Hinglish news-explainer reel (Remotion + TypeScript)

1080 x 1920, 30 fps, **duration = vo.mp3 + 0.8 s** (91.824 s + 0.4 s lead + 0.4 s tail = 92.633 s = 2779 frames).
H.264 High (16 Mbit/s) + AAC 320 kbit/s. The creative brief is `docs/BRIEF.md`; the rules the scenes follow are `docs/CONTRACTS.md`.

## One source of truth
Every time in the film is a frame derived from a word of the voice-over.

- `src/timings.json`: the transcript with a start/end per word (forced alignment, see below).
- `src/anchors.ts`: `w("S4", "wiz")` finds a word, `fw()` is the frame it starts on. Composition frame = round((voice time + 0.4 s) x 30).
- `src/cues/sNN.ts`: per scene, the cue frames (all from words), the sound events, the QA anchors, the hero frame, camera pushes and shakes.
- `src/timeline.ts`: gathers the 13 cue modules. The picture (`src/scenes/SNN.tsx`) and the sound (`scripts/build_mix.py`, via `public/timeline.json`) both read it.
- Nothing is timed in seconds, nothing uses `Math.random`, `Date` or the network: seeded `rand(i, k)` only, a render is identical every time.

## Run it
```sh
npm ci
npx tsx scripts/export_timeline.ts      # public/timeline.json (scenes, 169 sound events, anchors)
python3 scripts/build_mix.py            # public/mix.wav: voice -14 LUFS, SFX 12 dB under the voice, music ducked 8 dB, true peak < -1 dBTP (about 100 s)
sh scripts/qa.sh                        # sync, facts on screen, layout/safe zones on pixels, colour story, audio event table, stills + contact sheet
VIDEO_BITRATE=16M sh scripts/render.sh  # out/php2shell.mp4 (H.264 High + AAC 320k), prints the true peak of what was encoded
node scripts/deliver-stills.mjs         # out/stills/S01..S13.png (hero frame of every scene) + out/contact-sheet.png
npx remotion studio                     # preview
```
`node scripts/stills.mjs <dir> full|nocap|bg <frame> ...` renders single frames; `sh scripts/sheet.sh <dir> <out.png> <cols> <width>` makes a contact sheet.

## Voice-over transcript (how the timing was made)
ElevenLabs and Whisper were not reachable from the build machine, so the word timestamps come from **forced alignment** of the known script
against the audio (`scripts/align.py`, pocketsphinx per speech chunk, scored per pronunciation variant because the voice reads numbers in Hindi and
"PHP" as "pee aitch pee"), then refined against the 10 ms energy envelope (`scripts/timings.py`). `scripts/verify-sync.ts` checks the result against the audio
(for example the acoustic onset of "comment" lands -0.6 frames from its cue).

## Sound
`scripts/make_sfx.py` synthesises the 49 sounds of `src/sfx.ts` (numpy, deterministic), `scripts/make_music.py` the dark and warm beds, `scripts/build_mix.py`
places every event sample-accurately on the frame of its visual hit. `scripts/qa_audio.py` writes `docs/SFX_EVENT_TABLE.md`: the expected frame of every event
against where the matched filter finds it in the SFX stem (all within one frame), loudness, true peak, music duck, and a per-word masking check. See `docs/SFX.md`.

## Where it deviates from the brief
The short list: the S9 needle's overshoot peak (clunk + shake) lands on the first frame of "nau point do" instead of the
count-up running across the whole word, the S7 mapping pills sit below the racks, six racks (six houses) instead of five, the envelope in S13 is line art not an emoji.
