# EduLedger launch film: TIMELINE (Stage C)

Audio-first: the real VO and the real music on the music's measured beat grid.
- **Source of truth:** `timeline.json`, built by `scripts/timeline.py`.
- **Preview to watch and listen to:** `out/timeline/preview.mp4` (slates, real VO and music, PLACEHOLDER SFX).
- **Length:** 52.55 s (3,153 frames at 60 fps).

## 1. Grid
- **Tempo:** 128.011 BPM, beat 0.468710 s, downbeat phase 0.054 s. Fitted on the kick attacks in the groove (track 15–56 s).
- **Cross-checks:**
  - the kit's `music-grid.mjs` reads 127.95 BPM;
  - three separate sections agree within 8 ms;
  - the edited bed re-measures with the same kick phase as the source.
- **Bar:** 1.8748 s. Every music edit is whole bars, so the grid runs unbroken from 0 to 52.55 s.

## 2. Music edit (track.mp3 → `music/edit/bed.wav`)
The track as delivered drops at **15.05 s** and runs 70.0 s, with music to about 64 s. The edit moves the drop onto "EduLedger" and ends at 52.55 s.

| Out (s) | Source (s) | Bars | Why |
|---|---|---|---|
| 0.00–3.80 | 0.00–3.80 | intro bars 0–1 | — |
| 3.80–16.93 | 7.55–20.68 | bars 4–10 | **drops intro bars 2–3** (join score 0.32), so the riser, the pre-drop dip and the **drop land at 11.30 s** |
| 16.93–18.80 | 18.80–20.68 | bar 10 again | **one repeated groove bar** (join 0.12, the cleanest), so the break and the return hit land on the logo line |
| 18.80–46.93 | 20.68–48.80 | bars 11–25 | groove; the variation ("lift") falls at **26.30 s**; the one-bar **break 41.30–43.18**; the **return hit at 43.18** |
| 46.93–52.55 | 56.30–61.92 | outro bars 30–32 | jumps to the outro as the CTA starts (join 0.32); a 0.75 s fade at the end |

**Join scores:**
- The score is the spectral mismatch around a join; for scale, a normal bar-to-bar change in the groove scores 0.25.
- The cuts are made 12 ms before the downbeat with 8 ms equal-power crossfades, so the kick attack after each join stays whole.
- Measured: no click at any join; the largest sample step is under a sixth of the local maximum.

**Landmarks on the out timeline:**

| Landmark | Time | Beat |
|---|---|---|
| Pickup | 10.83 s | 23, on "Meet" |
| Drop | 11.30 s | 24, on "EduLedger" |
| Lift | 26.30 s | 56 |
| Break | 41.30 s | 88, on "Built" |
| Return hit | 43.18 s | 92, on "EduLedger." (logo) |
| Outro | 46.93 s | 100, on "Get started" |
| End | 52.55 s | 112 |

## 3. VO placement (lines from `vo/L01–L14.wav`, untouched)
- Each line keeps its own internal timing; only its start moves.
- Anchors: "Meet" on beat 23, so the drop lands on "EduLedger"; the logo line on the return hit; "Get" on beat 100.
- Every other line moves by at most ±0.12 s so its cut words sit just after a beat or half beat. The exception is L12 (+0.185 s), which puts the three stamps on the grid.
- Gaps between lines stay at least 60% of the recorded gaps.

| Line | Starts (s) | Speech (s) | Shift vs recording |
|---|---|---|---|
| L01 | −0.065 | 0.06–2.48 | −0.065 |
| L02 | 2.695 | 2.87–7.35 | −0.010 |
| L03 | 7.410 | 8.09–10.21 | −0.015 |
| L04 | 10.769 | 10.85–11.91 | −0.086 (anchor) |
| L05 | 12.245 | 12.54–15.10 | −0.020 |
| L06 | 15.360 | 15.57–17.41 | −0.115 |
| L07 | 17.650 | 17.71–20.79 | −0.075 |
| L08 | 21.210 | 21.41–25.07 | −0.015 |
| L09 | 25.570 | 25.61–28.73 | +0.025 |
| L10 | 29.105 | 29.13–34.53 | −0.050 |
| L11 | 34.960 | 35.05–37.93 | −0.055 |
| L12 | 38.310 | 38.57–42.75 | +0.185 |
| L13 | 43.130 | 43.20–46.22 | +0.015 (anchor) |
| L14 | 46.910 | 46.95–49.55 | +0.265 (anchor) |

## 4. Shot list (real times)
**Lead** is how long the cut comes before its word (target 60 ms; allowed 0–200 ms).

