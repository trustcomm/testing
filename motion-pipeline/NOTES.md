# Project state

Silent motion graphics from code: a page draws one frame at a time, headless Chrome captures it, ffmpeg encodes it.
Done: lesson 1 (pipeline), lesson 2 (the strict renderFrame contract), lesson 3 (the 5 s title card and the layout grid), then engine/type.js and the 8 s type demo, then engine/draw.js, engine/props.js and the 6 s diagram, then the WebGL2 layer and post chain (engine/gl.js, shaders/), then particles (engine/particles.js: motes, burst, confetti, sparksFromGlyphs, glParticles) and the 6 s particles scene.

## Run

    export CHROME_PATH=/path/to/chrome   # optional; unset, puppeteer uses its own Chrome
    npm test          # test-determinism.mjs: banned calls, hold rule, replay order, frame K fresh vs after 0..K vs hops, safe box
    npm run render    # frames/f00000.png ... (all frames, t = i / FPS)
    npm run encode    # out/video.mp4: the whole timeline, 25 s (the framerate in package.json must match FPS in tokens.js)
    npm run qa:type   # qa/type_sheet.png: a still at the middle of every entrance and hold of the type demo
    npm run qa:diagram  # qa/diagram_t4.png (scene time 4 s) and qa/diagram_zoom.png (a 200 % crop; args: x y w h)
    npm run qa:props    # qa/props_sheet.png: all four props side by side
    npm run qa:post     # qa/post_ab.png (t = 1 and 3, post off | on), qa/post_zoom.png, and the bloom wash-out numbers
    npm run qa:particles  # qa/particles_sheet.png: the particles scene at its key moments, the GPU field, sparksFromGlyphs
    node render.mjs 570 750   # only frames 570..749 (a changed scene re-renders alone; no arguments = every frame)
    npm run stills    # frames/stills.jpg: four stills (default t = 0.4, 1.2, 2.5, 4.8) with the safe box in red
    open http://localhost:8080/index.html   # live preview (serve the folder; no ?render)

## The contract

`#c` is a WebGL2 canvas (`{ preserveDrawingBuffer: true, antialias: false }`). The scenes draw in 2D on a transparent `OffscreenCanvas` (`window.LAYER`); `engine/gl.js` uploads it each frame and renders the background shader, the composite and the post chain. The harness captures `#c`. `window.renderLayer(t)` draws the 2D layer alone (fast; QA and the layer tests use it); `renderFrame(t)` is the whole pipeline.

- `window.renderFrame(t)` clears the canvas (`ctx.reset()`, which also resets all context state) and repaints it from t and constants only. `window.FPS` = 30 and `window.DURATION` come from tokens and scenes.
- `window.READY` is false until every font in `tokens.fonts` has loaded (`document.fonts.load` each, then `document.fonts.ready`) and every scene's optional `async load()` has resolved: that is where a scene decodes images or compiles shaders.
- The harness (`harness.mjs`) computes t = frame / FPS. It never adds up deltas.
- Banned in the draw path (`index.html` above its preview block, `tokens.js`, `engine/`, `scenes/`): Date.now, new Date, performance.now, Math.random, crypto.getRandomValues, setTimeout, setInterval, requestAnimationFrame, requestIdleCallback, queueMicrotask, CSS animations and transitions. `npm test` scans for them.
- Randomness inside draw: `hash(i, seed)` (engine/rng.js), stateless. `mulberry32(seed)` is load time only and throws once READY is set. State inside draw: `replay()` (engine/sim.js), a fixed 1/120 s step replayed from 0 and cached by step index. `spring(x, k, z)` (engine/ease.js) is the exact closed form.
- Scenes are `export default { start, dur, draw(ctx, t, dur), statements? }`, listed in `scenes/index.js`; `t` is local to the scene. Each scene draws between `save()` and `restore()`.

## The layout grid (engine/layout.js, tokens.js)

