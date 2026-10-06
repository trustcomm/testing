# EduLedger Launch Film — Director's Package v1 https://eduledger.co.in

**Client:** EduLedger (eduledger.co.in), a school ERP by GMS Designs and Tech
**Film:** 50 s, 16:9 1920×1080 at 60 fps, ~26 cuts (target 25 ±2), super energetic. Then a 9:16 cut.
**Toolkit:** HyperFrames student kit (github.com/nateherkai/hyperframes-student-kit), MIT + explicit commercial-video permission. Its `MOTION_PHILOSOPHY.md` is the motion bible, adapted to EduLedger's brand below.
**Audio:** voiceover, music and SFX are made by the user in ElevenLabs and supplied as files. The kit builds and syncs the visuals.

---

## 1. Fact ledger (the film may say nothing else)

Source: eduledger.co.in and /about, read 6 Oct 2026. Every item marked **CONFIRM** needs the developer's sign-off before final.

| ID | Fact | Source |
|---|---|---|
| E1 | School management software / school ERP for Indian schools, by GMS Designs and Tech | Home, About |
| E2 | "Manage every part of your school in one beautiful platform." | Home hero |
| E3 | Modules: student records, admissions & onboarding, attendance, staff & payroll, fees & invoices, financial reporting & cashbook, academics, exams & results, timetable, parent communication, documents, reports & analytics | Home features, About |
| E4 | Fee & invoice automation: track collections, generate receipts instantly, payment status visible in real time | Home features |
| E5 | Role-based access controls; "Secure by design" | Home |
| E6 | "No setup fee", "Built for Indian schools", zero-code onboarding | Home badges |
| E7 | WhatsApp add-on: ₹50 per student per year; attendance, homework, fee receipts, announcements, payment confirmations, absence alerts, marks & results, exam notices, report cards, performance, school messages; uses approved Meta templates; uses the parent number already on the student profile | Home, WhatsApp section — **CONFIRM price** |
| E8 | "One command centre": total students, present today, fee collection, pending fees, monthly finances, recent admissions, payments, notifications, quick actions | Home dashboard section |
| E9 | Taglines: "Manage Better. Educate Smarter." · "School management, reimagined." · "Simplifying School Management. Empowering Education." | About, footer |
| E10 | "10k+ students tracked", "Live support" | Home stats — **CONFIRM before use** |

**Demo data rule:** "Greenfield Public School", "Rahul Sharma" and every dashboard number (2,486 students, ₹8.4L, 94.8%…) are the site's demo. They may appear **only inside UI frames** showing that demo school, never as standalone stats or claims.

**Trademark rule:** "WhatsApp" as plain text only. No WhatsApp logo or its exact app UI unless the developer confirms use under Meta's brand guidelines. Use EduLedger's own chat-card design from its website. Razorpay is not shown.

---

## 2. Voiceover (user supplies L01–L14)

| File | Line | Act |
|---|---|---|
| L01 | Registers. Receipts. Reminders. | 1 Problem |
| L02 | Spreadsheets for fees. Paper for attendance. Phone calls for parents. | 1 |
| L03 | Running a school shouldn't feel like this. | 1 |
| L04 | Meet EduLedger. | Turn |
| L05 | One connected platform for your entire school. | 2 Benefits |
| L06 | Students. Staff. Fees. | 2 |
| L07 | Admissions to attendance, in one clean dashboard. | 2 |
| L08 | Fees? Collected, receipted, tracked, in real time. | 2 |
| L09 | Payroll and cashbook? Done, with less paperwork. | 2 |
| L10 | And parents? Updated instantly on WhatsApp. Attendance, fee receipts, results. | 2 |
| L11 | Every number that matters. One command centre. | 2 |
| L12 | No setup fee. Secure by design. Built for Indian schools. | 3 Foundation |
| L13 | EduLedger. Manage better. Educate smarter. | 3 |
| L14 | Get started at eduledger dot co dot in. | 3 CTA |

**Voice rule for Claude Code: never choose, generate or replace a voice. If any line needs regenerating, stop and ask the user, proposing candidate voices with samples.**

---

## 3. Music and sound effects (user makes in ElevenLabs)

Use ElevenLabs Music only if the plan's terms cover commercial use; otherwise license a track. Keep the licence in `music/`.

