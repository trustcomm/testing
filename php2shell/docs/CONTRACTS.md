# PHP2Shell: how the pieces fit (read docs/BRIEF.md first: it is the creative brief and the source of truth)

A 9:16 Hinglish news-explainer reel (1080x1920, 30 fps, Remotion + TypeScript). 13 scenes, S1..S13. Picture and sound are both driven by
`src/timeline.ts`, which gathers one cue module per scene (`src/cues/sNN.ts`). Every time in the film is a **frame derived from a word** of the
voiceover (`src/timings.json`, via `src/anchors.ts`). Nothing is timed in seconds.

## Who owns what (do not edit files you do not own)
- Each scene owner writes ONLY: `src/scenes/SNN.tsx` (the picture) and `src/cues/sNN.ts` (cues, sound events, QA anchors, camera pushes/shakes), plus new files
  `src/components/<yourprefix>-*.tsx` if you need helpers shared by your own scenes. Everything else (theme, anchors, timeline, motion, components/*.tsx that
  exist, Php2Shell.tsx, scripts/*) belongs to the lead: if you need a change there, say so in your final report instead of editing.
- Audio owner: `scripts/make_sfx.py`, `scripts/make_music.py`, `scripts/build_mix.py`, `scripts/qa_audio.py`, `public/sfx/*`, `docs/SFX*.md`.
- S1 (`src/scenes/S01.tsx`, `src/cues/s01.ts`, `src/components/globe.tsx`) is built and is the reference for style and structure. Read it first.

## Time
- Composition frame = round((voice time + 0.4 s) * 30). The film starts with 0.4 s of silence; scene 1 starts at frame 0. `src/anchors.ts`:
  `w("S3", "das")` finds a word by its bare spelling inside a scene (nth = third argument); `wp(phrase, "bare")` inside one of the 44 spoken phrases (scripts/script.py);
  `fw(word)` = the frame the word starts on, `fwEnd(word)`. Bare spelling = lower case, letters/digits/dot ("9.2", "php", "udd"). Look words up in `src/timings.json`.
- **The hit lands ON the word's first frame; visual anticipation starts 4-8 frames before it.** Hold 8-12 frames of stillness after every big hit.
- Scenes read the ABSOLUTE frame: `const f = useFrame()` (src/clock.tsx). Cues are absolute frames. Never use `Math.random`, `Date`, or the network: seeded `rand(i, k)` only.
- A scene's layer starts 6 frames before its first word (`SCENES[i].from`) and fades out 9 frames after the NEXT scene's layer starts (`to`). Look at `SCENES` in
  `src/timeline.ts` (`start`, `end`, `from`, `to`): your scene should look complete from `from` to `to`.

## Look (docs/BRIEF.md section 2 and 3 are law)
- Colours only from `C` in `src/theme.ts`. Red `C.alarm` = danger. Green `C.trust` appears ONLY from S10 onward (S9's small shield + "FIX: 21 OCT" chip is the one
  specified first hint). After S10 the only red anywhere is S12's red X. No logos, ever (company names are plain text).
- Line art: single-weight 3 px strokes (`Stroke`, `STROKE_W`), rounded caps, written on with stroke-dashoffset (0.5-0.8 s = 15-24 frames, ease-in-out; `Stroke at={frame} frames={n}`).
  Precise, clean (Apple-like), slightly hand-feel in the drawing but not sketchy. Particles: 2-3 px white dots (`Dust`, `textPoints`, `pointsOnPath`).
- Entrances: write-on strokes; chips/pills spring in (`Pop`, stiffness 160 / damping 18); text rises 20 px + 8 px blur -> 0 (`Rise`). Exits: dissolve to dust, or blur + fade 0.3 s (9 frames).
  Key words pop 1.0 -> 1.08 -> 1.0 when spoken (`KWord`); danger words get a red underline wipe, trust words a green one.
- Type: `headline(size)` Inter Display 700 -0.03em; `body(size)` Inter 500; `mono(size)` JetBrains Mono 500 for CVEs, versions, code, labels; `serif(size)` Instrument Serif Italic for accent words.
  `Pill` = mono 26 px caps, 1 px stroke, 999 px radius (danger = red stroke + red text, trust = green). `Glass` = rgba(255,255,255,0.06), blur 24, 1 px stroke, 28 px radius.
- Layout: the hero stage is x 60..1020, y 270..1330 (`STAGE` in theme.ts). Nothing important in the top 240 px or the bottom 440 px (y > 1480). Captions (Inter 700 44 px) sit at y ~1385..1435
  (S11/S12: they lift to ~1320..1370, `CAPTION_LIFT`): keep content ABOVE them and never cover numbers, CVEs, the versions panel with them. Check with `node scripts/layout.mjs <frames>`.
- **Layers are transparent**: never paint a full-frame opaque rectangle. Scenes cross-dissolve with an additive blend, so a shape drawn identically at the end of one scene and the start of
  the next (a match cut) neither dips nor doubles. Draw the previous scene's end state exactly as it was when you start (see the contracts below).
- Camera: the lead's global camera does a slow 1.00 -> 1.04 push per scene and a micro-shake; you declare deliberate push-ins on emotional beats (`pushes` in your cues) and the 2-frame
  micro-shakes (`shakes`, ONLY the 3 alarm hits: S1 "udd gayi", S8 "control", S9 "9.2"). Local camera moves the brief asks for (S2 dolly through the globe, S5 pull wide, S6 follow a tiffin) are
  transforms you apply to your own content.
- Seeded, deterministic everywhere: a render must be identical every time.

## Components you can use (all in src/components, src/motion.tsx, src/theme.ts)
`Canvas` (full-frame SVG), `Stroke` (write-on path; `p` progress override, `dotted`, `glow`, `from`), shape helpers `rrect circle line poly arc quad check cross`, `pointsOnPath pathLength pointAt`;
`Pill`, `Glass`, `KWord`, `TypeIn`, `headline mono body serif`; `Dust`, `textPoints`; `Globe` (S1/S2), `ServerRack` + `HALL` (S7/S8); motion: `Rise Pop At useSpring springAt prog smooth lerp clamp01
easeOutCubic easeInOutCubic rand`. Add your own helpers in `src/components/<prefix>-*.tsx`.

## Sound events (src/sfx.ts is the vocabulary; scripts/make_sfx.py synthesises exactly those names)
Every visual event gets a sound, on the frame of its visual hit. In your `cues` file list `sfx: SfxEvent[]` = `{ id, frame, sfx: "name", note, gainDb?, pan?, pitch?, seed? }`. `frame` is where the HIT lands
(`hit` in src/sfx.ts tells where in the sound that is: some sounds hit at their start, risers at their end). `pitch` = semitones, `pan` -1..+1 (place things where they are on screen),
`gainDb` is relative (0 = nominal; the mixer sets the master level: SFX peaks 10-14 dB under the voice, so use gainDb to balance sounds against each other, roughly -12..0, quiet for tiny sounds).
Use ONLY names from `SFX_SPEC` (if you need a sound that is not there, use the closest one and say so in your report). Place every sound the brief lists for your scenes, plus subtle ones for visual events
the brief forgot. Silence is a design element: do not put sound on everything, and never mask a word.

## Cue module (what you export from src/cues/sNN.ts; see cues/s01.ts)
`cue` (named frames), `sfx`, `anchors` (a QA still per key word: label, frame = word start + ~4, what the picture should show at that moment), `hero` (the frame whose still represents the scene: everything formed),
`pushes`, `shakes`. Derive EVERY frame from words: `fw(w("S4", "wiz"))` and offsets in frames (anticipation: -4..-8).

## Boundary contracts (what the last frame of a scene and the first frame of the next must share)
- S1 -> S2 (S1's globe): `<Globe frame={f} cx=540 cy=800 R=330 lit=all 1 alarm=1 alarmGlow=exp(-(f - hit)/14)>` with the red servers, the red radial glow, and `globeRot(frame)`. S2 draws exactly that at its start, then dollies through it.
- S2 -> S3 -> S4 (one browser window, then the PHP panel under it, the stack diagram, the bugs, the magnifier): same owner, so it is internal. S4 ends by dissolving its elements to dust (`Dust`, drifting up and out).
- S4 -> S5: S5 starts from dust: the dots (the same kind: 2-3 px white) drift in and write/assemble the ground line and the dabbawala. S5 -> S6 -> S7 (the analogy world, the leaked key, the match cut to servers): same owner.
- S7 -> S8: the **server hall**. S7 ends with five racks drawn with `ServerRack` at `HALL.xs` (x = 200, 370, 540, 710, 880), `top = HALL.top` (470), `w = HALL.w` (130), `h = HALL.h` (600), white. S8 starts with the same five racks
  in the same places (white, still), the hacker enters from an edge, the login box ("USERNAME / PASSWORD") stands in front of the racks. S8 -> S9 -> S10: same owner (red wave, the gauge, the turn).
- S10 -> S11 -> S12 -> S13: S10 ends with the green headline and three fact cards; S11 starts after they leave (dissolve). S11 -> S12 -> S13 same owner.

## How to work and check
1. `npm ci` in php2shell/ (the worktree has no node_modules). `npx tsc --noEmit` must be clean for your files.
2. `npx tsx scripts/export_timeline.ts` regenerates `public/timeline.json` from the cues (scenes, sound events, anchors).
3. Stills: `node scripts/stills.mjs build/mystills full <frame> <frame> ...` (about 1 s per still after a few seconds of bundling), then
   `sh scripts/sheet.sh build/mystills build/mysheet.png 4 480` and LOOK at the sheet (Read the PNG). `scripts/stills.mjs` also takes `nocap` (no captions) and `bg`.
   Review every anchor still: does the picture show what the word says at that moment? Is anything clipped, overlapping, too small to read on a phone, or empty? Fix and re-render.
4. `node scripts/layout.mjs <frames>` checks safe zones / sides / captions on pixels for the frames you give it (use your anchors and hero frames).
5. Check the continuity frames: the first frames of your scene (`from` .. `start`) against the last frames of the previous scene (render the previous scene's last frames too).
6. Motion sanity: render a handful of consecutive frames around each big hit and look at them (write-on, spring, dissolve): no pops, no jumps, nothing starts or ends off the beat.
7. Final report: for each scene the cue table (name, frame, word), the sfx list (id, frame, name), the anchors, what is deliberately different from the brief, anything the lead must change in a shared file, and known issues.
