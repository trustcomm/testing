# Project state

Silent motion graphics from code: a page draws one frame at a time, headless Chrome captures it, ffmpeg encodes it.
Lesson 1 (pipeline) and lesson 2 (the renderFrame contract, refactored to the strict version) are done.

## Run

    export CHROME_PATH=/path/to/chrome   # optional; unset, puppeteer uses its own Chrome
    npm test          # test-determinism.mjs: banned-call scan + frame 150 in a fresh page vs after frames 0..150 vs after hops
    npm run render    # frames/f00000.png ... (all frames, t = i / FPS)
    npm run encode    # out/demo.mp4 (the framerate in package.json must match FPS in tokens.js)
    open http://localhost:8080/index.html   # live preview (serve the folder; no ?render)

## The contract

- `window.renderFrame(t)` clears the canvas (`ctx.reset()`, which also resets all context state) and repaints it from t and constants only. `window.FPS` = 30 and `window.DURATION` come from tokens and scenes.
- `window.READY` is false until every font in `tokens.fonts` has loaded (`document.fonts.load` each, then `document.fonts.ready`) and every scene's optional `async load()` has resolved: that is where a scene decodes images or compiles shaders.
- The harness (`harness.mjs`) computes t = frame / FPS. It never adds up deltas.
- Banned in the draw path (`index.html` above its preview block, `tokens.js`, `engine/`, `scenes/`): Date.now, new Date, performance.now, Math.random, crypto.getRandomValues, setTimeout, setInterval, requestAnimationFrame, requestIdleCallback, queueMicrotask, CSS animations and transitions. `npm test` scans for them.
- Randomness inside draw: `hash(i, seed)` (engine/rng.js), stateless. `mulberry32(seed)` is for load time only and throws once READY is set. State inside draw: `replay()` (engine/sim.js), a fixed 1/120 s step replayed from 0 and cached by step index.
- `spring(x, k, z)` (engine/ease.js) is the exact closed-form response of a damped spring: k natural frequency, z damping ratio.
- Scenes are `{ start, dur, draw(ctx, t, dur) }`, listed in `scenes/index.js`; `t` is local to the scene. Each scene draws between `save()` and `restore()`.

## Decisions

- `renderFrame` fills the background with an opaque colour instead of `clearRect`: a transparent PNG would encode to black, not the token colour.
- `index.html?render` skips the live preview loop, the only place a clock appears (performance.now picks t; nothing else).
- The test was checked against deliberate violations (a counter leaking between frames, Math.random in a scene, mulberry32 inside draw): each made it print FAIL.

## Layout

- `tokens.js` colours, fonts, sizes (frozen once approved) · `engine/` easing, hash, replay (frozen once it works)
- `scenes/s01.js` title, 0-3 s · `scenes/s02.js` bouncing ball, 3-6 s
- `fonts/` Space Grotesk 700 (SIL OFL, licence alongside) · `frames/` PNGs, ignored by git · `out/` MP4s
