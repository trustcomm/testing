# EduLedger launch film: DESIGN

The visual identity for every composition in `web/`. It comes from BRIEF §4, the approved STYLE.md P1–P9, and the user's decisions in STATE.md. The brief wins over the kit's defaults.

## Style prompt
A dark, lit, super-energetic launch film. A deep-navy stage sits on a receding perspective grid with small "+" crosshairs, grain and a breathing vignette, framed by four textless corner marks (P8). Light is the brand: a blue → violet glow, halos and streaks, never flat fills.
- Act 1 is paperwork chaos in red: hard glitch cuts, things multiplying and overflowing.
- Then everything collapses into one thin glowing line, **the ledger line**. It flares and the EduLedger logo crystallises above it on the drop.
- From there the film is calm, confident product: real app screens in perspective frames, green for "present / paid", and kinetic white type that lands on the voice's words.
- It ends on the logo held over the returning ledger line, then the CTA.

## Colours (≤ 5 meanings)
| Role | Hex | Use |
|---|---|---|
| Canvas | `#07111F` | The navy stage (BRIEF §4). Deepest vignette `#03070E`. |
| Brand light | `#2D60E5` → `#8C35E7` | The site's blue → violet (user, 2026-10-06), used as light: the ledger line, glows, halos, streaks, rim light. Working values until the developer confirms (FACTS.md). |
| Chaos red | `#F0384B` | Paperwork chaos, Act 1 only (S01–S06). |
| Present / paid green | `#3EAE91` | Ticks, paid, present. Held back until S13 (P4). Measured from the site. |
| White | `#F4F6FF` | Type and UI. Secondary text `#AEB8D6`. |

The logo is always shown in its own colours (`assets/brand/`, PROVISIONAL).

## Typography
- **Inter Display** for kinetic statements: 800/900, tracking −0.04em.
- **Inter** for UI and labels: 400/600.
- One family at two optical sizes, as the brief asks: "Inter + one display face", and no site font has been supplied. Both are OFL, local files in `assets/fonts/` with `@font-face`.
- **Ladder at 1080p (P5):**

| Use | Font size (cap height) |
|---|---|
| Labels | 16 px (≈ 11) |
| UI copy | 28–36 px |
| Support lines | 72–96 px |
| Hero kinetic words | 220–280 px (≈ 160–200) |
| Stamps | up to 360 px |

- **Fill:** chrome type, as MOTION_PHILOSOPHY §2.2 asks. A subtle `#FFFFFF → #D7DDF6 → #F4F6FF` gradient is clipped to the text, and the halo is a `drop-shadow` on the parent block (brand light; red in Act 1).
  - The kit warns that `background-clip: text` renders invisible in capture. **It was tested on HyperFrames 0.7.109 (Stage D) and renders correctly** in both snapshot and render.

## Motion
- Cuts sit on the measured grid (`timeline.json`, 128.011 BPM, phase 0.054 s).
- Type leads its word by 0–0.2 s.
- Every whip streak is the ledger line (P2).
- Camera never sleeps: the grid scrolls, crosshairs twinkle, the vignette breathes, and the grain changes every frame.
- Eases follow MOTION_PHILOSOPHY §4.1:
  - entries: `expo.out` / `power3.out`;
  - exits: `power2.in`;
  - settles: `back.out(1.4)`.

## Placeholders (until the inputs land)
Hero renders H1–H5 and app screenshots are **not faked**. Each appears as a dashed outline labelled `PLACEHOLDER · H1 3D ledger book render` (etc.) at the size and position the real asset will take.

## What NOT to do
- No WhatsApp logo or WhatsApp app UI. "WhatsApp" appears as plain text only.
- No demo data (Greenfield Public School, Rahul Sharma, dashboard numbers) outside an app frame; a "Demo" tag goes on those frames (P9, pending sign-off).
- No red after S06. No green before S13.
- No flat white headlines without the halo. No full-screen linear gradients (banding); use radial glows.
- No `Math.random()`. Seeded values only.
