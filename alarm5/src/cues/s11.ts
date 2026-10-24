// S11 "Aur number ek ... PHP2Shell": the biggest move: a PULL to the full map, the 1 assembles larger (the heaviest sub hit of the reel, a red ring pulse), then a slow dramatic FLY-TO down to
// station #1, websites standing on a ground line, a DOLLY-THROUGH the ground into the foundation layer: the PHP block, two red bugs with their CVEs, a 2016 -> 2026 counter with dust.
import { fw, w } from "../anchors";
import { key, mapView, onStation } from "../camlib";
import { stationPoint } from "../geometry";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S11", b, n));
const st1 = stationPoint(1);
export const GROUND = { x: 0, y: 150 };                              // the ground line, local to station #1
export const groundWorld = { x: st1[0] + GROUND.x, y: st1[1] + GROUND.y };
export const cue = {
  pullStart: 3524, pullEnd: 3600,
  numeral: S("ek"), ring: S("ek"),
  title: S("php2shell"), titleOut: S("woh") + 36,
  flyStart: 3612, flyEnd: 3708, flyMid: 3660,
  websites: S("websites") - 20, wordpress: S("wordpress"), websitesLabel: S("websites"),
  dollyStart: S("ki") - 4, dollyEnd: S("ki") + 10,
  neev: S("neev"), php: S("php"), bugs: S("mein"), das: S("das"), saal: S("saal"), se: S("se"),
};
export const sfx: SfxEvent[] = [
  { id: "s11.pull", frame: leadFrame("pullback_whoosh", cue.pullStart), sfx: "pullback_whoosh", gainDb: -9, pan: 0, note: "the PULL to the full map" },
  { id: "s11.number", frame: cue.numeral, sfx: "number_reveal_big", gainDb: -3, note: "number ek: the heaviest sub hit of the reel, with its 1 s pre-roll riser" },
  { id: "s11.ring", frame: cue.ring + 2, sfx: "heartbeat", gainDb: -9, note: "the red ring pulses once" },
  { id: "s11.title", frame: cue.title, sfx: "punch_hit", gainDb: -5, note: "PHP2Shell: the title lands" },
  { id: "s11.fly", frame: leadFrame("flyto_whoosh", cue.flyStart), sfx: "flyto_whoosh", gainDb: -9, pan: -0.2, panTo: 0.3, note: "the slow dramatic FLY-TO down to station #1 (1.6 s)" },
  { id: "s11.web", frame: cue.websites + 10, sfx: "card_slide", gainDb: -11, pan: 0, note: "the websites stand up on the ground line" },
  { id: "s11.wp", frame: cue.wordpress + 6, sfx: "tink", gainDb: -7, pitch: 0, pan: -0.2, note: "WordPress label" },
  { id: "s11.dig", frame: leadFrame("dig_drop", cue.dollyStart, 7), sfx: "dig_drop", gainDb: -2, pan: 0, note: "DOLLY-THROUGH the ground: the earthy dig-and-drop whoosh" },
  { id: "s11.php", frame: cue.php, sfx: "punch_hit", gainDb: -4, pan: 0, note: "the PHP foundation block lands" },
  { id: "s11.bug1", frame: cue.bugs, sfx: "scuttle_s", gainDb: -8, pan: -0.3, note: "the first red bug scuttles in" },
  { id: "s11.bug2", frame: cue.bugs + 10, sfx: "scuttle_s", gainDb: -8, pan: 0.3, seed: 3, note: "the second red bug scuttles in" },
  { id: "s11.dust", frame: cue.saal, sfx: "dust_swell", gainDb: -6, pan: 0, note: "das saal: the 2016 -> 2026 counter rolls, dust swells" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.saal + 20,
  anchors: [
    { label: "aur number", frame: 3556, note: "pulled out to the full map, five beacons" },
    { label: "ek", frame: cue.numeral + 6, note: "the huge amber-glow 1 whole at screen centre with a red ring pulse" },
    { label: "php2shell", frame: cue.title + 14, note: "the title PHP2Shell over the descending map" },
    { label: "wordpress", frame: cue.wordpress + 12, note: "station #1: a row of websites (WordPress, Websites) on a ground line" },
    { label: "neev", frame: cue.neev + 12, note: "DOLLY-THROUGH the ground: motion blur, the ground fading" },
    { label: "php", frame: cue.php + 14, note: "the X-ray foundation block labelled PHP" },
    { label: "mein", frame: cue.bugs + 20, note: "two red bug glyphs inside with CVE-2026-109618 / 109619" },
    { label: "das saal", frame: cue.saal + 10, note: "2016 -> 2026 counter rolling with dust" },
  ],
  cam: [
    key(cue.pullStart, onStation(2, 1.0), "HOLD"),
    key(cue.pullEnd, mapView(0.14), "PULL", { ease: "swing" }),
    key(cue.flyStart, mapView(0.14), "HOLD"),
    key(cue.flyEnd, onStation(1, 1.0), "FLY-TO"),
    key(cue.dollyStart, onStation(1, 1.0), "HOLD"),
    key(cue.dollyEnd, { x: groundWorld.x, y: groundWorld.y, s: 8.0 }, "DOLLY-THROUGH", { ease: "swing", settle: false }),
  ],
  blur: [],
  captionLift: [],
};
