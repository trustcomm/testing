# godevlevel.in kinetic-type reel: STATE

This file is updated after every step. The reel is separate from the launch film, but it runs on the launch film's engine: it imports `../godevlevel-launch/engine/` by URL rather than copying it.

## Current stage
**PROVISIONAL build done: English and Hinglish MP4s rendered, checks run. Stopped for review ⏸.**

## Format and look (from the brief)
- 9:16 at 1080×1920, 30 fps, 11.767 s (353 frames). Music only, no voiceover. For Instagram Reels and YouTube Shorts (godevlevel.in).
- Two colours only, charcoal #323743 and orange #FD4B25, inverted on every cut:
  - odd cards: charcoal ground, orange type
  - even cards: orange ground, charcoal type
  - Exception from the brief: card 24 (the logo) sits on charcoal, so the 23→24 cut does not invert.
- Type: one word or phrase per card, centred, lowercase. Regular size is 132 px (never below 120 px). Emphasis aims for 2.2× (290 px), capped to a 900 px line width.
- Display face: **Archivo ExtraBold. APPROVED** (user, 2026-10-05).
- Flat colour. No glow, gradients or decorative blur. Optional specks were left out of v1.
- Motion:
  - Each card drifts linearly in scale, 1.00 → 1.02.
  - Emphasis cards (3, 5, 22) land with a single 1.06 frame.
  - Cards 8, 12 and 16 enter with a 2-frame horizontal smear, using engine motion blur and a 2-frame pre-roll.
  - Every boundary is `"cut": "hard"`.

## Timeline (PROVISIONAL 128 BPM)
- **Grid:** quarter beats are preferred and eighth beats are allowed at a cost (`scripts/plan.mjs`). At 128 BPM a quarter beat is 3.5 frames. Snapping to quarters only turns Part B into `14,14,14,14,14,14,11,11,7×7` (kept in `out/timeline.quarter-only.json`).
  - Allowing eighth beats on just 3 cuts keeps the acceleration: `14,14,14,12,12,11,10,9,9,9,9,7,7,7,7`.
  - **APPROVED** (user, 2026-10-05): keep the eighth-beat cuts.
- **Logo cut:** frame 308 = 10.2667 s, on a downbeat; the grid phase is set so it lands there. The music stops dead at that cut.
- Max snap error is 16.1 ms.

| # | Part | English | Hinglish | Ground | Target | Frames | Span | Snapped to | Err ms | |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A | websites | website | charcoal | 22 | 23 | 0–22 | film start | 0 | |
| 2 | A | are not | kaafi | orange | 20 | 21 | 23–43 | quarter-beat grid | -7.8 | |
| 3 | A | enough. | nahi. | charcoal | 18 | 18 | 44–61 | quarter-beat grid | -10.9 | EMPH |
| 4 | A | you need | aapko chahiye | orange | 16 | 17 | 62–78 | quarter-beat grid | 3.1 | |
| 5 | A | customers. | = | charcoal | 16 | 15 | 79–93 | quarter-beat grid | -16.1 | EMPH |
| 6 | B | leads | = | orange | 15 | 14 | 94–107 | quarter-beat grid | 15.1 | |
| 7 | B | calls | = | charcoal | 14 | 14 | 108–121 | quarter-beat grid | 13 | |
| 8 | B | site visits | = | orange | 13 | 14 | 122–135 | quarter-beat grid | 10.9 | smear |
| 9 | B | walk-ins | = | charcoal | 12 | 12 | 136–147 | quarter-beat grid | 8.9 | |
| 10 | B | reviews | = | orange | 12 | 12 | 148–159 | eighth beat | -1.3 | |
| 11 | B | offers | = | charcoal | 11 | 11 | 160–170 | quarter-beat grid | -11.5 | |
| 12 | B | reels | = | orange | 11 | 10 | 171–180 | quarter-beat grid | 3.6 | smear |
| 13 | B | launches | = | charcoal | 10 | 9 | 181–189 | quarter-beat grid | -14.6 | |
| 14 | B | trust | = | orange | 10 | 9 | 190–198 | eighth beat | -7.6 | |
| 15 | B | speed | = | charcoal | 9 | 9 | 199–207 | quarter-beat grid | -0.5 | |
| 16 | B | sales | = | orange | 9 | 9 | 208–216 | eighth beat | 6.5 | smear |
| 17 | B | growth | = | charcoal | 8 | 7 | 217–223 | quarter-beat grid | 13.5 | |
| 18 | B | more | = | orange | 8 | 7 | 224–230 | quarter-beat grid | 12.5 | |
| 19 | B | more | = | charcoal | 7 | 7 | 231–237 | quarter-beat grid | 11.5 | |
| 20 | B | more | = | orange | 7 | 7 | 238–244 | quarter-beat grid | 10.4 | |
| 21 | C | we build | hum banate hain | charcoal | 14 | 14 | 245–258 | quarter-beat grid | 9.4 | |
| 22 | C | all of it. | sab kuch. | orange | 16 | 17 | 259–275 | quarter-beat grid | 7.3 | EMPH |
| 23 | C | godevlevel.in | = | charcoal | 30 | 32 | 276–307 | quarter-beat grid | -12 | |
| 24 | C | logo | = | charcoal | 45 | 45 | 308–352 | quarter-beat grid | 0 | |

