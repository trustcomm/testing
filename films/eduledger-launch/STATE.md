# EduLedger launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md` (Director's Package v1, saved verbatim). The approved adaptations to it are in `STYLE.md` §3 and in Decisions below.

## Current stage
**Stage E (BUILD) done; stopped at its gate ⏸.**

- **Full draft:** `out/draft/eduledger-launch-draft.mp4`.
  - 1920×1080, 60 fps, 52.55 s (3,153 frames), HyperFrames `--quality standard`.
  - Picture from `web/`; sound is the mastered mix `out/mix/master.wav`, as AAC 320k.
  - Verification is in **VERIFY.md**, with contact sheets and per-cut strips in `out/verify/`.
- **Every placeholder swaps automatically.**
  - Screenshots `ui/<key>.*`, heroes `heroes/H1–H5.*`, the logo SVGs and SFX `sfx/Xnn(_v1).*` resolve to the real file when it exists, and to a labelled placeholder when it doesn't.
  - `scripts/build_all.sh --render` rebuilds, remixes, re-runs every gate, re-renders, re-verifies and rewrites VERIFY.md.
  - Tested in a scratch copy with stand-in files: a dashboard screenshot, a chat card, an H3 render, and SFX X06/X12. Each one replaced its placeholder in every slot. SFX sync points were found automatically: the X06 impact at 1.508 s (true 1.5 s) and the X12 onset at 0.096 s (true 0.1 s).
- **Vignette false positive fixed.**
  - The vignette's darkest stop is now 0.6, so the layout audit reads it as a scrim, not something covering the text.
  - The **contrast audit now samples text: 90/90 passed** at 30 sample times. Before the fix it sampled 0/0.
  - It found one real failure, now fixed: a grey stat label on the S22 demo card at 4.41:1, darkened to pass 4.5:1.
- **Mix** (`scripts/mix.py`, `out/mix/report.json`):
  - VO 1.0, normalised to −16 LUFS.
  - SFX at 0.2–0.4, each peak-normalised first.
  - Music −6 dB, then sidechain-ducked 7.8 dB under the voice, so the VO sits 13 dB over the music.
  - Master: one linear gain plus a 4× oversampled limiter at −1.9 dBFS.
    - WAV: **−14.0 LUFS, −1.9 dBTP**.
    - The delivered AAC file: **−14.1 LUFS, −1.5 dBTP**.
    - The limiter leaves headroom for AAC's decoder overshoot: the first render's AAC came out at −1.0 dBTP, which fails, and `mix.py` now checks an AAC encode before accepting the master.
- **Gates:**
  - `hyperframes lint`: 0 errors, 3 warnings ("track too dense", readability advice for one-file films).
  - Kit preflight: passed.
  - Kit beat-sync validator: 28/28.
  - Exact-word sync: 28/28, with each cut 3–140 ms ahead of its word and on the beat grid.
  - `hyperframes check`: passed at 56 sample times.
  - MOTION_PHILOSOPHY §4/§5 audit: 10/10 measured items pass, including seek-order determinism, plus palette, callback and frame review.
  - **Render check:**
    - 3,153/3,153 frames.
    - **27/27 cuts on their planned frame:** 24 have the biggest change on that frame (±1); in 3 the exit motion peaks 2–4 frames early, with a sharp change still on the planned frame. All confirmed in the strips.
    - Stillness 15.3% by the Stage A rule (target ≤ 20%), only in the S07 rest and the end of S22.
  - Details in VERIFY.md.
- **Review fixes in Stage E:**
  - S06 headline stays above the call bubbles.
  - S10–S12 words use the kinetic face and clear the cards.
  - S09 subline and S13 arrow now chrome with a halo.
  - Reveals added on VO words where the §4 audit found more than 1 s with nothing new (S09, S13, S23–S25; TIMELINE.md §7).
  - Every tween snapped to the 60 fps frame grid.
  - Repeating tweens end inside the film.
