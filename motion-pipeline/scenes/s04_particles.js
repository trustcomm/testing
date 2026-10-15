import { tokens as T } from "../tokens.js";
import { win, inOutQuint } from "../engine/ease.js";
import { grid, setType, fontFor } from "../engine/layout.js";
import { odometer, layoutGlyphs } from "../engine/type.js";
import { motes, burst, confetti } from "../engine/particles.js";

// 6 s of particles that serve one number: dust throughout, the number rolling up and landing at 2.0 s with a burst of
// sparks behind it, and confetti going off at 3.2 s. The number is the count of particles the scene draws.
const START = 19, DUR = 6, X = grid.l, Y = 640, SIZE = T.size.hero;
const LAND = 2.0, ROLL = 0.55, OUT = [DUR - 0.2, DUR];

// everything npm test scans for alpha jumps is defined here, so the test measures exactly what the scene draws
export const field = {
  motes: { n: 600, layers: 3, drift: 14 },
  burst: { t0: LAND, n: 220, speed: [220, 900], gravity: 900 },
  // fired from below the frame on the right, clear of the number: the pieces all die before the scene does (3.2 + 2.6 < 6)
  confetti: { t0: 3.2, n: 160, x: 1330, y: T.H + 40, angle: -Math.PI / 2 - 0.1, spread: 1.7, speed: [1300, 2700], life: [1.8, 2.6] },
  // the camera drifts and slowly pushes in; the dust follows it at a depth-scaled rate, the type stays where it is
  cam: (t) => ({ dx: t * 18, dy: t * 8, z: 0.03 * t }),
  // the dust fades in with the scene and out at its end, so a cut never pops a mote
  fade: (t) => win(t, 0, 0.6) * (1 - win(t, DUR - 0.4, DUR)),
};
const TOTAL = field.motes.n + field.burst.n + field.confetti.n;

export default {
  start: START, dur: DUR,
  // checked by npm test: hold >= tokens.hold, entrance 0.3-0.6 s, exit 0.15-0.3 s
  statements: [{ id: "particles", inStart: LAND - ROLL, inDone: LAND, outStart: OUT[0], outEnd: OUT[1] }],
  draw(ctx, t) {
    motes(ctx, t, { ...field.motes, cam: field.cam(t), alpha: field.fade(t) });

    // the number: it counts up and lands at 2.0 s; the burst goes off behind it at the same moment
    const { width } = layoutGlyphs(ctx, String(TOTAL), X, Y, fontFor("hero", SIZE), T.track.hero * SIZE);
    burst(ctx, t, { ...field.burst, x: X + width / 2, y: Y - SIZE * 0.35 });
    if (t >= LAND - ROLL && t <= OUT[1]) {
      ctx.save();
      setType(ctx, "label");
      ctx.fillStyle = T.color.dim;
      ctx.globalAlpha = win(t, LAND - ROLL, LAND - ROLL + 0.25) * (1 - inOutQuint(win(t, OUT[0], OUT[1])));
      ctx.fillText("04 / PARTICLES", X, Y - SIZE * 0.74 - 28);
      ctx.restore();
      odometer(ctx, t, { x: X, y: Y, t0: LAND - ROLL, role: "hero", size: SIZE, from: 0, to: TOTAL, dur: ROLL, out: OUT });
    }

    confetti(ctx, t, field.confetti);
  },
};
