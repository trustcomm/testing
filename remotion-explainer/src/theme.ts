export const W = 1080, H = 1920, FPS = 30;
export const C = {
  bg: "#0B0B10", accent: "#7C5CFF", warn: "#FF4D5E", ok: "#3DDC97", text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)", faint: "rgba(255,255,255,0.08)", card: "#15151E", cardHi: "#1E1E2A",
} as const;
export const FONT = 'Inter, "Poppins", system-ui, sans-serif';
// Instagram's UI covers the top 220 px and the bottom 420 px: nothing important goes there.
export const SAFE = { top: 220, bottom: 420 };
// One vertical layout for every scene, so a headline and a phone never fight the captions.
export const LAYOUT = {
  pillY: 262,            // pill top
  headY: 342,            // headline top
  stageTop: 590,         // the hero object starts here ...
  stageBottom: 1240,     // ... and ends here
  stageMid: 915,
  captionTop: 1284,      // captions live in 1284..1486 (the bottom safe zone starts at 1500)
  captionBottom: 1486,
};
export const SPRING_DAMPING = 12;   // springy pop-ins
export const STAGGER = 6;           // frames between staggered reveals
export const EXIT_FRAMES = 2;       // ease-out on every exit
export const WIPE_FRAMES = 8;       // a masked wipe between scenes: 4 frames before the first word, 4 after
export const WIPE_LEAD = 4;
export const PUSH = 0.04;           // the camera pushes in by 4 % over every scene
