# Project state

Silent motion graphics from code: a page draws one frame at a time, headless Chrome captures it, ffmpeg encodes it.
Lesson 1 (pipeline) and lesson 2 (the renderFrame contract) are done.

## Run

    export CHROME_PATH=/path/to/chrome   # optional; unset, puppeteer uses its own Chrome
    npm test          # contract test: static scan + frame 150 cold vs warm vs after hops
    npm run render    # frames/f00000.png ... (all frames, t = i / FPS)
    npm run encode    # out/demo.mp4 (the framerate in package.json must match FPS in tokens.js)
    open http://localhost:8080/index.html   # live preview (serve the folder; no ?render)

## The contract

- `window.renderFrame(t)` repaints the whole canvas from t and constants only. `window.DURATION` and `window.FPS` come from the scenes and tokens. `window.READY` is set after the fonts load.
- The harness (`harness.mjs`) computes t = frame / FPS. It never adds up deltas.
- Banned in `engine/` and `scenes/`: Date.now, performance.now, Math.random, setTimeout, setInterval, requestAnimationFrame, CSS animation. `npm test` scans for them.
- Randomness is `hash(i, seed)` (engine/rng.js): stateless. State is `replay()` (engine/sim.js): fixed 1/120 s step, cached by step index.
- Scenes are `{ start, dur, draw(ctx, t, dur) }`, listed in `scenes/index.js`; `t` is local to the scene. Each scene draws between `save()` and `restore()`.

## Decisions

- `renderFrame` fills the background with an opaque colour instead of `clearRect`: a transparent PNG would encode to black, not the token colour.
- `index.html?render` skips the live preview loop (the only place a clock appears).
- The test was checked against a deliberate violation (a counter that leaks between frames): both comparisons failed as they should.

## Layout

- `tokens.js` colours, fonts, sizes (frozen once approved) · `engine/` easing, hash, replay (frozen once it works)
- `scenes/s01.js` title, 0-3 s · `scenes/s02.js` bouncing ball, 3-6 s
- `fonts/` Space Grotesk 700 (SIL OFL, licence alongside) · `frames/` PNGs, ignored by git · `out/` MP4s
