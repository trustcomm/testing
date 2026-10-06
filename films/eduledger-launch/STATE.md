# EduLedger launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md` (Director's Package v1, saved verbatim). The approved adaptations to it are in `STYLE.md` §3 and in Decisions below.

## Current stage
**Stage C (TIMELINE) done; stopped at its gate ⏸.**

- **Shot list with real times:** `TIMELINE.md`. Machine form: `timeline.json`, built by `scripts/timeline.py`.
- **Preview:** `out/timeline/preview.mp4`, with slates per shot, the beat counter, the music landmarks, the real VO and the edited music, plus PLACEHOLDER SFX.
- **Headline numbers:**
  - 52.55 s; 27 shots / **26 cuts**, all on a beat (13) or half beat (13);
  - each cut leads its word by 4–139 ms;
  - average shot 1.95 s; spread 8.0×;
  - CTA hold 5.62 s; logo held 3.75 s; preview mix −14.0 LUFS.
- **Music edit,** whole bars only (TIMELINE.md §2):
  - intro bars 2–3 dropped, so the drop lands on "EduLedger" at 11.30 s;
  - groove bar 10 played twice, so the break falls under "Built for Indian schools" and the return hit on the logo line at 43.18 s;
  - a jump to the outro at the CTA (46.93 s); film end 52.55 s.
- **Inputs:** `verify_inputs.py` re-run, 42 items missing (`inputs.json`): music licence, SFX X01–X14, exact colours, the logo SVG (or a mark ≥ 1000 px tall), 10 screenshots, H1–H5 and 10 sign-offs.

**Waiting on the user (Stage C gate):**
1. Approve the music edit and the shot list, or ask for changes. TIMELINE.md §6 has the options: carry Act 1's acceleration inside the shots, or add a 27th cut; optionally split S13.
2. `music/LICENSE.txt` (source and terms). **MISSING.**
3. The listen to L14.
4. The other inputs as they land.

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
- **Brand light (user, 2026-10-06):** the site's blue → violet gradient, measured at **#2D60E5 → #8C35E7** (working values until the developer confirms). The logo is always shown in its own colours.
- **S25 (user, 2026-10-06):** **the India map is dropped.** The 3D school building (H5) alone carries "Built for Indian schools". This overrides BRIEF §5 S25 ("with India-map glow points"), and the map sign-off is removed from FACTS.md.
- **L14 (user, 2026-10-06):** the user is listening. If "EduLedger" is mispronounced, the user regenerates L14 and replaces `vo/L14.wav`. Then:
  1. Add `{"L14": "<who, date, voice and settings>"}` to `vo/replaced.json`, so `split_vo.py` never overwrites the new take (guard tested).
  2. Run Scribe on L14 only (priced first; within the 500-credit cap).
  3. Re-measure L14 in `vo/lines.json`.

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
