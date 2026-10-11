# Leader — Showreel 2026

A 15-second motion-design showreel, 1920×1080 at 60 fps. A film-leader countdown, reimagined. Each numeral from 8 to 2 is one bar of music and one discipline, and the numeral's own shape is the reason for its technique. The count drops into a SHOW / REEL lockup whose letters are windows into every world.

## The count, bar by bar

| Time | Numeral | Discipline | What happens | How it is made |
| --- | --- | --- | --- | --- |
| 0.00–1.88 | 8 | Fluid simulation | Frame 0 is an impact: a shock ring that becomes the leader ring. Infrared ink is swept into two counter-rotating vortices that sit in the 8's counters, so the flow traces a figure of eight. On beat 4 the ink spirals into the lower counter and the camera dives into its white-hot core | GPU stable fluids:<br>• semi-Lagrangian advection<br>• vorticity confinement<br>• Jacobi pressure projection<br>• dye held to the glyph's signed-distance field<br>• splash and suction as dye-only displacement |
| 1.88–3.28 | 7 | Light & 3D | The white-out resolves into the backlight behind a bevelled black-chrome 7. God rays fan around it, light sweeps race along the bevels on the beats, and the camera orbits from low left to front | Three.js:<br>• extruded glyph<br>• physical material with clearcoat<br>• PMREM studio of light strips<br>• screen-space volumetric scattering<br>• MSAA |
| 3.28–5.63 | 6 | Particles | The 7 burns away from its extremities. 12,000 sparks leave the metal exactly where it dissolves, swirl into a three-arm spiral galaxy, snap into a 6 from the tail inward, and implode to a point | Integer-hash noise identical on CPU and GPU, so every spark's spawn time matches the dissolve front. Positions are pure functions of t. Depth-of-field bokeh |
| 5.63–7.27 | 5 | Refraction | The point blooms into a glass droplet that slams open into a liquid-glass 5. It refracts a leader test chart (Siemens star) with dispersion and Fresnel edge light; shock-waves ripple the chart. On beat 4 it freezes flat | A 2.5D shader driven by the 5's signed-distance field:<br>• bevel height and normals<br>• lens magnification on the flat top<br>• per-channel refraction |
| 7.27–9.38 | 4 | Geometry & masks | The flat 5 cracks into its parts. The top bar becomes the 4's crossbar, the stem its stem, and the bowl rolls out into the leader circle. An infrared diagonal stamps in, a pie-wedge sweep reveals a 16th-note dot grid, and the 4's open counter fills with stripes of tiny type | Canvas 2D construction kit: bbox morphs with a mid-flight swap, and the glyph clipped into pieces |
| 9.38–11.02 | 3 | Kinetic type | The camera zooms into the stripes: they are lines of type. The lines bend into ten ribbon lanes along the 3's two bowls, step through Archivo's width axis on 8ths, flash on the beats, tighten, then converge into one line that straightens into the sweep hand | Text on elliptical paths, laid out glyph by glyph by arc length, with the scroll continuous across the hand-off |
| 11.02–13.13 | 2 | Camera | The hand sweeps the classic leader frame and the 2-pop sounds on silence (grain, flicker, gate weave). The camera then drops into the open top of the extruded 2 (a dolly zoom from 10° to 80°), pitches onto its spine and flies through sprocket-lit walls and arches chasing on 16ths, out into white light | Three.js corridor: the glyph extruded as walls, a Catmull-Rom spine, and quaternion-slerped camera poses |
| 13.13–15.00 | — | Lockup | The camera pulls back out of the L. Every letter of SHOW / REEL is a window into one world, in countdown order. The letters fill bone in a cascade, an ice light-sweep crosses them, the discipline line types on, and a glint lands on the W | Letter masks redrawn every frame, so they stay vector-crisp at 16× zoom. The windows use stills rendered from the reel itself, packed into one atlas |

Leader markings frame every bar:
- the discipline label, with a mechanical scramble on each change;
- the count;
- one dot per numeral passed;
- corner registration ticks.

## Sound

`scripts/score.py` synthesizes the whole cue in numpy: a 128 BPM cue in D minor, 8 bars = 15.000 s. Each numeral adds a layer. The harmony climbs Dm · Dm · B♭ · Gm · A · Dm · B♭→A, then resolves to D major on the lockup.

Every visual event has a designed sound on its exact time from the shared cue sheet (`src/cues.js`), including:
- the splash bloom;
- the forge hit and the metallic shings;
- the dissolve sizzle;
- the SNAP when the 6 locks;
- the glass bloom and the freeze;
- the clack;
- the typewriter;
- the 1 kHz 2-pop on silence (one film frame long);
- the drop;
- one bell per letter as the lockup fills.

Master: −14 LUFS integrated, true peak ≤ −1.5 dBTP.

## Rebuild

```bash
python3 -I scripts/glyphs.py            # Archivo outlines at fixed instances → src/data/glyphs.js
python3 -I scripts/score.py             # assets/audio/score.wav (+ build/score-report.json)
node scripts/stills.mjs                 # world stills for the lockup windows → assets/stills/
npx hyperframes check                   # lint, runtime, layout, motion, contrast
node scripts/audit_seek.mjs             # frames pixel-identical under forward / backward / random seeks
npx hyperframes render --fps 60 --quality high --output renders/leader-reel.mp4
python3 -I scripts/verify_render.py renders/leader-reel.mp4
```

For rendering in a headless container:
- set `PRODUCER_HEADLESS_SHELL_PATH` to the Chromium headless shell;
- WebGL runs on SwiftShader.

The dev harness `node scripts/frames.mjs --at 1.2,4.8` renders chosen times straight from the engine into a contact sheet.

## Rules this piece keeps

- **No cuts.** Every hand-off is a material transformation that matches on its frame: white-out, point, flat shape, rows of type, a line, white.
- **Determinism.**
  - Everything is a pure function of t, except the fluid, which re-simulates from t = 0 at a fixed 1/60 s step whenever it is seeked backwards.
  - Randomness is seeded, with no clocks.
  - 2D canvases reset their state every frame.
- **One palette, one display family.**
  - Palette: void, bone, infrared, ice.
  - Type: Archivo (wght 100–900, wdth 62–125), with Geist Mono for the leader markings.
- **No third-party logos.** The lockup is a finished generic title; the name is one string in `src/worlds/lockup.js`.

## Credits

| Asset | Licence |
| --- | --- |
| Archivo (Omnibus-Type) | SIL OFL |
| Geist Mono (Vercel) | SIL OFL |
| three.js | MIT |
| GSAP | Standard "no charge" licence |
| All sound | Synthesized in `scripts/score.py` |
