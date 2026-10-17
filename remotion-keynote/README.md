# Keynote-style explainer — Remotion (React + TypeScript)

1080×1920, 30 fps, H.264 + AAC, exactly as long as `public/vo.mp3` (31.128 s = 934 frames). Inter / Inter Display (SIL OFL) stand in
for SF Pro; the serif accent is Playfair Display Italic 800. No Apple marks, names or fonts.

## How it syncs (nothing is timed in seconds)

1. **Transcript.** `scripts/align.py` force-aligns the supplied script against the audio (pocketsphinx's bundled acoustic model, with
   hand-written Hinglish pronunciations; there is no network route to Whisper's weights from the build machine and ElevenLabs
   transcription was not available). `scripts/timings.py` then refines every word edge against the real speech envelope:
   phrase boundaries snap to the actual pauses, and a word that starts with a plosive (p b t d k c j) snaps to its burst, which is
   what the ear hears. Output: `src/timings.json` (73 words; the aligner's raw times stay in it as `alignStart` / `alignEnd`).
2. **Cues.** `src/cues.ts` is the only place a cue exists, and every one is `w(sentence, "word").start`. A scene starts on its first
   word; every reveal sits on the word it shows; the calculator keys are spread over the words that say the numbers.
3. **Captions.** `src/captions.ts` builds them from the same words (2–4 per chunk), hidden for all of scene 4.

## Run

    npm run studio
    npm run render                         # out/keynote.mp4
    npm run sfx                            # re-synthesise the three sound effects
    /path/to/python scripts/align.py && python scripts/timings.py     # needs pocketsphinx, numpy, scipy

## Verify

    npx tsx scripts/verify-sync.ts         # scenes table, calculator keys vs the real audio, animations vs words, captions, audio
    node scripts/verify-layout.mjs 15      # pixels: safe zones (top 240 / bottom 440), side margins, captions, content-vs-caption
    npx tsx scripts/anchors.ts > build/anchors.json    # one still per anchor word (see the sheets in qa/)

## Sound

Voice at full volume. Three synthesised effects (`scripts/make_sfx.py`: UI key tick, odometer ratchet, low whoosh) mixed with their
peak 18 dB under the voice's peak (voice −7.2 dBFS → effects −25.2 dBFS). A tick on every calculator key, a ratchet while the two
counters roll, a whoosh on six transitions. Scene 4 is silent (no effect starts inside it).
