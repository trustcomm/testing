---
workflow: general-video
flow: automation
storyboard: no
message: "Claude is a motion designer with real craft: timing, spacing, weight and feel, across every discipline, in one unbroken take."
destination: portfolio-site
aspect: 1920x1080
language: en
audience: creative directors, hiring managers and fellow motion designers
length: 15s
angle: one-take-showreel
---

## Intent

User's words: "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out."

A résumé showreel for Claude as a motion designer. Fifteen seconds that prove range and taste: classic animation principles, liquid morphs, kinetic type, real-time 3D, particles and data, then the name. "Go all out" is read as a just-build-it signal: autonomous run, ceiling treatment, no checkpoints.

Chosen concept (internal pitch round, autonomous): **One Take.** One terracotta dot carries the whole reel through seven motion disciplines without a single cut. An animator's HUD frames it: a timecode, the chapter title, and the actual ease curve that drives each chapter, with a live playhead. The reel ends by pulling back to reveal it was one composition, playing on the timeline of a motion-design tool, and the playhead lands on the last frame.

## Customizations

- **Soundtrack written in code:** a 120 BPM, 7½-bar cue synthesized from scratch (`scripts/compose_audio.py`), so every beat and hit lands on an exact frame. No credits spent.
- **SFX:** synthesized hits plus the bundled Pixabay library from `media-use` (commercial use, no attribution needed).
- **Real-time 3D:** Three.js (WebGL2 via SwiftShader) for the depth chapter, seeked from the same timeline.
- 60 fps master, mastered to −14 LUFS with true peak below −1 dBTP after AAC.

## Notes

- Stats in the reel are about the reel itself and must be true: 900 frames, 30 beats, 7 disciplines, 0 cuts.
- No third-party logos and no Anthropic logo. "Claude" appears as the designer's name in type only.
- Typography: Fraunces (OFL, from npm/Fontsource) for display and JetBrains Mono for the HUD. Both are embedded locally.
- Most typical direction left behind: a dark, neon, glitch-cut montage that opens on a giant "SHOWREEL" title.