- **Found by verifying the first render (fixed, then re-rendered):**
  - **Whip streak late.** It crossed the screen 1–9 frames after the cut, so the frames at the cut were nearly empty. It now accelerates in and crosses mid-frame on the cut frame itself, at full thickness.
  - **Seek-order bug.** The streak's and the S09 sweep's opacity was set only by a "from" value, so after a backward seek they could vanish. Every value is now explicit.
    - The §4 audit now checks that every frame renders the same whatever order frames are drawn in: forward, backward, or jumping from 0.
    - Checked against the old code, the test fails it: 8 mismatches.
  - **AAC true peak** at −1.0 dBTP, fixed as above.
  - The first render is kept locally (`out/draft/work/`), not in git.

**Waiting on the user (Stage E gate):**
1. Watch the draft and approve it, or list changes with their times.
2. The inputs still missing (INPUTS.md):
   - `music/LICENSE.txt`;
   - SFX X01–X14;
   - the logo SVG and exact colours;
   - the app screenshots, with `ui/parent-chat.png` for S20;
   - heroes H1–H5;
   - the FACTS.md sign-offs;
   - the L14 listen.

   Each swaps in with `scripts/build_all.sh --render`.
3. Then Stage F (CHECK, compliance), and Stage G (9:16, 30 s) after your approval.

## Decisions (user, 2026-10-06)
- **P1–P7 approved** as proposed in STYLE.md §3.
- **P8 approved:** the textless corner-mark frame.
- **P9 approved,** pending the developer's OK: a small "Demo" tag on app frames that show demo-school numbers. Logged in `client/FACTS.md`.
- **VO:** split the single file at its pauses into L01–L14. Editing only: no regeneration, no voice change. Done.
- **Length about 52 s,** so the CTA card gets its full 5+ s hold. With the VO as recorded, the CTA would enter at L14 (≈ 46.65 s) and hold to 52.0 s (5.35 s). Stage C fixes the exact times on the beat grid.
- **Word timing:** ElevenLabs Scribe, priced first, approved under 500 credits. Done.
- **Logo:** the user's image is the working logo until the developer's SVG and exact colours arrive. It arrived on the third try (a 1410×294 header screenshot) and is cut out in `brand/` (PROVISIONAL, see below).
- **Music (user, 2026-10-06):** `music/track.mp3`, from chat ("Quantum_Launchpad_2026-10-06T091426.mp3"). Its licence goes in `music/LICENSE.txt`, added by the user; **MISSING until then.**
- **Stage C go-ahead (user, 2026-10-06):** start Stage C with the real voice and music once the music measured cleanly, using placeholders for screenshots, SFX and heroes. Done.
- **Stage C review (user, 2026-10-06):**
  - Music edits approved. The reply kept the template wording and flagged no join.
  - Act 1 keeps its cuts, with the speed-up inside S04–S06.
  - S13 is split on "dashboard" (27 cuts).
  - The stamps carry L12 into the break.
  - The music licence will come as `music/LICENSE.txt` ("Quantum Launchpad").
  - Start Stage D with placeholders. Done.
- **Brand light (user, 2026-10-06):** the site's blue → violet gradient, measured at **#2D60E5 → #8C35E7** (working values until the developer confirms). The logo is always shown in its own colours.
- **S25 (user, 2026-10-06):** **the India map is dropped.** The 3D school building (H5) alone carries "Built for Indian schools". This overrides BRIEF §5 S25 ("with India-map glow points"), and the map sign-off is removed from FACTS.md.
- **L14 (user, 2026-10-06):** the user is listening. If "EduLedger" is mispronounced, the user regenerates L14 and replaces `vo/L14.wav`. Then:
  1. Add `{"L14": "<who, date, voice and settings>"}` to `vo/replaced.json`, so `split_vo.py` never overwrites the new take (guard tested).
  2. Run Scribe on L14 only (priced first; within the 500-credit cap).
  3. Re-measure L14 in `vo/lines.json`.

