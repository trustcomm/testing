# baqur-reel-kit

The reusable Remotion template for @baqur.ai reels. The look and motion rules are locked. Each new reel only needs a script, a list of cues and its scenes.

**Reel #1 included:** `PasteLeak`, "Ek paste, 3,182 log" (keyword SAFE).

---

## One-time setup (Mac)

```bash
cd baqur-reel-kit
npm install
npm run dev          # opens Remotion Studio in the browser
```

Fonts (Inter, Instrument Serif Italic, JetBrains Mono) come bundled through npm, so the kit works offline.

## Finishing the PasteLeak reel (about 15 minutes)

1. **Add the voiceover.** Copy your ElevenLabs file to `public/reels/paste-leak/vo.mp3`.
2. **Get word timings.** Run `bash scripts/transcribe.sh paste-leak`. It installs Whisper the first time.
   - You can also use ElevenLabs Speech-to-Text with word timestamps. Save its JSON as `src/reels/paste-leak/timings.json`. Either format works.
3. **Rebuild the timeline.** Run `npm run timeline -- paste-leak`. Every animation and sound now locks to your real voice. The script tells you how many words it matched; aim for 90% or more.
4. **Build the sounds.** Run `npm run sfx -- paste-leak`. This makes `sfx_stem.wav` (SFX plus a music bed that ducks under your voice) and prints the loudness.
5. **Run QA.** Run `npm run qa -- paste-leak`. It checks the retention rules (payoff early, a visual change every 3 seconds or less, no stacked hits) and the fact rules (required on-screen facts present, banned claims absent).
6. **Preview** with `npm run dev`. **Render** with `npm run render`, which writes `out/paste-leak.mp4` at 1080×1920, 60fps.

The amber "DESIGN MODE" tag in the corner means the timings are still estimated. It disappears once `timings.json` exists.

## Making the next reel (1–2 hours instead of a day)

```bash
cp -r src/reels/paste-leak src/reels/my-reel
```

1. **`script.json`**: paste the VO lines as segments S1, S2, and so on.
2. **`cues.json`**: list the moments that matter. Each cue is a segment, an optional word in it and the sounds that land on it, for example `{"id":"s3_ai","seg":"S3","word":"public","sfx":["hit","glitch"],"pan":0.2}`.
3. **`facts.json`**: list what must appear on screen and what must never be claimed.
4. **`MyReel.tsx`**: rename the component, move the stations around the WORLD and swap the scene contents. Time everything with `tl.f('cue_id')`. Never type frame numbers by hand.
5. Add a `<Composition>` for it in `src/Root.tsx`.
6. Run `npm run timeline -- my-reel`, then `npm run sfx -- my-reel`, then `npm run qa -- my-reel`.

Asking Claude Code to do it works well: *"Copy src/reels/paste-leak to src/reels/<name>. Here is my VO script: … Write script.json, cues.json, facts.json, and adapt the scenes. Follow README and keep core/ untouched."*

## What's inside

| File | What it does |
|---|---|
| `src/core/tokens.ts` | The series look: colours (red→green story arc, amber numerals), fonts, type scale and IG safe zones. |
| `src/core/motion.ts` | The only easings (glide, settle, launch, swing), spring presets, 8-frame minimum entrances and the `enter`/`exit` helpers. |
| `src/core/camera.tsx` | The virtual camera over a big WORLD canvas: PUSH, FLY-TO (arcs out mid-flight), PUNCH, PULL, DOLLY-THROUGH, CUT, plus always-on DRIFT. Zoom moves in log space, stations rack-focus automatically and fast moves get speed blur. |
| `src/core/timeline.ts` | `tl.f('cue')` gives the frame of any cue. Typos throw an error straight away. |
| `src/scenes/primitives.tsx` | Glass panels, line-art icons that draw on, the counter, chips, ✓/✕ marks, numbered list rows, headline with a serif accent, backdrop with parallax grid, hit flash, karaoke captions, source line and progress rail. |
| `scripts/build-timeline.mjs` | Aligns the script to the transcript (fuzzy, so it tolerates Hinglish spellings) and resolves cues into `timeline.json` and `sfx-events.json`. |
| `scripts/make_sfx.py` | Builds 16 synthesized sounds with three layers each (transient, body, tail). Whooshes and risers start early so their peak lands on the cue. Includes constant-power stereo pan, an original music bed ducked under the VO, and a loudness readout. |
| `scripts/qa.mjs` | Retention and fact checks before you render. |
| `scripts/contact-sheet.sh` | Renders one low-res frame per few cues into `out/contact-sheet.png` for a quick visual check. |

### Using your own sounds
Put a WAV at `public/sfx/<type>.wav` (for example `whoosh.wav` or `hit.wav` from ElevenLabs Sound Effects). It replaces the synthesized one automatically. The loudest point of the file is treated as its impact, so it still lands on the cue.

### Mix levels
- Voice: aim for about −14 LUFS on the final MP4. `make_sfx.py` prints the loudness of the preview mix.
- Change levels with `--sfx-gain -9` and `--music-gain -26` (dB), or turn the music off with `--no-music`.
- If the final video is too quiet or loud: `ffmpeg -i out/paste-leak.mp4 -af loudnorm=I=-14:TP=-1.5 -c:v copy out/final.mp4`.

### Highest quality option
`World` already applies speed blur for free. For true multi-sample motion blur on the final render, wrap `<World>` in `<CameraMotionBlur samples={6} shutterAngle={180}>` from `@remotion/motion-blur`. Rendering takes about 6× longer.

### Licence
Remotion is free for individuals and companies of up to 3 people. Above that, it needs a company licence.