**Music prompt:**
```
Super energetic modern tech-launch instrumental, 128 BPM, 4/4. Punchy
kick, sharp claps, driving bass, bright synth stabs, riser builds, a
touch of Indian percussion (dhol fills) for flavour. Structure for 50 s:
tense, choppy, glitchy intro 0–8 s (chaos); a riser into a huge drop at
~10 s ("Meet EduLedger"); a relentless driving groove 10–34 s with a
short lift at ~26 s; a stomping three-hit pattern at ~34–39 s; a
triumphant final section 39–50 s ending on a big hit at ~44 s and a
shimmering tail. No vocals. Must not resemble any existing song.
```

**SFX** (one file each, 2 variants), saved as `sfx/X01.wav`…:

| ID | Prompt | Use |
|---|---|---|
| X01 | Heavy paper ledger slammed on a desk, dry and punchy | Registers |
| X02 | Fast receipt printer zip | Receipts, fee shots |
| X03 | Phone ring burst cut short, glitchy | Reminders, calls |
| X04 | Pen scribble scratch, quick | Paper attendance |
| X05 | Glitch stutter, digital, 0.3 s | Chaos shots |
| X06 | Deep reverse-swell riser into big cinematic impact | "Meet EduLedger" |
| X07 | Fast airy light-streak whoosh, 0.4 s | Every whip transition |
| X08 | Crisp UI pop, bright | Cards, chips |
| X09 | Soft digital tick, very short | Counters, checkmarks |
| X10 | Coin spin and land, metallic, satisfying | Rupee coin |
| X11 | Message sent swoosh + double-tick blip | Parent message |
| X12 | Big stamp hit, tight | No setup fee / Secure / Indian schools |
| X13 | Final cinematic impact with long shimmer tail | Logo / CTA |
| X14 | Paper crumple into particle dissolve | Less paperwork |

---

## 4. Visual system (MOTION_PHILOSOPHY adapted to EduLedger)

| Law | EduLedger version |
|---|---|
| 1. One idea per beat, cut fast | Average shot ≈ 1.9 s; 26 cuts in 50 s |
| 2. Black is the canvas | Canvas = EduLedger navy `#07111f` (site theme colour) |
| 3. Light is the brand | Brand colour (from the logo) used as light: glows, halos, streaks, rim light on hero objects |
| 4. Camera never sleeps | Grid floor recedes, slow dolly, particles drift, vignette breathes |
| 5. Motion blur is a feature | Every cut rides a light-streak whip or cut-the-curve vertical whip |
| 6. Object metaphors | **The ledger line**: a single glowing horizontal line (a ledger rule) that appears in the chaos, becomes the logo underline, the dashboard grid, the fee bar, the chat-bubble edge and the CTA underline. It returns at least 3×. |
| 7. Symbolic palette (max 5) | Navy = canvas · Brand colour = EduLedger/solution · Red = paperwork chaos (Act 1 only) · Green = present/paid · White = UI and type |
| 8. Type is a character | Words scale up to 8×, word-by-word reveal anchored to VO onsets, kinetic three-word stamps |
| 9. Hold the hero | Logo reveal ~2 s, CTA 5+ s |
| 10. One texture | Perspective grid floor + small "+" crosshair markers + grain + vignette, every shot |
| 11. Timelines fill slots | Every timeline ends with `tl.to({}, {duration: SLOT}, 0)` |

**Font adaptation:** the kit's "different font every beat" rule does NOT apply to a brand launch. Use **one display family + one UI family** (match EduLedger's site font if supplied; otherwise propose Inter + one display face).

**Hero objects:** glossy 3D renders the user generates (Section 6). Code lights, moves and cuts them; code never fakes them.

---

## 5. Shot list (provisional; re-timed to the real VO and music)

At 128 BPM (beat 0.469 s). 27 shots = 26 cuts. ★ = rest/hero beat.

