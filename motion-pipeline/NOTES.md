# Project state

Silent motion graphics from code: a page draws one frame at a time, headless Chrome captures it, ffmpeg encodes it.
Done: lesson 1 (pipeline), lesson 2 (the strict renderFrame contract), lesson 3 (the 5 s title card and the layout grid), then engine/type.js and the 8 s type demo, then engine/draw.js, engine/props.js and the 6 s diagram.

## Run

    export CHROME_PATH=/path/to/chrome   # optional; unset, puppeteer uses its own Chrome
    npm test          # test-determinism.mjs: banned calls, hold rule, replay order, frame K fresh vs after 0..K vs hops, safe box
    npm run render    # frames/f00000.png ... (all frames, t = i / FPS)
    npm run encode    # out/video.mp4: the whole timeline, 19 s (the framerate in package.json must match FPS in tokens.js)
    npm run qa:type   # qa/type_sheet.png: a still at the middle of every entrance and hold of the type demo
    npm run qa:diagram  # qa/diagram_t4.png (scene time 4 s) and qa/diagram_zoom.png (a 200 % crop; args: x y w h)
    npm run qa:props    # qa/props_sheet.png: all four props side by side
    npm run stills    # frames/stills.jpg: four stills (default t = 0.4, 1.2, 2.5, 4.8) with the safe box in red
    open http://localhost:8080/index.html   # live preview (serve the folder; no ?render)

## The contract

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
- `qa/` contact sheets · `qa-type-sheet.mjs` draws the stills onto one canvas
- `fonts/` Space Grotesk 700 and JetBrains Mono 500 (SIL OFL, licences alongside) · `frames/` PNGs and stills, git-ignored · `out/` MP4s
