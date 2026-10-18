# Gemini 4 Argon vs Claude Opus 5.5 — 9:16 data explainer (Remotion, React + TypeScript)

1080×1920, 30 fps, **1425 frames = 47.500 s** = `public/vo.mp3` (46.994 s) + 0.5 s. H.264 (High, yuv420p, 12 Mbit/s by default) + AAC 320 kbit/s.
Inter / Inter Display (SIL OFL) stand in for SF Pro; the serif accent is Playfair Display Italic 800. No Apple marks, names or fonts, and
no model or company logos: the two contenders are plain text labels.

The data is the creator's single test and is not changed: Claude Opus 5.5 — 1h 53m, $23.46; Gemini 4 Argon — 4m 20s, $3.40;
speed ≈ 26× (6780 s / 260 s = 26.08), cost ≈ 6.9× ("~7×"). Credit line: "Test: @EnvolDev on X · single run".

## How it syncs (nothing is timed in seconds)

1. **Transcript → `src/timings.json`.** `scripts/align.py` force-aligns the supplied voiceover script against the audio (pocketsphinx's
   bundled acoustic model, with hand-written Hinglish pronunciations). Whisper's weights and the ElevenLabs transcription were not reachable
   from the build machine (only PyPI/npm are), so this is forced alignment of the *known* script rather than free recognition — the words
   are exactly the script's. `scripts/timings.py` then refines every word edge against the real 10 ms speech envelope: phrase boundaries
   snap to the actual pauses, words that start with a plosive snap to their burst. 112 words; the aligner's raw times stay in the file as
   `alignStart` / `alignEnd`.
2. **Cues → `src/cues.ts`.** The only place a cue exists, and every one is `w(sentence, "word").start`: a scene starts on its first word;
   every number changes on the word that says it; every reveal sits on the phrase it shows. There is no hard-coded second anywhere.
3. **Captions → `src/captions.ts`.** Built from the same words, 2–4 per chunk, the word being spoken in Apple blue. (Not in the brief:
   they are on by default and can be switched off with `--props='{"captions":false}'`, `npm run render:nocap`.)

## Scenes (anchor phrase → what happens)

| # | starts on | seconds · frames | what |
|---|-----------|------------------|------|
| S1 | "Ek hi prompt" | 0.00–8.07 · 0–242 | frosted "Same prompt" card with a typing cursor; on "Claude ko laga" it shrinks to a chip and two progress tracks (plain-text labels) rise and start filling on "laga"; on "sirf **chaar** minute" Gemini's bar snaps to 100 % with a check and "4m 20s" while Claude's bar is still crawling and its stopwatch rolls fast until it lands on "1h 53m" in the pause before "Kharcha" |
| S2 | "Kharcha?" | 8.07–13.13 · 242–394 | the tracks morph into two glass receipts; odometers roll "$23.46" on "Claude, teis dollar" and "$3.40" on "Gemini, sirf saadhe teen dollar" |
| S3 | "Matlab Gemini" | 13.13–17.95 · 394–539 | receipts slide apart; **26×** builds on "chhabbees guna" ("faster"), moves left on "aur", **~7×** builds on "saat guna" ("cheaper"); accent blue |
| S4 | "Lekin twist yeh hai" | 17.95–24.05 · 539–722 | canvas dims, S3 dissolves, a 6-frame hold, then "THE TWIST", "The creator's verdict", the serif-italic headline "Detail me Claude aage" word by word, and three chips staggered 6 frames apart from "ab": Volumetric clouds · Locomotive mechanics · Camera work |
| S5 | "Toh kaunsa use karein?" | 24.05–30.54 · 722–916 | two-column decision card; Gemini: "Fast draft" (Jaldi) · "Low budget" (kam); Claude: "Every frame perfect" (Har frame perfect); a ring marks each column as it is named |
| S6 | "Smart log dono use karte hain" | 30.54–35.33 · 916–1060 | the two columns morph (shared element) into one flow line, "Draft → Gemini" ⟶ "Final → Claude", each pill filling on its word |
| S7 | "Par yeh sirf ek test hai" | 35.33–43.83 · 1060–1315 | "n = 1" on "ek" shrinks into a chip; "Apna khud ka karo." word by word; chips "Same prompt" · "1 try" · "3 scores" on their words; three blank score dials — Detail, Time, Cost — on "detail, time, cost" |
| S8 | "Fair test ka poora prompt chahiye?" | 43.83–47.50 · 1315–1425 | headline, "Comment karo", and a blue glass **PROMPT** pill that pulses in on the last word. No handle (none was given). |

