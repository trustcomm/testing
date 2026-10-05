# GoDevLevel launch film — STATE

Updated after every step. Asset-level detail (Canva IDs, export jobs) lives in `canva/ASSETS.md`.

## Current stage
**All 11 beats are built asset-free on the PROVISIONAL grid; stopped for review ⏸.**
- Every boundary has a carry score and all pass. Placeholders stand in wherever footage or stills go.
- Stage 1 is still waiting on stills, footage, music and refs/.
- The final Stage 2 timeline (re-gridded to the real music) and the full asset build wait until the user confirms that footage, music and refs are in.

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
- **The V2 overlap across the Beat 2→3 cut is approved** (user, 2026-10-05).
- **Beat 8:** the "SAMPLE PRICE" label is removed (user). Beat 8 shows Beat 7's AFTER price.
- **SAMPLE CONTENT.** It is illustrative only: a fictional, unbranded phone. Replace it with a real client example later. It is defined once, in `engine/web/beats/shared/adframe.js`:
  - Headline "New phone / in store." (from V1). Beat 6's word swap goes from "New product" to "New phone".
  - Beat 7 price: BEFORE **₹21,999** → AFTER **₹19,999**. Beats 8 and 9 show the AFTER price.
- **Asset delivery is manual.** The user downloads from Canva and pushes files to the branch; I no longer retry the proxy.
  - Stills: `canva/stills/I1.png`, `S1.png` … `S5.png`.
  - Footage: `canva/footage/H1.mp4` … `H5.mp4`.
  - Music: the MP4 goes in `canva/music/`. I extract `track.wav` from it.

## Open items
| Item | Owner | Status |
|---|---|---|
| Display face | user | **Archivo APPROVED** 2026-10-05 (engine default) |
| Review the full asset-free draft and approve the interpretations above (reversed wordmark, URL .com or .in) | user | waiting ⏸ |
| Motion notes on the exemplars | user | waiting |
| Replace the SAMPLE frame content with a real client example | user | later |
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
  - 2–48 sub-frame samples (at most 8 px apart) over a trailing half-frame shutter, clamped to the current beat.
  - Samples are accumulated as integers, so output is deterministic.
  - Discrete steps (the typed caret) are not tracked.
- **Rules enforced in code:** orange text under 48 screen px throws an error. Placeholders are flat and labelled "PLACEHOLDER", never fake imagery.
- **Fonts:**
  - Display: **Archivo ExtraBold, approved 2026-10-05**. Inter Tight stays vendored for comparison only. Both OFL.
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
- **Planned near-still:** 6.0 s (19.1%).
- **Word onsets are estimated** (syllable-proportional inside detected phrases). Real alignment can replace them.

## Full asset-free build: check (2026-10-05, PROVISIONAL grid)
- **Handoff contracts:** all 11 beats start exactly at handoffIn and end exactly at handoffOut (|Δ| ≤ 1e-6).
- **Camera:** max 57.6 px/frame (the Beat 7 pull-back), with no jump at any of the 10 boundaries.
- **Carry scores** (last frame of A vs first frame of B, inside the handoff region; pass = pixel ≥ 0.98 and orange-mask IoU ≥ 0.95):

  | Boundary | Carry | Pixel | Mask IoU | Whole frame |
  |---|---|---|---|---|
  | b01→b02 | Phone outline | 0.99965 | 0.99626 | 0.99995 |
  | b02→b03 | Tower outline | 0.99951 | 0.99968 | 0.99992 |
  | b03→b04 | Tag's bottom edge | 0.99999 | 1.00000 | 1.00000 |
  | b04→b05 | Underline | 0.99810 | 0.99943 | 0.99940 |
  | b05→b06 | Code editor window | 0.99755 | 0.99938 | 0.99949 |
  | b06→b07 | Product frame | 1.00000 | 1.00000 | 1.00000 |
  | b07→b08 | Product frame | 1.00000 | 1.00000 | 1.00000 |
  | b08→b09 | 9:16 frame | 0.99920 | 0.97104 | 0.99985 |
  | b09→b10 | Orange dot | 1.00000 | 1.00000 | 1.00000 |
  | b10→b11 | Wordmark | 1.00000 | 1.00000 | 0.99834 |

