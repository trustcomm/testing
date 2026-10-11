---
workflow: general-video
flow: automation
storyboard: no
message: "One designer, every discipline, one count: range and taste in fifteen seconds."
destination: portfolio-site
aspect: 1920x1080
language: en
audience: creative directors, studio heads and hiring managers watching a motion designer's opening reel
length: 15s
angle: countdown-leader
---

## Intent

User's words: "Create a bold, dynamic 15-second motion graphics showreel that feels like the ultimate portfolio piece of an exceptionally talented motion designer. Showcase a wide range of advanced techniques: kinetic typography, smooth transitions, 2D and 3D animation, abstract geometry, fluid simulations, particles, distortion, creative masking, compositing, lighting, depth, and seamless camera movement. Keep the pacing fast, confident, and visually surprising, with every shot transitioning naturally into the next. Make it feel meticulously art-directed rather than like a random collection of effects. Push the creativity, polish, timing, and visual impact as far as possible. This should feel like the opening reel that gets a motion designer hired."

"Push it as far as possible" and no questions asked are read as a just-build-it signal: autonomous run (`flow: automation`, `storyboard: no`), ceiling treatment, one kept question at the final preview.

Chosen concept (internal pitch round, autonomous): **Leader.** The reel is a film-leader countdown, reimagined. Each numeral from 8 to 2 is one bar of music and one discipline, and the numeral's own shape motivates the technique. The 8 is a figure-of-eight flow in a real fluid simulation. The 7 is a chrome blade lit from behind, in true 3D. The 6 is a spiral of particles. The 5 is liquid glass refracting the frame. The 4 is constructed from flat geometry and masks. The 3 is ribbons of kinetic type. The 2 is a camera path the viewer flies down. The leader's ring, crosshair and sweep return in every medium: a vortex, a chrome hoop, a particle orbit, a lens rim, a pie wipe, text on a circle, tunnel rings. The 2-pop sounds, the count lands, and the reel's lockup arrives on the drop with every world seen once more through its letters.

Pitches considered: render passes building one hero shot; an infinite zoom through nested worlds; one sentence where every word performs; a light-mode paper-and-raking-light reel; the countdown leader (chosen). Most typical direction deliberately left behind: a dark neon montage of unrelated effects that opens on a giant "SHOWREEL" title and cuts every half second. Also avoided: the one-object-travels-through-everything structure the earlier Claude reel used.

## Customizations

- **Score and SFX written in code:** a 128 BPM cue, 8 bars = exactly 15 s, synthesized from scratch. The countdown builds one layer per numeral, the classic 1 kHz 2-pop marks the "2", and the lockup lands on the drop. Every visual event has a designed sound on its frame. Mastered to −14 LUFS with true peak below −1 dBTP after AAC. Supplied as host audio.
- **One WebGL compositor** (Three.js on SwiftShader in the container): fluid simulation, 3D, particles, refraction, bloom, chromatic aberration, grain and depth of field share one camera, one light language and one colour pipeline.
- 60 fps master.

## Notes

- No designer name was given, so the lockup is a finished generic title ("SHOWREEL 2026" with a discipline line). The name is a single constant to swap for a re-render.
- Palette is fixed for the whole reel: void (blue-black), bone, infrared, ice. Spectral fringes appear only where glass refracts.
- One display family plus one mono, both self-hosted (OFL). No third-party logos.
- Catalog searched for each named look (fluid, particles, liquid glass, grain, leader, light rays, chromatic aberration, kinetic type). The closest matches are self-contained blocks (WebGPU shaders, HTML-in-canvas glass, a particle-text component) that cannot share one camera and light pipeline, so the looks are built in the engine, following the particle-text component's pattern (targets sampled from a bitmap, table-driven, one painter).
- Destination inferred as a portfolio site / Vimeo hero → 1920×1080.
