// World geometry shared by the cue modules and the art: where the stations and their beacons are.
import { STATION, StationNo } from "./theme";
/** the beacon sits at the top-left of its station's art */
export const BEACON_OFF = { x: -400, y: -420 };
export const beaconPoint = (n: StationNo): [number, number] => [STATION[n].x + BEACON_OFF.x, STATION[n].y + BEACON_OFF.y];
export const stationPoint = (n: StationNo): [number, number] => [STATION[n].x, STATION[n].y];
