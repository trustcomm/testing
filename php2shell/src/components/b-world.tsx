// The analogy world of S5, S6 and S7, drawn as ONE continuous thing from frame to frame: the ground line, the dabbawala, six houses, dotted arcs, round tiffins,
// the second person with the red key, and (in S7) the houses growing into six server racks, the arcs flattening into the request line, the tiffins turning into
// request envelopes. S5, S6 and S7 each draw this same world (a function of the absolute frame), so the cross-dissolves between their layers are invisible.
// Scene-specific overlays (pills, the "!", the leaking envelope and its chips) live in scenes/S05..S07.tsx.
import React, { useId, useMemo } from "react";
import { C, H, W } from "../theme";
import { CUES, cameraAt } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeInOutCubic, easeOutCubic, lerp, rand, springAt } from "../motion";
import { Canvas, Stroke, pathLength, pointsOnPath } from "./draw";
import { Dust, type Pt } from "./dust";
import { HALL, ServerRack } from "./rack";
import { CAM_HALL, CAM_WIDE, Cam, Xf, arcPath, child, easeInOutSine, lerpCam, pb, place, pt, qpt, smoothstep, toScreen } from "./b-geom";
import { type Lid, HOUSE_H, HOUSE_W, LID0, PERSON_K, ROOF, SLAB_W, TK, dabbaGeom, envelopeGeom, houseGeom, keyGeom, personGeom, tiffinGeom } from "./b-art";
import { HOPS5, type Hop } from "../cues/s05";

const c5 = CUES.S5.cue, c6 = CUES.S6.cue, c7 = CUES.S7.cue;

// ---------------------------------------------------------------- layout (world = the wide shot, screen pixels at CAM_WIDE with cy = 800 + 100)
export const GROUND = 1070, BUS_Y = 446, ROOFY = GROUND - ROOF;
export const HX = [135, 255, 375, 705, 825, 945];             // the six houses (they slide to HALL.xs while they grow into racks)
export const RX: readonly number[] = HALL.xs;
const APEX = [50, 70, 70, 250, 70, 70, 50];                    // apex height of the dotted arc between station k and k+1 (the high one passes over the dabbawala's head)
export const PERSON_X = 668;                                   // the second person stands on house 4's roof, left of where the tiffin lands
export const CAM_CLOSE: Cam = { cx: 540, cy: 960, s: 2.0 };    // S5's opening: the dabbawala, medium close
export const CAM_G: Cam = { cx: 690, cy: 880, s: 4.8 };        // S6's last framing: the person, the open tiffin, the key
const BUS_STUB = HALL.top - 24;                                // the request line sits 24 px above the racks

// ---------------------------------------------------------------- the morph of the houses into racks (S7), per house with a tiny stagger from the middle out
const emorph = (i: number, f: number) => {
  const d = Math.abs(i - 2.5) < 1 ? 0 : Math.abs(i - 2.5) < 2 ? 2 : 4;
  return easeInOutCubic((f - c7.morphStart - d) / (c7.morphEnd - c7.morphStart - 4));
};
const eSt = (k: number, f: number) => emorph(Math.min(5, Math.max(0, k - 1)), f);
/** station 0 = off the left edge, 1..6 = the houses (roofs), 7 = off the right edge */
export const stationX = (k: number, f: number) => (k === 0 ? lerp(62, 120, eSt(0, f)) : k === 7 ? lerp(1018, 960, eSt(7, f)) : lerp(HX[k - 1], RX[k - 1], eSt(k, f)));
export const stationY = (k: number, f: number) => lerp(ROOFY, BUS_Y, eSt(k, f));
const flat = (f: number) => easeInOutCubic((f - c7.flatStart) / (c7.flatEnd - c7.flatStart));
type P2 = [number, number];
const arcPts = (k: number, f: number): [P2, P2, P2] => {
  const a: P2 = [stationX(k, f), stationY(k, f)], b: P2 = [stationX(k + 1, f), stationY(k + 1, f)];
  return [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 2 * APEX[k] * (1 - flat(f))], b];
};