| # | Time | VO | Picture | SFX |
|---|---|---|---|---|
| S01 | 0.00–1.41 | "Registers." | 3D ledger book (H1) slams onto the grid floor; REGISTERS scales 8× through camera | X01 |
| S02 | 1.41–2.34 | "Receipts." | Receipt stack (H2) whips in; red | X02 |
| S03 | 2.34–3.28 | "Reminders." | Ringing-phone icons multiply across frame; red | X03 |
| S04 | 3.28–4.69 | "Spreadsheets for fees." | Spreadsheet cells flicker and glitch red | X05 |
| S05 | 4.69–6.09 | "Paper for attendance." | Attendance sheet with frantic scribbled ticks | X04 |
| S06 | 6.09–7.50 | "Phone calls for parents." | Call bubbles stack until they overflow the frame | X03 |
| S07 ★ | 7.50–9.84 | "Running a school shouldn't feel like this." | All chaos collapses to one thin glowing line (the ledger line). Rest beat | music drops |
| S08 ★ | 9.84–11.72 | "Meet EduLedger." | The line flares; logo crystallises above it; brand light floods | X06 |
| S09 | 11.72–13.59 | "One connected platform…" | Real dashboard screenshot slides up in perspective on the grid | X07 |
| S10 | 13.59–14.53 | "Students." | Student records UI card pops forward | X08 |
| S11 | 14.53–15.47 | "Staff." | Staff & payroll UI card | X08 |
| S12 | 15.47–16.41 | "Fees." | Fee UI card | X08 |
| S13 | 16.41–18.28 | "Admissions to attendance…" | Class grid: present ticks ripple green across it | X09 ×n |
| S14 | 18.28–19.69 | "Fees? Collected," | 3D rupee coin (H3) spins and lands | X10 |
| S15 | 19.69–20.63 | "receipted," | Receipt prints out of a card (real receipt UI) | X02 |
| S16 | 20.63–22.03 | "tracked, in real time." | Fee-collection bar fills inside the demo dashboard frame | X09 |
| S17 | 22.03–23.91 | "Payroll and cashbook? Done," | Payroll list → cashbook chart morph (cross-warp) | X07 |
| S18 ★ | 23.91–25.78 | "…with less paperwork." | Paper stack crumples into particles; breathing beat | X14 |
| S19 | 25.78–27.19 | "And parents?" | Phone (H4) slides up from below | X07 |
| S20 | 27.19–28.59 | "Updated instantly on WhatsApp." | EduLedger chat card types "Dear Parent, Rahul Sharma was marked Present…" ✓✓, "Add-on" chip | X11 |
| S21 | 28.59–31.41 | "Attendance, fee receipts, results." | Three message chips stack on three beats | X08 ×3 |
| S22 ★ | 31.41–34.22 | "Every number that matters. One command centre." | Camera dollies out across the full demo dashboard; stats count up inside the frame | X09 |
| S23 | 34.22–35.63 | "No setup fee." | Kinetic stamp | X12 |
| S24 | 35.63–37.03 | "Secure by design." | Shield/lock glyph + stamp | X12 |
| S25 | 37.03–38.91 | "Built for Indian schools." | 3D school building (H5) with India-map glow points | X12 |
| S26 ★ | 38.91–43.59 | "EduLedger. Manage better. Educate smarter." | The ledger line returns; logo crystallises; tagline word by word; hold ~2 s | X13 |
| S27 ★ | 43.59–50.00 | "Get started at eduledger dot co dot in." | CTA card: eduledger.co.in, "Get started"; hold 5+ s; music tail | — |

**Act check:** problem (S01–S07) → brand (S08) → benefits, three groups (S09–S22) → foundation + CTA (S23–S27). Rest beats at S07, S18 and S22.

---

## 6. Assets the user supplies

Put everything under `films/eduledger-launch/`.

| Folder | What | How |
|---|---|---|
| `vo/` | L01–L14 (best take only) | ElevenLabs |
| `music/` | track + LICENSE | ElevenLabs Music (if terms allow) or licensed |
| `sfx/` | X01–X14 | ElevenLabs sound effects |
| `brand/` | Logo (SVG preferred), brand colours, fonts | From the developer, or `eduledger.co.in/eduledger-logo.jpeg` |
| `ui/` | 1920-wide screenshots of the real app: dashboard, student records, admissions, attendance, fees/invoice + a receipt, staff/payroll, cashbook/finance report, the parent chat card, plus a phone screenshot | From the developer's demo account |
| `heroes/` | H1–H5 renders below | Your chosen image generator (check its commercial-use terms) |
| `client/FACTS.md` | Developer's sign-off on E7 price, E10 claims, demo data on screen, WhatsApp usage | From the developer |

