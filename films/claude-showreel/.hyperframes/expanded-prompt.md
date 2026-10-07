# Claude — Motion Reel · expanded production prompt

Spec values quote `frame.md` exactly: paper #F2EDE3, paper-2 #E7DFD1, ink #1B1714, ink-2 #27211C, clay #D2643A, clay-light #EFA27F, clay-deep #9C4122, muted-ink #5E554C, muted-paper #B7AC9F. Fraunces is the display face (variable opsz/wght/SOFT/WONK, plus its italic for chapter titles); JetBrains Mono is the HUD and data voice.

## Rhythm
`pickup-DROP · boop-boop-boop-LAUNCH · wobble-SPLIT-orbit-MERGE · TIMING-SPACING-WEIGHT-FEEL · (ink) DEPTH-bounce-bounce-IMPLODE · BURST-swirl-swirl-ASSEMBLE · 900-30-7-ZERO · (paper) NAME-pullback-HOLD`

- 120 BPM, beat = 0.5 s = 30 frames.
- Pickup 0.0–1.0.
- Bars: 1.0 / 3.0 / 5.0 / 7.0 / 9.0 / 11.0 / 13.0.
- Energy: build through bar 3, a heavy half-time drop at bar 4 (ink world), the peak at bars 5–6, release at bar 7, and a 0.5 s held final frame.

## Global rules
- **One take: 0 cuts.** Every handoff is a same-frame swap between two representations of the dot at identical position, size and colour, or an expanding shape (iris) that grows out of the dot.
- **Layers, bottom to top:**
  1. world background (paper / ink);
  2. 64 px grid + registration marks (in world space, so it rushes during camera moves);
  3. chapter layers;
  4. iris discs;
  5. HUD (screen space; `--fg` inverts at 7.0 and 13.0);
  6. tool UI (the close);
  7. grain (seeded, offset stepped every frame).
- **Ambient life:** the grid drifts 64 px over each chapter (period-matched), the timecode ticks every frame, beat ticks flash on every beat, and the curve playhead always moves.
- **Eases:** each chapter uses at least 3 eases. Entrances use `.out`, exits `.in`, travel `.inOut`. Springs use the baked `springEase` (ζ 0.55 only for "Feel", ζ 0.85 for settles).

## HUD
- **TL:** "Claude" in Fraunces 600, 30 px, over "MOTION REEL — 2026" in mono 18 px (muted).
- **TR:** timecode `00:00:SS:FF` (FF 00–59) in mono 24 px tabular; four 10 px beat squares below that light on beat index mod 4 (clay); "120 BPM · 60 FPS" in mono 16 px muted.
- **BL:** "01 / 07" in mono 18 px, over the chapter title in Fraunces italic 44 px.
- **BR:** a 300×150 curve panel: hairline axes, the chapter's real curve as an SVG path, the playhead as a clay dot on the curve, and the label "ease · <name>" in mono 18 px.
- **Corners:** 28 px L registration marks at the 40 px inset.

## Frame 1 — Cold open (0.00–1.00)
- **Concept:** we start inside the dot. The whole frame is clay with the sphere's highlight drifting, and the camera pulls out of it.
- **Choreography:**
  - **0.00–0.62 PULLS BACK:** stage scale 34 → 1 (expo.out), centred on the ball at (560, 330), r = 70. The grid rushes in as the scale collapses.
  - **0.62–1.00 DROPS:** the ball falls to the floor y = 760 under gravity (power2.in), with a vertical stretch (scaleY 1→1.28) through the fall.
  - **1.00 LANDS:** a 4-frame squash (scaleX 1.42, scaleY 0.66), and the floor hairline DRAWS out from the contact point (power3.out, 0.5 s).
- **SFX:** riser 0.0–1.0, a descending whistle 0.62–1.0, and on 1.00 the downbeat kick plus a rubber thump.

