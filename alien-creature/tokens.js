// Design tokens. Every colour, size, timing and post value used anywhere comes from here.
export const T = Object.freeze({
  W: 1080, H: 1920, FPS: 30, DURATION: 12, // 9:16, loops seamlessly

  color: Object.freeze({
    bg: '#030405',      // ground
    bg2: '#0a1418',     // top-left lift of the ground gradient (derived from bg)
    ink: '#dce6ea',     // dots
    accent: '#ff3d2e',  // the one accent: frond tips, tentacle tips, irises
    dim: '#6b7a83',     // secondary type
    glow: '#2bc4d8',    // support hue: nerve pulses, brain
  }),

  font: Object.freeze({ display: 'Plex Mono', body: 'Plex Mono', mono: 'Plex Mono' }),
  size: Object.freeze({ hero: 56, h1: 48, h2: 40, body: 34, label: 30 }),
  track: Object.freeze({ title: 0.62, label: 0.08 }),

  // 9:16 safe area: 10% side margins, critical text between 15% and 70% of height
  safe: Object.freeze({ x: 0.10, top: 0.15, bottom: 0.70 }),

  motion: Object.freeze({
    entrance: 0.5, exit: 0.25, glyphStagger: 0.03, wordStagger: 0.08,
    transition: 0.2, push: 1.03,
  }),
  hold: 1.2,

  post: Object.freeze({
    bloomThresh: 0.06, bloomStrength: 0.75, exposure: 1.15,
    ca: 1.2, vignette: 0.42, grain: 0.045,
  }),

  // camera and depth of field (world units)
  cam: Object.freeze({ fov: 30, dist: 10.6, target: [0, -0.8, 0], focus: 10.6, aperture: 0.05 }),
});