**Hero render prompts** (16:9, 4K, on a plain dark navy `#07111f` background for easy cut-out; no logos, no text, no people):
- **H1:** Glossy stylised 3D closed ledger book, thick, dark cover with a subtle brand-colour rim light from the right, soft floor reflection, premium product-render look.
- **H2:** Stylised 3D stack of curling paper receipts, slightly messy, warm reddish rim light suggesting chaos, premium render.
- **H3:** Glossy 3D Indian rupee coin (₹ symbol embossed), mid-spin, metallic gold with brand-colour rim light, motion freeze, premium render.
- **H4:** Sleek unbranded 3D smartphone, front three-quarter view, blank glowing screen, brand-colour rim light, premium render.
- **H5:** Stylised 3D modern school building, clean and minimal, glowing windows, brand-colour light washing the façade, slightly isometric, premium render.

---

## 7. Build prompt for Claude Code

```
You are the motion director and engineer for a paid client launch film:
EduLedger (eduledger.co.in). Read films/eduledger-launch/BRIEF.md (this
file) fully. It is the brief. Do not invent anything it doesn't give you.

TOOLKIT
- Use the HyperFrames student kit (github.com/nateherkai/hyperframes-
  student-kit). Keep its LICENSE and THIRD_PARTY_NOTICES. Install it (npm
  ci, npm run setup, npx hyperframes doctor). Read CLAUDE.md,
  MOTION_PHILOSOPHY.md and style-library/GUIDE.md, and use its skills
  (hyperframes, gsap, motion-showreel, website-to-hyperframes, beat-sync
  validation, preflight).
- MOTION_PHILOSOPHY.md is the motion bible, with the EduLedger
  adaptations in BRIEF §4 overriding it. Never use the kit's own
  third-party brands (YouTube, AIS) or its illustrative card stats.

VOICE RULE
- Never choose, generate or replace a voice. VO comes from vo/ (L01–L14,
  supplied by me). If a line needs regenerating, STOP and ask me,
  proposing candidate voices with short samples first.

STAGES — stop at each ⏸
A. STUDY ⏸ Analyse examples/showcase/ais-live-ad.mp4 and youtube-
   showreel.mp4 frame by frame: cuts/min, average shot length, % still,
   type scale range, layers per frame, transition types, hero-object use,
   audio sync. Write STYLE.md with numbers. Compare with BRIEF §4–5 and
   propose any changes.
B. INPUTS ⏸ Check vo/, music/, sfx/, brand/, ui/, heroes/ and
   client/FACTS.md. Measure each VO line, the music's real tempo and
   downbeats, and the hero renders' resolution. List anything missing,
   with exact instructions for me to make it. Extract brand colours from
   the logo; show me the values.
C. TIMELINE ⏸ Audio-first: VO lines placed on the music's real beat grid.
   Re-time BRIEF §5 to the real audio; keep 25 ±2 cuts in ~50 s, rest
   beats at S07/S18/S22, logo hold ~2 s, CTA hold 5+ s. Show the final
   shot list with real times, every cut on a beat or half-beat, and
   every SFX anchored to its visual event.
D. STYLE FRAMES ⏸ Render S01, S08, S13, S20 and S26 as stills at full
   quality, plus a 5 s motion test of S07→S08 (chaos → ledger line →
   logo) with audio.
E. BUILD ⏸ Full HyperFrames composition, 1920×1080 at 60 fps:
   - every cut rides a light-streak or cut-the-curve whip with blur;
   - the ledger line returns at least 3×;
   - word-by-word kinetic type anchored to VO word onsets (word-level
     timing: ElevenLabs Scribe or local Whisper; ask me before spending
     credits);
   - real UI screenshots inside perspective frames; hero renders lit with
     brand-colour rim light; grid floor + crosshairs + grain + vignette
     every shot;
   - music + SFX mixed per MOTION_PHILOSOPHY §2.6 (VO 1.0, SFX ~0.2–0.4,
     music ducked under VO); final loudness −14 LUFS, true peak below
     −1 dBTP.
   Run npx hyperframes lint, the kit's preflight and beat-sync validator,
   and the MOTION_PHILOSOPHY §5 checklist ("What would Infinite do?").
F. CHECK ⏸ Compliance: every claim is in the BRIEF §1 ledger; demo data
   only inside UI frames; no WhatsApp logo; CONFIRM items flagged if not
   yet signed off. Report cuts count, average shot length, sync accuracy,
   loudness, and a 2 fps contact sheet.
G. CUTDOWN: 9:16 1080×1920 re-composed (not cropped), 30 s.

Update films/eduledger-launch/STATE.md after every stage; commit and push.
```