- Canvas 1920x1080. Safe margins x 144, y 96, so the content box is x 144..1776, y 96..984 (`grid.l/r/t/b/w/h`, centre `grid.cx/cy`).
- Align to the safe margins; centre only the hero line, and centre it on its ink (`actualBoundingBox`), not its advance width.
- One idea per card, one to four words per line, one accent word per card (`color.accent`).
- Type roles come from the tokens: hero 168 / h1 112 / h2 72 / body 40 / label 26, tracking in em. `setType(ctx, role)` sets font and tracking together; set both before measuring. `fitPx` shrinks a line to fit a width.
- `drawLabel(ctx, "01 / INTRO", alpha)` puts the mono label in the top-left safe corner, caps on the safe line. It is not pushed with the rest of the card.
- A constant slow push (scale 1.00 to 1.03 about the centre) keeps a card from looking frozen. Size the headline for the end of the push: `grid.w / 1.03`.
- The hold rule: every statement stays fully legible for at least `tokens.hold` (1.2 s) after it finishes animating in. A scene lists `statements: [{ id, inDone, outStart }]` and the test enforces it. Exit in the last 0.5 s so the next scene can overlap it.
- Stagger per word 0.06-0.12 s (this card: 0.09). Use `ctx.filter = blur()` on text only, never on a full-frame fill.

## The GL layer and post chain (engine/gl.js, shaders/*.frag)

Per frame: upload the layer (premultiplied) -> `bg.frag` (slow domain-warped fbm through the token colours bg -> dim -> accent, `BG_INTENSITY` 0.04, rendered at a quarter size and upsampled; loops bounded by the `uOne` uniform, `uTime`/`uRes`/`uFrame`) -> `comp.frag` (layer over the background, in linear light) -> bloom (threshold on the brightest channel, 5 levels of 13-tap downsample, tent upsample; skipped entirely when `bloom` is 0) -> `tone.frag` (exposure, ACES fit, sRGB, S-curve grade, warm highs / cool lows at most 6 %) -> `final.frag` (radial chromatic aberration, vignette, luminance-weighted grain seeded by `uFrame`). Every pass between is RGBA16F; `EXT_color_buffer_float` is required and a missing one throws. `program()` throws with the shader info log (and the numbered source).

`window.POST = { bloom 0.25, thresh 1.05, ca 0.8 px, grain 0.045, vig 0.35, exposure 1 }`. A scene may override any of them while it draws; every `renderFrame` resets them to the defaults first. `POST.on = false` is the A/B switch (the composite alone) and `POST.force = {...}` wins over a scene's values: both are QA switches and are not reset.

