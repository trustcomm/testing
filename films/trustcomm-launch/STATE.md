# Trustcomm India launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md`. Every asset generation is logged in `ASSETS.md`.

## Current stage
**Stage 4 (ANIMATIC) done; stopped at its gate ⏸.**
- `out/animatic/animatic-en.mp4`: 61.43 s, 1920×1080, 30 fps, draft quality.
  - Sound: all 16 English VO picks, 78 SFX events, and a code-synthesised PLACEHOLDER pulse bed on the 124 BPM grid (no music yet).
  - Loudness: −14.1 LUFS, true peak −3.8 dBTP.
- Contact sheet: `out/animatic/contact-en-1fps.png`. Mid-beat stills: `out/animatic/stills/`.
- Checks: `out/animatic/check-en.json`, built by `scripts/animatic.mjs`.

| Check | Result |
|---|---|
| Carries | all 15 boundaries: each beat ends exactly on the next beat's carry-in (BRIEF §4 "carries out as") |
| Rhythm | 26 shots, shortest 0.233 s, longest 5.8 s (end hold), spread 24.9× (target ≥ 8×), no failing equal triples |
| Beat 14 montage | 0.97 → 0.73 → 0.47 → 0.37 → 0.23 s (on target) |
| Beat 8 flips | 0.53 / 0.50 / 0.67 / 0.60 s: they follow the voice (audio-first, user-approved), so they do not accelerate |
| Stillness | **34.2% vs the brief's ~15%** (open: see below) |
| Compliance | all 142 on-screen strings are brief copy, product copy, F8/F9, or the flagged draft translations. No forbidden words, no numbers outside the ledger, no Google assets. |
| Equal split | geometry Δ 0, pulse Δ 0, thumb mean x 960 |
| Sound sync | all 78 events placed on their frame (0 ms off) |
| VO | 16/16 lines fit their beats |
| Determinism | 16/16 mid-beat frames identical in a fresh browser |

**Built this stage:**
- **Beats 1–5, 7–9, 11–16:** new modules in `web/beat01.js` … `beat16.js`, with shared film graphics and carries in `web/kit.js`.
- **Beat 6:** its push is now the module's own view transform, so the camera is static throughout.
- **Phone screens:** Inter (OFL) at the product's own CSS sizes, measured from the screenshots: 32 / 20 / 18 / 16 px in a 480 px column, mapped to the phone. Chips run three per row. Poppins is used only for film titles and big type.
- **New product screens:** draft (demo-4) and owner message (demo-3) in `web/ui.js`.
- **Paperwork:** `client/FACTS.md` (F1–F10, ₹699, shops fictional, launch date and tagline TBD; the user ticks each line) and `refs/REFS.md` ("Use BRIEF §3 rhythm targets").
- **Colours:** marked "measured — confirm against site CSS before final" in `web/brand.js` and FACTS.md.

