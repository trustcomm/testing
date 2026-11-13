# TASTE — GoDevLevel launch reel (style memory; read first in every chat)
Status: built straight through at the owner's request ("go all out"); script approved by recording it. Plan and preview gates were not run separately.

## 1. Brief and concept
- Agency godevlevel.in going live; services: custom websites, motion graphic explainers, Blender 3D, AI work. Instagram reel, 9:16, 1080×1920, 60 fps, 48.5 s. Hinglish VO by the owner (assets/vo/vo_v1.mp3).
- Pipeline A (code-drawn, Canvas 2D). MotionSmith style: saas-launch, dark-keynote sub-look, recoloured to the site's brand.
- Idea: one accent dot travels the whole film: loading head → wordmark underline → code courier → level climber → LIVE dot.
- Twists used: accent as a character; room reveal (the film is shown inside its own editor); one flood.

## 2. Look (taken from godevlevel.in)
- Stage #000000 with the site's warm top glow and a drifting dot grid; grain 4.5%.
- Ink #ffffff · muted #b4bcc8 · dim #6b7280 · card #15171c / #1c1f26 · line #2a2e36 · ONE accent #fa461e (site: oklch(0.653 0.222 33.5)).
- Fonts: Inter Tight 600–700 (display, tracking −0.02em), Inter 500–600 (labels), JetBrains Mono 500 (code). Sentence case.
- Sizes (px at 1080 wide): hero 122–150, headline 84–104, body 40–66, labels 24–36. One accent word per line.
- Safe area: content y 240–1480, text x 64–950.

## 3. Motion
- Easing tokens from the style (src/kit.js P()): blur_in for words (0.38 s), pop_soft for UI pops, morph for shape changes, camera_s for moves, out_front for pull-backs, whip, flood.
- Scenes hand over on a matching frame: dot at (540,860) → phone 330,390,420×780 → 2×2 tiles. Tiles open to the stage rect 60,380,960×1060 and close back.
- No hard cuts. One flood (42.34 s). Springs only on the three stats and the "zinda" hop.

## 4. Sound
- SFX only, no music. 77 cues, about 1.6 per second, picture-locked (assets/sfx/cues.json). Sounds synthesised by the Baqur reel kit synth (scripts/render_sfx.py).
- Levels: UI −23..−17 dB, whooshes −16..−11, brand hit −9, climax (Go live) −4/−5. Master −14 LUFS, peak ≤ −1 dBTP.
- Quiet 41.6–42.3 s before the climax.

## 5. Technical
- Render: `MVD_TOOLKIT=/opt/node-tools node src/render.js --fps 60 --scale 1 --out renders/final --name "<name>" --audio renders/audio/mix.wav`
- Preview sheet: `MVD_TOOLKIT=/opt/node-tools node <skill>/scripts/preview.mjs <from> <to> --name X --version N`
- Sound: `node <skill>/framewright/fw-sfx.mjs assets/sfx/cues.json`
- Timing source: plan/beats.json (assets/beats.json is a link to it).

## 6. Do / don't
- Do keep one accent; do keep claims to the site's own (<1s, 100% hand-coded, mobile first).
- Don't add client counts, prices or results that are not on the site. Don't add music.
