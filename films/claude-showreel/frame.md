---
name: Claude — Motion Reel
canvas: { width: 1920, height: 1080, fps: 60, duration: 15 }
colors:
  paper: "#F2EDE3"        # warm cream canvas (light world: chapters 0–3 and the close)
  paper-2: "#E7DFD1"      # panels on paper (tool chrome at the close)
  ink: "#1B1714"          # warm near-black (dark world: chapters 4–6)
  ink-2: "#27211C"        # panels on ink
  clay: "#D2643A"         # THE accent: the dot, the protagonist. Display/shape use on paper (3.2:1), any text on ink (4.77:1)
  clay-light: "#EFA27F"   # specular / highlight of the dot, particles on ink (8.6:1 on ink)
  clay-deep: "#9C4122"    # shadow side of the dot; small accent text on paper (5.64:1)
  muted-ink: "#5E554C"    # secondary text on paper (6.25:1)
  muted-paper: "#B7AC9F"  # secondary text on ink (7.98:1)
typography:
  display: { family: "Fraunces", source: "assets/fonts/fraunces-latin-full-normal.woff2 (OFL, variable: opsz 9–144, wght 100–900, SOFT 0–100, WONK 0–1)", tracking: "-0.035em" }
  mono: { family: "JetBrains Mono", source: "assets/fonts/jetbrains-mono-latin-400/700 (OFL)", tracking: "0.06em", case: "uppercase for chrome" }
  sizes: { hero-word: "280–340px", name: "260px", stat-number: "150px", chapter-title: "40px", hud: "18–20px", ease-label: "18px" }
spacing: { safe: 96, hud-inset: 64, grid: 64 }
corners: { dot: "50%", panels: "14px", chips: "999px" }
motion:
  tempo: "120 BPM, beat = 0.5 s = 30 frames; 2-beat pickup, then 7 bars from t = 1.0 s"
  rule: "every event on the beat grid; eases vary inside each chapter (≥3 per chapter); the dot is never still"
---

# Claude — Motion Reel (frame spec)

## Overview
A résumé reel in one unbroken take. A single clay-coloured dot is the protagonist. It falls, bounces, melts, writes, turns 3D, explodes into particles, becomes a chart, and finally rests as the full stop in "Claude." The canvas is warm cream paper. The middle act inverts into warm ink, then the paper returns. Light is the brand: the dot carries the only saturated colour on screen.

## The frame
- **HUD (screen space, inverts with the world):**
  - top-left: designer name and reel title;
  - top-right: SMPTE timecode at 60 fps plus four beat ticks;
  - bottom-left: chapter index and title;
  - bottom-right: the chapter's real ease curve, with a playhead riding it.

  The HUD is the reel's "animator's monitor". At the close it turns out to be part of the tool UI.
- **Registration marks** in the four corners and a faint 64 px baseline grid: an artboard, not a web page.
- **Grain** stepped on threes (a new seeded offset every 3rd frame, 20 Hz, 2 px grain), never decorative noise bursts.

## Composition rules
- One focal element per beat, always the dot or what it became; the HUD is the second focal layer.
- Type sits on the lower third or left-anchored. Nothing floats dead-centre except the dot itself.
- Clay is rationed: the dot, its trails, and one accent per chapter. Never clay text on paper below 48 px.

## Do
- Land contacts, hits, swaps and stat counts exactly on beats (frame-exact at 30 frames per beat).
- Use squash, stretch, arcs, overlap and anticipation; show the spacing (onion skins) where the chapter is about it.
- Make every transition an object transformation; the reel has 0 cuts.

## Don't
- No hard cuts, no glitch, no neon, no gradient text, no full-screen linear gradients.
- No third-party logos and no Anthropic logo. "Claude" is set in type only.
- No invented stats. Numbers on screen describe this reel (900 frames, 30 beats, 7 disciplines, 0 cuts).
