# Xenoform — 3D alien made of dots

A 12 s, 9:16, seamlessly looping, silent video of a 3D alien drawn entirely by code:
197,760 dots whose positions are closed-form functions of (dot index, time).
No footage, no models, no AI image/video generation. Built from the
"AI Video With Code" master prompt, adapted to a single continuous shot.

## Deliverables (`out/`, not committed)
- `final_1080_ss.mp4` — 1080×1920, rendered at 2× and lanczos-downsampled
- `final_2160.mp4` — 2160×3840 native from the same frames
- `final_1080_ss_silent_track.mp4` — same as 1080 with a silent AAC track
- `thumb.jpg`, `../captions.srt`

## Rebuild
```
node render.mjs stills 0,4.5,9 [--ss 2] [--guides]   # quick look -> qa/
node render.mjs video --workers 2                     # 1x draft frames -> frames/
node render.mjs video --ss 2 --workers 2              # final frames -> frames_ss2/
./encode.sh && node verify.mjs
node qa/determinism.mjs 0,180,359
```
Render uses Playwright's bundled Chromium with SwiftShader (CPU WebGL2).
Measured here: ~0.8 s/frame at ss=1, ~1.7 s/frame at ss=2 with 2 workers.

## Files
| file | role |
|---|---|
| `tokens.js` | every colour, size, timing, post and camera value |
| `copy.json` | every visible word |
| `creature.js` | the creature: point counts + vertex shader (all motion lives here) |
| `engine/gl.js` | WebGL2 programs, RGBA16F targets, bloom → ACES → CA → vignette → grain |
| `engine/type.js` | on-screen type and its timeline |
| `engine/ease.js` | easing, `holdFor`, stateless hash |
| `index.html` | wires it up; exposes `renderFrame(t)`, `DURATION`, `FPS`, `READY` |
| `render.mjs`, `encode.sh`, `verify.mjs`, `qa/determinism.mjs` | harness and QA |

## How the creature works (creature.js)
Loop phase `P = 2π·t/12`. Every motion term uses an integer multiple of `P`, so the last
frame flows into the first.
- **Bell**: 112 dotted meridians + 36k skin dots. `contr()` is a fast-squeeze/slow-release
  pulse, 5 per loop, evaluated at `5P − 1.4v` so the squeeze travels down the bell
  (phase delay). Rim scallops, 8 lobes, ripples, x-ray fresnel brightness.
- **Eyes**: three sets of concentric dotted rings on the bell surface; two blinks per loop.
- **Brain**: a jittered double helix with a heartbeat glow, plus a dim ganglion cloud.
- **Tentacles**: 12 arms. Spine = root on the rim + two cosine waves whose amplitude grows
  as `s^1.5` along the arm; the bell's squeeze reaches the tips later (`5P − 1.4 − 2.2s`).
  Each arm is a 10-line dotted tube plus 40 fronds; frond tips (`q ≥ 0.9`) are red.
- **Dust**: 16k drifting points in front of and behind the creature; depth of field turns
  them into bokeh.
- Dot size = world size → pixels, combined with a thin-lens circle of confusion; blurred
  dots keep the same total light.

## Timeline (engine/type.js)
| t (s) | on screen |
|---|---|
| 0 – 3.4 | title, point count, statement (already on: it's the loop's first frame) |
| 3.4 – 3.65 | statement exits |
| 3.9 – 10.3 | three formula lines typed on glyph by glyph |
| 10.3 – 10.55 | formulas exit |
| 10.9 – 12 | statement re-enters word by word, matching frame 0 |

## Deviations from the master prompt
- One continuous shot instead of ≥3 scene types / transitions: the brief is a single creature.
- Playwright instead of puppeteer (pre-installed here; same headless Chromium).
- No three.js: the creature is a single `gl.POINTS` draw from a procedural vertex shader.
- Formulas on screen are simplified notation (`∝`), not the full expressions.

## Known issues / next ideas
- Labels column sits at 30.5 glyph advances; longer formulas would need a narrower set.
- Ideas: a 16:9 re-composition, a camera fly-through of the bell, a reveal where dots
  assemble from the dust at t = 0 (would break the clean loop).