## Frame 2 — 01 Squash & Stretch (1.00–3.00)
- **Concept:** the animator's first exercise, done perfectly and shown with its working: spacing ghosts, the arc and the keys.
- **Bounce:** contacts at 1.0, 1.5, 2.0 and 2.5, at x = 600 → 900 → 1200 → 1500. Apex 270 px above the floor; parabolic y; linear x.
- **Squash and stretch** derive from velocity (volume-preserving, rotated onto the velocity vector). Contact squash lasts 3 frames.
- **Onion skins:** 7 outline ghosts at Δ = 4 frames (ink, opacity 0.42 → 0.06).
- **Arc:** a dotted arc (ink at 30 %) draws behind the ball.
- **Keys:** a keyframe diamond spring-pops on the floor at each contact (clay-deep).
- **Shadow:** an ellipse scales with height.
- **2.50 LAUNCH:** anticipation squash, then the ball flies at camera on an arc to (960, 600), r 70 → 240 (power2.inOut). Skins, arc and floor fade out by 2.9 (power2.in).
- **HUD:** "01 / 07 · Squash & Stretch"; curve = the ball's actual y(t), label "ease · gravity".
- **SFX:**
  - a rubber "boop" on each contact (pitched down a semitone each time);
  - claps on 1.5 and 2.5;
  - a rising "boing" whoosh 2.5–3.0.

## Frame 3 — 02 Liquid (3.00–5.00)
- **Concept:** the ball lands too heavy to stay a ball and turns to liquid. SVG metaballs: goo filter with blur 18 and alpha 30 / −12.
- **Choreography:**
  - **3.00 LANDS AS JELLY:** a damped wobble (scale ±18 %, elastic.out(1, 0.3) shape, 0.5 s).
  - **3.50 SPLITS:** 3 child blobs SHOOT out (expo.out 0.4 s) to 120° positions at radius 320 while the core shrinks to r 150. Goo bridges stretch and snap.
  - **3.50–4.50 ORBIT:** the children orbit +140° (sine.inOut) with breathing radii. On 4.0 every blob PULSES (scale 1.18, power2.out, back in 0.3 s), and concentric ripple rings spread from the centre on each beat.
  - **4.50–4.85 MERGE:** the blobs merge back (power3.in).
  - **4.85–5.00 STRETCH:** the merged blob stretches into a bar 1180 × 22 at baseline y = 760, x from 150 (expo.out, ending exactly on 5.0).
- **HUD:** "02 / 07 · Liquid"; curve elastic.out(1, 0.3).
- **SFX:** a heavy bloop on 3.0; 3 bright bloops on the 3.5 split; a pulse on 4.0; a reverse-suck on the 4.5 merge; a "zip" on the 4.85 stretch.

## Frame 4 — 03 Kinetic Type (5.00–7.00)
- **Concept:** four principles, each word moving the way it means. Words rise from the bar, which is now the baseline (a clip mask above the line).
- **Type:** Fraunces opsz 144, 320 px, left-anchored at x = 150, ink.
- **5.00 "Timing."** STEPS in one glyph per 32nd note (0.0625 s), each glyph a 2-frame snap. Curve steps(7).
- **5.50 "Spacing."** Glyphs arrive crushed (tracking −0.28em, overlapping) and BREATHE apart to +0.14em, settling at −0.02em (power2.inOut 0.42 s). Curve power2.inOut.
- **6.00 "Weight."** Hairline glyphs (wght 100) DROP from −260 px (power4.in 0.22 s). On impact the weight SLAMS to 900, with a squash (scaleY 0.86 → 1, springEase ζ 0.85). Curve power4.in.
- **6.50 "Feel."** Glyphs wobble in on springEase ζ 0.55 (rotation ±9°, y ±40) while SOFT 0 → 100 and WONK 0 → 1. Curve: the spring.
- **Exits:** each word SINKS through the baseline in the last 0.1 s of its beat (power3.in).
- **6.75–7.00 SWALLOWS:** the clay full stop of "Feel." scales up (expo.in) until it covers the frame at 7.0. The HUD flips to paper colours at 7.0.
- **SFX:**
  - a key-press on each "Timing" glyph;
  - a short whoosh on "Spacing";
  - a sub thud on the "Weight" impact;
  - a spring boing on "Feel";
  - a swell 6.75–7.0.

## Frame 5 — 04 Depth (7.00–9.00, Three.js)
- **Concept:** the full stop was a sphere all along. WebGL scene:
  - a clay sphere (MeshPhysicalMaterial with clearcoat);
  - a 26×15 instanced cube floor (ink-2) that ripples on each contact;
  - fog in ink;
  - lights: warm key, clay rim, hemisphere fill.
- **7.00–7.80 DOLLIES OUT:** the camera pulls out of the sphere (expo.out), from inside the clay to the wide, then ORBITS 38° (sine.inOut) to 8.8.
- **Bounces:** contacts at 7.5, 8.0 and 8.5. Each sends a radial cube ripple (a damped travelling wave, pure function of time since contact).
- **8.75–9.00 IMPLODES:** the sphere lifts to frame centre and contracts to a glowing point (power4.in, emissive up).
- **HUD:** "04 / 07 · Depth" in paper colours; curve sine.inOut.
- **SFX:** a sub-drop impact on 7.0; half-time drums; deep thuds with a cube-rattle on each contact; a camera whoosh 7.0–7.8; a reverse suck 8.75–9.0.

