# EduLedger launch film: STYLE (Stage A, STUDY)

Two finished films from the HyperFrames student kit, measured frame by frame, then compared with BRIEF §4–5.
Kit commit `0d30152` (28 Sep 2026). Everything here is measured. Where a number comes from looking at frames, it says "by eye".

| | **YouTube motion showreel** | **AIS Live ad** |
|---|---|---|
| File | `examples/showcase/youtube-showreel.mp4` | `examples/showcase/ais-live-ad.mp4` |
| Format | 1920×1080, 60 fps, 15.00 s | 1080×1920 (9:16), 30 fps, 49.70 s |
| Kind | Motion-design showreel on music, no voice (`motion-showreel` skill) | Talking-head ad with VO, burned-in captions and 3D cards |
| Loudness | −13.9 LUFS, LRA 2.5 LU | −16.0 LUFS, LRA 3.4 LU |

## Method

- `scripts/study.py`: frame differences at 64 px, adaptive cut candidates, motion and near-still, audio tempo, onsets and RMS. Output in `out/study/<film>/measure.json`.
- `scripts/strips.sh`: frame strips around every candidate. Each cut was **verified by eye** and its transition type was recorded (`out/study/*/strips_*.jpg`). False positives were removed: caption changes, UI state changes and screen scrolls.
- `scripts/study_sync.py`: showreel cut offsets on the 129 BPM grid. AIS word onsets come from the caption's blue word highlight; VO phrase onsets come from speech-band pauses. Random-time baselines are included. Output in `out/study/sync.json`.
- Contact sheets: `youtube-showreel/sheet_NN.jpg` at 6 fps, and `ais-live-ad/sheets2fps/` at 2 fps with timecodes. The kit analyser's own sheets squash a 9:16 film, so they were dropped.
- **Near-still** uses the same rule as our earlier films (`godevlevel-launch/engine/scripts/rhythm.mjs`). At 0.25× scale, a frame counts as near-still when under 0.3% of its pixels change by more than 8 levels from the previous frame.
- **Type sizes** are measured cap heights in pixels on full-resolution frames.

## 1. Measurements

### Cuts and shot length

| | Showreel | AIS ad | BRIEF §5 |
|---|---|---|---|
| Cuts (verified) | 16 cuts, plus 4 object morphs that change the idea without a cut | 30 | 26 |
| Cuts per minute | **64** (80 counting morphs) | **36.2** | 31.2 |
| Average shot | **0.88 s** (0.71 s per idea, counting morphs) | **1.60 s** | 1.85 s |
| Median shot | 0.90 s | 1.50 s | 1.41 s |
| Shortest / longest | 0.20 / 2.55 s | 0.67 / 3.27 s | 0.94 / 6.41 s |
| Spread (longest ÷ shortest) | 12.7× | 4.9× | 6.9× |
| Shape | Accelerates. Chapters run 1.85, 0.93, 0.90, 0.97 and 2.55 s, then a flurry of six half-beat cuts (0.20–0.27 s), then a 1.98 s lockup hold. | Even: most shots run 1.0–2.3 s. The longest shots are the talking head and the 3D build-ups. | Even: mostly 0.94–1.88 s, then 4.7 s logo and 6.4 s CTA |

Showreel shot list (frame, time, transition):

