# EduLedger launch film: inputs still needed (Stage B)

Put the files in these folders, push, and tell me. `python3 -I scripts/verify_inputs.py` re-checks everything and writes `inputs.json`.

## 1. Music → `music/`
- **Received:** `music/track.mp3` (2026-10-06). Measured, and edited to the film in Stage C.
- **Still needed:** `music/LICENSE.txt` with the source and its terms (if ElevenLabs Music, a note or screenshot showing the plan allows commercial use). **MISSING.**

## 2. Sound effects → `sfx/`
- **What:** the 14 prompts in BRIEF §3 (X01–X14), ElevenLabs sound effects, 2 variants each.
- **Names:** `sfx/X01_v1.wav`, `sfx/X01_v2.wav`, … `sfx/X14_v2.wav`. MP3 is fine if WAV isn't offered.
- **Length:** X05 and X07 should be short (0.3–0.4 s). X13 needs its long shimmer tail (3–4 s).

## 3. Logo, colours, fonts → `brand/`
- **Logo:** received (header screenshot, 1410×294) and cut out as a **PROVISIONAL** working logo (`brand/README.md`). Its mark is only 216 px tall, so the S08/S26 logo moments still need the developer's **SVG** (`brand/logo.svg`), or the mark as a PNG ≥ 1000 px tall on a transparent background.
- **Colours:** the developer's exact hex values, in `brand/colours.md`. The brand light is the site's blue → violet gradient (working values #2D60E5 → #8C35E7); the logo keeps its own colours.
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
The developer ticks each line. Ten items are open, including the E7 add-on, the demo data on screen, the "Demo" tag (P9), WhatsApp usage, the logo, the colours and the fonts.
