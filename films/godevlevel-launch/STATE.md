# GoDevLevel launch film — STATE

Updated after every step. Asset-level detail (Canva IDs, export jobs) lives in `canva/ASSETS.md`.

## Current stage
**Stage 1: MEASURE ⏸, waiting on inputs.** Stage 2 does not start until the user confirms that footage, music and refs/ are all in place.

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
- **No Hinglish** in this version.
- **Asset delivery is manual.** The user downloads from Canva and pushes files to the branch; I no longer retry the proxy.
  - Stills: `canva/stills/I1.png`, `S1.png` … `S5.png`.
  - Footage: `canva/footage/H1.mp4` … `H5.mp4`.
  - Music: the MP4 goes in `canva/music/`. I extract `track.wav` from it.

## Open items
| Item | Owner | Status |
|---|---|---|
| Stills I1, S1–S5 on the branch | user, by hand from holder pages 2–7 | waiting |
| Dimension check: I1 1680×944, S1–S5 944×1680 | me | once the stills arrive |
| Footage H1–H5.mp4 ("GDL Launch — Footage") | user | waiting |
| Music MP4 ("GDL Launch — Music") → `track.wav`, then tempo and downbeats | user, then me | waiting |
| 2–3 reference films in `refs/` → rhythm measurement (cuts/min, % near-still, beat lengths, contact sheet vs BRIEF §3) | user, then me | waiting. Fallback if none arrive: use the BRIEF §3 targets as they are |

## Blockers
- **Network:** the proxy refuses `export-download.canva.com:443` with `request blocked: no rule or allowlist entry allows host "export-download.canva.com"`. This was last seen at 2026-10-05 08:00 UTC, and the allow-list change didn't reach this session. It's worked around by manual downloads; I no longer retry.

## Log
- 2026-10-05:
  - Stage 1 measured the VO and the logo colours.
  - Stills were generated, then the regenerated S3/S5 options were approved and placed in the holder design.
  - Canva exports succeeded, but downloads are blocked, so delivery switched to manual.
  - Created STATE.md.