## Checks (PROVISIONAL)
| | English | Hinglish |
|---|---|---|
| Cuts per minute (overall / before logo / Part B) | 117.3 / 134.4 / 178.8 | same |
| Interval curve | card 1 0.7667 s → Part B 0.4667 s → 0.2333 s (3.29× faster) | same |
| Accelerating shape kept (A and B non-increasing) | PASS | PASS |
| Equal triples | allowed inside the accelerating run, none failing (PASS) | same |
| Near-still (target ~70%) | 80.4% (A 78.5, B 82.1, C 79.6) | 76.7% (A 73.1, B 82.1, C 72.2) |
| Smallest type | 132 px (PASS) | 124.4 px (PASS) |
| Emphasis vs regular | "enough." ×1.67, "customers." ×1.2, "all of it." ×2.2 | "nahi." ×2.2, "customers." ×1.2, "sab kuch." ×2.2 |
| Determinism (33 frames, same session + fresh browser) | PASS | PASS |
| Loudness (−14 LUFS, TP < −1 dBTP) | not measurable: silent provisional render | same |
| Reference comparison | pending: no reference film in refs/ | same |

**Honest notes:**
- **Emphasis is width-limited.** "customers." reaches only ×1.2 and "enough." ×1.67, because a long word at 2.2× doesn't fit 1080 px. Options: accept this; use a narrower Archivo width for emphasis words (Archivo has a width axis; not vendored yet); or rewrite to shorter emphasis words.
- **Stillness is 77–80%, above the ~70% target.** At this size the drift barely changes pixels between frames. If you want it closer to 70%, the drift could go to 1.00→1.04, or the specks could be added.
- **Logo card: APPROVED** (user, 2026-10-05). The reversed logo (Go and Level in off-white, Dev in orange) is the one approved exception to the two colours.
- **Hinglish two-line phrase:** "hum / banate hain". "aapko chahiye" fits on one line at 124.4 px.

## Inputs and open items
| Item | Status |
|---|---|
| Music: `canva/music/reel.mp4` (Canva, vocal-free) | waiting. When it lands: extract `reel.wav`, run `tempo.py`, re-run `plan.mjs` (it picks the downbeat that puts Part B on the busiest bars and stops the music on the logo cut), then render + loudnorm to −14 LUFS / −1.5 dBTP |
| Reference film in `refs/` (9:16 kinetic montage) | not present, so no measurements to read or compare yet |
| Attached audio (`refs/attached-audio.mp3`, 9.38 s, −14.5 LUFS, no source metadata) | measured as info only: 105.8 BPM, confidence 3.4×, downbeats 0.035 / 2.303 / 4.572 / 6.840 / 9.108 s. **Not used in the reel**: it isn't confirmed as the Canva track. Gitignored, not committed |
| Display face | Archivo, APPROVED |
| Eighth-beat cuts on 3 boundaries | APPROVED, keep |
| Reversed logo on the end card | APPROVED |

## Files
- `scripts/plan.mjs`: timeline and snapping.
- `web/card.js`: the one card module.
- `web/main.js`: imports the engine.
- `scripts/render.mjs <en|hi>`: MP4, 4 fps contact sheet, stills.
- `scripts/check.mjs <en|hi>`: the checks above.
- Outputs (in `out/`):
  - `reel-en.mp4`, `reel-hi.mp4`
  - `contact-en-4fps.png`, `contact-hi-4fps.png`
  - `stills/` (cards 3, 5, 22 and 24, punch frames, smear frames)
  - `check-*.json`

## Engine changes made for this reel (shared, backwards-compatible; launch film re-checked unchanged)
- `engine.mjs`: the server is rooted at `films/`, and `openEngine({page, viewport})` takes any film's page.
- `film.js`: hard cuts skip the handoff match; per-beat `preroll` for motion just before a cut; `env.entry` exposes each beat's timeline data.
- `scripts/rhythm.mjs`: shared rules. Equal triples are allowed inside an accelerating run, and one near-still test is used by every checker. The launch checker now uses it.
- `scripts/tempo.py`: tempo, beats, downbeats and busyness. Validated on a 128 BPM click track: 127.96 BPM, beats within 13 ms.

## Log
- 2026-10-05:
  - Created the reel on the launch engine.
  - Built a PROVISIONAL 128 BPM timeline (eighth-beat compromise on 3 cuts).
  - Rendered English and Hinglish (silent) and ran checks. Stopped for review.
  - The user approved Archivo, the eighth-beat cuts and the reversed logo. The renders were already in Archivo, so the outputs are unchanged.
  - Still waiting on canva/music/reel.mp4 and the reference film.