## Stage D design decisions (approved by the user, 2026-10-06)
- **Type:**
  - Inter Display 800/900 for kinetic statements, Inter 400–700 for UI. No site font has been supplied, and the brief says "Inter + one display face". Local OFL files are in `web/assets/fonts/` with the licence.
  - The kit's typography guide bans Inter; the client brief wins.
- **Chrome type:** a subtle white → pale-blue gradient clipped to the text, with a brand halo as a drop-shadow (red in Act 1).
  - The kit warns that `background-clip: text` is invisible in capture. **Tested here on HyperFrames 0.7.109: it renders in both snapshot and render**, so MOTION_PHILOSOPHY's chrome headlines are used.
- **Stage:** navy `#07111F`, a perspective grid floor (neutral in Act 1, brand-tinted from the drop on), "+" crosshairs on a 120 px lattice, seeded grain stepped each frame, a breathing vignette, and the textless corner marks (P8).
- **Placeholders, never faked:**
  - H1 and H4 are dashed outlines labelled `PLACEHOLDER · H1 3D ledger book render` / `H4 3D phone render`.
  - The S20 chat card is a neutral card in the site's style, labelled "Card design: placeholder until EduLedger's chat card arrives". It carries the demo message from BRIEF §5, the "Demo" tag (P9, pending sign-off), "Add-on" and ✓✓ in brand blue.
  - "WhatsApp" appears as plain text only.
- **Logo:** the PROVISIONAL mark is used at 1× (216 px) so it stays sharp.
  - The wordmark is our white reversal for the navy canvas (`brand/logo-wordmark-on-dark.png`).
  - It crystallises from blur, with a light glint masked to the logo's own pixels.
- **Fixes found while reviewing frames:**
  - an overshooting `back.out` ease drove `filter: blur()` below 0, which is invalid CSS, so the logo stayed blurred; blur now runs on its own ease;
  - the light sweep showed as a band on the background, so it is now masked to the logo;
  - the bubble glyph read as a tick, so it is now a handset;
  - the S13 title sat in the vignette, so it is now centred and the vignette softened.