// ---------------------------------------------------------------- the hopping tiffins
type HopX = Hop & { slow?: boolean };
const HOPS: HopX[][] = [0, 1, 2, 3, 4, 5, 6].map((a) => {
  const h: HopX[] = [HOPS5.find((x) => x.s0 === a)!];
  if (a === 4) h.push({ s0: 5, s1: 4, lift: c6.hopStart, dur: c6.hopEnd - c6.hopStart, slow: true });   // S6: the one tiffin goes back, slowly
  return h;
});
const ringOf = (st: number) => Math.abs(st - 3.5) - 0.5;      // stations 3,4 -> 0; 2,5 -> 1; 1,6 -> 2
interface TPos { x: number; y: number; tilt: number; flying: boolean; u: number; st: number; landed: number }
export const tiffinPos = (a: number, f: number): TPos => {
  let st = a, landed = -999;
  for (const h of HOPS[a]) {
    if (f < h.lift) break;
    if (f < h.lift + h.dur) {
      const u = (f - h.lift) / h.dur, t = h.slow ? easeInOutSine(u) : u, k = Math.min(h.s0, h.s1), fwd = h.s0 < h.s1, tt = fwd ? t : 1 - t;
      const [p0, c, p1] = arcPts(k, f), q = qpt(p0, c, p1, tt), sgn = fwd ? 1 : -1, vx = Math.cos(q.angle) * sgn, vy = Math.sin(q.angle) * sgn;
      return { x: q.x, y: q.y, tilt: Math.atan2(vy, Math.abs(vx)) * (h.slow ? 0.16 : 0.35) * Math.sign(vx || 1), flying: true, u, st: h.s0, landed: -999 };
    }
    st = h.s1; landed = h.lift + h.dur;
  }
  if (a === 3 && f >= c6.fade + 14) { st = 5; landed = -999; }  // (it is invisible meanwhile) house 4's tiffin re-appears on the empty house 5 in S7, the hero takes house 4
  return { x: stationX(st, f), y: stationY(st, f), tilt: 0, flying: false, u: 0, st, landed };
};
/** the hero tiffin of S6 (the one that comes back with the key): its base-centre position in the world */
export const heroAt = (f: number) => tiffinPos(4, f);

// ---------------------------------------------------------------- the camera
export const camAt = (f: number): Cam => {
  let cam = lerpCam(CAM_CLOSE, CAM_WIDE, easeInOutCubic((f - c5.pullStart) / (c5.pullEnd - c5.pullStart)));        // S5: "hazaaron": pull wide
  if (f >= c6.camIn) {                                                                                                // S6: zoom onto the one tiffin and follow it
    const h = heroAt(f), F: Cam = { cx: h.x, cy: h.y - 24, s: lerp(3.6, 4.8, smoothstep(c6.hopStart, c6.hopEnd, f)) };
    cam = lerpCam(CAM_WIDE, F, easeInOutCubic((f - c6.camIn) / (c6.camInEnd - c6.camIn)));
    cam = lerpCam(cam, CAM_G, easeInOutCubic((f - c6.hopEnd) / 16));
  }
  cam = lerpCam(cam, CAM_WIDE, easeInOutCubic((f - c7.pullBackStart) / (c7.pullBackEnd - c7.pullBackStart)));        // S7: pull back, then settle on the hall
  return lerpCam(cam, CAM_HALL, easeInOutCubic((f - c7.morphStart) / (c7.morphEnd - c7.morphStart)));
};
/** the CSS transform that makes something drawn (once) with camera `from` follow camera `to` (dust captured at one camera while the camera keeps moving) */
export const followCam = (from: Cam, to: Cam): React.CSSProperties => ({ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "540px 800px", transform: `translate(${(from.cx - to.cx) * to.s}px, ${(from.cy - to.cy) * to.s}px) scale(${to.s / from.s})` });

