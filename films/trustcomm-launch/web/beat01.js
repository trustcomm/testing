// Beat 1 — "Your happiest customers?" (BRIEF §4). A shop counter in flat illustration; customers pass through as
// rounded shapes: green smiles drift out quietly; one red shape shouts, its sound-wave spikes huge.
// Carry out: the red sound-wave spike.
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, blob, CARRY, q, shopRoom, spikes, breathe } from "./kit.js";

export const T = { shout: q(4 * B), peak: q(5 * B) };
const RED = { x: 1080, y: 690 };
// three quiet customers drifting from the counter toward the door, one after another
const GREENS = [0, 1, 2].map((i) => ({ x0: 520 + i * 70, x1: 1000 + i * 120, t0: i * B, y: 700 }));
const amp = (lt) => snap(prog(lt, T.shout, T.peak));
const greenX = (g, lt) => lerp(g.x0, g.x1, prog(lt, g.t0, 3.9)); // all arrive where Beat 2 picks them up
const bob = (lt) => 1 - prog(lt, 3.3, 3.9); // the walk settles by the cut

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.025); // no dead holds: a slow drift that is zero at both boundaries
    shopRoom(ctx);
    for (const g of GREENS) blob(ctx, greenX(g, lt), g.y + 6 * bob(lt) * Math.sin(lt * 6 + g.x0), 46, "green", { squash: 0.03 * bob(lt) * Math.sin(lt * 8 + g.t0) });
    const a = amp(lt);
    blob(ctx, RED.x, RED.y, 58, "red", { mood: a > 0.05 ? -1 : 1, squash: -0.08 * a });
    if (a > 0) spikes(ctx, 1132, 415, a);
  },
  carry(lt, e) {
    if (lt >= e.dur - 1e-9) return CARRY.b01_02;
    return { kind: "room" };
  },
  track(lt) {
    return [...GREENS.map((g) => [greenX(g, lt), g.y]), [RED.x, 415 - amp(lt) * 165]];
  },
  events() {
    return [
      { t: 0, sfx: "SFX11", gain: -16, what: "café ambience bed (Beats 1–2)", loop: 6.8 },
      { t: q(1 * B), sfx: "SFX06", gain: -16, what: "till ding" },
      { t: T.shout, sfx: "BURST", gain: -12, what: "one loud angry burst (wordless) — synth placeholder" },
    ];
  },
};