**Placeholders and open items (all flagged in code):**
1. **Phone screenshots of /r/demo:** the user said they were attached; **they did not arrive**. Unrated stars (grey #DCDBD7) and the mobile wraps are still inferred; matching them is a single-constant change (`CSS` in `web/ui.js`).
2. **Music:** placeholder pulse bed; the user is still checking terms.
3. **Logo:** `client/logo-from-chat.jpg` is used as a raster placeholder in Beats 4 and 16. The SVG is needed.
4. **Beat 16 map of India:** not drawn. An accurate, licensed outline is needed; the animatic shows the QR squares on a plain field instead of guessing a shape.
5. **Beat 8 translations** of "How was the food?" (Hinglish, Hindi, Kannada, Tamil, Telugu) are drafts. Use the product's own strings or confirm them. The product's language switcher is not in the screenshots; the chip is a film element.
6. **Review texts:** Beats 3, 13 and 14 use placeholder lines. Only the product's demo draft and the site's private-note example appear as words (BRIEF §10: the client approves every review text).
7. **SFX gaps in BRIEF §6:** Beat 1's wordless angry burst and the heartbeat pulse are code-synthesised placeholders. There is no crowd-cheer swell (Beat 14) and no haptic buzz (Beat 7).
8. **Stillness at 34%** against the ~15% target. The stillness pockets in Beats 3 and 13 (about 80% each) are deliberate, as is Beat 10's hover. Stage 5 adds continuous motion (global camera, carry handoffs) to bring the rest down.
9. **Beat 5's "camera swings round the stand"** is a draft squeeze, standing in for a 3D orbit.
10. **Hinglish animatic:** `node scripts/animatic.mjs hi` renders on `beats_hi.json` (62.88 s). Not run yet; Hinglish is Stage 6.

Credits used: **3,778 of 15,000** (none this stage).

## Plan agreed with the user (2026-10-05)
1. **VO and SFX:** generated through the ElevenLabs connector on the user's paid Starter plan (updated 2026-10-05; the earlier plan had the user generating them in the web app). Takes go to `vo/takes/` and `sfx/takes/`; only takes the user approves move to `vo/` and `sfx/`. **No free-tier audio anywhere in this project**: the test takes were deleted.
2. **Music:** the user adds a licensed track and its LICENSE to `music/`.
3. **Product UI and brand:** the user adds the logo SVG, brand colours, font files and real `/r/demo` screenshots to `client/` and `ui/` (instead of network access).
   - **Font:** Trustcomm's own if supplied.
   - Otherwise propose **Poppins** (geometric, OFL, has Devanagari for Hinglish captions), with **Baloo 2** as the alternative (OFL, rounded and friendly, Latin + Devanagari).
4. **References:** the user adds 2–3 films to `refs/`, or confirms the BRIEF §3 targets (`refs/REFS.md`).
5. **Client sign-offs** go in `client/FACTS.md`: launch date, tagline, F1–F10 wording, ₹699, real vs fictional shop names.

**When files land:**
1. Run `python3 scripts/verify_inputs.py`. It checks VO lengths, loudness and words/min, SFX count, the music licence and tempo, client, ui and refs, and writes `inputs.json`.
2. Log the results in ASSETS.md and STATE.md.
3. Run Stage 1 (MEASURE), then stop at its gate.

## Licence rule
- Build only with our engine, `films/godevlevel-launch/engine/`, imported and not forked.
- No onetake, and no other motion library.
- The repo's older root folder `trustcomm-launch/` (a HyperFrames + GSAP test from earlier) is **not** used. GSAP is a third-party motion library.

## Inputs status
| Input | Owner | Status |
|---|---|---|
| VO1–VO16 (English, paid ElevenLabs) | Claude via connector | 48 takes in `vo/takes/`, pre-picked; **awaiting the user's listening review** |
| VO1_hi–VO16_hi | Claude via connector | after the English takes are approved |
| SFX01–SFX12 | Claude via connector | 24 variants in `sfx/takes/` + synth fallbacks in `sfx/synth/`; awaiting choice |
| Music track + LICENSE | user, or ElevenLabs on OK | priced at 1,500 credits; terms unverified; waiting |
| Logo SVG, brand colours, fonts | user | **Partial:** a raster logo (JPG, 2000×667) arrived in chat and is saved as `client/logo-from-chat.jpg`. Colours measured from it, **not yet approved, not used**: blue ("comm") **#0E50FC**, dark ("trust") **#141723**, background #FFFFFF. JPG compression shifts colours slightly, so the SVG or official hex values are still needed. No fonts yet. |
| `/r/demo` and site screenshots in `ui/` | user | waiting |
| `client/FACTS.md` sign-offs | user and client | waiting |
| refs/ films or REFS.md | user | waiting |

History: on 2026-10-05 the connected ElevenLabs account was Free tier and was then disabled ("unusual activity… proxy or VPN"). trustcomm.app is blocked by the network policy, and is now bypassed with screenshots.

## Decisions so far
- **VO picks locked (user, 2026-10-05):** all 16 pre-picks accepted, and VO8 t1 locked. Recorded in `vo/picks.json` and copied to `vo/VO1.mp3` … `vo/VO16.mp3`. The user listed no rushed lines in that reply.
- **SFX picks accepted (user):** as in `sfx/picks.json`, copied to `sfx/SFXnn.*`.
- **Length: keep 61.4 s (user).** Beat 10 is not trimmed: its hover is deliberate.
- **Beat 8 is audio-first (user, 2026-10-05).** Lengthen Beat 8 to fit the VO8 take; no speed-up, no cut languages. The language flips are re-timed across the longer beat. Machine form: `beats.json`, built by `scripts/beats.py`. With VO8 t1:
  - **Length:** 11 beats = 5.323 s, from speech ending at 4.75 s plus a 0.30 s tail, rounded up to whole 124 BPM beats so every later cut stays on the grid. Beats 9–16 shift by +1.423 s, and no other beat is shortened yet (see Open 2).
  - **Flips:** each lands one frame before its spoken name: English 1.33 s, Hinglish 1.93, Hindi 2.47, Kannada 2.97, Tamil 3.63, Telugu 4.23 s into the beat. A 1.09 s hold follows the last flip.
  - **No real acceleration:** the voice reads the names at an even pace, so the gaps are 0.60, 0.53, 0.50, 0.67 and 0.60 s. The brief's 0.97 → 0.24 s acceleration can't coexist with flips that follow the voice. Instead the acceleration comes from flip transitions shortening from 0.30 to 0.08 s, and from the SFX07 tick-pop rising 2 semitones per flip.
  - The brief's 0.24 s shortest shot now comes from the Beat 14 montage only.
- **SFX defaults until the user listens** (`sfx/picks.json`):
  - Set by the user: SFX01 → v2, SFX10 → synth, SFX11 → synth loop.
  - Claude's picks, from measurements only (length nearest the brief, less clipping): SFX02 v2, SFX03 v1, SFX04 v2, SFX05 v2, SFX06 v1, SFX07 v2, SFX08 v2, SFX09 v2, SFX12 v2.
- **Stage 3 style frames approved as direction (user, 2026-10-05).** Then rebuilt on the real UI (see Current stage).
- **Hinglish picks accepted (user):** with Beat 2 lengthened audio-first for VO2_hi.
- **Stage 4 go-ahead (user, 2026-10-05):** the product's labels "On Google" / "Straight to the owner" are approved, with "You can do both, if you like." kept on screen. Poppins for film type only; Inter for the phone screens. Measured colours are working values.
- **Fast short lines** (VO2, 3, 7, 9, 11, 14 at 190–220 WPM): kept for now. The user will flag and regenerate any that sound rushed.
- **Voice: "Ishan – Bold and Upbeat"** (ElevenLabs library voice N09NFwYJJG9VSSgdLQbT), confirmed by the user. Generated through the connector with ElevenLabs default settings: the connector has no stability, similarity, style or speaker-boost controls.
- **Budget:** 15,000 credits for this film. Every batch is priced first, and the ledger is in ASSETS.md.

## Log
- 2026-10-05:
  - Created the folder layout (§8) and saved BRIEF.md.
  - The ElevenLabs connector is available. Priced VO1 (72 credits for 3 takes) and generated VO1 ×3.
  - The VO2–VO6 batch hit the rate limit, then the Free tier was disabled. Stopped all generation.
  - trustcomm.app is blocked by the network policy. Stopped at the blockers.
  - User plan agreed: the user supplies paid-plan VO and SFX, a licensed music track, client brand, UI screenshots and FACTS.md.
  - Deleted the free-tier test audio (`vo/_test-free-tier/`; it was never committed).
  - User reported "files pushed", but the remote has only one branch, with nothing beyond our last commit (b609efc). verify_inputs.py: everything missing (32 VO, 12 SFX, music + licence, logo SVG, colours, FACTS.md, ui, refs). Only the chat logo JPG was received. Stage 1 was **not** run.
  - Added `scripts/verify_inputs.py`, self-tested on a fake complete input set (32/32 VO, 12/12 SFX, music + licence, tempo 127.96 BPM on a 128 BPM click). It exits non-zero while anything required is missing.
- 2026-10-05 (paid plan):
  - **Connector check:** no tool exposes the plan or the credit balance, so the plan was verified indirectly.
    - The same workspace (5fabf1ef…) now generates without the earlier "disabled" error.
    - Prices now come back in INR, where before they came back in USD.
    - The plan name and the 34,611 balance could not be read.
  - **Licence screenshot:** the user says it was saved in `client/`, but it is **not on the branch**. `client/` holds only `logo-from-chat.jpg`.
  - **English VO:** VO1–VO16 ×3 generated in 5 batches, each priced first: 45, 369, 552, 324 and 426 credits, total 1,716.
    - Measured with `scripts/vo_takes.py`: length, speech span, WPM, LUFS, true peak and pauses. One take per line pre-picked.
    - Speech rate is mostly above 160 WPM on short lines (VO2, VO3, VO7, VO9, VO11 and VO14 run at 190–220). Every line except VO8 fits its slot.
  - **SFX:** SFX01–SFX12 ×2 generated. Priced at 1,200 credits; billed 400.
    - SFX01_v1 is near-silent and unusable.
    - SFX10 and SFX11 came out shorter than asked: the connector has no duration control.
    - Built code-synthesised fallbacks for all 12 (`scripts/synth_sfx.py` → `sfx/synth/`).
  - **Music:** available (eleven_music v1, v2 and v2.5); one 60 s track is priced at 1,500 credits.
    - Commercial terms could not be checked: elevenlabs.io is blocked by the network policy and the screenshot is missing.
    - Not generated, per the user's rule.
  - Stopped for the listening review.
- 2026-10-05 (user decisions round):
  - Built the phone review files (`scripts/review_audio.py`).
  - Re-timed Beat 8 audio-first (`scripts/beats.py` → `beats.json`). The film is now 61.42 s; keeping 60 s is an open question.
  - Recorded the SFX defaults (`sfx/picks.json`).
  - Music on hold while the user checks the terms. Plan screenshot not on the branch yet.
  - No credits used.
- 2026-10-05 (picks round):
  - **Picks:** locked the VO picks into `vo/`, the SFX picks into `sfx/`, and re-timed the film (`beats.json`, 61.42 s; every VO fits its beat).
  - **Reply placeholders:** the user's reply left the VO/SFX exceptions, rushed lines and music fields as template placeholders. They were read as "none", and music as "still checking": no credits spent.
  - **Stage 3:** style frames for Beats 6 and 10 built and checked.
    - Rendering fixes: whole-phone scaling; Beat 6's push now starts on beat 5, so there is no dead second.
    - Beat 10 fixes: the thumb sway fits the hover window (mean exactly centred), with a wider gap between the cards.
    - Loudness: a measured gain plus an oversampled limiter, because loudnorm can't lift clips this short.
  - Stopped at the Stage 3 gate.
- 2026-10-05 (Stage 3 review):
  - The user made real UI a blocker before Stage 4. Inputs checked: not landed yet.
  - Hinglish VO generated in 4 batches, all priced first; 1,662 credits, as estimated. Measured and pre-picked, with review files built.
  - Running total: 3,778 credits.
- 2026-10-05 (real UI):
  - Saved five /r/demo screenshots to ui/. Brand colours and the plan screenshot were not attached.
  - Measured the product colours from the screenshots, and rebuilt Beats 6 and 10 on the real screens.
  - Built the before/after and product-match sheets; all checks pass.
  - Hinglish picks copied to vo/; beats_hi.json built (62.88 s).
  - Stopped to show the user.
- 2026-10-05 (Stage 4):
  - Drafted FACTS.md and REFS.md. Phone UI moved to Inter at the product's sizes.
  - Built all 16 beats and rendered the 61.43 s English animatic with VO, SFX and the placeholder pulse. All checks pass except stillness (34% vs ~15%).
  - The user's phone screenshots did not arrive.
  - Stopped at the Stage 4 gate.