// ---------------------------------------------------------------- the second person: where the hand goes, the lid, the key (S6)
export const personXf = (cam: Cam): Xf => place(cam, PERSON_X, ROOFY, PERSON_K);
const heroLid = (f: number): Lid => {
  const o1 = easeOutCubic((f - c6.chaabi) / 8), o2 = easeInOutCubic((f - c6.lidLift) / 9), cl = 1 - easeInOutCubic((f - c7.personDust) / 16);
  return { lift: 0, dx: 0, rot: (0.16 * o1 + 0.84 * o2) * cl };
};
const KEY_IN_TIN: P2 = [0, -15];
/** the spring-pop of the tiffin that rests on station a (a >= 1) in S5 ("tiffin"): 0.6 -> 1 */
const popSpring = (a: number, f: number) => (a >= 1 && f < HOPS[a][0].lift ? springAt(f, c5.tiffinPop + 2 * ringOf(a)) : 1);
interface Pose { cam: Cam; txf: Xf; lid: ReturnType<typeof tiffinGeom>; pxf: Xf; person: ReturnType<typeof personGeom>; key: { x: number; y: number; k: number; r: number }; handHold: P2 }
/** everything S6 needs at frame f, in screen pixels (also used by the S6 overlay to place the red "!") */
export const heroPose = (f: number, camIn?: Cam): Pose => {
  const cam = camIn ?? camAt(f), h = heroAt(f);
  const sway = h.flying && h.st === 5 ? 0.05 * Math.sin((f - c6.hopStart) * 0.2) : 0;
  const txf = place(cam, h.x, h.y + settle(f, h.landed), TK * (0.6 + 0.4 * popSpring(4, f)), h.tilt + sway), lidPose = heroLid(f), lid = tiffinGeom(txf, lidPose);
  const pxf = personXf(cam);
  const sur = easeOutCubic((f - c6.keyHand) / 5);
  // the right hand: rests, reaches for the lid's free end, lifts it, then goes up to catch the key
  const rest = pt(pxf, 12, -24), hold = pt(pxf, 17, -44);
  const reachK = easeInOutCubic((f - c6.reach) / 8), freeK = easeInOutCubic((f - (c6.keyRise - 8)) / 12);
  let target: P2 = [lerp(rest[0], lid.grip[0], reachK), lerp(rest[1], lid.grip[1], reachK)];
  target = [lerp(target[0], hold[0], freeK), lerp(target[1], hold[1], freeK)];
  const person = personGeom(pxf, { reach: target, surprise: sur, look: 1 });
  // the key: inside the tin, then floating up into the hand
  const kin = pt(txf, KEY_IN_TIN[0], KEY_IN_TIN[1]), u = easeInOutCubic((f - c6.keyRise) / (c6.keyHand - c6.keyRise));
  const key = { x: lerp(kin[0], hold[0], u) + Math.sin(u * Math.PI * 2) * 1.2 * cam.s, y: lerp(kin[1], hold[1], u) - Math.sin(u * Math.PI) * 6 * cam.s, k: txf.k * lerp(1, 1.2, u), r: lerp(-0.12, -0.5, u) };
  return { cam, txf, lid, pxf, person, key, handHold: hold };
};
const settle = (f: number, landed: number) => { const a = f - landed; return a < 0 || a > 8 ? 0 : -3 * Math.sin((Math.PI * a) / 8) * (1 - a / 8); };