| # | Starts at | Shot | Transition in |
|---|---|---|---|
| 1 | 0.000 | Red dot bounces on a ruler, with a physics readout | — |
| 2 | f111, 1.850 | Search bar types "broadcast yourself" | Laser line blooms to white (flash) |
| 3 | f167, 2.783 | BROADCAST letters drop in; a selection box is dragged | Blur dissolve |
| 4 | f221, 3.683 | "yourself", then a wallpaper of type | Word whips up out of frame with blur |
| 5 | f279, 4.650 | Inverted to black; the letters morph to dots (≈5.4 s), the dots to a grid (≈5.9 s), the grid to a thumbnail wall | Invert on the beat |
| 6 | f432, 7.200 | "Thank You" thumbnail | Push-in through the wall |
| 7 | f446, 7.433 | Like button. Particles become "500+" (≈7.9 s) and collapse into the play icon (≈8.9 s). | Iris ring flash |
| 8 | f558, 9.300 | 3D red play button (pre-rendered lookdev) | Flash cut |
| 9 | f614, 10.233 | 3D silver award | Diagonal light-sweep wipe |
| 10 | f669, 11.150 | Subscribe → Subscribed | Push-in to blur, then cut |
| 11–16 | f697 → f767, 11.617 → 12.783 | Flurry: Shorts, Shorts swipe, LIVE, Skip, +10s, pixel noise | Hard cuts and one vertical swipe, on half beats |
| 17 | f781, 13.017 | Wordmark lockup. A rule draws, the subtitles type on, the dot lands as the icon. Held 1.98 s. | Noise resolves into the wordmark |

AIS cut frames: 67, 106, 136, 186, 231, 296, 330, 369, 411, 439, 491, 568, 660, 709, 753, 779, 799, 848, 876, 944, 989, 1043, 1073, 1114, 1176, 1274, 1328, 1379, 1419, 1450 (at 30 fps).

### Stillness and value

| | Showreel | AIS ad |
|---|---|---|
| Near-still frames | **19.1%** (15.3% measured at 1/30 s steps) | **19.6%** |
| Where the stillness sits | Lockup hold 60%, Subscribe UI 70%, LIVE 55%, search bar 56%. Chapters with a moving object: 0–7%. | Held 3D cards and the title card: 58–83%. The talking head is never still. |
| Mean luma (0–255) | 76. Value **flips at chapter changes**: dark 14 → paper 236 → dark 26 → saturated → dark 22 → paper 233 → dark 24. | 167. Cream paper throughout, with no flips. |

### Type scale (cap height, px)

| | Showreel (1080 px tall) | AIS (1920 px tall) |
|---|---|---|
| Smallest | HUD mono, 11 px (1.0% of height) | "An actual demo" label, about 10 px (0.5%) |
| Body | Timecode 17 px | Captions 40 px; date line 26 px |
| Largest | BROADCAST 186 px (17%); "Thank You" thumbnail type 219 px (20%) | Card titles 55–56 px (2.9%) |
| Static range | **≈17–20×** | **≈5.5×** |
| Type in motion | Letters drop with bounce, words whip out, type repeats into wallpaper bands, wordmark resolves from noise, subtitles type on | Title fades in over about 3 frames; one caption word highlights blue at a time |
| Voices | Heavy grotesk caps, a contrasting accent voice, wide-tracked mono for the HUD | One sans for everything |

### Layers per frame (by eye, on representative frames)

| | Showreel | AIS ad |
|---|---|---|
| Typical | **6–9**: background (dark or paper gradient), dot grid, hero object or type, tool overlay (readout, selection box, cursor), HUD (crop marks, title, spec, timecode, progress ruler, chapter label), vignette, grain | **2** (full talking head) · **6** (full card: paper, page shadow, title, subtitle, image or screen, caption) · **7–8** (split: paper, page edge, 3D prop, title, accent highlight, torn-edge divider, talking head, caption) |
| Layout mix | One full-frame stage | 31 shots: 17 full cards, 8 split screens, 6 talking heads |

### Transitions

| | Showreel (16 cuts + 4 morphs) | AIS ad (30 cuts) |
|---|---|---|
| Types | 9 different types: flash to white ×1, blur dissolve ×1, whip out with blur ×1, invert ×1, push-in ×2, iris flash ×1, flash cut ×1, light-sweep wipe ×1, vertical swipe ×1, plain hard cut ×5 (flurry only), noise resolve ×1. Plus 4 object morphs, where one object turns into the next. | **30/30 plain hard cuts.** No whips and no blur. All motion happens inside the shot: titles fade in, 3D props build. |
| Motion blur | On every fast move: the whip-out, the push-ins, the falling letters | None |

### Hero objects

