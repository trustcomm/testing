# GoDevLevel launch film — STATE

Updated after every step. Asset-level detail (Canva IDs, export jobs) lives in `canva/ASSETS.md`.

## Current stage
**Asset-free work done, stopped for review ⏸.** I built the continuity engine, a PROVISIONAL timeline and three exemplars (Beat 1, Beats 4→5, Beat 8), then ran the checker.
- Stage 1 is still waiting on stills, footage, music and refs/.
- The final Stage 2 timeline (re-gridded to the real music) and the full Stage 4 build wait until the user confirms every asset is in place.

## Approved decisions
- **Brand** (no Canva Brand Kit exists; colours taken from `brand/logo.png`):
  - Orange #FD4B25: large type (≥48 px), shapes and the caret only. Never text under 48 px, because contrast on charcoal is only ~3.5:1.
  - Charcoal #323743: background.
  - Off-white #F5F3EF (the user's choice): all body and caption text.
- **Stills** (Canva generate-image, placed 1:1 in the holder design "GDL Launch — Stills Export", DAHXHyyBkx8, pages 2–7):
  - I1, S1, S2 and S4: approved as first generated.
  - S3: option B (MAHXHxXzRss), with the shopkeeper turned away and no signs.
  - S5: option A (MAHXH_UY_zU), with backs of heads and no faces in focus.
- **VO:** single take `vo/vo-master.mp3` (26.83 s, −21.5 LUFS), split into V1–V11 at pauses:

  | Line | Start–end (s) | Length (s) |
  |---|---|---|
  | V1 | 0.00–1.10 | 1.10 |
  | V2 | 1.23–2.46 | 1.23 |
  | V3 | 2.64–4.12 | 1.48 |
  | V4 | 4.41–7.09 | 2.68 |
  | V5 | 7.42–10.11 | 2.69 |
  | V6 | 10.41–14.00 | 3.59 |
  | V7 | 14.34–16.87 | 2.53 |
  | V8 | 17.18–20.26 | 3.08 |
  | V9 | 20.62–24.06 | 3.44 |
  | V10 | 24.40–25.26 | 0.86 |
  | V11 | 25.46–26.61 | 1.15 |

  Beats are laid out audio-first around the voice. The film may run 30–32 s. Loudness is normalised in the mix.
- **VO is final for v1.** Same file, vo-master.mp3 (26.83 s, −21.5 LUFS, ElevenLabs voice "Jay Johnson"). The accent may be revisited for an Indian / godevlevel.in version. Confirm the ElevenLabs plan allows commercial use.
- **No Hinglish** in this version.
- **Asset delivery is manual.** The user downloads from Canva and pushes files to the branch; I no longer retry the proxy.
  - Stills: `canva/stills/I1.png`, `S1.png` … `S5.png`.
  - Footage: `canva/footage/H1.mp4` … `H5.mp4`.
  - Music: the MP4 goes in `canva/music/`. I extract `track.wav` from it.

## Open items
| Item | Owner | Status |
|---|---|---|
| Review exemplars (Beat 1, Beats 4→5, Beat 8), the provisional timeline and the font choice (Inter Tight or Archivo) | user | waiting ⏸ |
| Approve Beat 8 sample content (headline "New phone in store.", price "₹19,999 · SAMPLE PRICE") | user | waiting |
| Stills I1, S1–S5 on the branch | user, by hand from holder pages 2–7 | waiting |
| Dimension check: I1 1680×944, S1–S5 944×1680 | me | once the stills arrive |
| Footage H1–H5.mp4 ("GDL Launch — Footage") | user | waiting |
| Music MP4 ("GDL Launch — Music") → `track.wav`, then tempo and downbeats | user, then me | waiting |
| 2–3 reference films in `refs/` → rhythm measurement (cuts/min, % near-still, beat lengths, contact sheet vs BRIEF §3) | user, then me | waiting. Fallback if none arrive: use the BRIEF §3 targets as they are |

## Engine (films/godevlevel-launch/engine/), clean-room, no motion-library code
- **Renderer:** plain Canvas2D, running in headless Chromium, which is used only to rasterise. puppeteer-core drives it.
  - My own code covers easing (cubic Bézier solver, spring), the camera, the carry geometry and the blur.
- **Handoff contract** (`web/core/carry.js`):
  - Every beat in `timeline.json` declares handoffIn and handoffOut as {kind, x, y, w, h, r, stroke?, colour, text?}.
  - Each beat's `carry(lt)` must equal handoffIn at 0 and handoffOut at its end. The checker verifies this exactly (|Δ| ≤ 1e-6).
  - A boundary without a carry must say `"cut": "hard"`.