// ---------------------------------------------------------------- dust (S5 assembles from dots; S7 dissolves the dabbawala, the ground line and the person)
const ptsOf = (ds: string[], spacing: number): Pt[] => ds.flatMap((d) => pointsOnPath(d, Math.max(2, Math.round(pathLength(d) / spacing))));
const tiffinDs = (g: ReturnType<typeof tiffinGeom>) => [g.body, g.seam, g.lid, g.knob];
const figureDs = (xf: Xf) => { const g = dabbaGeom(xf); return [g.legs, g.torso, g.head, g.cap, g.armL, g.armR, g.tray, g.smile, ...g.tiffinXf.flatMap((t) => tiffinDs(tiffinGeom(t)))]; };
const groundD = (cam: Cam, x0 = 60, x1 = 1020) => { const [a, y] = toScreen(cam, x0, GROUND), [b] = toScreen(cam, x1, GROUND); return `M${a} ${y}L${b} ${y}`; };
interface DustSets { close: { ground: Pt[]; figure: Pt[] }; wide: { ground: Pt[]; figure: Pt[] }; person: Pt[]; key: Pt[] }
const buildDust = (): DustSets => {
  const cc = CAM_CLOSE, cw = CAM_WIDE;
  const gp = heroPoseStatic();
  return {
    close: { ground: ptsOf([groundD(cc, 211, 869)], 7), figure: ptsOf(figureDs(place(cc, 540, GROUND)), 6) },
    wide: { ground: ptsOf([groundD(cw)], 7), figure: ptsOf(figureDs(place(cw, 540, GROUND)), 5) },
    person: ptsOf([gp.person.head, gp.person.body, gp.person.legs, gp.person.armL, gp.person.armR, gp.person.brows], 4.5),
    key: ptsOf([keyD(gp.key)], 3.5),
  };
};
const keyD = (k: { x: number; y: number; k: number; r: number }) => keyGeom({ x: k.x, y: k.y, k: k.k, r: k.r, fx: 1 });
/** the S6 end pose seen from CAM_G (what the S7 dust is captured from) */
const heroPoseStatic = () => heroPose(c6.hold + 1, CAM_G);

// ---------------------------------------------------------------- stars: the dust that did not need to become a shape
const STARS = Array.from({ length: 70 }, (_, i) => ({ u: 50 + rand(i, 1) * 980, v: 292 + rand(i, 2) * 380, r: 0.9 + rand(i, 3) * 1.1, a: 0.16 + rand(i, 4) * 0.34, d: rand(i, 5) }));

// ---------------------------------------------------------------- the X-ray (needs ids for its clip paths)
const XRay: React.FC<{ txf: Xf; f: number; keyD: string }> = ({ txf, f, keyD: kd }) => {
  const id = useId().replace(/:/g, ""), u = clamp01((f - c6.xray) / 14);
  if (u <= 0) return null;
  const ys = -29 + 28 * u, poly = (y: number) => pb(txf).poly([[-14, -29], [14, -29], [14, y], [-14, y]], true).d;
  const inside = pb(txf).rrect(-14, -29, 28, 28, 7).d, tint = clamp01(1 - (f - c6.lidLift) / 10);
  return (
    <g>
      <clipPath id={`${id}in`}><path d={inside} /></clipPath>
      <clipPath id={`${id}rv`}><path d={poly(ys)} /></clipPath>
      <g clipPath={`url(#${id}in)`} opacity={tint}><path d={poly(ys)} fill="rgba(255,59,48,0.13)" /></g>
      <g clipPath={`url(#${id}rv)`}><Stroke d={kd} p={1} color={C.alarm} glow={C.alarm} /></g>
      {u < 1 && <Stroke d={pb(txf).line(-16, ys, 16, ys).d} p={1} opacity={0.9 * (1 - u * u)} glow="#fff" />}
    </g>
  );
};

