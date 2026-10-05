# Trustcomm India launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md`. Every asset generation is logged in `ASSETS.md`.

## Current stage
**Waiting for the user's picks after listening ⏸.** Review files have been pushed for phone listening (not for delivery):
- `vo/review/VO1_takes.mp3` … `VO16_takes.mp3`: t1, t2, t3. Before take k you hear k short beeps.
- `vo/review/picks_reel.mp3`: the 16 current pre-picks in order, 0.5 s apart (44 s).
- `sfx/review/SFX_all.mp3`: for each ID, v1, v2 and the synth fallback (1, 2 or 3 beeps before each), with a low tone between IDs. Cue sheet: `sfx/review/SFX_all.txt`.
- VO clips are trimmed and gain-matched to about −16 LUFS, so takes compare on performance, not level.
- SFX clips are peak-normalised to −3 dBFS, with gain capped at +12 dB so the near-silent SFX01_v1 stays near-silent.
- Built by `scripts/review_audio.py`. Source takes are unchanged.

Credits used: **2,116 of 15,000** (nothing generated this round). Nothing has moved to `vo/` yet.

**Open:**
1. **VO picks:** the user replies after listening. Their picks go in `vo/picks.json`. The chosen takes are then copied to `vo/`, and `beats.py` and `review_audio.py` are re-run.
2. **60 s length:** Beat 8 now runs 5.32 s instead of 3.9 s, so the film is **61.42 s** (+1.42 s). Keep it, or win the time back elsewhere?
   - Beat 16's hold is not enough on its own. Cutting 1.42 s leaves 4.38 s against VO16 t3's 3.58 s plus the final hit and hold.
   - Beat 10 has the most spare air: 1.15 s of VO in a 3.8 s beat.
   - Waiting on the user.
3. **VO8 take choice:** if the user picks VO8 t2 or t3, Beat 8 grows to about 14 beats (6.8 s). Their word gaps also don't separate cleanly, so the flip timing needs a word-timed transcript (ElevenLabs Scribe; priced first).
4. **Music:** the user is checking ElevenLabs' commercial terms. Do not generate.
5. **Plan screenshot:** the user is uploading it to `client/`. Not on the branch yet (checked 2026-10-05).
6. **Fast short lines:** left as they are. The user will flag any that sound rushed and regenerate those in the web app.
7. **Hinglish VO:** after the English takes are approved.

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
- **Beat 8 is audio-first (user, 2026-10-05).** Lengthen Beat 8 to fit the VO8 take; no speed-up, no cut languages. The language flips are re-timed across the longer beat. Machine form: `beats.json`, built by `scripts/beats.py`. With VO8 t1:
  - **Length:** 11 beats = 5.323 s, from speech ending at 4.75 s plus a 0.30 s tail, rounded up to whole 124 BPM beats so every later cut stays on the grid. Beats 9–16 shift by +1.423 s, and no other beat is shortened yet (see Open 2).
  - **Flips:** each lands one frame before its spoken name: English 1.33 s, Hinglish 1.93, Hindi 2.47, Kannada 2.97, Tamil 3.63, Telugu 4.23 s into the beat. A 1.09 s hold follows the last flip.
  - **No real acceleration:** the voice reads the names at an even pace, so the gaps are 0.60, 0.53, 0.50, 0.67 and 0.60 s. The brief's 0.97 → 0.24 s acceleration can't coexist with flips that follow the voice. Instead the acceleration comes from flip transitions shortening from 0.30 to 0.08 s, and from the SFX07 tick-pop rising 2 semitones per flip.
  - The brief's 0.24 s shortest shot now comes from the Beat 14 montage only.
- **SFX defaults until the user listens** (`sfx/picks.json`):
  - Set by the user: SFX01 → v2, SFX10 → synth, SFX11 → synth loop.
  - Claude's picks, from measurements only (length nearest the brief, less clipping): SFX02 v2, SFX03 v1, SFX04 v2, SFX05 v2, SFX06 v1, SFX07 v2, SFX08 v2, SFX09 v2, SFX12 v2.
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