- **Fixed on the way:**
  - 2→3 was pixel 0.958: Beat 3 now carries the tower's H2 contents through the snap.
  - 7→8 was IoU 0.51: the camera was still settling at the cut, so the pull-back now ends at 17.6 s.
  - 3→4 was 0.982: the tag shed now finishes before the last frame.
- **Not perfect:** 8→9 IoU is 0.971 because the camera keeps moving through that cut. It is continuous, with no jump.
- **Determinism:** 24 frames, identical in the same session and in a fresh browser.
- **Rhythm:**
  - Spread 4.0×, with no three equal beats in a row.
  - Planned near-still is 6.0 s (19.1%).
  - Measured near-still totals 14.1 s (45%). This is inflated: the placeholders are flat and static, and real H1–H5 and I1 will move. Stillness has to be re-measured once footage is in.
  - Per beat: b01 74.5%, b02 3.7%, b03 1.8%, b04 48.6%, b05 57.1%, b06 66.7%, b07 22.9%, b08 30.4%, b09 43.2%, b10 78.6%, b11 32.5%.
- **Motion blur:** 234 of 942 frames are blurred.
  - Samples are now spaced at most 8 px apart (max 48), so a 10 px caret trail stays continuous. At 16 samples, Beat 6's caret drop showed a comb of lines.
- **Engine fixes:**
  - The second frame of each beat lost its blur through a −1e-17 float; fixed with a tolerance.
  - A tracked-point jump faked a 1781 px/frame speed in Beat 6.
  - Infinite-size clip rects blanked Beat 6's frame and Beat 10's wordmark.
- **Outputs** (in `engine/out/`):
  - `draft-full.mp4`: the full film with VO, no music or SFX.
  - `contact-1fps.png`.
  - `stills/`.
  - `font-compare/compare.png`.
  - `check.json`.

## Asset-free interpretations to approve
- **Wordmark:** `engine/assets/logo-reversed.png` is derived from `brand/logo.png`, recoloured for the charcoal ground (`scripts/logo.py`).
  - "Go" and "Level" become off-white #F5F3EF; "Dev" stays orange; the letters themselves are untouched.
  - The orange bar under "Level" is the caret settling. It is not in the logo file.
- **Beat 3:** "OFFER" stamps at 84 / 104 / 124 px (each bigger, capped to fit the tag) in off-white inside the orange tag.
- **Beat 6:** "the whole frame recolours" is read as the frame starting ink-only and neutral. On "Your colours." the three brand swatches pop and the caret sweeps across, turning it orange and branded.
- **Beat 7:** a one-line code strip under the frame, `price: "₹21,999"`, scrambles to "₹19,999" in sync with the frame. "Re-render." runs an orange line down the frame.
- **Beat 9:** the first flip starts on the cut. The flips are centred on beats 2, 4 and 6, and the shrink to the dot runs from beat 7 to beat 8.
- **Beat 11:**
  - Tagline "Build your launch.": Display 76 px, off-white.
  - URL: "godevlevel.com". Confirm .com or .in.
  - Final hit on the 30.000 s downbeat: the bar runs the full wordmark width with a 3% pop. The fade to charcoal runs over the last 0.45 s.

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
  - Review round 1: made the font comparison; removed Beat 8's SAMPLE label; defined Beat 7's before/after prices.
  - Built Beats 2, 3, 6, 7, 9, 10 and 11.
  - The checker covers all 10 boundaries and all pass, after fixes to 2→3, 3→4 and 7→8, the blur spacing and three engine bugs.
  - Stopped for review.
  - User approved Archivo; it is now the engine default. Launch re-checked in Archivo: all 10 carry scores pass, determinism passes, draft re-rendered.
  - The reversed logo is approved for the reel's end card. The same asset is used in launch Beats 10–11; confirm it applies here too.
  - Engine was extended for the godevlevel.in reel (see that film's STATE.md): films/-rooted server, hard-cut handling, per-beat pre-roll, shared rhythm rule (accelerating runs may repeat lengths), tempo.py. The launch checker was re-run with unchanged scores.
