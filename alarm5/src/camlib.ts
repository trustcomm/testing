// Small helpers for the camera keys in the cue modules.
import { STATION, StationNo } from "./theme";
import type { CamKey, Move } from "./camera";
import type { EaseName } from "./easing";

/** the station's centre sits at screen y 800 (the hero stage), so the camera centre is 160 / s below it in world px */
export const onStation = (n: StationNo, s: number, dx = 0, dy = 0) => ({ x: STATION[n].x + dx, y: STATION[n].y + dy + 160 / s, s });
/** the whole map: the top beacon sits at screen y 300 (its ring stays under the 240 px top margin), the last station's label (world y 8500) ends at 300 + 7320 s = 1325 at s = 0.14: all of it above the caption lane (y 1392) */
export const mapView = (s = 0.14) => ({ x: 2250, y: 1180 + 660 / s, s });
export const key = (f: number, st: { x: number; y: number; s: number }, move: Move, o: { ease?: EaseName; dip?: number; r?: number; settle?: boolean } = {}): CamKey => ({ f, x: st.x, y: st.y, s: st.s, move, ...o });
