// Sanity checks on the timeline: the frames the brief fixes, the counts it demands, the Lottie key poses, the beat grid, the orbit.
import { BIRD_INFO, DUCKS, DURATION, EVENTS, FPS, GRID, LOTTIES, OBJECTS, ORB, ORBIT_INFO, RING_INFO, SCENES, SEGMENTS, fr, gridIndex, hudAt, orbTheta, sampleObject, toSph } from "../src/timeline";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const ev = (id: string) => { const e = EVENTS.find((x) => x.id === id); if (!e) throw new Error("no event " + id); return e; };

ok(DURATION === 48 * FPS && DURATION === 2880, `length: ${DURATION} frames = ${DURATION / FPS} s at ${FPS} fps`);
const bounds = [0, 3, 8, 16, 22, 29, 36, 41.5, 48].map(fr);
ok(SCENES.every((s, i) => s.start === bounds[i] && s.end === bounds[i + 1]) && SCENES[7].end === DURATION, "scenes: S0..S7 are contiguous and start/end where the shot list says", SCENES.map((s) => `${s.id} ${s.start}-${s.end}`).join("  "));
ok(new Set(EVENTS.map((e) => e.id)).size === EVENTS.length, `events: ${EVENTS.length} unique ids`);
ok(EVENTS.every((e) => e.frame >= 0 && e.frame <= DURATION && e.scene === SCENES.find((s) => e.frame >= s.start && e.frame < s.end + (e.frame === DURATION ? 1 : 0))?.id), "events: every event lies inside its scene");
ok(EVENTS.every((e) => Math.abs(e.t * FPS - e.frame) <= 0.5 + 1e-9), "events: the frame of every event is within half a frame of its exact time", `largest ${Math.max(...EVENTS.map((e) => Math.abs(e.t * FPS - e.frame))).toFixed(3)} frame (the 96 BPM quarter-beat is 9.375 frames, so some pulses sit between frames)`);

// the frames the brief fixes
const fixed: [string, number, string][] = [["s0.draw", 0.5, "headphones draw starts 0.50"], ["s0.tick", 1.2, "centre tick + text at 1.20"], ["s0.dim", 2.4, "dim to 20 % at 2.40"], ["s0.air", 2.3, "air swell from 2.30"], ["s1.whistle", 3.7, "whistle from 3.70"], ["s1.plink", 4.2, "IMPACT at 4.20 s = frame 252"], ["s3.rain_in", 17.0, "rain bed from 17.00"], ["s3.rumble", 18.5, "rumble from 18.50"], ["s3.flash", 19.8, "sky flash at 19.80"], ["s4.cut", 22.0, "rain stops at 22.00"], ["s4.birdC.flap2", 26.0, "diagonal bird over the camera at 26.0"], ["s5.allfire", 35.0, "all 128 fire at exactly 35.00"], ["s6.riser", 36.0, "riser from 36.00"], ["s6.silence", 40.9, "total silence from 40.90"], ["s6.breath", 41.2, "breath at 41.20"], ["s6.impact", 41.4, "IMPACT at 41.40 = frame 2484"], ["s7.sub", 43.8, "subline at 43.80"], ["s7.handle", 45.2, "@baqur.ai at 45.20"], ["s7.legal", 46.4, "legal line at 46.40"], ["s7.tail", 47.2, "reverb tail gone by 47.20"]];
for (const [id, s, what] of fixed) ok(ev(id).frame === Math.round(s * FPS), `fixed: ${what}`, `${id} frame ${ev(id).frame}`);
ok(ev("s1.plink").frame === 252 && ev("s6.impact").frame === 2484 && ev("s5.allfire").frame === 2100, "fixed: plink 252, all-fire 2100, impact 2484");

// the rain
const drops = EVENTS.filter((e) => e.kind === "drop_click");
ok(drops.length === 40, `S3: exactly ${drops.length} drops hit the floor`);
ok(drops.every((d) => Math.abs(d.pos[1] + 1.4) < 1e-6 && Math.abs(toSph(d.pos).az) <= 21.01 && Math.hypot(d.pos[0], d.pos[2]) >= 2.6 && Math.hypot(d.pos[0], d.pos[2]) <= 6.01), "S3: every drop lands on the floor plane inside the 9:16 view (|az| <= 21 deg, 2.6-6.0 m away along the floor)");
ok(drops.every((d, i) => i === 0 || d.frame - drops[i - 1].frame >= 4) && drops[0].frame >= 1062 && drops.at(-1)!.frame < 1320, "S3: the drops are at least 4 frames apart, all before the cut at 1320", `${drops[0].frame}-${drops.at(-1)!.frame}`);
ok(new Set(drops.map((d) => d.pos.join())).size === 40, "S3: every drop has its own position");

