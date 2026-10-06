# EduLedger launch film: STATE

This file is updated after every stage. The brief is `BRIEF.md` (Director's Package v1, saved verbatim).

## Current stage
**Stage A (STUDY) done; stopped at its gate ⏸.**

- `STYLE.md` holds the measured breakdown of both reference films, and proposals **P1–P9** for BRIEF §4–5.
- Evidence is in `out/study/`:
  - contact sheets and verified cut strips (JPEG);
  - `measure.json` for each film;
  - `sync.json`.
- Scripts: `scripts/study.py`, `scripts/strips.sh`, `scripts/study_sync.py`.

Headline numbers:

| | Showreel | AIS ad | BRIEF |
|---|---|---|---|
| Cuts per minute | 64 | 36.2 | 31.2 |
| Average shot | 0.88 s | 1.60 s | 1.85 s |
| Spread (longest ÷ shortest) | 12.7× | 4.9× | 6.9× |
| Near-still | 19.1% | 19.6% | — |
| Static type range | ≈17–20× | ≈5.5× | 8× |
| Transition types | 9 | 1 (hard cut) | 2 (whips) |
| Cuts on the grid | 15/16 within 35 ms of a beat or half beat (median 9 ms) | Not beat-locked; follow the VO | — |

**Waiting on the user:**
1. Approve, change or reject P1–P9 in `STYLE.md` §3.
2. The supplied VO is one file (see Inputs). May I split it into L01–L14 at its pauses in Stage B? This is editing only: no regeneration, no voice change.

## Toolkit
- **HyperFrames student kit** at commit `0d30152a82b9ceb93cfdd9bdbf46f0d5ab3cde86` (28 Sep 2026).
  - It lives in `films/eduledger-launch/.kit/`, which is gitignored because the kit is about 820 MB.
  - Reinstall it with `scripts/setup-kit.sh`.
  - Its LICENSE, THIRD_PARTY_NOTICES, HYPERFRAMES-LICENSE and PIPELINE-USE-PERMISSION are kept in `third_party/hyperframes-student-kit/`.
- **Install:** `npm ci` OK (hyperframes 0.7.109 and gsap 3.14.2, as pinned by the kit; npm reports 9 audit advisories). `npm run setup` OK.
- **`npx hyperframes doctor`:** passes for rendering once pointed at the pre-installed headless Chromium (`PRODUCER_HEADLESS_SHELL_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`). Optional items not installed: whisper-cpp, Kokoro TTS, MusicGen, Docker.
- **Read:** CLAUDE.md, MOTION_PHILOSOPHY.md, README, THIRD_PARTY_NOTICES, and the `motion-showreel` skill and its reference breakdown.
  - Still to read before the build (Stages D–E): `style-library/GUIDE.md` and the hyperframes, gsap and website-to-hyperframes skills.

## Inputs status
| Input | Status |
|---|---|
| VO | **Received as one file**, not L01–L14: `vo/master/ElevenLabs_2026-10-06T08_30_29_Hope_-_upbeat_and_clear_pvc_sp96_s50_sb75_v4.mp3`. Voice "Hope – upbeat and clear", chosen by the user. 49.48 s, mono 44.1 kHz, 128 kb/s, −25.2 LUFS integrated. Speech runs from 0.0 s to about 49.4 s, with 19 pauses over 0.25 s. Full per-line measurement is Stage B. |
| Music + LICENSE | not yet |
| SFX X01–X14 | not yet |
| Brand: logo SVG, colours, fonts | not yet. eduledger.co.in is blocked by the network policy, so the brief's fallback logo URL can't be fetched. A logo file is needed. |
| UI screenshots | not yet. The chat included one home-page screenshot (hero + demo dashboard card). |
| Hero renders H1–H5 | not yet |
| client/FACTS.md | not yet |

## Heads-up for Stage C
The VO fills the whole 50 s. If L14 starts at the last pause (about 46.7 s; Stage B will confirm), the CTA card gets about 3.3 s inside 50 s, short of the brief's 5+ s hold. The options are:
- run the film to about 52 s;
- bring the CTA card in during L13;
- tighten the VO's pauses in the edit.

Stage C will propose one.

## Network
The environment's network policy denies these hosts:
- **huggingface.co** and **openaipublic.azureedge.net**: local Whisper weights, which Stage E needs for word timing;
- **eduledger.co.in**: the site.

Options for word timing:
- allow those hosts in the environment's network settings;
- approve ElevenLabs Scribe credits;
- let me try offline forced alignment against the known script (PocketSphinx from PyPI, which is reachable; not yet tested).

## Log
- 2026-10-06:
  - Saved BRIEF.md and the folder layout.
  - Saved the VO from chat to `vo/master/`.
  - Cloned the kit, ran npm ci, setup and doctor.
  - Stage A:
    - Measured both showcase films frame by frame and verified every cut by eye (16 + 4 morphs; 30).
    - Measured stillness, type caps, sync and loudness.
    - Wrote STYLE.md with proposals P1–P9.
    - Stopped at the gate.
  - No credits used.