| # | Start–end (s) | Dur | Cut on | Lead | Word | Transition in | Picture | SFX |
|---|---|---|---|---|---|---|---|---|
| S01 | 0.000–0.750 | 0.75 | start | — | Registers | film start | 3D ledger book (H1) slams onto the grid floor; REGISTERS scales 8× through camera | X01 @0.05 |
| S02 | 0.750–1.700 | 0.95 | half 1.5 | 118 | receipts | hard glitch cut | Receipt stack (H2) whips in; red | X02 @0.75 |
| S03 | 1.700–2.867 | 1.17 | half 3.5 | 21 | reminders | hard glitch cut | Ringing-phone icons multiply; red | X03 @1.70 |
| S04 | 2.867–4.500 | 1.63 | beat 6 | 4 | spreadsheets | hard glitch cut | Spreadsheet cells flicker and glitch red | X05 @2.87 |
| S05 | 4.500–5.917 | 1.42 | half 9.5 | 43 | paper | hard glitch cut | Attendance sheet, frantic scribbled ticks | X04 @4.50, 4.97 |
| S06 | 5.917–8.017 | 2.10 | half 12.5 | 137 | phone | hard glitch cut | Call bubbles stack until they overflow | X03 @5.92 |
| S07 ★ | 8.017–10.833 | 2.82 | beat 17 | 63 | Running | morph: chaos → the ledger line | One thin glowing ledger line; rest beat (music thins, pre-drop dip) | — |
| S08 ★ | 10.833–12.467 | 1.63 | beat 23 | 20 | Meet | line flare → flash through white | On "Meet" the line flares; **drop on "EduLedger" (11.30)**: logo crystallises above the line, brand light floods | X06 impact @11.30 |
| S09 | 12.467–15.517 | 3.05 | half 26.5 | 65 | one | light-streak whip | Real dashboard slides up in perspective on the grid | X07 @12.47 |
| S10 | 15.517–16.217 | 0.70 | beat 33 | 44 | Students | push-in to a card | Student records card pops forward | X08 @15.52 |
| S11 | 16.217–16.933 | 0.72 | half 34.5 | 61 | staff | vertical whip | Staff & payroll card | X07 + X08 @16.22 |
| S12 | 16.933–17.633 | 0.70 | beat 36 | 97 | fees | vertical whip | Fee card | X07 + X08 @16.93 |
| S13 | 17.633–20.217 | 2.58 | half 37.5 | 94 | admissions | light-streak whip | Class grid: present ticks ripple green | X07 @17.63; X09 ×6 @18.10–18.68 |
| S13b | 20.217–21.383 | 1.17 | beat 43 | 36 | dashboard | push-out: the grid becomes a dashboard tile | The class grid docks into one clean dashboard (real dashboard UI) | — |
| S14 | 21.383–22.783 | 1.40 | half 45.5 | 25 | Fees | light-streak whip | 3D rupee coin (H3) spins, lands on "collected" | X07 @21.38; X10 @22.08 |
| S15 | 22.783–23.483 | 0.70 | half 48.5 | 39 | receipted | morph: coin → receipt | Receipt prints out of a card (real receipt UI) | X02 @22.78 |
| S16 | 23.483–25.600 | 2.12 | beat 50 | 116 | tracked | morph: receipt edge → ledger line → fee bar | Fee-collection bar fills in the demo dashboard frame | X09 @24.43 (bar full, "real time") |
| S17 | 25.600–27.467 | 1.87 | half 54.5 | 6 | Payroll | light-streak whip | Payroll list → cashbook chart (cross-warp) | X07 @25.60 |
| S18 ★ | 27.467–29.117 | 1.65 | half 58.5 | 111 | with | morph: pages → paper stack | Paper crumples into particles; breathing beat | X14 @28.18 ("paperwork") |
| S19 | 29.117–30.050 | 0.93 | beat 62 | 16 | and | slide-up | Phone (H4) slides up from below | X07 @29.12 |
| S20 | 30.050–32.400 | 2.35 | beat 64 | 139 | updated | push-in to the screen | EduLedger chat card types the parent message ✓✓, "Add-on" chip | X11 @31.45 ("WhatsApp") |
| S21 | 32.400–34.967 | 2.57 | beat 69 | 34 | Attendance | vertical whip | Three message chips stack on three words | X07 @32.40; X08 @32.40, 33.10, 33.80 |
| S22 ★ | 34.967–38.483 | 3.52 | half 74.5 | 72 | every | pull-out (dolly) | Camera dollies out across the demo dashboard; stats count up inside the frame | X09 ×8 @35.20–36.83 |
| S23 | 38.483–39.667 | 1.18 | beat 82 | 77 | No | hard cut on the stomp | Kinetic stamp: NO SETUP FEE | X12 @38.48 |
| S24 | 39.667–41.300 | 1.63 | half 84.5 | 25 | Secure | hard cut on the stomp | Shield/lock glyph + stamp: SECURE BY DESIGN | X12 @39.67 |
| S25 | 41.300–43.183 | 1.88 | beat 88 | 45 | Built | hard cut on the stomp (music breaks here) | 3D school building (H5), brand light on the façade (**no map**) | X12 @41.30 |
| S26 ★ | 43.183–46.933 | 3.75 | beat 92 | 20 | EduLedger. | morph: ledger line returns on the return hit | Logo crystallises; tagline word by word; logo held 3.75 s | X13 @43.18 |
| S27 ★ | 46.933–52.550 | 5.62 | beat 100 | 20 | Get | push-in to the CTA | CTA card: eduledger.co.in, "Get started", ledger-line underline; hold to the end | — (music outro tail) |

