// The map layer of the WORLD: the dotted grid, the route paths between the stations, the alarm beacons, and the stations' small map icons.
import React from "react";
import { C, FONT, STATION, StationNo, WORLD } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth } from "../motion";
import { glide, settle, springT } from "../easing";
import { Local, Stroke, circle, line, poly, rrect, useScale, arc } from "./draw";
import { Obj, useCam } from "../world";
import { BEACON, ROUTE, ART, PULSE, WAVE, S14_STACK, S11_TITLE } from "../timeline";
import { FPS } from "../theme";
import { beaconPoint, stationPoint } from "../geometry";

export const NOS: StationNo[] = [5, 4, 3, 2, 1];
export const stationAt = stationPoint;
export const beaconAt = beaconPoint;

const mixRGB = (a: string, b: string, k: number) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",")})`; };

/** the dotted background grid (#1C1C1E), a deep layer (depth 0.6) so zooms reveal parallax */
export const Grid: React.FC = () => (
  <Obj at={[0, 0]} depth={0.6} r={20000}>
    <div style={{ position: "absolute", left: 0, top: 0, width: WORLD.w, height: WORLD.h, backgroundImage: `radial-gradient(circle at 50% 50%, ${C.grid} 0, ${C.grid} 3px, rgba(0,0,0,0) 3.6px)`, backgroundSize: "120px 120px", backgroundPosition: "-60px -60px", boxShadow: `inset 0 0 0 3px ${C.grid}` }} />
  </Obj>
);

/** a route from the beacon of station a to the beacon of station b: a soft S-curve, dotted */
export const routeD = (a: StationNo, b: StationNo): string => {
  const [x1, y1] = beaconAt(a), [x2, y2] = beaconAt(b), dx = x2 - x1;
  return `M${x1} ${y1}C${x1 + dx * 0.55} ${y1},${x2 - dx * 0.55} ${y2},${x2} ${y2}`;
};
export const Routes: React.FC = () => {
  const f = useFrame();
  return (
    <Obj at={[0, 0]} depth={0.8} r={20000}>
      <Local>
        {ROUTE.map((rt, i) => {
          const a = NOS[i], b = NOS[i + 1];
          const g = clamp01((f - rt.green) / 30);
          return <Stroke key={i} d={routeD(b, a)} dotted={13} at={rt.draw} frames={rt.frames} color={g > 0 ? mixRGB(C.text, C.trust, glide(g)) : C.secondary} opacity={g > 0 ? 1 : 0.7} w={g > 0 ? 4 : 3} glow={g > 0 ? "rgba(52,199,89,0.6)" : undefined} />;
        })}
      </Local>
    </Obj>
  );
};

/** 1 normally, 0.4 while the station is dimmed (S13: the stories the AI is not part of) */
export const dimK = (n: StationNo, f: number) => { const b = BEACON[n]; if (b.dimFrom === undefined) return 1; return 1 - 0.6 * smooth(b.dimFrom, b.dimFrom + 16, f) * (1 - smooth(b.dimUntil ?? 0, (b.dimUntil ?? 0) + 16, f)); };
type BState = { color: string; alpha: number; pulse: number; k: number; on: boolean; green: number };
/** the beacon state machine: off -> blinks on red (a spring) -> dim idle -> bright and pulsing while its story is active -> flips to green on its action line */
export const beaconState = (n: StationNo, f: number): BState => {
  const b = BEACON[n];
  if (f < b.on) return { color: C.alarm, alpha: 0, pulse: 0, k: 0, on: false, green: 0 };
  const k = springT((f - b.on) / FPS, 150, 20, 1);
  const green = glide(clamp01((f - b.green) / 24));
  const act = Math.max(smooth(b.active - 20, b.active, f) * (1 - smooth(b.green - 10, b.green, f)), PULSE.some(([a, z]) => f >= a && f <= z) ? 1 : 0);
  const idle = 0.55 + 0.45 * act, flash = f - b.on < 36 ? 1 - (f - b.on) / 36 : 0;
  const pulse = ((f - b.on) / (FPS * 1.2)) % 1;
  return { color: mixRGB(C.alarm, C.trust, green), alpha: Math.min(1, idle + flash) * dimK(n, f), pulse: act > 0.05 || flash > 0 || green > 0.05 && green < 1 ? pulse : -1, k, on: true, green };
};

export const Beacon: React.FC<{ n: StationNo }> = ({ n }) => {
  const f = useFrame(), cam = useCam(), sc = useScale();
  const st = beaconState(n, f);
  if (!st.on) return null;
  const R = Math.max(20, 7 / cam.s);                   // 40 px at station zoom; never smaller than ~14 px on screen at map zoom
  const housing = 1 - smooth(ART.housingFade, ART.housingFade + 40, f);
  const wvT = f - WAVE[n], wv = wvT >= 0 && wvT < 48 ? Math.sin((Math.PI * wvT) / 48) : 0;
  const halo = R * (4 + 3 * (1 - smooth(0.3, 0.9, cam.s))) * (1 + 1.4 * wv), g = st.green;   // the glow is a third smaller in a close-up: it must not bleed into the margins
  const layers: { color: string; a: number }[] = [{ color: C.alarm, a: 1 - g }, { color: C.trust, a: g }].filter((l) => l.a > 0.003);
  return (
    <>
      {housing > 0.01 && (
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: housing * st.k }}>
          <circle r={520} fill="#030304" stroke={C.hair} strokeWidth={3 / sc} />
          {[430, 340, 250].map((r) => <circle key={r} r={r} fill="none" stroke={C.hair} strokeWidth={1.5 / sc} strokeOpacity={0.5} />)}
        </svg>
      )}
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: st.alpha }}>
        <defs>{layers.map((l) => <radialGradient key={l.color} id={`bg${n}${l.color.slice(1)}`}><stop offset="0" stopColor={l.color} stopOpacity={0.62} /><stop offset="1" stopColor={l.color} stopOpacity={0} /></radialGradient>)}</defs>
        {layers.map((l) => (
          <g key={l.color} opacity={l.a}>
            <circle r={halo * (0.8 + 0.2 * st.k)} fill={`url(#bg${n}${l.color.slice(1)})`} />
            {(st.pulse >= 0 || wv > 0) && <circle r={R * (1 + (wv > 0 ? wvT / 48 : st.pulse) * (wv > 0 ? 7 : 4.5))} fill="none" stroke={l.color} strokeWidth={2 / sc} strokeOpacity={wv > 0 ? 0.8 * (1 - wvT / 48) : 0.7 * (1 - st.pulse)} />}
            <circle r={R * st.k} fill={l.color} />
            <circle r={R * st.k * 1.9} fill="none" stroke={l.color} strokeWidth={2 / sc} strokeOpacity={0.55} />
          </g>
        ))}
      </svg>
    </>
  );
};
export const Beacons: React.FC = () => (
  <>{NOS.map((n) => <Obj key={n} at={beaconAt(n)} r={900}><Beacon n={n} /></Obj>)}</>
);

