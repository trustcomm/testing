# Flow State

A 30-second vertical motion piece (1080×1920, 60 fps) for Reels and TikTok, ending on **Follow for more — Baqur.ai** with the GoDevLevel credit.

One drop of light falls into still night water, and every scene grows out of the one before it, with no cuts. The ripples stand up into rings, which break into particles, then calm lines, a ribbon and a bud. The bud blooms into a flower whose petal tips become stars. The stars connect into a constellation, which folds into a globe. The globe collapses into a star, and the star becomes the line under the name.

Both picture and sound are 100% code:
- **Picture:** Canvas 2D in headless Chromium, piped into ffmpeg.
- **Sound:** synthesized in numpy/scipy, using no samples.

Output: `out/flow-state.mp4`
- H.264 High, yuv420p, BT.709, 1824 frames;
- AAC-LC 320 kb/s, 48 kHz;
- −14 LUFS, true peak ≤ −1 dBTP.

## The take, scene by scene

Each scene is one bar (3.2 s at 75 BPM). The end card is 1.5 bars.

| Time | Line on screen | What happens | Hand-off to the next scene |
| --- | --- | --- | --- |
| 0.0–3.2 s | Every *idea* / starts as a *drop.* | Light gathers into a hanging drop, which falls to the water: impact flash, crown splash, rebound jet | Its ripples spread on the water |
| 3.2–6.4 s | Let it *ripple.* | Seven ripples (one per 8th note) stand up out of the water into concentric rings | The rings break into dots |
| 6.4–9.6 s | Quiet the *noise.* | The dots scatter into a buzzing cloud, then a breath calms them into nine level lines | The lines start to wave |
| 9.6–12.8 s | Find your *flow.* | The lines braid into a silk ribbon; two glints sweep along it | The ribbon coils into a phyllotaxis bud |
| 12.8–16.0 s | Let it *bloom.* | Sixteen glass petals open on springs, drawn by the same particles | The petal tips gather into sixteen stars |
| 16.0–19.2 s | Connect the *dots.* | The stars drift into a constellation and fourteen edges connect it, one per 16th note | The nodes slide onto a sphere |
| 19.2–22.4 s | Build in *silence.* | A 120-point globe builds bottom-up in nine layers, with two orbits | It implodes into its core |
| 22.4–25.6 s | Then let it *shine.* | The core ignites into a star: rays, shockwave, and a glitter pillar on the water | The star thins into a vertical line |
| 25.6–30.4 s | Follow for more / *Baqur.ai* / DEV BY GoDevLevel / godevlevel.in | The line turns into the divider and the name rises out of it. A drop forms on the name's full stop and falls back into the water | The splash at 29.4 s echoes the opening drop |

## Look