// ---------------------------------------------------------------- the world
export const BWorld: React.FC = () => {
  const f = useFrame(), cam = camAt(f), dust = useMemo(buildDust, []);
  const out = easeInOutCubic((f - c7.fadeOut) / c7.fadeFrames), alive = 1 - out;               // S7: everything but the racks dissolves
  const pose = heroPose(f, cam);
  // S6 "ONE tiffin": everything but the hero (the other tiffins, the buildings, the other arcs) recedes; it all comes back in S7
  const dimK = easeInOutCubic((f - c6.fade) / 14) * (1 - easeInOutCubic((f - c7.pullBackStart) / 20));
  const gp =(k: number) => toScreen(cam, k, GROUND);

  // --- ground line (centre outwards), dust-swapped in S7
  const gA = 1 - clamp01((f - c7.figureDust) / 5);
  const ground = [60, 1020].map((x, i) => <Stroke key={i} d={`M${gp(540)[0]} ${gp(540)[1]}L${gp(x)[0]} ${gp(x)[1]}`} at={c5.groundOn} frames={c5.groundFrames} opacity={gA} />);

  // --- the dabbawala
  const fxf = place(cam, 540, GROUND), g = dabbaGeom(fxf), fa = (at: number, fr: number) => easeInOutCubic((f - c5.figureOn - at) / fr), figA = (1 - clamp01((f - c7.figureDust) / 5)) * (1 - 0.85 * dimK);
  const figure = f >= c5.figureOn && figA > 0 && (
    <g>
      <Stroke d={g.legs} p={fa(0, 12)} opacity={figA} /><Stroke d={g.torso} p={fa(4, 14)} opacity={figA} />
      <Stroke d={g.armL} p={fa(14, 12)} opacity={figA} /><Stroke d={g.armR} p={fa(14, 12)} opacity={figA} />
      <Stroke d={g.head} p={fa(9, 11)} opacity={figA} />
      <Stroke d={g.tray} p={fa(18, 10)} fill="#000" opacity={figA} />
      {g.tiffinXf.map((t, j) => { const s = springAt(f, c5.trayOn + 3 * j); if (s <= 0) return null; const tg = tiffinGeom({ ...t, k: t.k * (0.6 + 0.4 * s) }); return <Tiffin key={j} g={tg} opacity={clamp01(s * 1.6) * figA} />; })}
      <path d={g.cap} fill={C.text} opacity={easeOutCubic((f - c5.hit) / 6) * figA} style={{ filter: f < c5.hit + 14 && f >= c5.hit ? "drop-shadow(0 0 10px rgba(255,255,255,0.8))" : undefined }} />
      <Stroke d={g.cap} p={fa(20, 8)} opacity={figA} />
      {f >= c5.figureOn + 22 && g.eyes.map((e, i) => <circle key={i} cx={e.at[0]} cy={e.at[1]} r={e.r} fill={C.text} opacity={clamp01((f - c5.figureOn - 22) / 4) * figA} />)}
      <Stroke d={g.smile} p={fa(22, 6)} opacity={figA} />
    </g>
  );

  // --- the houses (and, from "server", the racks they grow into)
  const rackDone = f >= c7.interior + 2 * 5 + 14 + 8;                      // from here the real ServerRack draws the six racks (identical lines)
  const wideHouses = !rackDone && [0, 1, 2, 3, 4, 5].map((i) => {
    const e = emorph(i, f), x = stationX(i + 1, f), xf = place(cam, x, GROUND), hg = houseGeom(xf), at = c5.houseOn + 4 * (Math.abs(i - 2.5) - 0.5);
    if (f < at) return null;
    const w = lerp(HOUSE_W, 110, e), h = lerp(HOUSE_H, 600, e), r = lerp(3, 14, e);
    const wp = easeInOutCubic((f - at) / 14), sp = easeInOutCubic((f - at - 4) / 12), dp = easeInOutCubic((f - at - 8) / 10);
    const fade = 1 - clamp01(e * 3), slabFade = 1 - smoothstep(0, 0.6, e);
    return (
      <g key={i}>
        <Stroke d={pb(xf).rrect(-w / 2, -h, w, h, r).d} p={wp} opacity={1 - 0.62 * dimK} />
        {slabFade > 0 && <Stroke d={pb(xf).rrect(-lerp(SLAB_W, 110, e) / 2, -h - 8, lerp(SLAB_W, 110, e), 8, 2.5).d} p={sp} opacity={slabFade * (1 - 0.35 * dimK)} />}
        {fade > 0 && <><Stroke d={hg.door} p={dp} opacity={fade * (1 - 0.62 * dimK)} /><Stroke d={hg.window} p={dp} opacity={fade * (1 - 0.62 * dimK)} /></>}
        {e > 0 && rackInner(i, f, xf, cam)}
      </g>
    );
  });

  // --- the dotted arcs (S5) that flatten into the request line (S7), the stubs that plug the racks into it
  const flow = f >= c7.flatStart ? -(f - c7.flatStart) * 0.5 : undefined;
  const arcs = [0, 1, 2, 3, 4, 5, 6].map((k) => {
    const [a, c, b] = arcPts(k, f), d = arcPath(cam, a, c, b), ring = Math.abs(k - 3), at = c5.arcOn + 3 * ring;
    if (f < at) return null;
    const ao = 0.7 * (k === 4 ? 1 : 1 - 0.65 * dimK);                                     // S6: only the hero's own arc stays bright
    if (flow !== undefined) return <path key={k} d={d} fill="none" stroke={C.text} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.01 11" strokeDashoffset={flow} opacity={ao * alive} />;
    return <Stroke key={k} d={d} at={at} frames={20} dotted={11} opacity={ao} />;
  });
  const stubs = RX.map((x, i) => {
    const p = easeInOutCubic((f - c7.flatEnd + 10 - i * 1.5) / 10), [x0, y0] = toScreen(cam, stationX(i + 1, f), HALL.top), [, y1] = toScreen(cam, 0, BUS_STUB);
    return f >= c7.flatEnd - 10 ? <Stroke key={i} d={`M${x0} ${y0}L${x0} ${y1}`} p={p} opacity={alive} /> : null;
  });

  // --- tiffins -> envelopes
  const things = [0, 1, 2, 3, 4, 5, 6].map((a) => {
    const t = tiffinPos(a, f), hop = HOPS[a][0];
    if (f < (a === 0 ? hop.lift : c5.tiffinPop + 2 * ringOf(a))) return null;
    const sp = popSpring(a, f);
    let alpha = a === 0 ? clamp01((f - hop.lift) / 5) : clamp01(sp * 1.6);
    if (a === 6) alpha *= 1 - clamp01((f - (hop.lift + hop.dur * 0.45)) / (hop.dur * 0.55));
    if (a !== 4) alpha *= 1 - dimK * (a === 3 ? 1 : 0.8);
    const isoK = a === 1 ? 0 : 0.7 * easeInOutCubic((f - c7.leak) / 10);          // S7 "agle ke haath mein": the other requests step back, the leaking one stands out
    alpha *= 1 - isoK;
    alpha *= alive;
    if (alpha <= 0.01) return null;
    const mix = easeInOutCubic((f - c7.convert - 2 * Math.max(0, t.st - 1)) / 8), k = 0.6 + 0.4 * sp;
    const tg = a === 4 ? pose.lid : tiffinGeom(place(cam, t.x, t.y + settle(f, t.landed), TK * k, t.tilt), LID0);
    const showEnv = mix > 0 && !(a === 1 && f >= c7.leak);                    // rack 2's envelope is taken over by S7's overlay when it starts to leak
    return (
      <g key={a}>
        {mix < 1 && <Tiffin g={tg} opacity={alpha * (1 - mix)} />}
        {showEnv && <Envelope xf={envXf(cam, t.x, t.y, 0.7 + 0.3 * mix)} opacity={alpha * mix} />}
      </g>
    );
  });

  // --- the second person, the key
  const pA = 1 - clamp01((f - c7.personDust) / 4), pa = (at: number, fr: number) => easeInOutCubic((f - c6.personOn - at) / fr), P = pose.person;
  const person = f >= c6.personOn && pA > 0 && (
    <g>
      <Stroke d={P.legs} p={pa(0, 8)} opacity={pA} /><Stroke d={P.body} p={pa(2, 10)} fill={`rgba(0,0,0,${pa(12, 6)})`} opacity={pA} /><Stroke d={P.armL} p={pa(6, 8)} opacity={pA} />
      <Stroke d={P.head} p={pa(4, 10)} fill={`rgba(0,0,0,${pa(12, 6)})`} opacity={pA} /><Stroke d={P.armR} p={pa(6, 8)} opacity={pA} />
      {f >= c6.personOn + 10 && <g opacity={clamp01((f - c6.personOn - 10) / 4) * pA}>
        {P.eyes.map((e, i) => <circle key={i} cx={e.at[0]} cy={e.at[1]} r={e.r} fill={C.text} />)}
        <Stroke d={P.brows} p={1} w={2} />
        {P.mouth ? <circle cx={P.mouth.at[0]} cy={P.mouth.at[1]} r={P.mouth.r} fill="none" stroke={C.text} strokeWidth={2} /> : <Stroke d={P.smile} p={1} w={2} />}
      </g>}
    </g>
  );
  const kxf = { x: pose.key.x, y: pose.key.y, k: pose.key.k, r: pose.key.r, fx: 1 };
  const keyEl = pA > 0 && f >= c6.xray && (f < c6.keyRise
    ? <XRay txf={pose.txf} f={f} keyD={keyGeom(child(pose.txf, KEY_IN_TIN[0], KEY_IN_TIN[1], 1, -0.12))} />
    : <g opacity={pA}><Stroke d={keyGeom(kxf)} p={1} color={C.alarm} glow={C.alarm} /></g>);

  // --- stars
  const sp = 0.3, scp = 1 + sp * (cam.s - 1), starOut = 1 - smoothstep(c7.morphStart - 6, c7.morphEnd, f);
  const stars = starOut > 0 && STARS.map((s, i) => {
    const X = 540 + (s.u - 540 - sp * (cam.cx - 540)) * scp, Y = 800 + (s.v - 800 - sp * (cam.cy - 900)) * scp, a = clamp01((f - c5.dustStart - 6 - s.d * 40) / 18) * starOut;
    return a > 0 && X > 10 && X < 1070 && Y > 260 && Y < 1330 ? <circle key={i} cx={X} cy={Y} r={s.r} fill={C.text} opacity={s.a * a} /> : null;
  });

  // --- dust layers
  const dAssemble = f < c5.figureOn + c5.figureFrames + 6;
  const pAss = 1 - clamp01((f - c5.dustStart) / (c5.dustDone - c5.dustStart));
  const gDustA = 1 - clamp01((f - c5.groundOn) / (c5.groundFrames + 6)), fDustA = 1 - clamp01((f - c5.figureOn) / (c5.figureFrames + 4));
  const dissolveP = (at: number, fr: number) => clamp01((f - at) / fr), dk = (at: number) => clamp01((f - at) / 4);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, WebkitMaskImage: safeMask(cameraAt(f)), maskImage: safeMask(cameraAt(f)), WebkitMaskComposite: "source-in", maskComposite: "intersect" }}>
      <Canvas>{stars}</Canvas>
      {dAssemble && <><Dust points={dust.close.ground} p={pAss} seed={5} alpha={gDustA} size={2.6} /><Dust points={dust.close.figure} p={pAss} seed={6} alpha={fDustA} size={2.6} /></>}
      <Canvas>
        <g style={{ filter: out > 0 ? `blur(${out * 6}px)` : undefined }}>
          {ground}
          {arcs}
          {wideHouses}
          {stubs}
          {things}
          {figure}
          {person}
          {keyEl}
        </g>
        {rackDone && RX.map((x) => <ServerRack key={x} x={x} top={HALL.top} w={HALL.w} h={HALL.h} p={1} />)}
      </Canvas>
      {f >= c7.figureDust && f < c7.figureDust + c7.figureDustFrames + 4 && (
        <div style={followCam(CAM_WIDE, cam)}>
          <Dust points={dust.wide.figure} p={dissolveP(c7.figureDust, c7.figureDustFrames)} seed={21} alpha={dk(c7.figureDust)} size={2.6} drift={300} />
          <Dust points={dust.wide.ground} p={dissolveP(c7.figureDust, c7.figureDustFrames)} seed={22} alpha={dk(c7.figureDust)} size={2.6} drift={220} />
        </div>
      )}
      {f >= c7.personDust && f < c7.personDust + c7.personDustFrames + 4 && (
        <div style={followCam(CAM_G, cam)}>
          <Dust points={dust.person} p={dissolveP(c7.personDust, c7.personDustFrames)} seed={31} alpha={dk(c7.personDust)} size={2.6} drift={160} />
          <Dust points={dust.key} p={dissolveP(c7.personDust, c7.personDustFrames)} seed={32} color={C.alarm} alpha={dk(c7.personDust)} size={3} drift={190} />
        </div>
      )}
    </div>
  );
};
/**
 * The world never draws into the top 240 px, the bottom 440 px or within ~26 px of a side of the FINAL picture (the lead's global camera `sc` scales everything about
 * the centre): a close-up's buildings and the long ground line fade out at those borders instead of being clipped. The fade borders move with the camera scale.
 */
