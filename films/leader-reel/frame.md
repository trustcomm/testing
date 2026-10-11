---
name: Leader
canvas: "#06070B"
colors:
  void: "#06070B"      # base ground, blue-black, every frame
  bone: "#EDE6DA"      # type, highlights, leader marks
  infra: "#FF4A24"     # the hot accent: ink, rim light, sweep, embers
  ice: "#8FD8FF"       # the cool light: key light, glints, counter-flow
  ember: "#FFB37A"     # derived: hottest core of infra light (never a flat fill)
  deep: "#3A0B04"      # derived: infra in shadow (fluid tails, glow falloff)
  slate: "#1B2230"     # derived: void lifted for panels and rings
typography:
  display:
    family: "Archivo"
    file: "assets/fonts/archivo-latin-standard-normal.woff2"
    axes: "wght 100–900, wdth 62–125"
    use: "numerals and lockup at 900 / wdth 125; kinetic ribbons step through wdth 62–125"
  mono:
    family: "Geist Mono"
    file: "assets/fonts/geist-mono-latin-wght-normal.woff2"
    axes: "wght 100–900"
    use: "leader markings, labels, the discipline line; 500 weight, tracking +0.08em, all caps"
---

# Leader — design truth

## Concept angle

A film-leader countdown reimagined: each numeral from 8 to 2 is one bar of music and one discipline, and the numeral's shape is the reason for its technique. The leader's ring, crosshair and sweep return in every medium.

## Palette rules

- One ground for every frame: `void`. Never pure black, never a full-screen linear gradient (bands under H.264). Depth comes from radial glows, fog and light, not gradients.
- Two lights, warm and cool: `infra` is the hot accent (ink, rim, sweep, embers); `ice` is the cool light (key light, glints, counter-flow). They meet, they never mix to mud: no purple.
- `bone` is the only "white". Light that blows out goes to `ember` → `bone`, never to #FFFFFF.
- Spectral (RGB) fringes appear only where glass refracts or the camera is moving fast (chromatic aberration scaled by speed).

## Typography rules

- Archivo is the one expressive voice. Numerals at 900 / wdth 125, ~70% of frame height. Tracking −0.02em on display sizes.
- Geist Mono is the receding voice: leader markings only (labels, counts, the discipline line), never larger than 30 px, never more than one line at a time per corner.
- Weight contrast is extreme: 900 display against 500 mono.

## Composition

- Focal element: the numeral, centred on purpose. The leader is radially symmetric, so the centre is the concept, not a default.
- Edge anchors: thin leader frame lines, corner registration ticks, the discipline label top-left, the count top-right.
- Supporting detail: the leader ring and crosshair at 12–25% opacity, re-made in each world's material.
- Background: `void` with one localized glow per world, plus film grain over everything (seeded per frame).

## Motion language

- Grid: 128 BPM. Beat = 0.46875 s, bar = 1.875 s. Each numeral owns one bar; worlds land on downbeats; accents on beats 2–4; transitions start on beat 4.
- No cuts. Every hand-off is a material transformation: vortex core → backlight, mesh → particles, particles → glass droplet, glass → flat shards, stripes → lines of type, ribbon → sweep hand, tunnel → letter window.
- Camera never stops: a slow push in every world, a fast push-through on every transition, one true 3D orbit (7) and one flight (2).
- Eases: entrances `expo.out` / `back.out(1.6)` for snaps; camera `power2.inOut`; push-throughs `power3.in` into the cut, `expo.out` out of it. Nothing linear except scrolling type and sweeps.
- Motion blur and chromatic aberration scale with camera speed, so fast moments smear and settled moments are crisp.

## Sound sync

- Every visual event has a sound on its frame, from the shared cue sheet (`src/cues.js`).
- The count builds one layer per numeral; the 2 gets the classic 1 kHz 2-pop on silence; the lockup lands on the drop.

## Do / Don't

- Do keep every numeral legible within 0.5 s of its downbeat.
- Do let each world have one signature move and stop there.
- Don't add HUD timecodes or ease graphs (the earlier reel did that).
- Don't use neon purple/cyan gradients, gradient text or glitch cuts.
- Don't let any world fill the frame edge to edge with noise: keep a quiet margin so the numeral reads.
