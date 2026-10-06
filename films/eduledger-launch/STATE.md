# EduLedger launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md` (Director's Package v1, saved verbatim). The approved adaptations to it are in `STYLE.md` §3 and in Decisions below.

## Current stage
**Stage B (INPUTS) done; stopped at its gate ⏸.**

- **Received:** the VO only. It is now split into L01–L14 and measured, with Scribe word timings.
- **Still missing:** music + licence, SFX X01–X14, the logo file, exact colours, fonts, the 10 app screenshots, hero renders H1–H5, and the 11 sign-offs in `client/FACTS.md`. How to make each one is in **`INPUTS.md`**.
- **Checker:** `scripts/verify_inputs.py` (self-tested on fake inputs, cleaned up afterwards). Its last result is in `inputs.json`: 44 items missing.

**Waiting on the user:**
1. The logo image (it didn't arrive: the message still said "[attach it]").
2. Brand-light choice (see Colours).
3. A listen to L14 (see VO).
4. The inputs in `INPUTS.md`.

## Decisions (user, 2026-10-06)
- **P1–P7 approved** as proposed in STYLE.md §3.
- **P8 approved:** the textless corner-mark frame.
- **P9 approved,** pending the developer's OK: a small "Demo" tag on app frames that show demo-school numbers. Logged in `client/FACTS.md`.
- **VO:** split the single file at its pauses into L01–L14. Editing only: no regeneration, no voice change. Done.
- **Length about 52 s,** so the CTA card gets its full 5+ s hold. With the VO as recorded, the CTA would enter at L14 (≈ 46.65 s) and hold to 52.0 s (5.35 s). Stage C fixes the exact times on the beat grid.
- **Word timing:** ElevenLabs Scribe, priced first, approved under 500 credits. Done.
- **Logo:** the user's image is the working logo until the developer's SVG and exact colours arrive.

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

**Decision needed, the brand light (BRIEF §4 law 3):**
- The logo teal (hue 179°) sits next to the "green = present/paid" meaning (#3EAE91, hue 163°).
- The site's blue → violet separates cleanly from both green and red.
- **Proposed working default:** brand light = the site's blue → violet. The logo is always shown in its own colours. To be replaced by the developer's values.

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