## Frame 6 — 05 Particles (9.00–11.00, Canvas 2D)
- **Concept:** the point releases everything it was.
- **Particles:** 1,400, coloured clay 60 %, clay-light 25 %, paper 15 %, sizes 1.5–4.5 px, additive on ink.
- **Motion:** pure function of t. A damped radial burst plus differential rotation (Ω ∝ r^−0.5) forms spiral arms; beats 9.5 and 10.0 pulse the radius by 6 %.
- **10.25–10.90 ASSEMBLE:** particles stream into the four Frame 7 bar rectangles plus a small disc for the zero bar (power3.inOut, index stagger up to 0.2 s).
- **10.90–11.00 SOLIDIFY:** the canvas fades as the solid bars fade in at the same pixels.
- **HUD:** "05 / 07 · Particles"; curve power3.inOut.
- **SFX:** a burst plus sparkle on 9.0; a swirl noise sweep; a magnetic rising tone 10.25–10.9; a click-lock at 10.9.

## Frame 7 — 06 Data (11.00–13.00)
- **Concept:** "This reel, in numbers." The chart is honest, and the zero bar is the dot.
- **Columns** on baseline y = 820 at x = 300 / 690 / 1080 / 1470, 240 wide:
  - FRAMES 900 (bar 520 high);
  - BEATS 30 (330);
  - DISCIPLINES 7 (200);
  - CUTS 0 (no bar: the clay dot, r 20).
- **Title:** "This reel, in numbers." in Fraunces 64 px at the top-left of the plot.
- **Counts:** each number COUNTS UP on its beat (11.0 / 11.5 / 12.0 / 12.5) over 0.45 s (power3.out) in Fraunces 150 px tabular, and its bar SETTLES (scaleY 1.04 → 1).
- **The zero:** STAMPS in at 12.5 (scale 1.6 → 1, power4.out) and the dot does one tiny bounce.
- **12.75–13.00:** bars DROP into the baseline (power3.in); the paper IRIS opens from the dot (expo.in), covering the frame at 13.0.
- **HUD:** "06 / 07 · Data"; curve power3.out.
- **SFX:** 16th-note ticks while counting; pops on the beats; a stamp on 12.5; a snare roll plus riser 12.5–13.0.

## Frame 8 — 07 Identity + tool reveal (13.00–15.00)
- **Concept:** the name, then the truth. It was all one composition.
- **13.00:** "Claude" (Fraunces 300 px, wght 560, SOFT 40) RISES from its baseline, letter-staggered 0.04 s on springEase ζ 0.85. The dot flies on an arc from the iris centre and LANDS as the full stop at 13.5 (squash, the bounce callback).
- **13.50:** "Motion Designer" (mono 30 px, tracking 0.3em) TYPES on. "Motion design, written in code." (Fraunces italic 40 px, muted-ink) fades up at 13.75.
- **13.60–14.40 PULLS BACK:** the artboard scales to 0.64 (expo.inOut), inside a dark tool UI (ink chrome):
  - left: a LAYERS list (dot, shadow, goo, type, sphere, particles, chart, name, hud);
  - right: an INSPECTOR for "dot" (x, y, scale, ease, #D2643A swatch);
  - bottom: a TIMELINE with the 0–15 s ruler, beat ticks, 7 chapter clips, keyframe diamonds, the real soundtrack waveform, and a playhead travelling with time.

  The HUD hands over to the tool's own timecode.
- **14.40–15.00 HOLDS** while the playhead runs to the end of the ruler.
- **SFX:** the final impact plus a D-major add9 stab plus a chime on 13.0; a "plip" when the full stop lands at 13.5; a soft reverse air on the pull-back; tails decaying to silence at 15.0.

## Recurring motifs
- The dot (clay) in every chapter.
- The baseline / floor line: floor → liquid bar → type baseline → chart baseline → name baseline.
- Real ease curves in the HUD.
- Keyframe diamonds: Frame 2 floor keys → Frame 8 timeline keys.

## Negative prompt
No cuts, glitch, neon or gradient text; no full-screen linear gradients; no third-party marks; no invented numbers; nothing under 18 px; nothing still for more than 0.5 s until the final hold.
