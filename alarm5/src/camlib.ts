// Small helpers for the camera keys in the cue modules.
import { STATION, StationNo } from "./theme";
import type { CamKey, Move } from "./camera";
import type { EaseName } from "./easing";

/** the station's centre sits at screen y 800 (the hero stage), so the camera centre is 160 / s below it in world px */
export const onStation = (n: StationNo, s: number, dx = 0, dy = 0) => ({ x: STATION[n].x + dx, y: STATION[n].y + dy + 160 / s, s });
/** the whole map: beacons start at world y 1180, the last station's label ends near 8500: at s = 0.165 all of it fits inside the safe zones (screen y 240..1480) */
export const mapView = (s = 0.165) => ({ x: 2250, y: 1130 + 710 / s, s });
export const key = (f: number, st: { x: number; y: number; s: number }, move: Move, o: { ease?: EaseName; dip?: number; r?: number; settle?: boolean } = {}): CamKey => ({ f, x: st.x, y: st.y, s: st.s, move, ...o });
