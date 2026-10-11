---
format: 1920x1080
duration: 15s
message: "Hear from more of your customers, not just the loudest ones."
arc: Hook (the loud few) → Product intro (one QR) → Demo (rate, languages) → Demo (their choice) → Benefit (the chorus) → CTA
audience: small-business owners in India; creative directors viewing it as a showreel piece
mode: autonomous
music: none
fps: 60
---

## Video direction

**One continuous design system.** Every customer is a rounded **voice bar**. The same pills reflow through the whole film: bars (F1) → QR modules (F2) → phone UI (F3) → choice cards (F4) → a full waveform of voices (F5) → the wordmark (F6). Each frame boundary is a match cut with an exact numerical handoff (below each frame), so the 15 s reads as one take.

**Palette (frame.md, by role, nothing invented):**
- **Ground:** canvas `bg` #FAF9F5.
- **Type:** `text` #111216, with secondary text in `text-muted` #6D6D75.
- **Accent:** `primary` #1E5EFE, used for voiced bars, accent words, stars, ticked chips and the CTA pill.
- **Quiet bars:** `primary` at 18% opacity.
- **The loud customer:** `negative` #dc2626, the only red in the film, used solely as the loud-versus-quiet comparison.
- **Cards:** `card-bg` / `border` tinted cards with 14 px radius and NO shadows.
- **Pills:** `pill` radius.

**Type:**
- Film type is Poppins (800 for display, 600–700 for supporting lines), ink with accent words in primary.
- The phone UI is Inter (500/600/700) at product sizes.
- The language burst uses Noto Sans Devanagari / Kannada / Tamil / Telugu 600 (all @font-face in frame.md).

**Rhythm:**
- 120 BPM: a beat every 0.5 s, and every frame starts on a beat.
- Reveals land on beats or half-beats (8ths); the language flips accelerate onto 16ths of the grid.
- Held reads: the end of F5 (the payoff line) and the last 1.0 s of F6.

**Motion grammar:**
- Smooth long-tail settles (`power3`; `expo.out` for fast arrivals), with sequential reveals paced to the beat grid and the on-screen copy.
- Seams are velocity-matched (cut-catalog).
- Motion blur is reserved for genuinely fast moves.
- The camera is a per-frame `.world` wrapper: one deliberate move per frame where noted, never a back-half drift.
- During holds, at most subtle jitter.

**Sound:** a host score written in code (`assets/score.wav`) carries the music and a designed sound for every event in the **Sound sync** line of each frame. Builders only hit those times exactly; they embed no audio.

**No narration, no captions.** Content stays in the top ~83% of the canvas.

**Negative list:**
- **Motion failures:** slideshow (front-load then freeze), screensaver (everything floating), bouncy/elastic defaults, lazy breathing, infinite loops, randomness.
- **Brand and compliance:**
  - No Google logo, Maps UI or Google colour sequence; "Google" appears as plain text only.
  - No star-farming words.
  - No review gating: both choice paths always get equal weight.
  - No shadows on cards.
  - No purple-blue "AI" gradients, bokeh, browser chrome or cursors.

## Frame 1 — Only the loudest get heard

- scene: One red bar shouts while a row of tiny quiet bars barely flickers; "Only the loudest get heard." slams in word by word
- voiceover: ""
- duration: 2.5s
- poster: 1.8s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation through negative contrast
- beat: frustration + recognition
- blueprint: kinetic-type-beats (Adapt)
- asset_candidates:

narrativeRole: open on the owner's real pain, that online reviews come from the loudest few.
keyMessage: only the loudest customers get heard.

**Shared system (repeat exactly):**
- Canvas 1920×1080 with a full-bleed `bg` #FAF9F5 background clip.
- **Voice bar:** a vertical pill, 22 px wide, radius 11 px, vertically centred on y = 640. Height is animated from the centre, growing up and down equally.
- **Quiet bar:** `primary` #1E5EFE at 18% opacity, height 18.
- **Loud bar:** `negative` #dc2626.
- Poppins for type. Beats fall on every 0.5 s of local time.