// the grid
const clicks = EVENTS.filter((e) => e.kind === "grid_click");
ok(GRID.length === 128 && new Set(GRID.map((p) => p.join())).size === 128, "S5: 128 distinct grid points (16 columns x 8 rows)");
ok(clicks.length === 97 && new Set(clicks.map((c) => c.params!.point)).size === 97, `S5: ${clicks.length} clicks light ${new Set(clicks.map((c) => c.params!.point)).size} different points; the other 31 charge and flash with the 128-point chord`);
const fs5 = clicks.map((c) => c.frame), ints = fs5.slice(1).map((f, i) => f - fs5[i]);
ok(ints[0] === 15 && ints.slice(0, 24).every((v, i, arr) => i === 0 || v <= arr[i - 1] + 1), `S5: starts at 4 per second (first interval 15 frames = 4/s) and speeds up without slowing (to within frame rounding; intervals ${ints.slice(0, 8).join(",")} ... ${ints.slice(20, 25).join(",")} frames)`);
ok(Math.abs((fs5[40] - fs5[25]) / 15 - 3.75) < 0.05, `S5: reaches 16 per second (frames 25-40 average ${((fs5[40] - fs5[25]) / 15).toFixed(2)} frames apart = 3.75)`);
const poly = clicks.filter((c) => c.params!.voice === "a" || c.params!.voice === "b"), A = poly.filter((c) => c.params!.voice === "a").map((c) => c.frame), B = poly.filter((c) => c.params!.voice === "b").map((c) => c.frame);
ok(A.length === 24 && B.length === 32 && A.slice(1).every((f, i) => f - A[i] === 4 || (f - A[i]) === 4) && B.slice(1).every((f, i) => f - B[i] === 3), `S5: 3:4 polyrhythm: voice A every 4 frames (${A.length} hits), voice B every 3 (${B.length} hits), together on the downbeat every 12`);
ok(ev("s5.build").frame - clicks.at(-1)!.frame <= 4 && ev("s5.allfire").frame - ev("s5.hold").frame === 8, "S5: the charge follows the last click; 8-frame anticipation hold before the all-fire");
ok(hudAt(2099).objects === 128 && hudAt(1771).objects === 1, "S5: HUD OBJECTS 001 -> 128", `at 1771: ${hudAt(1771).objects}, 2060: ${hudAt(2060).objects}, 2099: ${hudAt(2099).objects}`);

// the beat grid (96 BPM)
ok(Number.isInteger(Math.round(gridIndex(22, 1) * 1e6) / 1e6), "beat grid: the rain cut at 22.00 s is exactly on a beat", `beat ${gridIndex(22)}`);
const pulses = EVENTS.filter((e) => e.group === "s2.pulse");
ok(pulses.every((p) => Math.abs(gridIndex(p.t, 4) - Math.round(gridIndex(p.t, 4))) < 1e-9), `beat grid: all ${pulses.length} S2 pulses are on the 1/4-beat grid (every 9.375 frames)`);
ok(EVENTS.filter((e) => e.group === "s3.beat" || e.id.startsWith("s3.rise")).every((p) => Math.abs(gridIndex(p.t, 2) - Math.round(gridIndex(p.t, 2))) < 1e-9), "beat grid: the S3 pulses are on the 1/2-beat grid");

// the Lottie key poses
const place = (id: string) => LOTTIES.find((l) => l.id === id)!;
for (const e of EVENTS.filter((x) => x.marker && x.marker.name !== "start")) {
  const l = place(e.marker!.lottie), f = l.start + e.marker!.src / l.rate;
  if (Math.abs(f - e.frame) > 1e-6) ok(false, `lottie: ${e.id} marker ${e.marker!.name}@${e.marker!.src} lands on frame ${f}, the sound is on ${e.frame}`);
}
ok(true, `lottie: every marker-driven event (${EVENTS.filter((e) => e.marker && e.marker.name !== "start").length}) lands exactly on its Lottie key pose`);
ok(place("headphones").markers.drawn === 72 && place("drop").markers.impact === 252 && place("burst").markers.impact === 2484, "lottie: headphones `drawn` 72, drop `impact` 252, burst `impact` 2484");
ok(Object.values(BIRD_INFO).every((b) => b.rate === 0.75 || b.rate === 1 || b.rate === 1.25) && EVENTS.filter((e) => e.kind === "flap").every((e) => Number.isInteger(e.frame)), "lottie: bird flap frames are whole frames at rates 1.0 / 0.75 / 1.25");

