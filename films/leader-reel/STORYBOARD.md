---
format: 1920x1080
duration: 15s
fps: 60
message: "One designer, every discipline, one count: range and taste in fifteen seconds."
arc: Count 8 → 2 (one discipline per numeral) → 2-pop → drop → lockup
audience: creative directors, studio heads and hiring managers
mode: autonomous
music: none   # host audio: assets/audio/score.wav, synthesized by scripts/score.py from src/cues.js
grid: "128 BPM · beat 0.46875 s · bar 1.875 s · 8 bars = 15.000 s"
structure: "one WebGL engine on one canvas (index.html + src/), no hard cuts; frames below are the plan's dispatch units, built inline"
---

# Leader — storyboard

Every numeral owns exactly one bar. Worlds land on their downbeat; beat 4 carries the hand-off. Global camera: a slow push inside every world, a fast push-through on every transition, so the take never stops. Times are global seconds.

## Frame 1 — 8 · Fluid

- scene: An ink splash becomes a smoky figure-of-eight held by two counter-rotating vortices
- duration: 1.875s
- poster: 1.2s
- transition_in: cut
- status: animated
- src: src/worlds/fluid.js
- rules: ambient-glow-bloom, multi-phase-camera, motion-blur-streak
- sync: 0.000 impact (splash ring) · 0.469 / 0.938 / 1.406 dye pulses on beats · 1.406 vortex spin-up · 1.640 dive whoosh

Frame 0 is the moment of impact: a point of light on the void and a ring of ice shock-wave that *is* the leader ring. Infrared ink bursts and is swept into two counter-rotating vortices sitting in the 8's counters (top clockwise, bottom anticlockwise, so their flows agree where the bowls meet). Emitters ride the figure-of-eight path; dye outside the glyph dissipates, so a smoky, turbulent **8** reads by 0.6 s. Ice counter-flow curls inside the counters. On beat 4 the vortices spin up, the ink is drawn into the lower counter, and the camera dives into its white-hot core.

## Frame 2 — 7 · Light & 3D

- scene: A black-chrome 7, backlit by the vortex core, god rays streaming around it while the camera orbits
- duration: 1.875s
- poster: 2.6s
- transition_in: luminance match (vortex core → backlight)
- status: animated
- src: src/worlds/chrome.js
- rules: 3d-camera-flight, ambient-glow-bloom, depth-of-field-blur
- sync: 1.875 hit (silhouette against the light) · 2.344 ice key-light sweep ("shing") · 2.813 infra sweep + ray pulse · 3.281 dissolve begins

The white-out resolves into the backlight behind a true-3D extruded **7** (Archivo 900 / wdth 125, bevelled, black chrome). Volumetric rays fan out around its silhouette; dust drifts in the beams. The camera orbits from 35° right to 10° left while dollying back; specular highlights race along the bevels on beats 2 and 3. On beat 4 the 7 turns towards edge-on and dissolves from its edges into sparks.

## Frame 3 — 6 · Particles

- scene: The 7's sparks swirl into a spiral galaxy that snaps into a particle 6, then implodes to a point
- duration: 1.875s
- poster: 4.9s
- transition_in: mesh → particles (same scene, same camera)
- status: animated
- src: src/worlds/particles.js
- rules: particle-burst, depth-scatter-assemble, depth-of-field-blur
- sync: 3.750 burst · 4.219 spiral swell · 4.688 SNAP (the 6 locks) · 5.156 implosion · 5.625 point

The sparks burst outward, are caught in a spiral vortex and stream in galaxy arms with light trails; near particles are soft bokeh, far ones pin-sharp. On beat 3 each particle eases to its target inside the **6**, assembling along the spiral from the tail inward. It shimmers for a beat, with parallax under a slight orbit. On beat 4 everything implodes into the 6's counter: one bright point.

## Frame 4 — 5 · Liquid glass

- scene: The point blooms into a liquid-glass 5 that refracts a leader test-chart, rippling on the beat
- duration: 1.875s
- poster: 6.4s
- transition_in: point match (particle point → glass droplet)
- status: animated
- src: src/worlds/glass.js
- rules: scale-swap-transition, ambient-glow-bloom, coordinate-target-zoom
- sync: 5.625 bloom + shock-wave ripple · 6.094 drift · 6.563 lens push (dispersion peak) · 7.031 freeze to flat