**Layout:**
- **Bars:** 13 voice bars in a row, bar i (i = 0…12) centred at x = 960 + (i − 6) × 36, all quiet except bar 6, which is the red loud bar.
- **Headline:** two centred lines, Poppins 800, 104 px, letter-spacing −0.02em, ink.
  - Line 1, "Only the loudest", has its baseline at y = 300; "loudest" is in `negative` red.
  - Line 2, "get heard.", has its baseline at y = 420.

Adapt: keep the kinetic-type signature (a statement built across beats, each word with its own slam, landing a payoff); the payoff element is the red bar's shout rather than a pop-in; the type is two lines over a bar row instead of a bare field.

Scene 1 (0.00–0.50s): the field holds only the 13 bars, quiet bars at height 18. On the downbeat at 0.00 the red bar 6 SHOUTS. Its height spikes 18 → 520 in ~0.12 s on an `expo.out` arrival, with a finite decaying horizontal shake (±6 px, three cycles over 0.25 s) as the "shout", then eases back to 360. At 0.25 "Only" slams in: a **kinetic beat-slam** (`kinetic-beat-slam`), scaling 1.35 → 1 with a blur 12 px → 0 on `expo.out`.

Scene 2 (0.50–2.00s): per-word staggered build (the same beat-slam recipe), one word per half-beat, each with its own slam direction:
- "the" drops in from 40 px above at 0.50;
- "loudest" (red) slams in at 0.75, while red bar 6 shouts again: spike to 560 with the shake, then settle to 300;
- "get" rises from 40 px below at 1.25;
- "heard." slams at 1.50, and the red bar shouts a third time (spike to 480, settle to 240).

While the loud bar shouts, the quiet bars try to speak but stay small. At 1.00 and again at 2.00, the 12 quiet bars ripple outward from the centre: each grows 18 → 34 → 18 over 0.25 s, staggered 0.02 s per step away from bar 6. That makes a tiny, polite flicker that nobody hears.

Scene 3 (2.00–2.50s): hold the read, with the red bar settling to height 160. From 2.25 the headline clears in a **waterfall cut** (cut-catalog.md waterfall seam): words fall 60 px with a blur 0 → 10 px and an opacity fade, staggered 0.03 s left to right, gone by 2.48. The bars stay.

Sound sync (local s):
- 0.00 shout hit;
- 0.25, 0.50 word ticks;
- 0.75 shout hit;
- 1.00 quiet flicker;
- 1.25 word tick;
- 1.50 shout hit;
- 2.00 quiet flicker;
- 2.25 whoosh down.

- handoff_out: 13 voice bars at x = 960 + (i − 6) × 36, centred y = 640, width 22, opacity 1, static (no motion at the cut). The quiet bars (i ≠ 6) are height 18, `primary` at 18% opacity. Bar 6 is `negative` red, height 160. No text on screen.

## Frame 2 — One QR on your counter

- scene: The quiet bars swarm up and multiply into a real QR code on a counter card; a phone rises and scans it
- voiceover: ""
- duration: 2.0s
- poster: 1.2s
- transition_in: cut
- status: animated
- src: compositions/frames/02-qr.html
- type: product_intro
- persuasion: Friction reduction
- beat: curiosity → ease
- blueprint: compose
- focal: assets/qr-trustcomm.js
- roles: qr-trustcomm.js = cutout (the hero QR, drawn module by module) · trustcomm-logo.jpg = none
- asset_candidates: assets/qr-trustcomm.js — the real QR code for trustcomm.app as module data; assets/demo-1-rate-and-mention.jpg — real rating screen, what the phone opens to after the scan

narrativeRole: introduce the product mechanism in one object.
keyMessage: one QR code on the counter; customers scan it, with no app and no sign-in.

**Shared system (repeat exactly):**
- Canvas 1920×1080 with a full-bleed `bg` #FAF9F5 background clip.
- **Voice bar:** a vertical pill, 22 px wide, radius 11 px.
  - Quiet = `primary` at 18% opacity.
  - Voiced = `primary` #1E5EFE.
  - Loud = `negative` #dc2626.
- Poppins for film type, Inter for phone UI. Beats every 0.5 s.
- **PHONE geometry (shared with Frames 3–4):**
  - Body 380 × 780, radius 56, fill `text` #111216, centred at (700, 470), so its top edge is at y = 80.
  - Screen inset 12 px all round (356 × 756, radius 46).
  - Speaker slot: 90 × 8 pill at the top centre, 18 px from the top edge, in #2A2B30.