// ---- the stations' small map icons (line art, ~440 px wide) ----
const ICON: Record<StationNo, string[]> = {
  5: [poly([[-220, -60], [0, -190], [220, -60]], true), line(-190, -60, 190, -60), ...[-140, -50, 50, 140].map((x) => line(x, -40, x, 130)), rrect(-230, 130, 460, 26, 6), rrect(-260, 156, 520, 26, 6)],
  4: [poly([[-200, -80], [0, -170], [200, -80], [200, 90], [0, 180], [-200, 90]], true), line(-200, -80, 0, 10), line(200, -80, 0, 10), line(0, 10, 0, 180), line(-90, -125, 110, -35)],
  3: [rrect(-250, -40, 130, 210, 8), rrect(-95, -150, 150, 320, 8), rrect(80, -70, 130, 240, 8), ...[0, 60, 120].flatMap((y) => [line(-225, y, -145, y), line(-70, y - 70, 30, y - 70), line(105, y - 10, 185, y - 10)]), line(-280, 170, 240, 170)],
  2: [rrect(-120, -200, 240, 400, 38), line(-30, -168, 30, -168), circle(0, 160, 16), rrect(-96, -130, 192, 250, 10)],
  1: [rrect(-210, -110, 420, 220, 26), poly([[-210, 60], [210, 60]]), line(-140, 150, -140, 200), line(0, 150, 0, 200), line(140, 150, 140, 200)],
};
export const StationIcon: React.FC<{ n: StationNo }> = ({ n }) => {
  const f = useFrame(), cam = useCam();
  const w = ART.window[n];
  const vis = smooth(ART.iconIn, ART.iconIn + 40, f) * (1 - smooth(w[0] - 20, w[0], f) * (1 - smooth(w[1], w[1] + 30, f)));
  if (vis <= 0.01 || cam.s > 0.9) return null;
  const lod = 1 - smooth(0.55, 0.9, cam.s);
  return (
    <Local style={{ opacity: vis * lod * dimK(n, f) * (1 - 0.65 * smooth(S14_STACK[0] - 8, S14_STACK[0] + 16, f) * (1 - smooth(S14_STACK[1], S14_STACK[1] + 22, f))) * (n >= 4 ? 1 - 0.8 * smooth(S11_TITLE[0], S11_TITLE[0] + 14, f) * (1 - smooth(S11_TITLE[1], S11_TITLE[1] + 22, f)) : 1), transform: `scale(${Math.max(1, 0.27 / cam.s)})` }}>
      {ICON[n].map((d, i) => <Stroke key={i} d={d} p={1} color={C.text} w={3} opacity={0.55} />)}
      {n === 1 && <text x={0} y={-4} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={104} fill={C.secondary}>PHP</text>}
    </Local>
  );
};
export const StationLabel: React.FC<{ n: StationNo }> = ({ n }) => {
  const f = useFrame(), cam = useCam();
  const w = ART.window[n];
  const vis = smooth(ART.iconIn + 20, ART.iconIn + 60, f) * (1 - smooth(w[0] - 20, w[0], f) * (1 - smooth(w[1], w[1] + 30, f)));
  if (vis <= 0.01 || cam.s > 0.9) return null;
  const k = Math.max(1, 0.42 / cam.s);       // a readable label at map zoom
  return <div style={{ position: "absolute", left: 0, top: 270, transform: `translate(-50%, 0) scale(${k})`, transformOrigin: "50% 0", opacity: vis * (1 - smooth(0.55, 0.9, cam.s)), fontFamily: FONT.mono, fontWeight: 500, fontSize: 30, letterSpacing: "0.1em", color: C.secondary, whiteSpace: "nowrap" }}>{`#${n} ${STATION[n].name}`}</div>;
};
export const StationIcons: React.FC = () => (
  <>{NOS.map((n) => <Obj key={n} at={stationAt(n)} r={500}><StationIcon n={n} /><StationLabel n={n} /></Obj>)}</>
);
