# Claude — Motion Reel

A 15-second résumé reel, 1920×1080 at 60 fps, in one unbroken take. A single clay-coloured dot moves through seven motion-design disciplines and ends as the full stop in "Claude.", before the camera pulls back to show the whole reel as one composition in a motion tool.

Output: `out/render/claude-showreel.mp4`.

## The take, beat by beat

| Time | Chapter | What happens | How it is made |
| --- | --- | --- | --- |
| 0–1 s | 00 Cold open | The camera pulls out of the dot (log-space zoom), then the dot drops onto the downbeat | One camera transform, scale 60 → 1 |
| 1–3 s | 01 Squash & Stretch | Four contacts on the beat, with onion skins every 4 frames, the dotted arc of the path, keyframe diamonds and a contact shadow. Then it launches at camera | Projectile physics; squash on the exact contact frame; volume-preserving stretch along the velocity; sub-frame motion blur |
| 3–5 s | 02 Liquid | It lands as jelly, splits into three metaballs that orbit and pulse, merges, then stretches into a line | Signed-distance metaballs (smooth-min) in a WebGL shader, crisp at every size |
| 5–7 s | 03 Kinetic Type | Each word moves the way it means:<br>• **Timing.** steps in on 32nd notes<br>• **Spacing.** breathes its tracking<br>• **Weight.** falls as a hairline and slams to black<br>• **Feel.** springs in<br>Then the camera dives into its full stop | Kerned glyph positions measured in the DOM, plus Fraunces variable axes (wght, SOFT, WONK) |
| 7–9 s | 04 Depth | The full stop was a sphere: the camera dollies out and orbits while it bounces on a floor of 390 cubes that ripple, then it implodes to a point | Three.js: clearcoat material, a PMREM studio environment, an instanced floor, fog |
| 9–11 s | 05 Particles | 1,400 particles burst, wind into a three-arm spiral, then stream into the chart | Canvas 2D; every particle position is a pure function of time; light trails |
| 11–13 s | 06 Data | "This reel, in numbers." Each dot is one unit and lights as the number counts: 900 frames, 30 beats, 7 disciplines, 0 cuts. A paper iris then opens from the zero's dot | An honest isotype chart: the dots *are* the count |
| 13–15 s | 07 Identity | "Claude." The dot lands as the full stop, then the artboard shrinks into a motion-tool UI with the real timeline:<br>• the 7 chapters<br>• the dot's keys<br>• the actual soundtrack waveform<br>• a live playhead | The HUD flies into the tool: its timecode lands in the top bar and its ease curve in the inspector |

The HUD is the animator's monitor throughout:
- SMPTE timecode at 60 fps;
- beat squares on the bar grid;
- the chapter label;
- the **real ease curve** of whatever is moving, with a playhead on it.

## Sound

The score is written in code: `scripts/compose_audio.py` synthesizes a 120 BPM cue (drums, bass, chords, pads, arpeggio, bells) and places SFX on the picture's events. It reads the same cue sheet as the picture (`src/cues.json`), so sound and image cannot drift apart.

It is mastered to −14 LUFS with true peak below −1 dBTP, and the master is checked again after AAC encoding.

The SFX are synthesized, plus a few bundled Pixabay effects (Pixabay Content License).

## Rebuild

```bash
python3 -I scripts/compose_audio.py   # soundtrack + src/waveform.json
python3 -I scripts/build_cues.py      # src/cues.js (cue sheet + waveform for the picture)
npx hyperframes@0.8.140 check          # lint, runtime, layout, contrast
node scripts/audit_seek.mjs            # pixels identical under forward / backward / random seeks
npx hyperframes@0.8.140 render --fps 60 --workers 3 --quality delivery --output out/render/claude-showreel.mp4
python3 -I scripts/verify_render.py    # format, loudness, on-cue audio, no hard cuts, contact sheet
```

For rendering in a headless container:
- set `PRODUCER_HEADLESS_SHELL_PATH` to the Chromium headless shell;
- WebGL runs on SwiftShader.

## Rules this piece keeps

- **0 cuts.** Every hand-off is an object transformation: same position, size and colour, or a shape growing out of the dot.
- **Numbers on screen are true for this reel.** 15 s × 60 fps = 900 frames; 15 s at 120 BPM = 30 beats; 7 chapters; 0 cuts.
- **Determinism.**
  - Everything is a pure function of `t`.
  - Randomness is seeded, with no clocks.
  - The WebGL and canvas layers render from the seek event.
- **No third-party or Anthropic logos.** "Claude" is set in type only.

## Credits

| Asset | Licence |
| --- | --- |
| Fraunces (Undercase Type) | SIL OFL |
| JetBrains Mono | SIL OFL |
| three.js | MIT |
| GSAP | Standard "no charge" licence |
| Bundled SFX | Pixabay Content License |