## 5. Checks against the brief and P1–P9
| Check | Result |
|---|---|
| Cuts | **27** (target 25 ± 2), 28 shots. S13 is split on "dashboard" (user, Stage C review). |
| On the grid | **27/27**: 14 on full beats, 13 on half beats; every cut lands on a 60 fps frame |
| Cut leads its word | 4–139 ms (median 44 ms); none late |
| Average shot | 1.88 s (BRIEF ≈ 1.9) |
| Spread (P3, target ≥ 8×) | 0.70–5.62 s = **8.0×** |
| Rest beats | S07 2.82 s, S18 1.65 s, S22 3.52 s |
| Logo hold (≈ 2 s) | the logo is formed at 43.18 and held to 46.93 (3.75 s, with the tagline) |
| CTA hold (5+ s) | **5.62 s** |
| Ledger line (≥ 3×) | S07, S08, every light-streak whip (P2), S16 fee bar, S20 bubble edge, S26, S27 underline |
| SFX | 45 events, each on its visual event: 22 at a cut, the rest on words or beats inside shots. X06's impact is on the drop. X13 is on the return hit. |
| Transitions (P1) | 5 glitch cuts, 3 stomp cuts, 5 morphs, 7 whips (4 streak, 3 vertical), 1 flash, 6 camera moves (push / pull / slide) |
| Preview loudness | −14.0 LUFS integrated, sample peak −1.5 dBFS (placeholder SFX; the true peak will be measured on the final master) |

## 6. Decisions (user, Stage C review, 2026-10-06)
1. **Music edits approved.** The reply kept the template wording "[approved after watching the preview]" and flagged no join.
2. **Act 1:** keep the cuts as they are. The speed-up is built *inside* S04–S06: cells flicker and bubbles stack on eighths, then sixteenths, then 32nds (`timeline.json`, `internal`).
3. **S13 is split on "dashboard"** (S13b), making 27 cuts. S09 stays as it is.
4. **The stamps carry** "No setup fee / Secure by design / Built for Indian schools" into the break; the logo hits on the return. Approved.

The options as offered at the Stage C gate:

## 6. Where the plan bends, and choices for you
1. **Act 1 doesn't accelerate by cut length.**
   - The VO is front-loaded: "Registers. Receipts. Reminders." gives cuts 0.75–1.17 s apart, then L02's phrases are 1.4–2.1 s apart.
   - **Proposal:** carry the acceleration *inside* S04–S06 (cells flicker on eighths, then sixteenths; bubbles stack faster and faster) and keep 26 cuts.
   - The alternative is one extra half-beat cut in S06 ("…for parents"), which makes 27 cuts, the top of the range.
2. **Two long middle shots: S09 (3.05 s) and S13 (3.75 s).** Both are long because of their VO lines. Internal motion carries them: the dashboard slide-up and push in S09, the ripple and a camera drift in S13.
   - *Optional:* split S13 on "dashboard" (≈ 20.4 s) for a 27th cut.
3. **The music has no "stomp" section.** The three stamps ride the groove into the one-bar break, so "Built for Indian schools" lands as the music drops out. Then the logo hits on the return. That is the showreel's pre-drop-dip grammar, and the X12 stamps provide the stomps.
4. **The CTA plays over the outro.** The music winds down under "Get started at eduledger dot co dot in", and the 5.6 s hold ends on a fade.
