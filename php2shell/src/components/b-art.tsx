// The line-art parts of the analogy world, as screen-space path strings (see b-geom.tsx): house, tiffin, key, envelope, person, the dabbawala.
// Local units: y up is negative, the origin is where the thing stands (feet / base centre) unless noted.
import { Xf, child, pb, pt, arm2 } from "./b-geom";

/** the house: a flat-roofed two-storey block (a Mumbai chawl), 84 wide, 140 high walls and a roof slab on top (the tiffin rests on the slab: y = -148) */
export const ROOF = 148;
export const HOUSE_W = 84, HOUSE_H = 140, SLAB_W = 100;
/** the scale of every hopping tiffin in the wide shot, and of the second person */
export const TK = 1.15, PERSON_K = 1.25;
export const houseGeom = (xf: Xf) => ({
  walls: pb(xf).rrect(-HOUSE_W / 2, -HOUSE_H, HOUSE_W, HOUSE_H, 3).d,
  slab: pb(xf).rrect(-SLAB_W / 2, -HOUSE_H - 8, SLAB_W, 8, 2.5).d,
  door: pb(xf).rrect(-10, -34, 20, 34, 2).d,
  window: pb(xf).rrect(-28, -118, 18, 18, 2).rrect(10, -118, 18, 18, 2).rrect(-28, -88, 18, 18, 2).rrect(10, -88, 18, 18, 2).d,
});

/** the round tiffin: two stacked tins, a lid with a knob. 34 wide, 47 high. The lid is hinged on its RIGHT edge: `rot` (radians, clockwise) swings its free (left) end up. */
export interface Lid { lift: number; rot: number; dx: number }
export const LID0: Lid = { lift: 0, rot: 0, dx: 0 };
export const tiffinGeom = (xf: Xf, lid: Lid = LID0) => {
  const lx = child(xf, 17 + lid.dx, -30 - lid.lift, 1, lid.rot);
  return {
    body: pb(xf).rrect(-15, -30, 30, 30, 8).d,
    seam: pb(xf).line(-15, -15, 15, -15).d,
    lid: pb(lx).rrect(-34, -9, 34, 9, 4).d,
    knob: pb(lx).M(-23, -9).Q(-23, -17, -17, -17).Q(-11, -17, -11, -9).d,
    lidXf: lx,
    /** where a hand grips the lid: near its free end (screen px) */
    grip: pt(lx, -30, -5),
  };
};

/** the key (centre at the origin): a round bow, a shaft, two teeth. 22 long. */
export const keyGeom = (xf: Xf) => pb(xf).circle(-6.2, 0, 4.6).line(-1.6, 0, 10.8, 0).line(10.8, 0, 10.8, 4.4).line(6.8, 0, 6.8, 3.4).d;

/** a request envelope (centre at the origin): 26 x 18 with a flap */
export const envelopeGeom = (xf: Xf) => ({
  body: pb(xf).rrect(-13, -9, 26, 18, 3).d,
  flap: pb(xf).M(-13, -8).L(0, 2).L(13, -8).d,
});

/**
 * a person standing on the roof, facing right: 58 high. `reach` = where the right hand goes, in SCREEN pixels (two-bone arm); `surprise` 0..1 (brows up, eyes wide,
 * mouth open); `look` shifts the eyes (+1 = towards the tiffin).
 */
export const personGeom = (xf: Xf, o: { reach?: [number, number]; surprise?: number; look?: number }) => {
  const shL: [number, number] = [6.5, -38], sh = pt(xf, shL[0], shL[1]), t: [number, number] = o.reach ?? pt(xf, 14, -25), a = arm2(sh, t, 14 * xf.k, 14 * xf.k, 1);
  const sur = o.surprise ?? 0, look = o.look ?? 1;
  const ey = -50.5, ex = 3.0, lk = 0.7 * look;
  return {
    head: pb(xf).circle(0, -51, 7.5).d,
    body: pb(xf).rrect(-7.5, -42, 15, 27, 6).d,
    legs: pb(xf).line(-3.5, -15, -4.5, 0).line(3.5, -15, 4.5, 0).d,
    armL: pb(xf).M(-6.5, -38).L(-11, -28).L(-10, -19).d,
    armR: `M${sh[0]} ${sh[1]}L${a.E[0]} ${a.E[1]}L${a.H[0]} ${a.H[1]}`,
    hand: a.H,
    eyes: [-ex + lk, ex + lk].map((x) => ({ at: pt(xf, x, ey), r: (1.0 + 1.0 * sur) * xf.k })),
    brows: pb(xf).line(-ex - 2.4 + lk, ey - 3.4 - 1.5 * sur, -ex + 1.4 + lk, ey - 3.4 - 2.0 * sur).line(ex - 1.4 + lk, ey - 3.4 - 2.0 * sur, ex + 2.4 + lk, ey - 3.4 - 1.5 * sur).d,
    mouth: sur > 0.02 ? { at: pt(xf, lk, -46.2), r: (0.7 + 0.8 * sur) * xf.k } : null,
    smile: pb(xf).M(-2.2 + lk, -46.8).Q(lk, -45.2, 2.2 + lk, -46.8).d,
    top: pt(xf, 0, -60),
  };
};

/** the dabbawala, front view, 244 high: white Gandhi cap, kurta down to the knees, trousers, a tray of round tiffins held in front. Feet at the origin. */
export const DABBA_TIFFIN_X = [-31, 0, 31], DABBA_TRAY_Y = -112, DABBA_TIFFIN_K = 0.78;
export const dabbaGeom = (xf: Xf) => ({
  legs: pb(xf).M(-22, -78).L(-22, 0).L(-4, 0).L(-4, -78).M(4, -78).L(4, 0).L(22, 0).L(22, -78).d,
  torso: pb(xf).M(-10, -178).Q(-30, -178, -32, -160).L(-37, -76).L(37, -76).L(32, -160).Q(30, -178, 10, -178).d,
  head: pb(xf).circle(0, -204, 21).d,
  cap: pb(xf).M(-20, -216).L(-18, -236).Q(0, -245, 18, -236).L(20, -216).Q(0, -221, -20, -216).Z().d,
  smile: pb(xf).M(-6.5, -192).Q(0, -187, 6.5, -192).d,
  eyes: [-7.5, 7.5].map((x) => ({ at: pt(xf, x, -201), r: 2.4 * xf.k })),
  armL: pb(xf).M(-32, -162).L(-54, -130).L(-49, -104).d,
  armR: pb(xf).M(32, -162).L(54, -130).L(49, -104).d,
  tray: pb(xf).rrect(-54, DABBA_TRAY_Y, 108, 11, 3).d,
  tiffinXf: DABBA_TIFFIN_X.map((x) => child(xf, x, DABBA_TRAY_Y, DABBA_TIFFIN_K)),
});