Behind: a leader test-chart (thick concentric rings, crosshair, tick scales in mono) slowly counter-rotating. The point swells into a glass droplet that slams open into a thick, bevelled **5** with jelly overshoot. It refracts the chart with chromatic dispersion and Fresnel edge light; a shock-wave ripples the whole frame on the downbeat. On beat 3 it pushes toward camera, magnification and fringes peaking. On beat 4 the glass freezes flat and cracks along straight lines.

## Frame 5 — 4 · Geometry

- scene: Flat shards snap into a constructed 4 of primitives, masks and patterns; a pie-wedge sweep reveals it
- duration: 1.875s
- poster: 8.6s
- transition_in: shape continuity (glass shards → primitives)
- status: animated
- src: src/worlds/geometry.js
- rules: center-outward-expansion, spring-pop-entrance, svg-path-draw
- sync: 7.500 clack (tiles land) · 7.734 / 7.969 / 8.203 / 8.438 assembly snaps on 8ths · 16th dot pulses · 8.906 zoom into stripes

Bauhaus on the void: the shards land as tiles, flip on 8ths, and assemble a **4** from a triangle, a bar and a crossbar, each filled through a mask (stripes, dots, a solid). The leader sweep is literal here: a pie wedge rotates and reveals ice behind the 4. On beat 4 the camera zooms into the triangle's stripes, and the stripes resolve into lines of type.

## Frame 6 — 3 · Kinetic type

- scene: Lines of type bend into the two arcs of a 3, flowing as ribbons in three depths, then unspool into one line
- duration: 1.875s
- poster: 10.5s
- transition_in: pattern → type (stripes are lines of text)
- status: animated
- src: src/worlds/type.js
- rules: kinetic-beat-slam, waterfall-entry, depth-of-field-blur
- sync: 9.375 swoop (lines bend into arcs) · 9.844 / 10.313 word hits (width steps) · 10.313 tighten · 10.781 unspool

The text lines curve into a **3**: ribbons of the craft's own words (TIMING · SPACING · WEIGHT · RHYTHM · LIGHT · DEPTH · FORM · MOTION) flow along both arcs at different speeds, in three depth layers with focus falloff. Words step through Archivo's width axis on 8ths; key words flash infra on beats. On beat 3 the lanes tighten into a solid 3; on beat 4 they unspool off the bottom stroke into a single bright line.

## Frame 7 — 2 · Camera

- scene: The line becomes the leader's sweep hand, the 2-pop frame flashes, then the camera flies down the 2
- duration: 1.875s
- poster: 12.3s
- transition_in: line → sweep hand
- status: animated
- src: src/worlds/flight.js
- rules: 3d-camera-flight, motion-blur-streak, multi-phase-camera
- sync: 11.250 2-POP (1 kHz beep on silence) · 11.719 dive · 16th ring flashes · 12.656 exit glow · 13.125 drop

The single line sweeps a full circle as the leader's hand and reveals the classic frame: a crisp **2** in the ring and crosshair, grain and gate weave, one beat of silence with the 2-pop. On beat 2 the camera dives into the numeral and flies along its spine through a tunnel of leader rings: the curve, the diagonal, the base. Speed streaks, fog and ring flashes run on 16ths. At the end of the base stroke a bright opening rushes up.

## Frame 8 — Lockup

- scene: The camera exits through a letter and pulls back: SHOWREEL, every letter a window into one of the worlds
- duration: 1.875s
- poster: 14.6s
- transition_in: tunnel exit → letter window (zoom-out reveal)
- status: animated
- src: src/worlds/lockup.js
- blueprint: logo-assemble-lockup (Adapt), zoom-out-workspace-reveal (Adapt)
- sync: 13.125 DROP (hit + crash) · 13.594 letters fill bone in a cascade · 14.063 discipline line types on · 14.531 last glint · 15.000 end

We exit through the counter of a letter and pull back fast, decelerating, to reveal **SHOWREEL** (Archivo 900 / wdth 125) across the frame. Each letter is a window into one of the worlds: ink, chrome, sparks, glass, geometry, type, tunnel, leader. A leader ring arcs around the word. On beat 2 the letters fill bone left to right, each flashing its world as it closes, and an ice light-sweep crosses them. On beat 3 the discipline line types on in mono: MOTION DESIGN · 3D · ART DIRECTION — 2026. The last beat holds with a slow push and one final glint.