| Element | Choice |
| --- | --- |
| Background | Abyss teal-black sky and water |
| Accents | Aqua glass `#8FF4E8`, lilac mist `#B8A6FF` (the bloom), pearl gold `#F6E7C8` (the shine and end card) |
| Text | Moon white `#EEF6F4`; the GoDevLevel orange stays in its own logo only |
| Type | Outfit 200 (thin sans), with one Cormorant Garamond *italic* keyword per line, each animated in the way the word means (drop, ripple, noise, flow, bloom…). Every line is fully legible (every glyph at ≥ 90 % opacity) for at least 1.17 s, measured by `render.mjs textcheck` (range 1.17–1.63 s) |
| Water | The water mirrors everything above the horizon in wavering strips (a nod to the reference's glossy desk). Near objects, such as the drops, draw their own reflections about their contact point |
| Light | Bloom from three blurred low-resolution mip levels; sub-frame motion blur on fast moves; dithering grain stepped every 2 frames; a vignette |

## Sound

`scripts/audio.py` renders one sound per visual event, placed on the exact sample: frame *f* → sample *f* × 800. The event list comes from `src/timeline.js`, which the picture reads too, so the two cannot drift.

| Part | Design |
| --- | --- |
| Key | D-flat major. Every effect is tuned to the D♭ major pentatonic (D♭ E♭ F A♭ B♭) |
| Pad | Detuned additive saws with a moving low-pass. Chords change on the big transitions: D♭add9 → D♭maj9 → B♭m9 → G♭maj9 → A♭sus2 → B♭m7 → G♭maj7♯11 → D♭maj9 → G♭add9/D♭ → D♭maj9 |
| Bass | Soft sine bass with 2nd and 3rd harmonics (for phone speakers), and a heartbeat pulse through the middle scenes |
| Water drops | A rising-pitch sine bubble |
| Kalimba | Fundamental plus an inharmonic 5.93× partial |
| Glass bells | Partials at 1, 2.76, 5.40 and 8.93 |
| Harp and plucked strings | Modal synthesis |
| Whooshes | Band-pass noise sweeping in frequency and pan |
| Sub booms | Sine sweeping 57 → 37 Hz |
| Reverse swells | A bell cluster through the hall, reversed so it peaks on its event |
| Sparkles | A granular cloud of glass pings |
| Breath | A descending noise band |
| Space | One synthetic stereo hall (RT60 ≈ 3.3 s, 25 ms pre-delay, early reflections) |
| Clean edges | Every sound has fades, so there are no clicks (a click scan is part of the report) |
| Master | 4× oversampled look-ahead limiter, normalized to −14 LUFS with true peak −1.5 dBTP. Checked again after AAC encoding |

## Rebuild

```bash
node scripts/export_events.mjs                      # src/timeline.js → build/events.json
python3 -I scripts/audio.py                         # → build/score.wav, build/spectrogram.png, build/audio_report.json
node scripts/render.mjs video --workers 3 --crf 16  # → build/picture.mp4 (about 11 min on 4 cores)
scripts/mux.sh                                      # → out/flow-state.mp4
python3 -I scripts/verify.py                        # format, colour tags, loudness after AAC, A/V sync, cuts, stillness, contact sheet
```

To check stills, run `node scripts/render.mjs frames 144,600,1344 --out build/qa`, then `python3 -I scripts/sheet.py build/qa build/qa.jpg`. `node scripts/render.mjs textcheck` reports how long each line is fully legible.

Rendering needs:
- `puppeteer-core`: local, `$PUPPETEER_CORE`, or the npx cache;
- a Chromium headless shell: `$CHROME_PATH`, or `/opt/pw-browsers`.

Every frame is a pure function of its frame number:
- randomness is seeded;
- nothing reads a clock;
- fonts load through the FontFace API before the first frame.

`scripts/logo.py` makes the on-dark GoDevLevel wordmark from the supplied logo. The slate letters become moon white, and the orange is kept exactly.

## Verification (final file)

`python3 -I scripts/verify.py` writes `out/verify.json` and `out/contact-sheet.jpg`.

| Check | Result |
| --- | --- |
| Format | 1824 frames, 1080×1920, 60 fps, 30.4 s, H.264 High yuv420p, 35.35 MB |
| Colour | BT.709 primaries, transfer and matrix; limited (TV) range |
| Audio | AAC-LC, 48 kHz stereo, 314 kb/s |
| Fast start | `moov` box before `mdat` |
| Loudness (after AAC) | -14.0 LUFS integrated, -1.5 dBTP true peak, LRA 4.9 LU |
| Score master | -14.0 LUFS, -1.5 dBTP; the limiter touches only two transients (at most 2.9 dB of gain reduction, each under 30 ms); click scan 0 |
| Mix | sound design -15.5 LUFS, music bed -18.8 LUFS, water ambience -37.1 LUFS |
| Picture/sound sync | lag 0.0 ms against the master score; every event sound starts on frame × 800 samples (swells end there) |
| Event onsets | impact, shine and splash transients 2–20 ms after their frame (synthesized attacks and the strummed chime) |
| Cuts | none: no isolated frame-difference spikes (flashes ignite over two frames) |
| Stillness | never still for more than 3 frames (the first frames of the fade from black) |
| Text | every line fully legible for 1.17–1.63 s |

## Credits

| Asset | Licence |
| --- | --- |
| Outfit (On Brand Investments) | SIL OFL 1.1, `assets/fonts/LICENSE-Outfit-OFL.txt` |
| Cormorant Garamond (Christian Thalmann) | SIL OFL 1.1, `assets/fonts/LICENSE-CormorantGaramond-OFL.txt` |
| GoDevLevel logo | Supplied by the client for the end card |