| | Showreel | AIS ad |
|---|---|---|
| Motif | One red dot. It becomes a ball, a laser, dots, tiles, particles and the play icon, and it returns as the lockup's icon. | A cyan cube/hub with cards. It recurs across 4 shots ("Install capability" → "One connected system" → "Built to grow with you"). |
| Rendered objects | 2 pre-rendered lookdev objects (red play button, silver award), 1.85 s in total (12% of runtime). Each is lit with a rim light, has a readout overlay and a light sweep, and pushes into the lens. | White clay 3D props with a single cyan accent, in **13/31 shots**: chairs, laptop, cards, hub, steps, figures, and the end-card badge. Each one builds or animates inside its shot. |
| Real product and imagery | Real thumbnails and UI states (search, Subscribe, Skip) | **9/31 shots are real product screens**, labelled "An actual demo". 3 stock photos. |

### Audio sync

| | Showreel | AIS ad |
|---|---|---|
| Tempo | 129.2 BPM measured (the HUD says 129). The grid starts at 0.000 s. | 129.2 BPM bed estimated, weak (autocorrelation 0.18) |
| Cuts on the grid | **15/16 within 35 ms** of a beat or half beat. Median **9 ms**, max 38 ms. 11 cuts land on full beats; the flurry's 5 land on half beats. | Not beat-locked. The median distance to the nearest half beat is 35 ms at the best phase, against 43 ms for random cut times. |
| Cuts on speech | — (no VO) | Driven by the VO. 9 of the 16 detected restarts after a breath carry a cut within ±0.1 s. The other cuts fall mid-phrase. Word onsets are too dense (median 200 ms apart) for a word-level offset to mean anything (median 67 ms, the same as the 65 ms random baseline). |
| Sound design | Every hit (flash, invert, iris, flurry cuts) is a music or SFX hit. One pre-drop dip (−31 dB RMS at 7.25 s) just before the iris flash at 7.43 s. | VO-led. In speech pauses the level falls to −45 to −56 dB RMS, so any music bed is very low or absent. |

## 2. Findings

1. **The showreel is our model for energy; the AIS ad is our model for structure.** The AIS ad is 49.7 s with VO, like ours, and cuts every 1.60 s, close to our 1.85 s. Its energy comes from content changes, not from motion. The showreel supplies the motion grammar the brief asks for: blur, light, hits on the grid, a motif that transforms, and a held lockup.
2. **Monotony is the risk at our pace.** At 26 cuts the brief sits below both references (31 cuts/min against 36 and 64). With identical whips on every cut, it would feel slower still. The showreel never uses the same transition twice in a row outside the flurry.
3. **Acceleration and a held ending make it feel fast.** The showreel's average is 0.88 s, but its spread is 12.7×: long chapters, a 0.2 s flurry, then a 2 s hold. The brief's list is even (mostly 0.94–1.88 s).
4. **Stillness:** both references sit at about 19–20% near-still, concentrated in holds and UI states. Our logo hold plus a 5 s CTA alone will be about 13–15%.
5. **Value flips punctuate.** The showreel's biggest moments are dark ↔ paper flips on the beat. Our real EduLedger UI is white and light grey (the home-page screenshot), so it gives us paper moments without breaking the navy canvas.
6. **Real product screens build trust.** The AIS ad shows real UI in 29% of its shots, while its 3D props carry the metaphors. That matches the brief: hero renders for metaphors, real UI for proof.

## 3. Changes to BRIEF §4–5

**Approved by the user on 2026-10-06:** P1–P8. P9 is approved pending the developer's OK (`client/FACTS.md`).

