# EduLedger launch film: inputs still needed (Stage B)

Put the files in these folders, push, and tell me. `python3 -I scripts/verify_inputs.py` re-checks everything and writes `inputs.json`.

## 1. Music → `music/`
- **Generate:** ElevenLabs Music, only if your plan's terms cover commercial use. Otherwise license a track.
- **Licence:** save the terms (screenshot or PDF) as `music/LICENSE.pdf` or `music/LICENSE.png`.
- **Takes:** 2–3, as `music/take-1.mp3` … I measure the real tempo and downbeat and fit the VO to the grid in Stage C.
- **Prompt** (BRIEF §3, re-timed to the real VO and the 52 s length):

```
Super energetic modern tech-launch instrumental, 128 BPM, 4/4, 52 seconds.
Punchy kick, sharp claps, driving bass, bright synth stabs, riser builds,
a touch of Indian percussion (dhol fills) for flavour. Structure:
tense, choppy, glitchy intro 0–8 s (chaos); thins out 8–10 s under a
riser; a huge drop at ~11 s; a relentless driving groove 11–35 s with a
short lift at ~29 s; a steadier, pulled-back groove 35–38 s; a stomping
three-hit pattern 38–42 s; a big hit at ~43 s; a triumphant final section
43–50 s, ending in a shimmering tail to 52 s. No vocals. Must not
resemble any existing song.
```

The times follow the VO: "Meet EduLedger" starts at 10.9 s, "And parents?" at 29.2 s, the three stamps at 38.4, 39.5 and 41.2 s, the logo line at 43.2 s, and the CTA at 46.7 s.

## 2. Sound effects → `sfx/`
- **What:** the 14 prompts in BRIEF §3 (X01–X14), ElevenLabs sound effects, 2 variants each.
- **Names:** `sfx/X01_v1.wav`, `sfx/X01_v2.wav`, … `sfx/X14_v2.wav`. MP3 is fine if WAV isn't offered.
- **Length:** X05 and X07 should be short (0.3–0.4 s). X13 needs its long shimmer tail (3–4 s).

## 3. Logo, colours, fonts → `brand/`
- **Logo:** the logo image you meant to paste **did not arrive**: your message still said "[attach it]".
  - Attach it again, or save it as `brand/logo.png` (≥ 1000 px wide; transparent background if possible).
  - The developer's SVG goes to `brand/logo.svg` when it arrives.
- **Colours:** the developer's exact hex values, in `brand/colours.md`.
- **Fonts:** the site's typeface name and files (`.woff2` / `.ttf`), in `brand/fonts/`.

## 4. App screenshots → `ui/`
**How to capture them:**
- Use the developer's **demo account** only: no real students, staff or parents.
- The app content must be **≥ 1920 px wide**: a 1920×1080 window at 100%, or a 2× Retina capture.
- Capture the page only, with no browser tabs, address bar or bookmarks.
- PNG.

| File | Shows |
|---|---|
| `ui/dashboard.png` | Main dashboard (command centre) of the demo school |
| `ui/students.png` | Student records list or a student profile |
| `ui/admissions.png` | Admissions / onboarding |
| `ui/attendance.png` | Attendance marking for one class (present/absent) |
| `ui/fees.png` | Fees / invoices with collection status |
| `ui/receipt.png` | A generated fee receipt |
| `ui/payroll.png` | Staff & payroll |
| `ui/cashbook.png` | Cashbook / financial report |
| `ui/parent-chat.png` | The parent message card EduLedger shows on its website |
| `ui/phone.png` | Any EduLedger view on a phone, at the phone's native resolution |

## 5. Hero renders → `heroes/`
- **What:** the five prompts in BRIEF §6 (H1 ledger book, H2 receipts, H3 rupee coin, H4 phone, H5 school building).
- **Format:** 16:9, **3840×2160** PNG, on plain navy `#07111f`.
- **Names:** `heroes/H1.png` … `heroes/H5.png`.
- **Source note:** add `heroes/SOURCE.md` naming the generator and how its terms allow commercial use.

## 6. Sign-offs → `client/FACTS.md`
The developer ticks each line. Eleven items are open, including the E7 add-on, the demo data on screen, the "Demo" tag (P9), WhatsApp usage, the logo, the colours, the fonts and the India map for S25.