const safeMask = (sc: number) => {
  const l = 540 - 514 / sc, r = 540 + 514 / sc, t = 960 - 712 / sc;
  return `linear-gradient(to bottom, transparent ${t}px, #000 ${t + 64}px, #000 1215px, transparent 1318px), linear-gradient(to right, transparent ${l}px, #000 ${l + 44}px, #000 ${r - 44}px, transparent ${r}px)`;
};

// ---------------------------------------------------------------- small drawing pieces
/** the envelope that rides the request line: its centre 14 px above the tiffin's base (the line), 1.5x scale */
export const envXf = (cam: Cam, x: number, y: number, k = 1): Xf => place(cam, x, y - 16, 1.7 * k);
export const Tiffin: React.FC<{ g: ReturnType<typeof tiffinGeom>; opacity?: number }> = ({ g, opacity = 1 }) => (
  <g>
    <Stroke d={g.body} p={1} fill="#000" opacity={opacity} /><Stroke d={g.seam} p={1} opacity={opacity} />
    <Stroke d={g.lid} p={1} fill="#000" opacity={opacity} /><Stroke d={g.knob} p={1} opacity={opacity} />
  </g>
);
export const Envelope: React.FC<{ xf: Xf; opacity?: number; color?: string; glow?: string }> = ({ xf, opacity = 1, color, glow }) => {
  const e = envelopeGeom(xf);
  return <g><Stroke d={e.body} p={1} fill="#000" opacity={opacity} color={color} glow={glow} /><Stroke d={e.flap} p={1} opacity={opacity} color={color} glow={glow} /></g>;
};

/** the rack's slots, LEDs and vents, written on bottom to top while the house walls finish growing (identical to ServerRack's once done) */
const rackInner = (i: number, f: number, xf: Xf, cam: Cam) => {
  void cam;
  const h = HALL.h, gap = h / 6, sx = -HALL.w / 2, els: React.ReactNode[] = [];
  for (let j = 0; j < 6; j++) {
    const p = easeInOutCubic((f - c7.interior - 2 * (5 - j)) / 14);
    if (p <= 0) continue;
    if (j < 5) els.push(<Stroke key={`s${j}`} d={pb(xf).line(sx, -h + gap * (j + 1), sx + HALL.w, -h + gap * (j + 1)).d} p={p} />);
    els.push(<Stroke key={`l${j}`} d={pb(xf).circle(sx + 22, -h + gap * (j + 0.5), 4).d} p={p} fill={C.text} />);
    els.push(<Stroke key={`v${j}`} d={pb(xf).line(sx + HALL.w - 54, -h + gap * (j + 0.5), sx + HALL.w - 18, -h + gap * (j + 0.5)).d} p={p} />);
  }
  void i;
  return <g>{els}</g>;
};