| # | BRIEF says | Proposal | Why |
|---|---|---|---|
| P1 | Law 5: *every* cut rides a light-streak or cut-the-curve whip | **A transition menu by act.** Every cut still has motion; about half are whips.<br>• **Act 1 (S01–S06):** hard glitch cuts with 1–2 RGB-split or flash frames (X05).<br>• **S06→S07:** the chaos morphs into the ledger line.<br>• **S07→S08:** the line flares, then a flash through white on the drop.<br>• **Act 2:** a light-streak whip by default; cut-the-curve vertical whips for S10–S12; morphs where an object transforms (S16 line → fee bar, S17, S18); slide-up for S19.<br>• **Act 3:** hard cuts on the three stomp hits (S23–S25); the ledger line returns into S26; push-in to the CTA.<br>Roughly 12 whips, 7 hard or hit cuts, 5 morphs and 2 flashes. | Showreel: 9 transition types in 16 cuts. AIS: 30 hard cuts. 26 identical whips (and 26 X07 whooshes, one every 1.9 s) would flatten the energy and mask the VO. |
| P2 | The ledger line returns ≥ 3× | **The whip's light streak *is* the ledger line**, so the motif crosses every whip. It also gets its scripted returns: S07, S08, S16, S20, S26, S27. | The showreel's dot is present in nearly every transition. That continuity is why its 15 s read as one thought. |
| P3 | Even shot lengths (§5 times) | **Accelerate, then hold.**<br>• Act 1 cuts tighten with the VO toward S06; then the S07 rest.<br>• S10–S12 ("Students. Staff. Fees.") at one beat each if the VO allows: our flurry.<br>• S23–S25 cut on the stomp hits; then the long holds.<br>Spread target ≥ 8× (0.47 s to 5 s). Cut count stays 25 ± 2. | Showreel spread 12.7×, brief 6.9×. Acceleration is what reads as "super energetic", more than the average does. |
| P4 | Navy canvas everywhere | Navy stays the canvas, with **3 deliberate value flips**:<br>• a white flash at the S08 drop;<br>• the real (light) UI filling the frame at S09 and S22;<br>• a brand-light flood at S26.<br>Red only in Act 1. Green held back until the first present tick (S13). | Showreel chapter changes flip luma 14 ↔ 236. A flip on the drop makes "Meet EduLedger" land. |
| P5 | Words scale up to 8× | Keep the 8× dolly-through, and add a **type ladder** at 1080p (sizes are font sizes, cap heights in brackets):<br>• labels 16 px (cap ≈ 11);<br>• UI copy 28–36;<br>• support lines 72–96;<br>• kinetic hero words 220–280 (cap ≈ 160–200);<br>• stamps (S23–S25) up to 360.<br>One display family plus one UI family (BRIEF font rule). | Showreel static range ≈ 17–20× (11 → 186 px cap). The AIS ad's 5.5× range reads calm, the opposite of our brief. |
| P6 | — | **Stillness target ≤ 20% near-still**, placed only in the S07 rest, the S26 logo hold and the CTA. Everywhere else something moves on every frame (grid drift, particles, vignette breath). | Both references: 19–20%, concentrated in holds |
| P7 | Cuts on a beat or half beat | **Tolerance ±1 frame (17 ms at 60 fps)** from the measured grid. Word-anchored type leads its word by 0–0.2 s (MOTION_PHILOSOPHY §2.2). | Showreel median 9 ms (max 38 ms). We build to the grid, so we can hit it exactly. |
| P8 | — | *Optional, default off:* a minimal textless frame: corner crop marks and a progress ruler drawn as the ledger line. | The showreel's HUD ties its chapters together. Any HUD *text* would be new copy outside the fact ledger, so leave it textless or skip it. |
| P9 | — | *Optional, default off:* a small "Demo" tag on UI frames that show the demo school's numbers. **It is new on-screen copy, so it needs your and the developer's OK.** | The AIS ad labels its real screens "An actual demo". A tag also makes the demo-data rule visible. |

## 4. Notes for later stages

- **Checklist name:** BRIEF §7 cites "MOTION_PHILOSOPHY §5 checklist ('What would Infinite do?')". In the kit, §4 is the pre-flight checklist and §5 is the anti-patterns; neither is titled that way. Stage E will run both.
- **Kit rule conflict:** `motion-showreel` warns that `background-clip: text` renders invisible in capture. MOTION_PHILOSOPHY §2.2 asks for chrome-gradient text built that way. Stage D will test it, and use solid fills with a `text-shadow` halo if it fails.
- **AIS caption grammar:** one highlighted word at a time, about 40 px cap at 9:16. This is the reference for the Stage G cutdown's on-screen words, if we use any.