**Layout:**
- **Counter card:** a white #FFFFFF tinted card (1.5 px `border`, radius 28), 440 × 520, centred at (700, 450).
- **QR:** drawn from `window.QR_TRUSTCOMM` (load `assets/qr-trustcomm.js` with a script tag).
  - 25 × 25 modules of 13 px pitch: 325 px square, centred at (700, 420).
  - Each dark module is an 11 × 11 rounded square (radius 3) in `text` #111216.
  - The three finder patterns render as one rounded outer ring and a rounded inner square each.
  - Keep a light margin of at least 4 modules inside the card so it really scans.
- **Shop label:** under the QR on the card, "Meera's Tiffin Room" in Inter 600 26 px ink, and "Scan to share your visit" in Inter 500 18 px `text-muted`.
- **Right column:** headline in Poppins 800 72 px ink, left-aligned at x = 1060, baseline y = 330: "One QR code" / "on your counter." ("counter." in `primary`), line height 1.08.

Compose (after logo-assemble-lockup's idea that a mark comes to exist from parts): the mark is the QR, and its parts are the quiet voice bars.

Scene 1 (0.00–0.50s): the red loud bar 6 shrinks 160 → 0 and fades out by 0.20. On the downbeat at 0.00, the 12 quiet bars turn voiced (`primary`, opacity 0.18 → 1) and leap upward, each tracing an arc toward the QR area. Mid-flight each bar splits into a burst of modules: a **3D depth scatter-assemble** (`depth-scatter-assemble`), the modules tumbling in a shallow 3D cloud around (700, 420).

Scene 2 (0.50–1.25s): the counter card scales up 0.92 → 1 with opacity 0 → 1, settling on `power3` at 0.50. The 328 dark modules land into their exact QR cells in a centre-outward cascade (`center-outward-expansion`), finishing at 1.00, and the finder rings snap last at 1.00. The shop label rises in at 1.00. The right-column headline enters per line: line 1 at 0.50, line 2 at 0.75. The words slide up 30 px with opacity, `power3`.

Scene 3 (1.25–2.00s): the PHONE rises from below the frame (top edge from y = 1100 to y = 80) on `expo.out`, landing at 1.50 centred over the card, so the card and QR are seen through the screen as the camera viewfinder.
- Inside the screen, four viewfinder corner brackets (white, 6 px stroke, 46 px arms) snap inward onto the QR at 1.50.
- A scan line sweeps the QR top to bottom from 1.50 to 1.70.
- At 1.75 the screen flashes white (opacity 0 → 1 → 0 over 0.15 s). Underneath, the screen content becomes the rating page (Frame 3's opening state: "How was the food?" with 5 empty stars).
- In the right column, two pill chips spring in on half-beats under the headline at x = 1060, top edge y = 452: "No app" at 1.50 and "No sign-in" at 1.75. They use the `tag-pill` style: `accent-light` fill, `primary` text, Poppins 600 26 px, 14/28 px padding, 16 px gap. Use a smooth `spring-pop-entrance`, not elastic.

Sound sync (local s):
- 0.00 swarm whoosh up;
- 0.50–1.00 module cascade ticks (rapid);
- 1.00 finder snap;
- 1.50 phone land and brackets snap;
- 1.70 scan beep;
- 1.75 "No sign-in" pop;
- 1.50 "No app" pop.

- handoff_in: 13 voice bars at x = 960 + (i − 6) × 36, centred y = 640, width 22, static. Quiet bars (i ≠ 6) height 18, `primary` at 18% opacity. Bar 6 `negative` red, height 160. No text.
- handoff_out:
  - **PHONE:** centred (700, 470), scale 1, opacity 1, static. The screen shows the rating page: "How was the food?" with five empty stars, "How was the service?" with five empty stars, and the mention chips (see Frame 3).
  - **Right column:**
    - headline "One QR code / on your counter." at x = 1060, baseline y = 330, Poppins 800 72 px;
    - chips "No app" and "No sign-in" at top edge y = 452.
  - **Counter card:** hidden behind the phone, opacity 0 by 2.00.

## Frame 3 — They rate their visit, in their own language

- scene: The phone's real rating screen: stars fill with two taps, then "How was the food?" flips through six languages, faster and faster
- voiceover: ""
- duration: 3.0s
- poster: 2.4s
- transition_in: cut
- status: animated
- src: compositions/frames/03-rate.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: ease + delight
- blueprint: device-surface-showcase (Adapt)
- focal: assets/demo-1-rate-and-mention.jpg
- roles: demo-1-rate-and-mention.jpg = reference for the rebuilt phone screen (rebuild it in HTML, do not paste the screenshot)
- asset_candidates: assets/demo-1-rate-and-mention.jpg — real /r/demo rating screen (food and service star rows, "Excellent", mention chips, Continue)

narrativeRole: show the customer side working in its real interface, in their language.
keyMessage: customers rate in seconds, in English, Hinglish, Hindi, Kannada, Tamil or Telugu.

**Shared system (repeat exactly):**
- Canvas 1920×1080, `bg` #FAF9F5 background clip. Beats every 0.5 s.
- **PHONE:** body 380 × 780, radius 56, fill #111216, centred (700, 470); screen inset 12 px (356 × 756, radius 46, fill #FAF9F5); speaker slot 90 × 8 pill at the top centre, 18 px from the top, #2A2B30.
- **Phone UI** in Inter, rebuilt from assets/demo-1-rate-and-mention.jpg. Inside the screen, left padding 24 px:
  - "How was the food?" Inter 600 22 px ink, at screen y = 70.
  - A star row of 5 stars (34 px, gap 10) at screen y = 110: filled = `primary` #1E5EFE, empty = #DCDBD7. "Excellent" Inter 400 15 px `text-muted` appears under a full row.
  - "How was the service?" at screen y = 200, with its star row at y = 240.
  - "What should the review mention?" Inter 600 18 px at y = 340, then "Pick only what you want mentioned. Nothing is ticked for you." Inter 400 13 px `text-muted`.
  - Chips (Inter 500 14 px, pill, 1.5 px #E6E5E1 border, white fill): "The food", "How long it took", "The price", "How clean it was", "The staff", "The portions", three per row.
  - A "Continue" pill button at the bottom: `primary` fill, white Inter 600 16 px, full width minus 48, 52 tall.
- **Right column:** text left-aligned at x = 1060.

Adapt: keep device-surface-showcase's cursorless stepwise flow inside the held real surface (the phone stays the hero and its screen advances through a real flow); swap the camera move for an in-screen state flow and a language cycle beside it (a fixed-anchor-cycle flavour: the phone is the pinned anchor).

Scene 1 (0.00–1.50s): the phone holds at (700, 470); the camera (a `.world` wrapper) eases a gentle push from scale 1.00 to 1.04, centred on the phone, from 0.00 to 1.50, and then holds.
- The right-column headline from Frame 2 is replaced on the downbeat at 0.00 by a velocity-matched waterfall swap (cut-catalog.md waterfall): the old lines fall away (0.00–0.15) as "They rate" / "their visit." rises in (0.10–0.40). Poppins 800 72 px, baselines y = 330 / 408, with "visit." in `primary`. The chips "No app" / "No sign-in" stay where they are (top edge y = 452).
- **Two taps** fill the stars (`stat-bars-and-fills` star wipe), each preceded by a small tap ripple (a `primary` 20% circle expanding 0 → 46 px and fading) on the 5th star:
  - tap 1 at 0.50: the food row fills left to right in 0.12 s and "Excellent" fades in;
  - tap 2 at 1.00: the service row fills and its "Excellent" fades in.
- At 1.25 the mention chip "How long it took" ticks: it fills `primary`, its text turns white and a ✓ appears (`press-release-spring` press). The other chips stay empty, matching "Nothing is ticked for you."

Scene 2 (1.50–3.00s): **the language burst.** The question line "How was the food?" is the cycling slot: each swap is a 0.08 s vertical roll (old line up and out, new line up and in) on a hard ease. The swaps accelerate along the grid:

| Time | Language | Question shown |
|---|---|---|
| 1.50 | Hinglish | "Khana kaisa tha?" |
| 2.00 | हिंदी (Hindi) | "खाना कैसा था?" |
| 2.375 | ಕನ್ನಡ (Kannada) | "ಊಟ ಹೇಗಿತ್ತು?" |
| 2.625 | தமிழ் (Tamil) | "சாப்பாடு எப்படி இருந்தது?" (wrap to 2 lines if needed, 18 px) |
| 2.75 | తెలుగు (Telugu) | "భోజనం ఎలా ఉంది?" |
| 2.875 | English | back to "How was the food?" |

These translations are drafts flagged for client confirmation; use them exactly. Use the Noto Sans family for each script.

At 1.50 the right-column headline swaps (waterfall) to "In their own" / "language." ("language." in `primary`), while the "No app" / "No sign-in" chips clear with the old headline (same waterfall), and a language chip column appears beneath the new headline at x = 1060, first chip's top edge at y = 452. Six `tag-pill` chips, stacked 54 px apart: "English", "Hinglish", "हिंदी", "ಕನ್ನಡ", "தமிழ்", "తెలుగు".
- The chips reveal one by one on each swap, and the active chip fills solid `primary` with white text while the others stay `accent-light`.
- English is shown and active at 1.50 (it's the language on screen when the burst starts).
- At 2.875 "English" re-lights and all six stay visible.

The phone holds still through the burst; the accelerating cadence is the energy.

Sound sync (local s):
- 0.00 swap whoosh;
- 0.50 tap and star fill;
- 1.00 tap and star fill;
- 1.25 chip tick;
- 1.50, 2.00, 2.375, 2.625, 2.75, 2.875 language pops, rising in pitch.

- handoff_in: PHONE centred (700, 470), scale 1, opacity 1, static, showing the rating page with all stars empty. Right column: headline "One QR code / on your counter." at x = 1060, baseline y = 330; chips "No app" and "No sign-in" at top edge y = 452.
- handoff_out:
  - **PHONE:** centred (700, 470), at camera scale 1.04 (the `.world` push ends at 1.04, so the phone appears at scale 1.04 around (700, 470)), opacity 1, static.
  - **Screen:** the rating page with both star rows full, "How long it took" ticked, the question back in English.
  - **Right column:** headline "In their own / language." and the six language chips, English active.

## Frame 4 — Their words, their choice

- scene: "Where should your words go?" — the two choices lift out of the phone into equal side-by-side cards: a private note to the owner and a public Google draft
- voiceover: ""
- duration: 2.5s
- poster: 2.0s
- transition_in: cut
- status: animated
- src: compositions/frames/04-choice.html
- type: feature_showcase
- persuasion: Risk reversal through transparency (the customer decides; nothing is filtered)
- beat: trust + control
- blueprint: comparison-split (Adapt)
- focal: assets/demo-2-where-should-your-words-go.jpg
- roles: demo-2-where-should-your-words-go.jpg = reference for the phone screen · demo-3-message-to-owner.jpg = reference for the left card · demo-4-google-draft.jpg = reference for the right card (rebuild all in HTML; never paste screenshots)
- asset_candidates: assets/demo-2-where-should-your-words-go.jpg — real choice screen with two equal options; assets/demo-3-message-to-owner.jpg — real private message to the owner; assets/demo-4-google-draft.jpg — real "Here's a draft" screen

narrativeRole: prove the product is fair: the customer chooses where their words go, publicly or privately.
keyMessage: their words, their choice.

**Shared system (repeat exactly):**
- Canvas 1920×1080, `bg` #FAF9F5 background clip. Beats every 0.5 s. Poppins film type; Inter phone UI and card UI.
- **PHONE:** body 380 × 780, radius 56, fill #111216; screen inset 12 px (radius 46, #FAF9F5); speaker slot 90 × 8, #2A2B30. It enters centred (700, 470) at scale 1.04.
- **Cards:** white #FFFFFF, 1.5 px `border` rgba(30,94,254,0.2), radius 14, NO shadow.
- **Compliance:**
  - The two paths always have EQUAL size, equal brightness and equal emphasis.
  - "Google" is plain text only: no logo, no Google colours.

Adapt: keep comparison-split's signature (two equal cards from opposite wings with mirrored 3D book-open `rotateY` tilts, then inner-edge badges that spring-pop); the cards originate from the phone's two option cards instead of off-screen wings, and a title lands above.

Scene 1 (0.00–0.50s): on the downbeat the phone screen swaps (a fast horizontal slide, the old page out left and the new page in from the right, 0.15 s, `expo.out`) to the choice page, rebuilt from demo-2:
- "Where should your words go?" Inter 600 26 px ink at screen y = 260, wrapping to 2 lines;
- "You can do both, if you like." Inter 400 15 px `text-muted`;
- two stacked option cards (white, 1.5 px #E6E5E1 border, radius 12, full width minus 48, 84 tall, 12 px gap):
  - "Straight to the owner" in Inter 600 17 px, over "Only Meera's Tiffin Room reads it. Not posted anywhere." in Inter 400 13 px `text-muted`;
  - "On Google" over "Anyone looking up Meera's Tiffin Room sees it.".

Meanwhile the right-column copy (the "In their own / language." headline and the chips) clears in a 0.2 s waterfall downward. The `.world` camera eases from 1.04 back to 1.00.

Scene 2 (0.50–1.50s): the split-tilt entry (`split-tilt-cards`, signature). At 0.50 both option cards LIFT OUT of the phone at the same moment and fly to the wings, growing into two equal cards, each 620 × 470:
- the owner card flies to centre (560, 560);
- the Google card flies to centre (1360, 560).

They use mirrored book-open tilts (left card `rotateY` +12°, right card −12°), scale up from their on-screen size, travel on `expo.out` with a short directional blur in flight (a few px, only while moving fast), and land at 0.90. The PHONE recedes behind them (scale 1 → 0.8, opacity 1 → 0, 0.50–0.80). As each card lands, its content resolves:
- **Left card** (rebuilt from demo-3):
  - a `text-muted` tint header panel (#E4EAF8, radius 10) reading "Your message to Meera's Tiffin Room" (Inter 600 22 px) / "The owner reads this personally. It isn't posted publicly." (Inter 400 15 px);
  - a text box with a 2 px `primary` focus border, in which "The table by the door gets cold in the evening" types on (`discrete-text-sequence`) from 0.90 to 1.40;
  - a "Send to owner" `primary` pill button.
- **Right card** (rebuilt from demo-4):
  - "Here's a draft" (Inter 600 22 px);
  - a bordered text box holding "Filter coffee at Meera's Tiffin Room was absolutely wonderful and served steaming hot. The food tasted brilliant, and the staff brought everything to the table amazingly fast." (Inter 400 16 px, line height 1.5);
  - "Change anything that doesn't sound like you. It goes out in your name." (Inter 400 13 px `text-muted`);
  - a "Copy my words" `primary` pill button.
  - The draft text reveals line by line from 0.90 to 1.40, in sync with the typing on the left.
- **Title:** at 1.00 it slides down from above: "Their words." (ink) + "Their choice." (`primary`), Poppins 800 76 px, centred at baseline y = 230.

Scene 3 (1.50–2.50s): badges punctuate at each card's inner edge, overlapping the card about 15%. They are `cta-button`-style pills with `primary` fill and white Poppins 600 24 px text:
- "Private" on the left card's right edge at 1.50;
- "Public, in their name" on the right card's left edge at 1.75.

Use a smooth `spring-pop-entrance` (the one allowed small overshoot). Then hold, with at most subtle jitter (`sine-wave-loop`, low amplitude, phase-opposed between the two cards).

Sound sync (local s):
- 0.00 page swipe;
- 0.50 double whoosh (both cards);
- 0.90 card lands (soft thump);
- 0.90–1.40 typing ticks;
- 1.00 title slide;
- 1.50 badge pop;
- 1.75 badge pop.

- handoff_in: PHONE centred (700, 470) at scale 1.04, opacity 1, static, showing the rating page with both star rows full. Right column: headline "In their own / language." and the six language chips at x = 1060.
- handoff_out:
  - **Left card:** centre (560, 560), 620 × 470, `rotateY` +12°, opacity 1, static.
  - **Right card:** centre (1360, 560), 620 × 470, `rotateY` −12°, opacity 1, static.
  - **Badges:** on both cards.
  - **Title:** "Their words. Their choice." at baseline y = 230.

## Frame 5 — Hear from more of your customers

- scene: The two cards fold into voice bars and a whole crowd of bars rises into one full waveform; the red loud bar is just one voice among many
- voiceover: ""
- duration: 2.5s
- poster: 2.1s
- transition_in: cut
- status: animated
- src: compositions/frames/05-chorus.html
- type: benefit_highlight
- persuasion: Future pacing (the full picture of your customers)
- beat: relief + belonging
- blueprint: grid-card-assemble (Adapt)
- asset_candidates:

narrativeRole: the payoff, an echo of the hook: every quiet customer now has a voice, and the loud one is just one of many.
keyMessage: hear from more of your customers, not just the loudest ones.

**Shared system (repeat exactly):**
- Canvas 1920×1080, `bg` #FAF9F5 background clip. Beats every 0.5 s.
- **Voice bar:** a vertical pill, 22 px wide, radius 11 px, vertically centred on y = 640, height animated from the centre.
  - Voiced = `primary` #1E5EFE.
  - Loud = `negative` #dc2626.
- Poppins type.
- **WAVE geometry:** 41 bars, bar k (k = 0…40) centred at x = 960 + (k − 20) × 36.
  - Target height H(k) = 60 + 300 × e^(−((k − 20) / 11)²) × (0.62 + 0.38 × |sin(k × 1.7)|), rounded to whole px. That makes a full, organic waveform peaking near the centre.
  - Bar 26 is the red loud bar, at its own H(26) (the same as its neighbours, not taller).

Adapt: keep grid-card-assemble's staggered self-assembly of many items into an array that holds and then clears to a payoff line; the items are voice bars assembling into a waveform, and the payoff line stays above it.

Scene 1 (0.00–0.50s): on the downbeat both cards morph into bars (`card-morph-anchor`):
- the left card collapses into bar 12 (x = 672), and the right card into bar 28 (x = 1248);
- each card scales down and flattens into a 22 px pill while its content fades, and turns solid `primary`;
- both finish at 0.30, at height 18;
- the title "Their words. Their choice." clears upward in a 0.2 s waterfall.

Scene 2 (0.50–1.50s): the crowd arrives.
- From 0.50 the other 39 bars pop up from height 0 at their x positions in a centre-out cascade (0.012 s per step from bar 20).
- All 41 bars then grow to their H(k) waveform on `power3`, settling by 1.00. Bar 26 joins as the red bar at the same height as its neighbours.
- At 1.00 the whole waveform gives ONE unified pulse: every bar to 1.12 × H(k) and back to H(k) over 0.3 s, with the camera (a `.world` wrapper) pushing in from 1.00 to 1.04, centred on (960, 640).
- The headline builds word by word on 8ths (`dynamic-content-sequencing`), centred at baseline y = 300, Poppins 800 88 px: "Hear" 0.50, "from" 0.625, "more" 0.75 (in `primary`), "of" 0.875, "your" 1.00, "customers." 1.125. Each word rises 30 px with opacity and blur 8 → 0 on `power3`.

Scene 3 (1.50–2.50s): at 1.50 the sub-line "Not just the loudest ones." (Poppins 600 44 px, `text-muted` #6D6D75, centred, baseline y = 380) fades up. Then hold the read. The waveform stays alive only with a finite, very low-amplitude per-bar height jitter (±4 px, deterministic per index, `sine-wave-loop` low register) until 2.25.

From 2.25 the bars begin converging toward the centre for the handoff: each bar's x moves 40% of the way toward x = 960, and its height eases toward 120, on `power3`. The text holds.

Sound sync (local s):
- 0.00 card-fold swish;
- 0.50 rising swell;
- 0.50–1.125 word hits on 8ths;
- 1.00 big unified pulse hit (downbeat);
- 1.50 sub-line chime;
- 2.25 gather whoosh.

- handoff_in:
  - **Left card:** centre (560, 560), 620 × 470, `rotateY` +12°.
  - **Right card:** centre (1360, 560), 620 × 470, `rotateY` −12°.
  - Badges "Private" / "Public, in their name" at the inner edges.
  - Title "Their words. Their choice." at baseline y = 230.
  - All static, opacity 1.
- handoff_out:
  - **Bars:** 41 bars at x = 960 + (k − 20) × 36 × 0.6, height 120, centred y = 640, `primary` except bar 26 in `negative` red; still moving inward at the cut.
  - **Text:** headline "Hear from more of your customers." at baseline y = 300 and sub-line at y = 380, opacity 1.
  - Camera `.world` at scale 1.04 centred on (960, 640).

## Frame 6 — trustcomm

- scene: The waveform collapses into the trustcomm wordmark, then the 14-day free trial and the URL land
- voiceover: ""
- duration: 2.5s
- poster: 2.2s
- transition_in: cut
- status: animated
- src: compositions/frames/06-cta.html
- type: cta
- persuasion: Risk reversal (free trial, no card)
- beat: confidence + urgency-to-act
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/trustcomm-logo.jpg
- roles: trustcomm-logo.jpg = reference only: rebuild the wordmark as live type that matches it ("trust" in ink, "comm" in primary, a heavy rounded geometric sans); do not place the JPG
- asset_candidates: assets/trustcomm-logo.jpg — Trustcomm wordmark reference ("trust" ink, "comm" blue)

narrativeRole: brand and the one action.
keyMessage: Trustcomm, with a 14-day free trial and no card needed, at trustcomm.app.

**Shared system (repeat exactly):**
- Canvas 1920×1080, `bg` #FAF9F5 background clip. Beats every 0.5 s.
- **Voice bar:** 22 px wide pill, radius 11; `primary` #1E5EFE, except one bar in `negative` #dc2626.
- **Wordmark:** "trustcomm" in Poppins 800, 200 px, letter-spacing −0.03em, lowercase; "trust" in `text` #111216 and "comm" in `primary` #1E5EFE. Optically centred at (960, 470): the x-height centre sits on y = 470.
- This is the FINAL frame: it ends on a held lockup (no exit).

Adapt: keep logo-assemble-lockup's signature of the mark coming to exist from parts and resolving into a centred lockup extended to the CTA/URL end card; the parts are the voice bars, which become the letters' stems.

Scene 1 (0.00–0.75s): the bars arrive from the handoff (41 bars at x = 960 + (k − 20) × 21.6, height 120, centred y = 640) and keep converging. On `expo.in` they rush together into a tight vertical bundle at x = 960, y = 470 by 0.25; the red bar is absorbed like the others, turning `primary` as it merges.
- At 0.25 (beat hit) the bundle FLASHES (a one-shot white glow bloom: a soft radial glow 0 → 0.9 → 0 opacity over 0.3 s) and the wordmark bursts out of it letter by letter. The letters scatter outward from the centre into their final positions on `expo.out`, each starting as a 22 px pill that morphs into its glyph (opacity and scale-x 0.2 → 1), with a 0.025 s stagger from the centre outward.
- The camera `.world` eases from 1.04 back to 1.00 between 0.00 and 0.75.

Scene 2 (0.75–1.50s): the lockup settles. At 1.00 (downbeat) a CTA pill springs up under the wordmark (`spring-pop-entrance`, smooth): `cta-button` style, `primary` fill, white Poppins 600 40 px "Start your 14-day free trial", pill radius, 26/56 px padding, centred at (960, 690). At 1.25 "No card needed" (Poppins 500 28 px `text-muted`) fades up under it, centred at baseline y = 780.

Scene 3 (1.50–2.50s): at 1.50 "trustcomm.app" types on (`discrete-text-sequence`, 0.25 s) at the top area, centred at baseline y = 250, Poppins 600 44 px `primary`. Then HOLD the full lockup to the end, completely still: no drift, no breathing.

Sound sync (local s):
- 0.00 inward rush (reverse swell);
- 0.25 BIG hit with a shimmer, and the logo burst;
- 1.00 CTA pop;
- 1.25 soft chime;
- 1.50 URL type ticks;
- 2.00 final sparkle tail.

- handoff_in:
  - **Bars:** 41 bars at x = 960 + (k − 20) × 21.6, height 120, centred y = 640, `primary` except bar 26 in `negative` red; moving inward.
  - **Text:** headline "Hear from more of your customers." at baseline y = 300 and sub-line "Not just the loudest ones." at y = 380, which clear upward in a 0.25 s waterfall at the start of this frame.
  - Camera `.world` at scale 1.04 centred on (960, 640).
