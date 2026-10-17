# Remotion explainer — "9,848 views, 44 profile visits"

1080×1920, 30 fps, H.264 MP4, exactly as long as the voiceover (`public/vo.mp3`, 39.079 s = 1173 frames).
React + TypeScript, Remotion 4. Inter (SIL OFL) is bundled in `public/fonts`.

## How it syncs

Nothing in the video is timed in seconds. The chain is:

1. `public/vo.mp3` → **ElevenLabs Scribe** (word-level timestamps) → `src/data/words.raw.json` (untouched).
2. `scripts/build-timing.ts` → `src/data/words.json`. Scribe returned the Hindi words in Devanagari, so each is mapped to Roman
   Hinglish through `src/data/hinglish.json` (the build fails on any Devanagari word that is not in the table). Each word edge is
   also checked against the speech level of the real audio; where speech runs into the gap beside a word the edge moves out to it
   (it matters for the opening number "9848" — Scribe has it at 0.30–1.62 s, the voice says it from 0.02 to 1.97 s). The original
   Scribe times stay in the file as `scribeStart` / `scribeEnd`.
3. `src/cues.ts` is the only place cues are defined, and every one is `w(sentence, "word").start`. A scene starts on its first word;
   every pop-in, typing run, counter and wipe is looked up from there.
4. `src/captions.ts` builds the captions (2–4 words, split at clause boundaries) from the same words.

Re-transcribe a new voiceover → replace `words.raw.json`, extend `hinglish.json` if the build asks, run
`npx tsx scripts/build-timing.ts`. The scenes follow.

## Run

    npm run studio                 # preview
    npm run render                 # out/explainer.mp4  (H.264, CRF 18, AAC)
    npx tsx scripts/build-timing.ts
    python3 -I scripts/make_sfx.py # re-synthesise the two sound effects

The render uses a local Chromium headless shell (`--browser-executable`, see package.json); change the path for your machine, or
delete the flag to let Remotion download its own.

## Verify

    npx tsx scripts/verify-sync.ts       # captions, audio-vs-timestamps, scene boundaries, animations vs the words they illustrate
    node scripts/verify-layout.mjs 15    # pixels: safe zones, side margins, captions box, content/caption overlap (renders ~300 stills)
    node scripts/stills.mjs build/stills full 100 300 500   # stills at chosen frames

## Sound

The voice is at full volume. `scripts/make_sfx.py` synthesises a whoosh and a tick (no credits, deterministic); both are mixed
18 dB under the voice's peak (voice peak −4.2 dBFS measured → effects peak −22.2 dBFS; `src/audio.tsx`). A whoosh sits on each of
the six scene wipes and a tick on every step of the two counters (`whooshTimes`, `tickTimes` in `src/cues.ts`). Nothing is left empty.

## Layout

Instagram's UI covers the top 220 px and the bottom 420 px: nothing important is there (`SAFE` in `src/theme.ts`). Pills start at
y 262, headlines at y 342, the hero object lives in y 600–1250, the captions in y 1284–1486. The camera pushes in 4 % over every
scene, so margins were chosen with that in mind (the verifier measures the pushed frames).
