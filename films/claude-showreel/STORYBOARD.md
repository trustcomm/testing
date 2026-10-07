---
format: 1920x1080
duration: 15s
message: "Claude is a motion designer with real craft: timing, spacing, weight and feel, across every discipline, in one unbroken take."
arc: Pickup → Principles (bounce, liquid, type) → Depth (3D, particles, data) → Identity → the tool reveal
audience: creative directors, hiring managers, motion designers
mode: autonomous
rhythm: "pickup-DROP · boop-boop-boop-LAUNCH · wobble-SPLIT-orbit-MERGE · TIMING-SPACING-WEIGHT-FEEL · (ink) DEPTH-bounce-bounce-IMPLODE · BURST-swirl-swirl-ASSEMBLE · 900-30-7-ZERO · (paper) NAME-pullback-HOLD"
grid: "120 BPM · beat = 0.5 s = 30 frames · pickup 0.0–1.0 s · bar k starts at 1 + 2(k−1) s"
---

All frames live in one composition (`index.html`). The piece is one continuous take: every chapter hands off to the next through an object transformation, never a cut. So the chapters are timed phases of a single timeline (core: composition-patterns archetype C, "multi-scene merge") rather than sub-composition slots.

## Frame 1 — Cold open: inside the dot

- scene: Full-frame clay; the camera pulls back out of the dot, which falls and lands on the downbeat
- duration: 1s
- poster: 0.55
- transition_in: none (first frame)
- status: outline
- src: index.html
- blueprint: zoom-out-workspace-reveal (hook sub-shape A: full-bleed detail → one decelerating zoom-out)
- rules: motion-blur-streak (vertical fall smear), physics-press-reaction (contact squash)

## Frame 2 — 01 Squash & Stretch

- scene: The ball bounces across on the beat; onion skins show the spacing, then it launches at camera
- duration: 2s
- poster: 2.25
- transition_in: continuous (same ball)
- status: outline
- src: index.html
- rules: svg-path-draw (dotted arc + floor), motion-blur-streak path B (ghost trail → onion skins), spring-pop-entrance (keyframe diamonds), chart-scrub-readout playhead form (HUD curve)

## Frame 3 — 02 Liquid

- scene: The big ball lands as jelly, splits into goo blobs that orbit, and merges into a line
- duration: 2s
- poster: 4.1
- transition_in: continuous (ball lands, becomes the goo)
- status: outline
- src: index.html
- rules: sine-wave-loop (damped wobble), scale-swap-transition (blob → bar at the same anchor); technique: SVG filter metaballs

## Frame 4 — 03 Kinetic Type

- scene: TIMING. SPACING. WEIGHT. FEEL. rise from the line, each moving the way its word means; the full stop swallows the frame
- duration: 2s
- poster: 6.25
- transition_in: continuous (the line becomes the baseline)
- status: outline
- src: index.html
- blueprint: kinetic-type-beats (sub-shape B, multi-beat statement build)
- rules: kinetic-beat-slam (one beat array, a distinct entrance per word); technique: variable-font axes (wght, SOFT, WONK)

## Frame 5 — 04 Depth (WebGL)

- scene: The full stop is the close-up of a 3D sphere; the camera dollies out as it bounces on a rippling grid of cubes, then it implodes
- duration: 2s
- poster: 8.1
- transition_in: continuous (clay full frame = extreme close-up of the sphere)
- status: outline
- src: index.html
- adapter: three (seeked from the GSAP timeline)
- rules: 3d-camera-flight (dolly + orbit), depth-of-field-blur (fog falloff)

## Frame 6 — 05 Particles

- scene: The implosion bursts into ~1,400 particles that swirl into a galaxy, then assemble into bars
- duration: 2s
- poster: 9.9
- transition_in: continuous (the burst comes from the sphere's last position)
- status: outline
- src: index.html
- rules: particle-burst (index-seeded pure-function flight, generalised to Canvas 2D), depth-scatter-assemble (scatter → layout)

## Frame 7 — 06 Data

- scene: This reel, in numbers: 900 frames, 30 beats, 7 disciplines, 0 cuts. The zero bar is just the dot.
- duration: 2s
- poster: 12.75
- transition_in: continuous (particles solidify into the bars)
- status: outline
- src: index.html
- blueprint: dataviz-countup
- rules: stat-bars-and-fills, counting-dynamic-scale

## Frame 8 — 07 Identity + the tool reveal

- scene: "Claude." The dot lands as the full stop, then the camera pulls back to reveal the whole reel as one composition in a motion tool. The playhead reaches the end.
- duration: 2s
- poster: 14.9
- transition_in: continuous (paper iris opens from the dot)
- status: outline
- src: index.html
- blueprints: logo-assemble-lockup (brand-outro morph chain), zoom-out-workspace-reveal (hook A: artboard inside a design-tool canvas, timeline with playhead)
- rules: spring-pop-entrance, chart-scrub-readout (playhead form), svg-path-draw (waveform)