## VO (split and measured)
- **Source:** `vo/master/ElevenLabs_…_Hope_-_upbeat_and_clear_….mp3`. Voice "Hope – upbeat and clear" (the user's choice), 49.48 s, mono 44.1 kHz.
- **Split:** `scripts/split_vo.py` → `vo/L01.wav` … `vo/L14.wav` (24-bit) and `vo/lines.json` (cut points, words relative to each file, pauses, loudness).
  - Each cut sits at the quietest 10 ms in the gap between two lines' words: −62 to −82 dB at every cut.
  - The 14 files rejoin to the master sample for sample, apart from the 10 ms fades.
- **Word timing:** ElevenLabs Scribe (`eleven_scribe_v1`) → `vo/scribe/master-words.json` and `master-transcript.txt`. All 90 words match the script.

| Line | In master | Speech span | Words | WPM | LUFS | True peak |
|---|---|---|---|---|---|---|
| L01 | 0.00–2.71 | 2.42 | 3 | 74 | −24.3 | −7.8 |
| L02 | 2.71–7.42 | 4.48 | 10 | 134 | −25.6 | −10.0 |
| L03 | 7.42–10.86 | 2.12 | 7 | **198** | −26.3 | −11.0 |
| L04 | 10.86–12.27 | 1.06 | 2 | 113 | −25.1 | −8.1 |
| L05 | 12.27–15.47 | 2.56 | 7 | 164 | −24.8 | −7.8 |
| L06 | 15.47–17.73 | 1.84 | 3 | 98 | −25.0 | −8.1 |
| L07 | 17.73–21.23 | 3.08 | 7 | 136 | −24.8 | −8.3 |
| L08 | 21.23–25.55 | 3.66 | 7 | 115 | −25.0 | −7.8 |
| L09 | 25.55–29.16 | 3.12 | 8 | 154 | −25.5 | −7.6 |
| L10 | 29.16–35.02 | 5.40 | 10 | 111 | −24.8 | −6.6 |
| L11 | 35.02–38.12 | 2.88 | 7 | 146 | −24.5 | −7.1 |
| L12 | 38.12–43.12 | 4.18 | 10 | 144 | −25.7 | −8.4 |
| L13 | 43.12–46.65 | 3.02 | 5 | 99 | −25.3 | −7.1 |
| L14 | 46.65–49.48 | 2.60 | 4 | 92 | −25.0 | −8.2 |

- **Loudness:** level is even across lines (−24.3 to −26.3 LUFS); it is normalised in the final mix.
- **L03 (198 WPM)** is the fastest line, and it sits under the S07 rest beat.
- **To listen:** Scribe wrote L14's address as "eduleder.co.in". It may only be a transcription quirk. Please listen to `vo/L14.wav` (0.9–2.6 s). If it needs regenerating, I'll stop and propose options; I won't regenerate anything.

## Music (measured)
`music/track.mp3`: 70.03 s, stereo 44.1 kHz MP3 at 194 kb/s.
- **Loudness:** −11.5 LUFS integrated, LRA 14.8 LU (a quiet intro and a long fade), sample peak 0.0 dBFS. The final master is limited to −1 dBTP.
- **Tempo:** **128.011 BPM** (beat 0.468710 s), downbeat phase **0.054 s**, fitted on the kick attacks 15–56 s.
  - The kit's `music-grid.mjs` reads 127.95 BPM, kick phase 0.032 s (`out/music-grid.txt`).
  - Fits on three separate sections agree within 8 ms, so the grid is stable.
- **Structure (source times):**
  - intro without kick, 0–13.2 s;
  - riser and pre-drop dip, 12.7–14.6 s;
  - **drop at 15.05 s**;
  - groove to 43.2 s;
  - a one-bar break, 43.2–45.05 s;
  - groove to 56.3 s;
  - outro decaying 56.3–60 s, silent by about 64 s.
- **Against the plan:**
  - the drop was 3.75 s late for "Meet EduLedger";
  - the track was 18 s too long.

  Both are fixed by the bar-accurate edit in TIMELINE.md §2, which needed no re-generation.

## Logo (PROVISIONAL working logo)
**Source:** `brand/source/logo-screenshot-from-chat.png`, 1410×294, an opaque screenshot of the site header with no browser UI. **Cut out by `scripts/clean_logo.py`:**
- `brand/logo.png` (1337×221): lockup with the background and site tile removed.
- `brand/logo-on-dark.png`: wordmark reversed to white for the navy canvas. Our reversal, not a client file.
- `logo-mark.png` (171×216), `logo-mark-tile.png`, `logo-wordmark.png`, `logo-tagline.png`.
- Checked on navy and on magenta: no fringe, and no border arcs.

**Size limit:** the mark is only **216 px tall**. The S08/S26 logo moments need the SVG, or the mark as a PNG ≥ 1000 px tall (`brand/README.md`).

## Colours (provisional, not approved)
**Logo mark,** measured from the site screenshot in chat (`brand/provisional/logo-mark-from-screenshot-48x60.png`):
- The mark is only about 37×49 px and JPEG-compressed, so these values are approximate. It is too small to use on screen.
- Teal mortarboard: **#14A5A3** (mid #1DB2B0)
- Blue book: **#196AAC** (mid #2A70AD)
- Light cyan highlight: #A3E8F6
- The orange sunrise rays are too thin to measure.

**Site UI,** from the same screenshot (`ui/ref/site-home-hero-from-chat.jpg`, browser tabs cropped out):
- Headline navy **#0F1732**; dark card #101834.
- Gradient blue **#2D60E5** → violet **#8C35E7**; buttons #375CEA → #7140ED; chip violet #5349CE.
- Positive green **#3EAE91**; body grey #4A5467; page #FEFDFF.

**Canvas:** the brief's navy #07111f couldn't be checked, because eduledger.co.in is blocked by the network policy.

**Brand light (decided):** the site's blue → violet, #2D60E5 → #8C35E7 (see Decisions). It keeps clear of the logo teal (hue 179°), which sat next to the "green = present/paid" meaning (#3EAE91, hue 163°).

## Toolkit
- **HyperFrames student kit** at commit `0d30152`, in `.kit/` (gitignored). Reinstall with `scripts/setup-kit.sh`; its licences are in `third_party/hyperframes-student-kit/`.
- **Doctor:** passes for rendering with `PRODUCER_HEADLESS_SHELL_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

## Credits (ElevenLabs)
| Date | What | Estimate | Billed |
|---|---|---|---|
| 2026-10-06 | Scribe, VO master 49.5 s (flow `urbUYvJpEgMVygnk7TDP`) | 15.1 credits | **272.1 credits (₹4.79)** |
| | **Total** | | **272.1** |

The bill came in 18× the estimate, but stayed under the user's 500-credit cap.

## Network
The network policy denies huggingface.co, openaipublic.azureedge.net and eduledger.co.in. Word timing came from Scribe instead.

## Log
- **2026-10-06, Stage A:**
  - Saved the brief, the kit and the VO.
  - Wrote STYLE.md with P1–P9.
  - Stopped at the gate.
- **2026-10-06, Stage B:**
  - Recorded the decisions.
  - Scribe priced (15.1) and run (billed 272.1).
  - VO split into L01–L14 and measured.
  - Provisional colours taken from the chat screenshot. The logo attachment was missing.
  - Wrote client/FACTS.md (11 sign-offs), INPUTS.md (how to make each missing input) and scripts/verify_inputs.py (self-tested).
  - Stopped at the gate.
- **2026-10-06, Stage B decisions:**
  - Brand light set to the site's blue → violet.
  - S25 India map dropped, and its sign-off removed.
  - L14 replacement procedure set up (`vo/replaced.json` guard in `split_vo.py`).
  - The logo still did not arrive.
  - Inputs re-checked: 43 missing.
- **2026-10-06, Stage C:**
  - Logo and music found in this session's attachments (not on the branch). Saved as `brand/source/` and `music/track.mp3`.
  - Logo cut out (PROVISIONAL).
  - Music measured; drop at 15.05 s vs the planned ≈ 11 s.
  - Music edited at bar lines (`music/edit/bed.wav`).
  - VO lines placed on the grid.
  - 27-shot timeline with SFX anchors (`timeline.json`, TIMELINE.md).
  - Placeholder SFX (`sfx/placeholder/`, synth, excluded from the inputs check).
  - Slate preview rendered.
  - Inputs re-checked: 42 missing.
  - Stopped at the gate. No credits used.
- **2026-10-06, Stage D decision:** look approved (Inter Display + Inter, chrome type, navy grid floor, crosshairs, grain, vignette, corner marks, logo handling); the S20 placeholder card approved until the real screenshot arrives. Stage E started with placeholders.
- **2026-10-06, Stage D:**
  - S13 split (27 cuts).
  - `web/` HyperFrames project: DESIGN.md, local fonts and GSAP, generated timing.
  - Global stage and shots S01, S06, S07, S08, S13, S20, S26 built.
  - Chrome-text capture test passed.
  - Three review passes, with fixes as above.
  - Final stills, and the 60 fps motion test with audio.
  - lint/check pass.
  - Stopped at the gate. No credits used.
- **2026-10-06, Stage E:**
  - All 28 shots built and reviewed at 35 % and 70 % of each shot. Layout fixes as above.
  - Inputs auto-swap (`scripts/build_web.py`), tested with stand-in files.
  - Mix and master (`scripts/mix.py`), with real-SFX pickup and automatic sync points (tested).
  - Gates: lint, check sweep (contrast now 90/90), kit preflight, kit beat-sync plus an exact-word check, and the §4/§5 audit (`scripts/motion_audit.mjs`).
  - Full 60 fps draft rendered (about 15 min, 3 workers) and verified.
  - Verification found the late streak, the seek-order bug and the AAC peak. All fixed, then re-rendered and re-verified (`scripts/verify_render.py`, VERIFY.md).
  - Worker restarts mid-stage: work committed early, nothing lost.
  - Stopped at the gate. No credits used.
