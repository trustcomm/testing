# FORM / FREQUENCY

A 15-second motion-design showreel at **1920 × 1080, 60 fps**. Six movements explore sculptural forms, kinetic tiles, optical depth, graphic disruption, organic transformation, and a typographic finish. The original soundtrack runs at 120 BPM; scene cuts at 2, 4, 7, 9 and 12 seconds land on beats.

## The three engines

- `shaders.js`: original GLSL ES 3.0 signed-distance fields, ray-marched glossy forms, procedural lighting and an optical tunnel. The shader canvas renders at the full 1920 × 1080 output resolution.
- `film.js`: Canvas 2D composition, variable-font typography, rotating geometry, deterministic spring motion, beat accents and the public `renderAt(seconds)` API.
- `score.js`: Web Audio oscillators, seeded noise, envelopes, filters, stereo placement, delay and compression. `OfflineAudioContext` synthesizes all 720,000 stereo samples. No recorded sound, sample libraries or external music.

Fonts are the only bundled visual assets. Their licenses are included in `fonts/`.

## Play and edit

Serve this directory with any static web server, then open `index.html`. Click **Play with sound** to start the synthesized soundtrack and synchronized animation. Use the timeline to inspect any frame. A recent browser supporting WebGL 2 and Web Audio is required.

```bash
python3 -m http.server 8080
```

## Render the MP4

Install Node.js, FFmpeg and Chromium, then:

```bash
npm ci
REMOTION_BROWSER=/usr/bin/chromium npm run render
```

Output: `out/form-frequency-15s.mp4`, H.264 video with stereo AAC, and a `faststart` layout for browser playback. Set `FILM_OUTPUT` to choose a different output directory. `npm run preview` exports representative PNG frames and the synthesized WAV. `npm run serve` opens a local preview server and prints its URL.

All 900 frames are captured from the actual Canvas/WebGL implementation. Time comes from the requested frame number; the export does not record a real-time browser animation. The Web Audio buffer is rendered independently and then mixed into the MP4.

## Reference provenance

The project-local `awesome-opus-videos` skill found [@prasenx's shared 15-second brief](https://x.com/prasenx/status/2103538744695693512), tagged shader / canvas / audio. We adapted its technical constraint, beat synchronization and deliverable specifications into an original visual concept, source implementation and score. No linked video or implementation was downloaded or copied.

Pinned reference catalog: `yihui-dev/awesome-opus5-5-videos`, commit `756290289742535eb0ac3817548f152e9759cc70`. The skill adapter includes its catalog provenance and upstream MIT license.
