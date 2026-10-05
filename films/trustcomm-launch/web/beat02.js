// Beat 2 — "They pay, they smile… and they leave." The quiet ones slide out of frame one by one on the beat;
// the door swings. Carry in: the red spike (it sinks back). Carry out: the empty doorway (a rectangle).
import { lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, blob, CARRY, DOOR, q, shopRoom, spikes, breathe } from "./kit.js";

const EXITS = [1, 2, 3].map((k) => q(k * B)); // one customer leaves on each beat
const START = [1000, 1120, 1240]; // where Beat 1 left them (x at its end)
const gx = (i, lt) => lerp(START[i], 2150, snap(prog(lt, EXITS[i] - 0.3, EXITS[i] + 0.25)));
const swing = (lt) => Math.max(...EXITS.map((t) => Math.max(0, 1 - Math.abs(lt - t) / 0.35)));

export default {
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.015); // no dead holds: a slow drift that is zero at both boundaries
    shopRoom(ctx, { doorSwing: swing(lt) });
    const a = 1 - snap(prog(lt, 0, 0.45));
    if (a > 0.001) spikes(ctx, 1132, 415, a);
    blob(ctx, 1080, 690, 58, "red", { mood: a > 0.05 ? -1 : 1, alpha: 1 - prog(lt, 0.3, 0.9) });
    for (let i = 0; i < 3; i++) blob(ctx, gx(i, lt), 700, 46, "green");
    // the room fades away, leaving the doorway
    const f = prog(lt, 2.2, 2.85);
    if (f > 0) {
      ctx.fillStyle = `rgba(250,249,245,${f})`;
      ctx.fillRect(-2000, -2000, 6000, 6000);
      ctx.strokeStyle = col("ink");
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, 22);
      ctx.stroke();
    }
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b01_02;
    if (lt >= e.dur - 1e-9) return CARRY.b02_03;
    return { kind: "room" };
  },
  track(lt) {
    return [0, 1, 2].map((i) => [gx(i, lt), 700]);
  },
  events() {
    return EXITS.map((t, i) => ({ t, sfx: "SFX06", gain: -12, what: `door chime ${i + 1}/3 on the beat`, rate: 1 + 0.03 * i }));
  },
};
