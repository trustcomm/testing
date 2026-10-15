# Project state

Silent motion graphics from code: a page draws one frame at a time, headless Chrome captures it, ffmpeg encodes it.
Done: lesson 1 (pipeline), lesson 2 (the strict renderFrame contract), lesson 3 (the 5 s title card and the layout grid).

## Run

    export CHROME_PATH=/path/to/chrome   # optional; unset, puppeteer uses its own Chrome
    npm test          # test-determinism.mjs: banned calls, hold rule, replay order, frame K fresh vs after 0..K vs hops, safe box
    npm run render    # frames/f00000.png ... (all frames, t = i / FPS)
    npm run encode    # out/title.mp4 (the framerate in package.json must match FPS in tokens.js)
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

## Decisions

- `renderFrame` fills an opaque background after the reset: a transparent PNG would encode to black, not the token colour.
- `index.html?render` skips the live preview loop, the only place a clock appears (performance.now picks t; nothing else).
- A face needs three things: the .woff2 in `fonts/` (with its licence), an `@font-face` in index.html, and an entry in `tokens.fonts`. Inter (`font.body`) is a token only; its file is not bundled yet.
- The determinism test checks frame 150 when the video is longer than 150 frames, else a frame at 90 % of the duration (a 5 s card has frames 0..149). It was checked against deliberate violations (leaked state, Math.random, mulberry32 inside draw): each printed FAIL.
- The headline fits at the full 168 px; the title card's type is inside the safe box for the whole hold (checked on pixels).

## Layout of the folder

- `tokens.js` (frozen) · `engine/` ease, rng, sim, layout (frozen once it works)
- `scenes/s01_title.js` "CODE IS THE CAMERA", 0-5 s, label "01 / INTRO"
- `fonts/` Space Grotesk 700 and JetBrains Mono 500 (SIL OFL, licences alongside) · `frames/` PNGs and stills, git-ignored · `out/` MP4s