## Run

    npm run studio
    npm run render                 # out/argon.mp4: picture, mixdown, master, mux (scripts/render.sh)
    npm run render:nocap           # out/argon-nocaptions.mp4 (reuses the mixdown of the main render)
    VIDEO_BITRATE=20M npm run render
    npm run sfx                    # re-synthesise the five sound effects
    npm run music                  # re-synthesise the PLACEHOLDER bed (never overwrites a real public/music.mp3)
    /path/to/python scripts/align.py && python scripts/timings.py     # needs pocketsphinx, numpy, scipy

## Verify

    npx tsx scripts/verify-sync.ts                      # scenes table, every cue on its word vs the real audio, animations, captions, audio
    node scripts/verify-layout.mjs 20                   # pixels: safe zones (top 240 / bottom 440), sides, captions, credit, content-vs-caption
    npx tsx scripts/anchors.ts > build/anchors.json     # one still per anchor word (see qa/)

## Delivered (`out/argon.mp4`)

H.264 High, yuv420p, 1080×1920, 30 fps, 1425 frames / 47.500 s, 12.95 Mbit/s (`VIDEO_BITRATE` to change); AAC-LC 48 kHz stereo,
319.5 kbit/s (`-b:a 320k`, fast coder so the encoder actually spends the budget), −16.1 LUFS integrated, −1.5 dBFS true peak; the voice
in the file sits 5 ms from `vo.mp3` (inside a frame). `qa/sheet-01…08.png` are the 59 anchor-word frames pulled out of that file.

## Sound

* **Voice** `public/vo.mp3`, source of truth for timing. It is quiet (−27.3 LUFS, peak −8.2 dBFS), so `scripts/master.py` lifts the whole
  mixdown to −16 LUFS with one static gain and a transparent −1.5 dBFS limiter, then encodes AAC 320 kbit/s once.
* **Music** `public/music.mp3`: **not supplied, so this is a synthesised placeholder** (soft pad + sparse bells, mastered to −14 LUFS,
  `scripts/make_music.py`). Drop the real file at `public/music.mp3` and nothing else changes: `src/audio.tsx` sits it 17 dB under the
  voice's loudness, swells it +6 dB in the pauses between sentences, fades in over 0.8 s and out over the last 1.5 s. (It assumes a
  track mastered near −14 LUFS; adjust `MUSIC_FILE_LUFS` if yours is quieter or louder.)
* **SFX** synthesised (`scripts/make_sfx.py`), peak 18 dB under the voice's peak, each keyed to a cue: `pop` (an element appears),
  `tick` (stopwatch / odometer ratchet), `ding` (Gemini lands, Claude lands, the PROMPT pill), `thud` (26×, ~7×, "aage"), `whoosh`
  (scene changes and morphs). Replace any `public/sfx/*.wav` with a recorded one of the same name.

## B-roll / source content

The brief points at `https://promptbase.shop/daily/tools/gemini-argon-vs-opus-fair-test?...` for B-roll and content. That host is not
reachable from the build environment's network policy, so nothing was extracted from it and nothing was invented in its place.
To use it: allow the host, save the clips/images under `public/broll/` (`clouds`, `locomotive`, `camera` — .mp4/.webm/.png/.jpg), and
run `node scripts/scan-broll.mjs`; the S4 chips then show them as round thumbnails instead of icons.