- **One camera** (`web/core/camera.js`): keys over film time, interpolated with a monotone cubic Hermite. Position and velocity are continuous and it never overshoots, so it cannot jump at a boundary.
- **Motion blur** (`web/core/film.js`):
  - Applies only when tracked points move ≥ 6 screen px per frame.
  - 2–16 sub-frame samples over a trailing half-frame shutter, clamped to the current beat.
  - Samples are accumulated as integers, so output is deterministic.
  - Discrete steps (the typed caret) are not tracked.
- **Rules enforced in code:** orange text under 48 screen px throws an error. Placeholders are flat and labelled "PLACEHOLDER", never fake imagery.
- **Fonts (PROVISIONAL until the user picks):**
  - Display: Inter Tight ExtraBold, used now. Alternative offered: Archivo ExtraBold. Both OFL.
  - Code: JetBrains Mono (OFL).
  - Fonts are vendored in `engine/fonts/` with their licences.
- **Commands** (run in `engine/`):
  - `node scripts/plan.mjs` builds the timeline.
  - `node scripts/render.mjs stills` / `video <bXX-bYY> <out.mp4>`.
  - `node scripts/check.mjs` writes `out/check.json`.

## PROVISIONAL timeline (128 BPM assumed; re-grid when track.wav is measured)
| Beat | Time (s) | Beats | VO | Carry out |
|---|---|---|---|---|
| b01 | 0.000–1.875 | 4 | V1 0.469–1.569 | Phone outline |
| b02 | 1.875–2.813 | 2 | V2 1.775–3.005 (pre-lap 0.10 s, spills 0.19 s into b03) | Tower outline |
| b03 | 2.813–4.688 | 4 | V3 3.072–4.553 | Tag's bottom edge |
| b04 | 4.688–8.438 | 8 | V4 5.156–7.836 | Underline |
| b05 | 8.438–11.250 | 6 | V5 8.438–11.127 | Code editor window |
| b06 | 11.250–15.000 | 8 | V6 11.250–14.840 | Product frame |
| b07 | 15.000–17.813 | 6 | V7 15.000–17.530 | Product frame |
| b08 | 17.813–21.563 | 8 | V8 17.813–20.893 | 9:16 frame |
| b09 | 21.563–25.313 | 8 | V9 21.563–25.002 | Orange dot |
| b10 | 25.313–28.594 | 7 | V10 26.250–27.110 | Wordmark |
| b11 | 28.594–31.406 | 6 | V11 28.594–29.744 | end |

- **Length:** 31.41 s, 67 beats.
- **Spread:** 4.0× (just meets ≥4×). Only b02 can be that short, and only because V2 pre-laps the cut.
- **No three equal beats in a row.**
- **Planned near-still:** 6.36 s (20.3%).
- **Word onsets are estimated** (syllable-proportional inside detected phrases). Real alignment can replace them.

## Exemplar check (2026-10-05, PROVISIONAL grid)
- **Contracts:** b01, b04, b05 and b08 match handoffIn and handoffOut exactly.
- **Camera:** max 8.8 px/frame, no jump at any boundary.
- **Carry b04→b05** (frame 252 vs 253, handoff region): pixel 0.9981, carry-mask IoU 0.9994, whole frame 0.9994. PASS. Every other boundary is pending until its neighbouring beats are built.
- **Determinism:** 17 frames, identical in the same session and in a fresh browser. PASS.
- **Measured near-still (strict metric):** b01 74.5%, b04 48.6%, b05 57.1%, b08 25.0%.
  - b04 was 31.5% before word rises were shortened from 0.32 s to 0.20 s.
- **Motion blur:** on 21/56 (b01), 26/112 (b04), 18/85 (b05) and 37/113 (b08) frames.
- **Outputs:** stills and contact sheet in `engine/out/stills/`; previews with VO in `engine/out/preview-*.mp4`.
- **Still to be approved:**
  - Sample content in the Beat 8 frame: headline "New phone in store." (from V1) and price "₹19,999", labelled "SAMPLE PRICE".
  - The placeholder tint, which is charcoal blended 7% toward off-white.

## Blockers
- **Network:** the proxy refuses `export-download.canva.com:443` with `request blocked: no rule or allowlist entry allows host "export-download.canva.com"`. This was last seen at 2026-10-05 08:00 UTC, and the allow-list change didn't reach this session. It's worked around by manual downloads; I no longer retry.

## Log
- 2026-10-05:
  - Stage 1 measured the VO and the logo colours.
  - Stills were generated, then the regenerated S3/S5 options were approved and placed in the holder design.
  - Canva exports succeeded, but downloads are blocked, so delivery switched to manual.
  - Created STATE.md.
  - Logged the VO as final for v1.
  - Built the continuity engine, PROVISIONAL timeline, exemplars and checker; all checks pass. Stopped for review.