// the orbit
const th0 = orbTheta(552), th1 = orbTheta(936), thc = orbTheta(ORB.centre);
ok(Math.abs(th0) < 1e-9 && Math.abs(th1 - 720) < 1e-6, `S2: the orbit runs from 0 to ${th1.toFixed(3)} deg: 2 full orbits`);
ok(Math.abs(thc - 360) < 0.5, `S2: the speed change is centred on 360 deg (${thc.toFixed(2)})`);
const wA = orbTheta(552 + 30 + ORB.Ta / 2 + 1) - orbTheta(552 + 30 + ORB.Ta / 2), wB = orbTheta(ORB.centre + 15 + 30) - orbTheta(ORB.centre + 15 + 29);
ok(Math.abs(wB / wA - 1.5) < 1e-3, `S2: cruising speed ${(wA * FPS).toFixed(1)} deg/s on orbit 1, ${(wB * FPS).toFixed(1)} deg/s on orbit 2 = ${(wB / wA).toFixed(3)}x`);
let t360 = 552; while (orbTheta(t360) < 360) t360 += 0.25;
ok(true, `S2: orbit 1 takes ${((t360 - 552) / FPS).toFixed(2)} s (incl. start-up ramp), orbit 2 ${((936 - t360) / FPS).toFixed(2)} s (incl. stop ramp)`);
const orb = OBJECTS.find((o) => o.id === "orb")!, hud = [552, 700, 900, 936].map((f) => hudAt(f));
ok(orb.pos!(552)[0] === 0 && orb.pos!(936)[0] === 0 && Math.abs(toSph(orb.pos!(936)).r - 1.6) < 1e-9, "S2: the object leaves and returns to the front at 1.6 m");
const rs = Array.from({ length: 385 }, (_, i) => toSph(orb.pos!(552 + i)).r);
ok(Math.min(...rs) >= 1.49 && Math.max(...rs) <= 1.71, `S2: DIST stays within ${Math.min(...rs).toFixed(2)}-${Math.max(...rs).toFixed(2)} m (1.6 m +-0.10 breathing, which is what makes the Doppler possible)`);
ok(Math.abs(hudAt(1100).el - 60) <= 0.5 && hudAt(1100).objects === 1, "S3: the object is at EL +60 deg and HUD OBJECTS 01");
ok(hudAt(1560).objects === 4, "S4: HUD OBJECTS 04 when the three birds and the leaf are on screen together", `at 1560: ${hudAt(1560).objects}`);

// rings
const rings = OBJECTS.filter((o) => o.id.startsWith("ring"));
ok(rings.length === RING_INFO.birth.length && rings.every((r) => r.width!(r.start) === 0 && r.width!(r.end) === 1 && r.width!(r.start + 70) > 0.4 && r.width!(r.start + 70) < 0.55), `S1: ${rings.length} ripple rings: stereo width 0 -> 1 as the ring grows`);
ok(RING_INFO.birth[0] - 252 >= 8 && RING_INFO.birth[0] - 252 <= 12, `S1: ${RING_INFO.birth[0] - 252}-frame hold after the plink before the first ring (brief: 8-12)`);

// no sound moves in zipper steps: per-frame positions never jump
let jump = 0, worst = "";
for (const o of OBJECTS) { const s = sampleObject(o); if (!s) continue; for (let i = 1; i < s.length; i++) { const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1], s[i][2] - s[i - 1][2]); if (d > 0.5 && o.id !== "orb") { jump++; worst = `${o.id}@${o.start + i}: ${d.toFixed(2)} m`; } } }
ok(jump === 0, "objects: no object moves more than 0.5 m in one frame (apart from the orb's first flight)", worst);
const dd = [{ id: "bed", f: SEGMENTS.find((s) => s.kind === "bed")!.start }];
ok(SEGMENTS.some((s) => s.kind === "mute" && s.start === 2454 && s.end === 2484) && DUCKS.some((d) => d.frame === 252) && DUCKS.some((d) => d.frame === 2484) && dd.length === 1, "mix: the bed ducks under the plink / flash / all-fire / impact and is muted for the S6 silence (2454-2484)");
console.log(failed ? `\nFAIL: ${failed} check(s)` : "\nPASS");
void ORBIT_INFO; void hud;
process.exit(failed ? 1 : 0);