- The bloom threshold is in linear scene light. Text tops out at 1.0 (the accent's green), so at the first-pass 0.85 the accent word bloomed (a halo, and +5/+2/+10 on its RGB). At 1.05 type never blooms; glows and the pulse (additive, above 1) do.
- ACES and the grade, not bloom, are what move the accent: with post off the lime letters are exactly 200,255,61; with post on and no bloom they are 215,217,104 (pale yellow). Exposure 0.8 gives 203,210,85. It is an art-direction choice, so the default stays 1.0; set `POST.exposure` per scene or change the default.
- Under software GL (SwiftShader) a frame costs about 0.7 s, mostly texture fetches in the bloom chain; a render of 19 s is about 7 minutes. On a GPU it is milliseconds.
- `drawBackground()` is now a no-op (the background is the shader), and the 2D `grain()` is no longer called (the post chain has the grain).
- The harness launches Chrome with `--ignore-gpu-blocklist`, `--use-angle=metal` on macOS, and `--enable-unsafe-swiftshader` on Linux (software GL where there is no GPU).

## Kinetic type (engine/type.js)

Every move is `(ctx, t, opts)`, draws immediately, is a pure function of t and restores the context. Shared opts: `text, x, y` (left end of the baseline), `role` (default "h1") and `size`, `t0` (entrance start), `color`, `out: [start, end]` (a quick fade-and-lift exit).

- `layoutGlyphs(ctx, str, x, y, font, trackPx)` -> `{ glyphs: [{ ch, i, x, y, w }], width }`. Prefix-measured, so kerning and tracking match the whole string.
- `riseIn` per-glyph stagger (0.03 s), rise + blur + alpha on outExpo; `riseInDur(text)` gives the entrance length (10 glyphs = 0.57 s).
- `scramble` resolves left to right; unlocked glyphs are `hash(i, seed + floor(t*20))` picks from A-Z 0-9 `/<>`, centred in the slots of the FINAL string. Use a mono role so every slot is the same width.
- `typeOn` uneven keystrokes (hashed), the last char lands at t0 + dur; solid caret while typing, 2 Hz blink after; newest char accent.
- `odometer` columns clipped to the line height, outCubic, all land together; `prefix`/`suffix`/`affixColor`. A column whose digit is unchanged still rolls one turn; `spins` adds more. Fast columns smear (taps follow the speed) over a crisp lead digit.
- `markerWipe` accent pill grows behind a word (the words slide apart to make room); the word flips to dark-on-accent, clipped to the pill so it is never unreadable. (`ink` is light, so ink-on-accent would not be legible: the flip uses the bg colour.)
- `splitExit` breaks before the middle word, halves slide apart with a 6-tap blur (shutter 1/90 s); optional `in: [a, b]` slides them together on the way in.

## The type demo (scenes/s02_type_demo.js, starts at 5 s, 8 s long)

Six statements cannot each hold 1.2 s and fit in 8 s one at a time (6 x (0.3 + 1.2 + 0.15) = 9.9 s), so they overlap, alternating between two rows. Per statement: entrance 0.40-0.57 s, hold 1.25-1.3 s, exit 0.2-0.25 s; `npm test` enforces 0.3-0.6 / at least 1.2 / 0.15-0.3. The safe-box test only counts frames where no other statement is moving (a line sliding in may cross the margin on purpose).

QA (qa/type_sheet.png): the weakest move was the odometer (four ghost copies per digit mid-roll read as a glitch). Also fixed from the same sheet: the marker pill touched the word before it, and the split's six taps showed as separate ghosts.

## Illustration finish (engine/draw.js) and props (engine/props.js)

Tokens added: `stroke {outline 4.5, detail 3}`, `radius 16`, `shadowAlpha 0.3`, and four hues (accent lime, ice, coral, violet) plus the neutrals bg, ink, dim, glow. `npm test` fails on a fifth hue, a hex/rgba literal outside tokens.js, or a bare-number `lineWidth` in the engine or scenes. Lighting constants that belong to the look, not the palette, live in props.js (`RIM`, `GLASS`, `GLOW`).

- `shade(hex, dl)` HSL lightness shift (dl a fraction, +0.1 = ten points lighter). `litFill(ctx, x, y, w, h, base)` returns a top-left-lit 3-stop gradient. `rgba`, `lightness`, `hue` are helpers.
- `grain(ctx, t)` overlay blend at 8 % of a 512x512 seeded tile (built once at load with mulberry32; no tile under Node), offset by `hash(frame)`. Call it last.
- `boilPath(ctx, pts, t, { amp 1.5, fps 8, seed, closed, step, weight, color })` jitters vertices with `hash(i, seed + floor(t*fps))`, width +-15 %. `step` > 1 hashes every few vertices and blends between them (smooth wobble, no chipped corners); `weight`/`color` give per-segment width and colour.
- `contactShadow(ctx, x, y, w)` a penumbra and a tight core, both blurred ellipses at 0.3. `pool(ctx, x, y, w, color)` a pool of the object's colour on the floor, so the shadow has something to darken.
- `measure(pts)` caches path lengths (call it at load); `drawOn(ctx, pts, p)` dash-offset reveal; `pulseAlong(ctx, pts, p)` bright head and an 8-dot additive tail.
- Props: `laptop`, `chatBubble`, `chartCard`, `folder`, each `(ctx, t, { x, y, s, rot, seed })`, with `.foot` and `.w`. Each part has a top-left gradient, an outline that is thin and light on lit edges and heavy and dark on shaded ones, a rim light, a bounce of shadow, and a contact shadow.

What made the first pass read as clip-art, and the fix: uniform outline weight (now light-aware), flat slabs with no thickness (two-tone base, lips), a rainbow of equal bars on a dead screen (one accent line, a glow, a glass reflection), a contact shadow too faint to see (penumbra plus core), lumpy corners from per-vertex jitter (`step`), and a perfectly square-on layout (outer props tilt by 0.03 rad).

## Particles (engine/particles.js, scenes/s04_particles.js, 19-25 s)

No particle array and nothing updated per frame: every attribute of particle i is `hash(i, k)` and its state a closed-form function of (i, t). Every alpha is 0 at birth and at death. Colours are tokens. Each look is a pure state function (`moteAt`, `sparkAt`, `confettiAt`, `glParticleAt`: what particle i is doing at t, or null) under a draw function.

- `motes(ctx, t, { n: 600, layers: 3, color, drift, cam, density, alpha, seed })` three depth layers (the far one holds the most): far = slow, dim, big and soft (a gradient sprite baked at load: the blur), near = faster, brighter, crisp. Looping lifetime `age = ((t - born) % life + life) % life`, alpha `sin(pi * age / life)`, so it is alive at t = 0. Additive (`lighter`). `alpha` is a scene-level fade; `density` is a dial (see below).
- `burst(ctx, t, { t0, x, y, n: 220, speed, gravity, life, spread, angle, colors })` ballistic `v*age + g*age^2/2`; each spark is a line from pos(age - 0.03) to pos(age) (motion blur for free), a wide faint halo under a core line. Alpha is a 0.3 s smoothstep fade-in times a linear fade over the spark's own life (0.8 to 1.4 s).
- `confetti(ctx, t, { t0, x, y, n: 160, colors, drag, gravity, speed, life, angle, spread })` closed-form drag `v*(1-e^(-k age))/k + (g/k)*(age - (1-e^(-k age))/k)`, rotation, `scaleY = cos(age*spin)` for the flip (an edge-on piece is darker).
- `sparksFromGlyphs(ctx, t, glyphs, lockTimes, { lift, n: 14, ... })` one tiny burst per glyph, at the glyph's centre, the moment it locks. `glyphs` is `layoutGlyphs(...).glyphs`, `lockTimes` is `lockTimes(n, o)` from engine/type.js (the times `scramble` locks its glyphs). `glyphBursts` returns the bursts it fires.
- `glParticles(gl, t, { n: 40000, cam, density, size, intensity, drift, seed, first, colors })` a WebGL2 point field with nothing uploaded: the vertex shader (inline in `GLSL.vert`) builds every point from `gl_VertexID` and `uTime`; the fragment shader is a soft round sprite; blended `ONE, ONE` into the bound framebuffer (engine/gl.js binds the HDR target, so bloom sees it) and the blend state, program and VAO are put back. A scene turns it on with `window.PARTICLES.n = 40000` (reset every renderFrame; `PARTICLES.force` is the QA override).
- Camera: every function takes `cam: { dx, dy, z }`. A particle at depth d (0.35 far .. 1 near; bursts and confetti are at 1) shifts by `-dx*d, -dy*d` (the far layers move less: parallax), and `z` dollies about the frame centre, scale `1 + z*d`. Where the camera wraps the dust round the frame edge, the particle is already faded out.
- Density dial (`density`, motes and GPU): each particle has a threshold and fades in over a quarter of the dial's travel, so turning it never pops one *at a sane speed*: move it by at most about 1 per second (a spike over a quarter of a second would pop every particle that crosses).
- The GPU hash is an integer one (PCG), not the lesson's `fract(sin(x) * 43758)`: sin() is implemented differently on different GPUs, so a sin-hash field is a different field on another machine, and float32 runs out of precision at ids in the tens of thousands. Integer maths is the same everywhere, so `glParticleAt` (the JS twin) matches it bit for bit, and the tests check the GPU against it.
- Under Node (the tests import the scenes) there is no document: the sprites do not exist and the 2D draws skip. `NO_PARTICLES = true` makes the 2D draws no-ops (the safe-box test measures the design layer alone with it).

The scene (`s04_particles.js`, 6 s): the dust throughout (fades in 0-0.6 s and out 5.6-6 s, with a camera that drifts and pushes in), the number rolling up (0.55 s) and landing at 2.0 s on 980 = 600 motes + 220 sparks + 160 pieces, the burst behind it at 2.0 s, confetti from below the frame on the right at 3.2 s (all pieces gone by 5.8 s). Everything the test scans is in the scene's exported `field`.

What `npm test` checks for particles:
- over frames 0-180 of the scene, for every particle of every look, the biggest alpha change between consecutive frames is <= 0.2, and at every appearance and disappearance (sampled every 1/240 s) alpha is <= 0.02;
- the camera: dx 100 moves a far mote 35 px and a near one 100 px; a burst moves by exactly -dx; z scales about the centre;
- the vertex shader keeps `mod()` age, `sin(pi * age / life)` alpha, `gl_VertexID`/`uTime` only, and an integer hash;
- the GPU field is the same bytes cold, drawn twice and after hops; the GPU draws sampled particles where the JS twin says (within a pixel) and particles whose twin alpha is 0 add nothing;
- scene frames 60 and 120 (global 630 and 690, and global 60 and 120): the design layer fresh = after frames 0..K, and the whole pipeline fresh = after hops.

`npm run qa:particles` writes qa/particles_sheet.png: the scene at its key moments, the GPU field with and without a camera move, and sparksFromGlyphs.

First-pass mistakes, and the fix: a 0.06-0.08 s birth ramp made sparks and confetti flash in (jumps 0.5-0.75): now 0.3 s smoothstep. The dust started below the frame and piled up along the bottom edge: each particle now starts at its own height. A GPU density dial 0.1 wide popped particles when swept at 0.7 per second (jump 0.255, found by the scan): now 0.25 wide, and the safe rate is documented.

## Decisions

- `renderFrame` fills an opaque background after the reset: a transparent PNG would encode to black, not the token colour.
- `index.html?render` skips the live preview loop, the only place a clock appears (performance.now picks t; nothing else).
- A face needs three things: the .woff2 in `fonts/` (with its licence), an `@font-face` in index.html, and an entry in `tokens.fonts`. Inter (`font.body`) is a token only; its file is not bundled yet.
- The determinism test checks frame 150 when the video is longer than 150 frames, else a frame at 90 % of the duration (a 5 s card has frames 0..149). It was checked against deliberate violations (leaked state, Math.random, mulberry32 inside draw): each printed FAIL.
- The headline fits at the full 168 px; the title card's type is inside the safe box for the whole hold (checked on pixels).

## Layout of the folder

- `tokens.js` (frozen) · `engine/` ease, rng, sim, layout (frozen once it works)
- `scenes/s01_title.js` "CODE IS THE CAMERA", 0-5 s, label "01 / INTRO" · `scenes/s02_type_demo.js` the six type moves, 5-13 s
- `scenes/s03_diagram.js` three props, two lines that draw on, a pulse, labels 0.2 s after each prop, 13-19 s · `engine/draw.js`, `engine/props.js`
- `engine/type.js` kinetic type · `engine/layout.js` also has `fontFor` and `drawBackground` (pass scene t + scene start so the light does not jump at a cut)
- `scenes/s04_particles.js` dust, a number landing on a burst, confetti, 19-25 s · `engine/particles.js` (the GPU shaders are inline)
- `qa/` contact sheets · `qa-sheet.mjs <scene module> <out png>` draws a scene's entrance and hold stills onto one canvas · `qa-particles.mjs`
- `fonts/` Space Grotesk 700 and JetBrains Mono 500 (SIL OFL, licences alongside) · `frames/` PNGs and stills, git-ignored · `out/` MP4s
